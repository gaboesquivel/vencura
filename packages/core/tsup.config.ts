import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: ['@vencura/types', '@vencura/lib'],
  },
  external: ['@vencura/types', '@vencura/lib'],
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
})
