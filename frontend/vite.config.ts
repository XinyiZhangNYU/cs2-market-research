import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { publicStartupPreload } from './build/publicStartupPreload'

const echartsStub = fileURLToPath(new URL('./tests/stubs/echarts.ts', import.meta.url))
const publicStrings = fileURLToPath(
  new URL('./src/i18n/strings.public.ts', import.meta.url),
)

// The prototype build is a single file: dist/index.html has to work when opened straight
// off disk. Vite's default output points at /assets/*, which is an
// absolute path a file:// document resolves to the filesystem root; the script is also a
// module, which file:// refuses to fetch cross-origin. Inlining removes both problems.
function inlineIntoSingleFile(): Plugin {
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return {
    name: 'inline-into-single-file',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find(
        (file) => file.type === 'asset' && file.fileName.endsWith('.html'),
      )
      if (!html || html.type !== 'asset') return
      let source = String(html.source)

      for (const [key, file] of Object.entries(bundle)) {
        if (file === html) continue
        if (file.type === 'chunk') {
          const tag = new RegExp(`\\s*<script[^>]*src="[^"]*${escape(file.fileName)}"[^>]*></script>`)
          if (!tag.test(source)) continue
          // Vite emits the tag in <head> because a module script is deferred. A classic script
          // is not, so it has to move below #root or it runs before that element exists.
          source = source.replace(tag, '')
          source = source.replace('</body>', () => `  <script>${file.code}</script>\n  </body>`)
        } else if (file.fileName.endsWith('.css')) {
          const tag = new RegExp(`<link[^>]*href="[^"]*${escape(file.fileName)}"[^>]*>`)
          if (!tag.test(source)) continue
          source = source.replace(tag, () => `<style>${file.source}</style>`)
        } else {
          continue
        }
        delete bundle[key]
      }

      if (/<(script|link)[^>]*(src|href)="[^"]*assets\//.test(source)) {
        this.error('an asset reference survived inlining, so dist/index.html is not portable')
      }
      if (source.indexOf('<script>') < source.indexOf('id="root"')) {
        this.error('the inlined script runs before #root exists')
      }
      html.source = source
    },
  }
}

function publicHtmlProfile(): Plugin {
  return {
    name: 'public-html-profile',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace('/src/main.tsx', '/src/public-main.tsx')
          .replace(
            '<title>EXPLORATORY_FRONTEND_PROTOTYPE</title>',
            '<title>CS2 Rotate · Item market intelligence</title>',
          )
          .replace(
            '</head>',
            '    <meta name="description" content="Browse a real CS2 item catalog with traceable identity, imagery and item context." />\n' +
              '    <meta name="referrer" content="no-referrer" />\n' +
              '    <link rel="icon" type="image/svg+xml" href="/src/assets/brand/cs2-rotate-favicon.svg" />\n' +
              '  </head>',
          )
      },
    },
  }
}

function publicBundleBoundary(): Plugin {
  const forbiddenModules = [
    '/src/App.tsx',
    '/src/mock/',
    '/src/formal/',
    '/schemas/examples/valve-event-',
    '/src/pages/HubPage.tsx',
    '/src/pages/ItemsPage.tsx',
    '/src/pages/ItemBrowsePage.tsx',
    '/src/components/CatalogDisplayBrowseBoundary.tsx',
    '/src/pages/ItemDetailPage.tsx',
    '/src/pages/MarketOverviewPage.tsx',
    '/src/pages/MarketSectorDashboardPage.tsx',
    '/src/components/MarketQualitySection.tsx',
  ]
  const forbiddenSchemaCompilerModules = [
    '/node_modules/ajv/dist/2020.js',
    '/node_modules/ajv/dist/core.js',
    '/node_modules/ajv/dist/compile/',
    '/node_modules/ajv/dist/refs/',
    '/node_modules/ajv/dist/vocabularies/',
  ]
  return {
    name: 'public-bundle-boundary',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        for (const [id, module] of Object.entries(output.modules)) {
          if (module.renderedLength === 0) continue
          const normalized = id.replaceAll('\\', '/')
          const forbidden = forbiddenModules.find((fragment) => normalized.includes(fragment))
          if (forbidden) {
            this.error(`public bundle rendered a forbidden prototype module: ${forbidden}`)
          }
          const schemaCompiler = forbiddenSchemaCompilerModules.find((fragment) =>
            normalized.includes(fragment),
          )
          if (schemaCompiler) {
            this.error(
              `public bundle rendered an Ajv runtime compiler module: ${schemaCompiler}`,
            )
          }
        }
        if (output.code.includes('http://127.0.0.1:8765')) {
          this.error('public bundle contains a loopback API origin')
        }
        if (/\bnew\s+Function\b|\beval\s*\(/u.test(output.code)) {
          this.error('public bundle contains runtime string evaluation')
        }
      }
    },
  }
}

const apiProxyTarget = process.env.CS2_API_PROXY ?? 'http://127.0.0.1:8765'
const loopbackReadProxy = {
  '/api/v1': {
    target: apiProxyTarget,
    changeOrigin: !apiProxyTarget.includes('127.0.0.1'),
  },
  '/api/v2': {
    target: apiProxyTarget,
    changeOrigin: !apiProxyTarget.includes('127.0.0.1'),
  },
  '/api/v3': {
    target: 'http://127.0.0.1:8765',
    changeOrigin: false,
  },
  '/media/catalog': {
    target: apiProxyTarget,
    changeOrigin: !apiProxyTarget.includes('127.0.0.1'),
  },
  '/media/equipment': {
    target: apiProxyTarget,
    changeOrigin: !apiProxyTarget.includes('127.0.0.1'),
  },
}

export default defineConfig(({ mode }) => {
  const publicBeta = mode === 'public'
  // The E second curve's spec (src/api/nativeCnyECurveConfig.ts): unset hides E, but a set and
  // malformed value is a deploy mistake, so the build stops instead of shipping E hidden.
  const eSpec = loadEnv(mode, process.cwd(), 'VITE_NATIVE_CNY_E_').VITE_NATIVE_CNY_E_SPEC
  if (eSpec !== undefined && eSpec !== '' && !/^[0-9a-f]{64}$/u.test(eSpec)) {
    throw new Error('VITE_NATIVE_CNY_E_SPEC must be 64 lowercase hex characters (the E seed spec_sha256)')
  }
  return {
    base: publicBeta ? '/' : './',
    plugins: publicBeta
      ? [
          react(),
          publicHtmlProfile(),
          publicStartupPreload(),
          publicBundleBoundary(),
        ]
      : [
          react(),
          inlineIntoSingleFile(),
        ],
    resolve: {
      alias: publicBeta
        ? [{ find: /^(?:\.{1,2}\/)+i18n\/strings$/u, replacement: publicStrings }]
        : [],
    },
    // Both browser modes call root-relative same-origin routes. This proxy exists only for
    // loopback development and preview; a public edge must provide the equivalent routes.
    server: {
      host: '127.0.0.1',
      port: 5273,
      proxy: loopbackReadProxy,
    },
    preview: {
      host: '127.0.0.1',
      port: publicBeta ? 5274 : 5273,
      proxy: loopbackReadProxy,
    },
    build: publicBeta
      ? {
          outDir: 'dist-public',
          assetsInlineLimit: 0,
          sourcemap: false,
        }
      : {
          assetsInlineLimit: Number.MAX_SAFE_INTEGER,
          cssCodeSplit: false,
          modulePreload: false,
          // A classic script, not a module: an inline module still inherits module semantics that
          // some browsers restrict on file:// origins. iife is safe because there is one entry and
          // no dynamic import.
          rollupOptions: { output: { format: 'iife' } },
        },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
      alias: [
        { find: /^echarts\/(core|charts|components|renderers)$/, replacement: echartsStub },
      ],
    },
  }
})
