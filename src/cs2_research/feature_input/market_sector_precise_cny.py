"""Opt-in MARKET analysis input. Never reuse integer-minor profile identity.

Uses validated source atoms and the original 18-place FX vintage, before money
rounding. Existing display projections remain unchanged. No production default.
"""
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, localcontext
from typing import Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.fx import validate_cny_analysis_projection
from .market_sector_cny_v3 import V3CnyProjectionBatch
from .market_sector_daily_v3 import (
    V3DailyPriceFrame, V3FusedMemberAsk, V3MemberPriceStatus,
    build_v3_daily_scope_measurement, v3_price_frame_document,
)

PRECISE_SCHEMA = "market-sector-precise-cny-frame/1"
PRECISE_UNIT = "CNY_MAJOR_DECIMAL_50_FROM_SOURCE_ATOMS_AND_FX18"


@dataclass(frozen=True)
class PreciseCnyFrame:
    frame: V3DailyPriceFrame
    source_rows: tuple[Mapping, ...]
    legacy_frame_sha256: str

    def document(self):
        frame_document = v3_price_frame_document(self.frame)
        frame_document["schema"] = "market-sector-precise-cny-price-frame/1"
        frame_document["currency_unit"] = PRECISE_UNIT
        for row in frame_document["members"]:
            row["fused_ask_cny_major"] = row.pop("fused_ask_atoms")
        core = {"schema": PRECISE_SCHEMA, "currency_unit": PRECISE_UNIT,
                "formal_state_eligible": False, "automatic_promotion": False,
                "requires_new_profile": True,
                "legacy_frame_sha256": self.legacy_frame_sha256,
                "price_frame": frame_document,
                "source_rows": [dict(row) for row in self.source_rows]}
        return {**core, "document_sha256": sha256_hex(canonical_json_bytes(core))}


def build_precise_cny_frame(*, membership, batch: V3CnyProjectionBatch) -> PreciseCnyFrame:
    if batch.frame.membership_id != membership.membership_id:
        raise ValueError("PRECISE_MEMBERSHIP_DRIFT")
    if len(batch.projections) != len(batch.converted_facts):
        raise ValueError("PRECISE_PROJECTION_COUNT_DRIFT")
    if batch.frame.available_at != batch.projection_computed_at:
        raise ValueError("PRECISE_COMPUTATION_CLOCK_DRIFT")
    member_by_id = {m.analysis_unit_id: m for m in membership.members}
    grouped, rows, seen = {}, [], set()
    with localcontext() as ctx:
        ctx.prec = 50
        for projection, fact in zip(batch.projections, batch.converted_facts):
            validate_cny_analysis_projection(dict(projection))
            source, fx = projection["source"], projection["fx"]
            if datetime.fromisoformat(projection["valuation_as_of"].replace("Z", "+00:00")) != batch.valuation_as_of:
                raise ValueError("PRECISE_VALUATION_CLOCK_DRIFT")
            if datetime.fromisoformat(projection["projected_at"].replace("Z", "+00:00")) != batch.projection_computed_at:
                raise ValueError("PRECISE_COMPUTATION_CLOCK_DRIFT")
            if projection["event_day"] != batch.frame.bucket_date.isoformat():
                raise ValueError("PRECISE_SOURCE_DAY_DRIFT")
            key = (source["analysis_unit_id"], source["logical_source"])
            member = member_by_id.get(key[0])
            if (key in seen or member is None or key[1] not in member.source_ids_present
                    or key != (fact.analysis_unit_id, fact.logical_source)
                    or fact.source_fact_sha256 != projection["document_hash"]
                    or fact.ask_atoms != int(projection["target"]["value"])
                    or fact.available_at != batch.projection_computed_at
                    or fact.bucket_date != batch.frame.bucket_date):
                raise ValueError("PRECISE_SOURCE_BINDING_DRIFT")
            seen.add(key)
            source_value = Decimal(source["value"]) / (Decimal(10) ** source["scale"])
            rate = Decimal(1) if fx is None else Decimal(fx["cny_per_usd"])
            exact = source_value * rate
            rounded = Decimal(projection["target"]["value"]) / 100
            row = {"analysis_unit_id": key[0], "logical_source": key[1],
                   "source_projection_sha256": projection["document_hash"],
                   "source_currency": source["currency"], "source_value": format(source_value, "f"),
                   "fx_rate": format(rate, "f"), "fx_pair_hash": None if fx is None else fx["pair_hash"],
                   "exact_cny_major": format(exact, "f"),
                   "display_cny_major": format(rounded, "f"),
                   "relative_level_rounding_error": None if exact == 0 else format(rounded / exact - 1, "f")}
            rows.append(row)
            grouped.setdefault(key[0], []).append(row)
        members = []
        for member in membership.members:
            present = sorted(grouped.get(member.analysis_unit_id, []), key=lambda r:r["logical_source"])
            positive = [r for r in present if Decimal(r["exact_cny_major"]) > 0]
            values = sorted(Decimal(r["exact_cny_major"]) for r in positive)
            qualified = len(values) >= 2
            status = (V3MemberPriceStatus.QUALIFIED if qualified else
                      V3MemberPriceStatus.INVALID_VALUE if len(positive) < len(present) else
                      V3MemberPriceStatus.INSUFFICIENT_SOURCES)
            fused = None if not qualified else (values[len(values)//2] if len(values)%2
                else (values[len(values)//2-1] + values[len(values)//2]) / 2)
            members.append(V3FusedMemberAsk(member.analysis_unit_id, member.identity_sha256,
                status, fused, tuple(r["logical_source"] for r in positive),
                ("MINIMUM_TWO_PRECISE_CNY_SOURCES" if qualified else "PRECISE_ENDPOINT_UNAVAILABLE",),
                sha256_hex(canonical_json_bytes({"identity": member.identity_sha256, "rows": present, "unit": PRECISE_UNIT}))))
    rows = tuple(sorted(rows, key=lambda r:(r["analysis_unit_id"], r["logical_source"])))
    legacy = sha256_hex(canonical_json_bytes(v3_price_frame_document(batch.frame)))
    digest = sha256_hex(canonical_json_bytes({"schema": PRECISE_SCHEMA, "unit": PRECISE_UNIT,
        "legacy_frame_sha256": legacy, "source_rows": list(rows)}))
    return PreciseCnyFrame(V3DailyPriceFrame(batch.frame.bucket_date, batch.frame.available_at,
        membership.membership_id, digest, tuple(members)), rows, legacy)


def compare_precise_cny_frames(*, membership, previous: PreciseCnyFrame, current: PreciseCnyFrame):
    if not isinstance(previous, PreciseCnyFrame) or not isinstance(current, PreciseCnyFrame):
        raise ValueError("PRECISE_UNIT_WRAPPER_REQUIRED_NO_LEGACY_MIX")
    with localcontext() as ctx:
        ctx.prec = 50  # Includes scope aggregation, not just member ratios.
        measurement = build_v3_daily_scope_measurement(membership=membership,
            previous=previous.frame, current=current.frame)
    old = {(r["analysis_unit_id"], r["logical_source"]): r for r in previous.source_rows}
    new = {(r["analysis_unit_id"], r["logical_source"]): r for r in current.source_rows}
    def positive_keys_by_member(table):
        grouped = {}
        for key, row in table.items():
            if Decimal(row["exact_cny_major"]) > 0:
                grouped.setdefault(key[0], set()).add(key)
        return grouped
    old_grouped, new_grouped = positive_keys_by_member(old), positive_keys_by_member(new)
    diagnostics = []
    with localcontext() as ctx:
        ctx.prec = 50
        for member in membership.members:
            old_keys = old_grouped.get(member.analysis_unit_id, set())
            new_keys = new_grouped.get(member.analysis_unit_id, set())
            sources = []
            for key in sorted(old_keys & new_keys):
                a, b = old[key], new[key]
                if a["source_currency"] != b["source_currency"]:
                    raise ValueError("PRECISE_SOURCE_CURRENCY_BREAK")
                source_return = Decimal(b["source_value"]) / Decimal(a["source_value"]) - 1
                fx_return = Decimal(b["fx_rate"]) / Decimal(a["fx_rate"]) - 1
                sources.append({"logical_source": key[1], "source_currency_return": str(source_return),
                    "fx_return": str(fx_return), "interaction": str(source_return * fx_return),
                    "cny_return": str(Decimal(b["exact_cny_major"]) / Decimal(a["exact_cny_major"]) - 1)})
            def leaders(table, keys):
                ordered = sorted(keys, key=lambda k:(Decimal(table[k]["exact_cny_major"]), k[1]))
                if not ordered: return []
                # Two-source mean has two contributors, not a fictitious leader.
                return [k[1] for k in (ordered if len(ordered)==2 else [ordered[len(ordered)//2]])]
            def spread(table, keys):
                vals = [Decimal(table[k]["exact_cny_major"]) for k in keys]
                return None if len(vals)<2 else str(max(vals)/min(vals)-1)
            diagnostics.append({"analysis_unit_id": member.analysis_unit_id,
                "same_source_set": old_keys == new_keys, "source_returns": sources,
                "previous_fusion_contributors": leaders(old, old_keys), "current_fusion_contributors": leaders(new, new_keys),
                "previous_source_spread": spread(old, old_keys), "current_source_spread": spread(new, new_keys)})
    return {"schema": "market-sector-precise-cny-comparison/1", "currency_unit": PRECISE_UNIT,
            "previous_sha256": previous.document()["document_sha256"], "current_sha256": current.document()["document_sha256"],
            "measurement": measurement, "source_diagnostics": diagnostics,
            "formal_state_eligible": False, "requires_new_profile": True}
