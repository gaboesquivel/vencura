import { describe, expect, it } from 'vitest'
import { getOrCreateSession } from '../../../test/utils/auth-helper.js'
import { fastify } from './wallets.spec.js'

describe('POST /wallets', () => {
  it('should return 401 without Bearer token', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/wallets',
    })
    expect(response.statusCode).toBe(401)
  })

  it('should create custodial wallet', async () => {
    const token = await getOrCreateSession(fastify, 'wallets-create@test.ai')

    const response = await fastify.inject({
      method: 'POST',
      url: '/wallets',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.id).toBeDefined()
    expect(body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(body.chainId).toBe(11155111)
    expect(body.createdAt).toBeDefined()
  })
})
