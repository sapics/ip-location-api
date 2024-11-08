import { describe, expect, it } from 'vitest'
import { numberToDir } from './numberToDir'

describe('numberToDir', () => {
  it('converts single-digit numbers to padded strings', () => {
    expect.soft(numberToDir(0)).toBe('_0')
    expect.soft(numberToDir(9)).toBe('_9')
  })

  it('converts double-digit numbers to base 36 strings', () => {
    expect.soft(numberToDir(10)).toBe('_a')
    expect.soft(numberToDir(35)).toBe('_z')
  })

  it('converts numbers greater than 35 to base 36 strings', () => {
    expect.soft(numberToDir(36)).toBe('10')
    expect.soft(numberToDir(61)).toBe('1p')
    expect.soft(numberToDir(1295)).toBe('zz')
  })

  it('handles large numbers', () => {
    expect.soft(numberToDir(1296)).toBe('100')
    expect.soft(numberToDir(46655)).toBe('zzz')
    expect.soft(numberToDir(46656)).toBe('1000')
  })

  it('handles the maximum safe integer', () => {
    expect.soft(numberToDir(Number.MAX_SAFE_INTEGER)).toBe('2gosa7pa2gv')
  })

  it('throws an error for negative numbers', () => {
    expect.soft(() => numberToDir(-1)).toThrow()
  })

  it('throws an error for non-integer numbers', () => {
    expect.soft(() => numberToDir(3.14)).toThrow()
  })
})
