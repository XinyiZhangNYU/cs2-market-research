import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PublicErrorBoundary } from '../src/components/PublicErrorBoundary'
import {
  isModuleLoadFailure,
  LEGACY_MODULE_RELOAD_SESSION_KEY,
  MAX_AUTOMATIC_MODULE_RELOADS,
  MODULE_RELOAD_SESSION_KEY,
  moduleReloadEnvironment,
  reloadAfterModuleFailure,
  trackModuleLoadFailures,
  type ModuleReloadEnvironment,
} from '../src/performance/moduleLoadRecovery'

afterEach(() => { cleanup(); window.sessionStorage.removeItem(MODULE_RELOAD_SESSION_KEY) })

const BUILD_A = 'https://example.test/assets/index-AAAA.js'
const BUILD_B = 'https://example.test/assets/index-BBBB.js'
function memoryStorage() {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) }, values }
}
const environment = (overrides: Partial<ModuleReloadEnvironment> = {}): ModuleReloadEnvironment => ({
  storage: memoryStorage(), online: true, build: BUILD_A, reload: vi.fn(), ...overrides,
})
// The same event the Vite build's preload helper dispatches before it rethrows the error.
function reportPreloadError(error: unknown, target: EventTarget = window) {
  const event = new Event('vite:preloadError', { cancelable: true }) as Event & { payload?: unknown }
  event.payload = error
  target.dispatchEvent(event)
  return event
}

const BUILD_C = 'https://example.test/assets/index-CCCC.js'
// One failed module in each document the tab loads, with the build each document came from.
function grants(storage: ReturnType<typeof memoryStorage>, builds: readonly string[]): boolean[] {
  return builds.map((build) => reloadAfterModuleFailure(environment({ storage, build })))
}

describe('automatic reloads in a tab', () => {
  it('reloads once for a build, never again for it, and once more for a new deploy', () => {
    const storage = memoryStorage(), reload = vi.fn()
    expect(reloadAfterModuleFailure(environment({ storage, reload }))).toBe(true)
    expect(storage.values.get(MODULE_RELOAD_SESSION_KEY)).toBe(JSON.stringify([BUILD_A]))
    expect(reloadAfterModuleFailure(environment({ storage, reload }))).toBe(false)
    expect(reloadAfterModuleFailure(environment({ storage, reload }))).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(reloadAfterModuleFailure(environment({ storage, reload, build: BUILD_B }))).toBe(true)
    expect(reloadAfterModuleFailure(environment({ storage, reload, build: BUILD_B }))).toBe(false)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('a host that serves two builds in turn while modules fail stops after the first reload of each', () => {
    const storage = memoryStorage()
    expect(grants(storage, [BUILD_A, BUILD_B, BUILD_A, BUILD_B, BUILD_A, BUILD_B, BUILD_A, BUILD_B]))
      .toEqual([true, true, false, false, false, false, false, false])
    expect(storage.values.get(MODULE_RELOAD_SESSION_KEY)).toBe(JSON.stringify([BUILD_A, BUILD_B]))
  })

  it(`a tab reloads at most ${MAX_AUTOMATIC_MODULE_RELOADS} times, however many builds it loads`, () => {
    expect(MAX_AUTOMATIC_MODULE_RELOADS).toBe(2)
    const storage = memoryStorage()
    expect(grants(storage, [BUILD_A, BUILD_B, BUILD_C, BUILD_A, BUILD_C])).toEqual([true, true, false, false, false])
    // The list is never shortened, so a build that reloaded earlier cannot come back into it.
    expect(storage.values.get(MODULE_RELOAD_SESSION_KEY)).toBe(JSON.stringify([BUILD_A, BUILD_B]))
  })

  it.each([
    ['offline', { online: false }],
    ['storage unavailable', { storage: null }],
    ['storage throws', { storage: { getItem: (): string | null => { throw new Error('blocked') }, setItem: () => {} } }],
    ['storage refuses the write', { storage: { getItem: (): string | null => null, setItem: () => { throw new Error('quota') } } }],
    ['storage drops the write silently', { storage: { getItem: (): string | null => null, setItem: () => {} } }],
    ['storage keeps an older value', { storage: { getItem: (key: string): string | null => (key === MODULE_RELOAD_SESSION_KEY ? '[]' : null), setItem: () => {} } }],
  ] as const)('does not reload when %s', (_label, overrides) => {
    const reload = vi.fn()
    expect(reloadAfterModuleFailure(environment({ ...overrides, reload }))).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it.each([
    ['not JSON', 'https://example.test/assets/index-AAAA.js'],
    ['not a list', '{"builds":[]}'],
    ['a list with a non-string entry', JSON.stringify([1])],
    ['a list longer than the limit', JSON.stringify([BUILD_B, BUILD_C, 'https://example.test/assets/index-DDDD.js'])],
    ['JSON null', 'null'],
  ])('does not reload and keeps the stored value when it is %s', (_label, value) => {
    const storage = memoryStorage(), reload = vi.fn()
    storage.values.set(MODULE_RELOAD_SESSION_KEY, value)
    expect(reloadAfterModuleFailure(environment({ storage, reload }))).toBe(false)
    expect(reload).not.toHaveBeenCalled()
    expect(storage.values.get(MODULE_RELOAD_SESSION_KEY)).toBe(value)
  })

  // The earlier guard kept only the last build, so the reloads it already made are not known.
  it.each([
    ['a build', BUILD_A],
    ['an empty value', ''],
  ])('a tab that holds the earlier guard (%s) makes no automatic reload and both keys are kept', (_label, value) => {
    const storage = memoryStorage()
    storage.values.set(LEGACY_MODULE_RELOAD_SESSION_KEY, value)
    expect(grants(storage, [BUILD_B, BUILD_C, BUILD_A])).toEqual([false, false, false])
    expect(storage.values.get(LEGACY_MODULE_RELOAD_SESSION_KEY)).toBe(value)
    expect(storage.values.has(MODULE_RELOAD_SESSION_KEY)).toBe(false)
  })

  it('the earlier guard stops a tab that already reloaded under the current one', () => {
    const storage = memoryStorage()
    expect(grants(storage, [BUILD_A])).toEqual([true])
    storage.values.set(LEGACY_MODULE_RELOAD_SESSION_KEY, BUILD_A)
    expect(grants(storage, [BUILD_B])).toEqual([false])
  })
})

describe('vite:preloadError tracking', () => {
  it('only records the reported error: no reload, and the error still reaches its caller', () => {
    const target = new EventTarget()
    const stop = trackModuleLoadFailures(target)
    const first = new TypeError('Failed to fetch dynamically imported module'), second = new TypeError('again')
    expect(reportPreloadError(first, target).defaultPrevented).toBe(false)
    reportPreloadError(second, target)
    expect(() => reportPreloadError(undefined, target)).not.toThrow()
    expect(isModuleLoadFailure(first)).toBe(true)
    expect(isModuleLoadFailure(second)).toBe(true)
    expect(isModuleLoadFailure(new TypeError('unrelated'))).toBe(false)
    // Every automatic reload passes the tab's reload guard first; a failed prefetch leaves it unused.
    expect(window.sessionStorage.getItem(MODULE_RELOAD_SESSION_KEY)).toBeNull()
    stop()
    const late = new TypeError('after stop')
    reportPreloadError(late, target)
    expect(isModuleLoadFailure(late)).toBe(false)
  })
})

describe('page error boundary', () => {
  function Throws({ error }: { error: unknown }): never { throw error }
  const quietErrors = () => vi.spyOn(console, 'error').mockImplementation(() => undefined)
  function moduleFailure(): TypeError {
    const error = new TypeError('Failed to fetch dynamically imported module')
    const stop = trackModuleLoadFailures(window)
    reportPreloadError(error)
    stop()
    return error
  }
  const page = (child: ReactNode, props: Partial<{ active: boolean; resetKey: string; reload: () => void }> = {}) => (
    <PublicErrorBoundary lang="en" resetKey={props.resetKey ?? '/market'} active={props.active} reload={props.reload}>{child}</PublicErrorBoundary>
  )

  it('a failed module on the page the reader is on loads that page again once, then shows the error', () => {
    const quiet = quietErrors()
    try {
      const reload = vi.fn()
      const first = render(page(<Throws error={moduleFailure()} />, { reload }))
      expect(reload).toHaveBeenCalledTimes(1)
      expect(window.sessionStorage.getItem(MODULE_RELOAD_SESSION_KEY)).toBe(JSON.stringify([moduleReloadEnvironment().build]))
      // While the page loads again, the failure state is not shown.
      expect(screen.getByRole('status')).toHaveTextContent('Opening the page…')
      expect(screen.queryByRole('alert')).toBeNull()
      first.unmount()
      // The document after that reload: the module fails again in the same build.
      render(page(<Throws error={moduleFailure()} />, { reload }))
      expect(reload).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('public-runtime-error')).toBeInTheDocument()
      // Its action loads the page again on request.
      fireEvent.click(screen.getByRole('button', { name: 'Open this page again' }))
      expect(reload).toHaveBeenCalledTimes(2)
    } finally { quiet.mockRestore() }
  })

  it('a failure caught while the page is not active reloads nothing; showing the page again retries it', () => {
    const quiet = quietErrors()
    try {
      const reload = vi.fn()
      let error: unknown = moduleFailure()
      function Surface() { if (error !== undefined) throw error; return <p>surface ok</p> }
      const view = render(page(<Surface />, { active: false, reload }))
      expect(reload).not.toHaveBeenCalled()
      expect(window.sessionStorage.getItem(MODULE_RELOAD_SESSION_KEY)).toBeNull()
      expect(screen.getByTestId('public-runtime-error')).toBeInTheDocument()
      // Rendering again while still inactive keeps the failure; nothing is retried.
      error = undefined
      view.rerender(page(<Surface />, { active: false, reload }))
      expect(screen.getByTestId('public-runtime-error')).toBeInTheDocument()
      view.rerender(page(<Surface />, { active: true, reload }))
      expect(screen.getByText('surface ok')).toBeInTheDocument()
      expect(reload).not.toHaveBeenCalled()
    } finally { quiet.mockRestore() }
  })

  it('a module that still fails when its page is shown again loads that page again once', () => {
    const quiet = quietErrors()
    try {
      const reload = vi.fn(), error = moduleFailure()
      const view = render(page(<Throws error={error} />, { active: false, reload }))
      expect(reload).not.toHaveBeenCalled()
      view.rerender(page(<Throws error={error} />, { active: true, reload }))
      expect(reload).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('status')).toHaveTextContent('Opening the page…')
      // Hidden and shown once more in the same build: retried, but the guard allows no second reload.
      view.rerender(page(<Throws error={error} />, { active: false, reload }))
      view.rerender(page(<Throws error={error} />, { active: true, reload }))
      expect(reload).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('public-runtime-error')).toBeInTheDocument()
    } finally { quiet.mockRestore() }
  })

  it('a change of the page route retries a caught failure; a render with the same route does not', () => {
    const quiet = quietErrors()
    try {
      let broken = true
      function Surface() { if (broken) throw new Error('render'); return <p>surface ok</p> }
      const reload = vi.fn()
      const view = render(page(<Surface />, { resetKey: '/market', reload }))
      broken = false
      view.rerender(page(<Surface />, { resetKey: '/market', reload }))
      expect(screen.getByTestId('public-runtime-error')).toBeInTheDocument()
      view.rerender(page(<Surface />, { resetKey: '/market?view=sectors', reload }))
      expect(screen.getByText('surface ok')).toBeInTheDocument()
      expect(reload).not.toHaveBeenCalled()
    } finally { quiet.mockRestore() }
  })

  it('any other render failure resets in place without loading the page', () => {
    const quiet = quietErrors()
    try {
      let broken = true
      function Surface() { if (broken) throw new Error('render'); return <p>surface ok</p> }
      const reload = vi.fn()
      render(page(<Surface />, { reload }))
      expect(reload).not.toHaveBeenCalled()
      broken = false
      fireEvent.click(screen.getByRole('button', { name: 'Open this page again' }))
      expect(screen.getByText('surface ok')).toBeInTheDocument()
      expect(reload).not.toHaveBeenCalled()
    } finally { quiet.mockRestore() }
  })
})
