import type { IpLocationApiInputSettings, IpLocationApiSettings } from './functions/getSettings.js'
/* eslint-disable jsdoc/check-param-names */
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { DATABASE_SUFFIX_SHA } from './constants.js'
import { createDatabase } from './functions/database/createDatabase.js'
import { downloadAndExtractDatabase } from './functions/database/downloadAndExtractDatabase.js'
import { getSettings } from './functions/getSettings.js'

/**
 * Updates the GeoIP database based on the provided settings.
 * @param inputSettings - Partial settings to override the default ones.
 * @returns An array of extracted file names or false if no update was needed.
 */
export async function update(inputSettings?: Partial<IpLocationApiInputSettings>): Promise<void> {
  const settings = getSettings(inputSettings)
  await ensureDirectoriesExist(settings)
  const { files, sha256 } = await downloadAndExtractDatabase(settings)
  if (!files)
    return

  // TODO: Add debug log
  await createDatabase(files, settings)
  // TODO: Add debug log

  //* Save the sha256 hash of the database
  await writeFile(path.join(settings.fieldDir, `${settings.series}-${settings.dataType}-CSV${DATABASE_SUFFIX_SHA}`), sha256)

  //* Rename the temporary files to the correct name
  const tmpFiles = (await readdir(settings.fieldDir)).filter(file => file.endsWith('.tmp'))
  for (const file of tmpFiles) {
    await rename(path.join(settings.fieldDir, file), path.join(settings.fieldDir, file.replace('.tmp', '')))
  }

  if (settings.smallMemory) {
    //* Copy the temporary files to the correct name
    await cp(path.join(settings.fieldDir, 'v4-tmp'), path.join(settings.fieldDir, 'v4'), { recursive: true, force: true })
    await cp(path.join(settings.fieldDir, 'v6-tmp'), path.join(settings.fieldDir, 'v6'), { recursive: true, force: true })
    //* Remove the temporary files
    await rm(path.join(settings.fieldDir, 'v4-tmp'), { recursive: true, force: true, maxRetries: 3 })
    await rm(path.join(settings.fieldDir, 'v6-tmp'), { recursive: true, force: true, maxRetries: 3 })
  }
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
