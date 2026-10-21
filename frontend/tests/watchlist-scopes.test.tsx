import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PersonalWatchlistToggle } from '../src/components/PersonalWatchlistToggle'
import { PersonalWatchlistPage } from '../src/pages/PersonalWatchlistPage'
import { LangProvider, type Lang } from '../src/i18n'
import { ItemKind, WearTier } from '../src/contract/catalogBrowse'
import { EditionKind } from '../src/contract/identity'
import { publicRouteHref } from '../src/publicNavigation'
import { initialCatalogBrowseState } from '../src/contract/catalogBrowse'
import {
  parsePersonalWatchTarget,
  type PersonalWatchTarget,
  type PersonalWatchTargetCandidate,
  type PersonalWatchlistController,
} from '../src/watchlist/personalWatchlist'
import {
  catalogCategoryWatchCandidate,
  equipmentModelWatchCandidate,
  marketScopeWatchCandidate,
  resolveWatchTarget,
  watchableEquipmentModels,
  type WatchTargetDestination,
} from '../src/watchlist/watchTargetRegistry'
import { equipmentModelById, allEquipmentInCategory } from '../src/catalog/equipmentModels'
import { canonicalHash } from '../src/wire/canonical'
import type { MarketDescriptiveScope } from '../src/wire/marketDescriptivePublicApiTypes'

const SNAPSHOT_ID = 'a'.repeat(64)
const ADDED_AT = '2026-09-05T13:00:00.000Z'

const itemTarget = parsePersonalWatchTarget({
  schema_version: 3,
  target_kind: 'ITEM',
  target_id: 'item:opaque/one',
  target_key: 'ITEM:item:opaque/one',
  parent_target_key: null,
  added_at: ADDED_AT,
  localized_name: { zh: 'AK-47 | 红线', en: 'AK-47 | Redline' },
  catalog: {
    snapshot_id: SNAPSHOT_ID,
    as_of: '2026-09-05T12:00:00.000000Z',
    available_at: '2026-09-05T12:05:00.000000Z',
  },
  identity: {
    item_kind: ItemKind.WEAPON,
    base_item_code: 'weapon.ak47.redline',
    edition_kind: EditionKind.STATTRAK,
    wear_tier: WearTier.FIELD_TESTED,
  },
  image: { status: 'NOT_PRODUCED' },
})

const categoryTarget = parsePersonalWatchTarget({
  schema_version: 3,
  target_kind: 'CATALOG_CATEGORY',
  target_id: 'CATALOG:WEAPON',
  target_key: 'CATALOG_CATEGORY:CATALOG:WEAPON',
  parent_target_key: null,
  added_at: '2026-09-05T13:01:00.000Z',
  localized_name: { zh: '武器', en: 'Weapons' },
})

const modelTarget = parsePersonalWatchTarget({
  schema_version: 3,
  target_kind: 'CATALOG_MODEL',
  target_id: 'CATALOG:MODEL:weapon_ak47',
  target_key: 'CATALOG_MODEL:CATALOG:MODEL:weapon_ak47',
  parent_target_key: 'CATALOG_CATEGORY:CATALOG:WEAPON',
  added_at: '2026-09-05T13:02:00.000Z',
  localized_name: { zh: 'AK-47', en: 'AK-47' },
})

/** A target that was legal when saved but is not in the registry any more. */
const retiredTarget = parsePersonalWatchTarget({
  schema_version: 3,
  target_kind: 'ECONOMIC_SEGMENT',
  target_id: 'ECONOMY:SEGMENT:CASE:KILOWATT_CASE',
  target_key: 'ECONOMIC_SEGMENT:ECONOMY:SEGMENT:CASE:KILOWATT_CASE',
  parent_target_key: 'ECONOMIC_SECTOR:ECONOMY:SECTOR:CASE',
  added_at: '2026-09-05T13:03:00.000Z',
  localized_name: { zh: '千瓦武器箱板块', en: 'Kilowatt Case segment' },
})

function controllerFor(
  entries: readonly PersonalWatchTarget[],
  overrides: Partial<PersonalWatchlistController> = {},
): PersonalWatchlistController {
  const keys = new Set(entries.map((entry) => entry.target_key))
  return Object.freeze({
    status: 'READY',
    entries,
    pendingKeys: new Set<string>(),
    error: null,
    has: (key: string) => keys.has(key),
    toggle: async () => {},
    remove: async () => {},
    clear: async () => {},
    importJson: async () => 0,
    exportJson: () => '',
    reload: () => {},
    ...overrides,
  }) as PersonalWatchlistController
}

function destinationHref(destination: WatchTargetDestination): string {
  const base = {
    lang: 'zh' as Lang,
    surface: 'CATALOG' as const,
    selectedUnitId: null,
    catalogSnapshotId: null,
    researchAsOf: null,
    publicResultAsOf: null,
    publicPublicationId: null,
    publicWatchlistUnitId: null,
    trendingAsOf: null,
    trendingPublicationId: null,
    trendingDirection: 'GAINERS' as const,
    trendingFilters: {
      item_kind: null,
      base_item_code: null,
      edition_kind: null,
      wear_tier: null,
    },
    invalid: false,
  }
  if (destination.surface === 'PRODUCT') {
    return publicRouteHref({
      ...base,
      selectedUnitId: destination.unitId,
      browseState: {
        ...initialCatalogBrowseState(),
        itemKind: destination.itemKind,
        baseItemCode: destination.baseItemCode,
        selectedEditions: [destination.editionKind],
        selectedWears: [destination.wearTier],
      },
    })
  }
  if (destination.surface === 'MARKET') {
    return publicRouteHref({
      ...base,
      surface: 'MARKET',
      browseState: initialCatalogBrowseState(),
      marketScopeToken: destination.scopeToken,
    })
  }
  return publicRouteHref({
    ...base,
    browseState: {
      ...initialCatalogBrowseState(),
      itemKind: destination.itemKind,
      equipmentModel: destination.equipmentModel,
    },
  })
}

function renderPage(
  entries: readonly PersonalWatchTarget[],
  options: {
    lang?: Lang
    controller?: PersonalWatchlistController
    onOpen?: (destination: WatchTargetDestination) => void
  } = {},
) {
  const onOpen = options.onOpen ?? vi.fn()
  render(
    <LangProvider lang={options.lang ?? 'zh'}>
      <PersonalWatchlistPage
        controller={options.controller ?? controllerFor(entries)}
        catalogHref="/catalog"
        onCatalogClick={() => {}}
        destinationHref={destinationHref}
        onOpenDestination={onOpen}
      />
    </LangProvider>,
  )
  return { onOpen }
}

describe('the watch target registry only exposes real, stable destinations', () => {
  it('registers exactly the three catalog categories that have a destination today', () => {
    expect(catalogCategoryWatchCandidate(ItemKind.WEAPON)).toMatchObject({
      target_kind: 'CATALOG_CATEGORY',
      target_id: 'CATALOG:WEAPON',
      target_key: 'CATALOG_CATEGORY:CATALOG:WEAPON',
      parent_target_key: null,
    })
    expect(catalogCategoryWatchCandidate(ItemKind.KNIFE)).not.toBeNull()
    expect(catalogCategoryWatchCandidate(ItemKind.GLOVE)).not.toBeNull()
    // No fabricated taxonomy: agents, containers and unresolved kinds are not watchable.
    expect(catalogCategoryWatchCandidate(ItemKind.AGENT)).toBeNull()
    expect(catalogCategoryWatchCandidate(ItemKind.OTHER)).toBeNull()
    expect(catalogCategoryWatchCandidate(ItemKind.UNKNOWN)).toBeNull()
  })

  it('excludes every unclassified placeholder from the catalog-model registry', () => {
    const models = watchableEquipmentModels()
    expect(models.length).toBeGreaterThan(0)
    expect(models.some((model) => model.id.startsWith('unclassified:'))).toBe(false)
    expect(models.some((model) => model.category === 'UNCLASSIFIED')).toBe(false)
    const unclassified = equipmentModelById('unclassified:WEAPON')
    expect(unclassified).toBeDefined()
    expect(equipmentModelWatchCandidate(unclassified!)).toBeNull()
  })

  it('parents every catalog model or group to its equipment category', () => {
    for (const model of watchableEquipmentModels()) {
      const candidate = equipmentModelWatchCandidate(model)
      expect(candidate?.parent_target_key).toBe(`CATALOG_CATEGORY:CATALOG:${model.itemKind}`)
      expect(candidate?.target_key).toBe(`CATALOG_MODEL:CATALOG:MODEL:${model.id}`)
    }
    const categoryChoice = allEquipmentInCategory('PISTOLS')
    expect(equipmentModelWatchCandidate(categoryChoice!)).toMatchObject({
      target_kind: 'CATALOG_GROUP',
      target_key: 'CATALOG_GROUP:CATALOG:CATEGORY:PISTOLS',
      parent_target_key: 'CATALOG_CATEGORY:CATALOG:WEAPON',
    })
  })

  it('resolves saved catalog categories and models to exact existing catalog routes', () => {
    expect(destinationHref(resolveWatchTarget(categoryTarget)!.destination)).toBe('/catalog?kind=WEAPON')
    expect(destinationHref(resolveWatchTarget(modelTarget)!.destination))
      .toBe('/catalog?kind=WEAPON&model=weapon_ak47')
    const catalogGroup = parsePersonalWatchTarget({
      ...modelTarget,
      target_kind: 'CATALOG_GROUP',
      target_id: 'CATALOG:CATEGORY:PISTOLS',
      target_key: 'CATALOG_GROUP:CATALOG:CATEGORY:PISTOLS',
    })
    expect(destinationHref(resolveWatchTarget(catalogGroup)!.destination))
      .toBe('/catalog?kind=WEAPON&model=all%3APISTOLS')
  })

  it('creates distinct watch targets from formal market scope identities and excludes ALL', () => {
    const scope = (identity: Partial<MarketDescriptiveScope>): MarketDescriptiveScope => ({
      scope_token: canonicalHash({
        contract: 'market-descriptive-public-api',
        scope_id: identity.scope_id,
      }),
      scope_id: identity.scope_id!,
      scope_kind: identity.scope_kind!,
      parent_scope_id: identity.parent_scope_id!,
      ancestor_scope_ids: identity.ancestor_scope_ids ?? [],
      labels: identity.labels!,
    } as MarketDescriptiveScope)
    const cases = scope({
      scope_id: 'CASE',
      scope_kind: 'SECTOR',
      parent_scope_id: 'ALL',
      ancestor_scope_ids: ['ALL'],
      labels: { zh_cn: '武器箱', en: 'Cases' },
    })
    expect(marketScopeWatchCandidate(cases)).toMatchObject({
      target_kind: 'ECONOMIC_SECTOR',
      target_id: 'ECONOMY:SECTOR:CASE',
      parent_target_key: null,
      localized_name: { zh: '武器箱', en: 'Cases' },
    })

    const case4001 = scope({
      scope_id: 'CASE:4001',
      scope_kind: 'SUBSECTOR',
      parent_scope_id: 'CASE',
      ancestor_scope_ids: ['ALL', 'CASE'],
      labels: { zh_cn: '反恐精英武器箱', en: 'CS:GO Weapon Case' },
    })
    expect(marketScopeWatchCandidate(case4001)).toMatchObject({
      target_kind: 'ECONOMIC_SEGMENT',
      target_id: 'ECONOMY:SEGMENT:CASE:4001',
      parent_target_key: 'ECONOMIC_SECTOR:ECONOMY:SECTOR:CASE',
    })

    expect(marketScopeWatchCandidate(scope({
      scope_id: 'ALL',
      scope_kind: 'MARKET',
      parent_scope_id: null,
      labels: { zh_cn: '整体市场', en: 'Overall market' },
    }))).toBeNull()
  })

  it('never confuses a catalog identity with an economic destination', () => {
    expect(resolveWatchTarget(retiredTarget)?.destination.surface).toBe('MARKET')
    expect(() => parsePersonalWatchTarget({
      ...categoryTarget,
      target_id: 'CATALOG:AGENT',
      target_key: 'CATALOG_CATEGORY:CATALOG:AGENT',
    })).toThrow()
    const unknownModel = parsePersonalWatchTarget({
      ...modelTarget,
      target_id: 'CATALOG:MODEL:not_a_model',
      target_key: 'CATALOG_MODEL:CATALOG:MODEL:not_a_model',
    })
    expect(resolveWatchTarget(unknownModel)).toBeNull()
  })
})

describe('the personal watchlist page keeps catalog and economic identities distinct', () => {
  it('presents browser-local persistence in the same privacy-first hero as My inventory', () => {
    renderPage([itemTarget])
    const page = screen.getByTestId('personal-watchlist-page')
    expect(page.querySelector('.personal-watchlist__hero')).not.toBeNull()
    expect(page).toHaveTextContent('只保存在此浏览器')
    expect(page).toHaveTextContent('不会上传本站账户')
    expect(page).toHaveTextContent('关闭后重新打开网站仍会保留')
  })

  it('labels each row with its exact object type', () => {
    renderPage([itemTarget, categoryTarget, modelTarget])
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(screen.getByTestId('personal-watchlist-item-ITEM:item:opaque/one'))
      .toHaveAttribute('data-watchlist-target-kind', 'ITEM')
    expect(screen.getByTestId('personal-watchlist-item-CATALOG_CATEGORY:CATALOG:WEAPON'))
      .toHaveAttribute('data-watchlist-target-kind', 'CATALOG_CATEGORY')
    expect(screen.getByTestId('personal-watchlist-item-CATALOG_MODEL:CATALOG:MODEL:weapon_ak47'))
      .toHaveAttribute('data-watchlist-target-kind', 'CATALOG_MODEL')
    expect(screen.getByText('装备大类')).toBeInTheDocument()
    expect(screen.getByText('装备型号')).toBeInTheDocument()
  })

  it('shows a destination-accurate call to action for each object type', () => {
    renderPage([itemTarget, categoryTarget, modelTarget])
    expect(within(screen.getByTestId('personal-watchlist-item-ITEM:item:opaque/one'))
      .getByText('打开商品详情')).toBeInTheDocument()
    expect(within(screen.getByTestId('personal-watchlist-item-CATALOG_CATEGORY:CATALOG:WEAPON'))
      .getByText('打开装备与系列')).toBeInTheDocument()
    expect(within(screen.getByTestId('personal-watchlist-item-CATALOG_MODEL:CATALOG:MODEL:weapon_ak47'))
      .getByText('打开装备与系列')).toBeInTheDocument()
  })

  it('names a model’s parent catalog category without inventing one for an item', () => {
    renderPage([itemTarget, modelTarget])
    const modelRow = screen.getByTestId('personal-watchlist-item-CATALOG_MODEL:CATALOG:MODEL:weapon_ak47')
    expect(within(modelRow).getByText('武器')).toBeInTheDocument()
    // The item shows its own equipment kind, but declares no parent at all.
    const itemRow = screen.getByTestId('personal-watchlist-item-ITEM:item:opaque/one')
    expect(itemRow.querySelector('.personal-watchlist__parent')).toBeNull()
    expect(modelRow.querySelector('.personal-watchlist__parent')?.textContent).toBe('武器')
  })

  it('shows no price, trend or aggregate value on a catalog category or model row', () => {
    renderPage([categoryTarget, modelTarget])
    const categoryRow = screen.getByTestId('personal-watchlist-item-CATALOG_CATEGORY:CATALOG:WEAPON')
    expect(categoryRow.textContent).not.toMatch(/[¥$]|%|CNY|USD/u)
    expect(within(categoryRow).queryByRole('img')).toBeNull()
  })

  it('opens a saved economic segment by its stable market identity', async () => {
    const { onOpen } = renderPage([retiredTarget])
    const row = screen.getByTestId('personal-watchlist-item-ECONOMIC_SEGMENT:ECONOMY:SEGMENT:CASE:KILOWATT_CASE')
    expect(within(row).getByText('千瓦武器箱板块')).toBeInTheDocument()
    expect(within(row).getByText('查看子板块')).toBeInTheDocument()
    await userEvent.click(within(row).getByRole('link'))
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ surface: 'MARKET' }))
  })

  it('opens each resolvable row at its own destination', async () => {
    const { onOpen } = renderPage([categoryTarget, modelTarget])
    await userEvent.click(within(
      screen.getByTestId('personal-watchlist-item-CATALOG_MODEL:CATALOG:MODEL:weapon_ak47'),
    ).getByRole('link'))
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'CATALOG', itemKind: 'WEAPON', equipmentModel: 'weapon_ak47' }),
    )
  })

  it('searches bilingual names and stable ids', async () => {
    renderPage([itemTarget, categoryTarget, modelTarget], { lang: 'en' })
    const search = screen.getByRole('searchbox')
    expect(search).toHaveAttribute('placeholder', 'Search')
    await userEvent.type(search, 'CATALOG:MODEL:weapon_ak47')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    await userEvent.clear(search)
    await userEvent.type(search, 'CATALOG:WEAPON')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByTestId('personal-watchlist-item-CATALOG_CATEGORY:CATALOG:WEAPON')).toBeInTheDocument()
  })

  it('groups by object type and parent without filing items under a catalog category', async () => {
    renderPage([itemTarget, categoryTarget, modelTarget])
    const group = screen.getByLabelText('分组', { selector: 'select' })

    await userEvent.selectOptions(group, 'TARGET_KIND')
    const kindHeadings = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)
    expect(kindHeadings).toEqual(['装备大类', '装备型号', '商品'])

    await userEvent.selectOptions(group, 'PARENT')
    const parentHeadings = screen.getAllByRole('heading', { level: 2 })
    const weaponGroup = parentHeadings.find((node) => node.textContent === '武器')!
    const weaponSection = weaponGroup.closest('section')!
    // The category and its model sit together; the item keeps its own group.
    expect(within(weaponSection).getAllByRole('listitem')).toHaveLength(2)
    const itemGroup = parentHeadings.find((node) => node.textContent === '商品')!
    expect(within(itemGroup.closest('section')!).getAllByRole('listitem')).toHaveLength(1)
  })

  it.each([
    ['empty', [], 'personal-watchlist-page'],
    ['corrupt', [], 'personal-watchlist-problem'],
  ])('states the %s condition honestly in both languages', (condition, entries, testId) => {
    const controller = condition === 'corrupt'
      ? controllerFor(entries, { status: 'ERROR', error: 'CORRUPT' })
      : controllerFor(entries)
    renderPage(entries, { controller })
    expect(screen.getByTestId(testId)).toBeInTheDocument()
    if (condition === 'corrupt') {
      expect(screen.getByText('关注清单未通过校验')).toBeInTheDocument()
    } else {
      expect(screen.getByText('还没有关注任何对象')).toBeInTheDocument()
    }
  })

  it('reports a failed watchlist change instead of silently dropping it', () => {
    renderPage([categoryTarget], {
      controller: controllerFor([categoryTarget], { error: 'OPERATION_FAILED' }),
    })
    expect(screen.getByText('这次关注修改未保存，请重试。')).toBeInTheDocument()
  })

  it('renders the English surface for every object type', () => {
    renderPage([itemTarget, categoryTarget, modelTarget], { lang: 'en' })
    expect(screen.getByText('Equipment category')).toBeInTheDocument()
    expect(screen.getByText('Equipment model')).toBeInTheDocument()
    expect(screen.getByText('Item')).toBeInTheDocument()
    expect(screen.getAllByText('Open Item Explorer')).toHaveLength(2)
  })
})

describe('the add control never disturbs the surrounding choice', () => {
  function ToggleHarness({
    candidate,
    onParentClick,
    onToggle,
    presentation = 'COMPACT',
  }: {
    candidate: PersonalWatchTargetCandidate | null
    onParentClick: () => void
    onToggle: (candidate: PersonalWatchTargetCandidate) => Promise<void>
    presentation?: 'COMPACT' | 'ICON'
  }) {
    return (
      <LangProvider lang="zh">
        {/* Mirrors the catalog navigation layout: a choice button and the toggle as siblings. */}
        <div onClick={onParentClick}>
          <button type="button" onClick={onParentClick}>选择型号</button>
          <PersonalWatchlistToggle
            controller={controllerFor([], { toggle: onToggle })}
            candidate={candidate}
            presentation={presentation}
          />
        </div>
      </LangProvider>
    )
  }

  it('does not bubble a mouse click up to the model selection', async () => {
    const onParentClick = vi.fn()
    const onToggle = vi.fn(async () => {})
    const candidate = equipmentModelWatchCandidate(equipmentModelById('weapon_ak47')!)
    render(<ToggleHarness candidate={candidate} onParentClick={onParentClick} onToggle={onToggle} presentation="ICON" />)

    const toggle = screen.getByTestId('personal-watchlist-toggle-CATALOG_MODEL:CATALOG:MODEL:weapon_ak47')
    expect(toggle).toHaveClass('personal-watchlist-toggle--icon')
    expect(toggle).toHaveAccessibleName('关注该装备型号: AK-47')
    expect(toggle).toHaveTextContent('☆')
    expect(toggle).not.toHaveTextContent('关注该装备型号')
    await userEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it('is reachable and operable from the keyboard alone', async () => {
    const onParentClick = vi.fn()
    const onToggle = vi.fn(async () => {})
    const candidate = catalogCategoryWatchCandidate(ItemKind.KNIFE)
    render(<ToggleHarness candidate={candidate} onParentClick={onParentClick} onToggle={onToggle} />)

    const toggle = screen.getByTestId('personal-watchlist-toggle-CATALOG_CATEGORY:CATALOG:KNIFE')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle).toHaveAccessibleName('关注该装备大类: 刀具')
    await userEvent.tab()
    await userEvent.tab()
    expect(toggle).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onParentClick).not.toHaveBeenCalled()
    await userEvent.keyboard(' ')
    expect(onToggle).toHaveBeenCalledTimes(2)
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it('reflects the saved state and offers the matching remove label', () => {
    const candidate = catalogCategoryWatchCandidate(ItemKind.GLOVE)!
    render(
      <LangProvider lang="zh">
        <PersonalWatchlistToggle
          controller={controllerFor([parsePersonalWatchTarget({
            schema_version: 3,
            target_kind: 'CATALOG_CATEGORY',
            target_id: 'CATALOG:GLOVE',
            target_key: 'CATALOG_CATEGORY:CATALOG:GLOVE',
            parent_target_key: null,
            added_at: ADDED_AT,
            localized_name: { zh: '手套', en: 'Gloves' },
          })])}
          candidate={candidate}
          presentation="COMPACT"
        />
      </LangProvider>,
    )
    const toggle = screen.getByTestId('personal-watchlist-toggle-CATALOG_CATEGORY:CATALOG:GLOVE')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveTextContent('取消关注该装备大类')
  })

  it('shows a caption in place of the action text but keeps the accessible name', () => {
    render(
      <LangProvider lang="zh">
        <PersonalWatchlistToggle controller={controllerFor([])} candidate={catalogCategoryWatchCandidate(ItemKind.WEAPON)}
          presentation="COMPACT" caption="武器大类" />
      </LangProvider>,
    )
    const toggle = screen.getByTestId('personal-watchlist-toggle-CATALOG_CATEGORY:CATALOG:WEAPON')
    expect(toggle).toHaveTextContent('武器大类')
    expect(toggle).not.toHaveTextContent('关注该装备大类')
    expect(toggle).toHaveAccessibleName('关注该装备大类: 武器')
  })
})
