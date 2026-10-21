import { describe, expect, it } from 'vitest'
import { parseSteamAccountInput } from '../src/steam/steamAccount'
import { decodeSteamPortfolioInventory } from '../src/wire/steamPortfolioApiDecode'

describe('parseSteamAccountInput', () => {
  it('accepts SteamID64 and public profile URLs and rejects vanity or trade URLs', () => {
    const steamid = '76561198000000000'
    expect(parseSteamAccountInput(steamid)).toEqual({ ok: true, steamid })
    expect(parseSteamAccountInput(` https://steamcommunity.com/profiles/${steamid}/ `)).toEqual({
      ok: true,
      steamid,
    })
    expect(
      parseSteamAccountInput(`http://www.steamcommunity.com/profiles/${steamid}?xml=1`),
    ).toEqual({ ok: true, steamid })
    expect(parseSteamAccountInput(`steamcommunity.com/profiles/${steamid}`)).toEqual({
      ok: true,
      steamid,
    })
    expect(parseSteamAccountInput('')).toEqual({ ok: false, code: 'EMPTY' })
    expect(parseSteamAccountInput('   ')).toEqual({ ok: false, code: 'EMPTY' })
    expect(parseSteamAccountInput('https://steamcommunity.com/id/example')).toEqual({
      ok: false,
      code: 'VANITY',
    })
    expect(parseSteamAccountInput('not-a-steam-id')).toEqual({ ok: false, code: 'INVALID' })
    expect(
      parseSteamAccountInput('https://steamcommunity.com/tradeoffer/new/?partner=1&token=abcd'),
    ).toEqual({ ok: false, code: 'INVALID' })
  })
})

describe('steam portfolio inventory wire', () => {
  it('accepts stacked public inventory and rejects extra asset identifiers', () => {
    const document = decodeSteamPortfolioInventory({
      api_contract: 'steam-portfolio-inventory',
      api_version: 'v1',
      response_kind: 'STEAM_PORTFOLIO_INVENTORY',
      steamid: '76561198000000000',
      appid: 730,
      contextid: '2',
      total_asset_count: 2,
      skipped_unnamed: 0,
      truncated: false,
      stacks: [{ market_hash_name: 'AK-47 | Redline (Field-Tested)', quantity: 2 }],
    })
    expect(document.response_kind).toBe('STEAM_PORTFOLIO_INVENTORY')
    expect(() =>
      decodeSteamPortfolioInventory({
        api_contract: 'steam-portfolio-inventory',
        api_version: 'v1',
        response_kind: 'STEAM_PORTFOLIO_INVENTORY',
        steamid: '76561198000000000',
        appid: 730,
        contextid: '2',
        total_asset_count: 1,
        skipped_unnamed: 0,
        truncated: false,
        stacks: [{ market_hash_name: 'AK-47 | Redline (Field-Tested)', quantity: 1, assetid: '1' }],
      }),
    ).toThrow()
  })
})
