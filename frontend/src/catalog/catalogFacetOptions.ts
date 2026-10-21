import type { Localized } from '../i18n'
import { WearTier, wearTierLabel } from '../contract/catalogBrowse'

// Presentation filters only. These are not additions to the shared result/catalog wire.
export const catalogRarities = [
  { id: 'COVERT', name: { zh: '隐秘', en: 'Covert' } },
  { id: 'CLASSIFIED', name: { zh: '保密', en: 'Classified' } },
  { id: 'RESTRICTED', name: { zh: '受限', en: 'Restricted' } },
  { id: 'MIL_SPEC', name: { zh: '军规级', en: 'Mil-Spec Grade' } },
  { id: 'INDUSTRIAL', name: { zh: '工业级', en: 'Industrial Grade' } },
  { id: 'CONSUMER', name: { zh: '消费级', en: 'Consumer Grade' } },
  { id: 'EXTRAORDINARY', name: { zh: '非凡', en: 'Extraordinary' } },
  { id: 'CONTRABAND', name: { zh: '违禁', en: 'Contraband' } },
] as const satisfies readonly { id: string; name: Localized }[]
export type CatalogRarity = (typeof catalogRarities)[number]['id']

export const catalogItemCategories = [
  { id: 'NORMAL', name: { zh: '普通', en: 'Normal' } },
  { id: 'STATTRAK', name: { zh: 'StatTrak™', en: 'StatTrak™' } },
  { id: 'SOUVENIR', name: { zh: '纪念品', en: 'Souvenir' } },
  { id: 'STAR', name: { zh: '★', en: '★' } },
  { id: 'STAR_STATTRAK', name: { zh: '★ StatTrak™', en: '★ StatTrak™' } },
] as const satisfies readonly { id: string; name: Localized }[]
export type CatalogItemCategory = (typeof catalogItemCategories)[number]['id']

// Top-level catalog filtering exposes only the five actual exterior wear bands.
// Non-wearable and unresolved rows remain reachable under “不限 / Any”.
export const catalogWearTiers = [
  WearTier.FACTORY_NEW,
  WearTier.MINIMAL_WEAR,
  WearTier.FIELD_TESTED,
  WearTier.WELL_WORN,
  WearTier.BATTLE_SCARRED,
].map((id) => ({ id, name: wearTierLabel[id] }))
export type CatalogWearTier = (typeof catalogWearTiers)[number]['id']

export function isCatalogRarity(value: string): value is CatalogRarity {
  return catalogRarities.some((option) => option.id === value)
}
export function isCatalogItemCategory(value: string): value is CatalogItemCategory {
  return catalogItemCategories.some((option) => option.id === value)
}
export function isCatalogWearTier(value: string): value is CatalogWearTier {
  return catalogWearTiers.some((option) => option.id === value)
}
