import { EditionKind } from './identity'
import type { Localized } from '../i18n'
import type { CatalogRarity, CatalogItemCategory, CatalogWearTier } from '../catalog/catalogFacetOptions'

export const ItemKind = {
  WEAPON: 'WEAPON',
  KNIFE: 'KNIFE',
  GLOVE: 'GLOVE',
  AGENT: 'AGENT',
  OTHER: 'OTHER',
  UNKNOWN: 'UNKNOWN',
} as const
export type ItemKind = (typeof ItemKind)[keyof typeof ItemKind]

export const WearTier = {
  FACTORY_NEW: 'FACTORY_NEW',
  MINIMAL_WEAR: 'MINIMAL_WEAR',
  FIELD_TESTED: 'FIELD_TESTED',
  WELL_WORN: 'WELL_WORN',
  BATTLE_SCARRED: 'BATTLE_SCARRED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  UNKNOWN: 'UNKNOWN',
} as const
export type WearTier = (typeof WearTier)[keyof typeof WearTier]

export const CatalogSortOrder = {
  NAME_ASC: 'NAME_ASC',
  EDITION_ASC: 'EDITION_ASC',
  WEAR_ASC: 'WEAR_ASC',
} as const
export type CatalogSortOrder =
  (typeof CatalogSortOrder)[keyof typeof CatalogSortOrder]

export const CATALOG_EDITION_FILTER_ORDER = [
  EditionKind.STANDARD,
  EditionKind.SOUVENIR,
  EditionKind.STATTRAK,
  EditionKind.UNKNOWN,
] as const satisfies readonly EditionKind[]

const CATALOG_EDITION_FILTER_RANK = new Map<EditionKind, number>(
  CATALOG_EDITION_FILTER_ORDER.map((value, index) => [value, index]),
)

export function compareCatalogEditionFilterOrder(
  left: EditionKind,
  right: EditionKind,
): number {
  return (CATALOG_EDITION_FILTER_RANK.get(left) ?? Number.MAX_SAFE_INTEGER) -
    (CATALOG_EDITION_FILTER_RANK.get(right) ?? Number.MAX_SAFE_INTEGER)
}

export type CatalogProjectionRow = {
  item_kind: ItemKind
  base_item_code: string
  analysis_unit_id: string
  edition_kind: EditionKind
  wear_tier: WearTier
}

export const itemKindLabel: Record<ItemKind, Localized> = {
  [ItemKind.WEAPON]: { zh: '武器', en: 'Weapon' },
  [ItemKind.KNIFE]: { zh: '刀具', en: 'Knife' },
  [ItemKind.GLOVE]: { zh: '手套', en: 'Glove' },
  [ItemKind.AGENT]: { zh: '探员', en: 'Agent' },
  [ItemKind.OTHER]: { zh: '其他', en: 'Other' },
  [ItemKind.UNKNOWN]: { zh: '种类尚未解析', en: 'Kind not resolved' },
}

export const wearTierLabel: Record<WearTier, Localized> = {
  [WearTier.FACTORY_NEW]: { zh: '崭新出厂', en: 'Factory New' },
  [WearTier.MINIMAL_WEAR]: { zh: '略有磨损', en: 'Minimal Wear' },
  [WearTier.FIELD_TESTED]: { zh: '久经沙场', en: 'Field-Tested' },
  [WearTier.WELL_WORN]: { zh: '破损不堪', en: 'Well-Worn' },
  [WearTier.BATTLE_SCARRED]: { zh: '战痕累累', en: 'Battle-Scarred' },
  [WearTier.NOT_APPLICABLE]: { zh: '无磨损档', en: 'No wear band' },
  [WearTier.UNKNOWN]: { zh: '磨损尚未解析', en: 'Wear not resolved' },
}

export type CatalogBrowseState = {
  itemKind: ItemKind | null
  equipmentModel: string | null
  rarity: CatalogRarity | null
  itemCategory: CatalogItemCategory | null
  wearTier: CatalogWearTier | null
  baseItemCode: string | null
  selectedEditions: readonly EditionKind[]
  selectedWears: readonly WearTier[]
  seriesQuery: string
}

export function initialCatalogBrowseState(): CatalogBrowseState {
  return {
    itemKind: null,
    equipmentModel: null,
    rarity: null,
    itemCategory: null,
    wearTier: null,
    baseItemCode: null,
    selectedEditions: [],
    selectedWears: [],
    seriesQuery: '',
  }
}

export function normalizeCatalogSearch(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase()
}

function uniqueInOrder<T extends string>(values: readonly T[]): T[] {
  const seen = new Set<T>()
  const out: T[] = []
  for (const value of values) {
    if (seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

export function itemKindsInProjection(rows: readonly CatalogProjectionRow[]): ItemKind[] {
  return uniqueInOrder(rows.map((row) => row.item_kind))
}

export function baseItemCodesInProjection(
  itemKind: ItemKind,
  rows: readonly CatalogProjectionRow[],
): string[] {
  return uniqueInOrder(
    rows.filter((row) => row.item_kind === itemKind).map((row) => row.base_item_code),
  )
}

function rowsForKindAndBase(
  itemKind: ItemKind,
  baseItemCode: string,
  rows: readonly CatalogProjectionRow[],
): CatalogProjectionRow[] {
  return rows.filter(
    (row) => row.item_kind === itemKind && row.base_item_code === baseItemCode,
  )
}

export function editionOptionsFor(
  itemKind: ItemKind,
  baseItemCode: string,
  rows: readonly CatalogProjectionRow[],
): EditionKind[] {
  return uniqueInOrder(
    rowsForKindAndBase(itemKind, baseItemCode, rows).map((row) => row.edition_kind),
  ).sort(compareCatalogEditionFilterOrder)
}

export function wearOptionsFor(
  itemKind: ItemKind,
  baseItemCode: string,
  rows: readonly CatalogProjectionRow[],
): WearTier[] {
  return uniqueInOrder(
    rowsForKindAndBase(itemKind, baseItemCode, rows).map((row) => row.wear_tier),
  )
}

export function matchingCatalogRows(
  state: CatalogBrowseState,
  rows: readonly CatalogProjectionRow[],
): CatalogProjectionRow[] {
  if (state.itemKind === null || state.baseItemCode === null) return []
  const editions = new Set(state.selectedEditions)
  const wears = new Set(state.selectedWears)
  return rowsForKindAndBase(state.itemKind, state.baseItemCode, rows).filter(
    (row) => editions.has(row.edition_kind) && wears.has(row.wear_tier),
  )
}

export function selectItemKind(
  itemKind: ItemKind,
  preserved: Pick<CatalogBrowseState, 'seriesQuery'> & Partial<Pick<CatalogBrowseState, 'rarity' | 'itemCategory' | 'wearTier'>> = {
    seriesQuery: '',
  },
): CatalogBrowseState {
  return {
    itemKind,
    equipmentModel: null,
    rarity: preserved.rarity ?? null,
    itemCategory: preserved.itemCategory ?? null,
    wearTier: preserved.wearTier ?? null,
    baseItemCode: null,
    selectedEditions: [],
    selectedWears: [],
    seriesQuery: preserved.seriesQuery,
  }
}

export function selectBaseItemCode(
  itemKind: ItemKind,
  baseItemCode: string,
  rows: readonly CatalogProjectionRow[],
  preserved: Pick<CatalogBrowseState, 'seriesQuery'> & Partial<Pick<CatalogBrowseState, 'equipmentModel' | 'rarity' | 'itemCategory' | 'wearTier'>> = {
    seriesQuery: '',
  },
): CatalogBrowseState {
  return {
    itemKind,
    equipmentModel: preserved.equipmentModel ?? null,
    rarity: preserved.rarity ?? null,
    itemCategory: preserved.itemCategory ?? null,
    wearTier: preserved.wearTier ?? null,
    baseItemCode,
    selectedEditions: editionOptionsFor(itemKind, baseItemCode, rows),
    selectedWears: wearOptionsFor(itemKind, baseItemCode, rows),
    seriesQuery: preserved.seriesQuery,
  }
}

function toggleInVisibleOrder<T extends string>(
  selected: readonly T[],
  visible: readonly T[],
  value: T,
): T[] {
  const next = new Set(selected)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return visible.filter((item) => next.has(item))
}

export function toggleSelectedEdition(
  state: CatalogBrowseState,
  edition: EditionKind,
  rows: readonly CatalogProjectionRow[],
): CatalogBrowseState {
  if (state.itemKind === null || state.baseItemCode === null) return state
  return {
    ...state,
    selectedEditions: toggleInVisibleOrder(
      state.selectedEditions,
      editionOptionsFor(state.itemKind, state.baseItemCode, rows),
      edition,
    ),
  }
}

export function toggleSelectedWear(
  state: CatalogBrowseState,
  wear: WearTier,
  rows: readonly CatalogProjectionRow[],
): CatalogBrowseState {
  if (state.itemKind === null || state.baseItemCode === null) return state
  return {
    ...state,
    selectedWears: toggleInVisibleOrder(
      state.selectedWears,
      wearOptionsFor(state.itemKind, state.baseItemCode, rows),
      wear,
    ),
  }
}

function pruneToVisible<T extends string>(
  selected: readonly T[],
  visible: readonly T[],
): T[] {
  return selected.filter((value) => visible.includes(value))
}

export function reconcileCatalogBrowseState(
  state: CatalogBrowseState,
  rows: readonly CatalogProjectionRow[],
): CatalogBrowseState {
  const emptySelection = {
    ...initialCatalogBrowseState(),
    rarity: state.rarity,
    itemCategory: state.itemCategory,
    wearTier: state.wearTier,
  }
  if (state.itemKind === null) return emptySelection
  const kinds = itemKindsInProjection(rows)
  if (!kinds.includes(state.itemKind)) return emptySelection
  if (state.baseItemCode === null) {
    return {
      itemKind: state.itemKind,
      equipmentModel: state.equipmentModel,
      rarity: state.rarity,
      itemCategory: state.itemCategory,
      wearTier: state.wearTier,
      baseItemCode: null,
      selectedEditions: [],
      selectedWears: [],
      seriesQuery: state.seriesQuery,
    }
  }
  const bases = baseItemCodesInProjection(state.itemKind, rows)
  if (!bases.includes(state.baseItemCode)) {
    return {
      itemKind: state.itemKind,
      equipmentModel: state.equipmentModel,
      rarity: state.rarity,
      itemCategory: state.itemCategory,
      wearTier: state.wearTier,
      baseItemCode: null,
      selectedEditions: [],
      selectedWears: [],
      seriesQuery: state.seriesQuery,
    }
  }
  return {
    itemKind: state.itemKind,
    equipmentModel: state.equipmentModel,
    rarity: state.rarity,
    itemCategory: state.itemCategory,
    wearTier: state.wearTier,
    baseItemCode: state.baseItemCode,
    selectedEditions: pruneToVisible(
      state.selectedEditions,
      editionOptionsFor(state.itemKind, state.baseItemCode, rows),
    ),
    selectedWears: pruneToVisible(
      state.selectedWears,
      wearOptionsFor(state.itemKind, state.baseItemCode, rows),
    ),
    seriesQuery: state.seriesQuery,
  }
}
