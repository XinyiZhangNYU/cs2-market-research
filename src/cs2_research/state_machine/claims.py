"""Structured output guards for data-branch and validation semantics."""

from __future__ import annotations

from .enums import ClaimCode, DataBranch, ValidationClaim, ValidationLevel


class ClaimNotAllowed(ValueError):
    pass


_BRANCH_B_ALLOWED = frozenset(
    {
        ClaimCode.UNIFIED_PRICE_RISING,
        ClaimCode.BID_PRICE_RISING,
        ClaimCode.BUY_DEMAND_STRENGTHENING,
        ClaimCode.SELLABLE_SUPPLY_DECLINING,
        ClaimCode.MULTI_SOURCE_ALIGNED,
    }
)


_ZH_RENDERING = {
    ClaimCode.UNIFIED_PRICE_RISING: "统一市场价格已经上涨",
    ClaimCode.BID_PRICE_RISING: "最高求购价上移",
    ClaimCode.BUY_DEMAND_STRENGTHENING: "求购需求增强",
    ClaimCode.SELLABLE_SUPPLY_DECLINING: "可售供给减少",
    ClaimCode.MULTI_SOURCE_ALIGNED: "多来源报价和供需方向一致",
    ClaimCode.TRUSTED_TRADE_VOLUME_INCREASING: "可信成交量增加",
    ClaimCode.SWEEPING_CONFIRMED: "真实扫货已由可信成交确认",
}


def validate_claims(data_branch: DataBranch, claims: tuple[ClaimCode, ...]) -> None:
    if data_branch is DataBranch.B:
        rejected = set(claims) - _BRANCH_B_ALLOWED
        if rejected:
            names = ", ".join(sorted(claim.value for claim in rejected))
            raise ClaimNotAllowed(
                f"data branch B cannot make trade-confirmation claims: {names}"
            )


def render_claims_zh(
    data_branch: DataBranch, claims: tuple[ClaimCode, ...]
) -> tuple[str, ...]:
    validate_claims(data_branch, claims)
    return tuple(_ZH_RENDERING[claim] for claim in claims)


def validate_validation_claim(
    level: ValidationLevel,
    claim: ValidationClaim,
) -> None:
    if claim is ValidationClaim.FULL_PDS_ALGORITHM_VALIDATED and level in {
        ValidationLevel.PRICE_ONLY,
        ValidationLevel.COMPONENT_BACKTEST,
    }:
        raise ClaimNotAllowed(
            "price/component backtests cannot validate the full P/D/S algorithm"
        )
