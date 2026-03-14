import { expect, test } from './fixtures'

test.describe('Wallets Dashboard', () => {
  test.setTimeout(30_000)

  test('should show wallets page and create wallet', async ({ authenticatedPage: page }) => {
    await page.goto('/wallets')
    await expect(page.locator('h1:has-text("Custodial Wallets")')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /Create wallet/i })).toBeVisible({
      timeout: 5_000,
    })

    const createButton = page.getByRole('button', { name: /Create wallet/i }).first()
    await createButton.click()

    await expect(
      page.locator('[class*="font-mono"]').filter({ hasText: /0x[a-fA-F0-9]{4}…[a-fA-F0-9]{4}/ }),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('should show wallet card with balance and sign form', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/wallets')
    await expect(page.locator('h1:has-text("Custodial Wallets")')).toBeVisible({ timeout: 15_000 })

    const hasWallet = await page
      .locator('text=Sign message')
      .first()
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)

    if (!hasWallet) {
      const createButton = page.getByRole('button', { name: /Create wallet/i }).first()
      if (await createButton.isVisible()) await createButton.click()
      await page.waitForTimeout(2_000)
    }

    await expect(page.locator('text=Sign message')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=Balance (Sepolia)')).toBeVisible({ timeout: 5_000 })
  })

  test('should sign message and show truncated result', async ({ authenticatedPage: page }) => {
    await page.goto('/wallets')
    await expect(page.locator('h1:has-text("Custodial Wallets")')).toBeVisible({ timeout: 15_000 })

    const hasWallet = await page
      .locator('#sign-msg')
      .first()
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)

    if (!hasWallet) {
      const createButton = page.getByRole('button', { name: /Create wallet/i }).first()
      if (await createButton.isVisible()) await createButton.click()
      await page.waitForTimeout(2_000)
    }

    const signTextarea = page.locator('#sign-msg').first()
    await expect(signTextarea).toBeVisible({ timeout: 10_000 })
    await signTextarea.fill('Hello')

    const signButton = page.getByRole('button', { name: /^Sign$/ }).first()
    await signButton.click()

    await expect(
      page.locator('.font-mono.text-xs.text-muted-foreground').filter({ hasText: /…/ }),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('should show error when sending to invalid address', async ({ authenticatedPage: page }) => {
    await page.goto('/wallets')
    await expect(page.locator('h1:has-text("Custodial Wallets")')).toBeVisible({ timeout: 15_000 })

    const hasWallet = await page
      .locator('#send-to')
      .first()
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)

    if (!hasWallet) {
      const createButton = page.getByRole('button', { name: /Create wallet/i }).first()
      if (await createButton.isVisible()) await createButton.click()
      await page.waitForTimeout(2_000)
    }

    const toInput = page.locator('#send-to').first()
    const amountInput = page.locator('#send-amount').first()
    await expect(toInput).toBeVisible({ timeout: 10_000 })
    await expect(amountInput).toBeVisible({ timeout: 5_000 })

    await toInput.fill('0xinvalid')
    await amountInput.fill('0.001')

    const sendButton = page.getByRole('button', { name: /^Send$/ }).first()
    await sendButton.click()

    await expect(page.getByText(/Invalid recipient address|invalid|Invalid/i)).toBeVisible({
      timeout: 10_000,
    })
  })
})
