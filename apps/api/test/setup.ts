// Jest setup file - runs before all tests
import { config } from 'dotenv'
import { resolve } from 'path'
import { validateEnv } from '../src/config/env.schema'
import { startAnvil, stopAnvil } from './setup-anvil'

// Load environment variables with priority: .env (highest) > .env.test > .env.local
// .env is loaded last to overwrite all other env files (sensitive data takes precedence)
const envDir = resolve(__dirname, '../')
config({ path: resolve(envDir, '.env.local') })
config({ path: resolve(envDir, '.env.test') })
config({ path: resolve(envDir, '.env') }) // Load last to overwrite everything

// Validate required environment variables using zod schema
try {
  const validatedEnv = validateEnv()
  console.log('Test environment configured successfully')
  console.log(`Dynamic Environment ID: ${validatedEnv.DYNAMIC_ENVIRONMENT_ID}`)
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  throw new Error(
    `${errorMessage}\nPlease ensure required environment variables are set in ${envDir}`,
  )
}

// Start Anvil before all tests if using local blockchain
if (process.env.USE_LOCAL_BLOCKCHAIN !== 'false') {
  beforeAll(async () => {
    const started = await startAnvil()
    if (!started) {
      console.warn('Failed to start Anvil. Tests may fail if they require local blockchain.')
      console.warn('Install Foundry: https://book.getfoundry.sh/getting-started/installation')
    }
  }, 60000) // 60 second timeout for Anvil startup

  // Stop Anvil after all tests
  afterAll(async () => {
    await stopAnvil()
  })
}
