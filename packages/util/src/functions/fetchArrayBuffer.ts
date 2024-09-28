import { sleep } from './sleep.js'

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
          await sleep(100 * (4 - retry) * (4 - retry))
          return fetchArrayBuffer(url, retry - 1)
        }
        return null
      }
      return {
        versionHeader: response.headers.get('x-jsd-version') ?? undefined,
        buffer: await response.arrayBuffer(),
      }
    },
  )
}
