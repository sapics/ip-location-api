import { describe, expect, it } from 'vitest'
import { aton6 } from './aton6'

describe('aton6', () => {
  it('converts a full IPv6 address correctly', () => {
    expect.soft(aton6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(2306139570357600256n)
  })

  it('converts a shortened IPv6 address correctly', () => {
    expect.soft(aton6('2001:db8::1')).toBe(2306139568115548160n)
  })

  it('handles IPv6 address with double colons in the middle', () => {
    expect.soft(aton6('2001:db8::8a2e:370:7334')).toBe(2306139568115548160n)
  })

  it('handles IPv6 address with double colons at the end', () => {
    expect.soft(aton6('2001:db8:85a3::')).toBe(2306139570357600256n)
  })

  it('handles IPv6 address with leading zeros omitted', () => {
    expect.soft(aton6('2001:db8:1:2:3:4:5:6')).toBe(2306139568115613698n)
  })

  it('converts ::1 (localhost) correctly', () => {
    expect.soft(aton6('::1')).toBe(0n)
  })

  it('converts :: (unspecified address) correctly', () => {
    expect.soft(aton6('::')).toBe(0n)
  })

  it('handles IPv6 address with quotes', () => {
    expect.soft(aton6('"2001:db8::1"')).toBe(2306139568115548160n)
  })

  it('returns 0 for invalid IPv6 address', () => {
    expect.soft(aton6('invalid')).toBe(0n)
  })

  it('returns valid parts of IPv6 address with too many parts', () => {
    expect.soft(aton6('2001:db8:85a3:0000:0000:8a2e:0370:7334')).toBe(2306139570357600256n)
    expect.soft(aton6('2001:db8:85a3:0000:0000:8a2e:0370:7334:extra')).toBe(2306139570357600256n)
  })
})
