import { describe, expect, it } from 'vitest'
import { binarySearch } from './binarySearch'

describe('binarySearch', () => {
  describe('uint32Array tests', () => {
    const uint32Array = new Uint32Array([1, 3, 5, 7, 9, 11, 13, 15])

    it('should find existing elements', () => {
      expect.soft(binarySearch(uint32Array, 1)).toBe(0)
      expect.soft(binarySearch(uint32Array, 7)).toBe(3)
      expect.soft(binarySearch(uint32Array, 15)).toBe(7)
    })

    it('should return insertion point for non-existing elements', () => {
      expect.soft(binarySearch(uint32Array, 4)).toBe(1)
      expect.soft(binarySearch(uint32Array, 10)).toBe(4)
      expect.soft(binarySearch(uint32Array, 16)).toBe(7)
    })

    it('should return null for elements smaller than all in the array', () => {
      expect.soft(binarySearch(uint32Array, 0)).toBe(null)
    })

    it('should work with an array of length 1', () => {
      const singleElementArray = new Uint32Array([5])
      expect.soft(binarySearch(singleElementArray, 5)).toBe(0)
      expect.soft(binarySearch(singleElementArray, 3)).toBe(null)
      expect.soft(binarySearch(singleElementArray, 7)).toBe(0)
    })

    it('should work with an empty array', () => {
      const emptyArray = new Uint32Array([])
      expect.soft(binarySearch(emptyArray, 5)).toBe(null)
    })
  })

  describe('bigUint64Array tests', () => {
    const bigUint64Array = new BigUint64Array([1n, 3n, 5n, 7n, 9n, 11n, 13n, 15n])

    it('should find existing elements', () => {
      expect.soft(binarySearch(bigUint64Array, 1n)).toBe(0)
      expect.soft(binarySearch(bigUint64Array, 7n)).toBe(3)
      expect.soft(binarySearch(bigUint64Array, 15n)).toBe(7)
    })

    it('should return insertion point for non-existing elements', () => {
      expect.soft(binarySearch(bigUint64Array, 4n)).toBe(1)
      expect.soft(binarySearch(bigUint64Array, 10n)).toBe(4)
      expect.soft(binarySearch(bigUint64Array, 16n)).toBe(7)
    })

    it('should return null for elements smaller than all in the array', () => {
      expect.soft(binarySearch(bigUint64Array, 0n)).toBe(null)
    })

    it('should work with an array of length 1', () => {
      const singleElementArray = new BigUint64Array([5n])
      expect.soft(binarySearch(singleElementArray, 5n)).toBe(0)
      expect.soft(binarySearch(singleElementArray, 3n)).toBe(null)
      expect.soft(binarySearch(singleElementArray, 7n)).toBe(0)
    })

    it('should work with an empty array', () => {
      const emptyArray = new BigUint64Array([])
      expect.soft(binarySearch(emptyArray, 5n)).toBe(null)
    })
  })

  describe('edge cases', () => {
    it('should handle the maximum possible Uint32 value', () => {
      const maxUint32Array = new Uint32Array([4294967295])
      expect.soft(binarySearch(maxUint32Array, 4294967295)).toBe(0)
    })

    it('should handle the maximum possible BigUint64 value', () => {
      const maxBigUint64Array = new BigUint64Array([18446744073709551615n])
      expect.soft(binarySearch(maxBigUint64Array, 18446744073709551615n)).toBe(0)
    })
  })
})
