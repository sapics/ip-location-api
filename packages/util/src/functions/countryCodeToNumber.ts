/**
 * Converts a two-letter country code to a unique number.
 * @param code - A two-letter country code (e.g., 'AA', 'AB', ..., 'ZZ').
 * @returns A number representing the country code (0-675).
 * @throws {Error} If the input code is not a valid two-letter code.
 */
export function countryCodeToNumber(code: string): number {
  if (!/^[A-Z]{2}$/.test(code)) {
    throw new Error('Input must be a valid two-letter country code (A-Z)')
  }

  //* Convert two-letter code to number using ASCII values
  //* First letter: A-Z (65-90), Second letter: A-Z (65-90)
  return (code.charCodeAt(0) - 65) * 26 + (code.charCodeAt(1) - 65)
}
