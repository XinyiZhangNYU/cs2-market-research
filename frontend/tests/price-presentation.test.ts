import { describe, expect, it } from 'vitest'
import {
  exactMoneyText, hasConsistentNativeDisplay, isDisplayDecimal,
  isPriceAmountView, selectedPriceAmount,
  type PriceAmountView, type PriceCurrency, type PriceQuoteView,
} from '../src/price/pricePresentation'
import { cnyQuote, usdQuote } from './support/pricePresentationFixtures'

describe('exact string-only price presentation', () => {
  it.each([
    ['USD', '0.00000000'], ['USD', '0.00000001'], ['USD', '10.00100000'],
    ['USD', '9007199254740993.12345678'], ['USD', '999999999999999999999999999999.99999999'],
    ['CNY', '0.00'], ['CNY', '0.01'], ['CNY', '123.45'], ['CNY', '92233720368547758.07'],
  ] as const)('preserves %s %s without trimming or rounding', (currency, amount) => {
    expect(exactMoneyText(amount, currency)).toBe(`${currency} ${amount}`)
  })

  it.each([
    '1e-8', '-1.00000000', '+1.00000000', 'NaN', 'Infinity', '1,000.00000000',
    ' 1.00000000', '1.00000000 ', '01.00000000', '１.００００００００',
    '1.0000000', '1.000000000', '1.00', '1000000000000000000000000000000.00000000',
    10.001, null, undefined, { amount: '1.00000000' },
  ])('fails closed on noncanonical or unsupported USD %s', (amount) => {
    expect(exactMoneyText(amount, 'USD')).toBeNull()
  })

  it.each(['1', '1.0', '1.000', '00.00', '92233720368547758.08', '-0.01', '999999999999999999.99'])('rejects unsupported CNY %s', (value) => {
    expect(isDisplayDecimal(value, 'CNY')).toBe(false)
  })

  it('does not accept an unsupported currency even through an untyped caller', () => {
    expect(exactMoneyText('1.00', 'EUR' as PriceCurrency)).toBeNull()
    expect(selectedPriceAmount(usdQuote(), 'EUR' as PriceCurrency)).toBeNull()
  })

  it('selects the original object without deriving either direction', () => {
    for (const quote of [usdQuote(), cnyQuote()]) {
      const original = JSON.stringify(quote)
      for (let index = 0; index < 100; index += 1) {
        expect(selectedPriceAmount(quote, 'USD')).toBe(quote.amounts.USD)
        expect(selectedPriceAmount(quote, 'CNY')).toBe(quote.amounts.CNY)
      }
      expect(JSON.stringify(quote)).toBe(original)
    }
  })

  it('validates CNY minor-unit identity without a safe-integer loss', () => {
    const quote = cnyQuote({
      sourcePrice: { currency: 'CNY', unit: 'CNY_MINOR', value: '9223372036854775807', upstreamFractionDigits: null },
      amounts: {
        CNY: { status: 'AVAILABLE', currency: 'CNY', amount: '92233720368547758.07', scale: 2, basis: 'NATIVE', rounding: 'EXACT' },
        USD: { status: 'UNAVAILABLE', currency: 'USD', reason: 'NO_ELIGIBLE_FX' },
      },
      fx: null,
    })
    expect(hasConsistentNativeDisplay(quote)).toBe(true)
    expect(exactMoneyText((quote.amounts.CNY as Extract<PriceAmountView, { status: 'AVAILABLE' }>).amount, 'CNY')).toBe('CNY 92233720368547758.07')
  })

  it.each([['0', '0.00'], ['1', '0.01'], ['9', '0.09'], ['10', '0.10'], ['100', '1.00']])('checks CNY minor %s as %s by exact digits', (value, amount) => {
    const quote = cnyQuote({ sourcePrice: { currency: 'CNY', unit: 'CNY_MINOR', value, upstreamFractionDigits: null } })
    expect(hasConsistentNativeDisplay({ ...quote, amounts: { ...quote.amounts, CNY: { status: 'AVAILABLE', currency: 'CNY', amount, scale: 2, basis: 'NATIVE', rounding: 'EXACT' } } })).toBe(true)
  })

  it.each(['NO_ELIGIBLE_FX', 'FX_STALE', 'AMOUNT_OUT_OF_RANGE'] as const)('retains native USD beside a target absence: %s', (reason) => {
    const quote = usdQuote()
    const missing = { ...quote, fx: null, amounts: { ...quote.amounts, CNY: { status: 'UNAVAILABLE', currency: 'CNY', reason } } } as const
    expect(selectedPriceAmount(missing, 'USD')).toBe(quote.amounts.USD)
    expect(selectedPriceAmount(missing, 'CNY')).toBe(missing.amounts.CNY)
  })

  it.each(['scale', 'currency', 'basis', 'rounding', 'native-mismatch', 'no-source', 'no-fx'])('rejects inconsistent presentation: %s', (corruption) => {
    const quote = structuredClone(usdQuote())
    const amount = quote.amounts.USD as unknown as Record<string, unknown>
    if (corruption === 'scale') amount.scale = 2
    if (corruption === 'currency') amount.currency = 'CNY'
    if (corruption === 'basis') amount.basis = 'FX_DERIVED'
    if (corruption === 'rounding') amount.rounding = 'ROUNDED'
    if (corruption === 'native-mismatch') amount.amount = '10.00099999'
    if (corruption === 'no-source') (quote as { sourcePrice: null }).sourcePrice = null
    if (corruption === 'no-fx') (quote as { fx: null }).fx = null
    expect(selectedPriceAmount(quote, 'USD')).toBeNull()
    expect(selectedPriceAmount(quote, 'CNY')).toBeNull()
  })

  it('requires a rounded-to-zero target to actually contain zero', () => {
    const base = { status: 'AVAILABLE', currency: 'CNY', amount: '0.00', scale: 2, basis: 'FX_DERIVED', rounding: 'ROUNDED_TO_ZERO' } as const
    expect(isPriceAmountView(base, 'CNY')).toBe(true)
    expect(isPriceAmountView({ ...base, amount: '0.01' }, 'CNY')).toBe(false)
    expect(isPriceAmountView({ ...base, basis: 'NATIVE' }, 'CNY')).toBe(false)
  })

  it('does not admit CNY_FX_DERIVED as native source or infer an unknown unit', () => {
    const quote = cnyQuote()
    for (const unit of ['CNY_MINOR_FX_DERIVED', 'USD_DECIMAL', 'CNY_DECIMAL']) {
      const corrupt = { ...quote, sourcePrice: { ...quote.sourcePrice, unit } } as PriceQuoteView
      expect(hasConsistentNativeDisplay(corrupt)).toBe(false)
    }
  })

  it('rejects unknown absence reasons rather than reflecting them', () => {
    expect(isPriceAmountView({ status: 'UNAVAILABLE', currency: 'USD', reason: 'secret diagnostic' } as unknown as PriceAmountView, 'USD')).toBe(false)
  })
})
