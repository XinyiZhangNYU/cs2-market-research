"""Versioned, fail-closed MARKET/SECTOR index-input contracts.

This module deliberately does not ship a parameter profile.  Coverage floors,
continuity, cadence, gap handling, weighting, and rebalance timing must all be
supplied by a separately sealed profile.  The resulting decision is suitable
only for prospective shadow research; it can never be passed off as a formal
market or sector state.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from enum import StrEnum

from .enums import AnalysisUnitKind, Directness, EvidenceType, ScopeKind
from .hashing import content_id, stable_hash


INDEX_USAGE_SCOPE = "INTERNAL_PROSPECTIVE_INDEX_SHADOW"
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_INPUT_CONTRACT_ID = re.compile(r"^index_input_contract_[0-9a-f]{24}$")
_SECTOR_CODES = frozenset({"GLOVE", "KNIFE", "WEAPON"})


class IndexContractError(ValueError):
    """An index profile, PIT membership, or observation is not admissible."""


class IndexMembershipMode(StrEnum):
    PROSPECTIVE_PIT_CATALOG = "PROSPECTIVE_PIT_CATALOG"


class IndexWeightingMethod(StrEnum):
    EQUAL_MEMBER_MEAN = "EQUAL_MEMBER_MEAN"
    MEMBER_MEDIAN = "MEMBER_MEDIAN"


class IndexCurrencyUnit(StrEnum):
    USD_MAJOR_SOURCE = "USD_MAJOR_SOURCE"
    CNY_MINOR_FX_DERIVED = "CNY_MINOR_FX_DERIVED"


class IndexValueSemantics(StrEnum):
    MEMBER_SIMPLE_RETURN = "MEMBER_SIMPLE_RETURN"
    MEMBER_NORMALIZED_PRICE_LEVEL = "MEMBER_NORMALIZED_PRICE_LEVEL"


class IndexGapAction(StrEnum):
    EMIT_UNKNOWN = "EMIT_UNKNOWN"
    HOLD_LAST_WITHIN_GRACE = "HOLD_LAST_WITHIN_GRACE"


class IndexRebalanceTrigger(StrEnum):
    SEALED_CATALOG_MEMBERSHIP_CHANGE = "SEALED_CATALOG_MEMBERSHIP_CHANGE"


class MembershipChangeAction(StrEnum):
    APPLY_AT_NEXT_SEALED_REBALANCE = "APPLY_AT_NEXT_SEALED_REBALANCE"


class IndexMemberValueStatus(StrEnum):
    VALID = "VALID"
    MISSING = "MISSING"
    STALE = "STALE"
    CONFLICTED = "CONFLICTED"


class IndexInputStatus(StrEnum):
    ELIGIBLE_SHADOW = "ELIGIBLE_SHADOW"
    UNKNOWN_INSUFFICIENT_MEMBERS = "UNKNOWN_INSUFFICIENT_MEMBERS"
    UNKNOWN_VALUE_DOMAIN = "UNKNOWN_VALUE_DOMAIN"
    UNKNOWN_COVERAGE = "UNKNOWN_COVERAGE"
    UNKNOWN_CONTINUITY = "UNKNOWN_CONTINUITY"
    UNKNOWN_TEMPORAL_GAP = "UNKNOWN_TEMPORAL_GAP"
    HOLD_LAST_WITHIN_GRACE = "HOLD_LAST_WITHIN_GRACE"


def _text(value: str, field: str) -> None:
    if not isinstance(value, str) or not value.strip() or value != value.strip():
        raise IndexContractError(f"{field} must be non-empty normalized text")


def _utc(value: datetime, field: str) -> None:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() != UTC.utcoffset(value)
    ):
        raise IndexContractError(f"{field} must be an aware UTC datetime")


def _sha256(value: str, field: str) -> None:
    if not isinstance(value, str) or not _SHA256.fullmatch(value):
        raise IndexContractError(f"{field} must be lowercase SHA-256")


def _positive_int(value: int, field: str) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise IndexContractError(f"{field} must be a positive integer")


def _non_negative_int(value: int, field: str) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise IndexContractError(f"{field} must be a non-negative integer")


def _ratio(value: Decimal, field: str) -> None:
    if (
        not isinstance(value, Decimal)
        or not value.is_finite()
        or not Decimal(0) < value <= Decimal(1)
    ):
        raise IndexContractError(f"{field} must be a finite Decimal in (0,1]")


@dataclass(frozen=True, slots=True)
class IndexInputContract:
    """Exact upstream semantics accepted by one index profile.

    The hashes bind complete, separately versioned policies.  Human-readable
    version labels alone are not sufficient because their bytes could drift.
    """

    contract_version: str
    member_feature_key: str
    analysis_unit_kind: AnalysisUnitKind
    evidence_type: EvidenceType
    directness: Directness
    source_contracts_sha256: str
    fusion_policy_sha256: str
    feature_profile_sha256: str
    freshness_policy_sha256: str
    fx_policy_sha256: str | None
    expected_sources: tuple[str, ...]
    minimum_participating_source_count: int
    complete_input_required: bool

    def __post_init__(self) -> None:
        _text(self.contract_version, "contract_version")
        _text(self.member_feature_key, "member_feature_key")
        if self.analysis_unit_kind is not AnalysisUnitKind.BASE_MHN:
            raise IndexContractError("formal index input must remain BASE_MHN")
        if not isinstance(self.evidence_type, EvidenceType):
            raise IndexContractError("evidence_type must use the closed vocabulary")
        if not isinstance(self.directness, Directness):
            raise IndexContractError("directness must use the closed vocabulary")
        for value, field in (
            (self.source_contracts_sha256, "source_contracts_sha256"),
            (self.fusion_policy_sha256, "fusion_policy_sha256"),
            (self.feature_profile_sha256, "feature_profile_sha256"),
            (self.freshness_policy_sha256, "freshness_policy_sha256"),
        ):
            _sha256(value, field)
        if self.fx_policy_sha256 is not None:
            _sha256(self.fx_policy_sha256, "fx_policy_sha256")
        if (
            not self.expected_sources
            or self.expected_sources != tuple(sorted(set(self.expected_sources)))
        ):
            raise IndexContractError("expected_sources must be sorted and unique")
        for source in self.expected_sources:
            _text(source, "expected_sources")
        _positive_int(
            self.minimum_participating_source_count,
            "minimum_participating_source_count",
        )
        if self.minimum_participating_source_count > len(self.expected_sources):
            raise IndexContractError(
                "minimum participating sources exceed the expected source set"
            )
        if self.complete_input_required is not True:
            raise IndexContractError("MARKET/SECTOR input must remain COMPLETE")

    @property
    def input_contract_id(self) -> str:
        return content_id("index_input_contract", self)


@dataclass(frozen=True, slots=True)
class IndexPolicyProfile:
    """A fully explicit candidate profile with no numerical defaults."""

    profile_version: str
    membership_contract_version: str
    scope_kind: ScopeKind
    scope_code: str
    input_contract: IndexInputContract
    weighting_method: IndexWeightingMethod
    currency_unit: IndexCurrencyUnit
    value_semantics: IndexValueSemantics
    slot_interval: timedelta
    slot_alignment_offset: timedelta
    continuity_window_slots: int
    minimum_member_count: int
    minimum_valid_coverage: Decimal
    minimum_qualified_slot_ratio: Decimal
    maximum_gap_slots: int
    maximum_window_span: timedelta
    gap_action: IndexGapAction
    grace_slots: int
    minimum_rebalance_interval: timedelta
    membership_mode: IndexMembershipMode
    rebalance_trigger: IndexRebalanceTrigger
    membership_change_action: MembershipChangeAction
    reset_continuity_on_rebalance: bool
    usage_scope: str = INDEX_USAGE_SCOPE
    retrospective_input_eligible: bool = False
    formal_state_eligible: bool = False

    def __post_init__(self) -> None:
        _text(self.profile_version, "profile_version")
        _text(self.membership_contract_version, "membership_contract_version")
        _validate_scope(self.scope_kind, self.scope_code)
        if not isinstance(self.input_contract, IndexInputContract):
            raise IndexContractError("input_contract must bind exact upstream semantics")
        if not isinstance(self.weighting_method, IndexWeightingMethod):
            raise IndexContractError("weighting_method must use the closed vocabulary")
        if not isinstance(self.currency_unit, IndexCurrencyUnit):
            raise IndexContractError("currency_unit must use the closed vocabulary")
        if self.currency_unit is IndexCurrencyUnit.CNY_MINOR_FX_DERIVED:
            if self.input_contract.fx_policy_sha256 is None:
                raise IndexContractError("FX-derived CNY requires an exact FX policy")
        elif self.input_contract.fx_policy_sha256 is not None:
            raise IndexContractError("source USD cannot bind an FX conversion policy")
        if not isinstance(self.value_semantics, IndexValueSemantics):
            raise IndexContractError("value_semantics must use the closed vocabulary")
        if not isinstance(self.slot_interval, timedelta) or self.slot_interval <= timedelta(0):
            raise IndexContractError("slot_interval must be positive")
        if (
            not isinstance(self.slot_alignment_offset, timedelta)
            or self.slot_alignment_offset < timedelta(0)
            or self.slot_alignment_offset >= self.slot_interval
        ):
            raise IndexContractError("slot_alignment_offset must be within one interval")
        _positive_int(self.continuity_window_slots, "continuity_window_slots")
        if self.continuity_window_slots < 2:
            raise IndexContractError("continuity_window_slots must be at least two")
        _positive_int(self.minimum_member_count, "minimum_member_count")
        _ratio(self.minimum_valid_coverage, "minimum_valid_coverage")
        _ratio(self.minimum_qualified_slot_ratio, "minimum_qualified_slot_ratio")
        _non_negative_int(self.maximum_gap_slots, "maximum_gap_slots")
        if self.maximum_gap_slots >= self.continuity_window_slots:
            raise IndexContractError("maximum_gap_slots must be smaller than the window")
        minimum_window_span = self.slot_interval * (self.continuity_window_slots - 1)
        maximum_gap_window_span = (
            minimum_window_span * (self.maximum_gap_slots + 1)
        )
        if (
            not isinstance(self.maximum_window_span, timedelta)
            or self.maximum_window_span < minimum_window_span
            or self.maximum_window_span > maximum_gap_window_span
            or self.maximum_window_span % self.slot_interval
        ):
            raise IndexContractError(
                "maximum_window_span must be an exact bounded profile interval"
            )
        if not isinstance(self.gap_action, IndexGapAction):
            raise IndexContractError("gap_action must use the closed vocabulary")
        _non_negative_int(self.grace_slots, "grace_slots")
        if self.gap_action is IndexGapAction.EMIT_UNKNOWN and self.grace_slots != 0:
            raise IndexContractError("EMIT_UNKNOWN cannot carry grace slots")
        if (
            self.gap_action is IndexGapAction.HOLD_LAST_WITHIN_GRACE
            and not 0 < self.grace_slots < self.continuity_window_slots
        ):
            raise IndexContractError("hold-last requires bounded positive grace slots")
        if (
            not isinstance(self.minimum_rebalance_interval, timedelta)
            or self.minimum_rebalance_interval <= timedelta(0)
        ):
            raise IndexContractError("minimum_rebalance_interval must be positive")
        if self.membership_mode is not IndexMembershipMode.PROSPECTIVE_PIT_CATALOG:
            raise IndexContractError("only prospective PIT membership is supported")
        if self.rebalance_trigger is not IndexRebalanceTrigger.SEALED_CATALOG_MEMBERSHIP_CHANGE:
            raise IndexContractError("rebalance must bind a sealed catalog change")
        if (
            self.membership_change_action
            is not MembershipChangeAction.APPLY_AT_NEXT_SEALED_REBALANCE
        ):
            raise IndexContractError("membership changes must wait for a sealed rebalance")
        if self.reset_continuity_on_rebalance is not True:
            raise IndexContractError("membership changes must reset continuity")
        if self.usage_scope != INDEX_USAGE_SCOPE:
            raise IndexContractError("usage_scope is not prospective shadow research")
        if self.retrospective_input_eligible is not False:
            raise IndexContractError("late-bound retrospective inputs are not eligible")
        if self.formal_state_eligible is not False:
            raise IndexContractError("an unpromoted index profile cannot be formal")

    @property
    def profile_id(self) -> str:
        return content_id("index_profile", self)


@dataclass(frozen=True, slots=True)
class IndexMember:
    analysis_unit_id: str
    sector_code: str
    catalog_member_sha256: str
    analysis_unit_kind: str = "BASE_MHN"

    def __post_init__(self) -> None:
        _text(self.analysis_unit_id, "analysis_unit_id")
        if self.sector_code not in _SECTOR_CODES:
            raise IndexContractError("sector_code is outside the frozen vocabulary")
        _sha256(self.catalog_member_sha256, "catalog_member_sha256")
        if self.analysis_unit_kind != "BASE_MHN":
            raise IndexContractError("formal index membership is BASE_MHN only")


@dataclass(frozen=True, slots=True)
class IndexMembershipSnapshot:
    catalog_snapshot_sha256: str
    catalog_version: str
    group_version: str
    membership_contract_version: str
    event_as_of: datetime
    available_at: datetime
    members: tuple[IndexMember, ...]
    membership_mode: IndexMembershipMode = IndexMembershipMode.PROSPECTIVE_PIT_CATALOG
    late_bound: bool = False
    formal_state_eligible: bool = False

    def __post_init__(self) -> None:
        _sha256(self.catalog_snapshot_sha256, "catalog_snapshot_sha256")
        _text(self.catalog_version, "catalog_version")
        _text(self.group_version, "group_version")
        _text(self.membership_contract_version, "membership_contract_version")
        _utc(self.event_as_of, "event_as_of")
        _utc(self.available_at, "available_at")
        if self.available_at < self.event_as_of:
            raise IndexContractError("membership cannot be known before its event time")
        if not self.members:
            raise IndexContractError("membership snapshot cannot be empty")
        if not all(isinstance(member, IndexMember) for member in self.members):
            raise IndexContractError("members must be IndexMember records")
        keys = tuple(member.analysis_unit_id for member in self.members)
        if keys != tuple(sorted(keys)) or len(keys) != len(set(keys)):
            raise IndexContractError("members must be sorted and unique")
        if {member.sector_code for member in self.members} != _SECTOR_CODES:
            raise IndexContractError("membership must contain every frozen sector")
        if self.membership_mode is not IndexMembershipMode.PROSPECTIVE_PIT_CATALOG:
            raise IndexContractError("membership must remain prospective PIT")
        if self.late_bound is not False:
            raise IndexContractError("late-bound membership cannot enter this contract")
        if self.formal_state_eligible is not False:
            raise IndexContractError("membership alone cannot claim formal eligibility")

    @property
    def member_set_hash(self) -> str:
        return stable_hash(self.members)

    @property
    def membership_id(self) -> str:
        return content_id(
            "index_membership",
            {
                "catalog_snapshot_sha256": self.catalog_snapshot_sha256,
                "catalog_version": self.catalog_version,
                "group_version": self.group_version,
                "membership_contract_version": self.membership_contract_version,
                "event_as_of": self.event_as_of,
                "available_at": self.available_at,
                "member_set_hash": self.member_set_hash,
                "membership_mode": self.membership_mode,
            },
        )

    def scope_members(self, scope_kind: ScopeKind, scope_code: str) -> tuple[IndexMember, ...]:
        _validate_scope(scope_kind, scope_code)
        if scope_kind is ScopeKind.MARKET:
            return self.members
        return tuple(member for member in self.members if member.sector_code == scope_code)


@dataclass(frozen=True, slots=True)
class IndexMemberObservation:
    analysis_unit_id: str
    status: IndexMemberValueStatus
    value: Decimal | None
    participating_sources: tuple[str, ...]
    event_at: datetime
    available_at: datetime
    source_fact_sha256: str

    def __post_init__(self) -> None:
        _text(self.analysis_unit_id, "analysis_unit_id")
        if not isinstance(self.status, IndexMemberValueStatus):
            raise IndexContractError("status must use the closed vocabulary")
        if (
            not isinstance(self.participating_sources, tuple)
            or self.participating_sources
            != tuple(sorted(set(self.participating_sources)))
        ):
            raise IndexContractError("participating_sources must be sorted and unique")
        for source in self.participating_sources:
            _text(source, "participating_sources")
        _utc(self.event_at, "event_at")
        _utc(self.available_at, "available_at")
        if self.available_at < self.event_at:
            raise IndexContractError("member observation is known before its event")
        _sha256(self.source_fact_sha256, "source_fact_sha256")
        if self.status is IndexMemberValueStatus.VALID:
            if (
                not isinstance(self.value, Decimal)
                or not self.value.is_finite()
            ):
                raise IndexContractError("VALID observations require a finite Decimal")
            if not self.participating_sources:
                raise IndexContractError("VALID observations require source participation")
        elif self.value is not None:
            raise IndexContractError("non-VALID observations cannot carry a value")


@dataclass(frozen=True, slots=True)
class IndexObservationSlot:
    slot_at: datetime
    known_at: datetime
    membership_id: str
    input_contract_id: str
    currency_unit: IndexCurrencyUnit
    value_semantics: IndexValueSemantics
    observations: tuple[IndexMemberObservation, ...]

    def __post_init__(self) -> None:
        _utc(self.slot_at, "slot_at")
        _utc(self.known_at, "known_at")
        if self.known_at < self.slot_at:
            raise IndexContractError("slot knowledge cannot precede the event")
        _text(self.membership_id, "membership_id")
        if not isinstance(self.input_contract_id, str) or not _INPUT_CONTRACT_ID.fullmatch(
            self.input_contract_id
        ):
            raise IndexContractError("input_contract_id is invalid")
        if not isinstance(self.currency_unit, IndexCurrencyUnit):
            raise IndexContractError("slot currency_unit must use the closed vocabulary")
        if not isinstance(self.value_semantics, IndexValueSemantics):
            raise IndexContractError("slot value_semantics must use the closed vocabulary")
        if not self.observations:
            raise IndexContractError("an observation slot cannot be empty")
        if not all(
            isinstance(observation, IndexMemberObservation)
            for observation in self.observations
        ):
            raise IndexContractError("slot values must be IndexMemberObservation records")
        keys = tuple(observation.analysis_unit_id for observation in self.observations)
        if keys != tuple(sorted(keys)) or len(keys) != len(set(keys)):
            raise IndexContractError("slot observations must be sorted and unique")
        if any(observation.event_at != self.slot_at for observation in self.observations):
            raise IndexContractError("member event time must equal the slot")
        if any(observation.available_at > self.known_at for observation in self.observations):
            raise IndexContractError("slot uses a fact not yet known")

    @property
    def slot_hash(self) -> str:
        return stable_hash(self)


@dataclass(frozen=True, slots=True)
class IndexMembershipTransition:
    previous_membership_id: str
    current_membership_id: str
    added_member_ids: tuple[str, ...]
    removed_member_ids: tuple[str, ...]
    effective_at: datetime
    available_at: datetime
    continuity_reset: bool
    backfill_allowed: bool = False

    def __post_init__(self) -> None:
        _text(self.previous_membership_id, "previous_membership_id")
        _text(self.current_membership_id, "current_membership_id")
        if self.previous_membership_id == self.current_membership_id:
            raise IndexContractError("a transition must bind two memberships")
        for values, field in (
            (self.added_member_ids, "added_member_ids"),
            (self.removed_member_ids, "removed_member_ids"),
        ):
            if values != tuple(sorted(values)) or len(values) != len(set(values)):
                raise IndexContractError(f"{field} must be sorted and unique")
            for value in values:
                _text(value, field)
        if set(self.added_member_ids) & set(self.removed_member_ids):
            raise IndexContractError("one member cannot be added and removed")
        _utc(self.effective_at, "effective_at")
        _utc(self.available_at, "available_at")
        if self.available_at < self.effective_at:
            raise IndexContractError("transition cannot be known before it is effective")
        if self.continuity_reset is not True:
            raise IndexContractError("membership transition must reset continuity")
        if self.backfill_allowed is not False:
            raise IndexContractError("membership transition cannot backfill")

    @property
    def transition_id(self) -> str:
        return content_id("index_membership_transition", self)


@dataclass(frozen=True, slots=True)
class IndexInputDecision:
    status: IndexInputStatus
    scope_kind: ScopeKind
    scope_code: str
    profile_id: str
    membership_id: str
    input_window_sha256: str
    query_as_of: datetime
    known_at: datetime
    expected_member_count: int
    current_valid_member_count: int
    current_missing_member_count: int
    current_stale_member_count: int
    current_conflicted_member_count: int
    current_insufficient_source_member_count: int
    current_invalid_value_member_count: int
    current_coverage_ratio: Decimal
    window_insufficient_source_observation_count: int
    window_invalid_value_observation_count: int
    qualified_slot_count: int
    window_slot_count: int
    window_span: timedelta
    qualified_slot_ratio: Decimal
    current_unqualified_streak: int
    longest_temporal_gap_slots: int
    reason_codes: tuple[str, ...]
    usage_scope: str = INDEX_USAGE_SCOPE
    formal_state_eligible: bool = False

    def __post_init__(self) -> None:
        if not isinstance(self.status, IndexInputStatus):
            raise IndexContractError("decision status must use the closed vocabulary")
        _validate_scope(self.scope_kind, self.scope_code)
        _text(self.profile_id, "profile_id")
        _text(self.membership_id, "membership_id")
        _sha256(self.input_window_sha256, "input_window_sha256")
        _utc(self.query_as_of, "query_as_of")
        _utc(self.known_at, "known_at")
        if self.known_at < self.query_as_of:
            raise IndexContractError("decision knowledge precedes its event")
        _positive_int(self.expected_member_count, "expected_member_count")
        for value, field in (
            (self.current_valid_member_count, "current_valid_member_count"),
            (self.current_missing_member_count, "current_missing_member_count"),
            (self.current_stale_member_count, "current_stale_member_count"),
            (self.current_conflicted_member_count, "current_conflicted_member_count"),
            (
                self.current_insufficient_source_member_count,
                "current_insufficient_source_member_count",
            ),
            (self.current_invalid_value_member_count, "current_invalid_value_member_count"),
            (
                self.window_insufficient_source_observation_count,
                "window_insufficient_source_observation_count",
            ),
            (self.window_invalid_value_observation_count, "window_invalid_value_observation_count"),
        ):
            _non_negative_int(value, field)
        _non_negative_int(self.qualified_slot_count, "qualified_slot_count")
        _positive_int(self.window_slot_count, "window_slot_count")
        if not isinstance(self.window_span, timedelta) or self.window_span <= timedelta(0):
            raise IndexContractError("window_span must be positive")
        _non_negative_int(self.current_unqualified_streak, "current_unqualified_streak")
        _non_negative_int(self.longest_temporal_gap_slots, "longest_temporal_gap_slots")
        if self.current_valid_member_count > self.expected_member_count:
            raise IndexContractError("valid member count exceeds membership")
        if (
            self.current_valid_member_count
            + self.current_missing_member_count
            + self.current_stale_member_count
            + self.current_conflicted_member_count
            + self.current_insufficient_source_member_count
            + self.current_invalid_value_member_count
            != self.expected_member_count
        ):
            raise IndexContractError("current member-state counts do not cover membership")
        maximum_window_observations = self.expected_member_count * self.window_slot_count
        if (
            self.window_insufficient_source_observation_count
            > maximum_window_observations
            or self.window_invalid_value_observation_count > maximum_window_observations
        ):
            raise IndexContractError("window issue count exceeds possible observations")
        if self.qualified_slot_count > self.window_slot_count:
            raise IndexContractError("qualified slot count exceeds the window")
        if self.current_unqualified_streak > self.window_slot_count:
            raise IndexContractError("unqualified streak exceeds the window")
        for value, field in (
            (self.current_coverage_ratio, "current_coverage_ratio"),
            (self.qualified_slot_ratio, "qualified_slot_ratio"),
        ):
            if (
                not isinstance(value, Decimal)
                or not value.is_finite()
                or not Decimal(0) <= value <= Decimal(1)
            ):
                raise IndexContractError(f"{field} must be a ratio")
        if self.current_coverage_ratio != (
            Decimal(self.current_valid_member_count) / Decimal(self.expected_member_count)
        ):
            raise IndexContractError("current coverage ratio differs from its counts")
        if self.qualified_slot_ratio != (
            Decimal(self.qualified_slot_count) / Decimal(self.window_slot_count)
        ):
            raise IndexContractError("qualified slot ratio differs from its counts")
        if not self.reason_codes:
            raise IndexContractError("decision must include a reason code")
        if any(not isinstance(reason, str) or not reason for reason in self.reason_codes):
            raise IndexContractError("decision reason codes must be non-empty text")
        if len(self.reason_codes) != len(set(self.reason_codes)):
            raise IndexContractError("decision reason codes must be unique")
        if self.usage_scope != INDEX_USAGE_SCOPE:
            raise IndexContractError("decision usage scope drift")
        if self.formal_state_eligible is not False:
            raise IndexContractError("index input decision cannot be formal")

    @property
    def decision_id(self) -> str:
        return content_id("index_input_decision", self)


def _validate_scope(scope_kind: ScopeKind, scope_code: str) -> None:
    if scope_kind is ScopeKind.MARKET and scope_code == "ALL":
        return
    if scope_kind is ScopeKind.SECTOR and scope_code in _SECTOR_CODES:
        return
    raise IndexContractError("scope must be MARKET/ALL or a frozen SECTOR")


def build_membership_transition(
    profile: IndexPolicyProfile,
    previous: IndexMembershipSnapshot,
    current: IndexMembershipSnapshot,
) -> IndexMembershipTransition:
    if not isinstance(profile, IndexPolicyProfile):
        raise IndexContractError("profile must be an IndexPolicyProfile")
    if not isinstance(previous, IndexMembershipSnapshot) or not isinstance(
        current, IndexMembershipSnapshot
    ):
        raise IndexContractError("transition requires PIT membership snapshots")
    if (
        previous.membership_contract_version != profile.membership_contract_version
        or current.membership_contract_version != profile.membership_contract_version
    ):
        raise IndexContractError("membership contract version differs from the profile")
    if current.event_as_of <= previous.event_as_of:
        raise IndexContractError("membership transitions cannot backdate or tie")
    if current.available_at < previous.available_at:
        raise IndexContractError("membership knowledge clock cannot move backwards")
    if current.event_as_of - previous.event_as_of < profile.minimum_rebalance_interval:
        raise IndexContractError("membership transition violates rebalance interval")
    previous_ids = {member.analysis_unit_id for member in previous.members}
    current_ids = {member.analysis_unit_id for member in current.members}
    return IndexMembershipTransition(
        previous_membership_id=previous.membership_id,
        current_membership_id=current.membership_id,
        added_member_ids=tuple(sorted(current_ids - previous_ids)),
        removed_member_ids=tuple(sorted(previous_ids - current_ids)),
        effective_at=current.event_as_of,
        available_at=current.available_at,
        continuity_reset=profile.reset_continuity_on_rebalance,
    )


def evaluate_index_input(
    *,
    profile: IndexPolicyProfile,
    membership: IndexMembershipSnapshot,
    scope_kind: ScopeKind,
    scope_code: str,
    slots: tuple[IndexObservationSlot, ...],
    query_as_of: datetime,
    known_at: datetime,
) -> IndexInputDecision:
    """Evaluate data eligibility without computing or publishing an index value."""

    if not isinstance(profile, IndexPolicyProfile):
        raise IndexContractError("profile must be an IndexPolicyProfile")
    if not isinstance(membership, IndexMembershipSnapshot):
        raise IndexContractError("membership must be a prospective PIT snapshot")
    _validate_scope(scope_kind, scope_code)
    if (scope_kind, scope_code) != (profile.scope_kind, profile.scope_code):
        raise IndexContractError("requested scope differs from the profile")
    _utc(query_as_of, "query_as_of")
    _utc(known_at, "known_at")
    if known_at < query_as_of:
        raise IndexContractError("known_at cannot precede query_as_of")
    if membership.event_as_of > query_as_of or membership.available_at > known_at:
        raise IndexContractError("membership is not visible at the requested PIT")
    if membership.membership_contract_version != profile.membership_contract_version:
        raise IndexContractError("membership contract version differs from the profile")
    if len(slots) != profile.continuity_window_slots:
        raise IndexContractError("slot count differs from the explicit profile window")
    if not all(isinstance(slot, IndexObservationSlot) for slot in slots):
        raise IndexContractError("slots must be IndexObservationSlot records")
    slot_times = tuple(slot.slot_at for slot in slots)
    if slot_times != tuple(sorted(slot_times)) or len(slot_times) != len(set(slot_times)):
        raise IndexContractError("slots must be sorted and unique")
    if slots[-1].slot_at != query_as_of:
        raise IndexContractError("the final slot must equal query_as_of")
    if (
        membership.event_as_of > slots[0].slot_at
        or membership.available_at > slots[0].known_at
    ):
        raise IndexContractError("continuity window predates the PIT membership")
    if any(slot.known_at > known_at for slot in slots):
        raise IndexContractError("one or more slots were not known at known_at")
    if any(slot.membership_id != membership.membership_id for slot in slots):
        raise IndexContractError("continuity cannot cross a membership rebalance")
    if any(
        slot.input_contract_id != profile.input_contract.input_contract_id
        for slot in slots
    ):
        raise IndexContractError("slot input semantics differ from the profile")
    if any(slot.currency_unit is not profile.currency_unit for slot in slots):
        raise IndexContractError("slot currency differs from the profile")
    if any(slot.value_semantics is not profile.value_semantics for slot in slots):
        raise IndexContractError("slot value semantics differ from the profile")
    expected_sources = set(profile.input_contract.expected_sources)
    if any(
        not set(observation.participating_sources) <= expected_sources
        for slot in slots
        for observation in slot.observations
    ):
        raise IndexContractError("observation uses a source outside the input contract")

    epoch = datetime(1970, 1, 1, tzinfo=UTC)
    if any(
        (slot.slot_at - epoch) % profile.slot_interval
        != profile.slot_alignment_offset
        for slot in slots
    ):
        raise IndexContractError("slot timestamp violates the profile alignment")

    all_member_ids = tuple(member.analysis_unit_id for member in membership.members)
    for slot in slots:
        if tuple(value.analysis_unit_id for value in slot.observations) != all_member_ids:
            raise IndexContractError("each slot must account for the complete PIT membership")

    longest_gap = 0
    for previous, current in zip(slots, slots[1:]):
        delta = current.slot_at - previous.slot_at
        if delta < profile.slot_interval or delta % profile.slot_interval:
            raise IndexContractError("slot cadence is not an exact profile multiple")
        longest_gap = max(longest_gap, delta // profile.slot_interval - 1)
    window_span = slots[-1].slot_at - slots[0].slot_at

    scoped_members = membership.scope_members(scope_kind, scope_code)
    scoped_ids = {member.analysis_unit_id for member in scoped_members}
    expected_count = len(scoped_ids)
    coverages: list[Decimal] = []
    qualified: list[bool] = []
    valid_counts: list[int] = []
    missing_counts: list[int] = []
    stale_counts: list[int] = []
    conflicted_counts: list[int] = []
    insufficient_source_counts: list[int] = []
    invalid_value_counts: list[int] = []

    def value_is_in_domain(observation: IndexMemberObservation) -> bool:
        value = observation.value
        if not isinstance(value, Decimal) or not value.is_finite():
            return False
        if profile.value_semantics is IndexValueSemantics.MEMBER_NORMALIZED_PRICE_LEVEL:
            return value > 0
        return value > Decimal(-1)

    for slot in slots:
        scoped_observations = tuple(
            observation
            for observation in slot.observations
            if observation.analysis_unit_id in scoped_ids
        )
        missing_counts.append(
            sum(
                observation.status is IndexMemberValueStatus.MISSING
                for observation in scoped_observations
            )
        )
        stale_counts.append(
            sum(
                observation.status is IndexMemberValueStatus.STALE
                for observation in scoped_observations
            )
        )
        conflicted_counts.append(
            sum(
                observation.status is IndexMemberValueStatus.CONFLICTED
                for observation in scoped_observations
            )
        )
        insufficient_source_count = sum(
            observation.status is IndexMemberValueStatus.VALID
            and len(observation.participating_sources)
            < profile.input_contract.minimum_participating_source_count
            for observation in scoped_observations
        )
        invalid_value_count = sum(
            observation.status is IndexMemberValueStatus.VALID
            and len(observation.participating_sources)
            >= profile.input_contract.minimum_participating_source_count
            and not value_is_in_domain(observation)
            for observation in scoped_observations
        )
        valid_count = sum(
            observation.status is IndexMemberValueStatus.VALID
            and len(observation.participating_sources)
            >= profile.input_contract.minimum_participating_source_count
            and value_is_in_domain(observation)
            for observation in scoped_observations
        )
        insufficient_source_counts.append(insufficient_source_count)
        invalid_value_counts.append(invalid_value_count)
        coverage = Decimal(valid_count) / Decimal(expected_count)
        valid_counts.append(valid_count)
        coverages.append(coverage)
        qualified.append(
            expected_count >= profile.minimum_member_count
            and coverage >= profile.minimum_valid_coverage
        )

    qualified_count = sum(qualified)
    qualified_ratio = Decimal(qualified_count) / Decimal(len(slots))
    current_streak = 0
    for is_qualified in reversed(qualified):
        if is_qualified:
            break
        current_streak += 1

    temporal_gap_exceeded = longest_gap > profile.maximum_gap_slots
    window_span_exceeded = window_span > profile.maximum_window_span
    member_floor_failed = expected_count < profile.minimum_member_count
    current_coverage_failed = not qualified[-1]
    continuity_failed = qualified_ratio < profile.minimum_qualified_slot_ratio
    window_invalid_value_count = sum(invalid_value_counts)
    window_insufficient_source_count = sum(insufficient_source_counts)

    reasons: list[str] = []
    if temporal_gap_exceeded:
        reasons.append("TEMPORAL_GAP_EXCEEDS_PROFILE")
    if window_span_exceeded:
        reasons.append("WINDOW_SPAN_EXCEEDS_PROFILE")
    if member_floor_failed:
        reasons.append("SCOPE_MEMBER_COUNT_BELOW_PROFILE")
    if window_insufficient_source_count:
        reasons.append("WINDOW_SOURCE_COUNT_BELOW_CONTRACT")
    if window_invalid_value_count:
        reasons.append("WINDOW_VALUE_DOMAIN_INVALID")
    if current_coverage_failed:
        reasons.append("CURRENT_SLOT_COVERAGE_BELOW_PROFILE")
    if continuity_failed:
        reasons.append("QUALIFIED_SLOT_RATIO_BELOW_PROFILE")

    if temporal_gap_exceeded or window_span_exceeded:
        status = IndexInputStatus.UNKNOWN_TEMPORAL_GAP
    elif member_floor_failed:
        status = IndexInputStatus.UNKNOWN_INSUFFICIENT_MEMBERS
    elif window_invalid_value_count:
        status = IndexInputStatus.UNKNOWN_VALUE_DOMAIN
    elif current_coverage_failed:
        if (
            profile.gap_action is IndexGapAction.HOLD_LAST_WITHIN_GRACE
            and current_streak <= profile.grace_slots
            and not continuity_failed
        ):
            status = IndexInputStatus.HOLD_LAST_WITHIN_GRACE
            reasons.append("CURRENT_SLOT_UNQUALIFIED_WITHIN_GRACE")
        elif (
            profile.gap_action is IndexGapAction.HOLD_LAST_WITHIN_GRACE
            and continuity_failed
        ):
            status = IndexInputStatus.UNKNOWN_CONTINUITY
        else:
            status = IndexInputStatus.UNKNOWN_COVERAGE
    elif continuity_failed:
        status = IndexInputStatus.UNKNOWN_CONTINUITY
    else:
        status = IndexInputStatus.ELIGIBLE_SHADOW
        reasons.append("PROSPECTIVE_SHADOW_INPUT_ELIGIBLE")

    return IndexInputDecision(
        status=status,
        scope_kind=scope_kind,
        scope_code=scope_code,
        profile_id=profile.profile_id,
        membership_id=membership.membership_id,
        input_window_sha256=stable_hash(slots),
        query_as_of=query_as_of,
        known_at=known_at,
        expected_member_count=expected_count,
        current_valid_member_count=valid_counts[-1],
        current_missing_member_count=missing_counts[-1],
        current_stale_member_count=stale_counts[-1],
        current_conflicted_member_count=conflicted_counts[-1],
        current_insufficient_source_member_count=insufficient_source_counts[-1],
        current_invalid_value_member_count=invalid_value_counts[-1],
        current_coverage_ratio=coverages[-1],
        window_insufficient_source_observation_count=window_insufficient_source_count,
        window_invalid_value_observation_count=window_invalid_value_count,
        qualified_slot_count=qualified_count,
        window_slot_count=len(slots),
        window_span=window_span,
        qualified_slot_ratio=qualified_ratio,
        current_unqualified_streak=current_streak,
        longest_temporal_gap_slots=longest_gap,
        reason_codes=tuple(reasons),
    )


__all__ = [
    "INDEX_USAGE_SCOPE",
    "IndexContractError",
    "IndexCurrencyUnit",
    "IndexGapAction",
    "IndexInputContract",
    "IndexInputDecision",
    "IndexInputStatus",
    "IndexMember",
    "IndexMemberObservation",
    "IndexMemberValueStatus",
    "IndexMembershipMode",
    "IndexMembershipSnapshot",
    "IndexMembershipTransition",
    "IndexObservationSlot",
    "IndexPolicyProfile",
    "IndexRebalanceTrigger",
    "IndexWeightingMethod",
    "IndexValueSemantics",
    "MembershipChangeAction",
    "build_membership_transition",
    "evaluate_index_input",
]
