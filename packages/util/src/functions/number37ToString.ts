export function number37ToString(number: number): string {
  let string = ''
  while (number > 0) {
    string = (number % 37 - 1).toString(36) + string
    number = Math.floor(number / 37)
  }
  return string.toUpperCase()
}
