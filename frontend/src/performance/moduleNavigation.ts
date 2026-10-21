/** Only gates a change of page module, never controlled text/filter updates.
 * Delayed imports cannot commit an obsolete route or a duplicate history entry. */
export function createModuleNavigation(setPending: (pending: boolean) => void, timeoutMs = 15_000) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60_000) throw new TypeError('Invalid module wait bound')
  let epoch = 0
  let pending = false
  let timeout: ReturnType<typeof setTimeout> | undefined
  return {
    // Synchronous admission state: React's pending render can lag a user event.
    get pending(): boolean { return pending },
    cancel() {
      epoch += 1
      clearTimeout(timeout)
      pending = false
      setPending(false)
    },
    run(load: (() => Promise<unknown>) | undefined, apply: () => void) {
      clearTimeout(timeout)
      const current = ++epoch
      let committed = false
      const commit = () => {
        if (committed || epoch !== current) return
        committed = true
        clearTimeout(timeout)
        pending = false
        apply()
        setPending(false)
      }
      if (!load) { commit(); return }
      pending = true
      setPending(true)
      // On timeout release the old inert page into the existing loading/error
      // boundary. Dynamic imports cannot be cancelled; their late result may
      // resolve that boundary, but cannot recommit history.
      timeout = setTimeout(commit, timeoutMs)
      try { void load().then(commit, commit) }
      catch { commit() }
    },
    dispose() { epoch += 1; clearTimeout(timeout); pending = false },
  }
}
