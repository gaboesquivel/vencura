import { Elysia } from 'elysia'
import { helloRoute } from './routes/hello'
import { walletRoute } from './routes/wallet'

const app = new Elysia()
  .use(helloRoute)
  .use(walletRoute)
  .listen(Number(process.env.PORT) || 3077)

console.log(`🚀 Server is running on http://localhost:${app.server?.port}`)
