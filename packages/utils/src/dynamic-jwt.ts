import type { JwtPayload } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'
import { JwksClient } from 'jwks-rsa'

const jwksUrl = (envId: string) => `https://app.dynamic.xyz/api/v0/sdk/${envId}/.well-known/jwks`

type DynamicJwtPayload = JwtPayload & {
  sub: string
  sid?: string
  exp?: number
  iat?: number
  email?: string
  // biome-ignore lint/style/useNamingConvention: JWT claims use snake_case
  given_name?: string
  // biome-ignore lint/style/useNamingConvention: JWT claims use snake_case
  family_name?: string
  // biome-ignore lint/style/useNamingConvention: JWT claims use snake_case
  verified_credentials?: Array<{ chain: string; address: string; id?: string }>
  // biome-ignore lint/style/useNamingConvention: JWT claims use snake_case
  verified_account?: { chain: string; address: string }
}

export type DecodedDynamicJwt = DynamicJwtPayload

const clientCache = new Map<string, JwksClient>()

function getJwksClient(envId: string): JwksClient {
  let client = clientCache.get(envId)
  if (!client) {
    client = new JwksClient({
      jwksUri: jwksUrl(envId),
      rateLimit: true,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600_000,
    })
    clientCache.set(envId, client)
  }
  return client
}

export async function verifyDynamicJwt(
  token: string,
  envId: string,
): Promise<DecodedDynamicJwt | null> {
  if (!envId || !token) return null
  try {
    const client = getJwksClient(envId)
    const decoded = await new Promise<DynamicJwtPayload>((resolve, reject) => {
      const getKey = (header: jwt.JwtHeader, cb: (e: Error | null, key?: string) => void) => {
        client.getSigningKey(header.kid).then(
          key => cb(null, key?.getPublicKey()),
          err => cb(err as Error),
        )
      }
      jwt.verify(
        token,
        getKey,
        { algorithms: ['RS256'], ignoreExpiration: false },
        (err, decoded) => {
          if (err) reject(err)
          else resolve(decoded as DynamicJwtPayload)
        },
      )
    })
    if (!decoded.sub) return null
    return decoded
  } catch {
    return null
  }
}
