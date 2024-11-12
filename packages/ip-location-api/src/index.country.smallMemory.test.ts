import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { clear, lookup, reload } from './index'

describe('lookup (country, smallMemory)', () => {
  const id = randomUUID()

  beforeAll(async () => {
    await reload({
      dataDir: resolve(__dirname, '../data', id),
      tmpDataDir: resolve(__dirname, '../tmp', id),
      fields: ['country'],
      smallMemory: true,
    })
  }, 5 * 60_000)

  afterAll(async () => {
    clear()
    await rm(resolve(__dirname, '../data', id), { recursive: true, force: true })
    await rm(resolve(__dirname, '../tmp', id), { recursive: true, force: true })
  })

  it('should return the country for a valid IP address', async ({ expect }) => {
    //* Ipv4
    const result = await lookup('8.8.8.8')
    expect.soft(result).not.toBeNull()
    expect.soft(result).toEqual({ country: 'US' })

    const result2 = await lookup('207.97.227.239')
    expect.soft(result2).not.toBeNull()
    expect.soft(result2).toEqual({ country: 'US' })

    //* Ipv6
    const result3 = await lookup('2607:F8B0:4005:801::200E')
    expect.soft(result3).not.toBeNull()
    expect.soft(result3).toEqual({ country: 'US' })

    //* Invalid IP address
    await expect.soft(lookup('invalid')).rejects.toThrowError('Invalid IPv4 address: invalid')

    //* Too high IP address
    await expect.soft(lookup('256.256.256.256')).resolves.toBeNull()

    //* Clear data
    clear()

    //* Ips should return null after data is cleared
    await expect.soft(lookup('8.8.8.8')).resolves.toBeNull()

    await expect.soft(lookup('2607:F8B0:4005:801::200E')).resolves.toBeNull()
  })
})
