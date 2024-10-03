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
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        switch (format) {
          case 'es':
            return `${entryName}.mjs`
          case 'cjs':
            return `${entryName}.cjs`
          default:
            return `${entryName}.js`
        }
      },
      name: 'IpLookup',
    },
    rollupOptions: {
      external: ['@fast-csv/parse', 'ip-address', 'ky', 'yauzl', 'countries-list'],
    },
    sourcemap: true,
    ssr: true,
    // minify: 'esbuild',
  },
  plugins: [
    checker({
      typescript: true,
    }),
    dts(),
  ],
})
