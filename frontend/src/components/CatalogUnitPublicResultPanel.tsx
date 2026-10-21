import { useEffect, useMemo, useRef, useState } from 'react'
import equal from 'fast-deep-equal'
import { MarketWatchlistPublicApi, type MarketWatchlistPublicGateway } from '../api/MarketWatchlistPublicApi'
import type { CatalogProjectionRow } from '../contract/catalogBrowse'
import { dataStatusLabel, itemCycleStageLabel, label, recommendationLabel, signalStrengthLabel } from '../contract/labels'
import { useLang } from '../i18n'
import { t, type StringKey } from '../i18n/strings'
import { PublicResultPublicationMeta, formatPublicRatio } from '../pages/publicResultShared'
import { PublicResultValidationError } from '../wire/marketWatchlistPublicApiDecode'
import type { PublicResultErrorCode, PublicResultPublication, PublicWatchlistDetailResponse } from '../wire/marketWatchlistPublicApiTypes'

type ItemIdentity = Pick<CatalogProjectionRow, 'analysis_unit_id' | 'item_kind' | 'base_item_code' | 'edition_kind' | 'wear_tier'>
type ProblemCode = PublicResultErrorCode | 'NOT_INCLUDED' | 'VALIDATION' | 'TRANSPORT'
type Outcome =
  | { kind: 'READY'; document: PublicWatchlistDetailResponse }
  | { kind: 'PROBLEM'; code: ProblemCode; retryable: boolean; publication?: PublicResultPublication }

const PROBLEM_TITLE: Record<ProblemCode, StringKey> = {
  NOT_PUBLISHED: 'publicResultNotPublishedTitle',
  NOT_INCLUDED: 'publicResearchNotIncluded',
  NOT_FOUND: 'publicResultNotFoundTitle',
  INVALID_ARGUMENT: 'publicResultNotFoundTitle',
  INVALID_CURSOR: 'publicResultNotFoundTitle',
  BACKEND_UNAVAILABLE: 'publicResultTemporaryTitle',
  PUBLICATION_EXPIRED: 'publicResultExpiredTitle',
  PUBLICATION_WITHDRAWN: 'publicResultWithdrawnTitle',
  RESULT_CORRUPT: 'publicResultCorruptTitle',
  VALIDATION: 'publicResultCorruptTitle',
  TRANSPORT: 'publicResultTemporaryTitle',
}

class PublicItemBindingError extends Error {}

function publicationBinding(publication: PublicResultPublication) {
  // Freshness may cross its time boundary between the two bounded requests.
  const { freshness: _freshness, ...immutable } = publication
  return immutable
}

/** Public detail reads published ITEM summaries; private result/quality snapshots never participate. */
export function CatalogUnitPublicResultPanel({ gateway, identity, asOf }: {
  gateway?: MarketWatchlistPublicGateway
  identity: ItemIdentity
  asOf: string
}) {
  const lang = useLang()
  const api = useMemo(() => gateway ? new MarketWatchlistPublicApi(gateway) : null, [gateway])
  const [attempt, setAttempt] = useState(0)
  const identityKey = JSON.stringify([identity.analysis_unit_id, identity.item_kind, identity.base_item_code, identity.edition_kind, identity.wear_tier])
  const scope = useMemo(() => ({}), [api, identityKey, asOf, attempt])
  const currentScope = useRef(scope)
  currentScope.current = scope
  const [read, setRead] = useState<{ scope: object; outcome: Outcome } | null>(null)
  const outcome = read?.scope === scope ? read.outcome : null

  useEffect(() => {
    const controller = new AbortController()
    const isCurrent = () => !controller.signal.aborted && currentScope.current === scope
    const load = async (): Promise<Outcome> => {
      if (!api) return { kind: 'PROBLEM', code: 'BACKEND_UNAVAILABLE', retryable: false }
      const list = await api.watchlist({ as_of: asOf, publication_id: null, sort: 'RANK_ASC', page_size: 1, cursor: null }, { signal: controller.signal })
      if (list.response_kind === 'ERROR') return { kind: 'PROBLEM', ...list.error }
      // A superseded item must not start a second request after its first response arrives.
      if (!isCurrent()) throw new DOMException('Aborted', 'AbortError')
      const detail = await api.watchlistDetail({ as_of: null, publication_id: list.publication.publication_id,
        analysis_unit_id: identity.analysis_unit_id }, { signal: controller.signal })
      if (detail.response_kind === 'ERROR') return { kind: 'PROBLEM',
        code: detail.error.code === 'NOT_FOUND' ? 'NOT_INCLUDED' : detail.error.code,
        retryable: detail.error.retryable,
        ...(detail.error.code === 'NOT_FOUND' ? { publication: list.publication } : {}),
      }
      const catalog = detail.member.catalog
      if (!equal(publicationBinding(list.publication), publicationBinding(detail.publication)) ||
        detail.member.result.analysis_unit_id !== identity.analysis_unit_id ||
        catalog.analysis_unit_id !== identity.analysis_unit_id || catalog.item_kind !== identity.item_kind ||
        catalog.base_item_code !== identity.base_item_code || catalog.edition_kind !== identity.edition_kind ||
        catalog.wear_tier !== identity.wear_tier) {
        throw new PublicItemBindingError('public item identity or publication binding mismatch')
      }
      return { kind: 'READY', document: detail }
    }
    void load().then((value) => { if (isCurrent()) setRead({ scope, outcome: value }) }).catch((error: unknown) => {
      if (!isCurrent()) return
      const invalid = error instanceof PublicResultValidationError || error instanceof PublicItemBindingError
      setRead({ scope, outcome: { kind: 'PROBLEM', code: invalid ? 'VALIDATION' : 'TRANSPORT', retryable: !invalid } })
    })
    return () => controller.abort()
    // The primitive identity key binds the closure without coupling requests to row object allocation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, asOf, identityKey, scope])

  const publication = outcome?.kind === 'READY' ? outcome.document.publication : outcome?.publication
  const parameters = new URLSearchParams()
  if (publication) {
    parameters.set('publication', publication.publication_id)
    parameters.set('as_of', publication.result_as_of)
    if (outcome?.kind === 'READY') parameters.set('unit', identity.analysis_unit_id)
  }
  if (lang === 'en') parameters.set('lang', 'en')
  const href = `/item-monitor${parameters.size ? `?${parameters}` : ''}`
  const result = outcome?.kind === 'READY' ? outcome.document.member.result : null
  const state = outcome === null ? 'LOADING' : outcome.kind === 'READY' ? 'READY' : outcome.code

  return <section className="formal-unit-research" data-testid="catalog-unit-research-result"
    data-result-state={state} data-analysis-unit={identity.analysis_unit_id} aria-busy={outcome === null}>
    <header>
      <h2>{t('publicResearchTitle', lang)}</h2>
      <span role="status">{t(outcome === null ? 'publicResearchLoading' : outcome.kind === 'READY'
        ? 'publicResearchReady' : PROBLEM_TITLE[outcome.code], lang)}</span>
    </header>
    {result ? <dl className="formal-unit-research__summary">
      <div><dt>{t('publicWatchlistCycle', lang)}</dt><dd>{label(itemCycleStageLabel, result.cycle_stage, lang)}</dd></div>
      <div><dt>{t('publicResearchConclusion', lang)}</dt><dd>{label(recommendationLabel, result.recommendation, lang)}</dd></div>
      <div><dt>{t('publicResearchDataStatus', lang)}</dt><dd>{label(dataStatusLabel, result.data_status, lang)}</dd></div>
      <div><dt>{t('publicResearchEvidence', lang)}</dt><dd>{label(signalStrengthLabel, result.recommendation_detail.signal_strength, lang)} · {formatPublicRatio(result.recommendation_detail.evidence_coverage, lang)}</dd></div>
    </dl> : null}
    {publication ? <details className="formal-unit-research__timing">
      <summary>{t('publicResearchTiming', lang)}</summary>
      <PublicResultPublicationMeta publication={publication} />
    </details> : null}
    {outcome?.kind === 'PROBLEM' && outcome.retryable
      ? <button type="button" onClick={() => setAttempt((value) => value + 1)}>{t('publicResultRetry', lang)}</button> : null}
    <a href={href}>{t('publicResearchOpenMonitor', lang)} →</a>
  </section>
}
