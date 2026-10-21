import { describe, expect, it } from 'vitest'
import { catalogSeriesLabel, isUnpaintedWeaponSeries } from '../src/catalog/catalogSeriesPresentation'
import { WearTier, wearTierLabel, type CatalogProjectionRow } from '../src/contract/catalogBrowse'

const baseRow: CatalogProjectionRow = {
  item_kind: 'WEAPON',
  base_item_code: 'fixture:p90:asiimov',
  analysis_unit_id: 'fixture:01',
  edition_kind: 'STATTRAK',
  wear_tier: 'BATTLE_SCARRED',
}

describe('series-only labels never replace source item identities', () => {
  it.each([
    ['WEAPON', 'STATTRAK', 'StatTrak™ P90 | Asiimov (Battle-Scarred)', 'P90（StatTrak™） | 二西莫夫 (战痕累累)', 'P90 | Asiimov', 'P90 | 二西莫夫'],
    ['WEAPON', 'SOUVENIR', 'Souvenir P90 | Asiimov (Battle-Scarred)', 'P90（纪念品） | 二西莫夫（战痕累累）', 'P90 | Asiimov', 'P90 | 二西莫夫'],
    ['KNIFE', 'STATTRAK', '★ StatTrak™ Flip Knife | Boreal Forest (Battle-Scarred)', '折叠刀（★ StatTrak™） | 北方森林 (战痕累累)', 'Flip Knife | Boreal Forest', '折叠刀 | 北方森林'],
    ['KNIFE', 'STANDARD', '★ Flip Knife | Boreal Forest (Battle-Scarred)', '折叠刀（★） | 北方森林（战痕累累）', 'Flip Knife | Boreal Forest', '折叠刀 | 北方森林'],
    ['GLOVE', 'STANDARD', '★ Sport Gloves | Vice (Battle-Scarred)', '运动手套（★） | 迈阿密风云 (战痕累累)', 'Sport Gloves | Vice', '运动手套 | 迈阿密风云'],
  ] as const)('formats %s/%s as a stable series label', (kind, edition, en, zh, expectedEn, expectedZh) => {
    expect(catalogSeriesLabel({ ...baseRow, item_kind: kind, edition_kind: edition }, { en, zh })).toEqual({ en: expectedEn, zh: expectedZh })
  })

  it.each(Object.values(WearTier).filter((wear) => wear !== 'UNKNOWN' && wear !== 'NOT_APPLICABLE'))(
    'strips only the structured terminal wear %s',
    (wear) => {
      const names = {
        en: `StatTrak™ P90 | Café (Phase 2) (${wearTierLabel[wear].en})`,
        zh: `P90（StatTrak™） | 咖啡☕（阶段二）（${wearTierLabel[wear].zh}）`,
      }
      const before = structuredClone(names)
      expect(catalogSeriesLabel({ ...baseRow, wear_tier: wear }, names)).toEqual({
        en: 'P90 | Café (Phase 2)',
        zh: 'P90 | 咖啡☕（阶段二）',
      })
      expect(names).toEqual(before)
    },
  )

  it.each(['STANDARD', 'STATTRAK'] as const)('keeps a vanilla knife without inventing a finish (%s)', (edition) => {
    expect(catalogSeriesLabel({ ...baseRow, item_kind: 'KNIFE', edition_kind: edition, wear_tier: 'NOT_APPLICABLE' }, {
      en: `★ ${edition === 'STATTRAK' ? 'StatTrak™ ' : ''}Flip Knife`,
      zh: `折叠刀（${edition === 'STATTRAK' ? '★ StatTrak™' : '★'}）`,
    })).toEqual({ en: 'Flip Knife', zh: '折叠刀' })
  })

  it('does not delete finish text, unrelated parentheses, mismatched wear, or name tokens', () => {
    const names = {
      en: 'StatTrak™ P90 | Souvenir ★ (Factory New)',
      zh: 'P90（StatTrak™） | 纪念品 ★（崭新出厂）',
    }
    expect(catalogSeriesLabel(baseRow, names)).toEqual({
      en: 'P90 | Souvenir ★ (Factory New)',
      zh: 'P90 | 纪念品 ★（崭新出厂）',
    })
    expect(catalogSeriesLabel({ ...baseRow, edition_kind: 'UNKNOWN', wear_tier: 'UNKNOWN' }, names)).toEqual(names)
  })
})

describe('unpainted weapon reference identity', () => {
  it.each([
    ['WEAPON', 'defindex:63|paint:none', true],
    ['KNIFE', 'defindex:505|paint:none', false],
    ['GLOVE', 'defindex:5027|paint:none', false],
    ['WEAPON', 'defindex:63|paint:12', false],
    ['WEAPON', 'weapon_cz75a|paint:none', false],
  ] as const)('%s / %s => %s', (itemKind, baseItemCode, expected) => {
    expect(isUnpaintedWeaponSeries({ item_kind: itemKind, base_item_code: baseItemCode })).toBe(expected)
  })
})
