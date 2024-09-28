import { aton4 } from './aton4.js'
import { aton6 } from './aton6.js'

/**
 * Parses an IP address string and returns its details.
 * @param {string} ip - The IP address to parse.
 * @returns {{ version: 4 | 6, address: string, ip: number | bigint }} An object containing the IP version, original address, and numeric representation.
 *
 * @throws Will throw an error if the input is not a valid IP address
 */
export function parseIp(ip: string): {
  version: 4 | 6
  ip: number | bigint
} {
  if (ip.includes(':')) {
    if (ip.includes('.')) {
      //* Handle IPv4-mapped IPv6 addresses (e.g., ::ffff:192.0.2.1)
      ip = ip.split(':').pop()!
      return { version: 4, ip: aton4(ip) }
    }
    //* Handle regular IPv6 addresses
    return { version: 6, ip: aton6(ip) }
  }
  //* Handle IPv4 addresses
  return { version: 4, ip: aton4(ip) }
}
