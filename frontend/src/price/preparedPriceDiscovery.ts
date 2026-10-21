import type { PriceDisplayGateway } from '../api/PriceDisplayApi'
import type { PriceReadContext } from './priceDisplayRuntime'
import type { PriceSnapshot } from '../wire/priceDisplayApiTypes'
import { canonicalJsonText } from '../wire/canonical'

export const priceDiscoveryKey = (context: PriceReadContext) => canonicalJsonText({
  catalog: context.catalog, queryAsOf: context.queryAsOf, knownAt: context.knownAt,
})
export type PreparedPriceDiscovery = Readonly<{
  gateway: PriceDisplayGateway
  key: string
  promise: Promise<PriceSnapshot>
  loadedAt: number | null
  start: () => (() => void)
  cancel: () => void
}>
/** A single view episode, not an error cache. Creation has no network effect.
 * Heavy price decoding remains lazy: only an opened series/detail starts it.
 * The consumer shares this promise, including failure (no duplicate request). */
export function preparePriceDiscovery(gateway: PriceDisplayGateway, input: PriceReadContext): PreparedPriceDiscovery {
  const context = structuredClone(input), controller = new AbortController()
  let started = false, readers = 0, loadedAt: number | null = null
  let resolve!: (value: PriceSnapshot) => void, reject!: (error: unknown) => void
  const promise = new Promise<PriceSnapshot>((yes, no) => { resolve = yes; reject = no })
  void promise.catch(() => undefined)
  const cancel = () => { controller.abort(); reject(controller.signal.reason) }
  return {
    gateway, key: priceDiscoveryKey(context), promise,
    get loadedAt() { return loadedAt },
    start() {
      readers += 1
      if (!started && !controller.signal.aborted) {
        started = true
        void import('./priceDisplayRuntime').then((module) => {
          controller.signal.throwIfAborted()
          return module.discoverPriceSnapshot(gateway, context, 'CURRENT', { signal: controller.signal })
        }).then((value) => { loadedAt = Date.now(); resolve(value) }, reject)
      }
      let released = false
      return () => {
        if (released) return
        released = true
        readers -= 1
        // Development effect replay reacquires synchronously. Real departure
        // cancels even if the dynamically imported module has not arrived yet.
        queueMicrotask(() => { if (readers === 0) cancel() })
      }
    },
    cancel,
  }
}
