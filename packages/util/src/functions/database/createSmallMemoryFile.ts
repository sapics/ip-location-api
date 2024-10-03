import type { IpLocationApiSettings } from '../getSettings.js'
import { Buffer } from 'node:buffer'
import { createWriteStream, existsSync, mkdirSync, writeFile, type WriteStream } from 'node:fs'
import path from 'node:path'
import { getSmallMemoryFile } from '../getSmallMemoryFile.js'

/**
 * Creates or appends to a small memory file for IP location data.
 * @param writeStream - The current write stream, if any
 * @param version - IP version (4 or 6)
 * @param lineCount - Number of lines processed
 * @param buffer2 - First buffer to write
 * @param buffer3 - Second buffer to write
 * @param settings - IP location API settings
 * @returns The write stream if the operation is not complete, undefined otherwise
 */
export function createSmallMemoryFile(
  writeStream: WriteStream,
  version: 4 | 6,
  lineCount: number,
  buffer2: Buffer,
  buffer3: Buffer,
  settings: IpLocationApiSettings,
) {
  //* Get file path and offset based on line count and IP version
  const [_dir, file, offset] = getSmallMemoryFile(lineCount, version === 4 ? settings.v4 : settings.v6, true)

  if (offset === 0) {
    //* We're starting a new file
    const dir = path.join(settings.fieldDir, _dir)

    //* Close the previous write stream if it exists
    if (writeStream)
      writeStream.end()

    //* Create directory if it doesn't exist (only for the first file)
    if (file === '_0' && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    //* If the total buffer size is smaller than or equal to the small memory file size,
    //* write it all at once and return
    if (settings.smallMemoryFileSize <= buffer2.length + buffer3.length) {
      const buf = Buffer.alloc(buffer2.length + buffer3.length)
      buffer2.copy(buf)
      buffer3.copy(buf, buffer2.length)
      writeFile(path.join(dir, file), buf, () => {})
      return
    }

    //* Create a new write stream for the file
    writeStream = createWriteStream(path.join(dir, file))
  }

  //* Write both buffers to the stream
  writeStream.write(buffer2)
  writeStream.write(buffer3)

  //* Return the write stream for future use
  return writeStream
}
