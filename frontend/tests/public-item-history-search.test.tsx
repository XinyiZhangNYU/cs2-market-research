import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type {
  ItemHistoryPublicGateway,
  ItemHistoryTransportResponse,
} from '../src/api/ItemHistoryPublicApi'
import { LangProvider } from '../src/i18n'
import {
  normalizeItemHistoryNameQuery,
  PublicItemHistoryPage,
} from '../src/pages/PublicItemHistoryPage'
import type { ItemHistoryDecodeRequest } from '../src/wire/itemHistoryPublicApiDecode'


class NotFoundHistoryGateway implements ItemHistoryPublicGateway {
  readonly kind = 'TEST_ITEM_HISTORY_SEARCH'
  readonly requests: ItemHistoryDecodeRequest[] = []

  async read(request: ItemHistoryDecodeRequest): Promise<ItemHistoryTransportResponse> {
    this.requests.push(structuredClone(request))
    return {
      httpStatus: 404,
      payload: {
        contract_name: 'single-item-history-public-api',
        contract_version: '1',
        response_kind: 'ERROR',
        error: { code: 'NOT_FOUND', retryable: false },
      },
    }
  }
}


describe('historical item name search', () => {
  it('normalizes surrounding and repeated whitespace without changing the requested name', () => {
    expect(normalizeItemHistoryNameQuery('  童话   城堡  ')).toBe('童话 城堡')
    expect(normalizeItemHistoryNameQuery('   ')).toBeNull()
  })

  it('labels newest sorting plainly and sends a complete-publication name query', async () => {
    const gateway = new NotFoundHistoryGateway()
    const user = userEvent.setup()
    render(
      <LangProvider lang="zh">
        <PublicItemHistoryPage
          gateway={gateway}
          publicationId={null}
          selectedEventToken={null}
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
    expect(screen.getByRole('button', { name: '时间最新' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '供给变化时间' })).toBeNull()
    expect(screen.getByRole('search').parentElement).toHaveClass('item-history__toolbar')

    await user.type(screen.getByRole('searchbox', { name: '按名称搜索' }), '  童话  城堡 ')
    await user.click(screen.getByRole('button', { name: '搜索' }))

    await waitFor(() => expect(gateway.requests).toHaveLength(2))
    expect(gateway.requests[1]).toEqual({
      kind: 'LIST',
      query: {
        publication_id: null,
        page_size: 50,
        cursor: null,
        sort: 'MAX_PRICE_MULTIPLE_DESC',
        name_query: '童话 城堡',
      },
    })
    expect(screen.getByRole('status')).toHaveTextContent('没有找到名称匹配的历史周期。')

    await user.click(screen.getByRole('button', { name: '清除' }))
    await waitFor(() => expect(gateway.requests).toHaveLength(3))
    expect(gateway.requests[2]?.kind === 'LIST' && gateway.requests[2].query.name_query).toBeNull()
  })
})
