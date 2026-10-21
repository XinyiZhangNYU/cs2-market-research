import type { NativeCnyTrendingDay, NativeCnyTrendingMember } from '../api/HttpNativeCnyTrendingGateway'
import { t } from '../i18n/strings'
import type { TrendingCatalogProjection, TrendingListQuery, TrendingListResponse, TrendingMember } from '../wire/singleItemTrendingPublicApiTypes'

/** Presentation only, NOT a legacy wire DTO. Missing producer facts stay absent. */
export type NativeTrendingCatalog = Pick<TrendingCatalogProjection,
  'analysis_unit_id' | 'item_kind' | 'base_item_code' | 'edition_kind' | 'wear_tier' | 'localized_name' | 'media'>
export type NativeTrendingMember = Readonly<{
  native_cny: true
  rank: number
  analysis_unit_id: string
  direction: NativeCnyTrendingMember['direction']
  evidence_grade: NativeCnyTrendingMember['evidenceGrade']
  supporting_source_count: 2 | 3
  conservative_source_code: NativeCnyTrendingMember['conservativeSource']
  return_exact: NativeCnyTrendingMember['returnExact']
  catalog_state: 'LOADING' | 'READY' | 'FALLBACK'
  catalog: NativeTrendingCatalog
}>
export type NativeTrendingList = Readonly<{
  api_version: 'native-cny'
  response_kind: 'TRENDING_LIST'
  query: TrendingListQuery
  publication: Readonly<{
    publication_id: string
    result_as_of: string
    window_start_date: string
    window_end_date: string
    evidence_class: NativeCnyTrendingDay['evidenceClass']
    catalog: Readonly<{ snapshot_id: string; as_of: string }> | null
  }>
  total: number
  members: readonly NativeTrendingMember[]
  next_cursor: null
  missing_catalog_count: number
  catalog_status: 'LOADING' | 'READY' | 'UNAVAILABLE'
}>
export type NativeTrendingEmpty = Readonly<{
  api_version: 'native-cny'
  response_kind: 'ERROR'
  error: Readonly<{ code: 'NOT_PUBLISHED'; retryable: true }>
}>
export type TrendingDisplayList = TrendingListResponse | NativeTrendingList
export type TrendingDisplayMember = TrendingMember | NativeTrendingMember
export const isNativeTrendingMember = (member: TrendingDisplayMember): member is NativeTrendingMember => 'native_cny' in member
export const trendingRowKey = (member: TrendingDisplayMember): string =>
  isNativeTrendingMember(member) ? member.analysis_unit_id : member.measurement_id

export function trendingProductHref(member: TrendingDisplayMember, publication: TrendingDisplayList['publication'], lang: 'zh' | 'en'): string {
  const params = new URLSearchParams({ unit: member.analysis_unit_id })
  if (publication.catalog !== null) {
    params.set('snapshot', publication.catalog.snapshot_id)
    params.set('as_of', publication.catalog.as_of)
  }
  if (lang === 'en') params.set('lang', 'en')
  return `/research?${params}`
}

/** One final half-expand rounding to one percentage decimal (like Intl's
 * existing percent formatter). Neither ratio nor percent passes through Number. */
export function formatNativeTrendingPercent(exact: NativeCnyTrendingMember['returnExact'], lang: 'zh' | 'en', tinyLabel = true): string {
  const negative = exact.numerator_hex.startsWith('-')
  const magnitude = BigInt(`0x${negative ? exact.numerator_hex.slice(1) : exact.numerator_hex}`)
  const denominator = BigInt(`0x${exact.denominator_hex}`)
  if (denominator <= 0n) throw new TypeError('Invalid exact denominator')
  if (tinyLabel && magnitude * 2000n < denominator) {
    return t(negative ? 'publicTrendingTinyDecline' : 'publicTrendingTinyGain', lang)
  }
  const scaled = magnitude * 1000n
  const tenths = scaled / denominator + (scaled % denominator * 2n >= denominator ? 1n : 0n)
  const whole = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US').format(tenths / 10n)
  return `${negative ? '-' : '+'}${whole}.${tenths % 10n}%`
}
