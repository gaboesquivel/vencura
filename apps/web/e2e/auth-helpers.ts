import type { Page } from '@playwright/test'

const appUrl =
  process.env.PLAYWRIGHT_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const apiUrl =
  process.env.PLAYWRIGHT_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const authHelpers = {
  appUrl,
  apiUrl,
  testEmail: 'test@test.ai',

  async loginAsTestUser(_page: Page) {
    throw new Error(
      'E2E auth: loginAsTestUser needs Dynamic sandbox or storageState—magic link removed.',
    )
  },
}
