import { afterAll, beforeAll } from 'vitest'
import { clearSessionPool } from '../../../test/utils/auth-helper.js'
import { cleanupGroupDatabase, setupGroupDatabase } from '../../../test/utils/db-setup.js'
import type { TestApp } from '../../../test/utils/fastify.js'
import { buildTestApp } from '../../../test/utils/fastify.js'

let fastify: TestApp

beforeAll(async () => {
  clearSessionPool()
  await setupGroupDatabase()
  fastify = await buildTestApp()
})

afterAll(async () => {
  if (fastify) await fastify.close()
  await cleanupGroupDatabase()
})

export { fastify }

import './create.test'
import './list.test'
import './detail.test'
import './balance.test'
import './sign.test'
import './send.test'
