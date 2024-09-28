import process from 'node:process'
import { defu } from 'defu'

const DEFAULT_SETTINGS: IpLocationApiSettings = {
  fields: ['country'],
  dataDir: '../data/',
  tmpDataDir: '../tmp/',
  smallMemory: false,
  smallMemoryFileSize: 4096,
  addCountryInfo: false,
  licenseKey: 'redist',
  ipLocationDb: '',
  downloadType: 'reuse',
  series: 'GeoLite2',
  language: 'en',
  fakeData: false,
  autoUpdate: 'default',
  sameDbSetting: false,
  multiDbDir: false,
  browserType: false,
  silent: false,
}

export interface IpLocationApiSettings {
  fields: string[]
  dataDir: string
  tmpDataDir: string
  smallMemory: boolean
  smallMemoryFileSize: number
  addCountryInfo: boolean
  licenseKey: string
  ipLocationDb: string
  downloadType: string
  series: string
  language: string
  fakeData: boolean
  autoUpdate: string
  sameDbSetting: boolean
  multiDbDir: boolean
  browserType: boolean
  silent: boolean
}

/**
 * Get the settings from the environment variables, the CLI arguments and function arguments, and merge them with the default settings
 * @param settings The settings from the function arguments
 * @returns The settings merged with the environment variables, the CLI arguments and the default settings
 */
export function getSettings(settings?: Partial<IpLocationApiSettings>): IpLocationApiSettings {
  const keys = Object.keys(DEFAULT_SETTINGS) as (keyof IpLocationApiSettings)[]
  const result: Record<string, any> = {}
  const cliArgs = process.argv.slice(2)
  for (const key of keys) {
    const envKey = getKey(key)

    //* If the environment variable is set, use it
    const envValue = process.env[envKey]
    if (envValue) {
      result[key] = mapSetting(key, envValue)
    }

    //* If the CLI argument is set, use it
    const cliArg = cliArgs.find(arg => arg.startsWith(`${key}=`))
    if (cliArg) {
      result[key] = mapSetting(key, cliArg.split('=')[1]!)
    }
  }

  //* Merge the settings
  return defu(
    {
      ...result,
      ...settings,
    },
    DEFAULT_SETTINGS,
  )
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
 * Map the setting to the correct type
 * @param key The key to map
 * @param value The value to map
 * @returns The mapped value
 */
function mapSetting(key: keyof IpLocationApiSettings, value: string): typeof DEFAULT_SETTINGS[typeof key] {
  switch (key) {
    //* String array
    case 'fields':
      return value.split(/\s*,\s*/)

    //* Boolean
    case 'smallMemory':
    case 'addCountryInfo':
    case 'fakeData':
    case 'sameDbSetting':
    case 'multiDbDir':
    case 'browserType':
    case 'silent':
      return value === 'true'

    //* Number
    case 'smallMemoryFileSize':
      return Number(value)

    //* String
    default:
      return value
  }
}
