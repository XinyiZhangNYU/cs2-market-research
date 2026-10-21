import type { CatalogRarity } from '../catalog/catalogFacetOptions'
import { isUnpaintedWeaponSeries } from '../catalog/catalogSeriesPresentation'
import type { ItemKind } from '../contract/catalogBrowse'
import type { ItemImageSource } from '../contract/itemImage'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { CatalogRarityBadge } from './CatalogFacetFilters'
import { CatalogSeriesImageSlot } from './CatalogSeriesImageSlot'

export function CatalogSeriesCard({
  itemKind,
  baseItemCode,
  analysisUnitId,
  name,
  image,
  rarity,
  count,
  selected,
  onSelect,
}: {
  itemKind: ItemKind
  baseItemCode: string
  analysisUnitId: string
  name: string
  image: ItemImageSource
  rarity: CatalogRarity | null
  count: number
  selected: boolean
  onSelect: () => void
}) {
  const lang = useLang()
  const passive = isUnpaintedWeaponSeries({ item_kind: itemKind, base_item_code: baseItemCode })
  const contents = (
    <>
      <CatalogSeriesImageSlot
        source={image}
        itemKind={itemKind}
        baseItemCode={baseItemCode}
        label={name}
        testId={`item-image-${analysisUnitId}-series`}
      />
      <span>
        <strong>{name}</strong>
        <CatalogRarityBadge rarity={rarity} />
        <small>{count} {t('publicSeriesMembers', lang)}</small>
      </span>
    </>
  )

  if (passive) {
    return (
      <article
        className="formal-catalog__series-card formal-catalog__series-card--reference"
        aria-label={name}
        data-testid={`catalog-base-${baseItemCode}`}
        data-series-interactive="false"
      >
        {contents}
      </article>
    )
  }

  return (
    <button
      type="button"
      className={`formal-catalog__series-card formal-catalog__series-card--interactive${selected ? ' is-active' : ''}`}
      aria-label={name}
      data-testid={`catalog-base-${baseItemCode}`}
      data-series-interactive="true"
      onClick={onSelect}
    >
      {contents}
    </button>
  )
}
