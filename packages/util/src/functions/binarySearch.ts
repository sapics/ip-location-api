export function binarySearch(array: BigUint64Array | Uint32Array, target: number | bigint): number | null {
  let low = 0
  let high = array.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const midValue = array[mid]!

    if (target < midValue) {
      high = mid - 1
    }
    else if (target > midValue) {
      low = mid + 1
    }
    else {
      return mid
    }
  }

  return high >= 0 ? high : null
}
