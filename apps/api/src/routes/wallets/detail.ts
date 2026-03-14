import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../../db/index.js'
import { ErrorResponseSchema } from '../schemas.js'
import { getWalletForUser } from './get-wallet-for-user.js'

const IdParamsSchema = Type.Object({ id: Type.String() })

const DetailResponseSchema = Type.Object({
  id: Type.String(),
  address: Type.String(),
  chainId: Type.Number(),
  createdAt: Type.String({ format: 'date-time' }),
})

const detailRoute: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get<{
    Params: { id: string }
  }>(
    '/:id',
    {
      schema: {
        operationId: 'walletsDetail',
        description: 'Get custodial wallet by id',
        summary: 'Get wallet',
        tags: ['wallets'],
        security: [{ bearerAuth: [] }],
        params: IdParamsSchema,
        response: {
          200: DetailResponseSchema,
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

      return reply.code(200).send({
        id: wallet.id,
        address: wallet.address,
        chainId: wallet.chainId,
        createdAt: wallet.createdAt.toISOString(),
      })
    },
  )
}

export default detailRoute
export const prefixOverride = '/wallets'
