import { describe, expect, it } from 'vitest'
import { compactMoneyText, compareDisplayDecimals, lowestSourceAsk } from '../src/price/lowestAsk'
import type { PriceQuoteView } from '../src/price/pricePresentation'

const label = { zh: '市场', en: 'Market' }

function cnyQuote(key: string, minor: string, overrides: Partial<PriceQuoteView> = {}): PriceQuoteView {
  const amount = `${minor.padStart(3, '0').slice(0, -2)}.${minor.padStart(3, '0').slice(-2)}`
  return {
    key,
    marketLabel: label,
    transportLabel: label,
    quoteOrigin: 'SOURCE_QUOTE',
    quoteKind: 'ASK',
    sourcePrice: { currency: 'CNY', unit: 'CNY_MINOR', value: minor, upstreamFractionDigits: 2 },
    amounts: {
      CNY: { status: 'AVAILABLE', currency: 'CNY', amount, scale: 2, basis: 'NATIVE', rounding: 'EXACT' },
      USD: { status: 'UNAVAILABLE', currency: 'USD', reason: 'NO_ELIGIBLE_FX' },
    },
    eventAt: null,
    eventBasis: null,
    availableAt: '2026-09-03T00:00:00.000000Z',
    lateBound: false,
    fx: null,
    ...overrides,
  }
}

function usdQuote(key: string, amount: string): PriceQuoteView {
  return {
    ...cnyQuote(key, '0'),
    sourcePrice: { currency: 'USD', unit: 'USD_DECIMAL', value: amount, upstreamFractionDigits: null },
    amounts: {
      USD: { status: 'AVAILABLE', currency: 'USD', amount, scale: 8, basis: 'NATIVE', rounding: 'EXACT' },
      CNY: { status: 'UNAVAILABLE', currency: 'CNY', reason: 'NO_ELIGIBLE_FX' },
    },
  }
}

describe('lowest source ask', () => {
  it('orders display decimals without floating point', () => {
    expect(compareDisplayDecimals('9.99', '10.00')).toBeLessThan(0)
    expect(compareDisplayDecimals('100.10', '100.09')).toBeGreaterThan(0)
    expect(compareDisplayDecimals('12.34', '12.34')).toBe(0)
    expect(compareDisplayDecimals('9007199254740993.01', '9007199254740993.02')).toBeLessThan(0)
  })

  it('picks the cheapest source listing and counts the markets that have one', () => {
    const ask = lowestSourceAsk([cnyQuote('a', '12000'), cnyQuote('b', '9950'), cnyQuote('c', '10001')], 'CNY')
    expect(ask).toEqual({ amount: '99.50', currency: 'CNY', converted: false, marketCount: 3 })
  })

  it('excludes bids and provider aggregates, which are not listings', () => {
    const ask = lowestSourceAsk([
      cnyQuote('bid', '100', { quoteKind: 'BID' }),
      cnyQuote('agg', '200', { quoteOrigin: 'PROVIDER_AGGREGATE' }),
      cnyQuote('ask', '5000'),
    ], 'CNY')
    expect(ask).toEqual({ amount: '50.00', currency: 'CNY', converted: false, marketCount: 1 })
  })

  it('treats a zero amount as no listing rather than the cheapest one', () => {
    expect(lowestSourceAsk([cnyQuote('zero', '0'), cnyQuote('real', '1234')], 'CNY'))
      .toEqual({ amount: '12.34', currency: 'CNY', converted: false, marketCount: 1 })
    expect(lowestSourceAsk([cnyQuote('zero', '0')], 'CNY')).toBeNull()
  })

  it('converts listings published only in the other currency with the daily rate, so every market competes', () => {
    const rows = [cnyQuote('a', '5000'), usdQuote('b', '7.00000000')]
    // ¥50.00 / 6.7 = $7.46268657 > $7.00, so the USD market wins in English…
    expect(lowestSourceAsk(rows, 'USD', '6.7')).toEqual({ amount: '7.00000000', currency: 'USD', converted: false, marketCount: 2 })
    // …and in Chinese it is shown as ¥46.90, cheaper than the native ¥50.00.
    expect(lowestSourceAsk(rows, 'CNY', '6.7')).toEqual({ amount: '46.90', currency: 'CNY', converted: true, marketCount: 2 })
  })

  it('shows the published currency only when no rate is available', () => {
    expect(lowestSourceAsk([cnyQuote('a', '5000'), cnyQuote('b', '4999')], 'USD'))
      .toEqual({ amount: '49.99', currency: 'CNY', converted: false, marketCount: 2 })
    expect(lowestSourceAsk([cnyQuote('a', '5000')], 'USD', 'not-a-rate'))
      .toEqual({ amount: '50.00', currency: 'CNY', converted: false, marketCount: 1 })
  })

  it('returns null instead of inventing a price when no listing is available', () => {
    expect(lowestSourceAsk([], 'CNY')).toBeNull()
    expect(lowestSourceAsk([cnyQuote('bid', '100', { quoteKind: 'BID' })], 'USD')).toBeNull()
  })

  it('formats compact display text', () => {
    expect(compactMoneyText('99.50', 'CNY')).toBe('¥99.50')
    expect(compactMoneyText('12.30000000', 'USD')).toBe('$12.30')
    expect(compactMoneyText('0.00125000', 'USD')).toBe('$0.00125')
    expect(compactMoneyText('12345.60', 'CNY')).toBe('¥12,345.60')
    expect(compactMoneyText('1234567.00000000', 'USD')).toBe('$1,234,567.00')
    // A converted dollar amount is an estimate: cents, or four places below a cent.
    expect(compactMoneyText('7.46268657', 'USD', true)).toBe('$7.46')
    expect(compactMoneyText('0.00149254', 'USD', true)).toBe('$0.0015')
  })
})
