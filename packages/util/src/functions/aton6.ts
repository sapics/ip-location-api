/**
 * Convert an IPv6 string to a 128-bit BigInt
 * @param ipv6String - The IPv6 string to convert
 * @returns The 128-bit BigInt representation
 * @example
 * ```ts
 * aton6('2001:db8::1') // 2306139568115548160n
 * ```
 */
export function aton6(ipv6String: string): bigint {
  const parts = ipv6String.replace(/"/g, '').split(/:/)

  const length = parts.length - 1
  if (parts[length] === '')
    parts[length] = '0'
  if (length < 7) {
    const omitted = 8 - parts.length
    const omitStart = parts.indexOf('')
    const omitEnd = omitStart + omitted
    for (let i = 7; i >= omitStart; i--) {
      parts[i] = i > omitEnd ? parts[i - omitted]! : '0'
    }
  }

  let result = 0n
  for (let i = 0; i < 4; i++) {
    const part = parts[i]
    if (part) {
      result += BigInt(Number.parseInt(part, 16)) << BigInt(16 * (3 - i))
    }
  }
  return result
}
