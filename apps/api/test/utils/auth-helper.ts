import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getDb } from '../../src/db/index.js'
import { apiKeys, users } from '../../src/db/schema/index.js'
import { generateApiKey } from '../../src/lib/api-keys.js'
import type { TestApp } from './fastify.js'

const sessionPool = new Map<string, string>()

async function getOrCreateUserByEmail(email: string): Promise<{ id: string }> {
  const db = await getDb()
  const [existing] = await db.select().from(users).where(eq(users.email, email))
  if (existing) return { id: existing.id }
  const id = randomUUID()
  await db.insert(users).values({
    id,
    dynamicUserId: randomUUID(),
    email,
    emailVerified: true,
    name: 'Test User',
  })
  return { id }
}

/** Returns API key for authenticated requests. Cached by email. */
export async function getOrCreateSession(
  _app: TestApp,
  email: string,
  options?: { clearBefore?: boolean },
): Promise<string> {
  if (options?.clearBefore) sessionPool.delete(email)
  const cached = sessionPool.get(email)
  if (cached) return cached
  const { id: userId } = await getOrCreateUserByEmail(email)
  const apiKey = await createApiKey(_app, userId, 'Test Session Key')
  sessionPool.set(email, apiKey)
  return apiKey
}

export function clearSessionPool(): void {
  sessionPool.clear()
}

export async function createApiKey(
  _app: TestApp,
  userId: string,
  name = 'Test Key',
): Promise<string> {
  const { key, prefix, hash } = generateApiKey()
  const db = await getDb()
  await db.insert(apiKeys).values({
    id: randomUUID(),
    userId,
    name,
    prefix,
    hash,
  })
  return key
}

export async function getApiKeyToken(app: TestApp, email: string): Promise<string> {
  const apiKey = await getOrCreateSession(app, email)
  const res = await app.inject({
    method: 'POST',
    url: '/account/apikeys',
    headers: { Authorization: `Bearer ${apiKey}` },
    payload: { name: 'Test Key' },
  })
  if (res.statusCode < 200 || res.statusCode >= 300)
    throw new Error(`create apikey failed: ${res.statusCode} ${res.body}`)

  const { key } = JSON.parse(res.body) as { key: string }
  return key
}

export async function createAuthenticatedUser(
  app: TestApp,
  overrides?: { email?: string },
): Promise<{ token: string; email: string }> {
  const email = overrides?.email ?? 'test@test.ai'
  const token = await getOrCreateSession(app, email)
  return { token, email }
}
