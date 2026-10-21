import type { MouseEvent } from 'react'
import { pick, useLang } from '../i18n'
import { t } from '../i18n/strings'
import type {
  PersonalWatchTargetCandidate,
  PersonalWatchTargetKind,
  PersonalWatchlistController,
} from '../watchlist/personalWatchlist'

type AddLabelKey =
  | 'personalWatchlistAdd'
  | 'personalWatchlistAddCatalogCategory'
  | 'personalWatchlistAddCatalogGroup'
  | 'personalWatchlistAddCatalogModel'
  | 'personalWatchlistAddEconomicSector'
  | 'personalWatchlistAddEconomicSegment'

type RemoveLabelKey =
  | 'personalWatchlistRemove'
  | 'personalWatchlistRemoveCatalogCategory'
  | 'personalWatchlistRemoveCatalogGroup'
  | 'personalWatchlistRemoveCatalogModel'
  | 'personalWatchlistRemoveEconomicSector'
  | 'personalWatchlistRemoveEconomicSegment'

const ADD_LABEL: Readonly<Record<PersonalWatchTargetKind, AddLabelKey>> = {
  ITEM: 'personalWatchlistAdd',
  CATALOG_CATEGORY: 'personalWatchlistAddCatalogCategory',
  CATALOG_GROUP: 'personalWatchlistAddCatalogGroup',
  CATALOG_MODEL: 'personalWatchlistAddCatalogModel',
  ECONOMIC_SECTOR: 'personalWatchlistAddEconomicSector',
  ECONOMIC_SEGMENT: 'personalWatchlistAddEconomicSegment',
}

const REMOVE_LABEL: Readonly<Record<PersonalWatchTargetKind, RemoveLabelKey>> = {
  ITEM: 'personalWatchlistRemove',
  CATALOG_CATEGORY: 'personalWatchlistRemoveCatalogCategory',
  CATALOG_GROUP: 'personalWatchlistRemoveCatalogGroup',
  CATALOG_MODEL: 'personalWatchlistRemoveCatalogModel',
  ECONOMIC_SECTOR: 'personalWatchlistRemoveEconomicSector',
  ECONOMIC_SEGMENT: 'personalWatchlistRemoveEconomicSegment',
}

export function PersonalWatchlistToggle({
  controller,
  candidate,
  presentation = 'CARD',
  caption,
}: {
  controller: PersonalWatchlistController
  candidate: PersonalWatchTargetCandidate | null
  presentation?: 'CARD' | 'DETAIL' | 'COMPACT' | 'ICON'
  /** Visible text in place of the generic action label; the accessible name is unchanged. */
  caption?: string
}) {
  const lang = useLang()
  if (candidate === null) return null

  const saved = controller.has(candidate.target_key)
  const pending = controller.pendingKeys.has(candidate.target_key)
  const unavailable = controller.status !== 'READY'
  const label = t(
    pending
      ? 'personalWatchlistSaving'
      : saved
        ? REMOVE_LABEL[candidate.target_kind]
        : ADD_LABEL[candidate.target_kind],
    lang,
  )

  // These buttons sit inside catalog rows, category headers and model choices, so the event
  // must not reach the surrounding selection or navigation handler.
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (unavailable || pending) return
    void controller.toggle(candidate)
  }

  return (
    <button
      type="button"
      className={`personal-watchlist-toggle personal-watchlist-toggle--${presentation.toLowerCase()}`}
      aria-pressed={saved}
      aria-disabled={unavailable || pending}
      aria-label={`${label}: ${pick(candidate.localized_name, lang)}`}
      disabled={unavailable}
      data-testid={`personal-watchlist-toggle-${candidate.target_key}`}
      data-watchlist-state={saved ? 'SAVED' : 'NOT_SAVED'}
      data-watchlist-target-kind={candidate.target_kind}
      title={unavailable ? t('personalWatchlistStorageUnavailableShort', lang) : label}
      onClick={toggle}
    >
      <span aria-hidden="true">{saved ? '★' : '☆'}</span>
      {presentation === 'ICON' ? null : <strong>{caption ?? label}</strong>}
    </button>
  )
}
