import { setup } from '@iplookup/util/browser'

const BaseLookup = setup<'geocode'>()

/**
 * Lookup geocode from IP address
 * @param ipInput - IP address to lookup
 * @returns country code, latitude and longitude. `null` if not found.
 */
export default async function IpLookup(ipInput: string): Promise<{
  /**
   * The approximate WGS84 latitude of the IP address
   *
   * @see https://en.wikipedia.org/wiki/World_Geodetic_System
   */
  latitude: number
  /**
   * The approximate WGS84 longitude of the IP address
   *
   * @see https://en.wikipedia.org/wiki/World_Geodetic_System
   */
  longitude: number
  /**
   * The country of the IP address
   * @example 'NL'
   * @see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
   */
  country: string
} | null> {
  return BaseLookup(ipInput)
}
