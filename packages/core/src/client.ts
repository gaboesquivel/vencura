import type { CoreApiClient } from './api-client.gen'
import { api } from './api-wrapper.gen'
import type { CoreClientOptions, DynamicAuthOptions } from './config'
import { ApiError } from './errors'
import { createConfig, createClient as createHeyApiClient } from './gen/client/index'

const clientConfigMap = new WeakMap<
  object,
  { baseUrl: string; getAuthToken?: () => string | null | Promise<string | null> }
>()

/** Config subset exposed to consumers (e.g. ReactApiProvider) for auth/URL. */
export type ClientConfig = {
  baseUrl: string
  getAuthToken?: () => string | null | Promise<string | null>
}

/** Returns auth/URL config for a client created with createClient, or undefined. */
export function getClientConfig(client: unknown): ClientConfig | undefined {
  return client && typeof client === 'object' ? clientConfigMap.get(client as object) : undefined
}

function getErrorFromResponse(response: { error?: unknown; response?: { status?: number } }): {
  status: number
  message: string
} {
  const status =
    response.error && typeof response.error === 'object' && 'status' in response.error
      ? (response.error as { status: number }).status
      : (response.response?.status ?? 500)
  const message =
    (response.error && typeof response.error === 'object' && 'message' in response.error
      ? (response.error as { message?: string }).message
      : undefined) ?? 'Unknown error'
  return { status, message }
}

function isApiKeyMode(
  options: CoreClientOptions,
): options is Extract<CoreClientOptions, { apiKey: string }> {
  return 'apiKey' in options && typeof options.apiKey === 'string'
}

function isDynamicAuthMode(
  options: CoreClientOptions,
): options is Extract<CoreClientOptions, DynamicAuthOptions> {
  return (
    'dynamicAuth' in options &&
    typeof options.dynamicAuth === 'object' &&
    typeof options.dynamicAuth.getAuthToken === 'function'
  )
}

function wrapApiWithClient<T>(
  obj: T,
  client: ReturnType<typeof createHeyApiClient>,
  options: CoreClientOptions,
): T {
  if (typeof obj === 'function')
    return (async (callOptions: Record<string, unknown> = {}) => {
      const response = await obj({ ...callOptions, client })
      const { status: errorStatus, message: errorMessage } = getErrorFromResponse(response)
      if (response.error) throw new ApiError(errorStatus, errorMessage, response.error)
      return response.data
    }) as T

  if (obj && typeof obj === 'object') {
    const wrapped: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj))
      wrapped[key] = wrapApiWithClient(value, client, options)
    return wrapped as T
  }

  return obj
}

/**
 * Creates a type-safe API client with nested namespace API.
 *
 * The client provides a nested namespace API (e.g., `client.auth.session.user()`)
 * and injects Bearer tokens for authenticated requests.
 *
 * Token refresh is handled by Dynamic Labs SDK on the client; no backend refresh.
 *
 * @param options - Client configuration (apiKey, dynamicAuth, or no-auth)
 * @returns API client with nested namespace structure matching the OpenAPI spec
 *
 * @example API key mode
 * ```ts
 * const client = createClient({
 *   baseUrl: 'https://api.example.com',
 *   apiKey: 'venc_xxx_secret',
 * })
 * ```
 *
 * @example Dynamic Labs mode (web/mobile)
 * ```ts
 * createClient({
 *   baseUrl: 'https://api.example.com',
 *   dynamicAuth: { getAuthToken: () => getAuthToken() ?? null },
 * })
 * ```
 *
 * @example No-auth mode
 * ```ts
 * createClient({ baseUrl: 'https://api.example.com' })
 * ```
 */
export function createClient(options: CoreClientOptions): CoreApiClient {
  const client = createHeyApiClient(
    createConfig({
      baseUrl: options.baseUrl,
    }),
  )

  client.interceptors.request.use(async request => {
    const token = isApiKeyMode(options)
      ? options.apiKey
      : isDynamicAuthMode(options)
        ? await options.dynamicAuth.getAuthToken()
        : undefined

    const extraHeaders = await options.getHeaders?.()

    if (token && !request.headers.has('Authorization'))
      request.headers.set('Authorization', `Bearer ${token}`)

    if (extraHeaders)
      Object.entries(extraHeaders).forEach(([key, value]) => {
        request.headers.set(key, value)
      })

    return request
  })

  const wrapped = wrapApiWithClient(api, client, options) as unknown as CoreApiClient
  const getAuthToken = isApiKeyMode(options)
    ? () => options.apiKey
    : isDynamicAuthMode(options)
      ? options.dynamicAuth.getAuthToken
      : undefined
  clientConfigMap.set(wrapped, {
    baseUrl: options.baseUrl,
    getAuthToken,
  })
  return wrapped
}
