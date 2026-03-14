import { test as setup } from '@playwright/test'
import { loginWithDynamicSandbox } from '@repo/e2e-helpers'

const authFile = 'playwright/.auth/user.json'
const baseURL =
  process.env.PLAYWRIGHT_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

setup('authenticate', async ({ page }) => {
  const testEmail = process.env.E2E_TEST_EMAIL
  const staticOTP = process.env.E2E_STATIC_OTP

  if (!testEmail || !staticOTP)
    throw new Error('E2E_TEST_EMAIL and E2E_STATIC_OTP are required for Dynamic sandbox auth')

  await loginWithDynamicSandbox(page, {
    baseURL,
    loginPath: '/auth/login',
    authSuccessSelector: 'text=Signed In',
    testEmail,
    staticOTP,
  })

  await page.context().storageState({ path: authFile })
})
