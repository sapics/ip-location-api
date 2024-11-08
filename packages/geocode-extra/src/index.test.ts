import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import IpLookup from './index'

describe('ipLookup', () => {
  it('should export the IpLookup function', () => {
    expect(IpLookup).toBeDefined()
    expect(typeof IpLookup).toBe('function')
    expectTypeOf(IpLookup).toEqualTypeOf<(ipInput: string) => Promise<{
      latitude: number
      longitude: number
      country: string
      country_name: string
      country_native: string
      continent: string
      capital: string
      phone: number[]
      currency: string[]
      languages: string[]
    } | null>>()
  })

  it('should return the correct geocode', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: URL) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
        arrayBuffer: async () => {
          const data = await readFile(resolve(__dirname, `../indexes${url.pathname.split('indexes')[1]}`))
          return data.buffer
        },
      })
    })
    const result = await IpLookup('207.97.227.239')
    expect(result).not.toBeNull()
    expect(result).toEqual({
      country: 'US',
      country_name: 'United States',
      country_native: 'United States',
      continent: 'NA',
      capital: 'Washington D.C.',
      phone: [1],
      currency: [
        'USD',
        'USN',
        'USS',
      ],
      languages: ['en'],
    })

    const result2 = await IpLookup('2607:F8B0:4005:801::200E')
    expect(result2).not.toBeNull()
    expect(result2).toEqual({
      country: 'US',
      country_name: 'United States',
      country_native: 'United States',
      continent: 'NA',
      capital: 'Washington D.C.',
      phone: [1],
      currency: [
        'USD',
        'USN',
        'USS',
      ],
      languages: ['en'],
    })

    await expect(IpLookup('invalid')).rejects.toThrow('Invalid IPv4 address: invalid')
  })
})
