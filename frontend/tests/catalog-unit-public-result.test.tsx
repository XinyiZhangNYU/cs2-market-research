import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogUnitPublicResultPanel } from '../src/components/CatalogUnitPublicResultPanel'
import { CatalogUnitDetailPage } from '../src/pages/CatalogUnitDetailPage'
import { toCatalogDisplayMemberView } from '../src/adapter/catalogDisplayViewModel'
import type { MarketWatchlistPublicGateway, PublicResultRequest, PublicResultTransportResponse } from '../src/api/MarketWatchlistPublicApi'
import type { WireCatalogDisplayListResponse } from '../src/wire/catalogDisplayApiTypes'
import listFixture from '../../schemas/examples/catalog-display-list.valid.json'
import resultErrorFixture from '../../schemas/examples/result-read-error.valid.json'
import { PublicItemResultTestGateway, publicItemResultFixture } from './support/publicItemResultTestGateway'

const fixture = publicItemResultFixture()
const identity = fixture.members[0]!.catalog
const asOf = fixture.query.query_known_at
const ready = () => waitFor(() => expect(screen.getByTestId('catalog-unit-research-result')).toHaveAttribute('data-result-state', 'READY'))

describe('public catalog item publication summary', () => {
  it('reads one publication page then its exact item, displaying only approved public summary fields', async () => {
    const gateway = new PublicItemResultTestGateway()
    render(<CatalogUnitPublicResultPanel gateway={gateway} identity={identity} asOf={asOf} />)
    await ready()
    expect(gateway.requests).toEqual([
      { kind: 'WATCHLIST', query: { as_of: asOf, publication_id: null, sort: 'RANK_ASC', page_size: 1, cursor: null } },
      { kind: 'WATCHLIST_DETAIL', query: { as_of: null, publication_id: fixture.publication.publication_id, analysis_unit_id: identity.analysis_unit_id } },
    ])
    const result = screen.getByTestId('catalog-unit-research-result')
    expect(result).toHaveTextContent('压力积累')
    expect(result).toHaveTextContent('100%')
    expect(result).not.toHaveTextContent(/PRESSURE_BUILDING|input_snapshot|coverage_ratio/u)
    const link = screen.getByRole('link', { name: '查看单品观察榜 →' })
    expect(link.getAttribute('href')).toContain(`publication=${fixture.publication.publication_id}`)
    expect(link.getAttribute('href')).toContain('unit=item%3Afixture-001')
  })

  it.each([
    ['WATCHLIST', 'NOT_PUBLISHED', 'NOT_PUBLISHED', '尚无正式发布'],
    ['WATCHLIST_DETAIL', 'NOT_FOUND', 'NOT_INCLUDED', '当前已发布单品榜未纳入此商品'],
    ['WATCHLIST_DETAIL', 'PUBLICATION_WITHDRAWN', 'PUBLICATION_WITHDRAWN', '这次发布已撤回'],
    ['WATCHLIST_DETAIL', 'PUBLICATION_EXPIRED', 'PUBLICATION_EXPIRED', '这次发布已过保留期'],
    ['WATCHLIST', 'BACKEND_UNAVAILABLE', 'BACKEND_UNAVAILABLE', '结果服务暂不可用'],
  ] as const)('distinguishes %s %s from unpublished research', async (at, code, state, text) => {
    const gateway = new PublicItemResultTestGateway(fixture, { at, code })
    render(<CatalogUnitPublicResultPanel gateway={gateway} identity={identity} asOf={asOf} />)
    await waitFor(() => expect(screen.getByTestId('catalog-unit-research-result')).toHaveAttribute('data-result-state', state))
    expect(screen.getByTestId('catalog-unit-research-result')).toHaveTextContent(text)
    expect(screen.getByRole('link')).toHaveTextContent('查看单品观察榜')
    if (state === 'NOT_INCLUDED') expect(screen.getByRole('link').getAttribute('href')).not.toContain('unit=')
    expect(gateway.requests).toHaveLength(at === 'WATCHLIST' ? 1 : 2)
  })

  it('rejects an edition mismatch instead of applying another variant result', async () => {
    render(<CatalogUnitPublicResultPanel gateway={new PublicItemResultTestGateway()} identity={{ ...identity, edition_kind: 'STATTRAK' }} asOf={asOf} />)
    await waitFor(() => expect(screen.getByTestId('catalog-unit-research-result')).toHaveAttribute('data-result-state', 'VALIDATION'))
    expect(screen.getByTestId('catalog-unit-research-result')).not.toHaveTextContent('压力积累')
  })

  it('rejects changed publication bytes between discovery and detail', async () => {
    const source = new PublicItemResultTestGateway()
    const gateway: MarketWatchlistPublicGateway = { kind: 'PUBLICATION_DRIFT', async read(request, options) {
      const value = await source.read(request, options)
      if (request.kind === 'WATCHLIST_DETAIL') {
        const payload = value.payload as { publication: { manifest_hash: string } }
        payload.publication.manifest_hash = 'f'.repeat(64)
      }
      return value
    } }
    render(<CatalogUnitPublicResultPanel gateway={gateway} identity={identity} asOf={asOf} />)
    await waitFor(() => expect(screen.getByTestId('catalog-unit-research-result')).toHaveAttribute('data-result-state', 'VALIDATION'))
  })

  it('aborts late detail A and never shows it under a new item B', async () => {
    const source = new PublicItemResultTestGateway()
    let releaseA!: (value: PublicResultTransportResponse) => void
    let lateA!: PublicResultTransportResponse
    let signalA!: AbortSignal
    const gateway: MarketWatchlistPublicGateway = { kind: 'DEFERRED_PUBLIC_ITEM', async read(request, options) {
      if (request.kind === 'WATCHLIST_DETAIL' && request.query.analysis_unit_id === identity.analysis_unit_id) {
        lateA = await source.read(request)
        signalA = options!.signal!
        return await new Promise((resolve) => { releaseA = resolve })
      }
      return await new PublicItemResultTestGateway(fixture, { at: 'WATCHLIST_DETAIL', code: 'NOT_FOUND' }).read(request, options)
    } }
    const view = render(<CatalogUnitPublicResultPanel gateway={gateway} identity={identity} asOf={asOf} />)
    await waitFor(() => expect(releaseA).toBeDefined())
    view.rerender(<CatalogUnitPublicResultPanel gateway={gateway} identity={{ ...identity, analysis_unit_id: 'item:B' }} asOf={asOf} />)
    expect(signalA.aborted).toBe(true)
    await waitFor(() => expect(screen.getByTestId('catalog-unit-research-result')).toHaveAttribute('data-result-state', 'NOT_INCLUDED'))
    await act(async () => releaseA(lateA))
    expect(screen.getByTestId('catalog-unit-research-result')).toHaveAttribute('data-analysis-unit', 'item:B')
    expect(screen.getByTestId('catalog-unit-research-result')).not.toHaveTextContent('压力积累')
  })

  it('keeps the private prototype research and quality panels on LIVE_LOCAL detail', async () => {
    const view = toCatalogDisplayMemberView((listFixture as WireCatalogDisplayListResponse).members[0]!)
    const read = vi.fn(async () => structuredClone(resultErrorFixture))
    const publicRead = vi.fn(async (_request: PublicResultRequest): Promise<PublicResultTransportResponse> => { throw new Error('must not read public') })
    render(<CatalogUnitDetailPage row={view.row} item={view.item} pitContext={{ data_environment: 'LIVE_LOCAL',
      channel: 'LOCAL_REAL_PIT_CATALOG', query_as_of: asOf, query_known_at: asOf,
      snapshot: { ...fixture.publication.catalog } }} qualityGateway={{ kind: 'PRIVATE_FIXTURE', read }}
      publicResultGateway={{ kind: 'UNUSED_PUBLIC', read: publicRead }} queryAsOf={asOf} resultAsOf={asOf} onBack={() => {}} siblingUnits={[]} />)
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2))
    expect(publicRead).not.toHaveBeenCalled()
    expect(screen.queryByTestId('formal-unit-public-quality')).toBeNull()
    expect(screen.getByTestId('detail-valid-from')).toBeInTheDocument()
  })

  it.each(['LIVE_PUBLIC', 'LIVE_LOCAL'] as const)('native detail does not read inherited result or quality on %s', async (environment) => {
    const view = toCatalogDisplayMemberView((listFixture as WireCatalogDisplayListResponse).members[0]!)
    const read = vi.fn(async () => { throw new Error('must not read inherited research') })
    const publicRead = vi.fn(async () => { throw new Error('must not read inherited public results') })
    const priceRead = vi.fn(async () => { throw new Error('price is disabled in this synthetic test') })
    render(<CatalogUnitDetailPage row={view.row} item={view.item} pitContext={{ data_environment: environment,
      channel: 'LOCAL_REAL_PIT_CATALOG', query_as_of: asOf, query_known_at: asOf, snapshot: { ...fixture.publication.catalog } }}
      qualityGateway={{ kind: 'UNUSED_RESEARCH', read }} publicResultGateway={{ kind: 'UNUSED_PUBLIC', read: publicRead }}
      price={{ gateway: { kind: 'UNUSED_PRICE', read: priceRead }, cnyPerUsd: '99', knownAt: asOf, nativeCny: true, enabled: false }}
      queryAsOf={asOf} resultAsOf={asOf} onBack={() => {}} siblingUnits={[]} />)
    expect(screen.getByTestId('native-cny-unavailable-result')).toHaveAttribute('data-state', 'UNAVAILABLE')
    await act(async () => {})
    expect(read).not.toHaveBeenCalled(); expect(publicRead).not.toHaveBeenCalled(); expect(priceRead).not.toHaveBeenCalled()
    expect(screen.queryByTestId('catalog-unit-research-result')).toBeNull()
  })

  it('switching public detail to native removes a warmed legacy result without another inherited read', async () => {
    const view = toCatalogDisplayMemberView((listFixture as WireCatalogDisplayListResponse).members[0]!)
    const gateway = new PublicItemResultTestGateway()
    const page = (nativeCny: boolean) => <CatalogUnitDetailPage row={{ ...view.row, ...identity }} item={view.item}
      pitContext={{ data_environment: 'LIVE_PUBLIC', channel: 'LOCAL_REAL_PIT_CATALOG', query_as_of: asOf,
        query_known_at: asOf, snapshot: { ...fixture.publication.catalog } }}
      publicResultGateway={gateway} price={nativeCny ? { gateway: { kind: 'UNUSED_PRICE', read: async () => { throw new Error('disabled') } },
        cnyPerUsd: '99', knownAt: asOf, nativeCny: true, enabled: false } : undefined}
      queryAsOf={asOf} resultAsOf={asOf} onBack={() => {}} siblingUnits={[]} />
    const rendered = render(page(false))
    await ready()
    const count = gateway.requests.length
    rendered.rerender(page(true))
    expect(screen.queryByTestId('catalog-unit-research-result')).toBeNull()
    expect(screen.getByTestId('native-cny-unavailable-result')).toBeInTheDocument()
    await act(async () => {})
    expect(gateway.requests).toHaveLength(count)
  })
})
