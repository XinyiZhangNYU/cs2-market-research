/** Display-boundary arithmetic. Source decimal strings are never accumulated as Number. */
function parts(value: string) {
  const match = /^(-?)([0-9]+)(?:\.([0-9]+))?$/u.exec(value)
  if (!match || value.length > 200) return null
  const fraction = match[3] ?? ''
  return { coefficient: BigInt(`${match[1]}${match[2]}${fraction}`), scale: 10n ** BigInt(fraction.length) }
}
function rounded(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n
  const n = negative ? -numerator : numerator
  const quotient = n / denominator, remainder = n % denominator
  const increment = remainder * 2n > denominator || remainder * 2n === denominator && quotient % 2n !== 0n
  const result = quotient + (increment ? 1n : 0n)
  return negative ? -result : result
}

export function formatExactDisplayDecimal(value: string | null, lang: 'zh' | 'en', digits = 2): string {
  const parsed = value === null ? null : parts(value)
  if (!parsed || !Number.isInteger(digits) || digits < 0 || digits > 8) return '—'
  const factor = 10n ** BigInt(digits)
  const units = rounded(parsed.coefficient * factor, parsed.scale), magnitude = units < 0n ? -units : units
  const whole = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 0 }).format(magnitude / factor)
  const fraction = digits === 0 ? '' : (magnitude % factor).toString().padStart(digits, '0').replace(/0+$/u, '')
  return `${units < 0n ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

const STICKY_DIGITS = 40

/**
 * Exact value / base - 1 as a decimal string for display text. An inexact quotient is
 * truncated to STICKY_DIGITS and given a trailing non-zero digit, which keeps it strictly
 * between the same grid points as the rational: any later single rounding to fewer
 * decimals (Intl formats decimal strings without converting to Number) lands on the
 * exact value's side of every threshold. Never use the chart coordinate for text.
 */
export function exactRelativeDecimal(value: string, base: string): string | null {
  const v = parts(value), b = parts(base)
  if (!v || !b || b.coefficient <= 0n) return null
  const n = v.coefficient * b.scale - b.coefficient * v.scale
  const d = b.coefficient * v.scale
  const magnitude = n < 0n ? -n : n
  const scaled = magnitude * 10n ** BigInt(STICKY_DIGITS)
  const digits = (scaled / d) * 10n + (scaled % d === 0n ? 0n : 1n)
  const text = digits.toString().padStart(STICKY_DIGITS + 2, '0')
  const whole = text.slice(0, -(STICKY_DIGITS + 1))
  const fraction = text.slice(-(STICKY_DIGITS + 1)).replace(/0+$/u, '')
  return `${n < 0n ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

/**
 * Intl formats a decimal string as its exact mathematical value (ECMA-402 NumberFormat v3),
 * so the final rounding happens once, on the exact decimal. Engines without v3 fall back to
 * ToNumber, i.e. the pre-existing Number behaviour.
 */
export function formatDecimalWithIntl(format: Intl.NumberFormat, value: number | string): string {
  return format.format(value as unknown as number)
}

/** Final numeric coordinate for ECharts; division/subtraction happen in integer rationals. */
export function exactRelativeDisplayCoordinate(value: string, base: string): number | null {
  const v = parts(value), b = parts(base)
  if (!v || !b || b.coefficient <= 0n) return null
  const n = v.coefficient * b.scale - b.coefficient * v.scale
  const d = b.coefficient * v.scale
  const factor = 10n ** 18n
  const coordinate = Number(rounded(n * factor, d)) / 1e18
  return Number.isFinite(coordinate) ? coordinate : null
}
