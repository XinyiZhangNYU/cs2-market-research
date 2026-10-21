import { useEffect, useRef, useState } from 'react'
import {
  equipmentCategories, equipmentGroupLabels, equipmentGroupOrder,
  allEquipmentInCategory, equipmentModelById, type EquipmentCategoryId, type EquipmentModel,
} from '../catalog/equipmentModels'
import type { EquipmentSummary } from '../catalog/catalogEquipment'
import { pick, useLang } from '../i18n'
import { t, tf } from '../i18n/strings'
import { EquipmentModelImage } from './EquipmentModelImage'
import { PersonalWatchlistToggle } from './PersonalWatchlistToggle'
import { compareCodePoints } from '../wire/canonical'
import { normalizeCatalogQueryText } from '../catalog/catalogQueryText'
import type { PersonalWatchlistController } from '../watchlist/personalWatchlist'
import {
  catalogCategoryWatchCandidate,
  equipmentModelWatchCandidate,
} from '../watchlist/watchTargetRegistry'
import '../equipment-navigation.css'

export function EquipmentNavigation({ summaries, selectedModelId, onSelect, onClearSelection, watchlist }: {
  summaries: readonly EquipmentSummary[]
  selectedModelId: string | null
  onSelect: (model: EquipmentModel) => void
  onClearSelection?: () => void
  watchlist?: PersonalWatchlistController
}) {
  const lang = useLang()
  const [open, setOpen] = useState<EquipmentCategoryId | null>(null)
  const nav = useRef<HTMLElement>(null)
  const moveToModels = useRef(false)
  const selected = equipmentModelById(selectedModelId)
  const categories = equipmentCategories.filter((category) =>
    summaries.some(({ model }) => model.category === category.id))
  const categoryTestIds = [
    ...(onClearSelection ? ['catalog-equipment-all'] : []),
    ...categories.map((entry) => `catalog-category-${entry.id}`),
  ]
  const shown = summaries.filter(({ model }) => model.category === open)
  const groups = equipmentGroupOrder.filter((group) => shown.some(({ model }) => model.group === group))
  const category = categories.find((entry) => entry.id === open)
  const allChoice = open ? allEquipmentInCategory(open) : undefined

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !nav.current?.contains(event.target)) {
        setOpen(null)
      }
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  useEffect(() => {
    if (open && moveToModels.current) {
      nav.current?.querySelector<HTMLButtonElement>('[data-equipment-choice]')?.focus()
      moveToModels.current = false
    }
  }, [open])

  function close(returnFocus = false) {
    if (returnFocus) nav.current?.querySelector<HTMLButtonElement>(`[data-testid="catalog-category-${open}"]`)?.focus()
    setOpen(null)
  }

  function moveCategoryFocus(currentTestId: string, direction: 1 | -1) {
    const index = categoryTestIds.indexOf(currentTestId)
    const next = categoryTestIds[(index + direction + categoryTestIds.length) % categoryTestIds.length]
    nav.current?.querySelector<HTMLButtonElement>(`[data-testid="${next}"]`)?.focus()
  }

  return (
    <nav
      ref={nav}
      className="equipment-nav"
      data-testid="catalog-kind-section"
      aria-label={t('publicEquipmentNavigation', lang)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
          close(true)
        }
      }}
    >
      <div className="equipment-nav__intro">
        <h2>{t('publicEquipmentRail', lang)}</h2>
      </div>
      <div className="equipment-nav__categories">
        {onClearSelection ? (
          <button
            type="button"
            data-testid="catalog-equipment-all"
            className={selectedModelId === null ? 'is-active' : undefined}
            aria-pressed={selectedModelId === null}
            onClick={() => {
              close()
              onClearSelection()
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault()
                moveCategoryFocus('catalog-equipment-all', event.key === 'ArrowRight' ? 1 : -1)
              }
            }}
          >
            <span className="equipment-nav__category-title">{t('publicEquipmentGlobal', lang)}</span>
            <small>{tf('publicEquipmentModelCount', lang, { count: summaries.length })}</small>
          </button>
        ) : null}
        {categories.map((entry) => {
          const entries = summaries.filter(({ model }) => model.category === entry.id)
          return (
            <button
              key={entry.id}
              type="button"
              data-testid={`catalog-category-${entry.id}`}
              className={selected?.category === entry.id ? 'is-active' : undefined}
              aria-expanded={open === entry.id}
              aria-controls={open === entry.id ? 'catalog-equipment-models' : undefined}
              onClick={() => {
                if (open === entry.id) close()
                else setOpen(entry.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  if (open === entry.id) nav.current?.querySelector<HTMLButtonElement>('[data-equipment-choice]')?.focus()
                  else { moveToModels.current = true; setOpen(entry.id) }
                }
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault()
                  moveCategoryFocus(
                    `catalog-category-${entry.id}`,
                    event.key === 'ArrowRight' ? 1 : -1,
                  )
                }
              }}
            >
              <span className="equipment-nav__category-title">{pick(entry.name, lang)}<span aria-hidden="true">⌄</span></span>
              <span className="equipment-nav__category-note">{pick(entry.note, lang)}</span>
              <small>{tf('publicEquipmentModelCount', lang, { count: entries.length })}</small>
            </button>
          )
        })}
      </div>
      {open && category ? (
        <section id="catalog-equipment-models" className="equipment-nav__panel" data-testid="catalog-model-panel" aria-label={pick(category.name, lang)}>
          <header>
            <div><strong>{pick(category.name, lang)}</strong></div>
            <div className="equipment-nav__panel-actions">
              {watchlist && allChoice ? (
                <PersonalWatchlistToggle
                  controller={watchlist}
                  candidate={catalogCategoryWatchCandidate(allChoice.itemKind)}
                  presentation="ICON"
                />
              ) : null}
              <button className="equipment-nav__close" type="button" onClick={() => close(true)} aria-label={t('publicEquipmentClose', lang)}>×</button>
            </div>
          </header>
          <div className="equipment-nav__groups">
            {open === 'GLOVES' ? <p className="equipment-nav__image-note">{pick({ zh: '图片为各类手套的代表涂装，不限定所含系列。', en: 'Images are representative finishes for each glove type and do not limit the included series.' }, lang)}</p> : null}
            {allChoice ? (
              <div className="equipment-nav__choice-row">
                <button
                  className="equipment-nav__all"
                  type="button"
                  data-equipment-choice="true"
                  data-testid={`catalog-model-${allChoice.id}`}
                  aria-pressed={selectedModelId === allChoice.id}
                  onClick={() => { onSelect(allChoice); close(true) }}
                >
                  <strong>{t('publicEquipmentAll', lang)}</strong>
                  <span>{tf('publicEquipmentAllNote', lang, {
                    models: shown.length, series: shown.reduce((sum, row) => sum + row.series, 0),
                  })}</span>
                </button>
                {watchlist ? (
                  <PersonalWatchlistToggle
                    controller={watchlist}
                    candidate={equipmentModelWatchCandidate(allChoice)}
                    presentation="ICON"
                  />
                ) : null}
              </div>
            ) : null}
            {groups.map((group) => (
              <section key={group}>
                <h3>{pick(equipmentGroupLabels[group], lang)}</h3>
                <div className="equipment-nav__models">
                  {shown.filter(({ model }) => model.group === group)
                    .sort((a, b) => compareCodePoints(
                      normalizeCatalogQueryText(a.model.name.en),
                      normalizeCatalogQueryText(b.model.name.en),
                    ) || compareCodePoints(a.model.id, b.model.id))
                    .map(({ model, series }) => (
                      <div key={model.id} className="equipment-nav__choice-row equipment-nav__choice-row--model">
                        <button type="button" data-equipment-choice="true" data-testid={`catalog-model-${model.id}`} aria-pressed={model.id === selectedModelId} onClick={() => { onSelect(model); close(true) }}>
                          <EquipmentModelImage modelId={model.id} />
                          <span>{pick(model.name, lang)}</span>
                          <small>{tf('publicEquipmentSeriesCount', lang, { count: series })}</small>
                        </button>
                        {watchlist ? (
                          <PersonalWatchlistToggle
                            controller={watchlist}
                            candidate={equipmentModelWatchCandidate(model)}
                            presentation="ICON"
                          />
                        ) : null}
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </nav>
  )
}
