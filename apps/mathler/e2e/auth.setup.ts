import { expect, test as setup } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3002'
  const testEmail = process.env.E2E_TEST_EMAIL
  const staticOTP = process.env.E2E_STATIC_OTP

  if (!testEmail || !staticOTP) {
    throw new Error('E2E_TEST_EMAIL and E2E_STATIC_OTP environment variables are required')
  }

  // Navigate to the app
  await page.goto(baseURL)

  // Wait for the auth UI to appear (DynamicWidget)
  await page
    .waitForSelector('[data-testid="dynamic-widget"]', {
      timeout: 10000,
    })
    .catch(async () => {
      // If widget selector doesn't work, try finding sign in button
      const signInButton = page
        .locator(
          'button:has-text("Sign in"), button:has-text("Connect Wallet"), button:has-text("Get Started")',
        )
        .first()
      if (await signInButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await signInButton.click()
      }
    })

  // Wait a bit for the auth modal/widget to fully load
  await page.waitForTimeout(1000)

  // Look for email input field - try multiple possible selectors
  const emailInput = page
    .locator(
      'input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email" i]',
    )
    .first()
  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(testEmail)

  // Submit email form - look for submit button
  const submitButton = page
    .locator(
      'button[type="submit"], button:has-text("Continue"), button:has-text("Next"), button:has-text("Send Code")',
    )
    .first()
  await expect(submitButton).toBeVisible({ timeout: 5000 })
  await submitButton.click()

  // Wait for OTP input to appear
  await page.waitForTimeout(2000)

  // Look for OTP input fields - Dynamic Labs typically uses multiple input fields or a single input
  const otpInput = page
    .locator(
      'input[type="text"][maxlength="1"], input[type="number"][maxlength="1"], input[name*="otp" i], input[name*="code" i], input[placeholder*="code" i], input[placeholder*="Code" i]',
    )
    .first()

  // Try to find OTP input - if multiple inputs, fill them individually
  const otpInputs = page.locator(
    'input[type="text"][maxlength="1"], input[type="number"][maxlength="1"]',
  )
  const otpInputCount = await otpInputs.count()

  if (otpInputCount > 1) {
    // Multiple OTP input fields (one per digit)
    for (let i = 0; i < Math.min(otpInputCount, staticOTP.length); i++) {
      const input = otpInputs.nth(i)
      const digit = staticOTP[i]
      if (digit) {
        await input.fill(digit)
        await page.waitForTimeout(200)
      }
    }
  } else {
    // Single OTP input field
    await expect(otpInput).toBeVisible({ timeout: 10000 })
    await otpInput.fill(staticOTP)
  }

  // Submit OTP form
  const otpSubmitButton = page
    .locator(
      'button[type="submit"], button:has-text("Verify"), button:has-text("Continue"), button:has-text("Confirm")',
    )
    .first()
  await expect(otpSubmitButton).toBeVisible({ timeout: 5000 })
  await otpSubmitButton.click()

  // Wait for authentication to complete and redirect
  // Look for game content or authenticated state
  await page.waitForSelector('h1:has-text("Mathler")', { timeout: 15000 })

  // Save authenticated state
  await page.context().storageState({ path: authFile })
})
