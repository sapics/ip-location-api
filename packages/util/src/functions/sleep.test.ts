import { afterEach, describe, expect, it, vi } from 'vitest'
import { sleep } from './sleep'

describe('sleep', () => {
  it('should pause execution for the specified time', async () => {
    const startTime = Date.now()
    const sleepTime = 100

    vi.useFakeTimers()

    const sleepPromise = sleep(sleepTime)
    vi.advanceTimersByTime(sleepTime)
    await sleepPromise

    const endTime = Date.now()
    const elapsedTime = endTime - startTime

    expect.soft(elapsedTime).toBeGreaterThanOrEqual(sleepTime)
  })

  it('should resolve after the specified time', async () => {
    const sleepTime = 50

    vi.useFakeTimers()

    const sleepPromise = sleep(sleepTime)

    expect.soft(vi.getTimerCount()).toBe(1)

    vi.advanceTimersByTime(sleepTime - 1)
    await Promise.resolve() // Allow any pending microtasks to run

    expect.soft(vi.getTimerCount()).toBe(1)

    vi.advanceTimersByTime(1)
    await sleepPromise

    expect.soft(vi.getTimerCount()).toBe(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})
