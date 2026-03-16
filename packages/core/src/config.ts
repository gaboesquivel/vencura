/**
 * Configuration options for creating an API client.
 *
 * Three auth modes:
 * - **apiKey**: Static Bearer token (e.g. venc_xxx_secret). No callbacks.
 * - **dynamicAuth**: Dynamic Labs token via getAuthToken. Token refresh handled by Dynamic SDK.
 * - **No auth**: baseUrl only. No Authorization header.
 *
 * @example API key mode
 * ```ts
 * createClient({ baseUrl: 'https://api.example.com', apiKey: 'venc_xxx_secret' })
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
export type ApiKeyOptions = {
  baseUrl: string
  apiKey: string
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>
}

export type NoAuthOptions = {
  baseUrl: string
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>
}

export type DynamicAuthOptions = {
  baseUrl: string
  dynamicAuth: { getAuthToken: () => string | null | Promise<string | null> }
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>
}

export type CoreClientOptions = ApiKeyOptions | NoAuthOptions | DynamicAuthOptions
