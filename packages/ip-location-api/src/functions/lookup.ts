import type { ICountry } from 'countries-list'
import { Buffer } from 'node:buffer'
import { open } from 'node:fs/promises'
import { join } from 'node:path'
import { binarySearch, getSmallMemoryFile, type IpLocationApiSettings, type LocalDatabase, number37ToString, parseIp, SAVED_SETTINGS } from '@iplookup/util'
import { LOADED_DATA } from './reload.js'

/**
 * Represents geographical data for an IP address
 */
interface GeoData {
  /**
   * The approximate WGS84 latitude of the IP address
   *
   * @see https://en.wikipedia.org/wiki/World_Geodetic_System
   */
  latitude?: number
  /**
   * The approximate WGS84 longitude of the IP address
   *
   * @see https://en.wikipedia.org/wiki/World_Geodetic_System
   */
  longitude?: number
  /**
   * The region-specific postcode nearest to the IP address
   */
  postcode?: string
  /**
   * The radius in kilometers of the specified location where the IP address is likely to be
   */
  area?: number
  /**
   * The country of the IP address
   * @example 'US'
   * @see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
   */
  country?: string
  /**
   * Whether the country is a member of the European Union
   *
   * @requires country
   */
  eu?: boolean
  /**
   * The first region of the IP address
   * @example 'NL-ZH' // (Netherlands, South Holland)
   * @see https://en.wikipedia.org/wiki/ISO_3166-2
   */
  region1?: string
  /**
   * The name of the first region of the IP address (Can be aquired in multiple languages using the `language` setting)
   * @example 'South Holland'
   */
  region1_name?: string
  /**
   * The second region of the IP address
   * @example 'NL-ZH' // (Netherlands, South Holland)
   * @see https://en.wikipedia.org/wiki/ISO_3166-2
   */
  region2?: string
  /**
   * The name of the second region of the IP address (Can be aquired in multiple languages using the `language` setting)
   * @example 'South Holland'
   */
  region2_name?: string
  /**
   * The metropolitan area of the IP address (Google AdWords API)
   * @example 1000
   * @see https://developers.google.com/adwords/api/docs/appendix/cities-DMAregions
   */
  metro?: number
  /**
   * The timezone of the IP address
   * @example 'Europe/Amsterdam'
   */
  timezone?: string
  /**
   * The city of the IP address
   * @example 'Amsterdam'
   */
  city?: string
  /**
   * The name of the country of the IP address (In English)
   * @example 'Netherlands'
   * @requires country
   * @requires country-list (optional peer dependency)
   */
  country_name?: string
  /**
   * The name of the country of the IP address (In the native language of the country)
   * @example 'Nederland'
   * @requires country
   * @requires country-list (optional peer dependency)
   */
  country_native?: string
  /**
   * The continent of the IP address (alpha-2 code)
   * @example 'EU'
   * @requires country
   * @requires country-list (optional peer dependency)
   */
  continent?: string
  /**
   * The name of the continent of the IP address (In English)
   * @example 'Europe'
   * @requires country
   * @requires country-list (optional peer dependency)
   */
  continent_name?: string
  /**
   * The capital of the country of the IP address (In English)
   * @example 'Amsterdam'
   * @requires country
   * @requires country-list (optional peer dependency)
   */
  capital?: string
  /**
   * The phone codes of the country of the IP address
   * @example ['31']
   * @requires country
   * @requires country-list (optional peer dependency)
   */
  phone?: number[]
  /**
   * The currency of the country of the IP address
   * @example ['EUR']
   * @requires country
   * @requires country-list (optional peer dependency)
   */
  currency?: string[]
  /**
   * The languages of the country of the IP address
   * @example ['nl']
   */
  languages?: string[]
}

/**
 * Looks up geographical data for a given IP address
 * @param ip - The IP address to look up
 * @returns A Promise that resolves to GeoData or null if not found
 */
export async function lookup(ip: string): Promise<GeoData | null> {
  //* We don't use net.isIP(ip) as it is slow for ipv6
  const { version, ip: ipNumber } = parseIp(ip)

  const settings = SAVED_SETTINGS
  const db = version === 4 ? settings.v4 : settings.v6

  if (!db.loadedData || !(ipNumber >= db.loadedData.firstIp))
    return null
  const list = db.loadedData.startIps
  const line = binarySearch(list, ipNumber)
  if (line === null)
    return null

  if (settings.smallMemory) {
    const buffer = await lineToFile(line, db, settings)
    const endIp = version === 4 ? buffer.readUInt32LE(0) : buffer.readBigUInt64LE(0)
    if (ipNumber > endIp)
      return null

    if (settings.dataType === 'Country') {
      return setCountryInfo({
        country: buffer.toString('latin1', version === 4 ? 4 : 8, version === 4 ? 6 : 10),
      }, settings)
    }
    return setCityInfo(buffer, version === 4 ? 4 : 8, settings)
  }

  const endIps = db.loadedData.endIps
  if (!endIps || ipNumber > endIps[line]!)
    return null

  if (settings.dataType === 'Country') {
    return setCountryInfo({
      country: db.loadedData.mainBuffer!.toString('latin1', line * db.recordSize, line * db.recordSize + 2),
    }, settings)
  }
  return setCityInfo(db.loadedData.mainBuffer!, line * db.recordSize, settings)
}

/**
 * Reads a specific line from a file in the database
 * @param line - The line number to read
 * @param db - The database object
 * @param settings - The API settings
 * @returns A Promise that resolves to a Buffer containing the line data
 */
async function lineToFile(line: number, db: LocalDatabase, settings: IpLocationApiSettings): Promise<Buffer> {
  const [dir, file, offset] = getSmallMemoryFile(line, db)
  const fd = await open(join(settings.fieldDir, dir, file), 'r')
  const buffer = Buffer.alloc(db.recordSize)
  await fd.read(buffer, 0, db.recordSize, offset)
  fd.close().catch(() => {
    // TODO console.warn
  })
  return buffer
}

/**
 * Extracts city information from a buffer
 * @param buffer - The buffer containing city data
 * @param offset - The starting offset in the buffer
 * @param settings - The API settings
 * @returns A Promise that resolves to GeoData
 */
function setCityInfo(buffer: Buffer, offset: number, settings: IpLocationApiSettings): Promise<GeoData> {
  let locationId: number | undefined
  const geodata: GeoData = {}

  //* Read location ID if location file is available
  if (settings.locationFile) {
    locationId = buffer.readUInt32LE(offset)
    offset += 4
  }

  //* Read latitude and longitude if included in fields
  if (settings.fields.includes('latitude')) {
    geodata.latitude = buffer.readInt32LE(offset) / 10000
    offset += 4
  }
  if (settings.fields.includes('longitude')) {
    geodata.longitude = buffer.readInt32LE(offset) / 10000
    offset += 4
  }

  //* Read and decode postcode if included in fields
  if (settings.fields.includes('postcode')) {
    const postcodeLength = buffer.readUInt32LE(offset)
    const postcodeValue = buffer.readInt8(offset + 4)
    if (postcodeLength) {
      let postcode: string
      if (postcodeValue < -9) {
        const code = (-postcodeValue).toString()
        postcode = postcodeLength.toString(36)
        postcode = `${getZeroFill(
          postcode.slice(0, -Number.parseInt(code[1]!)),
          Number.parseInt(code[0]!) - 0,
        )}-${getZeroFill(postcode.slice(-Number.parseInt(code[1]!)), Number.parseInt(code[1]!) - 0)}`
      }
      else if (postcodeValue < 0) {
        postcode = getZeroFill(postcodeLength.toString(36), -postcodeValue)
      }
      else if (postcodeValue < 10) {
        postcode = getZeroFill(postcodeLength.toString(10), postcodeValue)
      }
      else if (postcodeValue < 72) {
        const code = String(postcodeValue)
        postcode = getZeroFill(postcodeLength.toString(10), (Number.parseInt(code[0]!) - 0) + (Number.parseInt(code[1]!) - 0))
        postcode = `${postcode.slice(0, Number.parseInt(code[0]!) - 0)}-${postcode.slice(Number.parseInt(code[0]!) - 0)}`
      }
      else {
        postcode = postcodeValue.toString(36).slice(1) + postcodeLength.toString(36)
      }
      geodata.postcode = postcode.toUpperCase()
    }
    offset += 5
  }

  //* Read area if included in fields
  if (settings.fields.includes('area')) {
    const areaMap = LOADED_DATA.sub?.area
    if (areaMap) {
      geodata.area = areaMap[buffer.readUInt8(offset)]
    }
    // offset += 1
  }

  //* Process location data if locationId is available
  if (locationId) {
    let locationOffset = (locationId - 1) * settings.locationRecordSize
    const locationBuffer = LOADED_DATA.location
    if (locationBuffer) {
      if (settings.fields.includes('country')) {
        geodata.country = locationBuffer.toString('utf8', locationOffset, locationOffset += 2)
        const euMap = LOADED_DATA.sub?.eu
        if (settings.fields.includes('eu') && euMap) {
          geodata.eu = euMap[geodata.country]
        }
      }
      if (settings.fields.includes('region1')) {
        const region1 = locationBuffer.readUInt16LE(locationOffset)
        locationOffset += 2
        if (region1 > 0) {
          geodata.region1 = number37ToString(region1)
        }
      }
      if (settings.fields.includes('region1_name')) {
        const region1Name = locationBuffer.readUInt16LE(locationOffset)
        locationOffset += 2
        const region1Map = LOADED_DATA.sub?.region1
        if (region1Name > 0 && region1Map) {
          geodata.region1_name = region1Map[region1Name]
        }
      }
      if (settings.fields.includes('region2')) {
        const region2 = locationBuffer.readUInt16LE(locationOffset)
        locationOffset += 2
        if (region2 > 0) {
          geodata.region2 = number37ToString(region2)
        }
      }
      if (settings.fields.includes('region2_name')) {
        const region2Name = locationBuffer.readUInt16LE(locationOffset)
        locationOffset += 2
        const region2Map = LOADED_DATA.sub?.region2
        if (region2Name > 0 && region2Map) {
          geodata.region2_name = region2Map[region2Name]
        }
      }
      if (settings.fields.includes('metro')) {
        const metro = locationBuffer.readUInt16LE(locationOffset)
        locationOffset += 2
        if (metro > 0) {
          geodata.metro = metro
        }
      }
      if (settings.fields.includes('timezone')) {
        const timezone = locationBuffer.readUInt16LE(locationOffset)
        locationOffset += 2
        const timezoneMap = LOADED_DATA.sub?.timezone
        if (timezone > 0 && timezoneMap) {
          geodata.timezone = timezoneMap[timezone]
        }
      }
      if (settings.fields.includes('city')) {
        const city = locationBuffer.readUInt32LE(locationOffset)
        // locationOffset += 4
        const cityMap = LOADED_DATA.city
        if (city > 0 && cityMap) {
          const start = city >>> 8
          geodata.city = cityMap.toString('utf8', start, start + (city & 255))
        }
      }
    }
  }

  return setCountryInfo(geodata, settings)
}

/**
 * Pads a string with leading zeros
 * @param text - The text to pad
 * @param length - The desired length of the padded string
 * @returns The zero-padded string
 */
function getZeroFill(text: string, length: number) {
  return '0'.repeat(length - text.length) + text
}

/**
 * Adds additional country information to the GeoData object
 * @param geodata - The GeoData object to enhance
 * @param settings - The API settings
 * @returns A Promise that resolves to the enhanced GeoData
 */
async function setCountryInfo(geodata: GeoData, settings: IpLocationApiSettings): Promise<GeoData> {
  if (settings.addCountryInfo && geodata.country) {
    //* Import the countries-list package (optional peer dependency)
    try {
      const { countries, continents } = await import('countries-list')
      const country = countries[geodata.country as keyof typeof countries] as ICountry | undefined

      //* Enhance geodata with additional country information
      geodata.country_name = country?.name
      geodata.country_native = country?.native
      geodata.continent = country?.continent ? continents[country.continent] : undefined
      geodata.capital = country?.capital
      geodata.phone = country?.phone
      geodata.currency = country?.currency
      geodata.languages = country?.languages
    }
    catch (error) {
      // TODO add correct debug message
      console.error('Error importing countries-list', error)
    }
  }
  return geodata
}
