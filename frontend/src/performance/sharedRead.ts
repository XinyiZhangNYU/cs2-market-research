type Pending<T> = {
  controller: AbortController
  promise: Promise<T>
  subscribers: number
  settled: boolean
}

/** Memory only; each API owns its validated key, eligibility and lifetime.
 * Subscriber cancellation never cancels another subscriber's read. */
export class SharedRead<T> {
  private readonly values = new Map<string, { value: T; loadedAt: number }>()
  private readonly pending = new Map<string, Pending<T>>()

  constructor(private readonly maxEntries: number, private readonly ttlMs: number) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 400 ||
        !Number.isInteger(ttlMs) || ttlMs < 0 || ttlMs > 30_000) throw new TypeError('Invalid read cache bounds')
  }

  private freshEntry(key: string): { value: T; loadedAt: number } | undefined {
    const entry = this.values.get(key), now = Date.now()
    if (entry && now >= entry.loadedAt && now - entry.loadedAt < this.ttlMs) return entry
    this.values.delete(key)
    return undefined
  }

  /** Admission proof only: never starts a read or renews the original clock. */
  hasFreshValue(key: string, matches: (value: T) => boolean): boolean {
    const entry = this.freshEntry(key)
    return entry !== undefined && matches(entry.value)
  }

  /** `loaded` runs once per completed load, right after the value is kept: a listener that
   * reacts by dropping every subscriber can no longer cost the cache this value. */
  read(
    key: string,
    load: (signal: AbortSignal) => Promise<T>,
    retain: (value: T) => boolean,
    signal?: AbortSignal,
    loaded?: (value: T) => void,
  ): Promise<T> {
    signal?.throwIfAborted()
    const cached = this.freshEntry(key)
    if (cached) return Promise.resolve(cached.value)
    let entry = this.pending.get(key)
    if (!entry) {
      // Never evict a read with subscribers, but bound distinct in-flight keys
      // too. The API maps admission failure through its normal unavailable UI.
      if (this.pending.size >= this.maxEntries) return Promise.reject(new Error('Shared read capacity exceeded'))
      const controller = new AbortController()
      entry = { controller, subscribers: 0, settled: false, promise: Promise.resolve().then(() => {
        controller.signal.throwIfAborted()
        return load(controller.signal)
      }) }
      const current = entry
      this.pending.set(key, current)
      current.promise = current.promise.then((value) => {
        if (controller.signal.aborted) return value
        if (retain(value) && this.ttlMs > 0) {
          this.values.delete(key)
          this.values.set(key, { value, loadedAt: Date.now() })
          while (this.values.size > this.maxEntries) this.values.delete(this.values.keys().next().value!)
        }
        loaded?.(value)
        return value
      }).finally(() => {
        current.settled = true
        if (this.pending.get(key) === current) this.pending.delete(key)
      })
    }
    const current = entry
    return new Promise<T>((resolve, reject) => {
      current.subscribers += 1
      let released = false
      const release = () => {
        if (released) return
        released = true
        signal?.removeEventListener('abort', onAbort)
        current.subscribers -= 1
        if (current.subscribers === 0 && !current.settled) {
          if (this.pending.get(key) === current) this.pending.delete(key)
          current.controller.abort(new DOMException('No active subscribers', 'AbortError'))
        }
      }
      const onAbort = () => { release(); reject(signal?.reason ?? new DOMException('Aborted', 'AbortError')) }
      signal?.addEventListener('abort', onAbort, { once: true })
      if (signal?.aborted) { onAbort(); return }
      current.promise.then(
        (value) => { release(); resolve(value) },
        (error) => { release(); reject(error) },
      )
    })
  }
}
