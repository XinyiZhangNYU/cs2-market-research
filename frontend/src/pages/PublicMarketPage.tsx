import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react'
import {
  MarketDescriptivePublicApi,
  type MarketDescriptivePublicGateway,
} from '../api/MarketDescriptivePublicApi'
import { useLang, type Lang } from '../i18n'
import { t, type StringKey } from '../i18n/strings'
import { PersonalWatchlistToggle } from '../components/PersonalWatchlistToggle'
import { MarketSectorIndexHistory } from '../components/MarketSectorIndexHistory'
import { EquipmentModelImage } from '../components/EquipmentModelImage'
import { marketSubsectorIllustrationModel } from '../catalog/sectorIllustrations'
import type {
  MarketSectorIndexPublicApi,
  MarketSectorIndexPublicGateway,
} from '../api/MarketSectorIndexPublicApi'
import { HttpMarketSectorIndexPublicGateway } from '../api/HttpMarketSectorIndexPublicGateway'
import type { CatalogDisplayGateway } from '../api/CatalogDisplayApi'
import type { PersonalWatchlistController } from '../watchlist/personalWatchlist'
import { marketScopeWatchCandidate } from '../watchlist/watchTargetRegistry'
import { MarketDescriptiveValidationError } from '../wire/marketDescriptivePublicApiDecode'
import type {
  MarketDescriptiveCoverageGrade,
  MarketDescriptiveDocument,
  MarketDescriptiveErrorCode,
  MarketDescriptiveFreshnessStatus,
  MarketDescriptiveHistory,
  MarketDescriptiveQualityStatus,
  MarketDescriptiveReturnMethod,
  MarketDescriptiveScope,
  MarketDescriptiveSuccess,
} from '../wire/marketDescriptivePublicApiTypes'
import { formatPublicInstant, formatPublicRatio, PublicResultLoading } from './publicResultShared'
import { indexMethodVariant, marketT, METHOD_NOTE_COPY, type MarketStringKey } from './publicMarketCopy'
import type { MarketBoardView } from './publicMarketIndexChart'
import { formatLocalizedCurrencyFromCny } from '../price/localizedCurrency'

type MarketProblemCode = MarketDescriptiveErrorCode | 'TRANSPORT' | 'VALIDATION'
type MarketState =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'READY'; document: MarketDescriptiveSuccess }>
  | Readonly<{ status: 'PROBLEM'; code: MarketProblemCode }>

type MarketRequestCache = Map<string, Promise<MarketDescriptiveDocument>>

function cachedMarketRequest(
  cache: MarketRequestCache,
  key: string,
  load: () => Promise<MarketDescriptiveDocument>,
): Promise<MarketDescriptiveDocument> {
  const existing = cache.get(key)
  if (existing !== undefined) return existing
  const request = load().then((document) => {
    if (document.response_kind === 'ERROR') cache.delete(key)
    return document
  }).catch((error: unknown) => {
    cache.delete(key)
    throw error
  })
  cache.set(key, request)
  return request
}

function resolveScopeContext(overview: MarketDescriptiveSuccess, scopeToken: string) {
  const current = overview.scopes.find((scope) => scope.scope_token === scopeToken)
  if (current !== undefined) {
    return {
      publicationId: overview.publication.publication_id,
      scope: current,
      scopes: overview.scopes,
    } as const
  }
  for (const history of overview.history) {
    const scope = history.scopes.find((candidate) => candidate.scope_token === scopeToken)
    if (scope !== undefined) {
      return {
        publicationId: history.publication_id,
        scope,
        scopes: history.scopes,
      } as const
    }
  }
  return null
}

const PROBLEM_COPY = Object.freeze({
  INVALID_REQUEST: ['publicResultNotFoundTitle', 'publicResultNotFoundNote'],
  NOT_PUBLISHED: ['publicResultNotPublishedTitle', 'publicResultNotPublishedNote'],
  NOT_FOUND: ['publicResultNotFoundTitle', 'publicResultNotFoundNote'],
  WITHDRAWN: ['publicResultWithdrawnTitle', 'publicResultWithdrawnNote'],
  STALE_EXPIRED: ['publicResultExpiredTitle', 'publicResultExpiredNote'],
  CORRUPT_PUBLICATION: ['publicResultCorruptTitle', 'publicResultCorruptNote'],
  TEMPORARILY_UNAVAILABLE: ['publicResultTemporaryTitle', 'publicResultTemporaryNote'],
  TRANSPORT: ['publicResultTemporaryTitle', 'publicResultTemporaryNote'],
  VALIDATION: ['publicResultCorruptTitle', 'publicResultCorruptNote'],
} satisfies Record<MarketProblemCode, readonly [StringKey, StringKey]>)

const COVERAGE_COPY = Object.freeze({
  HIGH: 'coverageHigh',
  PARTIAL: 'coveragePartial',
  DETAIL_ONLY: 'coverageDetailOnly',
} satisfies Record<MarketDescriptiveCoverageGrade, MarketStringKey>)

const QUALITY_COPY = Object.freeze({
  AVAILABLE: 'qualityAvailable',
  NO_PUBLISHED_DAY: 'qualityNoPublishedDay',
  UNAVAILABLE: 'qualityUnavailable',
  BASELINE_ONLY: 'qualityBaselineOnly',
} satisfies Record<MarketDescriptiveQualityStatus, MarketStringKey>)

const FRESHNESS_COPY = Object.freeze({
  CURRENT: 'freshCurrent',
  HISTORICAL_VALUE_DISPLAY_ONLY: 'freshHistorical',
  NO_RECENT_STATISTIC: 'freshNoRecent',
} satisfies Record<MarketDescriptiveFreshnessStatus, MarketStringKey>)

const METHOD_COPY = Object.freeze({
  RAW_EQUAL_MEMBER_RETURN: 'methodRaw',
  SYMMETRIC_WINSOR_1_PERCENT: 'methodSuppressed',
} satisfies Record<MarketDescriptiveReturnMethod, MarketStringKey>)

function failureCode(error: unknown): MarketProblemCode {
  return error instanceof MarketDescriptiveValidationError ? 'VALIDATION' : 'TRANSPORT'
}

function scopeLabel(scope: MarketDescriptiveScope, lang: Lang): string {
  return lang === 'zh' ? scope.labels.zh_cn : scope.labels.en
}

function formatDay(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(parsed.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(parsed)
}

function MarketProblem({
  code, onRetry, catalogHref, onCatalogClick,
}: {
  code: MarketProblemCode
  onRetry: () => void
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const [title, note] = PROBLEM_COPY[code]
  return (
    <section className="public-result-message public-result-message--problem" role="status" data-error-code={code}>
      <p className="public-result-message__eyebrow">MARKET DATA</p>
      <h2>{t(title, lang)}</h2>
      <p>{t(note, lang)}</p>
      <div className="public-result-message__actions">
        <button type="button" onClick={onRetry}>{t('publicResultRetry', lang)}</button>
        <a href={catalogHref} onClick={onCatalogClick}>{t('publicResultBackCatalog', lang)}</a>
      </div>
    </section>
  )
}

function ScopeFacts({ scope }: { scope: MarketDescriptiveScope }) {
  const lang = useLang()
  return (
    <dl className="public-market__facts">
      <div><dt>{marketT('selectedReturn', lang)}</dt><dd>{formatPublicRatio(scope.return_selected_for_display, lang)}</dd></div>
      <div><dt>{marketT('pairedCoverage', lang)}</dt><dd>{formatPublicRatio(scope.paired_coverage_ratio, lang)}</dd></div>
      <div><dt>{marketT('members', lang)}</dt><dd>{scope.paired_member_count} / {scope.fixed_member_count}</dd></div>
      <div><dt>{marketT('coverageGrade', lang)}</dt><dd>{marketT(COVERAGE_COPY[scope.coverage_grade], lang)}</dd></div>
    </dl>
  )
}

function HistoryList({
  history, onSelectPublication,
}: {
  history: readonly MarketDescriptiveHistory[]
  onSelectPublication: (publicationId: string | null) => void
}) {
  const lang = useLang()
  if (history.length === 0) return <p>{t('publicResultHistoryEmpty', lang)}</p>
  return (
    <ol>
      {history.map((entry) => {
        const scope = entry.scopes.find((candidate) => candidate.scope_id === 'ALL') ?? entry.scopes[0]
        return (
          <li key={entry.publication_id}>
            <button type="button" onClick={() => onSelectPublication(entry.publication_id)}>
              <time dateTime={entry.day_pair.to_date}>{formatDay(entry.day_pair.to_date, lang)}</time>
              <strong>{scope ? scopeLabel(scope, lang) : '—'}</strong>
              <span>{scope ? formatPublicRatio(scope.return_selected_for_display, lang) : '—'}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function MarketResult({
  document, relatedScopes, scopeToken, onOpenScope, onCloseScope, onSelectPublication, personalWatchlist,
  scopeOverride = null, scopePublicationId = null, pending = false, cnyPerUsd = null,
}: {
  document: MarketDescriptiveSuccess
  relatedScopes: readonly MarketDescriptiveScope[]
  scopeToken: string | null
  onOpenScope: (scopeToken: string, publicationId: string) => void
  onCloseScope: () => void
  onSelectPublication: (publicationId: string | null) => void
  personalWatchlist: PersonalWatchlistController
  scopeOverride?: MarketDescriptiveScope | null
  scopePublicationId?: string | null
  pending?: boolean
  cnyPerUsd?: string | null
}) {
  const lang = useLang()
  const detail = document.operation === 'SCOPE' || scopeOverride !== null
  const primaryScope = scopeOverride ?? document.headline?.scope ?? document.scopes[0] ?? null
  const childScopes = primaryScope === null ? [] : relatedScopes.filter(
    (scope) => scope.scope_kind === 'SUBSECTOR' && scope.parent_scope_id === primaryScope.scope_id,
  )

  return (
    <div className="public-market__result" aria-busy={pending} data-scope-pending={pending ? 'true' : 'false'}>
      <div className="public-result-publication public-market__publication" data-testid="public-result-publication">
        <div>
          <span>{marketT('dataDate', lang)}</span>
          <time dateTime={document.day_pair?.to_date ?? document.current_day_quality.date}>
            {formatDay(document.day_pair?.to_date ?? document.current_day_quality.date, lang)}
          </time>
        </div>
        <div>
          <span>{document.publication.clock_disclosure ? marketT('publicationClockLowerBound', lang) : t('publicResultPublishedAt', lang)}</span>
          {document.publication.clock_disclosure ? (
            <><time dateTime={document.publication.clock_disclosure.known_not_before_at}>{formatPublicInstant(document.publication.clock_disclosure.known_not_before_at, lang)}</time><small>{marketT('publicationClockUnknown', lang)}</small></>
          ) : document.publication.published_at === null ? '—' : <time dateTime={document.publication.published_at}>{formatPublicInstant(document.publication.published_at, lang)}</time>}
        </div>
        <div>
          <span>{marketT('expectedDate', lang)}</span>
          {document.freshness.expected_latest_complete_date === null ? '—' : <time dateTime={document.freshness.expected_latest_complete_date}>{formatDay(document.freshness.expected_latest_complete_date, lang)}</time>}
        </div>
        <strong className={document.freshness.status === 'CURRENT' ? 'is-fresh' : 'is-stale'}>
          {document.freshness.status === null ? '—' : marketT(FRESHNESS_COPY[document.freshness.status], lang)}
        </strong>
        {document.freshness.status !== null && document.freshness.status !== 'CURRENT' ? <p>{marketT('historicalWarning', lang)}</p> : null}
      </div>

      {document.response_kind === 'EMPTY' || primaryScope === null ? (
        <section className="public-market__empty" role="status">
          <h2>{marketT('emptyTitle', lang)}</h2>
          <p>{marketT('emptyNote', lang)}</p>
        </section>
      ) : (
        <>
          <section className="public-market__summary" aria-labelledby="public-market-summary-title">
            <div>
              <p>{detail ? marketT('scopeDetail', lang) : t('publicMarketSummary', lang)}</p>
              <div className="public-market__summary-title">
                <h2 id="public-market-summary-title">{scopeLabel(primaryScope, lang)}</h2>
                <PersonalWatchlistToggle
                  controller={personalWatchlist}
                  candidate={marketScopeWatchCandidate(primaryScope)}
                  presentation="ICON"
                />
              </div>
              <strong>{formatPublicRatio(primaryScope.return_selected_for_display, lang)}</strong>
              <span>{primaryScope.return_method === null ? '—' : marketT(METHOD_COPY[primaryScope.return_method], lang)}</span>
            </div>
            <ScopeFacts scope={primaryScope} />
            <p className="public-market__method-note">{marketT(METHOD_NOTE_COPY[indexMethodVariant(document.native_cny === true, document.native_method)], lang)}</p>
            {detail || scopeToken !== null ? <button type="button" onClick={onCloseScope}>{marketT('backOverview', lang)}</button> : null}
          </section>

          {detail && childScopes.length > 0 ? (
            <section className="public-market__scopes" aria-labelledby="public-market-scopes-title">
              <div className="public-result-section-heading public-market__scope-heading">
                <div>
                  <p>SUBSECTORS</p>
                  <h2 id="public-market-scopes-title">
                    {scopeLabel(primaryScope, lang)}{marketT('subsectorComparisonSuffix', lang)}
                  </h2>
                </div>
                <strong>{childScopes.length}</strong>
              </div>
              <div className="public-market__scope-grid">
                {childScopes.map((scope) => (
                  <ScopeCard
                    key={scope.scope_token}
                    scope={scope}
                    publicationId={scopePublicationId ?? document.publication.publication_id}
                    onOpenScope={onOpenScope}
                    personalWatchlist={personalWatchlist}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {pending ? (
            <p className="public-market__scope-loading" role="status">{marketT('scopeLoading', lang)}</p>
          ) : null}

          <section className="public-market__quality" aria-labelledby="public-market-quality-title">
            <div className="public-result-section-heading">
              <p>DATA QUALITY</p>
              <h2 id="public-market-quality-title">{marketT('qualityTitle', lang)}</h2>
            </div>
            <dl>
              <div><dt>{marketT('currentQuality', lang)}</dt><dd>{marketT(QUALITY_COPY[document.current_day_quality.status], lang)}</dd></div>
              {/* Native CNY scopes carry no raw/winsorized equal-weight returns (always —): not shown. */}
              {document.native_cny ? null : <>
                <div><dt>{marketT('rawReturn', lang)}</dt><dd>{formatPublicRatio(primaryScope.raw_return_ratio, lang)}</dd></div>
                <div><dt>{marketT('suppressedReturn', lang)}</dt><dd>{formatPublicRatio(primaryScope.suppressed_return_ratio, lang)}</dd></div>
              </>}
              <div><dt>{marketT('dayCoverage', lang)}</dt><dd>{formatPublicRatio(primaryScope.day_price_coverage_ratio, lang)}</dd></div>
              <div><dt>{marketT('memberPriceSum', lang)}</dt><dd>{formatLocalizedCurrencyFromCny(primaryScope.member_price_sum_cny, lang, cnyPerUsd)}</dd></div>
              <div><dt>{marketT('missingMembers', lang)}</dt><dd>{primaryScope.fixed_member_count - primaryScope.paired_member_count}</dd></div>
            </dl>
            {!document.native_cny ? <p>{marketT('priceSumNote', lang)}</p> : null}
            <ul>
              <li>{marketT('missingEndpoint', lang)}: {primaryScope.missing_endpoint_count ?? '—'}</li>
              <li>{marketT('sourceBreak', lang)}: {primaryScope.source_set_break_count ?? '—'}</li>
              <li>{marketT('singleSource', lang)}: {primaryScope.single_source_pair_count ?? '—'}</li>
              <li>{marketT('unmapped', lang)}: {primaryScope.unmapped_member_count ?? '—'}</li>
            </ul>
          </section>

        </>
      )}

      {!pending && !document.native_cny ? <section className="public-result-history" aria-labelledby="public-market-history-title">
        <div className="public-result-section-heading">
          <p>HISTORY</p>
          <h2 id="public-market-history-title">{t('publicMarketHistoryTitle', lang)}</h2>
        </div>
        <div className="public-result-history__body">
          <HistoryList history={document.history} onSelectPublication={onSelectPublication} />
        </div>
      </section> : null}
    </div>
  )
}

const NO_GENERATION = (): string | null => null
const NO_SUBSCRIPTION = () => () => undefined

export function PublicMarketPage({
  gateway, indexGateway, indexApi, publicationId, scopeToken, catalogHref, onCatalogClick,
  onSelectPublication, onOpenScope, onCloseScope, personalWatchlist, catalogGateway = null,
  cnyPerUsd = null, requestedView, onSelectView, active = true,
}: {
  gateway: MarketDescriptivePublicGateway
  indexGateway?: MarketSectorIndexPublicGateway
  indexApi?: MarketSectorIndexPublicApi
  publicationId: string | null
  scopeToken: string | null
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onSelectPublication: (publicationId: string | null) => void
  onOpenScope: (scopeToken: string, publicationId: string) => void
  onCloseScope: () => void
  personalWatchlist: PersonalWatchlistController
  catalogGateway?: CatalogDisplayGateway | null
  cnyPerUsd?: string | null
  /** Tab addressed by the route; without it the page keeps the tab locally. */
  requestedView?: MarketBoardView
  onSelectView?: (view: MarketBoardView) => void
  /** Shown and not left behind by a pending navigation (kept-alive pages stay mounted hidden). */
  active?: boolean
}) {
  const lang = useLang()
  const api = useMemo(() => new MarketDescriptivePublicApi(gateway), [gateway])
  const indexSource = useMemo(
    () => indexGateway ?? new HttpMarketSectorIndexPublicGateway(),
    [indexGateway],
  )
  const [reload, setReload] = useState(0)
  const [state, setState] = useState<MarketState>({ status: 'LOADING' })
  const [overviewDocument, setOverviewDocument] = useState<MarketDescriptiveSuccess | null>(null)
  const [view, setView] = useState<MarketBoardView>(
    requestedView ?? (scopeToken === null ? 'MARKET' : 'SECTORS'),
  )
  const overviewRequests = useRef<MarketRequestCache>(new Map())
  const scopeRequests = useRef<MarketRequestCache>(new Map())
  const overviewRequestKey = publicationId ?? 'ACTIVE'
  const loadedOverviewRequestKey = useRef<string | null>(null)
  // A native ACTIVE overview names the publication current when it was read. Once the
  // producer publishes again, reads pinned to it fail closed; drop it and rediscover.
  const nativeActive = gateway.kind === 'NATIVE_CNY_MARKET_DESCRIPTIVE' && publicationId === null
  const rediscoverActive = () => {
    overviewRequests.current.delete(overviewRequestKey)
    scopeRequests.current.clear()
    loadedOverviewRequestKey.current = null
    setReload((value) => value + 1)
  }
  // The index found a newer CURRENT. ACTIVE re-reads; the summary and index change
  // publication together (withdrawn meanwhile once the newer one is accepted, see below).
  // An explicit publication never follows: the index fails closed.
  const followNativeCurrent = (): boolean => {
    if (!nativeActive) return false
    overviewRequests.current.delete(overviewRequestKey)
    scopeRequests.current.clear()
    setReload((value) => value + 1)
    return true
  }

  useEffect(() => {
    overviewRequests.current.clear()
    scopeRequests.current.clear()
    loadedOverviewRequestKey.current = null
  }, [api])

  // HOME and MARKET share one accepted native publication. When it has moved past the one
  // this ACTIVE page shows, the page is withdrawn from that render on (visible or hidden),
  // nothing of the older publication stays in the document, and it follows once.
  const generation = indexApi?.nativePublication ?? null
  const acceptedKey = useSyncExternalStore(generation?.subscribe ?? NO_SUBSCRIPTION, generation?.current ?? NO_GENERATION)
  const acceptedPublication = acceptedKey === null ? null : acceptedKey.slice(0, acceptedKey.indexOf('|'))
  const shownPublication = state.status === 'READY' ? (overviewDocument ?? state.document).publication.publication_id : null
  const behind = nativeActive && indexSource.kind === 'NATIVE_CNY_MARKET_INDEX' && acceptedPublication !== null &&
    shownPublication !== null && shownPublication !== acceptedPublication
  const followedKey = useRef<string | null>(null)
  // The accepted key whose current follow has finished loading. Still behind after that: the
  // source answered the older publication, so offer Retry instead of loading forever.
  // Cleared whenever a follow starts, so an earlier follow of the same key never counts.
  const followSettled = useRef<string | null>(null)
  // A follow belongs to one acceptance round. Once another publication is accepted, even one
  // the page already shows so nothing is read, an earlier follow no longer counts for anyone.
  useEffect(() => {
    if (followedKey.current === acceptedKey) return
    followedKey.current = null
    followSettled.current = null
  }, [acceptedKey])
  useEffect(() => {
    // Once per accepted publication, so a source still answering the older one cannot loop.
    if (!active || !behind || followedKey.current === acceptedKey) return
    followedKey.current = acceptedKey
    followSettled.current = null
    followNativeCurrent()
    // followNativeCurrent only touches refs and the reload counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, behind, acceptedKey])

  useEffect(() => {
    if (scopeToken !== null) setView('SECTORS')
  }, [scopeToken])

  useEffect(() => {
    if (requestedView !== undefined) setView(requestedView)
  }, [requestedView])

  useEffect(() => {
    let cancelled = false
    const following = followedKey.current
    if (loadedOverviewRequestKey.current !== overviewRequestKey) setState({ status: 'LOADING' })
    // At most one automatic rediscovery per run, and only when a cached overview was reused.
    const mayRediscover = nativeActive && overviewRequests.current.has(overviewRequestKey)
    const request = cachedMarketRequest(
      overviewRequests.current,
      overviewRequestKey,
      () => api.overview({ publication_id: publicationId }),
    ).then(async (overview) => {
      if (overview.response_kind === 'ERROR' || scopeToken === null) {
        return { document: overview, overview: overview.response_kind === 'ERROR' ? null : overview }
      }
      const context = resolveScopeContext(overview, scopeToken)
      const resolvedPublicationId = publicationId ?? context?.publicationId ?? overview.publication.publication_id
      const document = await cachedMarketRequest(
        scopeRequests.current,
        `${resolvedPublicationId}:${scopeToken}`,
        () => api.scope({ publication_id: resolvedPublicationId, scope_token: scopeToken }),
      )
      return { document, overview }
    })
    void request
      .then(({ document, overview }) => {
        if (cancelled) return
        if (document.response_kind === 'ERROR' && mayRediscover) { rediscoverActive(); return }
        followSettled.current = following
        loadedOverviewRequestKey.current = overview === null ? null : overviewRequestKey
        setOverviewDocument(overview)
        setState(document.response_kind === 'ERROR' ? { status: 'PROBLEM', code: document.error.code } : { status: 'READY', document })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (mayRediscover) { rediscoverActive(); return }
        setState({ status: 'PROBLEM', code: failureCode(error) })
      })
    return () => { cancelled = true }
    // rediscoverActive only touches refs and the reload counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, nativeActive, overviewRequestKey, publicationId, reload, scopeToken])

  useEffect(() => {
    if (view !== 'SECTORS' || overviewDocument === null) return
    const publication = overviewDocument.publication.publication_id
    for (const scope of overviewDocument.scopes) {
      if (scope.scope_kind !== 'SECTOR') continue
      void cachedMarketRequest(
        scopeRequests.current,
        `${publication}:${scope.scope_token}`,
        () => api.scope({ publication_id: publication, scope_token: scope.scope_token }),
      ).catch(() => undefined)
    }
  }, [api, overviewDocument, view])

  // Settled only for the follow of this very key: before its effect starts that follow, the
  // ref still names the previous one.
  const followDone = followedKey.current === acceptedKey && followSettled.current === acceptedKey
  if (state.status === 'LOADING' || (behind && !followDone)) return <PublicResultLoading />
  if (state.status === 'PROBLEM' || behind) {
    if (state.status !== 'PROBLEM') return (
      <section className="public-market__empty" role="status">
        <h2>{marketT('emptyTitle', lang)}</h2><p>{marketT('emptyNote', lang)}</p>
        <button type="button" onClick={rediscoverActive}>{t('publicResultRetry', lang)}</button>
      </section>
    )
    if (gateway.kind === 'NATIVE_CNY_MARKET_DESCRIPTIVE') return (
      <section className="public-market__empty" role="status">
        <h2>{marketT('emptyTitle', lang)}</h2><p>{marketT('emptyNote', lang)}</p>
        <button type="button" onClick={() => nativeActive ? rediscoverActive() : setReload((value) => value + 1)}>{t('publicResultRetry', lang)}</button>
      </section>
    )
    return <MarketProblem code={state.code} onRetry={() => setReload((value) => value + 1)} catalogHref={catalogHref} onCatalogClick={onCatalogClick} />
  }

  const overview = overviewDocument ?? (state.document.operation === 'OVERVIEW' ? state.document : null)
  const marketDocument = overview ?? state.document
  // Native summary and index come from one session: the index reads only this publication.
  const nativeEpoch = gateway.kind === 'NATIVE_CNY_MARKET_DESCRIPTIVE' && indexSource.kind === 'NATIVE_CNY_MARKET_INDEX'
  const scopeContext = scopeToken === null || overview === null ? null : resolveScopeContext(overview, scopeToken)
  const renderedScopeToken = state.document.operation === 'SCOPE'
    ? (state.document.headline?.scope ?? state.document.scopes[0])?.scope_token ?? null
    : null
  const scopePending = scopeToken !== null && renderedScopeToken !== scopeToken
  const sectorScopesByCode = new Map(
    (overview?.scopes ?? [])
      .filter((candidate) => candidate.scope_kind === 'SECTOR')
      .map((candidate) => [candidate.scope_id, candidate]),
  )
  const openSector = (scopeCode: string) => {
    const selected = sectorScopesByCode.get(scopeCode)
    if (selected === undefined || overview === null) return
    setView('SECTORS')
    onOpenScope(selected.scope_token, overview.publication.publication_id)
  }
  const selectView = (nextView: MarketBoardView) => {
    setView(nextView)
    if (onSelectView !== undefined) onSelectView(nextView)
    else if (nextView === 'MARKET' && scopeToken !== null) onCloseScope()
  }

  return (
    <article className="public-result-page public-market" data-testid="public-market-page">
      <header className="public-result-page__header">
        <div>
          <p>{t('publicMarketEyebrow', lang)}</p>
          <h1>{t('publicMarketTitle', lang)}</h1>
          <p>{t('publicMarketIntro', lang)}</p>
        </div>
        {publicationId !== null || scopeToken !== null ? (
          <button type="button" onClick={() => onSelectPublication(null)}>{t('publicResultFresh', lang)}</button>
        ) : null}
      </header>
      <nav className="public-market__view-tabs" role="tablist" aria-label={marketT('indexBoard', lang)}>
        <button type="button" role="tab" aria-selected={view === 'MARKET'} onClick={() => selectView('MARKET')}>
          {marketT('indexTabMarket', lang)}
        </button>
        <button type="button" role="tab" aria-selected={view === 'SECTORS'} onClick={() => selectView('SECTORS')}>
          {marketT('indexTabSectors', lang)}
        </button>
      </nav>
      <MarketSectorIndexHistory
        gateway={indexSource}
        api={indexApi}
        scopeCode="ALL"
        catalogGateway={catalogGateway}
        cnyPerUsd={cnyPerUsd}
        view={view}
        onSelectSector={openSector}
        onClearSector={onCloseScope}
        selectedSectorCode={scopeContext?.scope.scope_id ?? null}
        nativePublicationId={nativeEpoch ? marketDocument.publication.publication_id : null}
        onNativePublicationChanged={followNativeCurrent}
      />
      {view === 'MARKET' ? (
        <MarketResult
          document={marketDocument}
          relatedScopes={marketDocument.scopes}
          scopeToken={null}
          onOpenScope={onOpenScope}
          onCloseScope={onCloseScope}
          onSelectPublication={onSelectPublication}
          personalWatchlist={personalWatchlist}
          cnyPerUsd={cnyPerUsd}
        />
      ) : scopeToken !== null && (state.document.operation === 'SCOPE' || scopeContext !== null) ? (
        <MarketResult
          document={scopePending ? marketDocument : state.document}
          relatedScopes={scopeContext?.scopes ?? overview?.scopes ?? state.document.scopes}
          scopeToken={scopeToken}
          onOpenScope={onOpenScope}
          onCloseScope={onCloseScope}
          onSelectPublication={onSelectPublication}
          personalWatchlist={personalWatchlist}
          scopeOverride={scopePending ? scopeContext?.scope ?? null : null}
          scopePublicationId={scopeContext?.publicationId ?? null}
          pending={scopePending}
          cnyPerUsd={cnyPerUsd}
        />
      ) : null}
    </article>
  )
}

function ScopeCard({
  scope, publicationId, onOpenScope, personalWatchlist,
}: {
  scope: MarketDescriptiveScope
  publicationId: string
  onOpenScope: (scopeToken: string, publicationId: string) => void
  personalWatchlist: PersonalWatchlistController
}) {
  const lang = useLang()
  const illustrationModel = marketSubsectorIllustrationModel(scope.scope_id)
  return (
    <article
      className="public-market__scope-card"
      data-scope-kind={scope.scope_kind}
      data-coverage-grade={scope.coverage_grade}
    >
      <button
        className="public-market__scope-card-open"
        type="button"
        data-testid={`public-market-open-scope-${scope.scope_token}`}
        onClick={() => onOpenScope(scope.scope_token, publicationId)}
      >
        {illustrationModel === undefined ? null : (
          <span className="public-market__scope-card-image">
            <EquipmentModelImage modelId={illustrationModel} />
          </span>
        )}
        <span className="public-market__scope-card-kind">{marketT(`scope${scope.scope_kind}` as MarketStringKey, lang)}</span>
        <strong>{scopeLabel(scope, lang)}</strong>
        <em>{formatPublicRatio(scope.return_selected_for_display, lang)}</em>
        <small>{scope.paired_member_count} / {scope.fixed_member_count} · {marketT(COVERAGE_COPY[scope.coverage_grade], lang)}</small>
      </button>
      <PersonalWatchlistToggle
        controller={personalWatchlist}
        candidate={marketScopeWatchCandidate(scope)}
        presentation="ICON"
      />
    </article>
  )
}
