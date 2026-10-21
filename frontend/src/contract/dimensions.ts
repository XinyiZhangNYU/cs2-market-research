// The orthogonal dimensions differ per scope. ItemStateSnapshot is the only snapshot carrying
// cycle_stage and regime_relation; MarketStateSnapshot uses trend_stage + level_regime and
// SectorStateSnapshot uses trend_stage + relative_strength + breadth. Deriving the list from the
// snapshot instead of a fixed six keeps the UI from inventing an item cycle for MARKET/SECTOR.

import type { Lang } from '../i18n'
import { t } from '../i18n/strings'
import {
  caseStatusLabel,
  dataStatusLabel,
  evidenceFlagLabel,
  itemCycleStageLabel,
  label,
  marketLevelRegimeLabel,
  marketTrendStageLabel,
  recommendationLabel,
  regimeRelationLabel,
  relativeStrengthLabel,
  sectorTrendStageLabel,
  type LabelMap,
} from './labels'
import type {
  ItemStateSnapshot,
  MarketStateSnapshot,
  SectorStateSnapshot,
} from './types'

export type DimensionValue = {
  machine: string
  label: string
}

export type Dimension = {
  field: string
  title: string
  values: readonly DimensionValue[]
  emptyNote?: string
}

function one<T extends string>(map: LabelMap<T>, value: T, lang: Lang): DimensionValue[] {
  return [{ machine: value, label: label(map, value, lang) }]
}

function many<T extends string>(
  values: readonly T[],
  map: LabelMap<T>,
  lang: Lang,
): DimensionValue[] {
  return values.map((value) => ({ machine: value, label: label(map, value, lang) }))
}

export function itemDimensions(
  snapshot: ItemStateSnapshot,
  lang: Lang,
): readonly Dimension[] {
  return [
    {
      field: 'cycle_stage',
      title: t('dimCycleStage', lang),
      values: one(itemCycleStageLabel, snapshot.cycle_stage, lang),
    },
    {
      field: 'evidence_flags',
      title: t('dimEvidenceFlags', lang),
      values: many(snapshot.evidence_flags, evidenceFlagLabel, lang),
      emptyNote: t('emptyEvidenceFlags', lang),
    },
    {
      field: 'data_status',
      title: t('dimDataStatus', lang),
      values: one(dataStatusLabel, snapshot.data_status, lang),
    },
    {
      field: 'regime_relation',
      title: t('dimRegimeRelation', lang),
      values: many(snapshot.regime_relation, regimeRelationLabel, lang),
      emptyNote: t('emptyRegimeRelation', lang),
    },
    {
      field: 'recommendation',
      title: t('dimRecommendation', lang),
      values: one(recommendationLabel, snapshot.recommendation, lang),
    },
    {
      field: 'case_status',
      title: t('dimCaseStatus', lang),
      values: snapshot.case_status
        ? one(caseStatusLabel, snapshot.case_status, lang)
        : [],
      emptyNote: t('emptyItemCase', lang),
    },
  ]
}

export function marketDimensions(
  snapshot: MarketStateSnapshot,
  lang: Lang,
): readonly Dimension[] {
  return [
    {
      field: 'trend_stage',
      title: t('dimMarketTrend', lang),
      values: one(marketTrendStageLabel, snapshot.trend_stage, lang),
    },
    {
      field: 'level_regime',
      title: t('dimMarketLevel', lang),
      values: one(marketLevelRegimeLabel, snapshot.level_regime, lang),
    },
    {
      field: 'evidence_flags',
      title: t('dimEvidenceFlags', lang),
      values: many(snapshot.evidence_flags, evidenceFlagLabel, lang),
      emptyNote: t('emptyEvidenceFlags', lang),
    },
    {
      field: 'data_status',
      title: t('dimDataStatus', lang),
      values: one(dataStatusLabel, snapshot.data_status, lang),
    },
    {
      field: 'recommendation',
      title: t('dimRecommendation', lang),
      values: one(recommendationLabel, snapshot.recommendation, lang),
    },
    {
      field: 'case_status',
      title: t('dimCaseStatus', lang),
      values: snapshot.case_status
        ? one(caseStatusLabel, snapshot.case_status, lang)
        : [],
      emptyNote: t('emptyAnalysisCase', lang),
    },
  ]
}

export function sectorDimensions(
  snapshot: SectorStateSnapshot,
  lang: Lang,
): readonly Dimension[] {
  const breadth: DimensionValue[] = [
    {
      machine: `breadth_expanding=${snapshot.breadth.breadth_expanding}`,
      label: t(
        snapshot.breadth.breadth_expanding ? 'breadthExpanding' : 'breadthNotExpanding',
        lang,
      ),
    },
    {
      machine: `breadth_narrowing=${snapshot.breadth.breadth_narrowing}`,
      label: t(
        snapshot.breadth.breadth_narrowing ? 'breadthNarrowing' : 'breadthNotNarrowing',
        lang,
      ),
    },
    {
      machine: `concentration_warning=${snapshot.breadth.concentration_warning}`,
      label: t(
        snapshot.breadth.concentration_warning
          ? 'concentrationWarning'
          : 'noConcentrationWarning',
        lang,
      ),
    },
  ]
  return [
    {
      field: 'trend_stage',
      title: t('dimSectorTrend', lang),
      values: one(sectorTrendStageLabel, snapshot.trend_stage, lang),
    },
    {
      field: 'relative_strength',
      title: t('dimRelativeStrength', lang),
      values: one(relativeStrengthLabel, snapshot.relative_strength, lang),
    },
    { field: 'breadth', title: t('dimBreadth', lang), values: breadth },
    {
      field: 'evidence_flags',
      title: t('dimEvidenceFlags', lang),
      values: many(snapshot.evidence_flags, evidenceFlagLabel, lang),
      emptyNote: t('emptyEvidenceFlags', lang),
    },
    {
      field: 'data_status',
      title: t('dimDataStatus', lang),
      values: one(dataStatusLabel, snapshot.data_status, lang),
    },
    {
      field: 'recommendation',
      title: t('dimRecommendation', lang),
      values: one(recommendationLabel, snapshot.recommendation, lang),
    },
    {
      field: 'case_status',
      title: t('dimCaseStatus', lang),
      values: snapshot.case_status
        ? one(caseStatusLabel, snapshot.case_status, lang)
        : [],
      emptyNote: t('emptyAnalysisCase', lang),
    },
  ]
}
