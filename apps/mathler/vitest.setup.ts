// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest'
import { afterAll, beforeAll } from 'vitest'

// Suppress React act warnings for keyboard events
// These warnings occur because keyboard event handlers trigger state updates
// that happen asynchronously. userEvent.keyboard() already handles act internally,
// but React still detects these updates. This is a known issue with React 18+.
// biome-ignore lint/suspicious/noConsole: Needed to suppress React act warnings in tests
const originalError = console.error
// biome-ignore lint/suspicious/noConsole: Needed to suppress React act warnings in tests
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('not wrapped in act(...)') &&
      args[0].includes('MathlerGame')
    ) {
      // Suppress act warnings for MathlerGame component
      // These are false positives from keyboard event handlers
      return
    }
    originalError.call(console, ...args)
  }
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('not wrapped in act(...)') &&
      args[0].includes('MathlerGame')
    ) {
      // Suppress act warnings for MathlerGame component
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})
