import { setup } from '@iplookup/util/browser'

const BaseLookup = setup<'country'>()

/**
 * Lookup country from IP address
 * @param ipInput - IP address to lookup
 * @returns country code. `null` if not found.
 */
export default async function IpLookup(ipInput: string): Promise<{
  /**
   * The country of the IP address
   * @example 'NL'
   * @see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
   */
  country: string
} | null> {
  return BaseLookup(ipInput)
}
