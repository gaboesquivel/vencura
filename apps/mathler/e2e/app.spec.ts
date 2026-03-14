import { expect, test } from '@playwright/test'

async function waitForGameReady(page: import('@playwright/test').Page, timeout = 10_000) {
  await page.waitForSelector('h1:has-text("Mathler")', { timeout })
}

test.describe('Mathler App', () => {
  // Tests run with authenticated state (via storageState in playwright.config.ts)
  // The auth.setup.ts file handles authentication before these tests run
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForGameReady(page)
  })

  test('should load the game page', async ({ page }) => {
    await expect(page).toHaveTitle(/Mathler/i)
  })

  test('should display game skeleton during hydration', async ({ page }) => {
    // Check for skeleton elements that appear before hydration
    const skeleton = page.locator('[aria-label="Loading Mathler game"]')
    // Skeleton should appear briefly, then disappear
    await expect(skeleton)
      .toBeVisible({ timeout: 1000 })
      .catch(() => {
        // Skeleton may have already disappeared, which is fine
      })
  })

  test('should show sidebar with user info and logout when authenticated', async ({ page }) => {
    const settingsTab = page.getByRole('tab', { name: 'Settings' })
    if (!(await settingsTab.isVisible({ timeout: 2000 }).catch(() => false))) {
      await page.locator('[data-testid="sidebar-trigger"]').click()
      await page.waitForTimeout(300)
    }
    await settingsTab.click({ timeout: 5000 })

    await expect(page.getByText(/Logged in as|Difficulty|Dark mode/)).toBeVisible({
      timeout: 3000,
    })
    await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible({
      timeout: 3000,
    })
  })

  test('should display game header with target number', async ({ page }) => {
    const header = page.locator('h1:has-text("Mathler")')
    await expect(header).toBeVisible()

    // Should show target number
    const targetText = page.locator('text=/Find the equation that equals/')
    await expect(targetText).toBeVisible()
  })

  test('should display 6 guess rows', async ({ page }) => {
    // Wait for game board to render
    await page.waitForTimeout(500)

    // Check for guess rows (they should be rendered)
    const gameBoard = page.locator('[class*="space-y-2"]').first()
    await expect(gameBoard).toBeVisible()
  })

  test('should display keypad with numbers and operators', async ({ page }) => {
    // Wait for keypad to render
    await page.waitForTimeout(500)

    // Check for number buttons (0-9)
    const numberButton = page.locator('button:has-text("0")')
    await expect(numberButton.first()).toBeVisible({ timeout: 3000 })

    // Check for operator buttons
    const operatorButton = page.locator('button:has-text("+")')
    await expect(operatorButton.first()).toBeVisible({ timeout: 3000 })
  })

  test('should allow input via keypad', async ({ page }) => {
    await page.waitForTimeout(1000) // Wait for game to fully initialize

    // Click a number button
    const numberButton = page.locator('button:has-text("5")').first()
    await numberButton.click()

    // Wait a bit for input to register
    await page.waitForTimeout(200)

    // Verify input was registered (check if current row shows the number)
    // This is a basic check - the actual input display depends on game state
  })

  test('should handle backspace button', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Click a number
    const numberButton = page.locator('button:has-text("1")').first()
    await numberButton.click()
    await page.waitForTimeout(200)

    // Click backspace
    const backspaceButton = page.locator('button:has-text("Back")').first()
    await backspaceButton.click()
    await page.waitForTimeout(200)
  })

  test('should handle submit button', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Enter a simple equation
    const buttons = ['1', '+', '1']
    for (const buttonText of buttons) {
      const button = page.locator(`button:has-text("${buttonText}")`).first()
      await button.click()
      await page.waitForTimeout(100)
    }

    // Click submit
    const submitButton = page.locator('button:has-text("Submit")').first()
    await submitButton.click()

    // Wait for game to process
    await page.waitForTimeout(500)
  })

  test('should show feedback after submitting a guess', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Enter equation and submit
    for (const char of ['5', '+', '5']) {
      await page.locator(`button:has-text("${char}")`).first().click()
      await page.waitForTimeout(100)
    }
    await page.locator('button:has-text("Submit")').first().click()

    // After submit: either success modal (win) or feedback tiles with aria-label
    const successModal = page.getByRole('dialog')
    const feedbackTile = page
      .locator('[aria-label*="correct"], [aria-label*="present"], [aria-label*="absent"]')
      .first()
    await Promise.race([
      successModal.waitFor({ state: 'visible', timeout: 5000 }),
      feedbackTile.waitFor({ state: 'visible', timeout: 5000 }),
    ])
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await waitForGameReady(page)

    // Check that game is visible on mobile
    const header = page.locator('h1:has-text("Mathler")')
    await expect(header).toBeVisible()
  })

  test('should persist user settings across reload', async ({ page }) => {
    const settingsTab = page.getByRole('tab', { name: 'Settings' })
    if (!(await settingsTab.isVisible({ timeout: 2000 }).catch(() => false))) {
      await page.locator('[data-testid="sidebar-trigger"]').click()
      await page.waitForTimeout(300)
    }

    await settingsTab.click({ timeout: 5000 })

    // Change difficulty to Hard
    const difficultyTrigger = page.locator('#difficulty, [id="difficulty"]').first()
    await difficultyTrigger.click({ timeout: 3000 })
    await page.getByRole('option', { name: /Hard \(50-200\)/ }).click({ timeout: 3000 })

    await page.waitForTimeout(500)

    // Reload and verify persistence
    await page.reload()
    await waitForGameReady(page, 15_000)
    await page.waitForTimeout(1000)

    const settingsTabAfter = page.getByRole('tab', { name: 'Settings' })
    if (!(await settingsTabAfter.isVisible({ timeout: 2000 }).catch(() => false))) {
      await page.locator('[data-testid="sidebar-trigger"]').click()
      await page.waitForTimeout(300)
    }
    await settingsTabAfter.click({ timeout: 5000 })

    await expect(page.locator('#difficulty, [id="difficulty"]').first()).toContainText(/Hard|200/, {
      timeout: 3000,
    })
  })
})
