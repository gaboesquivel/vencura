import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30000, // 30 seconds for wallet creation (keygen ceremonies can take time)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/node_modules/**', 'src/test/**'],
    },
  },
  resolve: {
    alias: {
      '@vencura/types': resolve(__dirname, '../../packages/types/dist/index.mjs'),
      '@vencura/types/schemas': resolve(__dirname, '../../packages/types/dist/schemas/index.mjs'),
      '@vencura/types/contracts': resolve(__dirname, '../../packages/types/dist/contracts/index.mjs'),
      '@vencura/core': resolve(__dirname, '../../packages/core/src'),
    },
  },
})
