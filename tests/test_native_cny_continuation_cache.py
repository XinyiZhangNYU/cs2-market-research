import copy
from fractions import Fraction
import random

import pytest

from cs2_research.feature_input import native_cny_index as idx


def test_no_decode_for_own_exact_values_but_changed_input_validated(monkeypatch):
    cache = idx.ExactContinuationCache()
    value = Fraction(123456789, 1234567)
    cache.replace({'ALL': (value, value)})
    original = idx.from_exact
    def forbidden(value):
        raise AssertionError('cache miss')
    monkeypatch.setattr(idx, 'from_exact', forbidden)
    assert cache.decode('ALL', 'index_exact', idx.exact(value)) == value
    monkeypatch.setattr(idx, 'from_exact', original)
    changed = idx.exact(Fraction(2))
    assert cache.decode('ALL', 'index_exact', changed) == 2
    changed['denominator_hex'] = '2'
    with pytest.raises(ValueError, match='EXACT_CANONICAL'):
        cache.decode('ALL', 'index_exact', changed)
    with pytest.raises(ValueError):
        cache.decode('ALL', 'index_exact', idx.exact(value) | {'extra': 'x'})


def test_cache_does_not_retain_days_or_removed_scopes():
    cache = idx.ExactContinuationCache()
    for day in range(100):
        cache.replace({str(day): (Fraction(day+1, 3), Fraction(day+1, 3))})
        assert len(cache._previous) == 2
        assert set(k[0] for k in cache._previous) == {str(day)}
    cache.replace({})
    assert not cache._previous


def test_cache_matches_uncached_across_missing_sources_origin_and_winsor():
    rng = random.Random(937)
    cache = idx.ExactContinuationCache()
    prior, prior_fast, left = {}, {}, None
    anchors = {'ALL':'1000', 'WEAPON':'1000', 'CASE':'1000', 'EMPTY':'1000'}
    for day in range(25):
        count = 99 if day < 3 else 120
        scopes = {str(i): ['WEAPON' if i%3 else 'CASE'] for i in range(count)}
        right = {u: {'price': None if day in (7, 8) or rng.random()<0.2 else
                     Fraction(rng.randint(1, 10000), rng.randint(1, 999)),
                     'sources': rng.choice([('market_a',), ('market_c',), ('market_a','market_c'), ('market_b',)])}
                 for u in scopes}
        args = dict(right=right, left=left, scopes=scopes, anchors=anchors, linked=left is not None)
        expected = idx.calculate_points(**args, prior_points=prior)
        actual = idx.calculate_points(**args, prior_points=prior_fast, continuation_cache=cache)
        assert actual == expected
        prior = {p['scope_code']:p for p in expected}
        prior_fast = copy.deepcopy({p['scope_code']:p for p in actual})
        # Simulate the archive's unresolved-origin override, outside calculator.
        if day == 10:
            for state in (prior, prior_fast):
                state['WEAPON'].update(index_exact=None, carried_scale_exact=idx.exact(Fraction(1000)), segment_number=0)
        left = right


def test_cache_snapshot_not_returned_mutable_dict():
    cache = idx.ExactContinuationCache()
    cache.replace({'ALL': (Fraction(1, 3), Fraction(1, 3))})
    value = idx.exact(Fraction(1, 3))
    assert cache.decode('ALL', 'index_exact', value) == Fraction(1, 3)
    value['numerator_hex'] = '2'
    assert cache.decode('ALL', 'index_exact', value) == Fraction(2, 3)


