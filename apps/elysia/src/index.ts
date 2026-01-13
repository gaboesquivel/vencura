// Load environment files before other imports
import './lib/load-env'

import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { helloRoute } from './routes/hello'
import { zEnv } from './lib/env'

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Vencura API',
          description: 'API documentation for Vencura',
          version: '0.0.1',
        },
        tags: [
          { name: 'hello', description: 'Hello endpoints' },
        ],
      },
    }),
  )
  .use(helloRoute)
  .listen(zEnv.PORT)

console.log(`🚀 Server is running on http://localhost:${app.server?.port}`)
console.log(`📚 Swagger documentation available at http://localhost:${app.server?.port}/swagger`)