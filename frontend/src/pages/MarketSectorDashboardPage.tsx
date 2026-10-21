import { useMemo, useState } from 'react'
import {
  displayToken,
  tokenText,
  type PresentableUnitView,
} from '../adapter/resultViewModel'
import {
  loadMarketSectorDashboard,
  type MarketSectorDashboardView,
} from '../adapter/marketSectorDashboardViewModel'
import type { MarketSectorDashboardGateway } from '../api/MarketSectorDashboardGateway'
import {
  dataBranchLabel,
  dataStatusLabel,
  evidenceFlagLabel,
  label,
  marketLevelRegimeLabel,
  marketTrendStageLabel,
  recommendationLabel,
  relativeStrengthLabel,
  sectorTrendStageLabel,
} from '../contract/labels'
import type { WireMarketState, WireSectorState } from '../wire/types'
import { EnumChip } from '../components/EnumChip'
import { OfflineMarketSectorDashboardGateway } from '../formal/marketSectorDashboardGateway'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'

function marketState(view: PresentableUnitView): WireMarketState {
  if (view.identity.scope_kind !== 'MARKET' || !('level_regime' in view.state)) {
    throw new TypeError('market dashboard view requires a MARKET state')
  }
  return view.state
}

function sectorState(view: PresentableUnitView): WireSectorState {
  if (view.identity.scope_kind !== 'SECTOR' || !('relative_strength' in view.state)) {
    throw new TypeError('sector dashboard row requires a SECTOR state')
  }
  return view.state
}

function VersionRef({ value }: { value: string }) {
  return <code>{tokenText(displayToken(value))}</code>
}

function StatusRail({ view }: { view: MarketSectorDashboardView }) {
  const lang = useLang()
  return (
    <section className="market-dashboard__status" data-testid="dashboard-status-rail">
      <div>
        <span>{t('dashboardTransport', lang)}</span>
        <strong data-testid="dashboard-channel">{view.channel}</strong>
        <small>{t('dashboardTransportNote', lang)}</small>
      </div>
      <div>
        <span>{t('dashboardContract', lang)}</span>
        <strong>{view.contract_status}</strong>
        <small>result-read-api/v1</small>
      </div>
      <div>
        <span>{t('dashboardEconomicStatus', lang)}</span>
        <EnumChip
          machine={view.market.header.data_status}
          label={label(dataStatusLabel, view.market.header.data_status, lang)}
        />
        <small>{t('dashboardEconomicStatusNote', lang)}</small>
      </div>
      <div>
        <span>{t('dashboardMemberAccounting', lang)}</span>
        <strong>
          {view.sector_collection.accounting.returned_member_count}/
          {view.sector_collection.accounting.member_count}
        </strong>
        <small>{t('dashboardMemberAccountingNote', lang)}</small>
      </div>
    </section>
  )
}

function TemporalRail({ view }: { view: MarketSectorDashboardView }) {
  const lang = useLang()
  return (
    <dl className="market-dashboard__time" data-testid="dashboard-temporal-rail">
      <div>
        <dt>{t('dashboardQueryAsOf', lang)}</dt>
        <dd><code>{view.query_as_of}</code></dd>
      </div>
      <div>
        <dt>{t('dashboardResultAsOf', lang)}</dt>
        <dd><code>{view.selected_as_of}</code></dd>
      </div>
      <div>
        <dt>{t('dashboardMarketAvailableAt', lang)}</dt>
        <dd><code>{view.market.header.available_at}</code></dd>
      </div>
      <div>
        <dt>{t('dashboardPublishedAt', lang)}</dt>
        <dd><code>{view.market_published_at}</code></dd>
      </div>
    </dl>
  )
}

function MarketStatePanel({ view }: { view: MarketSectorDashboardView }) {
  const lang = useLang()
  const state = marketState(view.market)
  return (
    <section className="market-dashboard__market" data-testid="dashboard-market-state">
      <header>
        <div>
          <p>{t('dashboardMarketScope', lang)}</p>
          <h2>{t('dashboardMarketState', lang)}</h2>
        </div>
        <code>{tokenText(view.market.identity.analysis_unit_id)}</code>
      </header>
      <div className="market-dashboard__market-grid">
        <div className="market-dashboard__primary-state">
          <span>{t('dimMarketTrend', lang)}</span>
          <strong>{label(marketTrendStageLabel, state.trend_stage, lang)}</strong>
          <code>{state.trend_stage}</code>
        </div>
        <div className="market-dashboard__primary-state">
          <span>{t('dimMarketLevel', lang)}</span>
          <strong>{label(marketLevelRegimeLabel, state.level_regime, lang)}</strong>
          <code>{state.level_regime}</code>
        </div>
        <div>
          <span>{t('dimRecommendation', lang)}</span>
          <EnumChip
            machine={state.recommendation}
            label={label(recommendationLabel, state.recommendation, lang)}
          />
        </div>
        <div>
          <span>{t('dataBranch', lang)}</span>
          <EnumChip
            machine={view.market.header.data_branch}
            label={label(dataBranchLabel, view.market.header.data_branch, lang)}
          />
        </div>
      </div>
      <div className="market-dashboard__flags">
        <span>{t('dashboardEvidenceFlags', lang)}</span>
        <div>
          {state.evidence_flags.length === 0 ? <code>NONE</code> : null}
          {state.evidence_flags.map((flag) => (
            <EnumChip
              key={flag}
              machine={flag}
              label={label(evidenceFlagLabel, flag, lang)}
            />
          ))}
        </div>
      </div>
      <dl className="market-dashboard__versions">
        <div>
          <dt>catalog_version</dt>
          <dd><VersionRef value={view.market.header.versions.catalog_version} /></dd>
        </div>
        <div>
          <dt>index_version</dt>
          <dd><VersionRef value={view.market.header.versions.index_version} /></dd>
        </div>
        <div>
          <dt>algorithm_version</dt>
          <dd><VersionRef value={view.market.header.versions.algorithm_version} /></dd>
        </div>
        <div>
          <dt>parameter_set_version</dt>
          <dd><VersionRef value={view.market.header.versions.parameter_set_version} /></dd>
        </div>
      </dl>
    </section>
  )
}

function BreadthValue({ value }: { value: string | null }) {
  if (value === null) return <code>NULL</code>
  return (
    <span className="market-dashboard__breadth">
      <meter min="0" max="1" value={Number(value)} />
      <code>{value}</code>
    </span>
  )
}

function SectorTable({ view }: { view: MarketSectorDashboardView }) {
  const lang = useLang()
  return (
    <section className="market-dashboard__sectors" data-testid="dashboard-sector-section">
      <header>
        <div>
          <p>{t('dashboardSectorScope', lang)}</p>
          <h2>{t('dashboardSectorTable', lang)}</h2>
        </div>
        <div className="market-dashboard__collection-state">
          <span>{t('dashboardCollectionStatus', lang)}</span>
          <EnumChip
            machine={view.sector_collection.data_status}
            label={label(dataStatusLabel, view.sector_collection.data_status, lang)}
          />
        </div>
      </header>
      <p className="scope-note">{t('dashboardSectorSemanticsNote', lang)}</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t('dashboardSectorRef', lang)}</th>
              <th>trend_stage</th>
              <th>relative_strength</th>
              <th>advancing_member_ratio</th>
              <th>median_member_return</th>
              <th>recommendation</th>
              <th>data_status</th>
              <th>available_at / published_at</th>
            </tr>
          </thead>
          <tbody>
            {view.sectors.map((sector) => {
              const state = sectorState(sector)
              return (
                <tr key={sector.snapshot_id} data-testid="dashboard-sector-row">
                  <td>
                    <code>{tokenText(sector.identity.analysis_unit_id)}</code>
                    <small>snapshot={sector.snapshot_id.slice(0, 12)}…</small>
                  </td>
                  <td>
                    <EnumChip
                      machine={state.trend_stage}
                      label={label(sectorTrendStageLabel, state.trend_stage, lang)}
                    />
                  </td>
                  <td>
                    <EnumChip
                      machine={state.relative_strength}
                      label={label(relativeStrengthLabel, state.relative_strength, lang)}
                    />
                  </td>
                  <td><BreadthValue value={state.breadth.advancing_member_ratio} /></td>
                  <td><code>{state.breadth.median_member_return ?? 'NULL'}</code></td>
                  <td>
                    <EnumChip
                      machine={state.recommendation}
                      label={label(recommendationLabel, state.recommendation, lang)}
                    />
                  </td>
                  <td>
                    <EnumChip
                      machine={sector.header.data_status}
                      label={label(dataStatusLabel, sector.header.data_status, lang)}
                    />
                  </td>
                  <td className="market-dashboard__row-time">
                    <code>{sector.header.available_at}</code>
                    <code>{view.sector_published_at[sector.snapshot_id]}</code>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CollectionAccounting({ view }: { view: MarketSectorDashboardView }) {
  const lang = useLang()
  const accounting = view.sector_collection.accounting
  return (
    <section className="market-dashboard__accounting" data-testid="dashboard-accounting">
      <header>
        <div>
          <p>{t('dashboardCollectionScope', lang)}</p>
          <h2>{t('dashboardAccountingTitle', lang)}</h2>
        </div>
        <code>{tokenText(view.sector_collection.collection_id)}</code>
      </header>
      <div className="market-dashboard__accounting-grid">
        <div><span>member_count</span><strong>{accounting.member_count}</strong></div>
        <div>
          <span>returned_member_count</span>
          <strong>{accounting.returned_member_count}</strong>
        </div>
        <div><span>missing_member_ids</span><strong>{accounting.missing_member_ids.length}</strong></div>
        <div>
          <span>unavailable_member_ids</span>
          <strong>{accounting.unavailable_member_ids.length}</strong>
        </div>
      </div>
      <dl className="market-dashboard__collection-time">
        <div><dt>as_of</dt><dd><code>{view.sector_collection.as_of}</code></dd></div>
        <div><dt>available_at</dt><dd><code>{view.sector_collection.available_at}</code></dd></div>
        <div><dt>published_at</dt><dd><code>{view.sector_collection_published_at}</code></dd></div>
      </dl>
      <p className="scope-note">{t('dashboardAccountingNote', lang)}</p>
    </section>
  )
}

export function MarketSectorDashboardPage({
  gateway,
  queryAsOf,
}: {
  gateway?: MarketSectorDashboardGateway
  queryAsOf?: string
}) {
  const lang = useLang()
  const [attempt, setAttempt] = useState(0)
  const source = useMemo(
    () => gateway ?? new OfflineMarketSectorDashboardGateway(),
    [gateway],
  )
  const state = useAsync(
    () => loadMarketSectorDashboard(source, queryAsOf),
    [source, queryAsOf, attempt],
  )

  return (
    <div className="page market-dashboard" data-testid="page-market-sector-dashboard">
      <header className="market-dashboard__hero">
        <div>
          <p className="market-dashboard__eyebrow">{t('dashboardEyebrow', lang)}</p>
          <h1>{t('dashboardTitle', lang)}</h1>
          <p>{t('dashboardIntro', lang)}</p>
        </div>
        <code>OFFLINE_FIXTURE</code>
      </header>
      {state.status === 'loading' ? (
        <div className="market-dashboard__loading" role="status">
          {t('dashboardLoading', lang)}
        </div>
      ) : null}
      {state.status === 'error' ? (
        <section className="market-dashboard__error" role="alert">
          <strong>{t('dashboardBoundaryError', lang)}</strong>
          <p>{t('dashboardBoundaryErrorNote', lang)}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            {t('formalFixtureRetry', lang)}
          </button>
        </section>
      ) : null}
      {state.status === 'ready' ? (
        <>
          <StatusRail view={state.value} />
          <TemporalRail view={state.value} />
          <MarketStatePanel view={state.value} />
          <SectorTable view={state.value} />
          <CollectionAccounting view={state.value} />
        </>
      ) : null}
    </div>
  )
}
