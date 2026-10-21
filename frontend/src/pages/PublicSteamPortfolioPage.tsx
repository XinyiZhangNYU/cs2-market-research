import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { catalogMediaRoute } from '../adapter/catalogDisplayViewModel'
import { CatalogDisplayApi, type CatalogDisplayGateway } from '../api/CatalogDisplayApi'
import { CatalogDisplayTransportError } from '../api/HttpCatalogDisplayGateway'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { bindItemImageUrl, ITEM_IMAGE_NOT_PRODUCED, type ItemImageSource } from '../contract/itemImage'
import { useLang } from '../i18n'
import { t, tf } from '../i18n/strings'
import { parseSteamAccountInput } from '../steam/steamAccount'
import { SteamPortfolioClient, SteamPortfolioReadError } from '../steam/steamPortfolioClient'
import {
  LocalSteamPortfolioStorage,
  type SavedSteamPortfolio,
  type SteamPortfolioStorage,
} from '../steam/steamPortfolioStorage'
import {
  parsePersonalWatchTarget,
  personalWatchTargetKey,
  personalWatchlistImage,
  type PersonalWatchItemTarget,
  type PersonalWatchTargetCandidate,
  type PersonalWatchlistController,
} from '../watchlist/personalWatchlist'
import type { SteamPortfolioCatalogMember } from '../wire/steamPortfolioApiTypes'

type ProblemCode =
  | 'EMPTY'
  | 'INVALID'
  | 'VANITY'
  | 'PRIVATE'
  | 'NOT_FOUND'
  | 'STEAM_UNAVAILABLE'
  | 'CATALOG_UNAVAILABLE'
  | 'TRANSPORT'
  | 'VALIDATION'

type PageState =
  | Readonly<{ status: 'IDLE' }>
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'PROBLEM'; code: ProblemCode }>
  | Readonly<{ status: 'READY'; inventory: SavedSteamPortfolio }>

function problemFromError(error: unknown): ProblemCode {
  if (error instanceof CatalogDisplayTransportError) return 'CATALOG_UNAVAILABLE'
  if (!(error instanceof SteamPortfolioReadError)) return 'TRANSPORT'
  if (error.code === 'PRIVATE') return 'PRIVATE'
  if (error.code === 'NOT_FOUND') return 'NOT_FOUND'
  if (error.code === 'INVALID_ARGUMENT') return 'INVALID'
  if (error.code === 'STEAM_UNAVAILABLE') return 'STEAM_UNAVAILABLE'
  if (
    error.code === 'CONTRACT_UNAVAILABLE' ||
    error.code === 'RECORD_CORRUPT' ||
    error.code === 'BACKEND_UNAVAILABLE'
  ) {
    return 'CATALOG_UNAVAILABLE'
  }
  if (error.code === 'VALIDATION') return 'VALIDATION'
  return 'TRANSPORT'
}

function memberImage(member: SteamPortfolioCatalogMember): ItemImageSource {
  if (member.media.status !== 'BOUND') return ITEM_IMAGE_NOT_PRODUCED
  const version = member.version_context.media_asset_version_id
  if (version === null) return ITEM_IMAGE_NOT_PRODUCED
  return bindItemImageUrl(catalogMediaRoute(member.media.media_key, version))
}

function savedTarget(
  member: SteamPortfolioCatalogMember,
  snapshot: Readonly<{ snapshot_id: string; as_of: string; available_at: string }>,
  savedAt: string,
): PersonalWatchItemTarget {
  const source = memberImage(member)
  return parsePersonalWatchTarget({
    schema_version: 3,
    target_kind: 'ITEM',
    target_id: member.analysis_unit_id,
    target_key: personalWatchTargetKey('ITEM', member.analysis_unit_id),
    parent_target_key: null,
    added_at: savedAt,
    localized_name: {
      zh: member.localized_name.zh_cn,
      en: member.localized_name.en,
    },
    catalog: {
      snapshot_id: snapshot.snapshot_id,
      as_of: snapshot.as_of,
      available_at: snapshot.available_at,
    },
    identity: {
      item_kind: member.item_kind,
      base_item_code: member.base_item_code,
      edition_kind: member.edition_kind,
      wear_tier: member.wear_tier,
    },
    image: source.status === 'BOUND'
      ? { status: 'BOUND', src: source.src }
      : { status: 'NOT_PRODUCED' },
  }) as PersonalWatchItemTarget
}

function targetCandidate(target: PersonalWatchItemTarget): PersonalWatchTargetCandidate {
  return {
    target_kind: target.target_kind,
    target_id: target.target_id,
    target_key: target.target_key,
    parent_target_key: target.parent_target_key,
    localized_name: target.localized_name,
    catalog: target.catalog,
    identity: target.identity,
    image: target.image,
  }
}

const PROBLEM_TITLE: Readonly<Record<ProblemCode, 'publicPortfolioInvalidTitle' | 'publicPortfolioVanityTitle' | 'publicPortfolioPrivateTitle' | 'publicPortfolioNotFoundTitle' | 'publicPortfolioSteamUnavailableTitle' | 'publicPortfolioCatalogUnavailableTitle' | 'publicPortfolioTransportTitle'>> = {
  EMPTY: 'publicPortfolioInvalidTitle',
  INVALID: 'publicPortfolioInvalidTitle',
  VANITY: 'publicPortfolioVanityTitle',
  PRIVATE: 'publicPortfolioPrivateTitle',
  NOT_FOUND: 'publicPortfolioNotFoundTitle',
  STEAM_UNAVAILABLE: 'publicPortfolioSteamUnavailableTitle',
  CATALOG_UNAVAILABLE: 'publicPortfolioCatalogUnavailableTitle',
  TRANSPORT: 'publicPortfolioTransportTitle',
  VALIDATION: 'publicPortfolioTransportTitle',
}

const PROBLEM_NOTE: Readonly<Record<ProblemCode, 'publicPortfolioInvalidNote' | 'publicPortfolioVanityNote' | 'publicPortfolioPrivateNote' | 'publicPortfolioNotFoundNote' | 'publicPortfolioSteamUnavailableNote' | 'publicPortfolioCatalogUnavailableNote' | 'publicPortfolioTransportNote'>> = {
  EMPTY: 'publicPortfolioInvalidNote',
  INVALID: 'publicPortfolioInvalidNote',
  VANITY: 'publicPortfolioVanityNote',
  PRIVATE: 'publicPortfolioPrivateNote',
  NOT_FOUND: 'publicPortfolioNotFoundNote',
  STEAM_UNAVAILABLE: 'publicPortfolioSteamUnavailableNote',
  CATALOG_UNAVAILABLE: 'publicPortfolioCatalogUnavailableNote',
  TRANSPORT: 'publicPortfolioTransportNote',
  VALIDATION: 'publicPortfolioTransportNote',
}

export function PublicSteamPortfolioPage({
  catalogGateway,
  queryInstant,
  catalogHref,
  followingHref,
  watchlist,
  now = () => new Date(),
  portfolioStorage,
  onCatalogClick,
  onFollowingClick,
  onOpenCatalog,
}: {
  catalogGateway: CatalogDisplayGateway
  queryInstant: string
  catalogHref: string
  followingHref: string
  watchlist: PersonalWatchlistController
  now?: () => Date
  portfolioStorage?: SteamPortfolioStorage
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onFollowingClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onOpenCatalog: (analysisUnitId: string) => void
}) {
  const lang = useLang()
  const catalogApi = useMemo(() => new CatalogDisplayApi(catalogGateway), [catalogGateway])
  const portfolioApi = useMemo(() => new SteamPortfolioClient(), [])
  const localStorage = useMemo(
    () => portfolioStorage ?? new LocalSteamPortfolioStorage(),
    [portfolioStorage],
  )
  const restored = useMemo(() => {
    try {
      return { inventory: localStorage.read(), failed: false }
    } catch {
      return { inventory: null, failed: true }
    }
  }, [localStorage])
  const [input, setInput] = useState(restored.inventory?.steamid ?? '')
  const [state, setState] = useState<PageState>(
    restored.inventory === null
      ? { status: 'IDLE' }
      : { status: 'READY', inventory: restored.inventory },
  )
  const [storageFailed, setStorageFailed] = useState(restored.failed)
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const activeRequest = useRef<AbortController | null>(null)
  const cancelRequest = () => {
    activeRequest.current?.abort()
    activeRequest.current = null
  }
  useEffect(() => () => {
    activeRequest.current?.abort()
    activeRequest.current = null
  }, [catalogApi, localStorage, queryInstant])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    cancelRequest()
    const parsed = parseSteamAccountInput(input)
    if (!parsed.ok) {
      setState({ status: 'PROBLEM', code: parsed.code })
      return
    }
    const controller = new AbortController()
    activeRequest.current = controller
    const isCurrent = () => activeRequest.current === controller && !controller.signal.aborted
    setState({ status: 'LOADING' })
    setImportMessage(null)
    void (async () => {
      try {
        const inventory = await portfolioApi.loadInventory(parsed.steamid, { signal: controller.signal })
        if (!isCurrent()) return
        const snapshotResponse = await catalogApi.listSnapshots(
          {
            query: {
              query_as_of: queryInstant,
              known_at: queryInstant,
              sort: 'AS_OF_DESC',
              page_size: 1,
            },
            cursor: null,
          },
          { signal: controller.signal },
        )
        if (!isCurrent()) return
        if (snapshotResponse.response_kind !== 'CATALOG_DISPLAY_SNAPSHOT_LIST' || snapshotResponse.members[0] === undefined) {
          setState({ status: 'PROBLEM', code: 'CATALOG_UNAVAILABLE' })
          return
        }
        const snapshot = snapshotResponse.members[0]
        const names = inventory.stacks.map((stack) => stack.market_hash_name)
        const hits = names.length === 0
          ? { hits: [] as const }
          : await portfolioApi.loadCatalogHits(snapshot.snapshot_id, names, { signal: controller.signal })
        if (!isCurrent()) return
        const byName = new Map(hits.hits.map((hit) => [hit.market_hash_name, hit]))
        const savedAt = now().toISOString()
        const rows = new Map<string, SavedSteamPortfolio['rows'][number]>()
        let unsupported = 0
        for (const stack of inventory.stacks) {
          const hit = byName.get(stack.market_hash_name)
          if (hit === undefined || hit.status !== 'UNIQUE' || hit.member === null) {
            unsupported += 1
            continue
          }
          const target = savedTarget(hit.member, snapshot, savedAt)
          const existing = rows.get(target.target_key)
          rows.set(target.target_key, {
            quantity: (existing?.quantity ?? 0) + stack.quantity,
            target,
          })
        }
        const saved: SavedSteamPortfolio = {
          schema_version: 1,
          saved_at: savedAt,
          steamid: inventory.steamid,
          truncated: inventory.truncated,
          skipped_unnamed: inventory.skipped_unnamed,
          unsupported,
          rows: [...rows.values()],
        }
        try {
          localStorage.write(saved)
          setStorageFailed(false)
        } catch {
          setStorageFailed(true)
        }
        setState({ status: 'READY', inventory: saved })
      } catch (error) {
        if (!isCurrent()) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({ status: 'PROBLEM', code: problemFromError(error) })
      }
    })()
  }

  const importInventory = () => {
    if (state.status !== 'READY' || importing) return
    setImporting(true)
    setImportMessage(null)
    void watchlist.addMany(state.inventory.rows.map((row) => targetCandidate(row.target))).then(
      (count) => {
        setImportMessage(tf(
          count === 0 ? 'publicPortfolioImportAlreadyDone' : 'publicPortfolioImportSuccess',
          lang,
          { count },
        ))
      },
      () => setImportMessage(t('publicPortfolioImportFailed', lang)),
    ).finally(() => setImporting(false))
  }

  const clearSavedInventory = () => {
    cancelRequest()
    try {
      localStorage.clear()
      setStorageFailed(false)
      setInput('')
      setState({ status: 'IDLE' })
      setImportMessage(null)
    } catch {
      setStorageFailed(true)
    }
  }

  const inventory = state.status === 'READY' ? state.inventory : null
  const totalQuantity = inventory?.rows.reduce((total, row) => total + row.quantity, 0) ?? 0

  return (
    <section className="steam-portfolio" aria-labelledby="steam-portfolio-title" data-testid="steam-portfolio-page">
      <header className="steam-portfolio__hero">
        <div>
          <p>{t('publicPortfolioEyebrow', lang)}</p>
          <h1 id="steam-portfolio-title">{t('publicPortfolioTitle', lang)}</h1>
          <p>{t('publicPortfolioIntro', lang)}</p>
        </div>
        <aside>
          <strong>{t('publicPortfolioAsideLabel', lang)}</strong>
          <span>{t('publicPortfolioAsideNote', lang)}</span>
        </aside>
      </header>

      <form className="steam-portfolio__reader" onSubmit={onSubmit}>
        <label>
          <span>{t('publicPortfolioInputLabel', lang)}</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('publicPortfolioInputPlaceholder', lang)}
            autoComplete="off"
            spellCheck={false}
            data-testid="steam-portfolio-input"
          />
        </label>
        <button type="submit" data-testid="steam-portfolio-submit">
          {t('publicPortfolioSubmit', lang)}
        </button>
      </form>

      <p className={`steam-portfolio__local-note${storageFailed ? ' is-warning' : ''}`} role="status">
        {t(storageFailed ? 'publicPortfolioStorageFailed' : 'publicPortfolioLocalNote', lang)}
      </p>

      {state.status === 'LOADING' ? (
        <div className="steam-portfolio__loading" role="status">
          <span aria-hidden="true" />
          <p>{t('publicPortfolioLoading', lang)}</p>
        </div>
      ) : null}

      {state.status === 'PROBLEM' ? (
        <div className="steam-portfolio__problem" role="alert" data-testid="steam-portfolio-problem">
          <h2>{t(PROBLEM_TITLE[state.code], lang)}</h2>
          <p>{t(PROBLEM_NOTE[state.code], lang)}</p>
        </div>
      ) : null}

      {inventory ? (
        <section className="steam-portfolio__result" data-testid="steam-portfolio-result">
          <header className="steam-portfolio__result-header">
            <div>
              <p>{t('publicPortfolioSavedLabel', lang)}</p>
              <h2>{tf('publicPortfolioSavedSummary', lang, {
                kinds: inventory.rows.length,
                count: totalQuantity,
              })}</h2>
              <span>{inventory.steamid}</span>
            </div>
            <div className="steam-portfolio__actions">
              <button
                type="button"
                onClick={importInventory}
                disabled={importing || watchlist.status !== 'READY' || inventory.rows.length === 0}
                data-testid="steam-portfolio-import-watchlist"
              >
                {t(importing ? 'publicPortfolioImporting' : 'publicPortfolioImportWatchlist', lang)}
              </button>
              <a href={followingHref} onClick={onFollowingClick}>
                {t('publicPortfolioOpenWatchlist', lang)}
              </a>
              <button type="button" className="steam-portfolio__clear" onClick={clearSavedInventory}>
                {t('publicPortfolioClearSaved', lang)}
              </button>
            </div>
          </header>

          {importMessage ? <p className="steam-portfolio__message" role="status">{importMessage}</p> : null}
          {inventory.truncated ? <p className="steam-portfolio__notice">{t('publicPortfolioTruncated', lang)}</p> : null}
          {inventory.unsupported + inventory.skipped_unnamed > 0 ? (
            <p className="steam-portfolio__notice">
              {tf('publicPortfolioUnsupportedNote', lang, {
                count: inventory.unsupported + inventory.skipped_unnamed,
              })}
            </p>
          ) : null}
          {inventory.rows.length === 0 ? (
            <p className="steam-portfolio__empty">{t('publicPortfolioEmpty', lang)}</p>
          ) : (
            <ul className="steam-portfolio__items">
              {inventory.rows.map((row) => {
                const name = lang === 'zh' ? row.target.localized_name.zh : row.target.localized_name.en
                return (
                  <li key={row.target.target_key}>
                    <ItemImageSlot
                      source={personalWatchlistImage(row.target)}
                      label={name}
                      variant="thumbnail"
                      presentation="PRODUCT"
                      testId={`steam-portfolio-image-${row.target.target_id}`}
                    />
                    <div>
                      <strong>{name}</strong>
                      <span>{tf('publicPortfolioQuantity', lang, { count: row.quantity })}</span>
                      <a
                        href={catalogHref}
                        onClick={(event) => {
                          event.preventDefault()
                          onOpenCatalog(row.target.target_id)
                        }}
                      >
                        {t('publicPortfolioOpenCatalog', lang)}
                      </a>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      <a className="steam-portfolio__catalog-link" href={catalogHref} onClick={onCatalogClick}>
        {t('publicPortfolioBackCatalog', lang)}
      </a>
    </section>
  )
}
