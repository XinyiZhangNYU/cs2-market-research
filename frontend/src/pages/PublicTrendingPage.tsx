import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { catalogMediaRoute } from '../adapter/catalogDisplayViewModel'
import {
  SingleItemTrendingPublicApi,
  type SingleItemTrendingPublicGateway,
} from '../api/SingleItemTrendingPublicApi'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { itemKindLabel, wearTierLabel } from '../contract/catalogBrowse'
import { bindItemImageUrl, ITEM_IMAGE_NOT_PRODUCED, type ItemImageSource } from '../contract/itemImage'
import { EditionKind } from '../contract/identity'
import { editionKindLabel, label } from '../contract/labels'
import { useLang } from '../i18n'
import { t, tf, type StringKey } from '../i18n/strings'
import { canonicalJsonText } from '../wire/canonical'
import { TrendingPublicValidationError, trendingDisplayOrderIsValid } from '../wire/singleItemTrendingPublicApiDecode'
import { formatNativeTrendingPercent, isNativeTrendingMember, trendingProductHref, trendingRowKey,
  type TrendingDisplayList, type TrendingDisplayMember } from '../trending/nativeCnyTrendingPresentation'
import type {
  TrendingDirection,
  TrendingErrorCode,
  TrendingFilters,
  TrendingItemKind,
  TrendingListResponse,
  TrendingMember,
  TrendingWearTier,
} from '../wire/singleItemTrendingPublicApiTypes'
import './publicTrending.css'

type TrendingProblemCode = TrendingErrorCode | 'TRANSPORT' | 'VALIDATION'
type ResponseClock = Readonly<{ server: number; wall: number; monotonic: number }>

type ListState =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{
      status: 'READY'
      document: TrendingDisplayList
      members: readonly TrendingDisplayMember[]
      nextCursor: string | null
      loadingMore: boolean
      loadMoreFailed: boolean
      refreshing: boolean
      clock: ResponseClock
      localFreshness: 'FRESH' | 'STALE_RETAINED' | null
    }>
  | Readonly<{ status: 'PROBLEM'; code: TrendingProblemCode }>

const PAGE_SIZE = 24
const ITEM_KINDS: readonly TrendingItemKind[] = ['WEAPON', 'KNIFE', 'GLOVE', 'AGENT', 'OTHER', 'UNKNOWN']
const EDITION_KINDS = Object.values(EditionKind)
const WEAR_TIERS: readonly TrendingWearTier[] = [
  'FACTORY_NEW', 'MINIMAL_WEAR', 'FIELD_TESTED', 'WELL_WORN',
  'BATTLE_SCARRED', 'NOT_APPLICABLE', 'UNKNOWN',
]
const PROBLEM_COPY = Object.freeze({
  INVALID_ARGUMENT: ['publicTrendingInvalidTitle', 'publicTrendingInvalidNote'],
  INVALID_CURSOR: ['publicTrendingInvalidTitle', 'publicTrendingInvalidNote'],
  NOT_PUBLISHED: ['publicTrendingNotPublishedTitle', 'publicTrendingNotPublishedNote'],
  BACKEND_UNAVAILABLE: ['publicTrendingTemporaryTitle', 'publicTrendingTemporaryNote'],
  PUBLICATION_EXPIRED: ['publicTrendingExpiredTitle', 'publicTrendingExpiredNote'],
  PUBLICATION_WITHDRAWN: ['publicTrendingWithdrawnTitle', 'publicTrendingWithdrawnNote'],
  RESULT_CORRUPT: ['publicTrendingCorruptTitle', 'publicTrendingCorruptNote'],
  TRANSPORT: ['publicTrendingTemporaryTitle', 'publicTrendingTemporaryNote'],
  VALIDATION: ['publicTrendingCorruptTitle', 'publicTrendingCorruptNote'],
} satisfies Record<TrendingProblemCode, readonly [StringKey, StringKey]>)

const SOURCE_COPY = Object.freeze({
  market_a: 'publicTrendingSourceMarketA',
  market_b: 'publicTrendingSourceMarketB',
  market_c: 'publicTrendingSourceMarketC',
} satisfies Record<TrendingMember['conservative_source_code'], StringKey>)

const ABSENCE_COPY = Object.freeze({
  QUALIFIED: 'publicTrendingQualified',
  NO_ACTIVE_ASK: 'publicTrendingNoAsk',
  SOURCE_REFRESH_LAG: 'publicTrendingLag',
  PROVIDER_HISTORY_SOURCE_ABSENT: 'publicTrendingHistoryAbsent',
} satisfies Record<string, StringKey>)

const EVIDENCE_COPY = Object.freeze({
  RECONSTRUCTED_HISTORY: 'publicTrendingHistoryEvidence',
  HYBRID_BRIDGED: 'publicTrendingHybridEvidence',
  CONTEMPORANEOUSLY_MEASURED: 'publicTrendingCurrentEvidence',
} satisfies Record<string, StringKey>)

function problemCode(error: unknown): TrendingProblemCode {
  return error instanceof TrendingPublicValidationError ? 'VALIDATION' : 'TRANSPORT'
}

function imageSource(member: TrendingDisplayMember): ItemImageSource {
  const media = member.catalog.media
  if (media.status === 'NOT_PRODUCED') return ITEM_IMAGE_NOT_PRODUCED
  return bindItemImageUrl(catalogMediaRoute(media.media_key, media.media_asset_version_id))
}

function itemName(member: TrendingDisplayMember, lang: 'zh' | 'en'): string {
  return lang === 'zh' ? member.catalog.localized_name.zh_cn : member.catalog.localized_name.en
}

function formatDate(value: string, lang: 'zh' | 'en'): string {
  const parsed = new Date(value.includes('T') || value.includes('t') ? value : `${value}T12:00:00.000Z`)
  if (!Number.isFinite(parsed.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

function formatChange(value: string, lang: 'zh' | 'en'): string {
  const ratio = Number(value)
  if (!Number.isFinite(ratio)) return '—'
  // The wire has eight decimal places; the UI has one percentage decimal.
  // This is a direction label, not a fabricated non-zero estimate.
  if (Math.abs(ratio) < 0.0005) {
    return t(value.startsWith('-') ? 'publicTrendingTinyDecline' : 'publicTrendingTinyGain', lang)
  }
  return new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(ratio)
}

function immutablePublicationText(publication: TrendingListResponse['publication']): string {
  const { freshness: _freshness, ...immutable } = publication
  return canonicalJsonText(immutable)
}

function elapsedNow(clock: ResponseClock): number {
  // A suspended tab may pause the monotonic clock; a wall-clock rollback must
  // never make the observed server time younger. Never trust local timezone.
  return clock.server + Math.max(0, Date.now() - clock.wall, performance.now() - clock.monotonic)
}

function readyState(document: TrendingDisplayList, members: readonly TrendingDisplayMember[], clock: ResponseClock): ListState {
  if (document.api_version === 'native-cny') return {
    status: 'READY', document, members, clock, localFreshness: null,
    nextCursor: null, loadingMore: false, loadMoreFailed: false, refreshing: false,
  }
  const now = elapsedNow(clock)
  if (now > Date.parse(document.publication.retain_until)) return { status: 'PROBLEM', code: 'PUBLICATION_EXPIRED' }
  return {
    status: 'READY', document, members, clock,
    localFreshness: now <= Date.parse(document.publication.fresh_until) ? 'FRESH' : 'STALE_RETAINED',
    nextCursor: document.next_cursor, loadingMore: false, loadMoreFailed: false,
    refreshing: false,
  }
}

function mergeContinuation(
  current: Extract<ListState, { status: 'READY' }>,
  document: TrendingDisplayList,
  requestedCursor: string,
): readonly TrendingMember[] {
  try {
    if (document.api_version === 'native-cny' || current.document.api_version === 'native-cny') {
      throw new TrendingPublicValidationError()
    }
    const priorMembers = current.members.filter((member): member is TrendingMember => !isNativeTrendingMember(member))
    if (priorMembers.length !== current.members.length) throw new TrendingPublicValidationError()
    if (document.query.cursor !== requestedCursor) throw new TrendingPublicValidationError()
    if (document.total !== current.document.total) throw new TrendingPublicValidationError()
    if (document.query.snapshot_known_at !== current.document.query.snapshot_known_at ||
        document.query.request_known_at < current.document.query.request_known_at) {
      throw new TrendingPublicValidationError()
    }
    if (immutablePublicationText(document.publication) !== immutablePublicationText(current.document.publication)) {
      throw new TrendingPublicValidationError()
    }
    const previous = priorMembers[priorMembers.length - 1]
    const first = document.members[0]
    if (previous === undefined || first === undefined || first.rank !== previous.rank + 1) {
      throw new TrendingPublicValidationError()
    }
    if (!trendingDisplayOrderIsValid(previous, first)) throw new TrendingPublicValidationError()
    const identities = new Set(current.members.map((member) => member.analysis_unit_id))
    const measurements = new Set(priorMembers.map((member) => member.measurement_id))
    for (const member of document.members) {
      if (identities.has(member.analysis_unit_id) || measurements.has(member.measurement_id)) {
        throw new TrendingPublicValidationError()
      }
      identities.add(member.analysis_unit_id)
      measurements.add(member.measurement_id)
    }
    const length = current.members.length + document.members.length
    if (length > document.total || (document.next_cursor === null) !== (length === document.total)) {
      throw new TrendingPublicValidationError()
    }
    return Object.freeze([...priorMembers, ...document.members])
  } catch (error) {
    if (error instanceof TrendingPublicValidationError) throw error
    throw new TrendingPublicValidationError()
  }
}

function TrendingProblem({
  code,
  onRetry,
  catalogHref,
  onCatalogClick,
}: {
  code: TrendingProblemCode
  onRetry: () => void
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const [title, note] = PROBLEM_COPY[code]
  return (
    <section className="public-trending__problem" role="status" data-error-code={code}>
      <p>{t('publicTrendingEyebrow', lang)}</p>
      <h2>{t(title, lang)}</h2>
      <p>{t(note, lang)}</p>
      <div>
        <button type="button" onClick={onRetry}>{t('publicResultRetry', lang)}</button>
        <a href={catalogHref} onClick={onCatalogClick}>{t('publicResultBackCatalog', lang)}</a>
      </div>
    </section>
  )
}

export function PublicTrendingPage({
  active = true,
  gateway,
  asOf,
  publicationId,
  direction,
  filters,
  catalogHref,
  onCatalogClick,
  onQueryChange,
}: {
  active?: boolean
  gateway: SingleItemTrendingPublicGateway
  asOf: string | null
  publicationId: string | null
  direction: TrendingDirection
  filters: TrendingFilters
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onQueryChange: (
    direction: TrendingDirection,
    filters: TrendingFilters,
    mode?: 'push' | 'replace',
  ) => void
}) {
  const lang = useLang()
  const api = useMemo(() => new SingleItemTrendingPublicApi(gateway), [gateway])
  const [reload, setReload] = useState(0)
  const [storedList, setList] = useState<ListState>({ status: 'LOADING' })
  const list: ListState = storedList.status === 'READY' && storedList.document.api_version === 'native-cny' &&
    (storedList.document.query.direction !== direction || canonicalJsonText(storedList.document.query.filters) !== canonicalJsonText(filters) ||
      storedList.document.query.publication_id !== publicationId || storedList.document.query.as_of !== asOf)
    ? { status: 'LOADING' } : storedList
  const catalogFiltersDisabled = gateway.kind === 'NATIVE_CNY_TRENDING' &&
    (list.status !== 'READY' || list.document.api_version !== 'native-cny' || list.document.catalog_status !== 'READY')
  const loadMoreController = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!active) return
    loadMoreController.current?.abort()
    loadMoreController.current = null
    const controller = new AbortController()
    const clockStart = { wall: Date.now(), monotonic: performance.now() }
    setList((current) => current.status === 'READY' && current.document.api_version !== 'native-cny'
      ? { ...current, refreshing: true } : { status: 'LOADING' })
    const show = (document: Awaited<ReturnType<SingleItemTrendingPublicApi['list']>>) => {
      if (controller.signal.aborted) return
      setList(document.response_kind === 'ERROR'
        ? { status: 'PROBLEM', code: document.error.code }
        : readyState(document, document.members, { ...clockStart, server: document.api_version === 'native-cny'
          ? clockStart.wall : Date.parse(document.query.request_known_at) }))
    }
    void api.list({
      as_of: asOf,
      publication_id: publicationId,
      direction,
      page_size: PAGE_SIZE,
      cursor: null,
      filters,
    }, { signal: controller.signal, onProgress: show }).then(show).catch((error: unknown) => {
      if (!controller.signal.aborted) setList({ status: 'PROBLEM', code: problemCode(error) })
    })
    return () => controller.abort()
  }, [active, api, asOf, direction, filters, publicationId, reload])

  useEffect(() => {
    if (!active || list.status !== 'READY' || list.document.api_version === 'native-cny') return
    const publication = list.document.publication
    const deadline = Date.parse(list.localFreshness === 'FRESH'
      ? list.document.publication.fresh_until : list.document.publication.retain_until)
    const timer = window.setTimeout(() => {
      if (elapsedNow(list.clock) > Date.parse(publication.retain_until)) {
        loadMoreController.current?.abort()
      }
      setList((current) => {
        if (current.status !== 'READY') return current
        const next = readyState(current.document, current.members, current.clock)
        // Preserve an in-flight continuation through a freshness downgrade;
        // expiration removes the document and member data from render state.
        return next.status === 'READY'
          ? {
              ...next,
              loadingMore: current.loadingMore,
              loadMoreFailed: current.loadMoreFailed,
              refreshing: current.refreshing,
            }
          : next
      })
    }, Math.min(2_147_483_647, Math.max(0, deadline - elapsedNow(list.clock) + 1)))
    return () => window.clearTimeout(timer)
  }, [active, list])

  useEffect(() => {
    if (!active) return
    const revalidate = () => {
      if (!active || document.visibilityState === 'hidden') return
      loadMoreController.current?.abort()
      setReload((value) => value + 1)
    }
    window.addEventListener('focus', revalidate)
    document.addEventListener('visibilitychange', revalidate)
    return () => {
      window.removeEventListener('focus', revalidate)
      document.removeEventListener('visibilitychange', revalidate)
      loadMoreController.current?.abort()
    }
  }, [active])

  const loadMore = useCallback(async () => {
    if (list.status !== 'READY' || list.nextCursor === null || list.loadingMore || list.refreshing) return
    const cursor = list.nextCursor
    const controller = new AbortController()
    const clockStart = { wall: Date.now(), monotonic: performance.now() }
    loadMoreController.current = controller
    setList({ ...list, loadingMore: true, loadMoreFailed: false })
    try {
      const document = await api.list({
        as_of: asOf,
        publication_id: list.document.publication.publication_id,
        direction,
        page_size: PAGE_SIZE,
        cursor,
        filters,
      }, { signal: controller.signal })
      if (controller.signal.aborted) return
      if (document.response_kind === 'ERROR') {
        setList((current) => current.status === 'READY'
          ? document.error.code === 'BACKEND_UNAVAILABLE'
            ? { ...current, loadingMore: false, loadMoreFailed: true }
            : { status: 'PROBLEM', code: document.error.code }
          : current)
        return
      }
      const members = mergeContinuation(list, document, cursor)
      setList(readyState(document, members, { ...clockStart, server: document.api_version === 'native-cny'
        ? clockStart.wall : Date.parse(document.query.request_known_at) }))
    } catch (error: unknown) {
      if (controller.signal.aborted) return
      setList((current) => current.status === 'READY'
        ? error instanceof TrendingPublicValidationError
          ? { status: 'PROBLEM', code: 'VALIDATION' }
          : { ...current, loadingMore: false, loadMoreFailed: true }
        : current)
    } finally {
      if (loadMoreController.current === controller) loadMoreController.current = null
    }
  }, [api, asOf, direction, filters, list])

  const changeFilters = (change: Partial<TrendingFilters>) => {
    onQueryChange(direction, Object.freeze({ ...filters, ...change }))
  }

  return (
    <article className="public-result-page public-trending" data-testid="public-trending-page">
      <header className="public-result-page__header">
        <div>
          <p>{t('publicTrendingEyebrow', lang)}</p>
          <h1>{t('publicTrendingTitle', lang)}</h1>
          <p>{t(gateway.kind === 'NATIVE_CNY_TRENDING' ? 'publicTrendingNativeIntro' : 'publicTrendingIntro', lang)}</p>
        </div>
        <strong>{t('publicTrendingRetrospective', lang)}</strong>
      </header>

      <section className="public-trending__controls" aria-label={t('publicTrendingControls', lang)}>
        <div className="public-trending__directions" role="group" aria-label={t('publicTrendingDirection', lang)}>
          {(['GAINERS', 'LOSERS'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={direction === option ? 'is-active' : undefined}
              aria-pressed={direction === option}
              onClick={() => onQueryChange(option, filters)}
            >
              {t(option === 'GAINERS' ? 'publicTrendingGainers' : 'publicTrendingLosers', lang)}
            </button>
          ))}
        </div>
        <label>
          <span>{t('publicTrendingItemKind', lang)}</span>
          <select
            disabled={catalogFiltersDisabled}
            value={filters.item_kind ?? ''}
            onChange={(event) => changeFilters({
              item_kind: (event.target.value || null) as TrendingFilters['item_kind'],
              base_item_code: null,
            })}
          >
            <option value="">{t('publicTrendingAll', lang)}</option>
            {ITEM_KINDS.map((kind) => <option key={kind} value={kind}>{label(itemKindLabel, kind, lang)}</option>)}
          </select>
        </label>
        <label>
          <span>{t('publicTrendingEdition', lang)}</span>
          <select
            disabled={catalogFiltersDisabled}
            value={filters.edition_kind ?? ''}
            onChange={(event) => changeFilters({
              edition_kind: (event.target.value || null) as TrendingFilters['edition_kind'],
            })}
          >
            <option value="">{t('publicTrendingAll', lang)}</option>
            {EDITION_KINDS.map((edition) => (
              <option key={edition} value={edition}>{label(editionKindLabel, edition, lang)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('publicTrendingWear', lang)}</span>
          <select
            disabled={catalogFiltersDisabled}
            value={filters.wear_tier ?? ''}
            onChange={(event) => changeFilters({
              wear_tier: (event.target.value || null) as TrendingFilters['wear_tier'],
            })}
          >
            <option value="">{t('publicTrendingAll', lang)}</option>
            {WEAR_TIERS.map((wear) => <option key={wear} value={wear}>{label(wearTierLabel, wear, lang)}</option>)}
          </select>
        </label>
        {filters.base_item_code !== null ? (
          <button
            className="public-trending__clear-model"
            disabled={catalogFiltersDisabled}
            type="button"
            onClick={() => changeFilters({ base_item_code: null })}
          >
            {t('publicTrendingClearModel', lang)}
          </button>
        ) : null}
      </section>

      <p className="public-trending__disclaimer">{t(gateway.kind === 'NATIVE_CNY_TRENDING'
        ? 'publicTrendingNativeFilterScope' : 'publicTrendingFilterScope', lang)}</p>

      <div
        className={`public-trending__content${list.status === 'READY' && list.refreshing ? ' is-refreshing' : ''}`}
        aria-busy={list.status === 'LOADING' || (list.status === 'READY' && list.refreshing)}
      >
      {list.status === 'READY' && list.refreshing ? (
        <div className="public-trending__refreshing" role="status">
          {t('publicTrendingLoading', lang)}
        </div>
      ) : null}
      {list.status === 'LOADING' ? (
        <div className="public-trending__loading" role="status">{t('publicTrendingLoading', lang)}</div>
      ) : list.status === 'PROBLEM' ? (
        <TrendingProblem
          code={list.code}
          onRetry={() => setReload((value) => value + 1)}
          catalogHref={catalogHref}
          onCatalogClick={onCatalogClick}
        />
      ) : (
        <>
          <div className="public-trending__publication" data-testid="public-trending-publication">
            <div>
              <span>{t('publicTrendingAsOf', lang)}</span>
              <time dateTime={list.document.publication.result_as_of}>
                {formatDate(list.document.publication.result_as_of, lang)}
              </time>
            </div>
            <div><span>{t('publicTrendingWindow', lang)}</span><strong>{list.document.api_version === 'native-cny'
              ? `${formatDate(list.document.publication.window_start_date, lang)} – ${formatDate(list.document.publication.window_end_date, lang)}`
              : t('publicTrendingThirtyDays', lang)}</strong></div>
            {list.document.api_version !== 'native-cny' ? <div><span>{t('publicTrendingCurrency', lang)}</span><strong>CNY</strong></div> : null}
            <div><span>{t('publicTrendingEvidence', lang)}</span><strong>{t(
              list.document.api_version === 'v4' || list.document.api_version === 'native-cny'
                ? EVIDENCE_COPY[list.document.publication.evidence_class!]
                : list.document.api_version === 'v3' ? 'publicTrendingTiered' : 'publicTrendingThreeSource', lang,
            )}</strong></div>
            {list.localFreshness !== null ? <strong className={list.localFreshness === 'FRESH' ? 'is-fresh' : 'is-stale'}>
              {t(list.localFreshness === 'FRESH' ? 'publicResultFresh' : 'publicResultStale', lang)}
            </strong> : null}
          </div>

          {list.document.api_version !== 'native-cny' && list.document.publication.tiering_policy ? (
            <details className="public-trending__disclaimer" data-testid="public-trending-coverage">
              <summary>{t('publicTrendingCoverageTitle', lang)}</summary>
              <p>{tf('publicTrendingCoverage', lang, {
                members: list.document.publication.accounting.member_count,
                qualified: list.document.publication.accounting.qualified_supported_endpoint_count!,
                eligible: list.document.publication.accounting.eligible_count,
                excluded: list.document.publication.accounting.excluded_count,
              })}</p>
              <p>{tf('publicTrendingTierCounts', lang, {
                three: list.document.publication.accounting.three_source_confirmed_count!,
                two: list.document.publication.accounting.two_source_supported_count!,
                conflicted: list.document.publication.accounting.status_counts.CONFLICTED_DIRECTION,
              })}</p>
              {list.document.api_version === 'v4' ? (
                <>
                  <p>{tf('publicTrendingHistoricalMethod', lang, {
                    algorithm: list.document.publication.producer_release.algorithm_version,
                    policy: list.document.publication.tiering_policy.policy_code,
                    start: list.document.publication.window_start_date!,
                    end: list.document.publication.result_as_of,
                    startFx: list.document.publication.currency_disclosure!.start_fx_source_event_date,
                    endFx: list.document.publication.currency_disclosure!.end_fx_source_event_date,
                    known: list.document.publication.input_available_at,
                  })}</p>
                  {list.document.publication.evidence_disclosure!.late_bound_current_membership ? (
                    <p>{t('publicTrendingLateBoundUniverse', lang)}</p>
                  ) : null}
                </>
              ) : (
                <p>{tf('publicTrendingMethod', lang, {
                  algorithm: list.document.publication.producer_release.algorithm_version,
                  policy: list.document.publication.tiering_policy.policy_code,
                  minutes: list.document.publication.tiering_policy.maximum_quote_age_minutes!,
                  known: list.document.publication.input_available_at,
                })}</p>
              )}
            </details>
          ) : null}

          {list.document.total === 0 ? (
            <section className="public-trending__empty" role="status">
              <h2>{t('publicTrendingEmptyTitle', lang)}</h2>
              <p>{t('publicTrendingEmptyNote', lang)}</p>
            </section>
          ) : (
            <section className="public-trending__results" aria-labelledby="public-trending-results-title">
              <div>
                <h2 id="public-trending-results-title">
                  {t(direction === 'GAINERS' ? 'publicTrendingGainers' : 'publicTrendingLosers', lang)}
                </h2>
                <span>{tf('publicTrendingCount', lang, { count: list.document.total })}</span>
              </div>
              <ol>
                {list.members.map((member) => {
                  const pending = isNativeTrendingMember(member) && member.catalog_state === 'LOADING'
                  const name = pending ? t('publicSnapshotLoading', lang) : itemName(member, lang)
                  return (
                    <li key={trendingRowKey(member)} aria-busy={pending} data-catalog-state={isNativeTrendingMember(member) ? member.catalog_state : undefined}>
                      <a href={trendingProductHref(member, list.document.publication, lang)}>
                        <span className="public-trending__rank">{String(member.rank).padStart(2, '0')}</span>
                        <ItemImageSlot
                          metadataPending={pending}
                          source={imageSource(member)}
                          label={name}
                          variant="thumbnail"
                          presentation="PRODUCT"
                          testId={`public-trending-image-${member.rank}`}
                        />
                        <span className="public-trending__item-copy">
                          <strong>{name}</strong>
                          {list.document.api_version === 'v3' || list.document.api_version === 'v4' || list.document.api_version === 'native-cny' ? (
                            <small>{t((isNativeTrendingMember(member) ? member.supporting_source_count === 2 : member.evidence_grade === 'TWO_SOURCE_SUPPORTED')
                              ? 'publicTrendingTwoSource' : 'publicTrendingThreeSource', lang)}</small>
                          ) : null}
                          <small>{t('publicTrendingSource', lang)} · {t(SOURCE_COPY[member.conservative_source_code], lang)}</small>
                          {!isNativeTrendingMember(member) ? member.unavailable_sources?.map((absent) => (
                            <small key={absent.source_code}>{tf('publicTrendingAbsent', lang, {
                              source: t(SOURCE_COPY[absent.source_code], lang),
                              start: t(ABSENCE_COPY[absent.start_reason], lang),
                              end: t(ABSENCE_COPY[absent.end_reason], lang),
                            })}</small>
                          )) : null}
                        </span>
                        <span className="public-trending__change" data-direction={direction}>
                          <small>{t('publicTrendingChange', lang)}</small>
                          <strong>{isNativeTrendingMember(member) ? formatNativeTrendingPercent(member.return_exact, lang)
                            : formatChange(member.conservative_same_direction_change_floor_ratio, lang)}</strong>
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          {list.loadingMore ? <p className="public-trending__more-status" role="status">{t('publicTrendingLoading', lang)}</p> : null}
          {list.loadMoreFailed ? <p className="public-trending__more-status" role="status">{t('publicResultLoadMoreFailed', lang)}</p> : null}
          {list.nextCursor !== null && !list.loadingMore ? (
            <button
              className="public-result-load-more"
              type="button"
              disabled={list.refreshing}
              onClick={() => void loadMore()}
            >
              {t('publicResultLoadMore', lang)}
            </button>
          ) : null}
        </>
      )}
      </div>

      <p className="public-trending__disclaimer">{t('publicTrendingDisclaimer', lang)}</p>
      <p className="public-trending__disclaimer">{t('publicTrendingQuoteBasis', lang)}</p>
      {gateway.kind !== 'NATIVE_CNY_TRENDING' ? <p className="public-trending__disclaimer">{t('publicTrendingFxBasis', lang)}</p> : null}
    </article>
  )
}
