import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogSeriesCard } from '../src/components/CatalogSeriesCard'
import { ITEM_IMAGE_NOT_PRODUCED } from '../src/contract/itemImage'
import { LangProvider } from '../src/i18n'

function renderCard(itemKind: 'WEAPON' | 'KNIFE', baseItemCode: string, onSelect = vi.fn()) {
  render(
    <LangProvider lang="zh">
      <CatalogSeriesCard
        itemKind={itemKind}
        baseItemCode={baseItemCode}
        analysisUnitId="fixture:series"
        name={itemKind === 'WEAPON' ? 'CZ75自动型' : '折叠刀'}
        image={ITEM_IMAGE_NOT_PRODUCED}
        rarity={null}
        count={1}
        selected={false}
        onSelect={onSelect}
      />
    </LangProvider>,
  )
  return onSelect
}

describe('CatalogSeriesCard', () => {
  it('keeps an unpainted gun visible but removes click and keyboard-button semantics', async () => {
    const user = userEvent.setup()
    const onSelect = renderCard('WEAPON', 'defindex:63|paint:none')
    const card = screen.getByTestId('catalog-base-defindex:63|paint:none')

    expect(card.tagName).toBe('ARTICLE')
    expect(card).toHaveAttribute('data-series-interactive', 'false')
    expect(card).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('button', { name: 'CZ75自动型' })).not.toBeInTheDocument()
    expect(screen.getByText('CZ75自动型')).toBeInTheDocument()
    expect(screen.getByText(/1 个目录单元/u)).toBeInTheDocument()

    await user.click(card)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('keeps an unpainted knife selectable', async () => {
    const user = userEvent.setup()
    const onSelect = renderCard('KNIFE', 'defindex:505|paint:none')
    const card = screen.getByRole('button', { name: '折叠刀' })

    expect(card).toHaveAttribute('data-series-interactive', 'true')
    await user.click(card)
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
