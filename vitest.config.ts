import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': root,
      '~~': root,
      '#mdc-highlighter': fileURLToPath(new URL('./tests/stubs/mdc-highlighter.ts', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Without `include`, files no test imports don't appear at all and the
      // report overstates coverage. Components and pages are left out: they are
      // exercised in the browser, not here.
      include: ['server/**', 'utils/**', 'composables/**', 'data/**'],
      // A ratchet, set just under the level measured on 2026-10-13 (67.7 /
      // 79.9 / 84): raise it as coverage grows, never lower it to get green.
      thresholds: {
        statements: 65,
        branches: 78,
        functions: 82,
        lines: 65,
      },
    },
  },
})
