import { randomUUID } from 'node:crypto'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../../db/index.js'
import { custodialWallets } from '../../db/schema/index.js'
import {
  encryptPrivateKey,
  generateCustodialWallet,
  getAddress,
} from '../../lib/custodial-wallet.js'
import { ErrorResponseSchema } from '../schemas.js'

const CreateResponseSchema = Type.Object({
  id: Type.String(),
  address: Type.String(),
  chainId: Type.Number(),
  createdAt: Type.String({ format: 'date-time' }),
})

const createRoute: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().post(
    '/',
    {
      schema: {
        operationId: 'walletsCreate',
        description: 'Create custodial wallet',
        summary: 'Create custodial wallet',
        tags: ['wallets'],
        security: [{ bearerAuth: [] }],
        response: {
          201: CreateResponseSchema,
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

      const { address, privateKey } = await generateCustodialWallet()
      const encrypted = encryptPrivateKey(privateKey)
      if (!encrypted) throw new Error('Failed to encrypt private key')

      const id = randomUUID()
      const chainId = 11155111

      const db = await getDb()
      const [row] = await db
        .insert(custodialWallets)
        .values({
          id,
          userId: request.session.user.id,
          address: getAddress(address),
          encryptedPrivateKey: encrypted,
          chainId,
        })
        .returning()

      if (!row) throw new Error('Failed to create wallet')

      return reply.code(201).send({
        id: row.id,
        address: row.address,
        chainId: row.chainId,
        createdAt: row.createdAt.toISOString(),
      })
    },
  )
}

export default createRoute
export const prefixOverride = '/wallets'
