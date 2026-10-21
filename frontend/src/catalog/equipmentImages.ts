import manifest from './equipment-images.json'
import models from './equipment-models.json'
import series from './equipment-series.json'
import type { ItemKind } from '../contract/catalogBrowse'
import type { Localized } from '../i18n'

export type EquipmentImage = Readonly<{
  modelId: string
  src: string
  kind: 'BASE_WEAPON' | 'REPRESENTATIVE_FINISH'
  finish: Localized | null
  itemKind: ItemKind
  baseItemCode: string | null
}>

// UI-only model illustration. Never a catalog member, media binding or snapshot assertion.
const images = new Map<string, EquipmentImage>(manifest.records.map((record) => {
  const model = models.models.find((candidate) => candidate.id === record.model_id)
  if (!model) throw new TypeError('equipment image references an unknown model')
  const separator = model.definitionKey.indexOf(':')
  if (separator <= 0) throw new TypeError('equipment image model has an invalid definition key')
  const baseItemCode = record.kind === 'BASE_WEAPON'
    ? `defindex:${model.definitionKey.slice(0, separator)}|paint:none`
    : null
  const modelSeries = series.byModel[record.model_id as keyof typeof series.byModel]
  if (baseItemCode !== null && !modelSeries.includes(baseItemCode)) {
    throw new TypeError('base equipment image lacks an exact unpainted series identity')
  }
  return [record.model_id, {
    modelId: record.model_id,
    src: `/media/equipment/v1/${manifest.revision}/${record.model_id}`,
    kind: record.kind as EquipmentImage['kind'],
    finish: record.finish,
    itemKind: model.itemKind as ItemKind,
    baseItemCode,
  }]
}))

const baseImagesBySeries = new Map<string, EquipmentImage>(
  [...images.values()].flatMap((image) => image.baseItemCode === null
    ? []
    : [[JSON.stringify([image.itemKind, image.baseItemCode]), image]]),
)

export function equipmentImageForModel(modelId: string): EquipmentImage | undefined {
  return images.get(modelId)
}

export function equipmentImageForBaseSeries(
  itemKind: ItemKind,
  baseItemCode: string,
): EquipmentImage | undefined {
  // Exact generated identity only: never infer a base weapon from display text or identifier shape.
  return baseImagesBySeries.get(JSON.stringify([itemKind, baseItemCode]))
}
