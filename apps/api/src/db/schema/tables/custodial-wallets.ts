import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const custodialWallets = pgTable(
  'custodial_wallets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    address: text('address').notNull(),
    encryptedPrivateKey: text('encrypted_private_key').notNull(),
    chainId: integer('chain_id').notNull().default(11155111),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => [
    index('custodial_wallets_user_id_idx').on(table.userId),
    index('custodial_wallets_address_idx').on(table.address),
  ],
)

export type CustodialWallet = typeof custodialWallets.$inferSelect
export type NewCustodialWallet = typeof custodialWallets.$inferInsert
