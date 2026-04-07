#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { exit } from 'node:process'

function checkToolExists(toolName) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [toolName], {
    stdio: 'ignore',
  })
  return r.status === 0
}

/** osv-scanner lists ignored GHSAs as "unused" when matches resolve via aliases; strip that block on success. */
function filterUnusedIgnoresNoise(output) {
  const lines = output.split('\n')
  const out = []
  let skipping = false
  for (const line of lines) {
    if (!skipping && line.endsWith(' has unused ignores:')) {
      skipping = true
      continue
    }
    if (skipping) {
      if (line.startsWith(' - ')) continue
      skipping = false
    }
    out.push(line)
  }
  return out.join('\n')
}

if (!checkToolExists('osv-scanner')) {
  console.error('\n⚠️  osv-scanner is not installed. Skipping vulnerability scan.')
  console.error('Install osv-scanner to enable pre-commit vulnerability scanning.')
  console.error('Run: pnpm setup:osv\n')
  exit(0)
}

console.log('\n🔍 Scanning dependencies for known vulnerabilities...\n')

const result = spawnSync(
  'osv-scanner',
  ['scan', '--lockfile=pnpm-lock.yaml', '--format=markdown'],
  { encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024 },
)

const out = `${result.stdout ?? ''}${result.stderr ?? ''}`
if (result.status === 0) process.stdout.write(`${filterUnusedIgnoresNoise(out)}\n`)
else {
  process.stdout.write(out)
  console.log('\n⚠️  Vulnerability scan found issues.')
  console.log('Please review the output above for details about affected packages.')
  console.log('Update or replace vulnerable dependencies, then try committing again.\n')
  exit(1)
}
