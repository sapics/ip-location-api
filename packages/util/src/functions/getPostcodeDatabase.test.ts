import { describe, expect, it } from 'vitest'
import { getPostcodeDatabase } from './getPostcodeDatabase'

describe('getPostcodeDatabase', () => {
  it('should return [0, 0] for empty input', () => {
    expect(getPostcodeDatabase('')).toEqual([0, 0])
  })

  describe('numeric postcodes', () => {
    it('should handle single-part numeric postcodes', () => {
      expect(getPostcodeDatabase('12345')).toEqual([5, 12345])
      expect(getPostcodeDatabase('123456789')).toEqual([9, 123456789])
    })

    it('should handle two-part numeric postcodes', () => {
      expect(getPostcodeDatabase('123-456')).toEqual([33, 123456])
      expect(getPostcodeDatabase('12 34')).toEqual([22, 1234])
      expect(getPostcodeDatabase('123456 789012')).toEqual([66, 123456789012])
    })
  })

  describe('string postcodes', () => {
    it('should handle single-part string postcodes (short)', () => {
      expect(getPostcodeDatabase('ABC123')).toEqual([-6, 623698779])
      expect(getPostcodeDatabase('XYZ999')).toEqual([-6, 2054135709])
    })

    it('should handle single-part string postcodes (long)', () => {
      expect(getPostcodeDatabase('ABCDEF123456')).toEqual([82, 41474266563513784])
      expect(getPostcodeDatabase('XYZXYZ999999')).toEqual([105, 127959823201186850])
    })

    it('should handle two-part string postcodes', () => {
      expect(getPostcodeDatabase('ABC-123')).toEqual([-33, 623698779])
      expect(getPostcodeDatabase('XY 9Z')).toEqual([-22, 1584071])
    })
  })

  it('should return [0, 0] for invalid postcodes', () => {
    expect(getPostcodeDatabase('ABC-123-XYZ')).toEqual([0, 0])
    expect(getPostcodeDatabase('!@#$%^')).toEqual([0, 0])
  })

  //* Edge cases
  it('should handle edge cases', () => {
    expect(getPostcodeDatabase('9'.repeat(9))).toEqual([9, 999999999])
    expect(getPostcodeDatabase('Z'.repeat(6))).toEqual([-6, 2176782335])
    expect(getPostcodeDatabase('A'.repeat(6))).toEqual([-6, 621937810])
  })
})
