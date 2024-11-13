/**
 * Pads a string with underscores to the left until it reaches the specified length.
 * If the input string is already longer than or equal to the specified length, it's returned unchanged.
 *
 * @param {string} string - The input string to pad.
 * @param {number} length - The desired total length of the resulting string.
 * @returns {string} The padded string or the original string if it's already long enough.
 */
export function getUnderscoreFill(string: string, length: number): string {
  if (string.length >= length)
    return string

  //* Calculate the number of underscores needed and add them to the left of the string
  return '_'.repeat(length - string.length) + string
};
