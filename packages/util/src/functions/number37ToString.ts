/**
 * Converts a number to a base-37 string representation.
 *
 * @param number - The number to convert.
 * @returns The base-37 string representation of the input number.
 */
export function number37ToString(number: number): string {
  let string = ''
  while (number > 0) {
    //* Subtract 1 from the remainder to handle the range 0-36
    //* Convert to base-36 string (0-9, then A-Z)
    string = (number % 37 - 1).toString(36) + string
    //* Integer division by 37 for the next iteration
    number = Math.floor(number / 37)
  }
  //* Convert the result to uppercase
  return string.toUpperCase()
}
