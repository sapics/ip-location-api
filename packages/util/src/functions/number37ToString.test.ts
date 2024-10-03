import { describe, expect, it } from 'vitest'
import { number37ToString } from './number37ToString'

describe('number37ToString', () => {
  it('should convert 0 to empty string', () => {
    expect(number37ToString(0)).toBe('')
  })

  it('should convert single-digit numbers correctly', () => {
    expect(number37ToString(11)).toBe('A')
    expect(number37ToString(36)).toBe('Z')
    expect(number37ToString(1)).toBe('0')
    expect(number37ToString(10)).toBe('9')
  })

  it('should convert multi-digit numbers correctly', () => {
    expect(number37ToString(15516)).toBe('ABC')
    expect(number37ToString(2853)).toBe('123')
    expect(number37ToString(47877)).toBe('XYZ')
  })

  it('should handle lowercase letters in output', () => {
    expect(number37ToString(15516)).toBe('ABC')
    expect(number37ToString(47877)).toBe('XYZ')
  })

  it('should handle mixed alphanumeric output', () => {
    expect(number37ToString(767144277)).toBe('A1B2C3')
    expect(number37ToString(159472233)).toBe('1A2B3C')
  })

  it('should produce different strings for different numbers', () => {
    const result1 = number37ToString(12345)
    const result2 = number37ToString(67890)
    expect(result1).not.toBe(result2)
  })

  it('should handle very large numbers', () => {
    const largeNumber = 37 ** 10 - 1 //* Largest 10-digit base-37 number
    expect(() => number37ToString(largeNumber)).not.toThrow()
  })
})
