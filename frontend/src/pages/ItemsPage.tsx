import { useState } from 'react'
import { researchApi } from '../api'
import type { PoolRow } from '../api/ResearchApi'
import { CaseStatus, DataStatus, OutcomeLabel, Recommendation } from '../contract/enums'
import { hasOpenCase } from '../contract/caseLifecycle'
import {
  analysisUnitKindLabel,
  caseStatusLabel,
  dataStatusLabel,
  evidenceFlagLabel,
  itemCycleStageLabel,
  label,
  lifecycleActionLabel,
  lifecycleEntityKindLabel,
  outcomeLabelLabel,
  recommendationLabel,
  regimeRelationLabel,
  resolutionCodeLabel,
  signalStrengthLabel,
  validationLevelLabel,
} from '../contract/labels'
import { EnumChip } from '../components/EnumChip'
import { CollectionHeaderBar } from '../components/CollectionHeaderBar'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { useAsync } from '../hooks/useAsync'

function WatchRow({ row, onOpenItem }: { row: PoolRow; onOpenItem: (id: string) => void }) {
  const lang = useLang()
  const [open, setOpen] = useState(false)
  const { unit, state, recommendation } = row
  const id = unit.analysis_unit_id
  const detailId = `watch-detail-${id}`

  return (
    <li
      className={open ? 'watch-row is-open' : 'watch-row'}
      data-testid={`watch-row-${id}`}
    >
      <div className="watch-row__overview">
        <ItemImageSlot
          source={unit.image}
          label={unit.display_name}
          variant="thumbnail"
          testId={`item-image-${id}-list`}
        />
        <div className="watch-row__main">
          <div className="watch-row__head">
            <button
              type="button"
              className="watch-row__toggle"
              aria-expanded={open}
              aria-controls={detailId}
              data-testid={`watch-toggle-${id}`}
              onClick={() => setOpen((current) => !current)}
            >
              <code>{id}</code>
              <span>{unit.display_name}</span>
            </button>
            <div
              className="watch-axis watch-axis--primary"
              data-testid={`watch-axis-recommendation-${id}`}
            >
              <span className="watch-axis__label">{t('watchAxisRecommendation', lang)}</span>
              <EnumChip
                machine={state.recommendation}
                label={label(recommendationLabel, state.recommendation, lang)}
                tone={
                  state.recommendation === Recommendation.WITHHELD_DATA_INCOMPLETE
                    ? 'warn'
                    : 'neutral'
                }
              />
            </div>
          </div>

          <div className="watch-row__tags" data-testid={`watch-tags-${id}`}>
            <div
              className="watch-axis watch-axis--secondary"
              data-testid={`watch-axis-cycle-${id}`}
            >
              <span className="watch-axis__label">{t('watchAxisCycleStage', lang)}</span>
              <EnumChip
                machine={state.cycle_stage}
                label={label(itemCycleStageLabel, state.cycle_stage, lang)}
              />
            </div>
            {state.case_status === CaseStatus.SUSPENDED ? (
              <div
                className="watch-axis watch-axis--alert"
                data-testid={`watch-axis-suspended-${id}`}
              >
                <span className="watch-axis__label">{t('watchAxisCaseStatus', lang)}</span>
                <EnumChip
                  machine={state.case_status}
                  label={label(caseStatusLabel, state.case_status, lang)}
                  tone="warn"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        id={detailId}
        className="watch-row__detail"
        data-testid={`watch-detail-${id}`}
        hidden={!open}
      >
        <section
          className="watch-snapshot"
          data-testid={`watch-snapshot-evidence-${id}`}
        >
          <h4>{t('watchSnapshotEvidence', lang)}</h4>
          <dl>
            <div>
              <dt>
                <code>evidence_flags</code>
              </dt>
              <dd>
                {state.evidence_flags.length === 0 ? (
                  <code>NONE</code>
                ) : (
                  state.evidence_flags.map((flag) => (
                    <EnumChip
                      key={flag}
                      machine={flag}
                      label={label(evidenceFlagLabel, flag, lang)}
                    />
                  ))
                )}
              </dd>
            </div>
            <div>
              <dt>
                <code>regime_relation</code>
              </dt>
              <dd>
                {state.regime_relation.length === 0 ? (
                  <code>NONE</code>
                ) : (
                  state.regime_relation.map((relation) => (
                    <EnumChip
                      key={relation}
                      machine={relation}
                      label={label(regimeRelationLabel, relation, lang)}
                    />
                  ))
                )}
              </dd>
            </div>
          </dl>
        </section>
        <section className="watch-snapshot" data-testid={`watch-snapshot-data-${id}`}>
          <h4>{t('watchSnapshotData', lang)}</h4>
          <dl>
            <div>
              <dt>
                <code>data_status</code>
              </dt>
              <dd>
                <EnumChip
                  machine={state.data_status}
                  label={label(dataStatusLabel, state.data_status, lang)}
                  tone={state.data_status === DataStatus.CONFLICTED ? 'blocked' : 'neutral'}
                />
              </dd>
            </div>
            <div>
              <dt>
                <code>signal_strength</code>
              </dt>
              <dd>
                <EnumChip
                  machine={recommendation.signal_strength}
                  label={label(signalStrengthLabel, recommendation.signal_strength, lang)}
                />
              </dd>
            </div>
            <div>
              <dt>
                <code>evidence_coverage</code>
              </dt>
              <dd>
                <code>{recommendation.evidence_coverage}</code>
              </dd>
            </div>
            <div>
              <dt>
                <code>trade_confirmation</code> / <code>data_branch</code>
              </dt>
              <dd>
                <code>
                  {recommendation.trade_confirmation} / {recommendation.data_branch}
                </code>
              </dd>
            </div>
          </dl>
        </section>
        <section className="watch-snapshot" data-testid={`watch-snapshot-identity-${id}`}>
          <h4>{t('watchSnapshotIdentity', lang)}</h4>
          <dl>
            <div>
              <dt>
                <code>{state.candidate_episode_id ? 'candidate_episode_id' : 'cycle_case_id'}</code>
              </dt>
              <dd>
                {/* models.py rejects a snapshot with both ids set: an active cycle case replaces an
                    active candidate episode. Showing both slots reads as two concurrent cases. */}
                <code>{state.candidate_episode_id ?? state.cycle_case_id ?? 'null'}</code>
              </dd>
            </div>
            <div>
              <dt>
                <code>available_at</code>
              </dt>
              <dd>
                <code>{state.available_at}</code>
              </dd>
            </div>
          </dl>
        </section>
        <button type="button" className="watch-row__open" onClick={() => onOpenItem(id)}>
          {t('openDetailPage', lang)}
        </button>
      </div>
    </li>
  )
}

export function ItemsPage({
  onOpenItem,
  onOpenBrowse,
}: {
  onOpenItem: (id: string) => void
  onOpenBrowse: () => void
}) {
  const lang = useLang()
  const state = useAsync(
    () =>
      Promise.all([researchApi().getCandidatePool(lang), researchApi().getSignalsAndCases(lang)]),
    [lang],
  )
  if (state.status !== 'ready') return <p className="loading">{t('loading', lang)}</p>
  const [pool, cases] = state.value
  const watching = pool.rows.filter((row) => hasOpenCase(row.state.case_status))
  const excluded = pool.rows.filter((row) => !hasOpenCase(row.state.case_status))

  return (
    <div className="page" data-testid="page-items">
      <h1>{t('pageItems', lang)}</h1>
      <p className="scope-note">{t('catalogBrowseEntryNote', lang)}</p>
      <button type="button" data-testid="open-catalog-browse" onClick={onOpenBrowse}>
        {t('catalogBrowseEntry', lang)}
      </button>

      <section className="panel" data-testid="panel-watching">
        <h2>
          {t('watchingTitle', lang)} <code>case_status in (ACTIVE, SUSPENDED)</code> ·{' '}
          {watching.length}
        </h2>
        <h3>{t('identityGroupTitle', lang)}</h3>
        <p className="scope-note">{t('identityGroupNote', lang)}</p>
        {pool.groups.map((group) => (
          <div key={group.analysis_unit_kind} data-testid={`pool-group-${group.analysis_unit_kind}`}>
            <EnumChip
              machine={group.analysis_unit_kind}
              label={label(analysisUnitKindLabel, group.analysis_unit_kind, lang)}
            />
            <CollectionHeaderBar header={group.header} />
          </div>
        ))}
        <p className="scope-note">{t('watchingNote', lang)}</p>
        <div className="panel__body">
          <ul className="watch-list">
            {watching.map((row) => (
              <WatchRow key={row.unit.analysis_unit_id} row={row} onOpenItem={onOpenItem} />
            ))}
          </ul>
          {watching.length === 0 ? <p className="muted">{t('watchingEmpty', lang)}</p> : null}
        </div>

        <h3>
          {t('notWatchingTitle', lang)} · {excluded.length}
        </h3>
        <p className="scope-note">{t('notWatchingNote', lang)}</p>
        {/* Every unit opens its detail page, watched or not. When nothing is under observation
            these rows are the only route into the item view, and an empty market is legal. */}
        <div className="panel__body">
          <ul className="events" data-testid="not-watching">
            {excluded.map((row) => (
              <li className="item-list-row" key={row.unit.analysis_unit_id}>
                <ItemImageSlot
                  source={row.unit.image}
                  label={row.unit.display_name}
                  variant="thumbnail"
                  testId={`item-image-${row.unit.analysis_unit_id}-list`}
                />
                <div className="item-list-row__content">
                  <button
                    type="button"
                    className="unit-link"
                    title={t('openUnit', lang)}
                    onClick={() => onOpenItem(row.unit.analysis_unit_id)}
                  >
                    <code>{row.unit.analysis_unit_id}</code>
                    <span>{row.unit.display_name}</span>
                  </button>
                  <div className="item-list-row__tags">
                    <EnumChip
                      machine={
                        row.state.case_status === null ? 'case_status=null' : row.state.case_status
                      }
                      label={
                        row.state.case_status === null
                          ? undefined
                          : label(caseStatusLabel, row.state.case_status, lang)
                      }
                    />
                    <EnumChip
                      machine={row.state.recommendation}
                      label={label(recommendationLabel, row.state.recommendation, lang)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <h3>
          {t('backgroundTitle', lang)} · {pool.background.length}
        </h3>
        <p className="scope-note">{t('backgroundNote', lang)}</p>
        <div className="panel__body">
          <ul className="events" data-testid="pool-background">
            {pool.background.map((row) => (
              <li
                className="item-list-row item-list-row--background"
                key={row.unit.analysis_unit_id}
              >
                <ItemImageSlot
                  source={row.unit.image}
                  label={row.unit.display_name}
                  variant="thumbnail"
                  testId={`item-image-${row.unit.analysis_unit_id}-list`}
                />
                <div className="item-list-row__content">
                  <button
                    type="button"
                    className="unit-link"
                    title={t('openUnit', lang)}
                    onClick={() => onOpenItem(row.unit.analysis_unit_id)}
                  >
                    <code>{row.unit.analysis_unit_id}</code>
                    <span>{row.unit.display_name}</span>
                  </button>
                  <div className="item-list-row__tags">
                    <EnumChip
                      machine={row.unit.analysis_unit_kind}
                      label={label(analysisUnitKindLabel, row.unit.analysis_unit_kind, lang)}
                    />
                    <EnumChip machine="BACKGROUND_ONLY" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel" data-testid="panel-history">
        <h2>{t('historyTitle', lang)}</h2>
        {/* The case history is a second, independently fetched collection. Rendering it under the
            pool's envelope would claim both were produced at the same instant off the same run. */}
        <CollectionHeaderBar header={cases.header} />
        <p className="scope-note">{t('historyNote', lang)}</p>

        <h3>{t('outcomeSpread', lang)}</h3>
        <div className="outcome-spread" data-testid="outcome-spread">
          {Object.values(OutcomeLabel).map((value) => (
            <div className="outcome-spread__cell" key={value} data-outcome={value}>
              <code>{value}</code>
              <em>{label(outcomeLabelLabel, value, lang)}</em>
              <strong>{cases.outcomes.filter((o) => o.label === value).length}</strong>
            </div>
          ))}
        </div>

        <div className="panel__body">
          <h3>{t('outcomeTitle', lang)}</h3>
          <p className="scope-note">{t('outcomeNote', lang)}</p>
          <div className="table-scroll">
            <table data-testid="outcome-table">
              <thead>
                <tr>
                  <th>case_id</th>
                  <th>analysis_unit_id</th>
                  <th>label</th>
                  <th>validation_level</th>
                  <th>resolution_code</th>
                  <th>evaluated_at</th>
                </tr>
              </thead>
              <tbody>
                {cases.outcomes.map((outcome) => (
                  <tr key={outcome.case_id}>
                    <td>
                      <code>{outcome.case_id}</code>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="unit-link"
                        title={t('openUnit', lang)}
                        onClick={() => onOpenItem(outcome.analysis_unit_id)}
                      >
                        <code>{outcome.analysis_unit_id}</code>
                      </button>
                    </td>
                    <td>
                      <EnumChip
                        machine={outcome.label}
                        label={label(outcomeLabelLabel, outcome.label, lang)}
                      />
                    </td>
                    <td>
                      <EnumChip
                        machine={outcome.validation_level}
                        label={label(validationLevelLabel, outcome.validation_level, lang)}
                      />
                    </td>
                    <td>
                      {outcome.resolution_code ? (
                        <EnumChip
                          machine={outcome.resolution_code}
                          label={label(resolutionCodeLabel, outcome.resolution_code, lang)}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <code>{outcome.evaluated_at}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>{t('lifecycleTitle', lang)}</h3>
          <p className="scope-note">{t('lifecycleNote', lang)}</p>
          <div className="table-scroll">
            <table data-testid="lifecycle-table">
              <thead>
                <tr>
                  <th>occurred_at</th>
                  <th>entity_kind</th>
                  <th>entity_id</th>
                  <th>analysis_unit_id</th>
                  <th>action</th>
                  <th>previous_entity_id</th>
                  <th>resolution_code</th>
                </tr>
              </thead>
              <tbody>
                {cases.events.map((event) => (
                  <tr key={`${event.entity_id}-${event.action}-${event.occurred_at}`}>
                    <td>
                      <code>{event.occurred_at}</code>
                    </td>
                    <td>
                      <EnumChip
                        machine={event.entity_kind}
                        label={label(lifecycleEntityKindLabel, event.entity_kind, lang)}
                      />
                    </td>
                    <td>
                      <code>{event.entity_id}</code>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="unit-link"
                        title={t('openUnit', lang)}
                        onClick={() => onOpenItem(event.analysis_unit_id)}
                      >
                        <code>{event.analysis_unit_id}</code>
                      </button>
                    </td>
                    <td>
                      <EnumChip
                        machine={event.action}
                        label={label(lifecycleActionLabel, event.action, lang)}
                      />
                    </td>
                    <td>
                      {event.previous_entity_id ? <code>{event.previous_entity_id}</code> : '—'}
                    </td>
                    <td>
                      {event.resolution_code ? (
                        <EnumChip
                          machine={event.resolution_code}
                          label={label(resolutionCodeLabel, event.resolution_code, lang)}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
