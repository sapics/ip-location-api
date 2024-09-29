import { getUnderscoreFill } from './getUnderscoreFill.js'

/**
 * Converts a number to a two-character directory name.
 *
 * @param {number} number - The number to convert.
 * @returns {string} A two-character string representation of the number.
 */
export function numberToDir(number: number): string {
  //* Convert number to base 36 and pad with underscores to ensure 2 characters
  return getUnderscoreFill(number.toString(36), 2)
}
