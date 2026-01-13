import type { Elysia } from 'elysia'
import type {
  Contract,
  InferBody,
  InferParams,
  InferQuery,
  InferHeaders,
  InferResponse,
} from '@vencura/types/contracts'

type HandlerCtx<
  C extends Contract,
  Extra extends Record<string, unknown> = Record<string, never>,
> = Extra &
  (C['body'] extends undefined ? Record<string, never> : { body: InferBody<C> }) &
  (C['params'] extends undefined ? Record<string, never> : { params: InferParams<C> }) &
  (C['query'] extends undefined ? Record<string, never> : { query: InferQuery<C> }) &
  (C['headers'] extends undefined ? Record<string, never> : { headers: InferHeaders<C> })

export type RegisterRouteOptions = {
  /**
   * Max perf: set false in prod. Keep true in tests/dev if you want.
   * Default: true in non-prod, false in prod.
   */
  validateResponse?: boolean
}

export function registerRoute<
  C extends Contract,
  Extra extends Record<string, unknown> = Record<string, never>,
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: Elysia<any, any, any, any, any, any, any>,
  contract: C,
  handler: (ctx: HandlerCtx<C, Extra>) => Promise<InferResponse<C>> | InferResponse<C>,
  opts: RegisterRouteOptions = {},
) {
  const validateResponse = opts.validateResponse ?? process.env.NODE_ENV !== 'production'

  const routeOptions: Record<string, unknown> = {
    ...(contract.body ? { body: contract.body } : {}),
    ...(contract.params ? { params: contract.params } : {}),
    ...(contract.query ? { query: contract.query } : {}),
    ...(contract.headers ? { headers: contract.headers } : {}),
    // Elysia `detail` extends OpenAPI Operation Object
    ...(contract.openapi ? { detail: contract.openapi } : {}),
  }

  const wrapped = async (ctx: HandlerCtx<C, Extra>) => {
    const out = await handler(ctx)
    return validateResponse ? contract.response.parse(out) : out
  }

  switch (contract.method) {
    case 'GET':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (app as any).get(contract.path, wrapped, routeOptions)
    case 'POST':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (app as any).post(contract.path, wrapped, routeOptions)
    case 'PUT':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (app as any).put(contract.path, wrapped, routeOptions)
    case 'PATCH':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (app as any).patch(contract.path, wrapped, routeOptions)
    case 'DELETE':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (app as any).delete(contract.path, wrapped, routeOptions)
    default: {
      const _exhaustive: never = contract.method
      return _exhaustive
    }
  }
}
