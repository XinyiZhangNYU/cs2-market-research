import type { MouseEvent } from 'react'
import { useLang } from '../i18n'
import { t, type StringKey } from '../i18n/strings'

type PlannedFeature = 'MARKET' | 'WATCHLIST'

type PlannedFeatureCopy = Readonly<{
  testId: string
  modifier: string
  eyebrow: StringKey
  title: StringKey
  intro: StringKey
  plan: readonly [StringKey, StringKey, StringKey]
}>

const COPY = {
  MARKET: {
    testId: 'public-market-page',
    modifier: 'market',
    eyebrow: 'publicMarketEyebrow',
    title: 'publicMarketTitle',
    intro: 'publicMarketIntro',
    plan: [
      'publicMarketPlanState',
      'publicMarketPlanSector',
      'publicMarketPlanHistory',
    ],
  },
  WATCHLIST: {
    testId: 'public-watchlist-page',
    modifier: 'watchlist',
    eyebrow: 'publicWatchlistEyebrow',
    title: 'publicWatchlistTitle',
    intro: 'publicWatchlistIntro',
    plan: [
      'publicWatchlistPlanState',
      'publicWatchlistPlanReason',
      'publicWatchlistPlanHistory',
    ],
  },
} as const satisfies Readonly<Record<PlannedFeature, PlannedFeatureCopy>>

export function PublicPlannedFeaturePage({
  feature,
  homeHref,
  catalogHref,
  onHomeClick,
  onCatalogClick,
}: {
  feature: PlannedFeature
  homeHref: string
  catalogHref: string
  onHomeClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const copy = COPY[feature]

  return (
    <section
      className={`public-planned public-planned--${copy.modifier}`}
      aria-labelledby={`${copy.testId}-title`}
      data-testid={copy.testId}
    >
      <div className="public-planned__copy">
        <p className="public-planned__eyebrow">{t(copy.eyebrow, lang)}</p>
        <h1 id={`${copy.testId}-title`}>{t(copy.title, lang)}</h1>
        <strong role="status">{t('publicPlannedStatus', lang)}</strong>
        <p>{t(copy.intro, lang)}</p>
        <div className="public-planned__actions">
          <a href={homeHref} onClick={onHomeClick}>{t('publicPlannedBackHome', lang)}</a>
          <a href={catalogHref} onClick={onCatalogClick}>{t('publicPlannedChooseItem', lang)}</a>
        </div>
      </div>

      <aside className="public-planned__plan">
        <p>{t('publicPlannedPlanLabel', lang)}</p>
        <ol>
          {copy.plan.map((key, index) => (
            <li key={key}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {t(key, lang)}
            </li>
          ))}
        </ol>
        <strong>{t('publicValveNotice', lang)}</strong>
      </aside>
    </section>
  )
}
