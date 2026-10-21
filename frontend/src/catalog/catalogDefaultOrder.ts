import type { CatalogRarity } from './catalogFacetOptions'
import { normalizeCatalogQueryText } from './catalogQueryText'
import { EditionKind } from '../contract/identity'
import { WearTier, type CatalogProjectionRow } from '../contract/catalogBrowse'
import { compareCodePoints } from '../wire/canonical'

const UNPAINTED_SERIES = /^defindex:[0-9]+\|paint:none$/u

const RARITY_ORDER = new Map<CatalogRarity, number>([
  ['CONTRABAND', 0],
  ['EXTRAORDINARY', 1],
  ['COVERT', 2],
  ['CLASSIFIED', 3],
  ['RESTRICTED', 4],
  ['MIL_SPEC', 5],
  ['INDUSTRIAL', 6],
  ['CONSUMER', 7],
])

const EDITION_ORDER = new Map(Object.values(EditionKind).map((value, index) => [value, index]))
const WEAR_ORDER = new Map(Object.values(WearTier).map((value, index) => [value, index]))

export type CatalogSeriesOrderValue = Readonly<{
  baseItemCode: string
  name: string
  rarity: CatalogRarity | null
}>

export type CatalogUnitOrderValue = Readonly<{
  row: CatalogProjectionRow
  name: string
}>

export function isUnpaintedCatalogSeries(baseItemCode: string): boolean {
  return UNPAINTED_SERIES.test(baseItemCode)
}

/** Product order: unpainted reference first, then rarity high-to-low, then localized name. */
export function compareCatalogSeriesDefault(
  left: CatalogSeriesOrderValue,
  right: CatalogSeriesOrderValue,
): number {
  const unpainted = Number(isUnpaintedCatalogSeries(right.baseItemCode)) -
    Number(isUnpaintedCatalogSeries(left.baseItemCode))
  if (unpainted !== 0) return unpainted

  const rarity = (left.rarity === null ? Number.MAX_SAFE_INTEGER : RARITY_ORDER.get(left.rarity) ?? Number.MAX_SAFE_INTEGER) -
    (right.rarity === null ? Number.MAX_SAFE_INTEGER : RARITY_ORDER.get(right.rarity) ?? Number.MAX_SAFE_INTEGER)
  if (rarity !== 0) return rarity

  const name = compareCodePoints(
    normalizeCatalogQueryText(left.name),
    normalizeCatalogQueryText(right.name),
  )
  if (name !== 0) return name
  return compareCodePoints(left.baseItemCode, right.baseItemCode)
}

/** Product order: Standard, StatTrak, Souvenir; within each edition, wear best-to-worst. */
export function compareCatalogUnitsDefault(
  left: CatalogUnitOrderValue,
  right: CatalogUnitOrderValue,
): number {
  const edition = (EDITION_ORDER.get(left.row.edition_kind) ?? Number.MAX_SAFE_INTEGER) -
    (EDITION_ORDER.get(right.row.edition_kind) ?? Number.MAX_SAFE_INTEGER)
  if (edition !== 0) return edition

  const wear = (WEAR_ORDER.get(left.row.wear_tier) ?? Number.MAX_SAFE_INTEGER) -
    (WEAR_ORDER.get(right.row.wear_tier) ?? Number.MAX_SAFE_INTEGER)
  if (wear !== 0) return wear

  const name = compareCodePoints(
    normalizeCatalogQueryText(left.name),
    normalizeCatalogQueryText(right.name),
  )
  if (name !== 0) return name
  return compareCodePoints(left.row.analysis_unit_id, right.row.analysis_unit_id)
}
