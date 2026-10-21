import equal from 'fast-deep-equal'
import type { CatalogDisplayApi } from '../api/CatalogDisplayApi'
import { CatalogDisplayReadUnavailable } from '../adapter/catalogDisplayViewModel'
import type { WireCatalogSeriesQuery, WireCatalogSeriesResponse } from '../wire/catalogDisplayQueryApiTypes'
import { compareCatalogSeriesProduct } from './catalogSeriesPresentation'

/** Resume only a validated prefix of one immutable, query-bound series order. */
export async function readCatalogSeriesWindow(
  api: CatalogDisplayApi,
  query: WireCatalogSeriesQuery,
  minimum: number,
  signal: AbortSignal,
  cache: Map<string, WireCatalogSeriesResponse>,
): Promise<WireCatalogSeriesResponse> {
  const key = JSON.stringify(query)
  let result = cache.get(key)
  const cursors = new Set<string>()
  // Each nonterminal page must add unique members toward the fixed total.
  // Do not impose a page cap that truncates a restored 16-row discovery window.
  while (!result || (result.members.length < minimum && result.next_cursor !== null)) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    const cursor = result?.next_cursor ?? null
    if (cursor !== null && cursors.has(cursor)) throw new TypeError('catalog series repeated cursor')
    if (cursor !== null) cursors.add(cursor)
    const page = await api.series({ query, cursor }, { signal })
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    if (page.response_kind === 'ERROR') {
      throw new CatalogDisplayReadUnavailable(page.error.code, page.error.retryable, page.error.http_status)
    }
    if (page.response_kind !== 'CATALOG_QUERY_SERIES') throw new TypeError('catalog series response kind mismatch')
    if (!result && page.previous_cursor !== null) throw new TypeError('catalog series first page has previous cursor')
    if (result && (!equal(result.snapshot, page.snapshot) || !equal(result.profiles, page.profiles) ||
      result.total_matching_series !== page.total_matching_series)) {
      throw new TypeError('catalog series pages changed snapshot or accounting')
    }
    if (query.sort === 'PRODUCT' && result?.members.length && page.members.length &&
      compareCatalogSeriesProduct(result.members[result.members.length - 1]!, page.members[0]!, query.locale) >= 0) {
      throw new TypeError('catalog series continuation is not in product order')
    }
    const members = [...(result?.members ?? []), ...page.members]
    const keys = new Set(members.map((member) => `${member.item_kind}\0${member.base_item_code}`))
    if (keys.size !== members.length || members.length > page.total_matching_series ||
      (page.next_cursor === null && members.length !== page.total_matching_series) ||
      (page.next_cursor !== null && (page.members.length === 0 || page.next_cursor === cursor))) {
      throw new TypeError('catalog series pages do not account for a unique complete result')
    }
    result = { ...page, members: Object.freeze(members), previous_cursor: null }
    cache.delete(key)
    cache.set(key, result)
    while (cache.size > 3) cache.delete(cache.keys().next().value!)
  }
  return result!
}
