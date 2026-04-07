import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '..')
const entry = path.join(root, 'src/routes/reference/dynamic-auth-browser.ts')
const outfile = path.join(root, 'src/routes/reference/reference-dynamic-auth.bundle.js')

mkdirSync(path.dirname(outfile), { recursive: true })

await esbuild.build({
  absWorkingDir: root,
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile,
  logLevel: 'info',
  sourcemap: false,
  minify: process.env.NODE_ENV === 'production',
})
