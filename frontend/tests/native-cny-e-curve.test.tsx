import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import wire from './fixtures/native-cny-v1-h-e-wire.json'
import {
  joinNativeHistoryChunksWithEdges, nativeHistoryChunks, NATIVE_CNY_ALL_CHUNK_DAYS, NATIVE_CNY_ALL_START,
} from '../src/api/nativeCnyAllHistory'
import { nativeCnyECurveSpec, nativeCnyECurveSpecProblem } from '../src/api/nativeCnyECurveConfig'
import { NativeCnyMarketSectorIndexGateway, NativeCnyMarketSession } from '../src/api/NativeCnyMarketGateways'
import { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexHistory, secondaryWindowPoints } from '../src/components/MarketSectorIndexHistory'
import { axisTooltip, SECONDARY_SERIES_ID_PREFIX } from '../src/components/PublicMarketIndexEcharts'
import { LangProvider } from '../src/i18n'
import { canonicalHash } from '../src/wire/canonical'
import {
  decodeNativeCnyIndexResponse, NATIVE_CNY_INDEX_METHOD, NATIVE_CNY_INDEX_METHOD_E, NATIVE_CNY_INDEX_METHOD_H,
  NativeCnyIndexWireError, type NativeCnyIndexPublicDay, type NativeCnyIndexPublicHistory, type NativeCnyIndexRequest,
} from '../src/wire/nativeCnyIndexPublicApi'
import type { MarketSectorIndexPoint } from '../src/wire/marketSectorIndexPublicApiTypes'
import { fixtureCodes, syntheticDay, syntheticFetch } from './native-cny-market-fixtures'

// The fixture is the backend generator's own output (gen_e_fixtures.py, kept with the frontend
// E-curve package): NativeCnyPublicService day/history wire for V1, H, E and the deferred V2,
// archive-period H and E, the gateway's E answers for a lagging tail and for NOT_PUBLISHED, and
// single-field enum mutations with the backend validate_public verdict for each.
type HistoryDoc = Record<string, unknown> & { spec_sha256: string; scope: string; start_date: string; end_date: string
  days: { publication_id: string; data: Record<string, unknown> & { bucket_date: string; points: Record<string, unknown>[] } }[]
  missing_publication_dates: string[] }
type DayDoc = { publication_id: string; data: Record<string, unknown> & { spec_sha256: string; bucket_date: string
  points: Record<string, unknown>[] } }
type WireSeries = { method: string; spec_sha256: string; day: DayDoc; history: HistoryDoc; scopes: string[] }
type ESeries = WireSeries & { history_tail: [number, HistoryDoc]; not_published: [number, unknown]; scope_not_published: [number, unknown] }
const W = wire as unknown as Record<'v1' | 'h' | 'v2', WireSeries> & { e: ESeries; backend_commit: string
  h_archive: WireSeries; e_archive: WireSeries
  mutations: { base: 'v1' | 'h' | 'v2' | 'e'; target: 'point' | 'data'; field: string; value: string | null; backend_accepts: boolean }[] }
const V2 = 'ROBUST_EQUAL_GEOMETRIC_NATIVE_CNY_V2'
const GEO_NUMERIC = 'FIXED_50_SIGNIFICANT_DECIMAL_DIGITS_CUMULATIVE_LOG_CHAIN_ROUND_HALF_EVEN_DISPLAY_ROUNDING'
const E_SPEC = W.e.spec_sha256
const H_SPEC = W.h.spec_sha256

afterEach(cleanup)
const clone = <T,>(value: T): T => structuredClone(value)
const windowOf = (history: { spec_sha256: string; scope: string; start_date: string; end_date: string }): NativeCnyIndexRequest => ({
  kind: 'WINDOW', spec_sha256: history.spec_sha256, scope_code: history.scope, start_date: history.start_date, end_date: history.end_date })
function decodeHistory(document: HistoryDoc) {
  const result = decodeNativeCnyIndexResponse(document, 200, windowOf(document))
  if (result.kind !== 'HISTORY') throw new Error('Expected history')
  return result.history
}
/** One published day as a one-day history answer: the only way an E day is ever read. */
function oneDayHistory(day: DayDoc): HistoryDoc {
  const scope = String(day.data.points[0]!.scope_code)
  const data = { ...day.data, points: day.data.points.filter((point) => point.scope_code === scope) }
  return { api_contract: 'native-cny-index-history/1', spec_sha256: day.data.spec_sha256, scope,
    start_date: day.data.bucket_date, end_date: day.data.bucket_date, currency: 'CNY', fx_applied: false,
    days: [{ ...day, data }], missing_publication_dates: [], missing_prices_filled: false, calculation_revisions_mixed: false }
}

describe('backend generator wire: E decodes as history only, V2 still fails closed', () => {
  it('is the backend output the package names, with E on its own spec', () => {
    expect(W.backend_commit).toBe('synthetic-h-e-generator')
    expect(W.e.method).toBe(NATIVE_CNY_INDEX_METHOD_E)
    expect(W.e_archive.method).toBe(NATIVE_CNY_INDEX_METHOD_E)
    expect(W.h.method).toBe(NATIVE_CNY_INDEX_METHOD_H)
    expect(E_SPEC).not.toBe(H_SPEC)
    expect(W.e.scopes).toEqual(W.h.scopes)
  })

  it('decodes backend E history and archive-period E history unchanged', () => {
    const history = decodeHistory(clone(W.e.history))
    expect(JSON.parse(JSON.stringify(history))).toEqual(W.e.history)
    const [base, next] = history.days
    expect(base!.data.method).toBe(NATIVE_CNY_INDEX_METHOD_E)
    expect(base!.data.numeric_semantics).toBe(GEO_NUMERIC)
    // E's first contemporaneous day starts a new segment (the 9/27 step, as H).
    expect(base!.data.points[0]!.state).toBe('NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN')
    expect(base!.data.points[0]!.index_display).toBe('999.16631888')
    expect(next!.data.points[0]!.state).toBe('ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN')
    expect(next!.data.points[0]!.index_display).toBe('999.82639768')
    const archive = decodeHistory(clone(W.e_archive.history))
    expect(archive.days.map((row) => row.data.points[0]!.state)).toEqual([
      'ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN', 'ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN'])
  })

  it('never accepts E from /index/day: CURRENT and pinned DAY answers carrying E are rejected', () => {
    expect(() => decodeNativeCnyIndexResponse(clone(W.e.day), 200, { kind: 'CURRENT' })).toThrow(NativeCnyIndexWireError)
    const pinned: NativeCnyIndexRequest = { kind: 'DAY', publication_id: W.e.day.publication_id, spec_sha256: E_SPEC,
      scope_code: 'ALL', bucket_date: W.e.day.data.bucket_date }
    expect(() => decodeNativeCnyIndexResponse(clone(W.e.day), 200, pinned)).toThrow(NativeCnyIndexWireError)
    // The same H and V1 days remain valid selector answers.
    for (const label of ['v1', 'h'] as const) {
      const result = decodeNativeCnyIndexResponse(clone(W[label].day), 200, { kind: 'CURRENT' })
      expect(result.kind).toBe('DAY')
    }
  })

  it('reads the lagging E tail and both NOT_PUBLISHED answers exactly as the gateway sends them', () => {
    const [status, tail] = W.e.history_tail
    expect(status).toBe(200)
    const history = decodeHistory(clone(tail))
    expect(history.days.map((row) => row.data.bucket_date)).toEqual(['2026-09-27', '2026-09-28'])
    expect(history.missing_publication_dates).toEqual(['2026-09-29', '2026-09-30'])
    for (const [code, body] of [W.e.not_published, W.e.scope_not_published]) {
      expect(code).toBe(404)
      const result = decodeNativeCnyIndexResponse(clone(body), 404, windowOf(W.e.history))
      expect(result).toMatchObject({ kind: 'ERROR', error: 'NOT_PUBLISHED' })
    }
  })

  it('matches the backend verdict on all 38 single-field mutations (V2 the one deliberate exception)', () => {
    expect(W.mutations.length).toBe(38)
    for (const mutation of W.mutations) {
      const day = clone(W[mutation.base].day)
      const target = mutation.target === 'point' ? day.data.points[0]! : day.data
      target[mutation.field] = mutation.value
      const expected = mutation.backend_accepts && mutation.value !== V2
      let accepted = true
      try { decodeHistory(oneDayHistory(day)) } catch (error) { expect(error).toBeInstanceOf(NativeCnyIndexWireError); accepted = false }
      expect([mutation, accepted]).toEqual([mutation, expected])
    }
  })

  it('rejects the deferred V2 and an unknown E version, keeps E estimators bound to E', () => {
    expect(() => decodeHistory(clone(W.v2.history))).toThrow(NativeCnyIndexWireError)
    const day = clone(W.e.day)
    day.data.method = 'EQUAL_GEOMETRIC_COHORT_NATIVE_CNY_V2'
    expect(() => decodeHistory(oneDayHistory(day))).toThrow(NativeCnyIndexWireError)
    const h = clone(W.h.day)
    h.data.points[0]!.effective_estimator = 'EQUAL_GEOMETRIC_COHORT_NO_WINSOR'
    expect(() => decodeHistory(oneDayHistory(h))).toThrow(NativeCnyIndexWireError)
  })
})

describe('E build constant and hide switch', () => {
  const spec = 'a'.repeat(64)
  it('is fail-closed: unset, empty or malformed hides E', () => {
    for (const value of [undefined, '', 'A'.repeat(64), 'a'.repeat(63), 'a'.repeat(65), ` ${spec}`, 'g'.repeat(64)]) {
      expect(nativeCnyECurveSpec(value, undefined)).toBeNull()
    }
    expect(nativeCnyECurveSpec(spec, undefined)).toBe(spec)
    expect(nativeCnyECurveSpec(spec, '1')).toBe(spec)
  })
  it('hides E by the rollback flag while the spec stays set', () => {
    expect(nativeCnyECurveSpec(spec, '0')).toBeNull()
    expect(nativeCnyECurveSpec(spec, 'false')).toBeNull()
  })
  it('names a set but malformed spec so the public build refuses it', () => {
    expect(nativeCnyECurveSpecProblem(undefined)).toBeNull()
    expect(nativeCnyECurveSpecProblem('')).toBeNull()
    expect(nativeCnyECurveSpecProblem(spec)).toBeNull()
    expect(nativeCnyECurveSpecProblem('A'.repeat(64))).toMatch(/VITE_NATIVE_CNY_E_SPEC/u)
  })
  it('the test build carries no E spec (E is hidden unless set at build time)', () => {
    expect(nativeCnyECurveSpec()).toBeNull()
  })
})

// ---- a live H page with a lagging E, through the real HTTP gateways ----

const shift = (date: string, n: number) => new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10)
const span = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86400000 + 1
const END = '2026-10-10'
const STEP = '2026-09-27'
type Curve = 'V1' | 'H' | 'E'
function liveDay(date: string, curve: Curve, spec: string, codes: readonly string[], nullIndex = false,
  methodOverride?: Curve): NativeCnyIndexPublicDay {
  const sample = syntheticDay(4, [...codes]), base = date === STEP
  const method = methodOverride ?? curve
  const geometric = method !== 'V1'
  return { ...sample, publication_id: canonicalHash({ date, curve }), released_at: date + 'T23:59:00Z',
    data: { ...sample.data, bucket_date: date, measured_at: date + 'T23:55:00Z', spec_sha256: spec,
      method: method === 'E' ? NATIVE_CNY_INDEX_METHOD_E : method === 'H' ? NATIVE_CNY_INDEX_METHOD_H : NATIVE_CNY_INDEX_METHOD,
      numeric_semantics: geometric ? GEO_NUMERIC : sample.data.numeric_semantics,
      availability: date < STEP ? 'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND' : 'CONTEMPORANEOUS_EOD_NOT_ARCHIVE_LAST_OBSERVATION',
      points: sample.data.points.map((p) => ({ ...p, segment_number: date < STEP ? 1 : 2,
        index_display: nullIndex ? null : curve === 'E' ? '9990.12000000' : p.index_display,
        period_return_display: base || nullIndex ? null : '0.01000000',
        state: nullIndex ? 'BELOW_MINIMUM_INTERPRETABLE_COVERAGE' as const
          : base ? 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN' as const
          : geometric ? 'ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN' as const : 'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN' as const,
        effective_estimator: nullIndex ? null : method === 'E' ? 'EQUAL_GEOMETRIC_COHORT_NO_WINSOR' as const
          : method === 'H' ? 'PRICE_TIER_BALANCED_H' as const : 'SYMMETRIC_1_PERCENT_WINSOR' as const })) } }
}
const NOT_PUBLISHED = { api_contract: 'native-cny-index-day/1', error: 'NOT_PUBLISHED' }
type EOptions = {
  first?: string; latest?: string; absentScopes?: readonly string[]; nullDates?: readonly string[]
  /** Window starts that answer NOT_PUBLISHED although rows exist (an unappended interior chunk). */
  holes?: readonly string[]
  mode?: 'OK' | 'SERVER_ERROR' | 'UNAVAILABLE' | 'GARBAGE' | 'WRONG_METHOD'
}
function harness(method: 'V1' | 'H', eSpec: string | null, e: EOptions = {}) {
  const spec = method === 'H' ? H_SPEC : W.v1.spec_sha256
  const { first = '2022-12-25', latest = shift(END, -3), absentScopes = [], nullDates = [], holes = [], mode = 'OK' } = e
  const requests: URL[] = []
  const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status,
    headers: { 'Content-Type': 'application/json', ...(status === 200 ? {} : { 'Cache-Control': 'no-store' }) } })
  const fetcher: typeof fetch = async (input) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname.endsWith('/index/day')) { requests.push(url); return json(liveDay(END, method, spec, fixtureCodes)) }
    if (!url.pathname.endsWith('/index/history')) return syntheticFetch(input)
    requests.push(url)
    const q = url.searchParams, start = q.get('start')!, end = q.get('end')!, scope = q.get('scope')!
    const days: NativeCnyIndexPublicDay[] = [], missing: string[] = []
    if (q.get('spec') === E_SPEC) {
      if (mode === 'SERVER_ERROR') return new Response('<html>502 Bad Gateway</html>', { status: 502, headers: { 'Cache-Control': 'no-store' } })
      if (mode === 'UNAVAILABLE') return json({ api_contract: 'native-cny-index-day/1', error: 'TEMPORARILY_UNAVAILABLE' }, 503)
      if (mode === 'GARBAGE') return json({ api_contract: 'native-cny-index-history/1', days: 'x' })
      for (let date = start; date <= end; date = shift(date, 1)) {
        if (date < first || date > latest) missing.push(date)
        else days.push(liveDay(date, 'E', E_SPEC, [scope], nullDates.includes(date), mode === 'WRONG_METHOD' ? 'H' : undefined))
      }
      // The gateway's NOT_PUBLISHED: no E row of this scope in the window (Worker passes it through, no-store).
      if (days.length === 0 || absentScopes.includes(scope) || holes.includes(start)) return json(NOT_PUBLISHED, 404)
    } else if (q.get('spec') === spec) {
      for (let date = start; date <= end; date = shift(date, 1)) days.push(liveDay(date, method, spec, [scope]))
    } else return json(NOT_PUBLISHED, 404)
    return json({ api_contract: 'native-cny-index-history/1', spec_sha256: q.get('spec'), scope, start_date: start, end_date: end,
      currency: 'CNY', fx_applied: false, days, missing_publication_dates: missing,
      missing_prices_filled: false, calculation_revisions_mixed: false })
  }
  const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
  const gateway = new NativeCnyMarketSectorIndexGateway(session, eSpec)
  const eRequests = () => requests.filter((url) => url.searchParams.get('spec') === E_SPEC)
  const mainRequests = () => requests.filter((url) => url.pathname.endsWith('/index/history') && url.searchParams.get('spec') !== E_SPEC)
  return { requests, eRequests, mainRequests, session, gateway, api: new MarketSectorIndexPublicApi(gateway) }
}
const read = (h: ReturnType<typeof harness>, from: string, to = END, scope = 'ALL') =>
  h.gateway.readNativeSecondarySeries({ scope_code: scope, from_date: from, to_date: to })

describe('the E read: its own spec, history only, ending at its own latest day', () => {
  it('reads a window under the E spec, never /index/day, and stops at E latest (the tail is not a gap)', async () => {
    const h = harness('H', E_SPEC)
    const curve = await read(h, shift(END, -91))
    expect(h.requests.some((url) => url.pathname.endsWith('/index/day'))).toBe(false)
    expect(h.eRequests()).toHaveLength(1)
    expect(h.eRequests()[0]!.searchParams.get('end')).toBe(END)
    expect(curve).not.toBeNull()
    expect(curve!.method).toBe(NATIVE_CNY_INDEX_METHOD_E)
    expect(curve!.spec_sha256).toBe(E_SPEC)
    expect(curve!.latest_date).toBe(shift(END, -3))
    expect(curve!.points.at(-1)!.date).toBe(shift(END, -3))
    expect(curve!.points.every((point) => point.date <= curve!.latest_date)).toBe(true)
    expect(curve!.points).toHaveLength(92 - 3)
    // 9/27 is E's new segment: it never connects to 9/26.
    const step = curve!.points.find((point) => point.date === STEP)!
    expect(step.connect_to_previous).toBe(false)
    expect(curve!.points.find((point) => point.date === shift(STEP, 1))!.connect_to_previous).toBe(true)
  })

  it('reads the backend lagging tail answer and keeps only its rows', async () => {
    const [, tail] = W.e.history_tail
    const fetcher: typeof fetch = async () => new Response(JSON.stringify(tail), { headers: { 'Content-Type': 'application/json' } })
    const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
    const curve = await new NativeCnyMarketSectorIndexGateway(session, E_SPEC)
      .readNativeSecondarySeries({ scope_code: 'ALL', from_date: '2026-09-27', to_date: '2026-09-30' })
    expect(curve!.latest_date).toBe('2026-09-28')
    expect(curve!.points.map((point) => [point.date, point.index.value])).toEqual([
      ['2026-09-27', '999.16631888'], ['2026-09-28', '999.82639768']])
  })

  it.each([['window', 'not_published'], ['scope', 'scope_not_published']] as const)(
    'treats the backend %s NOT_PUBLISHED as no E (null), not as an error', async (_, key) => {
      const [status, body] = W.e[key]
      const fetcher: typeof fetch = async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
      const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
      expect(await session.specHistory(E_SPEC, NATIVE_CNY_INDEX_METHOD_E, 'ALL', '2026-10-01', '2026-10-05')).toBeNull()
      expect(await new NativeCnyMarketSectorIndexGateway(session, E_SPEC)
        .readNativeSecondarySeries({ scope_code: 'ALL', from_date: '2026-10-01', to_date: '2026-10-05' })).toBeNull()
    })

  it.each(['SERVER_ERROR', 'UNAVAILABLE', 'GARBAGE', 'WRONG_METHOD'] as const)('hides E on %s without throwing', async (mode) => {
    const h = harness('H', E_SPEC, { mode })
    expect(await read(h, shift(END, -91))).toBeNull()
    expect(h.eRequests()).toHaveLength(1)
  })

  it('makes no E request when the build has no E spec or the hide switch is set', async () => {
    for (const eSpec of [null, nativeCnyECurveSpec(E_SPEC, '0')]) {
      const h = harness('H', eSpec)
      expect(await read(h, shift(END, -91))).toBeNull()
      expect(h.eRequests()).toHaveLength(0)
    }
  })

  it('reads All for E in <= 92-day chunks under the E spec; unappended edge chunks are missing days', async () => {
    const chunks = nativeHistoryChunks(NATIVE_CNY_ALL_START, END)
    const first = shift(chunks[2]!.start, 5), latest = chunks.at(-2)!.end
    const h = harness('H', E_SPEC, { first, latest })
    const curve = await read(h, NATIVE_CNY_ALL_START)
    expect(h.eRequests()).toHaveLength(chunks.length)
    for (const url of h.eRequests()) {
      expect(span(url.searchParams.get('start')!, url.searchParams.get('end')!)).toBeLessThanOrEqual(NATIVE_CNY_ALL_CHUNK_DAYS)
    }
    expect(curve!.points[0]!.date).toBe(first)
    expect(curve!.latest_date).toBe(latest)
    expect(curve!.points).toHaveLength(span(first, latest))
  })

  it('hides All E when an interior chunk is not published', async () => {
    const chunks = nativeHistoryChunks(NATIVE_CNY_ALL_START, END)
    const h = harness('H', E_SPEC, { holes: [chunks[5]!.start] })
    expect(await read(h, NATIVE_CNY_ALL_START)).toBeNull()
  })

  it('joins edge-unpublished chunks and refuses an interior one', () => {
    const e = decodeHistory(clone(W.e.history))
    const chunks = [{ start: '2026-09-25', end: '2026-09-26' }, { start: '2026-09-27', end: '2026-09-28' },
      { start: '2026-09-29', end: '2026-09-30' }]
    const joined = joinNativeHistoryChunksWithEdges([null, e, null], chunks, E_SPEC, 'ALL')!
    expect(joined.start_date).toBe('2026-09-25')
    expect(joined.end_date).toBe('2026-09-30')
    expect(joined.days.map((row) => row.data.bucket_date)).toEqual(['2026-09-27', '2026-09-28'])
    expect(joined.missing_publication_dates).toEqual(['2026-09-25', '2026-09-26', '2026-09-29', '2026-09-30'])
    expect(joinNativeHistoryChunksWithEdges([null, null, null], chunks, E_SPEC, 'ALL')).toBeNull()
    const late: NativeCnyIndexPublicHistory = { ...e, start_date: '2026-09-29', end_date: '2026-09-30', days: [],
      missing_publication_dates: ['2026-09-29', '2026-09-30'] }
    const early: NativeCnyIndexPublicHistory = { ...e, start_date: '2026-09-25', end_date: '2026-09-26', days: [],
      missing_publication_dates: ['2026-09-25', '2026-09-26'] }
    expect(() => joinNativeHistoryChunksWithEdges([early, null, late], chunks, E_SPEC, 'ALL')).toThrow('Unpublished interior')
  })
})

describe('E presentation helpers', () => {
  const point = (date: string) => ({ date }) as MarketSectorIndexPoint
  it('keeps E inside the displayed main window and at or before E latest', () => {
    const main = ['2026-09-20', '2026-09-25', '2026-09-30'].map(point)
    const curve = { method: NATIVE_CNY_INDEX_METHOD_E, spec_sha256: E_SPEC, scope_code: 'ALL', latest_date: '2026-09-28',
      points: ['2026-09-19', '2026-09-20', '2026-09-28', '2026-09-29', '2026-10-01'].map(point) } as const
    expect(secondaryWindowPoints(curve, main).map((p) => p.date)).toEqual(['2026-09-20', '2026-09-28'])
    expect(secondaryWindowPoints(null, main)).toEqual([])
    expect(secondaryWindowPoints(curve, [])).toEqual([])
  })
  it('prints each curve its own published value in the shared tooltip', () => {
    const date = '2026-09-28'
    const disclosure = (nativeIndexDisplay: string) => ({ date, nativeIndexDisplay, availability: 'CONTEMPORANEOUSLY_MEASURED',
      overallQuality: 'HIGH', coverageFloor: null, gradeCounts: { A: 1, B: 0, C: 0, D: 0, E: 0 }, reasonCodes: [],
      visualBridgeFromPrevious: false })
    const main = new Map([[date, disclosure('998.93770376')]])
    const second = new Map([[date, disclosure('999.82639768')]])
    const html = axisTooltip([
      { axisValue: date, seriesId: 'primary-1', seriesName: 'H', value: 998.9 },
      { axisValue: date, seriesId: `${SECONDARY_SERIES_ID_PREFIX}1`, seriesName: '等权几何指数', value: 999.8 },
    ], String, 'zh', main as never, second as never)
    expect(html).toContain('H  998.94')
    expect(html).toContain('等权几何指数  999.83')
  })
})

describe('the H page with the E second curve', () => {
  const renderMarket = (h: ReturnType<typeof harness>, lang: 'zh' | 'en' = 'zh') =>
    render(<LangProvider lang={lang}><MarketSectorIndexHistory gateway={h.gateway} api={h.api} scopeCode="ALL" /></LangProvider>)
  /** Wait until the main chart is up and every E read has settled. */
  async function settled(h: ReturnType<typeof harness>) {
    await screen.findByText('10,303.01')
    await waitFor(() => expect(h.eRequests().length).toBeGreaterThan(0))
    await new Promise((resolve) => setTimeout(resolve, 30))
  }

  it.each(['zh', 'en'] as const)('%s: draws E dashed beside H with legend, as-of date, note and an a11y label', async (lang) => {
    const h = harness('H', E_SPEC)
    renderMarket(h, lang)
    const block = await screen.findByTestId('index-second-curve')
    const latest = shift(END, -3)
    expect(block.getAttribute('data-secondary-as-of')).toBe(latest)
    const main = h.mainRequests().at(-1)!, second = h.eRequests().at(-1)!
    // E is read over exactly the main curve's scope and window, under its own spec.
    for (const key of ['scope', 'start', 'end']) expect(second.searchParams.get(key)).toBe(main.searchParams.get(key))
    expect(block.querySelector('[data-curve="MAIN"]')!.textContent).toBe(
      lang === 'zh' ? '价格分层平衡几何指数（H）' : 'Price-tier balanced geometric index (H)')
    expect(block.querySelector('[data-curve="E"]')!.textContent).toContain(lang === 'zh' ? '等权几何指数' : 'Equal-weight geometric index')
    expect(block.querySelector('[data-curve="E"]')!.textContent).toContain(lang === 'zh' ? '截至' : 'as of')
    expect(block.querySelector('[data-disclosure="SECOND_CURVE"]')!.textContent).toBe(lang === 'zh'
      ? '等权几何指数：与主指数同一月度成员、等权几何平均、不剔除。仅作对照曲线，不替代主指数。'
      : 'Equal-weight geometric index: the same monthly members as the main index, an equal-weight geometric mean, no exclusion. A comparison curve only; it does not replace the main index.')
    const chart = document.querySelector('[data-secondary-segment-count]')!
    expect(chart.getAttribute('aria-label')).toContain(lang === 'zh'
      ? `对照曲线等权几何指数为虚线，截至${latest}` : `comparison curve Equal-weight geometric index dashed, as of ${latest}`)
    // E is never the main value: the headline is still H's.
    expect(screen.getByText('10,303.01')).toBeVisible()
    expect(screen.queryByText('9,990.12')).toBeNull()
    const expected = main.searchParams.get('start')! < STEP ? 2 : 1
    expect(chart.getAttribute('data-secondary-segment-count')).toBe(String(expected))
    // No guard or exclusion wording beside E.
    expect(block.textContent).not.toMatch(/剔除规则|守卫|guard|winsor/iu)
  })

  it('breaks E at a null day and at its 9/27 new segment; nothing is interpolated', async () => {
    const h = harness('H', E_SPEC, { nullDates: [shift(END, -10)] })
    renderMarket(h)
    await screen.findByTestId('index-second-curve')
    const main = h.mainRequests().at(-1)!
    const expected = (main.searchParams.get('start')! < STEP ? 2 : 1) + 1
    expect(document.querySelector('[data-secondary-segment-count]')!.getAttribute('data-secondary-segment-count')).toBe(String(expected))
  })

  it.each([
    ['NOT_PUBLISHED (Worker 404 no-store)', { latest: '2020-01-01' }],
    ['scope absent', { absentScopes: ['ALL'] }],
    ['gateway 502', { mode: 'SERVER_ERROR' }],
    ['503', { mode: 'UNAVAILABLE' }],
    ['malformed answer', { mode: 'GARBAGE' }],
    ['wrong method under the E spec', { mode: 'WRONG_METHOD' }],
  ] as const)('E %s hides only E; H renders unchanged with no error', async (_, options) => {
    const h = harness('H', E_SPEC, options as EOptions)
    const view = renderMarket(h)
    await settled(h)
    expect(screen.queryByTestId('index-second-curve')).toBeNull()
    expect(document.querySelector('[data-secondary-segment-count]')).toBeNull()
    expect(view.container.querySelector('[data-segment-count]')).not.toBeNull()
    expect(screen.getByText('10,303.01')).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(view.container.textContent).not.toMatch(/重试|Retry/u)
  })

  it('shows no E and requests none under a V1 release, or with the switch off', async () => {
    for (const [method, eSpec] of [['V1', E_SPEC], ['H', null]] as const) {
      const h = harness(method, eSpec)
      const view = renderMarket(h)
      await screen.findByText('10,303.01')
      await new Promise((resolve) => setTimeout(resolve, 30))
      expect(h.eRequests()).toHaveLength(0)
      expect(screen.queryByTestId('index-second-curve')).toBeNull()
      view.unmount()
    }
  })

  async function openModel(h: ReturnType<typeof harness>) {
    render(<LangProvider lang="zh"><MarketSectorIndexHistory gateway={h.gateway} api={h.api} scopeCode="ALL" view="SECTORS" /></LangProvider>)
    fireEvent.click(await screen.findByTestId('sector-tile-WEAPON'))
    fireEvent.click(await screen.findByTestId('sector-tile-WEAPON_MODEL:7'))
    return screen.findByTestId('v3-sector-detail')
  }

  it('shows E on a sector detail scope that has E, read for that scope', async () => {
    const h = harness('H', E_SPEC)
    const detail = await openModel(h)
    await waitFor(() => expect(detail.querySelector('[data-testid="index-second-curve"]')).not.toBeNull())
    expect(h.eRequests().every((url) => url.searchParams.get('scope') === 'WEAPON_MODEL:7')).toBe(true)
    // The sector overview overlay stays one curve per scope (H only).
    expect(h.eRequests().length).toBeGreaterThan(0)
  })

  it('hides E on a scope without E while H still draws it', async () => {
    const h = harness('H', E_SPEC, { absentScopes: ['WEAPON_MODEL:7'] })
    const detail = await openModel(h)
    await waitFor(() => expect(h.eRequests().length).toBeGreaterThan(0))
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(detail.querySelector('[data-testid="index-second-curve"]')).toBeNull()
    expect(detail.querySelector('[data-segment-count]')).not.toBeNull()
  })
})
