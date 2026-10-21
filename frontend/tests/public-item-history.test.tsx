import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ItemHistoryPublicGateway, ItemHistoryTransportResponse } from '../src/api/ItemHistoryPublicApi'
import { LangProvider, type Lang } from '../src/i18n'
import { PublicItemHistoryPage } from '../src/pages/PublicItemHistoryPage'
import type { ItemHistoryDecodeRequest } from '../src/wire/itemHistoryPublicApiDecode'
import { HISTORY_EVENT_TOKEN, HISTORY_PUBLICATION, itemHistoryError, itemHistoryFixture } from './support/itemHistoryFixture'

class Gateway implements ItemHistoryPublicGateway {
  readonly kind = 'TEST_ITEM_HISTORY'
  readonly requests: ItemHistoryDecodeRequest[] = []

  constructor(private readonly payload: unknown, private readonly status = 200) {}

  async read(request: ItemHistoryDecodeRequest): Promise<ItemHistoryTransportResponse> {
    this.requests.push(structuredClone(request))
    const payload = structuredClone(this.payload) as any
    if (payload.response_kind !== 'ERROR') {
      payload.sort = request.kind === 'LIST' ? request.query.sort : payload.sort
      if (request.query.publication_id !== null) payload.publication.publication_id = request.query.publication_id
      if (request.kind === 'DETAIL') {
        payload.operation = 'DETAIL'; payload.page_size = 1; payload.next_cursor = null
        payload.members = payload.members.filter((member: any) => member.history_event_token === request.query.history_event_token)
      }
    }
    return { payload, httpStatus: this.status }
  }
}

function view(
  gateway: ItemHistoryPublicGateway,
  lang: Lang = 'zh',
  publicationId: string | null = null,
  token: string | null = null,
  cnyPerUsd: string | null = '6.7',
) {
  return render(
    <LangProvider lang={lang}>
      <PublicItemHistoryPage gateway={gateway} cnyPerUsd={cnyPerUsd} publicationId={publicationId} selectedEventToken={token}
        currentHref="/item-monitor" historyHref="/item-monitor/history" catalogHref="/catalog"
        onCatalogClick={() => undefined} onCurrentClick={() => undefined} onHistoryClick={() => undefined}
        onOpenMember={() => undefined} onCloseMember={() => undefined} />
    </LangProvider>,
  )
}

afterEach(cleanup)

describe('public retrospective item history page', () => {
  it('shows historical supply contraction and price response without attribution or prediction claims', async () => {
    view(new Gateway(itemHistoryFixture()), 'zh')
    const page = await screen.findByTestId('public-item-history-page')
    expect(page).toHaveTextContent('历史异常周期')
    expect(page).toHaveTextContent('最高价格倍数')
    expect(page).toHaveTextContent('3×')
    expect(page).toHaveTextContent('75%')
    expect(page).toHaveTextContent('供给信号门先通过')
    expect(page).not.toHaveTextContent('操盘')
    expect(page).not.toHaveTextContent('预测')
    expect(screen.getByRole('link', { name: '当前观察' })).toHaveAttribute('href', '/item-monitor')
  })

  it('switches between strongest response and supply-onset ordering', async () => {
    const gateway = new Gateway(itemHistoryFixture())
    view(gateway, 'zh')
    await screen.findByRole('button', { name: /测试名称/u })
    fireEvent.click(screen.getByRole('button', { name: '时间最新' }))
    await waitFor(() => expect(gateway.requests.some((request) => request.kind === 'LIST' && request.query.sort === 'SUPPLY_ONSET_DESC')).toBe(true))
  })

  it('opens exact publication-bound history detail and renders report dates at day precision', async () => {
    const open: [string, string][] = []
    const gateway = new Gateway(itemHistoryFixture())
    render(
      <LangProvider lang="en">
        <PublicItemHistoryPage gateway={gateway} publicationId={null} selectedEventToken={null}
          currentHref="/item-monitor?lang=en" historyHref="/item-monitor/history?lang=en" catalogHref="/catalog?lang=en"
          onCatalogClick={() => undefined} onCurrentClick={() => undefined} onHistoryClick={() => undefined}
          onOpenMember={(publication, token) => open.push([publication, token])} onCloseMember={() => undefined} />
      </LangProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Synthetic 000/u }))
    expect(open).toEqual([[HISTORY_PUBLICATION, HISTORY_EVENT_TOKEN]])

    cleanup()
    view(gateway, 'en', HISTORY_PUBLICATION, HISTORY_EVENT_TOKEN)
    const detail = await screen.findByTestId('item-history-detail')
    expect(within(detail).getByText('Low baseline depth')).toBeInTheDocument()
    expect(within(detail).getByText('$10.00 / $30.00')).toBeInTheDocument()
    expect(screen.getByTestId('item-history-publication')).toHaveTextContent('Sep 17, 2026')
    expect(screen.getByTestId('item-history-publication')).not.toHaveTextContent('00:04')
  })

  it('renders historical USD as display-only CNY in Chinese and fails closed without a rate', async () => {
    const gateway = new Gateway(itemHistoryFixture())
    view(gateway, 'zh', HISTORY_PUBLICATION, HISTORY_EVENT_TOKEN, '6.7')
    expect(await screen.findByText('¥67.00 / ¥201.00')).toBeInTheDocument()

    cleanup()
    view(gateway, 'zh', HISTORY_PUBLICATION, HISTORY_EVENT_TOKEN, null)
    const detail = await screen.findByTestId('item-history-detail')
    expect(within(detail).getByText('— / —')).toBeInTheDocument()
    expect(detail).not.toHaveTextContent('$10')
  })

  it('keeps a withdrawn report distinct and fail closed', async () => {
    view(new Gateway(itemHistoryError('WITHDRAWN'), 410), 'en', HISTORY_PUBLICATION)
    const problem = (await screen.findByRole('heading', { name: 'This historical report was withdrawn' })).closest('[role="status"]')
    expect(problem).toHaveAttribute('data-error-code', 'WITHDRAWN')
    expect(problem).toHaveTextContent('will not silently substitute')
  })
})
