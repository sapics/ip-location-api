import { getUnderscoreFill } from './getUnderscoreFill.js'

export function numberToDir(number: number) {
  return getUnderscoreFill(number.toString(36), 2)
}
