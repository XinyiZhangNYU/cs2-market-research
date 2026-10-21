import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { validateTradeUpGraph, verifyTradeUpRelease } from '../src/tradeup/tradeupGraph.mjs'
import { TRADEUP_RELEASE } from '../src/tradeup/tradeupRelease.mjs'
import { loadTradeUpGraph, TRADEUP_GRAPH_REUSE_MS } from '../src/tradeup/tradeupGraphLoader'
import { simulateTradeUp, tradeUpInputEditions, tradeUpInputEditionMap } from '../src/tradeup/tradeupEngine'
import type { TradeUpGraphDocument, TradeUpInput } from '../src/tradeup/tradeupTypes'

const bytes = readFileSync(resolve(import.meta.dirname, `../public${TRADEUP_RELEASE.url}`))
const graph = JSON.parse(bytes.toString('utf8')) as TradeUpGraphDocument
const clone = () => JSON.parse(bytes.toString('utf8'))
const inputs = (edition = 'standard') => Array.from({ length: 10 }, () => ({ id: 'P250 | Supernova', float: '0.11', edition })) as TradeUpInput[]
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('trade-up release and structural fail-closed gates', () => {
  it('accepts the exact frozen bytes and preserves their release identity', () => {
    expect(verifyTradeUpRelease(new Uint8Array(bytes)).skins).toHaveLength(188)
    expect(TRADEUP_RELEASE.sha256).toBe('628d16fb80138ea6d12757c4fc4181d9af95148df6a33a3501e4af895c6534c8')
  })

  it.each([
    ['duplicate skin', (g: any) => { g.skins[1] = structuredClone(g.skins[0]) }],
    ['duplicate formal identity', (g: any) => { g.skins[1].catalog.analysis_unit_id = g.skins[0].catalog.analysis_unit_id }],
    ['nonfinite float', (g: any) => { g.skins[0].float_max = 'Infinity' }],
    ['cross collection edge', (g: any) => { g.collections['Limited Edition Armory'].by_tier['4'][0] = 'P250 | Supernova' }],
    ['missing edge', (g: any) => { g.collections['Limited Edition Armory'].by_tier['5'].pop() }],
    ['missing output member', (g: any) => { g.skins = g.skins.filter((s: any) => s.id !== 'Five-SeveN | Fowl Play') }],
    ['zero output span', (g: any) => { const s = g.skins.find((s: any) => s.id === 'Five-SeveN | Fowl Play'); s.float_min = s.float_max }],
    ['missing case edge', (g: any) => { g.cases['CS20 Case'].gold_ids.pop() }],
    ['nonboolean edition', (g: any) => { g.skins[0].has_stattrak = 'true' }],
  ])('rejects %s independently of byte hashing', (_label, mutate) => {
    const changed = clone()
    mutate(changed)
    expect(() => validateTradeUpGraph(changed)).toThrow(/INVALID_TRADEUP_GRAPH/u)
    expect(() => simulateTradeUp(changed, inputs())).toThrowError(expect.objectContaining({ code: 'INVALID_GRAPH' }))
  })

  it.each([
    ['edition flip', (g: any) => { g.skins[0].has_stattrak = !g.skins[0].has_stattrak }],
    ['fake rules hash', (g: any) => { g.source.subset_rules_sha256 = '0'.repeat(64) }],
    ['fake catalog release', (g: any) => { g.source.subset_catalog_sha256 = '0'.repeat(64) }],
    ['coordinated member and edge removal', (g: any) => {
      g.skins = g.skins.filter((s: any) => s.id !== 'Five-SeveN | Fowl Play')
      for (const collection of Object.values(g.collections) as any[]) {
        for (const tier of Object.keys(collection.by_tier)) collection.by_tier[tier] = collection.by_tier[tier].filter((id: string) => id !== 'Five-SeveN | Fowl Play')
      }
      g.source.catalog_media_bound -= 1
    }],
  ])('rejects semantically plausible %s at the independently pinned release boundary', (_label, mutate) => {
    const changed = clone()
    mutate(changed)
    const changedBytes = new TextEncoder().encode(`${JSON.stringify(changed)}\n`)
    expect(() => verifyTradeUpRelease(changedBytes)).toThrow(/SHA-256 mismatch/u)
  })

  it('loads exact bytes with a pinned cache key and rejects a stale cache response', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(async () => new Response(bytes))
    vi.stubGlobal('fetch', fetchMock)
    await expect(loadTradeUpGraph(new AbortController().signal)).resolves.toHaveProperty('skins.length', 188)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(TRADEUP_RELEASE.sha256), expect.objectContaining({ cache: 'no-cache' }))
    fetchMock.mockImplementation(async () => new Response(`${bytes.toString('utf8')} `))
    await expect(loadTradeUpGraph(new AbortController().signal)).resolves.toHaveProperty('skins.length', 188)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(TRADEUP_GRAPH_REUSE_MS)
    await expect(loadTradeUpGraph(new AbortController().signal)).rejects.toThrow(/SHA-256 mismatch/u)
  })
})

describe('trade-up edition and executable input boundary', () => {
  it('has identical batch and single-item eligibility for every frozen member', () => {
    const batch = tradeUpInputEditionMap(graph)
    expect(batch.size).toBe(188)
    for (const skin of graph.skins) expect(batch.get(skin.id)).toEqual(tradeUpInputEditions(graph, skin))
    const damaged = clone()
    damaged.collections['The Breakout Collection'].by_tier['5'].push('missing-output')
    expect(() => tradeUpInputEditionMap(damaged)).toThrowError(expect.objectContaining({ code: 'INVALID_GRAPH' }))
  })
  it.each([['forged', 'UNKNOWN_EDITION'], ['souvenir', 'SOUVENIR_WITHHELD']])('rejects %s before calculation', (edition, code) => {
    expect(() => simulateTradeUp(graph, inputs(edition))).toThrowError(expect.objectContaining({ code }))
  })

  it('keeps ordinary and StatTrak results while rejecting mixed editions', () => {
    expect(simulateTradeUp(graph, inputs('stattrak')).outcomes).toHaveLength(3)
    const mixed = inputs()
    mixed[0] = { ...mixed[0], edition: 'stattrak' }
    expect(() => simulateTradeUp(graph, mixed)).toThrowError(expect.objectContaining({ code: 'MIXED_EDITION' }))
  })

  it.each(['AK-47 | Jet Set', 'AWP | Pit Viper', 'Desert Eagle | Blaze', 'M4A4 | Buzz Kill', 'P90 | Asiimov'])('excludes non-executable/withheld input %s', (id) => {
    expect(tradeUpInputEditions(graph, graph.skins.find((skin) => skin.id === id)!)).toEqual([])
  })

  it('makes every admitted input/edition have a nonempty next-tier output pool', () => {
    const byId = new Map(graph.skins.map((skin) => [skin.id, skin]))
    for (const skin of graph.skins) {
      for (const edition of tradeUpInputEditions(graph, skin)) {
        expect(skin.rarity_tier).toBeLessThan(6)
        const pool = graph.collections[skin.collection!].by_tier[String(skin.rarity_tier + 1)]
        expect(pool.every((id) => byId.has(id))).toBe(true)
        expect(pool.some((id) => edition === 'standard' || byId.get(id)!.has_stattrak)).toBe(true)
      }
    }
  })
})
