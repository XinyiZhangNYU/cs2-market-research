import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../src/i18n'
import { MarketSectorIndexHistory } from '../src/components/MarketSectorIndexHistory'
import { chartRunValues, axisTooltip } from '../src/components/PublicMarketIndexEcharts'
import { NativeCnyMarketSession, NativeCnyMarketSectorIndexGateway, mapNativeIndexPoint } from '../src/api/NativeCnyMarketGateways'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { syntheticFetch, syntheticHistory } from './native-cny-market-fixtures'
import { chartPointDisclosures, indexLevelRuns, unionChartDates } from '../src/pages/publicMarketIndexChart'

afterEach(cleanup)
function gateway(fetcher: typeof fetch = syntheticFetch) {
  return new NativeCnyMarketSectorIndexGateway(new NativeCnyMarketSession(
    new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }),
  ))
}
describe('real market chart consumer with synthetic native data', () => {
  it('keeps two runs separate all the way into ECharts and does not turn missing coverage into zero', () => {
    const days = syntheticHistory().days
    const points = days.map((day, index) => mapNativeIndexPoint(day, days[index - 1]))
    const runs = indexLevelRuns(points), dates = unionChartDates(runs)
    expect(chartRunValues(runs, [], dates, true)).toEqual([
      [10000, 10100, null, null, null], [null, null, 10100, 10201, 10303.01],
    ])
    const disclosures = new Map(chartPointDisclosures(points).map(d => [d.date, d]))
    const tip = axisTooltip({ axisValue: '2025-04-06', value: 10303.01 }, String, 'en', disclosures)
    expect(tip).toContain('Conservative coverage floor  —')
    expect(tip).not.toContain('floor  0%')
    const exactTip = axisTooltip({ axisValue: '2025-04-06', value: 9007199254740992 }, String, 'en',
      new Map([['2025-04-06', { ...disclosures.get('2025-04-06')!, nativeIndexDisplay: '9007199254740993.125' }]]))
    expect(exactTip).toContain('9,007,199,254,740,993.12')
  })
  it('changes only money on language/FX updates, without refetching or altering points/returns', async () => {
    const fetcher = vi.fn(syntheticFetch), source = gateway(fetcher)
    const ui = (lang: 'zh' | 'en', fx: string | null) => <LangProvider lang={lang}>
      <MarketSectorIndexHistory gateway={source} scopeCode="ALL" cnyPerUsd={fx} />
    </LangProvider>
    const view = render(ui('zh', '7'))
    await screen.findByText('10,303.01')
    await screen.findByText('¥70,000')
    expect(screen.getByText('110 / —')).toBeVisible()
    const calls = fetcher.mock.calls.length
    expect(view.container.querySelector('[data-segment-count="2"][data-bridge-count="0"]')).not.toBeNull()
    view.rerender(ui('en', '7'))
    await screen.findByText('$10,000')
    expect(screen.getByText('10,303.01')).toBeVisible()
    expect(fetcher).toHaveBeenCalledTimes(calls)
    view.rerender(ui('en', null))
    expect(screen.queryByText('$10,000')).toBeNull()
    expect(screen.getByText('10,303.01')).toBeVisible()
    expect(fetcher).toHaveBeenCalledTimes(calls)
  })
  it('retains name-directory labels and raw unknown scopes through sector and child navigation', async () => {
    render(<LangProvider lang="en"><MarketSectorIndexHistory gateway={gateway()} scopeCode="ALL" view="SECTORS" cnyPerUsd="7" /></LangProvider>)
    const tile = await screen.findByTestId('sector-tile-WEAPON')
    expect(await screen.findByTestId('sector-tile-TEST:999')).toHaveTextContent('TEST:999')
    fireEvent.click(tile)
    const child = await screen.findByTestId('sector-tile-WEAPON_MODEL:7')
    expect(child).toHaveTextContent('AK-47')
    expect(child).toHaveTextContent('$10,000')
    fireEvent.click(child)
    expect(await screen.findByTestId('v3-sector-detail')).toHaveTextContent('AK-47')
    await waitFor(() => expect(screen.getByTestId('v3-sector-detail').querySelector('[data-segment-count="2"]')).not.toBeNull())
  })
  it.each([404, 503, 200])('renders the existing empty state for native failure %s, not legacy history', async status => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(status === 200 ? {} :
      { api_contract: 'native-cny-index-day/1', error: status === 404 ? 'NOT_PUBLISHED' : 'TEMPORARILY_UNAVAILABLE' }),
    { status, headers: { 'Content-Type': 'application/json' } }))
    const view = render(<LangProvider lang="zh"><MarketSectorIndexHistory gateway={gateway(fetcher)} scopeCode="ALL" /></LangProvider>)
    await waitFor(() => expect(view.container.querySelector('.public-market-index__empty')).not.toBeNull())
    expect(view.container.querySelector('[data-segment-count]')).toBeNull()
    expect(fetcher.mock.calls.every(([path]) => path === '/api/v1/native-cny/index/day')).toBe(true)
  })
  it('rejects an invalid sector history without publishing a partially validated group', async () => {
    const fetcher: typeof fetch = async input => {
      if (String(input).includes('/index/history') && String(input).includes('scope=KNIFE')) {
        return new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      }
      return syntheticFetch(input)
    }
    const view = render(<LangProvider lang="zh"><MarketSectorIndexHistory gateway={gateway(fetcher)} scopeCode="ALL" view="SECTORS" /></LangProvider>)
    await waitFor(() => expect(view.container.querySelector('.public-market-index__empty')).not.toBeNull())
    expect(view.container.querySelector('[data-testid="v3-coarse-sector-heatmap"]')).toBeNull()
  })
})
