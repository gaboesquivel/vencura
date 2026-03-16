import { expect, test } from '@playwright/test'

const apiUrl = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001'

test.describe('Scalar UI Login Flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('should complete API key fallback flow through Scalar UI', async ({ page }) => {
    const tokenRes = await page.request.get(`${apiUrl}/test/e2e-token`)
    expect(tokenRes.ok()).toBeTruthy()
    const { token } = (await tokenRes.json()) as { token: string }
    expect(token).toBeTruthy()

    await page.goto(`${apiUrl}/reference`)
    await page.waitForLoadState('networkidle')

    const loginButton = page.locator('[data-login-link]')
    await expect(loginButton).toBeVisible({ timeout: 10000 })
    await expect(loginButton).toHaveText('Login')

    await loginButton.click()

    const modalOverlay = page.locator('#modal-overlay.show')
    await expect(modalOverlay).toBeVisible({ timeout: 5000 })

    const apiKeyDetails = page.locator('.api-key-fallback')
    const tokenInput = page.locator('#token')
    const applyBtn = page.locator('#apply-token')

    if ((await apiKeyDetails.count()) > 0) {
      await apiKeyDetails.locator('summary').click()
      await page.waitForTimeout(200)
    }

    await expect(tokenInput).toBeVisible()
    await tokenInput.fill(token)
    await applyBtn.click()

    const logoutButton = page.locator('[data-login-link]')
    await expect(logoutButton).toHaveText('Logout', { timeout: 5000 })

    const tokenInStorage = await page.evaluate(() => localStorage.getItem('scalar-token'))
    expect(tokenInStorage).toBe(token)

    const authedResponse = await page.request.get(`${apiUrl}/test/authed`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(authedResponse.ok()).toBeTruthy()
    const authedData = (await authedResponse.json()) as {
      user?: { id: string; email: string | null }
    }
    expect(authedData.user).toBeDefined()
  })

  test('should handle logout correctly', async ({ page }) => {
    const tokenRes = await page.request.get(`${apiUrl}/test/e2e-token`)
    expect(tokenRes.ok()).toBeTruthy()
    const { token } = (await tokenRes.json()) as { token: string }

    await page.goto(`${apiUrl}/reference`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(t => localStorage.setItem('scalar-token', t), token)

    await page.reload()
    await page.waitForLoadState('networkidle')

    const logoutButton = page.locator('[data-login-link]')
    await expect(logoutButton).toHaveText('Logout', { timeout: 10000 })
    await logoutButton.click()

    await page.waitForLoadState('networkidle')
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('scalar-token'))
    expect(tokenAfterLogout).toBeNull()

    const loginButtonAfterLogout = page.locator('[data-login-link]')
    await expect(loginButtonAfterLogout).toBeVisible({ timeout: 10000 })
    await expect(loginButtonAfterLogout).toHaveText('Login')
  })
})
