export function getUnderscoreFill(string: string, length: number) {
  if (string.length > length)
    return string
  return '_'.repeat(length - string.length) + string
};
