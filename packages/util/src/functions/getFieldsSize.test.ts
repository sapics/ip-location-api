import { describe, expect, it } from 'vitest'
import { getFieldsSize } from './getFieldsSize'

describe('getFieldsSize', () => {
  it('should calculate the correct size for a single field', () => {
    expect(getFieldsSize(['postcode'])).toBe(5)
    expect(getFieldsSize(['area'])).toBe(1)
    expect(getFieldsSize(['latitude'])).toBe(4)
    expect(getFieldsSize(['longitude'])).toBe(4)
    expect(getFieldsSize(['city'])).toBe(4)
    expect(getFieldsSize(['eu'])).toBe(0)
    expect(getFieldsSize(['someOtherField'])).toBe(2)
  })

  it('should calculate the correct size for multiple fields', () => {
    expect(getFieldsSize(['postcode', 'area', 'latitude'])).toBe(10)
    expect(getFieldsSize(['city', 'longitude', 'eu'])).toBe(8)
    expect(getFieldsSize(['area', 'someOtherField', 'postcode'])).toBe(8)
  })

  it('should return 0 for an empty array', () => {
    expect(getFieldsSize([])).toBe(0)
  })

  it('should calculate the correct size for all possible fields', () => {
    expect(getFieldsSize(['postcode', 'area', 'latitude', 'longitude', 'city', 'eu', 'someOtherField'])).toBe(20)
  })
})
