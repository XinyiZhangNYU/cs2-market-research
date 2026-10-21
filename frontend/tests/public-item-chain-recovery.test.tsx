import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../src/i18n'
import { PublicItemCurrentPage } from '../src/pages/PublicItemCurrentPage'
import { PublicItemHistoryPage } from '../src/pages/PublicItemHistoryPage'
import { itemCurrentError, itemCurrentFixture } from './support/itemCurrentFixture'
import { itemHistoryError, itemHistoryFixture } from './support/itemHistoryFixture'

const surfaces = [
  { name: 'current', Component: PublicItemCurrentPage, fixture: itemCurrentFixture, error: itemCurrentError,
    row: '.item-current__list > li', selected: 'selectedStageToken', token: 'stage_token',
    invalidTitle: 'Invalid current monitor query', missingTitle: 'Current monitor report is not published yet',
    notFoundTitle: 'Current stage not found' },
  { name: 'history', Component: PublicItemHistoryPage, fixture: itemHistoryFixture, error: itemHistoryError,
    row: '.item-history__list > li', selected: 'selectedEventToken', token: 'history_event_token',
    invalidTitle: 'Invalid historical cycle query', missingTitle: 'Historical report is not published yet',
    notFoundTitle: 'Historical cycle not found' },
] as const
type Surface = typeof surfaces[number]

function page(surface: Surface, request: any, continuation = false) {
  const payload: any = surface.fixture()
  payload.sort = request.query.sort
  if (surface.name === 'current' && payload.sort !== 'DETECTED_DESC') payload.members.reverse()
  payload.members = [payload.members[0]]
  payload.members[0][surface.token] = (continuation ? 'b' : 'a').repeat(64)
  payload.next_cursor = continuation ? null : 'nextPage'
  if (surface.name === 'history') payload.release.public_event_count = 2
  return { payload, httpStatus: 200 }
}

function errorResponse(surface: Surface, code: string, httpStatus: number) {
  const payload: any = surface.error('TEMPORARILY_UNAVAILABLE')
  payload.error = { code, retryable: code === 'TEMPORARILY_UNAVAILABLE' }
  return { payload, httpStatus }
}

function view(surface: Surface, gateway: any) {
  const noop = () => undefined
  return render(<LangProvider lang="en">{React.createElement(surface.Component as any, {
    gateway, publicationId: null, [surface.selected]: null,
    currentHref: '/item-monitor', historyHref: '/item-monitor/history', catalogHref: '/catalog',
    onCatalogClick: noop, onCurrentClick: noop, onHistoryClick: noop,
    onOpenMember: noop, onCloseMember: noop,
  })}</LangProvider>)
}

afterEach(cleanup)

describe('single-item current/history failure recovery', () => {
  for (const surface of surfaces) {
    for (const failure of ['edge', 'network', 'validation', 'invalid-query', 'missing-stage', 'duplicate', 'publication-drift'] as const) {
      it(`${surface.name}: ${failure} continuation keeps validated rows and retries the pinned cursor`, async () => {
        let broken = true
        const requests: any[] = []
        const gateway = {
          kind: 'RECOVERY_TEST',
          async read(request: any) {
            requests.push(structuredClone(request))
            if (request.query.cursor === null) return page(surface, request)
            if (!broken) return page(surface, request, true)
            if (failure === 'network') throw new TypeError('network unavailable')
            if (failure === 'edge') return { payload: { transport_error: 'ORIGIN_TIMEOUT' }, httpStatus: 504 }
            if (failure === 'invalid-query') return errorResponse(surface, 'INVALID_REQUEST', 400)
            if (failure === 'missing-stage') return errorResponse(surface, 'NOT_FOUND', 404)
            const result = page(surface, request, true)
            if (failure === 'validation') result.payload.members[0].unrecognized_field = true
            if (failure === 'duplicate') result.payload.members[0][surface.token] = 'a'.repeat(64)
            if (failure === 'publication-drift') result.payload.publication.manifest_sha256 = '0'.repeat(64)
            return result
          },
        }
        view(surface, gateway)
        await waitFor(() => expect(document.querySelectorAll(surface.row)).toHaveLength(1))
        fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
        await screen.findByRole('button', { name: 'Retry loading more' })
        expect(document.querySelectorAll(surface.row)).toHaveLength(1)
        const expectedCode = failure === 'edge' ? 'TEMPORARILY_UNAVAILABLE'
          : failure === 'network' ? 'TRANSPORT' : failure === 'invalid-query' ? 'INVALID_REQUEST'
          : failure === 'missing-stage' ? 'NOT_FOUND' : 'VALIDATION'
        expect(document.querySelector('[data-error-code]')).toHaveAttribute('data-error-code', expectedCode)
        broken = false
        fireEvent.click(screen.getByRole('button', { name: 'Retry loading more' }))
        await waitFor(() => expect(document.querySelectorAll(surface.row)).toHaveLength(2))
        expect(document.querySelector('[data-error-code]')).toBeNull()
        const subsequent = requests.slice(1)
        expect(subsequent.length).toBeGreaterThanOrEqual(2)
        for (const request of subsequent) {
          expect(request.query).toMatchObject({
            publication_id: surface.fixture().publication.publication_id, cursor: 'nextPage',
          })
          expect(request.query).toEqual(subsequent[0].query)
        }
      })
    }

    it(`${surface.name}: duplicate load-more clicks do not duplicate requests; stale response cannot enter a new query`, async () => {
      let resolvePending!: (value: any) => void
      const pending = new Promise((resolve) => { resolvePending = resolve })
      const requests: any[] = []
      const gateway = {
        kind: 'PENDING_TEST',
        async read(request: any) {
          requests.push(structuredClone(request))
          return request.query.cursor ? pending : page(surface, request)
        },
      }
      view(surface, gateway)
      const button = await screen.findByRole('button', { name: 'Load more' })
      fireEvent.click(button)
      fireEvent.click(button)
      await waitFor(() => expect(requests).toHaveLength(2))
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'different' } })
      fireEvent.submit(screen.getByRole('search'))
      await waitFor(() => expect(requests).toHaveLength(3))
      await act(async () => { resolvePending(page(surface, requests[1], true)); await pending })
      expect(document.querySelectorAll(surface.row)).toHaveLength(1)
      expect(requests[2].query).toMatchObject({ cursor: null, name_query: 'different' })
    })

    it(`${surface.name}: transient initial outage can be manually re-read`, async () => {
      const read = vi.fn()
        .mockResolvedValueOnce({ payload: { transport_error: 'ORIGIN_UNAVAILABLE' }, httpStatus: 503 })
        .mockImplementation(async (request) => page(surface, request))
      view(surface, { kind: 'RETRY_TEST', read })
      await waitFor(() => expect(document.querySelector('[data-error-code]'))
        .toHaveAttribute('data-error-code', 'TEMPORARILY_UNAVAILABLE'))
      expect(read).toHaveBeenCalledTimes(1)
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
      await waitFor(() => expect(document.querySelectorAll(surface.row)).toHaveLength(1))
      expect(read).toHaveBeenCalledTimes(2)
    })

    for (const [code, status, title] of [
      ['INVALID_REQUEST', 400, surface.invalidTitle],
      ['NOT_PUBLISHED', 404, surface.missingTitle],
      ['NOT_FOUND', 404, surface.notFoundTitle],
    ] as const) {
      it(`${surface.name}: ${code} has its own user-facing meaning`, async () => {
        view(surface, { kind: 'ERROR_TEST', read: async () => errorResponse(surface, code, status) })
        expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
      })
    }

    for (const code of ['WITHDRAWN', 'STALE_EXPIRED', 'CORRUPT_PUBLICATION']) {
      it(`${surface.name}: authoritative ${code} continuation still invalidates retained rows`, async () => {
        view(surface, {
          kind: 'TERMINAL_TEST',
          read: async (request: any) => request.query.cursor
            ? errorResponse(surface, code, code === 'CORRUPT_PUBLICATION' ? 503 : 410)
            : page(surface, request),
        })
        fireEvent.click(await screen.findByRole('button', { name: 'Load more' }))
        await waitFor(() => expect(document.querySelectorAll(surface.row)).toHaveLength(0))
        expect(document.querySelector('[data-error-code]')).toHaveAttribute('data-error-code', code)
        expect(screen.queryByRole('button', { name: 'Retry loading more' })).toBeNull()
      })
    }
  }
})
