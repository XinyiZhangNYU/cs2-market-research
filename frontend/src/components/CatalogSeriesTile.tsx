import type { MouseEvent } from 'react'
import { catalogRarities, type CatalogRarity } from '../catalog/catalogFacetOptions'
import { cx } from '../catalog/catalogExplorerCopy'
import { isUnpaintedWeaponSeries } from '../catalog/catalogSeriesPresentation'
import type { ItemKind } from '../contract/catalogBrowse'
import type { ItemImageSource } from '../contract/itemImage'
import { pick, useLang } from '../i18n'
import { CatalogSeriesImageSlot } from './CatalogSeriesImageSlot'

/** Plain left click stays in the app; modified or middle clicks keep link behaviour. */
export function isPlainNavigationClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/** The model an unpainted base weapon stands for; its tile opens that model's series list. */
export type CatalogTileModelLink = Readonly<{
  href: string
  seriesCount: number
  current: boolean
  onOpen: () => void
}>

export function CatalogSeriesTile({
  itemKind,
  baseItemCode,
  analysisUnitId,
  name,
  image,
  rarity,
  count,
  href,
  onOpen,
  modelLink,
}: {
  itemKind: ItemKind
  baseItemCode: string
  analysisUnitId: string
  name: string
  image: ItemImageSource
  rarity: CatalogRarity | null
  count: number
  href: string
  onOpen: () => void
  modelLink?: CatalogTileModelLink
}) {
  const lang = useLang()
  const rarityEntry = catalogRarities.find((entry) => entry.id === rarity)
  const passive = isUnpaintedWeaponSeries({ item_kind: itemKind, base_item_code: baseItemCode })
  const meta = passive && modelLink
    ? <span>{modelLink.current ? cx('currentModel', lang) : cx('modelSeries', lang, { count: modelLink.seriesCount })}</span>
    : <span>{count === 1 ? cx('oneVersion', lang) : cx('versions', lang, { count })}</span>
  const contents = (
    <>
      <span className="cx-tile__media">
        <CatalogSeriesImageSlot
          source={image}
          itemKind={itemKind}
          baseItemCode={baseItemCode}
          label={name}
          testId={`item-image-${analysisUnitId}-series`}
        />
      </span>
      <span className="cx-tile__body">
        <strong className="cx-tile__name">{name}</strong>
        <span className="cx-tile__meta">
          {rarityEntry ? <span className="cx-tile__rarity">{pick(rarityEntry.name, lang)}</span> : null}
          {meta}
        </span>
      </span>
    </>
  )

  if (passive && modelLink && !modelLink.current) {
    // The unpainted base weapon stands for its model: it switches the equipment
    // choice (and the rail) to that model instead of opening a one-item series.
    return (
      <a
        className="cx-tile cx-tile--model"
        href={modelLink.href}
        aria-label={`${name} · ${cx('modelSeries', lang, { count: modelLink.seriesCount })}`}
        data-testid={`catalog-base-${baseItemCode}`}
        data-series-interactive="model"
        onClick={(event) => {
          if (!isPlainNavigationClick(event)) return
          event.preventDefault()
          modelLink.onOpen()
        }}
      >
        {contents}
      </a>
    )
  }

  if (passive) {
    // Already inside this model (or no model is known): reference context only.
    return (
      <article className="cx-tile cx-tile--reference" aria-label={name} data-rarity={rarity ?? undefined}
        data-testid={`catalog-base-${baseItemCode}`} data-series-interactive="false">
        {contents}
      </article>
    )
  }

  return (
    <a
      className="cx-tile"
      href={href}
      aria-label={name}
      data-rarity={rarity ?? undefined}
      data-testid={`catalog-base-${baseItemCode}`}
      data-series-interactive="true"
      onClick={(event) => {
        if (!isPlainNavigationClick(event)) return
        event.preventDefault()
        onOpen()
      }}
    >
      {contents}
    </a>
  )
}
