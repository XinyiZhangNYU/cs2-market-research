import type { CatalogDisplayItemView } from '../adapter/catalogDisplayViewModel'
import { WearTier, wearTierLabel, type CatalogProjectionRow } from '../contract/catalogBrowse'
import type { Localized } from '../i18n'
import { compareCodePoints } from '../wire/canonical'
import { compareCatalogSeriesDefault } from './catalogDefaultOrder'
import type { WireCatalogSeriesMember } from '../wire/catalogDisplayQueryApiTypes'

const EDITION_ORDER = { STANDARD: 0, STATTRAK: 1, SOUVENIR: 2, UNKNOWN: 3 } as const
const UNPAINTED_WEAPON_SERIES = /^defindex:[0-9]+\|paint:none$/u

/** Unpainted guns are reference entries, not selectable research series. */
export function isUnpaintedWeaponSeries(
  row: Pick<CatalogProjectionRow, 'item_kind' | 'base_item_code'>,
): boolean {
  return row.item_kind === 'WEAPON' && UNPAINTED_WEAPON_SERIES.test(row.base_item_code)
}

function withoutBracketedSuffix(text: string, markers: readonly string[]): string {
  for (const marker of markers) {
    for (const suffix of [`(${marker})`, `（${marker}）`]) {
      if (text.endsWith(suffix)) return text.slice(0, -suffix.length).trimEnd()
    }
  }
  return text
}

/** Presentation only: never changes source names, identities, or grouping keys. */
export function catalogSeriesLabel(row: Pick<CatalogProjectionRow, 'wear_tier' | 'item_kind' | 'edition_kind'>, name: Localized): Localized {
  const format = (original: string): string => {
    let text = original.trim()
    if (row.wear_tier !== WearTier.UNKNOWN && row.wear_tier !== WearTier.NOT_APPLICABLE) {
      text = withoutBracketedSuffix(text, Object.values(wearTierLabel[row.wear_tier]))
    }
    const separator = text.indexOf('|')
    let model = (separator < 0 ? text : text.slice(0, separator)).trim()
    const finish = separator < 0 ? '' : text.slice(separator + 1).trim()
    const starred = row.item_kind === 'KNIFE' || row.item_kind === 'GLOVE'
    if (starred) model = model.replace(/^★\s*/u, '')
    const editions = row.edition_kind === 'STATTRAK' ? ['StatTrak™']
      : row.edition_kind === 'SOUVENIR' ? ['Souvenir', '纪念品'] : []
    for (const edition of editions) {
      if (model.startsWith(`${edition} `)) model = model.slice(edition.length).trimStart()
    }
    model = withoutBracketedSuffix(model, starred
      ? [...editions.flatMap((edition) => [edition, `★ ${edition}`, `${edition} ★`]), '★']
      : editions)
    if (starred) model = model.replace(/^★\s*/u, '')
    const result = separator < 0 ? model : `${model} | ${finish}`
    return model && (separator < 0 || finish) ? result : original
  }
  return { zh: format(name.zh), en: format(name.en) }
}

export function catalogSeriesKey(row: Pick<CatalogProjectionRow, 'item_kind' | 'base_item_code'>): string {
  return JSON.stringify([row.item_kind, row.base_item_code])
}

/** Shared wire-page and continuation check for the server's product ordering. */
export function compareCatalogSeriesProduct(left: WireCatalogSeriesMember, right: WireCatalogSeriesMember, locale: 'en' | 'zh_cn'): number {
  const value = (member: WireCatalogSeriesMember) => {
    const row = member.representative.projection
    const names = catalogSeriesLabel(row, { zh: row.localized_name.zh_cn, en: row.localized_name.en })
    return { baseItemCode: member.base_item_code, rarity: member.rarity, name: names[locale === 'en' ? 'en' : 'zh'] }
  }
  return compareCatalogSeriesDefault(value(left), value(right)) || compareCodePoints(left.item_kind, right.item_kind)
}

/** Stable across facets, media availability, locale, and source-row order. */
export function catalogSeriesLabels(
  rows: readonly CatalogProjectionRow[],
  items: ReadonlyMap<string, CatalogDisplayItemView>,
): ReadonlyMap<string, Localized> {
  const chosen = new Map<string, CatalogProjectionRow>()
  for (const row of rows) {
    const key = catalogSeriesKey(row)
    const previous = chosen.get(key)
    const order = previous ? EDITION_ORDER[row.edition_kind] - EDITION_ORDER[previous.edition_kind] : -1
    if (!previous || order < 0 || (order === 0 && compareCodePoints(row.analysis_unit_id, previous.analysis_unit_id) < 0)) {
      chosen.set(key, row)
    }
  }
  return new Map([...chosen].map(([key, row]) => {
    const item = items.get(row.analysis_unit_id)
    if (!item) throw new TypeError('catalog series title lacks display data')
    return [key, catalogSeriesLabel(row, item.display_name)]
  }))
}
