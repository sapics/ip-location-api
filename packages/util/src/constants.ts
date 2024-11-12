import type { IpLocationApiSettings, LocalDatabase } from './functions/getSettings.js'

export const MAXMIND_URL = 'https://download.maxmind.com/app/geoip_download'
export const DATABASE_SUFFIX_SHA = '.zip.sha256'
export const DATABASE_SUFFIX_ZIP = '.zip'
export const MAIN_FIELDS = ['latitude', 'longitude', 'area', 'postcode'] as const
export const LOCATION_FIELDS = ['country', 'region1', 'region1_name', 'region2', 'region2_name', 'metro', 'timezone', 'city', 'eu'] as const
export const v4: LocalDatabase<4> = {
  version: 4,
  recordSize: 0,
  fileLineMax: 0,
  folderLineMax: 0,
}
export const v6: LocalDatabase<6> = {
  version: 6,
  recordSize: 0,
  fileLineMax: 0,
  folderLineMax: 0,
}
export const DEFAULT_SETTINGS: IpLocationApiSettings = {
  licenseKey: 'redist',
  series: 'GeoLite2',
  dataDir: '../data',
  tmpDataDir: '../tmp',
  fields: ['country'],
  language: 'en',
  smallMemory: false,
  smallMemoryFileSize: 4096,
  //* Generated settings
  fieldDir: '',
  dataType: 'Country',
  locationFile: false,
  mainRecordSize: 2,
  locationRecordSize: 0,
  v4,
  v6,
  addCountryInfo: false,
  silent: false,
}
// eslint-disable-next-line import/no-mutable-exports
export let SAVED_SETTINGS: IpLocationApiSettings = DEFAULT_SETTINGS
export function setSavedSettings(settings: IpLocationApiSettings) {
  return SAVED_SETTINGS = settings
}
