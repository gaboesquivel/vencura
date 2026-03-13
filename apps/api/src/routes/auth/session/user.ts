import { Type } from '@sinclair/typebox'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../../../db/index.js'
import { users, walletIdentities } from '../../../db/schema/index.js'
import { ErrorResponseSchema } from '../../schemas.js'

const LinkedWalletSchema = Type.Object({
  id: Type.String(),
  chain: Type.String(),
  address: Type.String(),
})

const LinkedAccountSchema = Type.Object({
  providerId: Type.String(),
})

const UserResponseSchema = Type.Object({
  user: Type.Object({
    id: Type.String(),
    email: Type.Union([Type.String(), Type.Null()]),
    name: Type.Union([Type.String(), Type.Null()]),
    username: Type.Union([Type.String(), Type.Null()]),
    emailVerified: Type.Union([Type.Boolean(), Type.Null()]),
    wallet: Type.Optional(Type.Object({ chain: Type.String(), address: Type.String() })),
    linkedWallets: Type.Array(LinkedWalletSchema),
    linkedAccounts: Type.Array(LinkedAccountSchema),
  }),
})

const sessionUserRoute: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/user',
    {
      schema: {
        operationId: 'getUser',
        description: 'Get current user information',
        summary: 'Get user',
        tags: ['auth'],
        security: [{ bearerAuth: [] }],
        response: {
          200: UserResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.session)
        return reply.code(401).send({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        })

      const userId = request.session.user.id
      let userRow: { name?: string | null; username?: string | null } | undefined
      const db = await getDb()

      try {
        ;[userRow] = await db
          .select({ name: users.name, username: users.username })
          .from(users)
          .where(eq(users.id, userId))
      } catch {
        return reply.code(500).send({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user data',
        })
      }

      const credentials = request.session.decodedCredentials ?? []
      let linkedWallets = credentials.map(c => ({
        id: c.id ?? c.address,
        chain: c.chain,
        address: c.address,
      }))
      if (linkedWallets.length === 0) {
        const fromDb = await db
          .select({
            id: walletIdentities.id,
            chain: walletIdentities.chain,
            address: walletIdentities.address,
          })
          .from(walletIdentities)
          .where(eq(walletIdentities.userId, userId))
        linkedWallets = fromDb
      }
      const linkedAccounts = credentials
        .filter(c => c.chain !== 'eip155' && c.chain !== 'solana')
        .map(c => ({ providerId: c.chain }))

      return reply.code(200).send({
        user: {
          id: request.session.user.id,
          email: request.session.user.email,
          name: userRow?.name ?? request.session.user.name ?? null,
          username: userRow?.username ?? request.session.user.username ?? null,
          emailVerified: null,
          ...(request.session.user.wallet && { wallet: request.session.user.wallet }),
          linkedWallets,
          linkedAccounts,
        },
      })
    },
  )
}

export default sessionUserRoute
export const prefixOverride = '/auth/session'
