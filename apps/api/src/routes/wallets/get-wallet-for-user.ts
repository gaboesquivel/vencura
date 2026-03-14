import { and, eq } from 'drizzle-orm'
import type { getDb } from '../../db/index.js'
import { type CustodialWallet, custodialWallets } from '../../db/schema/index.js'

type Db = Awaited<ReturnType<typeof getDb>>

export async function getWalletForUser(
  db: Db,
  walletId: string,
  userId: string,
): Promise<CustodialWallet | null> {
  const [row] = await db
    .select()
    .from(custodialWallets)
    .where(and(eq(custodialWallets.id, walletId), eq(custodialWallets.userId, userId)))
  return row ?? null
}
