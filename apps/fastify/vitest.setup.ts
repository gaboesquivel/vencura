// Set DATABASE_URL before env validation
// This must happen before any imports that use env.ts
process.env.DATABASE_URL = 'postgresql://localhost/test'
process.env.NODE_ENV = 'test'

import { afterAll, beforeAll } from 'vitest'
import { runMigrations } from './src/db/migrate.js'
import { closeTestDatabase, getTestDatabase } from './test/utils/db.js'

beforeAll(async () => {
  await getTestDatabase()

  // Try to run migrations if they exist
  try {
    await runMigrations({
      info: () => {},
      error: () => {},
    })
  } catch {
    // Migrations failed or don't exist, continue to manual setup
  }

  // Fallback: Create tables manually using SQL
  // This is a temporary solution until migrations are generated
  const { instance } = await getTestDatabase()
  await instance.exec(`
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
  `)
})

afterAll(async () => {
  await closeTestDatabase()
})
