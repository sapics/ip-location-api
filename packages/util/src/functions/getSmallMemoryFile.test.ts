import type { LocalDatabase } from './getSettings.js'
import { describe, expect, it } from 'vitest'
import { getSmallMemoryFile } from './getSmallMemoryFile'

describe('getSmallMemoryFile', () => {
  const mockDb: LocalDatabase = {
    version: 4,
    folderLineMax: 1000,
    fileLineMax: 100,
    recordSize: 10,
  }

  it('should return correct values for the first line', () => {
    const result = getSmallMemoryFile(0, mockDb)
    expect.soft(result).toEqual(['v4/_0', '_0', 0])
  })

  it('should return correct values for a line within the first file', () => {
    const result = getSmallMemoryFile(50, mockDb)
    expect.soft(result).toEqual(['v4/_0', '_0', 500])
  })

  it('should return correct values for the first line of the second file', () => {
    const result = getSmallMemoryFile(100, mockDb)
    expect.soft(result).toEqual(['v4/_0', '_1', 0])
  })

  it('should return correct values for a line in a different folder', () => {
    const result = getSmallMemoryFile(1500, mockDb)
    expect.soft(result).toEqual(['v4/_1', '_5', 0])
  })

  it('should handle temporary files correctly', () => {
    const result = getSmallMemoryFile(2000, mockDb, true)
    expect.soft(result).toEqual(['v4-tmp/_2', '_0', 0])
  })

  it('should handle large line numbers correctly', () => {
    const result = getSmallMemoryFile(10000, mockDb)
    expect.soft(result).toEqual(['v4/_a', '_0', 0])
  })

  it('should use base 36 for folder and file numbers', () => {
    const result = getSmallMemoryFile(50000, mockDb)
    expect.soft(result).toEqual(['v4/1e', '_0', 0])
  })

  it('should calculate correct line offset', () => {
    const result = getSmallMemoryFile(12345, mockDb)
    expect.soft(result).toEqual(['v4/_c', '_3', 450])
  })

  it('should work with different database configurations', () => {
    const customDb: LocalDatabase = {
      version: 6,
      folderLineMax: 5000,
      fileLineMax: 500,
      recordSize: 20,
    }
    const result = getSmallMemoryFile(7777, customDb)
    expect.soft(result).toEqual(['v6/_1', '_5', 5540])
  })
})
