import { useMemo, type MouseEvent } from 'react'
import { HttpItemCurrentPublicGateway } from '../api/HttpItemCurrentPublicGateway'
import { HttpValveEventsGateway } from '../api/HttpValveEventsGateway'
import { ItemCurrentPublicApi, type ItemCurrentPublicGateway } from '../api/ItemCurrentPublicApi'
import type { MarketSectorIndexPublicApi } from '../api/MarketSectorIndexPublicApi'
import {
  SingleItemTrendingPublicApi,
  type SingleItemTrendingPublicGateway,
} from '../api/SingleItemTrendingPublicApi'
import { ValveEventsApi, type ValveEventsGateway } from '../api/ValveEventsApi'
import { EquipmentModelImage } from '../components/EquipmentModelImage'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { useLang, type Lang } from '../i18n'
import { t } from '../i18n/strings'
import type { ItemCurrentMember, ItemCurrentSuccess } from '../wire/itemCurrentPublicApiTypes'
import { formatNativeTrendingPercent, isNativeTrendingMember, trendingProductHref, trendingRowKey, type TrendingDisplayList } from '../trending/nativeCnyTrendingPresentation'
import type { WireValveEventSummary } from '../wire/valveEventApiTypes'
import { sectorIllustrationModel } from './publicMarketIndexChart'
import { homeT, homeTf } from './publicHomeCopy'
import { itemCurrentT } from './publicItemCurrentCopy'
import { valvePublicLabel } from './valvePublicLabels'

import { homeGeneration, readRelease, readMonthWindow, type IndexWindow } from './PublicHomeHero'
import type { MarketSectorIndexDirectoryReleaseV3 } from '../wire/marketSectorIndexPublicApiV3Types'
import { aborted, useHomeLoad, formatDay, formatSignedPercent, direction, ModuleHead, ModuleMessage, itemImage } from './publicHomeShared'
export { HomeMarketPanel, useCompactHome } from './PublicHomeHero'
import type { HomeDirectory } from '../performance/homeDirectory'
const HOME_LIST_SIZE = 5
const HOME_VALVE_SIZE = 3

type RootSectors = Readonly<{ release: MarketSectorIndexDirectoryReleaseV3; sectors: readonly IndexWindow[] }>

async function readRootSectors(api: MarketSectorIndexPublicApi, signal: AbortSignal, prepared?: HomeDirectory): Promise<RootSectors | null> {
  const release = await readRelease(api, signal, prepared)
  if (release === null) return null
  const page = await api.directoryV3ScopePages('SECTORS', release.publication_id, { signal, priority: 'BACKGROUND' }, 32)
  const roots = page.scopes.filter((scope) => scope.parent_scope_code === 'ALL')
  const windows: (IndexWindow | null)[] = new Array(roots.length).fill(null)
  let next = 0
  // Four at a time, the same pool width the market page uses for its sector cards.
  await Promise.all(Array.from({ length: Math.min(4, roots.length) }, async () => {
    while (next < roots.length) {
      signal.throwIfAborted()
      const index = next
      next += 1
      try {
        // The strip shows only the daily return. Native origin cost grows with every history
        // day read, so native reads just the latest pair; legacy keeps its month window.
        windows[index] = await readMonthWindow(api, page.release, roots[index]!, signal, 'BACKGROUND',
          page.release.native_cny ? 'PAIR' : '1M')
      } catch (error) {
        if (aborted(error, signal)) throw error
        windows[index] = null
      }
    }
  }))
  const loaded = windows.filter((entry): entry is IndexWindow => entry !== null)
  if (loaded.length === 0) return null
  return {
    release: page.release,
    sectors: [...loaded].sort((left, right) => right.scope.current_member_count - left.scope.current_member_count),
  }
}

export function HomeSectorStrip({
  active = true,
  preparedDirectory,
  api,
  sectorHref,
  onSectorClick,
}: {
  active?: boolean
  preparedDirectory?: HomeDirectory
  api: MarketSectorIndexPublicApi
  /** `null` addresses the market page's sector overview tab. */
  sectorHref: (scopeCode: string | null) => string
  onSectorClick: (event: MouseEvent<HTMLAnchorElement>, scopeCode: string | null) => void
}) {
  const lang = useLang()
  // As in the hero: the per-visit directory episode is not part of the data identity.
  const state = useHomeLoad(active, (signal) => readRootSectors(api, signal, preparedDirectory), [api],
    homeGeneration(api, (value: RootSectors) => value.release))
  const lastDate = state.status === 'READY'
    ? state.value.sectors.map((entry) => entry.points.at(-1)?.date ?? '').sort().at(-1) ?? null
    : null
  return (
    <section className="public-home__sectors" aria-labelledby="public-home-sectors-title" data-testid="home-sectors">
      <ModuleHead
        titleId="public-home-sectors-title"
        title={homeT('sectorsTitle', lang)}
        meta={lastDate ? `${homeT('dataThrough', lang)} ${formatDay(lastDate, lang)}` : null}
        stale={false}
        href={sectorHref(null)}
        onClick={(event) => onSectorClick(event, null)}
      />
      {state.status === 'READY' ? (
        <ol className="public-home__sector-list">
          {state.value.sectors.map((entry) => {
            const modelId = sectorIllustrationModel(entry.scope.scope_code)
            return (
              <li key={entry.scope.scope_token}>
                <a
                  href={sectorHref(entry.scope.scope_code)}
                  onClick={(event) => onSectorClick(event, entry.scope.scope_code)}
                  data-direction={direction(entry.daily)}
                >
                  <span>{entry.scope.labels[lang === 'zh' ? 'zh_cn' : 'en']}</span>
                  <strong>{formatSignedPercent(entry.daily, lang)}</strong>
                  {modelId === null ? null : (
                    <i className="public-home__sector-image">
                      <EquipmentModelImage modelId={modelId} />
                    </i>
                  )}
                </a>
              </li>
            )
          })}
        </ol>
      ) : (
        <ModuleMessage status={state.status} loading="sectorsLoading" unavailable="sectorsUnavailable" className="public-home__sector-list" />
      )}
    </section>
  )
}

export function HomeMovers({
  active = true,
  gateway,
  href,
  onClick,
}: {
  active?: boolean
  gateway: SingleItemTrendingPublicGateway
  href: string
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const api = useMemo(() => new SingleItemTrendingPublicApi(gateway), [gateway])
  const state = useHomeLoad<TrendingDisplayList>(active, async (signal, publish) => {
    const document = await api.list({
      as_of: null,
      publication_id: null,
      direction: 'GAINERS',
      page_size: HOME_LIST_SIZE,
      cursor: null,
      filters: { item_kind: null, base_item_code: null, edition_kind: null, wear_tier: null },
    }, { signal, nativeLimit: HOME_LIST_SIZE, onProgress: (value) => {
      if (value.response_kind === 'TRENDING_LIST') publish(value)
    } })
    return document.response_kind === 'TRENDING_LIST' ? document : null
  }, [api])
  const document = state.status === 'READY' ? state.value : null
  const start = document?.publication.window_start_date
  const meta = document === null ? null : start
    ? homeTf('moversWindow', lang, { start: formatDay(start, lang), end: formatDay(document.api_version === 'native-cny'
      ? document.publication.window_end_date : document.publication.result_as_of, lang) })
    : `${homeT('dataThrough', lang)} ${formatDay(document.publication.result_as_of, lang)}`
  return (
    <section className="public-home__module" aria-labelledby="public-home-movers-title" data-testid="home-movers">
      <ModuleHead
        titleId="public-home-movers-title"
        title={homeT('moversTitle', lang)}
        meta={meta}
        stale={document !== null && document.api_version !== 'native-cny' && document.publication.freshness !== 'FRESH'}
        href={href}
        onClick={onClick}
      />
      {document !== null && document.members.length > 0 ? (
        <ol className="public-home__rows">
          {document.members.slice(0, HOME_LIST_SIZE).map((member) => {
            const pending = isNativeTrendingMember(member) && member.catalog_state === 'LOADING'
            const name = pending ? t('publicSnapshotLoading', lang) : lang === 'zh' ? member.catalog.localized_name.zh_cn : member.catalog.localized_name.en
            return (
              <li key={trendingRowKey(member)} aria-busy={pending} data-catalog-state={isNativeTrendingMember(member) ? member.catalog_state : undefined}>
                <a href={trendingProductHref(member, document.publication, lang)}>
                  <ItemImageSlot
                    metadataPending={pending}
                    source={itemImage(member.catalog.media, member.catalog.media.status === 'NOT_PRODUCED' ? null : member.catalog.media.media_asset_version_id)}
                    label={name}
                    variant="thumbnail"
                    presentation="PRODUCT"
                    testId={`home-movers-image-${member.rank}`}
                  />
                  <span className="public-home__row-name">{name}</span>
                  <strong className="public-home__row-value" data-direction="up">
                    {isNativeTrendingMember(member) ? formatNativeTrendingPercent(member.return_exact, lang, false)
                      : formatSignedPercent(Number(member.conservative_same_direction_change_floor_ratio), lang)}
                  </strong>
                </a>
              </li>
            )
          })}
        </ol>
      ) : (
        <ModuleMessage
          status={state.status === 'READY' ? 'EMPTY' : state.status}
          loading="moversLoading"
          unavailable="moversUnavailable"
          empty="moversEmpty"
        />
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Item monitor (current stages)

const STAGE_KEY = Object.freeze({
  SUPPLY_PRESSURE: 'supplyPressure',
  PRICE_RESPONSE_ONLY: 'priceOnly',
  PAIRED_RESPONSE: 'paired',
} as const satisfies Record<ItemCurrentMember['stage'], string>)

function currentHref(member: ItemCurrentMember, lang: Lang): string {
  const params = new URLSearchParams({ unit: member.catalog.analysis_unit_id, snapshot: member.catalog_snapshot_id })
  if (lang === 'en') params.set('lang', 'en')
  return `/research?${params}`
}

function firstTrigger(member: ItemCurrentMember): string | null {
  return [member.supply_onset, member.price_onset]
    .filter((value): value is string => value !== null)
    .sort()
    .at(0) ?? null
}

export function HomeItemCurrent({
  active = true,
  gateway,
  href,
  onClick,
}: {
  active?: boolean
  gateway: ItemCurrentPublicGateway | undefined
  href: string
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const api = useMemo(() => new ItemCurrentPublicApi(gateway ?? new HttpItemCurrentPublicGateway()), [gateway])
  const state = useHomeLoad<ItemCurrentSuccess>(active, async (signal) => {
    const document = await api.list({
      publication_id: null,
      page_size: HOME_LIST_SIZE,
      cursor: null,
      sort: 'RELIABLE_SIGNAL_DESC',
      name_query: null,
    }, { signal })
    return document.response_kind === 'ERROR' ? null : document
  }, [api])
  const document = state.status === 'READY' ? state.value : null
  return (
    <section className="public-home__module" aria-labelledby="public-home-current-title" data-testid="home-item-current">
      <ModuleHead
        titleId="public-home-current-title"
        title={homeT('currentTitle', lang)}
        meta={document === null ? null : `${homeT('dataThrough', lang)} ${formatDay(document.freshness.headline_data_date, lang)}`}
        stale={document !== null && document.freshness.status !== 'CURRENT'}
        href={href}
        onClick={onClick}
      />
      {document !== null && document.response_kind === 'RESULT' && document.members.length > 0 ? (
        <ol className="public-home__rows">
          {document.members.slice(0, HOME_LIST_SIZE).map((member) => {
            const name = lang === 'zh' ? member.catalog.localized_name.zh_cn : member.catalog.localized_name.en
            const trigger = firstTrigger(member)
            return (
              <li key={member.stage_token}>
                <a href={currentHref(member, lang)}>
                  <ItemImageSlot
                    source={itemImage(member.catalog.media, member.catalog.version_context.media_asset_version_id)}
                    label={name}
                    variant="thumbnail"
                    presentation="PRODUCT"
                    testId={`home-current-image-${member.stage_token}`}
                  />
                  <span className="public-home__row-name">
                    {name}
                    <small>{itemCurrentT(STAGE_KEY[member.stage], lang)}</small>
                  </span>
                  <span className="public-home__row-value public-home__row-value--muted">
                    {trigger === null ? '—' : formatDay(trigger, lang)}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
      ) : (
        <ModuleMessage
          status={state.status === 'READY' ? 'EMPTY' : state.status}
          loading="currentLoading"
          unavailable="currentUnavailable"
          empty="currentEmpty"
        />
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Valve announcements

function valveSummary(event: WireValveEventSummary, lang: Lang): string | null {
  const summary = event.conclusion_summary
  if (summary === null) return null
  if (typeof summary === 'string') return summary
  return lang === 'zh' ? summary.zh_cn : summary.en
}

export function HomeValve({
  active = true,
  gateway,
  href,
  onClick,
}: {
  active?: boolean
  gateway: ValveEventsGateway | undefined
  href: string
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const api = useMemo(
    () => new ValveEventsApi(gateway ?? new HttpValveEventsGateway({ listPageSize: HOME_VALVE_SIZE })),
    [gateway],
  )
  const state = useHomeLoad(active, async (signal) => (await api.list({ cursor: null }, { signal })).events, [api])
  const events = state.status === 'READY' ? state.value.slice(0, HOME_VALVE_SIZE) : []
  return (
    <section className="public-home__module" aria-labelledby="public-home-valve-title" data-testid="home-valve">
      <ModuleHead
        titleId="public-home-valve-title"
        title={homeT('valveTitle', lang)}
        meta={null}
        stale={false}
        href={href}
        onClick={onClick}
      />
      {events.length > 0 ? (
        <ol className="public-home__rows public-home__rows--valve">
          {events.map((event) => {
            const summary = valveSummary(event, lang)
            return (
              <li key={event.source.event_id}>
                <a href={href} onClick={onClick}>
                  <span className="public-home__valve-top">
                    <time dateTime={event.source.official_published_at}>{formatDay(event.source.official_published_at, lang, true)}</time>
                    {event.primary_direction ? (
                      <em data-direction={event.primary_direction}>{valvePublicLabel(event.primary_direction, lang)}</em>
                    ) : null}
                  </span>
                  <strong>{event.source.official_title}</strong>
                  <small>{summary ?? homeT('valveNoSummary', lang)}</small>
                </a>
              </li>
            )
          })}
        </ol>
      ) : (
        <ModuleMessage
          status={state.status === 'READY' ? 'EMPTY' : state.status}
          loading="valveLoading"
          unavailable="valveUnavailable"
          empty="valveEmpty"
        />
      )}
    </section>
  )
}
