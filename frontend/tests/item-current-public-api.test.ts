import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { HttpItemCurrentPublicGateway } from '../src/api/HttpItemCurrentPublicGateway'
import { ItemCurrentAvailabilityError, ItemCurrentPublicApi } from '../src/api/ItemCurrentPublicApi'
import { decodeItemCurrentDocument, ItemCurrentValidationError } from '../src/wire/itemCurrentPublicApiDecode'
import { CURRENT_PUBLICATION, CURRENT_STAGE_TOKEN, itemCurrentError, itemCurrentFixture } from './support/itemCurrentFixture'

const listRequest = {
  kind: 'LIST' as const,
  query: { publication_id: null, page_size: 50, cursor: null, sort: 'DETECTED_DESC' as const, name_query: null },
}

describe('single-item-current-public-api/v1 frontend boundary', () => {
  it('accepts and seals a partial-usable point-in-time response', () => {
    const document = decodeItemCurrentDocument(itemCurrentFixture(), listRequest, 200)
    expect(Object.isFrozen(document)).toBe(true)
    expect(document.response_kind).toBe('RESULT')
  })

  it.each([
    ['future peak', (value: any) => { value.members[0].retrospective_peak = '9.00' }],
    ['probability claim', (value: any) => { value.members[0].confidence_is_probability = true }],
    ['coverage relabel', (value: any) => { value.members[0].coverage.quality = 'HIGH_COVERAGE' }],
    ['unpaired timing', (value: any) => { value.members[0].timing_relationship = 'PRICE_LEADS' }],
    ['catalog mismatch', (value: any) => { value.members[0].catalog_snapshot_id = '0'.repeat(64) }],
  ])('rejects %s instead of rendering it', (_name, mutate) => {
    const value = itemCurrentFixture() as any
    mutate(value)
    expect(() => decodeItemCurrentDocument(value, listRequest, 200)).toThrow(ItemCurrentValidationError)
  })

  it('requires exact HTTP status for fail-closed errors', () => {
    expect(decodeItemCurrentDocument(itemCurrentError('WITHDRAWN'), listRequest, 410).response_kind).toBe('ERROR')
    expect(() => decodeItemCurrentDocument(itemCurrentError('WITHDRAWN'), listRequest, 200)).toThrow(ItemCurrentValidationError)
  })

  it('builds bounded same-origin list, continuation and detail requests', async () => {
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(itemCurrentFixture()), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }))
    const gateway = new HttpItemCurrentPublicGateway({ fetcher: fetchSpy as unknown as typeof fetch })
    await gateway.read(listRequest)
    await gateway.read({ kind: 'LIST', query: {
      publication_id: CURRENT_PUBLICATION, page_size: 50, cursor: 'next_page',
      sort: 'SUPPLY_CONTRACTION_DESC', name_query: '迷人眼',
    } })
    await gateway.read({ kind: 'DETAIL', query: { publication_id: CURRENT_PUBLICATION, stage_token: CURRENT_STAGE_TOKEN } })
    const requests = fetchSpy.mock.calls.map(([input, init]) => [String(input), init] as const)
    expect(requests.map(([input]) => input)).toEqual([
      '/api/v1/item-monitor/current?page_size=50&sort=DETECTED_DESC',
      `/api/v1/item-monitor/current?publication=${CURRENT_PUBLICATION}&page_size=50&sort=SUPPLY_CONTRACTION_DESC&name=${encodeURIComponent('迷人眼')}&cursor=next_page`,
      `/api/v1/item-monitor/current/${CURRENT_STAGE_TOKEN}?publication=${CURRENT_PUBLICATION}`,
    ])
    for (const [, init] of requests) expect(init).toMatchObject({ credentials: 'same-origin', cache: 'no-store', redirect: 'error' })
  })

  it('requires publication binding for continuations and details', async () => {
    const api = new ItemCurrentPublicApi({ kind: 'NEVER', read: vi.fn() })
    await expect(api.list({ publication_id: null, page_size: 50, cursor: 'next_page', sort: 'DETECTED_DESC', name_query: null })).rejects.toThrow(TypeError)
    await expect(api.detail({ publication_id: 'bad', stage_token: CURRENT_STAGE_TOKEN })).rejects.toThrow(TypeError)
  })

  it.each([502, 503, 504])('classifies JSON transport_error HTTP %s as availability without validation retry', async (status) => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ transport_error: 'ORIGIN_UNAVAILABLE' }), {
      status, headers: { 'Content-Type': 'application/json' },
    }))
    const api = new ItemCurrentPublicApi(new HttpItemCurrentPublicGateway({ fetcher }))
    await expect(api.list(listRequest.query)).rejects.toMatchObject({
      name: 'ItemCurrentAvailabilityError', httpStatus: status,
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('classifies HTML 502 as availability, while preserving explicit corrupt-publication errors', async () => {
    const unavailable = new ItemCurrentPublicApi(new HttpItemCurrentPublicGateway({
      fetcher: vi.fn(async () => new Response('<html>Bad gateway</html>', {
        status: 502, headers: { 'Content-Type': 'text/html' },
      })),
    }))
    await expect(unavailable.list(listRequest.query)).rejects.toThrow(ItemCurrentAvailabilityError)
    const corrupt = itemCurrentError('TEMPORARILY_UNAVAILABLE') as any
    corrupt.error = { code: 'CORRUPT_PUBLICATION', retryable: false }
    const api = new ItemCurrentPublicApi({ kind: 'CORRUPT', read: vi.fn().mockResolvedValue({ payload: corrupt, httpStatus: 503 }) })
    await expect(api.list(listRequest.query)).resolves.toMatchObject({ error: { code: 'CORRUPT_PUBLICATION' } })
  })

  it('retries one transient validation failure but remains fail closed after two', async () => {
    const corrupt = itemCurrentFixture() as any
    corrupt.members[0].confidence_is_probability = true
    const recoveringRead = vi.fn()
      .mockResolvedValueOnce({ payload: corrupt, httpStatus: 200 })
      .mockResolvedValueOnce({ payload: itemCurrentFixture(), httpStatus: 200 })
    const recovered = await new ItemCurrentPublicApi({ kind: 'RECOVERING', read: recoveringRead }).list(listRequest.query)
    expect(recovered.response_kind).toBe('RESULT')
    expect(recoveringRead).toHaveBeenCalledTimes(2)

    const brokenRead = vi.fn().mockResolvedValue({ payload: corrupt, httpStatus: 200 })
    await expect(new ItemCurrentPublicApi({ kind: 'BROKEN', read: brokenRead }).list(listRequest.query))
      .rejects.toThrow(ItemCurrentValidationError)
    expect(brokenRead).toHaveBeenCalledTimes(2)
  })

  it('pins the generated validator to the shared schema', () => {
    const schema = readFileSync(resolve(import.meta.dirname, '../../schemas/single-item-current-public-api.v1.schema.json'), 'utf8').replace(/\r\n?/gu, '\n')
    const generated = readFileSync(resolve(import.meta.dirname, '../src/wire/generated/singleItemCurrentPublicApiValidator.js'), 'utf8')
    expect(JSON.parse(schema).$id).toBe('urn:cs2-research:single-item-current-public-api:v1')
    expect(generated).toContain('single-item-current-public-api.v1.schema.json')
    expect(generated).not.toMatch(/\brequire\s*\(|\bnew\s+Function\b|\beval\s*\(/u)
  })
})
