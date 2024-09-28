import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { getSettings, type IpLocationApiSettings } from './functions/getSettings.js'

export async function update(settings?: Partial<IpLocationApiSettings>) {
  const { dataDir, tmpDataDir } = getSettings(settings)

  if (!existsSync(dataDir)) {
    // TODO add debug log
    await mkdir(dataDir, { recursive: true })
  }

  if (!existsSync(tmpDataDir)) {
    // TODO add debug log
    await mkdir(tmpDataDir, { recursive: true })
  }

  // TODO add debug log
  // TODO download db and save
}
