import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { valvePublicLabel } from './valvePublicLabels'
import {
  isPresentableValveEventView,
  mergeValveEventListViews,
  toValveEventDetailView,
  toValveEventListView,
  type KnownCode,
  type ValveEventDetailView,
  type ValveEventListView,
  type ValveEventReadChannel,
  type ValveEventSummaryView,
} from '../adapter/valveEventViewModel'
import {
  ValveEventsApi,
  type ValveEventsGateway,
} from '../api/ValveEventsApi'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'

type WorkspaceModel =
  | Readonly<{ kind: 'LIST'; view: ValveEventListView }>
  | Readonly<{ kind: 'DETAIL'; view: ValveEventDetailView }>

const PublicPresentation = createContext(false)

function formatValveDate(value: string, lang: 'zh' | 'en'): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return value.slice(0, 10)
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: lang === 'zh' ? 'long' : 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

function MachineTag({ value }: { value: KnownCode<string> }) {
  const lang = useLang()
  const publicPresentation = useContext(PublicPresentation)
  return (
    <span
      className={`valve-events__tag${value.known ? '' : ' valve-events__tag--unknown'}`}
      data-known={String(value.known)}
    >
      <span>{publicPresentation ? valvePublicLabel(value.known ? value.source : '', lang) : value.known ? value.source : t('valveEventsUnknownEnum', lang)}</span>
      {!value.known && !publicPresentation ? <code>{value.source}</code> : null}
    </span>
  )
}

function OfficialLink({ event }: { event: ValveEventSummaryView['source'] }) {
  const lang = useLang()
  return event.officialUrl ? (
    <a href={event.officialUrl} target="_blank" rel="noreferrer noopener">
      {t('valveEventsOfficialLink', lang)}
    </a>
  ) : (
    <span>{t('valveEventsNoOfficialLink', lang)}</span>
  )
}

function ArchiveCard({
  event,
  onOpen,
}: {
  event: ValveEventSummaryView
  onOpen: (eventId: string) => void
}) {
  const lang = useLang()
  return (
    <article
      className="valve-events__card"
      data-testid={`valve-event-card-${event.source.eventId}`}
    >
      <div className="valve-events__card-index" aria-hidden="true">
        <span>{event.source.officialPublishedAt.slice(0, 4)}</span>
        <strong>{event.source.officialPublishedAt.slice(5, 10).replace('-', '·')}</strong>
      </div>
      <div className="valve-events__card-main">
        <header>
          <div>
            <p>{t('valveEventsOfficialSource', lang)}</p>
            <h2>{event.source.officialTitle}</h2>
          </div>
          <MachineTag value={event.status} />
        </header>
        <p className="valve-events__card-date">
          <span>{t('valveEventsPublishedAt', lang)}</span>
          <time dateTime={event.source.officialPublishedAt}>{formatValveDate(event.source.officialPublishedAt, lang)}</time>
        </p>
        {event.conclusion ? (
          <>
            <p className="valve-events__ai-disclosure">
              {t('valveEventsAiDisclosure', lang)}
            </p>
            <p className="valve-events__conclusion">
              {event.conclusion[lang]}
            </p>
          </>
        ) : (
          <p className="valve-events__source-only">{t('valveEventsSourceOnly', lang)}</p>
        )}
        <div className="valve-events__card-labels">
          {event.direction ? <MachineTag value={event.direction} /> : null}
          {event.temporalMode ? <MachineTag value={event.temporalMode} /> : null}
          {event.outcome ? <MachineTag value={event.outcome} /> : null}
          {event.flags.corrected ? <span>{t('valveEventsCorrection', lang)}</span> : null}
          {event.flags.sourceUpdated ? <span>{t('valveEventsSourceUpdated', lang)}</span> : null}
          {event.flags.withdrawn ? <span>{t('valveEventsWithdrawn', lang)}</span> : null}
        </div>
        <footer>
          <OfficialLink event={event.source} />
          {event.conclusion || event.flags.withdrawn ? (
            <button type="button" onClick={() => onOpen(event.source.eventId)}>
              {t(
                event.conclusion
                  ? 'valveEventsReadAnalysis'
                  : 'valveEventsReadWithdrawal',
                lang,
              )}
            </button>
          ) : null}
        </footer>
      </div>
    </article>
  )
}

function EventArchive({
  view,
  onOpen,
  loadingMore,
  continuationError,
  onLoadMore,
}: {
  view: ValveEventListView
  onOpen: (eventId: string) => void
  loadingMore: boolean
  continuationError: boolean
  onLoadMore: () => void
}) {
  const lang = useLang()
  if (!isPresentableValveEventView(view, 'LIST')) {
    throw new TypeError('EventArchive requires an adapted Valve event list')
  }
  return (
    <section className="valve-events__archive" data-testid="valve-event-list">
      <header>
        <div>
          <p>{t('valveEventsOfficialSource', lang)}</p>
          <h2>{t('valveEventsArchive', lang)}</h2>
        </div>
        <span>{view.events.length}</span>
      </header>
      <p className="scope-note">{t('valveEventsArchiveNote', lang)}</p>
      {view.events.length === 0 ? <p role="status">{lang === 'zh' ? '暂时没有可展示的官方公告。' : 'No official announcements are available yet.'}</p> : null}
      <div className="valve-events__cards">
        {view.events.map((event) => (
          <ArchiveCard key={event.source.eventId} event={event} onOpen={onOpen} />
        ))}
      </div>
      {view.nextCursor !== null ? (
        <div className="valve-events__continuation">
          {continuationError ? (
            <p role="alert">{t('valveEventsLoadMoreError', lang)}</p>
          ) : null}
          <button type="button" disabled={loadingMore} onClick={onLoadMore}>
            {t(
              loadingMore ? 'valveEventsLoadingMore' : 'valveEventsLoadMore',
              lang,
            )}
          </button>
        </div>
      ) : null}
    </section>
  )
}

function AssessmentArticle({
  view,
}: {
  view: NonNullable<ValveEventDetailView['assessment']>
}) {
  const lang = useLang()
  const publicPresentation = useContext(PublicPresentation)
  const article = view.article
  const reader = article.kind === 'BILINGUAL_READER_V3' ? article[lang] : null
  const sections =
    article.kind === 'SECTIONED_V1'
      ? [
          [t('valveEventsFactual', lang), article.factualSummary],
          [t('valveEventsMechanisms', lang), article.transmissionMechanisms],
          [t('valveEventsScopeAnalysis', lang), article.scopeAnalysis],
          [t('valveEventsUncertainty', lang), article.uncertaintiesAndCounterforces],
          [t('valveEventsContinueObservation', lang), article.observationAndFalsification],
        ] as const
      : []
  return (
    <article className="valve-events__article" data-testid="valve-event-article">
      <header>
        <div>
          <p>{t('valveEventsAnalysis', lang)} · v{view.publicationVersion}</p>
          <h2>{reader?.title ?? (article.kind === 'SECTIONED_V1' ? article.title : '')}</h2>
        </div>
        <div className="valve-events__article-meta">
          <p className="valve-events__report-date">
            <span>{t('valveEventsReportPublishedAt', lang)}</span>
            <time dateTime={view.publishedAt}>{formatValveDate(view.publishedAt, lang)}</time>
          </p>
          <MachineTag value={view.temporalMode} />
          <span>{publicPresentation ? valvePublicLabel(view.contextStatus, lang) : view.contextStatus}</span>
        </div>
      </header>
      <p className="valve-events__ai-disclosure">
        {t('valveEventsAiDisclosure', lang)}
      </p>
      {reader
        ? reader.body.split(/\n\s*\n/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))
        : sections.map(([title, body]) => (
            <section key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </section>
          ))}
      {article.kind === 'SECTIONED_V1' ? (
        <section className="valve-events__article-conclusion">
          <h3>{t('valveEventsConclusion', lang)}</h3>
          <p>{article.conclusion}</p>
        </section>
      ) : null}
    </article>
  )
}

function Claims({ claims }: { claims: NonNullable<ValveEventDetailView['assessment']>['claims'] }) {
  const lang = useLang()
  const publicPresentation = useContext(PublicPresentation)
  return (
    <section className="valve-events__claims">
      <h2>{t('valveEventsClaims', lang)}</h2>
      <div>
        {claims.map((claim) => (
          <article key={claim.claimId} data-testid="valve-event-claim">
            <header>
              <div>
                <p>{publicPresentation ? valvePublicLabel(claim.scopeKind, lang) : claim.scopeKind}</p>
                <h3>{claim.scopeDisplay}</h3>
              </div>
              <MachineTag value={claim.trackingStatus} />
            </header>
            <dl>
              <div><dt>{t('valveEventsDirection', lang)}</dt><dd><MachineTag value={claim.direction} /></dd></div>
              <div><dt>{t('valveEventsHorizon', lang)}</dt><dd><MachineTag value={claim.horizon} /></dd></div>
            </dl>
            <div className="valve-events__claim-notes">
              <section><h4>{t('valveEventsObservationTargets', lang)}</h4><ul>{claim.observationTargets.map((value) => <li key={value}>{value}</li>)}</ul></section>
              <section><h4>{t('valveEventsFalsification', lang)}</h4><ul>{claim.falsificationConditions.map((value) => <li key={value}>{value}</li>)}</ul></section>
              <section><h4>{t('valveEventsLimitations', lang)}</h4><ul>{claim.limitations.map((value) => <li key={value}>{value}</li>)}</ul></section>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function EventDetail({ view, onBack }: { view: ValveEventDetailView; onBack: () => void }) {
  const lang = useLang()
  const publicPresentation = useContext(PublicPresentation)
  if (!isPresentableValveEventView(view, 'DETAIL')) {
    throw new TypeError('EventDetail requires an adapted Valve event detail')
  }
  const withdrawnVersions = view.publicVersions.filter((version) => version.withdrawn)
  const latestWithdrawal = withdrawnVersions.at(-1) ?? null
  return (
    <div className={`valve-events__detail${publicPresentation ? ' valve-events__detail--public' : ''}`} data-testid="valve-event-detail">
      <button type="button" className="valve-events__back" onClick={onBack}>
        ← {t('valveEventsBack', lang)}
      </button>
      {view.flags.withdrawn && latestWithdrawal ? (
        <aside className="valve-events__withdrawal" role="status">
          <strong>{t('valveEventsWithdrawnTitle', lang)}</strong>
          <p>{latestWithdrawal.withdrawalReason}</p>
        </aside>
      ) : null}
      <ol className="valve-events__spine">
        <li data-stage="source">
          <span className="valve-events__node">01</span>
          <section className="valve-events__source-stage">
            <header>
              <div><p>{t('valveEventsOfficialSource', lang)}</p><h2>{view.source.officialTitle}</h2></div>
              <MachineTag value={view.status} />
            </header>
            <dl>
              <div><dt>{t('valveEventsPublishedAt', lang)}</dt><dd><time dateTime={view.source.officialPublishedAt}>{formatValveDate(view.source.officialPublishedAt, lang)}</time></dd></div>
            </dl>
            <OfficialLink event={view.source} />
          </section>
        </li>
        <li data-stage="analysis">
          <span className="valve-events__node">02</span>
          {view.assessment ? (
            <div>
              <AssessmentArticle view={view.assessment} />
              <Claims claims={view.assessment.claims} />
              <aside className="valve-events__disclosures">
                <h2>{t('valveEventsDisclosures', lang)}</h2>
                <ul>{view.assessment.disclosures.map((value) => <li key={value}>{value}</li>)}</ul>
              </aside>
            </div>
          ) : (
            <p className="valve-events__source-only">
              {t(
                view.publicVersions.length > 0
                  ? 'valveEventsNoActiveAnalysis'
                  : 'valveEventsSourceOnly',
                lang,
              )}
            </p>
          )}
        </li>
        <li data-stage="outcome">
          <span className="valve-events__node">03</span>
          <section className="valve-events__outcome" data-testid="valve-event-outcome">
            <header><h2>{t('valveEventsOutcome', lang)}</h2>{view.outcome ? <MachineTag value={view.outcome.label} /> : null}</header>
            {view.outcome ? (
              <>
                <p>{view.outcome.explanation}</p>
                <dl>
                  <div><dt>{t('valveEventsOutcomeCutoff', lang)}</dt><dd><time dateTime={view.outcome.observationCutoffAt}>{formatValveDate(view.outcome.observationCutoffAt, lang)}</time></dd></div>
                  <div><dt>{t('valveEventsCausality', lang)}</dt><dd>{view.outcome.causalityDisclosure}</dd></div>
                </dl>
              </>
            ) : <p>{t('valveEventsNoOutcome', lang)}</p>}
          </section>
        </li>
      </ol>
      <section className="valve-events__history">
        <h2>{t('valveEventsHistory', lang)}</h2>
        <ol>{view.publicVersions.map((version) => <li key={version.publicationId}><strong>v{version.version}</strong><MachineTag value={version.temporalMode} /><time dateTime={version.publishedAt}>{formatValveDate(version.publishedAt, lang)}</time>{version.withdrawn ? <p><strong>{t('valveEventsWithdrawn', lang)}</strong> · {version.withdrawalReason}</p> : null}</li>)}</ol>
      </section>
    </div>
  )
}

export function ValveEventsWorkspace({ gateway, publicPresentation = false }: { gateway: ValveEventsGateway; publicPresentation?: boolean }) {
  const lang = useLang()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [continuedList, setContinuedList] = useState<ValveEventListView | null>(null)
  const [continuationStatus, setContinuationStatus] = useState<
    'IDLE' | 'LOADING' | 'ERROR'
  >('IDLE')
  const source = gateway
  const channel: ValveEventReadChannel =
    source.kind === 'FORMAL_FIXTURE' ? 'FORMAL_FIXTURE' : 'READ_ONLY_HTTP'
  const api = useMemo(() => {
    return new ValveEventsApi(source)
  }, [source])
  const state = useAsync<WorkspaceModel>(async () => {
    if (selectedEventId === null) {
      return {
        kind: 'LIST',
        view: toValveEventListView(await api.list({ cursor: null }), channel),
      }
    }
    return {
      kind: 'DETAIL',
      view: toValveEventDetailView(
        await api.detail({ event_id: selectedEventId }),
        channel,
      ),
    }
  }, [api, channel, selectedEventId, attempt])

  useEffect(() => {
    setContinuedList(null)
    setContinuationStatus('IDLE')
  }, [api, selectedEventId, attempt])

  const loadMore = async (view: ValveEventListView) => {
    if (view.nextCursor === null || continuationStatus === 'LOADING') return
    setContinuationStatus('LOADING')
    try {
      const next = toValveEventListView(
        await api.list({ cursor: view.nextCursor }),
        channel,
      )
      setContinuedList(mergeValveEventListViews(view, next))
      setContinuationStatus('IDLE')
    } catch {
      setContinuationStatus('ERROR')
    }
  }

  // A list card can sit far below the fold. Reusing that document offset after replacing the
  // archive with a shorter detail page could land in the middle of claims or beyond the result.
  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [selectedEventId])

  const archiveView =
    state.status === 'ready' && state.value.kind === 'LIST'
      ? continuedList ?? state.value.view
      : null

  return (
    <PublicPresentation.Provider value={publicPresentation}>
    <div className={`page valve-events${publicPresentation ? ' public-result-page public-valve-results' : ''}`} data-testid="page-valve-events">
      <header className={publicPresentation ? 'public-result-page__header public-valve-results__header' : 'valve-events__hero'}>
        <div>
          <h1>{t('valveEventsTitle', lang)}</h1>
          <p>{t('valveEventsIntro', lang)}</p>
        </div>
        {!publicPresentation ? <dl>
          <div><dt>{t('valveEventsContract', lang)}</dt><dd><code>valve-event-public-api/v1</code></dd></div>
          <div><dt>{t('valveEventsNetwork', lang)}</dt><dd><code>{channel === 'FORMAL_FIXTURE' ? 'NO_NETWORK' : 'READ_ONLY_HTTP'}</code></dd></div>
        </dl> : null}
      </header>
      <aside className="valve-events__steam-disclaimer" data-testid="valve-events-steam-disclaimer">
        {t('valveEventsSteamDisclaimer', lang)}
      </aside>
      {state.status === 'loading' ? <div className="valve-events__loading" role="status">{t('valveEventsLoading', lang)}</div> : null}
      {state.status === 'error' ? (
        <div className="valve-events__error" role="alert">
          <strong>{t('valveEventsBoundaryError', lang)}</strong>
          <p>{t('valveEventsBoundaryErrorNote', lang)}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>{t('valveEventsRetry', lang)}</button>
        </div>
      ) : null}
      {archiveView ? (
        <EventArchive
          view={archiveView}
          onOpen={setSelectedEventId}
          loadingMore={continuationStatus === 'LOADING'}
          continuationError={continuationStatus === 'ERROR'}
          onLoadMore={() => void loadMore(archiveView)}
        />
      ) : null}
      {state.status === 'ready' && state.value.kind === 'DETAIL' ? <EventDetail view={state.value.view} onBack={() => setSelectedEventId(null)} /> : null}
    </div>
    </PublicPresentation.Provider>
  )
}
