import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { catalogItemCategories, catalogRarities, catalogWearTiers } from '../catalog/catalogFacetOptions'
import { selectCatalogFacets } from '../catalog/catalogFacets'
import { cx } from '../catalog/catalogExplorerCopy'
import { isCatalogQueryTextWithinLimit } from '../catalog/catalogQueryText'
import { equipmentModelById } from '../catalog/equipmentModels'
import type { CatalogBrowseState } from '../contract/catalogBrowse'
import { pick, useLang, type Localized } from '../i18n'

type Facet = 'rarity' | 'itemCategory' | 'wearTier'
type Option = Readonly<{ id: string; name: Localized }>

const DISMISS_DISTANCE_PX = 80
const DISMISS_VELOCITY_PX_PER_MS = 0.11

function withoutSeries(state: CatalogBrowseState): CatalogBrowseState {
  return { ...state, baseItemCode: null, selectedEditions: [], selectedWears: [] }
}

export function clearedCatalogQuery(state: CatalogBrowseState): CatalogBrowseState {
  return {
    ...withoutSeries(state),
    itemKind: null,
    equipmentModel: null,
    rarity: null,
    itemCategory: null,
    wearTier: null,
    seriesQuery: '',
  }
}

export function CatalogQueryBar({
  state,
  onChange,
}: {
  state: CatalogBrowseState
  onChange: (next: CatalogBrowseState) => void
}) {
  const lang = useLang()
  const [open, setOpen] = useState<Facet | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const triggers = useRef<Partial<Record<Facet, HTMLButtonElement | null>>>({})
  const id = useId()
  const groups: readonly { field: Facet; label: string; options: readonly Option[] }[] = [
    { field: 'rarity', label: cx('rarity', lang), options: catalogRarities },
    { field: 'itemCategory', label: cx('category', lang), options: catalogItemCategories },
    { field: 'wearTier', label: cx('wear', lang), options: catalogWearTiers },
  ]

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(null)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  const close = (returnFocus: boolean) => {
    if (returnFocus && open) triggers.current[open]?.focus()
    setOpen(null)
  }

  const setSearch = (value: string) => {
    if (!isCatalogQueryTextWithinLimit(value)) return
    // Whitespace alone is not a query; it must not become `q=++` in the address.
    onChange({ ...withoutSeries(state), seriesQuery: value.trim() === '' ? '' : value })
  }

  const model = equipmentModelById(state.equipmentModel)
  const chips: { key: string; label: string; remove: () => void }[] = []
  if (model) chips.push({
    key: 'model',
    label: pick(model.name, lang),
    remove: () => onChange({ ...withoutSeries(state), itemKind: null, equipmentModel: null }),
  })
  for (const group of groups) {
    const current = group.options.find((option) => option.id === state[group.field])
    if (current) chips.push({
      key: group.field,
      label: `${group.label} · ${pick(current.name, lang)}`,
      remove: () => onChange(selectCatalogFacets(state, { rarity: state.rarity, itemCategory: state.itemCategory, wearTier: state.wearTier, [group.field]: null })),
    })
  }
  if (state.seriesQuery.trim() !== '') chips.push({
    key: 'q',
    label: `“${state.seriesQuery.trim()}”`,
    remove: () => setSearch(''),
  })

  return (
    <div className="cx-query" ref={root} data-testid="catalog-facet-filters">
      <label className="cx-search">
        <span className="cx-visually-hidden">{cx('searchLabel', lang)}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
        <input
          type="search"
          value={state.seriesQuery}
          maxLength={256}
          autoComplete="off"
          enterKeyHint="search"
          data-testid="catalog-series-search"
          placeholder={cx('searchPlaceholder', lang)}
          onChange={(event) => setSearch(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || state.seriesQuery === '') return
            event.preventDefault()
            setSearch('')
          }}
        />
        {state.seriesQuery !== '' ? (
          <button type="button" className="cx-search__clear" data-testid="catalog-series-search-clear"
            aria-label={cx('clearSearch', lang)} onClick={() => setSearch('')}>
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m6 6 8 8M14 6l-8 8" /></svg>
          </button>
        ) : null}
      </label>

      <div className="cx-facets">
        {groups.map((group) => {
          const current = group.options.find((option) => option.id === state[group.field])
          const panelId = `${id}-${group.field}`
          return (
            <div className="cx-facet" key={group.field}>
              <button
                type="button"
                className="cx-facet__trigger"
                ref={(element) => { triggers.current[group.field] = element }}
                data-testid={`catalog-filter-${group.field}`}
                data-active={current ? 'true' : undefined}
                aria-haspopup="listbox"
                aria-expanded={open === group.field}
                aria-controls={open === group.field ? panelId : undefined}
                onClick={() => setOpen(open === group.field ? null : group.field)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    setOpen(group.field)
                  }
                }}
              >
                <span>{group.label}</span>
                {current ? <strong>{pick(current.name, lang)}</strong> : null}
                <svg aria-hidden="true" viewBox="0 0 12 12"><path d="m3 4.5 3 3 3-3" /></svg>
              </button>
              {open === group.field ? (
                <FacetPanel
                  id={panelId}
                  label={group.label}
                  field={group.field}
                  options={group.options}
                  selected={state[group.field]}
                  onPick={(value) => {
                    onChange(selectCatalogFacets(state, {
                      rarity: state.rarity, itemCategory: state.itemCategory, wearTier: state.wearTier,
                      [group.field]: value,
                    }))
                    close(true)
                  }}
                  onDismiss={(returnFocus) => close(returnFocus)}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      {chips.length > 0 ? (
        <div className="cx-chips" role="group" aria-label={cx('activeConditions', lang)}>
          {chips.map((chip) => (
            <button key={chip.key} type="button" className="cx-chip" data-testid={`catalog-chip-${chip.key}`}
              aria-label={cx('removeCondition', lang, { label: chip.label })} onClick={chip.remove}>
              <span>{chip.label}</span>
              <svg aria-hidden="true" viewBox="0 0 12 12"><path d="m3.5 3.5 5 5m0-5-5 5" /></svg>
            </button>
          ))}
          <button type="button" className="cx-chips__reset" data-testid="catalog-facets-reset"
            onClick={() => { setOpen(null); onChange(clearedCatalogQuery(state)) }}>
            {cx('clearAll', lang)}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function FacetPanel({
  id, label, field, options, selected, onPick, onDismiss,
}: {
  id: string
  label: string
  field: Facet
  options: readonly Option[]
  selected: string | null
  onPick: (value: string | null) => void
  onDismiss: (returnFocus: boolean) => void
}) {
  const lang = useLang()
  const list = useRef<HTMLUListElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointer: number; startY: number; lastY: number; lastT: number; velocity: number } | null>(null)

  useEffect(() => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
    const target = items.find((item) => item.getAttribute('aria-selected') === 'true') ?? items[0]
    target?.focus({ preventScroll: true })
  }, [])

  const onKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')]
    const index = items.indexOf(document.activeElement as HTMLElement)
    let next = -1
    if (event.key === 'ArrowDown') next = Math.min(items.length - 1, index + 1)
    else if (event.key === 'ArrowUp') next = Math.max(0, index - 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onDismiss(true); return }
    else if (event.key === 'Tab') { onDismiss(false); return }
    else if ((event.key === 'Enter' || event.key === ' ') && index >= 0) {
      event.preventDefault()
      items[index]!.click()
      return
    }
    if (next >= 0) { event.preventDefault(); items[next]?.focus() }
  }

  // Bottom-sheet drag on narrow screens: the sheet follows the finger and a
  // short flick is enough to dismiss it, matching the direction it entered from.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia?.('(max-width: 719px)').matches || drag.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointer: event.pointerId, startY: event.clientY, lastY: event.clientY, lastT: event.timeStamp, velocity: 0 }
    if (sheet.current) sheet.current.style.transition = 'none'
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state || state.pointer !== event.pointerId || !sheet.current) return
    const elapsed = Math.max(1, event.timeStamp - state.lastT)
    state.velocity = (event.clientY - state.lastY) / elapsed
    state.lastY = event.clientY
    state.lastT = event.timeStamp
    const offset = event.clientY - state.startY
    // Upward drag meets increasing resistance instead of a hard stop.
    const shown = offset >= 0 ? offset : -Math.sqrt(-offset) * 2
    sheet.current.style.transform = `translateY(${shown}px)`
  }
  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state || state.pointer !== event.pointerId) return
    drag.current = null
    const offset = event.clientY - state.startY
    const element = sheet.current
    if (!element) return
    element.style.transition = ''
    if (offset > DISMISS_DISTANCE_PX || state.velocity > DISMISS_VELOCITY_PX_PER_MS) {
      element.style.transform = 'translateY(100%)'
      window.setTimeout(() => onDismiss(false), 180)
    } else {
      element.style.transform = ''
    }
  }

  return (
    <>
      <div className="cx-sheet-scrim" aria-hidden="true" onPointerDown={() => onDismiss(false)} />
      <div className="cx-facet__panel" ref={sheet} data-testid={`catalog-filter-options-${field}`}>
        <div className="cx-sheet-handle" aria-hidden="true"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
          <span />
        </div>
        <p className="cx-facet__title">{label}</p>
        <ul ref={list} id={id} role="listbox" aria-label={label} onKeyDown={onKeyDown}>
          <li role="option" tabIndex={-1} aria-selected={selected === null}
            data-testid={`catalog-${field}-all`} onClick={() => onPick(null)}>
            <span>{cx('any', lang)}</span>
            <Check />
          </li>
          {options.map((option) => (
            <li key={option.id} role="option" tabIndex={-1} aria-selected={selected === option.id}
              data-testid={`catalog-${field}-${option.id}`}
              data-rarity={field === 'rarity' ? option.id : undefined}
              onClick={() => onPick(option.id)}>
              {field === 'rarity' ? <i className="cx-rarity-dot" aria-hidden="true" /> : null}
              <span>{pick(option.name, lang)}</span>
              <Check />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function Check() {
  return <svg className="cx-check" aria-hidden="true" viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" /></svg>
}
