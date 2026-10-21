import { Fragment, useEffect, useMemo } from 'react'
import type { CatalogDisplayItemView } from '../adapter/catalogDisplayViewModel'
import type { FormalResultReadGateway } from '../api/FormalResultReadApi'
import type { MarketWatchlistPublicGateway } from '../api/MarketWatchlistPublicApi'
import { CatalogUnitPublicResultPanel } from '../components/CatalogUnitPublicResultPanel'
import type { CatalogPitContext } from '../components/CatalogPitContextBar'
import { CatalogUnitQualityPanel } from '../components/CatalogUnitQualityPanel'
import { CatalogUnitResearchResultPanel } from '../components/CatalogUnitResearchResultPanel'
import { NativeCnyUnavailablePanel } from '../components/NativeCnyUnavailablePanel'
import { CatalogUnitPricePanel, type CatalogPriceControls } from '../components/CatalogUnitPricePanel'
import { isPlainNavigationClick } from '../components/CatalogSeriesTile'
import { PriceQuotePanel } from '../components/PriceQuotePanel'
import { EnumChip, EnumPresentation } from '../components/EnumChip'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { PersonalWatchlistToggle } from '../components/PersonalWatchlistToggle'
import { PublicInstant } from '../components/PublicInstant'
import {
  itemKindLabel,
  wearTierLabel,
  type CatalogProjectionRow,
} from '../contract/catalogBrowse'
import { editionKindLabel, label } from '../contract/labels'
import { pick, useLang } from '../i18n'
import { t } from '../i18n/strings'
import { compareCatalogUnitsDefault } from '../catalog/catalogDefaultOrder'
import { cx } from '../catalog/catalogExplorerCopy'
import { catalogRarities, type CatalogRarity } from '../catalog/catalogFacetOptions'
import {
  personalWatchlistItemCandidate,
  type PersonalWatchlistController,
} from '../watchlist/personalWatchlist'
import type { PublicDetailOrigin } from '../publicNavigation'

export type CatalogUnitSibling = Readonly<{
  row: CatalogProjectionRow
  item: CatalogDisplayItemView
}>

/** One breadcrumb level: category, model or series. Without `href`/`onOpen` it is plain text. */
export type CatalogUnitCrumb = Readonly<{
  label: string
  href?: string
  onOpen?: () => void
}>

export function CatalogUnitDetailPage({
  row,
  item,
  pitContext,
  qualityGateway,
  publicResultGateway,
  queryAsOf,
  resultAsOf,
  onBack,
  siblingUnits,
  siblingTotal,
  onOpenSibling,
  onOpenParent,
  price,
  personalWatchlist,
  detailBackTarget = null,
  rarity = null,
  trail = [],
}: {
  row: CatalogProjectionRow
  item: CatalogDisplayItemView
  pitContext: CatalogPitContext
  qualityGateway?: FormalResultReadGateway
  publicResultGateway?: MarketWatchlistPublicGateway
  queryAsOf: string
  resultAsOf: string
  onBack: () => void
  siblingUnits: readonly CatalogUnitSibling[]
  siblingTotal?: number
  onOpenSibling?: (analysisUnitId: string) => void
  onOpenParent?: () => void
  price?: CatalogPriceControls & { knownAt: string }
  personalWatchlist?: PersonalWatchlistController
  detailBackTarget?: PublicDetailOrigin | null
  rarity?: CatalogRarity | null
  trail?: readonly CatalogUnitCrumb[]
}) {
  const lang = useLang()
  const publicDetail = pitContext.data_environment === 'LIVE_PUBLIC'
  const displayName = pick(item.display_name, lang)
  const rarityEntry = catalogRarities.find((entry) => entry.id === rarity)
  const watchlistCandidate = personalWatchlist
    ? personalWatchlistItemCandidate(row, item, pitContext)
    : null
  const orderedSiblings = useMemo(
    () => [...siblingUnits].sort((left, right) => compareCatalogUnitsDefault(
      { row: left.row, name: pick(left.item.display_name, lang) },
      { row: right.row, name: pick(right.item.display_name, lang) },
    )),
    [lang, siblingUnits],
  )

  useEffect(() => {
    const title = `${displayName} · ${t('publicBrand', lang)}`
    document.title = title
    return () => {
      // The page being opened may already have set its own title.
      if (document.title === title) document.title = t('publicDocumentTitle', lang)
    }
  }, [displayName, lang])

  return (
    <article className="catalog-explorer cx-detail" data-testid={`formal-unit-detail-${row.analysis_unit_id}`}>
      <div className="cx-series__top">
        <button type="button" className="cx-back" onClick={onBack}>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M10 3 5 8l5 5" /></svg>
          {t(detailBackTarget === 'FOLLOWING' ? 'personalWatchlistBack' : 'publicDetailBack', lang)}
        </button>
        {trail.length > 0 ? (
          <nav className="cx-crumbs" aria-label={cx('location', lang)} data-testid="formal-unit-trail">
            {trail.map((crumb, index) => (
              <Fragment key={index}>
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {crumb.href && crumb.onOpen ? (
                  <a
                    href={crumb.href}
                    onClick={(event) => {
                      if (!isPlainNavigationClick(event)) return
                      event.preventDefault()
                      crumb.onOpen!()
                    }}
                  >
                    {crumb.label}
                  </a>
                ) : <span>{crumb.label}</span>}
              </Fragment>
            ))}
          </nav>
        ) : null}
      </div>

      <header className="cx-detail__hero" data-rarity={rarity ?? undefined}>
        <div className="cx-detail__image">
          <ItemImageSlot
            source={item.image}
            label={displayName}
            variant="detail"
            presentation="PRODUCT"
            testId={`item-image-${row.analysis_unit_id}-formal-detail`}
          />
        </div>
        <div className="cx-detail__heading">
          <h1>{displayName}</h1>
          <div className="cx-detail__chips">
            {rarityEntry ? <span className="cx-series__rarity">{pick(rarityEntry.name, lang)}</span> : null}
            <EnumChip
              machine={row.edition_kind}
              label={label(editionKindLabel, row.edition_kind, lang)}
              presentation={EnumPresentation.PRODUCT_PRIMARY}
            />
            <EnumChip
              machine={row.wear_tier}
              label={pick(wearTierLabel[row.wear_tier], lang)}
              presentation={EnumPresentation.PRODUCT_PRIMARY}
            />
          </div>
          {personalWatchlist ? (
            <PersonalWatchlistToggle
              controller={personalWatchlist}
              candidate={watchlistCandidate}
              presentation="DETAIL"
            />
          ) : null}
        </div>
      </header>

      {price?.nativeCny ? <NativeCnyUnavailablePanel surface="result" /> : publicDetail ? <CatalogUnitPublicResultPanel gateway={publicResultGateway} identity={row} asOf={resultAsOf} /> : pitContext.snapshot && qualityGateway ? (
        <CatalogUnitResearchResultPanel
          gateway={qualityGateway}
          analysisUnitId={row.analysis_unit_id}
          expectedEdition={row.edition_kind}
          queryAsOf={resultAsOf}
          catalogSnapshotId={pitContext.snapshot.snapshot_id}
        />
      ) : null}

      {price ? (pitContext.snapshot ? <CatalogUnitPricePanel
        key={JSON.stringify([row.analysis_unit_id, pitContext.snapshot.snapshot_id, price.knownAt, queryAsOf])}
        context={{ analysisUnitId: row.analysis_unit_id, catalog: { snapshot_id: pitContext.snapshot.snapshot_id, as_of: pitContext.query_as_of, available_at: pitContext.snapshot.available_at }, queryAsOf, knownAt: price.knownAt }}
        gateway={price.gateway}
        cnyPerUsd={price.cnyPerUsd}
        discovery={price.discovery}
        enabled={price.enabled}
        nativeCny={price.nativeCny}
      /> : <div className="formal-price-runtime"><PriceQuotePanel state={{ status: 'UNAVAILABLE', reason: 'RECORD_REJECTED' }} /></div>) : null}

      <section className="cx-detail__card cx-detail__variants" data-testid="formal-unit-siblings">
        <header className="cx-detail__card-head">
          <h2>{t('publicDetailVariants', lang)}</h2>
          <span>{siblingTotal ?? orderedSiblings.length}</span>
        </header>
        <div className="cx-detail__variant-track">
          {orderedSiblings.map((sibling) => {
            const isCurrent = sibling.row.analysis_unit_id === row.analysis_unit_id
            const siblingName = pick(sibling.item.display_name, lang)
            return (
              <button
                key={sibling.row.analysis_unit_id}
                type="button"
                className="cx-detail__variant"
                aria-current={isCurrent ? 'page' : undefined}
                disabled={isCurrent || !onOpenSibling}
                data-testid={`formal-unit-sibling-${sibling.row.analysis_unit_id}`}
                onClick={() => onOpenSibling?.(sibling.row.analysis_unit_id)}
              >
                <ItemImageSlot
                  source={sibling.item.image}
                  label={siblingName}
                  variant="thumbnail"
                  presentation="PRODUCT"
                  testId={`item-image-${sibling.row.analysis_unit_id}-sibling`}
                />
                <span>
                  <strong>{siblingName}</strong>
                  <small>
                    {label(editionKindLabel, sibling.row.edition_kind, lang)} ·{' '}
                    {pick(wearTierLabel[sibling.row.wear_tier], lang)}
                  </small>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Identity internals and quality reports belong to the research workspace, not the public page. */}
      {publicDetail ? null : (
        <>
          <section className="cx-detail__card">
            <header className="cx-detail__card-head">
              <h2>{t('publicDetailIdentity', lang)}</h2>
            </header>
            <dl className="formal-unit-detail__identity">
              <div>
                <dt>{t('publicDetailKind', lang)}</dt>
                <dd>{pick(itemKindLabel[row.item_kind], lang)}</dd>
              </div>
              <div>
                <dt>{t('publicDetailEdition', lang)}</dt>
                <dd>{label(editionKindLabel, row.edition_kind, lang)}</dd>
              </div>
              <div>
                <dt>{t('publicDetailWear', lang)}</dt>
                <dd>{pick(wearTierLabel[row.wear_tier], lang)}</dd>
              </div>
              <div>
                <dt>{t('publicDetailParent', lang)}</dt>
                <dd>
                  {item.parent_analysis_unit_id === null ? (
                    '—'
                  ) : onOpenParent ? (
                    <button
                      type="button"
                      className="formal-unit-detail__parent-link"
                      data-testid="formal-unit-parent-link"
                      onClick={onOpenParent}
                    >
                      <code>{item.parent_analysis_unit_id}</code>
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : (
                    <code>{item.parent_analysis_unit_id}</code>
                  )}
                </dd>
              </div>
              <div>
                <dt>{t('publicDetailValidFrom', lang)}</dt>
                <dd>
                  <PublicInstant value={item.valid_from} testId="detail-valid-from" />
                </dd>
              </div>
              <div>
                <dt>{t('publicDetailAvailableAt', lang)}</dt>
                <dd>
                  <PublicInstant value={item.available_at} testId="detail-available-at" />
                </dd>
              </div>
            </dl>
          </section>

          {qualityGateway && !price?.nativeCny ? (
            <section className="cx-detail__quality">
              <CatalogUnitQualityPanel
                gateway={qualityGateway}
                analysisUnitId={row.analysis_unit_id}
                queryAsOf={resultAsOf}
              />
            </section>
          ) : null}
        </>
      )}
    </article>
  )
}
