import type { IpLocationApiInputSettings, IpLocationApiSettings } from './functions/getSettings.js'
/* eslint-disable jsdoc/check-param-names */
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createDatabase } from './functions/database/createDatabase.js'
import { downloadAndExtractDatabase } from './functions/database/downloadAndExtractDatabase.js'
import { getSettings } from './functions/getSettings.js'

/**
 * Updates the GeoIP database based on the provided settings.
 * @param inputSettings - Partial settings to override the default ones.
 * @returns An array of extracted file names or false if no update was needed.
 */
export async function update(inputSettings?: Partial<IpLocationApiInputSettings>): Promise<false | string[]> {
  const settings = getSettings(inputSettings)
  await ensureDirectoriesExist(settings)
  const { files, dataType } = await downloadAndExtractDatabase(settings)
  if (!files)
    return false

  // TODO: Add debug log
  await createDatabase(files, settings, dataType)
  // TODO: Add debug log

  return files
}

/**
 * Ensures that the necessary directories exist.
 * @param param0 - Object containing fieldDir and tmpDataDir paths.
 */
async function ensureDirectoriesExist({ fieldDir, tmpDataDir }: IpLocationApiSettings): Promise<void> {
  for (const dir of [fieldDir, tmpDataDir]) {
    if (!existsSync(dir)) {
      // TODO: Add debug log to indicate that the directory is being created
      await mkdir(dir, { recursive: true })
    }
  }
}
