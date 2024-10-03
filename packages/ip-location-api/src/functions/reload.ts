import type { IpLocationApiInputSettings } from '@iplookup/util'
import type { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getSettings, SAVED_SETTINGS } from '@iplookup/util'
import { update } from '@iplookup/util/db'

export const LOADED_DATA: {
  location?: Buffer
  city?: Buffer
  sub?: {
    region1?: string[]
    region2?: string[]
    timezone?: string[]
    area?: number[]
    eu?: Record<string, boolean>
  }
} = {}

export async function reload(inputSettings?: IpLocationApiInputSettings): Promise<void> {
  const settings = getSettings(inputSettings)

  let directoryToFind = settings.dataDir
  if (settings.smallMemory) {
    directoryToFind = join(settings.dataDir, 'v4')
  }

  if (!existsSync(directoryToFind)) {
    await update(settings)
  }

  const buffers = {
    v4: {
      dat1: undefined as Buffer | undefined,
      dat2: undefined as Buffer | undefined,
      dat3: undefined as Buffer | undefined,
    },
    v6: {
      dat1: undefined as Buffer | undefined,
      dat2: undefined as Buffer | undefined,
      dat3: undefined as Buffer | undefined,
    },
    location: undefined as Buffer | undefined,
    city: undefined as Buffer | undefined,
    sub: undefined as Buffer | undefined,
  }
  const promises: Promise<void>[] = [
    readFile(join(settings.fieldDir, '4-1.dat')).then((buffer) => { buffers.v4.dat1 = buffer }),
    readFile(join(settings.fieldDir, '6-1.dat')).then((buffer) => { buffers.v6.dat1 = buffer }),
  ]

  if (!settings.smallMemory) {
    promises.push(
      readFile(join(settings.fieldDir, '4-2.dat')).then((buffer) => { buffers.v4.dat2 = buffer }),
      readFile(join(settings.fieldDir, '4-3.dat')).then((buffer) => { buffers.v4.dat3 = buffer }),
      readFile(join(settings.fieldDir, '6-2.dat')).then((buffer) => { buffers.v6.dat2 = buffer }),
      readFile(join(settings.fieldDir, '6-3.dat')).then((buffer) => { buffers.v6.dat3 = buffer }),
    )
  }

  if (settings.locationFile) {
    promises.push(
      readFile(join(settings.fieldDir, 'location.dat')).then((buffer) => { buffers.location = buffer }),
    )

    if (settings.fields.includes('city')) {
      promises.push(
        readFile(join(settings.fieldDir, 'name.dat')).then((buffer) => { buffers.city = buffer }),
      )
    }

    if (settings.fields.some(field => ['region1_name', 'region2_name', 'timezone', 'area', 'eu'].includes(field))) {
      promises.push(
        readFile(join(settings.fieldDir, 'sub.json')).then((buffer) => { buffers.sub = buffer }),
      )
    }
  }

  await Promise.all(promises)

  const v4 = settings.v4
  const v6 = settings.v6

  const v4StartIps = new Uint32Array(buffers.v4.dat1!.buffer, 0, buffers.v4.dat1!.byteLength >> 2)
  const v6StartIps = new BigUint64Array(buffers.v6.dat1!.buffer, 0, buffers.v6.dat1!.byteLength >> 3)

  v4.loadedData = {
    startIps: v4StartIps,
    endIps: buffers.v4.dat2 ? new Uint32Array(buffers.v4.dat2.buffer, 0, buffers.v4.dat2.byteLength >> 2) : undefined,
    mainBuffer: buffers.v4.dat3,
    lastLine: v4StartIps.length - 1,
    firstIp: v4StartIps[0]!,
  }

  v6.loadedData = {
    startIps: v6StartIps,
    endIps: buffers.v6.dat2 ? new BigUint64Array(buffers.v6.dat2.buffer, 0, buffers.v6.dat2.byteLength >> 3) : undefined,
    mainBuffer: buffers.v6.dat3,
    lastLine: v6StartIps.length - 1,
    firstIp: v6StartIps[0]!,
  }

  if (settings.dataType === 'City') {
    LOADED_DATA.location = buffers.location
    LOADED_DATA.city = buffers.city
    if (buffers.sub) {
      const subJson = JSON.parse(buffers.sub.toString())
      LOADED_DATA.sub = {
        region1: subJson.region1_name,
        region2: subJson.region2_name,
        timezone: subJson.timezone,
        area: subJson.area,
        eu: subJson.eu,
      }
    }
  }
}

export function clear() {
  const settings = SAVED_SETTINGS
  settings.v4.loadedData = undefined
  settings.v6.loadedData = undefined

  LOADED_DATA.location = undefined
  LOADED_DATA.city = undefined
  LOADED_DATA.sub = undefined
}
