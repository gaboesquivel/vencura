import type { FastifyPluginAsync } from 'fastify'
import { env } from '../lib/env.js'
import { getReferenceHtml } from './reference/template.js'

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
    '/',
    {
      schema: { hide: true, tags: ['public'], security: [] },
    },
    async (request, reply) => {
      const host = request.headers.host || `${request.hostname}:${env.PORT}`
      const apiUrl = `${request.protocol}://${host}`
      const openApiUrl = `${apiUrl}/reference/openapi.json`
      const webAppUrl = env.WEB_APP_URL ?? apiUrl.replace(/\/$/, '').replace(/:\d+$/, ':3000')
      const html = getReferenceHtml({ apiUrl, openApiUrl, webAppUrl })
      return reply.type('text/html').send(html)
    },
  )
}

export default referenceRoutes
export const prefixOverride = '/reference'
