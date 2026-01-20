import swagger from '@fastify/swagger'
import scalar from '@scalar/fastify-api-reference'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

const openapi: FastifyPluginAsync = async fastify => {
  // Register Swagger plugin to generate OpenAPI spec
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Vencura API',
        version: '1.0.0',
        description: 'Vencura API documentation',
      },
    },
  })

  // Register Scalar UI plugin with OpenAPI document
  // Scalar will read from fastify.swagger()
  await fastify.register(scalar, {
    routePrefix: '/reference',
    configuration: {
      content: () => fastify.swagger(),
    },
  })
}

export default fp(openapi, {
  name: 'openapi',
})
