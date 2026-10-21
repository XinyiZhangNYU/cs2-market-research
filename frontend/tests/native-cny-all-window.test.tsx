import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NativeCnyAllHistory, nativeHistoryChunks, joinNativeHistoryChunks, NATIVE_CNY_ALL_CHUNK_DAYS, NATIVE_CNY_ALL_START } from '../src/api/nativeCnyAllHistory'
import { NativeCnyMarketSession, NativeCnyMarketSectorIndexGateway, mapNativeIndexPoint } from '../src/api/NativeCnyMarketGateways'
import { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import type { NativeCnyIndexPublicDay, NativeCnyIndexPublicHistory } from '../src/wire/nativeCnyIndexPublicApi'
import { decodeNativeCnyIndexResponse } from '../src/wire/nativeCnyIndexPublicApi'
import { canonicalHash } from '../src/wire/canonical'
import { MarketSectorIndexHistory } from '../src/components/MarketSectorIndexHistory'
import { axisTooltip, longWindowAxisLabels } from '../src/components/PublicMarketIndexEcharts'
import { LangProvider } from '../src/i18n'
import { chartPointDisclosures, filterPointsByRange, fetchRangeFor, indexFromForRange, indexLevelRuns, windowReturn } from '../src/pages/publicMarketIndexChart'
import { syntheticDay, syntheticHistory, syntheticFetch, fixtureSpec } from './native-cny-market-fixtures'

afterEach(cleanup)
const shift = (date: string, n: number) => new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10)
function dayAt(date: string, code = 'ALL'): NativeCnyIndexPublicDay {
  const sample = syntheticDay(4, [code]), base = date === '2026-09-27'
  return { ...sample, publication_id: canonicalHash({ date }), released_at: date + 'T23:59:00Z',
    rights_sha256: (date < '2026-09-27' ? 'a' : 'd').repeat(64),
    review_sha256: (date < '2026-09-27' ? 'b' : 'e').repeat(64),
    data: { ...sample.data, bucket_date: date, measured_at: date + 'T23:55:00Z',
      availability: date < '2026-09-27' ? 'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND' : 'CONTEMPORANEOUS_EOD_NOT_ARCHIVE_LAST_OBSERVATION',
      points: sample.data.points.map(p => ({ ...p, segment_number: date < '2026-09-27' ? 1 : 2,
        period_return_display: base ? null : '0.01000000',
        state: base ? 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN' : 'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN' })) } }
}
function historyAt(scope: string, start: string, end: string, missing: string[] = []): NativeCnyIndexPublicHistory {
  const days: NativeCnyIndexPublicDay[] = []
  for (let date = start; date <= end; date = shift(date, 1)) if (!missing.includes(date)) days.push(dayAt(date, scope))
  return { ...syntheticHistory(), api_contract: 'native-cny-index-history/1', currency: 'CNY', fx_applied: false,
    calculation_revisions_mixed: false, missing_prices_filled: false, scope, start_date: start, end_date: end,
    days, missing_publication_dates: missing.filter(d => d >= start && d <= end) }
}
const query = { publication_id: null, scope_token: canonicalHash({ contract: 'market-sector-index-public-api', scope_code: 'ALL' }),
  from_date: NATIVE_CNY_ALL_START, to_date: '2026-10-10', after_date: null, limit: 366 }
function harness(failChunk = 0) {
  const requests: URL[] = []
  const fetcher: typeof fetch = async input => {
    const url = new URL(String(input), 'http://localhost')
    let payload: unknown
    if (url.pathname.endsWith('/index/day')) payload = dayAt('2026-10-10')
    else if (url.pathname.endsWith('/index/history')) {
      requests.push(url)
      payload = requests.length === failChunk ? {} : historyAt(url.searchParams.get('scope')!, url.searchParams.get('start')!, url.searchParams.get('end')!)
    } else return syntheticFetch(input)
    return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } })
  }
  const gateway = new NativeCnyMarketSectorIndexGateway(new NativeCnyMarketSession(
    new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher })))
  return { requests, gateway, api: new MarketSectorIndexPublicApi(gateway) }
}

describe('bounded All transport and assembly', () => {
  const SPAN = NATIVE_CNY_ALL_CHUNK_DAYS
  it('keeps every chunk at least 3x below the 366-day API window bound', () => {
    expect(SPAN).toBe(92)
  })
  it.each([SPAN - 1, SPAN, SPAN + 1])('splits an inclusive %i day window without overlap', count => {
    const chunks = nativeHistoryChunks('2023-12-25', shift('2023-12-25', count - 1))
    expect(chunks).toHaveLength(count <= SPAN ? 1 : 2)
    expect(chunks[0]).toEqual({ start: '2023-12-25', end: shift('2023-12-25', Math.min(count, SPAN) - 1) })
    if (count === SPAN + 1) expect(chunks[1]).toEqual({ start: shift('2023-12-25', SPAN), end: shift('2023-12-25', SPAN) })
  })
  it('covers leap day and year boundaries continuously', () => {
    const chunks = nativeHistoryChunks('2023-12-31', '2025-01-01')
    expect(chunks[0]!.start).toBe('2023-12-31'); expect(chunks.at(-1)!.end).toBe('2025-01-01')
    chunks.forEach((chunk, i) => {
      if (i > 0) expect(chunk.start).toBe(shift(chunks[i - 1]!.end, 1))
      expect((Date.parse(chunk.end) - Date.parse(chunk.start)) / 86400000 + 1).toBe(i < chunks.length - 1 ? SPAN : 368 - SPAN * (chunks.length - 1))
    })
    expect(chunks.some(c => c.start <= '2024-02-29' && '2024-02-29' <= c.end)).toBe(true)
  })
  it.each([['bad', '2026-10-10'], ['2026-02-30', '2026-10-10'], ['2026-10-10', '2022-12-25']])('rejects invalid bounds %s/%s', (start, end) => {
    expect(() => nativeHistoryChunks(start, end)).toThrow()
  })
  it.each(['duplicate', 'spec', 'order', 'mixed', 'chunk-window', 'chunk-gap', 'missing-chunk', 'scope'])('rejects assembled %s corruption', corruption => {
    const chunks = [{ start: '2026-09-25', end: '2026-09-26' }, { start: '2026-09-27', end: '2026-09-28' }]
    const parts = chunks.map(c => structuredClone(historyAt('ALL', c.start, c.end)))
    if (corruption === 'duplicate') Object.assign(parts[1]!, { days: [parts[0]!.days[1]!, ...parts[1]!.days] })
    if (corruption === 'spec') Object.assign(parts[1]!.days[0]!.data, { spec_sha256: 'f'.repeat(64) })
    if (corruption === 'order') Object.assign(parts[1]!, { days: [...parts[1]!.days].reverse() })
    if (corruption === 'mixed') Object.assign(parts[1]!, { calculation_revisions_mixed: true })
    if (corruption === 'chunk-window') Object.assign(parts[1]!, { end_date: '2026-09-29' })
    if (corruption === 'chunk-gap') chunks[1]!.start = '2026-09-28'
    if (corruption === 'missing-chunk') parts.pop()
    if (corruption === 'scope') Object.assign(parts[1]!, { scope: 'KNIFE' })
    expect(() => joinNativeHistoryChunks(parts, chunks, fixtureSpec, 'ALL')).toThrow()
  })
  it('reads 1386 days once per chunk and maps previous across transport boundaries', async () => {
    const { api, requests } = harness()
    const result = await api.allNativeSeriesV3(query)
    expect(result.response_kind).toBe('INDEX_SERIES')
    if (result.response_kind !== 'INDEX_SERIES') throw new Error('No series')
    expect(result.points).toHaveLength(1386)
    // 15 full 92-day chunks plus the final 6 days: 1386 = 15 * 92 + 6.
    const expected = Array.from({ length: 16 }, (_, i) => [shift('2022-12-25', i * 92), i < 15 ? shift('2022-12-25', i * 92 + 91) : '2026-10-10'])
    expect(requests.map(u => [u.searchParams.get('start'), u.searchParams.get('end')])).toEqual(expected)
    expect(new Set(requests.map(u => u.href)).size).toBe(16)
    for (let i = 92; i < 1386; i += 92) expect(result.points[i]!.connect_to_previous).toBe(true)
    expect(result.points.find(p => p.date === '2026-09-27')).toMatchObject({ connect_to_previous: false, index: { period_return: null } })
    expect(filterPointsByRange(result.points, 'ALL')).toBe(result.points)
    expect(indexLevelRuns(result.points)).toHaveLength(2)
    expect(windowReturn(result.points, 'ALL')).toBeNull()
  })
  it('uses the earliest returned day, preserving gaps and nullable early indices', () => {
    const part = historyAt('ALL', '2026-09-23', '2026-09-28', ['2026-09-23', '2026-09-25'])
    Object.assign(part.days[0]!.data.points[0]!, { index_display: null, state: 'BELOW_MINIMUM_INTERPRETABLE_COVERAGE' })
    const joined = joinNativeHistoryChunks([part], [{ start: part.start_date, end: part.end_date }], fixtureSpec, 'ALL')
    const points = joined.days.map((d, i) => mapNativeIndexPoint(d, joined.days[i - 1]))
    expect(points[0]!.date).toBe('2026-09-24')
    expect(points[0]!.index.value).toBeNull()
    expect(points.map(p => p.date)).not.toContain('2026-09-25')
    expect(points[1]!.connect_to_previous).toBe(false)
  })
  it('fails the whole read rather than returning the first successful chunk', async () => {
    const { api, requests } = harness(2)
    expect((await api.allNativeSeriesV3(query)).response_kind).toBe('ERROR')
    expect(requests.length).toBeLessThanOrEqual(3)
  })
  it('deduplicates simultaneous readers; aborting one does not cancel the other', async () => {
    const loader = new NativeCnyAllHistory(), a = new AbortController(), b = new AbortController()
    let finish!: () => void
    const pending = new Promise<void>(resolve => { finish = resolve })
    const load = vi.fn(async (start: string, end: string, signal: AbortSignal) => {
      await pending; signal.throwIfAborted(); return historyAt('ALL', start, end)
    })
    const first = loader.read(dayAt('2024-01-01'), 'ALL', load, a.signal)
    const second = loader.read(dayAt('2024-01-01'), 'ALL', load, b.signal)
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    a.abort(); await expect(first).rejects.toMatchObject({ name: 'AbortError' })
    finish(); expect((await second).days).toHaveLength(373)
    // One read per distinct chunk (373 days = 5 chunks), never one per reader.
    expect(load).toHaveBeenCalledTimes(nativeHistoryChunks(NATIVE_CNY_ALL_START, '2024-01-01').length)
    expect(new Set(load.mock.calls.map(([start]) => start)).size).toBe(5)
  })
  it('cancels an active chunk and never starts later chunks', async () => {
    const loader = new NativeCnyAllHistory(), controller = new AbortController()
    const load = vi.fn((_start: string, _end: string, signal: AbortSignal) => new Promise<NativeCnyIndexPublicHistory>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    }))
    const read = loader.read(dayAt('2026-10-10'), 'ALL', load, controller.signal)
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    controller.abort(); await expect(read).rejects.toMatchObject({ name: 'AbortError' })
    expect(load.mock.calls[0]![2].aborted).toBe(true)
    expect(load).toHaveBeenCalledTimes(2)
  })
  it('caps simultaneous scopes at two and removes a cancelled queued read', async () => {
    const loader = new NativeCnyAllHistory(), controllers = Array.from({ length: 3 }, () => new AbortController())
    const load = vi.fn((_start: string, _end: string, signal: AbortSignal) => new Promise<NativeCnyIndexPublicHistory>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    }))
    const reads = controllers.map((c, i) => loader.read(dayAt('2026-10-10'), ['ALL', 'KNIFE', 'WEAPON'][i]!, load, c.signal))
    const outcomes = Promise.allSettled(reads)
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    controllers[2]!.abort(); controllers[0]!.abort(); controllers[1]!.abort()
    expect((await outcomes).every(r => r.status === 'rejected')).toBe(true)
    expect(load).toHaveBeenCalledTimes(2)
  })
  it('rejects pre-aborted All without starting work', async () => {
    const controller = new AbortController(); controller.abort()
    const load = vi.fn()
    expect(() => new NativeCnyAllHistory().read(dayAt('2026-10-10'), 'ALL', load, controller.signal)).toThrow()
    expect(load).not.toHaveBeenCalled()
  })
  it('keeps raw decimal tooltip and existing availability wording', () => {
    const days = [dayAt('2026-09-26'), dayAt('2026-09-27')]
    Object.assign(days[0]!.data.points[0]!, { index_display: '9007199254740993.12500000' })
    const points = days.map((d, i) => mapNativeIndexPoint(d, days[i - 1]))
    const disclosures = new Map(chartPointDisclosures(points).map(d => [d.date, d]))
    const archive = axisTooltip({ axisValue: '2026-09-26', value: 1 }, String, 'en', disclosures)
    const measured = axisTooltip({ axisValue: '2026-09-27', value: 1 }, String, 'en', disclosures)
    expect(archive).toContain('9,007,199,254,740,993.12')
    expect(archive).toContain('Late-bound reconstruction')
    expect(measured).toContain('Measured contemporaneously')
  })
  it('also breaks 9/27 when the producer retains the segment number but declares a new base', () => {
    const previous = dayAt('2026-09-26'), current = dayAt('2026-09-27')
    Object.assign(current.data.points[0]!, { segment_number: previous.data.points[0]!.segment_number })
    expect(mapNativeIndexPoint(current, previous)).toMatchObject({ connect_to_previous: false, index: { period_return: null } })
  })
  it('does not require an absent lower-bound publication when computing a fully connected All return', () => {
    const days = [dayAt('2024-01-01'), dayAt('2024-01-02')]
    Object.assign(days[1]!.data.points[0]!, { index_display: '10406.0401' })
    const points = days.map((d, i) => mapNativeIndexPoint(d, days[i - 1]))
    expect(windowReturn(points, 'ALL')).toBeCloseTo(0.01)
    expect(windowReturn(points, '3M')).toBeNull()
  })
  it('renders no partial chart after a later All chunk fails', async () => {
    const { gateway, api } = harness(3) // initial 3M is request 1; All fails on its second chunk
    const view = render(<LangProvider lang="zh"><MarketSectorIndexHistory gateway={gateway} api={api} scopeCode="ALL" /></LangProvider>)
    await screen.findByText('10,303.01')
    fireEvent.click(screen.getByRole('button', { name: '全部' }))
    await waitFor(() => expect(view.container.querySelector('.public-market-index__empty')).not.toBeNull())
    expect(view.container.querySelector('[data-segment-count]')).toBeNull()
  })
  it('leaves the four original calendar/fetch rules unchanged', () => {
    expect(['7D', '1M', '3M', '1Y'].map(r => fetchRangeFor(r as '7D'))).toEqual(['3M', '3M', '3M', '1Y'])
    expect(indexFromForRange(null, '2026-10-10', '3M')).toBe('2026-07-11')
    expect(indexFromForRange(null, '2026-10-10', '1Y')).toBe('2025-10-09')
  })
  it.each(['zh', 'en'] as const)('adds %s All after 1Y and returns to the original 1Y request', async lang => {
    const { gateway, api, requests } = harness()
    const allRead = vi.spyOn(api, 'allNativeSeriesV3'), normalRead = vi.spyOn(api, 'seriesV3Pages')
    render(<LangProvider lang={lang}><MarketSectorIndexHistory gateway={gateway} api={api} scopeCode="ALL" /></LangProvider>)
    await screen.findByText('10,303.01')
    const buttons = screen.getByRole('group', { name: lang === 'zh' ? '时间窗口' : 'Time window' }).querySelectorAll('button')
    expect(Array.from(buttons).map(b => b.textContent)).toEqual(lang === 'zh' ? ['7日', '1月', '3月', '1年', '全部'] : ['7D', '1M', '3M', '1Y', 'All'])
    fireEvent.click(buttons[4]!)
    await waitFor(() => expect(allRead).toHaveBeenCalledTimes(1))
    await screen.findByText('10,303.01')
    expect(requests.filter(u => u.searchParams.get('start') === '2022-12-25')).toHaveLength(1)
    fireEvent.click(buttons[3]!)
    await screen.findByText('10,303.01')
    expect(normalRead.mock.calls.at(-1)![0]).toMatchObject({ from_date: '2025-10-09', to_date: '2026-10-10', limit: 366 })
    expect(allRead).toHaveBeenCalledTimes(1)
  })
  it('passes generated archive/live examples through the unchanged decoder', () => {
    for (const date of ['2026-09-26', '2026-09-27']) expect(decodeNativeCnyIndexResponse(dayAt(date), 200, { kind: 'CURRENT' }).kind).toBe('DAY')
  })
  it('adds year labels only to multi-year spans and leaves daily data untouched', () => {
    const dates = ['2022-12-25', '2026-10-10']
    expect(longWindowAxisLabels(dates, 'zh')!.formatter('2024-01-01')).toBe('2024年1月')
    expect(longWindowAxisLabels(dates, 'en')!.formatter('2024-01-01')).toBe('Jan 2024')
    expect(longWindowAxisLabels(dates, 'en')!.hideOverlap).toBe(true)
    expect(longWindowAxisLabels(['2025-10-09', '2026-10-10'], 'en')).toBeNull()
    expect(dates).toEqual(['2022-12-25', '2026-10-10'])
  })
})
