import { LANG_CODE, LANGS, useLang, type Lang } from '../i18n'
import { t } from '../i18n/strings'
import type { FrontendDataMode } from '../dataMode'

export const PROTOTYPE_STATUS = 'EXPLORATORY_FRONTEND_PROTOTYPE / MOCK_DATA_ONLY'
export const FORMAL_FIXTURE_STATUS =
  'EXPLORATORY_FRONTEND_PROTOTYPE / FORMAL_FIXTURE_ONLY'
export const MIXED_PROVENANCE_STATUS =
  'EXPLORATORY_FRONTEND_PROTOTYPE / MIXED_PROVENANCE'

export function PrototypeBanner({
  dataMode,
  includesLiveQuality = false,
  includesLiveCatalog = false,
  onSwitchLang,
}: {
  dataMode: FrontendDataMode
  includesLiveQuality?: boolean
  includesLiveCatalog?: boolean
  onSwitchLang: (lang: Lang) => void
}) {
  const lang = useLang()
  const formal = dataMode === 'FORMAL_FIXTURE'
  const mixed = !formal && (includesLiveQuality || includesLiveCatalog)
  const mixedNote = includesLiveCatalog
    ? 'mixedCatalogBannerNote'
    : 'mixedBannerNote'
  return (
    <div
      className={`prototype-banner${formal ? ' prototype-banner--formal' : ''}${mixed ? ' prototype-banner--mixed' : ''}`}
      data-testid="prototype-banner"
      data-data-mode={dataMode}
      role="note"
    >
      <strong>
        {t(formal ? 'formalBannerStatus' : mixed ? 'mixedBannerStatus' : 'bannerStatus', lang)}
      </strong>
      <span>{t(formal ? 'formalBannerNote' : mixed ? mixedNote : 'bannerNote', lang)}</span>
      <div className="lang-switch" data-testid="lang-switch" role="group">
        {LANGS.map((option) => (
          <button
            key={option}
            type="button"
            data-testid={`lang-${option}`}
            aria-pressed={option === lang}
            className={option === lang ? 'is-active' : undefined}
            onClick={() => onSwitchLang(option)}
          >
            {LANG_CODE[option]}
          </button>
        ))}
      </div>
    </div>
  )
}
