import { describe, expect, it } from 'vitest'
import { fastify } from './rate-limit.spec.js'

describe('Rate limiting', () => {
  it('should return 429 when rate limit exceeded', async () => {
    const responses: { statusCode: number }[] = []
    for (let i = 0; i < 4; i++) {
      const res = await fastify.inject({
        method: 'GET',
        url: '/health',
        remoteAddress: '127.0.0.1',
      })
      responses.push({ statusCode: res.statusCode })
    }
    expect(responses.map(r => r.statusCode)).toContain(429)
  })
})
