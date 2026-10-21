import { useEffect, useMemo, useState } from 'react'
import { FxReferenceApi, type FxReferenceGateway } from '../api/FxReferenceApi'
import type { WireFxReference } from '../wire/fxReferenceApiTypes'
import { useLang } from '../i18n'
import { t, tf } from '../i18n/strings'

type FxViewState =
  | { status: 'LOADING' }
  | { status: 'READY'; reference: WireFxReference }
  | { status: 'UNAVAILABLE' }

export function CurrentFxReference({
  gateway,
  knownAt,
  onRateChange,
}: {
  gateway: FxReferenceGateway
  knownAt: string
  onRateChange?: (cnyPerUsd: string | null) => void
}) {
  const lang = useLang()
  const api = useMemo(() => new FxReferenceApi(gateway), [gateway])
  const [state, setState] = useState<FxViewState>({ status: 'LOADING' })

  useEffect(() => {
    let active = true
    setState({ status: 'LOADING' })
    onRateChange?.(null)
    void api.current({ known_at: knownAt }).then(
      (response) => {
        if (!active) return
        if (response.response_kind === 'FX_REFERENCE_CURRENT') {
          setState({ status: 'READY', reference: response.reference })
          onRateChange?.(response.reference.cny_per_usd)
        } else {
          setState({ status: 'UNAVAILABLE' })
          onRateChange?.(null)
        }
      },
      () => {
        if (active) {
          setState({ status: 'UNAVAILABLE' })
          onRateChange?.(null)
        }
      },
    )
    return () => { active = false }
  }, [api, knownAt, onRateChange])

  return (
    <aside className="formal-fx-reference" aria-label={t('publicFxLabel', lang)}>
      <span>{t('publicFxLabel', lang)}</span>
      {state.status === 'LOADING' ? (
        <strong role="status">{t('publicFxLoading', lang)}</strong>
      ) : state.status === 'UNAVAILABLE' ? (
        <strong data-testid="public-fx-unavailable">{t('publicFxUnavailable', lang)}</strong>
      ) : (
        <>
          <strong data-testid="public-fx-rate">1 USD ≈ ¥{state.reference.cny_per_usd}</strong>
          <small>
            {t('publicFxSourceDate', lang)} {state.reference.source_event_date} · ECB
            {state.reference.carry_days > 0
              ? ` · ${tf(state.reference.carry_days === 1 ? 'publicFxCarriedDay' : 'publicFxCarriedDays', lang, { days: state.reference.carry_days })}`
              : null}
          </small>
        </>
      )}
      <small>{t('publicFxDisclosure', lang)}</small>
    </aside>
  )
}
