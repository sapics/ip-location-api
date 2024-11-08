import { describe, expect, it } from 'vitest'
import { ntoa4 } from './ntoa4'

describe('ntoa4', () => {
  it('should convert 32-bit integers to valid IPv4 addresses', () => {
    expect.soft(ntoa4(3232235777)).toBe('192.168.1.1')
    expect.soft(ntoa4(167772161)).toBe('10.0.0.1')
    expect.soft(ntoa4(2886729729)).toBe('172.16.0.1')
    expect.soft(ntoa4(4294967295)).toBe('255.255.255.255')
    expect.soft(ntoa4(0)).toBe('0.0.0.0')
  })

  it('should handle edge cases', () => {
    expect.soft(ntoa4(2130706433)).toBe('127.0.0.1') //* Localhost
    expect.soft(ntoa4(4294967040)).toBe('255.255.255.0') //* Subnet mask
    expect.soft(ntoa4(16909060)).toBe('1.2.3.4')
  })

  it('should handle all zeros and all ones', () => {
    expect.soft(ntoa4(0)).toBe('0.0.0.0')
    expect.soft(ntoa4(4294967295)).toBe('255.255.255.255')
  })

  it('should throw an error for invalid 32-bit integers', () => {
    expect.soft(() => ntoa4(-1)).toThrow('Invalid 32-bit unsigned integer')
    expect.soft(() => ntoa4(4294967296)).toThrow('Invalid 32-bit unsigned integer')
  })
})
