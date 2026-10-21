import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { catalogMediaRoute } from '../adapter/catalogDisplayViewModel'
import {
  MarketWatchlistObservationApi,
  type MarketWatchlistObservationGateway,
} from '../api/MarketWatchlistObservationApi'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { bindItemImageUrl, ITEM_IMAGE_NOT_PRODUCED, type ItemImageSource } from '../contract/itemImage'
import { useLang } from '../i18n'
import { t, tf, type StringKey } from '../i18n/strings'
import { canonicalJsonText, compareCodePoints } from '../wire/canonical'
import { PublicObservationValidationError } from '../wire/marketWatchlistObservationApiDecode'
import type {
  PublicObservationDetailResponse,
  PublicObservationErrorResponse,
  PublicObservationMember,
  PublicObservationWatchlistResponse,
} from '../wire/marketWatchlistObservationApiTypes'
import { formatPublicInstant } from './publicResultShared'

type ObservationProblemCode = PublicObservationErrorResponse['error']['code'] | 'TRANSPORT' | 'VALIDATION'

type ListState =
  | Readonly<{ status: 'IDLE' }>
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{
      status: 'READY'
      document: PublicObservationWatchlistResponse
      members: readonly PublicObservationMember[]
      nextCursor: string | null
      loadingMore: boolean
      loadMoreFailed: boolean
    }>
  | Readonly<{ status: 'PROBLEM'; code: ObservationProblemCode }>

type DetailState =
  | Readonly<{ status: 'IDLE' }>
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'READY'; document: PublicObservationDetailResponse }>
  | Readonly<{ status: 'PROBLEM'; code: ObservationProblemCode }>

const PROBLEM_COPY = Object.freeze({
  INVALID_ARGUMENT: ['publicObservationNotFoundTitle', 'publicObservationNotFoundNote'],
  INVALID_CURSOR: ['publicObservationNotFoundTitle', 'publicObservationNotFoundNote'],
  NOT_PUBLISHED: ['publicObservationNotPublishedTitle', 'publicObservationNotPublishedNote'],
  NOT_FOUND: ['publicObservationNotFoundTitle', 'publicObservationNotFoundNote'],
  BACKEND_UNAVAILABLE: ['publicObservationTemporaryTitle', 'publicObservationTemporaryNote'],
  PUBLICATION_EXPIRED: ['publicObservationExpiredTitle', 'publicObservationExpiredNote'],
  PUBLICATION_WITHDRAWN: ['publicObservationWithdrawnTitle', 'publicObservationWithdrawnNote'],
  RESULT_CORRUPT: ['publicObservationCorruptTitle', 'publicObservationCorruptNote'],
  TRANSPORT: ['publicObservationTemporaryTitle', 'publicObservationTemporaryNote'],
  VALIDATION: ['publicObservationCorruptTitle', 'publicObservationCorruptNote'],
} satisfies Record<ObservationProblemCode, readonly [StringKey, StringKey]>)

const REASON_COPY = Object.freeze({
  COINCIDENT: 'publicObservationReasonCoincident',
  FIRST_ENTRY: 'publicObservationReasonFirstEntry',
  RECENT_PERSISTENT: 'publicObservationReasonRecentPersistent',
  REENTRY: 'publicObservationReasonReentry',
  SUPPLY_LEAD: 'publicObservationReasonSupplyLead',
} satisfies Record<PublicObservationMember['reason_codes'][number], StringKey>)

const QUALITY_REASON_COPY = Object.freeze({
  CLOCK_SKEW: 'publicObservationQualityClockSkew',
  INPUT_GAP: 'publicObservationQualityInputGap',
  OPTIONAL_SOURCE_UNAVAILABLE: 'publicObservationQualityOptionalSource',
  STALE_RETAINED: 'publicObservationQualityStale',
} satisfies Record<PublicObservationMember['data_quality']['reason_codes'][number], StringKey>)

function failureCode(error: unknown): ObservationProblemCode {
  return error instanceof PublicObservationValidationError ? 'VALIDATION' : 'TRANSPORT'
}

function imageSource(member: PublicObservationMember): ItemImageSource {
  const media = member.catalog.media
  if (media.status === 'NOT_PRODUCED') return ITEM_IMAGE_NOT_PRODUCED
  return bindItemImageUrl(catalogMediaRoute(media.media_key, media.media_asset_version_id))
}

function itemName(member: PublicObservationMember, lang: 'zh' | 'en'): string {
  return lang === 'zh' ? member.catalog.localized_name.zh_cn : member.catalog.localized_name.en
}

function coverageText(member: PublicObservationMember, lang: 'zh' | 'en'): string {
  return tf('publicObservationCoverageSummary', lang, {
    observed: member.source_coverage.observed_source_count,
    expected: member.source_coverage.expected_source_count,
    count: member.source_coverage.observation_count,
  })
}

function immutablePublicationText(
  publication: PublicObservationWatchlistResponse['publication'],
): string {
  const { freshness: _freshness, ...identityAndBindings } = publication
  return canonicalJsonText(identityAndBindings)
}

function mergeContinuation(
  current: Extract<ListState, { status: 'READY' }>,
  document: PublicObservationWatchlistResponse,
  requestedCursor: string,
): readonly PublicObservationMember[] {
  try {
    if (document.query.cursor !== requestedCursor) throw new PublicObservationValidationError()
    if (document.total !== current.document.total) throw new PublicObservationValidationError()
    if (immutablePublicationText(document.publication) !== immutablePublicationText(current.document.publication)) {
      throw new PublicObservationValidationError()
    }
    if (document.query.query_known_at < current.document.query.query_known_at) {
      throw new PublicObservationValidationError()
    }
    if (
      current.document.publication.freshness === 'STALE_RETAINED' &&
      document.publication.freshness !== 'STALE_RETAINED'
    ) throw new PublicObservationValidationError()

    const analysisUnits = new Set(current.members.map((member) => member.analysis_unit_id))
    const observations = new Set(current.members.map((member) => member.observation_id))
    const first = document.members[0]
    const previous = current.members[current.members.length - 1]
    if (first === undefined || previous === undefined || first.position !== previous.position + 1) {
      throw new PublicObservationValidationError()
    }
    if (
      previous.signal_observed_at < first.signal_observed_at ||
      (
        previous.signal_observed_at === first.signal_observed_at &&
        compareCodePoints(previous.analysis_unit_id, first.analysis_unit_id) >= 0
      )
    ) {
      throw new PublicObservationValidationError()
    }
    for (const member of document.members) {
      if (analysisUnits.has(member.analysis_unit_id) || observations.has(member.observation_id)) {
        throw new PublicObservationValidationError()
      }
      analysisUnits.add(member.analysis_unit_id)
      observations.add(member.observation_id)
    }
    return Object.freeze([...current.members, ...document.members])
  } catch (error) {
    if (error instanceof PublicObservationValidationError) throw error
    throw new PublicObservationValidationError()
  }
}

function productHref(
  member: PublicObservationMember,
  publication: PublicObservationWatchlistResponse['publication'],
  lang: 'zh' | 'en',
): string {
  const params = new URLSearchParams({
    unit: member.analysis_unit_id,
    snapshot: publication.catalog.snapshot_id,
    as_of: publication.as_of,
  })
  if (lang === 'en') params.set('lang', 'en')
  return `/research?${params}`
}

function ObservationLoading() {
  const lang = useLang()
  return (
    <div className="public-result-message public-result-message--loading" role="status">
      <span aria-hidden="true" />
      <p>{t('publicObservationLoading', lang)}</p>
    </div>
  )
}

function ObservationProblem({
  code,
  onRetry,
  catalogHref,
  onCatalogClick,
}: {
  code: ObservationProblemCode
  onRetry: () => void
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const [title, note] = PROBLEM_COPY[code]
  return (
    <section className="public-result-message public-result-message--problem" role="status" data-error-code={code}>
      <p className="public-result-message__eyebrow">UNVALIDATED OBSERVATION</p>
      <h2>{t(title, lang)}</h2>
      <p>{t(note, lang)}</p>
      <div className="public-result-message__actions">
        <button type="button" onClick={onRetry}>{t('publicResultRetry', lang)}</button>
        <a href={catalogHref} onClick={onCatalogClick}>{t('publicResultBackCatalog', lang)}</a>
      </div>
    </section>
  )
}

function ObservationPublicationMeta({
  publication,
  count,
}: {
  publication: PublicObservationWatchlistResponse['publication']
  count?: number
}) {
  const lang = useLang()
  const stale = publication.freshness === 'STALE_RETAINED'
  return (
    <div className="public-result-publication" data-testid="public-observation-publication">
      <div>
        <span>{t('publicObservationAsOf', lang)}</span>
        <time dateTime={publication.as_of}>{formatPublicInstant(publication.as_of, lang)}</time>
      </div>
      <div>
        <span>{t('publicObservationKnownAt', lang)}</span>
        <time dateTime={publication.known_at}>{formatPublicInstant(publication.known_at, lang)}</time>
      </div>
      <div>
        <span>{t('publicObservationPublishedAt', lang)}</span>
        <time dateTime={publication.published_at}>{formatPublicInstant(publication.published_at, lang)}</time>
      </div>
      <strong className={stale ? 'is-stale' : 'is-fresh'}>
        {t(stale ? 'publicObservationStale' : 'publicObservationFresh', lang)}
      </strong>
      {count === undefined ? null : (
        <div className="public-watchlist__count">
          <strong>{count}</strong>
          <span>{t('publicObservationCount', lang)}</span>
        </div>
      )}
      {stale ? <p>{t('publicObservationStaleNote', lang)}</p> : null}
    </div>
  )
}

export function PublicObservationWatchlistPage({
  gateway,
  asOf,
  publicationId,
  selectedUnitId,
  catalogHref,
  onCatalogClick,
  onOpenMember,
  onCloseMember,
}: {
  gateway: MarketWatchlistObservationGateway
  asOf: string | null
  publicationId: string | null
  selectedUnitId: string | null
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onOpenMember: (publicationId: string, analysisUnitId: string, observationAsOf: string) => void
  onCloseMember: () => void
}) {
  const lang = useLang()
  const api = useMemo(() => new MarketWatchlistObservationApi(gateway), [gateway])
  const renderDetail = selectedUnitId !== null && publicationId !== null
  const [reload, setReload] = useState(0)
  const [list, setList] = useState<ListState>({ status: renderDetail ? 'IDLE' : 'LOADING' })
  const [detail, setDetail] = useState<DetailState>({ status: 'IDLE' })
  const loadMoreController = useRef<AbortController | null>(null)

  useEffect(() => {
    loadMoreController.current?.abort()
    loadMoreController.current = null
    return () => {
      loadMoreController.current?.abort()
      loadMoreController.current = null
    }
  }, [asOf, publicationId, renderDetail])

  useEffect(() => {
    if (renderDetail) {
      setList({ status: 'IDLE' })
      return
    }
    const controller = new AbortController()
    setList({ status: 'LOADING' })
    void api.watchlist({
      as_of: asOf,
      publication_id: publicationId,
      sort: 'SIGNAL_TIME_DESC',
      page_size: 50,
      cursor: null,
    }, { signal: controller.signal }).then((document) => {
      if (controller.signal.aborted) return
      setList(document.response_kind === 'ERROR'
        ? { status: 'PROBLEM', code: document.error.code }
        : {
            status: 'READY',
            document,
            members: document.members,
            nextCursor: document.next_cursor,
            loadingMore: false,
            loadMoreFailed: false,
          })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setList({ status: 'PROBLEM', code: failureCode(error) })
    })
    return () => controller.abort()
  }, [api, asOf, publicationId, reload, renderDetail])

  useEffect(() => {
    if (!renderDetail || selectedUnitId === null || publicationId === null) {
      setDetail({ status: 'IDLE' })
      return
    }
    const controller = new AbortController()
    setDetail({ status: 'LOADING' })
    void api.detail({
      publication_id: publicationId,
      analysis_unit_id: selectedUnitId,
    }, { signal: controller.signal }).then((document) => {
      if (controller.signal.aborted) return
      setDetail(document.response_kind === 'ERROR'
        ? { status: 'PROBLEM', code: document.error.code }
        : asOf !== null && document.publication.as_of !== asOf
          ? { status: 'PROBLEM', code: 'VALIDATION' }
          : { status: 'READY', document })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setDetail({ status: 'PROBLEM', code: failureCode(error) })
    })
    return () => controller.abort()
  }, [api, asOf, publicationId, reload, renderDetail, selectedUnitId])

  const loadMore = useCallback(async () => {
    if (list.status !== 'READY' || list.nextCursor === null || list.loadingMore) return
    const cursor = list.nextCursor
    const expectedPublication = list.document.publication.publication_id
    const controller = new AbortController()
    loadMoreController.current = controller
    setList({ ...list, loadingMore: true, loadMoreFailed: false })
    try {
      const document = await api.watchlist({
        as_of: asOf,
        publication_id: expectedPublication,
        sort: 'SIGNAL_TIME_DESC',
        page_size: 50,
        cursor,
      }, { signal: controller.signal })
      if (controller.signal.aborted) return
      if (document.response_kind === 'ERROR') {
        setList((current) => {
          if (current.status !== 'READY') return current
          return document.error.code === 'BACKEND_UNAVAILABLE'
            ? { ...current, loadingMore: false, loadMoreFailed: true }
            : { status: 'PROBLEM', code: document.error.code }
        })
        return
      }
      const members = mergeContinuation(list, document, cursor)
      setList({
        ...list,
        document,
        members,
        nextCursor: document.next_cursor,
        loadingMore: false,
        loadMoreFailed: false,
      })
    } catch (error: unknown) {
      if (controller.signal.aborted) return
      setList((current) => {
        if (current.status !== 'READY') return current
        return error instanceof PublicObservationValidationError
          ? { status: 'PROBLEM', code: 'VALIDATION' }
          : { ...current, loadingMore: false, loadMoreFailed: true }
      })
    } finally {
      if (loadMoreController.current === controller) loadMoreController.current = null
    }
  }, [api, asOf, list])

  return (
    <article className="public-result-page public-observation" data-testid="public-observation-page">
      <header className="public-result-page__header">
        <div>
          <p>{t('publicObservationEyebrow', lang)}</p>
          <h1>{t('publicObservationTitle', lang)}</h1>
          <p>{t('publicObservationIntro', lang)}</p>
        </div>
        <strong>{t('publicObservationUnvalidated', lang)}</strong>
      </header>

      {renderDetail ? (
        <>
          <button className="public-watchlist__back" type="button" onClick={onCloseMember}>
            ← {t('publicObservationClose', lang)}
          </button>
          {detail.status === 'LOADING' || detail.status === 'IDLE' ? <ObservationLoading /> : null}
          {detail.status === 'PROBLEM' ? (
            <ObservationProblem
              code={detail.code}
              onRetry={() => setReload((value) => value + 1)}
              catalogHref={catalogHref}
              onCatalogClick={onCatalogClick}
            />
          ) : null}
          {detail.status === 'READY' ? <ObservationDetail document={detail.document} /> : null}
        </>
      ) : list.status === 'LOADING' || list.status === 'IDLE' ? (
        <ObservationLoading />
      ) : list.status === 'PROBLEM' ? (
        <ObservationProblem
          code={list.code}
          onRetry={() => setReload((value) => value + 1)}
          catalogHref={catalogHref}
          onCatalogClick={onCatalogClick}
        />
      ) : (
        <>
          <ObservationPublicationMeta publication={list.document.publication} count={list.document.total} />
          {list.document.total === 0 ? (
            <section className="public-watchlist__empty" role="status">
              <h2>{t('publicObservationEmptyTitle', lang)}</h2>
              <p>{t('publicObservationEmptyNote', lang)}</p>
              <a href={catalogHref} onClick={onCatalogClick}>{t('publicResultBackCatalog', lang)}</a>
            </section>
          ) : (
            <section className="public-observation__results">
              <p>{t('publicObservationOrder', lang)}</p>
              <ol className="public-observation__list" aria-label={t('publicObservationTitle', lang)}>
                {list.members.map((member) => {
                  const name = itemName(member, lang)
                  return (
                    <li key={member.observation_id}>
                      <button
                        type="button"
                        onClick={() => onOpenMember(
                          list.document.publication.publication_id,
                          member.analysis_unit_id,
                          list.document.publication.as_of,
                        )}
                      >
                        <ItemImageSlot
                          source={imageSource(member)}
                          label={name}
                          variant="thumbnail"
                          presentation="PRODUCT"
                          testId={`public-observation-image-${member.observation_id}`}
                        />
                        <span className="public-observation__item-copy">
                          <strong>{name}</strong>
                          <time dateTime={member.signal_observed_at}>
                            {t('publicObservationSignalAt', lang)} · {formatPublicInstant(member.signal_observed_at, lang)}
                          </time>
                        </span>
                        <span className="public-observation__reasons">
                          {member.reason_codes.map((reason) => <span key={reason}>{t(REASON_COPY[reason], lang)}</span>)}
                        </span>
                        <span className="public-observation__facts">
                          <strong>{t('publicObservationCoverage', lang)}</strong>
                          <span>{coverageText(member, lang)}</span>
                        </span>
                        <span className="public-observation__open">{t('publicObservationOpen', lang)} →</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}
          {list.loadingMore ? <p role="status">{t('publicObservationLoading', lang)}</p> : null}
          {list.loadMoreFailed ? <p role="status">{t('publicResultLoadMoreFailed', lang)}</p> : null}
          {list.nextCursor !== null && !list.loadingMore ? (
            <button className="public-result-load-more" type="button" onClick={() => void loadMore()}>
              {t('publicResultLoadMore', lang)}
            </button>
          ) : null}
        </>
      )}
    </article>
  )
}

function ObservationDetail({ document }: { document: PublicObservationDetailResponse }) {
  const lang = useLang()
  const { member, publication } = document
  const name = itemName(member, lang)
  const qualityComplete = member.data_quality.status === 'COMPLETE'
  return (
    <section className="public-observation-detail" data-testid="public-observation-detail">
      <ObservationPublicationMeta publication={publication} />
      <div className="public-watchlist-detail__hero">
        <ItemImageSlot
          source={imageSource(member)}
          label={name}
          variant="detail"
          presentation="PRODUCT"
          testId="public-observation-detail-image"
        />
        <div>
          <p>{t('publicObservationDetailTitle', lang)}</p>
          <h2>{name}</h2>
          <div className="public-watchlist-detail__primary">
            <strong>{t('publicObservationUnvalidated', lang)}</strong>
          </div>
          <dl className="public-observation-detail__facts">
            <div>
              <dt>{t('publicObservationSignalAt', lang)}</dt>
              <dd><time dateTime={member.signal_observed_at}>{formatPublicInstant(member.signal_observed_at, lang)}</time></dd>
            </div>
            <div>
              <dt>{t('publicObservationKnownAt', lang)}</dt>
              <dd><time dateTime={member.known_at}>{formatPublicInstant(member.known_at, lang)}</time></dd>
            </div>
            <div>
              <dt>{t('publicObservationCoverage', lang)}</dt>
              <dd>{coverageText(member, lang)}</dd>
            </div>
          </dl>
          <a className="public-watchlist-detail__product" href={productHref(member, publication, lang)}>
            {t('publicObservationProduct', lang)} →
          </a>
        </div>
      </div>
      <div className="public-observation-detail__reason-panel">
        <section>
          <h3>{t('publicObservationReasons', lang)}</h3>
          <div className="public-observation__reasons">
            {member.reason_codes.map((reason) => <span key={reason}>{t(REASON_COPY[reason], lang)}</span>)}
          </div>
        </section>
        <section>
          <h3>{t('publicObservationQuality', lang)}</h3>
          <strong>{t(qualityComplete ? 'publicObservationQualityComplete' : 'publicObservationQualityDegraded', lang)}</strong>
          {member.data_quality.reason_codes.length > 0 ? (
            <div className="public-observation__quality-reasons">
              {member.data_quality.reason_codes.map((reason) => (
                <span key={reason}>{t(QUALITY_REASON_COPY[reason], lang)}</span>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  )
}
