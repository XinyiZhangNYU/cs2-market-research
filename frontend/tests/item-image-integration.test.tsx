import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { ITEM_IMAGE_NOT_PRODUCED } from '../src/contract/itemImage'
import { UNIT_IDS, units } from '../src/mock/fixtures'

describe('the current synthetic item surfaces reserve honest media space', () => {
  it('puts exactly one not-produced thumbnail beside every candidate-pool identity', async () => {
    render(<App initialPage="items" />)

    for (const id of UNIT_IDS) {
      const slot = await screen.findByTestId(`item-image-${id}-list`)
      expect(slot).toHaveAttribute('data-image-source', 'NOT_PRODUCED')
      expect(slot).toHaveAttribute('data-image-status', 'NOT_PRODUCED')
      expect(slot.querySelector('img')).toBeNull()
    }
    expect(screen.getAllByText('图片未产出')).toHaveLength(UNIT_IDS.length)
  })

  it('uses the larger detail slot without changing the item identity route', async () => {
    render(<App initialPage="item" initialItemId="ITEM-0008" />)
    const slot = await screen.findByTestId('item-image-ITEM-0008-detail')
    expect(slot).toHaveClass('item-image-slot--detail')
    expect(slot).toHaveAttribute('data-image-status', 'NOT_PRODUCED')
    expect(screen.getByTestId('page-item')).toHaveTextContent('ITEM-0008')
  })

  it('keeps platform URLs out of every mock unit', () => {
    for (const unit of units('zh')) {
      expect(unit.image).toBe(ITEM_IMAGE_NOT_PRODUCED)
      expect(Object.keys(unit.image)).toEqual(['status'])
    }
  })
})
