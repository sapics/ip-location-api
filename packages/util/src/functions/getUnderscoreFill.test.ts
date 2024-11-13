import { describe, expect, it } from 'vitest'
import { getUnderscoreFill } from './getUnderscoreFill'

describe('getUnderscoreFill', () => {
  it('should pad the string with underscores to the left', () => {
    expect.soft(getUnderscoreFill('test', 8)).toBe('____test')
  })

  it('should return the original string if it is already longer than the specified length', () => {
    expect.soft(getUnderscoreFill('longstring', 5)).toBe('longstring')
  })

  it('should return the original string if it is equal to the specified length', () => {
    expect.soft(getUnderscoreFill('equal', 5)).toBe('equal')
  })

  it('should handle empty string input', () => {
    expect.soft(getUnderscoreFill('', 3)).toBe('___')
  })

  it('should handle length of 0', () => {
    expect.soft(getUnderscoreFill('test', 0)).toBe('test')
  })

  it('should handle very long padding', () => {
    expect.soft(getUnderscoreFill('x', 100)).toBe(`${'_'.repeat(99)}x`)
  })
})
