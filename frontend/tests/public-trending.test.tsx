import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import listFixture from '../../schemas/examples/single-item-trending-list.valid.json'
import emptyFixture from '../../schemas/examples/single-item-trending-empty.valid.json'
import notPublishedFixture from '../../schemas/examples/single-item-trending-not-published.valid.json'
import type {
  SingleItemTrendingPublicGateway,
  TrendingReadOptions,
  TrendingTransportResponse,
} from '../src/api/SingleItemTrendingPublicApi'
import { LangProvider } from '../src/i18n'
import { PublicTrendingPage } from '../src/pages/PublicTrendingPage'
import type {
  TrendingFilters,
  TrendingListQuery,
  TrendingListResponse,
} from '../src/wire/singleItemTrendingPublicApiTypes'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

const EMPTY_FILTERS = Object.freeze({
  item_kind: null,
  base_item_code: null,
  edition_kind: null,
  wear_tier: null,
} satisfies TrendingFilters)

function boundDocument(query: TrendingListQuery): TrendingListResponse {
  const source = structuredClone(query.direction === 'GAINERS' ? listFixture : emptyFixture) as any
  source.query = {
    ...source.query,
    ...structuredClone(query),
    publication_id: query.publication_id ?? source.publication.publication_id,
  }
  return source as TrendingListResponse
}

class PageGateway implements SingleItemTrendingPublicGateway {
  readonly kind = 'TRENDING_PAGE_TEST'
  readonly requests: TrendingListQuery[] = []

  constructor(private readonly mode: 'READY' | 'NOT_PUBLISHED' = 'READY') {}

  async read(
    query: TrendingListQuery,
    _options: TrendingReadOptions = {},
  ): Promise<TrendingTransportResponse> {
    this.requests.push(structuredClone(query))
    return this.mode === 'NOT_PUBLISHED'
      ? { payload: structuredClone(notPublishedFixture), httpStatus: 404 }
      : { payload: boundDocument(query), httpStatus: 200 }
  }
}

class PaginatedGateway implements SingleItemTrendingPublicGateway {
  readonly kind = 'TRENDING_PAGINATED_TEST'
  readonly requests: TrendingListQuery[] = []

  async read(query: TrendingListQuery): Promise<TrendingTransportResponse> {
    this.requests.push(structuredClone(query))
    const source = structuredClone(listFixture) as any
    const publicationId = source.publication.publication_id
    const members = Array.from({ length: 25 }, (_, offset) => {
      const rank = offset + 1
      const member = structuredClone(source.members[0])
      member.rank = rank
      member.analysis_unit_id = `item:trending-${rank}`
      member.tie_break_key = member.analysis_unit_id
      member.measurement_id = rank.toString(16).padStart(64, '0')
      member.conservative_same_direction_change_floor_ratio = `0.${(26 - rank).toString().padStart(8, '0')}`
      member.catalog.analysis_unit_id = member.analysis_unit_id
      member.catalog.localized_name = {
        en: `Trending item ${rank}`,
        zh_cn: `涨跌商品 ${rank}`,
      }
      return member
    })
    source.query = {
      ...source.query,
      ...structuredClone(query),
      publication_id: query.publication_id ?? publicationId,
    }
    source.publication.accounting.eligible_count = 25
    source.publication.accounting.direction_eligible_count = 25
    source.publication.accounting.three_source_endpoint_count = 25
    source.publication.accounting.qualified_three_source_endpoint_count = 25
    const ratio = Math.floor(25 * 10000 / source.publication.accounting.member_count)
    source.publication.accounting.direction_eligible_ratio_bps = ratio
    source.publication.accounting.three_source_endpoint_ratio_bps = ratio
    source.publication.accounting.qualified_three_source_endpoint_ratio_bps = ratio
    source.publication.accounting.excluded_count = source.publication.accounting.member_count - 25
    source.publication.accounting.status_counts.ELIGIBLE_A3 = 25
    source.publication.accounting.status_counts.INSUFFICIENT_THREE_SOURCES =
      source.publication.accounting.member_count - 25
    source.publication.accounting.gainer_count = 25
    source.total = 25
    source.members = query.cursor === null ? members.slice(0, 24) : members.slice(24)
    source.next_cursor = query.cursor === null ? 'cursor_24' : null
    return { payload: source, httpStatus: 200 }
  }
}

function pageElement(
  gateway: SingleItemTrendingPublicGateway,
  onQueryChange = vi.fn(),
  lang: 'zh' | 'en' = 'zh',
  direction: 'GAINERS' | 'LOSERS' = 'GAINERS',
) {
  return (
    <LangProvider lang={lang}>
      <PublicTrendingPage
        gateway={gateway}
        asOf={null}
        publicationId={null}
        direction={direction}
        filters={EMPTY_FILTERS}
        catalogHref="/catalog"
        onCatalogClick={() => {}}
        onQueryChange={onQueryChange}
      />
    </LangProvider>
  )
}

function renderPage(
  gateway: SingleItemTrendingPublicGateway,
  onQueryChange = vi.fn(),
  lang: 'zh' | 'en' = 'zh',
  direction: 'GAINERS' | 'LOSERS' = 'GAINERS',
) {
  return render(pageElement(gateway, onQueryChange, lang, direction))
}

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

describe('public 30-day Price Movers page', () => {
  it('renders a compact retrospective ranking without watchlist or predictive semantics', async () => {
    const gateway = new PageGateway()
    renderPage(gateway)

    const page = await screen.findByTestId('public-trending-page')
    expect(page).toHaveTextContent('30日涨跌')
    expect(page).toHaveTextContent('回顾性统计')
    expect(page).toHaveTextContent('30 日保守变动')
    expect(page).toHaveTextContent('三个市场同向')
    expect(page).toHaveTextContent('本页只描述过去 30 日')
    expect(page).not.toHaveTextContent('单品观察榜')
    expect(page).not.toHaveTextContent('系统结论')
    expect(page).not.toHaveTextContent('预期收益')
    expect(gateway.requests).toEqual([{
      as_of: null,
      publication_id: null,
      direction: 'GAINERS',
      page_size: 24,
      cursor: null,
      filters: EMPTY_FILTERS,
    }])
    const product = within(page).getByRole('link', { name: /合同样例/u })
    expect(product).toHaveAttribute('href', expect.stringContaining('/research?'))
    expect(product).toHaveAttribute('href', expect.stringContaining('snapshot='))
  })

  it('keeps direction and filters explicit route actions that replace the rendered query', async () => {
    const onQueryChange = vi.fn()
    renderPage(new PageGateway(), onQueryChange)
    const page = await screen.findByTestId('public-trending-page')
    const group = within(page).getByRole('group', { name: '排行方向' })
    expect(within(group).getByRole('button', { name: '涨幅榜' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(within(group).getByRole('button', { name: '跌幅榜' }))
    expect(onQueryChange).toHaveBeenCalledWith('LOSERS', EMPTY_FILTERS)

    await userEvent.selectOptions(within(page).getByLabelText('商品类型'), 'WEAPON')
    expect(onQueryChange).toHaveBeenLastCalledWith('GAINERS', {
      ...EMPTY_FILTERS,
      item_kind: 'WEAPON',
      base_item_code: null,
    })
  })

  it('retains settled results and geometry while a replacement query is pending', async () => {
    const replacement = deferred<TrendingTransportResponse>()
    const firstPage = new PaginatedGateway()
    const requests: TrendingListQuery[] = []
    const gateway: SingleItemTrendingPublicGateway = {
      kind: 'TRENDING_STABLE_REFRESH_TEST',
      async read(query) {
        requests.push(structuredClone(query))
        return query.direction === 'GAINERS' ? firstPage.read(query) : replacement.promise
      },
    }
    const rendered = renderPage(gateway)
    expect(await screen.findByText('涨跌商品 24')).toBeInTheDocument()

    rendered.rerender(pageElement(gateway, vi.fn(), 'zh', 'LOSERS'))
    await waitFor(() => expect(requests).toHaveLength(2))
    const content = document.querySelector('.public-trending__content')
    expect(content).toHaveAttribute('aria-busy', 'true')
    expect(content).toHaveClass('is-refreshing')
    expect(screen.getByText('涨跌商品 24')).toBeInTheDocument()
    const loadMore = screen.getByRole('button', { name: '继续加载' })
    expect(loadMore).toBeDisabled()
    loadMore.focus()
    await userEvent.keyboard('{Enter}')
    expect(requests).toHaveLength(2)

    await act(async () => replacement.resolve({
      payload: boundDocument(requests[1]),
      httpStatus: 200,
    }))
    await waitFor(() => expect(content).toHaveAttribute('aria-busy', 'false'))
    expect(content).not.toHaveClass('is-refreshing')
    expect(screen.queryByText('涨跌商品 24')).toBeNull()
    expect(screen.getByRole('heading', { name: '当前筛选没有入榜商品' })).toBeInTheDocument()
  })

  it('shows a controlled unpublished state without inserting fixture or watchlist rows', async () => {
    renderPage(new PageGateway('NOT_PUBLISHED'))
    const title = await screen.findByRole('heading', { name: '涨跌排行尚未发布' })
    const problem = title.closest('[role="status"]')
    expect(problem).not.toBeNull()
    expect(problem).toHaveAttribute('data-error-code', 'NOT_PUBLISHED')
    expect(problem).toHaveTextContent('涨跌排行尚未发布')
    expect(problem).toHaveTextContent('不会用单品观察榜或其它内容代替')
    expect(screen.queryByText(/合同样例/u)).toBeNull()
  })

  it('continues the same publication with its opaque cursor and rejects no visible rows', async () => {
    const gateway = new PaginatedGateway()
    renderPage(gateway)
    expect(await screen.findByText('涨跌商品 24')).toBeInTheDocument()
    expect(screen.queryByText('涨跌商品 25')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: '继续加载' }))
    expect(await screen.findByText('涨跌商品 25')).toBeInTheDocument()
    await waitFor(() => expect(gateway.requests).toHaveLength(2))
    expect(gateway.requests[1]).toMatchObject({
      publication_id: listFixture.publication.publication_id,
      direction: 'GAINERS',
      cursor: 'cursor_24',
      page_size: 24,
      filters: EMPTY_FILTERS,
    })
    expect(screen.queryByRole('button', { name: '继续加载' })).toBeNull()
  })

  it('downgrades freshness and removes retained rows at their known deadlines without polling', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-07T12:00:00.000Z'))
    const original = new PageGateway()
    const gateway: SingleItemTrendingPublicGateway = {
      kind: 'EXPIRY_TEST',
      async read(query) {
        const response = await original.read(query)
        const payload: any = response.payload
        payload.publication.fresh_until = '2026-09-07T12:00:00.100000Z'
        payload.publication.retain_until = '2026-09-07T12:00:00.200000Z'
        return response
      },
    }
    const view = renderPage(gateway)
    await act(async () => {})
    expect(screen.getByTestId('public-trending-publication')).toHaveTextContent('当前发布')
    await act(async () => { await vi.advanceTimersByTimeAsync(101) })
    expect(screen.getByTestId('public-trending-publication')).toHaveTextContent('保留中的旧发布')
    expect(original.requests).toHaveLength(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(101) })
    expect(screen.getByRole('heading', { name: '这次排行已过保留期' })).toBeInTheDocument()
    expect(screen.queryByTestId('public-trending-publication')).toBeNull()
    expect(screen.queryByText(/StatTrak™ 合同样例/u)).toBeNull()
    expect(original.requests).toHaveLength(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not extend freshness when the local wall clock is moved backwards', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-09-07T12:00:00.000Z')
    vi.setSystemTime(start)
    let monotonic = 500
    vi.spyOn(performance, 'now').mockImplementation(() => monotonic)
    const gateway: SingleItemTrendingPublicGateway = {
      kind: 'ROLLBACK_TEST',
      async read(query) {
        const payload: any = boundDocument(query)
        payload.publication.fresh_until = '2026-09-07T12:00:00.100000Z'
        return { payload, httpStatus: 200 }
      },
    }
    const view = renderPage(gateway)
    await act(async () => {})
    vi.setSystemTime(new Date('2025-09-07T12:00:00.000Z'))
    monotonic += 101
    await act(async () => { await vi.advanceTimersByTimeAsync(101) })
    expect(screen.getByTestId('public-trending-publication')).toHaveTextContent('保留中的旧发布')
    view.unmount()
  })

  it('revalidates on focus and visible resume, discards the previous result during the request, and cleans listeners', async () => {
    const gateway = new PageGateway()
    const view = renderPage(gateway)
    await screen.findByTestId('public-trending-publication')
    await act(async () => { fireEvent.focus(window) })
    expect(gateway.requests).toHaveLength(2)
    const visibility = vi.spyOn(document, 'visibilityState', 'get')
    visibility.mockReturnValue('hidden')
    await act(async () => { fireEvent(document, new Event('visibilitychange')) })
    expect(gateway.requests).toHaveLength(2)
    visibility.mockReturnValue('visible')
    await act(async () => { fireEvent(document, new Event('visibilitychange')) })
    expect(gateway.requests).toHaveLength(3)
    view.unmount()
    fireEvent.focus(window)
    fireEvent(document, new Event('visibilitychange'))
    expect(gateway.requests).toHaveLength(3)
  })

  it('accepts a later server freshness state on the same snapshot when loading the next page', async () => {
    const original = new PaginatedGateway()
    const gateway: SingleItemTrendingPublicGateway = {
      kind: 'AGING_CURSOR_TEST',
      async read(query) {
        const response = await original.read(query)
        if (query.cursor !== null) {
          const payload: any = response.payload
          payload.query.request_known_at = '2026-09-09T12:00:00.000000Z'
          payload.publication.freshness = 'STALE_RETAINED'
        }
        return response
      },
    }
    renderPage(gateway)
    await screen.findByText('涨跌商品 24')
    await userEvent.click(screen.getByRole('button', { name: '继续加载' }))
    expect(await screen.findByText('涨跌商品 25')).toBeInTheDocument()
    expect(screen.getByTestId('public-trending-publication')).toHaveTextContent('保留中的旧发布')
  })

  it.each(['measurement', 'identity', 'order', 'rank', 'missing', 'snapshot', 'immutable'] as const)(
    'fails closed for a contradictory %s continuation', async (problem) => {
      const original = new PaginatedGateway()
      const gateway: SingleItemTrendingPublicGateway = {
        kind: 'CONTRADICTORY_CURSOR_TEST',
        async read(query) {
          const response = await original.read(query)
          if (query.cursor !== null) {
            const payload: any = response.payload
            const row = payload.members[0]
            if (problem === 'measurement') row.measurement_id = '1'.padStart(64, '0')
            if (problem === 'identity') row.analysis_unit_id = row.tie_break_key = row.catalog.analysis_unit_id = 'item:trending-1'
            if (problem === 'order') row.conservative_same_direction_change_floor_ratio = '0.50000000'
            if (problem === 'rank') row.rank = 24
            if (problem === 'missing') payload.members = []
            if (problem === 'snapshot') payload.query.snapshot_known_at = '2026-09-07T11:59:59.000000Z'
            if (problem === 'immutable') payload.publication.evidence_release_code = 'other'
          }
          return response
        },
      }
      renderPage(gateway)
      await screen.findByText('涨跌商品 24')
      await userEvent.click(screen.getByRole('button', { name: '继续加载' }))
      expect(await screen.findByRole('heading', { name: '排行未通过校验' })).toBeInTheDocument()
      expect(screen.queryByText('涨跌商品 24')).toBeNull()
    },
  )

  it.each(['zh', 'en'] as const)('discloses Top-N subset, ASK and shared FX semantics in %s', async (lang) => {
    renderPage(new PageGateway(), vi.fn(), lang)
    const publication = await screen.findByTestId('public-trending-publication')
    expect(publication).toHaveTextContent('CNY')
    const page = screen.getByTestId('public-trending-page')
    expect(page).toHaveTextContent('Top-N')
    expect(page).toHaveTextContent('ASK')
    expect(page).toHaveTextContent('ECB')
    expect(page).toHaveTextContent(lang === 'zh' ? '共同汇率变化' : 'Shared FX changes')
    expect(page).toHaveTextContent(lang === 'zh' ? '切换语言不会重算榜单' : 'Language changes do not recalculate')
  })

  it('renders a signed tiny decline honestly instead of positive zero or invented precision', async () => {
    const gateway: SingleItemTrendingPublicGateway = {
      kind: 'TINY_LOSER_TEST',
      async read(query) {
        const payload: any = structuredClone(listFixture)
        payload.query = { ...payload.query, ...query, publication_id: payload.publication.publication_id }
        payload.members[0].direction = 'LOSERS'
        payload.members[0].conservative_same_direction_change_floor_ratio = '-0.00000000'
        payload.publication.accounting.gainer_count = 0
        payload.publication.accounting.loser_count = 1
        return { payload, httpStatus: 200 }
      },
    }
    renderPage(gateway, vi.fn(), 'zh', 'LOSERS')
    expect(await screen.findByText('微幅下跌（低于显示精度）')).toBeInTheDocument()
    expect(screen.getByTestId('public-trending-page')).not.toHaveTextContent('+0.0%')
    expect(screen.getByTestId('public-trending-page')).not.toHaveTextContent('-0.0%')
  })
})
