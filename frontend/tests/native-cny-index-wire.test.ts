import { describe, expect, it, vi } from 'vitest'
import { BoundedJsonFetchError } from '../src/api/boundedJsonFetch'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import {
  decodeNativeCnyIndexResponse,
  snapshotNativeCnyIndexRequest,
  NativeCnyIndexWireError,
  type NativeCnyIndexDayRequest,
  type NativeCnyIndexHistoryRequest,
  type NativeCnyIndexRequest,
} from '../src/wire/nativeCnyIndexPublicApi'

const SPEC = 'd'.repeat(64)
const PUB = 'a'.repeat(64)
const SECOND_PUB = 'b'.repeat(64)
const FOURTH_PUB = 'c'.repeat(64)
const SCOPE = 'WEAPON:AK47'
const DAY = '2026-10-01'

function dayTarget(): NativeCnyIndexDayRequest {
  return { kind: 'DAY', publication_id: PUB, spec_sha256: SPEC, scope_code: SCOPE, bucket_date: DAY }
}
function historyTarget(): NativeCnyIndexHistoryRequest {
  return { kind: 'HISTORY', spec_sha256: SPEC, scope_code: SCOPE, start_date: DAY, end_date: '2026-10-04',
    publication_pins: [
      { bucket_date: DAY, publication_id: PUB },
      { bucket_date: '2026-10-02', publication_id: SECOND_PUB },
      { bucket_date: '2026-10-04', publication_id: FOURTH_PUB },
    ] }
}
// Fresh objects on every call; no backend/provider import or author fixture.
function dayDocument(bucket_date = DAY, publication_id = PUB) {
  return { publication_id, public_sha256: 'e'.repeat(64), rights_sha256: 'f'.repeat(64), review_sha256: '0'.repeat(64),
    released_at: '2026-10-04T01:02:03.123456+00:00',
    data: { schema: 'native-cny-index-public-day/1', basis: 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1',
      method: 'ROBUST_EQUAL_NATIVE_CNY_EXACT_V1', currency: 'CNY', fx_applied: false, price_unit: 'CNY_MAJOR',
      numeric_semantics: 'EXACT_PRIVATE_CALCULATION_DISPLAY_ONLY_ROUNDING', bucket_date,
      measured_at: '2026-10-04T00:05:00Z', spec_sha256: SPEC,
      availability: 'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND',
      points: [{ scope_code: SCOPE, expected_member_count: 120, paired_member_count: 100,
        qualified_member_count: 99, rejected_return_domain_count: 1, absolute_price_qualified_member_count: 110,
        grade_counts: { A: 90, B: 3, C: 3, D: 3, E: 20 }, source_pair_counts: { '7->7': 100 },
        warnings: [] as string[], absolute_price_semantic: 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE',
        period_return_display: '0.02000000' as string | null, index_display: '102.00000000' as string | null,
        segment_number: 7, price_quality: 'HIGH', return_quality: 'HIGH',
        state: 'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN', effective_estimator: 'RAW_EQUAL_ADMITTED_NO_WINSOR' as string | null,
        ask_sum_cny_display: '123456789012345678901234567890.12345678' as string | null,
        ask_median_cny_display: '0.12345679' as string | null }] } }
}
function historyDocument() {
  const first = dayDocument()
  const second = dayDocument('2026-10-02', SECOND_PUB)
  const fourth = dayDocument('2026-10-04', FOURTH_PUB)
  Object.assign(second.data.points[0], { index_display: null, period_return_display: null,
    ask_sum_cny_display: null, ask_median_cny_display: null,
    state: 'BELOW_MINIMUM_INTERPRETABLE_COVERAGE', price_quality: 'UNAVAILABLE', return_quality: 'UNAVAILABLE' })
  Object.assign(fourth.data.points[0], { period_return_display: null, segment_number: 8,
    state: 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN' })
  return { api_contract: 'native-cny-index-history/1', spec_sha256: SPEC, scope: SCOPE,
    start_date: DAY, end_date: '2026-10-04', currency: 'CNY', fx_applied: false,
    days: [first, second, fourth], missing_publication_dates: ['2026-10-03'],
    missing_prices_filled: false, calculation_revisions_mixed: false }
}
function jsonResponse(document: unknown, status = 200): Response {
  return new Response(JSON.stringify(document), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
function transport(response: Response) {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response)
  return { fetcher, gateway: new HttpNativeCnyIndexPublicGateway({ fetcher, timeoutMs: 1000 }) }
}

describe('backend timestamp and whole-token compatibility', () => {
  it.each(['2026-10-04T08:05:00+08:00', '2026-10-04t00:05:00Z',
    '2026-10-04 00:05:00,000000Z', '2026-10-03T24:00:00Z'])(
    'keeps valid backend measured_at without canonicalizing its lexeme: %s', (instant) => {
      const doc = dayDocument(); doc.data.measured_at = instant
      const result = decodeNativeCnyIndexResponse(doc, 200, dayTarget())
      if (result.kind !== 'DAY') throw new Error('Expected day')
      expect(result.day.data.measured_at).toBe(instant)
    },
  )
  it.each(['publication_id', 'spec_sha256', 'scope_code'] as const)(
    'rejects a target token followed by LF before transport: %s', (field) => {
      const target = dayTarget()
      const request = { ...target, [field]: `${target[field]}\n` }
      expect(() => snapshotNativeCnyIndexRequest(request)).toThrow('INVALID_REQUEST_TARGET')
    },
  )
  it.each(['display', 'source_pair', 'response_hash'] as const)('rejects complete response token drift: %s', (field) => {
    const doc = dayDocument()
    if (field === 'display') doc.data.points[0].index_display += '\n'
    if (field === 'source_pair') doc.data.points[0].source_pair_counts = { '7->7\n': 100 } as unknown as { '7->7': number }
    if (field === 'response_hash') doc.rights_sha256 += '\n'
    expect(() => decodeNativeCnyIndexResponse(doc, 200, dayTarget())).toThrow(NativeCnyIndexWireError)
  })
})

describe('explicit native CNY index targets', () => {
  it('has no constructor fetch effect, and sends only the native day query', async () => {
    const { gateway, fetcher } = transport(jsonResponse(dayDocument()))
    expect(fetcher).not.toHaveBeenCalled()
    const result = await gateway.read(dayTarget())
    expect(result.kind).toBe('DAY')
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [input, init] = fetcher.mock.calls[0]
    const url = new URL(String(input), 'https://synthetic.invalid')
    expect(url.pathname).toBe('/api/v1/native-cny/index/day')
    expect([...url.searchParams]).toEqual([['publication', PUB], ['scope', SCOPE]])
    expect(init).toMatchObject({ method: 'GET', cache: 'no-store', credentials: 'same-origin',
      redirect: 'error', referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' } })
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('pins history publication identities locally, without adding unsupported query keys', async () => {
    const { gateway, fetcher } = transport(jsonResponse(historyDocument()))
    const result = await gateway.read(historyTarget())
    expect(result.kind).toBe('HISTORY')
    expect(fetcher).toHaveBeenCalledTimes(1)
    const url = new URL(String(fetcher.mock.calls[0][0]), 'https://synthetic.invalid')
    expect(url.pathname).toBe('/api/v1/native-cny/index/history')
    expect([...url.searchParams]).toEqual([['spec', SPEC], ['start', DAY], ['end', '2026-10-04'], ['scope', SCOPE]])
  })

  it.each([
    { ...dayTarget(), publication_id: null },
    { ...dayTarget(), publication_id: 'A'.repeat(64) },
    { ...dayTarget(), spec_sha256: null },
    { ...dayTarget(), scope_code: 'ALL&publication=latest' },
    { ...dayTarget(), bucket_date: '2026-02-30' },
    { ...dayTarget(), bucket_date: '0000-01-01' },
    { ...dayTarget(), latest: true },
    { ...historyTarget(), publication_pins: undefined },
    { ...historyTarget(), publication_pins: new Array(1) },
    { ...historyTarget(), start_date: '2026-10-05' },
    { ...historyTarget(), start_date: '2010-01-01', end_date: '2026-10-04' },
    { ...historyTarget(), publication_pins: [...historyTarget().publication_pins].reverse() },
    { ...historyTarget(), publication_pins: [historyTarget().publication_pins[0], historyTarget().publication_pins[0]] },
    { ...historyTarget(), publication_pins: [{ bucket_date: '2026-10-05', publication_id: PUB }] },
  ])('rejects malformed or unpinned targets before fetching: %#', async (request) => {
    const { gateway, fetcher } = transport(jsonResponse(dayDocument()))
    await expect(gateway.read(request as unknown as NativeCnyIndexRequest)).rejects.toMatchObject({ code: 'INVALID_REQUEST_TARGET' })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('snapshots caller-owned day and nested history pins before awaiting fetch', async () => {
    const request = { ...dayTarget() }
    const { gateway } = transport(jsonResponse(dayDocument()))
    const pending = gateway.read(request)
    request.publication_id = SECOND_PUB
    expect((await pending).kind).toBe('DAY')

    const original = historyTarget()
    const historyRequest = { ...original, publication_pins: original.publication_pins.map((pin) => ({ ...pin })) }
    const { gateway: historyGateway } = transport(jsonResponse(historyDocument()))
    const historyPending = historyGateway.read(historyRequest)
    historyRequest.publication_pins[0].publication_id = SECOND_PUB
    historyRequest.publication_pins.pop()
    expect((await historyPending).kind).toBe('HISTORY')
    const snapshot = snapshotNativeCnyIndexRequest(historyTarget())
    expect(Object.isFrozen(snapshot)).toBe(true)
    if (snapshot.kind !== 'HISTORY') throw new Error('Expected history snapshot')
    expect(Object.isFrozen(snapshot.publication_pins[0])).toBe(true)
  })
})

describe('strict native CNY response decoding', () => {
  it('keeps decimal precision, nullable displays, segment boundaries and missing dates without filling or FX', () => {
    const source = historyDocument()
    const decoded = decodeNativeCnyIndexResponse(source, 200, historyTarget())
    if (decoded.kind !== 'HISTORY') throw new Error('Expected history')
    const history = decoded.history
    expect(history.days.map((day) => day.data.bucket_date)).toEqual([DAY, '2026-10-02', '2026-10-04'])
    expect(history.missing_publication_dates).toEqual(['2026-10-03'])
    expect(history.days.map((day) => day.data.points[0].segment_number)).toEqual([7, 7, 8])
    expect(history.days.map((day) => day.data.points[0].period_return_display)).toEqual(['0.02000000', null, null])
    expect(history.days[0].data.points[0].ask_sum_cny_display).toBe('123456789012345678901234567890.12345678')
    expect(history.days[1].data.points[0].index_display).toBeNull()
    expect(history.days[1].data.points[0].ask_median_cny_display).toBeNull()
    expect(history.days[2].data.points[0]).not.toHaveProperty('connect_to_previous')
    expect(history).toMatchObject({ currency: 'CNY', fx_applied: false, missing_prices_filled: false, calculation_revisions_mixed: false })
    expect(Object.isFrozen(history.days[0].data.points[0].source_pair_counts)).toBe(true)
    expect(Object.isFrozen(history.missing_publication_dates)).toBe(true)
    source.days[0].data.points[0].segment_number = 999
    expect(history.days[0].data.points[0].segment_number).toBe(7)
  })

  it('preserves unresolved archive origins only under their explicit availability contract', () => {
    const doc = dayDocument()
    Object.assign(doc.data.points[0], { state: 'HISTORY_SCOPE_UNRESOLVED_ORIGINS', segment_number: 0,
      index_display: null, period_return_display: null, effective_estimator: null })
    expect(decodeNativeCnyIndexResponse(doc, 200, dayTarget()).kind).toBe('DAY')
    doc.data.availability = 'CONTEMPORANEOUS_EOD_NOT_ARCHIVE_LAST_OBSERVATION'
    expect(() => decodeNativeCnyIndexResponse(doc, 200, dayTarget())).toThrow(NativeCnyIndexWireError)
  })

  it('accepts the numeric rule of the spec that computed the day, and no other label', () => {
    const doc = dayDocument()
    doc.data.numeric_semantics = 'FIXED_50_SIGNIFICANT_DECIMAL_DIGITS_ROUND_HALF_EVEN_SCALE_STATE_DISPLAY_ROUNDING'
    const decoded = decodeNativeCnyIndexResponse(doc, 200, dayTarget())
    expect(decoded.kind === 'DAY' && decoded.day.data.numeric_semantics).toBe(doc.data.numeric_semantics)
    doc.data.numeric_semantics = 'FIXED_50_SIGNIFICANT_DECIMAL_DIGITS_ROUND_HALF_EVEN_SCALE_STATE_DISPLAY_ROUNDING_X'
    expect(() => decodeNativeCnyIndexResponse(doc, 200, dayTarget())).toThrow(NativeCnyIndexWireError)
  })

  it.each(['publication', 'spec', 'scope', 'date'] as const)('rejects a day retargeted by its response: %s', async (field) => {
    const doc = dayDocument()
    if (field === 'publication') doc.publication_id = SECOND_PUB
    if (field === 'spec') doc.data.spec_sha256 = SECOND_PUB
    if (field === 'scope') doc.data.points[0].scope_code = 'ALL'
    if (field === 'date') doc.data.bucket_date = '2026-10-02'
    const { gateway, fetcher } = transport(jsonResponse(doc))
    await expect(gateway.read(dayTarget())).rejects.toMatchObject({ code: 'TARGET_MISMATCH' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it.each(['publication', 'spec', 'scope', 'window', 'row_order', 'missing', 'filled', 'mixed', 'sparse_rows', 'sparse_missing'] as const)(
    'rejects history mismatch without learning replacement targets: %s', (field) => {
      const doc = historyDocument()
      if (field === 'publication') doc.days[0].publication_id = SECOND_PUB
      if (field === 'spec') doc.days[1].data.spec_sha256 = SECOND_PUB
      if (field === 'scope') doc.scope = 'ALL'
      if (field === 'window') doc.end_date = '2026-10-05'
      if (field === 'row_order') doc.days.reverse()
      if (field === 'missing') doc.missing_publication_dates = []
      if (field === 'filled') doc.missing_prices_filled = true
      if (field === 'mixed') doc.calculation_revisions_mixed = true
      if (field === 'sparse_rows') doc.days = new Array(3) as ReturnType<typeof dayDocument>[]
      if (field === 'sparse_missing') doc.missing_publication_dates = new Array(1) as string[]
      expect(() => decodeNativeCnyIndexResponse(doc, 200, historyTarget())).toThrow(NativeCnyIndexWireError)
    },
  )

  it.each(['currency', 'fx', 'unit', 'method', 'extra', 'count', 'display', 'pair', 'warning', 'null_segment'] as const)(
    'rejects incompatible or malformed point metadata: %s', (field) => {
      const doc = dayDocument()
      if (field === 'currency') doc.data.currency = 'USD'
      if (field === 'fx') doc.data.fx_applied = true
      if (field === 'unit') doc.data.price_unit = 'CNY_MINOR'
      if (field === 'method') doc.data.method = 'USD_EQUAL_RETURN_V1'
      if (field === 'extra') Object.assign(doc.data.points[0], { member_returns: [] })
      if (field === 'count') doc.data.points[0].expected_member_count = 1.5
      if (field === 'display') doc.data.points[0].index_display = '1e4'
      if (field === 'pair') doc.data.points[0].source_pair_counts = { '0->7': 1 } as unknown as { '7->7': number }
      if (field === 'warning') doc.data.points[0].warnings = ['UNKNOWN']
      if (field === 'null_segment') Object.assign(doc.data.points[0], { segment_number: null })
      expect(() => decodeNativeCnyIndexResponse(doc, 200, dayTarget())).toThrow(NativeCnyIndexWireError)
    },
  )

  it.each([[400, 'INVALID_REQUEST'], [404, 'NOT_PUBLISHED'], [503, 'TEMPORARILY_UNAVAILABLE']] as const)(
    'keeps a native error at HTTP %i without USD fallback/retry', async (status, error) => {
      const { gateway, fetcher } = transport(jsonResponse({ api_contract: 'native-cny-index-day/1', error }, status))
      expect(await gateway.read(historyTarget())).toEqual({ kind: 'ERROR', api_contract: 'native-cny-index-day/1', error, http_status: status })
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(String(fetcher.mock.calls[0][0])).toContain('/native-cny/index/history?')
    },
  )

  it('rejects legacy USD/route-absent/status-swapped bodies instead of using another gateway', async () => {
    for (const response of [
      jsonResponse({ contract_name: 'market-sector-index-public-api', points: [] }),
      jsonResponse({ error: 'route not found' }, 404),
      jsonResponse({ api_contract: 'native-cny-index-day/1', error: 'NOT_PUBLISHED' }, 503),
    ]) {
      const { gateway, fetcher } = transport(response)
      await expect(gateway.read(dayTarget())).rejects.toBeInstanceOf(NativeCnyIndexWireError)
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
  })
})

describe('bounded synthetic transport only', () => {
  it.each(['duplicate', 'escaped_duplicate', 'float_token', 'unsafe_integer', 'nonfinite', 'bom'] as const)(
    'uses the strict parser under the shared bounded fetch: %s', async (kind) => {
      let body = JSON.stringify(dayDocument())
      if (kind === 'duplicate') body = body.replace('"fx_applied":false', '"fx_applied":true,"fx_applied":false')
      if (kind === 'escaped_duplicate') body = body.replace('"fx_applied":false', '"fx_applied":true,"\\u0066x_applied":false')
      if (kind === 'float_token') body = body.replace('"segment_number":7', '"segment_number":7.0')
      if (kind === 'unsafe_integer') body = body.replace('"segment_number":7', '"segment_number":9007199254740993')
      if (kind === 'nonfinite') body = body.replace('"segment_number":7', '"segment_number":NaN')
      if (kind === 'bom') body = '\ufeff' + body
      const { gateway, fetcher } = transport(new Response(body, { headers: { 'Content-Type': 'application/json' } }))
      await expect(gateway.read(dayTarget())).rejects.toMatchObject({ code: 'INVALID_JSON_RESPONSE' })
      expect(fetcher).toHaveBeenCalledTimes(1)
    },
  )

  it('rejects invalid UTF-8 and non-JSON content types', async () => {
    const badUtf8 = new Response(new Uint8Array([0xc3, 0x28]), { headers: { 'Content-Type': 'application/json' } })
    await expect(transport(badUtf8).gateway.read(dayTarget())).rejects.toMatchObject({ code: 'INVALID_JSON_RESPONSE' })
    const html = new Response('<html/>', { headers: { 'Content-Type': 'text/html' } })
    await expect(transport(html).gateway.read(dayTarget())).rejects.toMatchObject({ code: 'INVALID_CONTENT_TYPE' })
  })

  it.each(['DAY', 'HISTORY'] as const)('enforces %s body bounds without allocating a large fixture', async (kind) => {
    const limit = (kind === 'DAY' ? 1 : 4) * 1024 * 1024
    const { gateway } = transport(new Response('{}', { headers: { 'Content-Type': 'application/json', 'Content-Length': String(limit + 1) } }))
    await expect(gateway.read(kind === 'DAY' ? dayTarget() : historyTarget())).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' })
  })

  it('keeps network errors and caller cancellation visible with no automatic retry', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('synthetic offline'))
    const gateway = new HttpNativeCnyIndexPublicGateway({ fetcher, timeoutMs: 1000 })
    await expect(gateway.read(dayTarget())).rejects.toBeInstanceOf(BoundedJsonFetchError)
    expect(fetcher).toHaveBeenCalledTimes(1)
    const controller = new AbortController()
    const reason = new Error('synthetic cancellation')
    controller.abort(reason)
    await expect(gateway.read(dayTarget(), { signal: controller.signal })).rejects.toBe(reason)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
