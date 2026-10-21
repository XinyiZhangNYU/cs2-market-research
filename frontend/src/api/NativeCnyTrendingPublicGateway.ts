import { SharedRead } from '../performance/sharedRead'
import { canonicalJsonText } from '../wire/canonical'
import type { NativeTrendingCatalog, NativeTrendingEmpty, NativeTrendingList, NativeTrendingMember } from '../trending/nativeCnyTrendingPresentation'
import type { WireCatalogDisplaySnapshotDescriptor } from '../wire/catalogDisplaySnapshotApiTypes'
import type { TrendingListQuery } from '../wire/singleItemTrendingPublicApiTypes'
import { CatalogDisplayApi, type CatalogDisplayGateway } from './CatalogDisplayApi'
import { catalogQueryInstant } from './catalogDisplayRuntime'
import { HttpCatalogDisplayGateway } from './HttpCatalogDisplayGateway'
import { HttpNativeCnyTrendingGateway, type NativeCnyTrendingDay, type NativeCnyTrendingMember } from './HttpNativeCnyTrendingGateway'
import type { SingleItemTrendingPublicGateway, TrendingReadOptions } from './SingleItemTrendingPublicApi'

const projections = new WeakMap<object, { request: string; document: NativeTrendingList | NativeTrendingEmpty }>()
function project(query: TrendingListQuery, document: NativeTrendingList | NativeTrendingEmpty) {
  const freeze = (value: unknown): void => {
    if (value !== null && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) }
  }
  freeze(document)
  const payload = Object.freeze({ nativeTrendingProjection: true })
  projections.set(payload, { request: canonicalJsonText(query), document })
  return { payload, httpStatus: 200 }
}
/** Only locally projected, decoded native objects are admitted. JSON and clones
 * cannot forge this seam or bypass the unchanged legacy wire validator. */
export function nativeTrendingProjection(payload: unknown, query: TrendingListQuery, status: number): NativeTrendingList | NativeTrendingEmpty | null {
  if (payload === null || typeof payload !== 'object') return null
  const entry = projections.get(payload)
  if (entry === undefined) return null
  if (status !== 200 || entry.request !== canonicalJsonText(query)) throw new TypeError('Native Trending projection mismatch')
  return entry.document
}

function fallback(member: NativeCnyTrendingMember): NativeTrendingCatalog {
  return { analysis_unit_id: member.analysisUnitId, item_kind: 'UNKNOWN', base_item_code: 'UNKNOWN',
    edition_kind: 'UNKNOWN', wear_tier: 'UNKNOWN',
    localized_name: { en: member.displayName, zh_cn: member.displayName }, media: { status: 'NOT_PRODUCED' } }
}

// Page-session wide, including separate adapter instances and slow aborts.
const detailSlots: Promise<unknown>[] = Array.from({ length: 4 }, () => Promise.resolve())
let nextSlot = 0
function limitedDetail<T>(signal: AbortSignal, load: () => Promise<T>): Promise<T> {
  const slot = nextSlot++ % 4
  const pending = detailSlots[slot].then(() => { signal.throwIfAborted(); return load() })
  detailSlots[slot] = pending.then(() => undefined, () => undefined)
  return pending
}
export const NATIVE_TRENDING_DETAIL_CAPACITY = 400

export class NativeCnyTrendingPublicGateway implements SingleItemTrendingPublicGateway {
  readonly kind = 'NATIVE_CNY_TRENDING'
  private readonly api: CatalogDisplayApi
  // Bounded memory only. Failed/aborted publications never enter this cache.
  private readonly publications = new SharedRead<NativeCnyTrendingDay>(1, 30_000)
  private readonly snapshots = new SharedRead<WireCatalogDisplaySnapshotDescriptor | null>(1, 30_000)
  private readonly details = new SharedRead<NativeTrendingCatalog | null>(400, 0)
  // Immutable snapshot identities: bounded session LRU, no persistent storage.
  // Only successful validated detail records are admitted (not errors/NOT_FOUND).
  private readonly detailValues = new Map<string, { descriptor: string; value: NativeTrendingCatalog }>()

  constructor(
    catalog: CatalogDisplayGateway = new HttpCatalogDisplayGateway(),
    private readonly native = new HttpNativeCnyTrendingGateway(),
    private readonly now: () => Date = () => new Date(),
  ) { this.api = new CatalogDisplayApi(catalog) }

  private async detail(snapshot: WireCatalogDisplaySnapshotDescriptor, id: string, signal: AbortSignal) {
    const key = `${snapshot.snapshot_id}:${id}`, descriptor = canonicalJsonText(snapshot)
    const cached = this.detailValues.get(key)
    if (cached && cached.descriptor === descriptor) {
      this.detailValues.delete(key); this.detailValues.set(key, cached)
      return cached.value
    }
    return this.details.read(`${key}:${descriptor}`, async (detailSignal) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        detailSignal.throwIfAborted()
        try {
          const value = await limitedDetail(detailSignal, async () => {
            const detail = await this.api.detail({ query: { snapshot_id: snapshot.snapshot_id,
              analysis_unit_id: id, page_size: 1 }, cursor: null }, { signal: detailSignal })
            if (detail.response_kind === 'ERROR') {
              if (detail.error.code === 'NOT_FOUND') return null
              throw new Error('Catalog detail unavailable')
            }
            if (detail.response_kind !== 'CATALOG_QUERY_DETAIL' ||
              canonicalJsonText(detail.snapshot) !== descriptor) throw new Error('Catalog snapshot mismatch')
            const p = detail.member.projection
            return { analysis_unit_id: p.analysis_unit_id, item_kind: p.item_kind, base_item_code: p.base_item_code,
              edition_kind: p.edition_kind, wear_tier: p.wear_tier, localized_name: p.localized_name,
              media: p.media.status === 'BOUND' ? { ...p.media, media_asset_version_id: p.version_context.media_asset_version_id! } : p.media }
          })
          detailSignal.throwIfAborted()
          if (value !== null) {
            this.detailValues.delete(key); this.detailValues.set(key, { descriptor, value })
            while (this.detailValues.size > NATIVE_TRENDING_DETAIL_CAPACITY) this.detailValues.delete(this.detailValues.keys().next().value!)
          }
          return value
        } catch (error) {
          detailSignal.throwIfAborted()
          if (error instanceof DOMException && error.name === 'AbortError') throw error
          if (attempt === 1) return null
        }
      }
      return null
    }, () => false, signal)
  }

  async read(query: TrendingListQuery, options: TrendingReadOptions = {}) {
    try {
      const signal = options.signal ?? new AbortController().signal
      const day = await this.publications.read('current', (nativeSignal) => this.native.current(nativeSignal), () => true, signal)
      if (query.cursor !== null || (query.publication_id !== null && query.publication_id !== day.publicationId) ||
        (query.as_of !== null && query.as_of !== day.endDate)) throw new Error('Selection is not current')
      if (options.nativeLimit !== undefined && (!Number.isInteger(options.nativeLimit) || options.nativeLimit < 1 || options.nativeLimit > 50 ||
        Object.values(query.filters).some((value) => value !== null))) throw new TypeError('Invalid native preview limit')
      const selected = day.members.filter((member) => member.direction === query.direction).slice(0, options.nativeLimit)
      let snapshot: WireCatalogDisplaySnapshotDescriptor | null = null
      let status: NativeTrendingList['catalog_status'] = 'LOADING'
      const members: NativeTrendingMember[] = selected.map((member) => ({ native_cny: true, rank: member.rank,
        analysis_unit_id: member.analysisUnitId, direction: member.direction, evidence_grade: member.evidenceGrade,
        supporting_source_count: member.supportingSourceCount, conservative_source_code: member.conservativeSource,
        return_exact: member.returnExact, catalog_state: 'LOADING',
        catalog: { ...fallback(member), localized_name: { en: '', zh_cn: '' } } }))
      const document = () => {
        // Do not filter on unknown pending metadata. A pinned URL filter waits
        // for the full direction, never silently claims incomplete results.
        const filtered = status === 'READY' ? members.filter((member) => Object.entries(query.filters).every(
          ([key, value]) => value === null || member.catalog[key as keyof NativeTrendingCatalog] === value)) : members
        return project(query, { api_version: 'native-cny', response_kind: 'TRENDING_LIST', query,
          publication: { publication_id: day.publicationId, result_as_of: day.asOf, window_start_date: day.startDate,
            window_end_date: day.endDate, evidence_class: day.evidenceClass,
            catalog: snapshot === null ? null : { snapshot_id: snapshot.snapshot_id, as_of: snapshot.as_of } },
          total: filtered.length, members: [...filtered], next_cursor: null,
          catalog_status: status, missing_catalog_count: members.filter((m) => m.catalog_state === 'FALLBACK').length })
      }
      const publish = () => { signal.throwIfAborted(); options.onProgress?.(document()) }
      publish() // No catalog request is on the native rows' critical path.
      try {
        snapshot = await this.snapshots.read('current', async (snapshotSignal) => {
          const instant = catalogQueryInstant(this.now())
          const response = await this.api.listSnapshots({ query: { query_as_of: instant, known_at: instant,
            sort: 'AS_OF_DESC', page_size: 1 }, cursor: null }, { signal: snapshotSignal })
          if (response.response_kind === 'ERROR') throw new Error('Catalog unavailable')
          return response.members[0] ?? null
        }, (value) => value !== null, signal)
      } catch { signal.throwIfAborted() }
      if (snapshot === null) {
        status = 'UNAVAILABLE'
        members.forEach((member, index) => { members[index] = { ...member, catalog_state: 'FALLBACK', catalog: fallback(selected[index]!) } })
      } else {
        const currentSnapshot = snapshot
        let next = 0
        await Promise.all(Array.from({ length: Math.min(4, members.length) }, async () => {
          while (next < members.length) {
            signal.throwIfAborted()
            const index = next++, member = selected[index]!
            let catalog: NativeTrendingCatalog | null = null
            try { catalog = await this.detail(currentSnapshot, member.analysisUnitId, signal) }
            catch { signal.throwIfAborted() }
            signal.throwIfAborted()
            members[index] = { ...members[index]!, catalog_state: catalog === null ? 'FALLBACK' : 'READY', catalog: catalog ?? fallback(member) }
            publish()
          }
        }))
        status = 'READY'
      }
      signal.throwIfAborted()
      return document()
    } catch (error) {
      options.signal?.throwIfAborted()
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      return project(query, { api_version: 'native-cny', response_kind: 'ERROR', error: { code: 'NOT_PUBLISHED', retryable: true } })
    }
  }
}
