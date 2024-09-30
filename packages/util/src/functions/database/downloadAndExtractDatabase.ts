import type { IpLocationApiSettings } from '../getSettings.js'
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Writable } from 'node:stream'
import ky from 'ky'
import { open } from 'yauzl'
import { DATABASE_SUFFIX_SHA, DATABASE_SUFFIX_ZIP, MAXMIND_URL } from '../../constants.js'

/**
 * Downloads and extracts the database if an update is needed.
 * @param settings - The settings object.
 * @returns An array of extracted file names or false if no update was needed.
 */
export async function downloadAndExtractDatabase(settings: IpLocationApiSettings): Promise<{
  files: string[] | false
  sha256: string
}> {
  const { edition, src } = getDatabaseInfo(settings)
  const remoteHash = await getRemoteSha256(settings, edition)
  const localHash = await getLocalSha256(settings, edition)

  if (await isUpToDate(settings, edition, remoteHash, localHash)) {
    return { files: false, sha256: remoteHash }
  }

  const zipPath = await downloadDatabase(settings, edition)
  const files = await extractDatabase(zipPath, settings.tmpDataDir, src)
  return { files, sha256: remoteHash }
}

/**
 * Determines the database edition and source files based on settings.
 * @param settings - The settings object.
 * @returns An object containing the edition and source file names.
 */
function getDatabaseInfo(settings: IpLocationApiSettings): { edition: string, src: string[] } {
  const edition = `${settings.series}-${settings.dataType}-CSV`
  const baseSrc = [
    `${settings.series}-${settings.dataType}-Locations-en.csv`,
    `${settings.series}-${settings.dataType}-Blocks-IPv4.csv`,
    `${settings.series}-${settings.dataType}-Blocks-IPv6.csv`,
  ]

  //* Add language-specific file for non-English City databases
  const src = settings.language !== 'en' && settings.dataType === 'City'
    ? [...baseSrc, `${settings.series}-${settings.dataType}-Locations-${settings.language}.csv`]
    : baseSrc

  return { edition, src }
}

/**
 * Fetches the remote SHA256 hash for the database.
 * @param settings - The settings object.
 * @param databaseEdition - The database edition string.
 * @returns The remote SHA256 hash.
 * @throws Error if the SHA256 hash cannot be downloaded or parsed.
 */
async function getRemoteSha256(settings: IpLocationApiSettings, databaseEdition: string): Promise<string> {
  const shaUrl = settings.licenseKey === 'redist'
    ? `https://raw.githubusercontent.com/sapics/node-geolite2-redist/master/redist/${databaseEdition}${DATABASE_SUFFIX_SHA}`
    : `${MAXMIND_URL}?edition_id=${databaseEdition}&suffix=${DATABASE_SUFFIX_SHA}&license_key=${settings.licenseKey}`

  const shaText = await ky.get(shaUrl).text()
  const sha256 = shaText.match(/\w{50,}/)?.[0]
  if (!sha256) {
    throw new Error('Cannot download sha256')
  }
  return sha256
}

/**
 * Retrieves the local SHA256 hash for the database.
 * @param settings - The settings object.
 * @param databaseEdition - The database edition string.
 * @returns The local SHA256 hash or undefined if not found.
 */
async function getLocalSha256(settings: IpLocationApiSettings, databaseEdition: string): Promise<string | undefined> {
  try {
    return await readFile(path.join(settings.fieldDir, `${databaseEdition}${DATABASE_SUFFIX_SHA}`), 'utf-8')
  }
  catch {
    return undefined
  }
}

/**
 * Checks if the local database is up to date.
 * @param settings - The settings object.
 * @param databaseEdition - The database edition string.
 * @param remoteHash - The remote SHA256 hash.
 * @param localHash - The local SHA256 hash.
 * @returns True if the database is up to date, false otherwise.
 */
async function isUpToDate(settings: IpLocationApiSettings, databaseEdition: string, remoteHash: string, localHash: string | undefined): Promise<boolean> {
  if (localHash !== remoteHash) {
    return false
  }

  const zipPath = path.join(settings.tmpDataDir, `${databaseEdition}${DATABASE_SUFFIX_ZIP}`)
  if (!existsSync(zipPath)) {
    return false
  }

  const zipHash = await sha256Hash(zipPath)
  return zipHash === remoteHash
}

/**
 * Downloads the database ZIP file.
 * @param settings - The settings object.
 * @param databaseEdition - The database edition string.
 * @returns The path to the downloaded ZIP file.
 * @throws Error if the database cannot be downloaded.
 */
async function downloadDatabase(settings: IpLocationApiSettings, databaseEdition: string): Promise<string> {
  const zipUrl = settings.licenseKey === 'redist'
    ? `https://raw.githubusercontent.com/sapics/node-geolite2-redist/master/redist/${databaseEdition}${DATABASE_SUFFIX_ZIP}`
    : `${MAXMIND_URL}?edition_id=${databaseEdition}&suffix=${DATABASE_SUFFIX_ZIP}&license_key=${settings.licenseKey}`

  const response = await ky.get(zipUrl)
  const stream = response.body
  if (!stream) {
    throw new Error('Cannot download database')
  }

  const zipPath = path.join(settings.tmpDataDir, `${databaseEdition}${DATABASE_SUFFIX_ZIP}`)
  await stream.pipeTo(Writable.toWeb(createWriteStream(zipPath)))
  return zipPath
}

/**
 * Extracts specific files from the downloaded ZIP database.
 * @param zipPath - The path to the ZIP file.
 * @param outputDir - The directory to extract files to.
 * @param filesToExtract - An array of file names to extract.
 * @returns A promise that resolves to an array of extracted file names.
 */
async function extractDatabase(zipPath: string, outputDir: string, filesToExtract: string[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    //* Open the zip file
    open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err)
        return reject(err)

      //* Initialize an array to store extracted files
      const extractedFiles: string[] = []

      //* Listen for entry events in the zip file
      zipfile.on('entry', (entry) => {
        //* Check if the entry matches any files to extract
        const matchedFile = filesToExtract.find(file => entry.fileName.endsWith(file))
        if (matchedFile) {
          // TODO: Add debug log
          //* Open the read stream for the entry
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err)
              return reject(err)
            //* Create a write stream to save the entry to the output directory
            const writeStream = createWriteStream(path.join(outputDir, matchedFile))
            //* Pipe the read stream to the write stream
            readStream.pipe(writeStream)
            //* When the read stream ends, add the file to the extracted files array and continue reading the next entry
            readStream.on('end', () => {
              extractedFiles.push(matchedFile)
              zipfile.readEntry()
            })
          })
        }
        else {
          //* If no files to extract match the entry, continue reading the next entry
          zipfile.readEntry()
        }
      })

      //* When the zip file is fully read, resolve the promise with the extracted files
      zipfile.on('end', () => resolve(extractedFiles))
      //* Start reading the entries in the zip file
      zipfile.readEntry()
    })
  })
}

/**
 * Calculates the SHA256 hash of a file.
 * @param file - The path to the file.
 * @returns A promise that resolves to the SHA256 hash of the file.
 */
function sha256Hash(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(file)
    const hash = createHash('sha256')
    hash.once('finish', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
    stream.pipe(hash)
  })
}
