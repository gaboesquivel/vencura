import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
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

beforeEach(() => {
  fastify.fakeEmail?.clear()
})

afterEach(() => {
  fastify.fakeEmail?.clear()
})

afterAll(async () => {
  if (fastify) await fastify.close()
  await cleanupGroupDatabase()
})

export { fastify }

import './apikeys/create.test'
import './apikeys/list.test'
import './apikeys/revoke.test'
import './profile/update.test'
