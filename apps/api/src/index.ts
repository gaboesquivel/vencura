// Load environment files before other imports
import './lib/load-env'

import { Elysia } from 'elysia'
import { helloRoute } from './routes/hello'
import { walletRoute } from './routes/wallet'
import { zEnv } from './lib/env'

const app = new Elysia().use(helloRoute).use(walletRoute).listen(zEnv.PORT)

console.log(`🚀 Server is running on http://localhost:${app.server?.port}`)
