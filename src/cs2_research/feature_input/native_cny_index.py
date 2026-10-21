"""Exact native-CNY successor of robust-equal continuation mathematics.

Separate schemas: never masquerades as USD atoms, legacy V3 points, or an
installation certificate. All hashes are expected from the outer pinned plan.
No I/O, FX, provider request, database writer, or publication-pointer mutation.
"""
from collections import Counter
from dataclasses import dataclass
from datetime import date, timedelta
from fractions import Fraction
from numbers import Rational
import re
from types import MappingProxyType

from . import native_cny_measurements as m
from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.ingestion import native_cny as n

METHOD = 'ROBUST_EQUAL_NATIVE_CNY_EXACT_V1'
SPEC = 'native-cny-index-spec/1'
EXACT_SPEC = 'native-cny-index-spec/2'
# Fixed-precision successor: identical method, but the cumulative scale state
# (index level, carried scale, anchors) is fixed precision so the package size
# stays bounded. Opt-in only through this spec; SPEC/EXACT_SPEC callers are unchanged.
FIXED_SPEC = 'native-cny-index-spec/3'
FIXED_DIGITS = 50
FIXED_NUMERIC_RULE = 'FIXED_50_SIGNIFICANT_DECIMAL_DIGITS_ROUND_HALF_EVEN_SCALE_STATE_DISPLAY_ROUNDING'
# FIXED_SPEC anchors must be quantize_anchors(exact scale-origin anchors). The
# exact anchors are too large to carry wherever a spec is re-verified, so the only
# admitted quantizations are pinned in this table, keyed by the canonical sha256
# of the whole scale_origin: (exact anchors sha256, quantized anchors sha256).
# A deployment registers its entries here; the showcase ships none.
FIXED_ANCHOR_QUANTIZATIONS = MappingProxyType({})
SCALE_ORIGIN = 'native-cny-archive-scale-origin/1'
POINTS = 'native-cny-index-day/1'
SOURCES = tuple(sorted(n.SOURCES))
MASKS = {'market_a': 1, 'market_c': 2, 'market_b': 4}
# Explicit resource support domain, not a numeric approximation. Larger states
# require a separately measured successor budget; never silently truncate.
MAX_EXACT_HEX_CHARS = 8 * 1024 * 1024


def exact(value):
    """Hex avoids Python's decimal-integer string limit on exact mean ratios."""
    return None if value is None else {
        'numerator_hex': format(value.numerator, 'x'),
        'denominator_hex': format(value.denominator, 'x'),
    }


def quantize(value, digits=FIXED_DIGITS):
    """Positive rational -> nearest p/10**k with `digits` significant digits, ROUND_HALF_EVEN.

    Exact integer arithmetic only (no float result, no Decimal context). The
    float below only seeds the exponent search, which is then verified exactly.
    Idempotent: quantize(quantize(v)) == quantize(v). Relative error <= 5e-50.
    """
    if value is None:
        return None
    m._require(isinstance(value, Fraction) and value > 0 and type(digits) is int and 1 <= digits <= 100,
               'QUANTIZE_DOMAIN')
    p, q = value.numerator, value.denominator
    e = int((p.bit_length() - q.bit_length()) * 0.30102999566398120)
    def at_least(power):  # value >= 10**power, exactly
        return p >= q * 10**power if power >= 0 else p * 10**-power >= q
    while not at_least(e):
        e -= 1
    while at_least(e + 1):
        e += 1
    k = digits - 1 - e
    top, bottom = (p * 10**k, q) if k >= 0 else (p, q * 10**-k)
    whole, rest = divmod(top, bottom)
    if 2*rest > bottom or (2*rest == bottom and whole % 2):
        whole += 1
    return Fraction(whole, 10**k) if k >= 0 else Fraction(whole * 10**-k)


def quantize_anchors(anchors, *, resource_check=None):
    """Exact-rational scale anchors -> FIXED_SPEC anchors (same encoding, quantized values)."""
    check = resource_check if resource_check is not None else lambda: None
    m._require(isinstance(anchors, dict) and anchors and all(type(v) is dict for v in anchors.values()),
               'QUANTIZE_ANCHORS_EXACT')
    out = {}
    for scope in sorted(anchors):
        check()
        out[scope] = exact(quantize(from_exact(anchors[scope], resource_check=check)))
    return out


def _recoverable_exact(value):
    """Encode continuation state only within the cold decoder's support domain.

    Count hex characters (including a possible sign) before allocating strings.
    No re-decoding/gcd, rounding, truncation or automatic segment reset. General
    diagnostic ratios still use exact(); this guard applies to checkpoint state.
    """
    if value is not None:
        def width(integer):
            return max(1, (integer.bit_length() + 3) // 4) + (integer < 0)
        m._require(width(value.numerator) <= MAX_EXACT_HEX_CHARS
                   and width(value.denominator) <= MAX_EXACT_HEX_CHARS,
                   'EXACT_OUTPUT_SIZE_REQUIRES_SUCCESSOR')
    return exact(value)


@Rational.register
@dataclass(frozen=True)
class _CanonicalRatio:
    """Internal bridge after exact coprimality validation, never untrusted input.

    Fraction's public Rational constructor copies these built-in integers.
    No private Fraction fields, floating point or approximation are used.
    """
    numerator: int
    denominator: int


def from_exact(value, *, resource_check=None):
    check = resource_check if resource_check is not None else lambda: None
    check()
    if value is None:
        return None
    m._require(isinstance(value, dict) and set(value) == {'numerator_hex', 'denominator_hex'}, 'EXACT_SHAPE')
    a, b = value['numerator_hex'], value['denominator_hex']
    m._require(isinstance(a, str) and isinstance(b, str)
               and len(a) <= MAX_EXACT_HEX_CHARS and len(b) <= MAX_EXACT_HEX_CHARS, 'EXACT_SIZE')
    m._require(isinstance(a, str) and isinstance(b, str)
               and re.fullmatch('-?(0|[1-9a-f][0-9a-f]*)', a)
               and re.fullmatch('[1-9a-f][0-9a-f]*', b), 'EXACT_LEXEME')
    check()
    numerator, denominator = int(a, 16), int(b, 16)
    check()
    if max(len(a), len(b)) >= 4096:
        # Mature exact chains have millions of digits. GMP computes the same
        # exact gcd; do not redo that expensive validation in Fraction(a, b).
        from gmpy2 import gcd
        m._require(gcd(numerator, denominator) == 1, 'EXACT_CANONICAL')
        check()  # Cooperative boundary; the C gcd call itself is not preemptible.
        result = Fraction(_CanonicalRatio(numerator, denominator))
    else:
        result = Fraction(numerator, denominator)
    m._require(exact(result) == value, 'EXACT_CANONICAL')
    check()
    return result


def _exact_key(value):
    if (type(value) is dict and set(value) == {'numerator_hex', 'denominator_hex'}
            and type(value['numerator_hex']) is str and type(value['denominator_hex']) is str):
        return value['numerator_hex'], value['denominator_hex']
    return None


class _CallDecoder:
    """Bound to one invocation; reuse only values validated in that invocation."""
    def __init__(self, check, continuation_cache=None):
        self.check = check
        self.continuation_cache = continuation_cache
        self.values = {}

    def decode(self, scope, field, value):
        self.check()
        key = _exact_key(value)
        if key is not None:
            m._require(all(len(v) <= MAX_EXACT_HEX_CHARS for v in key), 'EXACT_SIZE')
        if key is not None and key in self.values:
            return self.values[key]
        result = (from_exact(value, resource_check=self.check) if self.continuation_cache is None
                  else self.continuation_cache.decode(scope, field, value, resource_check=self.check))
        self.check()
        if key is not None:
            self.values[key] = result
        return result


class ExactContinuationCache:
    """One calculation's previous scope values, not an input trust cache.

    Only canonical strings generated here from exact Fraction results are
    remembered. Changed/external values still take the full canonical decoder.
    Immutable tuple keys prevent a caller mutating a returned point from
    reusing an unrelated value. Each successful day REPLACES all old entries.
    No rounding, approximation, persistent cache or global process state.
    """
    def __init__(self):
        self._previous = {}

    @staticmethod
    def _key(value):
        return _exact_key(value)

    def decode(self, scope, field, value, *, resource_check=None):
        saved = self._previous.get((scope, field))
        key = self._key(value)
        if saved is not None and key is not None and key == saved[0]:
            return saved[1]
        return from_exact(value, resource_check=resource_check)

    def replace(self, values):
        self._previous = {
            (scope, field): (self._key(_recoverable_exact(value)), value)
            for scope, pair in values.items()
            for field, value in zip(('index_exact', 'carried_scale_exact'), pair)
            if value is not None
        }


def display(value, places=12):
    """Exact ROUND_HALF_EVEN at the display boundary; no float/Decimal context."""
    m._require(type(places) is int and 0 <= places <= 12, 'DISPLAY_PLACES')
    if value is None:
        return None
    q, r = divmod(abs(value.numerator) * 10**places, value.denominator)
    if 2*r > value.denominator or (2*r == value.denominator and q % 2):
        q += 1
    text = str(q).rjust(places+1, '0')
    if places:
        text = (text[:-places]+'.'+text[-places:]).rstrip('0').rstrip('.')
    return ('-' if value < 0 and q else '') + text


def quality(count, total):
    if total == 0:
        return 'UNAVAILABLE'
    ratio = Fraction(count, total)
    return ('UNAVAILABLE' if count == 0 or ratio < Fraction(1, 20) else
            'HIGH' if ratio >= Fraction(9, 10) else
            'PARTIAL' if ratio >= Fraction(7, 10) else 'LOW')


def _median(values):
    ordered = sorted(values)
    if not ordered:
        return None
    mid = len(ordered)//2
    return ordered[mid] if len(ordered) % 2 else (ordered[mid-1]+ordered[mid])/2


def _checked(doc, pin, schema):
    m._require(doc.get('schema') == schema and doc.get('document_sha256') == pin, 'DOCUMENT_PIN_OR_SCHEMA')
    m._verify({k: v for k, v in doc.items() if k != 'document_sha256'}, pin)


def make_spec(*, identities, membership_sha256, scopes, scopes_sha256,
              anchors, anchors_sha256, implementation_commit, scale_origin=None,
              resource_check=None, _anchor_decoder=None, significant_digits=None):
    """Freeze explicit scopes and *scale only* anchors; never splice USD returns.

    scopes = {analysis_unit_id: sorted nonempty scope codes}; ALL is implicit.
    Legacy anchors are positive decimal scales. Version 2 uses canonical exact
    rationals and an explicit, externally authenticated archive scale origin.
    There is no mixed encoding or rounding through display text. Authenticity/rights are the
    installation plan's responsibility, not conferred by a caller's self-hash.
    """
    members = m._members(identities, membership_sha256)
    units = {v['analysis_unit_id'] for v in members.values()}
    m._verify(scopes, scopes_sha256)
    m._verify(anchors, anchors_sha256)
    m._require(isinstance(scopes, dict) and set(scopes) == units, 'SCOPE_MEMBERSHIP')
    for codes in scopes.values():
        m._require(isinstance(codes, list) and codes
                   and all(isinstance(s, str) and s and s != 'ALL' for s in codes)
                   and codes == sorted(set(codes)), 'SCOPE_CODES')
    scope_set = {'ALL', *(s for codes in scopes.values() for s in codes)}
    m._require(set(anchors) == scope_set, 'ANCHOR_SCOPES')
    check = resource_check if resource_check is not None else lambda: None
    decoder = _anchor_decoder if _anchor_decoder is not None else _CallDecoder(check)
    is_exact = all(type(value) is dict for value in anchors.values())
    m._require(is_exact or all(type(value) is str for value in anchors.values()), 'ANCHOR_ENCODING')
    fixed = significant_digits is not None
    m._require(not fixed or (is_exact and significant_digits == FIXED_DIGITS), 'FIXED_SPEC_PRECISION')
    for scope, value in anchors.items():
        check()
        scale = decoder.decode(scope, 'anchor', value) if is_exact else m._price(value)
        m._require(scale is not None and scale > 0, 'ANCHOR_VALUES')
        m._require(not fixed or quantize(scale) == scale, 'FIXED_ANCHOR_NOT_QUANTIZED')
    if is_exact:
        fields = {'schema', 'source_day_sha256', 'source_calculation_sha256',
            'source_exchange_manifest_sha256', 'source_origin_ledger_sha256',
            'membership_sha256', 'scopes_sha256', 'anchors_sha256',
            'source_interval', 'source_bucket_date', 'first_measured_day', 'rule',
            'source_calculation_as_of'}
        m._require(type(scale_origin) is dict and set(scale_origin) == fields
            and scale_origin['schema'] == SCALE_ORIGIN
            and scale_origin['source_interval'] == '1d'
            and scale_origin['membership_sha256'] == membership_sha256
            and scale_origin['scopes_sha256'] == scopes_sha256
            and (fixed or scale_origin['anchors_sha256'] == anchors_sha256)
            and scale_origin['rule'] == 'SCALE_ONLY_NO_CROSS_ESTIMATOR_RETURN', 'SCALE_ORIGIN_CONTRACT')
        for key in fields:
            if key.endswith('_sha256'): m._hash(scale_origin[key])
        if fixed:
            # Replaces the exact-spec equality relaxed above: the quantized anchors
            # must be the pinned quantization of this exact scale origin.
            m._require(FIXED_ANCHOR_QUANTIZATIONS.get(sha256_hex(canonical_json_bytes(scale_origin)))
                       == (scale_origin['anchors_sha256'], anchors_sha256), 'FIXED_ANCHOR_PROVENANCE')
        old = date.fromisoformat(scale_origin['source_bucket_date'])
        first = date.fromisoformat(scale_origin['first_measured_day'])
        m._require(old.isoformat() == scale_origin['source_bucket_date']
            and first.isoformat() == scale_origin['first_measured_day']
            and first == old + timedelta(days=1), 'SCALE_ORIGIN_DATES')
        m._require(n.timestamp(scale_origin['source_calculation_as_of']).date() > old,
                   'SCALE_ORIGIN_KNOWLEDGE_CLOCK')
    else:
        m._require(scale_origin is None, 'LEGACY_SCALE_ORIGIN_FORBIDDEN')
    m._require(isinstance(implementation_commit, str)
               and re.fullmatch('[0-9a-f]{40}', implementation_commit), 'IMPLEMENTATION_COMMIT')
    body = {'schema': EXACT_SPEC if is_exact else SPEC, 'method': METHOD, 'basis': m.BASIS, 'eod_policy': m.POLICY,
        'membership_sha256': membership_sha256, 'scopes_sha256': scopes_sha256,
        'anchors_sha256': anchors_sha256, 'implementation_commit': implementation_commit,
        'return_rule': 'ADJACENT_COMPLETE_UTC_DAY_ALL_POSITIVE_PAIRS_WITH_A_TO_D_DISCLOSURE',
        'fusion_rule': 'ONE_SOURCE_VALUE_TWO_SOURCE_MEAN_THREE_SOURCE_MEDIAN',
        'robust_rule': 'SYMMETRIC_1_PERCENT_WINSOR_MINIMUM_ONE_HUNDRED',
        'gap_rule': 'NEW_SEGMENT_NO_FILL_NO_CROSS_GAP_RETURN',
        'numeric_rule': 'EXACT_RATIONAL_CALCULATION_DISPLAY_ONLY_ROUNDING',
        'formal_state_eligible': False}
    if is_exact:
        body.update(anchor_encoding='CANONICAL_EXACT_RATIONAL_SCALE_ONLY', scale_origin=scale_origin)
    if fixed:
        # scale_origin.anchors_sha256 stays the exact source anchors; anchors_sha256 is their
        # quantization. exact_anchors_sha256 states that binding explicitly (FIXED_ANCHOR_PROVENANCE).
        body.update(schema=FIXED_SPEC, numeric_rule=FIXED_NUMERIC_RULE, significant_digits=FIXED_DIGITS,
            rounding='ROUND_HALF_EVEN', anchor_encoding='QUANTIZED_EXACT_RATIONAL_SCALE_ONLY_FROM_SCALE_ORIGIN',
            exact_anchors_sha256=scale_origin['anchors_sha256'])
    return m._seal(body)


def _frame(doc, pin, identities, membership_sha256, measured_at):
    _checked(doc, pin, 'native-cny-eod-measurements/1')
    m._require(doc.get('basis') == m.BASIS and doc.get('policy') == m.POLICY
               and doc.get('currency') == 'CNY' and doc.get('unit') == 'CNY_MAJOR_EXACT'
               and doc.get('fx') is None and doc.get('membership_sha256') == membership_sha256, 'FRAME_BASIS')
    day = date.fromisoformat(doc['bucket_date'])
    available = n.timestamp(doc['reduced_at'])
    m._require(available.date() > day and available <= measured_at, 'FRAME_CLOCK')
    expected_missing_domain = {datetime_slot.isoformat() for datetime_slot in (
        n.timestamp(day.isoformat()+'T23:00:00Z') + timedelta(minutes=5*i) for i in range(12))}
    actual_missing = [n.timestamp(s).isoformat() for s in doc['missing_slots']]
    m._require(type(doc['supplied_slots']) is int and 0 <= doc['supplied_slots'] <= 12
               and len(doc['input_sha256']) == doc['supplied_slots']
               and len(set(doc['input_sha256'])) == doc['supplied_slots']
               and len(actual_missing) == len(set(actual_missing)) == 12-doc['supplied_slots']
               and set(actual_missing) <= expected_missing_domain, 'FRAME_SLOTS')
    for digest in doc['input_sha256']:
        m._hash(digest)
    expected = {v['analysis_unit_id']: v for v in m._members(identities, membership_sha256).values()}
    output = {}
    for row in doc['members']:
        unit = row['analysis_unit_id']
        m._require(unit in expected and unit not in output
                   and row['identity_sha256'] == expected[unit]['identity_sha256'], 'FRAME_IDENTITY')
        source_map = {}
        for fact in row['sources']:
            source = fact['source']
            m._require(source in SOURCES and source not in source_map, 'FRAME_SOURCE')
            count = fact['qualified_slots']
            m._require(type(count) is int and 0 <= count <= doc['supplied_slots']
                       and len(fact['source_records']) == count, 'FRAME_SOURCE_COUNT')
            for digest in fact['source_records']:
                m._hash(digest)
            value = m._price(fact['ask_cny_major'])
            if value is not None:
                m._require(value > 0 and count >= 9 and fact['state'] == 'QUALIFIED_MEASUREMENT'
                           and source in expected[unit]['source_ids'], 'FRAME_PRICE')
            else:
                m._require(fact['state'] in ('INSUFFICIENT_SLOTS', 'CROSS_SOURCE_INCOHERENT'), 'FRAME_MISSING_STATE')
            source_map[source] = value
        m._require(set(source_map) == set(SOURCES), 'FRAME_SOURCE_SET')
        positive = {s: p for s, p in source_map.items() if p is not None}
        m._require(not positive or max(positive.values()) <= 1000*min(positive.values()), 'FRAME_INCOHERENT')
        output[unit] = {'price': _median(positive.values()), 'sources': tuple(sorted(positive))}
    m._require(set(output) == set(expected), 'FRAME_MEMBER_SET')
    return day, output


def build_day(*, spec, spec_sha256, identities, membership_sha256, scopes, anchors,
              current, current_sha256, measured_at, previous=None, previous_sha256=None,
              prior=None, prior_sha256=None, resource_check=None):
    """Complete typed CNY EOD -> robust equal + descriptive scope calculations.

    prior is the last *same-spec* native day. Its exact values (not display) drive
    continuation. First day/gap recovery establishes scale with no bridge return.
    Missing dates/endpoints remain missing. Every denominator includes unbound
    members. Outer runner must authenticate input pins and append-only storage.
    """
    check = resource_check if resource_check is not None else lambda: None
    check()
    decoder = _CallDecoder(check)
    m._require(spec.get('schema') in (SPEC, EXACT_SPEC, FIXED_SPEC), 'SPEC_SCHEMA')
    _checked(spec, spec_sha256, spec['schema'])
    digits = FIXED_DIGITS if spec['schema'] == FIXED_SPEC else None
    expected_spec = make_spec(identities=identities, membership_sha256=membership_sha256,
        scopes=scopes, scopes_sha256=spec['scopes_sha256'], anchors=anchors,
        anchors_sha256=spec['anchors_sha256'], implementation_commit=spec['implementation_commit'],
        scale_origin=spec.get('scale_origin'), resource_check=check, _anchor_decoder=decoder,
        significant_digits=digits)
    m._require(spec == expected_spec, 'SPEC_RULE_DRIFT')
    now = n.timestamp(measured_at)
    if spec['schema'] in (EXACT_SPEC, FIXED_SPEC):
        m._require(now >= n.timestamp(spec['scale_origin']['source_calculation_as_of']),
                   'EXACT_SCALE_KNOWLEDGE_CLOCK')
    day, right = _frame(current, current_sha256, identities, membership_sha256, now)
    check()
    if spec['schema'] in (EXACT_SPEC, FIXED_SPEC):
        first = date.fromisoformat(spec['scale_origin']['first_measured_day'])
        m._require(day >= first, 'BEFORE_EXACT_SCALE_EPOCH')
        if day == first:
            m._require(previous is None and previous_sha256 is None
                and prior is None and prior_sha256 is None, 'EXACT_SCALE_FIRST_DAY_NO_BRIDGE')
        else:
            m._require(prior is not None, 'EXACT_SCALE_EPOCH_STATE_REQUIRED')
    left = None
    if previous is not None:
        prev_day, left = _frame(previous, previous_sha256, identities, membership_sha256, now)
        check()
        m._require(prev_day + timedelta(days=1) == day, 'NON_ADJACENT_FRAMES')
    else:
        m._require(previous_sha256 is None, 'PREVIOUS_PIN_WITHOUT_FRAME')
    prior_points = {}
    if prior is not None:
        check()
        _checked(prior, prior_sha256, POINTS)
        check()
        m._require(prior['spec_sha256'] == spec_sha256 and prior['basis'] == m.BASIS
                   and prior['method'] == METHOD and n.timestamp(prior['measured_at']) <= now
                   and date.fromisoformat(prior['bucket_date']) < day, 'PRIOR_CONTEXT')
        if spec['schema'] in (EXACT_SPEC, FIXED_SPEC):
            m._require(date.fromisoformat(prior['bucket_date']) >= first, 'PRIOR_BEFORE_EXACT_SCALE_EPOCH')
            m._require(n.timestamp(prior['measured_at']) >= n.timestamp(
                spec['scale_origin']['source_calculation_as_of']), 'PRIOR_EXACT_SCALE_KNOWLEDGE_CLOCK')
        for point in prior['points']:
            check()
            code = point['scope_code']
            m._require(code not in prior_points and code in anchors, 'PRIOR_SCOPES')
            m._require(type(point['segment_number']) is int and point['segment_number'] >= 0, 'PRIOR_SEGMENT')
            for key in ('index_exact', 'carried_scale_exact'):
                v = decoder.decode(code, key, point[key])
                m._require((key == 'index_exact' and v is None) or v is not None and v > 0, 'PRIOR_SCALE')
                m._require(digits is None or v is None or quantize(v, digits) == v, 'PRIOR_NOT_QUANTIZED')
            prior_points[code] = point
        m._require(set(prior_points) == set(anchors), 'PRIOR_SCOPE_SET')
    else:
        m._require(prior_sha256 is None, 'PRIOR_PIN_WITHOUT_DAY')
    linked = (prior is not None and left is not None
              and date.fromisoformat(prior['bucket_date']) + timedelta(days=1) == day
              and prior['current_eod_sha256'] == previous_sha256)
    m._require(not (prior is not None and left is not None
               and date.fromisoformat(prior['bucket_date']) + timedelta(days=1) == day)
               or linked, 'PRIOR_FRAME_MISMATCH')
    output = calculate_points(right=right, left=left, scopes=scopes, anchors=anchors,
                              prior_points=prior_points, linked=linked, resource_check=check,
                              _prior_decoder=decoder, significant_digits=digits)
    check()
    return m._seal({'schema': POINTS, 'method': METHOD, 'basis': m.BASIS,
        'currency': 'CNY', 'fx': None, 'spec_sha256': spec_sha256, 'bucket_date': day.isoformat(),
        'current_eod_sha256': current_sha256, 'previous_eod_sha256': previous_sha256,
        'prior_day_sha256': prior_sha256, 'measured_at': measured_at,
        'points': output, 'formal_state_eligible': False})


def calculate_points(*, right, left, scopes, anchors, prior_points, linked,
                     continuation_cache=None, resource_check=None, _prior_decoder=None,
                     significant_digits=None):
    """Pure arithmetic for validated frames; this helper grants no admission.

    Archive and measured EOD callers retain distinct schemas and origin rules.
    ``scopes`` contains the current origin cohort, not just quoted members.
    First-day members can have no left entry. Empty scopes remain unavailable.
    """
    check = resource_check if resource_check is not None else lambda: None
    check()
    pairs = {}
    for ordinal, (unit, new) in enumerate(sorted(right.items())):
        if ordinal % 256 == 0:
            check()
        old = None if left is None else left.get(unit)
        grade, value, rejected = 'E', None, False
        if old is not None and old['price'] is not None and new['price'] is not None:
            a, b = set(old['sources']), set(new['sources'])
            grade = ('A' if a == b else 'B') if len(a) >= 2 and len(b) >= 2 else ('C' if a & b else 'D')
            ratio = new['price']/old['price']
            value, rejected = ratio-1, not Fraction(1, 1000) <= ratio <= 1000
        pairs[unit] = {'grade': grade, 'return': value, 'rejected': rejected,
                       'old': old, 'new': new}
    output = []
    next_exact = {}
    decoder = _prior_decoder if _prior_decoder is not None else _CallDecoder(check, continuation_cache)
    for scope in sorted(anchors):
        check()
        units = sorted(u for u in scopes if scope == 'ALL' or scope in scopes[u])
        rows = {u: pairs[u] for u in units}
        paired = {u: r for u, r in rows.items() if r['return'] is not None}
        admitted = {u: r['return'] for u, r in paired.items() if not r['rejected']}
        adjusted = dict(admitted)
        if len(admitted) >= 100:
            ordered = sorted(admitted.values()); tail = len(ordered)//100
            lower, upper = ordered[tail], ordered[-tail-1]
            adjusted = {u: min(max(v, lower), upper) for u, v in admitted.items()}
        mean = None if not adjusted else sum(adjusted.values(), Fraction())/len(adjusted)
        raw = None if not paired else sum((r['return'] for r in paired.values()), Fraction())/len(paired)
        prices = [r['new']['price'] for r in rows.values() if r['new']['price'] is not None]
        price_quality, return_quality = quality(len(prices), len(rows)), quality(len(admitted), len(rows))
        last = prior_points.get(scope)
        def prior_exact(field):
            check()
            value = decoder.decode(scope, field, last[field])
            check()
            return value
        carried = ((decoder.decode(scope, 'anchor', anchors[scope]) if type(anchors[scope]) is dict
                    else m._price(anchors[scope])) if last is None else prior_exact('carried_scale_exact'))
        segment = 0 if last is None else last['segment_number']
        period = None
        if price_quality == 'UNAVAILABLE':
            level, state = None, 'BELOW_MINIMUM_INTERPRETABLE_COVERAGE'
        elif linked and last['index_exact'] is not None and return_quality != 'UNAVAILABLE':
            period = mean
            level = prior_exact('index_exact')*(1+period)
            state = 'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN'
        else:
            level, segment = carried, segment+1
            state = 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN'
        if significant_digits is not None and level is not None:
            level = quantize(level, significant_digits)  # FIXED_SPEC only; carried follows level
        if level is not None:
            carried = level
        # Validate every scope before a successful result or cache replacement.
        # A later scope failure leaves the previous day's entire cache intact.
        level_exact = _recoverable_exact(level)
        carried_exact = _recoverable_exact(carried)
        next_exact[scope] = (level, carried)
        grades = Counter(rows[u]['grade'] for u in admitted)
        grade_counts = {g: grades[g] for g in 'ABCD'}
        grade_counts['E'] = len(rows)-len(paired)
        changes = [{'analysis_unit_id': u, 'raw_return_exact': exact(admitted[u]),
                    'adjusted_return_exact': exact(v), 'adjustment_exact': exact(v-admitted[u])}
                   for u, v in adjusted.items() if v != admitted[u]]
        source_pairs = Counter(
            f"{sum(MASKS[s] for s in r['old']['sources'])}->{sum(MASKS[s] for s in r['new']['sources'])}"
            for r in paired.values())
        grade_a = [r['return'] for r in paired.values() if r['grade'] == 'A']
        d_share = Fraction(grades['D'], len(admitted)) if admitted else None
        output.append({'scope_code': scope, 'expected_member_count': len(rows),
            'paired_member_count': len(paired), 'qualified_member_count': len(admitted),
            'rejected_return_domain_count': len(paired)-len(admitted),
            'rejected_members': [u for u in paired if paired[u]['rejected']],
            'grade_counts': grade_counts, 'source_pair_counts': dict(sorted(source_pairs.items())),
            'grade_d_share_exact': exact(d_share),
            'warnings': ['GRADE_D_SHARE_ABOVE_WARNING_LEVEL'] if d_share is not None and d_share > Fraction(1, 4) else [],
            'high_confidence_a_equal_return_exact': exact(sum(grade_a, Fraction())/len(grade_a)) if grade_a else None,
            'absolute_price_qualified_member_count': len(prices),
            'ask_sum_cny_exact': exact(sum(prices, Fraction())) if prices else None,
            'ask_median_cny_exact': exact(_median(prices)),
            'absolute_price_semantic': 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE',
            'raw_equal_return_exact': exact(raw), 'robust_equal_return_exact': exact(mean),
            'period_return_exact': exact(period), 'period_return_display': display(period),
            'index_exact': level_exact, 'index_display': display(level, 8),
            'carried_scale_exact': carried_exact, 'segment_number': segment,
            'price_quality': price_quality, 'return_quality': return_quality, 'state': state,
            'effective_estimator': 'SYMMETRIC_1_PERCENT_WINSOR' if len(admitted) >= 100 else
                'RAW_EQUAL_ADMITTED_NO_WINSOR' if admitted else None,
            'adjustments': changes,
            'member_returns': [{'analysis_unit_id': u, 'grade': r['grade'],
                'raw_return_exact': exact(r['return']), 'rejected_return_domain': r['rejected'],
                'old_sources': list(r['old']['sources']) if r['old'] is not None else [],
                'new_sources': list(r['new']['sources'])} for u, r in rows.items()]})
        check()
    if continuation_cache is not None:
        continuation_cache.replace(next_exact)
    return output
