import { Elysia } from 'elysia'
import { balanceContract } from '@vencura/types'
import { getBalanceService } from '../services/balance.service'
import { getUserId, type AuthContext } from '../middleware/auth'
import { registerRoute } from '../http/register-route'

export const balanceRoute = new Elysia().derive(({ request }) => ({
  userId: getUserId(request),
}))

registerRoute<typeof balanceContract, AuthContext>(balanceRoute, balanceContract, async ({ body, userId }) => {
  return getBalanceService({
    userId,
    chainId: body.chainId,
    chainType: body.chainType,
    tokenAddress: body.tokenAddress,
  })
})
