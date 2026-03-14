import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { getOrCreateSession } from '../../../test/utils/auth-helper.js'
import { getDb } from '../../db/index.js'
import { custodialWallets } from '../../db/schema/index.js'
import { fastify } from './wallets.spec.js'

describe('GET /wallets/:id/balance', () => {
  it('should return 401 without Bearer token', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/wallets/some-id/balance',
    })
    expect(response.statusCode).toBe(401)
  })

  it('should return 404 for non-existent wallet', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-balance-404@test.ai')

    const response = await fastify.inject({
      method: 'GET',
      url: '/wallets/00000000-0000-0000-0000-000000000000/balance',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.statusCode).toBe(404)
  })

  it('should return balance', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-balance@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const balanceRes = await fastify.inject({
      method: 'GET',
      url: `/wallets/${id}/balance`,
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(balanceRes.statusCode).toBe(200)
    const body = JSON.parse(balanceRes.body)
    expect(body.balance).toBeDefined()
    expect(typeof body.balance).toBe('string')
    expect(/^\d+$/.test(body.balance)).toBe(true)
  })

  it('should return 404 when another user tries to access wallet', async () => {
    const tokenA = await getOrCreateSession(fastify, 'wallets-balance-own@test.ai')
    const tokenB = await getOrCreateSession(fastify, 'wallets-balance-other@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const balanceRes = await fastify.inject({
      method: 'GET',
      url: `/wallets/${id}/balance`,
      headers: { Authorization: `Bearer ${tokenB}` },
    })
    expect(balanceRes.statusCode).toBe(404)
  })

  it('should return 500 when encrypted private key is corrupted', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-balance-corrupt@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const db = await getDb()
    await db
      .update(custodialWallets)
      .set({ encryptedPrivateKey: 'invalid-base64-garbage' })
      .where(eq(custodialWallets.id, id))

    const balanceRes = await fastify.inject({
      method: 'GET',
      url: `/wallets/${id}/balance`,
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(balanceRes.statusCode).toBe(500)
  })
})
