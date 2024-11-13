import { setup } from '@iplookup/util/browser'
import { countries } from 'countries-list'

const BaseLookup = setup<'geocode'>()

/**
 * Lookup geocode from IP address
 * @param ipInput - IP address to lookup
 * @returns latitude, longitude, country code, country name, country native name, continent, capital, phone, currency and languages. `null` if not found.
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
  /**
   * The name of the country of the IP address (In English)
   * @example 'Netherlands'
   */
  country_name: string
  /**
   * The name of the country of the IP address (In the native language of the country)
   * @example 'Nederland'
   */
  country_native: string
  /**
   * The continent of the IP address (alpha-2 code)
   * @example 'EU'
   */
  continent: string
  /**
   * The capital of the country of the IP address (In English)
   * @example 'Amsterdam'
   */
  capital: string
  /**
   * The phone codes of the country of the IP address
   * @example ['31']
   */
  phone: number[]
  /**
   * The currency of the country of the IP address
   * @example ['EUR']
   */
  currency: string[]
  /**
   * The languages of the country of the IP address
   * @example ['nl']
   */
  languages: string[]
} | null> {
  const result = await BaseLookup(ipInput)
  if (!result)
    return null

  const country = countries[result.country as keyof typeof countries]
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    country_name: country.name,
    country_native: country.native,
    continent: country.continent,
    capital: country.capital,
    phone: country.phone,
    currency: country.currency,
    languages: country.languages,
  }
}
