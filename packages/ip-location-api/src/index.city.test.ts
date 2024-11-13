import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { clear, lookup, reload } from './index'

describe('lookup (city)', () => {
  const id = randomUUID()

  beforeAll(async () => {
    await reload({
      dataDir: resolve(__dirname, '../data', id),
      tmpDataDir: resolve(__dirname, '../tmp', id),
      fields: ['city', 'country'],
      silent: true,
    })
  }, 25 * 60_000)

  afterAll(async () => {
    clear()
    await rm(resolve(__dirname, '../data', id), { recursive: true, force: true })
    await rm(resolve(__dirname, '../tmp', id), { recursive: true, force: true })
  })

  it('should return the city and country for a valid IP address', async ({ expect }) => {
    //* Ipv4
    const result = await lookup('170.171.1.0')
    expect.soft(result).not.toBeNull()
    expect.soft(result).toEqual({ city: 'New York', country: 'US' })

    //* Ipv6
    const result2 = await lookup('2606:2e00:8003::216:3eff:fe82:68ab')
    expect.soft(result2).not.toBeNull()
    expect.soft(result2).toEqual({ city: 'New York', country: 'US' })
  })
})
