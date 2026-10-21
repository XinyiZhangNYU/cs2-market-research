import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import modelSource from '../src/catalog/equipment-models.json'
import seriesSource from '../src/catalog/equipment-series.json'
import { equipmentForSeries, reconcileEquipmentSelection, seriesMatchesEquipment, summarizeEquipment } from '../src/catalog/catalogEquipment'
import { allEquipmentInCategory, equipmentModelById, type EquipmentModel } from '../src/catalog/equipmentModels'
import { CatalogEquipmentRail } from '../src/components/CatalogEquipmentRail'
import { EquipmentNavigation } from '../src/components/EquipmentNavigation'
import { initialCatalogBrowseState, selectBaseItemCode, type CatalogProjectionRow } from '../src/contract/catalogBrowse'
import { LangProvider } from '../src/i18n'
import { ItemBrowsePage } from '../src/pages/ItemBrowsePage'
import { decodeCatalogDisplayApiResponse } from '../src/wire/catalogDisplayApiDecode'
import { toCatalogDisplayBrowseView } from '../src/adapter/catalogDisplayViewModel'
import { canonicalHash } from '../src/wire/canonical'
import fixture from '../../schemas/examples/catalog-display-list.valid.json'
import type { WireCatalogDisplayListResponse } from '../src/wire/catalogDisplayApiTypes'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CATALOG_NAVIGATION_PROFILE_SHA256 } from '../src/wire/catalogDisplayQueryApiSchema'
import type { PersonalWatchlistController } from '../src/watchlist/personalWatchlist'

const repositoryRoot = resolve(import.meta.dirname, '..', '..')

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function row(modelId: keyof typeof seriesSource.byModel, index = 0): CatalogProjectionRow {
  const model = equipmentModelById(modelId)!
  return {
    item_kind: model.itemKind, base_item_code: seriesSource.byModel[modelId][index],
    analysis_unit_id: `test:${modelId}:${index}`, edition_kind: 'STANDARD', wear_tier: 'FIELD_TESTED',
  }
}
const allRows = modelSource.models.flatMap((model) =>
  seriesSource.byModel[model.id as keyof typeof seriesSource.byModel].map((_, index) =>
    row(model.id as keyof typeof seriesSource.byModel, index)))

describe('sealed, presentation-only equipment membership', () => {
  it('keeps every frontend navigation artifact bound to the canonical root profile', () => {
    const profilePath = resolve(repositoryRoot, 'config', 'catalog-display-navigation-profile.v1.json')
    const profile = JSON.parse(readFileSync(profilePath, 'utf8')) as {
      exact_model_count: number
      series_count: number
      source_member_count: number
      source_mapping_sha256: string
      category_selectors: readonly unknown[]
      provenance: Record<string, { path: string; sha256: string }>
    }
    const canonicalProfile = `${JSON.stringify(profile)}\n`
    expect(createHash('sha256').update(canonicalProfile).digest('hex')).toBe(
      CATALOG_NAVIGATION_PROFILE_SHA256,
    )
    expect(profile).toMatchObject({
      exact_model_count: 63,
      series_count: 2_009,
      source_member_count: 16_978,
      source_mapping_sha256: seriesSource.sourceMappingSha256,
    })
    expect(profile.category_selectors).toHaveLength(5)
    for (const { path, sha256: expected } of Object.values(profile.provenance)) {
      expect(sha256(resolve(repositoryRoot, path))).toBe(expected)
    }
  })

  it('accounts for all 2,009 series exactly once and retains explicit source hashes', () => {
    expect(modelSource.models).toHaveLength(63)
    expect(allRows).toHaveLength(2009)
    expect(new Set(allRows.map((entry) => entry.base_item_code)).size).toBe(2009)
    expect(seriesSource.sourceMemberCount).toBe(16978)
    expect(seriesSource.sourceMappingSha256).toBe(modelSource.sourceHashes.mapping)
    const counts = summarizeEquipment(allRows)
    expect(counts.reduce((sum, value) => sum + value.series, 0)).toBe(2009)
    expect(counts.filter(({ model }) => model.category === 'UNCLASSIFIED')).toEqual([])
    expect(counts.filter(({ model }) => model.category === 'KNIVES')).toHaveLength(20)
    expect(counts.filter(({ model }) => model.category === 'GLOVES')).toHaveLength(8)
    expect(counts.filter(({ model }) => model.category === 'PISTOLS')).toHaveLength(11)
    expect(counts.filter(({ model }) => model.category === 'MID_TIER')).toHaveLength(13)
    expect(counts.filter(({ model }) => model.category === 'RIFLES')).toHaveLength(11)
  })

  it('keeps Zeus in pistols as a user override while preserving the original Valve field', () => {
    expect(modelSource.models.find((model) => model.id === 'weapon_taser')).toMatchObject({
      category: 'PISTOLS', group: 'PISTOL', valveLoadoutCategory: 'equipment2',
    })
    expect(modelSource.presentationOverrides.weapon_taser).toBe('ZEUS_IN_PISTOLS')
    expect(equipmentModelById('weapon_awp')).toMatchObject({ category: 'RIFLES', group: 'SNIPER' })
    expect(equipmentModelById('weapon_nova')).toMatchObject({ category: 'MID_TIER', group: 'SHOTGUN' })
    expect(equipmentModelById('weapon_mp9')).toMatchObject({ category: 'MID_TIER', group: 'SMG' })
    expect(equipmentModelById('weapon_negev')).toMatchObject({ category: 'MID_TIER', group: 'MACHINEGUN' })
    expect(equipmentModelById('sporty_gloves')?.name).toEqual({ zh: '运动手套', en: 'Sport Gloves' })
  })

  it('does not infer a model from a plausible identifier/name or mismatched kind', () => {
    const code = row('weapon_ak47').base_item_code
    expect(equipmentForSeries('WEAPON', code).id).toBe('weapon_ak47')
    expect(equipmentForSeries('WEAPON', code + '-unobserved').category).toBe('UNCLASSIFIED')
    expect(equipmentForSeries('KNIFE', code).category).toBe('UNCLASSIFIED')
    expect(equipmentForSeries('WEAPON', 'AK-47 | Redline').category).toBe('UNCLASSIFIED')
    const unknown = { ...row('weapon_ak47'), base_item_code: code + '-unobserved' }
    expect(summarizeEquipment([unknown])[0]).toMatchObject({ series: 1, members: 1, model: { id: 'unclassified:WEAPON' } })
  })

  it('supports unrestricted selection inside each category without leaking other categories', () => {
    for (const category of ['PISTOLS', 'MID_TIER', 'RIFLES', 'KNIVES', 'GLOVES'] as const) {
      const all = allEquipmentInCategory(category)!
      expect(all.scope).toBe('CATEGORY')
      const matched = allRows.filter((entry) => seriesMatchesEquipment(entry.item_kind, entry.base_item_code, all))
      expect(matched.length).toBeGreaterThan(0)
      expect(matched.every((entry) => equipmentForSeries(entry.item_kind, entry.base_item_code).category === category)).toBe(true)
    }
    expect(seriesMatchesEquipment('WEAPON', row('weapon_awp').base_item_code, allEquipmentInCategory('PISTOLS'))).toBe(false)
  })

  it('restores legacy links exactly and clears conflicts while preserving intentional empty filters', () => {
    const famas = row('weapon_famas')
    const awp = row('weapon_awp')
    const legacy = selectBaseItemCode('WEAPON', famas.base_item_code, [famas])
    const restored = reconcileEquipmentSelection({ ...legacy, selectedEditions: [] }, [famas, awp])
    expect(restored.equipmentModel).toBe('weapon_famas')
    expect(restored.selectedEditions).toEqual([])
    expect(reconcileEquipmentSelection({ ...restored, equipmentModel: 'weapon_awp' }, [famas, awp])).toMatchObject({
      equipmentModel: 'weapon_awp', baseItemCode: null, selectedEditions: [], selectedWears: [],
    })
    expect(reconcileEquipmentSelection(restored, [awp])).toMatchObject({ equipmentModel: null, baseItemCode: null })
    expect(reconcileEquipmentSelection({ ...restored, equipmentModel: 'all:RIFLES' }, [famas, awp]).equipmentModel).toBe('all:RIFLES')
  })
})

describe('equipment navigation interactions', () => {
  function WatchableNavigation({ onSelect }: { onSelect: (model: EquipmentModel) => void }) {
    const [saved, setSaved] = useState<ReadonlySet<string>>(() => new Set())
    const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set())
    const watchlist: PersonalWatchlistController = {
      status: 'READY',
      entries: [],
      pendingKeys: pending,
      error: null,
      has: (targetKey) => saved.has(targetKey),
      toggle: async (candidate) => {
        setPending(new Set([candidate.target_key]))
        await new Promise((resolvePending) => window.setTimeout(resolvePending, 0))
        setSaved((current) => {
          const next = new Set(current)
          if (next.has(candidate.target_key)) next.delete(candidate.target_key)
          else next.add(candidate.target_key)
          return next
        })
        setPending(new Set())
      },
      addMany: async () => 0,
      remove: async () => {},
      clear: async () => {},
      importJson: async () => 0,
      exportJson: () => '',
      reload: () => {},
    }
    return (
      <EquipmentNavigation
        summaries={summarizeEquipment(allRows)}
        selectedModelId={null}
        onSelect={onSelect}
        watchlist={watchlist}
      />
    )
  }

  it('opens only by click without choosing; supports all models and no unrelated top-level categories', async () => {
    const user = userEvent.setup()
    const select = vi.fn()
    render(<LangProvider lang="zh"><EquipmentNavigation summaries={summarizeEquipment(allRows)} selectedModelId={null} onSelect={select} /></LangProvider>)
    expect(screen.getAllByTestId(/^catalog-category-/)).toHaveLength(5)
    const trigger = screen.getByTestId('catalog-category-RIFLES')
    await user.hover(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('catalog-model-panel')).toBeNull()
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('catalog-model-weapon_awp')).toHaveTextContent('AWP')
    expect(select).not.toHaveBeenCalled()
    await user.click(screen.getByTestId('catalog-model-all:RIFLES'))
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ id: 'all:RIFLES' }))
    expect(screen.queryByTestId('catalog-model-panel')).toBeNull()
  })

  it('click or tap toggles a persistent panel and another category click replaces it', async () => {
    const user = userEvent.setup()
    render(<LangProvider lang="zh"><EquipmentNavigation summaries={summarizeEquipment(allRows)} selectedModelId={null} onSelect={() => undefined} /></LangProvider>)
    const trigger = screen.getByTestId('catalog-category-PISTOLS')
    await user.pointer({ keys: '[TouchA>]', target: trigger })
    await user.pointer({ keys: '[/TouchA]', target: trigger })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('catalog-model-weapon_taser')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-model-all:PISTOLS')).toHaveTextContent('不限')
    await user.click(screen.getByTestId('catalog-category-RIFLES'))
    expect(screen.getByTestId('catalog-category-PISTOLS')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('catalog-category-RIFLES')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('catalog-model-weapon_awp')).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-model-weapon_taser')).toBeNull()
    await user.click(screen.getByTestId('catalog-category-PISTOLS'))
    await user.pointer({ keys: '[TouchA>]', target: trigger })
    await user.pointer({ keys: '[/TouchA]', target: trigger })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('exposes all knife/glove models, handles keyboard entry and Escape focus return', async () => {
    const user = userEvent.setup()
    const select = vi.fn()
    render(<LangProvider lang="en"><EquipmentNavigation summaries={summarizeEquipment(allRows)} selectedModelId={null} onSelect={select} /></LangProvider>)
    const knives = screen.getByTestId('catalog-category-KNIVES')
    knives.focus()
    await user.keyboard('{ArrowDown}')
    const panel = screen.getByTestId('catalog-model-panel')
    expect(within(panel).getAllByTestId(/^catalog-model-/)).toHaveLength(21)
    expect(screen.getByTestId('catalog-model-all:KNIVES')).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(knives).toHaveFocus()
    expect(screen.queryByTestId('catalog-model-panel')).toBeNull()
    await user.click(screen.getByTestId('catalog-category-GLOVES'))
    expect(within(screen.getByTestId('catalog-model-panel')).getAllByTestId(/^catalog-model-/)).toHaveLength(9)
    await user.click(screen.getByTestId('catalog-model-specialist_gloves'))
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ name: { zh: '专业手套', en: 'Specialist Gloves' } }))
  })

  it('dismisses on outside interaction and hovering does not open or change the chosen model', async () => {
    const user = userEvent.setup()
    const select = vi.fn()
    render(<LangProvider lang="en"><EquipmentNavigation summaries={summarizeEquipment(allRows)} selectedModelId="weapon_famas" onSelect={select} /><button>Outside</button></LangProvider>)
    await user.hover(screen.getByTestId('catalog-category-PISTOLS'))
    expect(screen.queryByTestId('catalog-model-panel')).toBeNull()
    await user.click(screen.getByTestId('catalog-category-PISTOLS'))
    expect(screen.getByTestId('catalog-category-RIFLES')).toHaveClass('is-active')
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByTestId('catalog-model-panel')).toBeNull()
    expect(select).not.toHaveBeenCalled()
  })

  it('keeps an overlaid model star independent from the card and the open category panel', async () => {
    const user = userEvent.setup()
    const select = vi.fn()
    render(<LangProvider lang="zh"><WatchableNavigation onSelect={select} /></LangProvider>)

    const category = screen.getByTestId('catalog-category-RIFLES')
    await user.click(category)
    const panel = screen.getByTestId('catalog-model-panel')
    const model = within(panel).getByTestId('catalog-model-weapon_awp')
    const star = within(panel).getByTestId('personal-watchlist-toggle-CATALOG_MODEL:CATALOG:MODEL:weapon_awp')
    expect(star.parentElement).toHaveClass('equipment-nav__choice-row--model')
    expect(star).toHaveClass('personal-watchlist-toggle--icon')
    expect(star).toHaveAttribute('aria-pressed', 'false')

    await user.click(star)

    expect(screen.getByTestId('catalog-model-panel')).toBe(panel)
    expect(category).toHaveAttribute('aria-expanded', 'true')
    expect(model).toHaveAttribute('aria-pressed', 'false')
    expect(star).toHaveAttribute('aria-pressed', 'true')
    expect(select).not.toHaveBeenCalled()
  })
})

function BrowseHarness() {
  const [state, setState] = useState(initialCatalogBrowseState)
  const chosen = [row('weapon_famas', 1), row('weapon_awp', 1), row('weapon_glock', 1)]
  const payload = structuredClone(fixture) as WireCatalogDisplayListResponse
  Object.assign(payload.query, { base_item_code: null, item_kind: null, edition_kind: null, wear_tier: null, analysis_unit_kind: null })
  payload.members = chosen.map((entry, index) => {
    const member = structuredClone(payload.members[0])
    Object.assign(member.projection, entry, { analysis_unit_id: `unit:${index}` })
    member.projection.edition_kind = 'STATTRAK'
    member.projection.localized_name = { authority: 'MARKET_D', en: 'StatTrak™ Souvenir source bytes', zh_cn: 'StatTrak™ 逐字保留 纪念品来源' }
    const { projection_hash: _hash, ...document } = member.projection
    member.projection.projection_hash = canonicalHash(document)
    return member
  })
  const view = toCatalogDisplayBrowseView(decodeCatalogDisplayApiResponse(payload))
  return <ItemBrowsePage state={state} onChange={setState} projectionRows={view.rows} displayItems={view.items} pitContext={view} presentation="FORMAL_PUBLIC" />
}

it('filters real decoded series by model/all-category, retains source bytes, and keeps empty selection', async () => {
  const user = userEvent.setup()
  render(<LangProvider lang="zh"><BrowseHarness /></LangProvider>)
  expect(screen.queryByTestId('catalog-series-grid')).toBeNull()
  await user.click(screen.getByTestId('catalog-category-RIFLES'))
  await user.click(screen.getByTestId('catalog-model-weapon_famas'))
  expect(screen.getByTestId('catalog-series-grid').querySelectorAll('button')).toHaveLength(1)
  expect(screen.getByTestId('catalog-series-grid')).toHaveTextContent('逐字保留 纪念品来源')
  expect(screen.getByTestId('catalog-series-grid')).not.toHaveTextContent('StatTrak™')
  await user.click(screen.getByTestId(`catalog-base-${row('weapon_famas', 1).base_item_code}`))
  await user.click(screen.getByTestId('catalog-edition-STATTRAK'))
  expect(screen.getByTestId('catalog-empty')).toBeInTheDocument()
  await user.click(screen.getByTestId('catalog-category-RIFLES'))
  await user.click(screen.getByTestId('catalog-model-weapon_famas'))
  expect(screen.getByTestId('catalog-edition-STATTRAK')).not.toBeChecked()
  await user.click(screen.getByTestId('catalog-category-RIFLES'))
  await user.click(screen.getByTestId('catalog-model-all:RIFLES'))
  expect(screen.getByTestId('catalog-series-grid').querySelectorAll('button')).toHaveLength(2)
  expect(screen.queryByTestId('catalog-unit-rows')).toBeNull()
  expect(screen.queryByTestId(`catalog-base-${row('weapon_glock', 1).base_item_code}`)).toBeNull()
  expect(screen.getByTestId('catalog-selected-model')).toHaveTextContent('步枪 · 不限')
  // No event below follows an upstream URL; this is only the established load/error mapping.
  const img = screen.getByTestId('catalog-series-grid').querySelector('img')!
  expect(img.getAttribute('src')).toMatch(/^\/media\/catalog\/v1\//)
  fireEvent.error(img)
  expect(img.closest('[data-image-status]')).toHaveAttribute('data-image-status', 'LOADING')
  expect(screen.getByTestId('catalog-series-grid').querySelector('[data-image-status="LOADING"]')).not.toBeNull()
})

describe('catalog equipment rail', () => {
  function Rail({ onSelect }: { onSelect: (model: EquipmentModel) => void }) {
    const [selected, setSelected] = useState<string | null>(null)
    return (
      <LangProvider lang="zh">
        <CatalogEquipmentRail
          summaries={summarizeEquipment(allRows)}
          selectedModelId={selected}
          onSelectModel={(model) => { onSelect(model); setSelected(model.id) }}
          onClearModel={() => setSelected(null)}
        />
      </LangProvider>
    )
  }

  it('opens a category on its "all" entry and keeps a model already chosen in it', async () => {
    const user = userEvent.setup()
    const select = vi.fn()
    render(<Rail onSelect={select} />)
    const rifles = screen.getByTestId('catalog-category-RIFLES')

    await user.click(rifles)
    expect(rifles).toHaveAttribute('aria-expanded', 'true')
    expect(select).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'all:RIFLES' }))
    expect(screen.getByTestId('catalog-model-all:RIFLES')).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByTestId('catalog-model-weapon_awp'))
    await user.click(rifles)
    expect(rifles).toHaveAttribute('aria-expanded', 'false')
    await user.click(rifles)
    expect(rifles).toHaveAttribute('aria-expanded', 'true')
    expect(select).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('catalog-model-weapon_awp')).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByTestId('catalog-category-PISTOLS'))
    expect(select).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'all:PISTOLS' }))
    expect(rifles).toHaveAttribute('aria-expanded', 'false')
  })
})
