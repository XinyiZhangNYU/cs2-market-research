import { describe, expect, it } from 'vitest'
import { axisTooltip } from '../src/components/PublicMarketIndexEcharts'

describe('public chart tooltip text boundary', () => {
  it('renders publisher labels and axis text as text while retaining the library marker', () => {
    const marker = '<span class="chart-marker"></span>'
    const html = axisTooltip({
      axisValue: '<img src=x onerror=alert(1)>',
      seriesName: '<svg onload=alert(1)>&"\'',
      marker, value: 12.5,
    }, (value) => String(value), 'en')
    const host = document.createElement('div')
    host.innerHTML = html
    expect(host.querySelector('img,svg')).toBeNull()
    expect(host.querySelector('.chart-marker')).not.toBeNull()
    expect(host.textContent).toContain('<svg onload=alert(1)>&"\'')
    expect(host.textContent).toContain('12.5')
  })
})
