import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Load environment files in priority order:
 * 1. .env.{NODE_ENV} (based on NODE_ENV)
 * 2. .env (highest priority, overrides everything)
 *
 * Uses process.cwd() to resolve files relative to the app root where the process is running.
 */
export function loadEnv(): void {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const appRoot = process.cwd()

  // Load .env.{NODE_ENV} first (lower priority)
  const envFile = join(appRoot, `.env.${nodeEnv}`)
  try {
    const envContent = readFileSync(envFile, 'utf-8')
    parseEnvFile(envContent)
  } catch {
    // File doesn't exist, skip
  }

  // Load .env last (highest priority, overrides everything)
  const dotEnvFile = join(appRoot, '.env')
  try {
    const dotEnvContent = readFileSync(dotEnvFile, 'utf-8')
    parseEnvFile(dotEnvContent, true) // Override existing values
  } catch {
    // File doesn't exist, skip
  }
}

/**
 * Parse env file content and set process.env
 * @param override - If true, override existing values (for .env file)
 */
function parseEnvFile(content: string, override = false): void {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalIndex = trimmed.indexOf('=')
    if (equalIndex === -1) continue

    const key = trimmed.slice(0, equalIndex).trim()
    const value = trimmed.slice(equalIndex + 1).trim()

    // Remove quotes if present
    const unquotedValue = value.replace(/^["']|["']$/g, '')

    // Set value (override for .env file, don't override for .env.{NODE_ENV})
    if (override || !(key in process.env)) {
      process.env[key] = unquotedValue
    }
  }
}
