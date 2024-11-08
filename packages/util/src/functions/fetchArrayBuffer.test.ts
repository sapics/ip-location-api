import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchArrayBuffer } from './fetchArrayBuffer'
import { sleep } from './sleep'

vi.mock('./sleep')

describe('fetchArrayBuffer', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch ArrayBuffer successfully', async () => {
    const mockArrayBuffer = new ArrayBuffer(8)
    const mockResponse = {
      ok: true,
      headers: new Headers({ 'x-jsd-version': '1.0.0' }),
      arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const result = await fetchArrayBuffer(new URL('https://example.com'))

    expect.soft(result).toEqual({
      buffer: mockArrayBuffer,
      versionHeader: '1.0.0',
    })
    expect.soft(globalThis.fetch).toHaveBeenCalledWith(new URL('https://example.com'))
  })

  it('should return null for 404 response', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const result = await fetchArrayBuffer(new URL('https://example.com'))

    expect.soft(result).toBeNull()
    expect.soft(globalThis.fetch).toHaveBeenCalledWith(new URL('https://example.com'))
  })

  it('should retry on non-404 error', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)
    vi.mocked(sleep).mockResolvedValue(undefined)

    await fetchArrayBuffer(new URL('https://example.com'))

    expect.soft(globalThis.fetch).toHaveBeenCalledTimes(4) // Initial request + 3 retries
    expect.soft(sleep).toHaveBeenCalledTimes(3)
    expect.soft(sleep).toHaveBeenNthCalledWith(1, 100)
    expect.soft(sleep).toHaveBeenNthCalledWith(2, 400)
    expect.soft(sleep).toHaveBeenNthCalledWith(3, 900)
  })

  it('should return null after all retries fail', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)
    vi.mocked(sleep).mockResolvedValue(undefined)

    const result = await fetchArrayBuffer(new URL('https://example.com'))

    expect.soft(result).toBeNull()
    expect.soft(globalThis.fetch).toHaveBeenCalledTimes(4) // Initial request + 3 retries
  })

  it('should handle missing version header', async () => {
    const mockArrayBuffer = new ArrayBuffer(8)
    const mockResponse = {
      ok: true,
      headers: new Headers(),
      arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const result = await fetchArrayBuffer(new URL('https://example.com'))

    expect.soft(result).toEqual({
      buffer: mockArrayBuffer,
      versionHeader: undefined,
    })
  })
})
