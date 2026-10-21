import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { simulateTradeUp } from '../src/tradeup/tradeupEngine'
import type { TradeUpGraphDocument, TradeUpInput } from '../src/tradeup/tradeupTypes'
import { TRADEUP_RELEASE } from '../src/tradeup/tradeupRelease.mjs'

const graph = JSON.parse(
  readFileSync(resolve(import.meta.dirname, `../public${TRADEUP_RELEASE.url}`), 'utf8'),
) as TradeUpGraphDocument

function repeated(id: string, float: string | null, count: number): readonly TradeUpInput[] {
  return Array.from({ length: count }, () => ({ id, float, edition: 'standard' as const }))
}

describe('formal public trade-up engine', () => {
  it('keeps the public graph provider-free and fully mapped to formal catalog media', () => {
    const text = readFileSync(resolve(import.meta.dirname, `../public${TRADEUP_RELEASE.url}`), 'utf8')
    expect(text).not.toMatch(/steam_image|steamstatic|https?:\/\//u)
    expect(graph.skins).toHaveLength(188)
    expect(graph.skins.every((skin) => skin.catalog.media.status === 'BOUND')).toBe(true)
  })

  it('reproduces the ten-item Breakout example with exact thirds and output floats', () => {
    const simulation = simulateTradeUp(graph, repeated('P250 | Supernova', '0.11', 10))
    expect(simulation.avg_normalized).toBe('0.275000000000')
    expect(simulation.outcomes).toHaveLength(3)
    expect(new Set(simulation.outcomes.map((row) => row.probability_text))).toEqual(new Set(['1/3']))
    const outputs = Object.fromEntries(simulation.outcomes.map((row) => [row.skin.id, row.output_float]))
    expect(outputs['Desert Eagle | Conspiracy']).toBe('0.082500000000')
    expect(outputs['Five-SeveN | Fowl Play']).toBe('0.275000000000')
    expect(outputs['Glock-18 | Water Elemental']).toBe('0.192500000000')
  })

  it('withholds gold results until pool and probability evidence is available', () => {
    expect(() => simulateTradeUp(graph, repeated('P90 | Asiimov', '0.46', 5))).toThrowError(expect.objectContaining({ code: 'GOLD_WITHHELD' }))
  })

  it('supports a probability-only no-wear simulation without inventing midpoint floats', () => {
    const simulation = simulateTradeUp(graph, repeated('P250 | Supernova', null, 10))
    expect(simulation.avg_normalized).toBeNull()
    expect(simulation.outcomes).toHaveLength(3)
    expect(simulation.outcomes.every((row) => row.output_float === null && row.wear_en === null && row.wear_zh === null)).toBe(true)
    expect(new Set(simulation.outcomes.map((row) => row.probability_text))).toEqual(new Set(['1/3']))
  })

  it('withholds mixed covert recipes too', () => {
    const inputs: readonly TradeUpInput[] = [
      ...repeated('AK-47 | Nightwish', '0.20', 4),
      { id: 'M4A4 | Buzz Kill', float: '0.20', edition: 'standard' },
    ]
    expect(() => simulateTradeUp(graph, inputs)).toThrowError(expect.objectContaining({ code: 'GOLD_WITHHELD' }))
  })

  it('fails closed for a covert Armory item with no confirmed case pool', () => {
    expect(() => simulateTradeUp(graph, repeated('AK-47 | AUTOEXEC', '0.1', 5))).toThrowError(
      expect.objectContaining({ code: 'GOLD_WITHHELD' }),
    )
  })
})
