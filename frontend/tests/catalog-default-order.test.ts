import { describe, expect, it } from 'vitest'
import {
  compareCatalogSeriesDefault,
  compareCatalogUnitsDefault,
  type CatalogSeriesOrderValue,
  type CatalogUnitOrderValue,
} from '../src/catalog/catalogDefaultOrder'
import { WearTier, type CatalogProjectionRow } from '../src/contract/catalogBrowse'
import { EditionKind } from '../src/contract/identity'

function series(
  baseItemCode: string,
  name: string,
  rarity: CatalogSeriesOrderValue['rarity'],
): CatalogSeriesOrderValue {
  return { baseItemCode, name, rarity }
}

function unit(
  analysisUnitId: string,
  editionKind: CatalogProjectionRow['edition_kind'],
  wearTier: CatalogProjectionRow['wear_tier'],
  name = analysisUnitId,
): CatalogUnitOrderValue {
  return {
    row: {
      analysis_unit_id: analysisUnitId,
      base_item_code: 'fixture.series',
      item_kind: 'WEAPON',
      edition_kind: editionKind,
      wear_tier: wearTier,
    },
    name,
  }
}

describe('fixed catalog product order', () => {
  it('puts the exact unpainted series first, then rarity high-to-low, then localized name', () => {
    const values = [
      series('defindex:63|paint:consumer', 'Zulu', 'CONSUMER'),
      series('defindex:63|paint:classified-b', 'Bravo', 'CLASSIFIED'),
      series('defindex:63|paint:covert', 'Alpha', 'COVERT'),
      series('defindex:63|paint:none-but-not-exact', 'Fake original', 'CONTRABAND'),
      series('defindex:63|paint:classified-a', 'Alpha', 'CLASSIFIED'),
      series('defindex:63|paint:none', 'Original', null),
      series('defindex:63|paint:extraordinary', 'Extraordinary', 'EXTRAORDINARY'),
      series('defindex:63|paint:contraband', 'Contraband', 'CONTRABAND'),
      series('defindex:63|paint:unknown', 'Unknown', null),
    ]

    expect(values.sort(compareCatalogSeriesDefault).map((value) => value.baseItemCode)).toEqual([
      'defindex:63|paint:none',
      'defindex:63|paint:contraband',
      'defindex:63|paint:none-but-not-exact',
      'defindex:63|paint:extraordinary',
      'defindex:63|paint:covert',
      'defindex:63|paint:classified-a',
      'defindex:63|paint:classified-b',
      'defindex:63|paint:consumer',
      'defindex:63|paint:unknown',
    ])
  })

  it('orders editions Standard, StatTrak, Souvenir and each edition by wear best-to-worst', () => {
    const values = [
      unit('souvenir-fn', EditionKind.SOUVENIR, WearTier.FACTORY_NEW),
      unit('standard-bs', EditionKind.STANDARD, WearTier.BATTLE_SCARRED),
      unit('stattrak-mw', EditionKind.STATTRAK, WearTier.MINIMAL_WEAR),
      unit('standard-fn-z', EditionKind.STANDARD, WearTier.FACTORY_NEW, 'Zulu'),
      unit('stattrak-fn', EditionKind.STATTRAK, WearTier.FACTORY_NEW),
      unit('standard-ww', EditionKind.STANDARD, WearTier.WELL_WORN),
      unit('standard-ft', EditionKind.STANDARD, WearTier.FIELD_TESTED),
      unit('standard-mw', EditionKind.STANDARD, WearTier.MINIMAL_WEAR),
      unit('standard-fn-a', EditionKind.STANDARD, WearTier.FACTORY_NEW, 'Alpha'),
    ]

    expect(values.sort(compareCatalogUnitsDefault).map((value) => value.row.analysis_unit_id)).toEqual([
      'standard-fn-a',
      'standard-fn-z',
      'standard-mw',
      'standard-ft',
      'standard-ww',
      'standard-bs',
      'stattrak-fn',
      'stattrak-mw',
      'souvenir-fn',
    ])
  })
})
