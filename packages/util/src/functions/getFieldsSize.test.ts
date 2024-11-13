import { describe, expect, it } from 'vitest'
import { getFieldsSize } from './getFieldsSize'

describe('getFieldsSize', () => {
  it('should calculate the correct size for a single field', () => {
    expect.soft(getFieldsSize(['postcode'])).toBe(5)
    expect.soft(getFieldsSize(['area'])).toBe(1)
    expect.soft(getFieldsSize(['latitude'])).toBe(4)
    expect.soft(getFieldsSize(['longitude'])).toBe(4)
    expect.soft(getFieldsSize(['city'])).toBe(4)
    expect.soft(getFieldsSize(['eu'])).toBe(0)
    expect.soft(getFieldsSize(['someOtherField'])).toBe(2)
  })

  it('should calculate the correct size for multiple fields', () => {
    expect.soft(getFieldsSize(['postcode', 'area', 'latitude'])).toBe(10)
    expect.soft(getFieldsSize(['city', 'longitude', 'eu'])).toBe(8)
    expect.soft(getFieldsSize(['area', 'someOtherField', 'postcode'])).toBe(8)
  })

  it('should return 0 for an empty array', () => {
    expect.soft(getFieldsSize([])).toBe(0)
  })

  it('should calculate the correct size for all possible fields', () => {
    expect.soft(getFieldsSize(['postcode', 'area', 'latitude', 'longitude', 'city', 'eu', 'someOtherField'])).toBe(20)
  })
})
