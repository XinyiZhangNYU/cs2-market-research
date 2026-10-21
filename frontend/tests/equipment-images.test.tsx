import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import manifest from '../src/catalog/equipment-images.json'
import models from '../src/catalog/equipment-models.json'
import series from '../src/catalog/equipment-series.json'
import { equipmentImageForBaseSeries, equipmentImageForModel } from '../src/catalog/equipmentImages'
import illustrations from '../src/catalog/sector-illustrations.json'
import subsectorIllustrations from '../src/catalog/market-subsector-illustrations.json'
import { marketSubsectorIllustrationModel, sectorIllustrationImage } from '../src/catalog/sectorIllustrations'
import { equipmentModelById } from '../src/catalog/equipmentModels'
import { CatalogSeriesImageSlot } from '../src/components/CatalogSeriesImageSlot'
import { EquipmentNavigation } from '../src/components/EquipmentNavigation'
import { EquipmentModelImage } from '../src/components/EquipmentModelImage'
import type { ItemKind } from '../src/contract/catalogBrowse'
import { bindItemImageUrl, ITEM_IMAGE_NOT_PRODUCED } from '../src/contract/itemImage'
import { LangProvider } from '../src/i18n'

const summaries = models.models.map(model => ({ model: equipmentModelById(model.id)!, series: 2, members: 10 }))

describe('exact equipment image presentation', () => {
  it('covers all 63 exact models with root-relative versioned images and no provider URLs', () => {
    expect(manifest.records).toHaveLength(63)
    expect(manifest.records.filter(x => x.kind === 'BASE_WEAPON')).toHaveLength(55)
    expect(manifest.records.filter(x => x.kind === 'REPRESENTATIVE_FINISH')).toHaveLength(8)
    expect(new Set(manifest.records.map(x => x.model_id)).size).toBe(63)
    for (const model of models.models) {
      expect(equipmentImageForModel(model.id)?.src).toBe(`/media/equipment/v1/${manifest.revision}/${model.id}`)
      expect(equipmentImageForModel(model.id)?.kind).toBe(model.itemKind === 'GLOVE' ? 'REPRESENTATIVE_FINISH' : 'BASE_WEAPON')
    }
    expect(JSON.stringify(manifest)).not.toMatch(/https?:|steamstatic|akamai|source_asset_ref|api_key/iu)
  })

  it('illustrates the six named heatmap sectors without leaking provider URLs', () => {
    expect(illustrations.equipment_revision).toBe(manifest.revision)
    expect(illustrations.records).toHaveLength(6)
    expect(JSON.stringify(illustrations)).not.toMatch(/https?:|steamstatic|akamai|source_asset_ref|api_key/iu)
    const names = illustrations.records.map((record) => [record.illustration_id, record.finish.zh] as const)
    expect(names).toEqual([
      ['crate_dreams_nightmares', '梦魇武器箱'],
      ['agent_getaway_sally', '出逃的萨莉'],
      ['skin_ak47_vulcan', 'AK-47 | 火神'],
      ['skin_knife_butterfly_ruby', '★ 蝴蝶刀 | 多普勒（红宝石）'],
      ['collection_cache', '死城之谜收藏品'],
      ['skin_awp_longdog', 'AWP | 灵缇'],
    ])
    for (const [id] of names) {
      expect(equipmentImageForModel(id)).toBeUndefined()
      expect(sectorIllustrationImage(id)?.src).toBe(`/media/equipment/v1/${manifest.revision}/${id}`)
      const { container, unmount } = render(<LangProvider lang="zh"><EquipmentModelImage modelId={id} /></LangProvider>)
      expect(container.querySelector('img')).toHaveAttribute('src', `/media/equipment/v1/${manifest.revision}/${id}`)
      unmount()
    }
  })

  it('maps every weapon and case subsector to a named representative image without provider URLs', () => {
    expect(subsectorIllustrations.equipment_revision).toBe(manifest.revision)
    expect(subsectorIllustrations.records).toHaveLength(51)
    expect(subsectorIllustrations.records.filter((record) => record.scope_id.startsWith('CASE:'))).toHaveLength(44)
    expect(subsectorIllustrations.records.filter((record) => record.scope_id.startsWith('WEAPON:'))).toHaveLength(7)
    expect(new Set(subsectorIllustrations.records.map((record) => record.scope_id)).size).toBe(51)
    expect(new Set(subsectorIllustrations.records.map((record) => record.illustration_id)).size).toBe(51)
    expect(JSON.stringify(subsectorIllustrations)).not.toMatch(/https?:|steamstatic|akamai|source_asset_ref|api_key/iu)
    expect(Object.fromEntries(subsectorIllustrations.records
      .filter((record) => record.scope_id.startsWith('WEAPON:'))
      .map((record) => [record.scope_id, record.finish.en]))).toEqual({
      'WEAPON:MACHINE_GUN': 'Negev | Mjölnir',
      'WEAPON:OTHER': 'Zeus x27 | Olympus',
      'WEAPON:PISTOL': 'Glock-18 | Fade',
      'WEAPON:RIFLE': 'AK-47 | Wild Lotus',
      'WEAPON:SHOTGUN': 'MAG-7 | Cinquedea',
      'WEAPON:SMG': 'MP9 | Wild Lily',
      'WEAPON:SNIPER': 'AWP | Dragon Lore',
    })
    for (const record of subsectorIllustrations.records) {
      expect(marketSubsectorIllustrationModel(record.scope_id)).toBe(record.illustration_id)
      expect(sectorIllustrationImage(record.illustration_id)?.src).toBe(
        `/media/equipment/v1/${manifest.revision}/${record.illustration_id}`,
      )
    }
  })

  it('maps hierarchical model scopes to representative market-card images', () => {
    expect(marketSubsectorIllustrationModel('WEAPON_MODEL:7')).toBe('skin_ak47_wild_lotus')
    expect(marketSubsectorIllustrationModel('WEAPON_MODEL:9')).toBe('skin_awp_dragon_lore')
    expect(marketSubsectorIllustrationModel('KNIFE_MODEL:515')).toBe('weapon_knife_butterfly')
    expect(marketSubsectorIllustrationModel('GLOVE_MODEL:5030')).toBe('sporty_gloves')
    expect(marketSubsectorIllustrationModel('COLLECTION:GRAPHIC_DESIGN')).toBe('collection_cache')
    expect(marketSubsectorIllustrationModel('ARMORY_RELEASE:20241002')).toBe('skin_awp_longdog')
  })

  it.each(['all:PISTOLS', 'unclassified:WEAPON', 'weapon_p90/other', '__proto__', 'AK-47', ''])('does not guess image for %s', id => {
    expect(equipmentImageForModel(id)).toBeUndefined()
    const { container } = render(<LangProvider lang="zh"><EquipmentModelImage modelId={id} /></LangProvider>)
    expect(container.querySelector('img')).toBeNull()
  })

  it('maps all 55 unpainted weapon and knife series to their exact model illustration only', () => {
    const illustrated = models.models.filter((model) => model.itemKind !== 'GLOVE')
    expect(illustrated).toHaveLength(55)
    for (const model of illustrated) {
      const definitionIndex = model.definitionKey.slice(0, model.definitionKey.indexOf(':'))
      const baseItemCode = `defindex:${definitionIndex}|paint:none`
      expect(series.byModel[model.id as keyof typeof series.byModel]).toContain(baseItemCode)
      expect(equipmentImageForBaseSeries(model.itemKind as ItemKind, baseItemCode)).toMatchObject({
        modelId: model.id,
        kind: 'BASE_WEAPON',
        baseItemCode,
      })
      const painted = series.byModel[model.id as keyof typeof series.byModel].find((code) => code !== baseItemCode)!
      expect(equipmentImageForBaseSeries(model.itemKind as ItemKind, painted)).toBeUndefined()
    }
    expect(equipmentImageForBaseSeries('GLOVE', series.byModel.sporty_gloves[0])).toBeUndefined()
    expect(equipmentImageForBaseSeries('WEAPON', 'defindex:63|paint:none-but-not-exact')).toBeUndefined()
  })

  it('uses the model illustration only for a NOT_PRODUCED exact base series and preserves catalog bindings', () => {
    const code = 'defindex:63|paint:none'
    const { rerender } = render(
      <LangProvider lang="zh"><CatalogSeriesImageSlot source={ITEM_IMAGE_NOT_PRODUCED} itemKind="WEAPON" baseItemCode={code} label="CZ75" testId="series-image" /></LangProvider>,
    )
    const slot = screen.getByTestId('series-image')
    expect(slot).toHaveAttribute('data-image-source', 'EQUIPMENT_ILLUSTRATION')
    expect(slot.querySelector('img')).toHaveAttribute('src', equipmentImageForModel('weapon_cz75a')!.src)
    fireEvent.load(slot.querySelector('img')!)
    expect(slot).toHaveAttribute('data-image-status', 'BOUND')

    const painted = series.byModel.weapon_cz75a[1]
    rerender(<LangProvider lang="zh"><CatalogSeriesImageSlot source={ITEM_IMAGE_NOT_PRODUCED} itemKind="WEAPON" baseItemCode={painted} label="CZ75 涂装" testId="series-image" /></LangProvider>)
    expect(screen.getByTestId('series-image')).toHaveAttribute('data-image-source', 'NOT_PRODUCED')
    expect(screen.getByTestId('series-image').querySelector('img')).toBeNull()

    const bound = bindItemImageUrl('/media/catalog/v1/1/dGVzdA')
    rerender(<LangProvider lang="zh"><CatalogSeriesImageSlot source={bound} itemKind="WEAPON" baseItemCode={code} label="CZ75" testId="series-image" /></LangProvider>)
    expect(screen.getByTestId('series-image')).toHaveAttribute('data-image-source', 'BOUND')
    expect(screen.getByTestId('series-image').querySelector('img')).toHaveAttribute('src', bound.src)
  })

  it('does not request thumbnails until a panel opens, preserves text and selection after failure', () => {
    const onSelect = vi.fn()
    const { container } = render(<LangProvider lang="zh"><EquipmentNavigation summaries={summaries} selectedModelId={null} onSelect={onSelect} /></LangProvider>)
    expect(container.querySelectorAll('img')).toHaveLength(0)
    fireEvent.click(screen.getByTestId('catalog-category-PISTOLS'))
    expect(container.querySelectorAll('img')).toHaveLength(11)
    const slot = screen.getByTestId('equipment-image-weapon_taser')
    const img = slot.querySelector('img')!
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(img).toHaveAttribute('width', '512')
    expect(img).toHaveAttribute('height', '384')
    expect(img).toHaveAttribute('alt', '')
    fireEvent.load(img); expect(slot).toHaveAttribute('data-image-state', 'READY')
    fireEvent.error(img); expect(slot).toHaveAttribute('data-image-state', 'UNAVAILABLE')
    expect(slot.querySelector('img')).toBeNull()
    expect(slot).toHaveTextContent('图片暂不可用')
    expect(screen.getByTestId('catalog-model-weapon_taser')).toHaveTextContent('宙斯x27电击枪')
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('catalog-model-weapon_taser'))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 'weapon_taser' }))
  })

  it('uses eight distinct approved glove representatives without narrowing type selection', () => {
    const choices = [
      ['sporty_gloves', '紫外狂潮'], ['motorcycle_gloves', '薄荷'], ['specialist_gloves', '深红和服'],
      ['slick_gloves', '王蛇'], ['studded_brokenfang_gloves', '翡翠'], ['studded_hydra_gloves', '表面淬火'],
      ['leather_handwraps', '钴蓝骷髅'], ['studded_bloodhound_gloves', '焦炭'],
    ]
    const onSelect = vi.fn()
    render(<LangProvider lang="zh"><EquipmentNavigation summaries={summaries} selectedModelId={null} onSelect={onSelect} /></LangProvider>)
    fireEvent.click(screen.getByTestId('catalog-category-GLOVES'))
    expect(screen.getByTestId('catalog-model-panel')).toHaveTextContent('代表涂装')
    for (const [id, finish] of choices) {
      expect(equipmentImageForModel(id)?.finish?.zh).toBe(finish)
      expect(screen.getByTestId(`catalog-model-${id}`)).not.toHaveTextContent(finish)
      expect(screen.getByTestId(`catalog-model-${id}`)).toHaveTextContent('2 个系列')
    }
    expect(new Set(choices.map(([id]) => equipmentImageForModel(id)!.src)).size).toBe(8)
    fireEvent.click(screen.getByTestId('catalog-model-sporty_gloves'))
    expect(onSelect).toHaveBeenCalledWith(equipmentModelById('sporty_gloves'))
  })

  it('keeps representative finish names out of category cards and does not change failed src to another model', () => {
    const { rerender } = render(<LangProvider lang="en"><EquipmentNavigation summaries={summaries} selectedModelId={null} onSelect={vi.fn()} /></LangProvider>)
    fireEvent.click(screen.getByTestId('catalog-category-GLOVES'))
    expect(screen.getByTestId('catalog-model-sporty_gloves')).not.toHaveTextContent('Ultra Violent')
    expect(screen.getByTestId('catalog-model-sporty_gloves')).toHaveTextContent('Sport Gloves')
    const slot = screen.getByTestId('equipment-image-sporty_gloves')
    fireEvent.error(slot.querySelector('img')!)
    rerender(<LangProvider lang="zh"><EquipmentNavigation summaries={summaries} selectedModelId={null} onSelect={vi.fn()} /></LangProvider>)
    expect(slot.querySelector('img')).toBeNull()
    expect(screen.getByTestId('catalog-model-sporty_gloves')).not.toHaveTextContent('紫外狂潮')
    expect(screen.getByTestId('catalog-model-sporty_gloves')).toHaveTextContent('运动手套')
  })
})
