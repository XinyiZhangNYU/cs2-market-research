import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import resultFixture from '../../schemas/examples/single-item-monitor-public-api/v1/result.json'
import initialEmptyFixture from '../../schemas/examples/single-item-monitor-public-api/v1/initial-empty.json'
import measuredEmptyFixture from '../../schemas/examples/single-item-monitor-public-api/v1/measured-empty.json'
import withdrawnFixture from '../../schemas/examples/single-item-monitor-public-api/v1/withdrawn.json'
import type { ItemMonitorPublicGateway, ItemMonitorTransportResponse } from '../src/api/ItemMonitorPublicApi'
import { LangProvider, type Lang } from '../src/i18n'
import { PublicWatchlistPage } from '../src/pages/PublicWatchlistPage'
import type { ItemMonitorDecodeRequest } from '../src/wire/itemMonitorPublicApiDecode'
import { canonicalHash } from '../src/wire/canonical'

class Gateway implements ItemMonitorPublicGateway {
  readonly kind = 'TEST_ITEM_MONITOR'
  readonly requests: ItemMonitorDecodeRequest[] = []

  constructor(private readonly payload: unknown, private readonly status = 200) {}

  async read(request: ItemMonitorDecodeRequest): Promise<ItemMonitorTransportResponse> {
    this.requests.push(structuredClone(request))
    const payload = structuredClone(this.payload) as any
    if (payload.response_kind !== 'ERROR' && request.query.publication_id !== null) {
      payload.publication.publication_id = request.query.publication_id
    }
    if (payload.response_kind !== 'ERROR' && request.kind === 'DETAIL') {
      payload.operation = 'DETAIL'; payload.page_size = 1; payload.next_cursor = null
      payload.members = payload.members.filter((member: any) => member.analysis_unit_token === request.query.analysis_unit_token)
    }
    return { payload, httpStatus: this.status }
  }
}

class DeferredGateway implements ItemMonitorPublicGateway {
  readonly kind = 'DEFERRED_ITEM_MONITOR'
  readonly requests: ItemMonitorDecodeRequest[] = []
  private readonly pending: Array<(response: ItemMonitorTransportResponse) => void> = []

  async read(request: ItemMonitorDecodeRequest): Promise<ItemMonitorTransportResponse> {
    this.requests.push(structuredClone(request))
    return await new Promise((resolve) => this.pending.push(resolve))
  }

  respond(payload: unknown, status = 200): void {
    const resolve = this.pending.shift()
    if (!resolve) throw new Error('no pending item-monitor request')
    resolve({ payload: structuredClone(payload), httpStatus: status })
  }
}

function view(gateway: ItemMonitorPublicGateway, lang: Lang = 'zh', publicationId: string | null = null, token: string | null = null) {
  return render(
    <LangProvider lang={lang}>
      <PublicWatchlistPage gateway={gateway} publicationId={publicationId} selectedUnitId={token}
        catalogHref="/catalog" onCatalogClick={() => undefined} onOpenMember={() => undefined} onCloseMember={() => undefined} />
    </LangProvider>,
  )
}

afterEach(cleanup)

describe('public experimental Item Monitor page', () => {
  it('shows the positive observation without formal-state, recommendation, return or efficacy claims', async () => {
    view(new Gateway(resultFixture), 'zh')
    const page = await screen.findByTestId('public-watchlist-page')
    expect(page).toHaveTextContent('单品观察榜')
    expect(page).toHaveTextContent('实验性 · 效果尚未验证 · 可能出现误报')
    expect(page).toHaveTextContent('供给先行变化')
    expect(page).not.toHaveTextContent('推荐')
    expect(page).not.toHaveTextContent('预期收益')
    expect(page).toHaveTextContent('不构成正式状态')
  })

  it.each([
    [initialEmptyFixture, '尚无满足条件的完整观察', 'NO_QUALIFIED_OBSERVATION'],
    [measuredEmptyFixture, '本次没有符合条件的单品', 'NO_ELIGIBLE_CANDIDATES'],
  ])('distinguishes sealed empty meanings', async (fixture, heading, reason) => {
    view(new Gateway(fixture), 'zh')
    const empty = (await screen.findByRole('heading', { name: heading })).closest('[role="status"]')
    expect(empty).toHaveAttribute('data-empty-reason', reason)
    expect(empty).toHaveTextContent(heading)
  })

  it('marks retained stale data and keeps the observation date explicit', async () => {
    const stale = structuredClone(resultFixture) as any
    stale.freshness = {
      evaluated_at: '2026-09-18T02:00:00.000000Z',
      expected_latest_complete_date: '2026-09-17',
      lag_complete_days: 1,
      status: 'STALE_RETAINED',
      headline_data_date: '2026-09-16',
    }
    view(new Gateway(stale), 'en')
    const meta = await screen.findByTestId('item-monitor-publication')
    expect(meta).toHaveTextContent('Retained stale publication')
    expect(meta).toHaveTextContent('Sep 16, 2026')
  })

  it('maps withdrawal to a distinct fail-closed page with no catalog fallback request', async () => {
    const gateway = new Gateway(withdrawnFixture, 410)
    view(gateway, 'en')
    const problem = (await screen.findByRole('heading', { name: 'This publication was withdrawn' })).closest('[role="status"]')
    expect(problem).toHaveAttribute('data-error-code', 'WITHDRAWN')
    expect(problem).toHaveTextContent('will not silently substitute')
    expect(gateway.requests).toHaveLength(1)
  })

  it('opens exact publication-bound detail through a keyboard-operable button', async () => {
    const gateway = new Gateway(resultFixture)
    const open: [string, string][] = []
    render(
      <LangProvider lang="en">
        <PublicWatchlistPage gateway={gateway} publicationId={null} selectedUnitId={null}
          catalogHref="/catalog" onCatalogClick={() => undefined}
          onOpenMember={(publication, token) => open.push([publication, token])} onCloseMember={() => undefined} />
      </LangProvider>,
    )
    const row = await screen.findByRole('button', { name: /Synthetic 000/u })
    row.focus()
    fireEvent.keyDown(row, { key: 'Enter' })
    fireEvent.click(row)
    expect(open).toEqual([[resultFixture.publication.publication_id, resultFixture.members[0].analysis_unit_token]])

    cleanup()
    view(gateway, 'en', resultFixture.publication.publication_id, resultFixture.members[0].analysis_unit_token)
    const detail = await screen.findByTestId('item-monitor-detail')
    expect(within(detail).getByRole('link', { name: /View item/u })).toHaveAttribute('href', expect.stringContaining('snapshot='))
    await waitFor(() => expect(gateway.requests.some((request) => request.kind === 'DETAIL')).toBe(true))
  })

  it('ignores an older list response after the gateway scope changes', async () => {
    const older = new DeferredGateway()
    const current = new DeferredGateway()
    const props = {
      publicationId: null,
      selectedUnitId: null,
      catalogHref: '/catalog',
      onCatalogClick: () => undefined,
      onOpenMember: () => undefined,
      onCloseMember: () => undefined,
    }
    const rendered = render(<LangProvider lang="en"><PublicWatchlistPage gateway={older} {...props} /></LangProvider>)
    await waitFor(() => expect(older.requests).toHaveLength(1))
    rendered.rerender(<LangProvider lang="en"><PublicWatchlistPage gateway={current} {...props} /></LangProvider>)
    await waitFor(() => expect(current.requests).toHaveLength(1))

    await act(async () => current.respond(resultFixture))
    expect(await screen.findByRole('button', { name: /Synthetic 000/u })).toBeInTheDocument()
    await act(async () => older.respond(initialEmptyFixture))
    expect(screen.queryByRole('heading', { name: 'No qualified observation yet' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Synthetic 000/u })).toBeInTheDocument()
  })

  it('continues the same publication without replacing already displayed members', async () => {
    const first = structuredClone(resultFixture) as any
    first.next_cursor = 'next_page'
    first.release.public_member_count = 2
    first.release.source_candidate_count = 2
    const second = structuredClone(first) as any
    second.next_cursor = null
    const member = second.members[0]
    member.catalog.analysis_unit_id = 'synthetic-public-999'
    member.catalog.localized_name.en = 'Synthetic 999'
    member.catalog.localized_name.zh_cn = '合成条目 999'
    const { projection_hash: _projectionHash, ...projection } = member.catalog
    member.catalog.projection_hash = canonicalHash(projection)
    member.analysis_unit_token = canonicalHash({
      contract: 'single-item-monitor-public-api', analysis_unit_id: member.catalog.analysis_unit_id,
    })
    second.members = [member]
    const gateway: ItemMonitorPublicGateway = {
      kind: 'PAGED_ITEM_MONITOR',
      async read(request) {
        return { payload: structuredClone(request.kind === 'LIST' && request.query.cursor === 'next_page' ? second : first), httpStatus: 200 }
      },
    }
    view(gateway, 'en')
    expect(await screen.findByRole('button', { name: /Synthetic 000/u })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByRole('button', { name: /Synthetic 999/u })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Synthetic 000/u })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })
})
