import source from './equipment-series.json'
import { equipmentModelById, unclassifiedEquipment, type EquipmentModel } from './equipmentModels'
import type { CatalogBrowseState, CatalogProjectionRow, ItemKind } from '../contract/catalogBrowse'

// Full, explicit (kind, base_item_code) lookup only. No prefix/regex/name inference.
const byKind = new Map<ItemKind, Map<string, EquipmentModel>>()
for (const [id, codes] of Object.entries(source.byModel)) {
  const model = equipmentModelById(id)
  if (!model) throw new TypeError('equipment index references an unknown model')
  const map = byKind.get(model.itemKind) ?? new Map<string, EquipmentModel>()
  for (const code of codes) {
    if (map.has(code)) throw new TypeError('equipment index has duplicate series membership')
    map.set(code, model)
  }
  byKind.set(model.itemKind, map)
}

export function equipmentForSeries(kind: ItemKind, code: string): EquipmentModel {
  return byKind.get(kind)?.get(code) ?? unclassifiedEquipment(kind)
}

export function seriesMatchesEquipment(kind: ItemKind, code: string, selection: EquipmentModel | undefined): boolean {
  if (!selection || selection.itemKind !== kind) return false
  const model = equipmentForSeries(kind, code)
  return selection.scope === 'CATEGORY' ? model.category === selection.category : model.id === selection.id
}

export type EquipmentSummary = Readonly<{
  model: EquipmentModel
  series: number
  members: number
}>

export function summarizeEquipment(rows: readonly CatalogProjectionRow[]): readonly EquipmentSummary[] {
  const buckets = new Map<string, { model: EquipmentModel; codes: Set<string>; members: number }>()
  for (const row of rows) {
    const model = equipmentForSeries(row.item_kind, row.base_item_code)
    const bucket = buckets.get(model.id) ?? { model, codes: new Set<string>(), members: 0 }
    bucket.codes.add(row.base_item_code)
    bucket.members += 1
    buckets.set(model.id, bucket)
  }
  return [...buckets.values()].map(({ model, codes, members }) => ({ model, series: codes.size, members }))
}

export function reconcileEquipmentSelection(
  state: CatalogBrowseState,
  rows: readonly CatalogProjectionRow[],
): CatalogBrowseState {
  const summaries = summarizeEquipment(rows)
  const selected = equipmentModelById(state.equipmentModel)
  if (state.equipmentModel !== null && (
    !selected || selected.itemKind !== state.itemKind ||
    !summaries.some(({ model }) => selected.scope === 'CATEGORY'
      ? model.category === selected.category : model.id === selected.id)
  )) {
    return { ...state, equipmentModel: null, baseItemCode: null, selectedEditions: [], selectedWears: [] }
  }
  if (state.itemKind !== null && state.baseItemCode !== null) {
    const model = equipmentForSeries(state.itemKind, state.baseItemCode)
    if (selected && !seriesMatchesEquipment(state.itemKind, state.baseItemCode, selected)) {
      return { ...state, baseItemCode: null, selectedEditions: [], selectedWears: [] }
    }
    // Restore old bookmarks from the exact registered series identity, not its shape.
    return { ...state, equipmentModel: selected?.id ?? model.id }
  }
  return state
}
