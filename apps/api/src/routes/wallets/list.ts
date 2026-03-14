import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../../db/index.js'
import { custodialWallets } from '../../db/schema/index.js'
import { ErrorResponseSchema } from '../schemas.js'

const WalletItemSchema = Type.Object({
  id: Type.String(),
  address: Type.String(),
  chainId: Type.Number(),
  createdAt: Type.String({ format: 'date-time' }),
})

const ListResponseSchema = Type.Object({
  wallets: Type.Array(WalletItemSchema),
})

const listRoute: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/',
    {
      schema: {
        operationId: 'walletsList',
        description: 'List custodial wallets for authenticated user',
        summary: 'List wallets',
        tags: ['wallets'],
        security: [{ bearerAuth: [] }],
        response: {
          200: ListResponseSchema,
          401: ErrorResponseSchema,
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
      const rows = await db
        .select({
          id: custodialWallets.id,
          address: custodialWallets.address,
          chainId: custodialWallets.chainId,
          createdAt: custodialWallets.createdAt,
        })
        .from(custodialWallets)
        .where(eq(custodialWallets.userId, request.session.user.id))

      return reply.code(200).send({
        wallets: rows.map(r => ({
          id: r.id,
          address: r.address,
          chainId: r.chainId,
          createdAt: r.createdAt.toISOString(),
        })),
      })
    },
  )
}

export default listRoute
export const prefixOverride = '/wallets'
