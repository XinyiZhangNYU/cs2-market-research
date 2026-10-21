import { describe, expect, it, vi } from 'vitest'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketDescriptivePublicApi } from '../src/api/MarketDescriptivePublicApi'
import { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { NativeCnyMarketSession, NativeCnyMarketDescriptiveGateway, NativeCnyMarketSectorIndexGateway,
  mapNativeDescriptiveScope, mapNativeIndexPoint, nativeCoverage, nativeScopePosition } from '../src/api/NativeCnyMarketGateways'
import { decodeNativeCnyIndexResponse } from '../src/wire/nativeCnyIndexPublicApi'
import { formatLocalizedCurrencyFromCny } from '../src/price/localizedCurrency'
import { formatExactDisplayDecimal, exactRelativeDisplayCoordinate } from '../src/price/exactDisplayDecimal'
import { indexLevelRuns, indexLevelBridgeRuns, rebasedPercentRuns, windowReturn, indexFromForRange } from '../src/pages/publicMarketIndexChart'
import { nativeCnyMarketEnabled } from '../src/api/nativeCnyMarketConfig'
import { syntheticDay, syntheticPoint, syntheticHistory, syntheticFetch, fixtureSpec } from './native-cny-market-fixtures'
import { syntheticNames } from './native-cny-market-fixtures'
import { validateMarketSectorIndexPublicApiV3Response } from '../src/wire/generated/marketSectorIndexPublicApiV3Validator.js'

const windowRequest = { kind: 'WINDOW', spec_sha256: fixtureSpec, scope_code: 'ALL', start_date: '2025-04-01', end_date: '2025-04-06' } as const
function harness(fetcher: typeof fetch = syntheticFetch) {
  const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
  return { session, descriptive: new MarketDescriptivePublicApi(new NativeCnyMarketDescriptiveGateway(session)),
    index: new MarketSectorIndexPublicApi(new NativeCnyMarketSectorIndexGateway(session)) }
}

describe('current/native history wire', () => {
  it('discovers all scopes, including a full 218-scope day, without daily pins', () => {
    const day = syntheticDay(4, ['ALL', ...Array.from({ length: 217 }, (_, n) => `WEAPON_MODEL:${n}`)])
    const decoded = decodeNativeCnyIndexResponse(day, 200, { kind: 'CURRENT' })
    expect(decoded.kind === 'DAY' && decoded.day.data.points).toHaveLength(218)
  })
  it('strictly decodes a valid sparse multi-segment window', () => {
    const result = decodeNativeCnyIndexResponse(syntheticHistory(), 200, windowRequest)
    expect(result.kind).toBe('HISTORY')
    if (result.kind !== 'HISTORY') throw new Error()
    expect(result.history.days).toHaveLength(5)
    expect(result.history.missing_publication_dates).toEqual(['2025-04-03'])
  })
  it.each(['spec', 'order', 'duplicate', 'outside', 'mixed', 'missing', 'currency', 'fx', 'hash', 'schema', 'scope'])(
    'rejects the entire window for %s corruption', (mutation) => {
      const h = structuredClone(syntheticHistory())
      if (mutation === 'spec') Object.assign(h.days[1]!.data, { spec_sha256: 'c'.repeat(64) })
      if (mutation === 'order') h.days.reverse()
      if (mutation === 'duplicate') h.days[1] = h.days[0]!
      if (mutation === 'outside') Object.assign(h.days[0]!.data, { bucket_date: '2025-03-31' })
      if (mutation === 'mixed') h.calculation_revisions_mixed = true
      if (mutation === 'missing') h.missing_publication_dates = []
      if (mutation === 'currency') Object.assign(h.days[1]!.data, { currency: 'USD' })
      if (mutation === 'fx') Object.assign(h.days[1]!.data, { fx_applied: true })
      if (mutation === 'hash') Object.assign(h.days[1], { public_sha256: 'invalid' })
      if (mutation === 'schema') Object.assign(h.days[1]!.data, { schema: 'future/2' })
      if (mutation === 'scope') Object.assign(h.days[1]!.data.points[0], { scope_code: 'CASE' })
      expect(() => decodeNativeCnyIndexResponse(h, 200, windowRequest)).toThrow()
    },
  )
  it('rejects duplicate current scopes and invalid current data rather than partially accepting them', () => {
    expect(() => decodeNativeCnyIndexResponse(syntheticDay(4, ['ALL', 'ALL']), 200, { kind: 'CURRENT' })).toThrow()
    const day = structuredClone(syntheticDay()); Object.assign(day.data.points[1], { price_quality: 'EXCELLENT' })
    expect(() => decodeNativeCnyIndexResponse(day, 200, { kind: 'CURRENT' })).toThrow()
  })
  it.each([['NOT_PUBLISHED', 404], ['TEMPORARILY_UNAVAILABLE', 503], ['INVALID_REQUEST', 400]] as const)('validates %s error contract and status', (error, status) => {
    const body = { api_contract: 'native-cny-index-day/1', error }
    expect(decodeNativeCnyIndexResponse(body, status, { kind: 'CURRENT' })).toMatchObject({ kind: 'ERROR', error, http_status: status })
    expect(() => decodeNativeCnyIndexResponse(body, 500, { kind: 'CURRENT' })).toThrow()
    expect(() => decodeNativeCnyIndexResponse({ ...body, api_contract: 'other' }, status, windowRequest)).toThrow()
  })
})

describe('mappings, isolation and currency', () => {
  it('uses a contract-valid synthetic name directory', () => {
    const valid = validateMarketSectorIndexPublicApiV3Response(syntheticNames('SECTORS'))
    expect(valid, JSON.stringify(validateMarketSectorIndexPublicApiV3Response.errors)).toBe(true)
  })
  it('maps only published fields and keeps diagnostic absences null', () => {
    const p = syntheticPoint(), result = mapNativeDescriptiveScope(p)
    expect(result).toMatchObject({ fixed_member_count: 120, paired_member_count: 110, day_price_member_count: 116,
      return_selected_for_display: p.period_return_display, member_price_sum_cny: p.ask_sum_cny_display,
      missing_endpoint_count: null, raw_return_ratio: null, member_price_mean_cny: null, return_method: null })
    const mapped = mapNativeIndexPoint(syntheticDay(4, ['ALL']))
    expect(mapped.index.value).toBe(p.index_display)
    expect(mapped.coverage.expected_member_count_upper_bound).toBeNull()
    expect(mapped.quality.anomaly_member_count).toBeNull()
    expect(mapped.availability).toBe('RECONSTRUCTED_LATE_BOUND')
  })
  const qualities = ['HIGH', 'PARTIAL', 'LOW', 'UNAVAILABLE'] as const
  it.each(qualities.flatMap((price) => qualities.map((ret) => [price, ret] as const)))('maps price %s / return %s explicitly', (price_quality, return_quality) => {
    const expected = [price_quality, return_quality].some(q => q === 'LOW' || q === 'UNAVAILABLE') ? 'DETAIL_ONLY'
      : price_quality === 'HIGH' && return_quality === 'HIGH' ? 'HIGH' : 'PARTIAL'
    expect(nativeCoverage({ ...syntheticPoint(), price_quality, return_quality })).toBe(expected)
  })
  it.each(['NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN', 'BELOW_MINIMUM_INTERPRETABLE_COVERAGE', 'HISTORY_SCOPE_UNRESOLVED_ORIGINS'] as const)('does not promote %s to HIGH', (state) => {
    expect(nativeCoverage({ ...syntheticPoint(), state })).toBe('DETAIL_ONLY')
  })
  it('preserves strings beyond Number precision and rounds only at display', () => {
    const value = '9007199254740993.12345678', p = { ...syntheticPoint(), ask_sum_cny_display: value }
    expect(mapNativeDescriptiveScope(p).member_price_sum_cny).toBe(value)
    expect(formatLocalizedCurrencyFromCny(value, 'zh', null)).toBe('¥9,007,199,254,740,993.12')
    expect(formatLocalizedCurrencyFromCny('70000.14', 'en', '7')).toBe('$10,000.02')
    expect(formatLocalizedCurrencyFromCny('70000.14', 'en', null)).toBe('—')
    expect(formatExactDisplayDecimal(value, 'en', 3)).toBe('9,007,199,254,740,993.123')
    expect(exactRelativeDisplayCoordinate('100000000000000000000000001', '100000000000000000000000000')).toBe(0)
  })
  it('only connects adjacent same-segment points; neither gaps nor segments get visual bridges or cross-segment returns', () => {
    const days = syntheticHistory().days
    const points = days.map((day, i) => mapNativeIndexPoint(day, days[i - 1]))
    expect(points.map(p => p.connect_to_previous)).toEqual([false, true, false, true, true])
    expect(indexLevelRuns(points)).toHaveLength(2)
    expect(indexLevelBridgeRuns(points)).toEqual([])
    expect(windowReturn(points)).toBeNull()
    const overlays = rebasedPercentRuns(points)
    expect(overlays[1]![2]!.value).toBe(0)
    const contiguous = [syntheticDay(0, ['ALL']), syntheticDay(1, ['ALL'])]
    Object.assign(contiguous[1]!.data.points[0], { segment_number: 2 })
    expect(mapNativeIndexPoint(contiguous[1]!, contiguous[0]).connect_to_previous).toBe(false)
    expect(mapNativeIndexPoint(contiguous[1]!, contiguous[0]).index.period_return).toBeNull()
  })
  it('learns the current publication/spec, uses name-only directory values, and supports unknown codes', async () => {
    const fetcher = vi.fn(syntheticFetch), h = harness(fetcher)
    const overview = await h.descriptive.overview({ publication_id: null })
    expect(overview.response_kind).toBe('RESULT')
    if (overview.response_kind === 'ERROR') throw new Error()
    expect(overview.scopes.find(scope => scope.scope_id === 'WEAPON')!.labels.zh_cn).toBe('武器')
    expect(overview.scopes[0]!.fixed_member_count).toBe(120)
    expect(overview.scopes.find(scope => scope.scope_id === 'TEST:999')!.labels).toEqual({ en: 'TEST:999', zh_cn: 'TEST:999' })
    expect(h.session.unknownScopeCodes()).toContain('TEST:999')
    expect(nativeScopePosition('WEAPON_MODEL:7').parent_scope_code).toBe('WEAPON')
    const directory = await h.index.directoryV3Groups(null)
    expect(directory?.release.native_cny).toBe(true)
    const page = await h.index.directoryV3ScopePages('MARKET', directory!.release.publication_id)
    const scope = page.scopes[0]!
    expect(scope.first_available_date).toBeNull()
    const from = indexFromForRange(scope.first_available_date, directory!.release.history_end, '3M')
    const series = await h.index.seriesV3Pages({ publication_id: directory!.release.publication_id,
      scope_token: scope.scope_token, from_date: from, to_date: directory!.release.history_end, after_date: null, limit: 92 })
    expect(series.response_kind).toBe('INDEX_SERIES')
    if (series.response_kind === 'ERROR') throw new Error()
    expect(series.points).toHaveLength(5)
    expect(series.scope.first_available_date).toBe('2025-04-01')
    const paths = fetcher.mock.calls.map(([path]) => String(path))
    expect(paths[0]).toBe('/api/v1/native-cny/index/day')
    expect(paths.find(path => path.includes('/index/history'))).toContain(`spec=${fixtureSpec}`)
    expect(paths.some(path => /\/api\/v[123]\/market-index\/.*\/points/u.test(path))).toBe(false)
    expect(paths.some(path => path.includes('market-descriptive'))).toBe(false)
  })
  it.each([404, 503, 200])('fails closed to the existing empty state for %s, with no old reads', async (status) => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(status === 200 ? {} :
      { api_contract: 'native-cny-index-day/1', error: status === 404 ? 'NOT_PUBLISHED' : 'TEMPORARILY_UNAVAILABLE' }),
    { status, headers: { 'Content-Type': 'application/json' } }))
    const h = harness(fetcher)
    expect(await h.descriptive.overview({ publication_id: null })).toMatchObject({ response_kind: 'ERROR', error: { code: 'NOT_PUBLISHED' } })
    expect(fetcher.mock.calls.every(([path]) => path === '/api/v1/native-cny/index/day')).toBe(true)
  })
  it('has a fixed default-on switch with explicit legacy rollback', () => {
    expect(nativeCnyMarketEnabled('1')).toBe(true)
    expect(nativeCnyMarketEnabled('')).toBe(true)
    expect(nativeCnyMarketEnabled('0')).toBe(false)
  })
})
