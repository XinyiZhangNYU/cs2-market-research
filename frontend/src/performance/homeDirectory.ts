import type { MarketSectorIndexPublicApi } from '../api/MarketSectorIndexPublicApi'
import type { MarketSectorIndexGroupDirectoryV3 } from '../wire/marketSectorIndexPublicApiV3Types'

type Directory = MarketSectorIndexGroupDirectoryV3 | null
export type HomeDirectory = Readonly<{
  api: MarketSectorIndexPublicApi
  start: () => (() => void)
  read: (signal: AbortSignal) => Promise<Directory>
}>

/** One visible HOME episode, not an API/error cache. Creation never reads.
 * Parent, hero and desktop list share a failure too: no failed preparation retry.
 * A fresh episode is created on return; late success cannot exceed the API TTL. */
export function prepareHomeDirectory(api: MarketSectorIndexPublicApi): HomeDirectory {
  const controller = new AbortController()
  let started = false, readers = 0, settled = false, loadedAt: number | null = null
  let resolve!: (value: Directory) => void, reject!: (error: unknown) => void
  const promise = new Promise<Directory>((yes, no) => { resolve = yes; reject = no })
  void promise.catch(() => undefined)
  const start = () => {
    readers += 1
    if (!started && !controller.signal.aborted) {
      started = true
      void api.directoryV3Groups(null, { signal: controller.signal }).then(
        (value) => { settled = true; loadedAt = Date.now(); resolve(value) },
        (error) => { settled = true; reject(error) },
      )
    }
    let released = false
    return () => {
      if (released) return
      released = true; readers -= 1
      // StrictMode effect replay reacquires before this cancellation check.
      queueMicrotask(() => {
        if (readers === 0 && !settled) { controller.abort(); reject(controller.signal.reason) }
      })
    }
  }
  return { api, start, async read(signal) {
    signal.throwIfAborted()
    const release = start()
    let onAbort!: () => void
    try {
      const value = await new Promise<Directory>((yes, no) => {
        onAbort = () => no(signal.reason)
        signal.addEventListener('abort', onAbort, { once: true })
        promise.then(yes, no)
      })
      signal.throwIfAborted()
      if (loadedAt !== null && value !== null) {
        const age = Date.now() - loadedAt
        if (age < 0) throw new TypeError('HOME directory clock moved backwards')
        if (!api.isActiveDirectoryFresh(value)) return await api.directoryV3Groups(null, { signal })
      }
      return value
    } finally { signal.removeEventListener('abort', onAbort); release() }
  } }
}
