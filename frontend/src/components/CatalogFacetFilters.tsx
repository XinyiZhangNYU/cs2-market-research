import { useEffect, useId, useRef, useState } from 'react'
import { catalogItemCategories, catalogRarities, catalogWearTiers, type CatalogRarity } from '../catalog/catalogFacetOptions'
import { selectCatalogFacets } from '../catalog/catalogFacets'
import { isCatalogQueryTextWithinLimit } from '../catalog/catalogQueryText'
import type { CatalogBrowseState } from '../contract/catalogBrowse'
import { pick, useLang } from '../i18n'
import { t } from '../i18n/strings'
import '../catalog-facets.css'

type Facet = 'rarity' | 'itemCategory' | 'wearTier'

export function CatalogRarityBadge({ rarity }: { rarity: CatalogRarity | null }) {
  const lang = useLang()
  const entry = catalogRarities.find((value) => value.id === rarity)
  return entry ? <span className="catalog-rarity" data-rarity={entry.id}><i aria-hidden="true" />{pick(entry.name, lang)}</span> : null
}

export function CatalogFacetFilters({ state, onChange }: {
  state: CatalogBrowseState
  onChange: (next: CatalogBrowseState) => void
}) {
  const lang = useLang()
  const [open, setOpen] = useState<Facet | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const triggers = useRef<Partial<Record<Facet, HTMLButtonElement | null>>>({})
  const id = useId()
  const groups = [
    { field: 'rarity', label: t('publicRarityFilter', lang), options: catalogRarities },
    { field: 'itemCategory', label: t('publicItemCategoryFilter', lang), options: catalogItemCategories },
    { field: 'wearTier', label: t('publicWearFilter', lang), options: catalogWearTiers },
  ] as const
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(null)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  function close() {
    if (open) triggers.current[open]?.focus()
    setOpen(null)
  }

  return (
    <div className="catalog-facets" ref={root} data-testid="catalog-facet-filters"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) { event.preventDefault(); close() }
      }}
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(null)
      }}>
      {groups.map((group) => {
        const current = group.options.find((option) => option.id === state[group.field])
        const panelId = `${id}-${group.field}`
        return (
          <div className={`catalog-facets__field catalog-facets__field--${group.field}`} key={group.field}>
            <button type="button" className="catalog-facets__trigger" ref={(element) => { triggers.current[group.field] = element }}
              data-testid={`catalog-filter-${group.field}`} aria-expanded={open === group.field} aria-controls={panelId}
              onClick={() => setOpen(open === group.field ? null : group.field)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setOpen(group.field)
                  requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>('button')?.focus())
                }
              }}>
              <span>{group.label}</span>
              <strong>{current ? pick(current.name, lang) : t('publicFacetAll', lang)}</strong>
              <i aria-hidden="true">⌄</i>
            </button>
            {open === group.field ? (
              <div className="catalog-facets__panel" role="group" aria-label={group.label} id={panelId} ref={panel}
                data-testid={`catalog-filter-options-${group.field}`}
                onKeyDown={(event) => {
                  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
                  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
                  const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
                  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
                    : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
                  event.preventDefault(); buttons[next]?.focus()
                }}>
                <button type="button" className="catalog-facets__all" data-testid={`catalog-${group.field}-all`} aria-pressed={current === undefined}
                  onClick={() => { onChange(selectCatalogFacets(state, { ...state, [group.field]: null })); close() }}>
                  {t('publicFacetAll', lang)}<span aria-hidden="true">{current ? '' : '✓'}</span>
                </button>
                {group.options.map((option) => (
                  <button type="button" key={option.id} data-testid={`catalog-${group.field}-${option.id}`}
                    aria-pressed={state[group.field] === option.id} data-rarity={group.field === 'rarity' ? option.id : undefined}
                    onClick={() => { onChange(selectCatalogFacets(state, { ...state, [group.field]: option.id })); close() }}>
                    {group.field === 'rarity' ? <i className="catalog-facets__dot" aria-hidden="true" /> : null}
                    <span>{pick(option.name, lang)}</span><span aria-hidden="true">{state[group.field] === option.id ? '✓' : ''}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
      <label className="catalog-facets__search">
        <span>{t('publicSeriesSearchLabel', lang)}</span>
        <input
          type="search"
          value={state.seriesQuery}
          maxLength={256}
          autoComplete="off"
          data-testid="catalog-series-search"
          placeholder={t('publicSeriesSearchPlaceholder', lang)}
          onChange={(event) => {
            const value = event.currentTarget.value
            if (isCatalogQueryTextWithinLimit(value)) {
              onChange({
                ...state,
                seriesQuery: value,
                baseItemCode: null,
                selectedEditions: [],
                selectedWears: [],
              })
            }
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || state.seriesQuery === '') return
            event.preventDefault()
            onChange({
              ...state,
              seriesQuery: '',
              baseItemCode: null,
              selectedEditions: [],
              selectedWears: [],
            })
          }}
        />
        {state.seriesQuery !== '' ? (
          <button
            type="button"
            data-testid="catalog-series-search-clear"
            onClick={() => onChange({
              ...state,
              seriesQuery: '',
              baseItemCode: null,
              selectedEditions: [],
              selectedWears: [],
            })}
          >
            {t('publicSeriesSearchClear', lang)}
          </button>
        ) : null}
      </label>
      {state.rarity !== null || state.itemCategory !== null || state.wearTier !== null ? (
        <button type="button" className="catalog-facets__reset" data-testid="catalog-facets-reset"
          onClick={() => { onChange(selectCatalogFacets(state, { rarity: null, itemCategory: null, wearTier: null })); setOpen(null) }}>
          {t('publicFacetReset', lang)}
        </button>
      ) : null}
    </div>
  )
}
