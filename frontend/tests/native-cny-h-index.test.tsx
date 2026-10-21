import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import wire from './fixtures/native-cny-v1-h-wire.json'
import { joinNativeHistoryChunks, nativeHistoryChunks, NATIVE_CNY_ALL_CHUNK_DAYS, NATIVE_CNY_ALL_START } from '../src/api/nativeCnyAllHistory'
import {
  mapNativeIndexPoint, nativeCoverage, NativeCnyMarketSectorIndexGateway, NativeCnyMarketSession,
} from '../src/api/NativeCnyMarketGateways'
import { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexHistory, v3DisclosureCopy, v3MethodCopy } from '../src/components/MarketSectorIndexHistory'
import { NativeCnyMarketDescriptiveGateway } from '../src/api/NativeCnyMarketGateways'
import { PublicMarketPage } from '../src/pages/PublicMarketPage'
import { indexMethodVariant, INDEX_DISCLOSURE_COPY, marketT, METHOD_NOTE_COPY } from '../src/pages/publicMarketCopy'
import type { PersonalWatchlistController } from '../src/watchlist/personalWatchlist'
import { LangProvider } from '../src/i18n'
import { canonicalHash } from '../src/wire/canonical'
import {
  decodeNativeCnyIndexResponse, isNativeCnyAdjacentReturnState, NATIVE_CNY_INDEX_METHOD, NATIVE_CNY_INDEX_METHOD_H,
  NativeCnyIndexWireError,
  type NativeCnyIndexPublicDay, type NativeCnyIndexPublicHistory, type NativeCnyIndexRequest,
} from '../src/wire/nativeCnyIndexPublicApi'
import type { MarketSectorIndexDirectoryReleaseV3 } from '../src/wire/marketSectorIndexPublicApiV3Types'
import { syntheticDay, syntheticFetch } from './native-cny-market-fixtures'

// The fixture is the backend generator's own output (gen_h_fixtures.py, kept with the frontend
// H-index package): NativeCnyPublicService day/history wire for V1, H, archive-period H and
// the deferred V2, after store.verified_projection + validate_public, plus single-field enum
// mutations of one published day with the backend validate_public verdict for each.
type WireSeries = { method: string; spec_sha256: string; day: unknown; history: Record<string, unknown> & {
  spec_sha256: string; scope: string; start_date: string; end_date: string } }
const W = wire as unknown as Record<'v1' | 'h' | 'v2' | 'h_archive', WireSeries> & { backend_commit: string;
  mutations: { base: 'v1' | 'h' | 'v2'; target: 'point' | 'data'; field: string; value: string | null; backend_accepts: boolean }[] }
const V2 = 'ROBUST_EQUAL_GEOMETRIC_NATIVE_CNY_V2'
const H_NUMERIC = 'FIXED_50_SIGNIFICANT_DECIMAL_DIGITS_CUMULATIVE_LOG_CHAIN_ROUND_HALF_EVEN_DISPLAY_ROUNDING'
const V1_SPEC_E2 = 'e21714af'

afterEach(cleanup)
const clone = <T,>(value: T): T => structuredClone(value)
const CURRENT: NativeCnyIndexRequest = { kind: 'CURRENT' }
const windowOf = (history: WireSeries['history']): NativeCnyIndexRequest => ({ kind: 'WINDOW',
  spec_sha256: history.spec_sha256, scope_code: history.scope, start_date: history.start_date, end_date: history.end_date })
function decodeDay(document: unknown) {
  const result = decodeNativeCnyIndexResponse(document, 200, CURRENT)
  if (result.kind !== 'DAY') throw new Error('Expected day')
  return result.day
}
function decodeHistory(document: WireSeries['history']) {
  const result = decodeNativeCnyIndexResponse(document, 200, windowOf(document))
  if (result.kind !== 'HISTORY') throw new Error('Expected history')
  return result.history
}

describe('backend generator wire: V1 and H both decode, V2 and unknown values fail closed', () => {
  it('is the backend output the package names', () => {
    expect(W.backend_commit).toBe('synthetic-h-generator')
    expect(W.v1.method).toBe(NATIVE_CNY_INDEX_METHOD)
    expect(W.h.method).toBe(NATIVE_CNY_INDEX_METHOD_H)
    expect(W.h_archive.method).toBe(NATIVE_CNY_INDEX_METHOD_H)
  })

  it.each(['v1', 'h'] as const)('decodes the backend %s /index/day and history unchanged', (label) => {
    const series = W[label]
    const day = decodeDay(clone(series.day))
    expect(day.data.method).toBe(series.method)
    expect(day.data.spec_sha256).toBe(series.spec_sha256)
    const history = decodeHistory(clone(series.history))
    expect(JSON.parse(JSON.stringify(history))).toEqual(series.history)
    expect(history.days.every((row) => row.data.method === series.method)).toBe(true)
  })

  it('decodes the H measured adjacent day with its own state, estimator and numeric rule', () => {
    const history = decodeHistory(clone(W.h.history))
    const [base, next] = history.days
    expect(base!.data.numeric_semantics).toBe(H_NUMERIC)
    expect(base!.data.points[0]!.state).toBe('NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN')
    expect(next!.data.points[0]!.state).toBe('ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN')
    expect(next!.data.points[0]!.effective_estimator).toBe('PRICE_TIER_BALANCED_H')
    expect(next!.data.points[0]!.index_display).toBe('998.93770376')
  })

  it('decodes archive-period H history as written by the backend history tool', () => {
    const history = decodeHistory(clone(W.h_archive.history))
    expect(history.days.map((row) => row.data.availability)).toEqual([
      'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND', 'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND'])
    expect(history.days[1]!.data.points[0]!.state).toBe('ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN')
  })

  it('rejects the deferred V2 day and history by policy, though the gateway accepts them', () => {
    expect(W.v2.method).toBe(V2)
    expect(() => decodeDay(clone(W.v2.day))).toThrow(NativeCnyIndexWireError)
    expect(() => decodeHistory(clone(W.v2.history))).toThrow(NativeCnyIndexWireError)
  })

  it('matches the backend verdict on every single-field enum mutation (V2 the one deliberate exception)', () => {
    expect(W.mutations.length).toBe(20)
    for (const mutation of W.mutations) {
      const document = clone(W[mutation.base].day) as { data: Record<string, unknown> & { points: Record<string, unknown>[] } }
      const target = mutation.target === 'point' ? document.data.points[0]! : document.data
      target[mutation.field] = mutation.value
      const expected = mutation.backend_accepts && mutation.value !== V2
      let accepted = true
      try { decodeDay(document) } catch (error) { expect(error).toBeInstanceOf(NativeCnyIndexWireError); accepted = false }
      expect([mutation, accepted]).toEqual([mutation, expected])
    }
  })

  it.each(['v1', 'h'] as const)('fails closed on unknown or inherited %s enum values', (label) => {
    const unknown: [('point' | 'data'), string, unknown][] = [
      ['data', 'method', 'ARITHMETIC_MEAN'], ['data', 'method', 'constructor'], ['data', 'method', '__proto__'],
      ['data', 'method', null], ['data', 'numeric_semantics', 'EXACT'], ['data', 'numeric_semantics', 'toString'],
      ['point', 'state', 'ADJACENT'], ['point', 'state', 'constructor'], ['point', 'effective_estimator', 'MEAN'],
      ['point', 'effective_estimator', 'hasOwnProperty'], ['point', 'effective_estimator', 1],
    ]
    for (const [where, field, value] of unknown) {
      const document = clone(W[label].day) as { data: Record<string, unknown> & { points: Record<string, unknown>[] } }
      ;(where === 'point' ? document.data.points[0]! : document.data)[field] = value
      expect(() => decodeDay(document), `${field}=${String(value)}`).toThrow(NativeCnyIndexWireError)
    }
  })

  it('keeps the archive-only unresolved state under H with its existing archive rule', () => {
    const document = clone(W.h_archive.history) as WireSeries['history'] & { days: { data: { points: Record<string, unknown>[] } }[] }
    Object.assign(document.days[1]!.data.points[0]!, { state: 'HISTORY_SCOPE_UNRESOLVED_ORIGINS', segment_number: 0,
      index_display: null, period_return_display: null })
    expect(decodeHistory(document).days[1]!.data.points[0]!.state).toBe('HISTORY_SCOPE_UNRESOLVED_ORIGINS')
    const live = clone(W.h.history) as WireSeries['history'] & { days: { data: { points: Record<string, unknown>[] } }[] }
    Object.assign(live.days[1]!.data.points[0]!, { state: 'HISTORY_SCOPE_UNRESOLVED_ORIGINS', segment_number: 0,
      index_display: null, period_return_display: null })
    expect(() => decodeHistory(live)).toThrow(NativeCnyIndexWireError)
  })

  it('rejects one history answer that mixes V1 and H days under one spec', () => {
    const document = clone(W.h.history) as WireSeries['history'] & { days: { data: Record<string, unknown> }[] }
    const v1 = clone(W.v1.history) as typeof document
    const day = v1.days[0]!
    day.data.spec_sha256 = document.spec_sha256
    document.days[0] = day
    expect(() => decodeHistory(document)).toThrow(NativeCnyIndexWireError)
    // The same V1 day alone under that spec is a well-formed one-method answer.
    expect(decodeHistory({ ...document, end_date: document.start_date, days: [day] }).days[0]!.data.method)
      .toBe(NATIVE_CNY_INDEX_METHOD)
  })

  it('rejects All chunks that join different methods', () => {
    const h = decodeHistory(clone(W.h.history))
    const v1Doc = clone(W.v1.history) as WireSeries['history'] & { days: { data: Record<string, unknown> }[] }
    for (const row of v1Doc.days) row.data.spec_sha256 = h.spec_sha256
    const v1 = decodeHistory({ ...v1Doc, spec_sha256: h.spec_sha256 })
    const first: NativeCnyIndexPublicHistory = { ...v1, start_date: '2026-09-27', end_date: '2026-09-27', days: [v1.days[0]!] }
    const second: NativeCnyIndexPublicHistory = { ...h, start_date: '2026-09-28', end_date: '2026-09-28', days: [h.days[1]!] }
    const chunks = [{ start: '2026-09-27', end: '2026-09-27' }, { start: '2026-09-28', end: '2026-09-28' }]
    expect(() => joinNativeHistoryChunks([first, second], chunks, h.spec_sha256, 'ALL')).toThrow('Inconsistent All window day')
    const same: NativeCnyIndexPublicHistory = { ...h, start_date: '2026-09-27', end_date: '2026-09-27', days: [h.days[0]!] }
    expect(joinNativeHistoryChunks([same, second], chunks, h.spec_sha256, 'ALL').days).toHaveLength(2)
  })
})

describe('H presentation: adjacent returns connect, coverage and method copy follow the live method', () => {
  it('treats the H adjacent state as the measured return state, like V1', () => {
    const [base, next] = decodeHistory(clone(W.h.history)).days
    expect(isNativeCnyAdjacentReturnState('ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN')).toBe(true)
    expect(isNativeCnyAdjacentReturnState('ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN')).toBe(true)
    expect(isNativeCnyAdjacentReturnState('NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN')).toBe(false)
    const point = mapNativeIndexPoint(next!, base)
    expect(point.connect_to_previous).toBe(true)
    expect(point.index.period_return).toBe(next!.data.points[0]!.period_return_display)
    expect(point.index.effective_estimator).toBe('PRICE_TIER_BALANCED_H')
    expect(nativeCoverage(next!.data.points[0]!)).toBe('HIGH')
    expect(mapNativeIndexPoint(base!).index.period_return).toBeNull()
  })

  it('names the live series from the release method and never flashes V1 on a native page', () => {
    const release = (method?: string) => ({ native_cny: true, native_method: method } as unknown as MarketSectorIndexDirectoryReleaseV3)
    expect(v3MethodCopy(release(NATIVE_CNY_INDEX_METHOD_H), true)).toBe('indexMethodNameH')
    expect(v3MethodCopy(release(NATIVE_CNY_INDEX_METHOD), true)).toBe('indexMethodName')
    expect(v3MethodCopy(null, true)).toBeNull()
    expect(v3MethodCopy(null, false)).toBe('indexMethodName')
  })

  it('method note and disclosure follow the runtime method: V1, H, or neutral while unknown', () => {
    expect(indexMethodVariant(false, undefined)).toBe('V1')
    expect(indexMethodVariant(true, NATIVE_CNY_INDEX_METHOD)).toBe('V1')
    expect(indexMethodVariant(true, NATIVE_CNY_INDEX_METHOD_H)).toBe('H')
    expect(indexMethodVariant(true, undefined)).toBe('NEUTRAL')
    expect(indexMethodVariant(true, V2)).toBe('NEUTRAL')
    expect(v3DisclosureCopy('indexMethodNameH')).toBe('indexDisclosureH')
    expect(v3DisclosureCopy('indexMethodName')).toBe('indexDisclosure')
    expect(v3DisclosureCopy(null)).toBe('indexDisclosureNeutral')
    for (const lang of ['zh', 'en'] as const) {
      const h = lang === 'zh' ? '价格分层平衡几何' : 'price-tier balanced'
      const robust = lang === 'zh' ? '稳健等权' : 'robust equal-weight'
      const equal = lang === 'zh' ? '每个可用成员等权' : 'Each available member has equal weight'
      for (const key of [METHOD_NOTE_COPY.NEUTRAL, INDEX_DISCLOSURE_COPY.NEUTRAL]) {
        expect(marketT(key, lang).toLowerCase()).not.toContain(h)
        expect(marketT(key, lang)).not.toContain(robust)
        expect(marketT(key, lang)).not.toContain(equal)
      }
      expect(marketT(METHOD_NOTE_COPY.V1, lang)).toContain(equal)
      expect(marketT(INDEX_DISCLOSURE_COPY.V1, lang)).toContain(robust)
      expect(marketT(METHOD_NOTE_COPY.H, lang).toLowerCase()).toContain(h)
      expect(marketT(INDEX_DISCLOSURE_COPY.H, lang).toLowerCase()).toContain(h)
      for (const key of [METHOD_NOTE_COPY.H, INDEX_DISCLOSURE_COPY.H]) expect(marketT(key, lang)).not.toContain(robust)
      for (const key of [METHOD_NOTE_COPY.V1, INDEX_DISCLOSURE_COPY.V1]) expect(marketT(key, lang).toLowerCase()).not.toContain(h)
    }
  })
})

// ---- the main chart: spec only from /index/day, through the real HTTP gateways ----

const shift = (date: string, n: number) => new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10)
const span = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86400000 + 1
const END = '2026-10-10'
function liveDay(date: string, method: 'V1' | 'H', spec: string): NativeCnyIndexPublicDay {
  const sample = syntheticDay(4, ['ALL']), base = date === '2026-09-27'
  const h = method === 'H'
  return { ...sample, publication_id: canonicalHash({ date, method }), released_at: date + 'T23:59:00Z',
    data: { ...sample.data, bucket_date: date, measured_at: date + 'T23:55:00Z', spec_sha256: spec,
      method: h ? NATIVE_CNY_INDEX_METHOD_H : NATIVE_CNY_INDEX_METHOD,
      numeric_semantics: h ? H_NUMERIC : sample.data.numeric_semantics,
      availability: date < '2026-09-27' ? 'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND' : 'CONTEMPORANEOUS_EOD_NOT_ARCHIVE_LAST_OBSERVATION',
      points: sample.data.points.map((p) => ({ ...p, segment_number: date < '2026-09-27' ? 1 : 2,
        period_return_display: base ? null : '0.01000000',
        state: base ? 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN' as const
          : h ? 'ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN' as const : 'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN' as const,
        effective_estimator: h ? 'PRICE_TIER_BALANCED_H' as const : 'SYMMETRIC_1_PERCENT_WINSOR' as const })) } }
}
function harness(method: 'V1' | 'H', spec: string) {
  const requests: URL[] = []
  const fetcher: typeof fetch = async (input) => {
    const url = new URL(String(input), 'http://localhost')
    let payload: unknown
    if (url.pathname.endsWith('/index/day')) payload = liveDay(END, method, spec)
    else if (url.pathname.endsWith('/index/history')) {
      requests.push(url)
      const start = url.searchParams.get('start')!, end = url.searchParams.get('end')!
      const days: NativeCnyIndexPublicDay[] = []
      for (let date = start; date <= end; date = shift(date, 1)) days.push(liveDay(date, method, spec))
      // The answer carries the published spec: a request under any other spec cannot decode.
      payload = { api_contract: 'native-cny-index-history/1', spec_sha256: spec, scope: url.searchParams.get('scope'),
        start_date: start, end_date: end, currency: 'CNY', fx_applied: false, days, missing_publication_dates: [],
        missing_prices_filled: false, calculation_revisions_mixed: false }
    } else return syntheticFetch(input)
    return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } })
  }
  const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
  const gateway = new NativeCnyMarketSectorIndexGateway(session)
  return { requests, session, gateway, api: new MarketSectorIndexPublicApi(gateway) }
}

describe('the main chart reads history under the /index/day spec, before and after the selector switch', () => {
  it.each([['V1', W.v1.spec_sha256], ['H', W.h.spec_sha256]] as const)(
    '%s: window, 1Y and All requests all carry the published spec; All stays in 92-day chunks', async (method, spec) => {
      const { requests, session } = harness(method, spec)
      const day = await session.day(null)
      expect(day.data.spec_sha256).toBe(spec)
      const window = await session.history(day, 'ALL', shift(END, -91), END)
      const year = await session.history(day, 'ALL', shift(END, -365), END)
      const all = await session.allHistory(day, 'ALL')
      expect(window.days.length + year.days.length).toBe(92 + 366)
      expect(all.start_date).toBe(NATIVE_CNY_ALL_START)
      expect(all.end_date).toBe(END)
      expect(all.days.every((row) => row.data.method === day.data.method)).toBe(true)
      const chunks = nativeHistoryChunks(NATIVE_CNY_ALL_START, END)
      expect(requests).toHaveLength(2 + chunks.length)
      for (const url of requests) {
        expect(url.searchParams.get('spec')).toBe(spec)
        expect(url.search).not.toContain(V1_SPEC_E2)
        expect(span(url.searchParams.get('start')!, url.searchParams.get('end')!)).toBeLessThanOrEqual(366)
      }
      for (const url of requests.slice(2)) {
        expect(span(url.searchParams.get('start')!, url.searchParams.get('end')!)).toBeLessThanOrEqual(NATIVE_CNY_ALL_CHUNK_DAYS)
      }
      // H adjacent days connect and show their return, exactly as V1 days do.
      const points = all.days.map((row, index) => mapNativeIndexPoint(row, all.days[index - 1]))
      const last = points.at(-1)!
      expect(last.connect_to_previous).toBe(true)
      expect(last.index.period_return).toBe('0.01000000')
    })

  it.each([
    ['zh', 'H', '正式序列：价格分层平衡几何指数（H）'],
    ['en', 'H', 'Official series: Price-tier balanced geometric index (H)'],
    ['zh', 'V1', '正式序列：稳健等权（ROBUST_EQUAL_V3）'],
    ['en', 'V1', 'Official series: Robust equal weight (ROBUST_EQUAL_V3)'],
  ] as const)('%s %s page names its live method on the method line under the market index title', async (lang, method, shown) => {
    const { gateway, api, requests } = harness(method, method === 'H' ? W.h.spec_sha256 : W.v1.spec_sha256)
    render(<LangProvider lang={lang}><MarketSectorIndexHistory gateway={gateway} api={api} scopeCode="ALL" /></LangProvider>)
    await screen.findByText('10,303.01')
    const panel = screen.getByTestId('market-sector-index-history')
    // The method line and the disclosure both follow the live method (FH-04); the title is method-free.
    expect(panel.querySelectorAll('.public-market-board__method')).toHaveLength(1)
    expect(panel.querySelector('.public-market-board__method')!.textContent).toBe(shown)
    expect(panel).toHaveTextContent(lang === 'zh' ? '市场指数与历史轨迹' : 'Market index and history')
    // No empty raw/robust equal-weight rows on the native page, whichever method is live.
    expect(panel).not.toHaveTextContent(lang === 'zh' ? '等权日涨跌' : 'equal-weight daily return')
    const disclosure = panel.querySelector('.public-market-index__disclosure')!.textContent
    expect(disclosure).toBe(marketT(method === 'H' ? 'indexDisclosureH' : 'indexDisclosure', lang))
    expect(panel).not.toHaveTextContent(marketT(method === 'H' ? 'indexDisclosure' : 'indexDisclosureH', lang))
    expect(requests.every((url) => url.searchParams.get('spec') === (method === 'H' ? W.h.spec_sha256 : W.v1.spec_sha256))).toBe(true)
  })

  it.each([['zh', 'V1'], ['en', 'V1'], ['zh', 'H'], ['en', 'H']] as const)(
    '%s %s market page: the summary method note follows the /index/day method', async (lang, method) => {
      const { gateway, api, session } = harness(method, method === 'H' ? W.h.spec_sha256 : W.v1.spec_sha256)
      render(<LangProvider lang={lang}><PublicMarketPage gateway={new NativeCnyMarketDescriptiveGateway(session)}
        indexGateway={gateway} indexApi={api} publicationId={null} scopeToken={null} catalogHref="/catalog"
        onCatalogClick={() => {}} onSelectPublication={() => {}} onOpenScope={() => {}} onCloseScope={() => {}}
        personalWatchlist={WATCHLIST} cnyPerUsd="7" requestedView="MARKET" /></LangProvider>)
      await screen.findByText('10,303.01')
      const note = document.querySelector('.public-market__method-note')!.textContent
      expect(note).toBe(marketT(method === 'H' ? 'methodNoteH' : 'methodNote', lang))
      expect(document.body).not.toHaveTextContent(marketT(method === 'H' ? 'methodNote' : 'methodNoteH', lang))
      expect(document.querySelector('.public-market-index__disclosure')!.textContent)
        .toBe(marketT(method === 'H' ? 'indexDisclosureH' : 'indexDisclosure', lang))
    })
})

const WATCHLIST = Object.freeze({ status: 'READY', entries: Object.freeze([]), pendingKeys: new Set<string>(),
  error: null, has: () => false, toggle: async () => {}, addMany: async () => 0, remove: async () => {},
  clear: async () => {}, importJson: async () => 0, exportJson: () => '', reload: () => {} }) as unknown as PersonalWatchlistController
