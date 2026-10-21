import { describe, expect, it } from 'vitest'
import { samePublication } from '../src/pages/PublicItemCurrentPage'
import type { ItemCurrentSuccess } from '../src/wire/itemCurrentPublicApiTypes'


function page(evaluatedAt: string): ItemCurrentSuccess {
  return {
    publication: {
      publication_id: 'a'.repeat(64),
      manifest_sha256: 'b'.repeat(64),
      rights_revision: 'c'.repeat(64),
    },
    snapshot: {
      input_head_sha256: 'd'.repeat(64),
      catalog_snapshot_id: 'e'.repeat(64),
    },
    release: {
      policy_sha256: 'f'.repeat(64),
      public_stage_count: 1112,
    },
    freshness: {
      evaluated_at: evaluatedAt,
    },
  } as unknown as ItemCurrentSuccess
}

describe('current item pagination identity', () => {
  it('accepts a later per-response freshness evaluation for the same publication', () => {
    expect(samePublication(
      page('2026-09-21T20:34:29.336874Z'),
      page('2026-09-21T20:34:31.176024Z'),
    )).toBe(true)
  })

  it('continues to reject changes to immutable publication and snapshot identity', () => {
    const original = page('2026-09-21T20:34:29.336874Z')

    expect(samePublication(original, {
      ...original,
      publication: { ...original.publication, publication_id: '0'.repeat(64) },
    })).toBe(false)
    expect(samePublication(original, {
      ...original,
      publication: { ...original.publication, manifest_sha256: '1'.repeat(64) },
    })).toBe(false)
    expect(samePublication(original, {
      ...original,
      publication: { ...original.publication, rights_revision: '2'.repeat(64) },
    })).toBe(false)
    expect(samePublication(original, {
      ...original,
      snapshot: { ...original.snapshot, input_head_sha256: '3'.repeat(64) },
    })).toBe(false)
    expect(samePublication(original, {
      ...original,
      snapshot: { ...original.snapshot, catalog_snapshot_id: '4'.repeat(64) },
    })).toBe(false)
    expect(samePublication(original, {
      ...original,
      release: { ...original.release, policy_sha256: '5'.repeat(64) },
    })).toBe(false)
    expect(samePublication(original, {
      ...original,
      release: { ...original.release, public_stage_count: 1113 },
    })).toBe(false)
  })
})
