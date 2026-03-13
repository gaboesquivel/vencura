import { beforeEach, describe, expect, it } from 'vitest'
import { createAuthenticatedUser } from '../../../../test/utils/auth-helper.js'
import { fastify } from '../session.spec.js'

describe('POST /auth/session/logout', () => {
  beforeEach(() => {
    fastify.fakeEmail?.clear()
  })

  it('should logout user and return 204 or 200 { ok: true }', async () => {
    const { token } = await createAuthenticatedUser(fastify)

    const logoutResponse = await fastify.inject({
      method: 'POST',
      url: '/auth/session/logout',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect([200, 204]).toContain(logoutResponse.statusCode)
    if (logoutResponse.statusCode === 200) {
      const body = JSON.parse(logoutResponse.body)
      expect(body).toMatchObject({ ok: true })
    }
  })
})
