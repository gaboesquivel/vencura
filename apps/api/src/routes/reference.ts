import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { FastifyPluginAsync } from 'fastify'
import { env } from '../lib/env.js'
import { getReferenceHtml } from './reference/template.js'

function readReferenceDynamicBundle(): Buffer | null {
  const bundleUrl = new URL('./reference/reference-dynamic-auth.bundle.js', import.meta.url)
  const bundlePath = fileURLToPath(bundleUrl)
  if (!existsSync(bundlePath)) return null
  return readFileSync(bundlePath)
}

const referenceRoutes: FastifyPluginAsync = async fastify => {
  fastify.get(
    '/openapi.json',
    {
      schema: { hide: true, tags: ['public'], security: [] },
    },
    async (_request, reply) => {
      const openApiDoc = fastify.swagger()
      return reply.send(openApiDoc)
    },
  )

  fastify.get(
    '/dynamic-auth.js',
    {
      schema: { hide: true, tags: ['public'], security: [] },
    },
    async (_request, reply) => {
      const buf = readReferenceDynamicBundle()
      if (!buf)
        return reply
          .code(503)
          .type('text/plain; charset=utf-8')
          .send('Dynamic auth bundle missing. From apps/api run: pnpm build:reference-dynamic\n')
      return reply.type('application/javascript; charset=utf-8').send(buf)
    },
  )

  fastify.get(
    '/',
    {
      schema: { hide: true, tags: ['public'], security: [] },
    },
    async (request, reply) => {
      const host = request.headers.host || `${request.hostname}:${env.PORT}`
      const apiUrl = `${request.protocol}://${host}`
      const openApiUrl = `${apiUrl}/reference/openapi.json`
      const html = getReferenceHtml({
        apiUrl,
        openApiUrl,
        dynamicEnvId: env.DYNAMIC_ENVIRONMENT_ID,
        dynamicAppName: env.APP_NAME,
      })
      return reply.type('text/html').send(html)
    },
  )
}

export default referenceRoutes
export const prefixOverride = '/reference'
