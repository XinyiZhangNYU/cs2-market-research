import { useEffect, useState } from 'react'
import {
  allEquipmentInCategory, equipmentCategories, equipmentGroupOrder, equipmentModelById,
  type EquipmentCategoryId, type EquipmentModel,
} from '../catalog/equipmentModels'
import type { EquipmentSummary } from '../catalog/catalogEquipment'
import { cx } from '../catalog/catalogExplorerCopy'
import { normalizeCatalogQueryText } from '../catalog/catalogQueryText'
import { pick, useLang } from '../i18n'
import { compareCodePoints } from '../wire/canonical'

/**
 * Two-level equipment choice. Desktop shows it as a sticky sidebar; narrow
 * widths show the same controls as a category chip row and a model chip row.
 * Opening a category also chooses its "all" entry, unless a model of that
 * category is already chosen; categories without one only reveal their models.
 */
export function CatalogEquipmentRail({
  summaries,
  selectedModelId,
  onSelectModel,
  onClearModel,
}: {
  summaries: readonly EquipmentSummary[]
  selectedModelId: string | null
  onSelectModel: (model: EquipmentModel) => void
  onClearModel: () => void
}) {
  const lang = useLang()
  const selected = equipmentModelById(selectedModelId)
  const [open, setOpen] = useState<EquipmentCategoryId | null>(selected?.category ?? null)
  useEffect(() => {
    if (selected) setOpen(selected.category)
  }, [selected])

  const categories = equipmentCategories.filter((category) =>
    summaries.some(({ model }) => model.category === category.id))
  const openCategory = categories.find((entry) => entry.id === open)
  const shown = summaries
    .filter(({ model }) => model.category === open)
    .sort((left, right) =>
      equipmentGroupOrder.indexOf(left.model.group) - equipmentGroupOrder.indexOf(right.model.group) ||
      compareCodePoints(normalizeCatalogQueryText(left.model.name.en), normalizeCatalogQueryText(right.model.name.en)) ||
      compareCodePoints(left.model.id, right.model.id))
  const allChoice = open ? allEquipmentInCategory(open) : undefined

  return (
    <nav className="cx-rail" data-testid="catalog-kind-section" aria-label={cx('equipment', lang)}>
      <ul className="cx-rail__categories">
        <li>
          <button
            type="button"
            className="cx-rail__category"
            data-testid="catalog-equipment-all"
            aria-pressed={selectedModelId === null}
            onClick={() => { setOpen(null); onClearModel() }}
          >
            <span>{cx('allEquipment', lang)}</span>
          </button>
        </li>
        {categories.map((entry) => {
          const series = summaries
            .filter(({ model }) => model.category === entry.id)
            .reduce((sum, row) => sum + row.series, 0)
          return (
            <li key={entry.id}>
              <button
                type="button"
                className="cx-rail__category"
                data-testid={`catalog-category-${entry.id}`}
                data-current={selected?.category === entry.id ? 'true' : undefined}
                aria-expanded={open === entry.id}
                aria-controls={open === entry.id ? 'catalog-equipment-models' : undefined}
                onClick={() => {
                  if (open === entry.id) { setOpen(null); return }
                  setOpen(entry.id)
                  const all = allEquipmentInCategory(entry.id)
                  if (all && selected?.category !== entry.id) onSelectModel(all)
                }}
              >
                <span>{pick(entry.name, lang)}</span>
                <small>{series}</small>
                <i aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
      {openCategory ? (
        <ul
          id="catalog-equipment-models"
          className="cx-rail__models"
          data-testid="catalog-model-panel"
          aria-label={pick(openCategory.name, lang)}
        >
          {allChoice ? (
            <li>
              <button
                type="button"
                className="cx-rail__model cx-rail__model--all"
                data-testid={`catalog-model-${allChoice.id}`}
                aria-pressed={selectedModelId === allChoice.id}
                onClick={() => onSelectModel(allChoice)}
              >
                <span>{cx('allInCategory', lang, { name: pick(openCategory.name, lang) })}</span>
                <small>{shown.reduce((sum, row) => sum + row.series, 0)}</small>
              </button>
            </li>
          ) : null}
          {shown.map(({ model, series }) => (
            <li key={model.id}>
              <button
                type="button"
                className="cx-rail__model"
                data-testid={`catalog-model-${model.id}`}
                aria-pressed={model.id === selectedModelId}
                onClick={() => onSelectModel(model)}
              >
                <span>{pick(model.name, lang)}</span>
                <small>{series}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  )
}
