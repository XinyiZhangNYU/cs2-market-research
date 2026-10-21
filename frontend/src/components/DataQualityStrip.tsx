// Data status and validation level constrain every conclusion behind both entries, so this
// band rides along with each view instead of sitting behind a third door of its own.

import { researchApi } from '../api'
import { ClaimNotAllowed, validateValidationClaim } from '../contract/claims'
import { DataStatus, Directness, ValidationClaim } from '../contract/enums'
import { dataStatusLabel, directnessLabel, label, validationLevelLabel } from '../contract/labels'
import { CONTRACT_PROPOSALS } from '../contract/provenance'
import { pick, useLang, type Lang } from '../i18n'
import { t } from '../i18n/strings'
import { useAsync } from '../hooks/useAsync'
import { EnumChip } from './EnumChip'

function claimVerdict(
  level: Parameters<typeof validateValidationClaim>[0],
  lang: Lang,
): string {
  try {
    validateValidationClaim(level, ValidationClaim.FULL_PDS_ALGORITHM_VALIDATED)
    return t('validationAllowed', lang)
  } catch (error) {
    if (error instanceof ClaimNotAllowed) return error.message
    throw error
  }
}

export function DataQualityStrip() {
  const lang = useLang()
  const state = useAsync(
    () => Promise.all([researchApi().getDataQuality(lang), researchApi().getResearchReport(lang)]),
    [lang],
  )
  if (state.status !== 'ready') return null
  const [quality, report] = state.value
  // The summary is the only part a reader sees without acting, so the source data statuses go
  // there rather than inside. A count of contract proposals is developer bookkeeping and stays in
  // the body; it was never the thing that should stop someone trusting a conclusion.
  //
  // These are the distinct statuses the sources actually carry, not a verdict over the set. An
  // earlier version drew a single COMPLETE chip when nothing was degraded, which invented a
  // set-level status the sources never state — the same move the collection envelope refuses.
  const sourceStatuses = [...new Set(quality.sources.map((source) => source.data_status))].sort()

  return (
    <details className="quality-strip" data-testid="quality-strip">
      <summary data-testid="quality-summary">
        <strong>{t('stripTitle', lang)}</strong>
        <EnumChip
          machine={report.validation_level}
          label={label(validationLevelLabel, report.validation_level, lang)}
          tone="warn"
        />
        <span className="quality-strip__risk" data-testid="quality-risk">
          <code>{t('stripDataRisk', lang)}</code>
          {sourceStatuses.map((status) => (
            <EnumChip
              key={status}
              machine={status}
              label={label(dataStatusLabel, status, lang)}
              tone={status === DataStatus.COMPLETE ? 'neutral' : 'warn'}
            />
          ))}
        </span>
        <code data-testid="quality-isolated">
          {t('stripIsolated', lang)}={quality.isolated_events.length}
        </code>
        <em>{t('stripOpen', lang)}</em>
      </summary>

      <p className="scope-note">{t('stripNote', lang)}</p>

      <h3>{t('sourceCoverage', lang)}</h3>
      <p className="scope-note">{t('sourceCoverageNote', lang)}</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>source_id</th>
              <th>observed_units</th>
              <th>last_observed_at</th>
              <th>directness</th>
              <th>data_status</th>
            </tr>
          </thead>
          <tbody>
            {quality.sources.map((source) => (
              <tr key={source.source_id}>
                <td>
                  <code>{source.source_id}</code>
                </td>
                <td>{source.observed_units}</td>
                <td>
                  <code>{source.last_observed_at}</code>
                </td>
                <td>
                  <EnumChip
                    machine={source.directness}
                    label={label(directnessLabel, source.directness, lang)}
                    tone={source.directness === Directness.INFERRED ? 'warn' : 'neutral'}
                  />
                </td>
                <td>
                  <EnumChip
                    machine={source.data_status}
                    label={label(dataStatusLabel, source.data_status, lang)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>{t('isolatedEvents', lang)}</h3>
      <ul className="events">
        {quality.isolated_events.map((event) => (
          <li key={`${event.analysis_unit_id}-${event.occurred_at}`}>
            <code>{event.occurred_at}</code>
            <code>{event.analysis_unit_id}</code>
            <span>{event.detail}</span>
          </li>
        ))}
      </ul>

      <h3>{t('proposalsTitle', lang)}</h3>
      <p className="scope-note">{t('proposalsNote', lang)}</p>
      <div className="table-scroll">
        <table data-testid="contract-proposals">
          <thead>
            <tr>
              <th>proposedAs</th>
              <th>{t('proposalRequestedBy', lang)}</th>
              <th>{t('proposalNote', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {CONTRACT_PROPOSALS.map((proposal) => (
              <tr key={proposal.proposedAs}>
                <td>
                  <code>{proposal.proposedAs}</code>
                </td>
                <td>{pick(proposal.requestedBy, lang)}</td>
                <td>{pick(proposal.note, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>{t('pageReport', lang)}</h3>
      <h4>{t('validationLevelTitle', lang)}</h4>
      <p className="scope-note" data-testid="validation-verdict">
        {t('validationVerdict', lang)}
        {claimVerdict(report.validation_level, lang)}
      </p>

      <h4>{t('indexMembers', lang)}</h4>
      <p className="scope-note">{t('indexNote', lang)}</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>analysis_unit_id</th>
              <th>display_name</th>
              <th>weight</th>
            </tr>
          </thead>
          <tbody>
            {report.index_members.map((member) => (
              <tr key={member.analysis_unit_id}>
                <td>
                  <code>{member.analysis_unit_id}</code>
                </td>
                <td>{member.display_name}</td>
                <td>
                  <code>{member.weight}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4>{t('paperValidation', lang)}</h4>
      <p>{report.paper_validation_note}</p>
    </details>
  )
}
