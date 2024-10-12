import { describe, expect, expectTypeOf, it } from 'vitest'
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
})
