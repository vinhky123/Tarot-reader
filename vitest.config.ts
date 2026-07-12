import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run in Node environment (we're testing data/logic, not DOM).
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
