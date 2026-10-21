import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { resolveInitialPublicLanguage } from './i18n/publicLanguagePreference'
import {
  isModuleLoadFailure,
  reloadAfterModuleFailure,
  trackModuleLoadFailures,
} from './performance/moduleLoadRecovery'
import { showStartupFallback, startupFallbackLanguage } from './performance/startupFallback'
import type { Lang } from './i18n'
import './styles.css'

// Registered before the app module itself is imported, so every dynamic import is covered.
trackModuleLoadFailures()

// A failure that no page boundary shows: the app module itself, or a module rendered outside the
// pages (the header's currency reference), which unmounts the app. A failed module there reloads
// through the same per-tab guard as a page boundary. Any failure here leaves no app on the page,
// so without an automatic reload under way the reader gets the static fallback, not a blank page.
function recoverFromAppFailure(error: unknown, lang: Lang): void {
  if (isModuleLoadFailure(error) && reloadAfterModuleFailure()) return
  showStartupFallback(rootElement, lang)
}

// React's default reporting of an uncaught error.
function reportUncaught(error: unknown): void {
  if (typeof globalThis.reportError === 'function') globalThis.reportError(error)
  else console.error(error)
}

const root = document.getElementById('root')
if (!root) throw new Error('#root missing')
const rootElement = root

async function bootstrap(): Promise<void> {
  const [{ PublicBetaApp }, initialLang] = await Promise.all([
    import('./PublicBetaApp'),
    resolveInitialPublicLanguage(),
  ])
  document.documentElement.lang = initialLang === 'zh' ? 'zh-CN' : 'en'
  createRoot(rootElement, {
    onUncaughtError(error) {
      reportUncaught(error)
      recoverFromAppFailure(error, initialLang)
    },
  }).render(
    <StrictMode>
      <PublicBetaApp initialLang={initialLang} />
    </StrictMode>,
  )
}

// Reported like an uncaught error rather than left as an unhandled rejection.
bootstrap().catch((error: unknown) => {
  reportUncaught(error)
  recoverFromAppFailure(error, startupFallbackLanguage())
})
