import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { catalogMediaRoute } from '../adapter/catalogDisplayViewModel'
import { HttpItemHistoryPublicGateway } from '../api/HttpItemHistoryPublicGateway'
import { ItemHistoryAvailabilityError, ItemHistoryPublicApi, type ItemHistoryPublicGateway } from '../api/ItemHistoryPublicApi'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { bindItemImageUrl, ITEM_IMAGE_NOT_PRODUCED, type ItemImageSource } from '../contract/itemImage'
import { useLang, type Lang } from '../i18n'
import { formatLocalizedCurrencyFromUsd } from '../price/localizedCurrency'
import { ItemHistoryValidationError } from '../wire/itemHistoryPublicApiDecode'
import type {
  ItemHistoryErrorCode,
  ItemHistoryMember,
  ItemHistorySort,
  ItemHistorySuccess,
  ItemHistoryTimingRelationship,
} from '../wire/itemHistoryPublicApiTypes'
import { ItemMonitorViewSwitcher } from './ItemMonitorViewSwitcher'
import { itemHistoryT, type ItemHistoryStringKey } from './publicItemHistoryCopy'
import { RetainedPublicationListCache, terminalPublicationCode } from './retainedPublicationList'

type ProblemCode = ItemHistoryErrorCode | 'TRANSPORT' | 'VALIDATION'
type ListState =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'SEARCH_EMPTY' }>
  | Readonly<{
      status: 'READY'
      document: ItemHistorySuccess
      members: readonly ItemHistoryMember[]
      nextCursor: string | null
      consumedCursors: readonly string[]
      loadingMore: boolean
      loadMoreProblem: ProblemCode | null
      cacheKeys: readonly string[]
      activeCacheKeys: readonly string[]
    }>
  | Readonly<{ status: 'PROBLEM'; code: ProblemCode }>
type ReadyListState = Extract<ListState, { status: 'READY' }>
type DetailState =
  | Readonly<{ status: 'IDLE' | 'LOADING' }>
  | Readonly<{ status: 'READY'; document: ItemHistorySuccess }>
  | Readonly<{ status: 'PROBLEM'; code: ProblemCode }>

const PROBLEM_COPY = Object.freeze({
  INVALID_REQUEST: ['invalidRequestTitle', 'invalidRequestNote'],
  NOT_PUBLISHED: ['notPublishedTitle', 'notPublishedNote'],
  NOT_FOUND: ['notFoundTitle', 'notFoundNote'],
  WITHDRAWN: ['withdrawnTitle', 'withdrawnNote'],
  STALE_EXPIRED: ['expiredTitle', 'expiredNote'],
  CORRUPT_PUBLICATION: ['corruptTitle', 'corruptNote'],
  TEMPORARILY_UNAVAILABLE: ['temporaryTitle', 'temporaryNote'],
  TRANSPORT: ['temporaryTitle', 'temporaryNote'],
  VALIDATION: ['corruptTitle', 'corruptNote'],
} satisfies Record<ProblemCode, readonly [ItemHistoryStringKey, ItemHistoryStringKey]>)

function failureCode(error: unknown): ProblemCode {
  if (error instanceof ItemHistoryAvailabilityError) return 'TEMPORARILY_UNAVAILABLE'
  return error instanceof ItemHistoryValidationError ? 'VALIDATION' : 'TRANSPORT'
}

function itemHistoryListKey(
  publicationId: string | null,
  reload: number,
  sort: ItemHistorySort,
  nameQuery: string | null,
): string {
  return JSON.stringify([publicationId ?? 'ACTIVE', reload, sort, nameQuery])
}

function imageSource(member: ItemHistoryMember): ItemImageSource {
  if (member.catalog.media.status === 'NOT_PRODUCED') return ITEM_IMAGE_NOT_PRODUCED
  const assetId = member.catalog.version_context.media_asset_version_id
  return assetId === null ? ITEM_IMAGE_NOT_PRODUCED : bindItemImageUrl(catalogMediaRoute(member.catalog.media.media_key, assetId))
}

function itemName(member: ItemHistoryMember, lang: Lang): string {
  return lang === 'zh' ? member.catalog.localized_name.zh_cn : member.catalog.localized_name.en
}

export function normalizeItemHistoryNameQuery(value: string): string | null {
  const normalized = value.trim().replace(/\s+/gu, ' ')
  return normalized === '' ? null : normalized
}

function formatDay(value: string, lang: Lang): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(date)
}

function formatPercent(value: string): string {
  const percent = Number(value) * 100
  return Number.isFinite(percent) ? `${percent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%` : value
}

function formatMultiple(value: string): string {
  const multiple = Number(value)
  return Number.isFinite(multiple)
    ? multiple.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value
}
function productHref(member: ItemHistoryMember, lang: Lang): string {
  const params = new URLSearchParams({ unit: member.catalog.analysis_unit_id, snapshot: member.catalog_snapshot_id })
  if (lang === 'en') params.set('lang', 'en')
  return `/research?${params}`
}

function samePublication(left: ItemHistorySuccess, right: ItemHistorySuccess): boolean {
  return left.publication.publication_id === right.publication.publication_id &&
    left.publication.manifest_sha256 === right.publication.manifest_sha256 &&
    left.publication.rights_revision === right.publication.rights_revision &&
    left.snapshot.source_manifest_sha256 === right.snapshot.source_manifest_sha256 &&
    left.snapshot.source_family_events_sha256 === right.snapshot.source_family_events_sha256 &&
    left.snapshot.catalog_snapshot_id === right.snapshot.catalog_snapshot_id &&
    left.release.release_id === right.release.release_id &&
    left.release.public_event_count === right.release.public_event_count
}

function timingKeyFor(relationship: ItemHistoryTimingRelationship): ItemHistoryStringKey {
  if (relationship === 'SUPPLY_LEADS') return 'supplyLeads'
  if (relationship === 'PRICE_LEADS') return 'priceLeads'
  return 'concurrent'
}

function timingKey(member: ItemHistoryMember): ItemHistoryStringKey {
  return timingKeyFor(member.timing_relationship)
}

function confidenceKey(member: ItemHistoryMember): ItemHistoryStringKey {
  return member.supply_measurement_confidence === 'STANDARD' ? 'standardConfidence' : 'lowBaselineConfidence'
}

function poolKey(member: ItemHistoryMember): ItemHistoryStringKey {
  return member.product_pool === 'SOUVENIR' ? 'souvenir' : 'ordinary'
}

export type ItemHistoryMilestone = Readonly<{
  date: string
  label: 'supplyOnset' | 'priceOnset' | 'peakOn' | 'statisticsThrough'
  order: number
}>

export function historyMilestones(member: Pick<ItemHistoryMember,
  'supply_onset' | 'price_onset' | 'peak_on' | 'statistics_through'>): readonly ItemHistoryMilestone[] {
  return [
    { date: member.supply_onset, label: 'supplyOnset' as const, order: 0 },
    { date: member.price_onset, label: 'priceOnset' as const, order: 1 },
    { date: member.peak_on, label: 'peakOn' as const, order: 2 },
    { date: member.statistics_through, label: 'statisticsThrough' as const, order: 3 },
  ].sort((left, right) => left.date.localeCompare(right.date) || left.order - right.order)
}

function HistoryTimeline({ member }: { member: ItemHistoryMember }) {
  const lang = useLang()
  return (
    <span className="item-history__timeline" aria-label={itemHistoryT('groupTimeline', lang)}>
      {historyMilestones(member).map((milestone) => (
        <span key={milestone.label}>
          <small>{itemHistoryT(milestone.label, lang)}</small>
          <time dateTime={milestone.date}>{formatDay(milestone.date, lang)}</time>
        </span>
      ))}
      <small className="item-history__timeline-variants">
        {itemHistoryT('relatedVariants', lang)} {member.related_variant_count}
      </small>
      {member.group_timeline_includes_other_variants === true ? (
        <small className="item-history__timeline-scope">{itemHistoryT('groupTimelineCombined', lang)}</small>
      ) : null}
    </span>
  )
}

function Problem({ code, onRetry, catalogHref, onCatalogClick }: {
  code: ProblemCode
  onRetry: () => void
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const [title, note] = PROBLEM_COPY[code]
  return (
    <section className="public-result-message public-result-message--problem" role="status" data-error-code={code}>
      <p className="public-result-message__eyebrow">RETROSPECTIVE ITEM HISTORY</p>
      <h2>{itemHistoryT(title, lang)}</h2>
      <p>{itemHistoryT(note, lang)}</p>
      <div className="public-result-message__actions">
        <button type="button" onClick={onRetry}>{itemHistoryT('retry', lang)}</button>
        <a href={catalogHref} onClick={onCatalogClick}>{itemHistoryT('catalog', lang)}</a>
      </div>
    </section>
  )
}

function PublicationMeta({ document }: { document: ItemHistorySuccess }) {
  const lang = useLang()
  return (
    <div className="public-result-publication item-history__publication" data-testid="item-history-publication">
      <div><span>{itemHistoryT('published', lang)}</span><time dateTime={document.publication.published_at}>{formatDay(document.publication.published_at, lang)}</time></div>
      <div><span>{itemHistoryT('observedThrough', lang)}</span><time dateTime={document.snapshot.history_observed_through}>{formatDay(document.snapshot.history_observed_through, lang)}</time></div>
      <div><span>{itemHistoryT('events', lang)}</span><strong>{document.release.public_event_count.toLocaleString()}</strong></div>
    </div>
  )
}

export function ItemHistoryDetail({ document, onClose, cnyPerUsd = null }: {
  document: ItemHistorySuccess
  onClose: () => void
  cnyPerUsd?: string | null
}) {
  const lang = useLang()
  const member = document.members[0]
  if (!member) return null
  const name = itemName(member, lang)
  return (
    <>
      <button className="public-watchlist__back" type="button" onClick={onClose}>← {itemHistoryT('close', lang)}</button>
      <PublicationMeta document={document} />
      <section className="public-watchlist-detail item-history__detail" data-testid="item-history-detail">
        <div className="public-watchlist-detail__hero">
          <ItemImageSlot source={imageSource(member)} label={name} variant="detail" presentation="PRODUCT" testId="item-history-detail-image" />
          <div>
            <p>{itemHistoryT(poolKey(member), lang)} · {itemHistoryT('groupTimeline', lang)} · {itemHistoryT(timingKey(member), lang)}</p>
            <h2>{name}</h2>
            <div className="item-history__hero-facts">
              <div><span>{itemHistoryT('maximumMultiple', lang)}</span><strong>{formatMultiple(member.maximum_price_multiple)}×</strong></div>
              <div><span>{itemHistoryT('contraction', lang)}</span><strong>{formatPercent(member.supply_contraction_ratio)}</strong></div>
            </div>
            <dl>
              <div><dt>{itemHistoryT('supplyOnset', lang)}</dt><dd>{formatDay(member.supply_onset, lang)}</dd></div>
              <div><dt>{itemHistoryT('priceOnset', lang)}</dt><dd>{formatDay(member.price_onset, lang)}</dd></div>
              <div><dt>{itemHistoryT('peakOn', lang)}</dt><dd>{formatDay(member.peak_on, lang)}</dd></div>
              <div><dt>{itemHistoryT('statisticsWindow', lang)}</dt><dd>{formatDay(member.statistics_from, lang)} — {formatDay(member.statistics_through, lang)}</dd></div>
              <div><dt>{itemHistoryT('priceRange', lang)}</dt><dd>{formatLocalizedCurrencyFromUsd(member.baseline_ask_usd, lang, cnyPerUsd)} / {formatLocalizedCurrencyFromUsd(member.peak_ask_usd, lang, cnyPerUsd)}</dd></div>
              <div><dt>{itemHistoryT('supplyRange', lang)}</dt><dd>{member.baseline_supply} / {member.minimum_supply}</dd></div>
              <div><dt>{itemHistoryT('confidence', lang)}</dt><dd>{itemHistoryT(confidenceKey(member), lang)}</dd></div>
              <div><dt>{itemHistoryT('relatedVariants', lang)}</dt><dd>{member.related_variant_count}</dd></div>
              {member.display_episode_source_cycle_count !== undefined ? (
                <div><dt>{itemHistoryT('sourceCycles', lang)}</dt><dd>{member.display_episode_source_cycle_count}</dd></div>
              ) : null}
            </dl>
            {member.group_timeline_includes_other_variants === true ? (
              <p className="item-history__group-note">{itemHistoryT('groupTimelineCombined', lang)}</p>
            ) : null}
            {member.representative_native !== undefined ? (
              <section className="item-history__native" aria-label={itemHistoryT('representativeNativeCycle', lang)}>
                <h3>{itemHistoryT('representativeNativeCycle', lang)}</h3>
                <p>{itemHistoryT(timingKeyFor(member.representative_native.timing_relationship), lang)}</p>
                <dl>
                  <div><dt>{itemHistoryT('nativeSupplyOnset', lang)}</dt><dd>{formatDay(member.representative_native.supply_onset, lang)}</dd></div>
                  <div><dt>{itemHistoryT('nativePriceOnset', lang)}</dt><dd>{formatDay(member.representative_native.price_onset, lang)}</dd></div>
                  <div><dt>{itemHistoryT('peakOn', lang)}</dt><dd>{formatDay(member.representative_native.peak_on, lang)}</dd></div>
                  <div><dt>{itemHistoryT('nativeStatisticsWindow', lang)}</dt><dd>{formatDay(member.representative_native.statistics_from, lang)} — {formatDay(member.representative_native.statistics_through, lang)}</dd></div>
                </dl>
              </section>
            ) : null}
            <a className="public-watchlist-detail__product" href={productHref(member, lang)}>{itemHistoryT('product', lang)} →</a>
          </div>
        </div>
      </section>
    </>
  )
}

export function PublicItemHistoryPage({ gateway, cnyPerUsd = null, publicationId, selectedEventToken, currentHref, historyHref,
  catalogHref, onCatalogClick, onCurrentClick, onHistoryClick, onOpenMember, onCloseMember }: {
  gateway?: ItemHistoryPublicGateway
  cnyPerUsd?: string | null
  publicationId: string | null
  selectedEventToken: string | null
  currentHref: string
  historyHref: string
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onCurrentClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onHistoryClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onOpenMember: (publicationId: string, historyEventToken: string) => void
  onCloseMember: () => void
}) {
  const lang = useLang()
  const resolvedGateway = useMemo(() => gateway ?? new HttpItemHistoryPublicGateway(), [gateway])
  const api = useMemo(() => new ItemHistoryPublicApi(resolvedGateway), [resolvedGateway])
  const listCache = useMemo(() => new RetainedPublicationListCache<ReadyListState>(), [api])
  const [sort, setSort] = useState<ItemHistorySort>('MAX_PRICE_MULTIPLE_DESC')
  const [nameInput, setNameInput] = useState('')
  const [nameQuery, setNameQuery] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [list, setList] = useState<ListState>({ status: 'LOADING' })
  const [detail, setDetail] = useState<DetailState>({ status: 'IDLE' })
  const listScope = useMemo(() => ({}), [api, nameQuery, publicationId, reload, sort])
  const detailScope = useMemo(() => ({}), [api, publicationId, selectedEventToken, reload])
  const currentListScope = useRef(listScope)
  const currentDetailScope = useRef(detailScope)
  const loadMoreController = useRef<AbortController | null>(null)
  const renderDetail = selectedEventToken !== null && publicationId !== null
  currentListScope.current = listScope
  currentDetailScope.current = detailScope

  useEffect(() => {
    loadMoreController.current?.abort(); loadMoreController.current = null
    if (renderDetail) return
    const requestKey = itemHistoryListKey(publicationId, reload, sort, nameQuery)
    const cached = listCache.get(requestKey)
    if (cached !== undefined) { setList(cached); return }
    const controller = new AbortController()
    setList({ status: 'LOADING' })
    void api.list({
      publication_id: publicationId, page_size: 50, cursor: null, sort, name_query: nameQuery,
    }, { signal: controller.signal })
      .then((document) => {
        if (controller.signal.aborted || currentListScope.current !== listScope) return
        if (document.response_kind === 'ERROR') {
          const terminal = terminalPublicationCode(document.error.code)
          if (terminal !== null) {
            if (publicationId === null) listCache.invalidateActiveAliases()
            else listCache.invalidate(publicationId, terminal)
          }
          setList(document.error.code === 'NOT_FOUND' && nameQuery !== null
            ? { status: 'SEARCH_EMPTY' }
            : { status: 'PROBLEM', code: document.error.code })
        } else {
          const knownTerminal = listCache.knownTerminal(document.publication.publication_id)
          if (knownTerminal !== null) { setList({ status: 'PROBLEM', code: knownTerminal }); return }
          const ready: ReadyListState = {
            status: 'READY', document, members: document.members, nextCursor: document.next_cursor,
            consumedCursors: [], loadingMore: false, loadMoreProblem: null,
            cacheKeys: [...new Set([
              requestKey,
              itemHistoryListKey(document.publication.publication_id, reload, sort, nameQuery),
            ])],
            activeCacheKeys: publicationId === null ? [requestKey] : [],
          }
          listCache.remember(ready)
          setList(ready)
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && currentListScope.current === listScope) setList({ status: 'PROBLEM', code: failureCode(error) })
      })
    return () => controller.abort()
  }, [api, listCache, listScope, nameQuery, publicationId, reload, renderDetail, sort])

  useEffect(() => {
    if (selectedEventToken === null || publicationId === null) { setDetail({ status: 'IDLE' }); return }
    const knownTerminal = listCache.knownTerminal(publicationId)
    if (knownTerminal !== null) { setDetail({ status: 'PROBLEM', code: knownTerminal }); return }
    const controller = new AbortController()
    setDetail({ status: 'LOADING' })
    void api.detail({ publication_id: publicationId, history_event_token: selectedEventToken }, { signal: controller.signal })
      .then((document) => {
        if (controller.signal.aborted || currentDetailScope.current !== detailScope) return
        if (document.response_kind === 'ERROR') {
          const terminal = terminalPublicationCode(document.error.code)
          if (terminal !== null) listCache.invalidate(publicationId, terminal)
          setDetail({ status: 'PROBLEM', code: document.error.code })
        } else {
          const terminal = listCache.knownTerminal(publicationId)
          setDetail(terminal === null
            ? { status: 'READY', document }
            : { status: 'PROBLEM', code: terminal })
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && currentDetailScope.current === detailScope) setDetail({ status: 'PROBLEM', code: failureCode(error) })
      })
    return () => controller.abort()
  }, [api, detailScope, listCache, publicationId, selectedEventToken])

  const loadMore = useCallback(async () => {
    if (list.status !== 'READY' || list.nextCursor === null || list.loadingMore || loadMoreController.current) return
    const cursor = list.nextCursor
    const retainFailure = (code: ProblemCode) => {
      const settled: ReadyListState = { ...list, loadingMore: false, loadMoreProblem: code }
      listCache.remember(settled)
      setList(settled)
    }
    if (list.consumedCursors.includes(cursor)) { retainFailure('VALIDATION'); return }
    const controller = new AbortController(); loadMoreController.current = controller
    setList({ ...list, loadingMore: true, loadMoreProblem: null })
    try {
      const document = await api.list({
        publication_id: list.document.publication.publication_id,
        page_size: list.document.page_size,
        cursor,
        sort,
        name_query: nameQuery,
      }, { signal: controller.signal })
      if (controller.signal.aborted || currentListScope.current !== listScope) return
      if (document.response_kind === 'ERROR') {
        const terminal = terminalPublicationCode(document.error.code)
        if (terminal !== null) {
          listCache.invalidate(list.document.publication.publication_id, terminal)
          setList({ status: 'PROBLEM', code: document.error.code })
        } else {
          retainFailure(document.error.code)
        }
      } else if (!samePublication(list.document, document) || document.sort !== sort ||
          document.members.some((member) => list.members.some((current) => current.history_event_token === member.history_event_token))) {
        retainFailure('VALIDATION')
      } else {
        const settled: ReadyListState = { ...list, members: [...list.members, ...document.members], nextCursor: document.next_cursor,
          consumedCursors: [...list.consumedCursors, cursor], loadingMore: false, loadMoreProblem: null }
        listCache.remember(settled)
        setList(settled)
      }
    } catch (error: unknown) {
      if (!controller.signal.aborted && currentListScope.current === listScope) {
        retainFailure(failureCode(error))
      }
    } finally { if (loadMoreController.current === controller) loadMoreController.current = null }
  }, [api, list, listCache, listScope, nameQuery, sort])

  const submitNameSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextQuery = normalizeItemHistoryNameQuery(nameInput)
    if (nextQuery === nameQuery) setReload((value) => value + 1)
    else setNameQuery(nextQuery)
  }

  const clearNameSearch = () => {
    setNameInput('')
    setNameQuery(null)
  }

  return (
    <article className="public-result-page public-watchlist item-history" data-testid="public-item-history-page">
      <header className="public-result-page__header">
        <div><p>{itemHistoryT('eyebrow', lang)}</p><h1>{itemHistoryT('title', lang)}</h1><p>{itemHistoryT('intro', lang)}</p></div>
      </header>
      <ItemMonitorViewSwitcher history currentHref={currentHref} historyHref={historyHref} onCurrentClick={onCurrentClick} onHistoryClick={onHistoryClick} />
      {renderDetail ? (
        <>
          {detail.status === 'LOADING' || detail.status === 'IDLE' ? <div className="public-result-message public-result-message--loading" role="status"><span aria-hidden="true" /><p>{itemHistoryT('loading', lang)}</p></div> : null}
          {detail.status === 'PROBLEM' ? <Problem code={detail.code} onRetry={() => setReload((value) => value + 1)} catalogHref={catalogHref} onCatalogClick={onCatalogClick} /> : null}
          {detail.status === 'READY' ? <ItemHistoryDetail document={detail.document} onClose={onCloseMember} cnyPerUsd={cnyPerUsd} /> : null}
        </>
      ) : (
        <>
          <div className="item-history__toolbar">
            <span>{itemHistoryT('sortLabel', lang)}</span>
            <button type="button" className={sort === 'MAX_PRICE_MULTIPLE_DESC' ? 'is-active' : undefined} aria-pressed={sort === 'MAX_PRICE_MULTIPLE_DESC'} onClick={() => setSort('MAX_PRICE_MULTIPLE_DESC')}>{itemHistoryT('strongest', lang)}</button>
            <button type="button" className={sort === 'SUPPLY_ONSET_DESC' ? 'is-active' : undefined} aria-pressed={sort === 'SUPPLY_ONSET_DESC'} onClick={() => setSort('SUPPLY_ONSET_DESC')}>{itemHistoryT('newest', lang)}</button>
            <form className="item-monitor__toolbar-search" role="search" onSubmit={submitNameSearch}>
              <label>
                <input
                  aria-label={itemHistoryT('searchLabel', lang)}
                  type="search"
                  value={nameInput}
                  maxLength={100}
                  placeholder={itemHistoryT('searchPlaceholder', lang)}
                  onChange={(event) => setNameInput(event.target.value)}
                />
              </label>
              <button type="submit">{itemHistoryT('searchAction', lang)}</button>
              {nameQuery !== null || nameInput !== '' ? (
                <button type="button" onClick={clearNameSearch}>{itemHistoryT('clearSearch', lang)}</button>
              ) : null}
            </form>
          </div>
          {list.status === 'LOADING' ? <div className="public-result-message public-result-message--loading" role="status"><span aria-hidden="true" /><p>{itemHistoryT('loading', lang)}</p></div> : null}
          {list.status === 'SEARCH_EMPTY' ? <p className="item-history__search-empty" role="status">{itemHistoryT('noSearchResults', lang)}</p> : null}
          {list.status === 'PROBLEM' ? <Problem code={list.code} onRetry={() => setReload((value) => value + 1)} catalogHref={catalogHref} onCatalogClick={onCatalogClick} /> : null}
          {list.status === 'READY' ? <PublicationMeta document={list.document} /> : null}
          {list.status === 'READY' ? (
            <ol className="public-watchlist__list item-history__list" aria-label={itemHistoryT('title', lang)}>
              {list.members.map((member) => {
                const name = itemName(member, lang)
                return <li key={member.history_event_token}><button type="button" onClick={() => onOpenMember(list.document.publication.publication_id, member.history_event_token)}>
                  <ItemImageSlot source={imageSource(member)} label={name} variant="thumbnail" presentation="PRODUCT" testId={`item-history-image-${member.history_event_token}`} />
                  <span className="public-watchlist__item-copy"><strong>{name}</strong><span>{itemHistoryT(poolKey(member), lang)} · {itemHistoryT('groupTimeline', lang)} · {itemHistoryT(timingKey(member), lang)}</span></span>
                  <span className="item-history__metric"><small>{itemHistoryT('maximumMultiple', lang)}</small><strong>{formatMultiple(member.maximum_price_multiple)}×</strong></span>
                  <span className="item-history__metric"><small>{itemHistoryT('contraction', lang)}</small><strong>{formatPercent(member.supply_contraction_ratio)}</strong></span>
                  <HistoryTimeline member={member} />
                  <span className="public-watchlist__open">{itemHistoryT('open', lang)} →</span>
                </button></li>
              })}
            </ol>
          ) : null}
          {list.status === 'READY' && list.loadingMore ? <p role="status">{itemHistoryT('loading', lang)}</p> : null}
          {list.status === 'READY' && list.loadMoreProblem !== null ? (
            <div role="status" data-error-code={list.loadMoreProblem}>
              <p>{itemHistoryT(list.loadMoreProblem === 'VALIDATION' ? 'pageValidationFailed' : PROBLEM_COPY[list.loadMoreProblem][0], lang)}. {itemHistoryT('loadFailed', lang)}</p>
              <button type="button" onClick={() => setReload((value) => value + 1)}>{itemHistoryT('retry', lang)}</button>
            </div>
          ) : null}
          {list.status === 'READY' && list.nextCursor !== null && !list.loadingMore ? <button className="public-result-load-more" type="button" onClick={() => void loadMore()}>{itemHistoryT(list.loadMoreProblem === null ? 'loadMore' : 'retryLoadMore', lang)}</button> : null}
        </>
      )}
    </article>
  )
}
