import { act, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { EditionKind } from '../src/contract/identity'
import {
  CATALOG_PROJECTION_ROWS,
  editionOptionsFor,
  matchingCatalogRows,
  reconcileCatalogBrowseState,
  selectBaseItemCode,
  selectItemKind,
  toggleSelectedEdition,
  toggleSelectedWear,
  wearTierLabel,
  WearTier,
} from '../src/mock/catalogProjection'
import { ITEM_STATES, units } from '../src/mock/fixtures'
import {
  normalizeCatalogSearch,
  selectBaseItemCode as selectContractBaseItemCode,
} from '../src/contract/catalogBrowse'

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}
const CJK = /[　-〿一-鿿＀-￯]/

async function openWeaponAlpha(user: ReturnType<typeof userEvent.setup>) {
  render(<App initialPage="items" />)
  await flush()
  await user.click(screen.getByTestId('open-catalog-browse'))
  await user.click(screen.getByTestId('catalog-kind-WEAPON'))
  await user.click(screen.getByTestId('catalog-base-base.weapon.alpha'))
}

describe('the MOCK catalog projection stays off the result DTO', () => {
  it('does not put catalog fields on AnalysisUnit or item state snapshots', () => {
    for (const unit of units('zh')) {
      expect(unit).not.toHaveProperty('item_kind')
      expect(unit).not.toHaveProperty('base_item_code')
      expect(unit).not.toHaveProperty('wear_tier')
    }
    for (const state of Object.values(ITEM_STATES)) {
      expect(state).not.toHaveProperty('item_kind')
      expect(state).not.toHaveProperty('base_item_code')
      expect(state).not.toHaveProperty('wear_tier')
    }
  })

  it('joins only by analysis_unit_id and uses opaque base codes', () => {
    const ids = new Set(units('zh').map((unit) => unit.analysis_unit_id))
    for (const row of CATALOG_PROJECTION_ROWS) {
      expect(ids.has(row.analysis_unit_id)).toBe(true)
      expect(row.base_item_code).toMatch(/^base\.(weapon|knife|glove)\./)
      expect(row.base_item_code).not.toMatch(/合成|Synthetic|步枪|匕首|手套/)
    }
  })

  it('aggregates edition and wear independently, so a missing pair is just zero rows', () => {
    let state = selectItemKind('WEAPON')
    state = selectBaseItemCode('WEAPON', 'base.weapon.alpha')
    expect(editionOptionsFor('WEAPON', 'base.weapon.alpha')).toEqual([
      EditionKind.STANDARD,
      EditionKind.STATTRAK,
    ])
    expect(editionOptionsFor('WEAPON', 'base.weapon.alpha')).not.toContain(EditionKind.SOUVENIR)
    state = toggleSelectedEdition(state, EditionKind.STANDARD)
    state = toggleSelectedWear(state, WearTier.FACTORY_NEW)
    expect(matchingCatalogRows(state)).toEqual([])
  })

  it('presents edition filters as Standard, Souvenir, then StatTrak', () => {
    expect(editionOptionsFor('WEAPON', 'base.weapon.editions', [
      {
        item_kind: 'WEAPON',
        base_item_code: 'base.weapon.editions',
        analysis_unit_id: 'stattrak',
        edition_kind: EditionKind.STATTRAK,
        wear_tier: WearTier.FACTORY_NEW,
      },
      {
        item_kind: 'WEAPON',
        base_item_code: 'base.weapon.editions',
        analysis_unit_id: 'standard',
        edition_kind: EditionKind.STANDARD,
        wear_tier: WearTier.FACTORY_NEW,
      },
      {
        item_kind: 'WEAPON',
        base_item_code: 'base.weapon.editions',
        analysis_unit_id: 'souvenir',
        edition_kind: EditionKind.SOUVENIR,
        wear_tier: WearTier.FACTORY_NEW,
      },
    ])).toEqual([
      EditionKind.STANDARD,
      EditionKind.SOUVENIR,
      EditionKind.STATTRAK,
    ])
  })

  it('drops vanished selections instead of marking them invalid', () => {
    const reconciled = reconcileCatalogBrowseState({
      ...selectBaseItemCode('WEAPON', 'base.weapon.alpha'),
      itemKind: 'WEAPON',
      baseItemCode: 'base.weapon.alpha',
      selectedEditions: [EditionKind.STANDARD, EditionKind.SOUVENIR],
      selectedWears: [WearTier.FIELD_TESTED, WearTier.BATTLE_SCARRED],
    })
    expect(reconciled.selectedEditions).toEqual([EditionKind.STANDARD])
    expect(reconciled.selectedWears).toEqual([WearTier.FIELD_TESTED])
  })

  it('keeps an empty user selection empty instead of restoring every visible option', () => {
    const reconciled = reconcileCatalogBrowseState({
      ...selectBaseItemCode('WEAPON', 'base.weapon.alpha'),
      itemKind: 'WEAPON',
      baseItemCode: 'base.weapon.alpha',
      selectedEditions: [],
      selectedWears: [WearTier.FIELD_TESTED],
    })
    expect(reconciled.selectedEditions).toEqual([])
    expect(reconciled.selectedWears).toEqual([WearTier.FIELD_TESTED])
    expect(matchingCatalogRows(reconciled)).toEqual([])
  })

  it('labels NOT_APPLICABLE as an explicit catalog value, not a missing field', () => {
    expect(wearTierLabel[WearTier.NOT_APPLICABLE].zh).not.toMatch(/未写入|未产出/)
    expect(wearTierLabel[WearTier.NOT_APPLICABLE].en).not.toMatch(/not written|not produced/i)
  })

  it('normalizes bilingual search text without deriving catalog identity', () => {
    expect(normalizeCatalogSearch('  ＳｔａｔＴｒａｋ™   巨龙传说  ')).toBe(
      'stattraktm 巨龙传说',
    )
  })

  it('preserves discovery preferences while changing catalog levels', () => {
    const preserved = {
      seriesQuery: 'Dragon Lore',
    }
    const kind = selectItemKind('WEAPON', preserved)
    const base = selectContractBaseItemCode(
      'WEAPON',
      'base.weapon.alpha',
      CATALOG_PROJECTION_ROWS,
      kind,
    )
    expect(base).toMatchObject(preserved)
  })
})

describe('catalog browse is a separate item-module view', () => {
  it('does not add a third hub door', async () => {
    render(<App />)
    await flush()
    expect(screen.getByTestId('hub-doors').querySelectorAll('button')).toHaveLength(2)
    expect(screen.queryByTestId('page-item-browse')).toBeNull()
  })

  it('opens from a watch-list control without changing row clicks', async () => {
    const user = userEvent.setup()
    render(<App initialPage="items" />)
    await flush()
    expect(screen.getByTestId('open-catalog-browse')).toBeInTheDocument()
    await user.click(within(screen.getByTestId('not-watching')).getByText('ITEM-0003'))
    await flush()
    expect(screen.getByTestId('page-item')).toHaveTextContent('ITEM-0003')
    expect(screen.queryByTestId('page-item-browse')).toBeNull()
    expect(screen.queryByTestId('return-to-catalog-browse')).toBeNull()
  })

  it('drills item_kind then base_item_code then unit rows', async () => {
    const user = userEvent.setup()
    await openWeaponAlpha(user)
    expect(screen.getByTestId('page-item-browse')).toBeInTheDocument()
    expect(screen.queryByTestId('page-item')).toBeNull()
    expect(screen.getByTestId('catalog-row-ITEM-0001')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-row-ITEM-0005')).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-row-ITEM-0002')).toBeNull()
    expect(screen.queryByTestId('catalog-edition-SOUVENIR')).toBeNull()
    expect(screen.queryByTestId('catalog-wear-MINIMAL_WEAR')).toBeNull()
    expect(screen.queryByTestId('catalog-kind-AGENT')).toBeNull()
  })

  it('shows the projection empty copy when independent filters match no row', async () => {
    const user = userEvent.setup()
    await openWeaponAlpha(user)
    await user.click(screen.getByTestId('catalog-edition-STANDARD'))
    await user.click(screen.getByTestId('catalog-wear-FACTORY_NEW'))
    expect(screen.getByTestId('catalog-empty')).toHaveTextContent(
      '当前 MOCK catalog 投影没有匹配的分析单元。',
    )
    expect(screen.getByTestId('catalog-empty').textContent).not.toMatch(
      /无效|不适用|不存在|不支持/,
    )
  })

  it('keeps a cleared edition filter after leaving browse and opening it again', async () => {
    const user = userEvent.setup()
    await openWeaponAlpha(user)
    await user.click(screen.getByTestId('catalog-edition-STANDARD'))
    await user.click(screen.getByTestId('catalog-edition-STATTRAK'))
    expect(screen.getByTestId('catalog-empty')).toBeInTheDocument()
    await user.click(screen.getByTestId('return-to-watch-list'))
    await flush()
    await user.click(screen.getByTestId('open-catalog-browse'))
    expect(screen.getByTestId('catalog-edition-STANDARD')).not.toBeChecked()
    expect(screen.getByTestId('catalog-edition-STATTRAK')).not.toBeChecked()
    expect(screen.getByTestId('catalog-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-row-ITEM-0001')).toBeNull()
    expect(screen.queryByTestId('catalog-row-ITEM-0005')).toBeNull()
  })

  it('does not reapply the default when the active base is clicked again', async () => {
    const user = userEvent.setup()
    await openWeaponAlpha(user)
    await user.click(screen.getByTestId('catalog-edition-STANDARD'))
    await user.click(screen.getByTestId('catalog-edition-STATTRAK'))
    expect(screen.getByTestId('catalog-empty')).toBeInTheDocument()

    await user.click(screen.getByTestId('catalog-base-base.weapon.alpha'))

    expect(screen.getByTestId('catalog-edition-STANDARD')).not.toBeChecked()
    expect(screen.getByTestId('catalog-edition-STATTRAK')).not.toBeChecked()
    expect(screen.getByTestId('catalog-empty')).toBeInTheDocument()
  })

  it('opens existing unit detail from a browse row and returns with filters kept', async () => {
    const user = userEvent.setup()
    await openWeaponAlpha(user)
    await user.click(screen.getByTestId('catalog-edition-STANDARD'))
    expect(screen.queryByTestId('catalog-row-ITEM-0001')).toBeNull()
    await user.click(screen.getByTestId('catalog-row-ITEM-0005'))
    await flush()
    expect(screen.getByTestId('page-item')).toHaveTextContent('ITEM-0005')
    expect(screen.queryByTestId('page-item-browse')).toBeNull()
    await user.click(screen.getByTestId('return-to-catalog-browse'))
    expect(screen.getByTestId('page-item-browse')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-edition-STANDARD')).not.toBeChecked()
    expect(screen.getByTestId('catalog-edition-STATTRAK')).toBeChecked()
    expect(screen.getByTestId('catalog-row-ITEM-0005')).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-row-ITEM-0001')).toBeNull()
  })

  it('renders English browse copy without CJK', async () => {
    const user = userEvent.setup()
    const { container } = render(<App initialPage="items" initialLang="en" />)
    await flush()
    await user.click(screen.getByTestId('open-catalog-browse'))
    await user.click(screen.getByTestId('catalog-kind-WEAPON'))
    await user.click(screen.getByTestId('catalog-base-base.weapon.alpha'))
    expect(container.textContent ?? '').toMatch(/MOCK catalog projection/)
    expect(CJK.test(container.textContent ?? '')).toBe(false)
  })
})
