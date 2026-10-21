import { act, render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogUnitPricePanel } from '../src/components/CatalogUnitPricePanel'
import type { PriceDisplayGateway, PriceTransportResponse } from '../src/api/PriceDisplayApi'
import { HttpPriceDisplayGateway } from '../src/api/HttpPriceDisplayGateway'
import { LangProvider, type Lang } from '../src/i18n'
import type { PriceReadContext } from '../src/price/priceDisplayRuntime'
import { PriceWireTestGateway } from './support/priceWireTestGateway'
import { catalogFixture, itemFixture, snapshotsFixture } from './support/priceWireFixtures'

const source = itemFixture()
const context: PriceReadContext = { analysisUnitId: source.query.analysis_unit_id, catalog: catalogFixture, queryAsOf: snapshotsFixture().query.query_as_of, knownAt: source.query.known_at }
function Host({ gateway, readContext = context }: { gateway: PriceDisplayGateway; readContext?: PriceReadContext }) {
  const [lang, setLang] = useState<Lang>('zh')
  return <LangProvider lang={lang}>
    <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>Language</button>
    <h1 data-testid="catalog-stays">Synthetic selected catalog member</h1>
    <span data-testid="image-stays">Catalog image is independent</span>
    <CatalogUnitPricePanel context={readContext} gateway={gateway} />
  </LangProvider>
}
async function ready() { await waitFor(() => expect(screen.getByTestId('catalog-unit-price')).toHaveAttribute('data-price-read-state', 'READY')) }
function visibleMoney(text: string) { return screen.getByText(text, { selector: 'strong' }) }

describe('formal single-unit price consumption (synthetic wire)', () => {
  it('shows every market in the page currency without snapshot, rate or method notes', async () => {
    const gateway = new PriceWireTestGateway()
    render(<Host gateway={gateway} />)
    await ready()
    expect(visibleMoney('¥67.20')).toHaveAttribute('data-price-currency', 'CNY')
    expect(visibleMoney('¥92,233,720,368,547,758.07')).toHaveAttribute('data-price-currency', 'CNY')
    expect(visibleMoney('< ¥0.01')).toBeInTheDocument()
    expect(screen.queryByText(source.snapshot.snapshot_id)).toBeNull()
    expect(document.querySelector('details')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(gateway.requests.map((request) => request.kind)).toEqual(['PRICE_SNAPSHOT_LIST', 'PRICE_ITEM'])
  })
  it('maps language to its display currency while retaining row order without requests', async () => {
    const gateway = new PriceWireTestGateway(), user = userEvent.setup()
    render(<Host gateway={gateway} />)
    await ready()
    const keys = () => [...document.querySelectorAll('[data-testid^="price-quote-"]')].map((node) => node.getAttribute('data-testid'))
    const before = keys()
    await user.click(screen.getByRole('button', { name: 'Language' }))
    expect(visibleMoney('$10.00')).toHaveAttribute('data-price-currency', 'USD')
    expect(visibleMoney('$13,725,256,007,224,368.76')).toHaveAttribute('data-price-converted', 'true')
    await user.click(screen.getByRole('button', { name: 'Language' }))
    expect(visibleMoney('¥67.20')).toBeInTheDocument()
    expect(keys()).toEqual(before)
    expect(gateway.requests).toHaveLength(2)
  })
  it('without a published yuan amount or a daily rate, keeps the published dollar price', async () => {
    const gateway = new PriceWireTestGateway({ noFx: true })
    render(<Host gateway={gateway} />)
    await ready()
    expect(visibleMoney('$10.00')).toHaveAttribute('data-price-currency', 'USD')
    expect(screen.queryByText('¥67.20', { selector: 'strong' })).toBeNull()
  })
  it('without a published yuan amount, converts with the daily rate', async () => {
    const gateway = new PriceWireTestGateway({ noFx: true })
    render(<LangProvider lang="zh"><CatalogUnitPricePanel context={context} gateway={gateway} cnyPerUsd="7.1" /></LangProvider>)
    await ready()
    expect(visibleMoney('¥71.00')).toHaveAttribute('data-price-converted', 'true')
  })
  it.each([
    [{ emptySnapshots: true }, '这件饰品暂无价格。', 1],
    [{ failure: true }, '价格暂时无法读取，请稍后再试。', 1],
    [{ invalidDocument: true }, '价格暂时无法显示。', 1],
    [{ currentEmpty: true }, '暂无报价。', 2],
  ] as const)('retains catalog/images on a price-only absence or failure', async (options, text, count) => {
    const gateway = new PriceWireTestGateway(options)
    render(<Host gateway={gateway} />)
    expect(await screen.findByText(text)).toBeInTheDocument()
    expect(screen.getByTestId('catalog-stays')).toBeInTheDocument()
    expect(screen.getByTestId('image-stays')).toBeInTheDocument()
    expect(document.querySelectorAll('.price-quote')).toHaveLength(0)
    expect(gateway.requests).toHaveLength(count)
  })
  it.each([
    [503, 'text/html; charset=utf-8', '价格服务暂时不可用。'],
    [502, 'text/plain', '价格服务暂时不可用。'],
    [200, 'text/html; charset=utf-8', '价格暂时无法显示。'],
  ] as const)('a %i %s response without the JSON envelope is service-unavailable only when non-2xx', async (status, contentType, text) => {
    const fetcher = vi.fn(async () => new Response('<html>edge error</html>', { status, headers: { 'content-type': contentType } }))
    render(<Host gateway={new HttpPriceDisplayGateway({ fetcher })} />)
    expect(await screen.findByText(text)).toBeInTheDocument()
    expect(screen.getByTestId('catalog-stays')).toBeInTheDocument()
    expect(document.querySelectorAll('.price-quote')).toHaveLength(0)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('offers current quotes only: no history view, range form or HISTORY request', async () => {
    const gateway = new PriceWireTestGateway()
    render(<Host gateway={gateway} />)
    await ready()
    expect(screen.queryByRole('button', { name: '历史报价' })).toBeNull()
    expect(screen.queryByRole('button', { name: '当前报价' })).toBeNull()
    expect(screen.queryByRole('form')).toBeNull()
    expect(document.querySelectorAll('.price-quote')).toHaveLength(6)
    expect(gateway.requests.map((request) => request.kind)).toEqual(['PRICE_SNAPSHOT_LIST', 'PRICE_ITEM'])
  })
  it('aborts old unit discovery and ignores a late response after navigation', async () => {
    const actual = new PriceWireTestGateway()
    let release: ((value: PriceTransportResponse) => void) | undefined
    let oldResponse: PriceTransportResponse | undefined
    let oldSignal: AbortSignal | undefined
    const read = vi.fn<PriceDisplayGateway['read']>().mockImplementation(async (request, options) => {
      const response = await actual.read(request, options)
      if (read.mock.calls.length === 1) { oldSignal = options?.signal; oldResponse = response; return await new Promise((resolve) => { release = resolve }) }
      return response
    })
    const gateway: PriceDisplayGateway = { kind: 'SYNTHETIC_DELAYED', read }
    const view = render(<Host gateway={gateway} />)
    await waitFor(() => expect(release).toBeDefined())
    view.rerender(<Host gateway={gateway} readContext={{ ...context, analysisUnitId: 'new-unit-exact' }} />)
    await ready()
    expect(oldSignal?.aborted).toBe(true)
    expect(actual.requests.at(-1)?.query).toMatchObject({ analysis_unit_id: 'new-unit-exact' })
    await act(async () => { release!(oldResponse!); await Promise.resolve() })
    expect(read).toHaveBeenCalledTimes(3)
    expect(actual.requests.filter((request) => request.kind === 'PRICE_ITEM')).toHaveLength(1)
    expect(screen.getByTestId('catalog-unit-price')).toHaveAttribute('data-price-read-state', 'READY')
  })
})
