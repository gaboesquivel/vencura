import { Elysia } from 'elysia'

export const helloRoute = new Elysia().get(
  '/hello',
  () => ({ message: 'Hello, World!' }),
  {
    detail: {
      summary: 'Hello World endpoint',
      description: 'Returns a simple hello message',
    },
  },
)
