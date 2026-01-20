import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.spec.ts', '**/*.spec.tsx'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/node_modules/**'],
    },
    // Suppress React act warnings for keyboard events
    // These are false positives from keyboard event handlers that trigger async state updates
    onConsoleLog(log, type) {
      if (
        type === 'stderr' &&
        typeof log === 'string' &&
        log.includes('not wrapped in act(...)') &&
        log.includes('MathlerGame')
      ) {
        return false // Suppress this log
      }
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@repo/ui': resolve(__dirname, '../../packages/ui/src'),
      'lucide-react': resolve(__dirname, './vitest.setup.lucide.ts'),
    },
  },
})
