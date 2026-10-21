import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import watchlistFixture from '../../schemas/examples/market-watchlist-public-observation-watchlist.valid.json'
import detailFixture from '../../schemas/examples/market-watchlist-public-observation-detail.valid.json'
import emptyFixture from '../../schemas/examples/market-watchlist-public-observation-empty.valid.json'
import staleFixture from '../../schemas/examples/market-watchlist-public-observation-stale.valid.json'
import errorFixture from '../../schemas/examples/market-watchlist-public-observation-error.valid.json'
import unavailableFixture from '../../schemas/examples/market-watchlist-public-observation-unavailable.valid.json'
import corruptFixture from '../../schemas/examples/market-watchlist-public-observation-corrupt.valid.json'
import { PublicBetaApp } from '../src/PublicBetaApp'
import type {
  MarketWatchlistObservationGateway,
  ObservationRequest,
  TransportResponse,
} from '../src/api/MarketWatchlistObservationApi'
import type { MarketWatchlistPublicGateway } from '../src/api/MarketWatchlistPublicApi'
import type { FxReferenceGateway, FxReferenceRequest } from '../src/api/FxReferenceApi'
import { LangProvider } from '../src/i18n'
import { PublicObservationWatchlistPage } from '../src/pages/PublicObservationWatchlistPage'
import type {
  PersonalWatchTarget,
  PersonalWatchlistStore,
} from '../src/watchlist/personalWatchlist'

const PUBLICATION_ID = watchlistFixture.publication.publication_id
const UNIT_ID = watchlistFixture.members[0].analysis_unit_id

function statusFor(payload: any): number {
  if (payload?.response_kind !== 'ERROR') return 200
  if (payload.error.code === 'INVALID_ARGUMENT' || payload.error.code === 'INVALID_CURSOR') return 400
  if (payload.error.code === 'NOT_PUBLISHED' || payload.error.code === 'NOT_FOUND') return 404
  if (payload.error.code === 'PUBLICATION_EXPIRED' || payload.error.code === 'PUBLICATION_WITHDRAWN') return 410
  return 503
}

class ObservationFixtureGateway implements MarketWatchlistObservationGateway {
  readonly kind = 'OBSERVATION_FIXTURE'
  readonly requests: ObservationRequest[] = []

  constructor(
    private readonly listPayload: unknown = watchlistFixture,
    private readonly detailPayload: unknown = detailFixture,
    private readonly failure: Error | null = null,
  ) {}

  async read(request: ObservationRequest): Promise<TransportResponse> {
    this.requests.push(structuredClone(request))
    if (this.failure) throw this.failure
    const payload = structuredClone(
      request.kind === 'OBSERVATION_DETAIL' ? this.detailPayload : this.listPayload,
    )
    return { payload, httpStatus: statusFor(payload) }
  }
}

function paginatedSecondPage(): any {
  const payload = structuredClone(watchlistFixture) as any
  payload.total = 2
  payload.query.cursor = 'nextpage'
  payload.members[0].position = 2
  payload.members[0].observation_id = '6'.repeat(64)
  payload.members[0].analysis_unit_id = 'item:fixture-002'
  payload.members[0].signal_observed_at = '2026-09-06T11:57:00.000000Z'
  payload.members[0].catalog.analysis_unit_id = 'item:fixture-002'
  payload.members[0].catalog.base_item_code = 'weapon.m4a1s.paint.printstream'
  payload.members[0].catalog.localized_name = {
    en: 'M4A1-S | Printstream (Field-Tested)',
    zh_cn: 'M4A1 消音型 | 印花集（久经沙场）',
  }
  payload.next_cursor = null
  return payload
}

class PaginatedObservationGateway implements MarketWatchlistObservationGateway {
  readonly kind = 'OBSERVATION_PAGINATED_FIXTURE'
  readonly requests: ObservationRequest[] = []

  constructor(private readonly secondPayload: unknown = paginatedSecondPage()) {}

  async read(request: ObservationRequest): Promise<TransportResponse> {
    this.requests.push(structuredClone(request))
    if (request.kind === 'OBSERVATION_DETAIL') {
      return { payload: structuredClone(detailFixture), httpStatus: 200 }
    }
    if (request.query.cursor === null) {
      const payload = structuredClone(watchlistFixture) as any
      payload.total = 2
      payload.next_cursor = 'nextpage'
      return { payload, httpStatus: 200 }
    }
    const payload = structuredClone(this.secondPayload)
    return { payload, httpStatus: statusFor(payload) }
  }
}

class EmptyPersonalWatchlistStore implements PersonalWatchlistStore {
  async readAll(): Promise<readonly PersonalWatchTarget[]> { return [] }
  async put(): Promise<void> {}
  async putMany(): Promise<void> {}
  async remove(): Promise<void> {}
  async clear(): Promise<void> {}
}

class FixedFxGateway implements FxReferenceGateway {
  readonly kind = 'FIXED_FX'

  async read(request: FxReferenceRequest): Promise<unknown> {
    return {
      api_contract: 'fx-reference-api',
      api_version: 'v1',
      response_kind: 'FX_REFERENCE_CURRENT',
      query: { known_at: request.known_at },
      reference: {
        authority: 'ECB',
        available_at: '2026-09-06T10:00:00.000000Z',
        carry_days: 0,
        cny_per_usd: '6.71089313',
        cny_valid_from: '2026-09-06T10:00:00.000000Z',
        method: 'ECB_EUR_CROSS',
        source_event_date: '2026-09-06',
        usage: 'REFERENCE_RATE_INFORMATIONAL_ONLY',
        usd_valid_from: '2026-09-06T10:00:00.000000Z',
      },
    }
  }
}

const noopCatalogClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => event.preventDefault())

function renderPage(
  gateway: MarketWatchlistObservationGateway,
  options: Readonly<{
    lang?: 'zh' | 'en'
    asOf?: string | null
    publicationId?: string | null
    selectedUnitId?: string | null
    onOpenMember?: (publicationId: string, analysisUnitId: string, asOf: string) => void
  }> = {},
) {
  return render(
    <LangProvider lang={options.lang ?? 'zh'}>
      <PublicObservationWatchlistPage
        gateway={gateway}
        asOf={options.asOf ?? null}
        publicationId={options.publicationId ?? null}
        selectedUnitId={options.selectedUnitId ?? null}
        catalogHref="/catalog"
        onCatalogClick={noopCatalogClick}
        onOpenMember={options.onOpenMember ?? vi.fn()}
        onCloseMember={vi.fn()}
      />
    </LangProvider>,
  )
}

describe('public observation watchlist', () => {
  it('renders factual Chinese observations without recommendation-rank semantics', async () => {
    const gateway = new ObservationFixtureGateway()
    const onOpenMember = vi.fn()
    const user = userEvent.setup()
    renderPage(gateway, { onOpenMember })

    const page = await screen.findByTestId('public-observation-page')
    expect(page).toHaveTextContent('真实异动观察榜')
    expect(page).toHaveTextContent('未验证观察')
    expect(page).toHaveTextContent('AK-47 | 红线（久经沙场）')
    expect(page).toHaveTextContent('首次进入观察')
    expect(page).toHaveTextContent('供给侧异动先出现')
    expect(page).toHaveTextContent('3/3 个来源 · 234 条观测')
    expect(page).toHaveTextContent('按最近异动出现时间排列')
    expect(page).not.toHaveTextContent(/推荐|第\s*1\s*名|SHADOW_UNVALIDATED/u)
    expect(gateway.requests).toEqual([{
      kind: 'OBSERVATION_WATCHLIST',
      query: {
        as_of: null,
        publication_id: null,
        sort: 'SIGNAL_TIME_DESC',
        page_size: 50,
        cursor: null,
      },
    }])

    await user.click(screen.getByRole('button', { name: /AK-47/u }))
    expect(onOpenMember).toHaveBeenCalledWith(
      PUBLICATION_ID,
      UNIT_ID,
      watchlistFixture.publication.as_of,
    )
  })

  it('loads exact detail on demand in English and links to the bound catalog snapshot', async () => {
    const gateway = new ObservationFixtureGateway()
    renderPage(gateway, {
      lang: 'en',
      asOf: detailFixture.publication.as_of,
      publicationId: PUBLICATION_ID,
      selectedUnitId: UNIT_ID,
    })

    const detail = await screen.findByTestId('public-observation-detail')
    expect(detail).toHaveTextContent('Current observation facts')
    expect(detail).toHaveTextContent('Unvalidated observation')
    expect(detail).toHaveTextContent('AK-47 | Redline (Field-Tested)')
    expect(detail).toHaveTextContent('First observed entry')
    expect(detail).toHaveTextContent('Complete')
    expect(detail).not.toHaveTextContent(/FORMAL RESULT|recommendation|rank|SHADOW_UNVALIDATED/u)
    expect(gateway.requests).toEqual([{
      kind: 'OBSERVATION_DETAIL',
      query: { publication_id: PUBLICATION_ID, analysis_unit_id: UNIT_ID },
    }])
    expect(within(detail).getByRole('link', { name: /View product/u })).toHaveAttribute(
      'href',
      `/research?unit=${encodeURIComponent(UNIT_ID)}` +
        `&snapshot=${detailFixture.publication.catalog.snapshot_id}` +
        `&as_of=${encodeURIComponent(detailFixture.publication.as_of)}&lang=en`,
    )
  })

  it('loads the next page only on demand and pins it to the first publication', async () => {
    const gateway = new PaginatedObservationGateway()
    const user = userEvent.setup()
    renderPage(gateway)

    expect(await screen.findByText('AK-47 | 红线（久经沙场）')).toBeInTheDocument()
    expect(gateway.requests).toHaveLength(1)
    expect(screen.queryByText('M4A1 消音型 | 印花集（久经沙场）')).toBeNull()

    await user.click(screen.getByRole('button', { name: '继续加载' }))
    expect(await screen.findByText('M4A1 消音型 | 印花集（久经沙场）')).toBeInTheDocument()
    expect(gateway.requests).toEqual([
      {
        kind: 'OBSERVATION_WATCHLIST',
        query: {
          as_of: null,
          publication_id: null,
          sort: 'SIGNAL_TIME_DESC',
          page_size: 50,
          cursor: null,
        },
      },
      {
        kind: 'OBSERVATION_WATCHLIST',
        query: {
          as_of: null,
          publication_id: PUBLICATION_ID,
          sort: 'SIGNAL_TIME_DESC',
          page_size: 50,
          cursor: 'nextpage',
        },
      },
    ])
    expect(screen.queryByRole('button', { name: '继续加载' })).toBeNull()
  })

  it('fails closed and clears prior rows when a continuation reports withdrawal', async () => {
    const withdrawn = structuredClone(errorFixture) as any
    withdrawn.error.code = 'PUBLICATION_WITHDRAWN'
    const user = userEvent.setup()
    renderPage(new PaginatedObservationGateway(withdrawn))

    expect(await screen.findByText('AK-47 | 红线（久经沙场）')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '继续加载' }))
    expect(await screen.findByText('这次观察已撤回')).toBeInTheDocument()
    expect(screen.queryByText('AK-47 | 红线（久经沙场）')).toBeNull()
  })

  it('fails closed on cross-page overlap instead of concatenating inconsistent rows', async () => {
    const overlapping = paginatedSecondPage()
    overlapping.members[0].analysis_unit_id = UNIT_ID
    overlapping.members[0].catalog.analysis_unit_id = UNIT_ID
    const user = userEvent.setup()
    renderPage(new PaginatedObservationGateway(overlapping))

    expect(await screen.findByText('AK-47 | 红线（久经沙场）')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '继续加载' }))
    expect(await screen.findByText('观察数据未通过校验')).toBeInTheDocument()
    expect(screen.queryByText('AK-47 | 红线（久经沙场）')).toBeNull()
  })

  it('accepts a same-publication continuation crossing into retained-stale state', async () => {
    const staleContinuation = paginatedSecondPage()
    staleContinuation.query.query_known_at = '2026-09-06T14:00:00.000000Z'
    staleContinuation.publication.freshness = 'STALE_RETAINED'
    const user = userEvent.setup()
    renderPage(new PaginatedObservationGateway(staleContinuation))

    expect(await screen.findByText('当前观察快照')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '继续加载' }))
    expect(await screen.findByText('保留中的旧观察')).toBeInTheDocument()
    expect(screen.getByText('M4A1 消音型 | 印花集（久经沙场）')).toBeInTheDocument()
    expect(screen.queryByText('观察数据未通过校验')).toBeNull()
  })

  it('rejects non-canonical observation and quality reason ordering', async () => {
    const reasons = structuredClone(watchlistFixture) as any
    reasons.members[0].reason_codes = ['SUPPLY_LEAD', 'FIRST_ENTRY']
    const first = renderPage(new ObservationFixtureGateway(reasons))
    expect(await screen.findByText('观察数据未通过校验')).toBeInTheDocument()
    first.unmount()

    const quality = structuredClone(watchlistFixture) as any
    quality.publication.data_quality = {
      status: 'DEGRADED_OPTIONAL',
      reason_codes: ['STALE_RETAINED', 'OPTIONAL_SOURCE_UNAVAILABLE'],
    }
    renderPage(new ObservationFixtureGateway(quality))
    expect(await screen.findByText('观察数据未通过校验')).toBeInTheDocument()
  })

  it('rejects a detail whose publication clock does not match the selected URL', async () => {
    renderPage(new ObservationFixtureGateway(), {
      publicationId: PUBLICATION_ID,
      selectedUnitId: UNIT_ID,
      asOf: '2026-09-06T12:05:00.000000Z',
    })
    expect(await screen.findByText('观察数据未通过校验')).toBeInTheDocument()
    expect(screen.queryByTestId('public-observation-detail')).toBeNull()
  })

  it('separates a sealed empty publication from a retained stale publication', async () => {
    const emptyView = renderPage(new ObservationFixtureGateway(emptyFixture))
    const empty = await screen.findByTestId('public-observation-page')
    expect(empty).toHaveTextContent('当前没有异动观察')
    expect(empty).toHaveTextContent('当前观察快照')
    emptyView.unmount()

    renderPage(new ObservationFixtureGateway(staleFixture))
    const stale = await screen.findByTestId('public-observation-page')
    expect(stale).toHaveTextContent('保留中的旧观察')
    expect(stale).toHaveTextContent('该观察已超过新鲜期')
    expect(stale).toHaveTextContent('当前没有异动观察')
  })

  it.each([
    ['NOT_PUBLISHED', errorFixture, '真实异动观察尚未发布'],
    ['BACKEND_UNAVAILABLE', unavailableFixture, '异动观察暂不可用'],
    ['RESULT_CORRUPT', corruptFixture, '观察数据未通过校验'],
  ] as const)('fails closed for %s without substituting another lane', async (_code, fixture, title) => {
    const gateway = new ObservationFixtureGateway(fixture)
    renderPage(gateway)
    await screen.findByText(title)
    const problem = screen.getByText(title).closest('[role="status"]')
    expect(problem).not.toBeNull()
    if (!problem) throw new TypeError('observation problem container is missing')
    expect(problem).toHaveTextContent(title)
    expect(problem).toHaveTextContent(/不会|已被拒绝/u)
    expect(problem).not.toHaveTextContent(/我的关注|正式系统观察榜|回顾榜/u)
    expect(gateway.requests).toHaveLength(1)
  })

  it('distinguishes withdrawal, malformed responses and transport failure', async () => {
    const withdrawn = structuredClone(errorFixture)
    withdrawn.error.code = 'PUBLICATION_WITHDRAWN'
    const first = renderPage(new ObservationFixtureGateway(withdrawn))
    expect(await screen.findByText('这次观察已撤回')).toBeInTheDocument()
    first.unmount()

    const malformed = structuredClone(watchlistFixture) as any
    malformed.members[0].recommendation = 'BUY'
    const second = renderPage(new ObservationFixtureGateway(malformed))
    expect(await screen.findByText('观察数据未通过校验')).toBeInTheDocument()
    second.unmount()

    renderPage(new ObservationFixtureGateway(watchlistFixture, detailFixture, new TypeError('offline secret')))
    await screen.findByText('异动观察暂不可用')
    const transport = screen.getByText('异动观察暂不可用').closest('[role="status"]')
    expect(transport).not.toBeNull()
    if (!transport) throw new TypeError('transport problem container is missing')
    expect(transport).toHaveTextContent('异动观察暂不可用')
    expect(transport).not.toHaveTextContent('offline secret')
  })

  it('keeps the research-only observation lane out of the public application route', async () => {
    window.history.replaceState(
      null,
      '',
      `/watchlist?lang=en&view=observation&as_of=${encodeURIComponent(watchlistFixture.publication.as_of)}&publication=${PUBLICATION_ID}&unit=${encodeURIComponent(UNIT_ID)}`,
    )
    const observation = new ObservationFixtureGateway()
    const formalRead = vi.fn(async () => { throw new Error('formal lane must remain idle') })
    const formal = { kind: 'FORMAL_IDLE', read: formalRead } satisfies MarketWatchlistPublicGateway

    render(
      <PublicBetaApp
        publicResultGateway={formal}
        personalWatchlistStore={new EmptyPersonalWatchlistStore()}
        fxGateway={new FixedFxGateway()}
        now={() => new Date('2026-09-06T12:05:00.000Z')}
      />,
    )

    expect(await screen.findByTestId('public-route-error')).toBeInTheDocument()
    expect(observation.requests).toHaveLength(0)
    expect(formalRead).toHaveBeenCalledTimes(0)
    expect(screen.queryByRole('link', { name: 'Anomaly observations' })).toBeNull()
    expect(screen.queryByTestId('public-observation-page')).toBeNull()
    expect(document.body).not.toHaveTextContent('Real anomaly observations')
  })

  it('contains explicit compact, narrow-layout and reduced-motion rules', () => {
    const css = readFileSync(resolve(import.meta.dirname, '../src/styles.css'), 'utf8')
    expect(css).toContain('.public-observation__list')
    expect(css).toMatch(/@media \(max-width: 900px\)[\s\S]*?\.public-observation__list/u)
    expect(css).toMatch(/@media \(max-width: 560px\)[\s\S]*?\.public-observation-detail__facts/u)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?public-result-message--loading/u)
  })
})
