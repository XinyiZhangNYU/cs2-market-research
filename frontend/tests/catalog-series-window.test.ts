import { describe, expect, it, vi } from 'vitest'
import fixture from '../../schemas/examples/catalog-display-query-series.valid.json'
import type { CatalogDisplayApi } from '../src/api/CatalogDisplayApi'
import { readCatalogSeriesWindow } from '../src/catalog/readCatalogSeriesWindow'
import type { WireCatalogSeriesResponse } from '../src/wire/catalogDisplayQueryApiTypes'

function page(index: number, last = false): WireCatalogSeriesResponse {
  const response = structuredClone(fixture) as WireCatalogSeriesResponse
  response.members = [structuredClone(response.members[0]!)]
  response.members[0]!.base_item_code = `series:${index}`
  return { ...response, next_cursor: last ? null : `after:${index}`, previous_cursor: index > 0 ? 'previous' : null,
    total_matching_series: 3 }
}

describe('catalog series window', () => {
  it('fetches one prefix, resumes its cursor, and restores it without rereading', async () => {
    const series = vi.fn().mockResolvedValueOnce(page(0)).mockResolvedValueOnce(page(1)).mockResolvedValueOnce(page(2, true))
    const api = { series } as unknown as CatalogDisplayApi
    const cache = new Map<string, WireCatalogSeriesResponse>()
    const signal = new AbortController().signal
    const query = page(0).query
    expect((await readCatalogSeriesWindow(api, query, 1, signal, cache)).members).toHaveLength(1)
    expect(series).toHaveBeenCalledTimes(1)
    expect((await readCatalogSeriesWindow(api, query, 2, signal, cache)).members).toHaveLength(2)
    expect(series.mock.calls[1]![0]).toEqual({ query, cursor: 'after:0' })
    expect((await readCatalogSeriesWindow(api, query, 1, signal, cache)).members).toHaveLength(2)
    expect(series).toHaveBeenCalledTimes(2)
    expect((await readCatalogSeriesWindow(api, query, 99, signal, cache)).members).toHaveLength(3)
    expect(series).toHaveBeenCalledTimes(3)
  })

  it.each(['duplicate', 'snapshot', 'total', 'incomplete', 'cursor', 'order'] as const)('rejects %s corruption across pages', async (corruption) => {
    const first = page(0)
    const second = page(1)
    if (corruption === 'duplicate') second.members[0]!.base_item_code = first.members[0]!.base_item_code
    if (corruption === 'snapshot') second.snapshot = { ...second.snapshot, snapshot_id: 'f'.repeat(64) }
    if (corruption === 'total') second.total_matching_series = 4
    if (corruption === 'incomplete') second.next_cursor = null
    if (corruption === 'cursor') second.next_cursor = first.next_cursor
    if (corruption === 'order') {
      first.query = { ...first.query, sort: 'PRODUCT' }
      second.query = first.query
      second.members[0]!.base_item_code = 'series:-1'
    }
    const series = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    await expect(readCatalogSeriesWindow({ series } as unknown as CatalogDisplayApi, first.query, 2,
      new AbortController().signal, new Map())).rejects.toThrow(TypeError)
  })

  it('can restore a catalog window beyond 100 small pages without truncation', async () => {
    const series = vi.fn().mockImplementation(async (request: { cursor: string | null }) => {
      const index = request.cursor === null ? 0 : Number(request.cursor.slice('after:'.length)) + 1
      return { ...page(index, index === 100), total_matching_series: 101 }
    })
    const result = await readCatalogSeriesWindow({ series } as unknown as CatalogDisplayApi, page(0).query, 101,
      new AbortController().signal, new Map())
    expect(result.members).toHaveLength(101)
    expect(result.next_cursor).toBeNull()
    expect(series).toHaveBeenCalledTimes(101)
  })
})
