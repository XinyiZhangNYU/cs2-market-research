import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { Lang } from '../i18n'
import { formatExactDisplayDecimal } from '../price/exactDisplayDecimal'
import type { ChartPoint, ChartPointDisclosure } from '../pages/publicMarketIndexChart'
import {
  INDEX_CHART_THEME,
  formatChartValue,
  unionChartDates,
} from '../pages/publicMarketIndexChart'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const tooltipChrome = {
  backgroundColor: INDEX_CHART_THEME.navy,
  borderColor: INDEX_CHART_THEME.tooltipBorder,
  textStyle: { color: INDEX_CHART_THEME.paper },
} as const

function formatDayTick(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(parsed.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(parsed)
}

/** Only multi-year windows need years in their ticks. Keep all four old windows unchanged. */
export function longWindowAxisLabels(dates: readonly string[], lang: Lang) {
  if (dates.length < 2 || Date.parse(dates.at(-1)!) - Date.parse(dates[0]!) <= 366 * 86_400_000) return null
  const format = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', timeZone: 'UTC',
  })
  return { hideOverlap: true, formatter: (date: string) => format.format(new Date(`${date}T00:00:00Z`)) }
}

function formatPercent(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'percent',
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  }).format(value)
}

function formatLevel(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

function mergedValuesOnDates(
  runs: readonly (readonly ChartPoint[])[],
  dates: readonly string[],
): readonly (number | null)[] {
  const finiteByDate = new Map<string, number>()
  for (const run of runs) {
    for (const point of run) {
      if (point.value !== null && Number.isFinite(point.value)) finiteByDate.set(point.date, point.value)
    }
  }
  return dates.map((date) => finiteByDate.get(date) ?? null)
}

type AxisTipItem = Readonly<{
  axisValue?: string | number
  marker?: string
  seriesId?: string
  seriesName?: string
  value?: unknown
}>
/** Series ids of a second curve drawn beside the main one (MarketLevelChart `secondary`). */
export const SECONDARY_SERIES_ID_PREFIX = 'secondary-'

function escapeTooltipText(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

export function axisTooltip(
  items: AxisTipItem | AxisTipItem[],
  format: (value: number) => string,
  lang: Lang,
  disclosures: ReadonlyMap<string, ChartPointDisclosure> = new Map(),
  secondaryDisclosures: ReadonlyMap<string, ChartPointDisclosure> = new Map(),
): string {
  const rows = Array.isArray(items) ? items : [items]
  const date = rows[0]?.axisValue == null ? '' : String(rows[0].axisValue)
  const disclosure = disclosures.get(date)
  const lines = rows.flatMap((row) => {
    // Each curve prints its own published display value, never the other curve's.
    const own = row.seriesId?.startsWith(SECONDARY_SERIES_ID_PREFIX) ? secondaryDisclosures.get(date) : disclosure
    const formatted = row.value == null ? '' : own?.nativeIndexDisplay !== undefined
      ? formatExactDisplayDecimal(own.nativeIndexDisplay, lang, 2)
      : formatChartValue(row.value, format, '')
    if (formatted === '') return []
    return [`${row.marker ?? ''}${escapeTooltipText(row.seriesName ?? '')}  ${escapeTooltipText(formatted)}`]
  })
  const availability = disclosure?.availability === 'RECONSTRUCTED_LATE_BOUND'
    ? (lang === 'zh' ? '事后重建' : 'Late-bound reconstruction')
    : disclosure === undefined
      ? null
      : (lang === 'zh' ? '同期实测' : 'Measured contemporaneously')
  const coverage = disclosure?.coverageFloor == null ? null : Number(disclosure.coverageFloor)
  const coverageLabel = coverage !== null && Number.isFinite(coverage)
    ? formatPercent(coverage, lang)
    : '—'
  const qualityLines = disclosure === undefined ? [] : [
    `${lang === 'zh' ? '数据可用性' : 'Availability'}  ${availability}`,
    `${lang === 'zh' ? '总体质量' : 'Overall quality'}  ${disclosure.overallQuality}`,
    `${lang === 'zh' ? '保守覆盖下界' : 'Conservative coverage floor'}  ${coverageLabel}`,
    `${lang === 'zh' ? '来源质量分母' : 'Source-quality denominators'}  A ${disclosure.gradeCounts.A} · B ${disclosure.gradeCounts.B} · C ${disclosure.gradeCounts.C} · D ${disclosure.gradeCounts.D} · E ${disclosure.gradeCounts.E}`,
  ]
  return [escapeTooltipText(date), ...lines, ...qualityLines.map(escapeTooltipText)].filter((line) => line !== '').join('<br/>')
}

function useChart(option: unknown) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!host.current) return
    const chart = echarts.init(host.current)
    chart.setOption(option as Record<string, unknown>, true)
    const frame = host.current
    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => chart.resize())
      : null
    observer?.observe(frame)
    return () => {
      observer?.disconnect()
      chart.dispose()
    }
  }, [option])
  return host
}

/** Native gaps/segments must survive the final ECharts projection, not just the adapter. */
export function chartRunValues(
  runs: readonly (readonly ChartPoint[])[], bridges: readonly (readonly ChartPoint[])[],
  dates: readonly string[], preserveSegments = false,
): readonly (readonly (number | null)[])[] {
  return preserveSegments ? runs.map(run => mergedValuesOnDates([run], dates))
    : [mergedValuesOnDates([...runs, ...bridges], dates)]
}

export type SecondaryLevelCurve = Readonly<{
  name: string
  runs: readonly (readonly ChartPoint[])[]
  disclosures: readonly ChartPointDisclosure[]
}>

export function MarketLevelChart({
  runs, bridges = [], disclosures = [], label, lang, preserveSegments = false, primaryName, secondary = null,
}: {
  runs: readonly (readonly ChartPoint[])[]
  bridges?: readonly (readonly ChartPoint[])[]
  disclosures?: readonly ChartPointDisclosure[]
  label: string
  lang: Lang
  preserveSegments?: boolean
  /** Series name of the main curve when a second curve is drawn; otherwise the label. */
  primaryName?: string
  /** A second, never-main curve (E): dashed amber, no area, its own segments and values. */
  secondary?: SecondaryLevelCurve | null
}) {
  const option = useMemo(() => {
    const dates = unionChartDates([...runs, ...bridges, ...(secondary?.runs ?? [])])
    const disclosuresByDate = new Map(disclosures.map((entry) => [entry.date, entry]))
    const secondaryByDate = new Map((secondary?.disclosures ?? []).map((entry) => [entry.date, entry]))
    const valueRuns = chartRunValues(runs, bridges, dates, preserveSegments)
    // A second curve keeps every segment apart: a null or a new segment is never joined.
    const secondaryRuns = secondary === null ? [] : chartRunValues(secondary.runs, [], dates, true)
    return {
      backgroundColor: 'transparent',
      animationDuration: 360,
      textStyle: { color: INDEX_CHART_THEME.text, fontFamily: 'inherit' },
      tooltip: {
        trigger: 'axis',
        ...tooltipChrome,
        formatter: (items: AxisTipItem | AxisTipItem[]) => (
          axisTooltip(
            items,
            (value) => formatLevel(value, lang),
            lang,
            disclosuresByDate,
            secondaryByDate,
          )
        ),
      },
      grid: { left: 12, right: 58, top: 18, bottom: 28 },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLabel: {
          color: INDEX_CHART_THEME.muted,
          formatter: (value: string) => formatDayTick(value, lang),
          ...longWindowAxisLabels(dates, lang),
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        position: 'right',
        scale: true,
        splitNumber: 4,
        axisLabel: { color: INDEX_CHART_THEME.muted, formatter: (value: number) => formatLevel(value, lang) },
        splitLine: { lineStyle: { color: INDEX_CHART_THEME.split } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [...valueRuns.map((values, runIndex) => ({
          type: 'line',
          id: `primary-${runIndex}`,
          name: secondary === null ? label : primaryName ?? label,
          data: values,
          showSymbol: values.filter((value) => value !== null).length === 1,
          connectNulls: false,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2.4, color: INDEX_CHART_THEME.blue },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(50, 129, 172, 0.28)' },
                { offset: 1, color: 'rgba(50, 129, 172, 0.02)' },
              ],
            },
          },
          endLabel: {
            show: runIndex === valueRuns.length - 1,
            color: INDEX_CHART_THEME.ink,
            formatter: (params: { value: number | null; dataIndex?: number }) => preserveSegments
              ? formatExactDisplayDecimal(disclosuresByDate.get(dates[params.dataIndex ?? -1] ?? '')?.nativeIndexDisplay ?? null, lang, 2)
              : formatChartValue(
              params.value,
              (value) => formatLevel(value, lang),
              '',
            ),
          },
        })), ...secondaryRuns.map((values, runIndex) => ({
          type: 'line',
          id: `${SECONDARY_SERIES_ID_PREFIX}${runIndex}`,
          name: secondary!.name,
          data: values,
          showSymbol: values.filter((value) => value !== null).length === 1,
          connectNulls: false,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: INDEX_CHART_THEME.amber, type: 'dashed' },
          itemStyle: { color: INDEX_CHART_THEME.amber },
          z: 3,
        }))],
    }
  }, [bridges, disclosures, label, lang, runs, preserveSegments, primaryName, secondary])
  const host = useChart(option)
  return (
    <div
      ref={host}
      className="public-market-board__plot"
      role="img"
      aria-label={label}
      data-bridge-count={bridges.length}
      data-point-disclosure-count={disclosures.length}
      data-secondary-segment-count={secondary === null ? undefined : secondary.runs.length}
    />
  )
}

export function SectorOverlayChart({
  series, label, lang,
}: {
  series: readonly {
    name: string
    runs: readonly (readonly ChartPoint[])[]
    bridges?: readonly (readonly ChartPoint[])[]
    color: string
    preserveSegments?: boolean
  }[]
  label: string
  lang: Lang
}) {
  const option = useMemo(() => {
    const dates = unionChartDates(series.flatMap((entry) => [...entry.runs, ...(entry.bridges ?? [])]))
    return {
      backgroundColor: 'transparent',
      animationDuration: 360,
      textStyle: { color: INDEX_CHART_THEME.text, fontFamily: 'inherit' },
      tooltip: {
        trigger: 'axis',
        ...tooltipChrome,
        formatter: (items: AxisTipItem | AxisTipItem[]) => (
          axisTooltip(items, (value) => formatPercent(value, lang), lang)
        ),
      },
      grid: { left: 52, right: 14, top: 12, bottom: 28 },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLabel: {
          color: INDEX_CHART_THEME.muted,
          formatter: (value: string) => formatDayTick(value, lang),
          ...longWindowAxisLabels(dates, lang),
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: INDEX_CHART_THEME.muted,
          formatter: (value: number) => formatPercent(value, lang),
        },
        splitLine: { lineStyle: { color: INDEX_CHART_THEME.split } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: series.flatMap((entry) => chartRunValues(entry.runs, entry.bridges ?? [], dates, entry.preserveSegments).map(values => ({
        type: 'line',
        name: entry.name,
        data: values,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        connectNulls: false,
        lineStyle: { width: 1.8, type: 'solid', color: entry.color },
        z: 2,
      }))),
    }
  }, [lang, series])
  const host = useChart(option)
  return (
    <div
      ref={host}
      className="public-market-board__plot"
      role="img"
      aria-label={label}
      data-series-count={series.length}
      data-bridge-count={series.reduce((sum, entry) => sum + (entry.bridges?.length ?? 0), 0)}
    />
  )
}
