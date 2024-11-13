import type { IpLocationApiInputSettings } from './getSettings'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, LOCATION_FIELDS, MAIN_FIELDS } from '../constants'
import { getSettings } from './getSettings'

describe('getSettings', () => {
  const originalEnv = process.env
  const originalArgv = process.argv

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    process.argv = [...originalArgv]
  })

  afterEach(() => {
    process.env = originalEnv
    process.argv = originalArgv
  })

  it('should return default settings when no input is provided', () => {
    const settings = getSettings()
    expect.soft(settings).toMatchObject({
      licenseKey: DEFAULT_SETTINGS.licenseKey,
      series: DEFAULT_SETTINGS.series,
      fields: DEFAULT_SETTINGS.fields,
      language: DEFAULT_SETTINGS.language,
      smallMemory: DEFAULT_SETTINGS.smallMemory,
      smallMemoryFileSize: DEFAULT_SETTINGS.smallMemoryFileSize,
    })
  })

  it('should override default settings with input settings', () => {
    const inputSettings: IpLocationApiInputSettings = {
      licenseKey: 'test-key',
      series: 'GeoIP2',
      fields: ['country', 'city'],
      language: 'es',
      smallMemory: true,
      smallMemoryFileSize: 8192,
    }
    const settings = getSettings(inputSettings)
    expect.soft(settings).toMatchObject({
      licenseKey: 'test-key',
      series: 'GeoIP2',
      fields: ['country', 'city'],
      language: 'es',
      smallMemory: true,
      smallMemoryFileSize: 8192,
    })
  })

  it('should use environment variables to override default settings', () => {
    process.env.ILA_LICENSE_KEY = 'env-key'
    process.env.ILA_SERIES = 'GeoIP2'
    process.env.ILA_FIELDS = 'country,city'
    process.env.ILA_LANGUAGE = 'fr'
    process.env.ILA_SMALL_MEMORY = 'true'
    process.env.ILA_SMALL_MEMORY_FILE_SIZE = '16384'

    const settings = getSettings()
    expect.soft(settings).toMatchObject({
      licenseKey: 'env-key',
      series: 'GeoIP2',
      fields: ['country', 'city'],
      language: 'fr',
      smallMemory: true,
      smallMemoryFileSize: 16384,
    })
  })

  it('should use CLI arguments to override default and environment settings', () => {
    process.env.ILA_LICENSE_KEY = 'env-key'
    process.argv = [
      ...process.argv,
      'ILA_LICENSE_KEY=cli-key',
      'ILA_SERIES=GeoIP2',
      'ILA_FIELDS=country,region1',
      'ILA_LANGUAGE=de',
      'ILA_SMALL_MEMORY=true',
      'ILA_SMALL_MEMORY_FILE_SIZE=32768',
    ]

    const settings = getSettings()
    expect.soft(settings).toMatchObject({
      licenseKey: 'cli-key',
      series: 'GeoIP2',
      fields: ['country', 'region1'],
      language: 'de',
      smallMemory: true,
      smallMemoryFileSize: 32768,
    })
  })

  it('should process "all" fields correctly', () => {
    const inputSettings: IpLocationApiInputSettings = {
      fields: 'all',
    }
    const settings = getSettings(inputSettings)
    expect.soft(settings.fields).toEqual([...MAIN_FIELDS, ...LOCATION_FIELDS])

    process.argv = [...process.argv, 'ILA_FIELDS=all']
    const settings2 = getSettings()
    expect.soft(settings2.fields).toEqual([...MAIN_FIELDS, ...LOCATION_FIELDS])
  })

  it('should filter out invalid fields', () => {
    const inputSettings: IpLocationApiInputSettings = {
      fields: ['country', 'invalid_field', 'city'] as any,
    }
    const settings = getSettings(inputSettings)
    expect.soft(settings.fields).toEqual(['country', 'city'])
  })

  it('should handle invalid fields input', () => {
    const inputSettings: IpLocationApiInputSettings = {
      fields: 0 as any,
    }
    const settings = getSettings(inputSettings)
    expect.soft(settings.fields).toEqual(DEFAULT_SETTINGS.fields)
  })

  it('should use default fields if all provided fields are invalid', () => {
    const inputSettings: IpLocationApiInputSettings = {
      fields: ['invalid_field1', 'invalid_field2'] as any,
    }
    const settings = getSettings(inputSettings)
    expect.soft(settings.fields).toEqual(DEFAULT_SETTINGS.fields)
  })

  it('should process directory paths correctly', () => {
    const inputSettings: IpLocationApiInputSettings = {
      dataDir: '../custom-data',
      tmpDataDir: '/tmp/custom-tmp',
    }
    const settings = getSettings(inputSettings)
    expect.soft(settings.dataDir).toMatch(/custom-data$/)
    expect.soft(settings.tmpDataDir).toBe('/tmp/custom-tmp')
  })

  it('should calculate correct record sizes and database settings', () => {
    const inputSettings: IpLocationApiInputSettings = {
      fields: ['country', 'city', 'latitude', 'longitude'],
      smallMemory: true,
      smallMemoryFileSize: 4096,
    }
    const settings = getSettings(inputSettings)
    expect.soft(settings.dataType).toBe('City')
    expect.soft(settings.locationFile).toBe(true)
    expect.soft(settings.mainRecordSize).toBeGreaterThan(0)
    expect.soft(settings.locationRecordSize).toBeGreaterThan(0)
    expect.soft(settings.v4.recordSize).toBeGreaterThan(settings.mainRecordSize)
    expect.soft(settings.v6.recordSize).toBeGreaterThan(settings.mainRecordSize)
    expect.soft(settings.v4.fileLineMax).toBeGreaterThan(0)
    expect.soft(settings.v6.fileLineMax).toBeGreaterThan(0)

    const settings2 = getSettings({
      fields: ['country', 'city', 'latitude', 'longitude'],
      smallMemory: true,
      smallMemoryFileSize: 0,
    })
    expect.soft(settings2.dataType).toBe('City')
    expect.soft(settings2.locationFile).toBe(true)
    expect.soft(settings2.mainRecordSize).toBeGreaterThan(0)
    expect.soft(settings2.locationRecordSize).toBeGreaterThan(0)
    expect.soft(settings2.v4.recordSize).toBeGreaterThan(settings2.mainRecordSize)
    expect.soft(settings2.v6.recordSize).toBeGreaterThan(settings2.mainRecordSize)
    expect.soft(settings2.v4.fileLineMax).toBe(1)
    expect.soft(settings2.v6.fileLineMax).toBe(1)
  })

  it('should generate correct fieldDir', () => {
    const inputSettings: IpLocationApiInputSettings = {
      fields: ['country', 'city'],
      dataDir: '/custom/data/dir',
    }
    const settings = getSettings(inputSettings)
    const expectedFieldDir = join('/custom/data/dir', (16 + 2048).toString(36))
    expect.soft(settings.fieldDir).toBe(expectedFieldDir)
  })

  it('should handle invalid language input', () => {
    const inputSettings: IpLocationApiInputSettings = {
      language: 'invalid_language' as any,
    }
    const settings = getSettings(inputSettings)
    expect.soft(settings.language).toBe(DEFAULT_SETTINGS.language)
  })

  it('should handle invalid series input', () => {
    const inputSettings: IpLocationApiInputSettings = {
      series: 'InvalidSeries' as any,
    }
    const settings = getSettings(inputSettings)
    expect.soft(settings.series).toBe(DEFAULT_SETTINGS.series)
  })
})
