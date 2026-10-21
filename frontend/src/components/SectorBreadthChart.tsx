import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { SectorStateSnapshot } from '../contract/types'
import { label, relativeStrengthLabel } from '../contract/labels'
import { useLang } from '../i18n'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

// A null advancing_member_ratio means the ratio was not computed. It is left out of the series
// rather than drawn as zero, because a zero bar reads as "no members advancing".

export function SectorBreadthChart({ sectors }: { sectors: readonly SectorStateSnapshot[] }) {
  const host = useRef<HTMLDivElement>(null)
  const lang = useLang()

  useEffect(() => {
    if (!host.current) return
    const chart = echarts.init(host.current)
    chart.setOption({
      backgroundColor: 'transparent',
      textStyle: { color: '#949cad' },
      tooltip: { trigger: 'axis' },
      grid: { left: 56, right: 16, top: 28, bottom: 56 },
      xAxis: {
        type: 'category',
        data: sectors.map((s) => s.analysis_unit_id),
        axisLabel: { color: '#949cad', interval: 0 },
        axisLine: { lineStyle: { color: '#2f3542' } },
      },
      yAxis: {
        type: 'value',
        name: 'advancing_member_ratio',
        nameTextStyle: { color: '#949cad' },
        max: 1,
        axisLabel: { color: '#949cad' },
        splitLine: { lineStyle: { color: '#2f3542' } },
      },
      series: [
        {
          type: 'bar',
          data: sectors.map((s) =>
            s.breadth.advancing_member_ratio === null
              ? null
              : Number(s.breadth.advancing_member_ratio),
          ),
          itemStyle: { color: '#6ea8fe' },
          label: {
            show: true,
            position: 'top',
            color: '#e6e9ef',
            formatter: ({ dataIndex }: { dataIndex: number }) =>
              label(relativeStrengthLabel, sectors[dataIndex].relative_strength, lang),
          },
        },
      ],
    })
    return () => chart.dispose()
  }, [sectors, lang])

  return (
    <div className="sector-chart" data-testid="sector-breadth-chart">
      <div ref={host} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
