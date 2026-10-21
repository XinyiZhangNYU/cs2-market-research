import source from './equipment-models.json'
import type { ItemKind } from '../contract/catalogBrowse'
import type { Localized } from '../i18n'

// These are navigation groups, not new result/catalog wire fields or quality tiers.
export const equipmentCategories = [
  { id: 'PISTOLS', name: { zh: '手枪', en: 'Pistols' }, note: { zh: '随身副武器', en: 'Sidearms' } },
  { id: 'MID_TIER', name: { zh: '中级武器', en: 'Mid-tier' }, note: { zh: 'SMG · 霰弹枪 · 机枪', en: 'SMGs · Shotguns · Heavy' } },
  { id: 'RIFLES', name: { zh: '步枪', en: 'Rifles' }, note: { zh: '步枪 · 狙击步枪', en: 'Rifles · Sniper rifles' } },
  { id: 'KNIVES', name: { zh: '刀具', en: 'Knives' }, note: { zh: '按刀型浏览', en: 'Browse knife types' } },
  { id: 'GLOVES', name: { zh: '手套', en: 'Gloves' }, note: { zh: '按手套类型浏览', en: 'Browse glove types' } },
  { id: 'UNCLASSIFIED', name: { zh: '待分类', en: 'Unclassified' }, note: { zh: '保留未映射系列', en: 'Unmapped series retained' } },
] as const
export type EquipmentCategoryId = (typeof equipmentCategories)[number]['id']

export type EquipmentModel = Readonly<{
  id: string
  itemKind: ItemKind
  category: EquipmentCategoryId
  group: string
  name: Localized
  scope: 'MODEL' | 'CATEGORY'
}>

export const equipmentGroupLabels: Readonly<Record<string, Localized>> = {
  PISTOL: { zh: '手枪', en: 'Pistols' },
  SMG: { zh: '冲锋枪 · SMG', en: 'Submachine guns' },
  SHOTGUN: { zh: '霰弹枪', en: 'Shotguns' },
  MACHINEGUN: { zh: '机枪', en: 'Machine guns' },
  RIFLE: { zh: '步枪', en: 'Rifles' },
  SNIPER: { zh: '狙击步枪', en: 'Sniper rifles' },
  KNIVES: { zh: '刀型', en: 'Knife types' },
  GLOVES: { zh: '手套类型', en: 'Glove types' },
  EQUIPMENT: { zh: '装备', en: 'Equipment' },
  UNCLASSIFIED: { zh: '身份映射待补全', en: 'Model mapping unavailable' },
}
export const equipmentGroupOrder = ['PISTOL', 'SMG', 'SHOTGUN', 'MACHINEGUN', 'RIFLE', 'SNIPER', 'KNIVES', 'GLOVES', 'EQUIPMENT', 'UNCLASSIFIED']

const unresolvedNames: Record<ItemKind, Localized> = {
  WEAPON: { zh: '未分类武器', en: 'Unclassified weapons' },
  KNIFE: { zh: '未分类刀具', en: 'Unclassified knives' },
  GLOVE: { zh: '未分类手套', en: 'Unclassified gloves' },
  AGENT: { zh: '探员', en: 'Agents' },
  OTHER: { zh: '其他物品', en: 'Other items' },
  UNKNOWN: { zh: '种类待确认', en: 'Unresolved kind' },
}
export const equipmentModels: readonly EquipmentModel[] = Object.freeze([
  ...source.models.map((model) => ({ ...model, scope: 'MODEL' as const })) as EquipmentModel[],
  ...Object.entries(unresolvedNames).map(([kind, name]) => ({
    id: `unclassified:${kind}`,
    itemKind: kind as ItemKind,
    category: 'UNCLASSIFIED' as const,
    group: 'UNCLASSIFIED',
    name,
    scope: 'MODEL' as const,
  })),
])
const categoryKinds: Partial<Record<EquipmentCategoryId, ItemKind>> = {
  PISTOLS: 'WEAPON', MID_TIER: 'WEAPON', RIFLES: 'WEAPON', KNIVES: 'KNIFE', GLOVES: 'GLOVE',
}
const categoryChoices: readonly EquipmentModel[] = equipmentCategories.flatMap((category) => {
  const itemKind = categoryKinds[category.id]
  return itemKind ? [{
    id: `all:${category.id}`, itemKind, category: category.id, group: 'ALL',
    name: category.name, scope: 'CATEGORY' as const,
  }] : []
})
const byId = new Map([...equipmentModels, ...categoryChoices].map((model) => [model.id, model]))

export function allEquipmentInCategory(category: EquipmentCategoryId): EquipmentModel | undefined {
  return categoryChoices.find((choice) => choice.category === category)
}
export function equipmentModelById(id: string | null): EquipmentModel | undefined {
  return id === null ? undefined : byId.get(id)
}

export function unclassifiedEquipment(kind: ItemKind): EquipmentModel {
  return byId.get(`unclassified:${kind}`)!
}
