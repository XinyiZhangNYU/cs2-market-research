import { useMemo, useState } from 'react'
import { EnumChip, EnumPresentation } from '../components/EnumChip'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { CatalogSeriesCard } from '../components/CatalogSeriesCard'
import {
  CatalogPitContextBar,
  type CatalogPitContext,
} from '../components/CatalogPitContextBar'
import { ITEM_IMAGE_NOT_PRODUCED, type ItemImageSource } from '../contract/itemImage'
import { editionKindLabel, label } from '../contract/labels'
import { pick, useLang, type Localized } from '../i18n'
import { t, tf } from '../i18n/strings'
import {
  baseItemCodesInProjection,
  editionOptionsFor,
  itemKindLabel,
  itemKindsInProjection,
  matchingCatalogRows,
  normalizeCatalogSearch,
  selectBaseItemCode,
  selectItemKind,
  toggleSelectedEdition,
  toggleSelectedWear,
  WearTier,
  wearOptionsFor,
  wearTierLabel,
  type CatalogBrowseState,
  type CatalogProjectionRow,
} from '../contract/catalogBrowse'
import type { CatalogDisplayItemView } from '../adapter/catalogDisplayViewModel'
import { EditionKind } from '../contract/identity'
import { EquipmentNavigation } from '../components/EquipmentNavigation'
import { equipmentForSeries, seriesMatchesEquipment, summarizeEquipment } from '../catalog/catalogEquipment'
import { equipmentCategories, equipmentModelById } from '../catalog/equipmentModels'
import { matchesCatalogFacets, rarityForSeries } from '../catalog/catalogFacets'
import { catalogSeriesKey, catalogSeriesLabels } from '../catalog/catalogSeriesPresentation'
import { CatalogFacetFilters, CatalogRarityBadge } from '../components/CatalogFacetFilters'
import {
  compareCatalogSeriesDefault,
  compareCatalogUnitsDefault,
} from '../catalog/catalogDefaultOrder'
import {
  catalogDiscoverySessionSeed,
  planCatalogDiscoveryModels,
  selectCatalogDiscoverySeries,
} from '../catalog/catalogDiscovery'

export type MockBrowseDisplayItem = Readonly<{
  analysis_unit_id: string
  display_name: string
  image: ItemImageSource
}>

export function ItemBrowsePage({
  state,
  onChange,
  onOpenUnit,
  onBackToWatchList,
  projectionRows,
  displayItems,
  mockItems,
  pitContext,
  presentation = 'TECHNICAL',
}: {
  state: CatalogBrowseState
  onChange: (next: CatalogBrowseState) => void
  onOpenUnit?: (analysisUnitId: string) => void
  onBackToWatchList?: () => void
  projectionRows: readonly CatalogProjectionRow[]
  displayItems?: readonly CatalogDisplayItemView[]
  mockItems?: readonly MockBrowseDisplayItem[]
  pitContext?: CatalogPitContext
  presentation?: 'TECHNICAL' | 'FORMAL_PUBLIC'
}) {
  const lang = useLang()
  const [discoverySeed] = useState(catalogDiscoverySessionSeed)
  if (pitContext && !displayItems) {
    throw new TypeError(
      'formal PIT catalog browse requires both projection rows and display items',
    )
  }
  if (!pitContext && !mockItems) {
    throw new TypeError('mock catalog browse requires explicit mock display items')
  }
  const activeRows = projectionRows
  const facetRows = useMemo(() => presentation === 'FORMAL_PUBLIC'
    ? activeRows.filter((row) => matchesCatalogFacets(row, state))
    : activeRows, [activeRows, presentation, state.rarity, state.itemCategory, state.wearTier])
  const equipmentSummaries = useMemo(() => summarizeEquipment(activeRows), [activeRows])
  const selectedModel = equipmentModelById(state.equipmentModel) ?? (
    state.itemKind && state.baseItemCode
      ? equipmentForSeries(state.itemKind, state.baseItemCode)
      : undefined
  )
  const globalResultsActive = selectedModel === undefined && state.equipmentModel === null && (
    normalizeCatalogSearch(state.seriesQuery) !== '' ||
    state.rarity !== null ||
    state.itemCategory !== null ||
    state.wearTier !== null
  )
  const defaultDiscoveryActive = selectedModel === undefined &&
    state.equipmentModel === null && !globalResultsActive
  const kinds = useMemo(() => itemKindsInProjection(activeRows), [activeRows])
  const bases = useMemo(
    () => state.itemKind ? baseItemCodesInProjection(state.itemKind, activeRows) : [],
    [activeRows, state.itemKind],
  )
  const editionOptions = useMemo(
    () =>
      state.itemKind && state.baseItemCode
        ? editionOptionsFor(state.itemKind, state.baseItemCode, facetRows)
        : [],
    [facetRows, state.baseItemCode, state.itemKind],
  )
  const wearOptions = useMemo(
    () =>
      state.itemKind && state.baseItemCode
        ? wearOptionsFor(state.itemKind, state.baseItemCode, facetRows)
        : [],
    [facetRows, state.baseItemCode, state.itemKind],
  )
  const matchedRows = useMemo(
    () => matchingCatalogRows(state, facetRows),
    [facetRows, state],
  )
  const unitById = useMemo(
    () => new Map(mockItems?.map((unit) => [unit.analysis_unit_id, unit])),
    [mockItems],
  )
  const displayById = useMemo(
    () => new Map(displayItems?.map((item) => [item.analysis_unit_id, item])),
    [displayItems],
  )
  if (
    pitContext &&
    (displayById.size !== activeRows.length ||
      activeRows.some((row) => !displayById.has(row.analysis_unit_id)))
  ) {
    throw new TypeError('formal PIT catalog rows and display items must account exactly')
  }
  const rows = useMemo(
    () => [...matchedRows].sort((left, right) =>
      compareCatalogUnitsDefault(
        {
          row: left,
          name: displayById.get(left.analysis_unit_id)?.display_name[lang] ??
            unitById.get(left.analysis_unit_id)?.display_name ?? '',
        },
        {
          row: right,
          name: displayById.get(right.analysis_unit_id)?.display_name[lang] ??
            unitById.get(right.analysis_unit_id)?.display_name ?? '',
        },
      )),
    [displayById, lang, matchedRows, unitById],
  )
  const seriesLabels = useMemo(() => presentation === 'FORMAL_PUBLIC' && displayItems
    ? catalogSeriesLabels(activeRows, displayById)
    : new Map<string, Localized>(), [activeRows, displayById, displayItems, presentation])
  const showRows = state.itemKind !== null && state.baseItemCode !== null && (
    presentation !== 'FORMAL_PUBLIC' ||
    (seriesMatchesEquipment(state.itemKind, state.baseItemCode, selectedModel) &&
      facetRows.some((row) => row.item_kind === state.itemKind && row.base_item_code === state.baseItemCode))
  )
  const baseSummaries = useMemo(() => {
    if (!displayItems || (!selectedModel && !globalResultsActive && !defaultDiscoveryActive)) return []
    const buckets = new Map<
      string,
      {
        code: string
        count: number
        equipmentModelId: string
        itemKind: CatalogProjectionRow['item_kind']
        representative: CatalogDisplayItemView
        searchText: string
      }
    >()
    for (const row of facetRows) {
      if (presentation === 'FORMAL_PUBLIC' &&
        selectedModel &&
        !seriesMatchesEquipment(row.item_kind, row.base_item_code, selectedModel)) continue
      const display = displayById.get(row.analysis_unit_id)
      if (!display) throw new TypeError('formal base series lacks display data')
      const key = catalogSeriesKey(row)
      const current = buckets.get(key)
      const displaySearchText = `${display.display_name.zh} ${display.display_name.en}`
      if (!current) {
        buckets.set(key, {
          code: row.base_item_code,
          count: 1,
          equipmentModelId: equipmentForSeries(row.item_kind, row.base_item_code).id,
          itemKind: row.item_kind,
          representative: display,
          searchText: displaySearchText,
        })
      } else {
        current.count += 1
        current.searchText += ` ${displaySearchText}`
        if (
          current.representative.image.status !== 'BOUND' &&
          display.image.status === 'BOUND'
        ) {
          current.representative = display
        }
      }
    }
    return [...buckets.entries()].map(([key, bucket]) => {
      return {
        code: bucket.code,
        equipmentModelId: bucket.equipmentModelId,
        itemKind: bucket.itemKind,
        analysisUnitId: bucket.representative.analysis_unit_id,
        name: pick(presentation === 'FORMAL_PUBLIC'
          ? seriesLabels.get(key)!
          : bucket.representative.display_name, lang),
        searchText: bucket.searchText,
        image: bucket.representative.image,
        rarity: rarityForSeries(bucket.itemKind, bucket.code),
        count: bucket.count,
      }
    }).sort((left, right) => compareCatalogSeriesDefault(
      { baseItemCode: left.code, name: left.name, rarity: left.rarity },
      { baseItemCode: right.code, name: right.name, rarity: right.rarity },
    ))
  }, [defaultDiscoveryActive, displayById, displayItems, facetRows, globalResultsActive, lang, presentation, selectedModel, seriesLabels])
  const discoveryPlan = useMemo(
    () => planCatalogDiscoveryModels(equipmentSummaries, discoverySeed),
    [discoverySeed, equipmentSummaries],
  )
  const defaultBaseSummaries = useMemo(() => {
    if (!defaultDiscoveryActive || discoveryPlan.length === 0) return []
    const choices = selectCatalogDiscoverySeries(
      discoveryPlan,
      baseSummaries.map((base) => ({
        baseItemCode: base.code,
        equipmentModelId: base.equipmentModelId,
        itemKind: base.itemKind,
        value: base,
      })),
      discoverySeed,
    )
    return choices.map(({ candidate, guaranteed }) => ({
      base: candidate.value,
      guaranteed,
    })).sort((left, right) => {
      const guaranteeOrder = Number(right.guaranteed) - Number(left.guaranteed)
      if (guaranteeOrder !== 0) return guaranteeOrder
      return compareCatalogSeriesDefault(
        { baseItemCode: left.base.code, name: left.base.name, rarity: left.base.rarity },
        { baseItemCode: right.base.code, name: right.base.name, rarity: right.base.rarity },
      )
    }).map(({ base }) => base)
  }, [baseSummaries, defaultDiscoveryActive, discoveryPlan, discoverySeed])
  const modelSeriesCount = defaultDiscoveryActive ? defaultBaseSummaries.length : baseSummaries.length
  const visibleBaseSummaries = useMemo(() => {
    if (defaultDiscoveryActive) return defaultBaseSummaries
    const query = normalizeCatalogSearch(state.seriesQuery)
    if (query === '') return baseSummaries
    return baseSummaries.filter((base) =>
      normalizeCatalogSearch(base.searchText).includes(query),
    )
  }, [baseSummaries, defaultBaseSummaries, defaultDiscoveryActive, state.seriesQuery])
  const selectedBaseRows = useMemo(
    () => state.itemKind && state.baseItemCode
      ? facetRows.filter((row) =>
          row.item_kind === state.itemKind && row.base_item_code === state.baseItemCode)
      : [],
    [facetRows, state.baseItemCode, state.itemKind],
  )
  const editionCounts = useMemo(() => {
    const counts = new Map<EditionKind, number>()
    for (const row of selectedBaseRows) {
      counts.set(row.edition_kind, (counts.get(row.edition_kind) ?? 0) + 1)
    }
    return counts
  }, [selectedBaseRows])
  const wearCounts = useMemo(() => {
    const counts = new Map<WearTier, number>()
    for (const row of selectedBaseRows) {
      counts.set(row.wear_tier, (counts.get(row.wear_tier) ?? 0) + 1)
    }
    return counts
  }, [selectedBaseRows])
  const selectedSeriesCoverage = useMemo(() => {
    let bound = 0
    for (const row of selectedBaseRows) {
      if (displayById.get(row.analysis_unit_id)?.image.status === 'BOUND') bound += 1
    }
    return { bound, notProduced: selectedBaseRows.length - bound }
  }, [displayById, selectedBaseRows])
  if (presentation === 'FORMAL_PUBLIC') {
    if (!pitContext || !displayItems) {
      throw new TypeError('formal public catalog requires the formal PIT display projection')
    }
    return (
      <div className="formal-catalog" data-testid="page-item-browse">
        <header className="formal-catalog__header">
          <div>
            <h1>{t('publicCatalogTitle', lang)}</h1>
          </div>
        </header>

        {activeRows.length === 0 ? (
          <section className="formal-catalog__empty" data-testid="catalog-real-empty">
            <p>{t('publicCatalogEmpty', lang)}</p>
          </section>
        ) : (
          <EquipmentNavigation
            summaries={equipmentSummaries}
            selectedModelId={selectedModel?.id ?? null}
            onClearSelection={() => onChange({
              ...state,
              itemKind: null,
              equipmentModel: null,
              baseItemCode: null,
              selectedEditions: [],
              selectedWears: [],
            })}
            onSelect={(model) => {
              if (model.id === selectedModel?.id) return
              onChange({
                ...selectItemKind(model.itemKind, state),
                equipmentModel: model.id,
              })
            }}
          />
        )}

        {activeRows.length > 0 ? <CatalogFacetFilters state={state} onChange={onChange} /> : null}

        {(state.itemKind && selectedModel) || globalResultsActive ||
        (defaultDiscoveryActive && discoveryPlan.length > 0) ? (
          <section className="formal-catalog__series" data-testid="catalog-base-section">
            <header>
              {selectedModel ? (
                <div>
                  <p className="formal-catalog__model-breadcrumb">
                    {pick(equipmentCategories.find((entry) => entry.id === selectedModel.category)!.name, lang)}
                    <span aria-hidden="true"> / </span>{t('publicSeriesRail', lang)}
                  </p>
                  <h2 className="formal-catalog__model-title" data-testid="catalog-selected-model">{pick(selectedModel.name, lang)}{selectedModel.scope === 'CATEGORY' ? ` · ${t('publicEquipmentAll', lang)}` : ''}</h2>
                  {selectedModel.category === 'UNCLASSIFIED' ? <p>{t('publicEquipmentUnclassified', lang)}</p> : null}
                </div>
              ) : globalResultsActive ? (
                <div>
                  <p className="formal-catalog__model-breadcrumb">{t('publicGlobalSeriesRail', lang)}</p>
                  <h2 className="formal-catalog__model-title" data-testid="catalog-global-search-results">{t('publicEquipmentGlobal', lang)}</h2>
                </div>
              ) : (
                <div>
                  <p className="formal-catalog__model-breadcrumb">{t('publicDiscoverySeriesRail', lang)}</p>
                  <h2 className="formal-catalog__model-title" data-testid="catalog-default-discovery">{t('publicDiscoverySeriesTitle', lang)}</h2>
                </div>
              )}
            </header>
            <p className="formal-catalog__series-accounting" aria-live="polite">
              {tf('publicSeriesSearchCount', lang, {
                shown: visibleBaseSummaries.length,
                total: modelSeriesCount,
              })}
            </p>
            <div
              key={`${selectedModel?.id ?? 'GLOBAL'}:${state.rarity}:${state.itemCategory}:${state.wearTier}:${state.seriesQuery}`}
              className="formal-catalog__series-grid"
              data-testid="catalog-series-grid"
              data-render-strategy="CONTENT_VISIBILITY"
              data-series-mode={defaultDiscoveryActive ? 'SESSION_DISCOVERY' : 'FILTERED'}
            >
              {visibleBaseSummaries.map((base) => (
                <CatalogSeriesCard
                  key={`${base.itemKind}:${base.code}`}
                  itemKind={base.itemKind}
                  baseItemCode={base.code}
                  analysisUnitId={base.analysisUnitId}
                  name={base.name}
                  image={base.image}
                  rarity={base.rarity}
                  count={base.count}
                  selected={state.itemKind === base.itemKind && state.baseItemCode === base.code}
                  onSelect={() => {
                    if (state.itemKind !== base.itemKind || state.baseItemCode !== base.code) {
                      onChange(selectBaseItemCode(base.itemKind, base.code, facetRows, {
                        ...state, equipmentModel: base.equipmentModelId,
                      }))
                    }
                  }}
                />
              ))}
            </div>
            {visibleBaseSummaries.length === 0 ? (
              <div className="formal-catalog__search-empty" data-testid="catalog-series-search-empty">
                <strong>{t('publicSeriesSearchEmpty', lang)}</strong>
                <p>{t('publicSeriesSearchEmptyNote', lang)}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {showRows ? (
          <>
            <section
              className="formal-catalog__series-summary"
              data-testid="catalog-series-summary"
            >
              <header>
                <div>
                  <p>{t('publicSeriesSnapshotLead', lang)}</p>
                  <h2>{t('publicSeriesSnapshotTitle', lang)}</h2>
                </div>
                <code>{state.baseItemCode}</code>
              </header>
              <dl>
                <div>
                  <dt>{t('publicSeriesSnapshotMembers', lang)}</dt>
                  <dd data-testid="catalog-series-member-count">{selectedBaseRows.length}</dd>
                </div>
                <div>
                  <dt>{t('publicSeriesSnapshotEditions', lang)}</dt>
                  <dd>{editionOptions.length}</dd>
                </div>
                <div>
                  <dt>{t('publicSeriesSnapshotWears', lang)}</dt>
                  <dd>{wearOptions.length}</dd>
                </div>
                <div>
                  <dt>{t('publicImageCoverageBound', lang)}</dt>
                  <dd data-testid="catalog-series-bound-count">{selectedSeriesCoverage.bound}</dd>
                </div>
                <div>
                  <dt>{t('publicImageCoverageNotProduced', lang)}</dt>
                  <dd>{selectedSeriesCoverage.notProduced}</dd>
                </div>
              </dl>
              <p>{t('publicSeriesSnapshotNote', lang)}</p>
            </section>

            <section className="formal-catalog__filters">
              <h2>{t('publicFilterTitle', lang)}</h2>
              <div>
                <fieldset>
                  <legend>{t('publicDetailEdition', lang)}</legend>
                  {editionOptions.map((edition) => (
                    <label key={edition}>
                      <input
                        type="checkbox"
                        checked={state.selectedEditions.includes(edition)}
                        data-testid={`catalog-edition-${edition}`}
                        onChange={() => onChange(toggleSelectedEdition(state, edition, facetRows))}
                      />
                      <span>
                        {label(editionKindLabel, edition, lang)}
                        <small>{editionCounts.get(edition) ?? 0}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <fieldset>
                  <legend>{t('publicDetailWear', lang)}</legend>
                  {wearOptions.map((wear) => (
                    <label key={wear}>
                      <input
                        type="checkbox"
                        checked={state.selectedWears.includes(wear)}
                        data-testid={`catalog-wear-${wear}`}
                        onChange={() => onChange(toggleSelectedWear(state, wear, facetRows))}
                      />
                      <span>
                        {pick(wearTierLabel[wear], lang)}
                        <small>{wearCounts.get(wear) ?? 0}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>
            </section>

            <section className="formal-catalog__results" data-testid="catalog-unit-rows">
              <header>
                <div>
                  <h2>{t('publicResultsTitle', lang)}</h2>
                  <p>{t('publicResultsCount', lang)} <strong>{rows.length}</strong></p>
                </div>
              </header>
              {rows.length === 0 ? (
                <p className="formal-catalog__empty" data-testid="catalog-empty">
                  {t('publicCatalogEmpty', lang)}
                </p>
              ) : (
                <ul className="formal-catalog__cards">
                  {rows.map((row) => {
                    const display = displayById.get(row.analysis_unit_id)
                    if (!display) throw new TypeError('formal catalog row lacks display data')
                    const displayName = pick(display.display_name, lang)
                    return (
                      <li key={row.analysis_unit_id}>
                        <article>
                          <ItemImageSlot
                            source={display.image}
                            label={displayName}
                            variant="thumbnail"
                            presentation="PRODUCT"
                            testId={`item-image-${row.analysis_unit_id}-browse`}
                          />
                          <div className="formal-catalog__card-body">
                            <h3>{displayName}</h3>
                            <div className="formal-catalog__card-tags">
                              <CatalogRarityBadge rarity={rarityForSeries(row.item_kind, row.base_item_code)} />
                              <EnumChip
                                machine={row.edition_kind}
                                label={label(editionKindLabel, row.edition_kind, lang)}
                                presentation={EnumPresentation.PRODUCT_PRIMARY}
                              />
                              <EnumChip
                                machine={row.wear_tier}
                                label={pick(wearTierLabel[row.wear_tier], lang)}
                                presentation={EnumPresentation.PRODUCT_PRIMARY}
                              />
                            </div>
                            {onOpenUnit ? (
                              <button
                                type="button"
                                data-testid={`catalog-row-${row.analysis_unit_id}`}
                                onClick={() => onOpenUnit(row.analysis_unit_id)}
                              >
                                {t('publicOpenItem', lang)} <span aria-hidden="true">→</span>
                              </button>
                            ) : null}
                          </div>
                        </article>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    )
  }

  return (
    <div className="page" data-testid="page-item-browse">
      <h1>{t('catalogBrowseTitle', lang)}</h1>
      <p className="scope-note">
        {t(pitContext ? 'catalogBrowseRealNote' : 'catalogBrowseNote', lang)}
      </p>
      {pitContext ? (
        <CatalogPitContextBar context={pitContext} readState="READY" />
      ) : null}
      {onBackToWatchList ? (
        <button
          type="button"
          data-testid="return-to-watch-list"
          onClick={onBackToWatchList}
        >
          {t('returnToWatchList', lang)}
        </button>
      ) : null}

      {activeRows.length === 0 ? (
        <section className="panel" data-testid="catalog-real-empty">
          <p className="muted">
            {t(pitContext ? 'catalogBrowseRealEmpty' : 'catalogBrowseEmpty', lang)}
          </p>
        </section>
      ) : (
        <section className="panel" data-testid="catalog-kind-section">
          <h2>{t('catalogSelectKind', lang)}</h2>
          <div className="catalog-browse__choices">
            {kinds.map((kind) => (
              <button
                key={kind}
                type="button"
                className={state.itemKind === kind ? 'is-active' : undefined}
                data-testid={`catalog-kind-${kind}`}
                onClick={() => onChange(selectItemKind(kind, state))}
              >
                <code>{kind}</code>
                <span>{pick(itemKindLabel[kind], lang)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {state.itemKind ? (
        <section className="panel" data-testid="catalog-base-section">
          <h2>
            {t('catalogSelectBase', lang)} · <code>{state.itemKind}</code>
          </h2>
          <div className="catalog-browse__choices">
            {bases.map((code) => (
              <button
                key={code}
                type="button"
                className={
                  state.baseItemCode === code
                    ? 'catalog-browse__base-choice is-active'
                    : 'catalog-browse__base-choice'
                }
                data-testid={`catalog-base-${code}`}
                onClick={() => {
                  if (state.baseItemCode !== code) {
                    onChange(selectBaseItemCode(state.itemKind!, code, activeRows, state))
                  }
                }}
              >
                <code>{code}</code>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {showRows ? (
        <>
          <section className="panel catalog-browse__filters">
            <div>
              <h3>{t('catalogEditionFilter', lang)}</h3>
              <ul className="catalog-browse__filter-list">
                {editionOptions.map((edition) => (
                  <li key={edition}>
                    <label>
                      <input
                        type="checkbox"
                        checked={state.selectedEditions.includes(edition)}
                        data-testid={`catalog-edition-${edition}`}
                        onChange={() =>
                          onChange(toggleSelectedEdition(state, edition, activeRows))
                        }
                      />
                      <EnumChip
                        machine={edition}
                        label={label(editionKindLabel, edition, lang)}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{t('catalogWearFilter', lang)}</h3>
              <ul className="catalog-browse__filter-list">
                {wearOptions.map((wear) => (
                  <li key={wear}>
                    <label>
                      <input
                        type="checkbox"
                        checked={state.selectedWears.includes(wear)}
                        data-testid={`catalog-wear-${wear}`}
                        onChange={() =>
                          onChange(toggleSelectedWear(state, wear, activeRows))
                        }
                      />
                      <EnumChip machine={wear} label={pick(wearTierLabel[wear], lang)} />
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel" data-testid="catalog-unit-rows">
            <h2>{t('catalogUnitRows', lang)}</h2>
            {rows.length === 0 ? (
              <p className="muted" data-testid="catalog-empty">
                {t(pitContext ? 'catalogBrowseRealEmpty' : 'catalogBrowseEmpty', lang)}
              </p>
            ) : (
              <ul className="catalog-browse__rows">
                {rows.map((row) => {
                  const unit = pitContext
                    ? undefined
                    : unitById.get(row.analysis_unit_id)
                  const display = displayById.get(row.analysis_unit_id)
                  const displayName = display
                    ? pick(display.display_name, lang)
                    : (unit?.display_name ?? row.analysis_unit_id)
                  const rowLabel = (
                    <>
                      <code>{row.analysis_unit_id}</code>
                      <span>{displayName}</span>
                    </>
                  )
                  return (
                    <li className="item-list-row" key={row.analysis_unit_id}>
                      <ItemImageSlot
                        source={display?.image ?? unit?.image ?? ITEM_IMAGE_NOT_PRODUCED}
                        label={displayName}
                        variant="thumbnail"
                        testId={`item-image-${row.analysis_unit_id}-browse`}
                      />
                      <div className="item-list-row__content">
                        {onOpenUnit ? (
                          <button
                            type="button"
                            className="unit-link"
                            data-testid={`catalog-row-${row.analysis_unit_id}`}
                            onClick={() => onOpenUnit(row.analysis_unit_id)}
                          >
                            {rowLabel}
                          </button>
                        ) : (
                          <div
                            className="unit-link unit-link--readonly"
                            data-testid={`catalog-row-${row.analysis_unit_id}`}
                          >
                            {rowLabel}
                          </div>
                        )}
                        <div className="item-list-row__tags">
                          <EnumChip
                            machine={row.edition_kind}
                            label={label(editionKindLabel, row.edition_kind, lang)}
                          />
                          <EnumChip
                            machine={row.wear_tier}
                            label={pick(wearTierLabel[row.wear_tier], lang)}
                          />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
