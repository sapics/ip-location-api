import { describe, it, vi } from 'vitest'
import { getSettings } from './getSettings'
import { log } from './log'

describe('log', () => {
  it('should not log when silent is true', ({ expect }) => {
    const spy = vi.spyOn(console, 'info')
    getSettings({ silent: true })
    log('info', 'test')
    expect.soft(spy).not.toHaveBeenCalled()
  })

  it('should log when silent is false', ({ expect }) => {
    const spy = vi.spyOn(console, 'info')
    getSettings({ silent: false })
    log('info', 'test')
    expect.soft(spy).toHaveBeenCalled()
  })
})
