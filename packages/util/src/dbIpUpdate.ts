import type { IpLocationApiInputSettings } from './functions/getSettings.js'
import { Buffer } from 'node:buffer'
import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { parse } from '@fast-csv/parse'
import { aton4 } from './functions/aton4.js'
import { aton6 } from './functions/aton6.js'
import { countryCodeToNumber } from './functions/countryCodeToNumber.js'
import { ensureDirectoriesExist } from './functions/database/ensureDirectoriesExist.js'
import { getSettings } from './functions/getSettings.js'

/**
 * Updates the GeoIP database based on the provided settings using db-ip.com database.
 * Downloads and processes a CSV file containing IP ranges with their corresponding geographical data.
 * Creates binary data files for both IPv4 and IPv6 addresses.
 *
 * @param inputSettings - Partial settings to override the default configuration
 * @returns Promise that resolves when the database update is complete
 */
export async function update(inputSettings?: Partial<IpLocationApiInputSettings>): Promise<void> {
  const settings = getSettings(inputSettings)
  await ensureDirectoriesExist(settings)

  //* Construct filename based on current year and month (db-ip updates monthly)
  const fileName = `dbip-city-lite-${new Date().getFullYear()}-${new Date().getMonth() + 1}.csv`
  const tempFilePath = path.join(settings.tmpDataDir, fileName)

  //* Download and decompress the database file if it doesn't exist locally
  if (!existsSync(tempFilePath)) {
    const response = await fetch(`https://download.db-ip.com/free/${fileName}.gz`)
    // @ts-expect-error DecompressionStream is supported in Node.js
    await pipeline(response.body!.pipeThrough(new DecompressionStream('gzip')), createWriteStream(tempFilePath))
  }

  return new Promise<void>((resolve, reject) => {
    //* Arrays to store processed IP ranges and their metadata
    const v4: [number, number, number, number][] = [] // [startIp, endIp, latitudeWithCountry, longitude]
    const v6: [bigint, bigint, number, number][] = [] // [startIp, endIp, latitudeWithCountry, longitude]

    //* Keep track of previous entries to merge consecutive ranges with same metadata
    let previousDataV4: [number, number, number, number] | null = null
    let previousDataV6: [bigint, bigint, number, number] | null = null

    createReadStream(tempFilePath)
      .pipe(parse())
      .on('error', reject)
      .on('data', ([
        ipStart,
        ipEnd,
        , //* Skip unused columns from CSV
        countryCode,
        ,
        ,
        latitudeString,
        longitudeString,
      ]: [string, string, string, string, string, string, string, string]) => {
        //* Skip invalid or special country codes
        if (!countryCode || countryCode === 'ZZ' || countryCode === 'EU')
          return

        //* Convert coordinates to integers with 4 decimal precision
        const latitude = Math.round((Number.parseFloat(latitudeString)) * 10000) // -90 ~ 90 -> -900000 ~ 900000
        const longitude = Math.round((Number.parseFloat(longitudeString)) * 10000) // -180 ~ 180 -> -1800000 ~ 1800000

        //* Combine latitude with country code for efficient storage
        const latitudeWithCountryCode = (latitude) << 10 | countryCodeToNumber(countryCode)

        if (ipStart.includes(':')) {
          //* Handle IPv6 addresses
          const start = aton6(ipStart)
          //* Merge with previous range if consecutive and has same metadata
          if (previousDataV6 && previousDataV6[1] + 1n === start
            && previousDataV6[2] === latitudeWithCountryCode
            && previousDataV6[3] === longitude) {
            previousDataV6[1] = aton6(ipEnd)
            return
          }
          v6.push(previousDataV6 = [aton6(ipStart), aton6(ipEnd), latitudeWithCountryCode, longitude])
        }
        else {
          //* Handle IPv4 addresses
          const start = aton4(ipStart)
          //* Merge with previous range if consecutive and has same metadata
          if (previousDataV4 && previousDataV4[1] + 1 === start
            && previousDataV4[2] === latitudeWithCountryCode
            && previousDataV4[3] === longitude) {
            previousDataV4[1] = aton4(ipEnd)
            return
          }
          v4.push(previousDataV4 = [aton4(ipStart), aton4(ipEnd), latitudeWithCountryCode, longitude])
        }
      })
      .on('end', async () => {
        //* Create binary buffers for IPv4 data
        const v4Buf1 = Buffer.alloc(v4.length * 4) // Start IPs
        const v4Buf2 = Buffer.alloc(v4.length * 4) // End IPs
        const v4Buf3 = Buffer.alloc(v4.length * 8) // Metadata (latitude+country, longitude)

        //* Write IPv4 data to buffers
        for (let i = 0; i < v4.length; ++i) {
          v4Buf1.writeUInt32LE(v4[i]![0], i * 4)
          v4Buf2.writeUInt32LE(v4[i]![1], i * 4)
          v4Buf3.writeInt32LE(v4[i]![2], i * 8)
          v4Buf3.writeInt32LE(v4[i]![3], i * 8 + 4)
        }

        //* Create binary buffers for IPv6 data
        const v6Buf1 = Buffer.alloc(v6.length * 8) // Start IPs
        const v6Buf2 = Buffer.alloc(v6.length * 8) // End IPs
        const v6Buf3 = Buffer.alloc(v6.length * 8) // Metadata (latitude+country, longitude)

        //* Write IPv6 data to buffers
        for (let i = 0; i < v6.length; ++i) {
          v6Buf1.writeBigUInt64LE(v6[i]![0], i * 8)
          v6Buf2.writeBigUInt64LE(v6[i]![1], i * 8)
          v6Buf3.writeInt32LE(v6[i]![2], i * 8)
          v6Buf3.writeInt32LE(v6[i]![3], i * 8 + 4)
        }

        //* Write all buffers to separate data files
        await writeFile(path.join(settings.fieldDir, '4-1.dat'), v4Buf1)
        await writeFile(path.join(settings.fieldDir, '4-2.dat'), v4Buf2)
        await writeFile(path.join(settings.fieldDir, '4-3.dat'), v4Buf3)
        await writeFile(path.join(settings.fieldDir, '6-1.dat'), v6Buf1)
        await writeFile(path.join(settings.fieldDir, '6-2.dat'), v6Buf2)
        await writeFile(path.join(settings.fieldDir, '6-3.dat'), v6Buf3)
        resolve()
      })
  })
}
