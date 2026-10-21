import { FRONTEND_DATA_MODES, type FrontendDataMode } from '../dataMode'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'

function modeLabel(mode: FrontendDataMode, lang: ReturnType<typeof useLang>): string {
  return mode === 'MOCK' ? t('dataModeMock', lang) : t('dataModeFormalFixture', lang)
}

export function DataChannelBar({
  mode,
  includesLiveQuality = false,
  includesLiveCatalog = false,
  onChange,
}: {
  mode: FrontendDataMode
  includesLiveQuality?: boolean
  includesLiveCatalog?: boolean
  onChange: (mode: FrontendDataMode) => void
}) {
  const lang = useLang()
  const formal = mode === 'FORMAL_FIXTURE'
  const mixed = !formal && (includesLiveQuality || includesLiveCatalog)
  const mixedCode = includesLiveCatalog
    ? includesLiveQuality
      ? 'ECONOMIC_MOCK + LIVE_QUALITY + LIVE_CATALOG'
      : 'ECONOMIC_MOCK + LIVE_CATALOG'
    : 'ECONOMIC_MOCK + LIVE_QUALITY'

  return (
    <section
      className={`data-channel data-channel--${formal ? 'formal' : mixed ? 'mixed' : 'mock'}`}
      data-testid="data-channel"
      data-data-mode={mode}
      aria-label={t('dataChannelTitle', lang)}
    >
      <div className="data-channel__readout">
        <span>{t('dataChannelTitle', lang)}</span>
        <strong>{modeLabel(mode, lang)}</strong>
        <code>
          {formal
            ? 'RESULT_READ_API_V1'
            : mixed
              ? mixedCode
              : 'PAGE_PROPOSAL_DTO'}
        </code>
      </div>
      <p>
        {formal
          ? t('dataModeFormalNote', lang)
          : mixed
            ? t(includesLiveCatalog ? 'dataModeMixedCatalogNote' : 'dataModeMixedNote', lang)
            : t('dataModeMockNote', lang)}
      </p>
      <div
        className="data-channel__switch"
        role="group"
        aria-label={t('dataChannelSwitchLabel', lang)}
        data-testid="data-mode-switch"
      >
        {FRONTEND_DATA_MODES.map((option) => (
          <button
            key={option}
            type="button"
            className={option === mode ? 'is-active' : undefined}
            data-testid={`data-mode-${option.toLowerCase().replaceAll('_', '-')}`}
            aria-pressed={option === mode}
            onClick={() => onChange(option)}
          >
            <span>{modeLabel(option, lang)}</span>
            <code>{option}</code>
          </button>
        ))}
      </div>
    </section>
  )
}
