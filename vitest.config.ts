import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      reporter: ['json-summary', 'text', 'html'],
      exclude: ['**/*.config.ts', '**/dist/**', ...coverageConfigDefaults.exclude],
      reportOnFailure: true,
    },
  },
})
