import type { IpLocationApiSettings } from '../getSettings.js'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { parse } from '@fast-csv/parse'
import { LOCATION_FIELDS } from '../../constants.js'
import { createBlockDatabase } from './createBlockDatabase.js'
import { createLocationDatabase } from './createLocationDatabase.js'

/**
 * Creates a database for IP location data.
 * @param files - Array of file paths to process.
 * @param settings - IP location API settings.
 */
export async function createDatabase(files: string[], settings: IpLocationApiSettings): Promise<void> {
  const locationSources = files.filter(file => file.includes('Locations'))
  //* Ensure the English file is first (should only have max 2 location files)
  locationSources.sort((a, b) => {
    if (a.endsWith('-en.csv'))
      return -1
    if (b.endsWith('-en.csv'))
      return 1
    return a.localeCompare(b)
  })

  //* Extract location data from files
  const locationData: Record<number, LocationData | string>[] = []
  for (const locationSource of locationSources) {
    locationData.push(await getLocationData(locationSource, settings))
  }

  //* Optimize location file if necessary
  if (settings.locationFile) {
    minifyLocationData(locationData as Record<number, LocationData>[], settings)
  }

  //* Process block sources and create databases
  const blockSources = files.filter(file => file.includes('Blocks')).sort((a, b) => a.localeCompare(b))
  const locationIdList: number[] = []
  const areaDatabase: Record<string, number> = {}

  for (const blockSource of blockSources) {
    await createBlockDatabase(blockSource, locationData, locationIdList, areaDatabase, settings)
  }

  if (settings.locationFile) {
    await createLocationDatabase(locationData, locationIdList, areaDatabase, settings)
  }
}

/**
 * Represents the data for a location in the database.
 */
export interface LocationData {
  geoname_id: string
  locale_code: string
  continent_code: string
  continent_name: string
  country_iso_code: string
  country_name: string
  subdivision_1_iso_code: string
  subdivision_1_name: string
  subdivision_2_iso_code: string
  subdivision_2_name: string
  city_name: string
  metro_code: string
  time_zone: string
  is_in_european_union: string
  counter?: number
}

/**
 * Extracts location data from a CSV file.
 * @param file - Path to the CSV file.
 * @param settings - IP location API settings.
 * @returns A promise that resolves to a record of location data.
 */
async function getLocationData(file: string, settings: IpLocationApiSettings): Promise<Record<number, LocationData | string>> {
  const stream = createReadStream(path.join(settings.tmpDataDir, file))
  const result: Record<number, LocationData | string> = {}
  return new Promise((resolve, reject) => {
    stream
      .pipe(parse({ headers: true }))
      .on('error', reject)
      .on('data', (row: LocationData) => {
        if (settings.dataType === 'Country') {
          result[Number.parseInt(row.geoname_id)] = row.country_iso_code
        }
        else {
          result[Number.parseInt(row.geoname_id)] = row
        }
      })
      .on('end', () => resolve(result))
  })
}

/**
 * Optimizes location data by merging and deduplicating entries.
 * @param mapDatas - Array of location data records.
 * @param settings - IP location API settings.
 */
function minifyLocationData(mapDatas: Record<number, LocationData>[], settings: IpLocationApiSettings): void {
  const [primaryData, secondaryData] = mapDatas as [Record<number, LocationData>, Record<number, LocationData> | undefined]

  //* Handle non-English languages by merging location names
  if (settings.language !== 'en' && secondaryData) {
    mergeNonEnglishNames(primaryData, secondaryData)
  }

  const locIds = Object.keys(primaryData).map(key => Number.parseInt(key))
  locIds.sort((a, b) => a - b)

  const locFields = getLocationFields(settings)
  const checkFields = mapLocationFields(locFields)

  //* Group location IDs by their primary field (usually country)
  const groupedLocations = groupLocationsByPrimaryField(primaryData, locIds, checkFields[0]!)

  //* Deduplicate and merge similar locations within each group
  deduplicateLocations(primaryData, groupedLocations, checkFields.slice(1))
}

/**
 * Merges non-English names into the primary data.
 * @param primaryData - Primary location data record.
 * @param secondaryData - Secondary location data record with non-English names.
 */
function mergeNonEnglishNames(primaryData: Record<number, LocationData>, secondaryData: Record<number, LocationData>): void {
  for (const locId in primaryData) {
    if (secondaryData[locId]) {
      const fields = ['city_name', 'subdivision_1_name', 'subdivision_2_name'] as const
      for (const field of fields) {
        if (secondaryData[locId][field]) {
          primaryData[locId]![field] = secondaryData[locId][field]
        }
      }
    }
  }
}

/**
 * Retrieves and sorts location fields based on settings.
 * @param settings - IP location API settings.
 * @returns Sorted array of location fields.
 */
function getLocationFields(settings: IpLocationApiSettings): (typeof LOCATION_FIELDS[number])[] {
  const fieldRanking: Record<typeof LOCATION_FIELDS[number], number> = {
    metro: 1,
    region2_name: 2,
    region2: 3,
    timezone: 4,
    region1_name: 5,
    region1: 6,
    country: 7,
    city: 8,
    eu: 9,
  }
  return LOCATION_FIELDS
    .filter(field => settings.fields.includes(field))
    .sort((a, b) => fieldRanking[b] - fieldRanking[a])
}

/**
 * Maps location fields to their corresponding LocationData keys.
 * @param locFields - Array of location fields.
 * @returns Array of LocationData keys.
 */
function mapLocationFields(locFields: (typeof LOCATION_FIELDS[number])[]): (keyof LocationData)[] {
  const fieldMapping: Record<typeof LOCATION_FIELDS[number], keyof LocationData> = {
    country: 'country_iso_code',
    region1: 'subdivision_1_iso_code',
    region1_name: 'subdivision_1_name',
    region2: 'subdivision_2_iso_code',
    region2_name: 'subdivision_2_name',
    city: 'city_name',
    metro: 'metro_code',
    timezone: 'time_zone',
    eu: 'is_in_european_union',
  }
  return locFields.map(field => fieldMapping[field])
}

/**
 * Groups location IDs by their primary field value.
 * @param primaryData - Primary location data record.
 * @param locIds - Array of location IDs.
 * @param primaryField - The primary field to group by.
 * @returns Record of grouped location IDs.
 */
function groupLocationsByPrimaryField(
  primaryData: Record<number, LocationData>,
  locIds: number[],
  primaryField: keyof LocationData,
): Record<string, number[]> {
  const groupedLocations: Record<string, number[]> = {}
  for (const locId of locIds) {
    const key = primaryData[locId]![primaryField as keyof LocationData]!
    if (!groupedLocations[key]) {
      groupedLocations[key] = []
    }
    groupedLocations[key].push(locId)
  }
  return groupedLocations
}

/**
 * Deduplicates locations within grouped location IDs.
 * @param primaryData - Primary location data record.
 * @param groupedLocations - Record of grouped location IDs.
 * @param checkFields - Array of fields to check for equality.
 */
function deduplicateLocations(
  primaryData: Record<number, LocationData>,
  groupedLocations: Record<string, number[]>,
  checkFields: (keyof LocationData)[],
): void {
  for (const group of Object.values(groupedLocations)) {
    for (let i = 0; i < group.length; i++) {
      const baseLocation = primaryData[group[i]!]!
      for (let j = i + 1; j < group.length; j++) {
        const compareLocation = primaryData[group[j]!]!
        if (areLocationsEqual(baseLocation, compareLocation, checkFields)) {
          //* Merge duplicate locations by keeping the base location and removing the duplicate
          primaryData[group[j]!] = baseLocation
          group.splice(j, 1)
          j--
        }
      }
    }
  }
}

/**
 * Checks if two locations are equal based on specified fields.
 * @param loc1 - First location to compare.
 * @param loc2 - Second location to compare.
 * @param fields - Array of fields to check for equality.
 * @returns Boolean indicating if locations are equal.
 */
function areLocationsEqual(loc1: LocationData, loc2: LocationData, fields: (keyof LocationData)[]): boolean {
  return fields.every(field => loc1[field] === loc2[field])
}
