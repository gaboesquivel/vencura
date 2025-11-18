import { isEmpty } from 'lodash'

let cachedToken: string | null = null
let cachedExpiry: number | null = null

export async function getTestAuthToken(): Promise<string> {
  const { TEST_AUTH_TOKEN, DYNAMIC_ENVIRONMENT_ID, DYNAMIC_API_TOKEN, NODE_ENV } = process.env

  if (TEST_AUTH_TOKEN) return TEST_AUTH_TOKEN

  if (isEmpty(DYNAMIC_ENVIRONMENT_ID) || isEmpty(DYNAMIC_API_TOKEN))
    throw new Error(
      'DYNAMIC_ENVIRONMENT_ID and DYNAMIC_API_TOKEN must be set. For automated testing, you can also set TEST_AUTH_TOKEN.',
    )

  if (NODE_ENV === 'test') return DYNAMIC_API_TOKEN

  if (cachedToken && cachedExpiry && Date.now() < cachedExpiry - 5 * 60 * 1000) return cachedToken

  throw new Error(
    'JWT token generation is not supported in non-test environments. Set TEST_AUTH_TOKEN or use a valid JWT token from Dynamic.',
  )
}

export function clearAuthTokenCache(): void {
  cachedToken = null
  cachedExpiry = null
}
