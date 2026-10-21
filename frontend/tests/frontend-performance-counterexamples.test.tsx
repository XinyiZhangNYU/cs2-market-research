import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../src/i18n'
import { PublicItemCurrentPage } from '../src/pages/PublicItemCurrentPage'
import { PublicItemHistoryPage } from '../src/pages/PublicItemHistoryPage'
import { RetainedPublicationListCache } from '../src/pages/retainedPublicationList'
import { itemCurrentError, itemCurrentFixture } from './support/itemCurrentFixture'
import { itemHistoryError, itemHistoryFixture } from './support/itemHistoryFixture'

const noop = () => undefined

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

const flush = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })

const surfaces = [
  {
    name: 'current', Component: PublicItemCurrentPage, fixture: itemCurrentFixture, error: itemCurrentError,
    row: '.item-current__list > li', detail: 'item-current-detail', token: 'selectedStageToken',
    memberToken: 'stage_token', defaultSort: 'RELIABLE_SIGNAL_DESC',
  },
  {
    name: 'history', Component: PublicItemHistoryPage, fixture: itemHistoryFixture, error: itemHistoryError,
    row: '.item-history__list > li', detail: 'item-history-detail', token: 'selectedEventToken',
    memberToken: 'history_event_token', defaultSort: 'MAX_PRICE_MULTIPLE_DESC',
  },
] as const

function response(surface: typeof surfaces[number], request: any, nextCursor: string | null = null) {
  const value: any = structuredClone(surface.fixture())
  if (request.query.publication_id !== null) value.publication.publication_id = request.query.publication_id
  if (request.kind === 'LIST') {
    value.sort = request.query.sort
    value.next_cursor = nextCursor
    if (surface.name === 'current' && value.sort !== 'DETECTED_DESC') value.members.reverse()
  } else {
    value.operation = 'DETAIL'
    value.page_size = 1
    value.next_cursor = null
    value.members = value.members.filter((member: any) =>
      member[surface.memberToken] === request.query[surface.memberToken])
  }
  return { payload: value, httpStatus: 200 }
}

function terminalResponse(surface: typeof surfaces[number], code: 'WITHDRAWN' | 'STALE_EXPIRED' | 'CORRUPT_PUBLICATION') {
  const payload: any = surface.error('TEMPORARILY_UNAVAILABLE')
  payload.error = { code, retryable: false }
  return { payload, httpStatus: code === 'CORRUPT_PUBLICATION' ? 503 : 410 }
}

function element(
  surface: typeof surfaces[number],
  gateway: any,
  lang: 'en' | 'zh',
  publicationId: string | null = null,
  token: string | null = null,
) {
  return React.createElement(LangProvider, {
    lang,
    children: React.createElement(surface.Component as any, {
      gateway,
      publicationId,
      [surface.token]: token,
      currentHref: '/item-monitor',
      historyHref: '/item-monitor/history',
      catalogHref: '/catalog',
      onCatalogClick: noop,
      onCurrentClick: noop,
      onHistoryClick: noop,
      onOpenMember: noop,
      onCloseMember: noop,
    }),
  })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('retained publication cache capabilities', () => {
  it('cannot regrant a revoked ACTIVE alias through a pinned continuation', () => {
    type State = Readonly<{
      document: Readonly<{ publication: Readonly<{ publication_id: string }> }>
      cacheKeys: readonly string[]
      activeCacheKeys: readonly string[]
    }>
    const cache = new RetainedPublicationListCache<State>()
    const activeKey = 'ACTIVE:DEFAULT'
    const pinnedKey = 'PINNED:publication'
    cache.remember({
      document: { publication: { publication_id: 'a'.repeat(64) } },
      cacheKeys: [activeKey, pinnedKey],
      activeCacheKeys: [activeKey],
    })

    cache.invalidateActiveAliases()
    expect(cache.get(activeKey)).toBeUndefined()
    const pinned = cache.get(pinnedKey)
    expect(pinned).toBeDefined()
    cache.remember({ ...pinned! })

    expect(cache.get(activeKey)).toBeUndefined()
    expect(cache.get(pinnedKey)).toBeDefined()
  })
})

describe('retained publication list adversarial regressions', () => {
  for (const surface of surfaces) for (const lang of ['en', 'zh'] as const) {
    for (const code of ['WITHDRAWN', 'STALE_EXPIRED', 'CORRUPT_PUBLICATION'] as const) {
      it(`${surface.name}/${lang}: known ${code} cannot resurrect through detail retry`, async () => {
        let terminal = false
        const gateway = {
          kind: 'PERFORMANCE_TERMINAL_RETRY',
          async read(request: any) {
            return terminal ? terminalResponse(surface, code) : response(surface, request)
          },
        }
        const rendered = render(element(surface, gateway, lang))
        await waitFor(() => expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0))
        const value: any = surface.fixture()
        const publicationId = value.publication.publication_id
        const token = value.members[0][surface.memberToken]
        terminal = true
        rendered.rerender(element(surface, gateway, lang, publicationId, token))
        await waitFor(() => expect(document.querySelector('[data-error-code]'))
          .toHaveAttribute('data-error-code', code))
        terminal = false
        fireEvent.click(document.querySelector('[data-error-code] button')!)
        await flush()
        expect(screen.queryByTestId(surface.detail)).not.toBeInTheDocument()
        expect(document.querySelector('[data-error-code]')).toHaveAttribute('data-error-code', code)
      })

      it(`${surface.name}/${lang}: ACTIVE ${code} requires a fresh read before a cached sort returns`, async () => {
        const calls: any[] = []
        const gateway = {
          kind: 'PERFORMANCE_ACTIVE_TERMINAL_SORT',
          async read(request: any) {
            calls.push(structuredClone(request))
            return request.kind === 'LIST' && request.query.sort !== surface.defaultSort
              ? terminalResponse(surface, code)
              : response(surface, request)
          },
        }
        render(element(surface, gateway, lang))
        await waitFor(() => expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0))
        const toolbar = () => document.querySelectorAll('.item-history__toolbar button')
        fireEvent.click(toolbar()[1]!)
        await waitFor(() => expect(document.querySelector('[data-error-code]'))
          .toHaveAttribute('data-error-code', code))
        fireEvent.click(toolbar()[0]!)
        await waitFor(() => expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0))
        expect(calls.filter((request) => request.kind === 'LIST' &&
          request.query.publication_id === null && request.query.sort === surface.defaultSort)).toHaveLength(2)
      })
    }

    it(`${surface.name}/${lang}: temporary detail failure remains retryable`, async () => {
      let unavailable = true
      const gateway = {
        kind: 'PERFORMANCE_TEMPORARY_DETAIL',
        async read(request: any) {
          return unavailable
            ? { payload: surface.error('TEMPORARILY_UNAVAILABLE'), httpStatus: 503 }
            : response(surface, request)
        },
      }
      const value: any = surface.fixture()
      const publicationId = value.publication.publication_id
      const token = value.members[0][surface.memberToken]
      render(element(surface, gateway, lang, publicationId, token))
      await waitFor(() => expect(document.querySelector('[data-error-code]'))
        .toHaveAttribute('data-error-code', 'TEMPORARILY_UNAVAILABLE'))
      unavailable = false
      fireEvent.click(document.querySelector('[data-error-code] button')!)
      expect(await screen.findByTestId(surface.detail)).toBeInTheDocument()
    })

    it(`${surface.name}/${lang}: A → pending B → A restores the settled A rows`, async () => {
      const pending = deferred<any>()
      const calls: any[] = []
      const gateway = {
        kind: 'PERFORMANCE_PENDING_SORT',
        async read(request: any) {
          calls.push(structuredClone(request))
          return request.kind === 'LIST' && request.query.sort !== surface.defaultSort
            ? pending.promise
            : response(surface, request)
        },
      }
      render(element(surface, gateway, lang))
      await waitFor(() => expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0))
      const toolbar = () => document.querySelectorAll('.item-history__toolbar button')
      fireEvent.click(toolbar()[1]!)
      await waitFor(() => expect(calls).toHaveLength(2))
      fireEvent.click(toolbar()[0]!)
      await flush()
      await act(async () => pending.resolve(response(surface, calls[1])))
      await flush()
      expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0)
    })

    it(`${surface.name}/${lang}: A → failed B → A clears the unrelated B error`, async () => {
      const gateway = {
        kind: 'PERFORMANCE_FAILED_SORT',
        async read(request: any) {
          return request.kind === 'LIST' && request.query.sort !== surface.defaultSort
            ? { payload: surface.error('TEMPORARILY_UNAVAILABLE'), httpStatus: 503 }
            : response(surface, request)
        },
      }
      render(element(surface, gateway, lang))
      await waitFor(() => expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0))
      fireEvent.click(document.querySelectorAll('.item-history__toolbar button')[1]!)
      await waitFor(() => expect(document.querySelector('[data-error-code]')).not.toBeNull())
      fireEvent.click(document.querySelectorAll('.item-history__toolbar button')[0]!)
      await flush()
      expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0)
    })

    it(`${surface.name}/${lang}: canceled pagination remains retryable after detail back`, async () => {
      const pending = deferred<any>()
      const calls: any[] = []
      const gateway = {
        kind: 'PERFORMANCE_PENDING_PAGE',
        async read(request: any) {
          calls.push(structuredClone(request))
          return request.kind === 'LIST' && request.query.cursor !== null
            ? pending.promise
            : response(surface, request, 'nextPage')
        },
      }
      const rendered = render(element(surface, gateway, lang))
      await waitFor(() => expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0))
      fireEvent.click(document.querySelector('button.public-result-load-more')!)
      await waitFor(() => expect(calls.some((request) => request.query.cursor === 'nextPage')).toBe(true))
      const value: any = surface.fixture()
      const publicationId = value.publication.publication_id
      const token = value.members[0][surface.memberToken]
      rendered.rerender(element(surface, gateway, lang, publicationId, token))
      await screen.findByTestId(surface.detail)
      rendered.rerender(element(surface, gateway, lang, publicationId, null))
      await flush()
      expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0)
      expect(document.querySelector('button.public-result-load-more')).not.toBeNull()
    })

    it(`${surface.name}/${lang}: observed withdrawal invalidates the retained list`, async () => {
      let withdrawn = false
      const gateway = {
        kind: 'PERFORMANCE_WITHDRAWAL',
        async read(request: any) {
          return withdrawn
            ? { payload: surface.error('WITHDRAWN'), httpStatus: 410 }
            : response(surface, request)
        },
      }
      const rendered = render(element(surface, gateway, lang))
      await waitFor(() => expect(document.querySelectorAll(surface.row).length).toBeGreaterThan(0))
      const value: any = surface.fixture()
      const publicationId = value.publication.publication_id
      const token = value.members[0][surface.memberToken]
      withdrawn = true
      rendered.rerender(element(surface, gateway, lang, publicationId, token))
      await waitFor(() => expect(document.querySelector('[data-error-code]')).toHaveAttribute('data-error-code', 'WITHDRAWN'))
      rendered.rerender(element(surface, gateway, lang, publicationId, null))
      await flush()
      expect(document.querySelectorAll(surface.row)).toHaveLength(0)
      expect(document.querySelector('[data-error-code]')).toHaveAttribute('data-error-code', 'WITHDRAWN')
    })
  }
})
