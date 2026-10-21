import { useLang } from '../i18n'
import { t } from '../i18n/strings'

export type DoorId = 'market' | 'items'

export function HubPage({ onOpen }: { onOpen: (door: DoorId) => void }) {
  const lang = useLang()
  return (
    <div className="page page--hub" data-testid="page-hub">
      <p className="hub-intro">{t('hubIntro', lang)}</p>
      <div className="hub-doors" data-testid="hub-doors">
        <button
          type="button"
          className="hub-door"
          data-testid="door-market"
          onClick={() => onOpen('market')}
        >
          <strong>{t('pageMarket', lang)}</strong>
          <span>{t('doorMarketDesc', lang)}</span>
        </button>
        <button
          type="button"
          className="hub-door"
          data-testid="door-items"
          onClick={() => onOpen('items')}
        >
          <strong>{t('pageItems', lang)}</strong>
          <span>{t('doorItemsDesc', lang)}</span>
        </button>
      </div>
    </div>
  )
}
