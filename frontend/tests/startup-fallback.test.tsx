import { fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STARTUP_FALLBACK_ID, showStartupFallback, startupFallbackLanguage } from '../src/performance/startupFallback'

const controls = vi.hoisted(() => ({
  appModule: 'loads' as 'loads' | 'fails',
  renderFails: false,
  moduleFailure: false,
  reloadGranted: false,
  automaticAttempts: 0,
  manualReloads: 0,
}))

vi.mock('../src/PublicBetaApp', () => {
  if (controls.appModule === 'fails') throw new Error('app module failed')
  return {
    PublicBetaApp: () => {
      if (controls.renderFails) throw new Error('app render failed')
      return <p>fixture-app</p>
    },
  }
})
vi.mock('../src/performance/moduleLoadRecovery', async (importOriginal) => ({
  ...await importOriginal<typeof import('../src/performance/moduleLoadRecovery')>(),
  trackModuleLoadFailures: () => () => undefined,
  isModuleLoadFailure: () => controls.moduleFailure,
  reloadAfterModuleFailure: () => {
    controls.automaticAttempts += 1
    return controls.reloadGranted
  },
  reloadPage: () => { controls.manualReloads += 1 },
}))

const fallback = () => document.getElementById(STARTUP_FALLBACK_ID)
const appRoot = () => document.getElementById('root')!
// The entry reports the failure like an uncaught error.
const reported: unknown[] = []

beforeEach(() => {
  Object.assign(controls, {
    appModule: 'loads', renderFails: false, moduleFailure: false, reloadGranted: false,
    automaticAttempts: 0, manualReloads: 0,
  })
  reported.length = 0
  document.body.innerHTML = '<div id="root"></div>'
  window.localStorage.clear()
  vi.stubGlobal('reportError', (error: unknown) => { reported.push(error) })
})
afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
  vi.restoreAllMocks()
  vi.resetModules()
})

async function startEntry(path: string): Promise<void> {
  window.history.replaceState(null, '', path)
  await import('../src/public-main')
}

describe('the static fallback page', () => {
  it('shows the Chinese page after the app root, with no data, a manual reload and the sources link', () => {
    const reload = vi.fn()
    showStartupFallback(appRoot(), 'zh', reload)
    const page = fallback()!
    expect(appRoot().nextElementSibling).toBe(page)
    expect(page.lang).toBe('zh-CN')
    expect(page.querySelector('[role="alert"]')).not.toBeNull()
    expect(page.querySelector('h1')!.textContent).toBe('网站暂时无法加载')
    expect(page.textContent).toContain('网站可能刚刚更新，或网络连接中断。')
    expect(page.querySelector('a')!.getAttribute('href')).toBe('/sources/valve.html#zh')
    fireEvent.click(page.querySelector('button')!)
    fireEvent.click(page.querySelector('button')!)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('shows the English page once per document', () => {
    showStartupFallback(appRoot(), 'en', vi.fn())
    showStartupFallback(appRoot(), 'zh', vi.fn())
    expect(document.querySelectorAll(`#${STARTUP_FALLBACK_ID}`)).toHaveLength(1)
    expect(fallback()!.lang).toBe('en')
    expect(fallback()!.querySelector('h1')!.textContent).toBe('The site could not be loaded')
    expect(fallback()!.querySelector('button')!.textContent).toBe('Reload')
    expect(fallback()!.querySelector('a')!.getAttribute('href')).toBe('/sources/valve.html#en')
  })

  it('takes its language from the address, then the stored choice, then the browser', () => {
    window.history.replaceState(null, '', '/?lang=en')
    window.localStorage.setItem('cs2rotate.public.language.v1', 'zh')
    expect(startupFallbackLanguage()).toBe('en')
    window.history.replaceState(null, '', '/')
    expect(startupFallbackLanguage()).toBe('zh')
    window.localStorage.clear()
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['zh-CN'])
    expect(startupFallbackLanguage()).toBe('zh')
  })
})

describe('the entry shows the fallback when no automatic reload is under way', () => {
  it('a failed app module within the tab’s automatic reloads loads the page again, without the fallback', async () => {
    Object.assign(controls, { appModule: 'fails', moduleFailure: true, reloadGranted: true })
    await startEntry('/trending?lang=en')
    await waitFor(() => expect(controls.automaticAttempts).toBe(1))
    expect(reported).toHaveLength(1)
    expect(fallback()).toBeNull()
  })

  it('a failed app module past the tab’s automatic reloads shows the fallback; its button reloads by hand', async () => {
    Object.assign(controls, { appModule: 'fails', moduleFailure: true, reloadGranted: false })
    await startEntry('/trending?lang=en')
    await waitFor(() => expect(fallback()).not.toBeNull())
    expect(controls.automaticAttempts).toBe(1)
    expect(reported).toHaveLength(1)
    expect(fallback()!.lang).toBe('en')
    fireEvent.click(fallback()!.querySelector('button')!)
    expect(controls.manualReloads).toBe(1)
    expect(controls.automaticAttempts).toBe(1)
  })

  it('any other startup failure shows the fallback without an automatic reload', async () => {
    Object.assign(controls, { appModule: 'fails', moduleFailure: false })
    await startEntry('/?lang=zh')
    await waitFor(() => expect(fallback()).not.toBeNull())
    expect(controls.automaticAttempts).toBe(0)
    expect(fallback()!.lang).toBe('zh-CN')
  })

  it('an uncaught error that unmounts the app shows the fallback in the app’s language', async () => {
    controls.renderFails = true
    await startEntry('/?lang=zh')
    await waitFor(() => expect(fallback()).not.toBeNull())
    expect(controls.automaticAttempts).toBe(0)
    expect(fallback()!.lang).toBe('zh-CN')
    expect(appRoot().childElementCount).toBe(0)
    expect(document.querySelectorAll(`#${STARTUP_FALLBACK_ID}`)).toHaveLength(1)
  })

  it('an uncaught failed module within the tab’s automatic reloads loads the page again, without the fallback', async () => {
    Object.assign(controls, { renderFails: true, moduleFailure: true, reloadGranted: true })
    await startEntry('/?lang=en')
    await waitFor(() => expect(controls.automaticAttempts).toBeGreaterThan(0))
    expect(fallback()).toBeNull()
  })

  it('an app that starts shows no fallback', async () => {
    await startEntry('/?lang=en')
    await waitFor(() => expect(appRoot().textContent).toBe('fixture-app'))
    expect(fallback()).toBeNull()
    expect(reported).toHaveLength(0)
  })
})
