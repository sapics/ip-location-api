/**
 * Converts a number to a two-letter country code.
 * @param num - A number representing the country code (0-675).
 * @returns A two-letter country code (e.g., 'AA', 'AB', ..., 'ZZ').
 * @throws {Error} If the input number is out of range.
 */
export function numberToCountryCode(num: number): string {
  if (num < 0 || num > 675 || !Number.isInteger(num)) {
    throw new Error('Input number must be between 0 and 675')
  }

  //* Convert number to two-letter code using ASCII values
  //* First letter: A-Z (65-90), Second letter: A-Z (65-90)
  return String.fromCharCode((num / 26 | 0) + 65, num % 26 + 65)
}
