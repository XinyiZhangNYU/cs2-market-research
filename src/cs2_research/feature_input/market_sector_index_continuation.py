"""Append-only contemporaneously measured MARKET/SECTOR index points.

The historical index remains a late-bound reconstruction. Completed UTC-day
frames captured after the series opened may extend its numeric scale, but the
first measured point starts a new visual segment. Nothing in this module is a
forecast, trading signal, source collector, database writer, or publisher.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_EVEN, localcontext
import json
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

from jsonschema import Draft202012Validator, FormatChecker

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from .market_sector_index_contracts import REBALANCED_SPEC_SCHEMA
from .market_sector_daily_v3 import (
    GROSS_ERROR_RATIO_LIMIT_V3,
    V3DailyPriceFrame,
    V3MemberPriceStatus,
)
from .market_sector_descriptive import _membership_binding
from .market_sector_taxonomy_v3 import TaxonomyMembershipV3


SPEC_SCHEMA = "market-sector-index-continuation-spec/1"
SUCCESSOR_SPEC_SCHEMA = "market-sector-index-continuation-spec/3"
SUPPORTED_SPEC_SCHEMAS = frozenset({SPEC_SCHEMA, REBALANCED_SPEC_SCHEMA, SUCCESSOR_SPEC_SCHEMA})
POINT_SCHEMA = "market-sector-index-point/4"
POINT_SCHEMA_PATH = Path(__file__).resolve().parents[3] / "schemas/market-sector-index-point.v4.schema.json"
AVAILABILITY = "CONTEMPORANEOUSLY_MEASURED_AFTER_SERIES_OPEN"
PURPOSE = "DESCRIPTIVE_CURRENT_AND_HISTORICAL_STATISTICS_NOT_A_FORECAST"
MINIMUM_INTERPRETABLE_FRACTION = Decimal("0.05")
GRADE_D_WARNING_SHARE = Decimal("0.25")
ANOMALY_ADJUSTMENT_EPSILON = Decimal("0.000000000001")
MAX_DECIMAL_INTEGER_DIGITS = 10_000
SOURCE_MASKS = {"market_a": 1, "market_c": 2, "market_b": 4}


class MarketSectorIndexContinuationError(ValueError):
    pass


def _require(ok: bool, code: str) -> None:
    if not ok:
        raise MarketSectorIndexContinuationError(code)


def _hash64(value: object, code: str) -> str:
    _require(
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value),
        code,
    )
    return value


def _utc(value: datetime, code: str) -> datetime:
    _require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() == timedelta(0),
        code,
    )
    return value.astimezone(UTC)


def _decimal(value: Decimal | int | str | None, places: int = 12) -> str | None:
    if value is None:
        return None
    number = Decimal(str(value))
    _require(number.is_finite(), "NONFINITE_DECIMAL")
    integer_digits = 1 if number.is_zero() else max(number.adjusted() + 1, 1)
    _require(integer_digits <= MAX_DECIMAL_INTEGER_DIGITS, "DECIMAL_INTEGER_DIGIT_BOUND")
    with localcontext() as context:
        context.prec = max(80, integer_digits + places + 8)
        number = number.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_EVEN)
    text = format(number, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def _compound_index_level(previous: Decimal, period_return: Decimal) -> Decimal:
    multiplier = Decimal(1) + period_return
    _require(multiplier.is_finite() and multiplier > 0, "INDEX_LEVEL_MULTIPLIER")
    previous_digits = 1 if previous.is_zero() else max(previous.adjusted() + 1, 1)
    multiplier_digits = max(multiplier.adjusted() + 1, 0)
    projected_digits = previous_digits + multiplier_digits
    _require(projected_digits <= MAX_DECIMAL_INTEGER_DIGITS, "INDEX_LEVEL_INTEGER_DIGIT_BOUND")
    with localcontext() as context:
        context.prec = max(80, projected_digits + 24)
        return previous * multiplier


def _median(values: Iterable[Decimal]) -> Decimal:
    ordered = sorted(values)
    _require(bool(ordered), "EMPTY_MEDIAN")
    middle = len(ordered) // 2
    return ordered[middle] if len(ordered) % 2 else (ordered[middle - 1] + ordered[middle]) / 2


def _quality(valid: int, expected: int) -> str:
    _require(type(valid) is int and type(expected) is int and 0 <= valid <= expected and expected > 0,
             "QUALITY_COUNTS")
    coverage = Decimal(valid) / expected
    if valid == 0 or coverage < MINIMUM_INTERPRETABLE_FRACTION:
        return "UNAVAILABLE"
    if coverage >= Decimal("0.90"):
        return "HIGH"
    if coverage >= Decimal("0.70"):
        return "PARTIAL"
    return "LOW"


def _source_mask(sources: Sequence[str]) -> int:
    _require(
        tuple(sources) == tuple(sorted(set(sources))) and set(sources) <= set(SOURCE_MASKS),
        "SOURCE_SET",
    )
    return sum(SOURCE_MASKS[source] for source in sources)


@dataclass(frozen=True, slots=True)
class ForwardIndexSpec:
    payload: bytes

    @property
    def sha256(self) -> str:
        return sha256_hex(self.payload)

    def document(self) -> dict[str, Any]:
        value = json.loads(self.payload)
        _require(isinstance(value, dict), "SPEC_OBJECT")
        return value


def make_forward_index_spec(
    *,
    membership: TaxonomyMembershipV3,
    historical_publication_id: str,
    historical_manifest_sha256: str,
    historical_series_revision_id: str,
    historical_product_policy_sha256: str,
    historical_anchor_date: date,
    historical_anchor_points: Mapping[str, Mapping[str, str]],
    membership_event_ledger_id: str,
    source_ledger_spec_sha256: str,
    opened_at: datetime,
    implementation_commit: str,
    rebalance_effective_date: date,
) -> ForwardIndexSpec:
    """Freeze scale, membership, code, and source-ledger identity before use."""

    opened_at = _utc(opened_at, "OPENED_AT_UTC")
    _require(type(historical_anchor_date) is date and historical_anchor_date < opened_at.date(),
             "ANCHOR_NOT_BEFORE_OPEN")
    _hash64(historical_publication_id, "PUBLICATION_ID")
    _hash64(historical_manifest_sha256, "MANIFEST_SHA256")
    _hash64(historical_product_policy_sha256, "POLICY_SHA256")
    _hash64(source_ledger_spec_sha256, "SOURCE_LEDGER_SPEC_SHA256")
    _require(
        isinstance(historical_series_revision_id, str)
        and historical_series_revision_id.startswith("market_sector_index_series_")
        and len(historical_series_revision_id) == len("market_sector_index_series_") + 64,
        "SERIES_REVISION_ID",
    )
    _require(
        isinstance(membership_event_ledger_id, str)
        and membership_event_ledger_id.startswith("market_sector_membership_events_")
        and len(membership_event_ledger_id) == len("market_sector_membership_events_") + 64,
        "MEMBERSHIP_LEDGER_ID",
    )
    _require(
        isinstance(implementation_commit, str)
        and len(implementation_commit) == 40
        and all(character in "0123456789abcdef" for character in implementation_commit),
        "IMPLEMENTATION_COMMIT",
    )
    scope_codes = sorted({"ALL", *(scope for member in membership.members for scope in member.scope_codes)})
    _require(set(historical_anchor_points) == set(scope_codes), "ANCHOR_SCOPE_SET")
    anchors: dict[str, dict[str, str]] = {}
    for scope in scope_codes:
        row = historical_anchor_points[scope]
        _require(set(row) == {"point_id", "index_value"}, "ANCHOR_FIELDS")
        point_id = row["point_id"]
        _require(
            isinstance(point_id, str)
            and point_id.startswith("market_sector_index_point_")
            and len(point_id) == len("market_sector_index_point_") + 64,
            "ANCHOR_POINT_ID",
        )
        level = Decimal(row["index_value"])
        _require(level.is_finite() and level > 0, "ANCHOR_LEVEL")
        anchors[scope] = {"point_id": point_id, "index_value": _decimal(level, 8)}
    document = {
        "schema": SPEC_SCHEMA,
        "purpose": PURPOSE,
        "availability_semantic": AVAILABILITY,
        "historical_anchor": {
            "publication_id": historical_publication_id,
            "manifest_sha256": historical_manifest_sha256,
            "series_revision_id": historical_series_revision_id,
            "product_policy_sha256": historical_product_policy_sha256,
            "anchor_date": historical_anchor_date.isoformat(),
            "points": anchors,
        },
        "membership_id": membership.membership_id,
        "membership_binding_sha256": _membership_binding(membership),
        "membership_event_ledger_id": membership_event_ledger_id,
        "source_ledger_spec_sha256": source_ledger_spec_sha256,
        "opened_at": utc_timestamp_text(opened_at),
        "implementation_commit": implementation_commit,
        "rebalance_effective_date": rebalance_effective_date.isoformat(),
        "return_rule": "ADJACENT_COMPLETE_UTC_DAY_ALL_POSITIVE_PAIRS_WITH_A_TO_D_DISCLOSURE",
        "fusion_rule": "ONE_SOURCE_VALUE_TWO_SOURCE_MEAN_THREE_SOURCE_MEDIAN",
        "robust_rule": "SYMMETRIC_1_PERCENT_WINSOR_MINIMUM_ONE_HUNDRED",
        "gap_rule": "NO_FILL_NO_INTERPOLATION_NO_CROSS_GAP_RETURN",
        "revision_rule": "APPEND_ONLY_NEW_PUBLICATION_NEVER_REWRITE_EARLIER_POINT",
        "prediction_status": "NOT_A_PREDICTION",
    }
    return ForwardIndexSpec(canonical_json_bytes(document))


def validate_forward_point(point: Mapping[str, Any]) -> None:
    schema = json.loads(POINT_SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    errors = sorted(
        Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(point),
        key=lambda error: list(error.path),
    )
    _require(not errors, "FORWARD_POINT_SCHEMA")
    body = dict(point)
    point_id = body.pop("point_id", None)
    _require(
        point_id == "market_sector_index_point_" + sha256_hex(canonical_json_bytes(body)),
        "FORWARD_POINT_CONTENT_ID",
    )
    _require(point["paired_member_count"] == point["qualified_member_count"] + point["rejected_return_domain_count"],
             "FORWARD_POINT_PAIR_ACCOUNTING")
    _require(sum(point["grade_counts"][key] for key in "ABCD") == point["qualified_member_count"],
             "FORWARD_POINT_GRADE_ACCOUNTING")
    _require(point["grade_counts"]["E"] == point["expected_member_count"] - point["paired_member_count"],
             "FORWARD_POINT_GRADE_E_ACCOUNTING")


def _validate_frame(frame: V3DailyPriceFrame, membership: TaxonomyMembershipV3) -> None:
    _require(frame.membership_id == membership.membership_id, "FRAME_MEMBERSHIP_ID")
    _require(
        tuple(row.analysis_unit_id for row in frame.members)
        == tuple(member.analysis_unit_id for member in membership.members),
        "FRAME_MEMBER_ORDER",
    )
    _require(
        all(row.identity_sha256 == member.identity_sha256 for row, member in zip(frame.members, membership.members)),
        "FRAME_MEMBER_IDENTITY",
    )
    _require(
        frame.available_at >= datetime.combine(frame.bucket_date + timedelta(days=1), time.min, tzinfo=UTC),
        "FRAME_DAY_NOT_COMPLETE",
    )


def _prior_state(
    spec: ForwardIndexSpec,
    scope_code: str,
    prior_points: Sequence[Mapping[str, Any]],
) -> tuple[Decimal, Mapping[str, Any] | None, int]:
    document = spec.document()
    level = Decimal(document["historical_anchor"]["points"][scope_code]["index_value"])
    latest: Mapping[str, Any] | None = None
    segment = 0
    for point in prior_points:
        if point.get("scope_code") != scope_code:
            continue
        validate_forward_point(point)
        _require(point["continuation_spec_sha256"] == spec.sha256, "PRIOR_POINT_SPEC")
        if latest is not None:
            _require(point["bucket_date"] > latest["bucket_date"], "PRIOR_POINT_ORDER")
        if point.get("index_value") is not None:
            level = Decimal(point["index_value"])
        if point.get("segment_id"):
            segment = max(segment, int(str(point["segment_id"]).rsplit(":", 1)[-1]))
        latest = point
    return level, latest, segment


def build_forward_measured_points(
    *,
    spec: ForwardIndexSpec,
    membership: TaxonomyMembershipV3,
    previous: V3DailyPriceFrame,
    current: V3DailyPriceFrame,
    source_day_sha256: str,
    source_head_tip_sha256: str,
    measured_at: datetime,
    prior_points: Sequence[Mapping[str, Any]] = (),
) -> tuple[dict[str, Any], ...]:
    """Build one completed measured day for every frozen scope."""

    settings = spec.document()
    _require(
        settings.get("schema") in SUPPORTED_SPEC_SCHEMAS
        and settings.get("purpose") == PURPOSE,
        "SPEC_SCHEMA",
    )
    _require(settings["membership_binding_sha256"] == _membership_binding(membership), "MEMBERSHIP_BINDING")
    _hash64(source_day_sha256, "SOURCE_DAY_SHA256")
    _hash64(source_head_tip_sha256, "SOURCE_HEAD_TIP_SHA256")
    measured_at = _utc(measured_at, "MEASURED_AT_UTC")
    _validate_frame(previous, membership)
    _validate_frame(current, membership)
    _require(current.bucket_date == previous.bucket_date + timedelta(days=1), "NON_ADJACENT_SOURCE_FRAMES")
    _require(measured_at >= current.available_at, "MEASURED_BEFORE_SOURCE_AVAILABLE")
    anchor_date = date.fromisoformat(settings["historical_anchor"]["anchor_date"])
    if not prior_points:
        _require(previous.bucket_date == anchor_date, "FIRST_PAIR_NOT_ANCHORED")

    rows: dict[str, dict[str, Any]] = {}
    with localcontext() as context:
        context.prec = 50
        for member, old, new in zip(membership.members, previous.members, current.members):
            old_price = old.fused_ask_atoms if old.status is V3MemberPriceStatus.QUALIFIED else None
            new_price = new.fused_ask_atoms if new.status is V3MemberPriceStatus.QUALIFIED else None
            if old_price is None or new_price is None:
                grade = "E"
                ratio = raw_return = rejection = None
            else:
                old_mask = _source_mask(old.participating_sources)
                new_mask = _source_mask(new.participating_sources)
                if len(old.participating_sources) >= 2 and len(new.participating_sources) >= 2:
                    grade = "A" if old_mask == new_mask else "B"
                elif old_mask & new_mask:
                    grade = "C"
                else:
                    grade = "D"
                ratio = new_price / old_price
                raw_return = ratio - 1
                rejection = None if Decimal("0.001") <= ratio <= GROSS_ERROR_RATIO_LIMIT_V3 else (
                    "OUTSIDE_SHADOW_GROSS_RETURN_RATIO_0_001_TO_1000"
                )
            rows[member.analysis_unit_id] = {
                "member": member, "old": old, "new": new,
                "new_price": new_price, "grade": grade, "ratio": ratio,
                "raw_return": raw_return, "rejection": rejection,
            }

    output: list[dict[str, Any]] = []
    scope_codes = sorted({"ALL", *(scope for member in membership.members for scope in member.scope_codes)})
    for scope_code in scope_codes:
        members = membership.scope_members(scope_code)
        scoped = [rows[member.analysis_unit_id] for member in members]
        paired = [row for row in scoped if row["grade"] != "E"]
        admitted = [row for row in paired if row["rejection"] is None]
        returns = [
            (row["member"].analysis_unit_id, row["raw_return"])
            for row in admitted if isinstance(row["raw_return"], Decimal)
        ]
        raw_all = [row["raw_return"] for row in paired if isinstance(row["raw_return"], Decimal)]
        adjusted = dict(returns)
        contributions: list[dict[str, str]] = []
        if len(returns) >= 100:
            ordered = sorted(value for _, value in returns)
            tail = len(returns) // 100
            lower, upper = ordered[tail], ordered[-tail - 1]
            adjusted = {key: min(max(value, lower), upper) for key, value in returns}
            contributions = [
                {
                    "analysis_unit_id": key,
                    "raw_return": _decimal(value),
                    "suppressed_return": _decimal(adjusted[key]),
                    "adjustment": _decimal(adjusted[key] - value),
                }
                for key, value in returns
                if abs(adjusted[key] - value) > ANOMALY_ADJUSTMENT_EPSILON
            ]
            contributions.sort(key=lambda row: (-abs(Decimal(row["adjustment"])), row["analysis_unit_id"]))
        raw_return = None if not raw_all else sum(raw_all, Decimal(0)) / len(raw_all)
        robust_return = None if not adjusted else sum(adjusted.values(), Decimal(0)) / len(adjusted)
        grade_counts = Counter(row["grade"] for row in admitted)
        grades = {key: grade_counts.get(key, 0) for key in "ABCD"}
        grades["E"] = len(members) - len(paired)
        qualified = len(admitted)
        prices = [row["new_price"] for row in scoped if isinstance(row["new_price"], Decimal)]
        return_quality = _quality(qualified, len(members))
        price_quality = _quality(len(prices), len(members))
        prior_level, latest, segment = _prior_state(spec, scope_code, prior_points)
        immediately_adjacent = (
            latest is not None
            and date.fromisoformat(latest["bucket_date"]) + timedelta(days=1) == current.bucket_date
        )
        if price_quality == "UNAVAILABLE":
            level = period_return = None
            segment_id = None
            quality = "UNAVAILABLE"
            reasons = ["BELOW_MINIMUM_INTERPRETABLE_COVERAGE"]
        elif return_quality == "UNAVAILABLE":
            level = prior_level
            period_return = None
            segment_id = f"{scope_code}:MEASURED:{segment + 1}"
            quality = price_quality
            reasons = ["ADJACENT_DAY_RETURN_COVERAGE_UNAVAILABLE_NEW_SEGMENT_BASE"]
        elif (
            latest is None
            and settings.get("effective_day_return") == "CONTINUE_ADJACENT"
            and settings["historical_anchor"]["points"][scope_code].get("bucket_date")
            == previous.bucket_date.isoformat()
        ):
            _require(
                settings.get("schema") == SUCCESSOR_SPEC_SCHEMA
                and previous.bucket_date == anchor_date
                and current.bucket_date == anchor_date + timedelta(days=1),
                "SUCCESSOR_BOUNDARY_RETURN_NOT_ADJACENT_TO_ANCHOR",
            )
            period_return = robust_return
            level = _compound_index_level(prior_level, robust_return)
            segment_id = f"{scope_code}:MEASURED:{segment + 1}"
            quality = return_quality
            reasons = ["UNCHANGED_COHORT_ADJACENT_ANCHOR_RETURN_CONTINUED"]
        elif latest is None:
            # The historical anchor is late-bound.  It supplies only the scale;
            # never manufacture a return across that semantic boundary.
            period_return = None
            level = prior_level
            segment_id = f"{scope_code}:MEASURED:{segment + 1}"
            quality = price_quality
            reasons = ["CONTEMPORANEOUS_BOUNDARY_BASE_NO_RETURN_OR_VISUAL_JOIN"]
        elif immediately_adjacent and latest.get("index_value") is not None:
            period_return = robust_return
            level = _compound_index_level(prior_level, robust_return)
            segment_id = latest["segment_id"]
            quality = return_quality
            reasons = ["ADJACENT_UTC_DAY_CONTEMPORANEOUS_ROBUST_EQUAL_RETURN"]
        else:
            period_return = None
            level = prior_level
            segment_id = f"{scope_code}:MEASURED:{segment + 1}"
            quality = price_quality
            reasons = ["SEGMENT_BASE_OR_GAP_RESUME_NO_CROSS_GAP_RETURN"]
        d_share = None if not admitted else Decimal(grades["D"]) / len(admitted)
        if d_share is not None and d_share > GRADE_D_WARNING_SHARE:
            reasons.append("GRADE_D_SHARE_ABOVE_WARNING_LEVEL")
        rejected = [row for row in paired if row["rejection"] is not None]
        if rejected:
            reasons.append("SHADOW_RETURN_DOMAIN_REJECTIONS_DISCLOSED")
        source_pairs = Counter(
            f"{_source_mask(row['old'].participating_sources)}->{_source_mask(row['new'].participating_sources)}"
            for row in paired
        )
        grade_a = [row for row in paired if row["grade"] == "A"]
        boundary_base = latest is None
        point = {
            "schema": POINT_SCHEMA,
            "scope_code": scope_code,
            "bucket_date": current.bucket_date.isoformat(),
            "series_revision_id": settings["historical_anchor"]["series_revision_id"],
            "membership_event_ledger_id": settings["membership_event_ledger_id"],
            "product_policy_sha256": settings["historical_anchor"]["product_policy_sha256"],
            "continuation_spec_sha256": spec.sha256,
            "source_ledger_spec_sha256": settings["source_ledger_spec_sha256"],
            "source_day_sha256": source_day_sha256,
            "source_head_tip_sha256": source_head_tip_sha256,
            "historical_anchor_publication_id": settings["historical_anchor"]["publication_id"],
            "historical_anchor_point_id": settings["historical_anchor"]["points"][scope_code]["point_id"],
            "membership_binding_sha256": settings["membership_binding_sha256"],
            "rebalance_effective_date": settings["rebalance_effective_date"],
            "rebalance_semantic": "MONTHLY_MEMBERSHIP_COHORT_OR_RELEASE_EVENT_NOT_SELF_FINANCING_HOLDINGS",
            "measured_at": utc_timestamp_text(measured_at),
            "availability_semantic": AVAILABILITY,
            "expected_member_count": len(members),
            "expected_member_count_upper_bound": len(members),
            "possible_unadmitted_member_count": 0,
            "active_uncertain_origin_member_count": 0,
            "origin_uncertainty_status": "NONE",
            "qualified_member_count": qualified,
            "paired_member_count": len(paired),
            "grade_e_member_count": grades["E"],
            "rejected_return_domain_count": len(rejected),
            "rejected_return_domain_raw_sum": _decimal(
                sum((row["raw_return"] for row in rejected), Decimal(0))
            ) if rejected else None,
            "coverage_ratio": _decimal(Decimal(qualified) / len(members)),
            "coverage_ratio_lower_bound": _decimal(Decimal(qualified) / len(members)),
            "quality_coverage_ratio": _decimal(
                Decimal(qualified if period_return is not None else len(prices)) / len(members)
            ),
            "quality_basis": "RETURN_COVERAGE_LINK" if period_return is not None else "PRICE_COVERAGE_SEGMENT_BASE",
            "quality_status": quality,
            "return_quality_status": return_quality,
            "price_quality_status": price_quality,
            "raw_equal_return": None if boundary_base else _decimal(raw_return),
            "robust_equal_return": None if boundary_base else _decimal(robust_return),
            "effective_estimator": None if boundary_base else (
                "SYMMETRIC_1_PERCENT_WINSOR" if len(admitted) >= 100 else
                "RAW_EQUAL_ADMITTED_NO_WINSOR" if admitted else None
            ),
            "high_confidence_a_equal_return": None if boundary_base else _decimal(
                None if not grade_a else sum((row["raw_return"] for row in grade_a), Decimal(0)) / len(grade_a)
            ),
            "high_confidence_a_member_count": len(grade_a),
            "anomaly_member_count": 0 if boundary_base else len(contributions),
            "anomaly_contributions": [] if boundary_base else contributions[:10],
            "period_return": _decimal(period_return),
            "index_value": _decimal(level, 8),
            "segment_id": segment_id,
            "grade_counts": grades,
            "grade_counts_semantic": "SHADOW_DOMAIN_ADMITTED_A_TO_D_PLUS_EXPECTED_UNPAIRED_E",
            "source_pair_counts": dict(sorted(source_pairs.items())),
            "source_pair_counts_semantic": "ALL_POSITIVE_ADJACENT_PAIRS_BEFORE_SHADOW_DOMAIN_GATE",
            "active_membership_evidence_grade_counts": {},
            "grade_d_share": _decimal(d_share),
            "absolute_price_expected_member_count": len(members),
            "absolute_price_expected_member_count_upper_bound": len(members),
            "absolute_price_possible_unadmitted_member_count": 0,
            "absolute_price_qualified_member_count": len(prices),
            "absolute_price_coverage_ratio": _decimal(Decimal(len(prices)) / len(members)),
            "absolute_price_coverage_ratio_lower_bound": _decimal(Decimal(len(prices)) / len(members)),
            "member_minimum_ask_sum_cny": _decimal(sum(prices, Decimal(0)), 6) if prices else None,
            "member_minimum_ask_median_cny": _decimal(_median(prices), 6) if prices else None,
            "absolute_price_semantic": "SUM_AND_MEDIAN_OF_MEMBER_MINIMUM_ASKS_NOT_MARKET_VALUE",
            "reason_codes": sorted(set(reasons)),
        }
        point["point_id"] = "market_sector_index_point_" + sha256_hex(canonical_json_bytes(point))
        validate_forward_point(point)
        output.append(point)
    return tuple(output)


__all__ = [
    "AVAILABILITY",
    "ForwardIndexSpec",
    "MarketSectorIndexContinuationError",
    "POINT_SCHEMA",
    "SUCCESSOR_SPEC_SCHEMA",
    "build_forward_measured_points",
    "make_forward_index_spec",
    "validate_forward_point",
]
