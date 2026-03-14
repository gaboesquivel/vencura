import { describe, expect, it } from 'vitest'
import { getOrCreateSession } from '../../../test/utils/auth-helper.js'
import { fastify } from './wallets.spec.js'

describe('POST /wallets/:id/sign', () => {
  it('should return 401 without Bearer token', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/wallets/some-id/sign',
      payload: { msg: 'Hello' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('should return 404 for non-existent wallet', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-sign-404@test.ai')

    const response = await fastify.inject({
      method: 'POST',
      url: '/wallets/00000000-0000-0000-0000-000000000000/sign',
      headers: { Authorization: `Bearer ${token}` },
      payload: { msg: 'Hello' },
    })
    expect(response.statusCode).toBe(404)
  })

  it('should sign message', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-sign@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const signRes = await fastify.inject({
      method: 'POST',
      url: `/wallets/${id}/sign`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { msg: 'Hello VenCura' },
    })
    expect(signRes.statusCode).toBe(200)
    const body = JSON.parse(signRes.body)
    expect(body.signedMessage).toBeDefined()
    expect(body.signedMessage).toMatch(/^0x[a-fA-F0-9]+$/)
  })

  it('should return 404 when another user tries to access wallet', async () => {
    const tokenA = await getOrCreateSession(fastify, 'wallets-sign-own@test.ai')
    const tokenB = await getOrCreateSession(fastify, 'wallets-sign-other@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const signRes = await fastify.inject({
      method: 'POST',
      url: `/wallets/${id}/sign`,
      headers: { Authorization: `Bearer ${tokenB}` },
      payload: { msg: 'Hello' },
    })
    expect(signRes.statusCode).toBe(404)
  })
})
