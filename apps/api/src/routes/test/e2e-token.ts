import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../../db/index.js'
import { apiKeys, users } from '../../db/schema/index.js'
import { generateApiKey } from '../../lib/api-keys.js'
import { env } from '../../lib/env.js'

/** Returns API key for E2E tests when ALLOW_TEST. Used by Scalar reference login E2E. */
const e2eTokenRoute: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/',
    {
      schema: {
        hide: true,
        tags: ['test'],
        description: 'Returns an API key for E2E when ALLOW_TEST (Scalar reference flow)',
        response: {
          200: { type: 'object', properties: { token: { type: 'string' } }, required: ['token'] },
          403: {
            type: 'object',
            properties: { code: { type: 'string' }, message: { type: 'string' } },
            required: ['code', 'message'],
          },
        },
      },
    },
    async (_request, reply) => {
      if (!env.ALLOW_TEST)
        return reply
          .code(403)
          .send({ code: 'FORBIDDEN', message: 'E2E token only when ALLOW_TEST' })

      const db = await getDb()
      const email = 'e2e-scalar@test.ai'
      const [existing] = await db.select().from(users).where(eq(users.email, email))
      const userId = existing?.id ?? randomUUID()
      if (!existing)
        await db.insert(users).values({
          id: userId,
          dynamicUserId: randomUUID(),
          email,
          emailVerified: true,
          name: 'E2E Scalar User',
        })

      const { key, prefix, hash } = generateApiKey()
      await db.insert(apiKeys).values({
        id: randomUUID(),
        userId,
        name: 'E2E Scalar Key',
        prefix,
        hash,
      })
      return reply.send({ token: key })
    },
  )
}

export default e2eTokenRoute
export const prefixOverride = '/test/e2e-token'
