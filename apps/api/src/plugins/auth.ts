import { randomUUID } from 'node:crypto'
import { captureError } from '@repo/error/node'
import { verifyDynamicJwt } from '@repo/utils/dynamic-jwt'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { getDb } from '../db/index.js'
import { users } from '../db/schema/index.js'
import { authenticateWithApiKey } from '../lib/api-key-auth.js'
import { env } from '../lib/env.js'

declare module 'fastify' {
  interface FastifyRequest {
    session?: {
      user: {
        id: string
        email?: string | null
        name?: string | null
        username?: string | null
        wallet?: { chain: string; address: string }
      }
      session: {
        id: string
        userId: string
        expiresAt: Date
      }
      decodedCredentials?: Array<{ id?: string; chain: string; address: string }>
    } | null
  }
}

const authPlugin: FastifyPluginAsync = async fastify => {
  fastify.addHook('onRequest', async request => {
    try {
      const apiKeyHeader = request.headers['x-api-key']
      const authHeader = request.headers.authorization

      const apiKeyToken =
        typeof apiKeyHeader === 'string'
          ? apiKeyHeader.trim()
          : authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7).trim().startsWith('venc_')
              ? authHeader.substring(7).trim()
              : null
            : null

      if (apiKeyToken) {
        const db = await getDb()
        const session = await authenticateWithApiKey(apiKeyToken, db)
        request.session = session
        return
      }

      if (!authHeader?.startsWith('Bearer ')) {
        request.session = null
        return
      }

      const token = authHeader.substring(7).trim()
      const envId = env.DYNAMIC_ENVIRONMENT_ID
      if (!envId) {
        request.session = null
        return
      }

      const decoded = await verifyDynamicJwt(token, envId)
      if (!decoded?.sub) {
        request.session = null
        return
      }

      const db = await getDb()
      let [user] = await db.select().from(users).where(eq(users.dynamicUserId, decoded.sub))

      if (!user) {
        const name = [decoded.given_name, decoded.family_name].filter(Boolean).join(' ') || null
        const newUser = {
          id: randomUUID(),
          dynamicUserId: decoded.sub,
          email: decoded.email ?? null,
          name: name || null,
          username: null,
          emailVerified: !!decoded.email,
        }
        await db.insert(users).values(newUser)
        user = { ...newUser, image: null, createdAt: new Date(), updatedAt: new Date() }
      }

      const wallet = decoded.verified_account ?? decoded.verified_credentials?.[0]

      const credentials = decoded.verified_credentials ?? []
      request.session = {
        user: {
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
          username: user.username ?? null,
          ...(wallet && { wallet: { chain: wallet.chain, address: wallet.address } }),
        },
        session: {
          id: decoded.sid ?? decoded.sub,
          userId: user.id,
          expiresAt: new Date((decoded.exp ?? 0) * 1000),
        },
        decodedCredentials: credentials.map(c => ({
          id: c.id,
          chain: c.chain,
          address: c.address,
        })),
      }
    } catch (error) {
      if (error instanceof Error && !error.message.includes('jwt'))
        captureError({
          code: 'INTERNAL_ERROR',
          error,
          logger: request.log,
          label: 'auth.api.getSession failed',
          data: { method: request.method, url: request.url },
          tags: { app: 'api', module: 'auth-service', route: request.url },
        })
      request.session = null
    }
  })
}

export default fp(authPlugin, { name: 'auth' })
