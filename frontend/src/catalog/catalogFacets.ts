import source from './equipment-rarities.json'
import series from './equipment-series.json'
import { equipmentModelById } from './equipmentModels'
import { isCatalogRarity, type CatalogRarity, type CatalogItemCategory } from './catalogFacetOptions'
import type { CatalogBrowseState, CatalogProjectionRow, ItemKind } from '../contract/catalogBrowse'

const raritiesByKind = new Map<ItemKind, Map<string, CatalogRarity | null>>()
if (source.sourceMappingSha256 !== series.sourceMappingSha256 || source.seriesCount !== series.seriesCount) {
  throw new TypeError('rarity and equipment index identities disagree')
}
for (const [id, codes] of Object.entries(series.byModel)) {
  const model = equipmentModelById(id)
  const grades = (source.byModel as Readonly<Record<string, readonly string[]>>)[id]
  if (!model || !grades || grades.length !== codes.length) throw new TypeError('rarity index coverage drift')
  const map = raritiesByKind.get(model.itemKind) ?? new Map<string, CatalogRarity | null>()
  codes.forEach((code, index) => {
    const grade = grades[index]
    if (map.has(code) || (grade !== 'UNCLASSIFIED' && !isCatalogRarity(grade))) {
      throw new TypeError('invalid or duplicate rarity index entry')
    }
    map.set(code, isCatalogRarity(grade) ? grade : null)
  })
  raritiesByKind.set(model.itemKind, map)
}

export function rarityForSeries(kind: ItemKind, code: string): CatalogRarity | null {
  return raritiesByKind.get(kind)?.get(code) ?? null
}

export function itemCategoryForRow(row: CatalogProjectionRow): CatalogItemCategory | null {
  // Explicit kind + edition only: never examine a name, star character, or public ID shape.
  if (row.item_kind === 'WEAPON') {
    if (row.edition_kind === 'STANDARD') return 'NORMAL'
    if (row.edition_kind === 'STATTRAK') return 'STATTRAK'
    if (row.edition_kind === 'SOUVENIR') return 'SOUVENIR'
  }
  if (row.item_kind === 'KNIFE' || row.item_kind === 'GLOVE') {
    if (row.edition_kind === 'STANDARD') return 'STAR'
    if (row.edition_kind === 'STATTRAK') return 'STAR_STATTRAK'
  }
  return null
}

export function matchesCatalogFacets(
  row: CatalogProjectionRow,
  filters: Pick<CatalogBrowseState, 'rarity' | 'itemCategory' | 'wearTier'>,
): boolean {
  return (filters.rarity === null || rarityForSeries(row.item_kind, row.base_item_code) === filters.rarity) &&
    (filters.itemCategory === null || itemCategoryForRow(row) === filters.itemCategory) &&
    (filters.wearTier === null || row.wear_tier === filters.wearTier)
}

export function selectCatalogFacets(
  state: CatalogBrowseState,
  filters: Pick<CatalogBrowseState, 'rarity' | 'itemCategory' | 'wearTier'>,
): CatalogBrowseState {
  if (
    state.rarity === filters.rarity &&
    state.itemCategory === filters.itemCategory &&
    state.wearTier === filters.wearTier
  ) return state
  return { ...state, ...filters, baseItemCode: null, selectedEditions: [], selectedWears: [] }
}

export function reconcileCatalogFacets(state: CatalogBrowseState, rows: readonly CatalogProjectionRow[]): CatalogBrowseState {
  if (state.baseItemCode !== null && !rows.some((row) =>
    row.item_kind === state.itemKind && row.base_item_code === state.baseItemCode && matchesCatalogFacets(row, state))) {
    return { ...state, baseItemCode: null, selectedEditions: [], selectedWears: [] }
  }
  return state
}
