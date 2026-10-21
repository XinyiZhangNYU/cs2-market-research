/** Recovery from a failed lazy module. Chromium keeps a failed module fetch in the document's
 * module map, so a later import() of the same URL fails again without a request; only a new
 * document recovers, for example after a deploy replaced the hashed chunks. */
export const MODULE_RELOAD_SESSION_KEY = 'cs2-rotate.module-reload.builds.v2'

/** The earlier guard (never deployed) kept only the last build here, so how many reloads a tab
 * holding it already made is not known. Such a tab counts as having used all of them. */
export const LEGACY_MODULE_RELOAD_SESSION_KEY = 'cs2-rotate.module-reload.build.v1'

/** Automatic reloads a tab may make for failed modules, over all builds it loads. One covers a
 * deploy that replaced the chunks of an open page; the second covers a deploy during that reload.
 * A host that serves two builds in turn while one of them fails therefore stops after two. */
export const MAX_AUTOMATIC_MODULE_RELOADS = 2

/** The URL of the bundle this code runs in. Its hashed name changes with the names of the chunks
 * it imports, so it identifies the build. */
const CURRENT_BUILD = import.meta.url

export type ModuleReloadEnvironment = Readonly<{
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  online: boolean
  build: string
  reload: () => void
}>

const failures = new WeakSet<object>()

export function reloadPage(): void {
  window.location.reload()
}

/** This tab's guard storage, network state and build, with the reload to perform. */
export function moduleReloadEnvironment(reload: () => void = reloadPage): ModuleReloadEnvironment {
  let storage: ModuleReloadEnvironment['storage'] = null
  try {
    storage = globalThis.sessionStorage ?? null
  } catch {
    storage = null
  }
  return {
    storage,
    online: globalThis.navigator?.onLine !== false,
    build: CURRENT_BUILD,
    reload,
  }
}

/** True for an error that a build reported as a failed dynamic import or module preload. */
export function isModuleLoadFailure(error: unknown): boolean {
  return typeof error === 'object' && error !== null && failures.has(error)
}

/** The builds this tab already reloaded for, oldest first, or null when the stored value is not
 * such a list. */
function reloadedBuilds(value: string | null): string[] | null {
  if (value === null) return []
  let builds: unknown
  try {
    builds = JSON.parse(value)
  } catch {
    return null
  }
  if (!Array.isArray(builds) || builds.length > MAX_AUTOMATIC_MODULE_RELOADS) return null
  if (!builds.every((build) => typeof build === 'string')) return null
  return builds
}

/** Reloads at most once per build and at most MAX_AUTOMATIC_MODULE_RELOADS times in a tab. The
 * list of builds that reloaded keeps every entry, so builds served in turn cannot reset it. It
 * does not reload when the browser reports offline, when the stored list cannot be read, when the
 * tab holds the earlier guard, or when the new list cannot be stored and read back (a reload loop
 * could not be ruled out). A module that fails after that shows the error state, whose action
 * reloads on request. */
export function reloadAfterModuleFailure(environment: ModuleReloadEnvironment = moduleReloadEnvironment()): boolean {
  const { storage, online, build, reload } = environment
  if (!online || storage === null) return false
  try {
    if (storage.getItem(LEGACY_MODULE_RELOAD_SESSION_KEY) !== null) return false
    const builds = reloadedBuilds(storage.getItem(MODULE_RELOAD_SESSION_KEY))
    if (builds === null || builds.includes(build) || builds.length >= MAX_AUTOMATIC_MODULE_RELOADS) return false
    const next = JSON.stringify([...builds, build])
    storage.setItem(MODULE_RELOAD_SESSION_KEY, next)
    if (storage.getItem(MODULE_RELOAD_SESSION_KEY) !== next) return false
  } catch {
    return false
  }
  reload()
  return true
}

/** Vite dispatches `vite:preloadError` with the rejection of every failed dynamic import or
 * module preload in a build, before that rejection reaches the caller. The listener only records
 * the error and does not prevent the default. The reload belongs to whatever shows the failure to
 * the reader (the page's error boundary, or the app root when no boundary can), so a failed
 * prefetch or background read never reloads the page under the reader. */
export function trackModuleLoadFailures(
  target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window,
): () => void {
  const listener = (event: Event) => {
    const payload: unknown = (event as Event & { payload?: unknown }).payload
    if (typeof payload === 'object' && payload !== null) failures.add(payload)
  }
  target.addEventListener('vite:preloadError', listener)
  return () => target.removeEventListener('vite:preloadError', listener)
}
