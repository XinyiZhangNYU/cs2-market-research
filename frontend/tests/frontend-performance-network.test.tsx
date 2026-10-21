import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpItemHistoryPublicGateway } from '../src/api/HttpItemHistoryPublicGateway'
import {
  ItemHistoryAvailabilityError,
  ItemHistoryPublicApi,
} from '../src/api/ItemHistoryPublicApi'
import { LangProvider } from '../src/i18n'
import { PublicItemHistoryPage } from '../src/pages/PublicItemHistoryPage'
import { ItemHistoryValidationError } from '../src/wire/itemHistoryPublicApiDecode'
import { itemHistoryError, itemHistoryFixture } from './support/itemHistoryFixture'

const query = {
  publication_id: null,
  page_size: 50,
  cursor: null,
  sort: 'MAX_PRICE_MULTIPLE_DESC',
  name_query: null,
} as const

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('item history availability classification', () => {
  for (const status of [502, 503, 504]) {
    it(`classifies malformed upstream HTTP ${status} as temporary availability`, async () => {
      const api = new ItemHistoryPublicApi({
        kind: 'RAW_UPSTREAM',
        async read() {
          return {
            payload: { transport_error: { code: 'ORIGIN_UNAVAILABLE', http_status: status } },
            httpStatus: status,
          }
        },
      })
      await expect(api.list(query)).rejects.toBeInstanceOf(ItemHistoryAvailabilityError)
    })
  }

  it('classifies a non-JSON 503 response as temporary availability', async () => {
    const gateway = new HttpItemHistoryPublicGateway({
      fetcher: vi.fn(async () => new Response('origin unavailable', { status: 503 })) as typeof fetch,
    })
    await expect(gateway.read({ kind: 'LIST', query })).rejects.toBeInstanceOf(ItemHistoryAvailabilityError)
  })

  it('keeps a schema-valid CORRUPT_PUBLICATION response as a publication error', async () => {
    const payload: any = itemHistoryError('TEMPORARILY_UNAVAILABLE')
    payload.error.code = 'CORRUPT_PUBLICATION'
    payload.error.retryable = false
    const api = new ItemHistoryPublicApi({
      kind: 'CONTRACT_ERROR',
      async read() { return { payload, httpStatus: 503 } },
    })
    await expect(api.list(query)).resolves.toMatchObject({
      response_kind: 'ERROR',
      error: { code: 'CORRUPT_PUBLICATION' },
    })
  })

  it('does not relabel an invalid successful publication as temporary availability', async () => {
    const payload: any = itemHistoryFixture()
    payload.members[0].catalog.projection_hash = '0'.repeat(64)
    const api = new ItemHistoryPublicApi({
      kind: 'INVALID_SUCCESS',
      async read() { return { payload, httpStatus: 200 } },
    })
    await expect(api.list(query)).rejects.toBeInstanceOf(ItemHistoryValidationError)
  })

  it('preserves caller cancellation instead of converting it to availability', async () => {
    const controller = new AbortController()
    controller.abort(new DOMException('caller', 'AbortError'))
    const gateway = new HttpItemHistoryPublicGateway({ fetcher: vi.fn() as typeof fetch })
    await expect(gateway.read({ kind: 'LIST', query }, { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' })
  })

  it('renders temporary availability and recovers on retry without an app reload', async () => {
    let calls = 0
    const gateway = {
      kind: 'RECOVERING_HISTORY',
      async read(request: any) {
        calls += 1
        if (calls === 1) {
          return {
            payload: { transport_error: { code: 'ORIGIN_UNAVAILABLE', http_status: 503 } },
            httpStatus: 503,
          }
        }
        const payload: any = itemHistoryFixture()
        payload.sort = request.query.sort
        return { payload, httpStatus: 200 }
      },
    }
    render(
      <LangProvider lang="en">
        <PublicItemHistoryPage
          gateway={gateway}
          publicationId={null}
          selectedEventToken={null}
          currentHref="/item-monitor"
          historyHref="/item-monitor/history"
          catalogHref="/catalog"
          onCatalogClick={() => undefined}
          onCurrentClick={() => undefined}
          onHistoryClick={() => undefined}
          onOpenMember={() => undefined}
          onCloseMember={() => undefined}
        />
      </LangProvider>,
    )
    await waitFor(() => expect(document.querySelector('[data-error-code]'))
      .toHaveAttribute('data-error-code', 'TEMPORARILY_UNAVAILABLE'))
    fireEvent.click(document.querySelector('[data-error-code] button')!)
    await waitFor(() => expect(document.querySelectorAll('.item-history__list > li').length).toBeGreaterThan(0))
    expect(calls).toBe(2)
  })
})
