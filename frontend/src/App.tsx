import { useEffect, useState } from 'react'
import { LangProvider, type Lang } from './i18n'
import { t } from './i18n/strings'
import { DataQualityStrip } from './components/DataQualityStrip'
import { DataChannelBar } from './components/DataChannelBar'
import { PrototypeBanner } from './components/PrototypeBanner'
import type { FrontendDataMode } from './dataMode'
import type { FormalFixtureScenarioId } from './formal/fixtureMode'
import { HubPage, type DoorId } from './pages/HubPage'
import { FormalFixtureWorkspace } from './pages/FormalFixtureWorkspace'
import { ValveEventsWorkspace } from './pages/ValveEventsWorkspace'
import { MarketSectorDashboardPage } from './pages/MarketSectorDashboardPage'
import { MarketOverviewPage } from './pages/MarketOverviewPage'
import { ItemsPage } from './pages/ItemsPage'
import { ItemBrowsePage } from './pages/ItemBrowsePage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import {
  initialCatalogBrowseState,
  type CatalogBrowseState,
} from './contract/catalogBrowse'
import type { FormalResultReadGateway } from './api/FormalResultReadApi'
import type { CatalogDisplayGateway } from './api/CatalogDisplayApi'
import { CatalogDisplayBrowseBoundary } from './components/CatalogDisplayBrowseBoundary'
import type { ValveEventsGateway } from './api/ValveEventsApi'
import { SharedValveEventsFixtureGateway } from './formal/valveEventsFixture'
import { CATALOG_PROJECTION_ROWS } from './mock/catalogProjection'
import { units } from './mock/fixtures'

// `envelope` says what kind of provenance the view can honestly report. SINGLE means it answers
// for one analysis unit at one instant, which is what a ScopeHeaderBar reports. COLLECTION means
// it answers for a set, where a single timestamp or status would have to be invented. NONE means
// it reports no data at all. The market view is listed as SINGLE because its default section is
// the market scope; its sector section carries a collection envelope of its own.
export const VIEWS = [
  { id: 'hub', envelope: 'NONE' },
  { id: 'market', envelope: 'SINGLE' },
  { id: 'items', envelope: 'COLLECTION' },
  { id: 'item', envelope: 'SINGLE' },
] as const satisfies readonly { id: string; envelope: 'NONE' | 'SINGLE' | 'COLLECTION' }[]

export type ViewId = (typeof VIEWS)[number]['id']
export type FormalSurfaceId = 'MARKET_DASHBOARD' | 'RESULT_FIXTURES' | 'VALVE_EVENTS'

const FORMAL_VALVE_EVENTS_FIXTURE = new SharedValveEventsFixtureGateway()

export function App({
  initialPage = 'hub',
  initialLang = 'zh',
  initialItemId = 'ITEM-0001',
  initialDataMode = 'MOCK',
  initialFormalScenario,
  initialFormalSurface,
  qualityGateway,
  catalogGateway,
  catalogSnapshotQueryAsOf,
  catalogSnapshotKnownAt,
  valveEventsGateway,
}: {
  initialPage?: ViewId
  initialLang?: Lang
  initialItemId?: string
  initialDataMode?: FrontendDataMode
  initialFormalScenario?: FormalFixtureScenarioId
  initialFormalSurface?: 'MARKET_DASHBOARD' | 'VALVE_EVENTS'
  qualityGateway?: FormalResultReadGateway
  catalogGateway?: CatalogDisplayGateway
  catalogSnapshotQueryAsOf?: string
  catalogSnapshotKnownAt?: string
  valveEventsGateway?: ValveEventsGateway
}) {
  if (
    catalogGateway &&
    (!catalogSnapshotQueryAsOf || !catalogSnapshotKnownAt)
  ) {
    throw new TypeError(
      'real catalog mode requires explicit snapshot query_as_of and known_at cutoffs',
    )
  }
  const [view, setView] = useState<ViewId>(initialPage)
  const [lang, setLang] = useState<Lang>(initialLang)
  const [itemId, setItemId] = useState(initialItemId)
  const [dataMode, setDataMode] = useState<FrontendDataMode>(initialDataMode)
  const [itemSurface, setItemSurface] = useState<'browse' | 'unit'>('unit')
  const [detailOrigin, setDetailOrigin] = useState<'watchlist' | 'browse'>('watchlist')
  const [browseState, setBrowseState] = useState<CatalogBrowseState>(initialCatalogBrowseState)
  const baseFormalSurface: FormalSurfaceId = initialFormalScenario
    ? 'RESULT_FIXTURES'
    : 'MARKET_DASHBOARD'
  const [formalSurface, setFormalSurface] = useState<FormalSurfaceId>(
    initialFormalSurface === 'VALVE_EVENTS' ? 'VALVE_EVENTS' : baseFormalSurface,
  )
  const includesLiveQuality = dataMode === 'MOCK' && view === 'market'
  const includesLiveCatalog =
    dataMode === 'MOCK' &&
    view === 'item' &&
    itemSurface === 'browse' &&
    catalogGateway !== undefined

  // The tab title is part of the page too, so it switches with everything else.
  useEffect(() => {
    document.title = t(dataMode === 'FORMAL_FIXTURE' ? 'formalDocumentTitle' : 'documentTitle', lang)
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [dataMode, lang])

  // The two modes replace the entire main surface. Keeping the old document offset can land a
  // user halfway through an unrelated result block, so each channel switch starts at its readout.
  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [dataMode])

  const openItemFromWatchList = (id: string) => {
    setItemId(id)
    setDetailOrigin('watchlist')
    setItemSurface('unit')
    setView('item')
  }

  const openCatalogBrowse = () => {
    setItemSurface('browse')
    setView('item')
  }

  const openItemFromBrowse = (id: string) => {
    setItemId(id)
    setDetailOrigin('browse')
    setItemSurface('unit')
    setView('item')
  }

  const switchUnit = (id: string) => {
    setItemId(id)
  }

  const returnToCatalogBrowse = () => {
    setItemSurface('browse')
  }

  return (
    <LangProvider lang={lang}>
      <div className="app" lang={lang === 'zh' ? 'zh-CN' : 'en'}>
        <PrototypeBanner
          dataMode={dataMode}
          includesLiveQuality={includesLiveQuality}
          includesLiveCatalog={includesLiveCatalog}
          onSwitchLang={setLang}
        />
        <DataChannelBar
          mode={dataMode}
          includesLiveQuality={includesLiveQuality}
          includesLiveCatalog={includesLiveCatalog}
          onChange={setDataMode}
        />
        {dataMode === 'MOCK' && view !== 'hub' ? (
          <nav className="app__nav">
            <button type="button" data-testid="nav-hub" onClick={() => setView('hub')}>
              {t('navBack', lang)}
            </button>
            <button
              type="button"
              className={view === 'market' ? 'is-active' : undefined}
              onClick={() => setView('market')}
            >
              {t('pageMarket', lang)}
            </button>
            <button
              type="button"
              className={view === 'items' || view === 'item' ? 'is-active' : undefined}
              onClick={() => setView('items')}
            >
              {t('pageItems', lang)}
            </button>
          </nav>
        ) : null}
        <main className="app__main">
          {dataMode === 'FORMAL_FIXTURE' ? (
            <>
              <nav
                className="formal-module-nav"
                aria-label={t('formalModuleSwitchLabel', lang)}
                data-testid="formal-module-nav"
              >
                <button
                  type="button"
                  className={formalSurface === baseFormalSurface ? 'is-active' : undefined}
                  aria-pressed={formalSurface === baseFormalSurface}
                  data-testid="formal-module-market"
                  onClick={() => setFormalSurface(baseFormalSurface)}
                >
                  {t(
                    initialFormalScenario ? 'formalModuleResults' : 'formalModuleMarket',
                    lang,
                  )}
                </button>
                <button
                  type="button"
                  className={formalSurface === 'VALVE_EVENTS' ? 'is-active' : undefined}
                  aria-pressed={formalSurface === 'VALVE_EVENTS'}
                  data-testid="formal-module-valve-events"
                  onClick={() => setFormalSurface('VALVE_EVENTS')}
                >
                  {t('formalModuleValveEvents', lang)}
                </button>
              </nav>
              {formalSurface === 'RESULT_FIXTURES' ? (
                <FormalFixtureWorkspace initialScenario={initialFormalScenario} />
              ) : null}
              {formalSurface === 'MARKET_DASHBOARD' ? (
                <MarketSectorDashboardPage />
              ) : null}
              {formalSurface === 'VALVE_EVENTS' ? (
                <ValveEventsWorkspace
                  gateway={valveEventsGateway ?? FORMAL_VALVE_EVENTS_FIXTURE}
                />
              ) : null}
            </>
          ) : (
            <>
              {view === 'hub' && <HubPage onOpen={(door: DoorId) => setView(door)} />}
              {view === 'market' && <MarketOverviewPage qualityGateway={qualityGateway} />}
              {view === 'items' && (
                // The watch list keeps a separate catalog-browse entry; watch rows still
                // open unit detail. Browsing is not a third Hub door.
                <ItemsPage onOpenItem={openItemFromWatchList} onOpenBrowse={openCatalogBrowse} />
              )}
              {view === 'item' && itemSurface === 'browse' ? (
                catalogGateway ? (
                  <CatalogDisplayBrowseBoundary
                    gateway={catalogGateway}
                    queryAsOf={catalogSnapshotQueryAsOf!}
                    knownAt={catalogSnapshotKnownAt!}
                    state={browseState}
                    onChange={setBrowseState}
                    onBackToWatchList={() => setView('items')}
                  />
                ) : (
                  <ItemBrowsePage
                    state={browseState}
                    onChange={setBrowseState}
                    onOpenUnit={openItemFromBrowse}
                    onBackToWatchList={() => setView('items')}
                    projectionRows={CATALOG_PROJECTION_ROWS}
                    mockItems={units(lang)}
                  />
                )
              ) : null}
              {view === 'item' && itemSurface === 'unit' ? (
                // Browse rows pass analysis_unit_id into the existing unit detail; return
                // follows origin (browse → browse, watch list → watch list).
                <ItemDetailPage
                  analysisUnitId={itemId}
                  onOpenItem={switchUnit}
                  onReturnToBrowse={
                    detailOrigin === 'browse' ? returnToCatalogBrowse : undefined
                  }
                />
              ) : null}
            </>
          )}
        </main>
        {dataMode === 'MOCK' && view !== 'market' && !includesLiveCatalog ? (
          <DataQualityStrip />
        ) : null}
        <footer className="app__footer">{t('footer', lang)}</footer>
      </div>
    </LangProvider>
  )
}
