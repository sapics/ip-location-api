import { describe, expect, it } from 'vitest'
import { stringToNumber37 } from './stringToNumber37'

describe('stringToNumber37', () => {
  it('should convert empty string to 0', () => {
    expect.soft(stringToNumber37('')).toBe(0)
  })

  it('should convert single character strings correctly', () => {
    expect.soft(stringToNumber37('a')).toBe(11)
    expect.soft(stringToNumber37('z')).toBe(36)
    expect.soft(stringToNumber37('0')).toBe(1)
    expect.soft(stringToNumber37('9')).toBe(10)
  })

  it('should convert multi-character strings correctly', () => {
    expect.soft(stringToNumber37('abc')).toBe(15516)
    expect.soft(stringToNumber37('123')).toBe(2853)
    expect.soft(stringToNumber37('xyz')).toBe(47877)
  })

  it('should handle uppercase and lowercase letters', () => {
    expect.soft(stringToNumber37('ABC')).toBe(15516)
    expect.soft(stringToNumber37('XYZ')).toBe(47877)
  })

  it('should handle mixed alphanumeric strings', () => {
    expect.soft(stringToNumber37('a1b2c3')).toBe(767144277)
    expect.soft(stringToNumber37('1a2b3c')).toBe(159472233)
  })

  it('should produce different results for different strings', () => {
    const result1 = stringToNumber37('hello')
    const result2 = stringToNumber37('world')
    expect.soft(result1).not.toBe(result2)
  })

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(1000)
    expect.soft(() => stringToNumber37(longString)).not.toThrow()
  })
})
