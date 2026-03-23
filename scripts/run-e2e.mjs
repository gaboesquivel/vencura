#!/usr/bin/env node
/**
 * Run E2E tests locally: API E2E, then Web app E2E.
 * Spawns servers locally (no external URLs). Used by pnpm qa.
 * Kills processes on ports 3000/3001/3002 before starting (unless SKIP_KILL_PORTS=1).
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { mergeEnvFromFiles } from './load-dotenv-files.mjs'

const scriptFile = fileURLToPath(import.meta.url)
const repoRoot = dirname(dirname(scriptFile))

function mergeRepoE2eEnv() {
  mergeEnvFromFiles(
    [
      join(repoRoot, 'apps/api/.env.test'),
      join(repoRoot, 'apps/web/.env.local'),
      join(repoRoot, 'apps/mathler/.env.local'),
    ],
    process.env,
  )
}

function hasDynamicE2eCreds() {
  const email = process.env.E2E_TEST_EMAIL?.trim()
  const otp = process.env.E2E_STATIC_OTP?.trim()
  return Boolean(email && otp)
}

function killPorts() {
  if (process.env.SKIP_KILL_PORTS) return
  const killScript = join(repoRoot, 'scripts', 'kill-test-servers.sh')
  if (existsSync(killScript)) {
    try {
      spawnSync('bash', [killScript], { cwd: repoRoot, stdio: 'pipe' })
    } catch {
      /* ignore - ports may not be in use or bash unavailable */
    }
  }
  const nextLock = join(repoRoot, 'apps', 'web', '.next', 'lock')
  if (existsSync(nextLock)) {
    try {
      unlinkSync(nextLock)
    } catch {
      /* ignore */
    }
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd: repoRoot, stdio: 'inherit', ...opts })
    proc.on('exit', code => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))))
  })
}

async function main() {
  mergeRepoE2eEnv()
  killPorts()
  await run('pnpm', ['-F', '@repo/api', 'test:e2e:local'])
  killPorts()
  if (!hasDynamicE2eCreds()) {
    if (process.env.CI === 'true') {
      console.error(
        'E2E_TEST_EMAIL and E2E_STATIC_OTP must be set for web/mathler E2E (CI: add repository secrets; local: apps/api/.env.test — see apps/api/.env.test.example).',
      )
      process.exit(1)
    }
    console.warn(
      '[run-e2e] Skipping @repo/web and @repo/mathler E2E (missing E2E_TEST_EMAIL / E2E_STATIC_OTP). Configure apps/api/.env.test or app .env.local — see apps/api/.env.test.example.',
    )
    return
  }
  // Allow server shutdown and port release before starting Next e2e; 2s is conservative;
  // shorten if CI is stable.
  await new Promise(r => setTimeout(r, 2000))
  await run('pnpm', ['-F', '@repo/web', 'test:e2e:local'])
  killPorts()
  await new Promise(r => setTimeout(r, 2000))
  await run('pnpm', ['-F', '@repo/mathler', 'test:e2e'])
}

main().catch(err => {
  killPorts()
  console.error(err.message)
  process.exit(1)
})
