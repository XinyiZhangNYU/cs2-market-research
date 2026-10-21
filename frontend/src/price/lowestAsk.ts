import { convertDisplayAmount } from './localizedCurrency'
import { isDisplayDecimal, selectedPriceAmount, type PriceCurrency, type PriceQuoteView } from './pricePresentation'

/**
 * Orders two canonical non-negative display decimals of one currency without
 * Number or floating point: same scale, so integer length then code points.
 */
export function compareDisplayDecimals(left: string, right: string): number {
  const [leftInteger = '', leftFraction = ''] = left.split('.')
  const [rightInteger = '', rightFraction = ''] = right.split('.')
  if (leftInteger.length !== rightInteger.length) return leftInteger.length - rightInteger.length
  if (leftInteger !== rightInteger) return leftInteger < rightInteger ? -1 : 1
  if (leftFraction === rightFraction) return 0
  return leftFraction < rightFraction ? -1 : 1
}

export type LowestAsk = Readonly<{
  /** Canonical display decimal of `currency` (CNY 2, USD 8 fraction digits). */
  amount: string
  /** Differs from the requested currency only when no rate was available. */
  currency: PriceCurrency
  /** True when `amount` came from the current daily reference rate on this page. */
  converted: boolean
  marketCount: number
}>

const SCALE: Readonly<Record<PriceCurrency, number>> = { CNY: 2, USD: 8 }
const hasValue = (amount: string) => /[1-9]/u.test(amount)

function otherCurrency(currency: PriceCurrency): PriceCurrency {
  return currency === 'CNY' ? 'USD' : 'CNY'
}

function lowestIn(
  rows: readonly PriceQuoteView[],
  currency: PriceCurrency,
  cnyPerUsd: string | null,
  nativeOnly: boolean,
): LowestAsk | null {
  const other = otherCurrency(currency)
  let best: { amount: string; converted: boolean } | null = null
  let marketCount = 0
  for (const row of rows) {
    if (row.quoteOrigin !== 'SOURCE_QUOTE' || row.quoteKind !== 'ASK') continue
    let candidate: { amount: string; converted: boolean } | null = null
    const own = selectedPriceAmount(row, currency)
    // Some sources publish 0 for "nothing listed"; that is not a price anyone can buy at.
    if (own?.status === 'AVAILABLE' && isDisplayDecimal(own.amount, currency) && hasValue(own.amount) &&
        (!nativeOnly || own.basis === 'NATIVE')) {
      candidate = { amount: own.amount, converted: false }
    } else if (!nativeOnly && cnyPerUsd !== null) {
      const native = selectedPriceAmount(row, other)
      if (native?.status === 'AVAILABLE' && native.basis === 'NATIVE' && isDisplayDecimal(native.amount, other) && hasValue(native.amount)) {
        const amount = convertDisplayAmount(native.amount, other, cnyPerUsd, SCALE[currency])
        if (amount !== null && hasValue(amount)) candidate = { amount, converted: true }
      }
    }
    if (candidate === null) continue
    marketCount += 1
    if (best === null || compareDisplayDecimals(candidate.amount, best.amount) < 0) best = candidate
  }
  return best === null ? null : Object.freeze({ ...best, currency, marketCount })
}

/**
 * The lowest current sell listing across source markets, in the page currency.
 * Provider aggregates, bids and zero placeholders are not listings and are
 * excluded. A listing published only in the other currency is converted with
 * the current daily reference rate so every market competes; without a rate the
 * lowest listing is returned in its own published currency instead.
 */
export function lowestSourceAsk(
  rows: readonly PriceQuoteView[],
  currency: PriceCurrency,
  cnyPerUsd: string | null = null,
): LowestAsk | null {
  return lowestIn(rows, currency, cnyPerUsd, false) ?? lowestIn(rows, otherCurrency(currency), null, true)
}

export type QuoteDisplayAmount = Readonly<{
  amount: string
  /** The page currency, or the published currency when no rate was available. */
  currency: PriceCurrency
  /** True when `amount` is a currency conversion rather than the published value. */
  converted: boolean
  /** A positive price below the smallest unit shown in `currency`. */
  belowUnit: boolean
}>

/**
 * One quote in the page currency: its published amount in that currency when
 * there is one, else its native other-currency amount converted with the
 * current daily reference rate, else that native amount as published.
 */
export function quoteDisplayAmount(
  row: PriceQuoteView,
  currency: PriceCurrency,
  cnyPerUsd: string | null = null,
): QuoteDisplayAmount | null {
  const own = selectedPriceAmount(row, currency)
  if (own?.status === 'AVAILABLE' && isDisplayDecimal(own.amount, currency)) {
    return Object.freeze({ amount: own.amount, currency, converted: own.basis === 'FX_DERIVED', belowUnit: own.rounding === 'ROUNDED_TO_ZERO' })
  }
  const other = otherCurrency(currency)
  const native = selectedPriceAmount(row, other)
  if (native?.status !== 'AVAILABLE' || native.basis !== 'NATIVE' || !isDisplayDecimal(native.amount, other)) return null
  const amount = cnyPerUsd === null ? null : convertDisplayAmount(native.amount, other, cnyPerUsd, SCALE[currency])
  if (amount !== null) {
    return Object.freeze({ amount, currency, converted: true, belowUnit: hasValue(native.amount) && !hasValue(amount) })
  }
  return Object.freeze({ amount: native.amount, currency: other, converted: false, belowUnit: false })
}

/** Explicit native mode never uses a derived CNY amount, a USD amount or FX. */
export function nativeCnyQuoteDisplayAmount(row: PriceQuoteView): QuoteDisplayAmount | null {
  const own = selectedPriceAmount(row, 'CNY')
  if (row.sourcePrice?.currency !== 'CNY' || own?.status !== 'AVAILABLE' || own.basis !== 'NATIVE') return null
  return Object.freeze({ amount: own.amount, currency: 'CNY', converted: false, belowUnit: false })
}

export function lowestNativeCnySourceAsk(rows: readonly PriceQuoteView[]): LowestAsk | null {
  return lowestIn(rows, 'CNY', null, true)
}

/** Display text for one quote; null when there is nothing anyone can trade at. */
export function quoteMoneyText(value: QuoteDisplayAmount): string | null {
  if (value.belowUnit) return value.currency === 'CNY' ? '< ¥0.01' : '< $0.0001'
  if (!hasValue(value.amount)) return null
  return compactMoneyText(value.amount, value.currency, value.converted)
}

function grouped(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/gu, ',')
}

/**
 * Short display text with thousands grouping. CNY keeps 2 decimals; exact USD
 * drops trailing zeros beyond cents; converted USD is an estimate, so it is
 * shown to the cent (or 4 places below a cent).
 */
export function compactMoneyText(amount: string, currency: PriceCurrency, converted = false): string {
  const [integer = '0', fraction = ''] = amount.split('.')
  if (currency === 'CNY') return `¥${grouped(integer)}.${fraction.padEnd(2, '0').slice(0, 2)}`
  if (converted) {
    const cents = roundUsd(amount, 2)
    const shown = cents === '0.00' ? roundUsd(amount, 4) : cents
    const [whole = '0', part = ''] = shown.split('.')
    return `$${grouped(whole)}.${part}`
  }
  const trimmed = fraction.replace(/0+$/u, '')
  return `$${grouped(integer)}.${trimmed.length <= 2 ? trimmed.padEnd(2, '0') : trimmed}`
}

function roundUsd(amount: string, digits: number): string {
  // Rounding a decimal at a rate of 1 is an exact half-even re-scale.
  return convertDisplayAmount(amount, 'CNY', '1', digits) ?? amount
}
