import { describe, expect, it } from 'vitest'
import { getOrCreateSession } from '../../../test/utils/auth-helper.js'
import { withTestEnvOverride } from '../../../test/utils/test-env-override.js'
import { fastify } from './wallets.spec.js'

describe('POST /wallets/:id/send', () => {
  it('should return 401 without Bearer token', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/wallets/some-id/send',
      payload: { to: '0x0000000000000000000000000000000000000001', amount: '0.001' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('should return 404 for non-existent wallet', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-send-404@test.ai')

    const response = await fastify.inject({
      method: 'POST',
      url: '/wallets/00000000-0000-0000-0000-000000000000/send',
      headers: { Authorization: `Bearer ${token}` },
      payload: { to: '0x0000000000000000000000000000000000000001', amount: '0.001' },
    })
    expect(response.statusCode).toBe(404)
  })

  it('should return 400 for invalid address', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-send-invalid@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const sendRes = await fastify.inject({
      method: 'POST',
      url: `/wallets/${id}/send`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { to: 'invalid', amount: '0.001' },
    })
    expect(sendRes.statusCode).toBe(400)
    const body = JSON.parse(sendRes.body)
    expect(body.code).toBe('INVALID_ADDRESS')
  })

  it('should return 400 for insufficient funds', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-send-funds@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const sendRes = await fastify.inject({
      method: 'POST',
      url: `/wallets/${id}/send`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        to: '0x0000000000000000000000000000000000000001',
        amount: '1',
      },
    })
    expect(sendRes.statusCode).toBe(400)
    const body = JSON.parse(sendRes.body)
    expect(body.code).toBe('INSUFFICIENT_FUNDS')
  })

  it('should return 404 when another user tries to access wallet', async () => {
    const tokenA = await getOrCreateSession(fastify, 'wallets-send-own@test.ai')
    const tokenB = await getOrCreateSession(fastify, 'wallets-send-other@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    expect(createRes.statusCode).toBe(201)
    const { id } = JSON.parse(createRes.body)

    const sendRes = await fastify.inject({
      method: 'POST',
      url: `/wallets/${id}/send`,
      headers: { Authorization: `Bearer ${tokenB}` },
      payload: {
        to: '0x0000000000000000000000000000000000000001',
        amount: '0.001',
      },
    })
    expect(sendRes.statusCode).toBe(404)
  })

  it('should return 200 with transactionHash for successful send', async () => {
    const fakeHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'
    await withTestEnvOverride('TEST_SEND_HASH_OVERRIDE', fakeHash, async () => {
      const token = await getOrCreateSession(fastify, 'wallets-send-success@test.ai')

      const createRes = await fastify.inject({
        method: 'POST',
        url: '/wallets',
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(createRes.statusCode).toBe(201)
      const { id } = JSON.parse(createRes.body)

      const sendRes = await fastify.inject({
        method: 'POST',
        url: `/wallets/${id}/send`,
        headers: { Authorization: `Bearer ${token}` },
        payload: {
          to: '0x0000000000000000000000000000000000000001',
          amount: '0.001',
        },
      })
      expect(sendRes.statusCode).toBe(200)
      const body = JSON.parse(sendRes.body)
      expect(body.transactionHash).toBe(fakeHash)
    })
  })
})
