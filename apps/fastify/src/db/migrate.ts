import { readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { env } from '../lib/env.js'
import * as schema from './schema/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..', '..')

async function readMigrationFiles(): Promise<string[]> {
  const migrationsDir = join(projectRoot, 'src', 'db', 'migrations')
  try {
    const files = await readdir(migrationsDir)
    return files.filter(file => file.endsWith('.sql')).sort()
  } catch {
    // Migrations directory doesn't exist yet
    return []
  }
}

/**
 * Run database migrations
 * Supports build-time migrations for PostgreSQL and runtime migrations for PGLite
 */
export async function runMigrations(logger?: {
  info: (msg: string) => void
  error: (msg: string, err?: unknown) => void
}): Promise<void> {
  const migrationsDir = join(projectRoot, 'src', 'db', 'migrations')
  const migrationFiles = await readMigrationFiles()

  if (migrationFiles.length === 0) {
    logger?.info('No migrations found, skipping migration step')
    return
  }

  logger?.info(`Found ${migrationFiles.length} migration file(s), running migrations...`)

  try {
    const shouldUsePGLite = env.PGLITE === true || env.NODE_ENV === 'test'

    if (shouldUsePGLite) {
      logger?.info('PGLite detected: migrations will run at runtime when instance is created')
      return
    }

    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required when PGLITE is false')
    }

    const pool = new Pool({ connectionString: env.DATABASE_URL })
    const db = drizzle(pool, { schema })

    try {
      await migrate(db as unknown as NodePgDatabase, { migrationsFolder: migrationsDir })
      logger?.info('Migrations completed successfully (PostgreSQL)')
    } finally {
      await pool.end()
    }
  } catch (err) {
    logger?.error('Migration failed', err)
    throw err
  }
}
