import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  nativeCnyIndexCnyText,
  nativeCnyIndexDecimalText,
  nativeCnyIndexView,
} from '../src/adapter/nativeCnyIndexViewModel'
import { NativeCnyIndexPanel, type NativeCnyIndexPanelGateway } from '../src/components/NativeCnyIndexPanel'
import type { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import {
  decodeNativeCnyIndexResponse,
  NATIVE_CNY_INDEX_BASIS,
  NATIVE_CNY_INDEX_METHOD,
  NATIVE_CNY_INDEX_PUBLIC_SCHEMA,
  type NativeCnyIndexDayRequest,
  type NativeCnyIndexHistoryRequest,
  type NativeCnyIndexReadResult,
  type NativeCnyIndexRequest,
} from '../src/wire/nativeCnyIndexPublicApi'

// All identities and measurements below are synthetic, never production pins.
const SPEC = 'b'.repeat(64)
const FIRST = 'a'.repeat(64)
const LAST = 'c'.repeat(64)
const PRECISE = '9007199254740993.1234567890123456789000'
const CONTEMPORANEOUS = 'CONTEMPORANEOUS_EOD_NOT_ARCHIVE_LAST_OBSERVATION'
const ARCHIVE = 'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND'

function dayTarget(publication = FIRST, date = '2026-10-01'): NativeCnyIndexDayRequest {
  return { kind: 'DAY', publication_id: publication, spec_sha256: SPEC, scope_code: 'ALL', bucket_date: date }
}

function historyTarget(): NativeCnyIndexHistoryRequest {
  return { kind: 'HISTORY', spec_sha256: SPEC, scope_code: 'ALL', start_date: '2026-10-01', end_date: '2026-10-03',
    publication_pins: [{ bucket_date: '2026-10-01', publication_id: FIRST }, { bucket_date: '2026-10-03', publication_id: LAST }] }
}

function dayPayload(target = dayTarget(), archive = false) {
  return {
    publication_id: target.publication_id, public_sha256: 'd'.repeat(64), rights_sha256: 'e'.repeat(64),
    review_sha256: 'f'.repeat(64), released_at: `${target.bucket_date}T10:00:00+08:00`,
    data: { schema: NATIVE_CNY_INDEX_PUBLIC_SCHEMA, basis: NATIVE_CNY_INDEX_BASIS, method: NATIVE_CNY_INDEX_METHOD,
      currency: 'CNY', fx_applied: false, price_unit: 'CNY_MAJOR', numeric_semantics: 'EXACT_PRIVATE_CALCULATION_DISPLAY_ONLY_ROUNDING',
      bucket_date: target.bucket_date, measured_at: `${target.bucket_date}t09:00:00,123456+08:00`, spec_sha256: target.spec_sha256,
      availability: archive ? ARCHIVE : CONTEMPORANEOUS,
      points: [{ scope_code: target.scope_code, expected_member_count: 10, paired_member_count: 8, qualified_member_count: 7,
        rejected_return_domain_count: 1, absolute_price_qualified_member_count: 8, segment_number: archive ? 2 : 1,
        grade_counts: { A: 5, B: 1, C: 1, D: 1, E: 2 }, source_pair_counts: { '1->1': 7, '1->2': 1 },
        warnings: ['GRADE_D_SHARE_ABOVE_WARNING_LEVEL'], absolute_price_semantic: 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE',
        period_return_display: archive ? null : '-0.00000000000000000001', index_display: archive ? null : PRECISE,
        ask_sum_cny_display: archive ? null : PRECISE, ask_median_cny_display: archive ? null : '000123.4500',
        price_quality: archive ? 'UNAVAILABLE' : 'PARTIAL', return_quality: archive ? 'LOW' : 'HIGH',
        state: 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN', effective_estimator: archive ? null : 'RAW_EQUAL_ADMITTED_NO_WINSOR',
      }],
    },
  }
}

function historyPayload() {
  const target = historyTarget()
  return { api_contract: 'native-cny-index-history/1', spec_sha256: SPEC, scope: target.scope_code,
    start_date: target.start_date, end_date: target.end_date, currency: 'CNY', fx_applied: false,
    days: [dayPayload(), dayPayload(dayTarget(LAST, '2026-10-03'), true)], missing_publication_dates: ['2026-10-02'],
    missing_prices_filled: false, calculation_revisions_mixed: false,
  }
}

function dayResult(target = dayTarget()): NativeCnyIndexReadResult {
  return decodeNativeCnyIndexResponse(dayPayload(target), 200, target)
}

function historyResult(): NativeCnyIndexReadResult {
  return decodeNativeCnyIndexResponse(historyPayload(), 200, historyTarget())
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Synthetic tests forbid network') }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('native index exact text view model', () => {
  it.each(['0', '0.00', '-0.0000', '000123.4500', PRECISE, '-99999999999999999999999999999.123456789', '9'.repeat(195) + '.0000'])(
    'preserves the entire decimal string %s without parsing or scaling', (value) => {
      expect(nativeCnyIndexDecimalText(value)).toBe(value)
      expect(nativeCnyIndexCnyText(value)).toBe(`CNY ${value}`)
    },
  )
  it('makes null visible rather than zero or a substitute price', () => {
    expect(nativeCnyIndexDecimalText(null)).toBe('— (null)')
    expect(nativeCnyIndexCnyText(null)).toBe('— (null)')
  })
  it('preserves every published row, missing date, segment, availability and clock string', () => {
    const view = nativeCnyIndexView(historyResult(), historyTarget())
    expect(view.days).toHaveLength(2)
    expect(view.missingPublicationDates).toEqual(['2026-10-02'])
    expect(view.days.map((day) => day.data.points[0].segment_number)).toEqual([1, 2])
    expect(view.days.map((day) => day.data.availability)).toEqual([CONTEMPORANEOUS, ARCHIVE])
    expect(view.days[0].data.measured_at).toBe('2026-10-01t09:00:00,123456+08:00')
    expect(view.days[1].data.points[0].index_display).toBeNull()
    expect(view.days[1].data.points[0].period_return_display).toBeNull()
    expect(view.days[1].data.points[0].price_quality).toBe('UNAVAILABLE')
    expect(Object.isFrozen(view)).toBe(true)
    expect(Object.isFrozen(view.days[0].data.points[0])).toBe(true)
  })
  it('retains unresolved origins as segment zero and null rather than inventing a baseline', () => {
    const target = dayTarget()
    const payload = dayPayload(target, true)
    payload.data.points[0].segment_number = 0
    payload.data.points[0].state = 'HISTORY_SCOPE_UNRESOLVED_ORIGINS'
    const result = decodeNativeCnyIndexResponse(payload, 200, target)
    const view = nativeCnyIndexView(result, target)
    expect(view.days[0].data.points[0].state).toBe('HISTORY_SCOPE_UNRESOLVED_ORIGINS')
    expect(view.days[0].data.points[0].segment_number).toBe(0)
    expect(view.days[0].data.points[0].index_display).toBeNull()
  })
  it.each(['publication_id', 'spec_sha256', 'scope_code', 'bucket_date'] as const)('rejects an injected result with different %s', (field) => {
    const payload = dayPayload()
    if (field === 'publication_id') payload.publication_id = LAST
    else if (field === 'spec_sha256') payload.data.spec_sha256 = '1'.repeat(64)
    else if (field === 'scope_code') payload.data.points[0].scope_code = 'WEAPON'
    else payload.data.bucket_date = '2026-10-02'
    const result = { kind: 'DAY', day: payload } as unknown as NativeCnyIndexReadResult
    expect(() => nativeCnyIndexView(result, dayTarget())).toThrow('TARGET_MISMATCH')
  })
  it('does not accept omitted historical pins or a response-learned publication', () => {
    expect(() => nativeCnyIndexView(historyResult(), { ...historyTarget(), publication_pins: [] })).toThrow('INVALID_RESPONSE')
  })
  it('rejects an injected legacy/USD body and swapped day/history kinds', () => {
    const payload = dayPayload()
    payload.data.currency = 'USD'
    expect(() => nativeCnyIndexView({ kind: 'DAY', day: payload } as unknown as NativeCnyIndexReadResult, dayTarget())).toThrow()
    expect(() => nativeCnyIndexView(dayResult(), historyTarget())).toThrow()
    expect(() => nativeCnyIndexView(historyResult(), dayTarget())).toThrow()
  })
  it('rejects a relabeled result kind and malformed injected results before presentation', () => {
    expect(() => nativeCnyIndexView({ kind: 'HISTORY', history: dayPayload() } as unknown as NativeCnyIndexReadResult, dayTarget())).toThrow('TARGET_MISMATCH')
    expect(() => nativeCnyIndexView(null as unknown as NativeCnyIndexReadResult, dayTarget())).toThrow('INVALID_RESPONSE')
    expect(() => nativeCnyIndexView({ kind: 'ERROR', api_contract: 'native-cny-index-day/1', error: 'NOT_PUBLISHED', http_status: 503 }, dayTarget())).toThrow('HTTP_STATUS_MISMATCH')
  })
  it('snapshots nested caller pins and does not normalize an injected public artifact hash', () => {
    const request = historyTarget()
    const view = nativeCnyIndexView(historyResult(), request)
    expect(view.target).not.toBe(request)
    if (view.target.kind !== 'HISTORY') throw new Error('expected history')
    expect(view.target.publication_pins).not.toBe(request.publication_pins)
    expect(Object.isFrozen(view.target.publication_pins[0])).toBe(true)
    expect(view.days[0].public_sha256).toBe('d'.repeat(64))
  })
})

describe('explicitly injected native index panel', () => {
  it('makes no request when no external target is selected', () => {
    const gateway = { read: vi.fn() }
    render(<NativeCnyIndexPanel gateway={gateway} request={null} lang="en" />)
    expect(screen.getByRole('status').textContent).toContain('no read is issued')
    expect(gateway.read).not.toHaveBeenCalled()
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(screen.queryByRole('table')).toBeNull()
  })
  it('rejects an incomplete external target locally without a request or retry', () => {
    const gateway = { read: vi.fn() }
    render(<NativeCnyIndexPanel gateway={gateway} request={{ kind: 'DAY' } as NativeCnyIndexRequest} />)
    expect(screen.getByRole('status').getAttribute('data-error-code')).toBe('INVALID_REQUEST_TARGET')
    expect(gateway.read).not.toHaveBeenCalled()
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('shows loading and passes an AbortSignal with a frozen complete target', () => {
    const pending = deferred<NativeCnyIndexReadResult>()
    const gateway = { read: vi.fn(() => pending.promise) }
    render(<NativeCnyIndexPanel gateway={gateway} request={historyTarget()} lang="en" />)
    expect(screen.getByRole('status').textContent).toContain('Reading')
    const [request, options] = gateway.read.mock.calls[0] as unknown as [NativeCnyIndexHistoryRequest, { signal: AbortSignal }]
    expect(request).toEqual(historyTarget())
    expect(Object.isFrozen(request.publication_pins[0])).toBe(true)
    expect(options.signal.aborted).toBe(false)
  })
  it('renders precise day strings and caller labels without FX or HTML interpretation', async () => {
    const gateway = { read: vi.fn(async () => dayResult()) }
    render(<NativeCnyIndexPanel gateway={gateway} request={dayTarget()} scopeLabel="External <script>scope</script>" lang="en" />)
    const row = await screen.findByTestId('native-index-day')
    expect(within(row).getByText(PRECISE)).toBeTruthy()
    expect(within(row).getByText(`CNY ${PRECISE}`)).toBeTruthy()
    expect(within(row).getByText('CNY 000123.4500')).toBeTruthy()
    expect(within(row).getByText('-0.00000000000000000001')).toBeTruthy()
    expect(within(row).getByText('PARTIAL')).toBeTruthy()
    expect(within(row).getByText('HIGH')).toBeTruthy()
    expect(screen.getByTestId('native-cny-index-panel').textContent).toContain('External <script>scope</script>')
    expect(document.querySelector('script')).toBeNull()
    expect(screen.getByTestId('native-cny-index-panel').textContent).toContain('not market value')
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(gateway.read).toHaveBeenCalledTimes(1)
  })
  it('renders only published history rows and explicitly retains nulls, gaps and segments', async () => {
    const gateway = { read: vi.fn(async () => historyResult()) }
    render(<NativeCnyIndexPanel gateway={gateway} request={historyTarget()} lang="en" />)
    await screen.findAllByTestId('native-index-day')
    const rows = screen.getAllByTestId('native-index-day')
    expect(rows.map((row) => row.getAttribute('data-date'))).toEqual(['2026-10-01', '2026-10-03'])
    expect(rows.map((row) => row.getAttribute('data-segment'))).toEqual(['1', '2'])
    expect(rows.map((row) => row.getAttribute('data-availability'))).toEqual([CONTEMPORANEOUS, ARCHIVE])
    expect(within(rows[1]).getAllByText('— (null)')).toHaveLength(4)
    expect(screen.getByTestId('native-index-missing-dates').textContent).toBe('2026-10-02')
    expect(document.querySelector('svg,path')).toBeNull()
    expect(screen.getByTestId('native-cny-index-panel').textContent).toContain('calculation_revisions_mixed: false')
    expect(screen.getByTestId('native-cny-index-panel').textContent).toContain('grade_counts.D')
    expect(screen.getByTestId('native-cny-index-panel').textContent).toContain('GRADE_D_SHARE_ABOVE_WARNING_LEVEL')
  })
  it.each([['INVALID_REQUEST', 400], ['NOT_PUBLISHED', 404], ['TEMPORARILY_UNAVAILABLE', 503]] as const)(
    'shows controlled %s without substituting old data', async (error, http_status) => {
      const gateway = { read: vi.fn(async (): Promise<NativeCnyIndexReadResult> => ({ kind: 'ERROR', api_contract: 'native-cny-index-day/1', error, http_status })) }
      render(<NativeCnyIndexPanel gateway={gateway} request={dayTarget()} />)
      await waitFor(() => expect(screen.getByRole('status').getAttribute('data-error-code')).toBe(error))
      expect(screen.queryByRole('table')).toBeNull()
      expect(gateway.read).toHaveBeenCalledTimes(1)
      expect(globalThis.fetch).not.toHaveBeenCalled()
    },
  )
  it('hides transport exception text and retries only after an explicit click', async () => {
    const gateway = { read: vi.fn().mockRejectedValueOnce(new Error('secret/provider.example/diagnostic')).mockResolvedValueOnce(dayResult()) }
    render(<NativeCnyIndexPanel gateway={gateway} request={dayTarget()} lang="en" />)
    await waitFor(() => expect(screen.getByRole('status').getAttribute('data-error-code')).toBe('TRANSPORT'))
    expect(document.body.textContent).not.toContain('secret/provider.example')
    expect(gateway.read).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Retry the same target' }))
    await screen.findByTestId('native-index-day')
    expect(gateway.read).toHaveBeenCalledTimes(2)
    expect(gateway.read.mock.calls[0][0]).toEqual(gateway.read.mock.calls[1][0])
  })
  it('rejects a substituted publication from an injected gateway without learning its identity', async () => {
    const gateway = { read: vi.fn(async () => dayResult(dayTarget(LAST))) }
    render(<NativeCnyIndexPanel gateway={gateway} request={dayTarget()} lang="en" />)
    await waitFor(() => expect(screen.getByRole('status').getAttribute('data-error-code')).toBe('TARGET_MISMATCH'))
    expect(screen.queryByRole('table')).toBeNull()
    expect(document.body.textContent).not.toContain(LAST)
  })
  it('aborts on target change and ignores a late success even if a gateway ignores cancellation', async () => {
    const first = deferred<NativeCnyIndexReadResult>()
    const second = dayTarget(LAST, '2026-10-03')
    const gateway = { read: vi.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce(dayResult(second)) }
    const mounted = render(<NativeCnyIndexPanel gateway={gateway} request={dayTarget()} />)
    const oldSignal = gateway.read.mock.calls[0][1].signal as AbortSignal
    mounted.rerender(<NativeCnyIndexPanel gateway={gateway} request={second} />)
    expect(oldSignal.aborted).toBe(true)
    const row = await screen.findByTestId('native-index-day')
    expect(row.getAttribute('data-date')).toBe('2026-10-03')
    await act(async () => { first.resolve(dayResult()); await first.promise })
    expect(screen.getByTestId('native-index-day').getAttribute('data-date')).toBe('2026-10-03')
    expect(document.body.textContent).not.toContain(FIRST)
  })
  it('ignores late errors from an old gateway on the same target', async () => {
    const pending = deferred<NativeCnyIndexReadResult>()
    const oldGateway = { read: vi.fn(() => pending.promise) }
    const newGateway = { read: vi.fn(async () => dayResult()) }
    const request = dayTarget()
    const mounted = render(<NativeCnyIndexPanel gateway={oldGateway} request={request} />)
    mounted.rerender(<NativeCnyIndexPanel gateway={newGateway} request={request} />)
    await screen.findByTestId('native-index-day')
    await act(async () => { pending.reject(new Error('late')); await pending.promise.catch(() => undefined) })
    expect(screen.getByTestId('native-index-day')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('treats nested publication pins as target identity and rejects late history from the prior selection', async () => {
    const old = deferred<NativeCnyIndexReadResult>()
    const current = deferred<NativeCnyIndexReadResult>()
    const gateway = { read: vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise) }
    const previous = historyTarget()
    const next = { ...historyTarget(), publication_pins: [{ bucket_date: '2026-10-01', publication_id: LAST }, { bucket_date: '2026-10-03', publication_id: FIRST }] }
    const mounted = render(<NativeCnyIndexPanel gateway={gateway} request={previous} lang="en" />)
    const oldSignal = gateway.read.mock.calls[0][1].signal as AbortSignal
    mounted.rerender(<NativeCnyIndexPanel gateway={gateway} request={next} lang="en" />)
    expect(oldSignal.aborted).toBe(true)
    expect(gateway.read.mock.calls[1][0]).toEqual(next)
    await act(async () => { old.resolve(historyResult()); await old.promise })
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByRole('status').textContent).toContain('Reading')
  })
  it('changes display language without making another request or altering exact strings', async () => {
    const gateway = { read: vi.fn(async () => dayResult()) }
    const request = dayTarget()
    const mounted = render(<NativeCnyIndexPanel gateway={gateway} request={request} lang="zh" />)
    await screen.findByTestId('native-index-day')
    mounted.rerender(<NativeCnyIndexPanel gateway={gateway} request={request} lang="en" />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('explicit publication target')
    expect(screen.getByTestId('native-index-day').textContent).toContain(PRECISE)
    expect(gateway.read).toHaveBeenCalledTimes(1)
  })
  it('aborts and removes previously displayed data when the target is deselected', async () => {
    const gateway = { read: vi.fn(async () => dayResult()) }
    const mounted = render(<NativeCnyIndexPanel gateway={gateway} request={dayTarget()} />)
    await screen.findByTestId('native-index-day')
    const signal = gateway.read.mock.calls[0] as unknown as [NativeCnyIndexRequest, { signal: AbortSignal }]
    mounted.rerender(<NativeCnyIndexPanel gateway={gateway} request={null} />)
    expect(signal[1].signal.aborted).toBe(true)
    expect(screen.queryByRole('table')).toBeNull()
    expect(document.body.textContent).not.toContain(PRECISE)
    expect(gateway.read).toHaveBeenCalledTimes(1)
  })
  it('aborts an outstanding request on unmount', () => {
    const pending = deferred<NativeCnyIndexReadResult>()
    const gateway = { read: vi.fn(() => pending.promise) }
    const mounted = render(<NativeCnyIndexPanel gateway={gateway} request={dayTarget()} />)
    const call = gateway.read.mock.calls[0] as unknown as [NativeCnyIndexRequest, { signal: AbortSignal }]
    mounted.unmount()
    expect(call[1].signal.aborted).toBe(true)
  })
  it('satisfies the explicit gateway interface without any default transport constructor', () => {
    const nativeGateway = {} as HttpNativeCnyIndexPublicGateway
    const gateway: NativeCnyIndexPanelGateway = nativeGateway
    expect(gateway).toBe(nativeGateway)
  })
})
