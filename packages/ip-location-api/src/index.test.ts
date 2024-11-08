import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { clear, lookup, reload } from './index'

describe('lookup (country)', () => {
  const id = crypto.randomUUID()

  beforeAll(async () => {
    await reload({
      dataDir: resolve(__dirname, '../data', id),
      tmpDataDir: resolve(__dirname, '../tmp', id),
      fields: ['country'],
    })
  }, 60_000)

  afterAll(async () => {
    clear()
    await rm(resolve(__dirname, '../data', id), { recursive: true, force: true })
    await rm(resolve(__dirname, '../tmp', id), { recursive: true, force: true })
  })

  it('should return the country for a valid IP address', async ({ expect }) => {
    //* Ipv4
    const result = await lookup('8.8.8.8')
    expect.soft(result).not.toBeNull()
    expect.soft(result).toEqual({ country: 'US' })

    const result2 = await lookup('207.97.227.239')
    expect.soft(result2).not.toBeNull()
    expect.soft(result2).toEqual({ country: 'US' })

    //* Ipv6
    const result3 = await lookup('2607:F8B0:4005:801::200E')
    expect.soft(result3).not.toBeNull()
    expect.soft(result3).toEqual({ country: 'US' })

    //* Invalid IP address
    await expect.soft(lookup('invalid')).rejects.toThrowError('Invalid IPv4 address: invalid')

    //* Too high IP address
    await expect.soft(lookup('256.256.256.256')).resolves.toBeNull()

    //* Clear data
    clear()

    //* Ips should return null after data is cleared
    await expect.soft(lookup('8.8.8.8')).resolves.toBeNull()

    await expect.soft(lookup('2607:F8B0:4005:801::200E')).resolves.toBeNull()
  })
})

describe('lookup (country, smallMemory)', () => {
  const id = crypto.randomUUID()

  beforeAll(async () => {
    await reload({
      dataDir: resolve(__dirname, '../data', id),
      tmpDataDir: resolve(__dirname, '../tmp', id),
      fields: ['country'],
      smallMemory: true,
    })
  }, 60_000)

  afterAll(async () => {
    clear()
    await rm(resolve(__dirname, '../data', id), { recursive: true, force: true })
    await rm(resolve(__dirname, '../tmp', id), { recursive: true, force: true })
  })

  it('should return the country for a valid IP address', async ({ expect }) => {
    //* Ipv4
    const result = await lookup('8.8.8.8')
    expect.soft(result).not.toBeNull()
    expect.soft(result).toEqual({ country: 'US' })

    const result2 = await lookup('207.97.227.239')
    expect.soft(result2).not.toBeNull()
    expect.soft(result2).toEqual({ country: 'US' })

    //* Ipv6
    const result3 = await lookup('2607:F8B0:4005:801::200E')
    expect.soft(result3).not.toBeNull()
    expect.soft(result3).toEqual({ country: 'US' })

    //* Invalid IP address
    await expect.soft(lookup('invalid')).rejects.toThrowError('Invalid IPv4 address: invalid')

    //* Too high IP address
    await expect.soft(lookup('256.256.256.256')).resolves.toBeNull()

    //* Clear data
    clear()

    //* Ips should return null after data is cleared
    await expect.soft(lookup('8.8.8.8')).resolves.toBeNull()

    await expect.soft(lookup('2607:F8B0:4005:801::200E')).resolves.toBeNull()
  })
})

describe('lookup (city)', () => {
  const id = crypto.randomUUID()

  beforeAll(async () => {
    await reload({
      dataDir: resolve(__dirname, '../data', id),
      tmpDataDir: resolve(__dirname, '../tmp', id),
      fields: ['city', 'country'],
    })
  }, 3 * 60_000)

  afterAll(async () => {
    clear()
    await rm(resolve(__dirname, '../data', id), { recursive: true, force: true })
    await rm(resolve(__dirname, '../tmp', id), { recursive: true, force: true })
  })

  it('should return the city and country for a valid IP address', async ({ expect }) => {
    //* Ipv4
    const result = await lookup('170.171.1.0')
    expect.soft(result).not.toBeNull()
    expect.soft(result).toEqual({ city: 'New York', country: 'US' })

    //* Ipv6
    const result2 = await lookup('2606:2e00:8003::216:3eff:fe82:68ab')
    expect.soft(result2).not.toBeNull()
    expect.soft(result2).toEqual({ city: 'New York', country: 'US' })
  })
})

describe('lookup (all, smallMemory)', () => {
  const id = crypto.randomUUID()

  beforeAll(async () => {
    await reload({
      dataDir: resolve(__dirname, '../data', id),
      tmpDataDir: resolve(__dirname, '../tmp', id),
      fields: 'all',
      smallMemory: true,
      addCountryInfo: true,
    })
  }, 10 * 60_000)

  afterAll(async () => {
    clear()
    await rm(resolve(__dirname, '../data', id), { recursive: true, force: true })
    await rm(resolve(__dirname, '../tmp', id), { recursive: true, force: true })
  })

  it('should return all fields for a valid IP address', async ({ expect }) => {
    //* Ipv4 (Metro code)
    const result1 = await lookup('170.171.1.0')
    expect.soft(result1).not.toBeNull()
    expect.soft(result1).toEqual({
      area: 10,
      capital: 'Washington D.C.',
      city: 'New York',
      continent: 'NA',
      continent_name: 'North America',
      country: 'US',
      country_name: 'United States',
      country_native: 'United States',
      currency: [
        'USD',
        'USN',
        'USS',
      ],
      eu: undefined,
      languages: [
        'en',
      ],
      latitude: 40.7621,
      longitude: -73.9517,
      metro: 501,
      phone: [
        1,
      ],
      postcode: '10044',
      region1: 'NY',
      region1_name: 'New York',
      timezone: 'America/New_York',
    })

    //* Ipv4 (Region2)
    const result2 = await lookup('213.189.170.238')
    expect.soft(result2).not.toBeNull()
    expect.soft(result2).toEqual({
      area: 50,
      capital: 'Brussels',
      city: 'Charleroi',
      continent: 'EU',
      continent_name: 'Europe',
      country: 'BE',
      country_name: 'Belgium',
      country_native: 'België',
      currency: [
        'EUR',
      ],
      eu: true,
      languages: [
        'nl',
        'fr',
        'de',
      ],
      latitude: 50.4102,
      longitude: 4.4472,
      phone: [
        32,
      ],
      postcode: '6000',
      region1: 'WAL',
      region1_name: 'Wallonia',
      region2: 'WHT',
      region2_name: 'Hainaut Province',
      timezone: 'Europe/Brussels',
    })

    const postalCodesTest = [
      {
        ip: '45.67.84.0',
        postcode: 'EC1A',
      },
      {
        ip: '106.160.170.0',
        postcode: '402-0051',
      },
      {
        ip: '172.94.24.0',
        postcode: 'LV-1063',
      },
    ]

    for (const { ip, postcode } of postalCodesTest) {
      const result = await lookup(ip)
      expect.soft(result).not.toBeNull()
      expect.soft(result).toMatchObject({ postcode })
    }

    //* Ipv6
    const result4 = await lookup('2607:F8B0:4005:801::200E')
    expect.soft(result4).not.toBeNull()
    expect.soft(result4).toEqual({
      area: 1000,
      capital: 'Washington D.C.',
      continent: 'NA',
      continent_name: 'North America',
      country: 'US',
      country_name: 'United States',
      country_native: 'United States',
      currency: [
        'USD',
        'USN',
        'USS',
      ],
      eu: undefined,
      languages: [
        'en',
      ],
      latitude: 37.751,
      longitude: -97.822,
      phone: [
        1,
      ],
      timezone: 'America/Chicago',
    })

    //* Invalid IP address
    await expect.soft(lookup('invalid')).rejects.toThrowError('Invalid IPv4 address: invalid')

    //* Too high IP address
    await expect.soft(lookup('256.256.256.256')).resolves.toBeNull()

    //* Clear data
    clear()

    //* Ips should return null after data is cleared
    await expect.soft(lookup('8.8.8.8')).resolves.toBeNull()

    await expect.soft(lookup('2607:F8B0:4005:801::200E')).resolves.toBeNull()
  })
})
