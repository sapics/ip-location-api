import { log } from './log.js'

const isPostNumReg = /^\d+$/
const isPostNumReg2 = /^(\d+)[-\s](\d+)$/
const isPostStrReg = /^[A-Z\d]+$/
const isPostStrReg2 = /^([A-Z\d]+)[-\s]([A-Z\d]+)$/

/**
 * Converts a postcode string into a tuple of two numbers for database storage.
 * The first number represents the format, and the second number represents the postcode value.
 *
 * @param postcode - The input postcode string
 * @returns A tuple [format, value] where:
 *   - format is positive for numeric postcodes, negative for string postcodes
 *   - value is the numeric representation of the postcode
 */
export function getPostcodeDatabase(postcode: string): [number, number] {
  if (!postcode)
    return [0, 0]

  //* Numeric postcode handling
  if (isPostNumReg.test(postcode)) {
    return [
      postcode.length, //* Format: 1~9 (length of the numeric postcode)
      Number.parseInt(postcode, 10), //* Value: 0~999999999
    ]
  }

  const numericMatch = isPostNumReg2.exec(postcode)
  if (numericMatch) {
    const [, part1, part2] = numericMatch as unknown as [string, string, string]
    return [
      Number.parseInt(`${part1.length}${part2.length}`, 10), //* Format: 11~66 (lengths of two parts)
      Number.parseInt(part1 + part2, 10), //* Value: 0~999999999
    ]
  }

  //* String postcode handling
  const stringMatch = isPostStrReg.exec(postcode)
  if (stringMatch) {
    const num = Number.parseInt(postcode, 36)
    if (num < 2 ** 32) {
      return [
        -postcode.length, //* Format: -1~-9 (negative length of the string postcode)
        num, //* Value: base 36 representation
      ]
    }
    else {
      return [
        Number.parseInt(`2${postcode.slice(0, 1)}`, 36), //* Format: 72~107 (special encoding for long postcodes)
        Number.parseInt(postcode.slice(1), 36), //* Value: 0~2176782335 (base 36, max 6 chars)
      ]
    }
  }

  const stringMatch2 = isPostStrReg2.exec(postcode)
  if (!stringMatch2) {
    log('warn', `Invalid postcode ${postcode}`)
    return [0, 0] //* Invalid postcode
  }

  const [, part1, part2] = stringMatch2 as unknown as [string, string, string]
  return [
    -Number.parseInt(`${part1.length}${part2.length}`, 10), //* Format: -11~-55 (negative sum of part lengths)
    Number.parseInt(part1 + part2, 36), //* Value: 0~2176782335 (base 36, max 6 chars)
  ]
}
