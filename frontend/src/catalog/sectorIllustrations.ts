import equipmentManifest from './equipment-images.json'
import models from './equipment-models.json'
import subsectorIllustrations from './market-subsector-illustrations.json'
import illustrations from './sector-illustrations.json'
import type { Localized } from '../i18n'

export type SectorIllustrationImage = Readonly<{
  illustrationId: string
  src: string
  finish: Localized
}>

if (illustrations.equipment_revision !== equipmentManifest.revision) {
  throw new TypeError('sector illustrations must share the equipment image revision')
}
if (subsectorIllustrations.equipment_revision !== equipmentManifest.revision) {
  throw new TypeError('market subsector illustrations must share the equipment image revision')
}

const records = [...illustrations.records, ...subsectorIllustrations.records]
const images = new Map<string, SectorIllustrationImage>(records.map((record) => {
  if (equipmentManifest.records.some((candidate) => candidate.model_id === record.illustration_id)) {
    throw new TypeError('sector illustration collides with an equipment model id')
  }
  if (models.models.some((candidate) => candidate.id === record.illustration_id)) {
    throw new TypeError('sector illustration collides with an equipment model id')
  }
  return [record.illustration_id, {
    illustrationId: record.illustration_id,
    src: `/media/equipment/v1/${equipmentManifest.revision}/${record.illustration_id}`,
    finish: record.finish,
  }]
}))

if (images.size !== records.length) {
  throw new TypeError('market illustration ids must be unique')
}

const subsectorModels = new Map(
  subsectorIllustrations.records.map((record) => [record.scope_id, record.illustration_id]),
)
const equipmentModelsByDefinition = new Map(
  models.models.map((model) => [model.definitionKey.split(':', 1)[0], model]),
)

export function sectorIllustrationImage(illustrationId: string): SectorIllustrationImage | undefined {
  return images.get(illustrationId)
}

export function marketSubsectorIllustrationModel(scopeId: string): string | undefined {
  const explicit = subsectorModels.get(scopeId)
  if (explicit !== undefined) return explicit
  const equipmentScope = /^(WEAPON|KNIFE|GLOVE)_MODEL:(\d+)$/u.exec(scopeId)
  if (equipmentScope !== null) {
    const model = equipmentModelsByDefinition.get(equipmentScope[2]!)
    if (model === undefined) return undefined
    if (equipmentScope[1] === 'WEAPON') return subsectorModels.get(`WEAPON:${model.group}`)
    return model.id
  }
  if (scopeId.startsWith('COLLECTION:')) return 'collection_cache'
  if (scopeId.startsWith('ARMORY_RELEASE:')) return 'skin_awp_longdog'
  return undefined
}
