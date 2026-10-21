import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
const boot = vi.hoisted(() => ({ render: vi.fn(), fallback: vi.fn() }))
vi.mock('react-dom/client', () => ({ createRoot: () => ({ render: boot.render }) }))
vi.mock('../src/PublicBetaApp', () => ({ PublicBetaApp: () => null }))
vi.mock('../src/i18n/publicLanguagePreference', () => ({ resolveInitialPublicLanguage: async () => 'en' }))
vi.mock('../src/performance/moduleLoadRecovery', () => ({
  trackModuleLoadFailures: () => {}, isModuleLoadFailure: () => false, reloadAfterModuleFailure: () => false,
}))
vi.mock('../src/performance/startupFallback', () => ({ showStartupFallback: boot.fallback, startupFallbackLanguage: () => 'en' }))
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks()
  document.body.innerHTML = '<div id="root"></div>'
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network forbidden') }))
  vi.stubGlobal('reportError', vi.fn())
})
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals() })
function script(text: string) {
  const element = document.createElement('script')
  element.id = 'cs2-native-cny-public'; element.type = 'application/json'; element.textContent = text
  document.body.append(element)
}
it('public-main ignores the retired WP4 script instead of injecting selected readers', async () => {
  script('{"schema":"native-cny-public-bootstrap/1","index":null,"trending":null}')
  await import('../src/public-main')
  await waitFor(() => expect(boot.render).toHaveBeenCalledTimes(1))
  const strict = boot.render.mock.calls[0][0] as ReactElement<{ children: ReactElement<{ nativeCnyPublic: unknown; initialLang: string }> }>
  expect(strict.props.children.props.initialLang).toBe('en')
  expect(strict.props.children.props.nativeCnyPublic).toBeUndefined()
  expect(fetch).not.toHaveBeenCalled()
})
it('startup has no publication or daily bootstrap dependency', async () => {
  await import('../src/public-main')
  await waitFor(() => expect(boot.render).toHaveBeenCalledTimes(1))
  const strict = boot.render.mock.calls[0][0] as ReactElement<{ children: ReactElement<{ nativeCnyPublic: unknown }> }>
  expect(strict.props.children.props.nativeCnyPublic).toBeUndefined()
})
it('an invalid retired script cannot block public startup', async () => {
  script('{"schema":"native-cny-public-bootstrap/1","index":null}')
  await import('../src/public-main')
  await waitFor(() => expect(boot.render).toHaveBeenCalledTimes(1))
  expect(boot.fallback).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled()
})
