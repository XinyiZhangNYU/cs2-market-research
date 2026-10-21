import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import currentFixture from '../../schemas/examples/market-descriptive-public-api/v1/overview-current.json'
import emptyFixture from '../../schemas/examples/market-descriptive-public-api/v1/overview-empty.json'
import staleFixture from '../../schemas/examples/market-descriptive-public-api/v1/overview-stale.json'
import notPublishedFixture from '../../schemas/examples/market-descriptive-public-api/v1/not-published.json'
import indexDirectoryFixture from '../../schemas/examples/market-sector-index-public-api/v1/directory.json'
import indexSeriesFixture from '../../schemas/examples/market-sector-index-public-api/v1/series.json'
import type {
  MarketDescriptivePublicGateway,
  MarketDescriptiveTransportResponse,
} from '../src/api/MarketDescriptivePublicApi'
import { HttpMarketDescriptivePublicGateway } from '../src/api/HttpMarketDescriptivePublicGateway'
import type {
  MarketSectorIndexPublicGateway,
  MarketSectorIndexTransportResponse,
} from '../src/api/MarketSectorIndexPublicApi'
import { LangProvider, type Lang } from '../src/i18n'
import { PublicMarketPage } from '../src/pages/PublicMarketPage'
import { canonicalHash } from '../src/wire/canonical'
import type { MarketDescriptiveDecodeRequest } from '../src/wire/marketDescriptivePublicApiDecode'
import type { MarketSectorIndexDecodeRequest } from '../src/wire/marketSectorIndexPublicApiDecode'
import type { PersonalWatchlistController } from '../src/watchlist/personalWatchlist'

class MarketGateway implements MarketDescriptivePublicGateway {
  readonly kind = 'MARKET_PAGE_TEST'
  readonly requests: MarketDescriptiveDecodeRequest[] = []

  constructor(private readonly payload: unknown, private readonly status = 200) {}

  async read(request: MarketDescriptiveDecodeRequest): Promise<MarketDescriptiveTransportResponse> {
    this.requests.push(structuredClone(request))
    return { payload: structuredClone(this.payload), httpStatus: this.status }
  }
}

const noop = () => undefined
const unavailableIndexGateway: MarketSectorIndexPublicGateway = Object.freeze({
  kind: 'UNAVAILABLE_INDEX_TEST',
  read: async (): Promise<MarketSectorIndexTransportResponse> => ({
    httpStatus: 404,
    payload: {
      contract_name: 'market-sector-index-public-api',
      contract_version: '1',
      response_kind: 'ERROR',
      error: { code: 'NOT_PUBLISHED', retryable: false },
    },
  }),
})

class SectorIndexGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'SECTOR_INDEX_PAGE_TEST'

  async read(request: MarketSectorIndexDecodeRequest): Promise<MarketSectorIndexTransportResponse> {
    if (request.kind === 'DIRECTORY') {
      const payload: any = structuredClone(indexDirectoryFixture)
      payload.scopes.push({
        ...payload.scopes[0],
        scope_token: canonicalHash({ contract: 'market-sector-index-public-api', scope_code: 'WEAPON' }),
        scope_code: 'WEAPON',
        scope_kind: 'SECTOR',
        labels: { zh_cn: '武器', en: 'Weapons' },
      })
      return { payload, httpStatus: 200 }
    }
    const payload: any = structuredClone(indexSeriesFixture)
    payload.query.from_date = request.query.from_date
    payload.query.to_date = request.query.to_date
    payload.query.after_date = request.query.after_date
    payload.query.limit = request.query.limit
    payload.query.next_after_date = null
    if (request.query.scope_token !== payload.scope.scope_token) {
      payload.scope = {
        ...payload.scope,
        scope_token: request.query.scope_token,
        scope_code: 'WEAPON',
        scope_kind: 'SECTOR',
        labels: { zh_cn: '武器', en: 'Weapons' },
      }
    }
    return { payload, httpStatus: 200 }
  }
}
const personalWatchlist = Object.freeze({
  status: 'READY',
  entries: Object.freeze([]),
  pendingKeys: new Set<string>(),
  error: null,
  has: () => false,
  toggle: async () => {},
  addMany: async () => 0,
  remove: async () => {},
  clear: async () => {},
  importJson: async () => 0,
  exportJson: () => '',
  reload: () => {},
}) as PersonalWatchlistController

function page(gateway: MarketDescriptivePublicGateway, lang: Lang = 'zh', callbacks: {
  onSelectPublication?: (publicationId: string | null) => void
  onOpenScope?: (scopeToken: string, publicationId: string) => void
  personalWatchlist?: PersonalWatchlistController
  indexGateway?: MarketSectorIndexPublicGateway
  cnyPerUsd?: string | null
} = {}) {
  return (
    <LangProvider lang={lang}>
      <PublicMarketPage
        gateway={gateway}
        indexGateway={callbacks.indexGateway ?? unavailableIndexGateway}
        cnyPerUsd={callbacks.cnyPerUsd ?? null}
        publicationId={null}
        scopeToken={null}
        catalogHref="/catalog"
        onCatalogClick={noop}
        onSelectPublication={callbacks.onSelectPublication ?? noop}
        onOpenScope={callbacks.onOpenScope ?? noop}
        onCloseScope={noop}
        personalWatchlist={callbacks.personalWatchlist ?? personalWatchlist}
      />
    </LangProvider>
  )
}

function marketSector(payload: any, scopeId = 'WEAPON') {
  const sector = structuredClone(payload.scopes[0])
  Object.assign(sector, {
    scope_id: scopeId,
    scope_kind: 'SECTOR',
    parent_scope_id: 'ALL',
    ancestor_scope_ids: ['ALL'],
    labels: { zh_cn: '武器', en: 'Weapons' },
    scope_token: canonicalHash({ contract: 'market-descriptive-public-api', scope_id: scopeId }),
  })
  return sector
}

function marketSubsector(payload: any, scopeId: string, labels: { zh_cn: string; en: string }, ratio: string) {
  const subsector = structuredClone(payload.scopes[0])
  Object.assign(subsector, {
    scope_id: scopeId,
    scope_kind: 'SUBSECTOR',
    parent_scope_id: scopeId.slice(0, scopeId.indexOf(':')),
    ancestor_scope_ids: ['ALL', scopeId.slice(0, scopeId.indexOf(':'))],
    labels,
    raw_return_ratio: ratio,
    suppressed_return_ratio: ratio,
    return_selected_for_display: ratio,
    scope_token: canonicalHash({ contract: 'market-descriptive-public-api', scope_id: scopeId }),
  })
  return subsector
}

afterEach(cleanup)

describe('descriptive public market page', () => {
  it('shows published CNY in Chinese and current-rate USD in English without changing the payload', async () => {
    const payload: any = structuredClone(currentFixture)
    payload.scopes[0].member_price_sum_cny = '100'
    const gateway = new MarketGateway(payload)
    const view = render(page(gateway, 'en', { cnyPerUsd: '2' }))

    expect(await screen.findByText('$50.00')).toBeInTheDocument()
    expect(screen.queryByText('¥100.00')).toBeNull()
    expect(payload.scopes[0].member_price_sum_cny).toBe('100')

    view.rerender(page(new MarketGateway(payload), 'zh', { cnyPerUsd: '2' }))
    expect(await screen.findByText('¥100.00')).toBeInTheDocument()
  })

  it('renders measurements, method, dates and coverage without phase or recommendation language', async () => {
    const gateway = new MarketGateway(currentFixture)
    const view = render(page(gateway))
    const result = await screen.findByTestId('public-market-page')
    expect(result).toHaveTextContent('整体市场')
    expect(result).toHaveTextContent('诊断：原始等权日涨跌')
    expect(result).toHaveTextContent('正式：稳健等权日涨跌')
    expect(result).toHaveTextContent('成对覆盖率')
    expect(result).toHaveTextContent('统计日期')
    expect(result).toHaveTextContent('2026年9月7日')
    expect(result).toHaveTextContent('不代表市值、成交额或可投资指数')
    // Non-native (legacy USD) data is the V1 equal-weight series: the V1 method note, never the H one.
    expect(result).toHaveTextContent('每个可用成员等权，不按价格、成交量或市值加权。')
    expect(result).not.toHaveTextContent('价格分层平衡几何指数')
    expect(result).not.toHaveTextContent('市场阶段')
    expect(result).not.toHaveTextContent('系统结论')
    expect(gateway.requests).toEqual([{ kind: 'OVERVIEW', query: { publication_id: null } }])

    view.rerender(page(new MarketGateway(currentFixture), 'en'))
    expect(await screen.findByText(/No phases, forecasts or recommendations/u)).toBeInTheDocument()
  })

  it('separates market and sector pages without a duplicated sector-card entry', async () => {
    const payload: any = structuredClone(currentFixture)
    const sector = marketSector(payload)
    payload.scopes.push(sector)
    const onOpenScope = vi.fn()
    render(page(new MarketGateway(payload), 'zh', {
      onOpenScope,
    }))
    const marketTab = await screen.findByRole('tab', { name: '大盘' })
    const sectorTab = screen.getByRole('tab', { name: '板块' })
    expect(marketTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('板块观察')).toBeNull()
    expect(screen.queryByTestId(`public-market-open-scope-${sector.scope_token}`)).toBeNull()
    fireEvent.click(sectorTab)
    expect(sectorTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('heading', { name: '整体市场' })).toBeNull()
    expect(screen.queryByText('点击热力图中的板块，查看该板块的口径、覆盖与历史。')).toBeNull()
    expect(onOpenScope).not.toHaveBeenCalled()
  })

  it('opens the matching descriptive sector from its heatmap tile', async () => {
    const payload: any = structuredClone(currentFixture)
    const sector = marketSector(payload)
    payload.scopes.push(sector)
    const onOpenScope = vi.fn()
    render(page(new MarketGateway(payload), 'zh', {
      onOpenScope,
      indexGateway: new SectorIndexGateway(),
    }))
    fireEvent.click(await screen.findByRole('tab', { name: '板块' }))
    fireEvent.click(await screen.findByRole('button', { name: '查看武器板块' }))
    expect(onOpenScope).toHaveBeenCalledWith(sector.scope_token, payload.publication.publication_id)
    expect(screen.queryByTestId(`public-market-open-scope-${sector.scope_token}`)).toBeNull()
  })

  it('opens the matching descriptive sector while isolating its chart line from the legend', async () => {
    const payload: any = structuredClone(currentFixture)
    const sector = marketSector(payload)
    payload.scopes.push(sector)
    const onOpenScope = vi.fn()
    render(page(new MarketGateway(payload), 'zh', {
      onOpenScope,
      indexGateway: new SectorIndexGateway(),
    }))
    fireEvent.click(await screen.findByRole('tab', { name: '板块' }))
    const legendButton = await screen.findByRole('button', { name: '只看武器并打开板块详情' })
    fireEvent.click(legendButton)
    expect(legendButton).toHaveAttribute('aria-pressed', 'true')
    expect(onOpenScope).toHaveBeenCalledWith(sector.scope_token, payload.publication.publication_id)
    expect(await screen.findByRole('img', { name: '板块指数相对窗口起点：武器' })).toHaveAttribute(
      'data-series-count',
      '1',
    )
  })

  it('keeps the market shell mounted and reuses prefetched scope reads while switching sectors', async () => {
    const overview: any = structuredClone(currentFixture)
    const weapon = marketSector(overview, 'WEAPON')
    const cases = marketSector(overview, 'CASE')
    cases.labels = { zh_cn: '武器箱', en: 'Cases' }
    overview.scopes.push(weapon, cases)
    const scopeDocument = (scope: any) => {
      const document = structuredClone(overview)
      document.operation = 'SCOPE'
      document.scopes = [scope]
      document.headline = { ...document.headline, scope }
      return document
    }
    let resolveCases!: (response: MarketDescriptiveTransportResponse) => void
    const casesResponse = new Promise<MarketDescriptiveTransportResponse>((resolve) => {
      resolveCases = resolve
    })
    const requests: MarketDescriptiveDecodeRequest[] = []
    const gateway: MarketDescriptivePublicGateway = {
      kind: 'SCOPE_SWITCH_CACHE_TEST',
      read: async (request) => {
        requests.push(structuredClone(request))
        if (request.kind === 'OVERVIEW') {
          return { payload: structuredClone(overview), httpStatus: 200 }
        }
        if (request.query.scope_token === weapon.scope_token) {
          return { payload: scopeDocument(weapon), httpStatus: 200 }
        }
        return await casesResponse
      },
    }
    const marketPage = (scopeToken: string) => (
      <LangProvider lang="zh">
        <PublicMarketPage
          gateway={gateway}
          indexGateway={unavailableIndexGateway}
          publicationId={null}
          scopeToken={scopeToken}
          catalogHref="/catalog"
          onCatalogClick={noop}
          onSelectPublication={noop}
          onOpenScope={noop}
          onCloseScope={noop}
          personalWatchlist={personalWatchlist}
        />
      </LangProvider>
    )
    const view = render(marketPage(weapon.scope_token))
    expect(await screen.findByRole('heading', { name: /^武器$/u })).toBeInTheDocument()
    await waitFor(() => expect(requests.filter((request) => request.kind === 'SCOPE')).toHaveLength(2))

    view.rerender(marketPage(cases.scope_token))
    expect(screen.getByTestId('public-market-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^武器箱$/u })).toBeInTheDocument()
    expect(screen.getByText('正在读取该板块的完整历史…')).toBeInTheDocument()
    resolveCases({ payload: scopeDocument(cases), httpStatus: 200 })
    await waitFor(() => expect(screen.queryByText('正在读取该板块的完整历史…')).toBeNull())

    expect(requests.filter((request) => request.kind === 'OVERVIEW')).toHaveLength(1)
    expect(requests.filter((request) => request.kind === 'SCOPE')).toHaveLength(2)
  })

  it('restores the selected weapon sector child comparison with formal values and high-value skin illustrations', async () => {
    const overview: any = structuredClone(currentFixture)
    const sector = marketSector(overview)
    const rifle = marketSubsector(
      overview,
      'WEAPON:RIFLE',
      { zh_cn: '步枪', en: 'Rifles' },
      '-0.004',
    )
    const sniper = marketSubsector(
      overview,
      'WEAPON:SNIPER',
      { zh_cn: '狙击步枪', en: 'Sniper rifles' },
      '0.001',
    )
    overview.scopes.push(sector, rifle, sniper)
    const scopeDocument = structuredClone(overview)
    scopeDocument.operation = 'SCOPE'
    scopeDocument.scopes = [sector]
    scopeDocument.headline = { ...scopeDocument.headline, scope: sector }
    const gateway: MarketDescriptivePublicGateway = {
      kind: 'CHILD_COMPARISON_TEST',
      read: async (request) => ({
        payload: request.kind === 'OVERVIEW' ? structuredClone(overview) : structuredClone(scopeDocument),
        httpStatus: 200,
      }),
    }
    const onOpenScope = vi.fn()
    render(
      <LangProvider lang="zh">
        <PublicMarketPage
          gateway={gateway}
          indexGateway={unavailableIndexGateway}
          publicationId={null}
          scopeToken={sector.scope_token}
          catalogHref="/catalog"
          onCatalogClick={noop}
          onSelectPublication={noop}
          onOpenScope={onOpenScope}
          onCloseScope={noop}
          personalWatchlist={personalWatchlist}
        />
      </LangProvider>,
    )
    expect(await screen.findByRole('heading', { name: '武器分类板块对比' })).toBeInTheDocument()
    expect(screen.getByText('步枪')).toBeInTheDocument()
    expect(screen.getByText('狙击步枪')).toBeInTheDocument()
    expect(screen.getByText('-0.4%')).toBeInTheDocument()
    expect(screen.getByText('0.1%')).toBeInTheDocument()
    expect(screen.getByTestId('equipment-image-skin_ak47_wild_lotus')).toBeInTheDocument()
    expect(screen.getByTestId('equipment-image-skin_awp_dragon_lore')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId(`public-market-open-scope-${rifle.scope_token}`))
    expect(onOpenScope).toHaveBeenCalledWith(rifle.scope_token, overview.publication.publication_id)
  })

  it('resolves a saved scope token against the latest formal publication before opening it', async () => {
    const overview: any = structuredClone(currentFixture)
    const sector = marketSector(overview, 'CASE')
    sector.labels = { zh_cn: '武器箱', en: 'Cases' }
    overview.scopes.push(sector)
    const scopeDocument = structuredClone(overview)
    scopeDocument.operation = 'SCOPE'
    scopeDocument.scopes = [sector]
    scopeDocument.headline = { ...scopeDocument.headline, scope: sector }
    const requests: MarketDescriptiveDecodeRequest[] = []
    const gateway: MarketDescriptivePublicGateway = {
      kind: 'LATEST_SCOPE_TEST',
      read: async (request) => {
        requests.push(structuredClone(request))
        return {
          payload: request.kind === 'OVERVIEW' ? structuredClone(overview) : structuredClone(scopeDocument),
          httpStatus: 200,
        }
      },
    }
    render(
      <LangProvider lang="zh">
        <PublicMarketPage
          gateway={gateway}
          indexGateway={unavailableIndexGateway}
          publicationId={null}
          scopeToken={sector.scope_token}
          catalogHref="/catalog"
          onCatalogClick={noop}
          onSelectPublication={noop}
          onOpenScope={noop}
          onCloseScope={noop}
          personalWatchlist={personalWatchlist}
        />
      </LangProvider>,
    )
    expect(await screen.findByRole('heading', { name: '武器箱' })).toBeInTheDocument()
    expect(requests).toEqual([
      { kind: 'OVERVIEW', query: { publication_id: null } },
      {
        kind: 'SCOPE',
        query: {
          publication_id: overview.publication.publication_id,
          scope_token: sector.scope_token,
        },
      },
    ])
  })

  it('reopens a saved scope from the most recent publication that still contains it', async () => {
    const overview: any = structuredClone(currentFixture)
    const sector = marketSector(overview, 'CASE')
    sector.labels = { zh_cn: '武器箱', en: 'Cases' }
    overview.history[0].publication_id = 'b'.repeat(64)
    overview.history[0].scopes.push(sector)
    const scopeDocument = structuredClone(overview)
    scopeDocument.operation = 'SCOPE'
    scopeDocument.response_kind = 'RESULT'
    scopeDocument.publication.publication_id = overview.history[0].publication_id
    scopeDocument.scopes = [sector]
    scopeDocument.headline = { ...scopeDocument.headline, publication_id: overview.history[0].publication_id, scope: sector }
    const requests: MarketDescriptiveDecodeRequest[] = []
    const gateway: MarketDescriptivePublicGateway = {
      kind: 'LATEST_RETAINED_SCOPE_TEST',
      read: async (request) => {
        requests.push(structuredClone(request))
        return {
          payload: request.kind === 'OVERVIEW' ? structuredClone(overview) : structuredClone(scopeDocument),
          httpStatus: 200,
        }
      },
    }
    render(
      <LangProvider lang="zh">
        <PublicMarketPage
          gateway={gateway}
          indexGateway={unavailableIndexGateway}
          publicationId={null}
          scopeToken={sector.scope_token}
          catalogHref="/catalog"
          onCatalogClick={noop}
          onSelectPublication={noop}
          onOpenScope={noop}
          onCloseScope={noop}
          personalWatchlist={personalWatchlist}
        />
      </LangProvider>,
    )
    expect(await screen.findByRole('heading', { name: '武器箱' })).toBeInTheDocument()
    expect(requests).toEqual([
      { kind: 'OVERVIEW', query: { publication_id: null } },
      {
        kind: 'SCOPE',
        query: {
          publication_id: overview.history[0].publication_id,
          scope_token: sector.scope_token,
        },
      },
    ])
  })

  it('distinguishes a sealed empty release from a stale retained statistic and a service error', async () => {
    const empty = render(page(new MarketGateway(emptyFixture)))
    expect(await screen.findByRole('heading', { name: '本次发布没有可展示的市场统计' })).toBeInTheDocument()
    expect(screen.getByText(/这不是服务故障/u)).toBeInTheDocument()
    empty.unmount()

    const stale = render(page(new MarketGateway(staleFixture)))
    expect(await screen.findByText('暂无近期统计')).toBeInTheDocument()
    expect(screen.getByText(/仅是仍在保留期内的历史结果/u)).toBeInTheDocument()
    stale.unmount()

    render(page(new MarketGateway(notPublishedFixture, 404)))
    const problem = (await screen.findByRole('heading', { name: '尚无正式发布' })).closest('[role="status"]')
    expect(problem).toHaveAttribute('data-error-code', 'NOT_PUBLISHED')
  })

  it('shows an origin outage as retryable service unavailability', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      transport_error: { code: 'ORIGIN_UNAVAILABLE', http_status: 503 },
    }), { status: 503, headers: { 'Content-Type': 'application/json' } }))
    render(page(new HttpMarketDescriptivePublicGateway({ fetcher })))
    const problem = (await screen.findByRole('heading', { name: '结果服务暂不可用' })).closest('[role="status"]')
    expect(problem).toHaveAttribute('data-error-code', 'TRANSPORT')
    expect(problem).not.toHaveTextContent('结果未通过校验')
  })
})
