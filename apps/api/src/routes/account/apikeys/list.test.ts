import { describe, expect, it } from 'vitest'
import { getApiKeyToken, getOrCreateSession } from '../../../../test/utils/auth-helper.js'
import { fastify } from '../account.spec.js'

describe('GET /account/apikeys', () => {
  it('should return 401 without Bearer token', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/account/apikeys',
    })
    expect(response.statusCode).toBe(401)
  })

  it('should return session key for user created via getOrCreateSession', async () => {
    const token = await getOrCreateSession(fastify, 'apikeys-list@test.ai')

    const response = await fastify.inject({
      method: 'GET',
      url: '/account/apikeys',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.keys).toHaveLength(1)
    expect(body.keys[0]).not.toHaveProperty('key')
    expect(body.keys[0]).not.toHaveProperty('hash')
  })

  it('should list created keys without secret', async () => {
    const token = await getOrCreateSession(fastify, 'apikeys-list@test.ai')

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/account/apikeys',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Staging' },
    })
    expect(createRes.statusCode).toBe(200)
    const created = JSON.parse(createRes.body)

    const listRes = await fastify.inject({
      method: 'GET',
      url: '/account/apikeys',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(listRes.statusCode).toBe(200)
    const body = JSON.parse(listRes.body)
    expect(body.keys).toHaveLength(2)
    const stagingKey = body.keys.find((k: { name: string }) => k.name === 'Staging')
    expect(stagingKey).toBeDefined()
    expect(stagingKey).toMatchObject({ id: created.id, name: 'Staging', prefix: created.prefix })
    expect(stagingKey).not.toHaveProperty('key')
    expect(stagingKey).not.toHaveProperty('hash')
  })

  it('should list keys when authenticated via API key', async () => {
    const apiKey = await getApiKeyToken(fastify, 'apikeys-list-apikey@test.ai')

    const listRes = await fastify.inject({
      method: 'GET',
      url: '/account/apikeys',
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    expect(listRes.statusCode).toBe(200)
    const body = JSON.parse(listRes.body)
    expect(body.keys.length).toBeGreaterThanOrEqual(1)
    const testKey = body.keys.find((k: { name: string }) => k.name === 'Test Key')
    expect(testKey).toBeDefined()
    expect(testKey).not.toHaveProperty('key')
  })
})
