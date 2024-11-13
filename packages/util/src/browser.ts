import { binarySearch } from './functions/binarySearch.js'
import { fetchArrayBuffer } from './functions/fetchArrayBuffer.js'
import { log } from './functions/log.js'
import { numberToCountryCode } from './functions/numberToCountryCode.js'
import { numberToDir } from './functions/numberToDir.js'
import { parseIp } from './functions/parseIp.js'

/**
 * Sets up an IP lookup function based on the specified data type.
 * @template T - The type of data to return ('country' or 'geocode')
 * @returns A function that takes an IP address and returns location data
 */
export function setup<T extends 'country' | 'geocode'>(): (ipInput: string) => Promise<T extends 'country' ? { country: string } | null : { latitude: number, longitude: number, country: string } | null> {
  const CDN_URL = __CDN_URL__
  const MAIN_RECORD_SIZE = __DATA_TYPE__ === 'country' ? 2 : 8
  const INDEXES: {
    4?: Uint32Array
    6?: BigUint64Array
  } = {}
  const DATA_URL = {
    4: CDN_URL,
    6: CDN_URL,
  }

  /**
   * Performs an IP lookup and returns location data.
   * @param ipInput - The IP address to look up
   * @returns A promise that resolves to location data or null if not found
   */
  return async function IpLookup(ipInput: string) {
    const { version, ip } = parseIp(ipInput)

    //* Get the index for the IP version
    const index = INDEXES[version] ?? (await loadIndex(version))
    if (!index) {
      log('warn', 'No index found')
      return null
    }

    //* If the IP is less than the first index, return null
    if (!(ip >= index[0]!)) {
      log('warn', `IP ${ipInput} is out of range`)
      return null
    }

    //* Binary search to find the correct line in the index
    const lineIndex = binarySearch(index, ip)
    if (lineIndex === null) {
      return null
    }

    //* Get the data file for the line
    const dataResponse = await fetchArrayBuffer(
      new URL(`${DATA_URL[version]}/indexes/${version}/${numberToDir(lineIndex)}`),
    )
    if (!dataResponse) {
      log('warn', 'Index file not found, is it corrupted?')
      return null
    }

    const { buffer: dataBuffer } = dataResponse
    const ipSize = (version - 2) * 2
    const recordSize = MAIN_RECORD_SIZE + ipSize * 2
    const recordCount = dataBuffer.byteLength / recordSize
    const startList = version === 4
      ? new Uint32Array(dataBuffer.slice(0, 4 * recordCount))
      : new BigUint64Array(dataBuffer.slice(0, 8 * recordCount))

    const recordIndex = binarySearch(startList, ip)
    if (recordIndex === null) {
      return null
    }

    const endIp = getEndIp(dataBuffer, version, recordCount, recordIndex, ipSize)
    if (ip >= startList[recordIndex]! && ip <= endIp) {
      return parseRecord(dataBuffer, recordCount, recordIndex, ipSize, MAIN_RECORD_SIZE)
    }

    return null
  } as (ipInput: string) => Promise<T extends 'country' ? { country: string } | null : { latitude: number, longitude: number, country: string } | null>

  /**
   * Loads the index for the specified IP version.
   * @param ipVersion - The IP version (4 or 6)
   * @returns A promise that resolves to the loaded index
   */
  async function loadIndex(ipVersion: 4 | 6) {
    const baseUrl = getBaseUrl()
    return downloadIndex(baseUrl, ipVersion)
  }

  /**
   * Determines the base URL for downloading the index.
   * @returns The base URL as a string
   */
  function getBaseUrl(): string {
    //* If we are not in the DOM we just use the CDN_URL to download the index
    if (typeof document === 'undefined' || !document.currentScript) {
      return CDN_URL
    }

    //* If we aren't in a SCRIPT element we use the CDN_URL
    if (!(document.currentScript instanceof HTMLScriptElement)) {
      return CDN_URL
    }

    //* Extract the base URL from the script's src attribute
    return document.currentScript.src.split('/').slice(0, -1).join('/')
  }

  /**
   * Downloads the index file for the specified IP version.
   * @param baseUrl - The base URL for downloading
   * @param version - The IP version (4 or 6)
   * @returns A promise that resolves to the downloaded index
   */
  async function downloadIndex(baseUrl: string, version: 4 | 6) {
    const result = await fetchArrayBuffer(
      new URL(`${baseUrl}/indexes/${version}.idx`),
    )
    if (!result) {
      log('warn', 'Index file not found, is it corrupted?')
      return null
    }

    const { versionHeader, buffer } = result
    if (versionHeader)
      DATA_URL[version] = `${CDN_URL}@${versionHeader}`
    if (version === 4)
      return (INDEXES[version] = new Uint32Array(buffer))
    return (INDEXES[version] = new BigUint64Array(buffer))
  }

  /**
   * Retrieves the end IP for a given record.
   * @param dataBuffer - The buffer containing IP data
   * @param ipVersion - The IP version (4 or 6)
   * @param recordCount - The total number of records
   * @param recordIndex - The index of the current record
   * @param ipSize - The size of an IP address in bytes
   * @returns The end IP as a number
   */
  function getEndIp(dataBuffer: ArrayBuffer, ipVersion: 4 | 6, recordCount: number, recordIndex: number, ipSize: number) {
    const endIpBuffer = dataBuffer.slice(
      (recordCount + recordIndex) * ipSize,
      (recordCount + recordIndex + 1) * ipSize,
    )
    return ipVersion === 4
      ? new Uint32Array(endIpBuffer)[0]!
      : new BigUint64Array(endIpBuffer)[0]!
  }

  /**
   * Parses a record and returns location data.
   * @param dataBuffer - The buffer containing record data
   * @param recordCount - The total number of records
   * @param recordIndex - The index of the current record
   * @param ipSize - The size of an IP address in bytes
   * @param MAIN_RECORD_SIZE - The size of the main record data
   * @returns Location data object
   */
  function parseRecord(dataBuffer: ArrayBuffer, recordCount: number, recordIndex: number, ipSize: number, MAIN_RECORD_SIZE: number) {
    const recordBuffer = dataBuffer.slice(
      recordCount * ipSize * 2 + recordIndex * MAIN_RECORD_SIZE,
      recordCount * ipSize * 2 + (recordIndex + 1) * MAIN_RECORD_SIZE,
    )

    if (__DATA_TYPE__ === 'country') {
      const ccCode = new Uint16Array(recordBuffer)[0]!
      return { country: String.fromCharCode(ccCode & 255, ccCode >> 8) }
    }
    else {
      const recordData = new Int32Array(recordBuffer)
      const latitudeData = recordData[0]!
      const longitudeData = recordData[1]!
      const countryCode = numberToCountryCode(latitudeData & 1023)
      return {
        latitude: (latitudeData >> 10) / 10000,
        longitude: longitudeData / 10000,
        country: countryCode,
      }
    }
  }
}
