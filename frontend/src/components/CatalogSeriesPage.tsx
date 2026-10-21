import { useMemo } from 'react'
import { toCatalogDisplayMemberView, type CatalogDisplayMemberView } from '../adapter/catalogDisplayViewModel'
import { catalogRarities, type CatalogRarity } from '../catalog/catalogFacetOptions'
import { cx } from '../catalog/catalogExplorerCopy'
import { catalogSeriesLabel } from '../catalog/catalogSeriesPresentation'
import { equipmentCategories, type EquipmentModel } from '../catalog/equipmentModels'
import { WearTier, wearTierLabel } from '../contract/catalogBrowse'
import { EditionKind } from '../contract/identity'
import { editionKindLabel, label } from '../contract/labels'
import { pick, useLang, type Lang } from '../i18n'
import { languageCurrency } from '../price/localizedCurrency'
import { compactMoneyText, lowestNativeCnySourceAsk, lowestSourceAsk } from '../price/lowestAsk'
import type { PriceCurrency } from '../price/pricePresentation'
import { useSeriesPriceRows, type SeriesPriceCell } from '../price/useSeriesPriceRows'
import { personalWatchlistItemCandidate, type PersonalWatchlistController } from '../watchlist/personalWatchlist'
import type { WireCatalogUnitsResponse } from '../wire/catalogDisplayQueryApiTypes'
import type { CatalogPitContext } from './CatalogPitContextBar'
import type { CatalogPriceControls } from './CatalogUnitPricePanel'
import { isPlainNavigationClick } from './CatalogSeriesTile'
import { ItemImageSlot } from './ItemImageSlot'
import { PersonalWatchlistToggle } from './PersonalWatchlistToggle'

const EDITION_ORDER: readonly EditionKind[] = [EditionKind.STANDARD, EditionKind.STATTRAK, EditionKind.SOUVENIR, EditionKind.UNKNOWN]
const WEAR_ORDER: readonly WearTier[] = [
  WearTier.FACTORY_NEW, WearTier.MINIMAL_WEAR, WearTier.FIELD_TESTED, WearTier.WELL_WORN,
  WearTier.BATTLE_SCARRED, WearTier.NOT_APPLICABLE, WearTier.UNKNOWN,
]

type Unit = CatalogDisplayMemberView & { name: string }

export type CatalogSeriesUnitsRead = Readonly<{
  status: 'loading' | 'error' | 'ready'
  response: WireCatalogUnitsResponse | undefined
  retryable: boolean
}>

/**
 * One series: every version × wear the snapshot contains, each cell carrying
 * the lowest current source-market listing. Opening a cell goes to the item.
 */
export function CatalogSeriesPage({
  read,
  retry,
  title,
  rarity,
  model,
  pitContext,
  queryAsOf,
  knownAt,
  price,
  unitHref,
  onOpenUnit,
  personalWatchlist,
  onBack,
  onOpenModel,
}: {
  read: CatalogSeriesUnitsRead
  retry: () => void
  title: string | null
  rarity: CatalogRarity | null
  model: EquipmentModel | undefined
  pitContext: CatalogPitContext
  queryAsOf: string
  knownAt: string
  price?: CatalogPriceControls
  unitHref: (analysisUnitId: string) => string
  onOpenUnit?: (analysisUnitId: string) => void
  personalWatchlist?: PersonalWatchlistController
  onBack: () => void
  onOpenModel?: () => void
}) {
  const lang = useLang()
  const response = read.response
  const units = useMemo<readonly Unit[]>(
    () => (response?.members ?? []).map((member) => {
      const view = toCatalogDisplayMemberView(member)
      return { ...view, name: pick(view.item.display_name, lang) }
    }),
    [lang, response],
  )
  const editions = EDITION_ORDER.filter((edition) => units.some((unit) => unit.row.edition_kind === edition))
  const wears = WEAR_ORDER.filter((wear) => units.some((unit) => unit.row.wear_tier === wear))
  const grid = useMemo(() => {
    const cells = new Map<string, Unit[]>()
    for (const unit of units) {
      const key = `${unit.row.edition_kind}|${unit.row.wear_tier}`
      cells.set(key, [...(cells.get(key) ?? []), unit].sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0))
    }
    return cells
  }, [units])
  // Reading order (row by row) so the top of the matrix fills first.
  const orderedIds = editions.flatMap((edition) => wears.flatMap((wear) =>
    (grid.get(`${edition}|${wear}`) ?? []).map((unit) => unit.row.analysis_unit_id)))
  const catalog = pitContext.snapshot
    ? { snapshot_id: pitContext.snapshot.snapshot_id, as_of: pitContext.query_as_of, available_at: pitContext.snapshot.available_at }
    : null
  const cells = useSeriesPriceRows({
    gateway: price?.gateway,
    catalog,
    unitIds: orderedIds,
    queryAsOf,
    knownAt,
    enabled: read.status === 'ready' && price !== undefined && price.enabled !== false,
    discovery: price?.discovery,
    reuse: !price?.nativeCny,
  })
  const currency = price?.nativeCny ? 'CNY' : languageCurrency(lang)
  const cnyPerUsd = price?.cnyPerUsd ?? null
  const hero = units.find((unit) => unit.row.edition_kind === EditionKind.STANDARD && unit.item.image.status === 'BOUND') ??
    units.find((unit) => unit.item.image.status === 'BOUND') ?? units[0]
  const heroTitle = title ?? (hero ? pick(catalogSeriesLabel(hero.row, hero.item.display_name), lang) : null)
  const rarityEntry = catalogRarities.find((entry) => entry.id === rarity)
  const category = model ? equipmentCategories.find((entry) => entry.id === model.category) : undefined
  const total = response?.total_matching_members

  return (
    <section className="cx-series" data-testid="catalog-base-section" aria-busy={read.status === 'loading'}>
      <div className="cx-series__top">
        <button type="button" className="cx-back" data-testid="catalog-series-back" onClick={onBack}>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M10 3 5 8l5 5" /></svg>
          {cx('back', lang)}
        </button>
        {model ? (
          <p className="cx-crumbs">
            {category ? <span>{pick(category.name, lang)}</span> : null}
            <span aria-hidden="true">/</span>
            {onOpenModel ? (
              <button type="button" onClick={onOpenModel}>{pick(model.name, lang)}</button>
            ) : <span>{pick(model.name, lang)}</span>}
          </p>
        ) : null}
      </div>

      <header className="cx-series__hero" data-rarity={rarity ?? undefined}>
        <div className="cx-series__image">
          {hero ? (
            <ItemImageSlot source={hero.item.image} label={heroTitle ?? hero.name} variant="detail" presentation="PRODUCT"
              testId={`item-image-${hero.row.analysis_unit_id}-series-hero`} />
          ) : <span className="cx-skeleton cx-skeleton--image" aria-hidden="true" />}
        </div>
        <div className="cx-series__heading">
          <h1 data-testid="catalog-selected-series">{heroTitle ?? ' '}</h1>
          <p className="cx-series__facts">
            {rarityEntry ? <span className="cx-series__rarity">{pick(rarityEntry.name, lang)}</span> : null}
            <span>{cx('seriesCount', lang, { count: total ?? '—' })}</span>
          </p>
        </div>
      </header>

      <section className="cx-matrix" data-testid="catalog-unit-rows" aria-busy={read.status === 'loading'}>
        <header className="cx-matrix__head">
          <h2>
            {cx('seriesVersions', lang)}
            {' '}
            <strong className="cx-visually-hidden" data-testid="catalog-unit-count" data-count-state={total === undefined ? 'unknown' : 'known'}>{total ?? '—'}</strong>
          </h2>
        </header>

        {read.status === 'loading' && !response ? (
          <div className="cx-matrix__loading" role="status">
            <span className="cx-visually-hidden">{cx('unitsLoading', lang)}</span>
            {Array.from({ length: 3 }, (_, index) => <span key={index} className="cx-skeleton cx-skeleton--row" aria-hidden="true" />)}
          </div>
        ) : null}
        {read.status === 'error' ? (
          <div className="cx-notice cx-notice--error" role="alert">
            <span>{cx('unitsFailed', lang)}</span>
            {read.retryable ? <button type="button" onClick={retry}>{cx('retry', lang)}</button> : null}
          </div>
        ) : null}
        {response && units.length === 0 ? <p className="cx-notice" data-testid="catalog-empty">{cx('unitsEmpty', lang)}</p> : null}

        {units.length > 0 ? (
          <table className="cx-matrix__table" style={{ ['--cx-wears' as string]: wears.length }}>
            <thead>
              <tr>
                <td />
                {wears.map((wear) => <th key={wear} scope="col">{wearName(wear, lang)}</th>)}
              </tr>
            </thead>
            <tbody>
              {editions.map((edition) => (
                <tr key={edition}>
                  <th scope="row">{label(editionKindLabel, edition, lang)}</th>
                  {wears.map((wear) => {
                    const entries = grid.get(`${edition}|${wear}`) ?? []
                    if (entries.length === 0) {
                      return (
                        <td key={wear} className="cx-cell cx-cell--missing" data-label={wearName(wear, lang)}>
                          <span aria-label={cx('noVariant', lang)}>—</span>
                        </td>
                      )
                    }
                    return (
                      <td key={wear} className="cx-cell" data-label={wearName(wear, lang)}>
                        {entries.map((unit) => (
                          <UnitLink key={unit.row.analysis_unit_id} unit={unit} showName={entries.length > 1}
                            cell={cells.get(unit.row.analysis_unit_id)} currency={currency} cnyPerUsd={cnyPerUsd} nativeCny={price?.nativeCny ?? false}
                            href={unitHref(unit.row.analysis_unit_id)} onOpen={onOpenUnit}
                            watchlist={personalWatchlist} pitContext={pitContext} />
                        ))}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </section>
  )
}

function wearName(wear: WearTier, lang: Lang): string {
  if (wear === WearTier.NOT_APPLICABLE) return cx('notApplicable', lang)
  if (wear === WearTier.UNKNOWN) return cx('unknownWear', lang)
  return pick(wearTierLabel[wear], lang)
}

function UnitLink({
  unit, showName, cell, currency, cnyPerUsd, nativeCny, href, onOpen, watchlist, pitContext,
}: {
  unit: Unit
  showName: boolean
  cell: SeriesPriceCell | undefined
  currency: PriceCurrency
  cnyPerUsd: string | null
  nativeCny: boolean
  href: string
  onOpen?: (analysisUnitId: string) => void
  watchlist?: PersonalWatchlistController
  pitContext: CatalogPitContext
}) {
  const lang = useLang()
  const watch = watchlist ? personalWatchlistItemCandidate(unit.row, unit.item, pitContext) : null
  const ask = cell?.status === 'READY' ? (nativeCny ? lowestNativeCnySourceAsk(cell.rows) : lowestSourceAsk(cell.rows, currency, cnyPerUsd)) : null
  const loading = cell === undefined || cell.status === 'LOADING'
  const priceText = ask ? compactMoneyText(ask.amount, ask.currency, ask.converted) : loading ? null : '—'
  const accessible = `${unit.name} · ${loading ? cx('priceLoading', lang) : ask ? `${cx('lowestAsk', lang)} ${priceText}` : cx('priceNone', lang)}`
  return (
    <div className="cx-unit-slot">
      <a
        className="cx-unit"
        href={href}
        data-testid={`catalog-row-${unit.row.analysis_unit_id}`}
        data-price-state={loading ? 'loading' : ask ? 'ask' : 'none'}
        data-price-currency={ask?.currency}
        data-price-converted={ask?.converted ? 'true' : undefined}
        aria-label={accessible}
        onClick={(event) => {
          if (!onOpen || !isPlainNavigationClick(event)) return
          event.preventDefault()
          onOpen(unit.row.analysis_unit_id)
        }}
      >
        {showName ? <span className="cx-unit__name">{unit.name}</span> : null}
        {priceText === null
          ? <span className="cx-skeleton cx-skeleton--price" aria-hidden="true" />
          : <span className="cx-unit__price">{priceText}</span>}
      </a>
      {/* A sibling of the link, never inside it: following must not open the item. */}
      {watch && watchlist ? <PersonalWatchlistToggle controller={watchlist} candidate={watch} presentation="ICON" /> : null}
    </div>
  )
}
