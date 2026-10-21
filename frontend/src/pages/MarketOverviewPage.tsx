import { useState } from 'react'
import { researchApi } from '../api'
import { marketDimensions, sectorDimensions } from '../contract/dimensions'
import { DimensionGrid } from '../components/DimensionGrid'
import { ScopeHeaderBar } from '../components/ScopeHeaderBar'
import { CollectionHeaderBar } from '../components/CollectionHeaderBar'
import { SectorBreadthChart } from '../components/SectorBreadthChart'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { useAsync } from '../hooks/useAsync'
import type { FormalResultReadGateway } from '../api/FormalResultReadApi'
import { MarketQualitySection } from '../components/MarketQualitySection'

const SECTIONS = [
  { id: 'market', titleKey: 'sectionMarket' },
  { id: 'sectors', titleKey: 'sectionSectors' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function MarketOverviewPage({
  qualityGateway,
}: {
  qualityGateway?: FormalResultReadGateway
}) {
  const lang = useLang()
  const state = useAsync(() => researchApi().getMarketOverview(lang), [lang])
  const [section, setSection] = useState<SectionId>('market')

  return (
    <div className="page" data-testid="page-market">
      <h1>{t('pageMarket', lang)}</h1>

      <MarketQualitySection gateway={qualityGateway} />

      {state.status !== 'ready' ? (
        <p className="loading">{t('loading', lang)}</p>
      ) : (
        <>
          <nav className="subnav" data-testid="market-subnav">
            {SECTIONS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === section ? 'is-active' : undefined}
                aria-pressed={entry.id === section}
                data-testid={`market-section-${entry.id}`}
                onClick={() => setSection(entry.id)}
              >
                {t(entry.titleKey, lang)}
              </button>
            ))}
          </nav>

          {section === 'market' ? (
            <section data-testid="market-section-body-market">
              <h2>
                {t('marketUnit', lang)} <code>{state.value.market.analysis_unit_id}</code>
              </h2>
              <ScopeHeaderBar header={state.value.header} />
              <p className="scope-note">{t('marketNoItemDims', lang)}</p>
              <DimensionGrid dimensions={marketDimensions(state.value.market, lang)} />
            </section>
          ) : (
            <section data-testid="market-section-body-sectors">
              <h2>{t('sectors', lang)}</h2>
              <CollectionHeaderBar header={state.value.sectors_header} />
              <p className="scope-note">{t('sectorSeparation', lang)}</p>
              <SectorBreadthChart sectors={state.value.sectors} />
              {state.value.sectors.map((sector) => (
                <section className="sector-card" key={sector.analysis_unit_id}>
                  <h3>
                    <code>{sector.analysis_unit_id}</code>
                  </h3>
                  <DimensionGrid dimensions={sectorDimensions(sector, lang)} />
                  <dl className="breadth">
                    <div>
                      <dt>
                        <code>advancing_member_ratio</code>
                      </dt>
                      <dd>{sector.breadth.advancing_member_ratio ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>
                        <code>median_member_return</code>
                      </dt>
                      <dd>{sector.breadth.median_member_return ?? '—'}</dd>
                    </div>
                  </dl>
                </section>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
