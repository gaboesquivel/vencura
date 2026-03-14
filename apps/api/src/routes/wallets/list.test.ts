import { describe, expect, it } from 'vitest'
import { getOrCreateSession } from '../../../test/utils/auth-helper.js'
import { fastify } from './wallets.spec.js'

describe('GET /wallets', () => {
  it('should return 401 without Bearer token', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/wallets',
    })
    expect(response.statusCode).toBe(401)
  })

  it('should list user wallets', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-list@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(createRes.statusCode).toBe(201)

    const listRes = await fastify.inject({
      method: 'GET',
      url: '/wallets',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(listRes.statusCode).toBe(200)
    const body = JSON.parse(listRes.body)
    expect(body.wallets).toBeInstanceOf(Array)
    expect(body.wallets.length).toBeGreaterThanOrEqual(1)
    expect(body.wallets[0]).toHaveProperty('id')
    expect(body.wallets[0]).toHaveProperty('address')
    expect(body.wallets[0]).toHaveProperty('chainId', 11155111)
  })
})
