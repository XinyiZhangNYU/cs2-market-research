import {
  allEquipmentInCategory,
  equipmentCategories,
  equipmentModelById,
  equipmentModels,
  type EquipmentCategoryId,
  type EquipmentModel,
} from '../catalog/equipmentModels'
import { ItemKind, itemKindLabel, type CatalogProjectionRow } from '../contract/catalogBrowse'
import type { EditionKind } from '../contract/identity'
import type { Localized } from '../i18n'
import type { MarketDescriptiveScope } from '../wire/marketDescriptivePublicApiTypes'
import { marketScopeToken } from './marketScopeToken'
import {
  personalWatchTargetKey,
  type PersonalWatchTarget,
  type PersonalWatchTargetCandidate,
} from './personalWatchlist'

/**
 * The trusted front-end registry of watchable catalog objects.
 *
 * Catalog categories, catalog groups/models and future economic sectors use different target
 * kinds. A future case sector therefore uses `ECONOMIC_SECTOR:ECONOMY:SECTOR:CASE`, while the
 * equipment category stays `CATALOG_CATEGORY:CATALOG:WEAPON`; neither can collide or be
 * mistaken for the overall MARKET, which is intentionally not followable.
 *
 * Destinations are derived at runtime and never stored, so a saved record can never carry an
 * arbitrary href or external media reference.
 */

const CATALOG_NAMESPACE = 'CATALOG'
const MODEL_SEGMENT = 'MODEL'
const CATEGORY_SEGMENT = 'CATEGORY'
const ECONOMY_NAMESPACE = 'ECONOMY'
const ECONOMIC_SECTOR_SEGMENT = 'SECTOR'
const ECONOMIC_SUBSECTOR_SEGMENT = 'SEGMENT'
const MARKET_SCOPE_ID = /^[A-Z][A-Z0-9_]*$/u
const MARKET_SUBSCOPE_ID = /^([A-Z][A-Z0-9_]*):([A-Za-z0-9_-]+)$/u

/** Only these three catalog kinds have a real published category destination today. */
export const catalogCategoryKinds = Object.freeze([
  ItemKind.WEAPON,
  ItemKind.KNIFE,
  ItemKind.GLOVE,
] as const)

export type CatalogCategoryKind = (typeof catalogCategoryKinds)[number]

const CATALOG_CATEGORY_KINDS = new Set<string>(catalogCategoryKinds)

export function isCatalogCategoryKind(value: string): value is CatalogCategoryKind {
  return CATALOG_CATEGORY_KINDS.has(value)
}

export function catalogCategoryTargetId(kind: CatalogCategoryKind): string {
  return `${CATALOG_NAMESPACE}:${kind}`
}

export function catalogModelSegmentTargetId(modelId: string): string {
  return `${CATALOG_NAMESPACE}:${MODEL_SEGMENT}:${modelId}`
}

export function catalogCategorySegmentTargetId(category: EquipmentCategoryId): string {
  return `${CATALOG_NAMESPACE}:${CATEGORY_SEGMENT}:${category}`
}

/**
 * `UNCLASSIFIED` and every `unclassified:*` placeholder is excluded: they have no authoritative
 * classification and no destination page of their own.
 */
function watchableModel(model: EquipmentModel): boolean {
  return model.scope === 'MODEL' && model.category !== 'UNCLASSIFIED' &&
    !model.id.startsWith('unclassified:') && isCatalogCategoryKind(model.itemKind)
}

export function watchableEquipmentModels(): readonly EquipmentModel[] {
  return Object.freeze(equipmentModels.filter(watchableModel))
}

export function watchableEquipmentCategories(): readonly EquipmentCategoryId[] {
  return Object.freeze(
    equipmentCategories
      .map((category) => category.id)
      .filter((category) => category !== 'UNCLASSIFIED' && allEquipmentInCategory(category) !== undefined),
  )
}

/** Where a saved target opens. Always an existing, strictly typed public route. */
export type WatchTargetDestination =
  | Readonly<{
    surface: 'PRODUCT'
    unitId: string
    itemKind: CatalogProjectionRow['item_kind']
    baseItemCode: string
    editionKind: EditionKind
    wearTier: CatalogProjectionRow['wear_tier']
  }>
  | Readonly<{
    surface: 'CATALOG'
    itemKind: CatalogCategoryKind
    equipmentModel: string | null
  }>
  | Readonly<{
    surface: 'MARKET'
    scopeToken: string
  }>

export type ResolvedWatchTarget = Readonly<{
  destination: WatchTargetDestination
  /** The registry's current bilingual name, which may be fresher than the saved copy. */
  name: Localized
}>

function resolveCatalogCategory(targetId: string): ResolvedWatchTarget | null {
  const [namespace, kind, ...rest] = targetId.split(':')
  if (namespace !== CATALOG_NAMESPACE || rest.length > 0 || kind === undefined) return null
  if (!isCatalogCategoryKind(kind)) return null
  return Object.freeze({
    destination: Object.freeze({
      surface: 'CATALOG' as const,
      itemKind: kind,
      equipmentModel: null,
    }),
    name: itemKindLabel[kind],
  })
}

function resolveCatalogSelection(
  kind: 'CATALOG_GROUP' | 'CATALOG_MODEL',
  targetId: string,
): ResolvedWatchTarget | null {
  const [namespace, segment, ...rest] = targetId.split(':')
  if (namespace !== CATALOG_NAMESPACE || segment === undefined || rest.length !== 1) return null
  const identifier = rest[0]
  const model = kind === 'CATALOG_MODEL' && segment === MODEL_SEGMENT
    ? equipmentModelById(identifier)
    : kind === 'CATALOG_GROUP' && segment === CATEGORY_SEGMENT
      ? allEquipmentInCategory(identifier as EquipmentCategoryId)
      : undefined
  if (!model) return null
  if (segment === MODEL_SEGMENT && !watchableModel(model)) return null
  if (segment === CATEGORY_SEGMENT && (model.category === 'UNCLASSIFIED' || !isCatalogCategoryKind(model.itemKind))) {
    return null
  }
  if (!isCatalogCategoryKind(model.itemKind)) return null
  return Object.freeze({
    destination: Object.freeze({
      surface: 'CATALOG' as const,
      itemKind: model.itemKind,
      equipmentModel: model.id,
    }),
    name: model.name,
  })
}

function economicScopeId(
  kind: 'ECONOMIC_SECTOR' | 'ECONOMIC_SEGMENT',
  targetId: string,
): string | null {
  const parts = targetId.split(':')
  if (kind === 'ECONOMIC_SECTOR') {
    if (parts.length !== 3 || parts[0] !== ECONOMY_NAMESPACE ||
      parts[1] !== ECONOMIC_SECTOR_SEGMENT || !MARKET_SCOPE_ID.test(parts[2] ?? '')) return null
    return parts[2] ?? null
  }
  if (parts.length !== 4 || parts[0] !== ECONOMY_NAMESPACE ||
    parts[1] !== ECONOMIC_SUBSECTOR_SEGMENT) return null
  const scopeId = `${parts[2]}:${parts[3]}`
  return MARKET_SUBSCOPE_ID.test(scopeId) ? scopeId : null
}

function resolveEconomicTarget(
  target: Extract<PersonalWatchTarget, { target_kind: 'ECONOMIC_SECTOR' | 'ECONOMIC_SEGMENT' }>,
): ResolvedWatchTarget | null {
  const scopeId = economicScopeId(target.target_kind, target.target_id)
  if (scopeId === null || scopeId === 'ALL') return null
  return Object.freeze({
    destination: Object.freeze({
      surface: 'MARKET' as const,
      scopeToken: marketScopeToken(scopeId),
    }),
    name: target.localized_name,
  })
}

/**
 * Returns `null` when a saved catalog object is not in the registry any more. Economic targets
 * are resolved separately from their formal scope identity and can only open the matching
 * same-site market route.
 */
export function resolveWatchTargetById(
  kind: Exclude<PersonalWatchTarget['target_kind'], 'ITEM'>,
  targetId: string,
): ResolvedWatchTarget | null {
  if (kind === 'CATALOG_CATEGORY') return resolveCatalogCategory(targetId)
  if (kind === 'CATALOG_GROUP' || kind === 'CATALOG_MODEL') {
    return resolveCatalogSelection(kind, targetId)
  }
  return null
}

/** Resolves a recorded parent without inferring catalog categories from economic identities. */
export function resolveParentWatchTargetKey(parentTargetKey: string): ResolvedWatchTarget | null {
  const prefix = 'CATALOG_CATEGORY:'
  if (!parentTargetKey.startsWith(prefix)) return null
  return resolveCatalogCategory(parentTargetKey.slice(prefix.length))
}

export function resolveWatchTarget(target: PersonalWatchTarget): ResolvedWatchTarget | null {
  if (target.target_kind === 'ITEM') {
    return Object.freeze({
      destination: Object.freeze({
        surface: 'PRODUCT' as const,
        unitId: target.target_id,
        itemKind: target.identity.item_kind,
        baseItemCode: target.identity.base_item_code,
        editionKind: target.identity.edition_kind,
        wearTier: target.identity.wear_tier,
      }),
      name: target.localized_name,
    })
  }
  if (target.target_kind === 'ECONOMIC_SECTOR' || target.target_kind === 'ECONOMIC_SEGMENT') {
    return resolveEconomicTarget(target)
  }
  return resolveWatchTargetById(target.target_kind, target.target_id)
}

/**
 * Converts only a formally decoded public market scope into a personal-watch target.
 * `ALL` is deliberately excluded: the overall market is a destination, not a followable object.
 */
export function marketScopeWatchCandidate(
  scope: MarketDescriptiveScope,
): PersonalWatchTargetCandidate | null {
  if (scope.scope_id === 'ALL' || scope.scope_kind === 'MARKET') return null
  if (scope.scope_token !== marketScopeToken(scope.scope_id)) return null
  const name = Object.freeze({ zh: scope.labels.zh_cn, en: scope.labels.en })
  if (scope.scope_kind === 'SECTOR') {
    if (!MARKET_SCOPE_ID.test(scope.scope_id) || scope.parent_scope_id !== 'ALL') return null
    const targetId = `${ECONOMY_NAMESPACE}:${ECONOMIC_SECTOR_SEGMENT}:${scope.scope_id}`
    return Object.freeze({
      target_kind: 'ECONOMIC_SECTOR' as const,
      target_id: targetId,
      target_key: personalWatchTargetKey('ECONOMIC_SECTOR', targetId),
      parent_target_key: null,
      localized_name: name,
    })
  }
  const match = MARKET_SUBSCOPE_ID.exec(scope.scope_id)
  if (!match || scope.parent_scope_id !== match[1]) return null
  const targetId = `${ECONOMY_NAMESPACE}:${ECONOMIC_SUBSECTOR_SEGMENT}:${match[1]}:${match[2]}`
  return Object.freeze({
    target_kind: 'ECONOMIC_SEGMENT' as const,
    target_id: targetId,
    target_key: personalWatchTargetKey('ECONOMIC_SEGMENT', targetId),
    parent_target_key: personalWatchTargetKey(
      'ECONOMIC_SECTOR',
      `${ECONOMY_NAMESPACE}:${ECONOMIC_SECTOR_SEGMENT}:${match[1]}`,
    ),
    localized_name: name,
  })
}

export function catalogCategoryWatchCandidate(
  itemKind: string,
): PersonalWatchTargetCandidate | null {
  if (!isCatalogCategoryKind(itemKind)) return null
  const targetId = catalogCategoryTargetId(itemKind)
  return Object.freeze({
    target_kind: 'CATALOG_CATEGORY' as const,
    target_id: targetId,
    target_key: personalWatchTargetKey('CATALOG_CATEGORY', targetId),
    parent_target_key: null,
    localized_name: Object.freeze({ ...itemKindLabel[itemKind] }),
  })
}

export function equipmentModelWatchCandidate(
  model: EquipmentModel,
): PersonalWatchTargetCandidate | null {
  if (!isCatalogCategoryKind(model.itemKind)) return null
  const targetId = model.scope === 'CATEGORY'
    ? catalogCategorySegmentTargetId(model.category)
    : watchableModel(model)
      ? catalogModelSegmentTargetId(model.id)
      : null
  if (targetId === null) return null
  const targetKind = model.scope === 'CATEGORY' ? 'CATALOG_GROUP' as const : 'CATALOG_MODEL' as const
  return Object.freeze({
    target_kind: targetKind,
    target_id: targetId,
    target_key: personalWatchTargetKey(targetKind, targetId),
    parent_target_key: personalWatchTargetKey(
      'CATALOG_CATEGORY',
      catalogCategoryTargetId(model.itemKind),
    ),
    localized_name: Object.freeze({ ...model.name }),
  })
}
