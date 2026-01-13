import { Elysia } from 'elysia'
import { createWalletContract, sendTransactionContract, listWalletsContract } from '@vencura/types'
import { createWalletService, getUserWallets } from '../services/wallet.service'
import { sendTransactionService } from '../services/transaction.service'
import { getUserId, type AuthContext } from '../middleware/auth'
import { registerRoute } from '../http/register-route'

export const walletRoute = new Elysia().derive(({ request }) => ({
  userId: getUserId(request),
}))

registerRoute<typeof listWalletsContract, AuthContext>(walletRoute, listWalletsContract, async ({ userId }) => {
  const wallets = await getUserWallets(userId)
  return wallets.map(w => ({
    id: w.id,
    address: w.address,
    chainType: w.chainType,
  }))
})

registerRoute<typeof createWalletContract, AuthContext>(walletRoute, createWalletContract, async ({ body, userId }) => {
  const result = await createWalletService({ userId, chainType: body.chainType })
  return {
    id: result.id,
    address: result.address,
    chainType: result.chainType,
  }
})

registerRoute<typeof sendTransactionContract, AuthContext>(walletRoute, sendTransactionContract, async ({ params, body, userId }) => {
  const result = await sendTransactionService({
    userId,
    walletId: params.id,
    to: body.to,
    amount: body.amount,
    data: body.data ?? undefined,
  })
  return {
    transactionHash: result.transactionHash,
  }
})
