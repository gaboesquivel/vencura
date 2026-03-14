import rateLimit from '@fastify/rate-limit'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { env } from '../lib/env.js'
import { getTrustedClientIp } from '../lib/request.js'

type RateLimitPluginOptions = Record<string, never>

const rateLimitPlugin: FastifyPluginAsync<RateLimitPluginOptions> = async fastify => {
  // Test overrides must use process.env: env is cached at module load, before tests set vars
  /* eslint-disable no-restricted-properties -- test env vars set at runtime before buildTestApp */
  const testOverride =
    process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_TEST_OVERRIDE != null
      ? Number.parseInt(process.env.RATE_LIMIT_TEST_OVERRIDE, 10)
      : null
  const testWindow =
    process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_TEST_TIME_WINDOW != null
      ? Number.parseInt(process.env.RATE_LIMIT_TEST_TIME_WINDOW, 10)
      : null
  const max = testOverride ?? env.RATE_LIMIT_MAX
  const timeWindow = testWindow ?? env.RATE_LIMIT_TIME_WINDOW
  /* eslint-enable no-restricted-properties */
  await fastify.register(rateLimit, {
    max,
    timeWindow,
    // Use in-memory store by default
    // To use Redis, configure @fastify/rate-limit-redis and pass redis option
    // Add rate limit headers to response
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    keyGenerator:
      testOverride != null ? () => 'rate-limit-test-key' : request => getTrustedClientIp(request),
    // Custom error handler
    errorResponseBuilder: (_request, context) => {
      const timeWindowSeconds = Math.round(timeWindow / 1000)
      const err = new Error(
        `Rate limit exceeded. Maximum ${context.max} requests per ${timeWindowSeconds}s`,
      ) as Error & { statusCode: number }
      err.statusCode = context.statusCode ?? 429
      return err
    },
  })
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
})
