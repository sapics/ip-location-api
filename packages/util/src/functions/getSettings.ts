import type { Buffer } from 'node:buffer'
import { dirname, join, resolve as resolvePath } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { DEFAULT_SETTINGS, LOCATION_FIELDS, MAIN_FIELDS, setSavedSettings, v4, v6 } from '../constants.js'
import { getFieldsSize } from './getFieldsSize.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface LocalDatabase<Version extends 4 | 6 = 4 | 6> {
  version: Version
  recordSize: number
  fileLineMax: number
  folderLineMax: number
  loadedData?: {
    startIps: Version extends 4 ? Uint32Array : BigUint64Array
    endIps?: Version extends 4 ? Uint32Array : BigUint64Array
    mainBuffer?: Buffer
    lastLine: number
    firstIp: Version extends 4 ? number : bigint
  }
}

/**
 * The settings for the IpLocationApi
 */
export interface IpLocationApiInputSettings {
  /**
   * Your MaxMind license key or 'redist' for free GeoLite2 Redistributed database.
   * @default 'redist'
   */
  licenseKey?: string
  /**
   * The series of the database, GeoLite2 or GeoIP2. If you use 'redist', this setting is ignored.
   * @default 'GeoLite2'
   * @requires licenseKey
   */
  series?: 'GeoLite2' | 'GeoIP2'

  /**
   * The directory to save the database
   * @default '../data'
   */
  dataDir?: string
  /**
   * The directory to save the temporary database
   * @default '../tmp'
   */
  tmpDataDir?: string
  /**
   * The fields to include in the database
   * @default ['country']
   */
  fields?: ((typeof MAIN_FIELDS)[number] | (typeof LOCATION_FIELDS)[number])[] | 'all'
  /**
   * The language of the database
   * @default 'en'
   */
  language?: 'de' | 'en' | 'es' | 'fr' | 'ja' | 'pt-BR' | 'ru' | 'zh-CN'
  /**
   * Whether to use small memory mode
   * @default false
   */
  smallMemory?: boolean
  /**
   * The file size for small memory mode
   * @default 4096
   */
  smallMemoryFileSize?: number
  /**
   * Whether to add country info in the result
   * @default false
   *
   * @requires countries-list package (optional peer dependency)
   * @link https://www.npmjs.com/package/countries-list
   */
  addCountryInfo?: boolean
  /**
   * Whether to suppress logging
   * @default false
   */
  silent?: boolean
}

export interface IpLocationApiSettings {
  licenseKey: string
  series: 'GeoLite2' | 'GeoIP2'
  dataDir: string
  tmpDataDir: string
  fields: ((typeof MAIN_FIELDS)[number] | (typeof LOCATION_FIELDS)[number])[]
  language: 'de' | 'en' | 'es' | 'fr' | 'ja' | 'pt-BR' | 'ru' | 'zh-CN'
  fieldDir: string
  smallMemory: boolean
  smallMemoryFileSize: number
  dataType: 'Country' | 'City'
  locationFile: boolean
  mainRecordSize: number
  locationRecordSize: number
  v4: LocalDatabase<4>
  v6: LocalDatabase<6>
  addCountryInfo: boolean
  silent: boolean
}

/**
 * Get the key from the environment variable
 * @param key The key to get
 * @returns The key
 *
 * @example
 * getKey('testKey') -> 'ILA_TEST_KEY'
 */
function getKey(key: string): string {
  return `ILA_${key.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toUpperCase()}`
}

/**
 * The bit flag for the fields
 */
const FIELD_BIT_FLAG: Record<((typeof MAIN_FIELDS)[number] | (typeof LOCATION_FIELDS)[number]), number> = {
  latitude: 1,
  longitude: 2,
  area: 4,
  postcode: 8,
  country: 16,
  region1: 32,
  region1_name: 64,
  region2: 128,
  region2_name: 256,
  metro: 512,
  timezone: 1024,
  city: 2048,
  eu: 4096,
}

/**
 * Get the settings from various sources and merge them with default values
 * @param settings The settings from the function parameters
 * @returns The merged and processed IpLocationApiSettings
 */
export function getSettings(settings?: IpLocationApiInputSettings): IpLocationApiSettings {
  //* Fetch settings from different sources
  const envSettings = getFromIlaObject(process.env)
  const cliSettings = getFromIlaObject(
    Object.fromEntries(
      process.argv
        .slice(2)
        .map(arg => arg.split('=') as [string, string])
        .filter(([key, value]) => key.startsWith('ILA_') && value),
    ),
  )

  //* Merge settings with priority: defaults < env < CLI < function params
  const mergedSettings = {
    ...DEFAULT_SETTINGS,
    ...envSettings,
    ...cliSettings,
    ...(settings ?? {}),
  }

  //* Process and validate individual settings
  const fields = processFields(mergedSettings.fields)
  const series = processSeries(mergedSettings.series)
  const dataDir = processDirectory(mergedSettings.dataDir)
  const tmpDataDir = processDirectory(mergedSettings.tmpDataDir)
  const language = processLanguage(mergedSettings.language)
  const dataType = fields.length === 1 && fields[0] === 'country' ? 'Country' : 'City'
  const locationFile = dataType !== 'Country' && LOCATION_FIELDS.some(field => fields.includes(field))
  let mainRecordSize = dataType === 'Country' ? 2 : getFieldsSize(fields.filter(field => (MAIN_FIELDS as unknown as string[]).includes(field)))
  if (locationFile)
    mainRecordSize += 4

  v4.recordSize = mainRecordSize
  v6.recordSize = mainRecordSize

  if (mergedSettings.smallMemory) {
    v4.recordSize += 4
    v4.fileLineMax = (mergedSettings.smallMemoryFileSize / v4.recordSize | 0) || 1
    v4.folderLineMax = v4.fileLineMax * 1024

    v6.recordSize += 8
    v6.fileLineMax = (mergedSettings.smallMemoryFileSize / v6.recordSize | 0) || 1
    v6.folderLineMax = v6.fileLineMax * 1024
  }

  //* Construct and return the final settings
  return setSavedSettings({
    licenseKey: mergedSettings.licenseKey,
    dataDir,
    tmpDataDir,
    fields,
    series,
    language,
    fieldDir: join(dataDir, fields.reduce((sum, v) => sum + FIELD_BIT_FLAG[v], 0).toString(36)),
    smallMemory: mergedSettings.smallMemory,
    smallMemoryFileSize: mergedSettings.smallMemoryFileSize,
    dataType,
    locationFile,
    mainRecordSize,
    locationRecordSize: getFieldsSize(fields.filter(field => (LOCATION_FIELDS as unknown as string[]).includes(field))),
    v4,
    v6,
    addCountryInfo: mergedSettings.addCountryInfo,
    silent: mergedSettings.silent,
  })
}

/**
 * Extract IpLocationApi settings from an object with ILA_ prefixed keys
 * @param ilaObject An object containing ILA_ prefixed keys
 * @returns Partial IpLocationApiInputSettings
 */
function getFromIlaObject(ilaObject: Record<string, string | undefined>): Partial<IpLocationApiInputSettings> {
  const settings = {
    licenseKey: ilaObject[getKey('licenseKey')],
    series: ilaObject[getKey('series')] as 'GeoLite2' | 'GeoIP2',
    dataDir: ilaObject[getKey('dataDir')],
    tmpDataDir: ilaObject[getKey('tmpDataDir')],
    fields: ilaObject[getKey('fields')] === 'all' ? 'all' : ilaObject[getKey('fields')]?.split(',') as IpLocationApiInputSettings['fields'],
    language: ilaObject[getKey('language')] as IpLocationApiInputSettings['language'],
    smallMemory: ilaObject[getKey('smallMemory')] ? ilaObject[getKey('smallMemory')] === 'true' : undefined,
    smallMemoryFileSize: ilaObject[getKey('smallMemoryFileSize')] ? Number.parseInt(ilaObject[getKey('smallMemoryFileSize')]!) : undefined,
  }

  //* Remove keys with undefined values
  return Object.fromEntries(
    Object.entries(settings).filter(([_, value]) => value !== undefined),
  ) as Partial<IpLocationApiInputSettings>
}

/**
 * Process and validate the fields setting
 * @param fields The input fields setting
 * @returns Validated array of fields or default fields
 */
function processFields(fields: IpLocationApiInputSettings['fields']): IpLocationApiSettings['fields'] {
  if (fields === 'all') {
    return [...MAIN_FIELDS, ...LOCATION_FIELDS]
  }

  if (Array.isArray(fields)) {
    const validFields = fields.filter(field =>
      MAIN_FIELDS.includes(field as any) || LOCATION_FIELDS.includes(field as any),
    ) as IpLocationApiSettings['fields']

    return validFields.length > 0 ? validFields : DEFAULT_SETTINGS.fields
  }

  return DEFAULT_SETTINGS.fields
}

/**
 * Process and validate the series setting
 * @param series The input series setting
 * @returns Validated series or default series
 */
function processSeries(series: IpLocationApiInputSettings['series']): IpLocationApiSettings['series'] {
  if (series === 'GeoLite2' || series === 'GeoIP2') {
    return series
  }

  return DEFAULT_SETTINGS.series
}

/**
 * Regular expression to match Windows drive letters
 */
const WINDOWS_DRIVE_REG = /^[a-z]:\\/i

/**
 * Process and resolve the directory path
 * @param directory The input directory path
 * @returns Resolved absolute directory path
 */
export function processDirectory(directory: string): string {
  //* If the path is not absolute, resolve it relative to __dirname
  if (!directory.startsWith('/') && !directory.startsWith('\\\\') && !WINDOWS_DRIVE_REG.test(directory)) {
    directory = resolvePath(__dirname, directory)
  }
  return directory
}

/**
 * Process and validate the language setting
 * @param language The input language setting
 * @returns Validated language or default language
 */
function processLanguage(language: IpLocationApiInputSettings['language']): IpLocationApiSettings['language'] {
  const validLanguages = ['de', 'en', 'es', 'fr', 'ja', 'pt-BR', 'ru', 'zh-CN'] as const
  if (language && validLanguages.includes(language)) {
    return language
  }

  return DEFAULT_SETTINGS.language
}
