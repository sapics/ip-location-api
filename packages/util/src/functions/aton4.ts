/**
 * Convert an IPv4 string to a 32-bit integer
 * @param string - The IPv4 string to convert
 * @returns The 32-bit integer
 * @example
 * ```ts
 * aton4('192.168.1.1') // 3232235777
 * ```
 * @throws Will throw an error if the input is not a valid IPv4 address
 */
export function aton4(string: string): number {
  const parts = string.split(/\./) as [string, string, string, string]
  if (parts.length !== 4) {
    throw new Error(`Invalid IPv4 address: ${string}`)
  }

  //* Extract each octet and shift them to their correct position
  const [a, b, c, d] = parts
  const octet1 = Number.parseInt(a) << 24
  const octet2 = Number.parseInt(b) << 16
  const octet3 = Number.parseInt(c) << 8
  const octet4 = Number.parseInt(d)

  //* Combine the octets using bitwise OR and return the result
  return (octet1 | octet2 | octet3 | octet4) >>> 0
};
