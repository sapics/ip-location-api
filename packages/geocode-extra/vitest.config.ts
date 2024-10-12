import replace from '@rollup/plugin-replace'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    replace({
      preventAssignment: true,
      __CDN_URL__: '"https://cdn.jsdelivr.net/npm/@iplookup/geocode-extra"',
      __DATA_TYPE__: '"geocode"',
    }),
  ],
})
