"""Exact bounded timestamp memoization, including hostile type/error controls."""
from datetime import datetime, timedelta, timezone
import pytest
from cs2_research.ingestion import native_cny as n

@pytest.fixture(autouse=True)
def empty_cache():
    n._cached_timestamp_parts.cache_clear()
    n._cached_precise_timestamp_key.cache_clear()
    n._cached_observation_timestamp.cache_clear()
    yield
    n._cached_timestamp_parts.cache_clear()
    n._cached_precise_timestamp_key.cache_clear()
    n._cached_observation_timestamp.cache_clear()

@pytest.mark.parametrize('value',[
 '2026-09-28T00:55:00Z','2026-09-28T08:55:00+08:00',
 '2026-09-28T00:55:00.1234561000Z','2026-09-28T24:00:00.000Z',
 '2026-09-28t00:55:00,123456Z','2026-09-28 00:55:00-04:00'])
def test_success_exact_parts_and_single_parse(value):
    expected=n._parse_timestamp_parts(value)
    assert n._timestamp_parts(value)==expected
    assert n._timestamp_parts(value)==expected
    info=n._cached_timestamp_parts.cache_info()
    assert info.misses==1 and info.hits==1 and info.currsize==1

@pytest.mark.parametrize('value',[None,1,[],{},n.Number('2026-09-28T00:55:00Z'),
 '2026-09-28','bad','2026-09-28T24:00:00.1Z','2026-09-28T00:55:00+24:00'])
def test_rejections_match_uncached_without_retaining_errors(value):
    with pytest.raises(n.NativeCnyError) as old:n._parse_timestamp_parts(value)
    with pytest.raises(n.NativeCnyError) as new:n._timestamp_parts(value)
    assert str(old.value)==str(new.value)
    assert n._cached_timestamp_parts.cache_info().currsize==0

def test_str_subclass_unhashable_or_equal_not_cached():
    class Text(str):
        __hash__=None
    value=Text('2026-09-28T00:55:00Z')
    assert n._timestamp_parts(value)==n._parse_timestamp_parts(value)
    assert n._cached_timestamp_parts.cache_info().misses==0
    n.timestamp(str(value))
    with pytest.raises(n.NativeCnyError,match='TIME_TYPE'):n.timestamp(n.Number(value))

def test_long_fraction_exact_but_not_retained():
    value='2026-09-28T00:55:00.'+'0'*200+'1Z'
    assert n.precise_timestamp_key(value)[1]!=0
    with pytest.raises(n.NativeCnyError,match='TIME_PRECISION_UNSUPPORTED'):n.timestamp(value)
    assert n._cached_timestamp_parts.cache_info().currsize==0

def test_submicroseconds_remain_distinct_and_rejected_for_observation():
    first='2026-09-28T00:55:00.1234561Z';last='2026-09-28T00:55:00.1234569Z'
    assert n.precise_timestamp_key(first)<n.precise_timestamp_key(last)
    for value in (first,last,first):
        with pytest.raises(n.NativeCnyError,match='TIME_PRECISION_UNSUPPORTED'):n.timestamp(value)
    assert n.timestamp('2026-09-28T00:55:00.1234560000Z').microsecond==123456

def test_cache_is_bounded_and_eviction_exact():
    start=datetime(2026,1,1,tzinfo=timezone.utc)
    for i in range(4200):
        text=(start+timedelta(seconds=i)).isoformat()
        assert n.timestamp(text)==start+timedelta(seconds=i)
    assert n._cached_timestamp_parts.cache_info().currsize==4096
    assert n.timestamp(start.isoformat())==start


@pytest.mark.parametrize('value',[
 '2026-09-28T00:55:00Z','2026-09-28T08:55:00+08:00',
 '2026-09-28T00:55:00.123456000Z','2026-09-28T24:00:00.000Z'])
def test_final_objects_are_exact_immutable_and_memoized(value):
    expected_time=n._observation_timestamp(value)
    expected_key=n._precise_timestamp_key(value)
    for _ in range(3):
        assert n.timestamp(value)==expected_time
        assert n.precise_timestamp_key(value)==expected_key
    assert n._cached_observation_timestamp.cache_info().hits==2
    assert n._cached_precise_timestamp_key.cache_info().hits==2


@pytest.mark.parametrize('value',[None,[],{},n.Number('2026-09-28T00:55:00Z'),
 'bad','2026-09-28','2026-09-28T24:00:00.1Z','2026-09-28T00:55:00+24:00'])
@pytest.mark.parametrize('method,uncached,cache',[
 ('timestamp','_observation_timestamp','_cached_observation_timestamp'),
 ('precise_timestamp_key','_precise_timestamp_key','_cached_precise_timestamp_key')])
def test_final_cache_never_changes_rejections(value,method,uncached,cache):
    with pytest.raises(n.NativeCnyError) as original:getattr(n,uncached)(value)
    for _ in range(2):
        with pytest.raises(n.NativeCnyError) as actual:getattr(n,method)(value)
        assert str(original.value)==str(actual.value)
    assert getattr(n,cache).cache_info().currsize==0


def test_final_cache_bypasses_subclasses_and_long_lexemes():
    class Text(str):__hash__=None
    values=[Text('2026-09-28T00:55:00Z'),'2026-09-28T00:55:00.'+'0'*200+'Z']
    for value in values:
        assert n.timestamp(value)==n._observation_timestamp(value)
        assert n.precise_timestamp_key(value)==n._precise_timestamp_key(value)
    assert n._cached_observation_timestamp.cache_info().currsize==0
    assert n._cached_precise_timestamp_key.cache_info().currsize==0


def test_final_caches_remain_bounded():
    start=datetime(2026,1,1,tzinfo=timezone.utc)
    for i in range(4200):
        value=(start+timedelta(seconds=i)).isoformat()
        n.timestamp(value);n.precise_timestamp_key(value)
    assert n._cached_observation_timestamp.cache_info().currsize==4096
    assert n._cached_precise_timestamp_key.cache_info().currsize==4096
