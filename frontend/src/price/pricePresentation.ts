import type { Localized } from '../i18n'

// Presentation props, NOT an API contract or a decoder. The shared-Schema,
// request/snapshot/hash-validated adapter alone populates these in a live page.
export const PRICE_CURRENCIES = ['CNY', 'USD'] as const
export type PriceCurrency = (typeof PRICE_CURRENCIES)[number]

export const PRICE_ABSENCE_REASONS = [
  'NO_ELIGIBLE_FX', 'FX_STALE', 'AMOUNT_OUT_OF_RANGE',
  'SOURCE_UNAVAILABLE', 'CAPTURE_GAP', 'SOURCE_CONFLICT',
] as const
export type PriceAbsenceReason = (typeof PRICE_ABSENCE_REASONS)[number]
const SOURCE_ABSENCES: readonly string[] = ['SOURCE_UNAVAILABLE', 'CAPTURE_GAP', 'SOURCE_CONFLICT']
const FX_ABSENCES: readonly string[] = ['NO_ELIGIBLE_FX', 'FX_STALE', 'AMOUNT_OUT_OF_RANGE']

export type PriceAmountView = Readonly<
  | {
      status: 'AVAILABLE'
      currency: PriceCurrency
      amount: string
      scale: 2 | 8
      basis: 'NATIVE' | 'FX_DERIVED'
      rounding: 'EXACT' | 'ROUNDED' | 'ROUNDED_TO_ZERO'
    }
  | {
      status: 'UNAVAILABLE'
      currency: PriceCurrency
      reason: PriceAbsenceReason
    }
>

export type PriceAmountsView = Readonly<Record<PriceCurrency, PriceAmountView>>

export type NativePriceView = Readonly<
  | { currency: 'USD'; unit: 'USD_DECIMAL'; value: string; upstreamFractionDigits: number | null }
  | { currency: 'CNY'; unit: 'CNY_MINOR'; value: string; upstreamFractionDigits: number | null }
>

export type PriceFxView = Readonly<{
  sourceDate: string
  cnyPerUsd: string
  carryDays: number
  selectionPolicy: string
  conversionPolicy: string
}>

export type PriceQuoteView = Readonly<{
  key: string
  marketLabel: Readonly<Localized>
  transportLabel: Readonly<Localized>
  quoteOrigin: 'SOURCE_QUOTE' | 'PROVIDER_AGGREGATE'
  quoteKind: 'ASK' | 'BID'
  sourcePrice: NativePriceView | null
  amounts: PriceAmountsView
  eventAt: string | null
  eventBasis: 'BUCKET_AT' | 'OBSERVED_AT' | null
  availableAt: string
  lateBound: boolean
  fx: PriceFxView | null
}>

export type PricePublicationView = Readonly<{
  kind: 'CURRENT' | 'HISTORY'
  priceSnapshotId: string
  catalogSnapshotId: string
  marketAsOf: string
  knownAt: string
}>

export type PricePanelState = Readonly<
  | { status: 'NOT_CONNECTED' }
  | { status: 'LOADING' }
  | {
      status: 'UNAVAILABLE'
      reason: 'NO_COMPATIBLE_SNAPSHOT' | 'CONTRACT_UNAVAILABLE' | 'NETWORK_UNAVAILABLE' | 'RECORD_REJECTED'
    }
  | { status: 'READY'; publication: PricePublicationView; rows: readonly PriceQuoteView[] }
>

export function isPriceCurrency(value: unknown): value is PriceCurrency {
  return value === 'USD' || value === 'CNY'
}

function unsignedInteger(value: string, max: string): boolean {
  return /^(0|[1-9][0-9]*)$/u.test(value) &&
    (value.length < max.length || (value.length === max.length && value <= max))
}

// String-only formatting: no Number, floating point, FX arithmetic, grouping or
// rounding. Keeping the canonical decimal intact also preserves tiny USD prices.
export function isDisplayDecimal(value: unknown, currency: PriceCurrency): value is string {
  if (typeof value !== 'string' || value.length > 39) return false
  if (currency === 'USD') return /^(0|[1-9][0-9]{0,29})\.[0-9]{8}$/u.test(value)
  if (currency !== 'CNY' || !/^(0|[1-9][0-9]{0,16})\.[0-9]{2}$/u.test(value)) return false
  return unsignedInteger(value.replace('.', '').replace(/^0+(?=[0-9])/u, ''), '9223372036854775807')
}

export function exactMoneyText(amount: unknown, currency: PriceCurrency): string | null {
  return isDisplayDecimal(amount, currency) ? `${currency} ${amount}` : null
}

export function isPriceAmountView(value: PriceAmountView, currency: PriceCurrency): boolean {
  if (!value || value.currency !== currency) return false
  if (value.status === 'UNAVAILABLE') {
    return (PRICE_ABSENCE_REASONS as readonly string[]).includes(value.reason)
  }
  if (value.status !== 'AVAILABLE' || !isDisplayDecimal(value.amount, currency)) return false
  if (value.scale !== (currency === 'USD' ? 8 : 2)) return false
  if (value.basis !== 'NATIVE' && value.basis !== 'FX_DERIVED') return false
  if (!['EXACT', 'ROUNDED', 'ROUNDED_TO_ZERO'].includes(value.rounding)) return false
  if (value.basis === 'NATIVE' && value.rounding !== 'EXACT') return false
  return value.rounding !== 'ROUNDED_TO_ZERO' || /^0\.0+$/u.test(value.amount)
}

// A last-mile display guard only. This does NOT establish snapshot, hash, timing
// or FX arithmetic validity; those remain the shared decoder's responsibility.
export function hasConsistentNativeDisplay(quote: PriceQuoteView): boolean {
  const { amounts, sourcePrice } = quote
  if (!amounts || !isPriceAmountView(amounts.USD, 'USD') || !isPriceAmountView(amounts.CNY, 'CNY')) return false
  if (sourcePrice === null) {
    return amounts.USD.status === 'UNAVAILABLE' && amounts.CNY.status === 'UNAVAILABLE' &&
      SOURCE_ABSENCES.includes(amounts.USD.reason) && amounts.USD.reason === amounts.CNY.reason
  }
  if (!sourcePrice || !isPriceCurrency(sourcePrice.currency)) return false
  if (sourcePrice.upstreamFractionDigits !== null &&
      (!Number.isSafeInteger(sourcePrice.upstreamFractionDigits) || sourcePrice.upstreamFractionDigits < 0)) return false
  const native = amounts[sourcePrice.currency]
  if (native.status !== 'AVAILABLE' || native.basis !== 'NATIVE') return false
  const target = amounts[sourcePrice.currency === 'USD' ? 'CNY' : 'USD']
  if (target.status === 'AVAILABLE' && (target.basis !== 'FX_DERIVED' || quote.fx === null)) return false
  if (target.status === 'UNAVAILABLE' && !FX_ABSENCES.includes(target.reason)) return false
  if (target.status === 'AVAILABLE' && target.rounding === 'ROUNDED_TO_ZERO' && !/[1-9]/u.test(native.amount)) return false

  if (sourcePrice.currency === 'USD') {
    return sourcePrice.unit === 'USD_DECIMAL' && native.amount === sourcePrice.value
  }
  if (sourcePrice.unit !== 'CNY_MINOR' || typeof sourcePrice.value !== 'string' ||
      !unsignedInteger(sourcePrice.value, '9223372036854775807')) return false
  // Exact minor-unit identity check, NOT a currency conversion. Render the
  // backend-supplied amount, never this comparison value.
  const minor = sourcePrice.value.padStart(3, '0')
  return native.amount === `${minor.slice(0, -2)}.${minor.slice(-2)}`
}

export function selectedPriceAmount(quote: PriceQuoteView, currency: PriceCurrency): PriceAmountView | null {
  return isPriceCurrency(currency) && hasConsistentNativeDisplay(quote) ? quote.amounts[currency] : null
}
