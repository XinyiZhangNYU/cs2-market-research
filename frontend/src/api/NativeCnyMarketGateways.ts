import { SharedRead } from '../performance/sharedRead'
import { NativeCnyAllHistory, NATIVE_CNY_ALL_START } from './nativeCnyAllHistory'
import { nativeCnyECurveSpec } from './nativeCnyECurveConfig'
import { nativeCnyIndexView } from '../adapter/nativeCnyIndexViewModel'
import { canonicalHash } from '../wire/canonical'
import { marketScopeToken } from '../watchlist/marketScopeToken'
import { decodeMarketSectorIndexDirectoryV3 } from '../wire/marketSectorIndexPublicApiV3Decode'
import { HttpMarketSectorIndexPublicGateway } from './HttpMarketSectorIndexPublicGateway'
import { HttpNativeCnyIndexPublicGateway } from './HttpNativeCnyIndexPublicGateway'
import type { MarketDescriptivePublicGateway, MarketDescriptiveReadOptions } from './MarketDescriptivePublicApi'
import type {
  MarketSectorIndexPublicGateway, MarketSectorIndexReadOptions, NativeSecondarySeries, NativeSecondarySeriesRequest,
} from './MarketSectorIndexPublicApi'
import type { MarketDescriptiveDecodeRequest } from '../wire/marketDescriptivePublicApiDecode'
import type { MarketSectorIndexDecodeRequest } from '../wire/marketSectorIndexPublicApiDecode'
import type { MarketDescriptiveDocument, MarketDescriptiveScope, MarketDescriptiveSuccess } from '../wire/marketDescriptivePublicApiTypes'
import type { MarketSectorIndexDocument, MarketSectorIndexPoint } from '../wire/marketSectorIndexPublicApiTypes'
import type {
  MarketSectorIndexDirectoryDocumentV3, MarketSectorIndexDirectoryReleaseV3,
  MarketSectorIndexGroupCode, MarketSectorIndexRequestV3, MarketSectorIndexScopeV3,
} from '../wire/marketSectorIndexPublicApiV3Types'
import { isNativeCnyAdjacentReturnState, NATIVE_CNY_INDEX_METHOD_E } from '../wire/nativeCnyIndexPublicApi'
import type { NativeCnyIndexMethod, NativeCnyIndexPublicDay, NativeCnyIndexPublicHistory, NativeCnyIndexPublicPoint, NativeCnyIndexRequest, NativeCnyIndexReadResult } from '../wire/nativeCnyIndexPublicApi'

/** Explicit, conservative mapping: both price and return quality must qualify.
 * A missing/low/unavailable dimension never silently becomes HIGH. */
export const NATIVE_CNY_COVERAGE_TABLE = Object.freeze({
  HIGH:    { HIGH: 'HIGH', PARTIAL: 'PARTIAL', LOW: 'DETAIL_ONLY', UNAVAILABLE: 'DETAIL_ONLY' },
  PARTIAL: { HIGH: 'PARTIAL', PARTIAL: 'PARTIAL', LOW: 'DETAIL_ONLY', UNAVAILABLE: 'DETAIL_ONLY' },
  LOW:     { HIGH: 'DETAIL_ONLY', PARTIAL: 'DETAIL_ONLY', LOW: 'DETAIL_ONLY', UNAVAILABLE: 'DETAIL_ONLY' },
  UNAVAILABLE: { HIGH: 'DETAIL_ONLY', PARTIAL: 'DETAIL_ONLY', LOW: 'DETAIL_ONLY', UNAVAILABLE: 'DETAIL_ONLY' },
} as const)
export const NATIVE_CNY_STATE_TABLE = Object.freeze({
  ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN: 'QUALITY_TABLE',
  ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN: 'QUALITY_TABLE',
  NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN: 'DETAIL_ONLY',
  BELOW_MINIMUM_INTERPRETABLE_COVERAGE: 'DETAIL_ONLY',
  HISTORY_SCOPE_UNRESOLVED_ORIGINS: 'DETAIL_ONLY',
} as const)

export function nativeCoverage(point: NativeCnyIndexPublicPoint): MarketDescriptiveScope['coverage_grade'] {
  return NATIVE_CNY_STATE_TABLE[point.state] === 'QUALITY_TABLE'
    ? NATIVE_CNY_COVERAGE_TABLE[point.price_quality]?.[point.return_quality] ?? 'DETAIL_ONLY'
    : 'DETAIL_ONLY'
}

const GROUPS = ['MARKET', 'SECTORS', 'CASES', 'WEAPON_MODELS', 'KNIFE_MODELS', 'GLOVE_MODELS',
  'COLLECTIONS', 'ARMORY_RELEASES', 'DOPPLER'] as const
const CHILD_ROOT: Readonly<Record<string, readonly [MarketSectorIndexGroupCode, string]>> = {
  CASE: ['CASES', 'CASE'], WEAPON_MODEL: ['WEAPON_MODELS', 'WEAPON'],
  KNIFE_MODEL: ['KNIFE_MODELS', 'KNIFE'], GLOVE_MODEL: ['GLOVE_MODELS', 'GLOVE'],
  COLLECTION: ['COLLECTIONS', 'COLLECTION'], ARMORY_RELEASE: ['ARMORY_RELEASES', 'ARMORY'],
  DOPPLER: ['DOPPLER', 'KNIFE'],
}
type Labels = Readonly<{ en: string; zh_cn: string }>
type Names = ReadonlyMap<string, Labels>
const noNames: Names = new Map()
const dayMs = 86_400_000
const dayDistance = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / dayMs)
/** 1Y spans 366 days back from its end (367 calendar days including the opening anchor). */
const MAX_COMPLETE_WINDOW_SPAN = 366
const shiftDay = (day: string, by: number) => new Date(Date.parse(`${day}T00:00:00Z`) + by * dayMs).toISOString().slice(0, 10)
const indexToken = (code: string) => canonicalHash({ contract: 'market-sector-index-public-api', scope_code: code })

export function nativeScopePosition(code: string) {
  const child = code.includes(':') ? CHILD_ROOT[code.split(':')[0]!] : undefined
  return {
    scope_kind: code === 'ALL' ? 'MARKET' as const : code.includes(':') ? 'SUBSECTOR' as const : 'SECTOR' as const,
    // Unknown subscopes remain reachable in SECTORS, under their literal code.
    group_code: code === 'ALL' ? 'MARKET' as const : child?.[0] ?? 'SECTORS' as const,
    parent_scope_code: child?.[1] ?? (code === 'ALL' ? null : 'ALL'),
  }
}

function scopeView(point: NativeCnyIndexPublicPoint, names: Names): MarketSectorIndexScopeV3 {
  const code = point.scope_code, position = nativeScopePosition(code)
  return {
    ...position, scope_code: code, scope_token: indexToken(code),
    ancestor_scope_codes: position.parent_scope_code === null ? []
      : position.parent_scope_code === 'ALL' ? ['ALL'] : ['ALL', position.parent_scope_code],
    labels: names.get(code) ?? { en: code, zh_cn: code },
    series_source: 'NATIVE_CNY', price_history_eligibility: null,
    // The day endpoint says nothing about the first available historical date.
    // Consumers request their calendar window and learn bounds from history.
    first_available_date: null, last_available_date: null,
    current_member_count: point.expected_member_count,
    observed_price_member_count: point.absolute_price_qualified_member_count,
    origin_uncertainty_disclosed: point.state === 'HISTORY_SCOPE_UNRESOLVED_ORIGINS',
    low_member_count: null,
    linked_collection_scope_tokens: [],
  }
}

export function mapNativeDescriptiveScope(point: NativeCnyIndexPublicPoint, names: Names = noNames): MarketDescriptiveScope {
  const view = scopeView(point, names)
  return {
    scope_token: marketScopeToken(point.scope_code), scope_id: point.scope_code,
    scope_kind: view.scope_kind, parent_scope_id: view.parent_scope_code, ancestor_scope_ids: view.ancestor_scope_codes,
    labels: view.labels, fixed_member_count: point.expected_member_count, paired_member_count: point.paired_member_count,
    day_price_member_count: point.absolute_price_qualified_member_count,
    paired_coverage_ratio: null, day_price_coverage_ratio: null,
    coverage_grade: nativeCoverage(point), headline_eligible: point.period_return_display !== null,
    raw_return_ratio: null, suppressed_return_ratio: null,
    return_selected_for_display: point.period_return_display,
    return_method: null, missing_endpoint_count: null, source_set_break_count: null,
    single_source_pair_count: null, unmapped_member_count: null, other_unavailable_count: null,
    member_price_sum_cny: point.ask_sum_cny_display, member_price_mean_cny: null,
    price_basis: 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE',
  }
}

export function mapNativeIndexPoint(day: NativeCnyIndexPublicDay, previous?: NativeCnyIndexPublicDay): MarketSectorIndexPoint {
  const p = day.data.points[0]!, prior = previous?.data.points[0]
  const adjacent = previous !== undefined && shiftDay(previous.data.bucket_date, 1) === day.data.bucket_date
  const connect = adjacent && prior?.scope_code === p.scope_code && p.segment_number > 0 &&
    prior.segment_number === p.segment_number && prior.index_display !== null && p.index_display !== null &&
    p.period_return_display !== null && isNativeCnyAdjacentReturnState(p.state)
  const rank = { UNAVAILABLE: 0, LOW: 1, PARTIAL: 2, HIGH: 3 }
  const overall = p.state === 'HISTORY_SCOPE_UNRESOLVED_ORIGINS' || p.state === 'BELOW_MINIMUM_INTERPRETABLE_COVERAGE'
    ? 'UNAVAILABLE' : rank[p.price_quality] < rank[p.return_quality] ? p.price_quality : p.return_quality
  return {
    native_cny: true, point_id: `${day.publication_id}:${p.scope_code}`, date: day.data.bucket_date,
    segment_id: p.segment_number === 0 ? null : String(p.segment_number), connect_to_previous: connect,
    availability: day.data.availability === 'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND'
      ? 'RECONSTRUCTED_LATE_BOUND' : 'CONTEMPORANEOUSLY_MEASURED',
    index: { value: p.index_display,
      // No cross-gap or cross-segment return is displayed, even if a producer supplies one.
      period_return: !isNativeCnyAdjacentReturnState(p.state) ? null
        : previous === undefined ? p.period_return_display : connect ? p.period_return_display : null,
      raw_equal_return: null, robust_equal_return: null, effective_estimator: p.effective_estimator },
    absolute_price: { member_minimum_ask_sum_cny: p.ask_sum_cny_display, member_minimum_ask_median_cny: p.ask_median_cny_display,
      semantic: 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE' },
    coverage: { expected_member_count: p.expected_member_count, expected_member_count_upper_bound: null,
      paired_member_count: p.paired_member_count, qualified_member_count: p.qualified_member_count,
      absolute_price_qualified_member_count: p.absolute_price_qualified_member_count,
      coverage_ratio: null, coverage_ratio_lower_bound: null, absolute_price_coverage_ratio: null,
      absolute_price_coverage_ratio_lower_bound: null },
    quality: { overall, return: p.return_quality, price: p.price_quality, grade_counts: p.grade_counts,
      grade_d_share: null, anomaly_member_count: null, rejected_return_domain_count: p.rejected_return_domain_count,
      reason_codes: [p.state, ...p.warnings] },
    origin_uncertainty: { status: null, active_uncertain_origin_member_count: null, possible_unadmitted_member_count: null },
  }
}

function releaseView(day: NativeCnyIndexPublicDay): MarketSectorIndexDirectoryReleaseV3 {
  return {
    native_cny: true, native_method: day.data.method, publication_id: day.publication_id, published_at: day.released_at,
    manifest_sha256: null, rights_revision: null, withdrawn_at: null,
    directory_id: null, directory_sha256: null, directory_sealed_at: null, candidate_sha256: null,
    successor_delta_sha256: null, continuation_spec_sha256: null, history_start: null, history_end: day.data.bucket_date,
    measured_start: null, measured_end: null,
    availability_semantics: ['RECONSTRUCTED_LATE_BOUND', 'CONTEMPORANEOUSLY_MEASURED'],
  }
}

type ProjectionDocuments = { descriptive: MarketDescriptiveDocument; index: MarketSectorIndexDocument; indexV3: MarketSectorIndexDirectoryDocumentV3 }
// Not a second permissive wire decoder: only objects created by the validated
// native adapter can enter this presentation seam. Cloning/JSON cannot forge it.
const projections = new WeakMap<object, { surface: keyof ProjectionDocuments; request: string; document: ProjectionDocuments[keyof ProjectionDocuments] }>()
function project<K extends keyof ProjectionDocuments>(surface: K, request: unknown, document: ProjectionDocuments[K]) {
  const freeze = (value: unknown): void => {
    if (value !== null && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) }
  }
  freeze(document)
  const payload = Object.freeze({ nativeMarketProjection: surface })
  projections.set(payload, { surface, request: JSON.stringify(request), document })
  return { payload, httpStatus: 200 }
}
export function nativeMarketProjection<K extends keyof ProjectionDocuments>(surface: K, payload: unknown, request: unknown): ProjectionDocuments[K] | null {
  if (payload === null || typeof payload !== 'object') return null
  const entry = projections.get(payload)
  if (entry === undefined) return null
  if (entry.surface !== surface || entry.request !== JSON.stringify(request)) throw new TypeError('Native projection target mismatch')
  return entry.document as ProjectionDocuments[K]
}

type NativeReader = { read(request: NativeCnyIndexRequest, options?: { signal?: AbortSignal }): Promise<NativeCnyIndexReadResult> }
export class NativeCnyMarketSession {
  private readonly current = new SharedRead<NativeCnyIndexPublicDay>(1, 30_000)
  private readonly histories = new SharedRead<NativeCnyIndexReadResult>(64, 0)
  private readonly allHistories = new NativeCnyAllHistory()
  private readonly names = new SharedRead<Names>(9, 30_000)
  private readonly unresolved = new Set<string>()
  private readonly currentListeners = new Set<(day: NativeCnyIndexPublicDay) => void>()
  constructor(
    private readonly reader: NativeReader = new HttpNativeCnyIndexPublicGateway(),
    private readonly labelsGateway: MarketSectorIndexPublicGateway = new HttpMarketSectorIndexPublicGateway(),
  ) {}

  /** Whether the CURRENT answer still held, on its own original clock, satisfies `matches`. */
  hasFreshCurrent(matches: (day: NativeCnyIndexPublicDay) => boolean): boolean {
    return this.current.hasFreshValue('CURRENT', matches)
  }

  observeCurrent(listener: (day: NativeCnyIndexPublicDay) => void): () => void {
    this.currentListeners.add(listener)
    return () => { this.currentListeners.delete(listener) }
  }

  /** Receipt/diagnostic hook; no unknown name is invented. */
  unknownScopeCodes(): readonly string[] { return [...this.unresolved].sort() }

  async day(publication: string | null, signal?: AbortSignal): Promise<NativeCnyIndexPublicDay> {
    const day = await this.current.read('CURRENT', async (sharedSignal) => {
      const request = { kind: 'CURRENT' } as const
      const result = nativeCnyIndexView(await this.reader.read(request, { signal: sharedSignal }), request).result
      if (result.kind !== 'DAY') throw new Error(result.kind === 'ERROR' ? result.error : 'Invalid day')
      if (!result.day.data.points.some((point) => point.scope_code === 'ALL')) throw new Error('No market scope')
      return result.day
    }, () => true, signal, (confirmed) => {
      // Every newly confirmed CURRENT is announced, whichever read (pinned or not) found it,
      // and only once it is kept: a page that unmounts on the news then finds it cached.
      // Loads of this one key never overlap, so announcements arrive in load order.
      for (const listener of [...this.currentListeners]) listener(confirmed)
    })
    if (publication !== null && publication !== day.publication_id) throw new Error('NOT_PUBLISHED')
    return day
  }

  async scopeNames(points: readonly NativeCnyIndexPublicPoint[], signal?: AbortSignal): Promise<Names> {
    const result = new Map<string, Labels>()
    const groups = [...new Set(points.map((point) => nativeScopePosition(point.scope_code).group_code))]
    // Two label-only pages in flight; no points/price endpoint is requested.
    for (let i = 0; i < groups.length; i += 2) {
      await Promise.all(groups.slice(i, i + 2).map(async (group) => {
        try {
          const names = await this.names.read(group, async (sharedSignal) => {
            if (!this.labelsGateway.readDirectoryV3) return noNames
            const labels = new Map<string, Labels>()
            let after: string | null = null, publication: string | null = null
            for (let page = 0; page < 16; page += 1) {
              const request: MarketSectorIndexRequestV3 = { kind: 'SCOPES', query: { publication_id: publication, group, after, limit: 64 } }
              const response = await this.labelsGateway.readDirectoryV3(request, { signal: sharedSignal })
              const document = decodeMarketSectorIndexDirectoryV3(response.payload, request, response.httpStatus)
              if (document.response_kind !== 'SCOPE_PAGE') throw new Error('No scope labels')
              publication = document.release.publication_id
              for (const scope of document.scopes) labels.set(scope.scope_code, scope.labels)
              const next = document.query.next_after
              if (next === null) return labels
              if (next === after) throw new Error('Non-advancing name directory')
              after = next
            }
            throw new Error('Scope label directory exceeded bound')
          }, (names) => names.size > 0, signal)
          names.forEach((labels, code) => result.set(code, labels))
        } catch (error) {
          if (signal?.aborted) throw error
          // Names alone may fall back to scope_code, never values from the old source.
        }
      }))
    }
    for (const p of points) {
      if (!result.has(p.scope_code)) this.unresolved.add(p.scope_code)
      else this.unresolved.delete(p.scope_code)
    }
    return result
  }

  async history(day: NativeCnyIndexPublicDay, code: string, from: string, to: string, signal?: AbortSignal, allChunk = false) {
    const request = { kind: 'WINDOW', spec_sha256: day.data.spec_sha256, scope_code: code, start_date: from, end_date: to } as const
    const load = async (readSignal?: AbortSignal) =>
      nativeCnyIndexView(await this.reader.read(request, { signal: readSignal }), request).result
    // All already deduplicates the complete window. Bypass subscriber wrappers
    // so its global permit remains held until the actual transport settles.
    const result = allChunk ? await load(signal)
      : await this.histories.read(JSON.stringify(request), load, () => false, signal)
    if (result.kind !== 'HISTORY') throw new Error(result.kind === 'ERROR' ? result.error : 'Invalid history')
    // The selected spec is the selected day's method: no other method's rows stand in for it.
    if (!result.history.days.every((row) => row.data.method === day.data.method)) throw new Error('History method mismatch')
    // The current visible point must not silently change underneath this view.
    const tail = result.history.days.find((row) => row.data.bucket_date === day.data.bucket_date)
    if (tail !== undefined && tail.publication_id !== day.publication_id) throw new Error('Current/history publication mismatch')
    return result.history
  }

  allHistory(day: NativeCnyIndexPublicDay, code: string, signal?: AbortSignal) {
    return this.allHistories.read(day, code, (from, to, sharedSignal) => this.history(day, code, from, to, sharedSignal, true), signal)
  }

  /** A second curve read by its own fixed spec (E): history only, never /index/day and never
   * the selected release, so there is no current-publication check here. Every row must carry
   * `method`. A window with no row of the spec is NOT_PUBLISHED: null, not an error. */
  async specHistory(spec: string, method: NativeCnyIndexMethod, code: string, from: string, to: string,
    signal?: AbortSignal, allChunk = false): Promise<NativeCnyIndexPublicHistory | null> {
    const request = { kind: 'WINDOW', spec_sha256: spec, scope_code: code, start_date: from, end_date: to } as const
    const load = async (readSignal?: AbortSignal) =>
      nativeCnyIndexView(await this.reader.read(request, { signal: readSignal }), request).result
    const result = allChunk ? await load(signal)
      : await this.histories.read(JSON.stringify(request), load, () => false, signal)
    if (result.kind === 'ERROR' && result.error === 'NOT_PUBLISHED') return null
    if (result.kind !== 'HISTORY') throw new Error(result.kind === 'ERROR' ? result.error : 'Invalid history')
    if (!result.history.days.every((row) => row.data.method === method)) throw new Error('Second curve method mismatch')
    return result.history
  }

  /** All for a second curve: the same <= 92-day chunks and page-wide permits as the main curve. */
  allSpecHistory(spec: string, method: NativeCnyIndexMethod, code: string, end: string, signal?: AbortSignal) {
    return this.allHistories.readSpec(spec, code, end,
      (from, to, sharedSignal) => this.specHistory(spec, method, code, from, to, sharedSignal, true), signal)
  }
}

export class NativeCnyMarketDescriptiveGateway implements MarketDescriptivePublicGateway {
  readonly kind = 'NATIVE_CNY_MARKET_DESCRIPTIVE'
  constructor(private readonly session: NativeCnyMarketSession) {}
  async read(request: MarketDescriptiveDecodeRequest, options: MarketDescriptiveReadOptions = {}) {
    try {
      const day = await this.session.day(request.query.publication_id, options.signal)
      const names = await this.session.scopeNames(day.data.points, options.signal)
      const all = day.data.points.map((point) => mapNativeDescriptiveScope(point, names))
      const scopes = request.kind === 'OVERVIEW' ? all : all.filter((scope) => scope.scope_token === request.query.scope_token)
      if (scopes.length === 0) throw new Error('Scope unavailable')
      const primary = scopes.find((scope) => scope.scope_id === 'ALL') ?? scopes[0]!
      const point = day.data.points.find((point) => point.scope_code === primary.scope_id)!
      const document: MarketDescriptiveSuccess = {
        native_cny: true, native_method: day.data.method, contract_name: 'market-descriptive-public-api', contract_version: '1', response_kind: 'RESULT',
        operation: request.kind, product_kind: 'MARKET_DESCRIPTIVE', method: 'EQUAL_WEIGHTED_MEMBER_RETURN',
        publication: { publication_id: day.publication_id, parent_publication_id: null, manifest_sha256: null,
          rights_revision: null, published_at: day.released_at, withdrawn_at: null },
        snapshot: { catalog_snapshot_id: null, membership_version: null, input_sha256: null,
          start_date: null, end_date: day.data.bucket_date, source_export_as_of: null, imported_at: null },
        freshness: { evaluated_at: day.released_at, expected_latest_complete_date: null, lag_complete_days: null,
          status: null, headline_data_date: day.data.bucket_date },
        day_pair: null, headline: null,
        current_day_quality: { date: day.data.bucket_date,
          status: point.state === 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN' ? 'BASELINE_ONLY'
            : isNativeCnyAdjacentReturnState(point.state) ? 'AVAILABLE' : 'UNAVAILABLE', scope: primary },
        scopes: [primary, ...scopes.filter((scope) => scope !== primary)], history: [],
      }
      return project('descriptive', request, document)
    } catch (error) {
      if (options.signal?.aborted) throw error
      return project('descriptive', request, { contract_name: 'market-descriptive-public-api', contract_version: '1',
        response_kind: 'ERROR', error: { code: 'NOT_PUBLISHED', retryable: false } })
    }
  }
}

export class NativeCnyMarketSectorIndexGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'NATIVE_CNY_MARKET_INDEX'
  readonly preferredSeriesVersion = '3' as const
  /** `eSpec` is the E second curve's fixed spec (build-time, src/api/nativeCnyECurveConfig.ts);
   * null hides E. */
  constructor(private readonly session: NativeCnyMarketSession, private readonly eSpec: string | null = nativeCnyECurveSpec()) {}
  /** The E second curve for one scope over the main curve's window. It never touches the main
   * curve: every failure, NOT_PUBLISHED included, is null (E hidden). Rows end at E's own
   * latest appended day; nothing is extrapolated, and trailing unappended dates are not rows. */
  async readNativeSecondarySeries(
    request: NativeSecondarySeriesRequest, options: MarketSectorIndexReadOptions = {},
  ): Promise<NativeSecondarySeries | null> {
    const spec = this.eSpec
    if (spec === null) return null
    const { scope_code: code, from_date: from, to_date: to } = request
    try {
      const all = from === NATIVE_CNY_ALL_START
      if (from > to || (!all && dayDistance(from, to) > MAX_COMPLETE_WINDOW_SPAN)) return null
      const history = all ? await this.session.allSpecHistory(spec, NATIVE_CNY_INDEX_METHOD_E, code, to, options.signal)
        : await this.session.specHistory(spec, NATIVE_CNY_INDEX_METHOD_E, code, from, to, options.signal)
      if (history === null || history.days.length === 0) return null
      const points = history.days.map((row, index) => mapNativeIndexPoint(row, history.days[index - 1]))
      return Object.freeze({ method: NATIVE_CNY_INDEX_METHOD_E, spec_sha256: spec, scope_code: code,
        points: Object.freeze(points), latest_date: points.at(-1)!.date })
    } catch (error) {
      if (options.signal?.aborted) throw error
      return null
    }
  }
  isNativeCurrentFresh(matches: (release: MarketSectorIndexDirectoryReleaseV3) => boolean): boolean {
    return this.session.hasFreshCurrent((day) => matches(releaseView(day)))
  }
  observeNativeCurrent(listener: (release: MarketSectorIndexDirectoryReleaseV3) => void): () => void {
    return this.session.observeCurrent((day) => listener(releaseView(day)))
  }
  async read(request: MarketSectorIndexDecodeRequest, options: MarketSectorIndexReadOptions = {}) {
    options.signal?.throwIfAborted()
    // V1 fallback is deliberately unavailable; it must never read the USD history.
    return project('index', request, { contract_name: 'market-sector-index-public-api', contract_version: '1',
      response_kind: 'ERROR', error: { code: 'NOT_PUBLISHED', retryable: false } })
  }
  async readDirectoryV3(request: MarketSectorIndexRequestV3, options: MarketSectorIndexReadOptions = {}) {
    return this.readV3(request, options, false)
  }
  async readAllSeriesV3(request: Extract<MarketSectorIndexRequestV3, { kind: 'SERIES' }>, options: MarketSectorIndexReadOptions = {}) {
    return this.readV3(request, options, true)
  }
  private async readV3(request: MarketSectorIndexRequestV3, options: MarketSectorIndexReadOptions, all: boolean) {
    try {
      const day = await this.session.day(request.query.publication_id, options.signal)
      const names = await this.session.scopeNames(day.data.points, options.signal)
      const scopes = day.data.points.map((point) => scopeView(point, names))
      const release = releaseView(day)
      const common = { contract_name: 'market-sector-index-public-api', contract_version: '3',
        product_kind: 'DESCRIPTIVE_MARKET_SECTOR_INDEX', purpose: 'CS2_ROTATE_HIERARCHICAL_MARKET_SECTOR_INDEX_V3',
        prediction_status: 'NOT_A_PREDICTION', release } as const
      if (request.kind === 'GROUPS') return project('indexV3', request, {
        ...common, response_kind: 'SCOPE_GROUP_DIRECTORY', scopes: [],
        query: { group: null, after: null, limit: null, next_after: null },
        groups: GROUPS.map((group_code, display_order) => ({ group_code, display_order,
          labels: { en: group_code, zh_cn: group_code }, scope_count: scopes.filter((scope) => scope.group_code === group_code).length })),
      })
      if (request.kind === 'SCOPES') {
        const query = request.query
        const group = scopes.filter((scope) => scope.group_code === query.group).sort((a, b) => a.scope_token.localeCompare(b.scope_token))
        const remaining = group.filter((scope) => query.after === null || scope.scope_token > query.after)
        const page = remaining.slice(0, query.limit)
        return project('indexV3', request, { ...common, response_kind: 'SCOPE_PAGE', groups: [], scopes: page,
          query: { group: query.group, after: query.after, limit: query.limit,
            next_after: remaining.length > page.length ? page.at(-1)!.scope_token : null } })
      }
      const query = request.query, scope = scopes.find((scope) => scope.scope_token === query.scope_token)
      if (scope === undefined) throw new Error('Unknown native scope')
      const to = query.to_date ?? day.data.bucket_date
      const from = query.from_date ?? shiftDay(to, -91)
      const allWindow = all && from === NATIVE_CNY_ALL_START
      // Complete-window reads: All is chunked; an ordinary chart window (<= 1Y plus its
      // opening anchor) is one history read instead of one full re-read per cursor page.
      if (all && (query.after_date !== null || from > to || to > day.data.bucket_date ||
        (allWindow ? to !== day.data.bucket_date : dayDistance(from, to) > MAX_COMPLETE_WINDOW_SPAN))) throw new Error('Invalid complete-window target')
      const history = allWindow ? await this.session.allHistory(day, scope.scope_code, options.signal)
        : await this.session.history(day, scope.scope_code, from, to, options.signal)
      const allPoints = history.days.map((row, index) => mapNativeIndexPoint(row, history.days[index - 1]))
      const remaining = allPoints.filter((point) => query.after_date === null || point.date > query.after_date)
      const points = all ? remaining : remaining.slice(0, query.limit)
      return project('indexV3', request, { ...common, response_kind: 'INDEX_SERIES',
        scope: { ...scope, first_available_date: history.days[0]?.data.bucket_date ?? null,
          last_available_date: history.days.at(-1)?.data.bucket_date ?? null },
        series_query: { from_date: query.from_date, to_date: query.to_date, after_date: query.after_date, limit: query.limit,
          next_after_date: remaining.length > points.length ? points.at(-1)!.date : null }, points })
    } catch (error) {
      if (options.signal?.aborted) throw error
      return project('indexV3', request, { contract_name: 'market-sector-index-public-api', contract_version: '3',
        response_kind: 'ERROR', error: { code: 'NOT_PUBLISHED', retryable: false } })
    }
  }
}
