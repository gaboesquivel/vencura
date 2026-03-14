const appUrl =
  process.env.PLAYWRIGHT_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const apiUrl =
  process.env.PLAYWRIGHT_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const authHelpers = {
  appUrl,
  apiUrl,
  testEmail: process.env.E2E_TEST_EMAIL ?? 'test+dynamic_test@example.com',
}
