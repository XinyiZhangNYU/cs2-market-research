// jsdom has no canvas, so the real renderer cannot start. The boundary tests assert contract
// and display rules, not pixels; this stub keeps the chart mount from crashing them.

export function use(_extensions: unknown): void {}

export function init(_host: unknown) {
  return {
    setOption(_option: unknown) {},
    dispose() {},
    resize() {},
  }
}

export const LineChart = { __stub: 'LineChart' }
export const TreemapChart = { __stub: 'TreemapChart' }
export const BarChart = { __stub: 'BarChart' }
export const GridComponent = { __stub: 'GridComponent' }
export const TooltipComponent = { __stub: 'TooltipComponent' }
export const LegendComponent = { __stub: 'LegendComponent' }
export const CanvasRenderer = { __stub: 'CanvasRenderer' }
