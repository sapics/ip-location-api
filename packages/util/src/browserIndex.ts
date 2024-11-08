import { Buffer } from 'node:buffer'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getSettings, type IpLocationApiInputSettings, type IpLocationApiSettings, processDirectory } from './functions/getSettings.js'
import { numberToDir } from './functions/numberToDir.js'

/**
 * Creates a browser index for IP location data.
 * @param type - The type of data to create an index for ('country' or 'geocode').
 * @param inputSettings - The input settings for the IP location API.
 * @param directory - The directory to store the created index.
 */
export async function createBrowserIndex(
  type: 'country' | 'geocode',
  inputSettings: IpLocationApiInputSettings,
  directory: string,
) {
  const settings = getSettings(inputSettings)
  const exportDir = processDirectory(directory)
  await rm(exportDir, { recursive: true, force: true })

  await processIpVersion(type, settings, exportDir, '4')
  await processIpVersion(type, settings, exportDir, '6')
}

/**
 * Processes and creates index files for a specific IP version.
 * @param type - The type of data to process ('country' or 'geocode').
 * @param settings - The settings for the IP location API.
 * @param exportDir - The directory to export the processed data.
 * @param ipVersion - The IP version to process ('4' or '6').
 */
async function processIpVersion(
  type: 'country' | 'geocode',
  settings: IpLocationApiSettings,
  exportDir: string,
  ipVersion: '4' | '6',
) {
  //* Create the directory for the IP version
  await mkdir(join(exportDir, ipVersion), { recursive: true })

  const indexSize = type === 'country' ? 1024 : 2048
  const startBuf = await readFile(join(settings.fieldDir, `${ipVersion}-1.dat`))
  const endBuf = await readFile(join(settings.fieldDir, `${ipVersion}-2.dat`))
  const dbInfo = await readFile(join(settings.fieldDir, `${ipVersion}-3.dat`))

  //* Create typed arrays for efficient data processing
  const startList = ipVersion === '4' ? new Uint32Array(startBuf.buffer) : new BigUint64Array(startBuf.buffer)
  const endList = ipVersion === '4' ? new Uint32Array(endBuf.buffer) : new BigUint64Array(endBuf.buffer)
  const dbList = type === 'country' ? new Uint16Array(dbInfo.buffer) : new Int32Array(dbInfo.buffer)

  const length = startList.length
  const indexList = ipVersion === '4' ? new Uint32Array(indexSize) : new BigUint64Array(indexSize)
  const recordSize = settings.mainRecordSize + (ipVersion === '4' ? 8 : 16)

  //* Process and write index files
  for (let i = 0; i < indexSize; ++i) {
    const index = length * i / indexSize | 0
    indexList[i] = startList[index] as number | bigint
    const nextIndex = length * (i + 1) / indexSize | 0
    const count = nextIndex - index

    const exportBuf = Buffer.alloc(recordSize * count)
    for (let j = index, k = 0; j < nextIndex; ++j) {
      //* Write start and end IP addresses
      if (ipVersion === '4') {
        exportBuf.writeUInt32LE(startList[j] as number, k * 4)
        exportBuf.writeUInt32LE(endList[j] as number, 4 * count + k * 4)
      }
      else {
        exportBuf.writeBigUInt64LE(startList[j] as bigint, k * 8)
        exportBuf.writeBigUInt64LE(endList[j] as bigint, 8 * count + k * 8)
      }

      //* Write country or geocode data
      const offset = (ipVersion === '4' ? 8 : 16) * count + k * settings.mainRecordSize
      if (type === 'country') {
        exportBuf.writeUInt16LE(dbList[j]!, offset)
      }
      else {
        exportBuf.writeInt32LE(dbList[2 * j]!, offset)
        exportBuf.writeInt32LE(dbList[2 * j + 1]!, offset + 4)
      }
      ++k
    }

    //* Write the processed data to a file
    await writeFile(join(exportDir, ipVersion, numberToDir(i)), exportBuf)
  }

  //* Write the index list to a file
  await writeFile(join(exportDir, `${ipVersion}.idx`), Buffer.from(indexList.buffer))
}
