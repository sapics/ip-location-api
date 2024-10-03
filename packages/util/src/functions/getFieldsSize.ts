/**
 * Calculates the total size required for a set of fields.
 *
 * @param {string[]} fields - An array of field names to calculate the size for.
 * @returns {number} The total size required for all fields.
 */
export function getFieldsSize(fields: string[]): number {
  let size = 0

  for (const field of fields) {
    switch (field) {
      case 'postcode':
        size += 5
        break
      case 'area':
        size += 1
        break
      case 'latitude':
      case 'longitude':
      case 'city':
        size += 4
        break
      case 'eu':
        break
      default:
        size += 2
        break
    }
  }

  return size
}
