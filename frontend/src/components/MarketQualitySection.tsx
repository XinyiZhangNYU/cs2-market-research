import { useMemo, useState } from 'react'
import {
  loadQualityListPage,
  utcQueryInstant,
  type QualityListMemberView,
  type QualityPageAccounting,
} from '../adapter/qualityListViewModel'
import { tokenText, type DisplayToken } from '../adapter/resultViewModel'
import {
  HttpFormalResultReadGateway,
  ResultGatewayTransportError,
} from '../api/HttpFormalResultReadGateway'
import type { FormalResultReadGateway } from '../api/FormalResultReadApi'
import {
  analysisUnitKindLabel,
  editionKindLabel,
  label,
} from '../contract/labels'
import { AnalysisUnitKind, type AnalysisUnitKind as AnalysisUnitKindValue } from '../contract/enums'
import { EditionKind, type EditionKind as EditionKindValue } from '../contract/identity'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { EnumChip, EnumPresentation } from './EnumChip'

const PAGE_SIZES = [25, 50, 100, 200] as const
const ANALYSIS_UNIT_KINDS = Object.values(AnalysisUnitKind)
const EDITION_KINDS = Object.values(EditionKind)

export type MarketQualityPresentation = Readonly<{
  dataEnvironment: 'LIVE_LOCAL' | 'LIVE_PUBLIC'
  transportLabel: 'LOCAL_RESULT_API' | 'PUBLIC_RESULT_API'
}>

export type MarketQualityAppearance = 'TECHNICAL' | 'FORMAL_PUBLIC'

export const LOCAL_MARKET_QUALITY_PRESENTATION: MarketQualityPresentation =
  Object.freeze({
    dataEnvironment: 'LIVE_LOCAL',
    transportLabel: 'LOCAL_RESULT_API',
  })

export const PUBLIC_MARKET_QUALITY_PRESENTATION: MarketQualityPresentation =
  Object.freeze({
    dataEnvironment: 'LIVE_PUBLIC',
    transportLabel: 'PUBLIC_RESULT_API',
  })

function systemNow(): Date {
  return new Date()
}

function percent(numerator: number, denominator: number): string {
  if (denominator === 0) return '—'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

function ratioValue(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0
}

function Token({ value }: { value: DisplayToken }) {
  return <code>{tokenText(value)}</code>
}

function PageMetric({
  labelText,
  value,
  detail,
}: {
  labelText: string
  value: string | number
  detail: string
}) {
  return (
    <div>
      <span>{labelText}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}

function PageAccounting({ accounting }: { accounting: QualityPageAccounting }) {
  const lang = useLang()
  return (
    <div className="market-quality__metrics" data-testid="quality-page-accounting">
      <PageMetric
        labelText={t('liveQualityRows', lang)}
        value={accounting.returned_rows}
        detail={t('liveQualityRowsNote', lang)}
      />
      <PageMetric
        labelText={t('liveQualityCoverage', lang)}
        value={percent(accounting.observed_cells, accounting.expected_cells)}
        detail={`${accounting.observed_cells}/${accounting.expected_cells}`}
      />
      <PageMetric
        labelText={t('liveQualityFreshCoverage', lang)}
        value={percent(accounting.fresh_cells, accounting.expected_cells)}
        detail={`${accounting.fresh_cells}/${accounting.expected_cells}`}
      />
      <PageMetric
        labelText={t('liveQualityMissingStale', lang)}
        value={`${accounting.missing_cells} / ${accounting.stale_cells}`}
        detail={t('liveQualityMissingStaleNote', lang)}
      />
      <PageMetric
        labelText={t('liveQualityConflicts', lang)}
        value={accounting.conflict_rows}
        detail={t('liveQualityConflictsNote', lang)}
      />
      <PageMetric
        labelText={t('liveQualityFutureFacts', lang)}
        value={accounting.future_facts}
        detail={t('liveQualityFutureFactsNote', lang)}
      />
    </div>
  )
}

function RatioCell({
  ratio,
  numerator,
  denominator,
  ariaLabel,
}: {
  ratio: string
  numerator: number
  denominator: number
  ariaLabel: string
}) {
  return (
    <div className="market-quality__ratio">
      <meter aria-label={ariaLabel} min="0" max="1" value={ratioValue(ratio)} />
      <div>
        <code>{ratio}</code>
        <small>{numerator}/{denominator}</small>
      </div>
    </div>
  )
}

function QualityRow({
  member,
  selected,
  onSelect,
  appearance,
}: {
  member: QualityListMemberView
  selected: boolean
  onSelect: () => void
  appearance: MarketQualityAppearance
}) {
  const lang = useLang()
  const { quality, published_at: publishedAt } = member
  const kind = quality.identity.analysis_unit_kind
  const edition = quality.identity.edition_kind
  return (
    <tr data-testid="live-quality-row" data-selected={String(selected)}>
      <td>
        <button type="button" aria-pressed={selected} onClick={onSelect}>
          {tokenText(quality.identity.analysis_unit_id)}
        </button>
        {appearance === 'TECHNICAL' ? (
          <small>snapshot={quality.snapshot_id.slice(0, 12)}…</small>
        ) : null}
      </td>
      <td>
        {kind === null ? (
          <span>—</span>
        ) : (
          <EnumChip
            machine={kind}
            label={label(analysisUnitKindLabel, kind, lang)}
            presentation={appearance === 'FORMAL_PUBLIC' ? EnumPresentation.PRODUCT_PRIMARY : EnumPresentation.TECHNICAL}
          />
        )}
        {edition === null ? (
          <span>—</span>
        ) : (
          <EnumChip
            machine={edition}
            label={label(editionKindLabel, edition, lang)}
            presentation={appearance === 'FORMAL_PUBLIC' ? EnumPresentation.PRODUCT_PRIMARY : EnumPresentation.TECHNICAL}
          />
        )}
      </td>
      <td>
        <RatioCell
          ratio={quality.aggregate.coverage_ratio}
          numerator={quality.aggregate.observed_cell_count}
          denominator={quality.aggregate.expected_cell_count}
          ariaLabel={t('liveQualityCoverage', lang)}
        />
      </td>
      <td>
        <RatioCell
          ratio={quality.aggregate.fresh_coverage_ratio}
          numerator={quality.aggregate.fresh_cell_count}
          denominator={quality.aggregate.expected_cell_count}
          ariaLabel={t('liveQualityFreshCoverage', lang)}
        />
      </td>
      <td>
        <code>{quality.aggregate.missing_cell_count}</code>
        <small>stale={quality.aggregate.stale_cell_count}</small>
      </td>
      <td>
        <code>{quality.source_summaries.length}</code>
        <small>conflicts={quality.conflicts.length}</small>
        <small>queries={quality.query_observations.length}</small>
      </td>
      {appearance === 'TECHNICAL' ? (
        <td className="market-quality__time-cell">
          <code>{quality.as_of}</code>
          <code>{quality.available_at}</code>
          <code>{publishedAt}</code>
        </td>
      ) : null}
    </tr>
  )
}

function EmptyList() {
  const lang = useLang()
  return (
    <div className="market-quality__empty" data-testid="live-quality-empty">
      <strong>{t('liveQualityEmpty', lang)}</strong>
      <p>{t('liveQualityEmptyNote', lang)}</p>
    </div>
  )
}

function QualityDetail({
  member,
  appearance,
}: {
  member: QualityListMemberView
  appearance: MarketQualityAppearance
}) {
  const lang = useLang()
  const { quality } = member
  return (
    <section className="market-quality__detail" data-testid="live-quality-detail">
      <header>
        <div>
          <p>{t('liveQualityDetailEyebrow', lang)}</p>
          <h3>{t('liveQualityDetailTitle', lang)}</h3>
        </div>
        <Token value={quality.identity.analysis_unit_id} />
      </header>
      <div className="market-quality__detail-grid">
        <div>
          <h4>{t('qualitySourcesTitle', lang)}</h4>
          {quality.source_summaries.length === 0 ? <code>NONE</code> : null}
          <ul>
            {quality.source_summaries.map((row, index) => (
              <li key={`${tokenText(row.source_ref)}:${index}`}>
                <Token value={row.source_ref} />
                <span>
                  {appearance === 'FORMAL_PUBLIC' ? t('publicFreshCount', lang) : 'fresh'}{' '}
                  {row.fresh_feature_count}/{row.expected_feature_count}
                </span>
                <span>
                  {appearance === 'FORMAL_PUBLIC' ? t('publicMissingCount', lang) : 'missing'}{' '}
                  {row.missing_feature_count}
                </span>
                <span>
                  {appearance === 'FORMAL_PUBLIC' ? t('publicStaleCount', lang) : 'stale'}{' '}
                  {row.stale_feature_count}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{t('qualityConflictsTitle', lang)}</h4>
          {quality.conflicts.length === 0 ? <code>NONE</code> : null}
          <ul>
            {quality.conflicts.map((row, index) => (
              <li key={`${tokenText(row.feature_key)}:${index}`}>
                <Token value={row.feature_key} />
                <Token value={row.reason_code} />
                <span>
                  {appearance === 'FORMAL_PUBLIC' ? t('publicFactsCount', lang) : 'facts'}{' '}
                  {row.source_fact_count}
                </span>
                {row.relative_dispersion === null ? null : (
                  <span>
                    {appearance === 'FORMAL_PUBLIC' ? t('publicDispersion', lang) : 'dispersion'}{' '}
                    {row.relative_dispersion}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{t('qualityQueriesTitle', lang)}</h4>
          {quality.query_observations.length === 0 ? <code>NONE</code> : null}
          <ul>
            {quality.query_observations.map((row, index) => (
              <li key={`${tokenText(row.observation_id)}:${index}`}>
                <Token value={row.source_ref} />
                <EnumChip machine={row.query_kind} />
                <EnumChip machine={row.sample_state} />
                <EnumChip machine={row.capability_state} />
                <span>
                  {appearance === 'FORMAL_PUBLIC' ? t('publicReturnedCount', lang) : 'returned'}{' '}
                  {row.returned_member_count}
                </span>
                {row.sample_state === 'ZERO_CURRENT_SAMPLE' ? (
                  <em>{t('qualityZeroSampleNote', lang)}</em>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function MarketQualitySection({
  gateway,
  initialQueryAsOf,
  now = systemNow,
  presentation = LOCAL_MARKET_QUALITY_PRESENTATION,
  appearance = 'TECHNICAL',
}: {
  gateway?: FormalResultReadGateway
  initialQueryAsOf?: string
  now?: () => Date
  presentation?: MarketQualityPresentation
  appearance?: MarketQualityAppearance
}) {
  const lang = useLang()
  const source = useMemo(() => gateway ?? new HttpFormalResultReadGateway(), [gateway])
  if (source.kind !== 'LOCAL_RESULT_API') {
    throw new TypeError('MarketQualitySection accepts the local real-result gateway only')
  }
  const [queryAsOf, setQueryAsOf] = useState(() => initialQueryAsOf ?? utcQueryInstant(now()))
  const [analysisUnitKind, setAnalysisUnitKind] = useState<AnalysisUnitKindValue | null>(null)
  const [editionKind, setEditionKind] = useState<EditionKindValue | null>(null)
  const [pageSize, setPageSize] = useState<number>(50)
  const [cursorStack, setCursorStack] = useState<readonly string[]>([])
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const cursor = cursorStack.at(-1) ?? null
  const state = useAsync(
    (signal) =>
      loadQualityListPage(
        source,
        {
          as_of: queryAsOf,
          analysis_unit_kind: analysisUnitKind,
          edition_kind: editionKind,
          parent_analysis_unit_id: null,
          sort: 'ANALYSIS_UNIT_ID_ASC',
          page_size: pageSize,
        },
        cursor,
        signal,
      ),
    [source, queryAsOf, analysisUnitKind, editionKind, pageSize, cursor, attempt],
  )

  const resetPage = () => {
    setCursorStack([])
    setSelectedSnapshot(null)
  }
  const refreshLatest = () => {
    setQueryAsOf(utcQueryInstant(now()))
    resetPage()
  }
  const readyPage =
    state.status === 'ready' && state.value.kind === 'READY' ? state.value.page : null
  const selectedMember = readyPage?.members.find(
    (member) => member.quality.snapshot_id === selectedSnapshot,
  )

  return (
    <section
      className="market-quality"
      data-testid="market-live-quality"
      data-data-environment={presentation.dataEnvironment}
    >
      <header>
        <div>
          <p>{t('liveQualityEyebrow', lang)}</p>
          <h2>{t('liveQualityTitle', lang)}</h2>
          <p className="scope-note">{t('liveQualityIntro', lang)}</p>
        </div>
        {appearance === 'TECHNICAL' ? (
          <div className="market-quality__channel">
            <strong>{presentation.transportLabel}</strong>
            <code>REAL_QUALITY</code>
          </div>
        ) : null}
      </header>

      {appearance === 'FORMAL_PUBLIC' ? (
        <details className="formal-data-context market-quality__public-context" data-testid="live-quality-query">
          <summary>{t('publicDataDetails', lang)}</summary>
          <dl>
            <div><dt>{t('liveQualityQueryAsOf', lang)}</dt><dd><time>{queryAsOf}</time></dd></div>
            <div><dt>{t('liveQualityPage', lang)}</dt><dd>{cursorStack.length + 1}</dd></div>
          </dl>
        </details>
      ) : (
        <dl className="market-quality__query" data-testid="live-quality-query">
          <div>
            <dt>{t('liveQualityQueryAsOf', lang)}</dt>
            <dd><code>{queryAsOf}</code></dd>
          </div>
          <div>
            <dt>{t('liveQualitySort', lang)}</dt>
            <dd><code>ANALYSIS_UNIT_ID_ASC</code></dd>
          </div>
          <div>
            <dt>{t('liveQualityPage', lang)}</dt>
            <dd><strong>{cursorStack.length + 1}</strong></dd>
          </div>
          <div>
            <dt>{t('liveQualityTransport', lang)}</dt>
            <dd><code>{presentation.transportLabel}</code></dd>
          </div>
        </dl>
      )}

      <div className="market-quality__controls" aria-label={t('liveQualityFilters', lang)}>
        <label>
          <span>{t('liveQualityKindFilter', lang)}</span>
          <select
            data-testid="quality-filter-kind"
            value={analysisUnitKind ?? ''}
            onChange={(event) => {
              setAnalysisUnitKind(
                event.target.value === ''
                  ? null
                  : (event.target.value as AnalysisUnitKindValue),
              )
              resetPage()
            }}
          >
            <option value="">{t('liveQualityAll', lang)}</option>
            {ANALYSIS_UNIT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {label(analysisUnitKindLabel, kind, lang)}{appearance === 'TECHNICAL' ? ` · ${kind}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('liveQualityEditionFilter', lang)}</span>
          <select
            data-testid="quality-filter-edition"
            value={editionKind ?? ''}
            onChange={(event) => {
              setEditionKind(
                event.target.value === '' ? null : (event.target.value as EditionKindValue),
              )
              resetPage()
            }}
          >
            <option value="">{t('liveQualityAll', lang)}</option>
            {EDITION_KINDS.map((edition) => (
              <option key={edition} value={edition}>
                {label(editionKindLabel, edition, lang)}{appearance === 'TECHNICAL' ? ` · ${edition}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('liveQualityPageSize', lang)}</span>
          <select
            data-testid="quality-filter-page-size"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              resetPage()
            }}
          >
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button type="button" className="market-quality__refresh" onClick={refreshLatest}>
          {t('liveQualityRefresh', lang)}
        </button>
      </div>

      {state.status === 'loading' ? (
        <div className="market-quality__loading" role="status">
          {t('liveQualityLoading', lang)}
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="market-quality__error" role="alert" data-testid="live-quality-boundary-error">
          <strong>
            {t(appearance === 'FORMAL_PUBLIC' ? 'publicQualityReadUnavailable' : 'liveQualityUnavailable', lang)}
          </strong>
          {appearance === 'TECHNICAL' ? (
            state.error instanceof ResultGatewayTransportError ? (
              <code>{state.error.code}</code>
            ) : (
              <code>CONSUMPTION_BOUNDARY_REJECTED</code>
            )
          ) : null}
          <p>
            {t(appearance === 'FORMAL_PUBLIC' ? 'publicQualityReadUnavailableNote' : 'liveQualityUnavailableNote', lang)}
          </p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            {t('liveQualityRetry', lang)}
          </button>
        </div>
      ) : null}

      {state.status === 'ready' && state.value.kind === 'CONTROLLED_ERROR' ? (
        <div className="market-quality__error" role="alert" data-testid="live-quality-controlled-error">
          <strong>
            {t(appearance === 'FORMAL_PUBLIC' ? 'publicQualityReadUnavailable' : 'liveQualityControlledError', lang)}
          </strong>
          {appearance === 'TECHNICAL' ? (
            <>
              <code>{state.value.error.code}</code>
              <code>http_status={state.value.error.http_status}</code>
              <code>retryable={String(state.value.error.retryable)}</code>
            </>
          ) : null}
          <p>
            {t(appearance === 'FORMAL_PUBLIC' ? 'publicQualityReadUnavailableNote' : 'liveQualityUnavailableNote', lang)}
          </p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            {t('liveQualityRetry', lang)}
          </button>
        </div>
      ) : null}

      {readyPage ? (
        <>
          <PageAccounting accounting={readyPage.accounting} />
          <p className="market-quality__accounting-note">{t('liveQualityPageAccountingNote', lang)}</p>
          {readyPage.members.length === 0 ? (
            <EmptyList />
          ) : (
            <>
              <div
                className="table-scroll market-quality__table"
              >
              <table>
                <thead>
                  <tr>
                    <th>{t('liveQualityUnitRef', lang)}</th>
                    <th>{t('liveQualityIdentity', lang)}</th>
                    <th>{t('liveQualityCoverage', lang)}</th>
                    <th>{t('liveQualityFreshCoverage', lang)}</th>
                    <th>{t('liveQualityMissing', lang)}</th>
                    <th>{t('liveQualitySourceFacts', lang)}</th>
                    {appearance === 'TECHNICAL' ? <th>as_of / available_at / published_at</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {readyPage.members.map((member) => (
                    <QualityRow
                      key={member.quality.snapshot_id}
                      member={member}
                      selected={selectedSnapshot === member.quality.snapshot_id}
                      onSelect={() =>
                        setSelectedSnapshot((current) =>
                          current === member.quality.snapshot_id
                            ? null
                            : member.quality.snapshot_id,
                        )
                      }
                      appearance={appearance}
                    />
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
          <nav className="market-quality__pagination" aria-label={t('liveQualityPagination', lang)}>
            <button
              type="button"
              disabled={cursorStack.length === 0}
              onClick={() => {
                setCursorStack((current) => current.slice(0, -1))
                setSelectedSnapshot(null)
              }}
            >
              {t('liveQualityPrevious', lang)}
            </button>
            <span>{t('liveQualityPage', lang)} {cursorStack.length + 1}</span>
            <button
              type="button"
              disabled={readyPage.next_cursor === null}
              onClick={() => {
                if (readyPage.next_cursor !== null) {
                  setCursorStack((current) => [...current, readyPage.next_cursor!])
                  setSelectedSnapshot(null)
                }
              }}
            >
              {t('liveQualityNext', lang)}
            </button>
          </nav>
          {selectedMember ? (
            <QualityDetail member={selectedMember} appearance={appearance} />
          ) : null}
        </>
      ) : null}
    </section>
  )
}
