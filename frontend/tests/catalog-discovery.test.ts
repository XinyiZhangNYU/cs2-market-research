import { describe, expect, it } from 'vitest'
import type { EquipmentSummary } from '../src/catalog/catalogEquipment'
import {
  CATALOG_DISCOVERY_FIXED_MODEL_IDS,
  CATALOG_DISCOVERY_PRIORITY_LIMIT,
  orderCatalogDiscoverySeries,
  planCatalogDiscoveryModels,
  selectCatalogDiscoverySeries,
} from '../src/catalog/catalogDiscovery'
import { equipmentModels } from '../src/catalog/equipmentModels'

const summaries: readonly EquipmentSummary[] = equipmentModels
  .filter((model) => model.category !== 'UNCLASSIFIED')
  .map((model) => ({ members: 20, model, series: 4 }))

describe('session-fixed default catalog discovery', () => {
  it('guarantees the six approved weapons plus one knife and glove within sixteen slots', () => {
    const first = planCatalogDiscoveryModels(summaries, 'fixed-session-seed')
    const second = planCatalogDiscoveryModels([...summaries].reverse(), 'fixed-session-seed')

    expect(first).toHaveLength(16)
    expect(second.map(({ model }) => model.id)).toEqual(first.map(({ model }) => model.id))
    const guaranteed = first.filter((slot) => slot.guaranteed).map(({ model }) => model)
    expect(guaranteed).toHaveLength(8)
    expect(guaranteed.map((model) => model.id)).toEqual(expect.arrayContaining([
      ...CATALOG_DISCOVERY_FIXED_MODEL_IDS,
    ]))
    expect(guaranteed.filter((model) => model.category === 'KNIVES')).toHaveLength(1)
    expect(guaranteed.filter((model) => model.category === 'GLOVES')).toHaveLength(1)
  })

  it('chooses one deterministic actionable series per planned model and excludes stock weapons', () => {
    const plan = planCatalogDiscoveryModels(summaries, 'series-seed')
    const candidates = plan.flatMap(({ model }, index) => [
      {
        baseItemCode: `defindex:${index + 1}|paint:none`,
        equipmentModelId: model.id,
        itemKind: model.itemKind,
        value: `${model.id}:stock`,
      },
      {
        baseItemCode: `fixture:${model.id}:alpha`,
        equipmentModelId: model.id,
        itemKind: model.itemKind,
        value: `${model.id}:alpha`,
      },
      {
        baseItemCode: `fixture:${model.id}:omega`,
        equipmentModelId: model.id,
        itemKind: model.itemKind,
        value: `${model.id}:omega`,
      },
    ])

    const first = selectCatalogDiscoverySeries(plan, candidates, 'series-seed')
    const second = selectCatalogDiscoverySeries(plan, [...candidates].reverse(), 'series-seed')
    expect(first).toHaveLength(16)
    expect(second).toEqual(first)
    expect(first.filter((choice) => choice.guaranteed)).toHaveLength(8)
    expect(first.every(({ candidate }) =>
      candidate.itemKind !== 'WEAPON' || !candidate.baseItemCode.endsWith('|paint:none'))).toBe(true)
  })

  it('does not fabricate a default page when a guaranteed family is unavailable', () => {
    const withoutAwp = summaries.filter(({ model }) => model.id !== 'weapon_awp')
    expect(planCatalogDiscoveryModels(withoutAwp, 'fixed-session-seed')).toEqual([])
  })

  it('orders every actionable series once while keeping approved families in the first visible window', () => {
    const plan = planCatalogDiscoveryModels(summaries, 'complete-session-seed')
    const candidates = summaries.flatMap(({ model }, modelIndex) => [
      {
        baseItemCode: `fixture:${model.id}:alpha`,
        equipmentModelId: model.id,
        itemKind: model.itemKind,
        value: `${model.id}:alpha`,
      },
      {
        baseItemCode: `fixture:${model.id}:omega`,
        equipmentModelId: model.id,
        itemKind: model.itemKind,
        value: `${model.id}:omega`,
      },
      {
        baseItemCode: `defindex:${modelIndex + 1}|paint:none`,
        equipmentModelId: model.id,
        itemKind: model.itemKind,
        value: `${model.id}:stock`,
      },
    ])

    const first = orderCatalogDiscoverySeries(plan, candidates, 'complete-session-seed')
    const repeated = orderCatalogDiscoverySeries(
      plan,
      [...candidates].reverse(),
      'complete-session-seed',
    )
    const actionableCount = candidates.filter((candidate) =>
      candidate.itemKind !== 'WEAPON' || !candidate.baseItemCode.endsWith('|paint:none')).length

    expect(first).toHaveLength(actionableCount)
    expect(repeated).toEqual(first)
    expect(new Set(first.map(({ candidate }) => candidate.value)).size).toBe(first.length)
    expect(first.filter(({ guaranteed }) => guaranteed)).toHaveLength(8)
    expect(first.slice(0, CATALOG_DISCOVERY_PRIORITY_LIMIT)
      .filter(({ guaranteed }) => guaranteed)).toHaveLength(8)
    expect(first.every(({ candidate }) =>
      candidate.itemKind !== 'WEAPON' || !candidate.baseItemCode.endsWith('|paint:none'))).toBe(true)
  })
})
