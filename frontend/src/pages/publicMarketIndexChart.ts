import type { MarketSectorIndexPoint, MarketSectorIndexScope } from '../wire/marketSectorIndexPublicApiTypes'
import { exactRelativeDecimal, exactRelativeDisplayCoordinate } from '../price/exactDisplayDecimal'
import { NATIVE_CNY_ALL_START } from '../api/nativeCnyAllHistory'

export const INDEX_CHART_MAX_DAYS = 366
export const INDEX_RANGES = ['7D', '1M', '3M', '1Y'] as const
export const NATIVE_INDEX_RANGES = [...INDEX_RANGES, 'ALL'] as const
export type IndexRange = (typeof NATIVE_INDEX_RANGES)[number]
export type MarketBoardView = 'MARKET' | 'SECTORS'

export const INDEX_RANGE_DAYS: Record<Exclude<IndexRange, 'ALL'>, number> = {
  '7D': 7,
  '1M': 31,
  '3M': 92,
  '1Y': INDEX_CHART_MAX_DAYS,
}

const DAY_MS = 86_400_000

export function fetchRangeFor(range: IndexRange): Extract<IndexRange, '3M' | '1Y' | 'ALL'> {
  return range === 'ALL' ? 'ALL' : range === '1Y' ? '1Y' : '3M'
}

/** All is assembled outside pagination; keep the existing bounded request shape. */
export function indexRequestLimit(range: IndexRange): number {
  return range === 'ALL' ? INDEX_CHART_MAX_DAYS : INDEX_RANGE_DAYS[range]
}

export function indexFromForRange(first: string | null, last: string, range: IndexRange): string {
  if (range === 'ALL') return NATIVE_CNY_ALL_START
  const lower = first === null ? Number.NEGATIVE_INFINITY : new Date(`${first}T00:00:00.000Z`).getTime()
  const span = range === '1Y' ? INDEX_CHART_MAX_DAYS : INDEX_RANGE_DAYS[range] - 1
  const preferred = new Date(`${last}T00:00:00.000Z`).getTime() - span * DAY_MS
  return new Date(Math.max(lower, preferred)).toISOString().slice(0, 10)
}

export function recentIndexFrom(first: string, last: string): string {
  return indexFromForRange(first, last, '1Y')
}

export function numericIndex(point: MarketSectorIndexPoint): number | null {
  if (point.index.value === null) return null
  const value = Number(point.index.value)
  return Number.isFinite(value) ? value : null
}

export function numericAskSum(point: MarketSectorIndexPoint): number | null {
  const raw = point.absolute_price.member_minimum_ask_sum_cny
  if (raw === null) return null
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : null
}

export function filterPointsByRange(
  points: readonly MarketSectorIndexPoint[],
  range: IndexRange,
): readonly MarketSectorIndexPoint[] {
  if (range === 'ALL') return points
  const last = points.at(-1)
  if (last === undefined) return points
  const end = Date.parse(`${last.date}T00:00:00.000Z`)
  if (!Number.isFinite(end)) return points
  const start = end - (INDEX_RANGE_DAYS[range] - 1) * DAY_MS
  return points.filter((point) => {
    const time = Date.parse(`${point.date}T00:00:00.000Z`)
    return Number.isFinite(time) && time >= start
  })
}

function adjacentUtcDays(previous: string, current: string): boolean {
  const start = Date.parse(`${previous}T00:00:00.000Z`)
  const end = Date.parse(`${current}T00:00:00.000Z`)
  return Number.isFinite(start) && Number.isFinite(end) && end - start === DAY_MS
}

function connectedAdjacentWindow(points: readonly MarketSectorIndexPoint[]): boolean {
  if (points.length < 2) return false
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    if (
      !current.connect_to_previous
      || current.segment_id === null
      || current.segment_id !== previous.segment_id
      || current.index.period_return === null
      || numericIndex(previous) === null
      || numericIndex(current) === null
      || !adjacentUtcDays(previous.date, current.date)
    ) {
      return false
    }
  }
  return true
}

/** Public return continuity. Visual bridges must never relax this predicate. */
export function formallyConnectedPair(
  previous: MarketSectorIndexPoint,
  current: MarketSectorIndexPoint,
): boolean {
  return connectedAdjacentWindow([previous, current])
}

export function expectedWindowStart(lastDate: string, range: IndexRange): string {
  if (range === 'ALL') return NATIVE_CNY_ALL_START
  const end = Date.parse(`${lastDate}T00:00:00.000Z`)
  return new Date(end - (INDEX_RANGE_DAYS[range] - 1) * DAY_MS).toISOString().slice(0, 10)
}

/** Last/first only when every step is an adjacent connected return. Passing `range` also requires a complete calendar span. */
/**
 * A ratio for display text. Native CNY values are exact decimal strings (formatted by
 * Intl without a Number round trip); legacy values keep their historical Number path.
 */
export type PublicRatio = number | string

/** Sign/magnitude for colour and direction only; never for display text. */
export function ratioNumber(value: PublicRatio): number {
  return typeof value === 'number' ? value : Number(value)
}

export function windowReturn(
  points: readonly MarketSectorIndexPoint[],
  range?: IndexRange,
): PublicRatio | null {
  if (!connectedAdjacentWindow(points)) return null
  const first = points[0]
  const last = points.at(-1)
  if (first === undefined || last === undefined) return null
  if (range !== undefined && range !== 'ALL' && first.date !== expectedWindowStart(last.date, range)) return null
  if (first.native_cny || last.native_cny) return first.index.value === null || last.index.value === null
    ? null : exactRelativeDecimal(last.index.value, first.index.value)
  const firstValue = numericIndex(first)
  const lastValue = numericIndex(last)
  if (firstValue === null || lastValue === null || firstValue === 0) return null
  return lastValue / firstValue - 1
}

/** Latest official adjacent-day return for compact sector cards. */
export function latestDailyReturn(points: readonly MarketSectorIndexPoint[]): PublicRatio | null {
  const current = points.at(-1)
  const previous = points.at(-2)
  if (current === undefined || previous === undefined || !formallyConnectedPair(previous, current)) return null
  const value = current.index.period_return === null ? Number.NaN : Number(current.index.period_return)
  if (!Number.isFinite(value)) return null
  // The producer's exact decimal string is the display source for native CNY.
  return current.native_cny ? current.index.period_return : value
}

export type ChartPoint = Readonly<{ date: string; value: number | null }>

export type ChartPointDisclosure = Readonly<{
  date: string
  /** Exact native display text, independent of the lossy canvas coordinate. */
  nativeIndexDisplay?: string | null
  availability: MarketSectorIndexPoint['availability']
  overallQuality: MarketSectorIndexPoint['quality']['overall']
  coverageFloor: string | null
  gradeCounts: MarketSectorIndexPoint['quality']['grade_counts']
  reasonCodes: readonly string[]
  visualBridgeFromPrevious: boolean
}>

export function chartPointDisclosures(
  points: readonly MarketSectorIndexPoint[],
): readonly ChartPointDisclosure[] {
  return points.map((point, index) => {
    const previous = points[index - 1]
    return {
      date: point.date,
      ...(point.native_cny ? { nativeIndexDisplay: point.index.value } : {}),
      availability: point.availability,
      overallQuality: point.quality.overall,
      coverageFloor: point.coverage.coverage_ratio_lower_bound,
      gradeCounts: point.quality.grade_counts,
      reasonCodes: point.quality.reason_codes,
      visualBridgeFromPrevious: !point.native_cny && previous !== undefined
        && numericIndex(previous) !== null
        && numericIndex(point) !== null
        && !formallyConnectedPair(previous, point),
    }
  })
}

export function connectedRuns(
  points: readonly MarketSectorIndexPoint[],
  valueOf: (point: MarketSectorIndexPoint, starting: boolean) => number | null,
): readonly (readonly ChartPoint[])[] {
  const runs: ChartPoint[][] = []
  let active: ChartPoint[] | null = null
  points.forEach((point, index) => {
    const previous = points[index - 1]
    const starting = active === null
      || previous === undefined
      || !formallyConnectedPair(previous, point)
    const value = valueOf(point, starting)
    if (value === null) {
      active = null
      return
    }
    if (starting || active === null) {
      active = points.map((candidate) => ({ date: candidate.date, value: null }))
      runs.push(active)
    }
    active[index] = { date: point.date, value }
  })
  return runs
}

export function indexLevelRuns(points: readonly MarketSectorIndexPoint[]): readonly (readonly ChartPoint[])[] {
  return connectedRuns(points, (point) => numericIndex(point))
}

export function rebasedPercentRuns(points: readonly MarketSectorIndexPoint[]): readonly (readonly ChartPoint[])[] {
  let base: number | null = null
  let nativeBase: string | null = null
  return connectedRuns(points, (point, starting) => {
    if (point.native_cny) {
      if (starting) nativeBase = point.index.value
      return point.index.value === null || nativeBase === null ? null : exactRelativeDisplayCoordinate(point.index.value, nativeBase)
    }
    const value = numericIndex(point)
    if (value === null) return null
    if (base === null) base = value
    if (base === 0) return null
    return value / base - 1
  })
}

function visualBridgeRuns(
  points: readonly MarketSectorIndexPoint[],
  valueOf: (point: MarketSectorIndexPoint) => number | null,
): readonly (readonly ChartPoint[])[] {
  const bridges: ChartPoint[][] = []
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!
    const current = points[index]!
    if (current.native_cny || previous.native_cny) continue
    if (formallyConnectedPair(previous, current)) continue
    const previousValue = valueOf(previous)
    const currentValue = valueOf(current)
    if (previousValue === null || currentValue === null) continue
    const bridge = points.map((point) => ({ date: point.date, value: null as number | null }))
    bridge[index - 1] = { date: previous.date, value: previousValue }
    bridge[index] = { date: current.date, value: currentValue }
    bridges.push(bridge)
  }
  return bridges
}

/** Display-only joins between finite points that are not a formal adjacent-return chain. */
export function indexLevelBridgeRuns(
  points: readonly MarketSectorIndexPoint[],
): readonly (readonly ChartPoint[])[] {
  return visualBridgeRuns(points, numericIndex)
}

/** Display-only joins use the same window baseline as the solid overlay runs. */
export function rebasedPercentBridgeRuns(
  points: readonly MarketSectorIndexPoint[],
): readonly (readonly ChartPoint[])[] {
  const base = points.map(numericIndex).find((value): value is number => value !== null) ?? null
  return visualBridgeRuns(points, (point) => {
    const value = numericIndex(point)
    return value === null || base === null || base === 0 ? null : value / base - 1
  })
}

export function runCount(runs: readonly (readonly ChartPoint[])[]): number {
  return runs.length
}

function finitePointCount(run: readonly ChartPoint[]): number {
  return run.reduce((count, point) => count + (point.value === null ? 0 : 1), 0)
}

/** Longest connected stretch only; later stubs wait for reconstructed history. */
export function primaryRun(runs: readonly (readonly ChartPoint[])[]): readonly ChartPoint[] {
  let best: readonly ChartPoint[] = []
  let bestCount = -1
  for (const run of runs) {
    const count = finitePointCount(run)
    if (count > bestCount) {
      best = run
      bestCount = count
    }
  }
  return best
}

/** Single-series longest connected run; not a full window or cross-series common chain. */
export function longestConnectedReturn(points: readonly MarketSectorIndexPoint[]): PublicRatio | null {
  let best: MarketSectorIndexPoint[] = []
  let active: MarketSectorIndexPoint[] = []
  for (const point of points) {
    if (numericIndex(point) === null) {
      active = []
      continue
    }
    const previous = active.at(-1)
    if (previous === undefined || !connectedAdjacentWindow([previous, point])) active = [point]
    else active.push(point)
    if (active.length > best.length) best = [...active]
  }
  return windowReturn(best)
}

/** Compatibility alias. This does not intersect two series' observable return dates. */
export function commonObservableReturn(points: readonly MarketSectorIndexPoint[]): PublicRatio | null {
  return longestConnectedReturn(points)
}

export function joinedLevelLine(runs: readonly (readonly ChartPoint[])[]): readonly ChartPoint[] {
  return unionChartDates(runs).map((date) => {
    for (const run of runs) {
      const point = run.find((candidate) => candidate.date === date)
      if (point !== undefined && point.value !== null) return point
    }
    return { date, value: null }
  })
}

export function formatChartValue(value: unknown, format: (value: number) => string, empty = '—'): string {
  return typeof value === 'number' && Number.isFinite(value) ? format(value) : empty
}

export function unionChartDates(runs: readonly (readonly ChartPoint[])[]): readonly string[] {
  const dates = new Set<string>()
  for (const run of runs) {
    for (const point of run) dates.add(point.date)
  }
  return [...dates].sort()
}

export function valuesOnDates(
  run: readonly ChartPoint[],
  dates: readonly string[],
): readonly (number | null)[] {
  const byDate = new Map(run.map((point) => [point.date, point.value]))
  return dates.map((date) => byDate.get(date) ?? null)
}

export function sectorScopes(scopes: readonly MarketSectorIndexScope[]): readonly MarketSectorIndexScope[] {
  return scopes.filter((scope) => scope.scope_kind === 'SECTOR')
}

export function marketScope(
  scopes: readonly MarketSectorIndexScope[],
  preferredCode: string,
): MarketSectorIndexScope | undefined {
  return scopes.find((scope) => scope.scope_code === preferredCode && scope.scope_kind === 'MARKET')
    ?? scopes.find((scope) => scope.scope_kind === 'MARKET')
    ?? scopes.find((scope) => scope.scope_code === preferredCode)
}

/** Mirrors `.formal-site` tokens; canvas charts cannot read CSS variables. */
export const INDEX_CHART_THEME = {
  paper: '#fffdf7',
  ink: '#102c3a',
  text: '#25262d',
  muted: '#686762',
  navy: '#1e202f',
  blue: '#3281ac',
  amber: '#e48717',
  rust: '#c45c2a',
  panel: '#e7e7df',
  split: 'rgba(30, 32, 47, 0.12)',
  tooltipBorder: 'rgba(158, 180, 186, 0.7)',
} as const

export const SECTOR_LINE_COLORS = [
  '#56b4e9',
  '#e69f00',
  '#cc79a7',
  '#009e73',
  '#d55e00',
  '#0072b2',
  '#333333',
] as const

export const SECTOR_LINE_COLOR_BY_CODE = {
  GLOVE: SECTOR_LINE_COLORS[0],
  ARMORY: SECTOR_LINE_COLORS[1],
  COLLECTION: SECTOR_LINE_COLORS[2],
  KNIFE: SECTOR_LINE_COLORS[3],
  AGENT: SECTOR_LINE_COLORS[4],
  WEAPON: SECTOR_LINE_COLORS[5],
  CASE: SECTOR_LINE_COLORS[6],
} as const

function mixRgb(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  t: number,
): string {
  const mix = (index: 0 | 1 | 2) => Math.round(from[index] + (to[index] - from[index]) * t)
  return `rgb(${mix(0)} ${mix(1)} ${mix(2)})`
}

function fillLuminance(color: string): number {
  const match = /^rgb\((\d+) (\d+) (\d+)\)$/u.exec(color)
  if (match === null) return 1
  return (0.2126 * Number(match[1]) + 0.7152 * Number(match[2]) + 0.0722 * Number(match[3])) / 255
}

export function returnFill(ratio: number | null): string {
  if (ratio === null || !Number.isFinite(ratio)) return INDEX_CHART_THEME.panel
  const magnitude = Math.min(1, Math.abs(ratio) / 0.08)
  const stop = 0.22 + 0.78 * magnitude
  if (ratio >= 0) return mixRgb([213, 229, 237], [50, 129, 172], stop)
  return mixRgb([243, 228, 212], [196, 92, 42], stop)
}

export function returnLabel(ratio: number | null): string {
  return fillLuminance(returnFill(ratio)) > 0.55 ? INDEX_CHART_THEME.ink : INDEX_CHART_THEME.paper
}

/** Stronger tile fills so a small window return is not a white, unreadable block. */
export function tileFill(value: PublicRatio | null): string {
  const ratio = value === null ? Number.NaN : ratioNumber(value)
  if (!Number.isFinite(ratio)) return INDEX_CHART_THEME.panel
  const magnitude = Math.min(1, Math.abs(ratio) / 0.12)
  const stop = 0.46 + 0.54 * magnitude
  if (ratio >= 0) return mixRgb([168, 204, 220], [50, 129, 172], stop)
  return mixRgb([224, 188, 164], [196, 92, 42], stop)
}

export function tileLabel(ratio: PublicRatio | null): string {
  return fillLuminance(tileFill(ratio)) > 0.55 ? INDEX_CHART_THEME.ink : INDEX_CHART_THEME.paper
}

export function heatmapWeights(sizes: readonly number[], minShare = 0.03): readonly number[] {
  const raw = sizes.map((size) => Math.sqrt(Math.max(size, 0)))
  const total = raw.reduce((sum, weight) => sum + weight, 0)
  if (total === 0) return raw.map(() => 1)
  const floor = total * minShare
  return raw.map((weight) => Math.max(weight, floor))
}

function worstRowRatio(row: readonly number[], side: number): number {
  const sum = row.reduce((total, value) => total + value, 0)
  const max = Math.max(...row)
  const min = Math.min(...row)
  if (sum === 0 || min === 0 || side === 0) return Number.POSITIVE_INFINITY
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min))
}

export function layoutTreemap(
  weights: readonly number[],
  width = 100,
  height = 100,
): readonly { x: number; y: number; w: number; h: number }[] {
  const layout = weights.map(() => ({ x: 0, y: 0, w: 0, h: 0 }))
  const nodes = weights.flatMap((value, index) => (value > 0 ? [{ value, index }] : []))
  let x = 0
  let y = 0
  let remainingWidth = width
  let remainingHeight = height
  let start = 0
  while (start < nodes.length && remainingWidth > 0 && remainingHeight > 0) {
    const side = Math.min(remainingWidth, remainingHeight)
    let end = start + 1
    let row = [nodes[start]!.value]
    while (end < nodes.length) {
      const next = [...row, nodes[end]!.value]
      if (worstRowRatio(row, side) >= worstRowRatio(next, side)) {
        row = next
        end += 1
      } else break
    }
    const rowSum = row.reduce((sum, value) => sum + value, 0)
    const restSum = nodes.slice(start).reduce((sum, node) => sum + node.value, 0)
    if (rowSum === 0 || restSum === 0) break
    if (remainingWidth >= remainingHeight) {
      const rowWidth = remainingWidth * (rowSum / restSum)
      let cursor = y
      for (let index = start; index < end; index += 1) {
        const node = nodes[index]!
        const rowHeight = remainingHeight * (node.value / rowSum)
        layout[node.index] = { x, y: cursor, w: rowWidth, h: rowHeight }
        cursor += rowHeight
      }
      x += rowWidth
      remainingWidth -= rowWidth
    } else {
      const rowHeight = remainingHeight * (rowSum / restSum)
      let cursor = x
      for (let index = start; index < end; index += 1) {
        const node = nodes[index]!
        const rowWidth = remainingWidth * (node.value / rowSum)
        layout[node.index] = { x: cursor, y, w: rowWidth, h: rowHeight }
        cursor += rowWidth
      }
      y += rowHeight
      remainingHeight -= rowHeight
    }
    start = end
  }
  return layout
}

const SECTOR_ILLUSTRATION_MODEL: Readonly<Record<string, string>> = {
  KNIFE: 'skin_knife_butterfly_ruby',
  GLOVE: 'sporty_gloves',
  WEAPON: 'skin_ak47_vulcan',
  CASE: 'crate_dreams_nightmares',
  AGENT: 'agent_getaway_sally',
  COLLECTION: 'collection_cache',
  ARMORY: 'skin_awp_longdog',
}

export function sectorIllustrationModel(scopeCode: string): string | null {
  return SECTOR_ILLUSTRATION_MODEL[scopeCode] ?? null
}
