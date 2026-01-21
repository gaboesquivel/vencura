#!/usr/bin/env node
import 'dotenv/config'
import { runMigrations } from '../src/db/migrate.js'

const logger = {
  info: (msg: string) => console.log(`[migrate] ${msg}`),
  error: (msg: string, err?: unknown) => {
    console.error(`[migrate] ERROR: ${msg}`)
    if (err) console.error(err)
  },
}

try {
  await runMigrations(logger)
  process.exit(0)
} catch (err) {
  logger.error('Migration failed', err)
  process.exit(1)
}
