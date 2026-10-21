import { describe, expect, it } from 'vitest'
import {
  formatLocalizedCurrencyFromCny,
  formatLocalizedCurrencyFromUsd,
} from '../src/price/localizedCurrency'

describe('language-bound informational currency display', () => {
  it('keeps Chinese amounts in CNY and converts English amounts with the current reference', () => {
    expect(formatLocalizedCurrencyFromCny('670', 'zh', '6.7')).toBe('¥670.00')
    expect(formatLocalizedCurrencyFromCny('670', 'en', '6.7')).toBe('$100.00')
  })

  it('rounds the display conversion half-even without changing the published CNY value', () => {
    expect(formatLocalizedCurrencyFromCny('1.005', 'zh', null)).toBe('¥1.00')
    expect(formatLocalizedCurrencyFromCny('1.015', 'zh', null)).toBe('¥1.02')
  })

  it('never leaks CNY into English when the current reference is unavailable or invalid', () => {
    expect(formatLocalizedCurrencyFromCny('670', 'en', null)).toBe('—')
    expect(formatLocalizedCurrencyFromCny('670', 'en', '0')).toBe('—')
    expect(formatLocalizedCurrencyFromCny('bad', 'en', '6.7')).toBe('—')
  })

  it('keeps English USD and renders Chinese CNY with the current reference', () => {
    expect(formatLocalizedCurrencyFromUsd('100', 'en', null)).toBe('$100.00')
    expect(formatLocalizedCurrencyFromUsd('100', 'zh', '6.7')).toBe('¥670.00')
    expect(formatLocalizedCurrencyFromUsd('100', 'zh', null)).toBe('—')
  })
})
