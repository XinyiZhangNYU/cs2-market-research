import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { HttpItemHistoryPublicGateway } from '../src/api/HttpItemHistoryPublicGateway'
import { ItemHistoryPublicApi } from '../src/api/ItemHistoryPublicApi'
import { decodeItemHistoryDocument, ItemHistoryValidationError } from '../src/wire/itemHistoryPublicApiDecode'
import { HISTORY_EVENT_TOKEN, HISTORY_PUBLICATION, itemHistoryError, itemHistoryFixture } from './support/itemHistoryFixture'

describe('single-item-history-public-api/v1 frontend boundary', () => {
  it('accepts and seals the bounded retrospective response', () => {
    const document = decodeItemHistoryDocument(itemHistoryFixture(), {
      kind: 'LIST', query: { publication_id: null, page_size: 50, cursor: null, sort: 'MAX_PRICE_MULTIPLE_DESC', name_query: null },
    }, 200)
    expect(Object.isFrozen(document)).toBe(true)
    expect(document.response_kind).toBe('RESULT')
  })

  it.each([
    ['manipulation attribution', (value: any) => { value.members[0].manipulation_label = 'MANIPULATION' }],
    ['economic end claim', (value: any) => { value.members[0].event_end_is_economic_claim = true }],
    ['catalog mismatch', (value: any) => { value.members[0].catalog_snapshot_id = '8'.repeat(64) }],
    ['out-of-window peak', (value: any) => { value.members[0].peak_on = '2026-01-01' }],
  ])('rejects %s instead of rendering it', (_name, mutate) => {
    const value = itemHistoryFixture() as any
    mutate(value)
    expect(() => decodeItemHistoryDocument(value, {
      kind: 'LIST', query: { publication_id: null, page_size: 50, cursor: null, sort: 'MAX_PRICE_MULTIPLE_DESC', name_query: null },
    }, 200)).toThrow(ItemHistoryValidationError)
  })

  it('requires exact HTTP status for fail-closed errors', () => {
    expect(decodeItemHistoryDocument(itemHistoryError('WITHDRAWN'), {
      kind: 'LIST', query: { publication_id: HISTORY_PUBLICATION, page_size: 50, cursor: null, sort: 'MAX_PRICE_MULTIPLE_DESC', name_query: null },
    }, 410).response_kind).toBe('ERROR')
    expect(() => decodeItemHistoryDocument(itemHistoryError('WITHDRAWN'), {
      kind: 'LIST', query: { publication_id: HISTORY_PUBLICATION, page_size: 50, cursor: null, sort: 'MAX_PRICE_MULTIPLE_DESC', name_query: null },
    }, 200)).toThrow(ItemHistoryValidationError)
  })

  it('builds bounded same-origin list, continuation and detail requests', async () => {
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(itemHistoryFixture()), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }))
    const gateway = new HttpItemHistoryPublicGateway({ fetcher: fetchSpy as unknown as typeof fetch })
    await gateway.read({ kind: 'LIST', query: { publication_id: null, page_size: 50, cursor: null, sort: 'MAX_PRICE_MULTIPLE_DESC', name_query: null } })
    await gateway.read({ kind: 'LIST', query: { publication_id: HISTORY_PUBLICATION, page_size: 50, cursor: 'next_page', sort: 'SUPPLY_ONSET_DESC', name_query: null } })
    await gateway.read({ kind: 'DETAIL', query: { publication_id: HISTORY_PUBLICATION, history_event_token: HISTORY_EVENT_TOKEN } })
    const requests = fetchSpy.mock.calls.map(([input, init]) => [String(input), init] as const)
    expect(requests.map(([input]) => input)).toEqual([
      '/api/v1/item-monitor/history?page_size=50&sort=MAX_PRICE_MULTIPLE_DESC',
      `/api/v1/item-monitor/history?publication=${HISTORY_PUBLICATION}&page_size=50&sort=SUPPLY_ONSET_DESC&cursor=next_page`,
      `/api/v1/item-monitor/history/${HISTORY_EVENT_TOKEN}?publication=${HISTORY_PUBLICATION}`,
    ])
    for (const [, init] of requests) expect(init).toMatchObject({ credentials: 'same-origin', cache: 'no-store', redirect: 'error' })
  })

  it('requires publication binding for continuations and details', async () => {
    const api = new ItemHistoryPublicApi({ kind: 'NEVER', read: vi.fn() })
    await expect(api.list({ publication_id: null, page_size: 50, cursor: 'next_page', sort: 'MAX_PRICE_MULTIPLE_DESC', name_query: null })).rejects.toThrow(TypeError)
    await expect(api.detail({ publication_id: 'bad', history_event_token: HISTORY_EVENT_TOKEN })).rejects.toThrow(TypeError)
  })

  it('retries one transient validation failure but remains fail closed after two', async () => {
    const query = {
      publication_id: null, page_size: 50, cursor: null,
      sort: 'MAX_PRICE_MULTIPLE_DESC' as const, name_query: null,
    }
    const corrupt = itemHistoryFixture() as any
    corrupt.members[0].event_end_is_economic_claim = true
    const recoveringRead = vi.fn()
      .mockResolvedValueOnce({ payload: corrupt, httpStatus: 200 })
      .mockResolvedValueOnce({ payload: itemHistoryFixture(), httpStatus: 200 })
    const recovered = await new ItemHistoryPublicApi({ kind: 'RECOVERING', read: recoveringRead }).list(query)
    expect(recovered.response_kind).toBe('RESULT')
    expect(recoveringRead).toHaveBeenCalledTimes(2)

    const brokenRead = vi.fn().mockResolvedValue({ payload: corrupt, httpStatus: 200 })
    await expect(new ItemHistoryPublicApi({ kind: 'BROKEN', read: brokenRead }).list(query))
      .rejects.toThrow(ItemHistoryValidationError)
    expect(brokenRead).toHaveBeenCalledTimes(2)
  })

  it('pins the generated validator to the shared schema', () => {
    const schema = readFileSync(resolve(import.meta.dirname, '../../schemas/single-item-history-public-api.v1.schema.json'), 'utf8').replace(/\r\n?/gu, '\n')
    const generated = readFileSync(resolve(import.meta.dirname, '../src/wire/generated/singleItemHistoryPublicApiValidator.js'), 'utf8')
    expect(JSON.parse(schema).$id).toBe('urn:cs2-research:single-item-history-public-api:v1')
    expect(generated).toContain('single-item-history-public-api.v1.schema.json')
    expect(generated).not.toMatch(/\brequire\s*\(|\bnew\s+Function\b|\beval\s*\(/u)
  })
})
