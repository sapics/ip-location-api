import { SAVED_SETTINGS } from '../constants.js'

export function log(type: 'info' | 'warn' | 'error', ...args: any[]) {
  if (SAVED_SETTINGS.silent)
    return

  // eslint-disable-next-line no-console
  console[type](...args)
}
