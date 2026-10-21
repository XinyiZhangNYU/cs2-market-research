import { describe, expect, it } from 'vitest'
import { parseCatalogSearchIntent } from '../src/catalog/catalogSearchIntent'
import type { EquipmentModel } from '../src/catalog/equipmentModels'

const model = (id: string, zh: string, en: string, overrides: Partial<EquipmentModel> = {}): EquipmentModel => ({
  id,
  itemKind: 'WEAPON',
  category: 'RIFLES',
  group: 'RIFLE',
  name: { zh, en },
  scope: 'MODEL',
  ...overrides,
} as EquipmentModel)

const AWP = model('fixture:awp', 'AWP', 'AWP')
const M4A1S = model('fixture:m4a1s', 'M4A1 消音型', 'M4A1-S')
const BAYONET = model('fixture:bayonet', '刺刀', 'Bayonet', { itemKind: 'KNIFE', category: 'KNIVES', group: 'KNIFE' })
const M9 = model('fixture:m9', 'M9 刺刀', 'M9 Bayonet', { itemKind: 'KNIFE', category: 'KNIVES', group: 'KNIFE' })
const CATEGORY = model('fixture:rifles', '步枪', 'Rifles', { scope: 'CATEGORY' })
const UNCLASSIFIED = model('fixture:other', '其他', 'Other', { category: 'UNCLASSIFIED' })
const MODELS = [AWP, M4A1S, BAYONET, M9, CATEGORY, UNCLASSIFIED]

describe('catalog search intent', () => {
  it('returns nothing for blank input', () => {
    expect(parseCatalogSearchIntent('   ', MODELS)).toEqual({ model: null, remainder: null })
  })

  it('reads a leading model name and leaves the rest for the series search', () => {
    expect(parseCatalogSearchIntent('AWP 二西莫夫', MODELS)).toEqual({ model: AWP, remainder: '二西莫夫' })
    expect(parseCatalogSearchIntent('awp', MODELS)).toEqual({ model: AWP, remainder: null })
    expect(parseCatalogSearchIntent('AWP | Asiimov', MODELS)).toEqual({ model: AWP, remainder: 'Asiimov' })
  })

  it('ignores punctuation and spacing differences inside a model name', () => {
    expect(parseCatalogSearchIntent('m4a1s 印花集', MODELS)).toEqual({ model: M4A1S, remainder: '印花集' })
    expect(parseCatalogSearchIntent('M4A1-S Printstream', MODELS)).toEqual({ model: M4A1S, remainder: 'Printstream' })
  })

  it('prefers the longest model name', () => {
    expect(parseCatalogSearchIntent('M9 刺刀 多普勒', MODELS)).toEqual({ model: M9, remainder: '多普勒' })
    expect(parseCatalogSearchIntent('刺刀 多普勒', MODELS)).toEqual({ model: BAYONET, remainder: '多普勒' })
  })

  it('requires a word boundary after a Latin name', () => {
    expect(parseCatalogSearchIntent('AWPX', MODELS)).toEqual({ model: null, remainder: 'AWPX' })
  })

  it('never treats categories or unclassified buckets as a model and keeps free text intact', () => {
    expect(parseCatalogSearchIntent('步枪 红线', MODELS)).toEqual({ model: null, remainder: '步枪 红线' })
    expect(parseCatalogSearchIntent('其他 物品', MODELS)).toEqual({ model: null, remainder: '其他 物品' })
    expect(parseCatalogSearchIntent('Official String Shape', MODELS)).toEqual({ model: null, remainder: 'Official String Shape' })
  })
})
