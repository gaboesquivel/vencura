import type { IncomingMessage, ServerResponse } from 'node:http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Fastify from 'fastify'
import app from '../src/app.js'
import { waitForDatabase } from '../src/db/health.js'
import { runMigrations } from '../src/db/migrate.js'
import { env } from '../src/lib/env.js'

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  trustProxy: true,
  bodyLimit: env.BODY_LIMIT,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
})

fastify.register(app)

let isReady = false
let isInitialized = false

/**
 * Initialize database and run migrations (runs once per serverless function instance)
 */
const initialize = async () => {
  if (isInitialized) {
    return
  }

  const logger = {
    info: (msg: string) => fastify.log.info(msg),
    error: (msg: string, err?: unknown) => fastify.log.error({ err }, msg),
  }

  try {
    // Wait for database connection
    await waitForDatabase(logger)

    // Run migrations
    await runMigrations(logger)

    isInitialized = true
  } catch (err) {
    fastify.log.error({ err }, 'Initialization failed')
    // Don't throw - allow function to start even if migrations fail
    // This prevents complete failure if there's a transient issue
  }
}

const ensureReady = async () => {
  if (!isReady) {
    // Initialize database and migrations before ready
    await initialize()
    await fastify.ready()
    isReady = true
  }
}

export default async (req: VercelRequest, res: VercelResponse) => {
  await ensureReady()
  fastify.server.emit(
    'request',
    req as unknown as IncomingMessage,
    res as unknown as ServerResponse,
  )
}
