import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import IpLookup from './index'

describe('ipLookup', () => {
  it('should export the IpLookup function', () => {
    expect.soft(IpLookup).toBeDefined()
    expect.soft(typeof IpLookup).toBe('function')
    expectTypeOf(IpLookup).toEqualTypeOf<(ipInput: string) => Promise<{
      latitude: number
      longitude: number
      country: string
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
    expect.soft(result).not.toBeNull()
    expect.soft(result).toEqual({
      country: 'US',
      latitude: 38.9072,
      longitude: -77.0369,
    })

    const result2 = await IpLookup('2607:F8B0:4005:801::200E')
    expect.soft(result2).not.toBeNull()
    expect.soft(result2).toEqual({
      country: 'US',
      latitude: 37.422,
      longitude: -122.084,
    })

    await expect.soft(IpLookup('invalid')).rejects.toThrow('Invalid IPv4 address: invalid')
    await expect.soft(IpLookup('0000:0000:0000:0000:0000:0000:0000:0000')).resolves.toBeNull()
  })
})
