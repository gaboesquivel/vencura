import type { Page } from '@playwright/test'

export interface LoginWithDynamicSandboxOptions {
  baseURL: string
  loginPath?: string
  authSuccessSelector: string
  testEmail: string
  staticOTP: string
}

const emailInputLocator = (page: Page) =>
  page
    .locator(
      'input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email" i]',
    )
    .first()

/**
 * Authenticate with Dynamic Labs sandbox: navigate, fill email, OTP, wait for success.
 * Caller is responsible for saving storage state after this returns.
 */
export async function loginWithDynamicSandbox(
  page: Page,
  {
    baseURL,
    loginPath = '/',
    authSuccessSelector,
    testEmail,
    staticOTP,
  }: LoginWithDynamicSandboxOptions,
): Promise<void> {
  const url = loginPath.startsWith('http') ? loginPath : new URL(loginPath, baseURL).href
  await page.goto(url)

  const emailInput = emailInputLocator(page)

  try {
    await emailInput.waitFor({ state: 'visible', timeout: 15_000 })
  } catch {
    await page
      .waitForSelector('[data-testid="dynamic-widget"], .embedded-widget', { timeout: 8_000 })
      .catch(() => {})
    const signInButton = page
      .locator(
        'button:has-text("Sign in"), button:has-text("Connect Wallet"), button:has-text("Get Started")',
      )
      .first()
    if (await signInButton.isVisible({ timeout: 5_000 }).catch(() => false))
      await signInButton.click()
    await emailInput.waitFor({ state: 'visible', timeout: 15_000 })
  }

  await page.waitForTimeout(500)

  await emailInput.fill(testEmail)

  const submitButton = page
    .locator(
      'button[type="submit"], button:has-text("Continue"), button:has-text("Next"), button:has-text("Send Code")',
    )
    .first()
  await submitButton.waitFor({ state: 'visible', timeout: 5_000 })
  await submitButton.click()

  await page.waitForTimeout(2000)

  const otpInputs = page.locator(
    'input[type="text"][maxlength="1"], input[type="number"][maxlength="1"]',
  )
  const otpInputCount = await otpInputs.count()

  if (otpInputCount > 1) {
    for (let i = 0; i < Math.min(otpInputCount, staticOTP.length); i++) {
      const input = otpInputs.nth(i)
      const digit = staticOTP[i]
      if (digit) {
        await input.fill(digit)
        await page.waitForTimeout(200)
      }
    }
  } else {
    const otpInput = page
      .locator(
        'input[type="text"][maxlength="1"], input[type="number"][maxlength="1"], input[name*="otp" i], input[name*="code" i]',
      )
      .first()
    await otpInput.waitFor({ state: 'visible', timeout: 10_000 })
    await otpInput.fill(staticOTP)
  }

  const otpSubmitButton = page
    .locator(
      'button[type="submit"], button:has-text("Verify"), button:has-text("Continue"), button:has-text("Confirm")',
    )
    .first()
  await otpSubmitButton.waitFor({ state: 'visible', timeout: 5_000 })
  await otpSubmitButton.click()

  await page.waitForSelector(authSuccessSelector, { timeout: 15_000 })
}
