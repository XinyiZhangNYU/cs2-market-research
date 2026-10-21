import type { Lang } from '../i18n'

const DECIMAL = /^(0|[1-9][0-9]*)(?:\.([0-9]+))?$/u

type DecimalParts = Readonly<{ coefficient: bigint; scale: number }>

function decimalParts(value: string): DecimalParts | null {
  const match = DECIMAL.exec(value)
  if (match === null) return null
  const fraction = match[2] ?? ''
  return {
    coefficient: BigInt(`${match[1]}${fraction}`),
    scale: fraction.length,
  }
}

function powerOfTen(exponent: number): bigint {
  return 10n ** BigInt(exponent)
}

function halfEven(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new RangeError('denominator must be positive')
  const quotient = numerator / denominator
  const remainder = numerator % denominator
  const doubled = remainder * 2n
  if (doubled > denominator || (doubled === denominator && quotient % 2n === 1n)) {
    return quotient + 1n
  }
  return quotient
}

function fixedUnits(value: DecimalParts, digits: number): bigint {
  return halfEven(value.coefficient * powerOfTen(digits), powerOfTen(value.scale))
}

function usdUnitsFromCny(value: DecimalParts, rate: DecimalParts, digits: number): bigint | null {
  if (rate.coefficient === 0n) return null
  return halfEven(
    value.coefficient * powerOfTen(rate.scale + digits),
    rate.coefficient * powerOfTen(value.scale),
  )
}

function cnyUnitsFromUsd(value: DecimalParts, rate: DecimalParts, digits: number): bigint | null {
  if (rate.coefficient === 0n) return null
  return halfEven(
    value.coefficient * rate.coefficient * powerOfTen(digits),
    powerOfTen(value.scale + rate.scale),
  )
}

function formatUnits(units: bigint, digits: number, currency: 'CNY' | 'USD'): string {
  const factor = powerOfTen(digits)
  const whole = units / factor
  const fraction = digits === 0 ? '' : `.${(units % factor).toString().padStart(digits, '0')}`
  const grouped = new Intl.NumberFormat(currency === 'CNY' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(whole)
  return `${currency === 'CNY' ? '¥' : '$'}${grouped}${fraction}`
}

/** The display currency of a language: Chinese pages show yuan, English pages dollars. */
export function languageCurrency(lang: Lang): 'CNY' | 'USD' {
  return lang === 'zh' ? 'CNY' : 'USD'
}

/**
 * Converts a published amount into the other currency at the current
 * informational reference rate, as a plain decimal with `digits` fraction
 * digits (half-even). Display-only, like the formatters below; null when the
 * amount or rate cannot be read.
 */
export function convertDisplayAmount(
  value: string,
  from: 'CNY' | 'USD',
  cnyPerUsd: string | null,
  digits: number,
): string | null {
  const amount = decimalParts(value)
  const rate = cnyPerUsd === null ? null : decimalParts(cnyPerUsd)
  if (amount === null || rate === null || !Number.isInteger(digits) || digits < 0 || digits > 8) return null
  const units = from === 'USD' ? cnyUnitsFromUsd(amount, rate, digits) : usdUnitsFromCny(amount, rate, digits)
  if (units === null) return null
  const factor = powerOfTen(digits)
  return digits === 0 ? `${units}` : `${units / factor}.${(units % factor).toString().padStart(digits, '0')}`
}

/**
 * Formats an already-published CNY aggregate for the active UI language.
 * English uses the current informational ECB reference; this never changes stored values,
 * request parameters, ordering, index calculations or historical calibration.
 */
export function formatLocalizedCurrencyFromCny(
  value: string | null,
  lang: Lang,
  cnyPerUsd: string | null,
  digits = 2,
): string {
  if (!Number.isInteger(digits) || digits < 0 || digits > 4 || value === null) return '—'
  const amount = decimalParts(value)
  if (amount === null) return '—'
  if (lang === 'zh') return formatUnits(fixedUnits(amount, digits), digits, 'CNY')
  if (cnyPerUsd === null) return '—'
  const rate = decimalParts(cnyPerUsd)
  if (rate === null) return '—'
  const units = usdUnitsFromCny(amount, rate, digits)
  return units === null ? '—' : formatUnits(units, digits, 'USD')
}

/**
 * Formats an already-published USD amount for the active UI language.
 * Chinese uses the current informational ECB reference; this is display-only
 * and never changes the retained USD history or its analytical meaning.
 */
export function formatLocalizedCurrencyFromUsd(
  value: string | null,
  lang: Lang,
  cnyPerUsd: string | null,
  digits = 2,
): string {
  if (!Number.isInteger(digits) || digits < 0 || digits > 4 || value === null) return '—'
  const amount = decimalParts(value)
  if (amount === null) return '—'
  if (lang === 'en') return formatUnits(fixedUnits(amount, digits), digits, 'USD')
  if (cnyPerUsd === null) return '—'
  const rate = decimalParts(cnyPerUsd)
  if (rate === null) return '—'
  const units = cnyUnitsFromUsd(amount, rate, digits)
  return units === null ? '—' : formatUnits(units, digits, 'CNY')
}
