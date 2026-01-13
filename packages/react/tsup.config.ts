import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: ['@vencura/types', '@vencura/core'],
  },
  external: ['@vencura/types', '@vencura/core'],
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
})
