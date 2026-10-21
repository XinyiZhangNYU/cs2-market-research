import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Separate production-built component evidence; never a public entry/deployment.
export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist-price-runtime',
    assetsInlineLimit: 0,
    sourcemap: false,
    rollupOptions: { input: fileURLToPath(new URL('./price-runtime.html', import.meta.url)) },
  },
})
