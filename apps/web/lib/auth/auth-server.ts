import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import type { AuthCookie } from './auth-schemas'
import { parseAuthCookie } from './parse-auth-cookie'

const cookieName = env.NEXT_PUBLIC_AUTH_COOKIE_NAME

function getAuthCookieOptions({ maxAge }: { maxAge?: number }) {
  return {
    httpOnly: false,
    maxAge,
    path: '/',
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
  }
}

/** Extract exp claim from JWT payload (Dynamic or any standard JWT). */
function getExpFromJwt(token: string): number | null {
  try {
    const parts = token.split('.')
    const payloadPart = parts[1]
    if (parts.length !== 3 || !payloadPart) return null
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

function getMaxAgeFromToken(token: string): number {
  const exp = getExpFromJwt(token)
  if (!exp) return 86400
  return Math.max(0, Math.floor(exp - Date.now() / 1000))
}

export function setAuthCookiesOnResponse(
  response: { cookies: { set: (name: string, value: string, opts?: object) => void } },
  data: AuthCookie,
) {
  const maxAge = getMaxAgeFromToken(data.token)
  const opts = getAuthCookieOptions({ maxAge })
  const cleanOpts = Object.fromEntries(Object.entries(opts).filter(([, v]) => v !== undefined))
  response.cookies.set(cookieName, JSON.stringify({ token: data.token }), cleanOpts as typeof opts)
}

export function setSyncTokenCookie(
  response: { cookies: { set: (name: string, value: string, opts?: object) => void } },
  token: string,
) {
  setAuthCookiesOnResponse(response, { token })
}

export function clearAuthCookiesOnResponse(response: {
  cookies: { set: (name: string, value: string, opts?: object) => void }
}) {
  const opts = getAuthCookieOptions({ maxAge: 0 })
  const cleanOpts = Object.fromEntries(Object.entries(opts).filter(([, v]) => v !== undefined))
  response.cookies.set(cookieName, '', { ...cleanOpts, maxAge: 0 } as typeof opts)
}

export async function getServerAuthToken(): Promise<{ token: string | null }> {
  const cookieStore = await cookies()
  const { token } = parseAuthCookie(cookieStore.get(cookieName)?.value)
  return { token }
}
