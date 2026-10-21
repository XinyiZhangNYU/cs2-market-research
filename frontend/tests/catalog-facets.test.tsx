import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import fixture from '../../schemas/examples/catalog-display-list.valid.json'
import raritySource from '../src/catalog/equipment-rarities.json'
import seriesSource from '../src/catalog/equipment-series.json'
import { catalogItemCategories, catalogRarities, catalogWearTiers } from '../src/catalog/catalogFacetOptions'
import { itemCategoryForRow, matchesCatalogFacets, rarityForSeries, reconcileCatalogFacets, selectCatalogFacets } from '../src/catalog/catalogFacets'
import { equipmentModelById } from '../src/catalog/equipmentModels'
import { initialCatalogBrowseState, reconcileCatalogBrowseState, selectBaseItemCode, selectItemKind, type CatalogProjectionRow } from '../src/contract/catalogBrowse'
import { CatalogFacetFilters } from '../src/components/CatalogFacetFilters'
import { toCatalogDisplayBrowseView } from '../src/adapter/catalogDisplayViewModel'
import { LangProvider } from '../src/i18n'
import { ItemBrowsePage } from '../src/pages/ItemBrowsePage'
import { canonicalHash } from '../src/wire/canonical'
import { decodeCatalogDisplayApiResponse } from '../src/wire/catalogDisplayApiDecode'
import type { WireCatalogDisplayListResponse } from '../src/wire/catalogDisplayApiTypes'

const REDLINE = 'defindex:7|paint:token:paintkit_cu_awp_cobra_tag'
const ASIIMOV = 'defindex:7|paint:token:paintkit_cu_ak47_asiimov_tag'
const HOWL = 'defindex:16|paint:token:paintkit_cu_howling_tag'
const KNIFE = 'defindex:507|paint:none'
const GLOVE = seriesSource.byModel.specialist_gloves[0]

function row(
  kind: CatalogProjectionRow['item_kind'],
  code: string,
  edition: CatalogProjectionRow['edition_kind'] = 'STANDARD',
  wear: CatalogProjectionRow['wear_tier'] = 'FIELD_TESTED',
): CatalogProjectionRow {
  return { item_kind: kind, base_item_code: code, analysis_unit_id: `test:${kind}:${edition}:${wear}`, edition_kind: edition, wear_tier: wear }
}
const indexedRows = Object.entries(seriesSource.byModel).flatMap(([id, codes]) =>
  codes.map((code) => row(equipmentModelById(id)!.itemKind, code)))

describe('sealed rarity metadata and explicit edition categories', () => {
  it('hash-binds the positional rarity index to the exact 2,009 complete series keys', () => {
    expect(readFileSync(resolve(import.meta.dirname, '../src/catalog/.gitattributes'), 'utf8')).toContain('equipment-*.json text eol=lf')
    const bytes = readFileSync(resolve(import.meta.dirname, '../src/catalog/equipment-series.json'))
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(raritySource.seriesIndexSha256)
    expect(raritySource.sourceMappingSha256).toBe(seriesSource.sourceMappingSha256)
    expect(indexedRows).toHaveLength(2009)
    expect(Object.keys(raritySource.byModel).sort()).toEqual(Object.keys(seriesSource.byModel).sort())
    const counts: Record<string, number> = {}
    for (const value of indexedRows) {
      const rarity = rarityForSeries(value.item_kind, value.base_item_code) ?? 'UNCLASSIFIED'
      counts[rarity] = (counts[rarity] ?? 0) + 1
    }
    expect(counts).toEqual(raritySource.seriesCounts)
    expect(counts).toEqual({ COVERT: 535, CLASSIFIED: 183, RESTRICTED: 311, MIL_SPEC: 446, INDUSTRIAL: 204, CONSUMER: 200, EXTRAORDINARY: 94, CONTRABAND: 1, UNCLASSIFIED: 35 })
    expect(raritySource.exactSourceMemberCount + raritySource.sameSeriesMemberCount + raritySource.unclassifiedMemberCount).toBe(16978)
    expect(JSON.stringify(raritySource)).not.toMatch(/https?:|market_hash_name|source_asset_ref|icon_url|api_key|provider_item_id/iu)
  })

  it('keeps exactly the requested eight rarity choices in reading order', () => {
    expect(catalogRarities.map((value) => value.name.zh)).toEqual(['隐秘', '保密', '受限', '军规级', '工业级', '消费级', '非凡', '违禁'])
    expect(catalogItemCategories.map((value) => value.name.zh)).toEqual(['普通', 'StatTrak™', '纪念品', '★', '★ StatTrak™'])
    expect(catalogWearTiers.map((value) => value.name.zh)).toEqual(['崭新出厂', '略有磨损', '久经沙场', '破损不堪', '战痕累累'])
  })

  it('uses final per-weapon rarity, not the paint-kit rarity alone', () => {
    expect(rarityForSeries('WEAPON', REDLINE)).toBe('CLASSIFIED')
    expect(rarityForSeries('WEAPON', ASIIMOV)).toBe('COVERT')
    expect(rarityForSeries('WEAPON', 'defindex:36|paint:token:paintkit_cu_p250_asiimov_tag')).toBe('CLASSIFIED')
    expect(rarityForSeries('WEAPON', 'defindex:7|paint:token:paintkit_sp_mesh_tan_tag')).toBe('INDUSTRIAL')
    expect(rarityForSeries('WEAPON', 'defindex:11|paint:token:paintkit_sp_mesh_tan_tag')).toBe('CONSUMER')
  })

  it('includes every knife (including vanilla) in Covert, all gloves in Extraordinary, and only Howl in Contraband', () => {
    const knives = indexedRows.filter((value) => value.item_kind === 'KNIFE')
    const gloves = indexedRows.filter((value) => value.item_kind === 'GLOVE')
    expect(knives).toHaveLength(428)
    expect(gloves).toHaveLength(94)
    expect(knives.every((value) => rarityForSeries(value.item_kind, value.base_item_code) === 'COVERT')).toBe(true)
    expect(gloves.every((value) => rarityForSeries(value.item_kind, value.base_item_code) === 'EXTRAORDINARY')).toBe(true)
    expect(rarityForSeries('KNIFE', KNIFE)).toBe('COVERT')
    expect(indexedRows.filter((value) => rarityForSeries(value.item_kind, value.base_item_code) === 'CONTRABAND').map((value) => value.base_item_code)).toEqual([HOWL])
  })

  it('retains unclassified stock/unknown keys under Any and never guesses by name or key shape', () => {
    for (const value of [row('WEAPON', 'defindex:7|paint:none'), row('WEAPON', `${HOWL}-unregistered`), row('WEAPON', 'M4A4 | Howl'), row('KNIFE', HOWL)]) {
      expect(rarityForSeries(value.item_kind, value.base_item_code)).toBeNull()
      expect(matchesCatalogFacets(value, { rarity: null, itemCategory: null, wearTier: null })).toBe(true)
      for (const rarity of catalogRarities) expect(matchesCatalogFacets(value, { rarity: rarity.id, itemCategory: null, wearTier: null })).toBe(false)
    }
  })

  it.each([
    ['WEAPON', 'STANDARD', 'NORMAL'], ['WEAPON', 'STATTRAK', 'STATTRAK'], ['WEAPON', 'SOUVENIR', 'SOUVENIR'],
    ['KNIFE', 'STANDARD', 'STAR'], ['KNIFE', 'STATTRAK', 'STAR_STATTRAK'], ['GLOVE', 'STANDARD', 'STAR'],
    ['WEAPON', 'UNKNOWN', null], ['KNIFE', 'UNKNOWN', null], ['KNIFE', 'SOUVENIR', null],
    ['OTHER', 'STANDARD', null], ['AGENT', 'STANDARD', null],
  ] as const)('maps explicit %s/%s to %s, without inspecting any label', (kind, edition, category) => {
    const value = row(kind, 'looks-like-a-star-stattrak-souvenir-but-is-opaque', edition)
    expect(itemCategoryForRow(value)).toBe(category)
    for (const choice of catalogItemCategories) {
      expect(matchesCatalogFacets(value, { rarity: null, itemCategory: choice.id, wearTier: null })).toBe(choice.id === category)
    }
    expect(matchesCatalogFacets(value, { rarity: null, itemCategory: null, wearTier: null })).toBe(true)
  })

  it('intersects all three top-level facets without treating non-wearable rows as a wear band', () => {
    const fieldTested = row('WEAPON', ASIIMOV, 'STATTRAK', 'FIELD_TESTED')
    const factoryNew = row('WEAPON', ASIIMOV, 'STATTRAK', 'FACTORY_NEW')
    const noWear = row('KNIFE', KNIFE, 'STANDARD', 'NOT_APPLICABLE')
    expect(matchesCatalogFacets(fieldTested, { rarity: 'COVERT', itemCategory: 'STATTRAK', wearTier: 'FIELD_TESTED' })).toBe(true)
    expect(matchesCatalogFacets(factoryNew, { rarity: 'COVERT', itemCategory: 'STATTRAK', wearTier: 'FIELD_TESTED' })).toBe(false)
    expect(matchesCatalogFacets(noWear, { rarity: 'COVERT', itemCategory: 'STAR', wearTier: null })).toBe(true)
    for (const wear of catalogWearTiers) {
      expect(matchesCatalogFacets(noWear, { rarity: 'COVERT', itemCategory: 'STAR', wearTier: wear.id })).toBe(false)
    }
  })

  it('preserves pre-model selections; selecting the same filters preserves intentional empty edition/wear filters', () => {
    const state = { ...initialCatalogBrowseState(), rarity: 'COVERT' as const, itemCategory: 'STATTRAK' as const, wearTier: 'FIELD_TESTED' as const }
    expect(reconcileCatalogBrowseState(state, [])).toEqual(state)
    expect(selectItemKind('WEAPON', state)).toMatchObject({ rarity: 'COVERT', itemCategory: 'STATTRAK', wearTier: 'FIELD_TESTED' })
    const selected = { ...selectBaseItemCode('WEAPON', ASIIMOV, [row('WEAPON', ASIIMOV, 'STATTRAK')], state), selectedEditions: [], selectedWears: [] }
    expect(selectCatalogFacets(selected, state)).toBe(selected)
    expect(selectCatalogFacets(selected, { rarity: null, itemCategory: null, wearTier: null })).toMatchObject({ baseItemCode: null, selectedEditions: [], selectedWears: [] })
    expect(reconcileCatalogFacets({ ...selected, rarity: 'CONSUMER' }, [row('WEAPON', ASIIMOV, 'STATTRAK')])).toMatchObject({ rarity: 'CONSUMER', baseItemCode: null })
  })
})

const chosen = [
  row('WEAPON', REDLINE), row('WEAPON', REDLINE, 'STATTRAK'), row('WEAPON', REDLINE, 'SOUVENIR'),
  row('WEAPON', ASIIMOV), row('WEAPON', ASIIMOV, 'STATTRAK'),
  row('WEAPON', HOWL), row('WEAPON', HOWL, 'STATTRAK'), row('WEAPON', 'defindex:7|paint:none'),
  row('KNIFE', KNIFE), row('KNIFE', KNIFE, 'STATTRAK'), row('GLOVE', GLOVE),
]
function makeView() {
  const payload = structuredClone(fixture) as WireCatalogDisplayListResponse
  Object.assign(payload.query, { item_kind: null, base_item_code: null })
  payload.members = chosen.map((value, index) => {
    const member = structuredClone(fixture.members[0]) as WireCatalogDisplayListResponse['members'][number]
    Object.assign(member.projection, value, { analysis_unit_id: `unit:${String(index).padStart(2, '0')}` })
    member.projection.localized_name = {
      authority: 'MARKET_D',
      en: `${value.edition_kind === 'STATTRAK' ? 'StatTrak™ ' : ''}Fixture ${index} · Souvenir ★ source bytes`,
      zh_cn: `${value.edition_kind === 'STATTRAK' ? 'StatTrak™ ' : ''}合成测试 ${index} · 纪念品 ★ 原文`,
    }
    const { projection_hash: _hash, ...document } = member.projection
    member.projection.projection_hash = canonicalHash(document)
    return member
  })
  return toCatalogDisplayBrowseView(decodeCatalogDisplayApiResponse(payload))
}
const view = makeView()
function BrowseHarness() {
  const [state, setState] = useState(initialCatalogBrowseState)
  return <ItemBrowsePage state={state} onChange={setState} projectionRows={view.rows} displayItems={view.items} pitContext={view} presentation="FORMAL_PUBLIC" />
}
async function choose(user: ReturnType<typeof userEvent.setup>, field: 'rarity' | 'itemCategory' | 'wearTier', value: string) {
  await user.click(screen.getByTestId(`catalog-filter-${field}`))
  await user.click(screen.getByTestId(`catalog-${field}-${value}`))
}
async function model(user: ReturnType<typeof userEvent.setup>, category: string, value: string) {
  await user.click(screen.getByTestId(`catalog-category-${category}`))
  await user.click(screen.getByTestId(`catalog-model-${value}`))
}

describe('formal catalog rarity/category/wear UI', () => {
  it('shows only the requested choices and supports keyboard, touch, Escape and outside dismissal', async () => {
    const user = userEvent.setup()
    function Controls() { const [state, setState] = useState(initialCatalogBrowseState); return <><CatalogFacetFilters state={state} onChange={setState} /><button>Outside</button></> }
    render(<LangProvider lang="zh"><Controls /></LangProvider>)
    const trigger = screen.getByTestId('catalog-filter-rarity')
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getByTestId('catalog-rarity-all')).toHaveFocus())
    const options = within(screen.getByTestId('catalog-filter-options-rarity')).getAllByRole('button')
    expect(options.map((value) => value.textContent!.replace('✓', ''))).toEqual(['不限', '隐秘', '保密', '受限', '军规级', '工业级', '消费级', '非凡', '违禁'])
    await user.keyboard('{End}{Enter}')
    expect(trigger).toHaveTextContent('违禁')
    expect(trigger).toHaveFocus()
    await user.pointer({ keys: '[TouchA>]', target: screen.getByTestId('catalog-filter-itemCategory') })
    await user.pointer({ keys: '[/TouchA]', target: screen.getByTestId('catalog-filter-itemCategory') })
    expect(screen.getByTestId('catalog-filter-itemCategory')).toHaveAttribute('aria-expanded', 'true')
    expect(within(screen.getByTestId('catalog-filter-options-itemCategory')).getAllByRole('button').map((value) => value.textContent!.replace('✓', ''))).toEqual(['不限', '普通', 'StatTrak™', '纪念品', '★', '★ StatTrak™'])
    await user.keyboard('{Escape}')
    expect(screen.getByTestId('catalog-filter-itemCategory')).toHaveFocus()
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByTestId('catalog-filter-wearTier'))
    expect(within(screen.getByTestId('catalog-filter-options-wearTier')).getAllByRole('button').map((value) => value.textContent!.replace('✓', ''))).toEqual(['不限', '崭新出厂', '略有磨损', '久经沙场', '破损不堪', '战痕累累'])
  })

  it('intersects rarity, edition category, model and bilingual search; representative and inner rows match the filter', async () => {
    const user = userEvent.setup()
    render(<LangProvider lang="zh"><BrowseHarness /></LangProvider>)
    await choose(user, 'rarity', 'CLASSIFIED')
    expect(screen.getByTestId('catalog-global-search-results')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-series-grid')).toHaveAttribute('data-series-mode', 'FILTERED')
    await model(user, 'RIFLES', 'all:RIFLES')
    await choose(user, 'itemCategory', 'STATTRAK')
    await choose(user, 'wearTier', 'FIELD_TESTED')
    const grid = screen.getByTestId('catalog-series-grid')
    expect(grid.querySelectorAll('button')).toHaveLength(1)
    expect(grid).toHaveTextContent('合成测试 0 · 纪念品 ★ 原文')
    expect(grid).not.toHaveTextContent('StatTrak™ 合成测试 1')
    await user.type(screen.getByTestId('catalog-series-search'), 'no such item')
    expect(screen.getByTestId('catalog-series-search-empty')).toBeInTheDocument()
    await user.click(screen.getByTestId('catalog-series-search-clear'))
    await user.click(screen.getByTestId(`catalog-base-${REDLINE}`))
    expect(screen.getByTestId('catalog-edition-STATTRAK')).toBeChecked()
    expect(screen.queryByTestId('catalog-edition-STANDARD')).toBeNull()
    expect(screen.queryByTestId('catalog-edition-SOUVENIR')).toBeNull()
    expect(within(screen.getByTestId('catalog-unit-rows')).getAllByRole('article')).toHaveLength(1)
    expect(screen.getByTestId('catalog-unit-rows')).not.toHaveTextContent(/名称来源|Name source|MARKET_D/u)
    const img = screen.getByTestId('catalog-unit-rows').querySelector('img')!
    expect(img.getAttribute('src')).toMatch(/^\/media\/catalog\/v1\//u)
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
    fireEvent.error(img)
    expect(img.closest('[data-image-status]')).toHaveAttribute('data-image-status', 'LOADING')
    await choose(user, 'itemCategory', 'SOUVENIR')
    expect(screen.queryByTestId('catalog-unit-rows')).toBeNull()
    expect(screen.getByTestId('catalog-series-grid')).toHaveTextContent('合成测试 0 · 纪念品 ★ 原文')
    expect(screen.getByTestId('catalog-series-grid')).not.toHaveTextContent('StatTrak™')
  })

  it('keeps knife star categories disjoint, shows glove Extraordinary, and leaves incompatible filters visibly empty', async () => {
    const user = userEvent.setup()
    render(<LangProvider lang="en"><BrowseHarness /></LangProvider>)
    await model(user, 'KNIVES', 'all:KNIVES')
    await choose(user, 'rarity', 'COVERT')
    await choose(user, 'itemCategory', 'STAR_STATTRAK')
    expect(screen.getByTestId('catalog-series-grid')).toHaveTextContent('Fixture 8 · Souvenir ★ source bytes')
    expect(screen.getByTestId('catalog-series-grid')).not.toHaveTextContent('StatTrak™ Fixture 9')
    await choose(user, 'itemCategory', 'STAR')
    expect(screen.getByTestId('catalog-series-grid')).toHaveTextContent('Fixture 8')
    expect(screen.getByTestId('catalog-series-grid')).not.toHaveTextContent('StatTrak™')
    await model(user, 'GLOVES', 'all:GLOVES')
    expect(screen.getByTestId('catalog-series-search-empty')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-filter-rarity')).toHaveTextContent('Covert')
    await choose(user, 'rarity', 'EXTRAORDINARY')
    expect(screen.getByTestId('catalog-series-grid')).toHaveTextContent('Extraordinary')
    expect(screen.getByTestId('catalog-series-grid')).toHaveTextContent('Fixture 10')
    expect(screen.queryByText(/mock fallback/iu)).toBeNull()
  })

  it('restores stock weapons with Any and clears all three facets, not search/model', async () => {
    const user = userEvent.setup()
    render(<LangProvider lang="en"><BrowseHarness /></LangProvider>)
    await model(user, 'RIFLES', 'weapon_ak47')
    expect(screen.getByTestId('catalog-series-grid').querySelectorAll('.formal-catalog__series-card')).toHaveLength(3)
    await choose(user, 'rarity', 'CONSUMER')
    await choose(user, 'wearTier', 'FIELD_TESTED')
    expect(screen.getByTestId('catalog-series-search-empty')).toBeInTheDocument()
    await user.type(screen.getByTestId('catalog-series-search'), 'Fixture 7')
    await user.click(screen.getByTestId('catalog-facets-reset'))
    expect(screen.getByTestId('catalog-series-search')).toHaveValue('Fixture 7')
    expect(screen.getByTestId('catalog-selected-model')).toHaveTextContent('AK-47')
    expect(screen.getByTestId('catalog-series-grid').querySelectorAll('.formal-catalog__series-card')).toHaveLength(1)
    expect(screen.getByTestId('catalog-series-grid').querySelectorAll('button')).toHaveLength(0)
    expect(screen.getByTestId('catalog-series-grid').querySelector('[data-series-interactive="false"]')).not.toBeNull()
    expect(screen.getByTestId('catalog-series-grid').querySelector('[data-rarity]')).toBeNull()
  })
})
