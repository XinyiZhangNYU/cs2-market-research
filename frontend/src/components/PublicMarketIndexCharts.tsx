import { useMemo } from 'react'
import type { Lang } from '../i18n'
import {
  heatmapWeights,
  layoutTreemap,
  sectorIllustrationModel,
  tileFill,
  tileLabel,
  ratioNumber,
  type PublicRatio,
} from '../pages/publicMarketIndexChart'
import { formatDecimalWithIntl } from '../price/exactDisplayDecimal'
import { EquipmentModelImage } from './EquipmentModelImage'
import { marketSubsectorIllustrationModel } from '../catalog/sectorIllustrations'

function formatPercent(value: PublicRatio, lang: Lang): string {
  return formatDecimalWithIntl(new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'percent',
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  }), value)
}

function formatCompact(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function SectorHeatmap({
  cells, label, lang, onSelectScope, onIntentScope, onCancelIntentScope,
  selectedScopeCode = null,
}: {
  cells: readonly { name: string; scopeCode: string; size: number; sizeLabel?: string; ratio: PublicRatio | null }[]
  label: string
  lang: Lang
  onSelectScope?: (scopeCode: string) => void
  onIntentScope?: (scopeCode: string, immediate?: boolean) => void
  onCancelIntentScope?: (scopeCode: string) => void
  selectedScopeCode?: string | null
}) {
  const tiles = useMemo(() => {
    const ranked = [...cells].sort((left, right) => {
      const delta = Number(right.size) - Number(left.size)
      return Number.isFinite(delta) && delta !== 0 ? delta : left.scopeCode.localeCompare(right.scopeCode)
    })
    const weights = heatmapWeights(ranked.map((cell) => cell.size))
    const boxes = layoutTreemap(weights)
    return ranked.map((cell, index) => {
      const box = boxes[index] ?? { x: 0, y: 0, w: 0, h: 0 }
      return {
        ...cell,
        ...box,
        sizeLabel: cell.sizeLabel ?? formatCompact(cell.size, lang),
        change: cell.ratio === null ? '—' : formatPercent(cell.ratio, lang),
        fill: tileFill(cell.ratio),
        ink: tileLabel(cell.ratio),
        modelId: sectorIllustrationModel(cell.scopeCode),
        showImage: box.w >= 12 && box.h >= 16,
      }
    })
  }, [cells, lang])
  return (
    <div className="public-market-board__map" role="list" aria-label={label}>
      {tiles.map((tile) => (
        <article
          key={tile.scopeCode}
          role="listitem"
          className="public-market-board__tile"
          data-scope={tile.scopeCode}
          data-size={String(tile.size)}
          style={{
            left: `${tile.x}%`,
            top: `${tile.y}%`,
            width: `${tile.w}%`,
            height: `${tile.h}%`,
          }}
        >
          <button
            type="button"
            className="public-market-board__tile-open"
            data-testid={`sector-tile-${tile.scopeCode}`}
            aria-pressed={selectedScopeCode === tile.scopeCode}
            aria-label={lang === 'zh' ? `查看${tile.name}板块` : `Open ${tile.name} sector`}
            disabled={onSelectScope === undefined}
            onMouseEnter={() => onIntentScope?.(tile.scopeCode)}
            onMouseLeave={() => onCancelIntentScope?.(tile.scopeCode)}
            onFocus={() => onIntentScope?.(tile.scopeCode)}
            onBlur={() => onCancelIntentScope?.(tile.scopeCode)}
            onTouchStart={() => onIntentScope?.(tile.scopeCode, true)}
            onClick={() => {
              onIntentScope?.(tile.scopeCode, true)
              onSelectScope?.(tile.scopeCode)
            }}
          >
            <div
              className="public-market-board__tile-inner"
              data-change={tile.ratio === null ? 'flat' : ratioNumber(tile.ratio) < 0 ? 'down' : 'up'}
              style={{ background: tile.fill, color: tile.ink }}
            >
              {tile.showImage && tile.modelId !== null ? (
                <span className="public-market-board__tile-image">
                  <EquipmentModelImage modelId={tile.modelId} />
                </span>
              ) : null}
              <strong>{tile.name}</strong>
              <span>{tile.sizeLabel}</span>
              <span data-change={tile.ratio === null ? 'flat' : ratioNumber(tile.ratio) < 0 ? 'down' : 'up'}>{tile.change}</span>
            </div>
          </button>
        </article>
      ))}
    </div>
  )
}

export function SectorTileGrid({
  cells, label, lang, onSelectScope, onIntentScope, onCancelIntentScope,
  selectedScopeCode = null,
}: {
  cells: readonly { name: string; scopeCode: string; size: number; sizeLabel?: string; ratio: PublicRatio | null }[]
  label: string
  lang: Lang
  onSelectScope?: (scopeCode: string) => void
  onIntentScope?: (scopeCode: string, immediate?: boolean) => void
  onCancelIntentScope?: (scopeCode: string) => void
  selectedScopeCode?: string | null
}) {
  return (
    <div className="public-market-sector-grid" role="list" aria-label={label}>
      {cells.map((cell) => {
        const change = cell.ratio === null ? '—' : formatPercent(cell.ratio, lang)
        const modelId = marketSubsectorIllustrationModel(cell.scopeCode)
        return (
          <article
            key={cell.scopeCode}
            role="listitem"
            className="public-market-sector-grid__tile"
            data-scope={cell.scopeCode}
            data-size={String(cell.size)}
          >
            <button
              type="button"
              className="public-market-sector-grid__open"
              data-testid={`sector-tile-${cell.scopeCode}`}
              aria-pressed={selectedScopeCode === cell.scopeCode}
              aria-label={lang === 'zh' ? `查看${cell.name}板块` : `Open ${cell.name} sector`}
              disabled={onSelectScope === undefined}
              onMouseEnter={() => onIntentScope?.(cell.scopeCode)}
              onMouseLeave={() => onCancelIntentScope?.(cell.scopeCode)}
              onFocus={() => onIntentScope?.(cell.scopeCode)}
              onBlur={() => onCancelIntentScope?.(cell.scopeCode)}
              onTouchStart={() => onIntentScope?.(cell.scopeCode, true)}
              onClick={() => {
                onIntentScope?.(cell.scopeCode, true)
                onSelectScope?.(cell.scopeCode)
              }}
            >
              {modelId !== undefined ? (
                <span className="public-market-sector-grid__image">
                  <EquipmentModelImage modelId={modelId} />
                </span>
              ) : null}
              <span className="public-market-sector-grid__name">{cell.name}</span>
              <span>{cell.sizeLabel ?? formatCompact(cell.size, lang)}</span>
              <span data-change={cell.ratio === null ? 'flat' : ratioNumber(cell.ratio) < 0 ? 'down' : 'up'}>{change}</span>
            </button>
          </article>
        )
      })}
    </div>
  )
}
