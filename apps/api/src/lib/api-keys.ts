import { randomBytes } from 'node:crypto'
import { generateToken, hashToken } from './token-utils.js'

const prefixLength = 8 // 6 bytes base64url = 8 chars

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = randomBytes(6).toString('base64url')
  const secret = generateToken()
  const key = `venc_${prefix}_${secret}`
  const hash = hashToken(secret)
  return { key, prefix, hash }
}

export function parseApiKey(token: string): { prefix: string; secret: string } | null {
  if (!token.startsWith('venc_')) return null
  const afterPrefix = token.slice(5)
  if (afterPrefix.length <= prefixLength + 1 || afterPrefix[prefixLength] !== '_') return null

  const prefix = afterPrefix.slice(0, prefixLength)
  const secret = afterPrefix.slice(prefixLength + 1)
  if (!secret) return null
  return { prefix, secret }
}
