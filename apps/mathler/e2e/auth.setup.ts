import { test as setup } from '@playwright/test'
import { loginWithDynamicSandbox } from '@repo/e2e-helpers'

const authFile = 'playwright/.auth/user.json'
const baseURL =
  process.env.PLAYWRIGHT_APP_URL ??
  process.env.PLAYWRIGHT_TEST_BASE_URL ??
  process.env.BASE_URL ??
  'http://localhost:3002'

setup('authenticate', async ({ page }) => {
  const testEmail = process.env.E2E_TEST_EMAIL
  const staticOTP = process.env.E2E_STATIC_OTP

  if (!testEmail || !staticOTP) {
    throw new Error('E2E_TEST_EMAIL and E2E_STATIC_OTP environment variables are required')
  }

  await loginWithDynamicSandbox(page, {
    baseURL,
    loginPath: '/',
    authSuccessSelector: 'h1:has-text("Mathler")',
    testEmail,
    staticOTP,
  })

  await page.context().storageState({ path: authFile })
})
