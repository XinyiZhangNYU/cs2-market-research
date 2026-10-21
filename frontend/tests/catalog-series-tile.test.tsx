import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogSeriesTile, type CatalogTileModelLink } from '../src/components/CatalogSeriesTile'
import { ITEM_IMAGE_NOT_PRODUCED } from '../src/contract/itemImage'
import { LangProvider } from '../src/i18n'

const BASE = 'defindex:7|paint:none'

function renderTile(baseItemCode: string, modelLink?: CatalogTileModelLink) {
  const onOpen = vi.fn()
  render(
    <LangProvider lang="zh">
      <CatalogSeriesTile
        itemKind="WEAPON"
        baseItemCode={baseItemCode}
        analysisUnitId="fixture:series"
        name="AK-47"
        image={ITEM_IMAGE_NOT_PRODUCED}
        rarity={null}
        count={1}
        href="/catalog?kind=WEAPON&base=x"
        onOpen={onOpen}
        modelLink={modelLink}
      />
    </LangProvider>,
  )
  return { onOpen, tile: screen.getByTestId(`catalog-base-${baseItemCode}`) }
}

describe('CatalogSeriesTile', () => {
  it('turns an unpainted gun into a link to its model instead of a dead card', async () => {
    const user = userEvent.setup()
    const openModel = vi.fn()
    const { onOpen, tile } = renderTile(BASE, { href: '/catalog?model=ak', seriesCount: 62, current: false, onOpen: openModel })

    expect(tile.tagName).toBe('A')
    expect(tile).toHaveAttribute('href', '/catalog?model=ak')
    expect(tile).toHaveAttribute('data-series-interactive', 'model')
    expect(tile).toHaveTextContent('查看全部 62 个系列')
    await user.click(tile)
    expect(openModel).toHaveBeenCalledOnce()
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('stays reference-only once that model is already chosen', async () => {
    const user = userEvent.setup()
    const openModel = vi.fn()
    const { tile } = renderTile(BASE, { href: '/catalog?model=ak', seriesCount: 62, current: true, onOpen: openModel })

    expect(tile.tagName).toBe('ARTICLE')
    expect(tile).toHaveAttribute('data-series-interactive', 'false')
    expect(tile).toHaveTextContent('当前型号')
    await user.click(tile)
    expect(openModel).not.toHaveBeenCalled()
  })

  it('keeps painted series opening their own page', async () => {
    const user = userEvent.setup()
    const openModel = vi.fn()
    const { onOpen, tile } = renderTile('defindex:7|paint:token:fixture', { href: '/m', seriesCount: 62, current: false, onOpen: openModel })

    expect(tile).toHaveAttribute('data-series-interactive', 'true')
    expect(tile).toHaveTextContent('1 个版本')
    await user.click(tile)
    expect(onOpen).toHaveBeenCalledOnce()
    expect(openModel).not.toHaveBeenCalled()
  })
})
