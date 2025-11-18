import { Module, Global } from '@nestjs/common'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { getErrorMessage } from '@vencura/lib'
import * as schema from './schema'

/**
 * Initialize database schema for tests.
 * Creates tables directly using SQL (simpler than migrations for test environment).
 */
async function initializeTestDatabase(client: PGlite): Promise<void> {
  try {
    // Create users table
    await client.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)

    // Create wallets table
    await client.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        address TEXT NOT NULL,
        private_key_encrypted TEXT NOT NULL,
        network TEXT NOT NULL DEFAULT '421614',
        chain_type TEXT NOT NULL DEFAULT 'evm',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(`Failed to initialize test database: ${message}`)
  }
}

@Global()
@Module({
  providers: [
    {
      provide: 'PGLITE',
      useFactory: async () => {
        const client = new PGlite()
        await client.waitReady

        // Initialize schema in test mode
        if (process.env.NODE_ENV === 'test') {
          await initializeTestDatabase(client)
        }

        return client
      },
    },
    {
      provide: 'DATABASE',
      useFactory: (client: PGlite) => drizzle(client, { schema }),
      inject: ['PGLITE'],
    },
    {
      provide: 'DB_SCHEMA',
      useValue: schema,
    },
  ],
  exports: ['DATABASE', 'DB_SCHEMA', 'PGLITE'],
})
export class DatabaseModule {}
