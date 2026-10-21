import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { catalogMediaRoute } from '../adapter/catalogDisplayViewModel'
import { HttpItemCurrentPublicGateway } from '../api/HttpItemCurrentPublicGateway'
import { ItemCurrentAvailabilityError, ItemCurrentPublicApi, type ItemCurrentPublicGateway } from '../api/ItemCurrentPublicApi'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { bindItemImageUrl, ITEM_IMAGE_NOT_PRODUCED, type ItemImageSource } from '../contract/itemImage'
import { useLang, type Lang } from '../i18n'
import { ItemCurrentValidationError } from '../wire/itemCurrentPublicApiDecode'
import type {
  ItemCurrentErrorCode,
  ItemCurrentMember,
  ItemCurrentSort,
  ItemCurrentSuccess,
} from '../wire/itemCurrentPublicApiTypes'
import { ItemMonitorViewSwitcher } from './ItemMonitorViewSwitcher'
import { itemCurrentT, type ItemCurrentStringKey } from './publicItemCurrentCopy'
import { RetainedPublicationListCache, terminalPublicationCode } from './retainedPublicationList'

type ProblemCode = ItemCurrentErrorCode | 'TRANSPORT' | 'VALIDATION'
type ListState =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'SEARCH_EMPTY' }>
  | Readonly<{
      status: 'READY'
      document: ItemCurrentSuccess
      members: readonly ItemCurrentMember[]
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
  | Readonly<{ status: 'READY'; document: ItemCurrentSuccess }>
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
} satisfies Record<ProblemCode, readonly [ItemCurrentStringKey, ItemCurrentStringKey]>)

const STAGE_COPY = Object.freeze({
  SUPPLY_PRESSURE: 'supplyPressure',
  PRICE_RESPONSE_ONLY: 'priceOnly',
  PAIRED_RESPONSE: 'paired',
} satisfies Record<ItemCurrentMember['stage'], ItemCurrentStringKey>)
const CONFIDENCE_COPY = Object.freeze({
  STANDARD: 'standardConfidence',
  LOW_BASELINE_DEPTH: 'lowBaselineConfidence',
} satisfies Record<ItemCurrentMember['supply_measurement_confidence'], ItemCurrentStringKey>)
const COVERAGE_COPY = Object.freeze({
  FULL: 'fullCoverage',
  HIGH_COVERAGE: 'highCoverage',
  PARTIAL_USABLE: 'partialCoverage',
} satisfies Record<ItemCurrentMember['coverage']['quality'], ItemCurrentStringKey>)

function failureCode(error: unknown): ProblemCode {
  if (error instanceof ItemCurrentAvailabilityError) return 'TEMPORARILY_UNAVAILABLE'
  return error instanceof ItemCurrentValidationError ? 'VALIDATION' : 'TRANSPORT'
}

function itemCurrentListKey(publicationId: string | null, reload: number, sort: ItemCurrentSort,
  nameQuery: string | null): string {
  return JSON.stringify([publicationId ?? 'ACTIVE', reload, sort, nameQuery])
}

function imageSource(member: ItemCurrentMember): ItemImageSource {
  if (member.catalog.media.status === 'NOT_PRODUCED') return ITEM_IMAGE_NOT_PRODUCED
  const assetId = member.catalog.version_context.media_asset_version_id
  return assetId === null ? ITEM_IMAGE_NOT_PRODUCED : bindItemImageUrl(catalogMediaRoute(member.catalog.media.media_key, assetId))
}

function itemName(member: ItemCurrentMember, lang: Lang): string {
  return lang === 'zh' ? member.catalog.localized_name.zh_cn : member.catalog.localized_name.en
}

export function normalizeItemCurrentNameQuery(value: string): string | null {
  const normalized = value.trim().replace(/\s+/gu, ' ')
  return normalized === '' ? null : normalized
}

function formatDay(value: string | null, lang: Lang): string {
  if (value === null) return '—'
  const source = value.includes('T') ? value : `${value}T00:00:00.000Z`
  const date = new Date(source)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(date)
}

function formatPercent(value: string | null): string {
  if (value === null) return '—'
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(Number(value) * 100)}%`
}

function productHref(member: ItemCurrentMember, lang: Lang): string {
  const params = new URLSearchParams({ unit: member.catalog.analysis_unit_id, snapshot: member.catalog_snapshot_id })
  if (lang === 'en') params.set('lang', 'en')
  return `/research?${params}`
}

function firstTrigger(member: ItemCurrentMember): string | null {
  return [member.supply_onset, member.price_onset]
    .filter((value): value is string => value !== null)
    .sort()
    .at(0) ?? null
}

export function samePublication(left: ItemCurrentSuccess, right: ItemCurrentSuccess): boolean {
  // Freshness is evaluated per HTTP response, so its clock advances between pages.
  return left.publication.publication_id === right.publication.publication_id &&
    left.publication.manifest_sha256 === right.publication.manifest_sha256 &&
    left.publication.rights_revision === right.publication.rights_revision &&
    left.snapshot.input_head_sha256 === right.snapshot.input_head_sha256 &&
    left.snapshot.catalog_snapshot_id === right.snapshot.catalog_snapshot_id &&
    left.release.policy_sha256 === right.release.policy_sha256 &&
    left.release.public_stage_count === right.release.public_stage_count
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
      <p className="public-result-message__eyebrow">CURRENT ITEM MONITOR</p>
      <h2>{itemCurrentT(title, lang)}</h2>
      <p>{itemCurrentT(note, lang)}</p>
      <div className="public-result-message__actions">
        <button type="button" onClick={onRetry}>{itemCurrentT('retry', lang)}</button>
        <a href={catalogHref} onClick={onCatalogClick}>{itemCurrentT('catalog', lang)}</a>
      </div>
    </section>
  )
}

function PublicationMeta({ document }: { document: ItemCurrentSuccess }) {
  const lang = useLang()
  return (
    <div className="public-result-publication item-current__publication" data-testid="item-current-publication">
      <div><span>{itemCurrentT('dataDate', lang)}</span><time dateTime={document.freshness.headline_data_date}>{formatDay(document.freshness.headline_data_date, lang)}</time></div>
      <div><span>{itemCurrentT('published', lang)}</span><time dateTime={document.publication.published_at}>{formatDay(document.publication.published_at, lang)}</time></div>
      <div><span>{itemCurrentT('stages', lang)}</span><strong>{document.release.public_stage_count.toLocaleString()}</strong></div>
      <strong className={document.freshness.status === 'CURRENT' ? 'is-fresh' : 'is-stale'}>{itemCurrentT(document.freshness.status === 'CURRENT' ? 'current' : 'stale', lang)}</strong>
    </div>
  )
}

function timingLabel(member: ItemCurrentMember): ItemCurrentStringKey {
  if (member.timing_relationship === 'SUPPLY_LEADS') return 'supplyLeads'
  if (member.timing_relationship === 'PRICE_LEADS') return 'priceLeads'
  if (member.timing_relationship === 'CONCURRENT_DAILY') return 'concurrent'
  return member.first_leg === 'SUPPLY' ? 'supplyFirst' : 'priceFirst'
}

function Detail({ document, onClose }: { document: ItemCurrentSuccess; onClose: () => void }) {
  const lang = useLang()
  const member = document.members[0]
  if (!member) return null
  const name = itemName(member, lang)
  return (
    <>
      <button className="public-watchlist__back" type="button" onClick={onClose}>← {itemCurrentT('close', lang)}</button>
      <PublicationMeta document={document} />
      <section className="public-watchlist-detail item-current__detail" data-testid="item-current-detail">
        <div className="public-watchlist-detail__hero">
          <ItemImageSlot source={imageSource(member)} label={name} variant="detail" presentation="PRODUCT" testId="item-current-detail-image" />
          <div>
            <p>{itemCurrentT(STAGE_COPY[member.stage], lang)} · {itemCurrentT(timingLabel(member), lang)}</p>
            <h2>{name}</h2>
            <div className="item-history__hero-facts">
              <div><span>{itemCurrentT('firstTriggered', lang)}</span><strong>{formatDay(firstTrigger(member), lang)}</strong></div>
              <div><span>{itemCurrentT('contraction', lang)}</span><strong>{member.supply_contraction_ratio === null ? itemCurrentT('noSupplyMeasure', lang) : formatPercent(member.supply_contraction_ratio)}</strong></div>
            </div>
            <dl>
              <div><dt>{itemCurrentT('supplyOnset', lang)}</dt><dd>{formatDay(member.supply_onset, lang)}</dd></div>
              <div><dt>{itemCurrentT('priceOnset', lang)}</dt><dd>{formatDay(member.price_onset, lang)}</dd></div>
              <div><dt>{itemCurrentT('pairingDeadline', lang)}</dt><dd>{formatDay(member.pairing_deadline_on, lang)}</dd></div>
              <div><dt>{itemCurrentT('confidence', lang)}</dt><dd>{itemCurrentT(CONFIDENCE_COPY[member.supply_measurement_confidence], lang)}</dd></div>
              <div><dt>{itemCurrentT('coverage', lang)}</dt><dd>{member.coverage.qualified_paired_slots} / {member.coverage.expected_slots} · {itemCurrentT(COVERAGE_COPY[member.coverage.quality], lang)}</dd></div>
              <div><dt>{itemCurrentT('missingRun', lang)}</dt><dd>{member.coverage.longest_missing_run}</dd></div>
            </dl>
            <a className="public-watchlist-detail__product" href={productHref(member, lang)}>{itemCurrentT('product', lang)} →</a>
          </div>
        </div>
      </section>
    </>
  )
}

export function PublicItemCurrentPage({ gateway, publicationId, selectedStageToken, currentHref, historyHref,
  catalogHref, onCatalogClick, onCurrentClick, onHistoryClick, onOpenMember, onCloseMember }: {
  gateway?: ItemCurrentPublicGateway
  publicationId: string | null
  selectedStageToken: string | null
  currentHref: string
  historyHref: string
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onCurrentClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onHistoryClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onOpenMember: (publicationId: string, stageToken: string) => void
  onCloseMember: () => void
}) {
  const lang = useLang()
  const resolvedGateway = useMemo(() => gateway ?? new HttpItemCurrentPublicGateway(), [gateway])
  const api = useMemo(() => new ItemCurrentPublicApi(resolvedGateway), [resolvedGateway])
  const listCache = useMemo(() => new RetainedPublicationListCache<ReadyListState>(), [api])
  const [sort, setSort] = useState<ItemCurrentSort>('RELIABLE_SIGNAL_DESC')
  const [nameInput, setNameInput] = useState('')
  const [nameQuery, setNameQuery] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [list, setList] = useState<ListState>({ status: 'LOADING' })
  const [detail, setDetail] = useState<DetailState>({ status: 'IDLE' })
  const listScope = useMemo(() => ({}), [api, nameQuery, publicationId, reload, sort])
  const detailScope = useMemo(() => ({}), [api, publicationId, selectedStageToken, reload])
  const currentListScope = useRef(listScope)
  const currentDetailScope = useRef(detailScope)
  const loadMoreController = useRef<AbortController | null>(null)
  const renderDetail = selectedStageToken !== null && publicationId !== null
  currentListScope.current = listScope
  currentDetailScope.current = detailScope

  useEffect(() => {
    loadMoreController.current?.abort(); loadMoreController.current = null
    if (renderDetail) return
    const requestKey = itemCurrentListKey(publicationId, reload, sort, nameQuery)
    const cached = listCache.get(requestKey)
    if (cached !== undefined) { setList(cached); return }
    const controller = new AbortController()
    setList({ status: 'LOADING' })
    void api.list({ publication_id: publicationId, page_size: 50, cursor: null, sort, name_query: nameQuery }, { signal: controller.signal })
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
          return
        }
        const knownTerminal = listCache.knownTerminal(document.publication.publication_id)
        if (knownTerminal !== null) { setList({ status: 'PROBLEM', code: knownTerminal }); return }
        const ready: ReadyListState = {
          status: 'READY', document, members: document.members, nextCursor: document.next_cursor,
          consumedCursors: [], loadingMore: false, loadMoreProblem: null,
          cacheKeys: [...new Set([
            requestKey,
            itemCurrentListKey(document.publication.publication_id, reload, sort, nameQuery),
          ])],
          activeCacheKeys: publicationId === null ? [requestKey] : [],
        }
        listCache.remember(ready)
        setList(ready)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && currentListScope.current === listScope) setList({ status: 'PROBLEM', code: failureCode(error) })
      })
    return () => controller.abort()
  }, [api, listCache, listScope, nameQuery, publicationId, reload, renderDetail, sort])

  useEffect(() => {
    if (selectedStageToken === null || publicationId === null) { setDetail({ status: 'IDLE' }); return }
    const knownTerminal = listCache.knownTerminal(publicationId)
    if (knownTerminal !== null) { setDetail({ status: 'PROBLEM', code: knownTerminal }); return }
    const controller = new AbortController()
    setDetail({ status: 'LOADING' })
    void api.detail({ publication_id: publicationId, stage_token: selectedStageToken }, { signal: controller.signal })
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
  }, [api, detailScope, listCache, publicationId, selectedStageToken])

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
          document.members.some((member) => list.members.some((current) => current.stage_token === member.stage_token))) {
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
    const nextQuery = normalizeItemCurrentNameQuery(nameInput)
    if (nextQuery === nameQuery) setReload((value) => value + 1)
    else setNameQuery(nextQuery)
  }

  const clearNameSearch = () => {
    setNameInput('')
    setNameQuery(null)
  }

  return (
    <article className="public-result-page public-watchlist item-current" data-testid="public-item-current-page">
      <header className="public-result-page__header">
        <div><p>{itemCurrentT('eyebrow', lang)}</p><h1>{itemCurrentT('title', lang)}</h1><p>{itemCurrentT('intro', lang)}</p></div>
      </header>
      <ItemMonitorViewSwitcher history={false} currentHref={currentHref} historyHref={historyHref} onCurrentClick={onCurrentClick} onHistoryClick={onHistoryClick} />
      {renderDetail ? (
        <>
          {detail.status === 'LOADING' || detail.status === 'IDLE' ? <div className="public-result-message public-result-message--loading" role="status"><span aria-hidden="true" /><p>{itemCurrentT('loading', lang)}</p></div> : null}
          {detail.status === 'PROBLEM' ? <Problem code={detail.code} onRetry={() => setReload((value) => value + 1)} catalogHref={catalogHref} onCatalogClick={onCatalogClick} /> : null}
          {detail.status === 'READY' ? <Detail document={detail.document} onClose={onCloseMember} /> : null}
        </>
      ) : (
        <>
          <div className="item-history__toolbar">
            <span>{itemCurrentT('sortLabel', lang)}</span>
            <button type="button" className={sort === 'RELIABLE_SIGNAL_DESC' ? 'is-active' : undefined} aria-pressed={sort === 'RELIABLE_SIGNAL_DESC'} onClick={() => setSort('RELIABLE_SIGNAL_DESC')}>{itemCurrentT('reliableSignal', lang)}</button>
            <button type="button" className={sort === 'DETECTED_DESC' ? 'is-active' : undefined} aria-pressed={sort === 'DETECTED_DESC'} onClick={() => setSort('DETECTED_DESC')}>{itemCurrentT('latest', lang)}</button>
            <button type="button" className={sort === 'SUPPLY_CONTRACTION_DESC' ? 'is-active' : undefined} aria-pressed={sort === 'SUPPLY_CONTRACTION_DESC'} onClick={() => setSort('SUPPLY_CONTRACTION_DESC')}>{itemCurrentT('contractionSort', lang)}</button>
            <form className="item-monitor__toolbar-search" role="search" onSubmit={submitNameSearch}>
              <label>
                <input
                  type="search"
                  aria-label={itemCurrentT('searchLabel', lang)}
                  value={nameInput}
                  maxLength={100}
                  placeholder={itemCurrentT('searchPlaceholder', lang)}
                  onChange={(event) => setNameInput(event.target.value)}
                />
              </label>
              <button type="submit">{itemCurrentT('searchAction', lang)}</button>
              {nameQuery !== null || nameInput !== '' ? (
                <button type="button" onClick={clearNameSearch}>{itemCurrentT('clearSearch', lang)}</button>
              ) : null}
            </form>
          </div>
          {list.status === 'LOADING' ? <div className="public-result-message public-result-message--loading" role="status"><span aria-hidden="true" /><p>{itemCurrentT('loading', lang)}</p></div> : null}
          {list.status === 'SEARCH_EMPTY' ? <p className="item-history__search-empty" role="status">{itemCurrentT('noSearchResults', lang)}</p> : null}
          {list.status === 'PROBLEM' ? <Problem code={list.code} onRetry={() => setReload((value) => value + 1)} catalogHref={catalogHref} onCatalogClick={onCatalogClick} /> : null}
          {list.status === 'READY' ? <PublicationMeta document={list.document} /> : null}
          {list.status === 'READY' && list.document.response_kind === 'EMPTY' ? <section className="public-watchlist__empty" role="status"><h2>{itemCurrentT('emptyTitle', lang)}</h2><p>{itemCurrentT('emptyNote', lang)}</p><a href={catalogHref} onClick={onCatalogClick}>{itemCurrentT('catalog', lang)}</a></section> : null}
          {list.status === 'READY' && list.document.response_kind === 'RESULT' ? (
            <ol className="public-watchlist__list item-current__list" aria-label={itemCurrentT('title', lang)}>
              {list.members.map((member) => {
                const name = itemName(member, lang)
                return <li key={member.stage_token}><button type="button" onClick={() => onOpenMember(list.document.publication.publication_id, member.stage_token)}>
                  <ItemImageSlot source={imageSource(member)} label={name} variant="thumbnail" presentation="PRODUCT" testId={`item-current-image-${member.stage_token}`} />
                  <span className="public-watchlist__item-copy"><strong>{name}</strong><span>{itemCurrentT(STAGE_COPY[member.stage], lang)} · {itemCurrentT(timingLabel(member), lang)}</span></span>
                  <span className="item-history__metric"><small>{itemCurrentT('firstTriggered', lang)}</small><strong>{formatDay(firstTrigger(member), lang)}</strong></span>
                  <span className="item-history__metric"><small>{itemCurrentT('contraction', lang)}</small><strong>{member.supply_contraction_ratio === null ? itemCurrentT('noSupplyMeasure', lang) : formatPercent(member.supply_contraction_ratio)}</strong></span>
                  <span className="item-history__dates"><span>{member.coverage.qualified_paired_slots} / {member.coverage.expected_slots}</span><small>{itemCurrentT(COVERAGE_COPY[member.coverage.quality], lang)}</small></span>
                  <span className="public-watchlist__open">{itemCurrentT('open', lang)} →</span>
                </button></li>
              })}
            </ol>
          ) : null}
          {list.status === 'READY' && list.loadingMore ? <p role="status">{itemCurrentT('loading', lang)}</p> : null}
          {list.status === 'READY' && list.loadMoreProblem !== null ? (
            <div role="status" data-error-code={list.loadMoreProblem}>
              <p>{itemCurrentT(list.loadMoreProblem === 'VALIDATION' ? 'pageValidationFailed' : PROBLEM_COPY[list.loadMoreProblem][0], lang)}. {itemCurrentT('loadFailed', lang)}</p>
              <button type="button" onClick={() => setReload((value) => value + 1)}>{itemCurrentT('retry', lang)}</button>
            </div>
          ) : null}
          {list.status === 'READY' && list.nextCursor !== null && !list.loadingMore ? <button className="public-result-load-more" type="button" onClick={() => void loadMore()}>{itemCurrentT(list.loadMoreProblem === null ? 'loadMore' : 'retryLoadMore', lang)}</button> : null}
        </>
      )}
    </article>
  )
}
