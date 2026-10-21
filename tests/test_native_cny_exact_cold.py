from fractions import Fraction
import random

import pytest

from cs2_research.feature_input import native_cny_index as idx


@pytest.mark.parametrize('sign', [1, -1])
@pytest.mark.parametrize('bits', [16380, 16384, 32768])
def test_cold_roundtrip_both_sides_of_threshold(sign, bits):
    n = (1 << bits) + 1
    expected = Fraction(sign*n, n+2)
    actual = idx.from_exact(idx.exact(expected))
    assert type(actual) is Fraction
    assert type(actual.numerator) is int and type(actual.denominator) is int
    assert actual == expected and idx.exact(actual) == idx.exact(expected)
    assert actual * Fraction(101, 97) == expected * Fraction(101, 97)


@pytest.mark.parametrize('kind', ['common_factor', 'zero_noncanonical', 'leading_zero', 'uppercase', 'negative_denominator'])
def test_large_malformed_still_rejected(kind):
    n = (1 << 17000) + 1
    v = {'numerator_hex': format(n*3, 'x'), 'denominator_hex': format((n+2)*3, 'x')}
    if kind == 'zero_noncanonical': v['numerator_hex'] = '0'
    if kind == 'leading_zero': v['numerator_hex'] = '0'+v['numerator_hex']
    if kind == 'uppercase': v['numerator_hex'] = 'A'+v['numerator_hex']
    if kind == 'negative_denominator': v['denominator_hex'] = '-'+v['denominator_hex']
    with pytest.raises(ValueError): idx.from_exact(v)


def test_deterministic_large_randoms_equal_standard_fraction():
    rng=random.Random(20260928)
    for _ in range(24):
        expected=Fraction(rng.getrandbits(17000)-2**16999, rng.getrandbits(17000)+1)
        assert idx.from_exact(idx.exact(expected)) == expected


def test_resource_callback_stops_without_advancing_cache():
    class Stop(Exception): pass
    cache=idx.ExactContinuationCache()
    cache.replace({'OLD': (Fraction(2), Fraction(2))})
    before=dict(cache._previous)
    calls=[]
    def check():
        calls.append(1)
        if len(calls)==4: raise Stop()
    with pytest.raises(Stop):
        idx.calculate_points(right={},left={},scopes={},anchors={'ALL':'1000','SECOND':'1000'},
            prior_points={},linked=False,continuation_cache=cache,resource_check=check)
    assert cache._previous==before


def test_callback_does_not_change_results():
    args=dict(right={'x':{'price':Fraction(101),'sources':('market_a',)}},
        left={'x':{'price':Fraction(100),'sources':('market_a',)}},scopes={'x':['WEAPON']},
        anchors={'ALL':'1000','WEAPON':'1000'},prior_points={},linked=False)
    calls=[]
    assert idx.calculate_points(**args)==idx.calculate_points(**args,resource_check=lambda:calls.append(1))
    assert len(calls)>=6
