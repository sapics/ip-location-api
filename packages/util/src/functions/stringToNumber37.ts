/**
 * Converts a string to a number using a base-37 encoding scheme.
 *
 * @param string - The input string to be converted
 * @returns The resulting number after conversion
 */
export function stringToNumber37(string: string): number {
  let number = 0
  for (const char of string) {
    //* Convert each character to a number (0-35) and add 1 to avoid collisions with 0
    //* Then multiply the current number by 37 and add the new value
    number = number * 37 + Number.parseInt(char, 36) + 1
  }
  return number
}
