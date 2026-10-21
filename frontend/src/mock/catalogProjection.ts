// Task-scoped MOCK data for the item-module browse view. Navigation and filter
// mechanics live in contract/catalogBrowse so the formal catalog adapter does
// not depend on this fixture module.

import { EditionKind } from '../contract/identity'
import {
  baseItemCodesInProjection as baseCodes,
  editionOptionsFor as editionOptions,
  initialCatalogBrowseState,
  itemKindLabel,
  itemKindsInProjection as itemKinds,
  matchingCatalogRows as matchingRows,
  reconcileCatalogBrowseState as reconcileState,
  selectBaseItemCode as selectBase,
  selectItemKind,
  toggleSelectedEdition as toggleEdition,
  toggleSelectedWear as toggleWear,
  wearOptionsFor as wearOptions,
  wearTierLabel,
  ItemKind,
  WearTier,
  type CatalogBrowseState,
  type CatalogProjectionRow,
} from '../contract/catalogBrowse'

export {
  initialCatalogBrowseState,
  itemKindLabel,
  selectItemKind,
  wearTierLabel,
  ItemKind,
  WearTier,
}
export type { CatalogBrowseState, CatalogProjectionRow }

export const CATALOG_PROJECTION_ROWS: readonly CatalogProjectionRow[] = [
  {
    item_kind: ItemKind.WEAPON,
    base_item_code: 'base.weapon.alpha',
    analysis_unit_id: 'ITEM-0001',
    edition_kind: EditionKind.STANDARD,
    wear_tier: WearTier.FIELD_TESTED,
  },
  {
    item_kind: ItemKind.WEAPON,
    base_item_code: 'base.weapon.alpha',
    analysis_unit_id: 'ITEM-0005',
    edition_kind: EditionKind.STATTRAK,
    wear_tier: WearTier.FACTORY_NEW,
  },
  {
    item_kind: ItemKind.WEAPON,
    base_item_code: 'base.weapon.beta',
    analysis_unit_id: 'ITEM-0002',
    edition_kind: EditionKind.STANDARD,
    wear_tier: WearTier.MINIMAL_WEAR,
  },
  {
    item_kind: ItemKind.KNIFE,
    base_item_code: 'base.knife.gamma',
    analysis_unit_id: 'ITEM-0003',
    edition_kind: EditionKind.STANDARD,
    wear_tier: WearTier.FACTORY_NEW,
  },
  {
    item_kind: ItemKind.KNIFE,
    base_item_code: 'base.knife.gamma',
    analysis_unit_id: 'ITEM-0006',
    edition_kind: EditionKind.SOUVENIR,
    wear_tier: WearTier.MINIMAL_WEAR,
  },
  {
    item_kind: ItemKind.GLOVE,
    base_item_code: 'base.glove.delta',
    analysis_unit_id: 'ITEM-0004',
    edition_kind: EditionKind.STANDARD,
    wear_tier: WearTier.FIELD_TESTED,
  },
  {
    item_kind: ItemKind.KNIFE,
    base_item_code: 'base.knife.epsilon',
    analysis_unit_id: 'ITEM-0007',
    edition_kind: EditionKind.STANDARD,
    wear_tier: WearTier.FACTORY_NEW,
  },
  {
    item_kind: ItemKind.KNIFE,
    base_item_code: 'base.knife.epsilon',
    analysis_unit_id: 'ITEM-0008',
    edition_kind: EditionKind.STANDARD,
    wear_tier: WearTier.FACTORY_NEW,
  },
  {
    item_kind: ItemKind.KNIFE,
    base_item_code: 'base.knife.epsilon',
    analysis_unit_id: 'ITEM-0009',
    edition_kind: EditionKind.UNKNOWN,
    wear_tier: WearTier.FACTORY_NEW,
  },
]

export function itemKindsInProjection(
  rows: readonly CatalogProjectionRow[] = CATALOG_PROJECTION_ROWS,
) {
  return itemKinds(rows)
}

export function baseItemCodesInProjection(
  itemKind: ItemKind,
  rows: readonly CatalogProjectionRow[] = CATALOG_PROJECTION_ROWS,
) {
  return baseCodes(itemKind, rows)
}

export function editionOptionsFor(
  itemKind: ItemKind,
  baseItemCode: string,
  rows: readonly CatalogProjectionRow[] = CATALOG_PROJECTION_ROWS,
) {
  return editionOptions(itemKind, baseItemCode, rows)
}

export function wearOptionsFor(
  itemKind: ItemKind,
  baseItemCode: string,
  rows: readonly CatalogProjectionRow[] = CATALOG_PROJECTION_ROWS,
) {
  return wearOptions(itemKind, baseItemCode, rows)
}

export function matchingCatalogRows(
  state: CatalogBrowseState,
  rows: readonly CatalogProjectionRow[] = CATALOG_PROJECTION_ROWS,
) {
  return matchingRows(state, rows)
}

export function selectBaseItemCode(
  itemKind: ItemKind,
  baseItemCode: string,
  rows: readonly CatalogProjectionRow[] = CATALOG_PROJECTION_ROWS,
) {
  return selectBase(itemKind, baseItemCode, rows)
}

export function toggleSelectedEdition(
  state: CatalogBrowseState,
  edition: EditionKind,
  rows: readonly CatalogProjectionRow[] = CATALOG_PROJECTION_ROWS,
) {
  return toggleEdition(state, edition, rows)
}

export function toggleSelectedWear(
  state: CatalogBrowseState,
  wear: WearTier,
  rows: readonly CatalogProjectionRow[] = CATALOG_PROJECTION_ROWS,
) {
  return toggleWear(state, wear, rows)
}

export function reconcileCatalogBrowseState(
  state: CatalogBrowseState,
  rows: readonly CatalogProjectionRow[] = CATALOG_PROJECTION_ROWS,
) {
  return reconcileState(state, rows)
}
