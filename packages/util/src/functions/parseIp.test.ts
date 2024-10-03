import { describe, expect, it } from 'vitest'
import { parseIp } from './parseIp'

describe('parseIp', () => {
  it('should correctly parse IPv4 addresses', () => {
    const result = parseIp('192.168.0.1')
    expect(result).toEqual({ version: 4, ip: 3232235521 })
  })

  it('should correctly parse IPv6 addresses', () => {
    const result = parseIp('2001:db8::1')
    expect(result).toEqual({ version: 6, ip: 2306139568115548160n })
  })

  it('should correctly parse IPv4-mapped IPv6 addresses', () => {
    const result = parseIp('::ffff:192.0.2.1')
    expect(result).toEqual({ version: 4, ip: 3221225985 })
  })

  it('should throw an error for invalid IP addresses', () => {
    expect(() => parseIp('invalid')).toThrow()
  })

  it('should handle edge cases for IPv4', () => {
    expect(parseIp('0.0.0.0')).toEqual({ version: 4, ip: 0 })
    expect(parseIp('255.255.255.255')).toEqual({ version: 4, ip: 4294967295 })
  })

  it('should handle edge cases for IPv6', () => {
    expect(parseIp('::')).toEqual({ version: 6, ip: 0n })
    expect(parseIp('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toEqual({
      version: 6,
      ip: 18446744073709551615n,
    })
  })

  it('should handle compressed IPv6 addresses', () => {
    expect(parseIp('2001:db8::')).toEqual({
      version: 6,
      ip: 2306139568115548160n,
    })
    expect(parseIp('::1')).toEqual({ version: 6, ip: 0n })
  })
})
