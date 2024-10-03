import type { WriteStream } from 'node:fs'
import type { IpLocationApiSettings } from '../getSettings.js'
import type { LocationData } from './createDatabase.js'
import { Buffer } from 'node:buffer'
import { createWriteStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { makeDatabase } from '../makeDatabase.js'
import { stringToNumber37 } from '../stringToNumber37.js'

/**
 * Interface representing various location-related databases
 */
interface LocationDatabases {
  sub1Database: Record<string, number>
  sub2Database: Record<string, number>
  timezoneDatabase: Record<string, number>
}

/**
 * Creates a location database from the provided location data.
 * @param locationData - Array of location data records
 * @param locationIdList - List of location IDs to process
 * @param areaDatabase - A database of area data.
 * @param settings - IP location API settings
 */
export async function createLocationDatabase(
  locationData: Record<number, LocationData | string>[],
  locationIdList: number[],
  areaDatabase: Record<string, number>,
  settings: IpLocationApiSettings,
): Promise<void> {
  const locationDataMap = locationData[0] as Record<number, LocationData>
  const locationDataStream = createWriteStream(path.join(settings.fieldDir, 'location.dat.tmp'))
  const nameDataStream = createWriteStream(path.join(settings.fieldDir, 'name.dat.tmp'))

  const cityNameToIndex: Record<string, number> = {}
  const euCountryCodes: Record<string, boolean> = {}
  const regionDatabases: LocationDatabases = {
    sub1Database: {},
    sub2Database: {},
    timezoneDatabase: {},
  }

  //* Process each location ID
  for (const locationId of locationIdList) {
    const locationInfo = locationDataMap[locationId]
    if (!locationInfo)
      continue

    const locationBuffer = createLocationBuffer(locationInfo, settings, cityNameToIndex, euCountryCodes, regionDatabases, nameDataStream)
    locationDataStream.write(locationBuffer)
  }

  locationDataStream.end()
  nameDataStream.end()

  await createSubJsonFile(settings, regionDatabases, euCountryCodes, areaDatabase)
}

/**
 * Creates a buffer for a single location record.
 * @param locationInfo - The location data
 * @param settings - IP location API settings
 * @param cityNameToIndex - Hash table for city names
 * @param euCountryCodes - Hash table for EU status
 * @param regionDatabases - Object containing various location databases
 * @param nameDataStream - WriteStream for the name data file
 * @returns A buffer containing the encoded location data
 */
function createLocationBuffer(
  locationInfo: LocationData,
  settings: IpLocationApiSettings,
  cityNameToIndex: Record<string, number>,
  euCountryCodes: Record<string, boolean>,
  regionDatabases: LocationDatabases,
  nameDataStream: WriteStream,
): Buffer {
  const buffer = Buffer.alloc(settings.locationRecordSize)
  let offset = 0

  //* Write each field to the buffer if it's included in the settings
  const fieldWriters: Record<string, () => number> = {
    country: () => writeCountryCode(buffer, offset, locationInfo, settings, euCountryCodes),
    region1: () => writeRegion(buffer, offset, locationInfo.subdivision_1_iso_code),
    region1_name: () => writeRegionName(buffer, offset, locationInfo.subdivision_1_name, regionDatabases.sub1Database),
    region2: () => writeRegion(buffer, offset, locationInfo.subdivision_2_iso_code),
    region2_name: () => writeRegionName(buffer, offset, locationInfo.subdivision_2_name, regionDatabases.sub2Database),
    metro: () => writeMetroCode(buffer, offset, locationInfo),
    timezone: () => writeTimezone(buffer, offset, locationInfo, regionDatabases),
    city: () => writeCity(buffer, offset, locationInfo, cityNameToIndex, nameDataStream),
  }

  for (const [field, writer] of Object.entries(fieldWriters)) {
    if (settings.fields.includes(field as IpLocationApiSettings['fields'][number])) {
      offset = writer()
    }
  }

  return buffer
}

/**
 * Writes the country code to the buffer and updates the EU hash if necessary.
 * @param buffer - The buffer to write to
 * @param offset - The current offset in the buffer
 * @param locationInfo - The location data
 * @param settings - IP location API settings
 * @param euCountryCodes - Hash table for EU status
 * @returns The new offset after writing
 */
function writeCountryCode(buffer: Buffer, offset: number, locationInfo: LocationData, settings: IpLocationApiSettings, euCountryCodes: Record<string, boolean>): number {
  const { country_iso_code: countryCode, is_in_european_union: isEU } = locationInfo
  if (countryCode && countryCode.length === 2) {
    buffer.write(countryCode, offset)
    if (settings.fields.includes('eu') && Number.parseInt(isEU, 10) === 1) {
      euCountryCodes[countryCode] = true
    }
  }
  return offset + 2
}

/**
 * Writes a region code to the buffer.
 * @param buffer - The buffer to write to
 * @param offset - The current offset in the buffer
 * @param regionCode - The region code to write
 * @returns The new offset after writing
 */
function writeRegion(buffer: Buffer, offset: number, regionCode: string | undefined): number {
  if (regionCode)
    buffer.writeUInt16LE(stringToNumber37(regionCode), offset)
  return offset + 2
}

/**
 * Writes a region name to the buffer.
 * @param buffer - The buffer to write to
 * @param offset - The current offset in the buffer
 * @param regionName - The region name to write
 * @param database - The database to use for encoding the region name
 * @returns The new offset after writing
 */
function writeRegionName(buffer: Buffer, offset: number, regionName: string | undefined, database: Record<string, number>): number {
  if (regionName)
    buffer.writeUInt16LE(makeDatabase(regionName, database), offset)
  return offset + 2
}

/**
 * Writes a metro code to the buffer.
 * @param buffer - The buffer to write to
 * @param offset - The current offset in the buffer
 * @param locationInfo - The location data
 * @returns The new offset after writing
 */
function writeMetroCode(buffer: Buffer, offset: number, locationInfo: LocationData): number {
  const { metro_code: metro } = locationInfo
  if (metro)
    buffer.writeUInt16LE(Number.parseInt(metro, 10), offset)
  return offset + 2
}

/**
 * Writes a timezone to the buffer.
 * @param buffer - The buffer to write to
 * @param offset - The current offset in the buffer
 * @param locationInfo - The location data
 * @param regionDatabases - Object containing various location databases
 * @returns The new offset after writing
 */
function writeTimezone(buffer: Buffer, offset: number, locationInfo: LocationData, regionDatabases: LocationDatabases): number {
  const { time_zone: timezone } = locationInfo
  if (timezone)
    buffer.writeUInt16LE(makeDatabase(timezone, regionDatabases.timezoneDatabase), offset)
  return offset + 2
}

/**
 * Writes a city name to the buffer.
 * @param buffer - The buffer to write to
 * @param offset - The current offset in the buffer
 * @param locationInfo - The location data
 * @param cityNameToIndex - Hash table for city names
 * @param nameDataStream - WriteStream for the name data file
 * @returns The new offset after writing
 */
function writeCity(buffer: Buffer, offset: number, locationInfo: LocationData, cityNameToIndex: Record<string, number>, nameDataStream: WriteStream): number {
  const { city_name: cityName } = locationInfo
  if (cityName) {
    buffer.writeUInt32LE(inputBuffer(cityNameToIndex, nameDataStream, cityName), offset)
  }
  return offset + 4
}

/**
 * Creates a sub.json file with additional location data.
 * @param settings - IP location API settings
 * @param regionDatabases - Object containing various location databases
 * @param euCountryCodes - Hash table for EU status
 * @param areaDatabase - A database of area data.
 */
async function createSubJsonFile(
  settings: IpLocationApiSettings,
  regionDatabases: LocationDatabases,
  euCountryCodes: Record<string, boolean>,
  areaDatabase: Record<string, number>,
): Promise<void> {
  const subJsonData: Record<string, any> = {
    region1_name: databaseToArray(regionDatabases.sub1Database),
    region2_name: databaseToArray(regionDatabases.sub2Database),
    timezone: databaseToArray(regionDatabases.timezoneDatabase),
    area: databaseToArray(areaDatabase).map(area => Number.parseInt(area, 10) || 0),
    eu: euCountryCodes,
  }

  //* Remove unused fields based on settings
  if (!settings.fields.includes('region1_name'))
    delete subJsonData.region1_name
  if (!settings.fields.includes('region2_name'))
    delete subJsonData.region2_name
  if (!settings.fields.includes('timezone'))
    delete subJsonData.timezone
  if (!settings.fields.includes('area'))
    delete subJsonData.area
  if (!settings.fields.includes('eu'))
    delete subJsonData.eu

  if (Object.keys(subJsonData).length > 0) {
    await writeFile(path.join(settings.fieldDir, 'sub.json.tmp'), JSON.stringify(subJsonData))
  }
}

/**
 * Converts a database to an array.
 * @param database - The database to convert.
 * @returns The array.
 */
function databaseToArray(database: Record<string, number>): string[] {
  const array: string[] = ['']
  for (const [key, value] of Object.entries(database)) {
    array[value] = key
  }
  return array
}

/**
 * Processes and stores text data in a buffer, managing offsets and hash entries.
 * @param nameToIndex - Object to store text-to-number mappings and track buffer offset
 * @param dataStream - WriteStream to write buffer data
 * @param text - The text to process and store
 * @returns A number representing the stored text (either existing hash value or new encoded value)
 */
function inputBuffer(nameToIndex: Record<string, number>, dataStream: WriteStream, text: string): number {
  //* If text is already in nameToIndex, return its value
  if (nameToIndex[text])
    return nameToIndex[text]

  //* Initialize buffer offset if not yet set
  if (nameToIndex.__offsetBB === undefined) {
    const buffer = Buffer.alloc(1)
    dataStream.write(buffer)
    nameToIndex.__offsetBB = 1
  }

  const offset = nameToIndex.__offsetBB
  const buffer = Buffer.from(text)

  //* Encode text length and offset into a single number
  //* The first 8 bits represent the length, and the remaining bits represent the offset
  const encodedValue = buffer.length + (offset << 8)

  //* Write the text buffer to the data stream
  dataStream.write(buffer)

  //* Update the offset for the next write
  nameToIndex.__offsetBB = offset + buffer.length

  //* Store and return the encoded value
  return nameToIndex[text] = encodedValue
}
