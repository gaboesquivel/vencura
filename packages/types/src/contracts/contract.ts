import type { z } from 'zod'
import type { OpenAPIV3 } from 'openapi-types'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type ZodAny = z.ZodTypeAny

// Elysia `detail` extends OpenAPI Operation Object, so we keep this compatible
export type OperationMeta = Pick<
  OpenAPIV3.OperationObject,
  'summary' | 'description' | 'tags' | 'operationId' | 'deprecated' | 'security' | 'externalDocs'
>

// Minimal MCP meta (optional; keep it separate from OpenAPI)
export type McpMeta = {
  toolName: string
  description?: string
}

// Key-based Contract type (avoid generic explosion)
export type Contract = {
  method: HttpMethod
  path: string
  body?: ZodAny
  params?: ZodAny
  query?: ZodAny
  headers?: ZodAny
  response: ZodAny // single success response
  openapi?: OperationMeta
  mcp?: McpMeta
}

// Inference utilities (key-based)
export type InferBody<C extends Contract> = C['body'] extends ZodAny
  ? z.infer<C['body']>
  : undefined

export type InferParams<C extends Contract> = C['params'] extends ZodAny
  ? z.infer<C['params']>
  : undefined

export type InferQuery<C extends Contract> = C['query'] extends ZodAny
  ? z.infer<C['query']>
  : undefined

export type InferHeaders<C extends Contract> = C['headers'] extends ZodAny
  ? z.infer<C['headers']>
  : undefined

export type InferResponse<C extends Contract> = z.infer<C['response']>

// Optional brand symbol for runtime validation
export const CONTRACT_BRAND = Symbol('contract')

export function defineContract<const C extends Contract>(contract: C): C {
  // Add brand symbol for runtime validation
  return {
    ...contract,
    [CONTRACT_BRAND]: true as const,
  } as C & { [CONTRACT_BRAND]: true }
}
