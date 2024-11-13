import { describe, expect, it } from 'vitest'
import { getPostcodeDatabase } from './getPostcodeDatabase'

describe('getPostcodeDatabase', () => {
  it('should return [0, 0] for empty input', () => {
    expect.soft(getPostcodeDatabase('')).toEqual([0, 0])
  })

  describe('numeric postcodes', () => {
    it('should handle single-part numeric postcodes', () => {
      expect.soft(getPostcodeDatabase('12345')).toEqual([5, 12345])
      expect.soft(getPostcodeDatabase('123456789')).toEqual([9, 123456789])
    })

    it('should handle two-part numeric postcodes', () => {
      expect.soft(getPostcodeDatabase('123-456')).toEqual([33, 123456])
      expect.soft(getPostcodeDatabase('12 34')).toEqual([22, 1234])
      expect.soft(getPostcodeDatabase('123456 789012')).toEqual([66, 123456789012])
    })
  })

  describe('string postcodes', () => {
    it('should handle single-part string postcodes (short)', () => {
      expect.soft(getPostcodeDatabase('ABC123')).toEqual([-6, 623698779])
      expect.soft(getPostcodeDatabase('XYZ999')).toEqual([-6, 2054135709])
    })

    it('should handle single-part string postcodes (long)', () => {
      expect.soft(getPostcodeDatabase('ABCDEF123456')).toEqual([82, 41474266563513784])
      expect.soft(getPostcodeDatabase('XYZXYZ999999')).toEqual([105, 127959823201186850])
    })

    it('should handle two-part string postcodes', () => {
      expect.soft(getPostcodeDatabase('ABC-123')).toEqual([-33, 623698779])
      expect.soft(getPostcodeDatabase('XY 9Z')).toEqual([-22, 1584071])
    })
  })

  it('should return [0, 0] for invalid postcodes', () => {
    expect.soft(getPostcodeDatabase('ABC-123-XYZ')).toEqual([0, 0])
    expect.soft(getPostcodeDatabase('!@#$%^')).toEqual([0, 0])
  })

  //* Edge cases
  it('should handle edge cases', () => {
    expect.soft(getPostcodeDatabase('9'.repeat(9))).toEqual([9, 999999999])
    expect.soft(getPostcodeDatabase('Z'.repeat(6))).toEqual([-6, 2176782335])
    expect.soft(getPostcodeDatabase('A'.repeat(6))).toEqual([-6, 621937810])
  })
})
