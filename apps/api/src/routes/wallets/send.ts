import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../../db/index.js'
import { getAddress, sendWalletTransaction } from '../../lib/custodial-wallet.js'
import { ErrorResponseSchema } from '../schemas.js'
import { getWalletForUser } from './get-wallet-for-user.js'

const IdParamsSchema = Type.Object({ id: Type.String() })

const SendBodySchema = Type.Object({
  to: Type.String(),
  amount: Type.String(),
})

const SendResponseSchema = Type.Object({
  transactionHash: Type.String(),
})

const sendRoute: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Params: { id: string }
    Body: { to: string; amount: string }
  }>(
    '/:id/send',
    {
      schema: {
        operationId: 'walletsSend',
        description: 'Send transaction from custodial wallet',
        summary: 'Send transaction',
        tags: ['wallets'],
        security: [{ bearerAuth: [] }],
        params: IdParamsSchema,
        body: SendBodySchema,
        response: {
          200: SendResponseSchema,
          400: ErrorResponseSchema,
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

      let normalizedTo: string
      try {
        normalizedTo = getAddress(request.body.to)
      } catch {
        return reply.code(400).send({
          code: 'INVALID_ADDRESS',
          message: 'Invalid recipient address',
        })
      }

      try {
        const transactionHash = await sendWalletTransaction(
          wallet,
          normalizedTo,
          request.body.amount,
        )
        return reply.code(200).send({ transactionHash })
      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'INSUFFICIENT_FUNDS')
          return reply.code(400).send({
            code: 'INSUFFICIENT_FUNDS',
            message: 'Insufficient funds',
          })
        throw err
      }
    },
  )
}

export default sendRoute
export const prefixOverride = '/wallets'
