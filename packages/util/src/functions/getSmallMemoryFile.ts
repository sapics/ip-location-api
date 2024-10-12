import type { LocalDatabase } from './getSettings.js'
import path from 'node:path'
import { getUnderscoreFill } from './getUnderscoreFill.js'

/**
 * Get the small memory file information for the given line number and database settings.
 * @param line - The line number in the database.
 * @param db - The database settings.
 * @param isTmp - Whether the file is temporary.
 * @returns An array containing the directory, file number, and line offset.
 */
export function getSmallMemoryFile(line: number, db: LocalDatabase, isTmp = false): [string, string, number] {
  const dbNumber = line / db.folderLineMax | 0
  const fileNumber = (line - dbNumber * db.folderLineMax) / db.fileLineMax | 0
  const lineOffset = line - dbNumber * db.folderLineMax - fileNumber * db.fileLineMax
  const dir = path.join(`v${db.version}${isTmp ? '-tmp' : ''}`, getUnderscoreFill(dbNumber.toString(36), 2))
  return [dir, getUnderscoreFill(fileNumber.toString(36), 2), lineOffset * db.recordSize]
}
