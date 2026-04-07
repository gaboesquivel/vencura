import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'src/routes/reference/reference-dynamic-auth.bundle.js')
const dest = path.join(root, 'dist/src/routes/reference/reference-dynamic-auth.bundle.js')

if (!existsSync(src)) process.exit(0)

mkdirSync(path.dirname(dest), { recursive: true })
copyFileSync(src, dest)
