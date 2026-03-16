/**
 * Dynamic Labs backend integration.
 *
 * When wallet operations require Dynamic's API (e.g. delegated wallets, server wallets),
 * use DYNAMIC_API_TOKEN and DYNAMIC_ENVIRONMENT_ID from env.
 *
 * Pattern from dynamic-examples/nodejs-server-wallets:
 * - authenticatedEvmClient() → authenticateApiToken(authToken) for server wallet ops
 * - createDelegatedEvmWalletClient({ apiKey }) for delegated user wallets
 *
 * Add @dynamic-labs-wallet/node-evm when integrating Dynamic wallet features.
 */
import { env } from './env.js'

export function getDynamicConfig(): { apiToken: string; environmentId: string } | null {
  const token = env.DYNAMIC_API_TOKEN
  const envId = env.DYNAMIC_ENVIRONMENT_ID
  if (!token || !envId) return null
  return { apiToken: token, environmentId: envId }
}
