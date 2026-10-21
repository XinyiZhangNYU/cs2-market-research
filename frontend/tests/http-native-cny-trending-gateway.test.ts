import { describe, expect, it, vi } from 'vitest'
import { canonicalHash } from '../src/wire/canonical'
import { HttpNativeCnyTrendingGateway, decodeNativeCnyTrendingDay,
  type NativeCnyTrendingSelection } from '../src/api/HttpNativeCnyTrendingGateway'

const H = (digit: string) => digit.repeat(64)
function fixture() {
  const data = {
    schema: 'native-cny-trending-public-day/1', basis: 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1',
    currency: 'CNY', fx_applied: false, method: 'TRENDING_NATIVE_CNY_EXACT_ENDPOINTS_V1',
    numeric_semantics: 'EXACT_NATIVE_CNY_RETURN_RATIO', candidate_sha256: H('a'),
    catalog_publication_id: H('b'), start_date: '2026-09-01', end_date: '2026-10-01',
    as_of: '2026-10-02T00:00:00.123456Z', input_available_at: '2026-10-02T00:00:00.123455Z',
    evidence_class: 'HYBRID_BRIDGED', historical_membership_qualified: false,
    members: [
      { rank: 1, direction: 'GAINERS', analysis_unit_id: 'item:9223372036854775807',
        display_name: '普通物品 😀', evidence_grade: 'TWO_SOURCE_SUPPORTED',
        supporting_source_count: 2, return_exact: { numerator_hex: '1', denominator_hex: 'a' },
        conservative_source: 'market_a' },
      { rank: 1, direction: 'LOSERS', analysis_unit_id: 'item:12',
        display_name: '<img src=x onerror=alert(1)>', evidence_grade: 'THREE_SOURCE_CONFIRMED',
        supporting_source_count: 3, return_exact: { numerator_hex: '-1', denominator_hex: '5' },
        conservative_source: 'market_b' },
    ],
  }
  const envelope = { api_contract: 'native-cny-trending-day/1', publication_id: H('1'),
    public_sha256: canonicalHash(data), rights_sha256: H('2'), readiness_review_sha256: H('3'),
    released_at: '2026-10-02T00:00:00.123457Z', data }
  const selection: NativeCnyTrendingSelection = { publicationId: H('1'),
    publicSha256: envelope.public_sha256, rightsSha256: H('2'), readinessReviewSha256: H('3'),
    candidateSha256: H('a'), catalogPublicationId: H('b'), startDate: '2026-09-01',
    endDate: '2026-10-01', knownAt: '2026-10-02T00:00:00.123458Z' }
  return { envelope, selection }
}
function repin(value: ReturnType<typeof fixture>) {
  value.envelope.public_sha256 = canonicalHash(value.envelope.data)
  return { ...value, selection: { ...value.selection, publicSha256: value.envelope.public_sha256 } }
}
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })

describe('backend timestamp and whole-token compatibility', () => {
  it.each(['2026-10-02t08:00:00+08:00', '2026-10-02 00:00:00,000000Z',
    '2026-10-01T24:00:00Z', '2026-10-02T00:00:00.000000000Z'])(
    'retains a valid backend timestamp without rounding or rewriting: %s', (instant) => {
      const value = fixture()
      value.envelope.data.as_of = instant
      value.envelope.data.input_available_at = instant
      const pinned = repin(value)
      expect(decodeNativeCnyTrendingDay(pinned.envelope, pinned.selection).asOf).toBe(instant)
    },
  )
  it.each(['publicationId', 'rightsSha256', 'candidateSha256'] as const)(
    'rejects a hash token followed by LF: %s', (field) => {
      const value = fixture()
      const bad = { ...value.selection, [field]: value.selection[field] + '\n' }
      expect(() => decodeNativeCnyTrendingDay(value.envelope, bad)).toThrow('INVALID_SELECTION')
    },
  )
  it.each(['numerator', 'denominator', 'unit'] as const)('rejects complete-token drift: %s', (field) => {
    const value = fixture(), row = value.envelope.data.members[0]
    if (field === 'numerator') row.return_exact.numerator_hex += '\n'
    if (field === 'denominator') row.return_exact.denominator_hex += '\n'
    if (field === 'unit') row.analysis_unit_id += '\n'
    const pinned = repin(value)
    expect(() => decodeNativeCnyTrendingDay(pinned.envelope, pinned.selection)).toThrow('INVALID_RESPONSE')
  })
})

describe('native CNY Trending decoder: standalone, never a legacy DTO', () => {
  it('preserves exact values, 64-bit IDs, evidence and opaque names without FX', () => {
    const { envelope, selection } = fixture()
    const result = decodeNativeCnyTrendingDay(envelope, selection)
    expect(result.members[0].analysisUnitId).toBe('item:9223372036854775807')
    expect(result.members[0].returnExact).toEqual({ numerator_hex: '1', denominator_hex: 'a' })
    expect(result.members[1].displayName).toBe('<img src=x onerror=alert(1)>')
    expect(result.historicalMembershipQualified).toBe(false)
    expect(result.fxApplied).toBe(false)
    expect(result).not.toHaveProperty('ranked_stage')
    expect(Object.isFrozen(result.members[0].returnExact)).toBe(true)
  })
  it('accepts an explicitly empty qualified publication, not a missing response', () => {
    const value = fixture(); value.envelope.data.members = []
    const { envelope, selection } = repin(value)
    expect(decodeNativeCnyTrendingDay(envelope, selection).members).toEqual([])
    expect(() => decodeNativeCnyTrendingDay(null, selection)).toThrow()
  })
  it.each(['publication_id', 'public_sha256', 'rights_sha256', 'readiness_review_sha256'])
    ('rejects a different envelope %s', (field) => {
      const { envelope, selection } = fixture()
      Object.assign(envelope, { [field]: H('f') })
      expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
    })
  it('rehashes actual data instead of trusting the envelope hash', () => {
    const { envelope, selection } = fixture(); envelope.data.members[0].display_name = 'changed'
    expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
  })
  it.each([
    ['currency', 'USD'], ['fx_applied', true], ['method', 'USD_LEGACY'],
    ['historical_membership_qualified', true], ['catalog_publication_id', H('f')],
    ['candidate_sha256', H('f')], ['start_date', '2026-09-02'], ['end_date', '2026-09-30'],
  ])('rejects semantically wrong %s even with a matching fresh digest', (field, replacement) => {
    const value = fixture(); Object.assign(value.envelope.data, { [field]: replacement })
    const { envelope, selection } = repin(value)
    expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
  })
  it.each(['as_of', 'input_available_at'])('does not silently truncate excess precision in %s', (field) => {
    const value = fixture(); Object.assign(value.envelope.data, { [field]: '2026-10-02T00:00:00.1234569Z' })
    const { envelope, selection } = repin(value)
    expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
  })
  it('rejects a later available microsecond that Date would truncate to the same millisecond', () => {
    const value = fixture(); value.envelope.data.input_available_at = '2026-10-02T00:00:00.123459Z'
    const { envelope, selection } = repin(value)
    expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
  })
  it('compares timezone-equivalent microseconds exactly', () => {
    const value = fixture(); value.envelope.data.input_available_at = '2026-10-01T20:00:00.123456-04:00'
    const { envelope, selection } = repin(value)
    expect(decodeNativeCnyTrendingDay(envelope, selection).members.length).toBe(2)
  })
  it.each(['2026-02-30T00:00:00Z', '2026-10-02T24:00:00Z', '2026-10-02T00:00:60Z',
    '2026-10-02T00:00:00+24:00'])('rejects invalid clocks %s', (clock) => {
    const value = fixture(); value.envelope.data.as_of = clock
    const { envelope, selection } = repin(value)
    expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
  })
  it('rejects an unknown field instead of forwarding a private extension', () => {
    const value = fixture(); Object.assign(value.envelope.data.members[0], { private_raw: 'not-public' })
    const { envelope, selection } = repin(value)
    expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
  })
  it.each([
    { numerator_hex: '2', denominator_hex: 'a' }, { numerator_hex: '01', denominator_hex: 'a' },
    { numerator_hex: '1', denominator_hex: '0' }, { numerator_hex: '0', denominator_hex: '1' },
    { numerator_hex: '-1', denominator_hex: 'a' }, { numerator_hex: 'A', denominator_hex: 'b' },
  ])('rejects malformed, noncanonical, zero or wrong-direction ratios', (ratio) => {
    const value = fixture(); value.envelope.data.members[0].return_exact = ratio
    const { envelope, selection } = repin(value)
    expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
  })
  it('retains BigInt exactness instead of converting large ratios to Number', () => {
    const value = fixture()
    value.envelope.data.members[0].return_exact = {
      numerator_hex: '1' + '0'.repeat(200), denominator_hex: '3',
    }
    const { envelope, selection } = repin(value)
    expect(decodeNativeCnyTrendingDay(envelope, selection).members[0].returnExact)
      .toEqual(envelope.data.members[0].return_exact)
  })
  it('fails explicitly for unsupported exact size, never rounds the calculation', () => {
    const value = fixture(); value.envelope.data.members[0].return_exact.numerator_hex = '1'.repeat(4097)
    const { envelope, selection } = repin(value)
    expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('UNSUPPORTED_EXACT_SIZE')
  })
  it('rejects duplicate identities, bad rank or evidence grade/count', () => {
    for (const mutation of [
      (value: ReturnType<typeof fixture>) => { value.envelope.data.members[1].analysis_unit_id = value.envelope.data.members[0].analysis_unit_id },
      (value: ReturnType<typeof fixture>) => { value.envelope.data.members[0].rank = 2 },
      (value: ReturnType<typeof fixture>) => { value.envelope.data.members[0].supporting_source_count = 3 },
    ]) {
      const value = fixture(); mutation(value)
      const { envelope, selection } = repin(value)
      expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
    }
  })
  it('checks exact rank order and lexical identity tie breaks without re-sorting', () => {
    const positive = fixture()
    positive.envelope.data.members.splice(1, 0, {
      ...positive.envelope.data.members[0], rank: 2, analysis_unit_id: 'item:99',
      return_exact: { numerator_hex: '1', denominator_hex: 'a' },
    })
    const valid = repin(positive)
    expect(decodeNativeCnyTrendingDay(valid.envelope, valid.selection).members[1].rank).toBe(2)
    positive.envelope.data.members[1].return_exact = { numerator_hex: '1', denominator_hex: '5' }
    const invalid = repin(positive)
    expect(() => decodeNativeCnyTrendingDay(invalid.envelope, invalid.selection)).toThrow('INVALID_RESPONSE')
  })
  it('rejects gainers after losers and loser returns at or below negative one', () => {
    for (const mutate of [
      (value: ReturnType<typeof fixture>) => { value.envelope.data.members.reverse() },
      (value: ReturnType<typeof fixture>) => { value.envelope.data.members[1].return_exact = { numerator_hex: '-1', denominator_hex: '1' } },
    ]) {
      const value = fixture(); mutate(value)
      const { envelope, selection } = repin(value)
      expect(() => decodeNativeCnyTrendingDay(envelope, selection)).toThrow('INVALID_RESPONSE')
    }
  })
})

describe('native CNY Trending injected transport', () => {
  it('requests only the exact native publication anonymously once', async () => {
    const { envelope, selection } = fixture()
    const fetcher = vi.fn(async () => response(envelope))
    const result = await new HttpNativeCnyTrendingGateway(fetcher as typeof fetch).day(selection)
    expect(result.members).toHaveLength(2)
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`/api/v1/native-cny/trending/day?publication=${selection.publicationId}`)
    expect(init.credentials).toBe('omit'); expect(init.redirect).toBe('error')
    expect(init.headers).toEqual({ Accept: 'application/json' })
  })
  it('freezes selection before awaiting a response', async () => {
    const { envelope, selection } = fixture()
    const mutable = { ...selection }
    const fetcher = vi.fn(async () => {
      mutable.publicationId = H('f')
      return response(envelope)
    })
    expect((await new HttpNativeCnyTrendingGateway(fetcher as typeof fetch).day(mutable)).publicationId)
      .toBe(selection.publicationId)
  })
  it.each([[404, 'NOT_PUBLISHED'], [503, 'TEMPORARILY_UNAVAILABLE']])
    ('does not fall back or return a fabricated empty list after HTTP %i', async (status, error) => {
      const { selection } = fixture()
      const fetcher = vi.fn(async () => response({ api_contract: 'native-cny-trending-day/1', error }, status as number))
      await expect(new HttpNativeCnyTrendingGateway(fetcher as typeof fetch).day(selection)).rejects.toThrow(error as string)
      expect(fetcher).toHaveBeenCalledTimes(1)
    })
  it('rejects duplicate decoded JSON keys before field validation', async () => {
    const { selection } = fixture()
    const fetcher = vi.fn(async () => new Response('{"currency":"USD","currency":"CNY"}',
      { headers: { 'Content-Type': 'application/json' } }))
    await expect(new HttpNativeCnyTrendingGateway(fetcher as typeof fetch).day(selection))
      .rejects.toThrow('INVALID_JSON_RESPONSE')
  })
  it('rejects invalid selection without any fetch', async () => {
    const { selection } = fixture(); const fetcher = vi.fn()
    await expect(new HttpNativeCnyTrendingGateway(fetcher as typeof fetch).day({ ...selection, publicationId: 'PENDING' }))
      .rejects.toThrow('INVALID_SELECTION')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('rejects HTML/non-JSON and transport errors without a second request', async () => {
    for (const source of [
      async () => new Response('<html>private error</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }),
      async () => { throw new Error('secret network diagnostic') },
    ]) {
      const { selection } = fixture(); const fetcher = vi.fn(source)
      await expect(new HttpNativeCnyTrendingGateway(fetcher as typeof fetch).day(selection)).rejects.toThrow()
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
  })
  it('retains caller cancellation and performs no fetch when already aborted', async () => {
    const { selection } = fixture(); const fetcher = vi.fn()
    const controller = new AbortController(); controller.abort()
    await expect(new HttpNativeCnyTrendingGateway(fetcher as typeof fetch).day(selection, controller.signal)).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })
})
