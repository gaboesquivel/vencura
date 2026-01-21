// Set all required environment variables before env validation
// This must happen before any imports that use env.ts
process.env.NODE_ENV = 'test'
// Always use test database URL in test environment, overriding .env file
process.env.DATABASE_URL = 'postgresql://localhost/test'
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key'
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || '0000000000000000000000000000000000000000000000000000000000000000'

// Dynamic env vars are passed from CI secrets if available
// They're optional and will be undefined if not provided

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
