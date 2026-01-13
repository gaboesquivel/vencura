// Load environment files before other imports
import './lib/load-env'

import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'
import { errorPlugin } from './http/error-plugin'
import { walletRoute } from './routes/wallet'
import { balanceRoute } from './routes/balance'
import { chatRoute } from './routes/chat'
import { zEnv } from './lib/env'

const app = new Elysia()
  .use(errorPlugin)
  .use(
    openapi({
      path: '/docs',
      specPath: '/docs/json',
      documentation: {
        info: {
          title: 'Vencura API',
          description: 'API for managing custodial wallets and transactions',
          version: '0.0.1',
        },
      },
    }),
  )
  .use(walletRoute)
  .use(balanceRoute)
  .use(chatRoute)
  .listen(zEnv.PORT)

console.log(`🚀 Server is running on http://localhost:${app.server?.port}`)
console.log(`📚 OpenAPI docs available at http://localhost:${app.server?.port}/docs`)