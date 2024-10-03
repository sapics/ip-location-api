import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        100: true,
      },
      reporter: ['json-summary', 'text', 'html'],
      exclude: ['**/*.config.ts', '**/dist/**', ...coverageConfigDefaults.exclude],
    },
  },
})
