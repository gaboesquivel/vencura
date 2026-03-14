import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../../db/index.js'
import { getWalletBalance } from '../../lib/custodial-wallet.js'
import { ErrorResponseSchema } from '../schemas.js'
import { getWalletForUser } from './get-wallet-for-user.js'

const IdParamsSchema = Type.Object({ id: Type.String() })

const BalanceResponseSchema = Type.Object({
  balance: Type.String(),
})

const balanceRoute: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get<{
    Params: { id: string }
  }>(
    '/:id/balance',
    {
      schema: {
        operationId: 'walletsBalance',
        description: 'Get custodial wallet balance (wei)',
        summary: 'Get balance',
        tags: ['wallets'],
        security: [{ bearerAuth: [] }],
        params: IdParamsSchema,
        response: {
          200: BalanceResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.session)
        return reply.code(401).send({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        })

      const db = await getDb()
      const wallet = await getWalletForUser(db, request.params.id, request.session.user.id)
      if (!wallet)
        return reply.code(404).send({
          code: 'NOT_FOUND',
          message: 'Wallet not found',
        })

      const balance = await getWalletBalance(wallet)
      return reply.code(200).send({ balance })
    },
  )
}

export default balanceRoute
export const prefixOverride = '/wallets'
