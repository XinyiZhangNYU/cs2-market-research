from copy import deepcopy
from dataclasses import replace
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal, localcontext

import pytest

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.feature_input.market_sector_cny_v3 import build_v3_cny_projection_batch
from cs2_research.feature_input.market_sector_daily_v1 import FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
from cs2_research.feature_input.market_sector_daily_v3 import V3ReducedSourceAskFact
from cs2_research.feature_input.market_sector_eod_v3 import (
    V3EndOfDayReduction, V3EndOfDayDiagnostic, V3EndOfDaySourceStatus,
)
from cs2_research.feature_input.market_sector_taxonomy_v3 import TaxonomyMemberV3, TaxonomyMembershipV3
from cs2_research.feature_input.market_sector_descriptive import (
    POLICY_SHA256, build_descriptive_frame, build_descriptive_measurement,
    select_descriptive_display, coverage_grade, descriptive_policy_document,
)
from test_market_sector_cny_v3 import _book


DAY = date(2026, 9, 6)
SOURCES = ("market_a", "market_b", "market_c")


def membership_fixture(n=10):
    names = [f"Item {i}" for i in range(n)]
    schema = canonical_json_bytes({"schema_version": "v3", "generation_id": "test",
        "counts": {"items": n}, "items": {name: {"ids": dict(zip(SOURCES, (11+i*3,12+i*3,13+i*3)))}
                                                for i, name in enumerate(names)}})
    members = tuple(TaxonomyMemberV3(f"item:{i:05d}", name, "WEAPON",
        ("CASE:TEST", "WEAPON") if i == 0 else ("WEAPON",),
        sha256_hex(name.encode()), "EXACT_INTERNAL_CATALOG_PROJECTION", SOURCES)
        for i, name in enumerate(names))
    doc = {"input_hashes": {"schema": sha256_hex(schema)},
           "schema_identity": {"schema_version": "v3", "generation_id": "test"}}
    m = TaxonomyMembershipV3("test-membership", datetime(2026,9,1,tzinfo=UTC), members, doc)
    return m, schema


def make_inputs(m, schema, *, day=DAY, values=None, present=None, fresh=12):
    values = values or {}
    present = len(m.members) if present is None else present
    computed = datetime.combine(day+timedelta(days=1), datetime.min.time(), tzinfo=UTC)
    facts, diagnostics = [], []
    for i, member in enumerate(m.members):
        source_values = values.get(i, {"market_a": "100", "market_b": "100"} if i < present else {})
        for source in SOURCES:
            value = source_values.get(source)
            atoms = None if value is None else int(Decimal(str(value))*10**8)
            marker = sha256_hex(canonical_json_bytes({"unit": member.analysis_unit_id,
                "source": source, "day": day.isoformat(), "atoms": atoms}))
            if atoms is not None:
                facts.append(V3ReducedSourceAskFact(member.analysis_unit_id, day, source,
                    atoms, computed-timedelta(minutes=5), marker))
            diagnostics.append(V3EndOfDayDiagnostic(member.analysis_unit_id, source,
                V3EndOfDaySourceStatus.QUALIFIED if atoms is not None else V3EndOfDaySourceStatus.INSUFFICIENT_SLOTS,
                12 if atoms is not None else 0, fresh if atoms is not None else 0,
                12-fresh if atoms is not None else 0, 0, 0, atoms,
                ("TEST_QUALIFIED" if atoms is not None else "TEST_MISSING",), marker))
    msha = sha256_hex(canonical_json_bytes(dict(m.document)))
    reduction = V3EndOfDayReduction(day, computed, m.membership_id, msha, "5"*64,
        FROZEN_END_OF_DAY_REDUCTION_POLICY_V1.policy_sha256, 12, tuple(facts), tuple(diagnostics))
    batch = build_v3_cny_projection_batch(membership=m, membership_sha256=msha,
        reduction=reduction, schema_payload=schema, schema_sha256=sha256_hex(schema),
        rate_book=_book(), projection_computed_at=computed+timedelta(minutes=1))
    return batch, reduction


def make_frame(m, schema, **kwargs):
    batch, reduction = make_inputs(m, schema, **kwargs)
    return build_descriptive_frame(membership=m, batch=batch, reduction=reduction)


def measurement(m, a, b):
    return build_descriptive_measurement(membership=m, previous=a, current=b)


def all_scope(result):
    return next(s for s in result.document()["scopes"] if s["scope_code"] == "ALL")


def display(m, results, *, expected=DAY+timedelta(days=1), as_of=None, scope="ALL"):
    as_of = as_of or datetime.combine(expected+timedelta(days=1), datetime.min.time(),tzinfo=UTC)+timedelta(hours=1)
    return select_descriptive_display(measurements=results,membership=m,scope_code=scope,
        expected_bucket_date=expected,as_of=as_of)


@pytest.mark.parametrize("valid,total,grade", [
    (90,100,"HIGH_COVERAGE_ESTIMATE"),(89,100,"PARTIAL_COVERAGE_ESTIMATE"),
    (70,100,"PARTIAL_COVERAGE_ESTIMATE"),(69,100,"OBSERVED_SAMPLE_DETAIL_ONLY"),
    (0,100,"NO_CURRENT_PAIRS"),(1,1,"HIGH_COVERAGE_ESTIMATE"),
    (899999,1000000,"PARTIAL_COVERAGE_ESTIMATE"),
    (699999,1000000,"OBSERVED_SAMPLE_DETAIL_ONLY"),
])
def test_integer_coverage_boundaries(valid,total,grade):
    assert coverage_grade(valid,total) == grade


@pytest.mark.parametrize("valid,total", [(1,0),(-1,10),(11,10),(True,1),(1,False)])
def test_invalid_counts(valid,total):
    with pytest.raises(ValueError,match="COVERAGE_COUNTS"):
        coverage_grade(valid,total)


def test_policy_is_explicit_and_not_mutable_by_returned_dict():
    policy = descriptive_policy_document()
    assert policy["high_coverage_bps"] == 9000
    assert policy["partial_coverage_bps"] == 7000
    assert policy["historical_headline_max_missing_days"] == 3
    policy["partial_coverage_bps"] = 0
    assert sha256_hex(canonical_json_bytes(descriptive_policy_document())) == POLICY_SHA256


def test_single_two_three_source_fusion_and_old_batch_unchanged():
    m,schema = membership_fixture(3)
    batch, reduction = make_inputs(m,schema,values={
        0:{"market_a":"1"},1:{"market_a":"1","market_b":"3"},
        2:{"market_a":"1","market_b":"9","market_c":"3"}})
    frame = build_descriptive_frame(membership=m,batch=batch,reduction=reduction)
    assert [r.fused_ask_atoms for r in frame.frame.members] == [Decimal(7),Decimal(14),Decimal(21)]
    assert batch.frame.members[0].fused_ask_atoms is None  # Legacy min-two unchanged.
    assert frame.document()["price_frame"]["schema"] != "market-sector-v3-price-frame/1"
    assert not frame.document()["publication_eligible"]


def test_no_bid_dependency_and_subcent_precision_survives():
    m,schema = membership_fixture(1)
    a = make_frame(m,schema,values={0:{"market_a":"0.00001"}})
    b = make_frame(m,schema,day=DAY+timedelta(days=1),values={0:{"market_a":"0.00002"}})
    result = measurement(m,a,b)
    scope = all_scope(result)
    assert Decimal(scope["raw_equal_member_return"]) == 1
    assert scope["single_source_pair_count"] == 1
    assert scope["scope_role"] == "SINGLE_MEMBER_DIRECT_PRICE"
    assert scope["robust_equal_member_return"] is None


def test_missing_expensive_member_does_not_manufacture_crash():
    m,schema = membership_fixture(2)
    a = make_frame(m,schema,values={1:{"market_a":"1000","market_b":"1000"}})
    b = make_frame(m,schema,day=DAY+timedelta(days=1),present=1)
    scope = all_scope(measurement(m,a,b))
    assert scope["raw_equal_member_return"] == "0"
    assert scope["member_count"] == 2 and scope["valid_return_count"] == 1
    assert scope["complete_target_exact_return"] is None
    assert scope["coverage_grade"] == "OBSERVED_SAMPLE_DETAIL_ONLY"
    assert scope["missing_by_item_kind"] == {"WEAPON":1}


def test_source_replacement_is_not_a_return_but_current_price_remains():
    m,schema = membership_fixture(1)
    a = make_frame(m,schema,values={0:{"market_a":"100"}})
    b = make_frame(m,schema,day=DAY+timedelta(days=1),values={0:{"market_b":"200"}})
    scope = all_scope(measurement(m,a,b))
    assert scope["raw_equal_member_return"] is None
    assert scope["source_set_break_count"] == 1
    assert scope["current_qualified_price_count"] == 1


def test_minimum_nine_slot_gate_not_relaxed_for_single_source():
    m,schema = membership_fixture(1)
    with pytest.raises(ValueError, match="EOD_DIAGNOSTIC_NOT_QUALIFIED"):
        make_inputs(m,schema,values={0:{"market_a":"1"}},fresh=8)


def test_minimum_nine_passes():
    m,schema = membership_fixture(1)
    assert make_frame(m,schema,values={0:{"market_a":"1"}},fresh=9).frame.members[0].fused_ask_atoms == 7


def test_batch_source_binding_cannot_be_relabelled():
    m,schema = membership_fixture(1)
    batch,reduction = make_inputs(m,schema)
    projection = deepcopy(batch.projections[0])
    projection["source"]["value"] = "999"
    with pytest.raises(ValueError,match="SOURCE_REDUCTION_BINDING"):
        build_descriptive_frame(membership=m,batch=replace(batch,projections=(projection,*batch.projections[1:])),reduction=reduction)


def test_tampered_frame_wrong_membership_or_policy_is_rejected():
    m,schema = membership_fixture(1)
    a,b = make_frame(m,schema),make_frame(m,schema,day=DAY+timedelta(days=1))
    with pytest.raises(ValueError,match="FRAME_DIGEST"):
        measurement(m,a,replace(b,frame=replace(b.frame,available_at=b.frame.available_at+timedelta(seconds=1))))
    with pytest.raises(ValueError,match="POLICY_DRIFT"):
        measurement(m,a,replace(b,policy_sha256="0"*64))
    changed = replace(m,members=(replace(m.members[0],identity_sha256="f"*64),))
    with pytest.raises(ValueError,match="MEMBERSHIP_DRIFT"):
        measurement(changed,a,b)


def test_missing_day_cannot_be_bridged():
    m,schema = membership_fixture(1)
    with pytest.raises(ValueError,match="DAY_GAP"):
        measurement(m,make_frame(m,schema),make_frame(m,schema,day=DAY+timedelta(days=2)))


@pytest.mark.parametrize("n,applied", [(99,False),(100,True)])
def test_small_scopes_do_not_claim_winsor(n,applied):
    m,schema = membership_fixture(n)
    a = make_frame(m,schema)
    b = make_frame(m,schema,day=DAY+timedelta(days=1),values={0:{"market_a":"10000","market_b":"10000"}})
    scope = all_scope(measurement(m,a,b))
    assert scope["estimator_applied"] is applied
    if applied:
        assert scope["robust_equal_member_return"] == "0"
        assert len(scope["anomaly_contributions"]) == 1
    else:
        assert scope["robust_equal_member_return"] is None


@pytest.mark.parametrize("age,expected_status",[(0,"HIGH_COVERAGE_ESTIMATE"),
    (1,"HISTORICAL_VALUE_DISPLAY_ONLY"),(3,"HISTORICAL_VALUE_DISPLAY_ONLY"),(4,"NO_RECENT_STATISTIC")])
def test_historical_headline_limit_is_not_a_data_ttl(age,expected_status):
    m,schema = membership_fixture(1)
    result = measurement(m,make_frame(m,schema),make_frame(m,schema,day=DAY+timedelta(days=1)))
    out = display(m,[result],expected=DAY+timedelta(days=1+age))
    assert out["status"] == expected_status
    assert out["latest_historical_measurement_sha256"] == result.document_sha256
    assert (out["headline_return"] is None) == (age>3)
    assert out["current_trend_state"] is None
    assert not out["historical_values_used_in_calculation"]


def test_low_coverage_detail_does_not_overwrite_dated_headline():
    m,schema = membership_fixture(10)
    a,b,c = make_frame(m,schema),make_frame(m,schema,day=DAY+timedelta(days=1)),make_frame(m,schema,day=DAY+timedelta(days=2),present=6)
    out = display(m,(x for x in [measurement(m,a,b),measurement(m,b,c)]),expected=DAY+timedelta(days=2))
    assert out["status"] == "HISTORICAL_VALUE_DISPLAY_ONLY"
    assert out["current_sample_detail"]["valid_return_count"] == 6
    assert not out["connect_current_to_previous"]


def test_asof_filters_future_results_and_duplicate_dates_are_rejected():
    m,schema = membership_fixture(1)
    b = make_frame(m,schema,day=DAY+timedelta(days=1))
    result = measurement(m,make_frame(m,schema),b)
    assert display(m,[result],as_of=b.frame.available_at-timedelta(seconds=1))["headline_return"] is None
    with pytest.raises(ValueError,match="DUPLICATE_VISIBLE_DAY"):
        display(m,[result,result])
    with pytest.raises(ValueError,match="EXPECTED_DAY_NOT_COMPLETE"):
        display(m,[result],as_of=datetime(2026,9,7,23,tzinfo=UTC))


def test_scopes_independent_and_no_fixed_minimum_member_count():
    m,schema = membership_fixture(10)
    result = measurement(m,make_frame(m,schema),make_frame(m,schema,day=DAY+timedelta(days=1),present=1))
    assert display(m,[result])["headline_return"] is None
    assert display(m,[result],scope="CASE:TEST")["headline_return"] == "0"


def test_replaced_shared_endpoint_is_rejected_even_with_valid_hashes():
    m,schema = membership_fixture(1)
    a=make_frame(m,schema)
    b=make_frame(m,schema,day=DAY+timedelta(days=1))
    b2=make_frame(m,schema,day=DAY+timedelta(days=1),values={0:{"market_a":"200","market_b":"200"}})
    c=make_frame(m,schema,day=DAY+timedelta(days=2))
    with pytest.raises(ValueError,match="SHARED_ENDPOINT_REPLACEMENT"):
        display(m,[measurement(m,a,b),measurement(m,b2,c)],expected=DAY+timedelta(days=2))


def test_zero_and_extreme_price_quarantine_and_precision_context():
    m,schema=membership_fixture(1)
    with pytest.raises(ValueError):
        make_frame(m,schema,values={0:{"market_a":"0"}})
    a=make_frame(m,schema)
    b=make_frame(m,schema,day=DAY+timedelta(days=1),values={0:{"market_a":"1000000","market_b":"1000000"}})
    scope=all_scope(measurement(m,a,b))
    assert scope["gross_error_quarantine_count"] == 1
    c=make_frame(m,schema,day=DAY+timedelta(days=1),values={0:{"market_a":"101","market_b":"101"}})
    with localcontext() as ctx:
        ctx.prec=3
        assert all_scope(measurement(m,a,c))["observed_sample_return"] == "0.01"


def test_pre_seal_day_requires_explicit_replay_and_cannot_enter_current_display():
    m,schema=membership_fixture(1)
    m=replace(m,sealed_at=datetime(2026,9,6,12,tzinfo=UTC))
    batch,reduction=make_inputs(m,schema)
    with pytest.raises(ValueError,match="DAY_BEFORE_MEMBERSHIP_SEAL"):
        build_descriptive_frame(membership=m,batch=batch,reduction=reduction)
    a=build_descriptive_frame(membership=m,batch=batch,reduction=reduction,allow_pre_seal_replay=True)
    b=make_frame(m,schema,day=DAY+timedelta(days=1))
    result=measurement(m,a,b)
    assert result.document()["evidence_class"] == "POST_HOC_PRE_SEAL_REPLAY"
    with pytest.raises(ValueError,match="REPLAY_NOT_CURRENT_DISPLAY_INPUT"):
        display(m,[result])
