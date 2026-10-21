import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import base from './vite.config'

// Owns the resolved test cache, not bundled config-loader temporary files.
// With shared dependency junctions, use the installed --configLoader runner
// and an owned working directory; cacheDir alone does not own .vite-temp.
export default defineConfig(async (environment) => mergeConfig(
  typeof base === 'function' ? await base(environment) : await base,
  { cacheDir: fileURLToPath(new URL('./.vite/native-cny-public-selection/', import.meta.url)) },
))
