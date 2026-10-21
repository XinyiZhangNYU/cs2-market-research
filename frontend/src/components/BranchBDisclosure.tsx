import { DataBranch } from '../contract/enums'
import { dataBranchLabel, label, tradeConfirmationLabel } from '../contract/labels'
import type { RecommendationSnapshot } from '../contract/types'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { EnumChip } from './EnumChip'

// Branch B may carry STRONG_CANDIDATE, but the trade gap must travel with it. This renders
// data_branch, trade_confirmation and evidence_coverage together so the recommendation is
// never shown alone.

export function BranchBDisclosure({
  recommendation,
}: {
  recommendation: RecommendationSnapshot
}) {
  const lang = useLang()
  if (recommendation.data_branch !== DataBranch.B) return null
  return (
    <div className="branch-b" data-testid="branch-b-disclosure">
      <div className="branch-b__row">
        <EnumChip
          machine={`data_branch=${recommendation.data_branch}`}
          label={label(dataBranchLabel, recommendation.data_branch, lang)}
          tone="warn"
        />
        <EnumChip
          machine={`trade_confirmation=${recommendation.trade_confirmation}`}
          label={label(tradeConfirmationLabel, recommendation.trade_confirmation, lang)}
          tone="warn"
        />
        <EnumChip
          machine={`evidence_coverage=${recommendation.evidence_coverage}`}
          label={t('evidenceCoverageLabel', lang)}
          tone="warn"
        />
      </div>
      <p>{t('branchBNote', lang)}</p>
    </div>
  )
}
