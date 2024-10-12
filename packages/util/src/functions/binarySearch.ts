/**
 * Performs a binary search on a sorted array of BigUint64 or Uint32 values.
 *
 * @param array - The sorted array to search in (BigUint64Array or Uint32Array).
 * @param target - The value to search for (number or bigint).
 * @returns The index of the target if found, or the index where it would be inserted if not found.
 *          Returns null if the target is smaller than all elements in the array.
 */
export function binarySearch(array: BigUint64Array | Uint32Array, target: number | bigint): number | null {
  let low = 0
  let high = array.length - 1

  while (low <= high) {
    //* Bitwise right shift by 1 is equivalent to Math.floor((low + high) / 2)
    const mid = (low + high) >> 1
    const midValue = array[mid]!

    if (target < midValue) {
      high = mid - 1
    }
    else if (target > midValue) {
      low = mid + 1
    }
    else {
      return mid //* Target found
    }
  }

  //* If target not found, return the insertion point or null if smaller than all elements
  return high >= 0 ? high : null
}
