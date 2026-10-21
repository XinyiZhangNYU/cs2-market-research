export const INTENT_PREFETCH_DELAY_MS = 200
export const INTENT_PREFETCH_MAX_CONCURRENCY = 2

export type IntentPrefetchTask = (signal: AbortSignal) => Promise<void>

type NetworkInformationLike = Readonly<{
  saveData?: boolean
  effectiveType?: string
}>

export function permitsBackgroundPrefetch(
  visibilityState = globalThis.document?.visibilityState,
  connection = (globalThis.navigator as Navigator & { connection?: NetworkInformationLike } | undefined)?.connection,
): boolean {
  if (visibilityState === 'hidden' || connection?.saveData === true) return false
  return connection?.effectiveType !== 'slow-2g' && connection?.effectiveType !== '2g'
}

export function createIntentPrefetchScheduler({
  delayMs = INTENT_PREFETCH_DELAY_MS,
  maxConcurrent = INTENT_PREFETCH_MAX_CONCURRENCY,
  canRun = permitsBackgroundPrefetch,
}: Readonly<{
  delayMs?: number
  maxConcurrent?: number
  canRun?: () => boolean
}> = {}) {
  if (!Number.isFinite(delayMs) || delayMs < 0) throw new TypeError('invalid intent prefetch delay')
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) throw new TypeError('invalid intent prefetch concurrency')

  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const queued = new Map<string, IntentPrefetchTask>()
  const running = new Map<string, AbortController>()
  const completed = new Set<string>()
  let disposed = false

  const pump = () => {
    if (disposed || !canRun()) return
    while (running.size < maxConcurrent && queued.size > 0) {
      const next = queued.entries().next().value as [string, IntentPrefetchTask] | undefined
      if (next === undefined) return
      const [key, task] = next
      queued.delete(key)
      const controller = new AbortController()
      running.set(key, controller)
      void Promise.resolve()
        .then(() => task(controller.signal))
        .then(() => {
          if (!controller.signal.aborted) completed.add(key)
        })
        .catch(() => undefined)
        .finally(() => {
          if (running.get(key) === controller) running.delete(key)
          pump()
        })
    }
  }

  const enqueue = (key: string, task: IntentPrefetchTask) => {
    if (disposed || completed.has(key) || running.has(key) || queued.has(key) || !canRun()) return
    queued.set(key, task)
    pump()
  }

  const schedule = (key: string, task: IntentPrefetchTask, immediate = false) => {
    if (disposed || completed.has(key) || running.has(key) || queued.has(key) || !canRun()) return
    const pending = timers.get(key)
    if (pending !== undefined) {
      if (!immediate) return
      clearTimeout(pending)
      timers.delete(key)
      enqueue(key, task)
      return
    }
    if (immediate) {
      enqueue(key, task)
      return
    }
    const timer = setTimeout(() => {
      if (timers.get(key) !== timer) return
      timers.delete(key)
      enqueue(key, task)
    }, delayMs)
    timers.set(key, timer)
  }

  const cancel = (key: string) => {
    const timer = timers.get(key)
    if (timer !== undefined) clearTimeout(timer)
    timers.delete(key)
    queued.delete(key)
    running.get(key)?.abort(new DOMException('Prefetch intent ended', 'AbortError'))
    running.delete(key)
  }

  const cancelAll = () => {
    for (const key of [...timers.keys(), ...queued.keys(), ...running.keys()]) cancel(key)
  }

  const dispose = () => {
    cancelAll()
    disposed = true
  }

  return Object.freeze({ schedule, cancel, cancelAll, dispose })
}
