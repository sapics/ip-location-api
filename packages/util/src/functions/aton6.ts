/**
 * Convert an IPv6 string to a 128-bit BigInt
 * @param string - The IPv6 string to convert
 * @returns The 128-bit BigInt representation
 * @example
 * ```ts
 * aton6('2001:db8::1') // 42540766411282592856903984951653826561n
 * ```
 * @throws Will throw an error if the input is not a valid IPv6 address
 */
export function aton6(string: string): bigint {
  //* Split the IPv6 address into its parts
  const parts = string.split(':')
  if (parts.length > 8) {
    throw new Error(`Invalid IPv6 address: ${string}`)
  }

  //* Handle the :: notation for zero compression
  const doubleColonIndex = parts.indexOf('')
  if (doubleColonIndex !== -1) {
    const zerosToAdd = 8 - parts.length + 1
    parts.splice(doubleColonIndex, 1, ...Array.from<string>({ length: zerosToAdd }).fill('0'))
  }

  //* Ensure we have exactly 8 parts
  if (parts.length !== 8) {
    throw new Error(`Invalid IPv6 address: ${string}`)
  }

  //* Convert each part to a 16-bit number and combine into a BigInt
  let result = 0n
  for (const part of parts) {
    result = (result << 16n) | BigInt(Number.parseInt(part || '0', 16))
  }

  return result
}
