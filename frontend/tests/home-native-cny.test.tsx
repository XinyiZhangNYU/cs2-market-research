import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { NativeCnyMarketSession, NativeCnyMarketSectorIndexGateway } from '../src/api/NativeCnyMarketGateways'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { HomeMarketPanel } from '../src/pages/PublicHomeHero'
import { HomeSectorStrip } from '../src/pages/PublicHomeModules'
import { LangProvider } from '../src/i18n'
import { syntheticFetch } from './native-cny-market-fixtures'

afterEach(cleanup)

function nativeHome() {
  const paths: string[] = []
  const fetcher: typeof fetch = async (input, init) => { paths.push(String(input)); return syntheticFetch(input, init) }
  const gateway = new NativeCnyMarketSectorIndexGateway(new NativeCnyMarketSession(
    new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher })))
  return { paths, api: new MarketSectorIndexPublicApi(gateway) }
}
const histories = (paths: readonly string[]) => paths
  .filter((path) => path.includes('/native-cny/index/history'))
  .map((path) => new URL(path, 'http://localhost').searchParams)

describe('HOME on the native CNY index', () => {
  it('shows the published native market day, never legacy values or a cross-gap 30-day return', async () => {
    const { api, paths } = nativeHome()
    render(<LangProvider lang="en">
      <HomeMarketPanel api={api} marketHref="/market" onMarketClick={() => undefined} catalogStatus={null} />
    </LangProvider>)
    const panel = await screen.findByTestId('home-market')
    await within(panel).findByText('Apr 6')
    // Exact one-decimal display of 10303.01, trailing zero dropped like the legacy Intl path.
    expect(within(panel).getByText('10,303')).toBeVisible()
    expect(within(panel).getByTestId('home-market-daily')).toHaveTextContent('+1.0%')
    // 04-03 is missing, so the 30-day window is not formally connected.
    expect(within(panel).getByTestId('home-market-return')).toHaveTextContent('—')
    expect(within(panel).getByText('120')).toBeVisible()
    expect(panel).not.toHaveTextContent('999,999')
    expect(paths.some((path) => path.includes('/market-index/public/series'))).toBe(false)
    const [window] = histories(paths)
    expect([window?.get('scope'), window?.get('start'), window?.get('end')]).toEqual(['ALL', '2025-03-07', '2025-04-06'])
  })

  it('reads only the latest pair for each root sector card', async () => {
    const { api, paths } = nativeHome()
    render(<LangProvider lang="en">
      <HomeSectorStrip api={api} sectorHref={(code) => `/market/${code ?? ''}`} onSectorClick={() => undefined} />
    </LangProvider>)
    const strip = await screen.findByTestId('home-sectors')
    await within(strip).findByText('Knives')
    expect(within(strip).getByText('Weapons')).toBeVisible()
    expect(strip).toHaveTextContent('+1.0%')
    const reads = histories(paths)
    expect(reads.length).toBeGreaterThan(0)
    expect(reads.every((query) => query.get('start') === '2025-04-05' && query.get('end') === '2025-04-06')).toBe(true)
    expect(reads.map((query) => query.get('scope'))).not.toContain('WEAPON_MODEL:7')
  })
})
