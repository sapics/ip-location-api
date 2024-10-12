import type { IpLocationApiInputSettings } from '@iplookup/util'
import { resolve } from 'node:path'
import { createBrowserIndex } from '@iplookup/util/browserIndex'
import { update } from '@iplookup/util/db'
import replace from '@rollup/plugin-replace'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: 'src/index.ts',
      },
      formats: ['es', 'cjs', 'iife'],
      fileName: (format, entryName) => {
        switch (format) {
          case 'es':
            return `${entryName}.mjs`
          case 'cjs':
            return `${entryName}.cjs`
          case 'iife':
            return `${entryName}.min.js`
          default:
            return `${entryName}.js`
        }
      },
      name: 'IpLookup',
    },
    sourcemap: true,
    rollupOptions: {
      plugins: [
        replace({
          preventAssignment: true,
          __CDN_URL__: '"https://cdn.jsdelivr.net/npm/@iplookup/geocode"',
          __DATA_TYPE__: '"geocode"',
        }),
      ],
    },
  },
  plugins: [
    checker({
      typescript: true,
    }),
    dts(),
    {
      name: 'createBrowserIndex',
      async buildStart() {
        const settings: IpLocationApiInputSettings = {
          dataDir: resolve('../../data/geocode'),
          tmpDataDir: resolve('../../tmp/geocode'),
          fields: ['country', 'latitude', 'longitude'],
        }
        await update(settings)
        await createBrowserIndex('geocode', settings, resolve('./indexes'))
      },
    },
  ],
})
