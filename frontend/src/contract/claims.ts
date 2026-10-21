// Mirrors repo/src/cs2_research/state_machine/claims.py. The allowed set and the Chinese
// renderings are copied from there; this file must not widen either.

import {
  ClaimCode,
  DataBranch,
  ValidationClaim,
  ValidationLevel,
  type DataBranch as DataBranchValue,
  type ValidationClaim as ValidationClaimValue,
  type ValidationLevel as ValidationLevelValue,
  type ClaimCode as ClaimCodeValue,
} from './enums'

export class ClaimNotAllowed extends Error {}

const BRANCH_B_ALLOWED: readonly ClaimCodeValue[] = [
  ClaimCode.UNIFIED_PRICE_RISING,
  ClaimCode.BID_PRICE_RISING,
  ClaimCode.BUY_DEMAND_STRENGTHENING,
  ClaimCode.SELLABLE_SUPPLY_DECLINING,
  ClaimCode.MULTI_SOURCE_ALIGNED,
]

const ZH_RENDERING: Record<ClaimCodeValue, string> = {
  [ClaimCode.UNIFIED_PRICE_RISING]: '统一市场价格已经上涨',
  [ClaimCode.BID_PRICE_RISING]: '最高求购价上移',
  [ClaimCode.BUY_DEMAND_STRENGTHENING]: '求购需求增强',
  [ClaimCode.SELLABLE_SUPPLY_DECLINING]: '可售供给减少',
  [ClaimCode.MULTI_SOURCE_ALIGNED]: '多来源报价和供需方向一致',
  [ClaimCode.TRUSTED_TRADE_VOLUME_INCREASING]: '可信成交量增加',
  [ClaimCode.SWEEPING_CONFIRMED]: '真实扫货已由可信成交确认',
}

export function validateClaims(
  dataBranch: DataBranchValue,
  claims: readonly ClaimCodeValue[],
): void {
  if (dataBranch !== DataBranch.B) return
  const rejected = claims.filter((claim) => !BRANCH_B_ALLOWED.includes(claim))
  if (rejected.length > 0) {
    const names = [...new Set(rejected)].sort().join(', ')
    throw new ClaimNotAllowed(
      `data branch B cannot make trade-confirmation claims: ${names}`,
    )
  }
}

export function renderClaimsZh(
  dataBranch: DataBranchValue,
  claims: readonly ClaimCodeValue[],
): readonly string[] {
  validateClaims(dataBranch, claims)
  return claims.map((claim) => ZH_RENDERING[claim])
}

export function validateValidationClaim(
  level: ValidationLevelValue,
  claim: ValidationClaimValue,
): void {
  if (
    claim === ValidationClaim.FULL_PDS_ALGORITHM_VALIDATED &&
    (level === ValidationLevel.PRICE_ONLY ||
      level === ValidationLevel.COMPONENT_BACKTEST)
  ) {
    throw new ClaimNotAllowed(
      'price/component backtests cannot validate the full P/D/S algorithm',
    )
  }
}
