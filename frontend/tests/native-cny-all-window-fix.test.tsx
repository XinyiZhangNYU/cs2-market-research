import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { NativeCnyAllHistory, nativeHistoryChunks, NATIVE_CNY_ALL_START } from '../src/api/nativeCnyAllHistory'
import { NativeCnyMarketSession, NativeCnyMarketSectorIndexGateway } from '../src/api/NativeCnyMarketGateways'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { MarketSectorIndexHistory } from '../src/components/MarketSectorIndexHistory'
import { LangProvider } from '../src/i18n'
import { syntheticDay, syntheticHistory, syntheticFetch } from './native-cny-market-fixtures'
import type { NativeCnyIndexPublicHistory } from '../src/wire/nativeCnyIndexPublicApi'

const history = (scope: string, start: string, end: string): NativeCnyIndexPublicHistory => ({
  ...syntheticHistory(scope, start, end), api_contract: 'native-cny-index-history/1',
  currency: 'CNY', fx_applied: false, missing_prices_filled: false, calculation_revisions_mixed: false,
})

afterEach(() => { cleanup(); vi.useRealTimers() })
const flush = async () => { await vi.advanceTimersByTimeAsync(0) }

describe('page-wide All chunk scheduling', () => {
  it('runs 4-second chunks two at a time, joins out-of-order completion in date order', async () => {
    vi.useFakeTimers()
    const loader = new NativeCnyAllHistory(), calls: string[] = []
    const day = { ...syntheticDay(), data: { ...syntheticDay().data, bucket_date: '2026-10-10' } }
    let active = 0, peak = 0, completed = false
    const result = loader.read(day, 'ALL', async (start, end) => {
      calls.push(start); peak = Math.max(peak, ++active)
      await new Promise(resolve => setTimeout(resolve, start === NATIVE_CNY_ALL_START ? 4001 : 4000))
      active--; return history('ALL', start, end)
    }).then(value => { completed = true; return value })
    await flush(); expect(calls).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(4000); expect(completed).toBe(false); expect(calls).toHaveLength(3)
    await vi.advanceTimersByTimeAsync(1); expect(calls).toHaveLength(4)
    const total = nativeHistoryChunks(NATIVE_CNY_ALL_START, '2026-10-10').length
    await vi.advanceTimersByTimeAsync(4000 * (total / 2))
    expect((await result).days.map(d => d.data.bucket_date)).toEqual(syntheticHistory().days.map(d => d.data.bucket_date))
    expect(peak).toBe(2); expect(new Set(calls).size).toBe(total); expect(active).toBe(0)
  })

  it('shares permits across instances and holds them until aborted transports actually settle', async () => {
    vi.useFakeTimers()
    const a = new AbortController(), b = new AbortController(), load = vi.fn(async (start: string, end: string) => {
      await new Promise(resolve => setTimeout(resolve, 4000)) // deliberately ignores AbortSignal
      return history('ALL', start, end)
    })
    const first = new NativeCnyAllHistory().read(syntheticDay(), 'ALL', load, a.signal)
    const firstResult = Promise.allSettled([first])
    await flush(); expect(load).toHaveBeenCalledTimes(2)
    a.abort(); await firstResult
    const second = new NativeCnyAllHistory().read(syntheticDay(), 'ALL', load, b.signal)
    const secondResult = Promise.allSettled([second])
    await flush(); expect(load).toHaveBeenCalledTimes(2)
    b.abort(); await secondResult
    await vi.advanceTimersByTimeAsync(4000)
    expect(load).toHaveBeenCalledTimes(2) // neither queued read nor the old third chunk can start
  })

  it('aborts siblings on failure and never exposes successful partial chunks', async () => {
    vi.useFakeTimers()
    const signals: AbortSignal[] = []
    const load = vi.fn(async (start: string, end: string, signal: AbortSignal) => {
      signals.push(signal)
      await new Promise(resolve => setTimeout(resolve, 4000))
      if (start === NATIVE_CNY_ALL_START) throw new Error('chunk failed')
      return history('ALL', start, end)
    })
    const outcome = new NativeCnyAllHistory().read(syntheticDay(), 'ALL', load).catch(e => e)
    await vi.advanceTimersByTimeAsync(4000)
    expect(await outcome).toMatchObject({ message: 'chunk failed' })
    expect(load).toHaveBeenCalledTimes(2); expect(signals.every(s => s.aborted)).toBe(true)
  })
})

function consumerHarness(delayed = false) {
  const requests: { path: string; signal: AbortSignal | null | undefined }[] = []
  let allStarted = false
  const fetcher: typeof fetch = async (input, init) => {
    const path = String(input), url = new URL(path, 'http://localhost')
    requests.push({ path, signal: init?.signal })
    if (url.pathname.endsWith('/index/history')) {
      if (url.searchParams.get('start') === NATIVE_CNY_ALL_START) allStarted = true
      if (delayed && allStarted) await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 4000)
        init?.signal?.addEventListener('abort', () => { clearTimeout(timer); reject(init.signal?.reason) }, { once: true })
      })
    }
    return syntheticFetch(input)
  }
  const gateway = new NativeCnyMarketSectorIndexGateway(new NativeCnyMarketSession(
    new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher })))
  const api = new MarketSectorIndexPublicApi(gateway)
  const ui = (view: 'MARKET' | 'SECTORS' = 'MARKET') => <LangProvider lang="en">
    <MarketSectorIndexHistory gateway={gateway} api={api} scopeCode="ALL" view={view} />
  </LangProvider>
  return { requests, api, ui }
}

describe('market and sector consumers', () => {
  it('clamps market All to sector 1Y, never lets overview/children use All, returns to market 1Y', async () => {
    const { api, ui } = consumerHarness(), all = vi.spyOn(api, 'allNativeSeriesV3'), normal = vi.spyOn(api, 'seriesV3Pages')
    const view = render(ui())
    await screen.findByText('10,303.01')
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    await waitFor(() => expect(all).toHaveBeenCalledTimes(1)); await screen.findByText('10,303.01')
    view.rerender(ui('SECTORS'))
    const weapon = await screen.findByTestId('sector-tile-WEAPON')
    expect(screen.queryByRole('button', { name: 'All' })).toBeNull()
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(weapon)
    const child = await screen.findByTestId('sector-tile-WEAPON_MODEL:7')
    expect(all).toHaveBeenCalledTimes(1)
    fireEvent.click(child); await screen.findByTestId('v3-sector-detail')
    const detail = screen.getByTestId('v3-detail-ranges')
    fireEvent.click(within(detail).getByRole('button', { name: 'All' }))
    await waitFor(() => expect(all).toHaveBeenCalledTimes(2)); await screen.findByTestId('v3-sector-detail')
    expect(normal.mock.calls.every(([q]) => q.from_date !== NATIVE_CNY_ALL_START)).toBe(true)
    // Explicitly choose 1Y in the overview before returning; initial navigation
    // without a detail change also retained 1Y above.
    fireEvent.click(screen.getAllByRole('button', { name: '1Y' })[0]!)
    view.rerender(ui()); await screen.findByText('10,303.01')
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute('aria-pressed', 'true')
    expect(all).toHaveBeenCalledTimes(2)
  })

  it.each([false, true])('shows loading, never relabels the old curve, cancel=%s leaves no stale curve', async cancel => {
    const { ui, requests } = consumerHarness(true)
    const view = render(ui()); await screen.findByText('10,303.01')
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    await act(flush)
    expect(view.container.querySelector('[data-segment-count]')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(/load/i)
    await act(async () => { await vi.advanceTimersByTimeAsync(3999) })
    expect(view.container.querySelector('[data-segment-count]')).toBeNull()
    if (cancel) {
      view.unmount()
      await act(async () => { await vi.advanceTimersByTimeAsync(8000) })
      const chunks = requests.filter(r => /\/index\/history/.test(r.path)).slice(1)
      expect(chunks).toHaveLength(2); expect(chunks.every(r => r.signal?.aborted)).toBe(true)
      expect(view.container).toBeEmptyDOMElement()
    } else {
      // 16 chunks of 4 s, two at a time.
      await act(async () => { await vi.advanceTimersByTimeAsync(4000 * 8 + 1) })
      expect(view.container.querySelector('[data-segment-count]')).not.toBeNull()
      expect(screen.getByText('10,303.01')).toBeVisible()
      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    }
  })
})
