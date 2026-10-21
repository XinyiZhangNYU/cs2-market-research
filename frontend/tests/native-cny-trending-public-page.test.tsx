import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { HttpNativeCnyTrendingGateway } from '../src/api/HttpNativeCnyTrendingGateway'
import { NativeCnyTrendingPublicGateway } from '../src/api/NativeCnyTrendingPublicGateway'
import { createTrendingPublicGateway } from '../src/api/nativeCnyTrendingConfig'
import { LangProvider } from '../src/i18n'
import { PublicTrendingPage } from '../src/pages/PublicTrendingPage'
import { HomeMovers } from '../src/pages/PublicHomeModules'
import type { TrendingFilters, TrendingDirection } from '../src/wire/singleItemTrendingPublicApiTypes'
import { t } from '../src/i18n/strings'
import { nativePublicFixture, nativeFixtureResponse, fixtureNow, EMPTY_FILTERS, SyntheticTrendingCatalog } from './native-cny-trending-public-fixtures'
import legacyFixture from '../../schemas/examples/single-item-trending-list.valid.json'

function setup(status = 200) {
  const payload = status === 200 ? nativePublicFixture() : status === 404 || status === 503
    ? { api_contract: 'native-cny-trending-day/1', error: status === 404 ? 'NOT_PUBLISHED' : 'TEMPORARILY_UNAVAILABLE' } : {}
  const fetcher = vi.fn(async () => nativeFixtureResponse(payload, status === 299 ? 200 : status))
  const catalog = new SyntheticTrendingCatalog()
  const gateway = new NativeCnyTrendingPublicGateway(catalog, new HttpNativeCnyTrendingGateway(fetcher), fixtureNow)
  return { fetcher, gateway }
}
function Page({ gateway }: { gateway: NativeCnyTrendingPublicGateway }) {
  const [filters, setFilters] = useState<TrendingFilters>(EMPTY_FILTERS)
  const [direction, setDirection] = useState<TrendingDirection>('GAINERS')
  return <PublicTrendingPage gateway={gateway} asOf={null} publicationId={null} direction={direction} filters={filters}
    catalogHref="/research" onCatalogClick={() => {}} onQueryChange={(d, f) => { setDirection(d); setFilters(f) }} />
}
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('native Trending uses existing public surfaces', () => {
  it.each(['zh', 'en'] as const)('shows catalog names, exact percent, real dates and evidence in %s without legacy facts', async (lang) => {
    const { gateway, fetcher } = setup()
    render(<LangProvider lang={lang}><Page gateway={gateway} /></LangProvider>)
    expect(await screen.findByText(lang === 'zh' ? '合成步枪 | 样例 1' : 'Synthetic Rifle | Sample 1')).toBeVisible()
    expect(screen.getByText('+40.0%')).toBeVisible()
    const pub = screen.getByTestId('public-trending-publication')
    expect(pub.querySelector('time')?.dateTime).toBe('2026-10-02T00:00:00Z')
    expect(pub).toHaveTextContent(lang === 'zh' ? '2026年9月1日 – 2026年10月1日' : 'Sep 1, 2026 – Oct 1, 2026')
    expect(pub).not.toHaveTextContent(/CNY|USD/)
    expect(screen.queryByTestId('public-trending-coverage')).not.toBeInTheDocument()
    expect(screen.queryByText(t('publicResultFresh', lang))).not.toBeInTheDocument()
    expect(screen.queryByText(t('publicTrendingFxBasis', lang))).not.toBeInTheDocument()
    expect(screen.getAllByText(t('publicTrendingTwoSource', lang))).toHaveLength(2)
    expect(screen.getByText('Synthetic fallback 4')).toBeVisible()
    expect(screen.getByTestId('public-trending-image-4')).toHaveAttribute('data-image-status', 'NOT_PRODUCED')
    expect(screen.getByText(lang === 'zh' ? '合成步枪 | 样例 1' : 'Synthetic Rifle | Sample 1').closest('a')?.getAttribute('href')).toContain('unit=item%3A1&snapshot=')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('direction and filters reuse the single decoded publication and original ranks', async () => {
    const { gateway, fetcher } = setup()
    render(<LangProvider lang="en"><Page gateway={gateway} /></LangProvider>)
    await screen.findByText('+40.0%')
    await waitFor(() => expect(screen.getByLabelText(t('publicTrendingItemKind', 'en'))).toBeEnabled())
    fireEvent.change(screen.getByLabelText(t('publicTrendingItemKind', 'en')), { target: { value: 'WEAPON' } })
    await waitFor(() => expect(screen.queryByText('Synthetic Knife | Sample 2')).not.toBeInTheDocument())
    const rows = screen.getByRole('list')
    expect(within(rows).getByText('01')).toBeVisible()
    expect(within(rows).getByText('03')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: t('publicTrendingLosers', 'en') }))
    await screen.findByText('-4.0%')
    expect(screen.queryByText('+40.0%')).not.toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it.each([404, 503, 299])('uses existing not-published state for %s without fallback', async (status) => {
    const { gateway } = setup(status)
    render(<LangProvider lang="zh"><Page gateway={gateway} /></LangProvider>)
    expect(await screen.findByRole('heading', { name: t('publicTrendingNotPublishedTitle', 'zh') })).toBeVisible()
    expect(screen.queryByTestId('public-trending-publication')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
  it.each(['zh', 'en'] as const)('home module uses exact percentage and real window, not false stale in %s', async (lang) => {
    const { gateway } = setup()
    render(<LangProvider lang={lang}><HomeMovers gateway={gateway} href="/trending" onClick={() => {}} /></LangProvider>)
    const home = await screen.findByTestId('home-movers')
    expect(await within(home).findByText('+40.0%')).toBeVisible()
    expect(home).toHaveTextContent(lang === 'zh' ? '9月1日' : 'Sep 1')
    expect(home).toHaveTextContent(lang === 'zh' ? '10月1日' : 'Oct 1')
    expect(home).not.toHaveTextContent(/USD|CNY/)
    expect(home.querySelector('.is-stale')).toBeNull()
  })
  it('OFF still issues the existing legacy endpoint and renders its unchanged evidence/freshness', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      expect(String(url)).toContain('/api/v1/research-results/public/trending')
      expect(String(url)).not.toContain('native-cny')
      const value = structuredClone(legacyFixture)
      value.query.page_size = 24
      return nativeFixtureResponse(value)
    }))
    try {
      const gateway = createTrendingPublicGateway(new SyntheticTrendingCatalog(), false)
      render(<LangProvider lang="en"><PublicTrendingPage gateway={gateway} asOf={null} publicationId={null}
        direction="GAINERS" filters={EMPTY_FILTERS} catalogHref="/research" onCatalogClick={() => {}} onQueryChange={() => {}} /></LangProvider>)
      expect(await screen.findByTestId('public-trending-publication')).toHaveTextContent('CNY')
      expect(screen.getByText(t('publicTrendingFxBasis', 'en'))).toBeVisible()
    } finally { vi.unstubAllGlobals() }
  })
})
