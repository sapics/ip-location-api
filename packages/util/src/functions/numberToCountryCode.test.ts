import { describe, expect, it } from 'vitest'
import { numberToCountryCode } from './numberToCountryCode'

describe('numberToCountryCode', () => {
  it('should convert 0 to "AA"', () => {
    expect.soft(numberToCountryCode(0)).toBe('AA')
  })

  it('should convert 675 to "ZZ"', () => {
    expect.soft(numberToCountryCode(675)).toBe('ZZ')
  })

  it('should convert 52 to "CA"', () => {
    expect.soft(numberToCountryCode(52)).toBe('CA')
  })

  it('should convert 538 to "US"', () => {
    expect.soft(numberToCountryCode(538)).toBe('US')
  })

  it('should convert 25 to "AZ"', () => {
    expect.soft(numberToCountryCode(25)).toBe('AZ')
  })

  it('should convert 26 to "BA"', () => {
    expect.soft(numberToCountryCode(26)).toBe('BA')
  })

  it('should throw an error for negative input', () => {
    expect.soft(() => numberToCountryCode(-1)).toThrow('Input number must be between 0 and 675')
  })

  it('should throw an error for input greater than 675', () => {
    expect.soft(() => numberToCountryCode(676)).toThrow('Input number must be between 0 and 675')
  })

  it('should throw an error for non-integer input', () => {
    expect.soft(() => numberToCountryCode(3.14)).toThrow('Input number must be between 0 and 675')
  })
})
