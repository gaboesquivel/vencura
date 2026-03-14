import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../../db/index.js'
import { signWalletMessage } from '../../lib/custodial-wallet.js'
import { ErrorResponseSchema } from '../schemas.js'
import { getWalletForUser } from './get-wallet-for-user.js'

const IdParamsSchema = Type.Object({ id: Type.String() })

const SignBodySchema = Type.Object({ msg: Type.String() })

const SignResponseSchema = Type.Object({
  signedMessage: Type.String(),
})

const signRoute: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().post<{
    Params: { id: string }
    Body: { msg: string }
  }>(
    '/:id/sign',
    {
      schema: {
        operationId: 'walletsSign',
        description: 'Sign message with custodial wallet',
        summary: 'Sign message',
        tags: ['wallets'],
        security: [{ bearerAuth: [] }],
        params: IdParamsSchema,
        body: SignBodySchema,
        response: {
          200: SignResponseSchema,
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

      const signedMessage = await signWalletMessage(wallet, request.body.msg)
      return reply.code(200).send({ signedMessage })
    },
  )
}

export default signRoute
export const prefixOverride = '/wallets'
