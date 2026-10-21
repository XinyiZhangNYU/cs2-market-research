import { useMemo, useState } from 'react'
import {
  FormalResultReadApi,
  type FormalResultReadGateway,
} from '../api/FormalResultReadApi'
import { FormalResultReadPanel } from '../components/FormalResultReadPanel'
import {
  FORMAL_FIXTURE_SCENARIOS,
  SharedFormalFixtureGateway,
  formalFixtureScenario,
  runFormalFixtureScenario,
  type FormalFixtureScenarioId,
} from '../formal/fixtureMode'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n'
import { t, type StringKey } from '../i18n/strings'

const SCENARIO_COPY = {
  MARKET_COLLECTION: {
    title: 'formalScenarioMarketCollection',
    note: 'formalScenarioMarketCollectionNote',
  },
  ITEM_LIST: {
    title: 'formalScenarioItemList',
    note: 'formalScenarioItemListNote',
  },
  ITEM_DETAIL: {
    title: 'formalScenarioItemDetail',
    note: 'formalScenarioItemDetailNote',
  },
  QUALITY_DETAIL: {
    title: 'formalScenarioQualityDetail',
    note: 'formalScenarioQualityDetailNote',
  },
  CONTROLLED_ERROR: {
    title: 'formalScenarioControlledError',
    note: 'formalScenarioControlledErrorNote',
  },
} as const satisfies Record<FormalFixtureScenarioId, { title: StringKey; note: StringKey }>

export function FormalFixtureWorkspace({
  initialScenario = 'MARKET_COLLECTION',
  gateway,
}: {
  initialScenario?: FormalFixtureScenarioId
  gateway?: FormalResultReadGateway
}) {
  const lang = useLang()
  const [scenarioId, setScenarioId] = useState<FormalFixtureScenarioId>(initialScenario)
  const [attempt, setAttempt] = useState(0)
  const api = useMemo(() => {
    const fixtureGateway = gateway ?? new SharedFormalFixtureGateway()
    if (fixtureGateway.kind !== 'FORMAL_FIXTURE') {
      throw new TypeError('FormalFixtureWorkspace accepts an offline fixture gateway only')
    }
    return new FormalResultReadApi(fixtureGateway)
  }, [gateway])
  const scenario = formalFixtureScenario(scenarioId)
  const state = useAsync(
    () => runFormalFixtureScenario(api, scenarioId),
    [api, scenarioId, attempt],
  )

  return (
    <div className="page formal-fixture" data-testid="page-formal-fixture">
      <header className="formal-fixture__hero">
        <div>
          <p className="formal-fixture__eyebrow">
            <span />
            {t('formalDeskEyebrow', lang)}
          </p>
          <h1>{t('formalDeskTitle', lang)}</h1>
          <p>{t('formalDeskIntro', lang)}</p>
        </div>
        <dl className="formal-fixture__telemetry" data-testid="formal-fixture-telemetry">
          <div>
            <dt>{t('formalFixtureOperation', lang)}</dt>
            <dd><code>{scenario.operation}</code></dd>
          </div>
          <div>
            <dt>{t('formalFixtureAsOf', lang)}</dt>
            <dd><code>{scenario.queryAsOf}</code></dd>
          </div>
          <div>
            <dt>{t('formalFixtureNetwork', lang)}</dt>
            <dd><code>NO_NETWORK</code></dd>
          </div>
        </dl>
      </header>

      <div
        className="formal-fixture__scenarios"
        role="group"
        aria-label={t('formalScenarioSwitchLabel', lang)}
        data-testid="formal-scenario-switch"
      >
        {FORMAL_FIXTURE_SCENARIOS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className={candidate.id === scenarioId ? 'is-active' : undefined}
            data-testid={`formal-scenario-${candidate.id.toLowerCase().replaceAll('_', '-')}`}
            aria-pressed={candidate.id === scenarioId}
            onClick={() => setScenarioId(candidate.id)}
          >
            <span>{t(SCENARIO_COPY[candidate.id].title, lang)}</span>
            <code>{candidate.operation}</code>
          </button>
        ))}
      </div>

      <section className="formal-fixture__stage" data-testid="formal-fixture-stage">
        <header>
          <div>
            <p className="formal-fixture__sequence">{t('formalFixtureSequence', lang)}</p>
            <h2>{t(SCENARIO_COPY[scenarioId].title, lang)}</h2>
          </div>
          <code>result-read-api/v1</code>
        </header>
        <p className="scope-note">{t(SCENARIO_COPY[scenarioId].note, lang)}</p>

        {state.status === 'loading' ? (
          <div className="formal-fixture__loading" role="status">
            <span />
            {t('formalFixtureLoading', lang)}
          </div>
        ) : null}
        {state.status === 'error' ? (
          <div className="formal-fixture__boundary-error" role="alert">
            <strong>{t('formalFixtureBoundaryError', lang)}</strong>
            <p>{t('formalFixtureBoundaryErrorNote', lang)}</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              {t('formalFixtureRetry', lang)}
            </button>
          </div>
        ) : null}
        {state.status === 'ready' ? <FormalResultReadPanel response={state.value} /> : null}
      </section>
    </div>
  )
}
