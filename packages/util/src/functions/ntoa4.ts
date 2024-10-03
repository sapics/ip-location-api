/**
 * Convert a 32-bit integer to an IPv4 string
 * @param num - The 32-bit integer to convert
 * @returns The IPv4 string
 * @example
 * ```ts
 * ntoa4(3232235777) // '192.168.1.1'
 * ```
 * @throws Will throw an error if the input is not a valid 32-bit unsigned integer
 */
export function ntoa4(num: number): string {
  if (!Number.isInteger(num) || num < 0 || num > 0xFFFFFFFF) {
    throw new Error('Invalid 32-bit unsigned integer')
  }

  //* Extract each octet using bitwise operations
  const octet1 = (num >>> 24) & 255
  const octet2 = (num >>> 16) & 255
  const octet3 = (num >>> 8) & 255
  const octet4 = num & 255

  //* Combine the octets into an IPv4 string
  return `${octet1}.${octet2}.${octet3}.${octet4}`
}
