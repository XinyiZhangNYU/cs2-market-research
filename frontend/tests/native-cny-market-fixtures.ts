import { canonicalHash } from '../src/wire/canonical'
import type { NativeCnyIndexPublicDay, NativeCnyIndexPublicPoint } from '../src/wire/nativeCnyIndexPublicApi'
import type { MarketSectorIndexScopeV3 } from '../src/wire/marketSectorIndexPublicApiV3Types'

// Entirely authored synthetic responses; not captured from a server or backup.
export const fixtureSpec = 'b'.repeat(64)
export const fixtureDates = ['2025-04-01', '2025-04-02', '2025-04-04', '2025-04-05', '2025-04-06']
export const fixtureCodes = ['ALL', 'WEAPON', 'KNIFE', 'CASE', 'WEAPON_MODEL:7', 'KNIFE_MODEL:515', 'TEST:999']
export const fixtureLabels: Record<string, { en: string; zh_cn: string }> = {
  ALL: { en: 'Market', zh_cn: '大盘' }, WEAPON: { en: 'Weapons', zh_cn: '武器' },
  KNIFE: { en: 'Knives', zh_cn: '刀具' }, CASE: { en: 'Cases', zh_cn: '武器箱' },
  'WEAPON_MODEL:7': { en: 'AK-47', zh_cn: 'AK-47' },
  'KNIFE_MODEL:515': { en: 'Butterfly knife', zh_cn: '蝴蝶刀' },
}
export function syntheticPoint(code = 'ALL', ordinal = 4): NativeCnyIndexPublicPoint {
  return {
    scope_code: code, expected_member_count: 120, paired_member_count: 110, qualified_member_count: 108,
    rejected_return_domain_count: 2, absolute_price_qualified_member_count: 116,
    segment_number: ordinal < 2 ? 1 : 2,
    grade_counts: { A: 100, B: 3, C: 4, D: 1, E: 10 }, source_pair_counts: { '7->7': 110 }, warnings: [],
    absolute_price_semantic: 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE',
    period_return_display: ordinal === 0 || ordinal === 2 ? null : '0.01000000',
    index_display: ['10000.00000000', '10100.00000000', '10100.00000000', '10201.00000000', '10303.01000000'][ordinal]!,
    ask_sum_cny_display: code === 'KNIFE' ? '140000.12000000' : '70000.14000000',
    ask_median_cny_display: '350.07000000', price_quality: 'HIGH', return_quality: 'HIGH',
    state: ordinal === 0 || ordinal === 2 ? 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN' : 'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN',
    effective_estimator: 'SYMMETRIC_1_PERCENT_WINSOR',
  }
}
export function syntheticDay(ordinal = 4, codes = fixtureCodes): NativeCnyIndexPublicDay {
  const date = fixtureDates[ordinal]!
  return {
    publication_id: String(ordinal + 1).repeat(64), public_sha256: 'c'.repeat(64), rights_sha256: 'd'.repeat(64),
    review_sha256: 'e'.repeat(64), released_at: `${date}T23:59:00Z`,
    data: { schema: 'native-cny-index-public-day/1', basis: 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1',
      method: 'ROBUST_EQUAL_NATIVE_CNY_EXACT_V1', currency: 'CNY', fx_applied: false, price_unit: 'CNY_MAJOR',
      numeric_semantics: 'FIXED_50_SIGNIFICANT_DECIMAL_DIGITS_ROUND_HALF_EVEN_SCALE_STATE_DISPLAY_ROUNDING',
      bucket_date: date, measured_at: `${date}T23:55:00Z`, spec_sha256: fixtureSpec,
      availability: 'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND',
      points: codes.map((code) => syntheticPoint(code, ordinal)) },
  }
}
export function syntheticHistory(scope = 'ALL', start = '2025-04-01', end = '2025-04-06') {
  const days = fixtureDates.flatMap((date, ordinal) => date >= start && date <= end ? [syntheticDay(ordinal, [scope])] : [])
  const present = new Set(days.map((day) => day.data.bucket_date))
  const missing: string[] = []
  for (let value = Date.parse(`${start}T00:00:00Z`); value <= Date.parse(`${end}T00:00:00Z`); value += 86400000) {
    const date = new Date(value).toISOString().slice(0, 10)
    if (!present.has(date)) missing.push(date)
  }
  return { api_contract: 'native-cny-index-history/1', spec_sha256: fixtureSpec, scope, start_date: start, end_date: end,
    currency: 'CNY', fx_applied: false, days, missing_publication_dates: missing,
    missing_prices_filled: false, calculation_revisions_mixed: false }
}

const nameRelease = {
  publication_id: 'a'.repeat(64), manifest_sha256: 'a'.repeat(64), rights_revision: 'a'.repeat(64),
  published_at: '2025-04-07T00:00:00Z', withdrawn_at: null, directory_id: `market_sector_index_scope_directory_${'f'.repeat(64)}`,
  directory_sha256: 'f'.repeat(64), directory_sealed_at: '2025-04-07T00:00:00Z', candidate_sha256: '1'.repeat(64),
  successor_delta_sha256: '2'.repeat(64), continuation_spec_sha256: '3'.repeat(64),
  history_start: '2025-04-01', history_end: '2025-04-06', measured_start: '2025-04-06', measured_end: '2025-04-06',
  availability_semantics: ['RECONSTRUCTED_LATE_BOUND', 'CONTEMPORANEOUSLY_MEASURED'],
}
export function syntheticNames(group: string, after: string | null = null, limit = 64) {
  const scopes: MarketSectorIndexScopeV3[] = Object.entries(fixtureLabels).flatMap(([code, labels]) => {
    const g = code === 'ALL' ? 'MARKET' : code.startsWith('WEAPON_MODEL:') ? 'WEAPON_MODELS'
      : code.startsWith('KNIFE_MODEL:') ? 'KNIFE_MODELS' : 'SECTORS'
    if (g !== group) return []
    return [{ scope_token: canonicalHash({ contract: 'market-sector-index-public-api', scope_code: code }),
      scope_code: code, scope_kind: code === 'ALL' ? 'MARKET' : code.includes(':') ? 'SUBSECTOR' : 'SECTOR',
      group_code: g, parent_scope_code: code === 'ALL' ? null : code.startsWith('WEAPON_MODEL:') ? 'WEAPON'
        : code.startsWith('KNIFE_MODEL:') ? 'KNIFE' : 'ALL', ancestor_scope_codes: code === 'ALL' ? [] : ['ALL'], labels,
      series_source: 'REGULAR_SUCCESSOR_RECONSTRUCTION', price_history_eligibility: 'RECONSTRUCTED_HISTORY',
      first_available_date: '2025-04-01', last_available_date: '2025-04-06',
      // Poison numeric values: tests must prove these never reach the native UI.
      current_member_count: 999999, observed_price_member_count: 888888,
      origin_uncertainty_disclosed: false, low_member_count: false, linked_collection_scope_tokens: [] } satisfies MarketSectorIndexScopeV3]
  }).sort((a, b) => a.scope_token.localeCompare(b.scope_token))
  const remaining = scopes.filter((scope) => after === null || scope.scope_token > after)
  const page = remaining.slice(0, limit)
  return { contract_name: 'market-sector-index-public-api', contract_version: '3', response_kind: 'SCOPE_PAGE',
    product_kind: 'DESCRIPTIVE_MARKET_SECTOR_INDEX', purpose: 'CS2_ROTATE_HIERARCHICAL_MARKET_SECTOR_INDEX_V3',
    prediction_status: 'NOT_A_PREDICTION', release: nameRelease,
    query: { group, after, limit, next_after: remaining.length > limit ? page.at(-1)!.scope_token : null }, groups: [], scopes: page }
}

export function syntheticRoute(path: string): { payload: unknown; status: number } {
  const url = new URL(path, 'http://127.0.0.1')
  const q = url.searchParams
  if (url.pathname === '/api/v1/native-cny/index/day') return { payload: syntheticDay(), status: 200 }
  if (url.pathname === '/api/v1/native-cny/index/history') return {
    payload: syntheticHistory(q.get('scope')!, q.get('start')!, q.get('end')!), status: 200,
  }
  if (url.pathname === '/api/v3/market-index/public/scopes') return {
    payload: syntheticNames(q.get('group')!, q.get('after'), Number(q.get('limit') ?? 64)), status: 200,
  }
  return { payload: { api_contract: 'synthetic-unavailable/1', error: 'NOT_PUBLISHED' }, status: 404 }
}
export const syntheticFetch: typeof fetch = async (input) => {
  const result = syntheticRoute(String(input))
  return new Response(JSON.stringify(result.payload), { status: result.status, headers: { 'Content-Type': 'application/json' } })
}
