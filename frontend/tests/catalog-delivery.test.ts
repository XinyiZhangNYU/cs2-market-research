import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogDisplayApi } from '../src/api/CatalogDisplayApi'

const gate = vi.hoisted(() => {
  let release!: () => void
  const ready = new Promise<void>((resolve) => { release = resolve })
  return { ready, release }
})
vi.mock('../src/wire/catalogDisplayApiDecode', async (actual) => { await gate.ready; return actual() })
vi.mock('../src/wire/catalogDisplaySnapshotApiDecode', async (actual) => { await gate.ready; return actual() })
vi.mock('../src/wire/catalogDisplayQueryApiDecode', async (actual) => { await gate.ready; return actual() })

describe('catalog transport and decoder discovery', () => {
  it('starts each immutable bound request before the cold decoder arrives; invalid data still fails', async () => {
    const seen: object[] = []
    const read = vi.fn((request: object) => { seen.push(request); return Promise.resolve({}) })
    const api = new CatalogDisplayApi({ kind: 'TEST', read, readQuery: read })
    const instant = '2026-10-04T00:00:00Z'
    // The values need not pass decode: the counterexample tests discovery ordering and fail-closed output.
    const query = { as_of: instant, known_at: instant, page_size: 1, sort: 'CANONICAL_ID_ASC' }
    const calls = [
      api.list({ query, cursor: null } as Parameters<CatalogDisplayApi['list']>[0]),
      api.listSnapshots({ query: { query_as_of: instant, known_at: instant, page_size: 1, sort: 'AS_OF_DESC' }, cursor: null }),
      api.bootstrap({ query } as unknown as Parameters<CatalogDisplayApi['bootstrap']>[0]),
    ].map((pending) => pending.then(() => 'UNEXPECTED_SUCCESS', () => 'REJECTED'))
    try {
      await waitFor(() => expect(read).toHaveBeenCalledTimes(3))
      expect(seen.every((request) => Object.isFrozen(request) && Object.isFrozen((request as { query: object }).query))).toBe(true)
    } finally { gate.release() }
    expect(await Promise.all(calls)).toEqual(['REJECTED', 'REJECTED', 'REJECTED'])
    expect(read).toHaveBeenCalledTimes(3)
  })
})
