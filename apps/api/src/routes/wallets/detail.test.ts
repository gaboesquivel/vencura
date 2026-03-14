import { describe, expect, it } from 'vitest'
import { getOrCreateSession } from '../../../test/utils/auth-helper.js'
import { fastify } from './wallets.spec.js'

describe('GET /wallets/:id', () => {
  it('should return 401 without Bearer token', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/wallets/some-id',
    })
    expect(response.statusCode).toBe(401)
  })

  it('should return 404 for non-existent wallet', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-detail-404@test.ai')

    const response = await fastify.inject({
      method: 'GET',
      url: '/wallets/00000000-0000-0000-0000-000000000000',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.statusCode).toBe(404)
  })

  it('should return wallet by id', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-detail@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const detailRes = await fastify.inject({
      method: 'GET',
      url: `/wallets/${id}`,
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(detailRes.statusCode).toBe(200)
    const body = JSON.parse(detailRes.body)
    expect(body.id).toBe(id)
    expect(body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(body.chainId).toBe(11155111)
  })

  it('should return 404 when another user tries to access wallet', async () => {
    const tokenA = await getOrCreateSession(fastify, 'wallets-detail-own@test.ai')
    const tokenB = await getOrCreateSession(fastify, 'wallets-detail-other@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const detailRes = await fastify.inject({
      method: 'GET',
      url: `/wallets/${id}`,
      headers: { Authorization: `Bearer ${tokenB}` },
    })
    expect(detailRes.statusCode).toBe(404)
  })
})
