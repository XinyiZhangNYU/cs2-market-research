import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ItemCurrentPublicGateway, ItemCurrentTransportResponse } from '../src/api/ItemCurrentPublicApi'
import { LangProvider } from '../src/i18n'
import { normalizeItemCurrentNameQuery, PublicItemCurrentPage } from '../src/pages/PublicItemCurrentPage'
import type { ItemCurrentDecodeRequest } from '../src/wire/itemCurrentPublicApiDecode'
import { itemCurrentFixture } from './support/itemCurrentFixture'

class NotFoundCurrentGateway implements ItemCurrentPublicGateway {
  readonly kind = 'TEST_ITEM_CURRENT_SEARCH'
  readonly requests: ItemCurrentDecodeRequest[] = []

  async read(request: ItemCurrentDecodeRequest): Promise<ItemCurrentTransportResponse> {
    this.requests.push(structuredClone(request))
    return {
      httpStatus: 404,
      payload: {
        contract_name: 'single-item-current-public-api',
        contract_version: '1',
        response_kind: 'ERROR',
        error: { code: 'NOT_FOUND', retryable: false },
      },
    }
  }
}

class SuccessfulCurrentGateway implements ItemCurrentPublicGateway {
  readonly kind = 'TEST_ITEM_CURRENT_SEARCH_SUCCESS'
  readonly requests: ItemCurrentDecodeRequest[] = []

  async read(request: ItemCurrentDecodeRequest): Promise<ItemCurrentTransportResponse> {
    this.requests.push(structuredClone(request))
    const payload = itemCurrentFixture() as any
    if (request.kind === 'LIST') {
      payload.sort = request.query.sort
      if (payload.sort !== 'DETECTED_DESC') payload.members.reverse()
    }
    return { httpStatus: 200, payload }
  }
}

describe('current item name search', () => {
  it('normalizes whitespace and places full-publication search beside sorting', async () => {
    expect(normalizeItemCurrentNameQuery('  迷人   眼  ')).toBe('迷人 眼')
    expect(normalizeItemCurrentNameQuery('   ')).toBeNull()
    const gateway = new NotFoundCurrentGateway()
    const user = userEvent.setup()
    render(
      <LangProvider lang="zh">
        <PublicItemCurrentPage
          gateway={gateway}
          publicationId={null}
          selectedStageToken={null}
          currentHref="/item-monitor"
          historyHref="/item-monitor/history"
          catalogHref="/catalog"
          onCatalogClick={vi.fn()}
          onCurrentClick={vi.fn()}
          onHistoryClick={vi.fn()}
          onOpenMember={vi.fn()}
          onCloseMember={vi.fn()}
        />
      </LangProvider>,
    )

    await waitFor(() => expect(gateway.requests).toHaveLength(1))
    const search = screen.getByRole('search')
    expect(search.parentElement).toHaveClass('item-history__toolbar')
    await user.type(screen.getByRole('searchbox', { name: '按名称搜索' }), '  迷人  眼 ')
    await user.click(screen.getByRole('button', { name: '搜索' }))

    await waitFor(() => expect(gateway.requests).toHaveLength(2))
    expect(gateway.requests[1]).toEqual({
      kind: 'LIST',
      query: {
        publication_id: null,
        page_size: 50,
        cursor: null,
        sort: 'RELIABLE_SIGNAL_DESC',
        name_query: '迷人 眼',
      },
    })
    expect(screen.getByRole('status')).toHaveTextContent('没有找到名称匹配的当前观察。')

    await user.click(screen.getByRole('button', { name: '清除' }))
    await waitFor(() => expect(gateway.requests).toHaveLength(3))
    expect(gateway.requests[2]?.kind === 'LIST' && gateway.requests[2].query.name_query).toBeNull()
  })

  it('isolates retained lists by name query and restores the cached full list when cleared', async () => {
    const gateway = new SuccessfulCurrentGateway()
    const user = userEvent.setup()
    render(
      <LangProvider lang="zh">
        <PublicItemCurrentPage
          gateway={gateway}
          publicationId={null}
          selectedStageToken={null}
          currentHref="/item-monitor"
          historyHref="/item-monitor/history"
          catalogHref="/catalog"
          onCatalogClick={vi.fn()}
          onCurrentClick={vi.fn()}
          onHistoryClick={vi.fn()}
          onOpenMember={vi.fn()}
          onCloseMember={vi.fn()}
        />
      </LangProvider>,
    )

    await waitFor(() => expect(gateway.requests).toHaveLength(1))
    await user.type(screen.getByRole('searchbox', { name: '按名称搜索' }), '迷人眼')
    await user.click(screen.getByRole('button', { name: '搜索' }))
    await waitFor(() => expect(gateway.requests).toHaveLength(2))
    expect(gateway.requests[1]?.kind === 'LIST' && gateway.requests[1].query.name_query).toBe('迷人眼')

    await user.click(screen.getByRole('button', { name: '清除' }))
    await waitFor(() => expect(screen.getByRole('searchbox', { name: '按名称搜索' })).toHaveValue(''))
    expect(gateway.requests).toHaveLength(2)
  })
})
