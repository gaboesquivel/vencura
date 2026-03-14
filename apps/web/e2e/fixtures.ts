import { test as base, expect } from '@playwright/test'

export const test = base.extend<{ authenticatedPage: import('@playwright/test').Page }>({
  authenticatedPage: async ({ page }, runTest) => {
    await runTest(page)
  },
})

export { expect }
