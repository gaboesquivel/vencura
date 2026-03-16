#!/usr/bin/env node
/**
 * Run QA pipeline: install, checktypes, lint:fix, build, test, test:e2e.
 * Stops immediately on first failure and reports which phase failed.
 * Used by pnpm qa.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = dirname(scriptDir)

function killPorts() {
  if (process.env.SKIP_KILL_PORTS) return
  const killScript = join(repoRoot, 'scripts', 'kill-test-servers.sh')
  if (existsSync(killScript)) {
    try {
      spawnSync('bash', [killScript], { cwd: repoRoot, stdio: 'pipe' })
    } catch {
      /* ignore */
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

const qaBuildEnv = process.env.JWT_SECRET
  ? undefined
  : { JWT_SECRET: 'qa-build-placeholder-min-32-chars-to-pass-validation' }

const skipTests = process.env.QA_SKIP_TESTS === '1' || process.env.QA_SKIP_TESTS === 'true'

const phases = [
  { name: 'install', cmd: 'pnpm', args: ['i', '--no-frozen-lockfile'] },
  {
    name: 'checktypes',
    cmd: 'pnpm',
    args: ['exec', 'turbo', 'run', 'checktypes', '--concurrency=100%'],
  },
  { name: 'lint:fix', cmd: 'pnpm', args: ['lint:fix'] },
  { name: 'build', cmd: 'pnpm', args: ['build'], env: qaBuildEnv },
  ...(skipTests
    ? []
    : [
        { name: 'test', cmd: 'pnpm', args: ['exec', 'turbo', 'run', 'test', '--concurrency=100%'] },
        { name: 'test:e2e', cmd: 'pnpm', args: ['test:e2e'] },
      ]),
]

killPorts()

for (const { name, cmd, args, env } of phases) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, ...(env ?? {}) },
  })
  if (result.status !== 0) {
    killPorts()
    const code = result.status ?? 1
    console.error('\n---\nQA FAILED at phase "%s" (exit code %d)\n---\n', name, code)
    process.exit(code)
  }
}

killPorts()
