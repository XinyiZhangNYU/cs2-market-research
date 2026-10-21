import copy
from datetime import UTC, date, datetime, timedelta
from decimal import localcontext
from fractions import Fraction

import pytest

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.feature_input import native_cny_measurements as m
from cs2_research.feature_input import native_cny_index as idx


def pin(doc):
    return sha256_hex(canonical_json_bytes(doc))


def reseal(doc):
    return m._seal({k: v for k, v in doc.items() if k != 'document_sha256'})


def environment(count=1):
    ids = {'members': [{'analysis_unit_id': f'item:{i}', 'market_hash_name': f'Item {i}',
        'variant_version': None, 'identity_sha256': pin({'i': i}), 'source_ids': list(idx.SOURCES)}
        for i in range(count)]}
    scopes = {r['analysis_unit_id']: ['WEAPON'] for r in ids['members']}
    anchors = {'ALL': '1000', 'WEAPON': '1000'}
    spec = idx.make_spec(identities=ids, membership_sha256=pin(ids), scopes=scopes,
        scopes_sha256=pin(scopes), anchors=anchors, anchors_sha256=pin(anchors),
        implementation_commit='1'*40)
    return dict(spec=spec, spec_sha256=spec['document_sha256'], identities=ids,
                membership_sha256=pin(ids), scopes=scopes, anchors=anchors)


def frame(env, day='2026-09-27', prices=None, source_sets=None):
    count = len(env['identities']['members'])
    prices = ['100']*count if prices is None else prices
    source_sets = [('market_a', 'market_c')]*count if source_sets is None else source_sets
    members = []
    for member, price, sources in zip(env['identities']['members'], prices, source_sets, strict=True):
        rows = []
        for source in idx.SOURCES:
            good = price is not None and source in sources
            rows.append({'source': source, 'qualified_slots': 9 if good else 0,
                'source_records': [pin({'s': source, 'i': i}) for i in range(9)] if good else [],
                'ask_cny_major': price if good else None,
                'state': 'QUALIFIED_MEASUREMENT' if good else 'INSUFFICIENT_SLOTS'})
        members.append({'analysis_unit_id': member['analysis_unit_id'],
                        'identity_sha256': member['identity_sha256'], 'sources': rows})
    return m._seal({'schema': 'native-cny-eod-measurements/1', 'basis': m.BASIS,
        'policy': m.POLICY, 'currency': 'CNY', 'unit': 'CNY_MAJOR_EXACT', 'fx': None,
        'bucket_date': day, 'reduced_at': str(date.fromisoformat(day)+timedelta(days=1))+'T00:01:00Z',
        'membership_sha256': env['membership_sha256'], 'members': members,
        'supplied_slots': 12, 'missing_slots': [], 'input_sha256': [pin({'slot': i}) for i in range(12)],
        'formal_state_eligible': False})


def run(env, current, previous=None, prior=None, **overrides):
    args = dict(**env, current=current, current_sha256=current['document_sha256'],
        previous=previous, previous_sha256=previous['document_sha256'] if previous else None,
        prior=prior, prior_sha256=prior['document_sha256'] if prior else None,
        measured_at='2026-10-01T00:00:00Z')
    args.update(overrides)
    return idx.build_day(**args)


def test_first_day_has_independent_identity_and_no_cross_basis_return():
    env = environment(); old = frame(env, '2026-09-26', prices=['1'])
    first = run(env, frame(env, prices=['10']), old)
    point = first['points'][0]
    assert first['method'] == idx.METHOD and first['currency'] == 'CNY' and first['fx'] is None
    assert first['formal_state_eligible'] is False
    assert point['index_display'] == '1000' and point['period_return_exact'] is None
    assert point['robust_equal_return_exact'] == idx.exact(Fraction(9))
    assert point['segment_number'] == 1


def test_exact_scale_not_display_drives_continuation_and_roundtrip():
    env = environment(); a = frame(env, prices=['3'])
    b = frame(env, '2026-09-28', prices=['1']); c = frame(env, '2026-09-29', prices=['3'])
    p1 = run(env, a); p2 = run(env, b, a, p1); p3 = run(env, c, b, p2)
    assert p2['points'][0]['index_display'] == '333.33333333'
    assert idx.from_exact(p2['points'][0]['index_exact']) == Fraction(1000, 3)
    assert idx.from_exact(p3['points'][0]['index_exact']) == 1000
    assert p3['points'][0]['segment_number'] == 1


def test_all_a_to_d_pairs_retained_not_same_source_gate():
    env = environment(5)
    a = frame(env, source_sets=[('market_a', 'market_c'), ('market_a', 'market_c'), ('market_a',), ('market_a',), ()])
    b = frame(env, '2026-09-28', ['110']*5,
        [('market_a', 'market_c'), ('market_a', 'market_b'), ('market_a', 'market_c'), ('market_b',), ()])
    p = run(env, b, a, run(env, a))['points'][0]
    assert p['grade_counts'] == dict(A=1, B=1, C=1, D=1, E=1)
    assert p['qualified_member_count'] == 4 and p['expected_member_count'] == 5
    assert p['index_display'] == '1100'


def test_single_source_and_unbound_members_not_dropped():
    env = environment(2); env['identities']['members'][1]['source_ids'] = []
    env['membership_sha256'] = pin(env['identities'])
    env['spec'] = idx.make_spec(identities=env['identities'], membership_sha256=env['membership_sha256'],
        scopes=env['scopes'], scopes_sha256=pin(env['scopes']), anchors=env['anchors'],
        anchors_sha256=pin(env['anchors']), implementation_commit='1'*40)
    env['spec_sha256'] = env['spec']['document_sha256']
    p = run(env, frame(env, prices=['0.0000000001', None], source_sets=[('market_a',), ()]))['points'][0]
    assert p['expected_member_count'] == 2 and p['absolute_price_qualified_member_count'] == 1
    assert idx.from_exact(p['ask_sum_cny_exact']) == Fraction(1, 10**10)


@pytest.mark.parametrize('count,winsor', [(99, False), (100, True), (101, True), (200, True)])
def test_winsor_threshold_and_full_adjustments(count, winsor):
    env = environment(count); a = frame(env)
    b = frame(env, '2026-09-28', ['200']+['100']*(count-2)+['50'])
    p = run(env, b, a, run(env, a))['points'][0]
    assert len(p['adjustments']) == (2 if winsor else 0)
    mean = idx.from_exact(p['robust_equal_return_exact'])
    assert mean == (0 if winsor else Fraction(1, 2*count))


@pytest.mark.parametrize('price,excluded', [('0.1', False), ('100000', False), ('0.099', True), ('100001', True)])
def test_return_domain_exact_edges(price, excluded):
    env = environment(); a = frame(env); b = frame(env, '2026-09-28', [price])
    p = run(env, b, a, run(env, a))['points'][0]
    assert p['rejected_return_domain_count'] == int(excluded)
    assert p['grade_counts']['E'] == 0  # rejected is not missing


def test_gap_and_missing_do_not_manufacture_zero_or_bridge():
    env = environment(); a = frame(env); p1 = run(env, a)
    b = frame(env, '2026-09-28', [None]); p2 = run(env, b, a, p1)
    c = frame(env, '2026-09-29', ['200']); p3 = run(env, c, b, p2)
    assert p2['points'][0]['index_exact'] is None
    assert p3['points'][0]['period_return_exact'] is None
    assert p3['points'][0]['index_display'] == '1000'
    assert p3['points'][0]['segment_number'] == 2
    skipped = run(env, c, prior=p1)
    assert skipped['points'][0]['period_return_exact'] is None


@pytest.mark.parametrize('count', [20, 21])
def test_coverage_minimum(count):
    env = environment(count); p = run(env, frame(env, prices=['100']+[None]*(count-1)))['points'][0]
    assert (p['index_exact'] is None) == (count == 21)


@pytest.mark.parametrize('field,value', [('basis', 'USD'), ('currency', 'USD'), ('fx', {'rate': 1}),
    ('unit', 'CNY_MINOR'), ('policy', 'OLD_MEDIAN'), ('membership_sha256', 'f'*64)])
def test_foreign_input_even_pinned_cannot_enter(field, value):
    env = environment(); doc = frame(env); doc[field] = value; doc = reseal(doc)
    with pytest.raises(ValueError, match='FRAME_BASIS'): run(env, doc)


@pytest.mark.parametrize('mutation', ['duplicate_member', 'missing_member', 'duplicate_source',
    'bad_identity', 'bad_count', 'negative_price', 'wrong_state', 'future', 'bad_pin', 'bad_rules'])
def test_strict_shape_and_context(mutation):
    env = environment(); doc = frame(env)
    if mutation == 'duplicate_member': doc['members'] *= 2
    if mutation == 'missing_member': doc['members'] = []
    if mutation == 'duplicate_source': doc['members'][0]['sources'] *= 2
    if mutation == 'bad_identity': doc['members'][0]['identity_sha256'] = 'f'*64
    if mutation == 'bad_count': doc['members'][0]['sources'][0]['qualified_slots'] = 8
    if mutation == 'negative_price': doc['members'][0]['sources'][0]['ask_cny_major'] = '-1'
    if mutation == 'wrong_state': doc['members'][0]['sources'][0]['state'] = 'INSUFFICIENT_SLOTS'
    if mutation == 'future': doc['reduced_at'] = '2026-10-02T00:00:00Z'
    doc = reseal(doc)
    if mutation == 'bad_pin': doc['document_sha256'] = 'f'*64
    if mutation == 'bad_rules':
        env['spec']['robust_rule'] = 'NO_WINSOR'; env['spec'] = reseal(env['spec'])
        env['spec_sha256'] = env['spec']['document_sha256']
    with pytest.raises(ValueError): run(env, doc)


def test_adjacent_prior_has_to_be_exact_previous_frame():
    env = environment(); a = frame(env); altered = frame(env, prices=['200'])
    b = frame(env, '2026-09-28')
    with pytest.raises(ValueError, match='PRIOR_FRAME_MISMATCH'): run(env, b, altered, run(env, a))
    with pytest.raises(ValueError, match='NON_ADJACENT_FRAMES'): run(env, frame(env, '2026-09-29'), a)
    with pytest.raises(ValueError, match='PRIOR_CONTEXT'): run(env, a, prior=run(env, a))


@pytest.mark.parametrize('v,places,expected', [(Fraction(5, 2), 0, '2'), (Fraction(7, 2), 0, '4'),
    (Fraction(-5, 2), 0, '-2'), (Fraction(-1, 10**15), 12, '0'),
    (Fraction(1, 3), 8, '0.33333333')])
def test_display_half_even_only(v, places, expected):
    with localcontext() as ctx:
        ctx.prec = 2
        assert idx.display(v, places) == expected
        assert idx.from_exact(idx.exact(v)) == v


def test_large_exact_fraction_not_decimal_int_string_limited():
    v = Fraction(10**6000+1, 10**6001+3)
    assert idx.from_exact(idx.exact(v)) == v
    assert idx.display(v) == '0.1'


def test_context_precision_and_input_order_do_not_change_day_bytes():
    env = environment(3); a = frame(env, prices=['3', '7', '9'])
    b = frame(env, '2026-09-28', prices=['5', '8', '10']); prior = run(env, a)
    first = run(env, b, a, prior)
    with localcontext() as ctx:
        ctx.prec = 2
        assert run(env, b, a, prior) == first


def test_fusion_two_mean_three_median_preserves_subatom():
    env = environment(); d = frame(env, prices=['0.00000001'])
    row = d['members'][0]['sources']
    next(r for r in row if r['source'] == 'market_c')['ask_cny_major'] = '0.00000002'
    d = reseal(d); p = run(env, d)['points'][0]
    assert idx.from_exact(p['ask_sum_cny_exact']) == Fraction(15, 10**9)


@pytest.mark.parametrize('count', [5, 99, 100, 101])
def test_legacy_formula_control_same_numeric_inputs_not_currency_bridge(count):
    # This control exercises unchanged legacy code; it is not a USD/CNY market
    # equivalence claim or a production installation test.
    import test_market_sector_index_continuation as legacy
    from decimal import Decimal
    env = environment(count)
    prices = ['110']*count
    if count >= 99:
        prices[0], prices[-1] = '500', '50'
    source_sets = [('market_a', 'market_b')]*count
    a, b = frame(env, source_sets=source_sets), frame(env, '2026-09-28', prices, source_sets)
    actual = run(env, b, a, run(env, a))['points'][0]
    membership = legacy._membership(count); spec = legacy._spec(membership)
    before, middle, after = [legacy._frame(membership, date(2026, 9, day),
        prices=[Decimal(v) for v in (prices if day == 12 else ['100']*count)]) for day in (10, 11, 12)]
    def old_run(left, right, prior=()):
        return legacy.build_forward_measured_points(spec=spec, membership=membership,
            previous=left, current=right, source_day_sha256='8'*64, source_head_tip_sha256='9'*64,
            measured_at=datetime(2026, 9, 13, 1, tzinfo=UTC), prior_points=prior)
    expected = old_run(middle, after, old_run(before, middle))[0]
    for key in ('expected_member_count', 'paired_member_count', 'qualified_member_count',
                'rejected_return_domain_count', 'grade_counts', 'source_pair_counts'):
        assert actual[key] == expected[key]
    assert actual['index_display'] == expected['index_value']
    assert actual['period_return_display'] == expected['period_return']
