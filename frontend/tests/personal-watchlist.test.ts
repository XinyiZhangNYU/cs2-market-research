import { afterEach, describe, expect, it } from 'vitest'
import type { CatalogDisplayItemView } from '../src/adapter/catalogDisplayViewModel'
import type { CatalogPitContext } from '../src/components/CatalogPitContextBar'
import { ItemKind, WearTier, type CatalogProjectionRow } from '../src/contract/catalogBrowse'
import { EditionKind } from '../src/contract/identity'
import { bindItemImageUrl } from '../src/contract/itemImage'
import {
  IndexedDbPersonalWatchlistStore,
  PersonalWatchlistCorruptError,
  migrateLegacyPersonalWatchlist,
  migrateV2PersonalWatchlist,
  parseLegacyPersonalWatchlistEntry,
  parsePersonalWatchTarget,
  parsePersonalWatchlistImport,
  personalWatchTargetKey,
  personalWatchlistImage,
  personalWatchlistItemCandidate,
  serializePersonalWatchlist,
  type PersonalWatchItemTarget,
  type PersonalWatchTarget,
} from '../src/watchlist/personalWatchlist'
import { FakeDatabaseState, installFakeIndexedDb } from './support/fakeIndexedDb'

const SNAPSHOT_ID = 'a'.repeat(64)
const AS_OF = '2026-09-05T12:00:00.000000Z'
const AVAILABLE_AT = '2026-09-05T12:05:00.000000Z'
const ADDED_AT = '2026-09-05T13:00:00.000Z'
const UNIT_ID = 'item:opaque/one'

function legacyEntry(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 1,
    analysis_unit_id: UNIT_ID,
    added_at: ADDED_AT,
    catalog: { snapshot_id: SNAPSHOT_ID, as_of: AS_OF, available_at: AVAILABLE_AT },
    identity: {
      item_kind: ItemKind.WEAPON,
      base_item_code: 'weapon.ak47.redline',
      edition_kind: EditionKind.STATTRAK,
      wear_tier: WearTier.FIELD_TESTED,
    },
    localized_name: { zh: 'AK-47 | 红线（久经沙场）', en: 'AK-47 | Redline (Field-Tested)' },
    image: { status: 'BOUND', src: '/media/catalog/v1/105/bWVkaWEta2V5' },
    ...overrides,
  }
}

function itemTarget(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 3,
    target_kind: 'ITEM',
    target_id: UNIT_ID,
    target_key: `ITEM:${UNIT_ID}`,
    parent_target_key: null,
    added_at: ADDED_AT,
    localized_name: { zh: 'AK-47 | 红线（久经沙场）', en: 'AK-47 | Redline (Field-Tested)' },
    catalog: { snapshot_id: SNAPSHOT_ID, as_of: AS_OF, available_at: AVAILABLE_AT },
    identity: {
      item_kind: ItemKind.WEAPON,
      base_item_code: 'weapon.ak47.redline',
      edition_kind: EditionKind.STATTRAK,
      wear_tier: WearTier.FIELD_TESTED,
    },
    image: { status: 'BOUND', src: '/media/catalog/v1/105/bWVkaWEta2V5' },
    ...overrides,
  }
}

function categoryTarget(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 3,
    target_kind: 'CATALOG_CATEGORY',
    target_id: 'CATALOG:WEAPON',
    target_key: 'CATALOG_CATEGORY:CATALOG:WEAPON',
    parent_target_key: null,
    added_at: ADDED_AT,
    localized_name: { zh: '武器', en: 'Weapons' },
    ...overrides,
  }
}

function modelTarget(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 3,
    target_kind: 'CATALOG_MODEL',
    target_id: 'CATALOG:MODEL:weapon_ak47',
    target_key: 'CATALOG_MODEL:CATALOG:MODEL:weapon_ak47',
    parent_target_key: 'CATALOG_CATEGORY:CATALOG:WEAPON',
    added_at: ADDED_AT,
    localized_name: { zh: 'AK-47', en: 'AK-47' },
    ...overrides,
  }
}

function legacyV2CategoryTarget(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 2,
    target_kind: 'SECTOR',
    target_id: 'CATALOG:WEAPON',
    target_key: 'SECTOR:CATALOG:WEAPON',
    parent_target_key: null,
    added_at: ADDED_AT,
    localized_name: { zh: '武器', en: 'Weapons' },
    ...overrides,
  }
}

function legacyV2ModelTarget(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 2,
    target_kind: 'SEGMENT',
    target_id: 'CATALOG:MODEL:weapon_ak47',
    target_key: 'SEGMENT:CATALOG:MODEL:weapon_ak47',
    parent_target_key: 'SECTOR:CATALOG:WEAPON',
    added_at: ADDED_AT,
    localized_name: { zh: 'AK-47', en: 'AK-47' },
    ...overrides,
  }
}

let restoreIndexedDb: (() => void) | null = null

afterEach(() => {
  restoreIndexedDb?.()
  restoreIndexedDb = null
})

describe('personal watchlist identity boundary', () => {
  it('admits and recursively freezes one exact PIT-bound product identity', () => {
    const target = parsePersonalWatchTarget(itemTarget()) as PersonalWatchItemTarget
    expect(target.catalog.snapshot_id).toBe(SNAPSHOT_ID)
    expect(target.identity.base_item_code).toBe('weapon.ak47.redline')
    expect(Object.isFrozen(target)).toBe(true)
    expect(Object.isFrozen(target.catalog)).toBe(true)
    expect(personalWatchlistImage(target)).toMatchObject({
      status: 'BOUND',
      src: '/media/catalog/v1/105/bWVkaWEta2V5',
    })
  })

  it('compares PIT instants by time rather than fractional-second text width', () => {
    expect(() => parsePersonalWatchTarget(itemTarget({
      catalog: {
        snapshot_id: SNAPSHOT_ID,
        as_of: '2026-09-05T12:00:00.100Z',
        available_at: '2026-09-05T12:00:00.100000Z',
      },
    }))).not.toThrow()
  })

  it('keeps an item, its catalog category and one catalog model as three separate targets', () => {
    const targets = [itemTarget(), categoryTarget(), modelTarget()].map(parsePersonalWatchTarget)
    expect(new Set(targets.map((target) => target.target_key)).size).toBe(3)
    expect(targets.map((target) => target.target_kind).sort()).toEqual(['CATALOG_CATEGORY', 'CATALOG_MODEL', 'ITEM'])
    const model = targets.find((target) => target.target_kind === 'CATALOG_MODEL')
    const category = targets.find((target) => target.target_kind === 'CATALOG_CATEGORY')
    // The child records its parent, and following a parent never absorbs the child.
    expect(model?.parent_target_key).toBe(category?.target_key)
  })

  it('rebuilds target_key from the parsed kind and id instead of trusting the stored value', () => {
    expect(personalWatchTargetKey('CATALOG_MODEL', 'CATALOG:MODEL:weapon_ak47'))
      .toBe('CATALOG_MODEL:CATALOG:MODEL:weapon_ak47')
    expect(() => parsePersonalWatchTarget(modelTarget({
      target_key: 'CATALOG_MODEL:CATALOG:MODEL:weapon_m4a1',
    }))).toThrow(PersonalWatchlistCorruptError)
    expect(() => parsePersonalWatchTarget(categoryTarget({ target_key: 'ITEM:CATALOG:WEAPON' })))
      .toThrow(PersonalWatchlistCorruptError)
  })

  it('deduplicates by target_key when only the bilingual name changed', () => {
    const renamed = parsePersonalWatchTarget(modelTarget({
      localized_name: { zh: 'AK-47 步枪', en: 'AK-47 rifle' },
    }))
    const original = parsePersonalWatchTarget(modelTarget())
    expect(renamed.target_key).toBe(original.target_key)
    const merged = new Map([original, renamed].map((target) => [target.target_key, target]))
    expect(merged.size).toBe(1)
  })

  it('keeps two catalog models under one parent, and catalog/economic names apart', () => {
    const siblings = [
      modelTarget(),
      modelTarget({
        target_id: 'CATALOG:MODEL:weapon_m4a1',
        target_key: 'CATALOG_MODEL:CATALOG:MODEL:weapon_m4a1',
        localized_name: { zh: 'M4A4', en: 'M4A4' },
      }),
    ].map(parsePersonalWatchTarget)
    expect(new Set(siblings.map((target) => target.target_key)).size).toBe(2)
    expect(siblings.every((target) => target.parent_target_key === 'CATALOG_CATEGORY:CATALOG:WEAPON')).toBe(true)

    const sameNameOtherNamespace = [
      modelTarget(),
      modelTarget({
        target_kind: 'ECONOMIC_SEGMENT',
        target_id: 'ECONOMY:SEGMENT:CASE:weapon_ak47',
        target_key: 'ECONOMIC_SEGMENT:ECONOMY:SEGMENT:CASE:weapon_ak47',
        parent_target_key: 'ECONOMIC_SECTOR:ECONOMY:SECTOR:CASE',
      }),
    ].map(parsePersonalWatchTarget)
    expect(new Set(sameNameOtherNamespace.map((target) => target.target_key)).size).toBe(2)
  })

  it('proves a future economic sector, child segment and item can coexist without MARKET', () => {
    // Fixture-only identities. Nothing here is registered as a production target.
    const targets = [
      categoryTarget({
        target_kind: 'ECONOMIC_SECTOR',
        target_id: 'ECONOMY:SECTOR:CASE',
        target_key: 'ECONOMIC_SECTOR:ECONOMY:SECTOR:CASE',
        localized_name: { zh: '箱子板块', en: 'Case sector' },
      }),
      modelTarget({
        target_kind: 'ECONOMIC_SEGMENT',
        target_id: 'ECONOMY:SEGMENT:CASE:KILOWATT_CASE',
        target_key: 'ECONOMIC_SEGMENT:ECONOMY:SEGMENT:CASE:KILOWATT_CASE',
        parent_target_key: 'ECONOMIC_SECTOR:ECONOMY:SECTOR:CASE',
        localized_name: { zh: '千瓦武器箱板块', en: 'Kilowatt Case segment' },
      }),
      itemTarget(),
    ].map(parsePersonalWatchTarget)
    expect(targets).toHaveLength(3)
    expect(targets[1]?.parent_target_key).toBe(targets[0]?.target_key)
    expect(targets.some((target) => target.target_kind === ('MARKET' as never))).toBe(false)
  })

  it.each([
    ['unknown kind', itemTarget({ target_kind: 'COLLECTION' })],
    ['overall market target', categoryTarget({
      target_kind: 'MARKET',
      target_id: 'ECONOMY:MARKET:ALL',
      target_key: 'MARKET:ECONOMY:MARKET:ALL',
    })],
    ['extra field', { ...itemTarget(), unexpected: true }],
    ['control characters', itemTarget({ target_id: ' line\nbreak ', target_key: 'ITEM: line\nbreak ' })],
    ['over-long id', categoryTarget({
      target_id: `CATALOG:${'W'.repeat(600)}`,
      target_key: `CATALOG_CATEGORY:CATALOG:${'W'.repeat(600)}`,
    })],
    ['unnamespaced category id', categoryTarget({ target_id: 'WEAPON', target_key: 'CATALOG_CATEGORY:WEAPON' })],
    ['category carrying a parent', categoryTarget({ parent_target_key: 'CATALOG_CATEGORY:CATALOG:KNIFE' })],
    ['item carrying a parent', itemTarget({ parent_target_key: 'CATALOG_CATEGORY:CATALOG:WEAPON' })],
    ['model without a parent', modelTarget({ parent_target_key: null })],
    ['model parented to a model', modelTarget({ parent_target_key: 'CATALOG_MODEL:CATALOG:MODEL:weapon_m4a1' })],
    ['model parented to a raw url', modelTarget({ parent_target_key: 'https://provider.invalid/x' })],
    ['external media', itemTarget({ image: { status: 'BOUND', src: 'https://provider.invalid/image.png' } })],
    ['raw url as id', modelTarget({
      target_id: 'https://provider.invalid/x',
      target_key: 'CATALOG_MODEL:https://provider.invalid/x',
    })],
    ['mismatched PIT order', itemTarget({
      catalog: { snapshot_id: SNAPSHOT_ID, as_of: '2026-09-06T12:00:00.000000Z', available_at: AVAILABLE_AT },
    })],
    ['unknown image status', itemTarget({ image: { status: 'LOAD_FAILED' } })],
  ])('rejects %s', (_label, candidate) => {
    expect(() => parsePersonalWatchTarget(candidate)).toThrow(PersonalWatchlistCorruptError)
  })
})

describe('personal watchlist migrations', () => {
  it('converts one legal V1 record without changing its fields, PIT or image', () => {
    const legacy = parseLegacyPersonalWatchlistEntry(legacyEntry())
    const [migrated] = migrateLegacyPersonalWatchlist([legacyEntry()])
    expect(migrated?.target_kind).toBe('ITEM')
    expect(migrated?.target_id).toBe(legacy.analysis_unit_id)
    expect(migrated?.target_key).toBe(`ITEM:${legacy.analysis_unit_id}`)
    expect(migrated?.parent_target_key).toBeNull()
    expect(migrated?.added_at).toBe(legacy.added_at)
    expect(migrated).toMatchObject({
      localized_name: legacy.localized_name,
      catalog: legacy.catalog,
      identity: legacy.identity,
      image: legacy.image,
    })
  })

  it('rejects the whole batch when a single legacy record is corrupt', () => {
    expect(() => migrateLegacyPersonalWatchlist([
      legacyEntry(),
      legacyEntry({ image: { status: 'BOUND', src: 'https://provider.invalid/image.png' } }),
    ])).toThrow(PersonalWatchlistCorruptError)
  })

  it('upgrades a stored V1 database to V3 and leaves the legacy store intact', async () => {
    const state = new FakeDatabaseState()
    state.seed('items', 'analysis_unit_id', [legacyEntry()])
    restoreIndexedDb = installFakeIndexedDb(state)

    const targets = await new IndexedDbPersonalWatchlistStore().readAll()

    expect(targets).toHaveLength(1)
    expect(targets[0]).toMatchObject({
      schema_version: 3,
      target_kind: 'ITEM',
      target_key: `ITEM:${UNIT_ID}`,
      catalog: { snapshot_id: SNAPSHOT_ID },
    })
    expect(state.version).toBe(3)
    expect(state.read('items')).toHaveLength(1)
    expect(state.clearedStores).toEqual([])
  })

  it('migrates V2 catalog and economic identities into separate V3 namespaces', () => {
    const migrated = migrateV2PersonalWatchlist([
      legacyV2CategoryTarget(),
      legacyV2ModelTarget(),
      legacyV2CategoryTarget({
        target_id: 'MARKET:CASE',
        target_key: 'SECTOR:MARKET:CASE',
        localized_name: { zh: '箱子板块', en: 'Case sector' },
      }),
      legacyV2ModelTarget({
        target_id: 'MARKET:CASE:KILOWATT_CASE',
        target_key: 'SEGMENT:MARKET:CASE:KILOWATT_CASE',
        parent_target_key: 'SECTOR:MARKET:CASE',
        localized_name: { zh: '千瓦武器箱板块', en: 'Kilowatt Case segment' },
      }),
    ])
    expect(migrated.map((target) => target.target_kind)).toEqual([
      'CATALOG_CATEGORY',
      'CATALOG_MODEL',
      'ECONOMIC_SECTOR',
      'ECONOMIC_SEGMENT',
    ])
    expect(migrated[3]).toMatchObject({
      target_id: 'ECONOMY:SEGMENT:CASE:KILOWATT_CASE',
      parent_target_key: 'ECONOMIC_SECTOR:ECONOMY:SECTOR:CASE',
    })
  })

  it('upgrades a stored V2 database atomically and preserves every valid target', async () => {
    const state = new FakeDatabaseState()
    state.seed('targets', 'target_key', [legacyV2CategoryTarget(), legacyV2ModelTarget()])
    state.version = 2
    restoreIndexedDb = installFakeIndexedDb(state)

    const targets = await new IndexedDbPersonalWatchlistStore().readAll()

    expect(targets.map((target) => target.target_kind).sort()).toEqual([
      'CATALOG_CATEGORY',
      'CATALOG_MODEL',
    ])
    expect(state.version).toBe(3)
    expect(state.clearedStores).toEqual(['targets'])
    expect(state.read('targets')).toHaveLength(2)
  })

  it('aborts the whole upgrade on a corrupt legacy record and never clears the old store', async () => {
    const state = new FakeDatabaseState()
    state.seed('items', 'analysis_unit_id', [
      legacyEntry(),
      legacyEntry({ analysis_unit_id: 'item:two', image: { status: 'LOAD_FAILED' } }),
    ])
    restoreIndexedDb = installFakeIndexedDb(state)

    await expect(new IndexedDbPersonalWatchlistStore().readAll())
      .rejects.toBeInstanceOf(PersonalWatchlistCorruptError)

    expect(state.read('items')).toHaveLength(2)
    expect(state.clearedStores).toEqual([])
    expect(state.deletedKeys).toEqual([])
    // No half-migrated V3 store is left behind.
    expect(state.stores.has('targets')).toBe(false)
    expect(state.version).toBe(1)
  })
})

describe('personal watchlist transfer', () => {
  it('converts a strict V1 export in memory and round-trips a V3 export', () => {
    const v1Envelope = JSON.stringify({
      format: 'cs2-rotate-personal-watchlist',
      version: 1,
      exported_at: '2026-09-05T14:00:00.000Z',
      entries: [legacyEntry()],
    })
    const fromV1 = parsePersonalWatchlistImport(v1Envelope)
    expect(fromV1).toHaveLength(1)
    expect(fromV1[0]).toMatchObject({ schema_version: 3, target_key: `ITEM:${UNIT_ID}` })

    const mixed = [itemTarget(), categoryTarget(), modelTarget()].map(parsePersonalWatchTarget)
    const roundTripped = parsePersonalWatchlistImport(
      serializePersonalWatchlist(mixed, '2026-09-05T14:00:00.000Z'),
    )
    expect(roundTripped).toEqual(mixed)
  })

  it('converts a strict V2 export in memory before accepting it', () => {
    const imported = parsePersonalWatchlistImport(JSON.stringify({
      format: 'cs2-rotate-personal-watchlist',
      version: 2,
      exported_at: '2026-09-05T14:00:00.000Z',
      entries: [legacyV2CategoryTarget(), legacyV2ModelTarget()],
    }))
    expect(imported.map((target) => target.target_kind)).toEqual([
      'CATALOG_CATEGORY',
      'CATALOG_MODEL',
    ])
  })

  it('exports and imports every target without a product-level count limit', () => {
    const targets: PersonalWatchTarget[] = Array.from({ length: 240 }, (_, index) =>
      parsePersonalWatchTarget(itemTarget({
        target_id: `item:${index}`,
        target_key: `ITEM:item:${index}`,
      })))
    const imported = parsePersonalWatchlistImport(
      serializePersonalWatchlist(targets, '2026-09-05T14:00:00.000Z'),
    )
    expect(imported).toHaveLength(240)
    expect(imported[239]?.target_id).toBe('item:239')
  })

  it('writes nothing when one record in the import is duplicated, corrupt or unparsable', () => {
    const duplicate = JSON.stringify({
      format: 'cs2-rotate-personal-watchlist',
      version: 2,
      exported_at: '2026-09-05T14:00:00.000Z',
      entries: [modelTarget(), modelTarget()],
    })
    expect(() => parsePersonalWatchlistImport(duplicate)).toThrow(PersonalWatchlistCorruptError)

    const corruptMember = JSON.stringify({
      format: 'cs2-rotate-personal-watchlist',
      version: 3,
      exported_at: '2026-09-05T14:00:00.000Z',
      entries: [categoryTarget(), modelTarget({ parent_target_key: null })],
    })
    expect(() => parsePersonalWatchlistImport(corruptMember)).toThrow(PersonalWatchlistCorruptError)

    expect(() => parsePersonalWatchlistImport('{broken')).toThrow(PersonalWatchlistCorruptError)
    expect(() => parsePersonalWatchlistImport(JSON.stringify({
      format: 'cs2-rotate-personal-watchlist',
      version: 4,
      exported_at: '2026-09-05T14:00:00.000Z',
      entries: [],
    }))).toThrow(PersonalWatchlistCorruptError)
  })
})

describe('personal watchlist item candidates', () => {
  it('derives a saved candidate only from a matching displayed row and sealed catalog context', () => {
    const row: CatalogProjectionRow = {
      item_kind: ItemKind.WEAPON,
      base_item_code: 'weapon.ak47.redline',
      analysis_unit_id: UNIT_ID,
      edition_kind: EditionKind.STATTRAK,
      wear_tier: WearTier.FIELD_TESTED,
    }
    const item: CatalogDisplayItemView = {
      analysis_unit_id: row.analysis_unit_id,
      parent_analysis_unit_id: null,
      display_name: { zh: 'AK-47 | 红线（久经沙场）', en: 'AK-47 | Redline (Field-Tested)' },
      name_authority: 'VALVE_STEAM',
      image: bindItemImageUrl('/media/catalog/v1/105/bWVkaWEta2V5'),
      valid_from: AS_OF,
      valid_to: null,
      available_at: AVAILABLE_AT,
      catalog_version: 'catalog-v1',
      projection_hash: 'b'.repeat(64),
    }
    const context: CatalogPitContext = {
      data_environment: 'LIVE_PUBLIC',
      channel: 'PUBLIC_REAL_PIT_CATALOG',
      query_as_of: AS_OF,
      query_known_at: AVAILABLE_AT,
      snapshot: {
        snapshot_id: SNAPSHOT_ID,
        catalog_version: 'catalog-v1',
        available_at: AVAILABLE_AT,
        member_count: 1,
        member_set_hash: 'c'.repeat(64),
      },
    }
    expect(personalWatchlistItemCandidate(row, item, context)).toMatchObject({
      target_kind: 'ITEM',
      target_id: row.analysis_unit_id,
      target_key: `ITEM:${row.analysis_unit_id}`,
      parent_target_key: null,
      catalog: { snapshot_id: SNAPSHOT_ID, as_of: AS_OF },
      image: { status: 'BOUND' },
    })
    expect(personalWatchlistItemCandidate(row, { ...item, analysis_unit_id: 'item:other' }, context)).toBeNull()
    expect(personalWatchlistItemCandidate(row, item, { ...context, snapshot: null })).toBeNull()
  })
})
