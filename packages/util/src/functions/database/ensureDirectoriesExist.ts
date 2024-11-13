import type { IpLocationApiSettings } from '../getSettings.js'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { log } from '../log.js'

/**
 * Ensures that the necessary directories exist.
 * @param param0 - Object containing fieldDir and tmpDataDir paths.
 * @param param0.fieldDir - The path to the field directory.
 * @param param0.tmpDataDir - The path to the temporary data directory.
 */
export async function ensureDirectoriesExist({ fieldDir, tmpDataDir }: IpLocationApiSettings): Promise<void> {
  for (const dir of [fieldDir, tmpDataDir]) {
    if (!existsSync(dir)) {
      log('info', `Creating directory ${dir}`)
      await mkdir(dir, { recursive: true })
    }
  }
}
