import { SharedRead } from '../performance/sharedRead'
import type { NativeCnyIndexPublicDay, NativeCnyIndexPublicHistory } from '../wire/nativeCnyIndexPublicApi'

/** Product lower bound, not a claim that a publication exists on this day. */
export const NATIVE_CNY_ALL_START = '2022-12-25'
/** Origin cost grows with every day read (~16 ms/day, CPU-bound) against a 10 s origin
 * timeout; 92-day chunks finish in ~2 s, leaving headroom for two concurrent readers. */
export const NATIVE_CNY_ALL_CHUNK_DAYS = 92
const DAY_MS = 86_400_000
export type HistoryChunk = Readonly<{ start: string; end: string }>
const shift = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)

export function nativeHistoryChunks(start: string, end: string): readonly HistoryChunk[] {
  for (const value of [start, end]) {
    const parsed = new Date(`${value}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new TypeError('Invalid All window date')
    }
  }
  if (start > end) throw new TypeError('Invalid All window order')
  const chunks: HistoryChunk[] = []
  for (let cursor = start; cursor <= end;) {
    const span = shift(cursor, NATIVE_CNY_ALL_CHUNK_DAYS - 1)
    const last = span < end ? span : end
    chunks.push({ start: cursor, end: last })
    cursor = shift(last, 1)
  }
  return chunks
}

/** Defense at the assembly boundary, in addition to the unchanged per-response decoder.
 * Never sort, deduplicate, interpolate, or require identical daily rights/review pins. */
export function joinNativeHistoryChunks(
  parts: readonly NativeCnyIndexPublicHistory[], chunks: readonly HistoryChunk[], spec: string, scope: string,
): NativeCnyIndexPublicHistory {
  if (!parts.length || parts.length !== chunks.length) throw new TypeError('Incomplete All window')
  const days: NativeCnyIndexPublicDay[] = [], missing: string[] = []
  let previous: string | undefined
  parts.forEach((part, index) => {
    const chunk = chunks[index]!
    if ((index > 0 && shift(chunks[index - 1]!.end, 1) !== chunk.start)
      || part.start_date !== chunk.start || part.end_date !== chunk.end
      || part.spec_sha256 !== spec || part.scope !== scope || part.calculation_revisions_mixed !== false) {
      throw new TypeError('Inconsistent All window chunk')
    }
    for (const day of part.days) {
      const date = day.data.bucket_date
      if ((previous !== undefined && date <= previous) || date < chunk.start || date > chunk.end
        || day.data.spec_sha256 !== spec || day.data.points.length !== 1 || day.data.points[0]!.scope_code !== scope
        // One spec is one method across chunks too, as within one history answer.
        || (days.length > 0 && day.data.method !== days[0]!.data.method)) {
        throw new TypeError('Inconsistent All window day')
      }
      previous = date
      days.push(day)
    }
    missing.push(...part.missing_publication_dates)
  })
  return Object.freeze({ ...parts[0]!, end_date: chunks.at(-1)!.end,
    days: Object.freeze(days), missing_publication_dates: Object.freeze(missing) })
}

/** A chunk with no row of the spec (NOT_PUBLISHED) is allowed only before the first or after
 * the last chunk that has rows: a spec that starts late, or one that lags its end (the E second
 * curve's owner appends). Those days are listed as missing, exactly as one wider answer would.
 * A chunk without rows between two with rows is an error; a window with no rows at all is null. */
export function joinNativeHistoryChunksWithEdges(
  parts: readonly (NativeCnyIndexPublicHistory | null)[], chunks: readonly HistoryChunk[], spec: string, scope: string,
): NativeCnyIndexPublicHistory | null {
  if (!parts.length || parts.length !== chunks.length) throw new TypeError('Incomplete All window')
  const first = parts.findIndex((part) => part !== null)
  if (first < 0) return null
  const last = parts.length - 1 - [...parts].reverse().findIndex((part) => part !== null)
  if (parts.slice(first, last + 1).some((part) => part === null)) throw new TypeError('Unpublished interior All window chunk')
  const filled = parts.map((part, index) => {
    if (part !== null) return part
    const chunk = chunks[index]!
    const missing: string[] = []
    for (let date = chunk.start; date <= chunk.end; date = shift(date, 1)) missing.push(date)
    return Object.freeze({ api_contract: 'native-cny-index-history/1', spec_sha256: spec, scope,
      start_date: chunk.start, end_date: chunk.end, currency: 'CNY', fx_applied: false, days: Object.freeze([]),
      missing_publication_dates: Object.freeze(missing), missing_prices_filled: false,
      calculation_revisions_mixed: false }) satisfies NativeCnyIndexPublicHistory
  })
  return joinNativeHistoryChunks(filled, chunks, spec, scope)
}

/** Page-wide chunk permits, including separate adapter instances and cancelled
 * transports that have not settled yet. Never release merely on caller abort. */
class AllChunkPermits {
  private active = 0
  private readonly waiting: Array<() => void> = []

  acquire(signal: AbortSignal): Promise<() => void> {
    signal.throwIfAborted()
    return new Promise((resolve, reject) => {
      const start = () => {
        signal.removeEventListener('abort', abort)
        this.active += 1
        resolve(() => { this.active -= 1; this.waiting.shift()?.() })
      }
      const abort = () => {
        const index = this.waiting.indexOf(start)
        if (index >= 0) this.waiting.splice(index, 1)
        reject(signal.reason)
      }
      if (this.active < 2) start()
      else { this.waiting.push(start); signal.addEventListener('abort', abort, { once: true }) }
    })
  }
}
const allChunkPermits = new AllChunkPermits()

/** In-flight window deduplication only; the four old windows remain untouched. */
export class NativeCnyAllHistory {
  private readonly reads = new SharedRead<NativeCnyIndexPublicHistory>(64, 0)
  private readonly specReads = new SharedRead<NativeCnyIndexPublicHistory | null>(64, 0)

  read(day: NativeCnyIndexPublicDay, scope: string,
    load: (start: string, end: string, signal: AbortSignal) => Promise<NativeCnyIndexPublicHistory>, signal?: AbortSignal,
  ): Promise<NativeCnyIndexPublicHistory> {
    const end = day.data.bucket_date, spec = day.data.spec_sha256
    const key = JSON.stringify(['ALL', day.publication_id, spec, scope, NATIVE_CNY_ALL_START, end])
    return this.reads.read(key, (sharedSignal) => this.chunked(end, load, sharedSignal)
      .then((parts) => joinNativeHistoryChunks(parts.values, parts.chunks, spec, scope)), () => false, signal)
  }

  /** A spec read by itself, not the selected day's (the E second curve): its edge chunks may be
   * NOT_PUBLISHED (load answers null), and no answer at all is null. Same chunks and permits. */
  readSpec(spec: string, scope: string, end: string,
    load: (start: string, end: string, signal: AbortSignal) => Promise<NativeCnyIndexPublicHistory | null>, signal?: AbortSignal,
  ): Promise<NativeCnyIndexPublicHistory | null> {
    const key = JSON.stringify(['ALL_SPEC', spec, scope, NATIVE_CNY_ALL_START, end])
    return this.specReads.read(key, (sharedSignal) => this.chunked(end, load, sharedSignal)
      .then((parts) => joinNativeHistoryChunksWithEdges(parts.values, parts.chunks, spec, scope)), () => false, signal)
  }

  private async chunked<T>(end: string, load: (start: string, end: string, signal: AbortSignal) => Promise<T>,
    sharedSignal: AbortSignal): Promise<{ values: T[]; chunks: readonly HistoryChunk[] }> {
    const controller = new AbortController()
    const abort = () => controller.abort(sharedSignal.reason)
    sharedSignal.addEventListener('abort', abort, { once: true })
    if (sharedSignal.aborted) abort()
    try {
      const chunks = nativeHistoryChunks(NATIVE_CNY_ALL_START, end)
      const parts = new Array<T>(chunks.length)
      let next = 0
      const worker = async () => {
        while (next < chunks.length) {
          controller.signal.throwIfAborted()
          const index = next++, chunk = chunks[index]!
          const release = await allChunkPermits.acquire(controller.signal)
          try {
            controller.signal.throwIfAborted()
            parts[index] = await load(chunk.start, chunk.end, controller.signal)
            controller.signal.throwIfAborted()
          } catch (error) {
            // Stop both this window's queued work and its other active chunk.
            controller.abort(error)
            throw error
          } finally { release() }
        }
      }
      await Promise.all([worker(), worker()])
      return { values: parts, chunks }
    } finally { sharedSignal.removeEventListener('abort', abort) }
  }
}
