import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import listFixture from '../../schemas/examples/catalog-display-list.valid.json'
import snapshotErrorFixture from '../../schemas/examples/catalog-display-snapshot-error.valid.json'
import snapshotListFixture from '../../schemas/examples/catalog-display-snapshot-list.valid.json'
import { toCatalogDisplayBrowseView } from '../src/adapter/catalogDisplayViewModel'
import type {
  CatalogDisplayGateway,
  CatalogDisplayGatewayRequest,
} from '../src/api/CatalogDisplayApi'
import { CatalogDisplayTransportError } from '../src/api/HttpCatalogDisplayGateway'
import { App } from '../src/App'
import {
  selectBaseItemCode,
  selectItemKind,
} from '../src/contract/catalogBrowse'
import { LangProvider } from '../src/i18n'
import { ItemBrowsePage } from '../src/pages/ItemBrowsePage'
import { decodeCatalogDisplayApiResponse } from '../src/wire/catalogDisplayApiDecode'
import { canonicalHash } from '../src/wire/canonical'
import type {
  CatalogEditionKind,
  CatalogNameAuthority,
  WireCatalogDisplayListResponse,
  WireCatalogDisplayProjection,
} from '../src/wire/catalogDisplayApiTypes'
import type {
  WireCatalogDisplaySnapshotListResponse,
} from '../src/wire/catalogDisplaySnapshotApiTypes'

const SNAPSHOT_QUERY_AS_OF = '2026-08-25T02:00:00.000000Z'
const SNAPSHOT_KNOWN_AT = '2026-08-25T02:00:00.000000Z'

function boundSnapshotResponse(
  request: Extract<
    CatalogDisplayGatewayRequest,
    { operation: 'CATALOG_DISPLAY_SNAPSHOT_LIST' }
  >,
  memberCount = 1,
): WireCatalogDisplaySnapshotListResponse {
  const response = structuredClone(
    snapshotListFixture,
  ) as WireCatalogDisplaySnapshotListResponse
  response.query = structuredClone(request.query)
  response.members[0].catalog_version =
    listFixture.members[0].projection.catalog_version
  response.members[0].member_count = memberCount
  response.members = [
    response.members[0],
    {
      ...structuredClone(response.members[0]),
      as_of: '2026-08-24T23:00:00.000000Z',
      available_at: '2026-08-25T00:00:00.000000Z',
      snapshot_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
  ]
  return response
}

function decodedView(payload: unknown = listFixture) {
  return toCatalogDisplayBrowseView(decodeCatalogDisplayApiResponse(payload))
}

function renderBrowse(lang: 'zh' | 'en', payload: unknown = listFixture) {
  const view = decodedView(payload)
  const state = selectBaseItemCode(
    'WEAPON',
    'fixture.weapon.official-name-shape',
    view.rows,
  )
  return render(
    <LangProvider lang={lang}>
      <ItemBrowsePage
        state={state}
        onChange={() => undefined}
        onBackToWatchList={() => undefined}
        projectionRows={view.rows}
        displayItems={view.items}
        pitContext={view}
      />
    </LangProvider>,
  )
}

function rehash(projection: WireCatalogDisplayProjection): void {
  const { projection_hash: _projectionHash, ...document } = projection
  projection.projection_hash = canonicalHash(document)
}

function providerPayload(
  authority: CatalogNameAuthority,
  en: string,
  zhCn: string,
  editionKind: CatalogEditionKind,
): WireCatalogDisplayListResponse {
  const payload = structuredClone(listFixture) as WireCatalogDisplayListResponse
  payload.members[0].projection.localized_name = {
    authority,
    en,
    zh_cn: zhCn,
  }
  payload.members[0].projection.edition_kind = editionKind
  rehash(payload.members[0].projection)
  return payload
}

class BoundFixtureGateway implements CatalogDisplayGateway {
  readonly kind = 'CATALOG_DISPLAY_TEST'
  readonly requests: CatalogDisplayGatewayRequest[] = []

  constructor(private readonly error = false) {}

  async read(request: CatalogDisplayGatewayRequest): Promise<unknown> {
    this.requests.push(structuredClone(request))
    if (request.operation === 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
      if (this.error) return structuredClone(snapshotErrorFixture)
      return boundSnapshotResponse(request)
    }
    const response = structuredClone(listFixture) as WireCatalogDisplayListResponse
    response.query = structuredClone(request.query)
    return response
  }
}

class RetryOnceGateway implements CatalogDisplayGateway {
  readonly kind = 'CATALOG_DISPLAY_RETRY_TEST'
  readonly requests: CatalogDisplayGatewayRequest[] = []

  async read(request: CatalogDisplayGatewayRequest): Promise<unknown> {
    this.requests.push(structuredClone(request))
    if (this.requests.length === 1) {
      throw new CatalogDisplayTransportError('NETWORK_UNAVAILABLE', true)
    }
    if (request.operation === 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
      return boundSnapshotResponse(request)
    }
    const response = structuredClone(listFixture) as WireCatalogDisplayListResponse
    response.query = structuredClone(request.query)
    return response
  }
}

describe('real PIT catalog display browse adapter', () => {
  it('preserves and selects a long base item code while exposing its wrapping hook', async () => {
    const longBaseItemCode =
      'defindex:4|paint:token:paintkit_cu_glock_wasteland_rebel_tag'
    const view = decodedView()
    const rows = view.rows.map((row) => ({
      ...row,
      base_item_code: longBaseItemCode,
    }))
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(
      <LangProvider lang="en">
        <ItemBrowsePage
          state={selectItemKind('WEAPON')}
          onChange={onChange}
          onBackToWatchList={() => undefined}
          projectionRows={rows}
          displayItems={view.items}
          pitContext={view}
        />
      </LangProvider>,
    )

    const choice = screen.getByTestId(`catalog-base-${longBaseItemCode}`)
    expect(choice).toHaveClass('catalog-browse__base-choice')
    expect(choice).toHaveTextContent(longBaseItemCode)

    await user.click(choice)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ baseItemCode: longBaseItemCode }),
    )
  })

  it('renders the exact Chinese official string and explicit PIT context', () => {
    renderBrowse('zh')
    expect(screen.getByTestId('catalog-pit-context')).toHaveTextContent(
      'LOCAL_REAL_PIT_CATALOG',
    )
    expect(screen.getByTestId('catalog-pit-context')).toHaveAttribute(
      'data-data-environment',
      'LIVE_LOCAL',
    )
    expect(screen.getByTestId('catalog-pit-context')).toHaveTextContent(
      '2026-08-24T09:00:00.000000Z',
    )
    expect(
      screen.getByText('StatTrak™ 合同样例 | 官方字符串形状 (久经沙场)'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/合成步枪/)).toBeNull()
  })

  it('uses the complete English string after language selection', () => {
    renderBrowse('en')
    expect(
      screen.getByText(
        'StatTrak™ Contract Fixture | Official String Shape (Field-Tested)',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/官方字符串形状/)).toBeNull()
  })

  it('does not render per-item source attribution in the catalog', () => {
    renderBrowse('en')
    expect(screen.queryByText(/Name source|VALVE_STEAM/u)).toBeNull()
  })

  it.each([
    {
      authority: 'MARKET_D' as const,
      edition: 'SOUVENIR' as const,
      en: 'Souvenir AWP | Dragon Lore 🐉 (Field-Tested)',
      zhCn: 'AWP（纪念品） | 巨龙传说 🐉（久经沙场）',
    },
    {
      authority: 'MARKET_B' as const,
      edition: 'STATTRAK' as const,
      en: 'StatTrak™ AK-47 | Café Ω (Field-Tested)',
      zhCn: 'AK-47（StatTrak™） | 咖啡☕（久经沙场）',
    },
  ])(
    'preserves both $authority Unicode locale strings without rendering per-item attribution',
    ({ authority, edition, en, zhCn }) => {
      const payload = providerPayload(authority, en, zhCn, edition)
      const view = decodedView(payload)
      expect(view.items[0]).toMatchObject({
        name_authority: authority,
        display_name: { en, zh: zhCn },
      })

      const english = renderBrowse('en', payload)
      expect(screen.getByText(en)).toBeInTheDocument()
      expect(screen.queryByText(new RegExp(`Name source|${authority}`, 'u'))).toBeNull()
      english.unmount()

      renderBrowse('zh', payload)
      expect(screen.getByText(zhCn)).toBeInTheDocument()
      expect(screen.queryByText(new RegExp(`名称来源|${authority}`, 'u'))).toBeNull()
    },
  )

  it('turns only an internal media key into a same-origin media route', () => {
    const view = decodedView()
    expect(view.items[0].image).toMatchObject({
      status: 'BOUND',
      src: '/media/catalog/v1/105/Zml4dHVyZS9zZXJpZXMtcmVwcmVzZW50YXRpdmU',
    })
    expect(JSON.stringify(view.items[0])).not.toMatch(
      /source_asset_ref|https?:\/\/|api[_-]?key|allowedOrigins|steamstatic|akamai|cdn\./iu,
    )
    renderBrowse('en')
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute(
      'src',
      '/media/catalog/v1/105/Zml4dHVyZS9zZXJpZXMtcmVwcmVzZW50YXRpdmU',
    )
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(image.getAttribute('src')).not.toMatch(/steam|market_[a-d]/i)
    expect(
      screen.getByTestId('catalog-row-fixture:item:official-name-shape').outerHTML,
    ).not.toMatch(
      /source_asset_ref|https?:\/\/|api[_-]?key|allowedOrigins|steamstatic|akamai|cdn\./iu,
    )
  })

  it('prefers an explicitly bound row as the formal series representative', () => {
    const view = decodedView()
    const unboundId = 'fixture:item:series-unbound'
    const boundId = 'fixture:item:series-bound'
    const rows = [
      { ...view.rows[0], analysis_unit_id: unboundId },
      { ...view.rows[0], analysis_unit_id: boundId },
    ]
    const items = [
      {
        ...view.items[0],
        analysis_unit_id: unboundId,
        image: { status: 'NOT_PRODUCED' as const },
      },
      { ...view.items[0], analysis_unit_id: boundId },
    ]
    const context = { ...view, rows, items }

    render(
      <LangProvider lang="en">
        <ItemBrowsePage
          state={{ ...selectItemKind('WEAPON'), equipmentModel: 'unclassified:WEAPON' }}
          onChange={() => undefined}
          projectionRows={rows}
          displayItems={items}
          pitContext={context}
          presentation="FORMAL_PUBLIC"
        />
      </LangProvider>,
    )

    expect(screen.getByTestId(`item-image-${boundId}-series`)).toHaveAttribute(
      'data-image-source',
      'BOUND',
    )
    expect(screen.queryByTestId(`item-image-${unboundId}-series`)).toBeNull()
  })

  it('maps a transparent redirect terminal load to BOUND without exposing its target', () => {
    renderBrowse('en')
    const slot = screen.getByTestId(
      'item-image-fixture:item:official-name-shape-browse',
    )
    const image = screen.getByRole('img')

    expect(slot).toHaveAttribute('data-image-status', 'LOADING')
    expect(image).toHaveAttribute(
      'src',
      '/media/catalog/v1/105/Zml4dHVyZS9zZXJpZXMtcmVwcmVzZW50YXRpdmU',
    )
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')

    // jsdom exposes only the terminal event that the component receives. The joint browser gate
    // performs the real synthetic HTTP 307 and proves that the browser, not the frontend, follows it.
    fireEvent.load(image)
    expect(slot).toHaveAttribute('data-image-status', 'BOUND')
    expect(image).toHaveAttribute(
      'src',
      '/media/catalog/v1/105/Zml4dHVyZS9zZXJpZXMtcmVwcmVzZW50YXRpdmU',
    )
    expect(slot.outerHTML).not.toMatch(
      /source_asset_ref|https?:\/\/|api[_-]?key|steamstatic|akamai|cdn\./iu,
    )
  })

  it('retries a temporary redirected image failure and can recover without a mock fallback', async () => {
    vi.useFakeTimers()
    renderBrowse('en')
    const slot = screen.getByTestId(
      'item-image-fixture:item:official-name-shape-browse',
    )
    const initialImage = screen.getByRole('img')

    fireEvent.error(initialImage)
    expect(slot).toHaveAttribute('data-image-status', 'LOADING')
    expect(slot).toHaveAttribute('data-image-attempt', '0')
    expect(slot.querySelector('.item-image-slot__fallback')).not.toBeNull()

    await act(async () => { await vi.runOnlyPendingTimersAsync() })
    const retriedImage = screen.getByRole('img')
    expect(retriedImage).not.toBe(initialImage)
    expect(slot).toHaveAttribute('data-image-attempt', '1')
    fireEvent.load(retriedImage)
    expect(slot).toHaveAttribute('data-image-status', 'BOUND')
    expect(retriedImage).toHaveAttribute(
      'src',
      '/media/catalog/v1/105/Zml4dHVyZS9zZXJpZXMtcmVwcmVzZW50YXRpdmU',
    )
    expect(screen.queryByText('ITEM-0001')).toBeNull()
    expect(screen.getByTestId('catalog-pit-context')).toHaveAttribute(
      'data-data-environment',
      'LIVE_LOCAL',
    )
    vi.useRealTimers()
  })

  it('stops after the bounded image retry schedule', async () => {
    vi.useFakeTimers()
    renderBrowse('en')
    const slot = screen.getByTestId(
      'item-image-fixture:item:official-name-shape-browse',
    )

    for (let attempt = 0; attempt < 4; attempt += 1) {
      fireEvent.error(slot.querySelector('img')!)
      expect(slot).toHaveAttribute('data-image-status', 'LOADING')
      await act(async () => { await vi.runOnlyPendingTimersAsync() })
      expect(slot).toHaveAttribute('data-image-attempt', String(attempt + 1))
    }
    fireEvent.error(slot.querySelector('img')!)
    expect(slot).toHaveAttribute('data-image-status', 'LOAD_FAILED')
    expect(slot).toHaveTextContent('Image failed to load')
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })

  it('does not route a real catalog row into the existing mock detail surface', () => {
    renderBrowse('en')
    const row = screen.getByTestId('catalog-row-fixture:item:official-name-shape')
    expect(row.tagName).toBe('DIV')
    expect(screen.queryByRole('button', { name: /official string shape/i })).toBeNull()
  })

  it('fails closed instead of falling back to matching mock identities', () => {
    const view = decodedView()
    const state = selectBaseItemCode(
      'WEAPON',
      'fixture.weapon.official-name-shape',
      view.rows,
    )
    expect(() =>
      render(
        <LangProvider lang="en">
          <ItemBrowsePage
            state={state}
            onChange={() => undefined}
            onBackToWatchList={() => undefined}
            projectionRows={view.rows}
            displayItems={[]}
            pitContext={view}
          />
        </LangProvider>,
      ),
    ).toThrow(/account exactly/)
  })

  it('keeps an explicitly unbound media row in the existing placeholder state', () => {
    const payload = structuredClone(listFixture) as WireCatalogDisplayListResponse
    payload.members[0].projection.media = { status: 'NOT_PRODUCED' }
    payload.members[0].projection.version_context.media_asset_version_id = null
    rehash(payload.members[0].projection)
    const view = toCatalogDisplayBrowseView(decodeCatalogDisplayApiResponse(payload))
    expect(view.items[0].image).toEqual({ status: 'NOT_PRODUCED' })
  })

  it('switches the existing item-module browse surface to real PIT data without a mock fallback', async () => {
    const user = userEvent.setup()
    const gateway = new BoundFixtureGateway()
    render(
      <App
        initialPage="items"
        catalogGateway={gateway}
        catalogSnapshotQueryAsOf={SNAPSHOT_QUERY_AS_OF}
        catalogSnapshotKnownAt={SNAPSHOT_KNOWN_AT}
      />,
    )
    await user.click(await screen.findByTestId('open-catalog-browse'))
    await screen.findByTestId('catalog-pit-context')
    await user.click(await screen.findByTestId('catalog-kind-WEAPON'))
    await user.click(
      await screen.findByTestId('catalog-base-fixture.weapon.official-name-shape'),
    )
    expect(
      screen.getByText('StatTrak™ 合同样例 | 官方字符串形状 (久经沙场)'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('page-item-browse')).queryByText('ITEM-0001'),
    ).toBeNull()
    expect(screen.getByTestId('prototype-banner')).toHaveTextContent(
      'MIXED_PROVENANCE',
    )
    expect(screen.getByTestId('data-channel')).toHaveTextContent('LIVE_CATALOG')
    expect(screen.queryByTestId('quality-strip')).toBeNull()
    expect(gateway.requests).toHaveLength(2)
    expect(gateway.requests[0]).toMatchObject({
      operation: 'CATALOG_DISPLAY_SNAPSHOT_LIST',
      query: {
        query_as_of: SNAPSHOT_QUERY_AS_OF,
        known_at: SNAPSHOT_KNOWN_AT,
        page_size: 200,
      },
    })
    expect(gateway.requests[1]).toMatchObject({
      operation: 'CATALOG_DISPLAY_LIST',
      query: {
        as_of: '2026-08-25T01:00:00.000000Z',
        known_at: '2026-08-25T01:00:01.000000Z',
        page_size: 200,
      },
    })
    expect(screen.getByTestId('catalog-pit-context')).toHaveTextContent(
      'AVAILABLE AT 2026-08-25T01:00:01.000000Z',
    )
    expect(screen.getByTestId('catalog-pit-context')).toHaveTextContent(
      'SNAPSHOT bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    )
    expect(screen.getByTestId('catalog-pit-context')).not.toHaveTextContent(
      SNAPSHOT_QUERY_AS_OF,
    )
  })

  it('stops on a controlled real-catalog error instead of rendering mock rows', async () => {
    const user = userEvent.setup()
    render(
      <App
        initialPage="items"
        catalogGateway={new BoundFixtureGateway(true)}
        catalogSnapshotQueryAsOf={SNAPSHOT_QUERY_AS_OF}
        catalogSnapshotKnownAt={SNAPSHOT_KNOWN_AT}
      />,
    )
    await user.click(await screen.findByTestId('open-catalog-browse'))
    expect(await screen.findByTestId('catalog-real-error')).toHaveTextContent(
      '不回退到 MOCK',
    )
    expect(screen.queryByTestId('catalog-kind-WEAPON')).toBeNull()
    expect(within(screen.getByTestId('catalog-real-error')).queryByText('ITEM-0001')).toBeNull()
    expect(screen.getByTestId('catalog-real-error')).toHaveTextContent(
      'CONTRACT_UNAVAILABLE',
    )
    expect(screen.getByTestId('catalog-real-retry')).toBeInTheDocument()
  })

  it('offers a bounded manual retry for a retryable transport failure', async () => {
    const user = userEvent.setup()
    const gateway = new RetryOnceGateway()
    render(
      <App
        initialPage="items"
        catalogGateway={gateway}
        catalogSnapshotQueryAsOf={SNAPSHOT_QUERY_AS_OF}
        catalogSnapshotKnownAt={SNAPSHOT_KNOWN_AT}
      />,
    )
    await user.click(await screen.findByTestId('open-catalog-browse'))
    const failure = await screen.findByTestId('catalog-real-error')
    expect(failure).toHaveTextContent('NETWORK_UNAVAILABLE')
    expect(failure).toHaveTextContent('retryable=true')
    expect(within(failure).queryByText('ITEM-0001')).toBeNull()

    await user.click(screen.getByTestId('catalog-real-retry'))
    expect(await screen.findByTestId('catalog-pit-context')).toHaveAttribute(
      'data-data-environment',
      'LIVE_LOCAL',
    )
    expect(gateway.requests).toHaveLength(3)
  })

  it('withholds unexpected backend details from the formal failure surface', async () => {
    const user = userEvent.setup()
    const gateway: CatalogDisplayGateway = {
      kind: 'CATALOG_DISPLAY_SECRET_ERROR_TEST',
      async read() {
        throw new Error(
          'source_asset_ref=https://provider.invalid/private SQL DSN C:/catalog/media/key',
        )
      },
    }
    render(
      <App
        initialPage="items"
        catalogGateway={gateway}
        catalogSnapshotQueryAsOf={SNAPSHOT_QUERY_AS_OF}
        catalogSnapshotKnownAt={SNAPSHOT_KNOWN_AT}
      />,
    )
    await user.click(await screen.findByTestId('open-catalog-browse'))
    const failure = await screen.findByTestId('catalog-real-error')
    expect(failure).toHaveTextContent('CONSUMPTION_BOUNDARY_REJECTED')
    expect(failure.textContent).not.toMatch(
      /source_asset_ref|provider\.invalid|SQL|DSN|C:\/catalog/i,
    )
    expect(screen.queryByTestId('catalog-real-retry')).toBeNull()
  })

  it('preserves a real-catalog filter selection without reconciling it against MOCK rows', async () => {
    const user = userEvent.setup()
    const gateway = new BoundFixtureGateway()
    render(
      <App
        initialPage="items"
        catalogGateway={gateway}
        catalogSnapshotQueryAsOf={SNAPSHOT_QUERY_AS_OF}
        catalogSnapshotKnownAt={SNAPSHOT_KNOWN_AT}
      />,
    )
    await user.click(await screen.findByTestId('open-catalog-browse'))
    await screen.findByTestId('catalog-pit-context')
    await user.click(screen.getByTestId('catalog-kind-WEAPON'))
    await user.click(
      screen.getByTestId('catalog-base-fixture.weapon.official-name-shape'),
    )
    await user.click(screen.getByTestId('catalog-edition-STATTRAK'))
    expect(screen.getByTestId('catalog-edition-STATTRAK')).not.toBeChecked()
    expect(screen.getByTestId('catalog-empty')).toBeInTheDocument()

    await user.click(screen.getByTestId('return-to-watch-list'))
    await user.click(screen.getByTestId('open-catalog-browse'))
    expect(await screen.findByTestId('catalog-edition-STATTRAK')).not.toBeChecked()
    expect(screen.getByTestId('catalog-empty')).toBeInTheDocument()
    expect(gateway.requests).toHaveLength(4)
  })

  it('fails closed on an empty snapshot inventory without querying units or using mock rows', async () => {
    const requests: CatalogDisplayGatewayRequest[] = []
    const gateway: CatalogDisplayGateway = {
      kind: 'CATALOG_DISPLAY_EMPTY_INVENTORY_TEST',
      async read(request) {
        requests.push(structuredClone(request))
        if (request.operation !== 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
          throw new Error('units must not be queried without a selected descriptor')
        }
        const response = boundSnapshotResponse(request)
        response.members = []
        response.next_cursor = null
        return response
      },
    }
    const user = userEvent.setup()
    render(
      <App
        initialPage="items"
        catalogGateway={gateway}
        catalogSnapshotQueryAsOf={SNAPSHOT_QUERY_AS_OF}
        catalogSnapshotKnownAt={SNAPSHOT_KNOWN_AT}
      />,
    )
    await user.click(await screen.findByTestId('open-catalog-browse'))
    const failure = await screen.findByTestId('catalog-real-error')
    expect(failure).toHaveTextContent('NO_AVAILABLE_SNAPSHOT')
    expect(failure).toHaveTextContent('retryable=false')
    expect(screen.queryByTestId('catalog-real-retry')).toBeNull()
    expect(screen.queryByTestId('catalog-kind-WEAPON')).toBeNull()
    expect(within(failure).queryByText('ITEM-0001')).toBeNull()
    expect(requests).toHaveLength(1)
    expect(requests[0].operation).toBe('CATALOG_DISPLAY_SNAPSHOT_LIST')
  })

  it('renders a sealed zero-member projection explicitly without mock rows', async () => {
    const empty = structuredClone(listFixture) as WireCatalogDisplayListResponse
    empty.members = []
    empty.next_cursor = null
    const gateway: CatalogDisplayGateway = {
      kind: 'CATALOG_DISPLAY_EMPTY_TEST',
      async read(request) {
        if (request.operation === 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
          return boundSnapshotResponse(request, 0)
        }
        const response = structuredClone(empty)
        response.query = structuredClone(request.query)
        return response
      },
    }
    const user = userEvent.setup()
    render(
      <App
        initialPage="items"
        catalogGateway={gateway}
        catalogSnapshotQueryAsOf={SNAPSHOT_QUERY_AS_OF}
        catalogSnapshotKnownAt={SNAPSHOT_KNOWN_AT}
      />,
    )
    await user.click(await screen.findByTestId('open-catalog-browse'))
    expect(await screen.findByTestId('catalog-real-empty')).toHaveTextContent(
      '这不表示所选组合无效',
    )
    expect(screen.queryByTestId('catalog-kind-WEAPON')).toBeNull()
    expect(within(screen.getByTestId('page-item-browse')).queryByText('ITEM-0001')).toBeNull()
  })
})
