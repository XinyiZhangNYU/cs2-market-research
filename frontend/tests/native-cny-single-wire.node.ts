// Standalone, bounded Node suite: no Vitest/app boot, network, DB or runtime-copy.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HttpNativeCnySingleGateway, NativeCnySingleHttpError } from '../src/api/HttpNativeCnySingleGateway'
import { BoundedJsonFetchError } from '../src/api/boundedJsonFetch'
import { decodeNativeCnySingleDay, NativeCnySingleDecodeError, NATIVE_CNY_SINGLE_HOURLY_POLICY,
  NATIVE_CNY_SINGLE_PROTOCOL_SHA256, parseNativeCnySingleJson } from '../src/wire/nativeCnySingleDecode'
import type { NativeCnySingleBinding } from '../src/wire/nativeCnySingleDecode'

const pin = (digit: string) => digit.repeat(64)
const ITEM = '9007199254740993'
const expected = (itemId = ITEM): NativeCnySingleBinding => ({ itemId, publicationId: pin('a'),
  publicSha256: pin('b'), rightsSha256: pin('c'), reviewSha256: pin('d'), catalogPublicationId: pin('e'), day: '2026-10-03' })

function fixture(itemId = ITEM) {
  return { api_contract: 'native-cny-single-day/1', publication_id: pin('a'), public_sha256: pin('b'),
    rights_sha256: pin('c'), review_sha256: pin('d'), released_at: '2026-10-04T02:00:00+00:00',
    data: { schema: 'native-cny-single-public-day/1', basis: 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1',
      currency: 'CNY', fx_applied: false, method: 'CLAUDE_SEED_V2_HH55_X3', protocol_sha256: NATIVE_CNY_SINGLE_PROTOCOL_SHA256,
      hourly_policy: NATIVE_CNY_SINGLE_HOURLY_POLICY, day: '2026-10-03', daily_origin: 'MEASURED_HOURLY_GRID',
      computed_at: '2026-10-04T01:00:00.000002+00:00', first_available_at: '2026-10-04T01:00:00.000001Z',
      knowledge_mode: 'RETROSPECTIVE_LATE_BOUND', catalog_publication_id: pin('e'), prospective_validation_credit: false,
      features: [{ item_id: BigInt(itemId), analysis_unit_id: `item:${itemId}`, stage: null,
        signals: { SUPPLY_LEAD: 'TRUE', RECENT_PERSISTENT: 'FALSE', COINCIDENT: 'UNKNOWN' },
        dispositions: { SUPPLY_LEAD: 'FIRST_ENTRY', RECENT_PERSISTENT: 'FALSE', COINCIDENT: 'UNKNOWN' },
        first_available_at: '2026-10-04T01:00:00Z', history_state: 'EXACT_BOUND', baseline_month: '2026-09',
        qualified_baseline_days: 30n, current_qualified: true, recent_complete: true, reference_complete: false }],
      triggers: [{ trigger_id: pin('f'), item_id: BigInt(itemId), family: 'SUPPLY_LEAD', entry_kind: 'FIRST_ENTRY',
        onset_day: '2026-10-03', computed_at: '2026-10-04T01:00:00.000002+00:00', first_available_at: '2026-10-04T01:00:00Z',
        knowledge_mode: 'RETROSPECTIVE_LATE_BOUND', public_label: '历史重建' as string | null }],
    } }
}

// Generate actual unquoted JSON integer tokens from BigInt, never a Number ID.
function raw(value: unknown): string {
  return JSON.stringify(value, (_key, entry: unknown) => typeof entry === 'bigint' ? `~native-int:${entry}` : entry)
    .replace(/"~native-int:(-?[0-9]+)"/gu, '$1')
}
const decode = (document = fixture(), binding = expected()) => decodeNativeCnySingleDay(parseNativeCnySingleJson(raw(document)), binding)
const jsonResponse = (body: string, status = 200) => new Response(body, { status, headers: { 'content-type': 'application/json; charset=utf-8' } })
const fakeFetch = (response: () => Response | Promise<Response>): typeof fetch => async () => response()

describe('native CNY single lossless decoder', () => {
  for (const itemId of [ITEM, '9223372036854775807', '0']) {
    it(`preserves unquoted item ${itemId}, HH55/X3 and retrospective semantics`, () => {
      const document = fixture(itemId)
      assert.ok(raw(document).includes(`"item_id":${itemId}`))
      const result = decode(document, expected(itemId))
      assert.equal(result.data.features[0].item_id, itemId)
      assert.equal(result.data.triggers[0].item_id, itemId)
      assert.equal(result.data.features[0].analysis_unit_id, `item:${itemId}`)
      assert.equal(result.data.features[0].stage, null)
      assert.equal(result.data.features[0].qualified_baseline_days, 30)
      assert.equal(result.data.knowledge_mode, 'RETROSPECTIVE_LATE_BOUND')
      assert.equal(result.data.prospective_validation_credit, false)
      assert.equal(result.data.triggers[0].public_label, '历史重建')
      assert.ok(Object.isFrozen(result.data.features[0].signals))
      assert.ok(Object.isFrozen(result.data.triggers))
      assert.equal(result.public_sha256, expected().publicSha256) // original-day pin, not a detail-body digest
    })
  }
  it('distinguishes adjacent above-safe-integer IDs in feature and expected binding', () => {
    assert.throws(() => decode(fixture(), expected('9007199254740992')), NativeCnySingleDecodeError)
    const document = fixture()
    document.data.features[0].item_id = 9007199254740992n
    document.data.features[0].analysis_unit_id = 'item:9007199254740992'
    assert.throws(() => decode(document), NativeCnySingleDecodeError)
  })
  it('rejects a different trigger item without rounding', () => {
    const document = fixture()
    document.data.triggers[0].item_id = 9007199254740992n
    assert.throws(() => decode(document), NativeCnySingleDecodeError)
  })
  it('refuses a payload already parsed into Number item IDs', () => {
    assert.throws(() => decodeNativeCnySingleDay(JSON.parse(raw(fixture())) as unknown, expected()), NativeCnySingleDecodeError)
  })
  for (const [field, value] of [['currency', 'USD'], ['fx_applied', true], ['stage', 'RISING'],
    ['knowledge_mode', 'PROSPECTIVE'], ['prospective_validation_credit', true], ['method', 'LEGACY_288']] as const) {
    it(`rejects ${field} contract drift`, () => {
      const document = fixture()
      const target = field === 'stage' ? document.data.features[0] : document.data
      ;(target as Record<string, unknown>)[field] = value
      assert.throws(() => decode(document), NativeCnySingleDecodeError)
    })
  }
  for (const field of ['publication_id', 'public_sha256', 'rights_sha256', 'review_sha256'] as const) {
    it(`rejects wrong expected ${field}`, () => {
      const document = fixture()
      document[field] = pin('0')
      assert.throws(() => decode(document), NativeCnySingleDecodeError)
    })
  }
  for (const field of ['catalog_publication_id', 'protocol_sha256', 'hourly_policy', 'day'] as const) {
    it(`rejects wrong ${field}`, () => {
      const document = fixture()
      document.data[field] = field === 'day' ? '2026-10-02' : pin('0')
      assert.throws(() => decode(document), NativeCnySingleDecodeError)
    })
  }
  it('does not fabricate legacy rank, extra fields or multi-item detail', () => {
    const extra = fixture()
    ;(extra.data.features[0] as Record<string, unknown>).rank = 1n
    assert.throws(() => decode(extra), NativeCnySingleDecodeError)
    const multiple = fixture()
    multiple.data.features.push(fixture('1').data.features[0])
    assert.throws(() => decode(multiple), NativeCnySingleDecodeError)
  })
  it('checks exact microsecond order and rejects nonzero sub-microsecond precision', () => {
    const wrongOrder = fixture()
    wrongOrder.data.first_available_at = '2026-10-04T01:00:00.000003Z'
    assert.throws(() => decode(wrongOrder), NativeCnySingleDecodeError)
    const tooPrecise = fixture()
    tooPrecise.released_at = '2026-10-04T02:00:00.0000001Z'
    assert.throws(() => decode(tooPrecise), NativeCnySingleDecodeError)
    const zeroTail = fixture()
    zeroTail.released_at = '2026-10-04T04:00:00.000000000+02:00'
    assert.equal(decode(zeroTail).released_at, zeroTail.released_at)
  })
  it('rejects a local 24:00 year overflow even when its UTC offset rescues the year', () => {
    const document = fixture()
    document.released_at = '9999-12-31T24:00:00+01:00'
    assert.throws(() => decode(document), NativeCnySingleDecodeError)
  })
  it('rejects missing, duplicate, mismatched trigger coverage and invalid signal pairs', () => {
    const missing = fixture()
    missing.data.triggers = []
    assert.throws(() => decode(missing), NativeCnySingleDecodeError)
    const duplicate = fixture()
    duplicate.data.triggers.push({ ...duplicate.data.triggers[0] })
    assert.throws(() => decode(duplicate), NativeCnySingleDecodeError)
    const uncovered = fixture()
    uncovered.data.features[0].signals.COINCIDENT = 'TRUE'
    uncovered.data.features[0].dispositions.COINCIDENT = 'REENTRY'
    assert.throws(() => decode(uncovered), NativeCnySingleDecodeError)
    const invalid = fixture()
    invalid.data.features[0].dispositions.RECENT_PERSISTENT = 'CONTINUATION'
    assert.throws(() => decode(invalid), NativeCnySingleDecodeError)
  })
  it('retains all admitted families and REENTRY rather than a synthetic rank', () => {
    const document = fixture()
    document.data.features[0].signals.COINCIDENT = 'TRUE'
    document.data.features[0].dispositions.COINCIDENT = 'REENTRY'
    document.data.triggers.push({ ...document.data.triggers[0], trigger_id: pin('1'), family: 'COINCIDENT', entry_kind: 'REENTRY', public_label: null })
    const result = decode(document)
    assert.equal(result.data.triggers.length, 2)
    assert.equal(result.data.triggers[1].entry_kind, 'REENTRY')
    assert.equal(result.data.features[0].dispositions.COINCIDENT, 'REENTRY')
  })
  it('rejects out-of-range and string IDs and bounded-count overflow', () => {
    for (const itemId of ['-1', '9223372036854775808']) assert.throws(() => decode(fixture(itemId)), NativeCnySingleDecodeError)
    const document = fixture()
    const parsed = parseNativeCnySingleJson(raw(document)) as { data: { features: Array<Record<string, unknown>> } }
    parsed.data.features[0].item_id = ITEM
    assert.throws(() => decodeNativeCnySingleDay(parsed, expected()), NativeCnySingleDecodeError)
    document.data.features[0].qualified_baseline_days = 366n
    assert.throws(() => decode(document), NativeCnySingleDecodeError)
  })
  it('bounds JSON bytes/depth and rejects duplicate keys, fractions, exponent, BOM and trailing input', () => {
    for (const text of ['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"a":1.0}', '{"a":1e0}',
      '\ufeff{}', '{} {}', '{"a":"\\ud800"}', '['.repeat(66) + '0' + ']'.repeat(66), ' '.repeat(65537)]) {
      assert.throws(() => parseNativeCnySingleJson(text), NativeCnySingleDecodeError)
    }
  })
  it('requires full canonical lexemes, not a regex match before a final newline', () => {
    for (const binding of [{ ...expected(), itemId: `${ITEM}\n` }, { ...expected(), publicSha256: `${pin('b')}\n` },
      { ...expected(), day: '2026-10-03\n' }]) assert.throws(() => decode(fixture(), binding), NativeCnySingleDecodeError)
    const timestamp = fixture()
    timestamp.released_at += '\n'
    assert.throws(() => decode(timestamp), NativeCnySingleDecodeError)
    const month = fixture()
    month.data.features[0].baseline_month += '\n'
    assert.throws(() => decode(month), NativeCnySingleDecodeError)
  })
})

describe('explicit publication-bound single transport with local response substitutes', () => {
  it('requests the selected item/publication without activating an app or using latest', async () => {
    let count = 0
    const fetcher: typeof fetch = async (input, init) => {
      count++
      assert.equal(input, `/api/v1/native-cny/single/day?item=${ITEM}&publication=${pin('a')}`)
      assert.equal(init?.method, 'GET')
      assert.equal(init?.redirect, 'error')
      assert.equal(init?.cache, 'no-store')
      assert.equal(init?.credentials, 'same-origin')
      assert.equal(init?.referrerPolicy, 'no-referrer')
      assert.ok(init?.signal instanceof AbortSignal)
      return jsonResponse(raw(fixture()))
    }
    const result = await new HttpNativeCnySingleGateway({ fetcher }).read(expected())
    assert.equal(result.data.features[0].item_id, ITEM)
    assert.equal(count, 1)
  })
  it('snapshots expected pins before awaiting fetch', async () => {
    const binding = { ...expected() }
    const fetcher = fakeFetch(() => {
      binding.itemId = '1'
      binding.publicSha256 = pin('0')
      return jsonResponse(raw(fixture()))
    })
    assert.equal((await new HttpNativeCnySingleGateway({ fetcher }).read(binding)).data.features[0].item_id, ITEM)
  })
  it('rejects noncanonical/missing expected bindings before calling fetch', async () => {
    let count = 0
    const gateway = new HttpNativeCnySingleGateway({ fetcher: fakeFetch(() => { count++; return jsonResponse(raw(fixture())) }) })
    for (const itemId of ['01', '-1', '9223372036854775808', '9007199254740993.0']) await assert.rejects(gateway.read({ ...expected(), itemId }), NativeCnySingleDecodeError)
    await assert.rejects(gateway.read({ ...expected(), publicSha256: '' }), NativeCnySingleDecodeError)
    await assert.rejects(gateway.read({ ...expected(), day: '2026-02-30' }), NativeCnySingleDecodeError)
    assert.equal(count, 0)
  })
  for (const [status, code] of [[400, 'INVALID_REQUEST'], [404, 'NOT_PUBLISHED'], [503, 'TEMPORARILY_UNAVAILABLE']] as const) {
    it(`preserves HTTP ${status}/${code}, with no fallback`, async () => {
      const gateway = new HttpNativeCnySingleGateway({ fetcher: fakeFetch(() => jsonResponse(JSON.stringify({ api_contract: 'native-cny-single-day/1', error: code }), status)) })
      await assert.rejects(gateway.read(expected()), (error: unknown) => error instanceof NativeCnySingleHttpError && error.httpStatus === status && error.code === code)
    })
  }
  it('rejects wrong HTTP status/error envelope and success on an error status', async () => {
    for (const [status, body] of [[404, '{"api_contract":"native-cny-single-day/1","error":"INVALID_REQUEST"}'],
      [500, '{"api_contract":"native-cny-single-day/1","error":"TEMPORARILY_UNAVAILABLE"}'], [404, raw(fixture())],
      [200, '{"api_contract":"native-cny-single-day/1","error":"NOT_PUBLISHED"}']] as const) {
      const gateway = new HttpNativeCnySingleGateway({ fetcher: fakeFetch(() => jsonResponse(body, status)) })
      await assert.rejects(gateway.read(expected()), NativeCnySingleDecodeError)
    }
  })
  it('enforces JSON media type, 64 KiB bound and parser failure through the shared fetcher', async () => {
    for (const [response, code] of [[new Response(raw(fixture()), { headers: { 'content-type': 'text/html' } }), 'INVALID_CONTENT_TYPE'],
      [jsonResponse(' '.repeat(65537)), 'RESPONSE_TOO_LARGE'], [jsonResponse('{"a":1,"a":2}'), 'INVALID_JSON_RESPONSE']] as const) {
      const gateway = new HttpNativeCnySingleGateway({ fetcher: fakeFetch(() => response) })
      await assert.rejects(gateway.read(expected()), (error: unknown) => error instanceof BoundedJsonFetchError && error.code === code)
    }
  })
  it('preserves local network rejection and caller cancellation without retry', async () => {
    const unavailable = new HttpNativeCnySingleGateway({ fetcher: async () => { throw new TypeError('synthetic fetch failure') } })
    await assert.rejects(unavailable.read(expected()), (error: unknown) => error instanceof BoundedJsonFetchError && error.code === 'NETWORK_UNAVAILABLE')
    const controller = new AbortController()
    const reason = new Error('synthetic caller abort')
    controller.abort(reason)
    let count = 0
    const gateway = new HttpNativeCnySingleGateway({ fetcher: fakeFetch(() => { count++; return jsonResponse(raw(fixture())) }) })
    await assert.rejects(gateway.read(expected(), { signal: controller.signal }), (error: unknown) => error === reason)
    assert.equal(count, 0)
  })
})
