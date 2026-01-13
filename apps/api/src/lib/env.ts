import { z } from 'zod'

const envSchema = z.object({
  DYNAMIC_ENVIRONMENT_ID: z.string().min(1),
  DYNAMIC_API_TOKEN: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(1),
  PORT: z.coerce.number().optional().default(3077),
  ARB_TESTNET_GAS_FAUCET_KEY: z.string().min(1).optional(),
  SEPOLIA_RPC_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Environment configuration object.
 * Reads directly from process.env (Bun automatically loads .env files).
 */
export const environment = {
  dynamicEnvironmentId: process.env.DYNAMIC_ENVIRONMENT_ID ?? '',
  dynamicApiToken: process.env.DYNAMIC_API_TOKEN ?? '',
  encryptionKey: process.env.ENCRYPTION_KEY ?? '',
  port: Number(process.env.PORT) || 3077,
  arbTestnetGasFaucetKey: process.env.ARB_TESTNET_GAS_FAUCET_KEY,
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL,
} as const satisfies {
  dynamicEnvironmentId: string
  dynamicApiToken: string
  encryptionKey: string
  port: number
  arbTestnetGasFaucetKey?: string
  sepoliaRpcUrl?: string
}
