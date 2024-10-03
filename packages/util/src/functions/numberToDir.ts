import { getUnderscoreFill } from './getUnderscoreFill.js'

/**
 * Converts a number to a two-character directory name.
 *
 * @param {number} number - The number to convert.
 * @returns {string} A two-character string representation of the number.
 * @throws {Error} If the input is negative or not an integer.
 */
export function numberToDir(number: number): string {
  if (number < 0 || !Number.isInteger(number)) {
    throw new Error('Input must be a non-negative integer')
  }
  //* Convert number to base 36 and pad with underscores to ensure at least 2 characters
  return getUnderscoreFill(number.toString(36), 2)
}
