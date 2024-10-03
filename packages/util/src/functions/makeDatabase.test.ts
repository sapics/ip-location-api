import { describe, expect, it } from 'vitest'
import { makeDatabase } from './makeDatabase'

describe('makeDatabase', () => {
  it('should create a new entry in an empty database', () => {
    const database: Record<string, number> = {}
    const result = makeDatabase('test', database)
    expect(result).toBe(0)
    expect(database).toEqual({ test: 0 })
  })

  it('should create a new entry in a non-empty database', () => {
    const database: Record<string, number> = { existing: 0 }
    const result = makeDatabase('test', database)
    expect(result).toBe(1)
    expect(database).toEqual({ existing: 0, test: 1 })
  })

  it('should retrieve an existing entry', () => {
    const database: Record<string, number> = { existing: 0 }
    const result = makeDatabase('existing', database)
    expect(result).toBe(0)
    expect(database).toEqual({ existing: 0 })
  })

  it('should handle multiple entries correctly', () => {
    const database: Record<string, number> = {}
    expect(makeDatabase('first', database)).toBe(0)
    expect(makeDatabase('second', database)).toBe(1)
    expect(makeDatabase('third', database)).toBe(2)
    expect(makeDatabase('first', database)).toBe(0)
    expect(database).toEqual({ first: 0, second: 1, third: 2 })
  })

  it('should work with non-string keys', () => {
    const database: Record<string, number> = {}
    expect(makeDatabase('123', database)).toBe(0)
    expect(makeDatabase('true', database)).toBe(1)
    expect(database).toEqual({ 123: 0, true: 1 })
  })
})
