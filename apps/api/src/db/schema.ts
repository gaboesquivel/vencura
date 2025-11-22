import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'

/**
 * Key shares table - stores encrypted server-side key shares for wallet signing operations.
 * Keyed by userId, wallet address, and chainType (e.g., 'evm', 'solana').
 * This is the only wallet-related data we store - all other wallet metadata comes from Dynamic SDK.
 * One wallet per user per chainType, matching DynamicSDK's model.
 */
export const keyShares = pgTable(
  'key_shares',
  {
    userId: text('user_id').notNull(), // User ID to scope wallets per user
    address: text('address').notNull(), // Wallet address
    chainType: text('chain_type').notNull(), // Chain type (e.g., 'evm', 'solana')
    encryptedKeyShares: text('encrypted_key_shares').notNull(), // Encrypted externalServerKeyShares from Dynamic SDK
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.userId, table.address, table.chainType] }),
  }),
)

export const schema = {
  keyShares,
}
