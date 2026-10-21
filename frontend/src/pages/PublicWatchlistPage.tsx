import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { catalogMediaRoute } from '../adapter/catalogDisplayViewModel'
import { ItemMonitorPublicApi, type ItemMonitorPublicGateway } from '../api/ItemMonitorPublicApi'
import { HttpItemMonitorPublicGateway } from '../api/HttpItemMonitorPublicGateway'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { bindItemImageUrl, ITEM_IMAGE_NOT_PRODUCED, type ItemImageSource } from '../contract/itemImage'
import { useLang, type Lang } from '../i18n'
import { ItemMonitorValidationError } from '../wire/itemMonitorPublicApiDecode'
import type {
  ItemMonitorEmptyReason,
  ItemMonitorErrorCode,
  ItemMonitorMember,
  ItemMonitorSignalEvent,
  ItemMonitorSuccess,
} from '../wire/itemMonitorPublicApiTypes'
import { formatPublicInstant } from './publicResultShared'
import { itemMonitorT, type ItemMonitorStringKey } from './publicItemMonitorCopy'
import { ItemMonitorViewSwitcher } from './ItemMonitorViewSwitcher'
import { RetainedPublicationListCache, terminalPublicationCode } from './retainedPublicationList'

export { PublicItemHistoryPage } from './PublicItemHistoryPage'
export { PublicItemCurrentPage } from './PublicItemCurrentPage'

type ProblemCode = ItemMonitorErrorCode | 'TRANSPORT' | 'VALIDATION'
type ListState =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{
      status: 'READY'
      document: ItemMonitorSuccess
      members: readonly ItemMonitorMember[]
      nextCursor: string | null
      consumedCursors: readonly string[]
      loadingMore: boolean
      loadMoreFailed: boolean
      cacheKeys: readonly string[]
    }>
  | Readonly<{ status: 'PROBLEM'; code: ProblemCode }>
type ReadyListState = Extract<ListState, { status: 'READY' }>
type DetailState =
  | Readonly<{ status: 'IDLE' | 'LOADING' }>
  | Readonly<{ status: 'READY'; document: ItemMonitorSuccess }>
  | Readonly<{ status: 'PROBLEM'; code: ProblemCode }>

const PROBLEM_COPY = Object.freeze({
  INVALID_REQUEST: ['notFoundTitle', 'notFoundNote'],
  NOT_PUBLISHED: ['notPublishedTitle', 'notPublishedNote'],
  NOT_FOUND: ['notFoundTitle', 'notFoundNote'],
  WITHDRAWN: ['withdrawnTitle', 'withdrawnNote'],
  STALE_EXPIRED: ['expiredTitle', 'expiredNote'],
  CORRUPT_PUBLICATION: ['corruptTitle', 'corruptNote'],
  TEMPORARILY_UNAVAILABLE: ['temporaryTitle', 'temporaryNote'],
  TRANSPORT: ['temporaryTitle', 'temporaryNote'],
  VALIDATION: ['corruptTitle', 'corruptNote'],
} satisfies Record<ProblemCode, readonly [ItemMonitorStringKey, ItemMonitorStringKey]>)

const SIGNAL_COPY = Object.freeze({
  SUPPLY_LEAD: 'supplyLead',
  RECENT_PERSISTENT: 'recentPersistent',
  COINCIDENT: 'coincident',
} satisfies Record<ItemMonitorSignalEvent['signal_family'], ItemMonitorStringKey>)
const ENTRY_COPY = Object.freeze({
  FIRST_ENTRY: 'firstEntry',
  REENTRY: 'reentry',
} satisfies Record<ItemMonitorSignalEvent['entry_kind'], ItemMonitorStringKey>)

function failureCode(error: unknown): ProblemCode {
  return error instanceof ItemMonitorValidationError ? 'VALIDATION' : 'TRANSPORT'
}

function itemMonitorListKey(publicationId: string | null, reload: number): string {
  return JSON.stringify([publicationId ?? 'ACTIVE', reload, 'SIGNAL_TIME_DESC'])
}

function imageSource(member: ItemMonitorMember): ItemImageSource {
  if (member.catalog.media.status === 'NOT_PRODUCED') return ITEM_IMAGE_NOT_PRODUCED
  const assetId = member.catalog.version_context.media_asset_version_id
  return assetId === null ? ITEM_IMAGE_NOT_PRODUCED : bindItemImageUrl(catalogMediaRoute(member.catalog.media.media_key, assetId))
}

function itemName(member: ItemMonitorMember, lang: Lang): string {
  return lang === 'zh' ? member.catalog.localized_name.zh_cn : member.catalog.localized_name.en
}

function formatDay(value: string | null, lang: Lang): string {
  if (value === null) return '—'
  const date = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(date)
}

function productHref(member: ItemMonitorMember, lang: Lang): string {
  const params = new URLSearchParams({ unit: member.catalog.analysis_unit_id, snapshot: member.catalog_snapshot_id })
  if (lang === 'en') params.set('lang', 'en')
  return `/research?${params}`
}

function samePublication(left: ItemMonitorSuccess, right: ItemMonitorSuccess): boolean {
  return left.publication.publication_id === right.publication.publication_id &&
    left.publication.manifest_sha256 === right.publication.manifest_sha256 &&
    left.publication.rights_revision === right.publication.rights_revision &&
    left.snapshot.input_sha256 === right.snapshot.input_sha256 &&
    left.snapshot.catalog_snapshot_id === right.snapshot.catalog_snapshot_id &&
    left.release.release_id === right.release.release_id &&
    left.release.public_member_count === right.release.public_member_count &&
    left.freshness.evaluated_at === right.freshness.evaluated_at
}

function follows(before: ItemMonitorMember, after: ItemMonitorMember): boolean {
  const timeOrder = Date.parse(before.signal_observed_at) - Date.parse(after.signal_observed_at)
  return timeOrder > 0 || (timeOrder === 0 && before.catalog.localized_name.en <= after.catalog.localized_name.en)
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
      <p className="public-result-message__eyebrow">EXPERIMENTAL ITEM MONITOR</p>
      <h2>{itemMonitorT(title, lang)}</h2>
      <p>{itemMonitorT(note, lang)}</p>
      <div className="public-result-message__actions">
        <button type="button" onClick={onRetry}>{itemMonitorT('retry', lang)}</button>
        <a href={catalogHref} onClick={onCatalogClick}>{itemMonitorT('catalog', lang)}</a>
      </div>
    </section>
  )
}

function PublicationMeta({ document }: { document: ItemMonitorSuccess }) {
  const lang = useLang()
  const freshnessKey = document.freshness.status === 'CURRENT' ? 'current' : document.freshness.status === 'STALE_RETAINED' ? 'stale' : 'unavailable'
  return (
    <div className="public-result-publication public-item-monitor__publication" data-testid="item-monitor-publication">
      <div><span>{itemMonitorT('dataDate', lang)}</span><time dateTime={document.freshness.headline_data_date ?? undefined}>{formatDay(document.freshness.headline_data_date, lang)}</time></div>
      <div><span>{document.publication.clock_disclosure ? itemMonitorT('publicationClockLowerBound', lang) : itemMonitorT('published', lang)}</span>{document.publication.clock_disclosure ? <><time dateTime={document.publication.clock_disclosure.known_not_before_at}>{formatPublicInstant(document.publication.clock_disclosure.known_not_before_at, lang)}</time><small>{itemMonitorT('publicationClockUnknown', lang)}</small></> : <time dateTime={document.publication.published_at}>{formatPublicInstant(document.publication.published_at, lang)}</time>}</div>
      <div><span>{itemMonitorT('members', lang)}</span><strong>{document.release.public_member_count}</strong></div>
      <strong className={document.freshness.status === 'CURRENT' ? 'is-fresh' : 'is-stale'}>{itemMonitorT(freshnessKey, lang)}</strong>
    </div>
  )
}

function SignalTags({ events }: { events: readonly ItemMonitorSignalEvent[] }) {
  const lang = useLang()
  return (
    <div className="public-item-monitor__signals">
      {events.map((event) => (
        <span key={event.signal_family}>{itemMonitorT(SIGNAL_COPY[event.signal_family], lang)} · {itemMonitorT(ENTRY_COPY[event.entry_kind], lang)}</span>
      ))}
    </div>
  )
}

function EmptyState({ reason, catalogHref, onCatalogClick }: {
  reason: Exclude<ItemMonitorEmptyReason, null>
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const initial = reason === 'NO_QUALIFIED_OBSERVATION'
  return (
    <section className="public-watchlist__empty public-item-monitor__empty" role="status" data-empty-reason={reason}>
      <h2>{itemMonitorT(initial ? 'emptyInitialTitle' : 'emptyMeasuredTitle', lang)}</h2>
      <p>{itemMonitorT(initial ? 'emptyInitialNote' : 'emptyMeasuredNote', lang)}</p>
      <a href={catalogHref} onClick={onCatalogClick}>{itemMonitorT('catalog', lang)}</a>
    </section>
  )
}

function Detail({ document, onClose }: { document: ItemMonitorSuccess; onClose: () => void }) {
  const lang = useLang()
  const member = document.members[0]
  if (!member) return null
  const name = itemName(member, lang)
  return (
    <>
      <button className="public-watchlist__back" type="button" onClick={onClose}>← {itemMonitorT('close', lang)}</button>
      <PublicationMeta document={document} />
      <section className="public-watchlist-detail public-item-monitor__detail" data-testid="item-monitor-detail">
        <div className="public-watchlist-detail__hero">
          <ItemImageSlot source={imageSource(member)} label={name} variant="detail" presentation="PRODUCT" testId="item-monitor-detail-image" />
          <div>
            <p>EXPERIMENTAL OBSERVATION</p><h2>{name}</h2><SignalTags events={member.signal_events} />
            <dl>
              <div><dt>{itemMonitorT('signalTime', lang)}</dt><dd>{formatPublicInstant(member.signal_observed_at, lang)}</dd></div>
              <div><dt>{itemMonitorT('coverage', lang)}</dt><dd>{member.coverage.qualified_paired_slots} / {member.coverage.expected_slots}</dd></div>
              <div><dt>{itemMonitorT('missingRun', lang)}</dt><dd>{member.coverage.longest_missing_run}</dd></div>
              <div><dt>{itemMonitorT('earlierEvents', lang)}</dt><dd>{member.earlier_signal_event_count}</dd></div>
            </dl>
            <a className="public-watchlist-detail__product" href={productHref(member, lang)}>{itemMonitorT('product', lang)} →</a>
          </div>
        </div>
      </section>
    </>
  )
}

export function PublicWatchlistPage({ gateway, publicationId, selectedUnitId, catalogHref, onCatalogClick, onOpenMember, onCloseMember,
  currentHref, historyHref, onCurrentClick, onHistoryClick }: {
  gateway?: ItemMonitorPublicGateway
  publicationId: string | null
  selectedUnitId: string | null
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onOpenMember: (publicationId: string, analysisUnitToken: string) => void
  onCloseMember: () => void
  currentHref?: string
  historyHref?: string
  onCurrentClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  onHistoryClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const resolvedGateway = useMemo(() => gateway ?? new HttpItemMonitorPublicGateway(), [gateway])
  const api = useMemo(() => new ItemMonitorPublicApi(resolvedGateway), [resolvedGateway])
  const listCache = useMemo(() => new RetainedPublicationListCache<ReadyListState>(), [api])
  const [reload, setReload] = useState(0)
  const [list, setList] = useState<ListState>({ status: 'LOADING' })
  const [detail, setDetail] = useState<DetailState>({ status: 'IDLE' })
  const listScope = useMemo(() => ({}), [api, publicationId, reload])
  const detailScope = useMemo(() => ({}), [api, publicationId, selectedUnitId, reload])
  const currentListScope = useRef(listScope)
  const currentDetailScope = useRef(detailScope)
  const loadMoreController = useRef<AbortController | null>(null)
  const renderDetail = selectedUnitId !== null && publicationId !== null
  currentListScope.current = listScope
  currentDetailScope.current = detailScope

  useEffect(() => {
    loadMoreController.current?.abort(); loadMoreController.current = null
    if (renderDetail) return
    const requestKey = itemMonitorListKey(publicationId, reload)
    const cached = listCache.get(requestKey)
    if (cached !== undefined) { setList(cached); return }
    const controller = new AbortController()
    setList({ status: 'LOADING' })
    void api.list({ publication_id: publicationId, page_size: 50, cursor: null, sort: 'SIGNAL_TIME_DESC' }, { signal: controller.signal })
      .then((document) => {
        if (controller.signal.aborted || currentListScope.current !== listScope) return
        if (document.response_kind === 'ERROR') {
          const terminal = terminalPublicationCode(document.error.code)
          if (publicationId !== null && terminal !== null) listCache.invalidate(publicationId, terminal)
          setList({ status: 'PROBLEM', code: document.error.code })
          return
        }
        const knownTerminal = listCache.knownTerminal(document.publication.publication_id)
        if (knownTerminal !== null) { setList({ status: 'PROBLEM', code: knownTerminal }); return }
        const ready: ReadyListState = {
          status: 'READY', document, members: document.members, nextCursor: document.next_cursor,
          consumedCursors: [], loadingMore: false, loadMoreFailed: false,
          cacheKeys: [...new Set([
            requestKey,
            itemMonitorListKey(document.publication.publication_id, reload),
          ])],
        }
        listCache.remember(ready)
        setList(ready)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && currentListScope.current === listScope) setList({ status: 'PROBLEM', code: failureCode(error) })
      })
    return () => controller.abort()
  }, [api, listCache, listScope, publicationId, reload, renderDetail])

  useEffect(() => {
    if (selectedUnitId === null || publicationId === null) { setDetail({ status: 'IDLE' }); return }
    const knownTerminal = listCache.knownTerminal(publicationId)
    if (knownTerminal !== null) { setDetail({ status: 'PROBLEM', code: knownTerminal }); return }
    const controller = new AbortController()
    setDetail({ status: 'LOADING' })
    void api.detail({ publication_id: publicationId, analysis_unit_token: selectedUnitId }, { signal: controller.signal })
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
  }, [api, detailScope, listCache, publicationId, selectedUnitId])

  const loadMore = useCallback(async () => {
    if (list.status !== 'READY' || list.nextCursor === null || list.loadingMore || loadMoreController.current) return
    const cursor = list.nextCursor
    if (list.consumedCursors.includes(cursor)) { setList({ status: 'PROBLEM', code: 'VALIDATION' }); return }
    const controller = new AbortController(); loadMoreController.current = controller
    setList({ ...list, loadingMore: true, loadMoreFailed: false })
    try {
      const document = await api.list({ publication_id: list.document.publication.publication_id, page_size: list.document.page_size, cursor, sort: 'SIGNAL_TIME_DESC' }, { signal: controller.signal })
      if (controller.signal.aborted || currentListScope.current !== listScope) return
      if (document.response_kind === 'ERROR') {
        if (document.error.code === 'TEMPORARILY_UNAVAILABLE') {
          const settled = { ...list, loadingMore: false, loadMoreFailed: true }
          listCache.remember(settled)
          setList(settled)
        } else {
          const terminal = terminalPublicationCode(document.error.code)
          if (terminal !== null) listCache.invalidate(list.document.publication.publication_id, terminal)
          setList({ status: 'PROBLEM', code: document.error.code })
        }
      } else if (!samePublication(list.document, document) ||
          document.members.some((member) => list.members.some((current) => current.analysis_unit_token === member.analysis_unit_token)) ||
          (list.members.at(-1) !== undefined && document.members[0] !== undefined && !follows(list.members.at(-1)!, document.members[0]))) {
        setList({ status: 'PROBLEM', code: 'VALIDATION' })
      } else {
        const settled: ReadyListState = { ...list, members: [...list.members, ...document.members], nextCursor: document.next_cursor,
          consumedCursors: [...list.consumedCursors, cursor], loadingMore: false, loadMoreFailed: false }
        listCache.remember(settled)
        setList(settled)
      }
    } catch (error: unknown) {
      if (!controller.signal.aborted && currentListScope.current === listScope) {
        if (error instanceof ItemMonitorValidationError) setList({ status: 'PROBLEM', code: 'VALIDATION' })
        else {
          const settled = { ...list, loadingMore: false, loadMoreFailed: true }
          listCache.remember(settled)
          setList(settled)
        }
      }
    } finally { if (loadMoreController.current === controller) loadMoreController.current = null }
  }, [api, list, listCache, listScope])

  return (
    <article className="public-result-page public-watchlist public-item-monitor" data-testid="public-watchlist-page">
      <header className="public-result-page__header">
        <div><p>{itemMonitorT('eyebrow', lang)}</p><h1>{itemMonitorT('title', lang)}</h1><p>{itemMonitorT('intro', lang)}</p></div>
        <strong>{itemMonitorT('current', lang)}</strong>
      </header>
      {currentHref && historyHref && onCurrentClick && onHistoryClick ? (
        <ItemMonitorViewSwitcher history={false} currentHref={currentHref} historyHref={historyHref}
          onCurrentClick={onCurrentClick} onHistoryClick={onHistoryClick} />
      ) : null}
      <p className="public-item-monitor__disclosure" role="note">{itemMonitorT('disclosure', lang)}</p>
      {renderDetail ? (
        <>
          {detail.status === 'LOADING' || detail.status === 'IDLE' ? <div className="public-result-message public-result-message--loading" role="status"><span aria-hidden="true" /><p>{itemMonitorT('loading', lang)}</p></div> : null}
          {detail.status === 'PROBLEM' ? <Problem code={detail.code} onRetry={() => setReload((value) => value + 1)} catalogHref={catalogHref} onCatalogClick={onCatalogClick} /> : null}
          {detail.status === 'READY' ? <Detail document={detail.document} onClose={onCloseMember} /> : null}
        </>
      ) : (
        <>
          {list.status === 'LOADING' ? <div className="public-result-message public-result-message--loading" role="status"><span aria-hidden="true" /><p>{itemMonitorT('loading', lang)}</p></div> : null}
          {list.status === 'PROBLEM' ? <Problem code={list.code} onRetry={() => setReload((value) => value + 1)} catalogHref={catalogHref} onCatalogClick={onCatalogClick} /> : null}
          {list.status === 'READY' ? <PublicationMeta document={list.document} /> : null}
          {list.status === 'READY' && list.document.response_kind === 'EMPTY' && list.document.empty_reason !== null ? <EmptyState reason={list.document.empty_reason} catalogHref={catalogHref} onCatalogClick={onCatalogClick} /> : null}
          {list.status === 'READY' && list.document.response_kind !== 'EMPTY' ? (
            <ol className="public-watchlist__list" aria-label={itemMonitorT('title', lang)}>
              {list.members.map((member) => {
                const name = itemName(member, lang)
                return <li key={member.analysis_unit_token}><button type="button" onClick={() => onOpenMember(list.document.publication.publication_id, member.analysis_unit_token)}>
                  <ItemImageSlot source={imageSource(member)} label={name} variant="thumbnail" presentation="PRODUCT" testId={`item-monitor-image-${member.analysis_unit_token}`} />
                  <span className="public-watchlist__item-copy"><strong>{name}</strong><span>{formatPublicInstant(member.signal_observed_at, lang)}</span></span>
                  <SignalTags events={member.signal_events} /><span className="public-watchlist__open">{itemMonitorT('open', lang)} →</span>
                </button></li>
              })}
            </ol>
          ) : null}
          {list.status === 'READY' && list.loadingMore ? <p role="status">{itemMonitorT('loading', lang)}</p> : null}
          {list.status === 'READY' && list.loadMoreFailed ? <p role="status">{itemMonitorT('loadFailed', lang)}</p> : null}
          {list.status === 'READY' && list.nextCursor !== null && !list.loadingMore ? <button className="public-result-load-more" type="button" onClick={() => void loadMore()}>{itemMonitorT('loadMore', lang)}</button> : null}
        </>
      )}
    </article>
  )
}
