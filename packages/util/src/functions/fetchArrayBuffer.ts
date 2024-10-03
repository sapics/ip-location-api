import { sleep } from './sleep.js'

/**
 * Fetches an ArrayBuffer from a given URL with retry functionality.
 * @param url - The URL to fetch the ArrayBuffer from.
 * @param retry - The number of retry attempts (default: 3).
 * @returns A Promise that resolves to an object containing the ArrayBuffer and version header, or null if the fetch fails.
 */
export async function fetchArrayBuffer(
  url: URL,
  retry = 3,
): Promise<{
  buffer: ArrayBuffer
  versionHeader?: string
} | null> {
  return await fetch(url).then(
    async (response) => {
      if (!response.ok) {
        if (response.status === 404)
          return null

        if (retry) {
          //* Exponential backoff: Delay increases quadratically with each retry
          await sleep(100 * (4 - retry) * (4 - retry))
          return fetchArrayBuffer(url, retry - 1)
        }
        return null
      }

      return {
        //* Extract the version header if present, otherwise undefined (jsDelivr CDN)
        versionHeader: response.headers.get('x-jsd-version') ?? undefined,
        buffer: await response.arrayBuffer(),
      }
    },
  )
}
