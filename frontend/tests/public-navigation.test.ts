import { describe, expect, it } from 'vitest'
import {
  publicRouteHref,
  readPublicRoute,
} from '../src/publicNavigation'
import { catalogItemCategories, catalogRarities, catalogWearTiers } from '../src/catalog/catalogFacetOptions'

const DEFAULTS = { surface: 'HOME' as const, lang: 'zh' as const }

describe('public catalog discovery URL state', () => {
  it('keeps the four homepage products plus separate Price Movers and Following routes public while rejecting the internal quality audit route', () => {
    const home = readPublicRoute({ pathname: '/', search: '' }, DEFAULTS)
    expect(home).toMatchObject({ surface: 'HOME', invalid: false })
    expect(publicRouteHref(home)).toBe('/')

    const market = readPublicRoute({ pathname: '/market', search: '?lang=en' }, DEFAULTS)
    expect(market).toMatchObject({ surface: 'MARKET', lang: 'en', invalid: false })
    expect(publicRouteHref(market)).toBe('/market?lang=en')

    const watchlist = readPublicRoute({ pathname: '/item-monitor', search: '' }, DEFAULTS)
    expect(watchlist).toMatchObject({
      surface: 'WATCHLIST',
      lang: 'zh',
      invalid: false,
    })
    expect(publicRouteHref(watchlist)).toBe('/item-monitor')

    const trending = readPublicRoute({ pathname: '/trending', search: '?lang=en' }, DEFAULTS)
    expect(trending).toMatchObject({
      surface: 'TRENDING',
      lang: 'en',
      trendingDirection: 'GAINERS',
      invalid: false,
    })
    expect(publicRouteHref(trending)).toBe('/trending?lang=en')

    const following = readPublicRoute({ pathname: '/following', search: '?lang=en' }, DEFAULTS)
    expect(following).toMatchObject({ surface: 'FOLLOWING', lang: 'en', invalid: false })
    expect(publicRouteHref(following)).toBe('/following?lang=en')

    const portfolio = readPublicRoute({ pathname: '/portfolio', search: '?lang=en' }, DEFAULTS)
    expect(portfolio).toMatchObject({ surface: 'PORTFOLIO', lang: 'en', invalid: false })
    expect(publicRouteHref(portfolio)).toBe('/portfolio?lang=en')

    const valve = readPublicRoute({ pathname: '/valve', search: '?lang=en' }, DEFAULTS)
    expect(valve).toMatchObject({ surface: 'VALVE', lang: 'en', invalid: false })
    expect(publicRouteHref(valve)).toBe('/valve?lang=en')

    const internalAudit = readPublicRoute({ pathname: '/quality', search: '' }, DEFAULTS)
    expect(internalAudit.invalid).toBe(true)
    expect(internalAudit.surface).toBe('HOME')
  })

  it('round-trips an independent date-bound Trending query without watchlist state', () => {
    const publication = 'c'.repeat(64)
    const route = readPublicRoute({
      pathname: '/trending',
      search: `?lang=en&as_of=2026-09-06&publication=${publication}&direction=LOSERS&item_kind=KNIFE&base_item_code=${encodeURIComponent('weapon.knife.karambit')}&edition_kind=STATTRAK&wear_tier=FIELD_TESTED`,
    }, DEFAULTS)
    expect(route).toMatchObject({
      surface: 'TRENDING',
      lang: 'en',
      publicResultAsOf: null,
      publicPublicationId: null,
      publicWatchlistUnitId: null,
      trendingAsOf: '2026-09-06',
      trendingPublicationId: publication,
      trendingDirection: 'LOSERS',
      trendingFilters: {
        item_kind: 'KNIFE',
        base_item_code: 'weapon.knife.karambit',
        edition_kind: 'STATTRAK',
        wear_tier: 'FIELD_TESTED',
      },
      invalid: false,
    })
    const canonical = publicRouteHref(route)
    expect(canonical).toBe(
      `/trending?lang=en&as_of=2026-09-06&publication=${publication}&direction=LOSERS&item_kind=KNIFE&base_item_code=weapon.knife.karambit&edition_kind=STATTRAK&wear_tier=FIELD_TESTED`,
    )
    expect(readPublicRoute(new URL(canonical, 'https://example.invalid'), DEFAULTS)).toEqual(route)
  })

  it('round-trips pinned descriptive-market scopes and exact watchlist-detail links', () => {
    const publication = 'a'.repeat(64)
    const scope = 'b'.repeat(64)
    const unit = 'c'.repeat(64)
    const market = readPublicRoute({
      pathname: '/market',
      search: `?lang=en&publication=${publication}&scope=${scope}`,
    }, DEFAULTS)
    expect(market).toMatchObject({
      invalid: false,
      publicResultAsOf: null,
      publicPublicationId: publication,
      publicWatchlistUnitId: null,
      marketScopeToken: scope,
    })
    expect(readPublicRoute(new URL(publicRouteHref(market), 'https://example.invalid'), DEFAULTS)).toEqual(market)

    const watchlist = readPublicRoute({
      pathname: '/item-monitor',
      search: `?publication=${publication}&unit=${unit}`,
    }, DEFAULTS)
    expect(watchlist).toMatchObject({
      invalid: false,
      publicResultAsOf: null,
      publicPublicationId: publication,
      publicWatchlistUnitId: unit,
    })
    expect(readPublicRoute(new URL(publicRouteHref(watchlist), 'https://example.invalid'), DEFAULTS)).toEqual(watchlist)
    expect(publicRouteHref(watchlist)).not.toContain('view=')
  })

  it('round-trips the independent item-history list and publication-bound detail routes', () => {
    const publication = 'a'.repeat(64)
    const event = 'b'.repeat(64)
    const list = readPublicRoute({ pathname: '/item-monitor/history', search: '?lang=en' }, DEFAULTS)
    expect(list).toMatchObject({
      surface: 'WATCHLIST', historyView: true, publicWatchlistUnitId: null, invalid: false,
    })
    expect(publicRouteHref(list)).toBe('/item-monitor/history?lang=en')

    const detail = readPublicRoute({
      pathname: `/item-monitor/history/${event}`,
      search: `?publication=${publication}`,
    }, DEFAULTS)
    expect(detail).toMatchObject({
      surface: 'WATCHLIST', publicPublicationId: publication,
      historyView: true, publicWatchlistUnitId: event, invalid: false,
    })
    expect(readPublicRoute(new URL(publicRouteHref(detail), 'https://example.invalid'), DEFAULTS)).toEqual(detail)
    expect(readPublicRoute({ pathname: '/item-monitor/history/not-a-token', search: '' }, DEFAULTS).invalid).toBe(true)
    expect(readPublicRoute({ pathname: `/item-monitor/history/${event}`, search: '' }, DEFAULTS).invalid).toBe(true)
    expect(readPublicRoute({ pathname: '/item-monitor/history', search: '?unit=' + event }, DEFAULTS).invalid).toBe(true)
  })

  it('keeps the three products separate, canonicalizes legacy watchlist links and rejects the withdrawn observation view', () => {
    const personal = readPublicRoute({ pathname: '/following', search: '?lang=en' }, DEFAULTS)
    expect(personal).toMatchObject({ surface: 'FOLLOWING', invalid: false })
    expect(publicRouteHref(personal)).toBe('/following?lang=en')

    const legacyPersonal = readPublicRoute({ pathname: '/watchlist', search: '?view=personal&lang=en' }, DEFAULTS)
    expect(legacyPersonal).toMatchObject({ surface: 'FOLLOWING', invalid: false })
    expect(publicRouteHref(legacyPersonal)).toBe('/following?lang=en')

    const system = readPublicRoute({ pathname: '/item-monitor', search: '?lang=en' }, DEFAULTS)
    expect(system).toMatchObject({ surface: 'WATCHLIST', invalid: false })
    expect(publicRouteHref(system)).toBe('/item-monitor?lang=en')

    const legacySystem = readPublicRoute({ pathname: '/watchlist', search: '?view=system&lang=en' }, DEFAULTS)
    expect(legacySystem).toMatchObject({ surface: 'WATCHLIST', invalid: false })
    expect(publicRouteHref(legacySystem)).toBe('/item-monitor?lang=en')

    const observation = readPublicRoute({
      pathname: '/watchlist',
      search: `?view=observation&lang=en&as_of=2026-09-06T12%3A00%3A00.000000Z&publication=${'b'.repeat(64)}&unit=item%3Aone`,
    }, DEFAULTS)
    expect(observation).toMatchObject({
      publicResultAsOf: '2026-09-06T12:00:00.000000Z',
      publicPublicationId: 'b'.repeat(64),
      publicWatchlistUnitId: null,
      invalid: true,
    })

    expect(readPublicRoute({
      pathname: '/watchlist',
      search: `?view=personal&publication=${'a'.repeat(64)}`,
    }, DEFAULTS).invalid).toBe(true)
    expect(readPublicRoute({
      pathname: '/following',
      search: '?view=personal',
    }, DEFAULTS).invalid).toBe(true)
  })

  it.each([
    ['/market', '?unit=item%3Aone'],
    ['/market', '?publication=not-a-sha'],
    ['/market', '?publication=' + 'a'.repeat(64) + '&scope=not-a-sha'],
    ['/market', '?as_of=not-a-time'],
    ['/market', '?view=market'],
    ['/market', '?view=sectors&view=sectors'],
    ['/trending', '?view=sectors'],
    ['/item-monitor', '?publication=not-a-sha'],
    ['/item-monitor', '?unit=item%3Aone'],
    ['/item-monitor', '?publication=' + 'a'.repeat(64) + '&unit=line%0Abreak'],
    ['/watchlist', '?view=unknown'],
    ['/following', '?publication=' + 'a'.repeat(64)],
    ['/trending', '?as_of=2026-09-06T12%3A00%3A00.000000Z'],
    ['/trending', '?as_of=2026-02-30'],
    ['/trending', '?publication=not-a-sha'],
    ['/trending', '?direction=SIDEWAYS'],
    ['/trending', '?item_kind=CASE'],
    ['/trending', '?edition_kind=NORMAL'],
    ['/trending', '?wear_tier=PRISTINE'],
    ['/trending', '?base_item_code=%20padded%20'],
    ['/trending', '?view=system'],
    ['/trending', '?unit=item%3Aone'],
  ])('fails closed for malformed formal-result route state: %s%s', (pathname, search) => {
    expect(readPublicRoute({ pathname, search }, DEFAULTS).invalid).toBe(true)
  })

  it('accepts an exact market scope token against the latest formal publication', () => {
    const token = 'b'.repeat(64)
    const route = readPublicRoute({ pathname: '/market', search: `?scope=${token}` }, DEFAULTS)
    expect(route).toMatchObject({
      surface: 'MARKET',
      publicPublicationId: null,
      marketScopeToken: token,
      invalid: false,
    })
    expect(publicRouteHref(route)).toBe(`/market?scope=${token}`)
  })

  it('addresses the market sector tab and lets a scope imply it', () => {
    const route = readPublicRoute({ pathname: '/market', search: '?lang=en&view=sectors' }, DEFAULTS)
    expect(route).toMatchObject({ surface: 'MARKET', marketView: 'SECTORS', marketScopeToken: null, invalid: false })
    expect(publicRouteHref(route)).toBe('/market?lang=en&view=sectors')
    expect(readPublicRoute({ pathname: '/market', search: '' }, DEFAULTS).marketView).toBeNull()
    const token = 'b'.repeat(64)
    const scoped = readPublicRoute({ pathname: '/market', search: `?scope=${token}&view=sectors` }, DEFAULTS)
    expect(scoped.invalid).toBe(false)
    expect(publicRouteHref(scoped)).toBe(`/market?scope=${token}`)
    expect(publicRouteHref({ ...route, surface: 'TRENDING' })).toBe('/trending?lang=en')
  })

  it('keeps bilingual search while canonicalizing a known legacy sort away', () => {
    const decoded = readPublicRoute({
      pathname: '/catalog',
      search: `?lang=en&kind=WEAPON&q=${encodeURIComponent('巨龙传说 Dragon Lore')}&sort=WEAR_ASC`,
    }, DEFAULTS)

    expect(decoded).toMatchObject({
      invalid: false,
      lang: 'en',
      browseState: {
      itemKind: 'WEAPON',
      seriesQuery: '巨龙传说 Dragon Lore',
      },
    })
    expect(decoded.browseState).not.toHaveProperty('sortOrder')
    const canonicalHref = publicRouteHref(decoded)
    expect(canonicalHref).not.toContain('sort=')
    expect(readPublicRoute(new URL(canonicalHref, 'https://example.invalid'), DEFAULTS)).toEqual(decoded)
  })

  it('preserves the exact snapshot while canonicalizing legacy pagination cursors away', () => {
    const route = readPublicRoute({
      pathname: '/catalog',
      search: `?snapshot=${'b'.repeat(64)}&kind=WEAPON&model=weapon_ak47&base=opaque.series&unit=opaque.unit&as_of=2026-09-05T12%3A00%3A00.000000Z&series_cursor=series_1&units_cursor=units_2&detail_cursor=detail_3`,
    }, DEFAULTS)
    expect(route).toMatchObject({
      invalid: false,
      catalogSnapshotId: 'b'.repeat(64),
      researchAsOf: '2026-09-05T12:00:00.000000Z',
    })
    expect(route).not.toHaveProperty('catalogSeriesCursor')
    expect(route).not.toHaveProperty('catalogUnitsCursor')
    expect(route).not.toHaveProperty('catalogDetailCursor')
    const href = publicRouteHref(route)
    expect(href).not.toMatch(/(?:series|units|detail)_cursor/u)
    expect(new URL(href, 'https://example.invalid').pathname).toBe('/research')
    expect(readPublicRoute(new URL(href, 'https://example.invalid'), DEFAULTS)).toEqual(route)
  })

  it('gives a selected subject a dedicated research URL while retaining legacy catalog deep links', () => {
    const snapshot = 'd'.repeat(64)
    const legacy = readPublicRoute({
      pathname: '/catalog',
      search: `?snapshot=${snapshot}&unit=${encodeURIComponent('item:43')}&as_of=2026-09-05T12%3A00%3A00.000000Z&kind=WEAPON&base=series.one`,
    }, DEFAULTS)
    expect(legacy).toMatchObject({
      surface: 'CATALOG',
      selectedUnitId: 'item:43',
      catalogSnapshotId: snapshot,
      researchAsOf: '2026-09-05T12:00:00.000000Z',
      invalid: false,
    })
    expect(publicRouteHref(legacy)).toBe(
      `/research?snapshot=${snapshot}&unit=item%3A43&as_of=2026-09-05T12%3A00%3A00.000000Z&kind=WEAPON&base=series.one`,
    )
    expect(readPublicRoute(
      new URL(publicRouteHref(legacy), 'https://example.invalid'),
      DEFAULTS,
    )).toEqual(legacy)
    expect(readPublicRoute({ pathname: '/research', search: '' }, DEFAULTS).invalid).toBe(true)
    expect(readPublicRoute({ pathname: '/catalog', search: '?as_of=2026-09-05T12%3A00%3A00.000000Z' }, DEFAULTS).invalid).toBe(true)
  })

  it.each([
    '?snapshot=ABC',
    `?snapshot=${'b'.repeat(64)}&snapshot=${'c'.repeat(64)}`,
    '?series_cursor=cursor_without_model',
    '?kind=WEAPON&model=weapon_ak47&series_cursor=cursor_without_snapshot',
    '?kind=WEAPON&model=weapon_ak47&units_cursor=cursor_without_base',
    '?detail_cursor=cursor_without_unit',
    '?unit=item%3A43&as_of=not-a-time',
    '?kind=WEAPON&model=weapon_ak47&series_cursor=bad%2Bpadding',
    `?kind=WEAPON&model=weapon_ak47&series_cursor=${'x'.repeat(513)}`,
  ])('fails closed for an unbound or malformed snapshot/cursor URL: %s', (search) => {
    expect(readPublicRoute({ pathname: '/catalog', search }, DEFAULTS).invalid).toBe(true)
  })

  it.each([
    '?q=one&q=two',
    `?q=${'x'.repeat(129)}`,
    '?q=line%0Abreak',
    '?sort=UNTRUSTED',
    '?sort=NAME_ASC&sort=WEAR_ASC',
  ])('fails closed for unsafe discovery query %s', (search) => {
    expect(readPublicRoute({ pathname: '/catalog', search }, DEFAULTS).invalid).toBe(true)
  })

  it('counts search limits as Unicode scalar values instead of UTF-16 code units', () => {
    const accepted = '🗡'.repeat(128)
    const route = readPublicRoute({
      pathname: '/catalog',
      search: `?q=${encodeURIComponent(accepted)}`,
    }, DEFAULTS)
    expect(route.invalid).toBe(false)
    expect(route.browseState.seriesQuery).toBe(accepted)
    expect(readPublicRoute({
      pathname: '/catalog',
      search: `?q=${encodeURIComponent(`${accepted}🗡`)}`,
    }, DEFAULTS).invalid).toBe(true)
  })

  it('omits empty search from the canonical fixed-order URL', () => {
    const state = readPublicRoute({ pathname: '/catalog', search: '' }, DEFAULTS)
    expect(publicRouteHref(state)).toBe('/catalog')
  })

  it('round-trips all 200 rarity/category/wear combinations, independent of language/model and inner wear', () => {
    for (const rarity of catalogRarities) for (const category of catalogItemCategories) for (const wearTier of catalogWearTiers) {
      const search = `?lang=en&kind=WEAPON&model=all:RIFLES&base=opaque.series&unit=opaque.unit&edition=STATTRAK&wear=FIELD_TESTED&rarity=${rarity.id}&category=${category.id}&wear_tier=${wearTier.id}`
      const route = readPublicRoute({ pathname: '/catalog', search }, DEFAULTS)
      expect(route.invalid).toBe(false)
      expect(route.browseState).toMatchObject({ rarity: rarity.id, itemCategory: category.id, wearTier: wearTier.id, selectedEditions: ['STATTRAK'], selectedWears: ['FIELD_TESTED'] })
      const decoded = readPublicRoute(new URL(publicRouteHref(route), 'https://example.invalid'), DEFAULTS)
      expect(decoded).toEqual(route)
    }
    expect(readPublicRoute({ pathname: '/catalog', search: '?rarity=COVERT&category=STAR&wear_tier=FIELD_TESTED' }, DEFAULTS)).toMatchObject({ invalid: false, browseState: { itemKind: null, rarity: 'COVERT', itemCategory: 'STAR', wearTier: 'FIELD_TESTED' } })
    const legacy = readPublicRoute({ pathname: '/catalog', search: '?kind=WEAPON' }, DEFAULTS)
    expect(legacy.browseState).toMatchObject({ rarity: null, itemCategory: null, wearTier: null })
    expect(publicRouteHref(legacy)).toBe('/catalog?kind=WEAPON')
  })

  it.each(['?rarity=UNKNOWN', '?rarity=', '?rarity=COVERT&rarity=CONSUMER', '?category=UNKNOWN', '?category=STAR&category=NORMAL', '?category=', '?wear_tier=UNKNOWN', '?wear_tier=', '?wear_tier=FIELD_TESTED&wear_tier=FACTORY_NEW', '?rarity=unsafe%0Avalue'])(
    'fails closed for unknown, duplicate or malformed catalog facets: %s', (search) => {
      expect(readPublicRoute({ pathname: '/catalog', search }, DEFAULTS).invalid).toBe(true)
    },
  )

  it('keeps the global wear facet distinct from the existing per-series wear selection', () => {
    const route = readPublicRoute({
      pathname: '/catalog',
      search: '?kind=WEAPON&base=opaque&wear_tier=FACTORY_NEW&wear=FIELD_TESTED',
    }, DEFAULTS)
    expect(route).toMatchObject({
      invalid: false,
      browseState: { wearTier: 'FACTORY_NEW', selectedWears: ['FIELD_TESTED'] },
    })
    expect(publicRouteHref(route)).toBe('/catalog?kind=WEAPON&wear_tier=FACTORY_NEW&base=opaque&wear=FIELD_TESTED')
  })

  it.each(['weapon_famas', 'weapon_taser', 'all:PISTOLS', 'all:MID_TIER', 'all:RIFLES'])(
    'round-trips a weapon model/category selection without guessing a series identity: %s', (model) => {
      const route = readPublicRoute({ pathname: '/catalog', search: `?kind=WEAPON&model=${encodeURIComponent(model)}` }, DEFAULTS)
      expect(route.invalid).toBe(false)
      expect(route.browseState.equipmentModel).toBe(model)
      const href = new URL(publicRouteHref(route), 'https://example.invalid')
      expect(readPublicRoute(href, DEFAULTS)).toEqual(route)
    },
  )

  it.each([
    '?kind=WEAPON&model=weapon_knife_karambit',
    '?kind=GLOVE&model=all:KNIVES',
    '?kind=WEAPON&model=weapon_famas&model=weapon_awp',
    '?kind=WEAPON&model=unregistered_weapon',
    '?model=weapon_famas',
  ])('rejects conflicting, unknown or duplicate model state: %s', (search) => {
    expect(readPublicRoute({ pathname: '/catalog', search }, DEFAULTS).invalid).toBe(true)
  })
})
