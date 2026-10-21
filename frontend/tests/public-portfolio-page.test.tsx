import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CatalogDisplayGateway, CatalogDisplayGatewayRequest } from '../src/api/CatalogDisplayApi'
import { CatalogDisplayTransportError } from '../src/api/HttpCatalogDisplayGateway'
import { catalogQueryInstant } from '../src/api/catalogDisplayRuntime'
import { LangProvider } from '../src/i18n'
import { PublicSteamPortfolioPage } from '../src/pages/PublicSteamPortfolioPage'
import type { SavedSteamPortfolio, SteamPortfolioStorage } from '../src/steam/steamPortfolioStorage'
import type { PersonalWatchlistController } from '../src/watchlist/personalWatchlist'

const FIXTURE_STEAMID = '76561198000000000'
const SNAPSHOT_ID = 'a'.repeat(64)
const NOW = new Date('2026-09-18T12:00:00.000Z')

function watchlistController(
  addMany = vi.fn<PersonalWatchlistController['addMany']>(async (candidates) => candidates.length),
): PersonalWatchlistController {
  return Object.freeze({
    status: 'READY',
    entries: Object.freeze([]),
    pendingKeys: new Set<string>(),
    error: null,
    has: () => false,
    toggle: async () => {},
    addMany,
    remove: async () => {},
    clear: async () => {},
    importJson: async () => 0,
    exportJson: () => '',
    reload: () => {},
  })
}

class MemoryPortfolioStorage implements SteamPortfolioStorage {
  value: SavedSteamPortfolio | null = null

  read() {
    return this.value
  }

  write(value: SavedSteamPortfolio) {
    this.value = value
  }

  clear() {
    this.value = null
  }
}

function renderPage(
  gateway: CatalogDisplayGateway,
  options: {
    watchlist?: PersonalWatchlistController
    storage?: SteamPortfolioStorage
  } = {},
) {
  return render(
    <LangProvider lang="en">
      <PublicSteamPortfolioPage
        catalogGateway={gateway}
        queryInstant={catalogQueryInstant(NOW)}
        catalogHref="/catalog"
        followingHref="/following"
        watchlist={options.watchlist ?? watchlistController()}
        now={() => NOW}
        portfolioStorage={options.storage ?? new MemoryPortfolioStorage()}
        onCatalogClick={() => undefined}
        onFollowingClick={() => undefined}
        onOpenCatalog={() => undefined}
      />
    </LangProvider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('my inventory form', () => {
  it('uses local-only wording and rejects vanity profile URLs before any network call', () => {
    const gateway: CatalogDisplayGateway = {
      kind: 'TEST',
      async read() {
        throw new Error('catalog must not be read')
      },
    }
    renderPage(gateway)
    expect(screen.getByRole('heading', { name: 'My inventory' })).toBeInTheDocument()
    expect(screen.getAllByText(/not uploaded to a site account/u)).toHaveLength(2)
    fireEvent.change(screen.getByTestId('steam-portfolio-input'), {
      target: { value: 'https://steamcommunity.com/id/example' },
    })
    fireEvent.click(screen.getByTestId('steam-portfolio-submit'))
    expect(screen.getByTestId('steam-portfolio-problem')).toHaveTextContent(
      'Custom profile URLs are not supported',
    )
  })

  it('treats a down catalog gateway as catalog matching unavailable after inventory succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            api_contract: 'steam-portfolio-inventory',
            api_version: 'v1',
            response_kind: 'STEAM_PORTFOLIO_INVENTORY',
            steamid: FIXTURE_STEAMID,
            appid: 730,
            contextid: '2',
            total_asset_count: 1,
            skipped_unnamed: 0,
            truncated: false,
            stacks: [{ market_hash_name: 'AWP | Duality (Field-Tested)', quantity: 1 }],
          }),
          { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } },
        ),
      ),
    )
    const gateway: CatalogDisplayGateway = {
      kind: 'TEST',
      async read() {
        throw new CatalogDisplayTransportError('NETWORK_UNAVAILABLE', true)
      },
    }
    renderPage(gateway)
    fireEvent.change(screen.getByTestId('steam-portfolio-input'), {
      target: { value: FIXTURE_STEAMID },
    })
    fireEvent.click(screen.getByTestId('steam-portfolio-submit'))
    await waitFor(() => {
      expect(screen.getByTestId('steam-portfolio-problem')).toHaveTextContent(
        'Catalog matching is temporarily unavailable',
      )
    })
  })

  it('keeps a matched inventory across remounts and imports every unique item into My follows', async () => {
    const storage = new MemoryPortfolioStorage()
    const addMany = vi.fn<PersonalWatchlistController['addMany']>(async (candidates) => candidates.length)
    const watchlist = watchlistController(addMany)
    const gateway: CatalogDisplayGateway = {
      kind: 'TEST',
      async read(request: CatalogDisplayGatewayRequest) {
        if (request.operation !== 'CATALOG_DISPLAY_SNAPSHOT_LIST') throw new Error('unexpected operation')
        return {
          api_contract: 'catalog-display-snapshot-api',
          api_version: 'v1',
          response_kind: 'CATALOG_DISPLAY_SNAPSHOT_LIST',
          query: structuredClone(request.query),
          members: [{
            snapshot_id: SNAPSHOT_ID,
            catalog_version: 'catalog-v1',
            as_of: '2026-09-18T11:00:00.000000Z',
            available_at: '2026-09-18T11:05:00.000000Z',
            member_count: 1,
            member_set_hash: 'b'.repeat(64),
          }],
          next_cursor: null,
        }
      },
    }
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const payload = url.includes('/inventory')
        ? {
            api_contract: 'steam-portfolio-inventory',
            api_version: 'v1',
            response_kind: 'STEAM_PORTFOLIO_INVENTORY',
            steamid: FIXTURE_STEAMID,
            appid: 730,
            contextid: '2',
            total_asset_count: 2,
            skipped_unnamed: 0,
            truncated: false,
            stacks: [{ market_hash_name: 'AK-47 | Redline (Field-Tested)', quantity: 2 }],
          }
        : {
            api_contract: 'steam-portfolio-api',
            api_version: 'v1',
            response_kind: 'STEAM_PORTFOLIO_CATALOG_HITS',
            snapshot_id: SNAPSHOT_ID,
            hits: [{
              market_hash_name: 'AK-47 | Redline (Field-Tested)',
              status: 'UNIQUE',
              member: {
                analysis_unit_id: 'item:redline-field-tested',
                item_kind: 'WEAPON',
                base_item_code: 'weapon.ak47.redline',
                edition_kind: 'STANDARD',
                wear_tier: 'FIELD_TESTED',
                localized_name: {
                  authority: 'VALVE_STEAM',
                  en: 'AK-47 | Redline (Field-Tested)',
                  zh_cn: 'AK-47 | 红线（久经沙场）',
                },
                media: { status: 'NOT_PRODUCED' },
                version_context: { media_asset_version_id: null },
              },
            }],
          }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = renderPage(gateway, { storage, watchlist })
    fireEvent.change(screen.getByTestId('steam-portfolio-input'), {
      target: { value: FIXTURE_STEAMID },
    })
    fireEvent.click(screen.getByTestId('steam-portfolio-submit'))
    await waitFor(() => expect(screen.getByTestId('steam-portfolio-result')).toBeInTheDocument())
    expect(screen.getByText('1 item types · 2 items')).toBeInTheDocument()
    expect(storage.value?.rows).toHaveLength(1)

    fireEvent.click(screen.getByTestId('steam-portfolio-import-watchlist'))
    await waitFor(() => expect(addMany).toHaveBeenCalledTimes(1))
    expect(addMany.mock.calls[0]?.[0][0]).toMatchObject({
      target_kind: 'ITEM',
      target_id: 'item:redline-field-tested',
      identity: { base_item_code: 'weapon.ak47.redline' },
    })
    expect(await screen.findByText('Added 1 item types to My follows.')).toBeInTheDocument()

    first.unmount()
    fetchMock.mockClear()
    renderPage(gateway, { storage, watchlist })
    expect(screen.getByTestId('steam-portfolio-result')).toHaveTextContent('AK-47 | Redline')
    expect(screen.getByTestId('steam-portfolio-input')).toHaveValue(FIXTURE_STEAMID)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('inventory request ownership', () => {
  function emptyResponse(steamid: string) {
    return new Response(JSON.stringify({
      api_contract: 'steam-portfolio-inventory', api_version: 'v1',
      response_kind: 'STEAM_PORTFOLIO_INVENTORY', steamid, appid: 730, contextid: '2',
      total_asset_count: 0, skipped_unnamed: 0, truncated: false, stacks: [],
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const gateway: CatalogDisplayGateway = {
    kind: 'TEST',
    async read(request: CatalogDisplayGatewayRequest) {
      return {
        api_contract: 'catalog-display-snapshot-api', api_version: 'v1',
        response_kind: 'CATALOG_DISPLAY_SNAPSHOT_LIST', query: structuredClone(request.query),
        members: [{
          snapshot_id: SNAPSHOT_ID, catalog_version: 'catalog-v1',
          as_of: '2026-09-18T11:00:00.000000Z', available_at: '2026-09-18T11:05:00.000000Z',
          member_count: 0, member_set_hash: 'b'.repeat(64),
        }], next_cursor: null,
      }
    },
  }
  function submit(id: string) {
    fireEvent.change(screen.getByTestId('steam-portfolio-input'), { target: { value: id } })
    fireEvent.click(screen.getByTestId('steam-portfolio-submit'))
  }

  it.each(['resolve', 'reject'] as const)('does not undo clear when an older request later %ss', async (outcome) => {
    const storage = new MemoryPortfolioStorage()
    let resolve!: (value: Response) => void
    let reject!: (error: Error) => void
    let firstSignal: AbortSignal | undefined
    const pending = new Promise<Response>((yes, no) => { resolve = yes; reject = no })
    vi.stubGlobal('fetch', vi.fn()
      .mockImplementationOnce((_url, init) => { firstSignal = init.signal; return pending })
      .mockResolvedValueOnce(emptyResponse('76561198000000001')))
    renderPage(gateway, { storage })
    submit(FIXTURE_STEAMID)
    submit('76561198000000001')
    await screen.findByTestId('steam-portfolio-result')
    expect(firstSignal?.aborted).toBe(true)
    expect(storage.value?.steamid).toBe('76561198000000001')
    fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    await act(async () => {
      if (outcome === 'resolve') resolve(emptyResponse(FIXTURE_STEAMID))
      else reject(new Error('late request failure'))
    })
    expect(storage.value).toBeNull()
    expect(screen.queryByTestId('steam-portfolio-result')).toBeNull()
    expect(screen.queryByTestId('steam-portfolio-problem')).toBeNull()
    expect(screen.getByTestId('steam-portfolio-input')).toHaveValue('')
  })

  it('cancels an unmounted request before it can persist or request the catalog', async () => {
    const storage = new MemoryPortfolioStorage()
    let resolve!: (value: Response) => void
    const pending = new Promise<Response>((yes) => { resolve = yes })
    vi.stubGlobal('fetch', vi.fn(() => pending))
    const read = vi.fn(gateway.read)
    const view = renderPage({ ...gateway, read }, { storage })
    submit(FIXTURE_STEAMID)
    view.unmount()
    await act(async () => { resolve(emptyResponse(FIXTURE_STEAMID)) })
    expect(storage.value).toBeNull()
    expect(read).not.toHaveBeenCalled()
  })
})
