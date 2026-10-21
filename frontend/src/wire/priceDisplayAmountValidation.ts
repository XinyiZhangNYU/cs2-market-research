import { canonicalHash } from './canonical'
import type { PriceAmount, PriceFx, PriceQuote } from './priceDisplayApiTypes'
import { priceAssert, priceDateDay, priceEvent, priceInstantMicros } from './priceDisplayPrimitives'

const CNY_MAX = 9_223_372_036_854_775_807n
const USD_MAX = 10n ** 38n - 1n
const SOURCE_REASONS = ['SOURCE_UNAVAILABLE', 'CAPTURE_GAP', 'SOURCE_CONFLICT']
const NO_RATE_REASONS = ['NO_ELIGIBLE_FX', 'FX_STALE']
const RATE_ID_FIELDS = ['authority', 'method', 'source_event_date', 'cny_per_usd', 'cny_valid_from', 'usd_valid_from', 'available_at', 'fx_selection_policy_version'] as const
const scaled = (value: string): bigint => BigInt(value.replace('.', ''))

function validateAmountRange(amount: PriceAmount): void {
  if (amount.status !== 'AVAILABLE') return
  priceAssert(scaled(amount.amount) <= (amount.currency === 'USD' ? USD_MAX : CNY_MAX))
}

function validateFx(quote: PriceQuote, fx: PriceFx, knownAt: string): void {
  priceInstantMicros(fx.available_at)
  priceInstantMicros(fx.cny_valid_from)
  priceInstantMicros(fx.usd_valid_from)
  priceAssert(fx.cny_valid_from <= fx.available_at && fx.usd_valid_from <= fx.available_at)
  priceAssert(fx.available_at <= quote.available_at && fx.available_at <= knownAt)
  const event = priceEvent(quote)
  priceAssert(event !== null && quote.source_price !== null)
  priceAssert(priceDateDay(event.slice(0, 10)) - priceDateDay(fx.source_event_date) === fx.carry_days)
  priceAssert(canonicalHash(Object.fromEntries(RATE_ID_FIELDS.map((field) => [field, fx[field]]))) === fx.public_rate_id)
  priceAssert(scaled(fx.cny_per_usd) > 0n)
  if (fx.conversion_policy_version === 'ecb-eur-cross-daily/2') priceAssert(quote.source_price.currency === 'USD')
}

/** Check a sealed amount's integer relation; never compute or return a replacement
 * display amount. The UI can only select strings supplied by the validated wire. */
function assertSealedHalfEven(target: PriceAmount, numerator: bigint, denominator: bigint): void {
  const maximum = target.currency === 'USD' ? USD_MAX : CNY_MAX
  if (target.status === 'UNAVAILABLE') {
    priceAssert(target.reason === 'AMOUNT_OUT_OF_RANGE')
    const boundary = (2n * maximum + 1n) * denominator
    priceAssert(2n * numerator > boundary || (2n * numerator === boundary && maximum % 2n === 1n))
    return
  }
  priceAssert(target.basis === 'FX_DERIVED')
  const supplied = scaled(target.amount)
  const difference = numerator - supplied * denominator
  const distance = difference < 0n ? -difference : difference
  priceAssert(2n * distance <= denominator)
  if (2n * distance === denominator) priceAssert(supplied % 2n === 0n)
  const rounding = difference === 0n ? 'EXACT' : supplied === 0n && numerator > 0n ? 'ROUNDED_TO_ZERO' : 'ROUNDED'
  priceAssert(target.rounding === rounding)
}

export function validatePriceAmounts(quote: PriceQuote, knownAt: string): void {
  const { source_price: source, amounts, fx } = quote
  validateAmountRange(amounts.USD)
  validateAmountRange(amounts.CNY)
  if (source === null) {
    priceAssert(quote.source_price_reason !== null && SOURCE_REASONS.includes(quote.source_price_reason))
    priceAssert(amounts.USD.status === 'UNAVAILABLE' && amounts.CNY.status === 'UNAVAILABLE')
    priceAssert(amounts.USD.reason === quote.source_price_reason && amounts.CNY.reason === quote.source_price_reason && fx === null)
    return
  }
  priceAssert(quote.source_price_reason === null)
  const native = amounts[source.currency]
  const target = amounts[source.currency === 'USD' ? 'CNY' : 'USD']
  const nativeScaled = scaled(source.value)
  priceAssert(nativeScaled <= (source.currency === 'USD' ? USD_MAX : CNY_MAX))
  priceAssert(native.status === 'AVAILABLE' && native.basis === 'NATIVE' && native.rounding === 'EXACT')
  if (source.currency === 'USD') priceAssert(native.amount === source.value)
  else {
    const minor = source.value.padStart(3, '0')
    priceAssert(native.amount === `${minor.slice(0, -2)}.${minor.slice(-2)}`)
  }
  if (fx === null) {
    priceAssert(target.status === 'UNAVAILABLE' && NO_RATE_REASONS.includes(target.reason))
    if (priceEvent(quote) === null) priceAssert(target.reason === 'NO_ELIGIBLE_FX')
    return
  }
  validateFx(quote, fx, knownAt)
  const rate = scaled(fx.cny_per_usd)
  assertSealedHalfEven(target,
    source.currency === 'USD' ? nativeScaled * rate : nativeScaled * 10n ** 24n,
    source.currency === 'USD' ? 10n ** 24n : rate,
  )
}
