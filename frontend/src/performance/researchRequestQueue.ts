export type ResearchRequestPriority = 'FOREGROUND' | 'BACKGROUND'
export const PUBLIC_RESEARCH_CONCURRENCY = 4
export const PUBLIC_RESEARCH_QUEUE_LIMIT = 128
export const PUBLIC_RESEARCH_QUEUE_WAIT_MS = 15_000

export class ResearchQueueFullError extends Error {
  constructor() { super('Public research request queue is full'); this.name = 'ResearchQueueFullError' }
}
export class ResearchQueueTimeoutError extends Error {
  constructor() { super('Public research queue deadline exceeded'); this.name = 'ResearchQueueTimeoutError' }
}

type Job = {
  start: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
  priority: ResearchRequestPriority
  enqueuedAt: number
  deadlineAt: number
  signal?: AbortSignal
  onAbort: () => void
  timeout?: ReturnType<typeof setTimeout>
}

/** One browser-wide admission queue. A slot covers the body, not just fetch headers.
 * This reduces local bursts; it does not change or guarantee origin capacity.
 * No response caching, retries, publication policy or credential handling here. */
export class ResearchRequestQueue {
  private readonly jobs: Job[] = []
  private running = 0

  constructor(readonly concurrency = PUBLIC_RESEARCH_CONCURRENCY, readonly queueLimit = PUBLIC_RESEARCH_QUEUE_LIMIT,
    readonly maxWaitMs = PUBLIC_RESEARCH_QUEUE_WAIT_MS) {
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 6 ||
        !Number.isInteger(queueLimit) || queueLimit < 1 || queueLimit > 256 ||
        !Number.isInteger(maxWaitMs) || maxWaitMs < 100 || maxWaitMs > 60_000) {
      throw new TypeError('Invalid research queue bounds')
    }
  }

  get active(): number { return this.running }
  get queued(): number { return this.jobs.length }

  run<T>(start: () => Promise<T>, signal?: AbortSignal, priority: ResearchRequestPriority = 'FOREGROUND'): Promise<T> {
    if (signal?.aborted) return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
    if (this.jobs.length >= this.queueLimit) return Promise.reject(new ResearchQueueFullError())
    return new Promise<T>((resolve, reject) => {
      const enqueuedAt = Date.now()
      const job: Job = {
        start, resolve: (value) => resolve(value as T), reject, priority,
        enqueuedAt, deadlineAt: enqueuedAt + this.maxWaitMs, signal,
        onAbort: () => {
          const index = this.jobs.indexOf(job)
          if (index < 0) return
          this.jobs.splice(index, 1)
          clearTimeout(job.timeout)
          signal?.removeEventListener('abort', job.onAbort)
          reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'))
        },
      }
      this.jobs.push(job)
      job.timeout = setTimeout(() => {
        const index = this.jobs.indexOf(job)
        if (index < 0) return
        this.jobs.splice(index, 1)
        signal?.removeEventListener('abort', job.onAbort)
        reject(new ResearchQueueTimeoutError())
      }, this.maxWaitMs)
      signal?.addEventListener('abort', job.onAbort, { once: true })
      // Covers abort between the initial check and listener registration.
      if (signal?.aborted) job.onAbort()
      this.drain()
    })
  }

  private expired(job: Job): boolean {
    const now = Date.now()
    // Timer delivery can lag Promise completion. It is a wakeup, not proof of
    // admission. A clock earlier than enqueue fails closed; this is NOT a
    // monotonic elapsed-time guarantee for every possible wall-clock adjustment.
    return now >= job.deadlineAt || now < job.enqueuedAt
  }

  private drain(): void {
    while (this.running < this.concurrency && this.jobs.length > 0) {
      // Old background jobs eventually progress; newly selected work otherwise goes first.
      const foreground = this.jobs.findIndex((job) => job.priority === 'FOREGROUND')
      const index = Date.now() - this.jobs[0]!.enqueuedAt >= 5_000 || foreground < 0 ? 0 : foreground
      const job = this.jobs.splice(index, 1)[0]!
      clearTimeout(job.timeout)
      job.signal?.removeEventListener('abort', job.onAbort)
      if (job.signal?.aborted) { job.reject(job.signal.reason ?? new DOMException('Aborted', 'AbortError')); continue }
      if (this.expired(job)) { job.reject(new ResearchQueueTimeoutError()); continue }
      this.running += 1
      void Promise.resolve().then(() => {
        // A free slot does not guarantee this microtask starts before deadline,
        // or that the caller remains interested between admission and execution.
        if (job.signal?.aborted) throw job.signal.reason ?? new DOMException('Aborted', 'AbortError')
        if (this.expired(job)) throw new ResearchQueueTimeoutError()
        return job.start()
      }).then(job.resolve, job.reject).finally(() => {
        this.running -= 1
        this.drain()
      })
    }
  }
}

export const publicResearchQueue = new ResearchRequestQueue()

export function isPublicResearchRequest(input: RequestInfo | URL): boolean {
  const text = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  let path: string
  try {
    const rootRelative = text.startsWith('/') && !text.startsWith('//')
    if (!rootRelative && typeof location === 'undefined') return false
    const origin = typeof location === 'undefined' ? 'https://public.invalid' : location.origin
    const url = new URL(text, `${origin}/`)
    if (url.origin !== origin || url.username || url.password) return false
    path = url.pathname
  } catch { return false }
  // Browser-local scheduling for the frontend's current research endpoints.
  // This is not an exact mirror of Edge routeClass(), nor authorization.
  // Catalog/media/Steam are deliberately excluded; Edge policy is unchanged.
  return /^\/api\/v[123]\/(?:market-index\/public|market-descriptive\/public|item-monitor\/(?:public|current|history)|research-results\/public|research-observations\/public|price-display|fx|valve-events)(?:\/|$)/u.test(path)
}
