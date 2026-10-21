import {
  decodeMarketSectorIndexDocument,
  isDecodedMarketSectorIndexDocument,
  MarketSectorIndexValidationError,
  type MarketSectorIndexDecodeRequest,
} from '../wire/marketSectorIndexPublicApiDecode'
import { nativeMarketProjection } from './NativeCnyMarketGateways'
import type {
  MarketSectorIndexDirectoryQuery,
  MarketSectorIndexDocument,
  MarketSectorIndexPoint,
  MarketSectorIndexSeries,
  MarketSectorIndexSeriesQuery,
} from '../wire/marketSectorIndexPublicApiTypes'
import {
  decodeMarketSectorIndexDirectoryV3,
  isDecodedMarketSectorIndexDirectoryV3,
} from '../wire/marketSectorIndexPublicApiV3Decode'
import type {
  MarketSectorIndexDirectoryErrorV3,
  MarketSectorIndexDirectoryReleaseV3,
  MarketSectorIndexGroupDirectoryV3,
  MarketSectorIndexGroupCode,
  MarketSectorIndexRequestV3,
  MarketSectorIndexSeriesV3,
  MarketSectorIndexScopeV3,
} from '../wire/marketSectorIndexPublicApiV3Types'

export type MarketSectorIndexReadOptions = Readonly<{ signal?: AbortSignal; priority?: import('../performance/researchRequestQueue').ResearchRequestPriority }>
export type MarketSectorIndexTransportResponse = Readonly<{ payload: unknown; httpStatus: number }>
export type MarketSectorIndexLegacyApiVersion = '1' | '2'
export type MarketSectorIndexVersionedTransportResponse = MarketSectorIndexTransportResponse & Readonly<{
  apiVersion: MarketSectorIndexLegacyApiVersion
}>

export class MarketSectorIndexDirectoryV3ResponseError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(`V3 market/sector directory failed: ${code}`)
    this.name = 'MarketSectorIndexDirectoryV3ResponseError'
  }
}

/** One scope's window for a native second curve (E): the main curve's own from/to. */
export type NativeSecondarySeriesRequest = Readonly<{ scope_code: string; from_date: string; to_date: string }>
/** A validated native second curve. Its points end at `latest_date`, its own latest row. */
export type NativeSecondarySeries = Readonly<{
  method: 'EQUAL_GEOMETRIC_COHORT_NATIVE_CNY_V1'
  spec_sha256: string
  scope_code: string
  points: readonly MarketSectorIndexPoint[]
  latest_date: string
}>

export interface MarketSectorIndexPublicGateway {
  readonly kind: string
  readonly preferredSeriesVersion?: '1' | '2' | '3'
  /** Native-only complete, validated window projection (All or an ordinary chart window); not wire pagination. */
  readAllSeriesV3?(
    request: Extract<MarketSectorIndexRequestV3, { kind: 'SERIES' }>, options?: MarketSectorIndexReadOptions,
  ): Promise<MarketSectorIndexTransportResponse>
  read(
    request: MarketSectorIndexDecodeRequest,
    options?: MarketSectorIndexReadOptions,
  ): Promise<MarketSectorIndexTransportResponse>
  readSeriesPage?(
    request: Extract<MarketSectorIndexDecodeRequest, { kind: 'SERIES' }>,
    selectedVersion: MarketSectorIndexLegacyApiVersion | null,
    options?: MarketSectorIndexReadOptions,
  ): Promise<MarketSectorIndexVersionedTransportResponse>
  readDirectoryV3?(
    request: MarketSectorIndexRequestV3,
    options?: MarketSectorIndexReadOptions,
  ): Promise<MarketSectorIndexTransportResponse>
  /** Native only: whether the CURRENT answer the source still holds, on its own original
   * clock, is the matching release. Never reads and never renews that clock. */
  isNativeCurrentFresh?(matches: (release: MarketSectorIndexDirectoryReleaseV3) => boolean): boolean
  /** Native only: the E second curve, or null when it is hidden, unset or not published. */
  readNativeSecondarySeries?(
    request: NativeSecondarySeriesRequest, options?: MarketSectorIndexReadOptions,
  ): Promise<NativeSecondarySeries | null>
  /** Native only: every CURRENT answer the source obtains or reuses, from any read. */
  observeNativeCurrent?(listener: (release: MarketSectorIndexDirectoryReleaseV3) => void): () => void
}

const SHA256 = /^[0-9a-f]{64}$/u
const DAY = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u
const DAY_MS = 86_400_000
export const MARKET_SECTOR_INDEX_PAGE_LIMIT = 128
export const ACTIVE_DIRECTORY_TTL_MS = 30_000
const MAX_V3_CACHE_ENTRIES = 64

/** The native publication this API last confirmed as CURRENT (publication and data day). Every
 * surface reading the API shows that one, so HOME modules and MARKET never mix two days. */
export type NativePublicationGeneration = Readonly<{
  current: () => string | null
  subscribe: (listener: () => void) => () => void
}>

export function nativeGenerationOf(release: MarketSectorIndexDirectoryReleaseV3): string {
  return `${release.publication_id}|${release.history_end}`
}

type V3SeriesResult = MarketSectorIndexSeriesV3 | MarketSectorIndexDirectoryErrorV3
type V3ScopeDirectory = Readonly<{
  release: MarketSectorIndexDirectoryReleaseV3
  scopes: readonly MarketSectorIndexScopeV3[]
}>
type SharedInflight<T> = {
  readonly controller: AbortController
  readonly promise: Promise<T>
  subscribers: number
  settled: boolean
}

function rememberBounded<K, V>(cache: Map<K, V>, key: K, value: V): void {
  cache.delete(key)
  cache.set(key, value)
  while (cache.size > MAX_V3_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value as K | undefined
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

function awaitShared<T>(
  entry: SharedInflight<T>,
  signal: AbortSignal | undefined,
  onUnused: () => void,
): Promise<T> {
  signal?.throwIfAborted()
  return new Promise<T>((resolve, reject) => {
    entry.subscribers += 1
    let released = false
    const release = () => {
      if (released) return
      released = true
      entry.subscribers -= 1
      if (!entry.settled && entry.subscribers === 0) {
        onUnused()
        entry.controller.abort(new DOMException('No active subscribers', 'AbortError'))
      }
    }
    const cleanup = () => signal?.removeEventListener('abort', onAbort)
    const onAbort = () => {
      cleanup()
      release()
      reject(signal?.reason ?? new DOMException('The operation was aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    if (signal?.aborted) { onAbort(); return }
    entry.promise.then(
      (value) => { cleanup(); release(); resolve(value) },
      (error) => { cleanup(); release(); reject(error) },
    )
  })
}

function validDay(value: string | null): boolean {
  if (value === null) return true
  if (!DAY.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function assertRequest(request: MarketSectorIndexDecodeRequest): void {
  if (request.kind === 'DIRECTORY') {
    if (Object.keys(request.query).join('') !== 'publication_id') throw new TypeError('invalid index directory query')
  } else {
    if (Object.keys(request.query).sort().join(',') !== 'after_date,from_date,limit,publication_id,scope_token,to_date') {
      throw new TypeError('invalid index series query')
    }
    const query = request.query
    if (!SHA256.test(query.scope_token) || !validDay(query.from_date) || !validDay(query.to_date) || !validDay(query.after_date)) {
      throw new TypeError('invalid index series identity or date')
    }
    if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 512) {
      throw new TypeError('invalid index series limit')
    }
    if (query.from_date !== null && query.to_date !== null && query.from_date > query.to_date) {
      throw new TypeError('invalid index series range')
    }
  }
  if (request.query.publication_id !== null && !SHA256.test(request.query.publication_id)) {
    throw new TypeError('invalid index publication id')
  }
}

function assertSeriesV3PagesRequest(
  query: Extract<MarketSectorIndexRequestV3, { kind: 'SERIES' }>['query'],
  pageLimit: number,
): void {
  if (
    Object.keys(query).sort().join(',') !== 'after_date,from_date,limit,publication_id,scope_token,to_date' ||
    !SHA256.test(query.scope_token) ||
    (query.publication_id !== null && !SHA256.test(query.publication_id)) ||
    !validDay(query.from_date) || !validDay(query.to_date) || !validDay(query.after_date) ||
    (query.from_date !== null && query.to_date !== null && query.from_date > query.to_date) ||
    !Number.isInteger(query.limit) || query.limit < 1 || query.limit > 512 ||
    !Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > MARKET_SECTOR_INDEX_PAGE_LIMIT
  ) throw new TypeError('invalid V3 series request')
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function assertPageBoundary(previous: MarketSectorIndexPoint, current: MarketSectorIndexPoint): void {
  const previousDay = Date.parse(`${previous.date}T00:00:00.000Z`)
  const currentDay = Date.parse(`${current.date}T00:00:00.000Z`)
  if (!Number.isFinite(previousDay) || !Number.isFinite(currentDay) || currentDay <= previousDay) {
    throw new MarketSectorIndexValidationError()
  }
  if (!current.connect_to_previous) return
  if (
    currentDay - previousDay !== DAY_MS ||
    current.segment_id === null ||
    current.segment_id !== previous.segment_id ||
    (!current.native_cny && current.availability !== previous.availability) ||
    current.index.period_return === null
  ) throw new MarketSectorIndexValidationError()
}

export class MarketSectorIndexPublicApi {
  private readonly v3GroupDirectoryCache = new Map<string, Readonly<{
    loadedAt: number
    document: MarketSectorIndexGroupDirectoryV3
  }>>()
  private readonly v3GroupDirectoryInflight = new Map<string, SharedInflight<MarketSectorIndexGroupDirectoryV3 | null>>()
  private readonly v3ScopeDirectoryCache = new Map<string, V3ScopeDirectory>()
  private readonly v3ScopeDirectoryInflight = new Map<string, SharedInflight<V3ScopeDirectory>>()
  private readonly v3SeriesCache = new Map<string, MarketSectorIndexSeriesV3>()
  private readonly v3SeriesInflight = new Map<string, SharedInflight<V3SeriesResult>>()
  private nativeAccepted: Readonly<{ key: string; order: number }> | null = null
  private nativeReadOrder = 0
  private readonly nativeListeners = new Set<() => void>()
  private readonly nativeGenerationStore: NativePublicationGeneration = Object.freeze({
    current: () => this.nativeAccepted?.key ?? null,
    subscribe: (listener: () => void) => {
      this.nativeListeners.add(listener)
      return () => { this.nativeListeners.delete(listener) }
    },
  })

  constructor(private readonly gateway: MarketSectorIndexPublicGateway) {
    if (!gateway || typeof gateway.read !== 'function') throw new TypeError('MarketSectorIndexPublicApi requires a gateway')
    // A read pinned to a publication that finds CURRENT has moved moves the page too.
    gateway.observeNativeCurrent?.((release) => this.acceptNativeKey(nativeGenerationOf(release), ++this.nativeReadOrder))
  }

  /** `null` on the legacy source, which keeps its own directory cache. */
  get nativePublication(): NativePublicationGeneration | null {
    return this.gateway.kind === 'NATIVE_CNY_MARKET_INDEX' ? this.nativeGenerationStore : null
  }

  /** CURRENT reads are accepted in the order they started, so a slow earlier answer never
   * moves the page back to a publication a later read has already replaced. */
  private acceptNative(document: MarketSectorIndexGroupDirectoryV3, order: number): void {
    this.acceptNativeKey(nativeGenerationOf(document.release), order)
  }

  private acceptNativeKey(key: string, order: number): void {
    const accepted = this.nativeAccepted
    if (accepted !== null && order < accepted.order) return
    this.nativeAccepted = Object.freeze({ key, order })
    if (accepted?.key !== key) for (const listener of [...this.nativeListeners]) listener()
  }

  private async receive(
    request: MarketSectorIndexDecodeRequest,
    options: MarketSectorIndexReadOptions,
  ): Promise<MarketSectorIndexDocument> {
    options.signal?.throwIfAborted()
    assertRequest(request)
    const protectedRequest = deepFreeze(structuredClone(request)) as MarketSectorIndexDecodeRequest
    const response = await this.gateway.read(protectedRequest, options)
    options.signal?.throwIfAborted()
    const native = nativeMarketProjection('index', response.payload, protectedRequest)
    if (native !== null) return native
    const document = decodeMarketSectorIndexDocument(response.payload, protectedRequest, response.httpStatus)
    if (!isDecodedMarketSectorIndexDocument(document)) throw new TypeError('index decoder returned an unsealed document')
    return document
  }

  async directory(
    query: MarketSectorIndexDirectoryQuery,
    options: MarketSectorIndexReadOptions = {},
  ): Promise<MarketSectorIndexDocument> {
    return await this.receive({ kind: 'DIRECTORY', query }, options)
  }

  async series(
    query: MarketSectorIndexSeriesQuery,
    options: MarketSectorIndexReadOptions = {},
  ): Promise<MarketSectorIndexDocument> {
    return await this.receive({ kind: 'SERIES', query }, options)
  }

  private async receiveSeriesPage(
    request: Extract<MarketSectorIndexDecodeRequest, { kind: 'SERIES' }>,
    selectedVersion: MarketSectorIndexLegacyApiVersion | null,
    options: MarketSectorIndexReadOptions,
  ): Promise<Readonly<{
    document: MarketSectorIndexDocument
    apiVersion: MarketSectorIndexLegacyApiVersion | null
  }>> {
    if (this.gateway.readSeriesPage === undefined) {
      return Object.freeze({ document: await this.receive(request, options), apiVersion: null })
    }
    options.signal?.throwIfAborted()
    assertRequest(request)
    const protectedRequest = deepFreeze(structuredClone(request)) as Extract<MarketSectorIndexDecodeRequest, { kind: 'SERIES' }>
    const response = await this.gateway.readSeriesPage(protectedRequest, selectedVersion, options)
    options.signal?.throwIfAborted()
    const document = decodeMarketSectorIndexDocument(response.payload, protectedRequest, response.httpStatus)
    if (!isDecodedMarketSectorIndexDocument(document)) throw new TypeError('index decoder returned an unsealed document')
    if (document.response_kind !== 'ERROR' && document.contract_version !== response.apiVersion) {
      throw new MarketSectorIndexValidationError()
    }
    return Object.freeze({ document, apiVersion: response.apiVersion })
  }

  async seriesPages(
    query: MarketSectorIndexSeriesQuery,
    options: MarketSectorIndexReadOptions = {},
    pageLimit = MARKET_SECTOR_INDEX_PAGE_LIMIT,
  ): Promise<MarketSectorIndexDocument> {
    if (!Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > MARKET_SECTOR_INDEX_PAGE_LIMIT) {
      throw new TypeError('invalid index page limit')
    }
    assertRequest({ kind: 'SERIES', query })
    const points: MarketSectorIndexPoint[] = []
    let cursor = query.after_date
    let pinnedPublication = query.publication_id
    let pinnedApiVersion: MarketSectorIndexLegacyApiVersion | null = null
    let first: MarketSectorIndexSeries | null = null
    const finish = (series: MarketSectorIndexSeries): MarketSectorIndexSeries => deepFreeze({
      ...series,
      query: {
        from_date: query.from_date,
        to_date: query.to_date,
        after_date: query.after_date,
        limit: query.limit,
        next_after_date: null,
      },
      points,
    } satisfies MarketSectorIndexSeries)

    while (points.length < query.limit) {
      const remaining = query.limit - points.length
      const received = await this.receiveSeriesPage({ kind: 'SERIES', query: {
        ...query,
        publication_id: pinnedPublication,
        after_date: cursor,
        limit: Math.min(pageLimit, remaining),
      } }, pinnedApiVersion, options)
      const page = received.document
      if (page.response_kind === 'ERROR') return page
      if (page.response_kind !== 'INDEX_SERIES') throw new MarketSectorIndexValidationError()

      if (first === null) {
        first = page
        pinnedPublication = page.release.publication_id
        pinnedApiVersion = received.apiVersion ?? page.contract_version
      } else if (
        (received.apiVersion !== null && received.apiVersion !== pinnedApiVersion) ||
        page.contract_version !== first.contract_version ||
        !sameJson(page.release, first.release) ||
        !sameJson(page.scope, first.scope)
      ) {
        throw new MarketSectorIndexValidationError()
      }

      const boundaryPrevious = points.at(-1)
      const boundaryCurrent = page.points[0]
      if (boundaryPrevious !== undefined && boundaryCurrent !== undefined) {
        assertPageBoundary(boundaryPrevious, boundaryCurrent)
      }
      points.push(...page.points)

      const next = page.query.next_after_date
      if (next === null) return finish(first ?? page)
      if (page.points.length === 0 || next === cursor) throw new MarketSectorIndexValidationError()
      cursor = next
    }

    // The requested window can fill a page while a short measured tail remains.
    // One extra completing page keeps the latest point; a still-open cursor means
    // the remaining history is too long to treat as a tail.
    const tail = await this.series({
      ...query,
      publication_id: pinnedPublication,
      after_date: cursor,
      limit: pageLimit,
    }, options)
    if (tail.response_kind === 'ERROR') return tail
    if (tail.response_kind !== 'INDEX_SERIES' || first === null) throw new MarketSectorIndexValidationError()
    if (
      tail.contract_version !== first.contract_version ||
      !sameJson(tail.release, first.release) ||
      !sameJson(tail.scope, first.scope) ||
      tail.query.next_after_date !== null
    ) {
      throw new MarketSectorIndexValidationError()
    }
    const boundaryPrevious = points.at(-1)
    const boundaryCurrent = tail.points[0]
    if (boundaryPrevious !== undefined && boundaryCurrent !== undefined) {
      assertPageBoundary(boundaryPrevious, boundaryCurrent)
    }
    points.push(...tail.points)
    return finish(first)
  }

  private async receiveDirectoryV3(
    request: MarketSectorIndexRequestV3,
    options: MarketSectorIndexReadOptions,
    all = false,
  ) {
    if (this.gateway.readDirectoryV3 === undefined) return null
    options.signal?.throwIfAborted()
    const protectedRequest = deepFreeze(structuredClone(request)) as MarketSectorIndexRequestV3
    const response = all && protectedRequest.kind === 'SERIES' && this.gateway.readAllSeriesV3
      ? await this.gateway.readAllSeriesV3(protectedRequest, options)
      : await this.gateway.readDirectoryV3(protectedRequest, options)
    options.signal?.throwIfAborted()
    const native = nativeMarketProjection('indexV3', response.payload, protectedRequest)
    if (native !== null) return native
    const document = decodeMarketSectorIndexDirectoryV3(response.payload, protectedRequest, response.httpStatus)
    if (!isDecodedMarketSectorIndexDirectoryV3(document)) throw new TypeError('V3 directory decoder returned an unsealed document')
    return document
  }

  async seriesV3Pages(
    query: Extract<MarketSectorIndexRequestV3, { kind: 'SERIES' }>['query'],
    options: MarketSectorIndexReadOptions = {},
    pageLimit = MARKET_SECTOR_INDEX_PAGE_LIMIT,
  ): Promise<V3SeriesResult> {
    options.signal?.throwIfAborted()
    assertSeriesV3PagesRequest(query, pageLimit)
    if (this.gateway.kind === 'NATIVE_CNY_MARKET_INDEX') {
      // Native history has no cursor: every legacy page re-read the complete window.
      // Read it once as a complete projection; cursor continuation keeps the page path.
      if (query.after_date === null && this.gateway.readAllSeriesV3) return this.completeNativeSeriesV3(query, options)
      return this.loadSeriesV3Pages(query, options, pageLimit)
    }
    const cacheKey = JSON.stringify([
      query.publication_id,
      query.scope_token,
      query.from_date,
      query.to_date,
      query.after_date,
      query.limit,
      pageLimit,
    ])
    if (query.publication_id !== null) {
      const cached = this.v3SeriesCache.get(cacheKey)
      if (cached !== undefined) return cached
    }
    let pending = this.v3SeriesInflight.get(cacheKey)
    if (pending === undefined) {
      const controller = new AbortController()
      const entry = {} as SharedInflight<V3SeriesResult>
      const promise = this.loadSeriesV3Pages(query, { signal: controller.signal, priority: options.priority }, pageLimit).then((document) => {
        if (query.publication_id !== null && document.response_kind === 'INDEX_SERIES') {
          rememberBounded(this.v3SeriesCache, cacheKey, document)
        }
        return document
      })
      Object.assign(entry, { controller, promise, subscribers: 0, settled: false })
      pending = entry
      this.v3SeriesInflight.set(cacheKey, entry)
      void promise.finally(() => {
        entry.settled = true
        if (this.v3SeriesInflight.get(cacheKey) === entry) this.v3SeriesInflight.delete(cacheKey)
      }).catch(() => undefined)
    }
    return await awaitShared(pending, options.signal, () => {
      if (this.v3SeriesInflight.get(cacheKey) === pending) this.v3SeriesInflight.delete(cacheKey)
    })
  }

  async allNativeSeriesV3(
    query: Extract<MarketSectorIndexRequestV3, { kind: 'SERIES' }>['query'],
    options: MarketSectorIndexReadOptions = {},
  ): Promise<V3SeriesResult> {
    return this.completeNativeSeriesV3(query, options)
  }

  /** One validated complete-window read; the gateway bounds the window (All or <= 366 days). */
  private async completeNativeSeriesV3(
    query: Extract<MarketSectorIndexRequestV3, { kind: 'SERIES' }>['query'],
    options: MarketSectorIndexReadOptions,
  ): Promise<V3SeriesResult> {
    assertSeriesV3PagesRequest(query, MARKET_SECTOR_INDEX_PAGE_LIMIT)
    if (this.gateway.kind !== 'NATIVE_CNY_MARKET_INDEX' || !this.gateway.readAllSeriesV3) throw new TypeError('All requires native history')
    const document = await this.receiveDirectoryV3({ kind: 'SERIES', query }, options, true)
    if (document === null || (document.response_kind !== 'INDEX_SERIES' && document.response_kind !== 'ERROR')) throw new MarketSectorIndexValidationError()
    return document
  }

  private async loadSeriesV3Pages(
    query: Extract<MarketSectorIndexRequestV3, { kind: 'SERIES' }>['query'],
    options: MarketSectorIndexReadOptions = {},
    pageLimit = MARKET_SECTOR_INDEX_PAGE_LIMIT,
  ): Promise<MarketSectorIndexSeriesV3 | MarketSectorIndexDirectoryErrorV3> {
    assertSeriesV3PagesRequest(query, pageLimit)
    const points: MarketSectorIndexPoint[] = []
    let cursor = query.after_date
    let pinnedPublication = query.publication_id
    let first: MarketSectorIndexSeriesV3 | null = null

    while (points.length < query.limit) {
      const document = await this.receiveDirectoryV3({
        kind: 'SERIES',
        query: {
          ...query,
          publication_id: pinnedPublication,
          after_date: cursor,
          limit: Math.min(pageLimit, query.limit - points.length),
        },
      }, options)
      if (document === null) throw new MarketSectorIndexValidationError()
      if (document.response_kind === 'ERROR') return document
      if (document.response_kind !== 'INDEX_SERIES') throw new MarketSectorIndexValidationError()
      if (first === null) {
        first = document
        pinnedPublication = document.release.publication_id
      } else if (!sameJson(first.release, document.release) || !sameJson(first.scope, document.scope)) {
        throw new MarketSectorIndexValidationError()
      }
      const previous = points.at(-1)
      const current = document.points[0]
      if (previous !== undefined && current !== undefined) assertPageBoundary(previous, current)
      points.push(...document.points)
      const next = document.series_query.next_after_date
      if (next === null) {
        if (first === null) throw new MarketSectorIndexValidationError()
        return deepFreeze({
          ...first,
          series_query: {
            from_date: query.from_date,
            to_date: query.to_date,
            after_date: query.after_date,
            limit: query.limit,
            next_after_date: null,
          },
          points,
        })
      }
      if (document.points.length === 0 || next === cursor) throw new MarketSectorIndexValidationError()
      cursor = next
    }

    // A requested chart window includes its opening anchor. It can therefore
    // fill the numeric point limit while a short, bounded tail (normally the
    // latest measured day) is still available. Read exactly one completing
    // page and reject anything that would require an unbounded continuation.
    const tail = await this.receiveDirectoryV3({
      kind: 'SERIES',
      query: {
        ...query,
        publication_id: pinnedPublication,
        after_date: cursor,
        limit: pageLimit,
      },
    }, options)
    if (tail === null) throw new MarketSectorIndexValidationError()
    if (tail.response_kind === 'ERROR') return tail
    if (tail.response_kind !== 'INDEX_SERIES' || first === null) throw new MarketSectorIndexValidationError()
    if (
      !sameJson(first.release, tail.release) ||
      !sameJson(first.scope, tail.scope) ||
      tail.series_query.next_after_date !== null
    ) {
      throw new MarketSectorIndexValidationError()
    }
    const previous = points.at(-1)
    const current = tail.points[0]
    if (previous !== undefined && current !== undefined) assertPageBoundary(previous, current)
    points.push(...tail.points)
    return deepFreeze({
      ...first,
      series_query: {
        from_date: query.from_date,
        to_date: query.to_date,
        after_date: query.after_date,
        limit: query.limit,
        next_after_date: null,
      },
      points,
    })
  }

  /** Prepared HOME handoff must use the original cache clock, not a new TTL. */
  isActiveDirectoryFresh(document: MarketSectorIndexGroupDirectoryV3): boolean {
    if (this.gateway.kind === 'NATIVE_CNY_MARKET_INDEX') {
      // Native keeps no directory cache: fresh means this is the accepted publication and the
      // CURRENT answer the source still holds, on its original clock, is that same one. A
      // later reuse of the directory never renews the clock.
      const key = nativeGenerationOf(document.release)
      if (this.nativeAccepted?.key !== key) return false
      return this.gateway.isNativeCurrentFresh?.((release) => nativeGenerationOf(release) === key) === true
    }
    const cached = this.v3GroupDirectoryCache.get('ACTIVE')
    if (cached === undefined || cached.document !== document) return false
    const age = Date.now() - cached.loadedAt
    return age >= 0 && age < ACTIVE_DIRECTORY_TTL_MS
  }

  async directoryV3Groups(
    publicationId: string | null,
    options: MarketSectorIndexReadOptions = {},
  ): Promise<MarketSectorIndexGroupDirectoryV3 | null> {
    if (publicationId !== null && !SHA256.test(publicationId)) throw new TypeError('invalid V3 directory publication')
    options.signal?.throwIfAborted()
    if (this.gateway.kind === 'NATIVE_CNY_MARKET_INDEX') {
      const order = ++this.nativeReadOrder
      const document = await this.loadDirectoryV3Groups(publicationId, options)
      // Only CURRENT moves the page; a read pinned to a publication never does.
      if (publicationId === null && document !== null && document.release.native_cny) this.acceptNative(document, order)
      return document
    }
    const cacheKey = publicationId ?? 'ACTIVE'
    const cached = this.v3GroupDirectoryCache.get(cacheKey)
    if (cached !== undefined && (publicationId !== null || this.isActiveDirectoryFresh(cached.document))) {
      return cached.document
    }
    let pending = this.v3GroupDirectoryInflight.get(cacheKey)
    if (pending === undefined) {
      const controller = new AbortController()
      const entry = {} as SharedInflight<MarketSectorIndexGroupDirectoryV3 | null>
      const promise = this.loadDirectoryV3Groups(publicationId, { signal: controller.signal, priority: options.priority }).then((document) => {
        if (document !== null) {
          const loadedAt = Date.now()
          rememberBounded(this.v3GroupDirectoryCache, cacheKey, Object.freeze({ loadedAt, document }))
          rememberBounded(
            this.v3GroupDirectoryCache,
            document.release.publication_id,
            Object.freeze({ loadedAt, document }),
          )
        }
        return document
      })
      Object.assign(entry, { controller, promise, subscribers: 0, settled: false })
      pending = entry
      this.v3GroupDirectoryInflight.set(cacheKey, entry)
      void promise.finally(() => {
        entry.settled = true
        if (this.v3GroupDirectoryInflight.get(cacheKey) === entry) this.v3GroupDirectoryInflight.delete(cacheKey)
      }).catch(() => undefined)
    }
    return await awaitShared(pending, options.signal, () => {
      if (this.v3GroupDirectoryInflight.get(cacheKey) === pending) this.v3GroupDirectoryInflight.delete(cacheKey)
    })
  }

  private async loadDirectoryV3Groups(
    publicationId: string | null,
    options: MarketSectorIndexReadOptions = {},
  ): Promise<MarketSectorIndexGroupDirectoryV3 | null> {
    if (publicationId !== null && !SHA256.test(publicationId)) throw new TypeError('invalid V3 directory publication')
    const document = await this.receiveDirectoryV3({
      kind: 'GROUPS', query: { publication_id: publicationId },
    }, options)
    if (document === null) return null
    if (document.response_kind === 'ERROR') {
      if (this.gateway.kind === 'NATIVE_CNY_MARKET_INDEX') throw new MarketSectorIndexDirectoryV3ResponseError(document.error.code, false)
      if (document.error.code === 'NOT_PUBLISHED' || document.error.code === 'NOT_FOUND') return null
      throw new MarketSectorIndexDirectoryV3ResponseError(document.error.code, document.error.retryable)
    }
    if (document.response_kind !== 'SCOPE_GROUP_DIRECTORY') throw new MarketSectorIndexValidationError()
    return document
  }

  async directoryV3ScopePages(
    group: MarketSectorIndexGroupCode,
    publicationId: string,
    options: MarketSectorIndexReadOptions = {},
    pageLimit = 32,
  ): Promise<V3ScopeDirectory> {
    if (!SHA256.test(publicationId) || !Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 64) {
      throw new TypeError('invalid V3 scope page request')
    }
    options.signal?.throwIfAborted()
    if (this.gateway.kind === 'NATIVE_CNY_MARKET_INDEX') return this.loadDirectoryV3ScopePages(group, publicationId, options, pageLimit)
    const cacheKey = JSON.stringify([publicationId, group, pageLimit])
    const cached = this.v3ScopeDirectoryCache.get(cacheKey)
    if (cached !== undefined) return cached
    let pending = this.v3ScopeDirectoryInflight.get(cacheKey)
    if (pending === undefined) {
      const controller = new AbortController()
      const entry = {} as SharedInflight<V3ScopeDirectory>
      const promise = this.loadDirectoryV3ScopePages(group, publicationId, { signal: controller.signal, priority: options.priority }, pageLimit).then((document) => {
        rememberBounded(this.v3ScopeDirectoryCache, cacheKey, document)
        return document
      })
      Object.assign(entry, { controller, promise, subscribers: 0, settled: false })
      pending = entry
      this.v3ScopeDirectoryInflight.set(cacheKey, entry)
      void promise.finally(() => {
        entry.settled = true
        if (this.v3ScopeDirectoryInflight.get(cacheKey) === entry) this.v3ScopeDirectoryInflight.delete(cacheKey)
      }).catch(() => undefined)
    }
    return await awaitShared(pending, options.signal, () => {
      if (this.v3ScopeDirectoryInflight.get(cacheKey) === pending) this.v3ScopeDirectoryInflight.delete(cacheKey)
    })
  }

  private async loadDirectoryV3ScopePages(
    group: MarketSectorIndexGroupCode,
    publicationId: string,
    options: MarketSectorIndexReadOptions = {},
    pageLimit = 32,
  ): Promise<Readonly<{ release: MarketSectorIndexDirectoryReleaseV3; scopes: readonly MarketSectorIndexScopeV3[] }>> {
    if (!SHA256.test(publicationId) || !Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 64) {
      throw new TypeError('invalid V3 scope page request')
    }
    const scopes: MarketSectorIndexScopeV3[] = []
    let after: string | null = null
    let release: MarketSectorIndexDirectoryReleaseV3 | null = null
    do {
      const document = await this.receiveDirectoryV3({
        kind: 'SCOPES',
        query: { publication_id: publicationId, group, after, limit: pageLimit },
      }, options)
      if (document === null) throw new MarketSectorIndexValidationError()
      if (document.response_kind === 'ERROR') {
        throw new MarketSectorIndexDirectoryV3ResponseError(document.error.code, document.error.retryable)
      }
      if (document.response_kind !== 'SCOPE_PAGE') throw new MarketSectorIndexValidationError()
      if (release === null) release = document.release
      else if (!sameJson(release, document.release)) throw new MarketSectorIndexValidationError()
      const previousCount = scopes.length
      scopes.push(...document.scopes)
      if (scopes.length > 1000 || new Set(scopes.map((scope) => scope.scope_token)).size !== scopes.length) {
        throw new MarketSectorIndexValidationError()
      }
      after = document.query.next_after
      if (after !== null && scopes.length === previousCount) throw new MarketSectorIndexValidationError()
    } while (after !== null)
    if (release === null) throw new MarketSectorIndexValidationError()
    return deepFreeze({ release, scopes })
  }
}
