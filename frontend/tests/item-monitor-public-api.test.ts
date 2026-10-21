import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import resultFixture from '../../schemas/examples/single-item-monitor-public-api/v1/result.json'
import initialEmptyFixture from '../../schemas/examples/single-item-monitor-public-api/v1/initial-empty.json'
import measuredEmptyFixture from '../../schemas/examples/single-item-monitor-public-api/v1/measured-empty.json'
import withdrawnFixture from '../../schemas/examples/single-item-monitor-public-api/v1/withdrawn.json'
import { HttpItemMonitorPublicGateway } from '../src/api/HttpItemMonitorPublicGateway'
import { ItemMonitorPublicApi } from '../src/api/ItemMonitorPublicApi'
import { decodeItemMonitorDocument, ItemMonitorValidationError } from '../src/wire/itemMonitorPublicApiDecode'

const PUBLICATION = resultFixture.publication.publication_id
const TOKEN = resultFixture.members[0].analysis_unit_token

describe('single-item-monitor-public-api/v1 frontend boundary', () => {
  it.each([resultFixture, initialEmptyFixture, measuredEmptyFixture])('accepts shared success fixtures and seals them', (fixture) => {
    const document = decodeItemMonitorDocument(fixture, {
      kind: 'LIST', query: { publication_id: null, page_size: 50, cursor: null, sort: 'SIGNAL_TIME_DESC' },
    }, 200)
    expect(Object.isFrozen(document)).toBe(true)
    expect(document.response_kind).toBe(fixture.response_kind)
  })

  it('accepts the shared withdrawal error only with its exact HTTP status', () => {
    expect(decodeItemMonitorDocument(withdrawnFixture, {
      kind: 'LIST', query: { publication_id: PUBLICATION, page_size: 50, cursor: null, sort: 'SIGNAL_TIME_DESC' },
    }, 410).response_kind).toBe('ERROR')
    expect(() => decodeItemMonitorDocument(withdrawnFixture, {
      kind: 'LIST', query: { publication_id: PUBLICATION, page_size: 50, cursor: null, sort: 'SIGNAL_TIME_DESC' },
    }, 200)).toThrow(ItemMonitorValidationError)
  })

  it.each([
    ['formal-state', (value: Record<string, unknown>) => { value.formal_state = 'BUY' }],
    ['wrong-disclosure', (value: Record<string, unknown>) => { value.efficacy_status = 'VALIDATED' }],
    ['wrong-token', (value: Record<string, unknown>) => { (value.members as Record<string, unknown>[])[0].analysis_unit_token = 'x'.repeat(64) }],
  ])('rejects %s instead of rendering it', (_name, mutate) => {
    const value = structuredClone(resultFixture) as unknown as Record<string, unknown>
    mutate(value)
    expect(() => decodeItemMonitorDocument(value, {
      kind: 'LIST', query: { publication_id: null, page_size: 50, cursor: null, sort: 'SIGNAL_TIME_DESC' },
    }, 200)).toThrow(ItemMonitorValidationError)
  })

  it('builds bounded same-origin list, continuation and detail requests', async () => {
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(initialEmptyFixture), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }))
    const gateway = new HttpItemMonitorPublicGateway({ fetcher: fetchSpy as unknown as typeof fetch })
    await gateway.read({ kind: 'LIST', query: { publication_id: null, page_size: 50, cursor: null, sort: 'SIGNAL_TIME_DESC' } })
    await gateway.read({ kind: 'LIST', query: { publication_id: PUBLICATION, page_size: 50, cursor: 'next_page', sort: 'SIGNAL_TIME_DESC' } })
    await gateway.read({ kind: 'DETAIL', query: { publication_id: PUBLICATION, analysis_unit_token: TOKEN } })
    const requests = fetchSpy.mock.calls.map(([input, init]) => [String(input), init] as const)
    expect(requests.map(([input]) => input)).toEqual([
      '/api/v1/item-monitor/public?page_size=50&sort=SIGNAL_TIME_DESC',
      `/api/v1/item-monitor/public?publication=${PUBLICATION}&page_size=50&sort=SIGNAL_TIME_DESC&cursor=next_page`,
      `/api/v1/item-monitor/public/${TOKEN}?publication=${PUBLICATION}`,
    ])
    for (const [, init] of requests) {
      expect(init).toMatchObject({ credentials: 'same-origin', cache: 'no-store', redirect: 'error' })
    }
  })

  it('requires exact publication binding for continuations and details', async () => {
    const api = new ItemMonitorPublicApi({ kind: 'NEVER', read: vi.fn() })
    await expect(api.list({ publication_id: null, page_size: 50, cursor: 'next_page', sort: 'SIGNAL_TIME_DESC' })).rejects.toThrow(TypeError)
    await expect(api.detail({ publication_id: 'bad', analysis_unit_token: TOKEN })).rejects.toThrow(TypeError)
  })

  it('pins the generated validator to the shared schema', () => {
    const schema = readFileSync(resolve(import.meta.dirname, '../../schemas/single-item-monitor-public-api.v1.schema.json'), 'utf8').replace(/\r\n?/gu, '\n')
    const generated = readFileSync(resolve(import.meta.dirname, '../src/wire/generated/singleItemMonitorPublicApiValidator.js'), 'utf8')
    expect(JSON.parse(schema).$id).toBe('urn:cs2-research:single-item-monitor-public-api:v1')
    expect(generated).toContain('single-item-monitor-public-api.v1.schema.json')
    expect(generated).not.toMatch(/\brequire\s*\(|\bnew\s+Function\b|\beval\s*\(/u)
  })
})
