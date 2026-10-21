import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CatalogUnitPricePanel } from '../src/components/CatalogUnitPricePanel'
import { PriceQuotePanel } from '../src/components/PriceQuotePanel'
import { LangProvider } from '../src/i18n'
import { toPricePanelState } from '../src/adapter/priceDisplayViewModel'
import { decodePriceDisplayDocument } from '../src/wire/priceDisplayApiDecode'
import { lowestNativeCnySourceAsk, nativeCnyQuoteDisplayAmount } from '../src/price/lowestAsk'
import { useSeriesPriceRows } from '../src/price/useSeriesPriceRows'
import { loadCurrentPrice } from '../src/price/priceDisplayRuntime'
import { PriceWireTestGateway } from './support/priceWireTestGateway'
import { catalogFixture, itemFixture, snapshotsFixture } from './support/priceWireFixtures'
import type { PriceDisplayGateway, PriceRequest, PriceTransportResponse } from '../src/api/PriceDisplayApi'
const source = itemFixture()
const context = { analysisUnitId: source.query.analysis_unit_id, catalog: catalogFixture, queryAsOf: snapshotsFixture().query.query_as_of, knownAt: source.query.known_at }
function view() {
  const decoded = decodePriceDisplayDocument(itemFixture())
  if (decoded.response_kind !== 'PRICE_ITEM') throw new Error('fixture')
  return toPricePanelState(decoded)
}
afterEach(() => cleanup())
describe('explicit native CNY catalog presentation and fresh reads', () => {
  it('shows native CNY in English unchanged despite a current FX rate and ignores USD-derived yuan', () => {
    render(<LangProvider lang="en"><PriceQuotePanel state={view()} nativeCny cnyPerUsd="99" /></LangProvider>)
    const amounts = [...document.querySelectorAll('[data-price-state="AVAILABLE"] strong')]
    expect(amounts.length).toBeGreaterThan(0)
    expect(amounts.every(node => node.getAttribute('data-price-currency') === 'CNY')).toBe(true)
    expect(amounts.every(node => !node.hasAttribute('data-price-converted'))).toBe(true)
    expect(screen.getByText('¥92,233,720,368,547,758.07')).toBeTruthy()
    expect(screen.queryByText('¥67.20')).toBeNull()
  })
  it('missing source/derived CNY/zero do not become a native price, a zero or USD fallback', () => {
    const rows = view().rows
    expect(rows.some(row => row.sourcePrice === null)).toBe(true)
    for (const row of rows.filter(row => row.sourcePrice?.currency !== 'CNY')) {
      expect(nativeCnyQuoteDisplayAmount(row)).toBeNull()
    }
    expect(lowestNativeCnySourceAsk(rows.filter(row => row.sourcePrice?.currency !== 'CNY'))).toBeNull()
    render(<LangProvider lang="zh"><PriceQuotePanel state={{ ...view(), rows: rows.filter(row => row.sourcePrice?.currency !== 'CNY') }} nativeCny cnyPerUsd="7" /></LangProvider>)
    expect(document.querySelectorAll('strong[data-price-currency]')).toHaveLength(0)
    expect(document.body.textContent).not.toMatch(/¥0\.00|\$0\.00|NO_ACTIVE_ASK/)
  })
  it('a warmed compatibility API cache cannot conceal a native permission failure', async () => {
    const backing = new PriceWireTestGateway()
    const state = { denied: false }
    const gateway: PriceDisplayGateway = { kind: 'SYNTHETIC_SWITCH', read: async (request, options) => {
      if (state.denied) throw new Error('synthetic permission denied')
      return backing.read(request, options)
    } }
    await loadCurrentPrice(gateway, context)
    state.denied = true
    await expect(loadCurrentPrice(gateway, context, { reuse: false })).rejects.toThrow('permission denied')
    render(<LangProvider lang="en"><CatalogUnitPricePanel context={context} gateway={gateway} nativeCny /></LangProvider>)
    await waitFor(() => expect(screen.getByTestId('catalog-unit-price')).toHaveAttribute('data-price-read-state', 'UNAVAILABLE'))
    expect(document.querySelectorAll('strong[data-price-currency]')).toHaveLength(0)
  })
  it('changing price gateway retires the prior price even when publication context stays the same', async () => {
    const good = new PriceWireTestGateway()
    const bad = new PriceWireTestGateway({ failure: true })
    const panel = (gateway: PriceDisplayGateway) => <LangProvider lang="en"><CatalogUnitPricePanel context={context} gateway={gateway} nativeCny /></LangProvider>
    const mounted = render(panel(good))
    await waitFor(() => expect(screen.getByTestId('catalog-unit-price')).toHaveAttribute('data-price-read-state', 'READY'))
    mounted.rerender(panel(bad))
    expect(document.querySelectorAll('strong[data-price-currency]')).toHaveLength(0)
    await waitFor(() => expect(screen.getByTestId('catalog-unit-price')).toHaveAttribute('data-price-read-state', 'UNAVAILABLE'))
  })
  it('a native remount hides warmed series rows until fresh authorization settles', async () => {
    let denied = false
    let release: (() => void) | undefined
    const backing = new PriceWireTestGateway()
    const read = vi.fn(async (request: PriceRequest): Promise<PriceTransportResponse> => {
      if (denied) { await new Promise<void>(resolve => { release = resolve }); throw new Error('withdrawn') }
      return backing.read(request)
    })
    const gateway = { kind: 'SYNTHETIC_SERIES', read }
    const props = { gateway, catalog: catalogFixture, unitIds: [context.analysisUnitId], queryAsOf: context.queryAsOf, knownAt: context.knownAt, enabled: true, reuse: false }
    const first = renderHook(() => useSeriesPriceRows(props))
    await waitFor(() => expect(first.result.current.get(context.analysisUnitId)?.status).toBe('READY'))
    first.unmount(); denied = true
    const second = renderHook(() => useSeriesPriceRows(props))
    expect(second.result.current.get(context.analysisUnitId)?.status).toBe('LOADING')
    await waitFor(() => expect(release).toBeDefined())
    expect(second.result.current.get(context.analysisUnitId)?.status).toBe('LOADING')
    await act(async () => { release!() })
    await waitFor(() => expect(second.result.current.get(context.analysisUnitId)?.status).toBe('UNAVAILABLE'))
    expect(read).toHaveBeenCalledTimes(3)
  })
})
