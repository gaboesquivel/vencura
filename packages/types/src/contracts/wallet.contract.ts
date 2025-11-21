import { CreateWalletInputSchema, WalletSchema } from '../schemas/wallet.schema'

/**
 * Create wallet endpoint contract.
 * Defines the POST /wallets endpoint structure.
 */
export const createWalletContract = {
  method: 'POST' as const,
  path: '/wallets',
  body: CreateWalletInputSchema,
  response: WalletSchema,
}

export type CreateWalletContract = typeof createWalletContract
