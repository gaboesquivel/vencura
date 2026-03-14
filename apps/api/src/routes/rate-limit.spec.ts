import { afterAll, beforeAll } from 'vitest'
import { clearSessionPool } from '../../test/utils/auth-helper.js'
import { cleanupGroupDatabase, setupGroupDatabase } from '../../test/utils/db-setup.js'
import type { TestApp } from '../../test/utils/fastify.js'
import { buildTestApp } from '../../test/utils/fastify.js'

let fastify: TestApp

beforeAll(async () => {
  const prevOverride = process.env.RATE_LIMIT_TEST_OVERRIDE
  const prevWindow = process.env.RATE_LIMIT_TEST_TIME_WINDOW
  process.env.RATE_LIMIT_TEST_OVERRIDE = '2'
  process.env.RATE_LIMIT_TEST_TIME_WINDOW = '60000'
  clearSessionPool()
  await setupGroupDatabase()
  fastify = await buildTestApp()
  if (prevOverride !== undefined) process.env.RATE_LIMIT_TEST_OVERRIDE = prevOverride
  else delete process.env.RATE_LIMIT_TEST_OVERRIDE
  if (prevWindow !== undefined) process.env.RATE_LIMIT_TEST_TIME_WINDOW = prevWindow
  else delete process.env.RATE_LIMIT_TEST_TIME_WINDOW
})

afterAll(async () => {
  delete process.env.RATE_LIMIT_TEST_OVERRIDE
  delete process.env.RATE_LIMIT_TEST_TIME_WINDOW
  if (fastify) await fastify.close()
  await cleanupGroupDatabase()
})

export { fastify }

import './rate-limit.test.js'
