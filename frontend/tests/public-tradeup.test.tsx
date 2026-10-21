import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../src/i18n'
import { PublicTradeUpPage } from '../src/pages/PublicTradeUpPage'
import { publicRouteHref, readPublicRoute } from '../src/publicNavigation'
import type { TradeUpGraphDocument } from '../src/tradeup/tradeupTypes'
import { tradeUpInputEditions } from '../src/tradeup/tradeupEngine'
import { TRADEUP_RELEASE } from '../src/tradeup/tradeupRelease.mjs'
import { TRADEUP_GRAPH_REUSE_MS } from '../src/tradeup/tradeupGraphLoader'

const graphText = readFileSync(resolve(import.meta.dirname, `../public${TRADEUP_RELEASE.url}`), 'utf8')
const graph = JSON.parse(graphText) as TradeUpGraphDocument

afterEach(() => vi.restoreAllMocks())

describe('public trade-up route and page', () => {
  it('round-trips the bilingual /tradeup route without extra query state', () => {
    const route = readPublicRoute({ pathname: '/tradeup', search: '?lang=en' } as Location, { surface: 'HOME', lang: 'zh' })
    expect(route.surface).toBe('TRADEUP')
    expect(route.invalid).toBe(false)
    expect(publicRouteHref(route)).toBe('/tradeup?lang=en')
  })

  it('renders in the formal page system and calculates a searched input', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(graphText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))
    const user = userEvent.setup()
    render(<LangProvider lang="zh"><PublicTradeUpPage /></LangProvider>)
    await screen.findByRole('heading', { level: 1, name: '炼金模拟器' })
    expect(screen.getByText(/规则数据/u)).toBeInTheDocument()
    expect(screen.queryByText(/价格|收益率|交易建议/u)).not.toBeNull()
    expect(screen.queryByText('验收示例')).not.toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: '搜索武器或皮肤名称' }), '超新星')
    await user.click(await screen.findByRole('option', { name: /P250 \| 超新星/u }))
    await user.clear(screen.getByRole('textbox', { name: '磨损值' }))
    await user.type(screen.getByRole('textbox', { name: '磨损值' }), '0.11')
    await user.click(screen.getByRole('button', { name: '填满剩余位置' }))
    const inputs = screen.getByRole('region', { name: '合约投入' })
    expect(within(inputs).getAllByText('P250 | 超新星 (略有磨损)')).toHaveLength(10)
    expect(within(inputs).getAllByText('普通')).toHaveLength(10)
    expect(within(inputs).queryByText(/StatTrak/u)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '计算合约结果' }))
    await waitFor(() => expect(screen.getAllByText('33.33%')).toHaveLength(4))
    expect(screen.getByText('0.0825')).toBeInTheDocument()
    expect(document.body.innerHTML).not.toMatch(/steamstatic|community\.akamai|cs2\.sh/u)
    await user.click(screen.getByRole('checkbox', { name: '无磨损' }))
    await user.click(screen.getByRole('button', { name: '计算合约结果' }))
    await waitFor(() => expect(screen.getAllByText('33.33%')).toHaveLength(4))
    expect(screen.queryByText('预计磨损值')).not.toBeInTheDocument()
    expect(screen.queryByText(/中点/u)).not.toBeInTheDocument()
    expect(screen.queryByText(/崭新出厂|略有磨损|久经沙场|破损不堪|战痕累累/u)).not.toBeInTheDocument()
  })

  it('lists every keyword match and keeps the public rarity filter', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(graphText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))
    const haystack = (skin: TradeUpGraphDocument['skins'][number]) =>
      `${skin.names.zh_cn}\n${skin.names.en}`.toLocaleLowerCase('zh-CN')
    const eligible = graph.skins.filter((skin) =>
      tradeUpInputEditions(graph, skin).length > 0 && haystack(skin).includes('ak-47'))
    const restricted = eligible.filter((skin) => skin.rarity_tier === 4)
    expect(eligible.length).toBeGreaterThan(1)

    const user = userEvent.setup()
    render(<LangProvider lang="zh"><PublicTradeUpPage /></LangProvider>)
    await screen.findByRole('heading', { level: 1, name: '炼金模拟器' })
    expect(screen.getByRole('combobox', { name: '品质' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '军规级' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '隐秘' })).not.toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: '搜索武器或皮肤名称' }), 'AK-47')
    expect(await screen.findAllByRole('option', { name: /AK-47/u })).toHaveLength(eligible.length)

    await user.selectOptions(screen.getByRole('combobox', { name: '品质' }), '4')
    expect(screen.getAllByRole('option', { name: /AK-47/u })).toHaveLength(restricted.length)
    expect(screen.getAllByRole('option', { name: /AK-47/u })[0]).toHaveTextContent('受限')
  })

  it('keeps search and selection names neutral, then derives the input wear suffix from the chosen float', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(graphText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))
    const user = userEvent.setup()
    render(<LangProvider lang="zh"><PublicTradeUpPage /></LangProvider>)
    await screen.findByRole('heading', { level: 1, name: '炼金模拟器' })
    await user.type(screen.getByRole('textbox', { name: '搜索武器或皮肤名称' }), '红苹果')
    const option = await screen.findByRole('option', { name: /格洛克18型 \| 红苹果/u })
    expect(option).not.toHaveTextContent(/StatTrak|战痕累累/u)
    await user.click(option)
    expect(screen.getByText('格洛克18型 | 红苹果')).toBeInTheDocument()
    await user.clear(screen.getByRole('textbox', { name: '磨损值' }))
    await user.type(screen.getByRole('textbox', { name: '磨损值' }), '0.05')
    await user.click(screen.getByRole('button', { name: '加入一件' }))
    const inputs = screen.getByRole('region', { name: '合约投入' })
    expect(within(inputs).getByText('格洛克18型 | 红苹果 (崭新出厂)')).toBeInTheDocument()
    expect(within(inputs).getByText('普通')).toBeInTheDocument()
    expect(within(inputs).queryByText(/StatTrak/u)).not.toBeInTheDocument()
  })

  it('keeps the narrow page free of fixed-width overflow contracts', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(graphText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    render(<LangProvider lang="en"><PublicTradeUpPage /></LangProvider>)
    await screen.findByRole('heading', { level: 1, name: 'Trade Up Simulator' })
    expect(screen.getByRole('article')).toHaveClass('public-result-page')
  })

  it('withholds unsupported editions and prevents mixed StatTrak contracts at selection time', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(graphText, { status: 200 })))
    const user = userEvent.setup()
    render(<LangProvider lang="en"><PublicTradeUpPage /></LangProvider>)
    await screen.findByRole('heading', { level: 1, name: 'Trade Up Simulator' })
    expect(screen.getByText(/Five-Covert.*withheld/u)).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Search weapon or finish' }), 'Supernova')
    await user.click(await screen.findByRole('option', { name: /P250.*Supernova/u }))
    const select = screen.getByRole('combobox', { name: 'Edition' })
    expect(within(select).queryByRole('option', { name: 'Souvenir' })).not.toBeInTheDocument()
    await user.selectOptions(select, 'stattrak')
    await user.click(screen.getByRole('button', { name: 'Add one' }))
    expect(within(select).getAllByRole('option')).toHaveLength(1)
    expect(within(select).getByRole('option', { name: 'StatTrak™' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fill remaining slots' }))
    await user.click(screen.getByRole('button', { name: 'Calculate outcomes' }))
    await waitFor(() => expect(screen.getAllByText('33.33%')).toHaveLength(4))
  })

  it('withholds the page when stale or modified graph bytes fail the pinned release', async () => {
    // A previously verified in-memory graph may be reused for at most 30s.
    // The next actual response must still pass the original byte-level gate.
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + TRADEUP_GRAPH_REUSE_MS)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(`${graphText} `, { status: 200 })))
    render(<LangProvider lang="en"><PublicTradeUpPage /></LangProvider>)
    await screen.findByText('Trade-up rules are temporarily unavailable. Refresh to retry.')
    expect(screen.queryByRole('button', { name: 'Calculate outcomes' })).not.toBeInTheDocument()
  })
})
