import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ItemCurrentPublicGateway, ItemCurrentTransportResponse } from '../src/api/ItemCurrentPublicApi'
import { PublicBetaApp } from '../src/PublicBetaApp'
import { LangProvider, type Lang } from '../src/i18n'
import { PublicItemCurrentPage } from '../src/pages/PublicItemCurrentPage'
import type { ItemCurrentDecodeRequest } from '../src/wire/itemCurrentPublicApiDecode'
import { CURRENT_PUBLICATION, CURRENT_SECOND_STAGE_TOKEN, itemCurrentEmpty, itemCurrentError, itemCurrentFixture } from './support/itemCurrentFixture'

class Gateway implements ItemCurrentPublicGateway {
  readonly kind = 'TEST_ITEM_CURRENT'
  readonly requests: ItemCurrentDecodeRequest[] = []

  constructor(private readonly payload: unknown, private readonly status = 200) {}

  async read(request: ItemCurrentDecodeRequest): Promise<ItemCurrentTransportResponse> {
    this.requests.push(structuredClone(request))
    const payload = structuredClone(this.payload) as any
    if (payload.response_kind !== 'ERROR') {
      payload.sort = request.kind === 'LIST' ? request.query.sort : payload.sort
      if (request.query.publication_id !== null) payload.publication.publication_id = request.query.publication_id
      if (payload.sort !== 'DETECTED_DESC') payload.members.reverse()
      if (request.kind === 'DETAIL') {
        payload.operation = 'DETAIL'; payload.page_size = 1; payload.next_cursor = null
        payload.members = payload.members.filter((member: any) => member.stage_token === request.query.stage_token)
      }
    }
    return { payload, httpStatus: this.status }
  }
}

function view(gateway: ItemCurrentPublicGateway, lang: Lang = 'zh', publicationId: string | null = null, token: string | null = null) {
  return render(
    <LangProvider lang={lang}>
      <PublicItemCurrentPage gateway={gateway} publicationId={publicationId} selectedStageToken={token}
        currentHref="/item-monitor" historyHref="/item-monitor/history" catalogHref="/catalog"
        onCatalogClick={() => undefined} onCurrentClick={() => undefined} onHistoryClick={() => undefined}
        onOpenMember={() => undefined} onCloseMember={() => undefined} />
    </LangProvider>,
  )
}

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
})

describe('public point-in-time item monitor page', () => {
  it('is the default /item-monitor consumer in the public application', async () => {
    window.history.replaceState(null, '', '/item-monitor?lang=en')
    render(<PublicBetaApp itemCurrentGateway={new Gateway(itemCurrentFixture())} />)
    expect(await screen.findByTestId('public-item-current-page', {}, { timeout: 10_000 })).toHaveTextContent('Item Monitor')
  })

  it('shows a partial-usable stage without future or probability claims', async () => {
    view(new Gateway(itemCurrentFixture()), 'zh')
    const page = await screen.findByTestId('public-item-current-page')
    expect(page).toHaveTextContent('单品观察榜')
    expect(page).toHaveTextContent('仅价格响应')
    expect(page).toHaveTextContent('部分可用')
    expect(page).toHaveTextContent('75%')
    expect(page).not.toHaveTextContent('峰值')
    expect(page).not.toHaveTextContent('成功概率')
    expect(screen.getByRole('link', { name: '历史周期' })).toHaveAttribute('href', '/item-monitor/history')
  })

  it('switches between latest detection and supply contraction ordering', async () => {
    const gateway = new Gateway(itemCurrentFixture())
    view(gateway)
    await screen.findAllByRole('button', { name: /测试名称/u })
    expect(gateway.requests[0]).toMatchObject({ kind: 'LIST', query: { sort: 'RELIABLE_SIGNAL_DESC' } })
    expect(screen.getByRole('button', { name: '可靠信号优先' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: '供给收缩' }))
    await waitFor(() => expect(gateway.requests.some((request) => request.kind === 'LIST' && request.query.sort === 'SUPPLY_CONTRACTION_DESC')).toBe(true))
  })

  it('shows the first trigger day instead of the later detection day', async () => {
    const fixture: any = itemCurrentFixture()
    fixture.members[0].price_detected_at = '2026-09-12T00:05:00Z'
    view(new Gateway(fixture), 'en')
    const items = within(await screen.findByRole('list', { name: 'Item Monitor' })).getAllByRole('listitem')
    const priceItem = items.find((item) => item.textContent?.includes('Price response only'))!
    const supplyItem = items.find((item) => item !== priceItem)!
    expect(priceItem).toHaveTextContent('First triggeredSep 11, 2026')
    expect(priceItem).not.toHaveTextContent('Sep 12, 2026')
    expect(supplyItem).toHaveTextContent('First triggeredSep 10, 2026')
    expect(screen.getByTestId('public-item-current-page')).not.toHaveTextContent('Detected')
  })

  it('opens exact publication-bound detail and keeps public times at day precision', async () => {
    const gateway = new Gateway(itemCurrentFixture())
    view(gateway, 'en', CURRENT_PUBLICATION, CURRENT_SECOND_STAGE_TOKEN)
    const detail = await screen.findByTestId('item-current-detail')
    expect(detail).toHaveTextContent('Price response only')
    expect(detail).toHaveTextContent('No supply measurement yet')
    expect(screen.getByTestId('item-current-publication')).toHaveTextContent('Sep 13, 2026')
    expect(screen.getByTestId('item-current-publication')).not.toHaveTextContent('00:03')
  })

  it('renders a truthful empty report and a withdrawn report as distinct states', async () => {
    const rendered = view(new Gateway(itemCurrentEmpty()), 'en')
    expect(await screen.findByRole('heading', { name: 'No current stage is public' })).toBeInTheDocument()
    rendered.unmount()
    view(new Gateway(itemCurrentError('WITHDRAWN'), 410), 'en', CURRENT_PUBLICATION)
    expect(await screen.findByRole('heading', { name: 'This current monitor report was withdrawn' })).toBeInTheDocument()
  })
})
