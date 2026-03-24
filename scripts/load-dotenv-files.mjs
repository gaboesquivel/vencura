/**
 * Parse KEY=VAL lines from a .env-style file (no multiline, no export prefix).
 * Used by E2E runners to merge apps/api/.env.test and app .env.local into env.
 */
import { existsSync, readFileSync } from 'node:fs'

export function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const lines = readFileSync(filePath, 'utf8').split('\n')
  const out = {}
  for (const line of lines) {
    const idx = line.indexOf('=')
    if (idx < 0 || line.startsWith('#')) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    out[key] = val
  }
  return out
}

/** Fill env from files; only sets keys that are unset or empty in target. */
export function mergeEnvFromFiles(filePaths, env = process.env) {
  for (const filePath of filePaths) {
    const parsed = loadEnvFile(filePath)
    for (const [key, val] of Object.entries(parsed)) {
      const cur = env[key]
      if (cur === undefined || String(cur).trim() === '') env[key] = val
    }
  }
}
