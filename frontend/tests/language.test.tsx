import { act, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App, VIEWS, type ViewId } from '../src/App'
import { S } from '../src/i18n/strings'
import { CONTRACT_PROPOSALS } from '../src/contract/provenance'
import * as labels from '../src/contract/labels'

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

// CJK ideographs plus CJK punctuation and fullwidth forms. A machine value never matches this,
// which is why enum codes may stay visible in both modes without counting as a second language.
const CJK = /[　-〿一-鿿＀-￯]/

function cjkRunsIn(text: string): string[] {
  return text.match(/[　-〿一-鿿＀-￯]+/g) ?? []
}

describe('English mode contains no Chinese anywhere on the page', () => {
  for (const view of VIEWS) {
    it(`${view.id} renders no CJK when lang is en`, async () => {
      const { container } = render(
        <App initialPage={view.id as ViewId} initialLang="en" />,
      )
      await flush()
      const text = container.textContent ?? ''
      expect(text.length).toBeGreaterThan(50)
      expect(cjkRunsIn(text), `leaked Chinese on view ${view.id}`).toEqual([])
    })
  }
})

describe('Chinese mode still renders Chinese', () => {
  for (const view of VIEWS) {
    it(`${view.id} renders CJK when lang is zh`, async () => {
      const { container } = render(
        <App initialPage={view.id as ViewId} initialLang="zh" />,
      )
      await flush()
      expect(CJK.test(container.textContent ?? '')).toBe(true)
    })
  }
})

describe('one click switches the whole page', () => {
  it('switches zh to en and back without leaving mixed text', async () => {
    const user = userEvent.setup()
    const { container } = render(<App initialPage="item" initialLang="zh" />)
    await flush()
    expect(CJK.test(container.textContent ?? '')).toBe(true)

    await user.click(screen.getByTestId('lang-en'))
    await flush()
    expect(cjkRunsIn(container.textContent ?? '')).toEqual([])

    await user.click(screen.getByTestId('lang-zh'))
    await flush()
    expect(CJK.test(container.textContent ?? '')).toBe(true)
  })

  it('switches the document title and lang attribute too', async () => {
    const user = userEvent.setup()
    render(<App initialLang="zh" />)
    await flush()
    expect(CJK.test(document.title)).toBe(true)
    expect(document.documentElement.lang).toBe('zh-CN')

    await user.click(screen.getByTestId('lang-en'))
    await flush()
    expect(cjkRunsIn(document.title)).toEqual([])
    expect(document.documentElement.lang).toBe('en')
  })

  it('labels the switch with ISO codes so it carries no natural language', async () => {
    const user = userEvent.setup()
    render(<App initialLang="zh" />)
    await flush()
    expect(screen.getByTestId('lang-switch')).toHaveTextContent('ZHEN')
    expect(screen.getByTestId('lang-zh')).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByTestId('lang-en'))
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('translation tables are complete and single-language', () => {
  it('every UI string has a non-empty entry in both languages', () => {
    for (const [key, value] of Object.entries(S)) {
      expect(value.zh.length, `${key}.zh`).toBeGreaterThan(0)
      expect(value.en.length, `${key}.en`).toBeGreaterThan(0)
    }
  })

  it('no English UI string contains CJK', () => {
    const leaks = Object.entries(S).filter(([, v]) => CJK.test(v.en))
    expect(leaks.map(([k]) => k)).toEqual([])
  })

  it('no English enum label contains CJK', () => {
    const leaks: string[] = []
    for (const [mapName, map] of Object.entries(labels)) {
      if (typeof map !== 'object' || map === null) continue
      for (const [value, text] of Object.entries(map as Record<string, { en: string }>)) {
        if (CJK.test(text.en)) leaks.push(`${mapName}.${value}`)
      }
    }
    expect(leaks).toEqual([])
  })

  it('no English contract-proposal text contains CJK', () => {
    const leaks = CONTRACT_PROPOSALS.filter(
      (p) => CJK.test(p.note.en) || CJK.test(p.requestedBy.en),
    )
    expect(leaks.map((p) => p.proposedAs)).toEqual([])
  })
})
