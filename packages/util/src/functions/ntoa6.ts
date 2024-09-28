/**
 * Convert a 128-bit BigInt to an IPv6 string
 * @param num - The 128-bit BigInt to convert
 * @returns The IPv6 string
 * @example
 * ```ts
 * ntoa6(42540766411282592856903984951653826561n) // '2001:db8::1'
 * ```
 * @throws Will throw an error if the input is not a valid 128-bit unsigned BigInt
 */
export function ntoa6(num: bigint): string {
  if (num < 0n || num > 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn) {
    throw new Error('Invalid 128-bit unsigned BigInt')
  }

  //* Extract each 16-bit group
  const groups: string[] = []
  for (let i = 0; i < 8; i++) {
    const group = ((num >> BigInt(112 - i * 16)) & 0xFFFFn).toString(16)
    groups.push(group)
  }

  //* Compress consecutive zero groups
  const compressedGroups = groups.join(':').replace(/(?:^|:)0(?::0)+(?:$|:)/, '::')

  return compressedGroups
}
