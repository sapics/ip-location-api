import type { ICountry } from 'countries-list'
import { Buffer } from 'node:buffer'
import { open } from 'node:fs/promises'
import { join } from 'node:path'
import { binarySearch, getSmallMemoryFile, type IpLocationApiSettings, type LocalDatabase, number37ToString, parseIp, SAVED_SETTINGS } from '@iplookup/util'
import { LOADED_DATA } from './reload.js'

interface GeoData {
  latitude?: number
  longitude?: number
  postcode?: string
  area?: number
  country?: string
  eu?: boolean
  region1?: string
  region1_name?: string
  region2?: string
  region2_name?: string
  metro?: number
  timezone?: string
  city?: string
  country_name?: string
  country_native?: string
  continent?: string
  continent_name?: string
  capital?: string
  phone?: number[]
  currency?: string[]
  languages?: string[]
}

export async function lookup(ip: string): Promise<GeoData | null> {
  //* We don't use net.isIP(ip) as it is slow for ipv6
  const { version, ip: ipNumber } = parseIp(ip)

  const settings = SAVED_SETTINGS
  const db = version === 4 ? settings.v4 : settings.v6

  if (!db.loadedData)
    return null
  if (!(ipNumber >= db.loadedData.firstIp))
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

function setCityInfo(buffer: Buffer, offset: number, settings: IpLocationApiSettings): Promise<GeoData> {
  let locationId: number | undefined
  const geodata: GeoData = {}
  if (settings.locationFile) {
    locationId = buffer.readUInt32LE(offset)
    offset += 4
  }
  if (settings.fields.includes('latitude')) {
    geodata.latitude = buffer.readInt32LE(offset) / 10000
    offset += 4
  }
  if (settings.fields.includes('longitude')) {
    geodata.longitude = buffer.readInt32LE(offset) / 10000
    offset += 4
  }
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
  if (settings.fields.includes('area')) {
    const areaMap = LOADED_DATA.sub?.area
    if (areaMap) {
      geodata.area = areaMap[buffer.readUInt8(offset)]
    }
    // offset += 1
  }

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

function getZeroFill(text: string, length: number) {
  return '0'.repeat(length - text.length) + text
}

async function setCountryInfo(geodata: GeoData, settings: IpLocationApiSettings): Promise<GeoData> {
  if (settings.addCountryInfo && geodata.country) {
    //* Import the countries-list package (optional peer dependency)
    try {
      const { countries, continents } = await import('countries-list')
      const country = countries[geodata.country as keyof typeof countries] as ICountry | undefined
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
