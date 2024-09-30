import { describe, expect, it } from 'vitest'
import { numberToCountryCode } from './numberToCountryCode'

describe('numberToCountryCode', () => {
  it('should convert 0 to "AA"', () => {
    expect(numberToCountryCode(0)).toBe('AA')
  })

  it('should convert 675 to "ZZ"', () => {
    expect(numberToCountryCode(675)).toBe('ZZ')
  })

  it('should convert 52 to "CA"', () => {
    expect(numberToCountryCode(52)).toBe('CA')
  })

  it('should convert 538 to "US"', () => {
    expect(numberToCountryCode(538)).toBe('US')
  })

  it('should convert 25 to "AZ"', () => {
    expect(numberToCountryCode(25)).toBe('AZ')
  })

  it('should convert 26 to "BA"', () => {
    expect(numberToCountryCode(26)).toBe('BA')
  })

  it('should throw an error for negative input', () => {
    expect(() => numberToCountryCode(-1)).toThrow('Input number must be between 0 and 675')
  })

  it('should throw an error for input greater than 675', () => {
    expect(() => numberToCountryCode(676)).toThrow('Input number must be between 0 and 675')
  })

  it('should throw an error for non-integer input', () => {
    expect(() => numberToCountryCode(3.14)).toThrow('Input number must be between 0 and 675')
  })
})
