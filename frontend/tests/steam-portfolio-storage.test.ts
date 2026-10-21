import { describe, expect, it } from 'vitest'
import {
  LocalSteamPortfolioStorage,
  SteamPortfolioStorageError,
  parseSavedSteamPortfolio,
} from '../src/steam/steamPortfolioStorage'

const SAVED_AT = '2026-09-18T12:00:00.000Z'

function savedInventory() {
  return {
    schema_version: 1,
    saved_at: SAVED_AT,
    steamid: '76561198000000000',
    truncated: false,
    skipped_unnamed: 0,
    unsupported: 0,
    rows: [{
      quantity: 2,
      target: {
        schema_version: 3,
        target_kind: 'ITEM',
        target_id: 'item:redline-field-tested',
        target_key: 'ITEM:item:redline-field-tested',
        parent_target_key: null,
        added_at: SAVED_AT,
        localized_name: { zh: 'AK-47 | 红线（久经沙场）', en: 'AK-47 | Redline (Field-Tested)' },
        catalog: {
          snapshot_id: 'a'.repeat(64),
          as_of: '2026-09-18T11:00:00.000000Z',
          available_at: '2026-09-18T11:05:00.000000Z',
        },
        identity: {
          item_kind: 'WEAPON',
          base_item_code: 'weapon.ak47.redline',
          edition_kind: 'STANDARD',
          wear_tier: 'FIELD_TESTED',
        },
        image: { status: 'NOT_PRODUCED' },
      },
    }],
  }
}

class MemoryStorage {
  private value: string | null = null

  getItem() {
    return this.value
  }

  setItem(_key: string, value: string) {
    this.value = value
  }

  removeItem() {
    this.value = null
  }

  raw(value: string) {
    this.value = value
  }
}

describe('browser-local Steam portfolio storage', () => {
  it('round-trips a strictly validated inventory and survives a new store instance', () => {
    const storage = new MemoryStorage()
    new LocalSteamPortfolioStorage(storage).write(parseSavedSteamPortfolio(savedInventory()))

    const restored = new LocalSteamPortfolioStorage(storage).read()

    expect(restored).toMatchObject({ steamid: '76561198000000000', saved_at: SAVED_AT })
    expect(restored?.rows[0]).toMatchObject({
      quantity: 2,
      target: { identity: { base_item_code: 'weapon.ak47.redline' } },
    })
  })

  it('rejects corrupted local data instead of rendering or importing it', () => {
    const storage = new MemoryStorage()
    storage.raw(JSON.stringify({ ...savedInventory(), steamid: 'not-a-steamid' }))
    expect(() => new LocalSteamPortfolioStorage(storage).read())
      .toThrow(SteamPortfolioStorageError)

    expect(() => parseSavedSteamPortfolio({
      ...savedInventory(),
      rows: [savedInventory().rows[0], savedInventory().rows[0]],
    })).toThrow(SteamPortfolioStorageError)
  })
})
