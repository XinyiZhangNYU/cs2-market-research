import type {
  TradeUpGraphDocument,
  TradeUpInput,
  TradeUpOutcome,
  TradeUpSimulation,
  TradeUpSkin,
} from './tradeupTypes'
import { TradeUpError } from './tradeupTypes'
import { validateTradeUpGraph } from './tradeupGraph.mjs'

type Fraction = Readonly<{ numerator: bigint; denominator: bigint }>

const TEN = 10n
const RARITY_NEXT = new Map([[1, 2], [2, 3], [3, 4], [4, 5], [5, 6]])

function abs(value: bigint): bigint {
  return value < 0n ? -value : value
}

function gcd(left: bigint, right: bigint): bigint {
  let a = abs(left)
  let b = abs(right)
  while (b !== 0n) [a, b] = [b, a % b]
  return a || 1n
}

function fraction(numerator: bigint, denominator = 1n): Fraction {
  if (denominator === 0n) throw new TradeUpError('INVALID_RANGE', 'division by zero')
  const sign = denominator < 0n ? -1n : 1n
  const common = gcd(numerator, denominator)
  return Object.freeze({
    numerator: numerator / common * sign,
    denominator: abs(denominator) / common,
  })
}

function decimal(value: string): Fraction {
  const text = value.trim()
  const match = text.match(/^([+-]?)(\d+)(?:\.(\d+))?$/u)
  if (!match) throw new TradeUpError('INVALID_FLOAT', `invalid float: ${value}`)
  const digits = match[3] ?? ''
  const sign = match[1] === '-' ? -1n : 1n
  return fraction(sign * BigInt(`${match[2]}${digits}`), TEN ** BigInt(digits.length))
}

function add(left: Fraction, right: Fraction): Fraction {
  return fraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  )
}

function subtract(left: Fraction, right: Fraction): Fraction {
  return fraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  )
}

function multiply(left: Fraction, right: Fraction): Fraction {
  return fraction(left.numerator * right.numerator, left.denominator * right.denominator)
}

function divide(left: Fraction, right: Fraction): Fraction {
  return fraction(left.numerator * right.denominator, left.denominator * right.numerator)
}

function compare(left: Fraction, right: Fraction): number {
  const value = left.numerator * right.denominator - right.numerator * left.denominator
  return value < 0n ? -1 : value > 0n ? 1 : 0
}

function quantizedInteger(value: Fraction, scale: bigint): bigint {
  const scaled = value.numerator * scale
  let quotient = scaled / value.denominator
  const remainder = abs(scaled % value.denominator)
  const twice = remainder * 2n
  if (twice > value.denominator || (twice === value.denominator && abs(quotient) % 2n === 1n)) {
    quotient += scaled < 0n ? -1n : 1n
  }
  return quotient
}

function fixed(value: Fraction, digits = 12): string {
  const scale = TEN ** BigInt(digits)
  const integer = quantizedInteger(value, scale)
  const sign = integer < 0n ? '-' : ''
  const padded = abs(integer).toString().padStart(digits + 1, '0')
  return digits === 0 ? `${sign}${padded}` : `${sign}${padded.slice(0, -digits)}.${padded.slice(-digits)}`
}

export function tradeUpDecimalLabel(value: string, digits = 4): string {
  const rounded = fixed(decimal(value), digits)
  return rounded.replace(/\.0+$/u, '').replace(/(\.\d*?)0+$/u, '$1')
}

export function tradeUpProbabilityPercent(value: Fraction): string {
  return `${fixed(multiply(value, fraction(100n)), 2).replace(/\.00$/u, '').replace(/(\.\d)0$/u, '$1')}%`
}

function normalize(value: Fraction, minimum: Fraction, maximum: Fraction): Fraction {
  const span = subtract(maximum, minimum)
  if (compare(span, fraction(0n)) <= 0) throw new TradeUpError('INVALID_RANGE', 'invalid float range')
  if (compare(value, minimum) < 0 || compare(value, maximum) > 0) {
    throw new TradeUpError('FLOAT_OUTSIDE_PAINT', 'float is outside the selected finish range')
  }
  return divide(subtract(value, minimum), span)
}

function outputFloat(normalized: Fraction, skin: TradeUpSkin): Fraction {
  const minimum = decimal(skin.float_min)
  const maximum = decimal(skin.float_max)
  if (compare(maximum, minimum) <= 0) throw new TradeUpError('INVALID_RANGE', 'invalid output float range')
  return add(minimum, multiply(normalized, subtract(maximum, minimum)))
}

function wear(value: Fraction): readonly [string, string] {
  if (compare(value, decimal('0.07')) < 0) return ['Factory New', '崭新出厂']
  if (compare(value, decimal('0.15')) < 0) return ['Minimal Wear', '略有磨损']
  if (compare(value, decimal('0.38')) < 0) return ['Field-Tested', '久经沙场']
  if (compare(value, decimal('0.45')) < 0) return ['Well-Worn', '破损不堪']
  return ['Battle-Scarred', '战痕累累']
}

export function tradeUpWearLabel(value: string, lang: 'zh' | 'en'): string {
  const [en, zh] = wear(decimal(value))
  return lang === 'zh' ? zh : en
}

function labelZh(graph: TradeUpGraphDocument, value: string): string | null {
  let changed = false
  const result = value.split(' + ').map((part) => {
    const mapped = graph.labels_zh.collections[part] ?? graph.labels_zh.cases[part]
    if (mapped) changed = true
    return mapped ?? part
  }).join(' + ')
  return changed ? result : null
}

// Called after graph validation: shared UI/engine admission rule.
function inputEditions(graph: TradeUpGraphDocument, skin: TradeUpSkin, byId: ReadonlyMap<string, TradeUpSkin>): readonly ('standard' | 'stattrak')[] {
  if (skin.kind !== 'weapon' || !RARITY_NEXT.has(skin.rarity_tier) || skin.collection === null) return []
  const pool = graph.collections[skin.collection]?.by_tier[String(RARITY_NEXT.get(skin.rarity_tier))] ?? []
  if (pool.length === 0) return []
  if (pool.some((id) => !byId.has(id))) throw new TradeUpError('INVALID_GRAPH', 'missing output member')
  return skin.has_stattrak && pool.some((id) => byId.get(id)!.has_stattrak)
    ? ['standard', 'stattrak'] : ['standard']
}

export function tradeUpInputEditions(graph: TradeUpGraphDocument, skin: TradeUpSkin): readonly ('standard' | 'stattrak')[] {
  return inputEditions(graph, skin, new Map(graph.skins.map((row) => [row.id, row])))
}

// One index per graph, not one 1,973-row index per candidate skin. Keep the
// single-item admission rule and missing-member rejection exactly the same.
export function tradeUpInputEditionMap(graph: TradeUpGraphDocument): ReadonlyMap<string, readonly ('standard' | 'stattrak')[]> {
  const byId = new Map(graph.skins.map((row) => [row.id, row]))
  return new Map(graph.skins.map((skin) => [skin.id, inputEditions(graph, skin, byId)]))
}

export function simulateTradeUp(
  graph: TradeUpGraphDocument,
  inputs: readonly TradeUpInput[],
): TradeUpSimulation {
  try { validateTradeUpGraph(graph) } catch { throw new TradeUpError('INVALID_GRAPH', 'trade-up graph is incomplete or invalid') }
  if (inputs.length === 0) throw new TradeUpError('EMPTY_INPUTS', 'no inputs')
  const skinById = new Map(graph.skins.map((skin) => [skin.id, skin]))
  const skins = inputs.map((input) => {
    if (!['standard', 'stattrak', 'souvenir'].includes(input.edition)) {
      throw new TradeUpError('UNKNOWN_EDITION', 'unknown input edition')
    }
    if (input.edition === 'souvenir') {
      throw new TradeUpError('SOUVENIR_WITHHELD', 'per-finish Souvenir eligibility is not available in this release')
    }
    const skin = skinById.get(input.id)
    if (!skin) throw new TradeUpError('UNKNOWN_SKIN', `unknown skin: ${input.id}`)
    if (input.edition === 'stattrak' && !skin.has_stattrak) {
      throw new TradeUpError('NO_STATTRAK', `${skin.id} has no StatTrak version`)
    }
    return skin
  })
  const normalizedInputs = inputs.map((input, index) => input.float === null
    ? null
    : normalize(decimal(input.float), decimal(skins[index].float_min), decimal(skins[index].float_max)))
  const hasWear = normalizedInputs.every((value) => value !== null)
  const hasNoWear = normalizedInputs.every((value) => value === null)
  if (!hasWear && !hasNoWear) {
    throw new TradeUpError('MIXED_WEAR_MODE', 'wear values cannot be mixed with no-wear inputs')
  }
  if (skins.some((skin) => skin.kind !== 'weapon')) {
    throw new TradeUpError('NON_WEAPON_INPUT', 'inputs must be weapon finishes')
  }
  const tiers = new Set(skins.map((skin) => skin.rarity_tier))
  if (tiers.size !== 1) throw new TradeUpError('MIXED_RARITY', 'inputs must share one rarity')
  const tier = skins[0].rarity_tier
  if (tier === 7) throw new TradeUpError('CONTRABAND', 'contraband cannot be traded up')
  if (tier === 6) throw new TradeUpError('GOLD_WITHHELD', 'gold pool membership and odds await authoritative evidence')

  const editions = new Set(inputs.map((input) => input.edition))
  if (editions.has('stattrak') && (editions.size !== 1 || !editions.has('stattrak'))) {
    throw new TradeUpError('MIXED_EDITION', 'StatTrak cannot be mixed with other editions')
  }
  const edition = editions.size === 1 && editions.has('stattrak') ? 'stattrak' : 'standard'
  const contract = RARITY_NEXT.has(tier) ? 'weapon_10' : null
  if (contract === null) throw new TradeUpError('UNSUPPORTED_TIER', 'this rarity cannot be traded up')
  const slots = 10
  if (inputs.length !== slots) throw new TradeUpError('WRONG_SLOT_COUNT', `${contract} needs ${slots} inputs`)

  const average = hasWear
    ? divide(
        normalizedInputs.reduce(
          (total, value) => add(total, value as Fraction),
          fraction(0n),
        ),
        fraction(BigInt(slots)),
      )
    : null

  const groups = new Map<string, number>()
  skins.forEach((skin) => {
    const key = skin.collection
    if (!key) throw new TradeUpError('NO_COLLECTION', `${skin.id} has no output group`)
    groups.set(key, (groups.get(key) ?? 0) + 1)
  })

  const pools = new Map<string, readonly string[]>()
  groups.forEach((_count, name) => {
    let pool = graph.collections[name]?.by_tier[String(RARITY_NEXT.get(tier))] ?? []
    pool = pool.filter((id) => {
      const candidate = skinById.get(id)
      if (!candidate) throw new TradeUpError('INVALID_GRAPH', 'missing output member')
      return edition !== 'stattrak' || candidate.has_stattrak
    })
    if (pool.length === 0) throw new TradeUpError('EMPTY_OUTPUT_POOL', `${name} has no eligible outputs`)
    pools.set(name, pool)
  })

  const weights = new Map<string, Fraction>()
  const sources = new Map<string, string[]>()
  groups.forEach((count, name) => {
    const pool = pools.get(name)!
    const piece = divide(fraction(BigInt(count), BigInt(slots)), fraction(BigInt(pool.length)))
    pool.forEach((id) => {
      weights.set(id, add(weights.get(id) ?? fraction(0n), piece))
      const current = sources.get(id) ?? []
      if (!current.includes(name)) current.push(name)
      sources.set(id, current)
    })
  })

  const outcomes: TradeUpOutcome[] = [...weights.entries()].map(([id, probability]) => {
    const skin = skinById.get(id)!
    const value = average === null ? null : outputFloat(average, skin)
    const [wearEn, wearZh] = value === null ? [null, null] : wear(value)
    const group = (sources.get(id) ?? []).join(' + ')
    return Object.freeze({
      skin,
      probability,
      probability_text: `${probability.numerator}/${probability.denominator}`,
      output_float: value === null ? null : fixed(value, 12),
      wear_en: wearEn,
      wear_zh: wearZh,
      group,
      group_zh: labelZh(graph, group),
    })
  })
  outcomes.sort((left, right) => {
    const probabilityOrder = compare(right.probability, left.probability)
    return probabilityOrder || left.skin.id.localeCompare(right.skin.id, 'en')
  })
  const total = outcomes.reduce((sum, outcome) => add(sum, outcome.probability), fraction(0n))
  if (compare(total, fraction(1n)) !== 0) throw new TradeUpError('PROBABILITY_NOT_ONE', 'probability total is not one')

  return Object.freeze({
    contract,
    slots,
    rarity_tier: tier,
    edition,
    avg_normalized: average === null ? null : fixed(average, 12),
    outcomes: Object.freeze(outcomes),
    groups: Object.freeze([...groups.entries()].sort(([left], [right]) => left.localeCompare(right, 'en')).map(([name, count]) => Object.freeze({
      name,
      inputs: count,
      pool: pools.get(name)!.length,
    }))),
  })
}
