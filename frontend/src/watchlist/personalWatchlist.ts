import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogDisplayItemView } from '../adapter/catalogDisplayViewModel'
import type { CatalogPitContext } from '../components/CatalogPitContextBar'
import {
  ItemKind,
  WearTier,
  type CatalogProjectionRow,
} from '../contract/catalogBrowse'
import { EditionKind } from '../contract/identity'
import {
  ITEM_IMAGE_NOT_PRODUCED,
  bindItemImageUrl,
  isBoundItemImage,
  type ItemImageSource,
} from '../contract/itemImage'
import type { Localized } from '../i18n'

const DATABASE_NAME = 'cs2-rotate-personal-watchlist'
const DATABASE_VERSION = 3
// V1/V2 records stay readable for migration and audit; the V3 runtime only reads and writes `targets`.
const LEGACY_STORE_NAME = 'items'
const STORE_NAME = 'targets'
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u
const SHA256 = /^[0-9a-f]{64}$/u
const UTC_INSTANT = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3,6}Z$/u
const INTERNAL_MEDIA_ROUTE = /^\/media\/catalog\/v1\/[1-9][0-9]*\/[A-Za-z0-9_-]+$/u
const NAMESPACED_TARGET_ID = /^[A-Z][A-Z0-9_]*(?::[A-Za-z0-9_-]+)+$/u
const CATALOG_CATEGORY_ID = /^CATALOG:(?:WEAPON|KNIFE|GLOVE)$/u
const CATALOG_GROUP_ID = /^CATALOG:CATEGORY:[A-Za-z0-9_-]+$/u
const CATALOG_MODEL_ID = /^CATALOG:MODEL:[A-Za-z0-9_-]+$/u
const ECONOMIC_SECTOR_ID = /^ECONOMY:SECTOR:[A-Za-z0-9_-]+$/u
const ECONOMIC_SEGMENT_ID = /^ECONOMY:SEGMENT:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/u
const MAX_TARGET_ID_LENGTH = 512
const ITEM_KINDS = new Set<string>(Object.values(ItemKind))
const EDITIONS = new Set<string>(Object.values(EditionKind))
const WEARS = new Set<string>(Object.values(WearTier))

export type PersonalWatchlistImage =
  | Readonly<{ status: 'NOT_PRODUCED' }>
  | Readonly<{ status: 'BOUND'; src: string }>

export type PersonalWatchlistItemCatalog = Readonly<{
  snapshot_id: string
  as_of: string
  available_at: string
}>

export type PersonalWatchlistItemIdentity = Readonly<{
  item_kind: CatalogProjectionRow['item_kind']
  base_item_code: string
  edition_kind: CatalogProjectionRow['edition_kind']
  wear_tier: CatalogProjectionRow['wear_tier']
}>

/** The V1 record shape. Retained so stored and exported V1 data stays readable. */
export type LegacyPersonalWatchlistEntry = Readonly<{
  schema_version: 1
  analysis_unit_id: string
  added_at: string
  catalog: PersonalWatchlistItemCatalog
  identity: PersonalWatchlistItemIdentity
  localized_name: Localized
  image: PersonalWatchlistImage
}>

export type PersonalWatchTargetKind =
  | 'ITEM'
  | 'CATALOG_CATEGORY'
  | 'CATALOG_GROUP'
  | 'CATALOG_MODEL'
  | 'ECONOMIC_SECTOR'
  | 'ECONOMIC_SEGMENT'

type PersonalWatchTargetBase = Readonly<{
  schema_version: 3
  target_kind: PersonalWatchTargetKind
  target_id: string
  target_key: string
  parent_target_key: string | null
  added_at: string
  localized_name: Localized
}>

export type PersonalWatchItemTarget = PersonalWatchTargetBase & Readonly<{
  target_kind: 'ITEM'
  parent_target_key: null
  catalog: PersonalWatchlistItemCatalog
  identity: PersonalWatchlistItemIdentity
  image: PersonalWatchlistImage
}>

export type PersonalWatchCatalogCategoryTarget = PersonalWatchTargetBase & Readonly<{
  target_kind: 'CATALOG_CATEGORY'
  parent_target_key: null
}>

export type PersonalWatchCatalogGroupTarget = PersonalWatchTargetBase & Readonly<{
  target_kind: 'CATALOG_GROUP'
  parent_target_key: string
}>

export type PersonalWatchCatalogModelTarget = PersonalWatchTargetBase & Readonly<{
  target_kind: 'CATALOG_MODEL'
  parent_target_key: string
}>

export type PersonalWatchEconomicSectorTarget = PersonalWatchTargetBase & Readonly<{
  target_kind: 'ECONOMIC_SECTOR'
  parent_target_key: null
}>

export type PersonalWatchEconomicSegmentTarget = PersonalWatchTargetBase & Readonly<{
  target_kind: 'ECONOMIC_SEGMENT'
  parent_target_key: string
}>

export type PersonalWatchTarget =
  | PersonalWatchItemTarget
  | PersonalWatchCatalogCategoryTarget
  | PersonalWatchCatalogGroupTarget
  | PersonalWatchCatalogModelTarget
  | PersonalWatchEconomicSectorTarget
  | PersonalWatchEconomicSegmentTarget

/** What an add button supplies; `added_at` and `schema_version` are sealed at save time. */
export type PersonalWatchTargetCandidate =
  | Omit<PersonalWatchItemTarget, 'schema_version' | 'added_at'>
  | Omit<PersonalWatchCatalogCategoryTarget, 'schema_version' | 'added_at'>
  | Omit<PersonalWatchCatalogGroupTarget, 'schema_version' | 'added_at'>
  | Omit<PersonalWatchCatalogModelTarget, 'schema_version' | 'added_at'>
  | Omit<PersonalWatchEconomicSectorTarget, 'schema_version' | 'added_at'>
  | Omit<PersonalWatchEconomicSegmentTarget, 'schema_version' | 'added_at'>

export interface PersonalWatchlistStore {
  readAll(): Promise<readonly PersonalWatchTarget[]>
  put(target: PersonalWatchTarget): Promise<void>
  putMany(targets: readonly PersonalWatchTarget[]): Promise<void>
  remove(targetKey: string): Promise<void>
  clear(): Promise<void>
}

export class PersonalWatchlistCorruptError extends Error {
  constructor() {
    super('personal watchlist contains an invalid record')
    this.name = 'PersonalWatchlistCorruptError'
  }
}

export class PersonalWatchlistUnavailableError extends Error {
  constructor() {
    super('personal watchlist storage is unavailable')
    this.name = 'PersonalWatchlistUnavailableError'
  }
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeText(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum &&
    value === value.trim() && !CONTROL_CHARACTER.test(value)
}

function safeInstant(value: unknown): value is string {
  return typeof value === 'string' && UTC_INSTANT.test(value) && !Number.isNaN(Date.parse(value))
}

/** `target_key` is always rebuilt from the parsed kind and id, never trusted from input. */
export function personalWatchTargetKey(
  kind: PersonalWatchTargetKind,
  targetId: string,
): string {
  return `${kind}:${targetId}`
}

function isTargetKeyFor(
  value: unknown,
  kind: PersonalWatchTargetKind,
  idPattern: RegExp,
): value is string {
  const prefix = `${kind}:`
  return typeof value === 'string' && value.startsWith(prefix) &&
    idPattern.test(value.slice(prefix.length)) &&
    value.length <= MAX_TARGET_ID_LENGTH + prefix.length
}

function economicSectorParentKey(targetId: string): string | null {
  const match = /^ECONOMY:SEGMENT:([A-Za-z0-9_-]+):[A-Za-z0-9_-]+$/u.exec(targetId)
  return match ? personalWatchTargetKey('ECONOMIC_SECTOR', `ECONOMY:SECTOR:${match[1]}`) : null
}

function validLocalizedName(value: unknown): value is Localized {
  return isRecord(value) && exactKeys(value, ['zh', 'en']) &&
    safeText(value.zh, 1024) && safeText(value.en, 1024)
}

function validItemCatalog(value: unknown): value is PersonalWatchlistItemCatalog {
  return isRecord(value) && exactKeys(value, ['snapshot_id', 'as_of', 'available_at']) &&
    typeof value.snapshot_id === 'string' && SHA256.test(value.snapshot_id) &&
    safeInstant(value.as_of) && safeInstant(value.available_at) &&
    Date.parse(value.as_of) <= Date.parse(value.available_at)
}

function validItemIdentity(value: unknown): value is PersonalWatchlistItemIdentity {
  return isRecord(value) && exactKeys(value, [
    'item_kind',
    'base_item_code',
    'edition_kind',
    'wear_tier',
  ]) && typeof value.item_kind === 'string' && ITEM_KINDS.has(value.item_kind) &&
    safeText(value.base_item_code, 512) && typeof value.edition_kind === 'string' &&
    EDITIONS.has(value.edition_kind) && typeof value.wear_tier === 'string' &&
    WEARS.has(value.wear_tier)
}

function validItemImage(value: unknown): value is PersonalWatchlistImage {
  if (!isRecord(value)) return false
  if (value.status === 'NOT_PRODUCED') return exactKeys(value, ['status'])
  if (value.status === 'BOUND') {
    return exactKeys(value, ['status', 'src']) && typeof value.src === 'string' &&
      value.src.length <= 2048 && INTERNAL_MEDIA_ROUTE.test(value.src)
  }
  return false
}

function deepFreezeItem(target: PersonalWatchItemTarget): PersonalWatchItemTarget {
  Object.freeze(target.catalog)
  Object.freeze(target.identity)
  Object.freeze(target.localized_name)
  Object.freeze(target.image)
  return Object.freeze(target)
}

/** Strict V1 parser. Still the only admission path for legacy records and V1 imports. */
export function parseLegacyPersonalWatchlistEntry(value: unknown): LegacyPersonalWatchlistEntry {
  if (!isRecord(value) || !exactKeys(value, [
    'schema_version',
    'analysis_unit_id',
    'added_at',
    'catalog',
    'identity',
    'localized_name',
    'image',
  ]) || value.schema_version !== 1 || !safeText(value.analysis_unit_id, MAX_TARGET_ID_LENGTH) ||
    !safeInstant(value.added_at) || !validItemCatalog(value.catalog) ||
    !validItemIdentity(value.identity) || !validLocalizedName(value.localized_name) ||
    !validItemImage(value.image)) {
    throw new PersonalWatchlistCorruptError()
  }
  const entry = structuredClone(value) as LegacyPersonalWatchlistEntry
  Object.freeze(entry.catalog)
  Object.freeze(entry.identity)
  Object.freeze(entry.localized_name)
  Object.freeze(entry.image)
  return Object.freeze(entry)
}

export function parsePersonalWatchTarget(value: unknown): PersonalWatchTarget {
  if (!isRecord(value) || value.schema_version !== 3 ||
    typeof value.target_kind !== 'string' || !safeInstant(value.added_at) ||
    !validLocalizedName(value.localized_name)) {
    throw new PersonalWatchlistCorruptError()
  }

  if (value.target_kind === 'ITEM') {
    if (!exactKeys(value, [
      'schema_version',
      'target_kind',
      'target_id',
      'target_key',
      'parent_target_key',
      'added_at',
      'localized_name',
      'catalog',
      'identity',
      'image',
    ]) || !safeText(value.target_id, MAX_TARGET_ID_LENGTH) ||
      value.parent_target_key !== null ||
      value.target_key !== personalWatchTargetKey('ITEM', value.target_id) ||
      !validItemCatalog(value.catalog) || !validItemIdentity(value.identity) ||
      !validItemImage(value.image)) {
      throw new PersonalWatchlistCorruptError()
    }
    return deepFreezeItem(structuredClone(value) as PersonalWatchItemTarget)
  }

  const nonItemPatterns: Partial<Record<PersonalWatchTargetKind, RegExp>> = {
    CATALOG_CATEGORY: CATALOG_CATEGORY_ID,
    CATALOG_GROUP: CATALOG_GROUP_ID,
    CATALOG_MODEL: CATALOG_MODEL_ID,
    ECONOMIC_SECTOR: ECONOMIC_SECTOR_ID,
    ECONOMIC_SEGMENT: ECONOMIC_SEGMENT_ID,
  }
  const idPattern = nonItemPatterns[value.target_kind as PersonalWatchTargetKind]
  if (idPattern) {
    const kind = value.target_kind as PersonalWatchTargetKind
    if (!exactKeys(value, [
      'schema_version',
      'target_kind',
      'target_id',
      'target_key',
      'parent_target_key',
      'added_at',
      'localized_name',
    ]) || typeof value.target_id !== 'string' ||
      value.target_id.length > MAX_TARGET_ID_LENGTH ||
      !idPattern.test(value.target_id) ||
      value.target_key !== personalWatchTargetKey(kind, value.target_id)) {
      throw new PersonalWatchlistCorruptError()
    }
    if ((kind === 'CATALOG_CATEGORY' || kind === 'ECONOMIC_SECTOR') &&
      value.parent_target_key !== null) {
      throw new PersonalWatchlistCorruptError()
    }
    if ((kind === 'CATALOG_GROUP' || kind === 'CATALOG_MODEL') &&
      !isTargetKeyFor(value.parent_target_key, 'CATALOG_CATEGORY', CATALOG_CATEGORY_ID)) {
      throw new PersonalWatchlistCorruptError()
    }
    if (kind === 'ECONOMIC_SEGMENT' &&
      value.parent_target_key !== economicSectorParentKey(value.target_id)) {
      throw new PersonalWatchlistCorruptError()
    }
    const target = structuredClone(value) as Exclude<PersonalWatchTarget, PersonalWatchItemTarget>
    Object.freeze(target.localized_name)
    return Object.freeze(target)
  }

  throw new PersonalWatchlistCorruptError()
}

/** V1 record -> V3 `ITEM` target. Every sealed catalog/PIT/image field is carried over verbatim. */
export function personalWatchItemTargetFromLegacy(
  entry: LegacyPersonalWatchlistEntry,
): PersonalWatchItemTarget {
  return parsePersonalWatchTarget({
    schema_version: 3,
    target_kind: 'ITEM',
    target_id: entry.analysis_unit_id,
    target_key: personalWatchTargetKey('ITEM', entry.analysis_unit_id),
    parent_target_key: null,
    added_at: entry.added_at,
    localized_name: { ...entry.localized_name },
    catalog: { ...entry.catalog },
    identity: { ...entry.identity },
    image: { ...entry.image },
  }) as PersonalWatchItemTarget
}

/**
 * Whole-batch V1 -> V3 conversion. Throws on the first invalid record so the caller can
 * abort an upgrade instead of leaving a partially migrated store behind.
 */
export function migrateLegacyPersonalWatchlist(
  values: readonly unknown[],
): readonly PersonalWatchTarget[] {
  const migrated = values.map(
    (value) => personalWatchItemTargetFromLegacy(parseLegacyPersonalWatchlistEntry(value)),
  )
  assertUniqueTargets(migrated)
  return Object.freeze(migrated)
}

function parseLegacyV2Target(value: unknown): Readonly<Record<string, unknown>> {
  if (!isRecord(value) || value.schema_version !== 2 ||
    typeof value.target_kind !== 'string' || !safeInstant(value.added_at) ||
    !validLocalizedName(value.localized_name)) {
    throw new PersonalWatchlistCorruptError()
  }
  if (value.target_kind === 'ITEM') {
    if (!exactKeys(value, [
      'schema_version', 'target_kind', 'target_id', 'target_key', 'parent_target_key',
      'added_at', 'localized_name', 'catalog', 'identity', 'image',
    ]) || !safeText(value.target_id, MAX_TARGET_ID_LENGTH) ||
      value.parent_target_key !== null || value.target_key !== `ITEM:${value.target_id}` ||
      !validItemCatalog(value.catalog) || !validItemIdentity(value.identity) ||
      !validItemImage(value.image)) {
      throw new PersonalWatchlistCorruptError()
    }
    return value
  }
  if (value.target_kind !== 'SECTOR' && value.target_kind !== 'SEGMENT') {
    throw new PersonalWatchlistCorruptError()
  }
  if (!exactKeys(value, [
    'schema_version', 'target_kind', 'target_id', 'target_key', 'parent_target_key',
    'added_at', 'localized_name',
  ]) || typeof value.target_id !== 'string' || value.target_id.length > MAX_TARGET_ID_LENGTH ||
    !NAMESPACED_TARGET_ID.test(value.target_id) ||
    value.target_key !== `${value.target_kind}:${value.target_id}`) {
    throw new PersonalWatchlistCorruptError()
  }
  if (value.target_kind === 'SECTOR' && value.parent_target_key !== null) {
    throw new PersonalWatchlistCorruptError()
  }
  if (value.target_kind === 'SEGMENT' &&
    (typeof value.parent_target_key !== 'string' || !value.parent_target_key.startsWith('SECTOR:'))) {
    throw new PersonalWatchlistCorruptError()
  }
  return value
}

function migrateLegacyV2Target(value: unknown): PersonalWatchTarget {
  const legacy = parseLegacyV2Target(value)
  if (legacy.target_kind === 'ITEM') {
    return parsePersonalWatchTarget({ ...legacy, schema_version: 3 })
  }
  const targetId = legacy.target_id as string
  const parentTargetKey = legacy.parent_target_key as string | null
  let kind: PersonalWatchTargetKind
  let migratedId = targetId
  let migratedParent: string | null = null
  if (legacy.target_kind === 'SECTOR' && CATALOG_CATEGORY_ID.test(targetId)) {
    kind = 'CATALOG_CATEGORY'
  } else if (legacy.target_kind === 'SEGMENT' && CATALOG_GROUP_ID.test(targetId)) {
    kind = 'CATALOG_GROUP'
    migratedParent = parentTargetKey?.replace(/^SECTOR:/u, 'CATALOG_CATEGORY:') ?? null
  } else if (legacy.target_kind === 'SEGMENT' && CATALOG_MODEL_ID.test(targetId)) {
    kind = 'CATALOG_MODEL'
    migratedParent = parentTargetKey?.replace(/^SECTOR:/u, 'CATALOG_CATEGORY:') ?? null
  } else {
    const oldSector = /^MARKET:([A-Za-z0-9_-]+)$/u.exec(targetId)
    const oldSegment = /^MARKET:([A-Za-z0-9_-]+):([A-Za-z0-9_-]+)$/u.exec(targetId)
    if (legacy.target_kind === 'SECTOR' && oldSector) {
      kind = 'ECONOMIC_SECTOR'
      migratedId = `ECONOMY:SECTOR:${oldSector[1]}`
    } else if (legacy.target_kind === 'SEGMENT' && oldSegment &&
      parentTargetKey === `SECTOR:MARKET:${oldSegment[1]}`) {
      kind = 'ECONOMIC_SEGMENT'
      migratedId = `ECONOMY:SEGMENT:${oldSegment[1]}:${oldSegment[2]}`
      migratedParent = personalWatchTargetKey(
        'ECONOMIC_SECTOR',
        `ECONOMY:SECTOR:${oldSegment[1]}`,
      )
    } else {
      throw new PersonalWatchlistCorruptError()
    }
  }
  return parsePersonalWatchTarget({
    schema_version: 3,
    target_kind: kind,
    target_id: migratedId,
    target_key: personalWatchTargetKey(kind, migratedId),
    parent_target_key: migratedParent,
    added_at: legacy.added_at,
    localized_name: legacy.localized_name,
  })
}

export function migrateV2PersonalWatchlist(
  values: readonly unknown[],
): readonly PersonalWatchTarget[] {
  const migrated = values.map(migrateLegacyV2Target)
  assertUniqueTargets(migrated)
  return Object.freeze(migrated)
}

function assertUniqueTargets(targets: readonly PersonalWatchTarget[]): void {
  const keys = new Set<string>()
  for (const target of targets) {
    if (keys.has(target.target_key)) throw new PersonalWatchlistCorruptError()
    keys.add(target.target_key)
  }
}

function sorted(targets: readonly PersonalWatchTarget[]): readonly PersonalWatchTarget[] {
  return Object.freeze([...targets].sort((left, right) => {
    if (left.added_at !== right.added_at) return left.added_at > right.added_at ? -1 : 1
    return left.target_key < right.target_key ? -1 : left.target_key > right.target_key ? 1 : 0
  }))
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true })
    request.addEventListener('error', () => reject(request.error ?? new PersonalWatchlistUnavailableError()), { once: true })
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true })
    transaction.addEventListener('abort', () => reject(transaction.error ?? new PersonalWatchlistUnavailableError()), { once: true })
    transaction.addEventListener('error', () => reject(transaction.error ?? new PersonalWatchlistUnavailableError()), { once: true })
  })
}

export class IndexedDbPersonalWatchlistStore implements PersonalWatchlistStore {
  private async open(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') throw new PersonalWatchlistUnavailableError()
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
      let settled = false
      let corrupt = false
      const fail = (error: unknown) => {
        if (settled) return
        settled = true
        reject(corrupt
          ? new PersonalWatchlistCorruptError()
          : error ?? new PersonalWatchlistUnavailableError())
      }
      request.addEventListener('upgradeneeded', (event) => {
        const database = request.result
        const transaction = request.transaction
        if (!transaction) return
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'target_key' })
          store.createIndex('added_at', 'added_at')
        }
        const oldVersion = (event as IDBVersionChangeEvent).oldVersion
        // Migrate inside this versionchange transaction so a corrupt record aborts the whole
        // upgrade. `items` is never cleared and stays as the read-only V1 rollback record.
        if (oldVersion === 1 && database.objectStoreNames.contains(LEGACY_STORE_NAME)) {
          const legacy = transaction.objectStore(LEGACY_STORE_NAME).getAll()
          legacy.addEventListener('success', () => {
            try {
              const migrated = migrateLegacyPersonalWatchlist(legacy.result)
              const targets = transaction.objectStore(STORE_NAME)
              for (const target of migrated) targets.put(structuredClone(target))
            } catch {
              corrupt = true
              transaction.abort()
            }
          }, { once: true })
        } else if (oldVersion === 2) {
          const existing = transaction.objectStore(STORE_NAME).getAll()
          existing.addEventListener('success', () => {
            try {
              const migrated = migrateV2PersonalWatchlist(existing.result)
              const targets = transaction.objectStore(STORE_NAME)
              targets.clear()
              for (const target of migrated) targets.put(structuredClone(target))
            } catch {
              corrupt = true
              transaction.abort()
            }
          }, { once: true })
        }
      })
      request.addEventListener('success', () => {
        if (settled) {
          request.result.close()
          return
        }
        settled = true
        resolve(request.result)
      }, { once: true })
      request.addEventListener('error', () => fail(request.error), { once: true })
      request.addEventListener('blocked', () => fail(null), { once: true })
    })
  }

  async readAll(): Promise<readonly PersonalWatchTarget[]> {
    let database: IDBDatabase | null = null
    try {
      database = await this.open()
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const values = await requestResult(transaction.objectStore(STORE_NAME).getAll())
      await transactionComplete(transaction)
      return sorted(values.map(parsePersonalWatchTarget))
    } catch (error) {
      if (error instanceof PersonalWatchlistCorruptError) throw error
      throw new PersonalWatchlistUnavailableError()
    } finally {
      database?.close()
    }
  }

  async put(target: PersonalWatchTarget): Promise<void> {
    await this.putMany([target])
  }

  async putMany(targets: readonly PersonalWatchTarget[]): Promise<void> {
    const admitted = targets.map(parsePersonalWatchTarget)
    assertUniqueTargets(admitted)
    let database: IDBDatabase | null = null
    try {
      database = await this.open()
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      for (const target of admitted) store.put(structuredClone(target))
      await transactionComplete(transaction)
    } catch (error) {
      if (error instanceof PersonalWatchlistCorruptError) throw error
      throw new PersonalWatchlistUnavailableError()
    } finally {
      database?.close()
    }
  }

  async remove(targetKey: string): Promise<void> {
    if (!safeText(targetKey, MAX_TARGET_ID_LENGTH + 16)) throw new PersonalWatchlistCorruptError()
    let database: IDBDatabase | null = null
    try {
      database = await this.open()
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(targetKey)
      await transactionComplete(transaction)
    } catch {
      throw new PersonalWatchlistUnavailableError()
    } finally {
      database?.close()
    }
  }

  async clear(): Promise<void> {
    let database: IDBDatabase | null = null
    try {
      database = await this.open()
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).clear()
      await transactionComplete(transaction)
    } catch {
      throw new PersonalWatchlistUnavailableError()
    } finally {
      database?.close()
    }
  }
}

export function personalWatchlistItemCandidate(
  row: CatalogProjectionRow,
  item: CatalogDisplayItemView,
  pitContext: CatalogPitContext,
): PersonalWatchTargetCandidate | null {
  const snapshot = pitContext.snapshot
  if (!snapshot || item.analysis_unit_id !== row.analysis_unit_id) return null
  const image: PersonalWatchlistImage = isBoundItemImage(item.image)
    ? Object.freeze({ status: 'BOUND', src: item.image.src })
    : Object.freeze({ status: 'NOT_PRODUCED' })
  return Object.freeze({
    target_kind: 'ITEM',
    target_id: row.analysis_unit_id,
    target_key: personalWatchTargetKey('ITEM', row.analysis_unit_id),
    parent_target_key: null,
    catalog: Object.freeze({
      snapshot_id: snapshot.snapshot_id,
      as_of: pitContext.query_as_of,
      available_at: snapshot.available_at,
    }),
    identity: Object.freeze({
      item_kind: row.item_kind,
      base_item_code: row.base_item_code,
      edition_kind: row.edition_kind,
      wear_tier: row.wear_tier,
    }),
    localized_name: Object.freeze({ ...item.display_name }),
    image,
  })
}

export function personalWatchlistImage(target: PersonalWatchItemTarget): ItemImageSource {
  return target.image.status === 'BOUND'
    ? bindItemImageUrl(target.image.src)
    : ITEM_IMAGE_NOT_PRODUCED
}

export function isItemTarget(target: PersonalWatchTarget): target is PersonalWatchItemTarget {
  return target.target_kind === 'ITEM'
}

export type PersonalWatchlistController = Readonly<{
  status: 'LOADING' | 'READY' | 'ERROR'
  entries: readonly PersonalWatchTarget[]
  pendingKeys: ReadonlySet<string>
  error: 'CORRUPT' | 'UNAVAILABLE' | 'OPERATION_FAILED' | null
  has: (targetKey: string) => boolean
  toggle: (candidate: PersonalWatchTargetCandidate) => Promise<void>
  addMany: (candidates: readonly PersonalWatchTargetCandidate[]) => Promise<number>
  remove: (targetKey: string) => Promise<void>
  clear: () => Promise<void>
  importJson: (source: string) => Promise<number>
  exportJson: () => string
  reload: () => void
}>

const EXPORT_FORMAT = 'cs2-rotate-personal-watchlist'

type ExportEnvelope = Readonly<{
  format: typeof EXPORT_FORMAT
  version: 3
  exported_at: string
  entries: readonly PersonalWatchTarget[]
}>

/** Accepts a strict V1, V2 or V3 envelope; older entries are converted in memory. */
export function parsePersonalWatchlistImport(source: string): readonly PersonalWatchTarget[] {
  if (source.length === 0 || source.length > 5_000_000) throw new PersonalWatchlistCorruptError()
  let value: unknown
  try {
    value = JSON.parse(source)
  } catch {
    throw new PersonalWatchlistCorruptError()
  }
  if (!isRecord(value) || !exactKeys(value, ['format', 'version', 'exported_at', 'entries']) ||
    value.format !== EXPORT_FORMAT || !safeInstant(value.exported_at) ||
    !Array.isArray(value.entries)) {
    throw new PersonalWatchlistCorruptError()
  }
  const targets = value.version === 1
    ? migrateLegacyPersonalWatchlist(value.entries)
    : value.version === 2
      ? migrateV2PersonalWatchlist(value.entries)
      : value.version === 3
        ? value.entries.map(parsePersonalWatchTarget)
        : null
  if (targets === null) throw new PersonalWatchlistCorruptError()
  assertUniqueTargets(targets)
  return Object.freeze([...targets])
}

export function serializePersonalWatchlist(
  targets: readonly PersonalWatchTarget[],
  exportedAt: string,
): string {
  if (!safeInstant(exportedAt)) throw new PersonalWatchlistCorruptError()
  const admitted = targets.map(parsePersonalWatchTarget)
  assertUniqueTargets(admitted)
  return JSON.stringify({
    format: EXPORT_FORMAT,
    version: 3,
    exported_at: exportedAt,
    entries: admitted,
  } satisfies ExportEnvelope, null, 2)
}

export function usePersonalWatchlist(
  store: PersonalWatchlistStore,
  now: () => Date,
): PersonalWatchlistController {
  const [entries, setEntries] = useState<readonly PersonalWatchTarget[]>(Object.freeze([]))
  const [status, setStatus] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING')
  const [error, setError] = useState<PersonalWatchlistController['error']>(null)
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(() => new Set())
  const generation = useRef(0)

  const load = useCallback(() => {
    const current = ++generation.current
    setStatus('LOADING')
    setError(null)
    void store.readAll().then(
      (next) => {
        if (generation.current !== current) return
        setEntries(sorted(next))
        setStatus('READY')
      },
      (cause: unknown) => {
        if (generation.current !== current) return
        setEntries(Object.freeze([]))
        setStatus('ERROR')
        setError(cause instanceof PersonalWatchlistCorruptError ? 'CORRUPT' : 'UNAVAILABLE')
      },
    )
  }, [store])

  useEffect(() => {
    load()
    return () => {
      generation.current += 1
    }
  }, [load])

  const markPending = useCallback((targetKey: string, active: boolean) => {
    setPendingKeys((current) => {
      const next = new Set(current)
      if (active) next.add(targetKey)
      else next.delete(targetKey)
      return next
    })
  }, [])

  const commit = useCallback(async (
    targetKey: string,
    operation: () => Promise<void>,
    nextEntries: (current: readonly PersonalWatchTarget[]) => readonly PersonalWatchTarget[],
  ) => {
    markPending(targetKey, true)
    setError(null)
    try {
      await operation()
      setEntries((current) => sorted(nextEntries(current)))
      setStatus('READY')
    } catch {
      setError('OPERATION_FAILED')
    } finally {
      markPending(targetKey, false)
    }
  }, [markPending])

  const byKey = useMemo(
    () => new Map(entries.map((entry) => [entry.target_key, entry])),
    [entries],
  )
  const has = useCallback((targetKey: string) => byKey.has(targetKey), [byKey])
  const remove = useCallback(async (targetKey: string) => {
    await commit(
      targetKey,
      () => store.remove(targetKey),
      (current) => current.filter((entry) => entry.target_key !== targetKey),
    )
  }, [commit, store])
  const toggle = useCallback(async (candidate: PersonalWatchTargetCandidate) => {
    if (byKey.has(candidate.target_key)) {
      await remove(candidate.target_key)
      return
    }
    const addedAt = now().toISOString()
    const target = parsePersonalWatchTarget({ ...candidate, schema_version: 3, added_at: addedAt })
    await commit(
      target.target_key,
      () => store.put(target),
      (current) => current.some((entry) => entry.target_key === target.target_key)
        ? current
        : [...current, target],
    )
  }, [byKey, commit, now, remove, store])
  const addMany = useCallback(async (candidates: readonly PersonalWatchTargetCandidate[]) => {
    const missing = new Map<string, PersonalWatchTargetCandidate>()
    for (const candidate of candidates) {
      if (!byKey.has(candidate.target_key)) missing.set(candidate.target_key, candidate)
    }
    if (missing.size === 0) return 0

    const addedAt = now().toISOString()
    const targets = [...missing.values()].map((candidate) =>
      parsePersonalWatchTarget({ ...candidate, schema_version: 3, added_at: addedAt }))
    for (const target of targets) markPending(target.target_key, true)
    setError(null)
    try {
      await store.putMany(targets)
      setEntries((current) => {
        const merged = new Map(current.map((entry) => [entry.target_key, entry]))
        for (const target of targets) merged.set(target.target_key, target)
        return sorted([...merged.values()])
      })
      setStatus('READY')
      return targets.length
    } catch (cause) {
      setError('OPERATION_FAILED')
      throw cause
    } finally {
      for (const target of targets) markPending(target.target_key, false)
    }
  }, [byKey, markPending, now, store])
  const clear = useCallback(async () => {
    setError(null)
    try {
      await store.clear()
      setEntries(Object.freeze([]))
      setStatus('READY')
    } catch {
      setError('OPERATION_FAILED')
    }
  }, [store])
  const importJson = useCallback(async (source: string) => {
    const imported = parsePersonalWatchlistImport(source)
    setError(null)
    try {
      await store.putMany(imported)
      setEntries((current) => {
        const merged = new Map(current.map((entry) => [entry.target_key, entry]))
        for (const entry of imported) merged.set(entry.target_key, entry)
        return sorted([...merged.values()])
      })
      setStatus('READY')
      return imported.length
    } catch (cause) {
      if (cause instanceof PersonalWatchlistCorruptError) throw cause
      setError('OPERATION_FAILED')
      throw cause
    }
  }, [store])
  const exportJson = useCallback(
    () => serializePersonalWatchlist(entries, now().toISOString()),
    [entries, now],
  )

  return Object.freeze({
    status,
    entries,
    pendingKeys,
    error,
    has,
    toggle,
    addMany,
    remove,
    clear,
    importJson,
    exportJson,
    reload: load,
  })
}
