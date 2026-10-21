import type { EquipmentSummary } from './catalogEquipment'
import type { EquipmentModel } from './equipmentModels'
import { isUnpaintedCatalogSeries } from './catalogDefaultOrder'
import type { ItemKind } from '../contract/catalogBrowse'

export const CATALOG_DISCOVERY_LIMIT = 16
export const CATALOG_DISCOVERY_PRIORITY_LIMIT = 12
export const CATALOG_DISCOVERY_BATCH_SIZE = 16
export const CATALOG_DISCOVERY_SESSION_KEY = 'cs2-rotate.catalog.discovery-seed.v1'
export const CATALOG_DISCOVERY_VISIBLE_COUNT_SESSION_KEY =
  'cs2-rotate.catalog.discovery-visible-count.v1'
export const CATALOG_DISCOVERY_SCROLL_OFFSET_SESSION_KEY =
  'cs2-rotate.catalog.discovery-scroll-offset.v1'

export const CATALOG_DISCOVERY_FIXED_MODEL_IDS = Object.freeze([
  'weapon_ak47',
  'weapon_m4a1_silencer',
  'weapon_m4a1',
  'weapon_awp',
  'weapon_deagle',
  'weapon_usp_silencer',
] as const)

export type CatalogDiscoveryModelSlot = Readonly<{
  guaranteed: boolean
  model: EquipmentModel
}>

export type CatalogDiscoverySeriesCandidate<T> = Readonly<{
  baseItemCode: string
  equipmentModelId: string
  itemKind: ItemKind
  value: T
}>

export type CatalogDiscoverySeriesChoice<T> = Readonly<{
  candidate: CatalogDiscoverySeriesCandidate<T>
  guaranteed: boolean
}>

let volatileSeed: string | null = null

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function seededScore(seed: string, namespace: string, value: string): number {
  const input = `${seed}\u0000${namespace}\u0000${value}`
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function seededOrder(
  seed: string,
  namespace: string,
  left: string,
  right: string,
): number {
  const score = seededScore(seed, namespace, left) - seededScore(seed, namespace, right)
  return score === 0 ? compareText(left, right) : score
}

export function chooseCatalogDiscoveryCandidate<T>(
  candidates: readonly T[],
  seed: string,
  namespace: string,
  keyOf: (candidate: T) => string,
): T | undefined {
  return [...candidates].sort((left, right) =>
    seededOrder(seed, namespace, keyOf(left), keyOf(right)))[0]
}

function createSeed(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const values = new Uint32Array(4)
    cryptoApi.getRandomValues(values)
    return [...values].map((value) => value.toString(16).padStart(8, '0')).join('')
  }
  return `fallback-${Date.now().toString(36)}-${globalThis.performance?.now().toString(36) ?? '0'}`
}

/** One seed per browser-tab session; reloads retain the same discovery page. */
export function catalogDiscoverySessionSeed(): string {
  try {
    const stored = globalThis.sessionStorage?.getItem(CATALOG_DISCOVERY_SESSION_KEY)
    if (stored) return stored
  } catch {
    // A blocked Storage API must not make the catalog unusable.
  }
  if (volatileSeed) return volatileSeed
  volatileSeed = createSeed()
  try {
    globalThis.sessionStorage?.setItem(CATALOG_DISCOVERY_SESSION_KEY, volatileSeed)
  } catch {
    // Keep the in-memory seed for this document when sessionStorage is unavailable.
  }
  return volatileSeed
}

/**
 * Chooses up to sixteen populated models for the default page. The first eight
 * slots are the six product-approved weapons plus one seeded knife and glove.
 */
export function planCatalogDiscoveryModels(
  summaries: readonly EquipmentSummary[],
  seed: string,
  limit = CATALOG_DISCOVERY_LIMIT,
): readonly CatalogDiscoveryModelSlot[] {
  const eligible = summaries.filter(({ model, series }) =>
    model.scope === 'MODEL' &&
    model.category !== 'UNCLASSIFIED' &&
    series > 0 &&
    (model.itemKind !== 'WEAPON' || series > 1))
  const byId = new Map(eligible.map(({ model }) => [model.id, model]))
  const fixed = CATALOG_DISCOVERY_FIXED_MODEL_IDS.map((id) => byId.get(id))
  if (fixed.some((model) => model === undefined)) return []
  const fixedModels = fixed.filter((model): model is EquipmentModel => model !== undefined)

  const knife = chooseCatalogDiscoveryCandidate(
    eligible.filter(({ model }) => model.category === 'KNIVES').map(({ model }) => model),
    seed,
    'knife-model',
    (model) => model.id,
  )
  const glove = chooseCatalogDiscoveryCandidate(
    eligible.filter(({ model }) => model.category === 'GLOVES').map(({ model }) => model),
    seed,
    'glove-model',
    (model) => model.id,
  )
  if (!knife || !glove) return []

  const guaranteed = [...fixedModels, knife, glove]
  const guaranteedIds = new Set(guaranteed.map((model) => model.id))
  const extras = eligible
    .map(({ model }) => model)
    .filter((model) => !guaranteedIds.has(model.id))
    .sort((left, right) => seededOrder(seed, 'extra-model', left.id, right.id))
    .slice(0, Math.max(0, limit - guaranteed.length))

  return Object.freeze([
    ...guaranteed.map((model) => ({ guaranteed: true, model })),
    ...extras.map((model) => ({ guaranteed: false, model })),
  ])
}

/** Chooses one actionable series for every planned model using the same seed. */
export function selectCatalogDiscoverySeries<T>(
  plan: readonly CatalogDiscoveryModelSlot[],
  candidates: readonly CatalogDiscoverySeriesCandidate<T>[],
  seed: string,
): readonly CatalogDiscoverySeriesChoice<T>[] {
  const choices: CatalogDiscoverySeriesChoice<T>[] = []
  for (const slot of plan) {
    const eligible = candidates.filter((candidate) =>
      candidate.equipmentModelId === slot.model.id &&
      !(candidate.itemKind === 'WEAPON' && isUnpaintedCatalogSeries(candidate.baseItemCode)))
    const candidate = chooseCatalogDiscoveryCandidate(
      eligible,
      seed,
      `series:${slot.model.id}`,
      (entry) => `${entry.itemKind}\u0000${entry.baseItemCode}`,
    )
    if (!candidate) return []
    choices.push({ candidate, guaranteed: slot.guaranteed })
  }
  return Object.freeze(choices)
}

/**
 * Orders the complete actionable catalog for discovery. The product-approved
 * families are guaranteed inside the first visible desktop window, while the
 * rest of the catalog remains a deterministic, duplicate-free session shuffle.
 */
export function orderCatalogDiscoverySeries<T>(
  plan: readonly CatalogDiscoveryModelSlot[],
  candidates: readonly CatalogDiscoverySeriesCandidate<T>[],
  seed: string,
  priorityLimit = CATALOG_DISCOVERY_PRIORITY_LIMIT,
): readonly CatalogDiscoverySeriesChoice<T>[] {
  const eligible = candidates.filter((candidate) =>
    !(candidate.itemKind === 'WEAPON' && isUnpaintedCatalogSeries(candidate.baseItemCode)))
  const guaranteedSlots = plan.filter((slot) => slot.guaranteed)
  const guaranteed: CatalogDiscoverySeriesChoice<T>[] = []
  const chosenKeys = new Set<string>()
  const keyOf = (candidate: CatalogDiscoverySeriesCandidate<T>) =>
    `${candidate.itemKind}\u0000${candidate.baseItemCode}`

  for (const slot of guaranteedSlots) {
    const candidate = chooseCatalogDiscoveryCandidate(
      eligible.filter((entry) => entry.equipmentModelId === slot.model.id),
      seed,
      `series:${slot.model.id}`,
      keyOf,
    )
    if (!candidate) return []
    const key = keyOf(candidate)
    if (chosenKeys.has(key)) return []
    chosenKeys.add(key)
    guaranteed.push({ candidate, guaranteed: true })
  }

  const remaining = eligible
    .filter((candidate) => !chosenKeys.has(keyOf(candidate)))
    .sort((left, right) => seededOrder(seed, 'remaining-series', keyOf(left), keyOf(right)))
  const priorityExtras = remaining.slice(
    0,
    Math.max(0, priorityLimit - guaranteed.length),
  )
  const priorityExtraKeys = new Set(priorityExtras.map(keyOf))
  const priority = [
    ...guaranteed,
    ...priorityExtras.map((candidate) => ({ candidate, guaranteed: false })),
  ].sort((left, right) => seededOrder(
    seed,
    'priority-window',
    keyOf(left.candidate),
    keyOf(right.candidate),
  ))
  const tail = remaining
    .filter((candidate) => !priorityExtraKeys.has(keyOf(candidate)))
    .map((candidate) => ({ candidate, guaranteed: false }))

  return Object.freeze([...priority, ...tail])
}
