import { describe, expect, it } from 'vitest'
import { countryCodeToNumber } from './countryCodeToNumber'

describe('countryCodeToNumber', () => {
  it('should convert "AA" to 0', () => {
    expect(countryCodeToNumber('AA')).toBe(0)
  })

  it('should convert "ZZ" to 675', () => {
    expect(countryCodeToNumber('ZZ')).toBe(675)
  })

  it('should convert "CA" to 52', () => {
    expect(countryCodeToNumber('CA')).toBe(52)
  })

  it('should convert "US" to 538', () => {
    expect(countryCodeToNumber('US')).toBe(538)
  })

  it('should throw an error for lowercase input', () => {
    expect(() => countryCodeToNumber('aa')).toThrow('Input must be a valid two-letter country code (A-Z)')
  })

  it('should throw an error for input with non-alphabetic characters', () => {
    expect(() => countryCodeToNumber('A1')).toThrow('Input must be a valid two-letter country code (A-Z)')
  })

  it('should throw an error for input with more than two characters', () => {
    expect(() => countryCodeToNumber('USA')).toThrow('Input must be a valid two-letter country code (A-Z)')
  })

  it('should throw an error for input with less than two characters', () => {
    expect(() => countryCodeToNumber('A')).toThrow('Input must be a valid two-letter country code (A-Z)')
  })

  it('should throw an error for empty input', () => {
    expect(() => countryCodeToNumber('')).toThrow('Input must be a valid two-letter country code (A-Z)')
  })
})
