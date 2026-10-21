"""Geometric native-CNY index estimators: price-tier balanced H, robust equal geometric V2
and the equal-weight geometric cohort curve E.

Sibling of native_cny_index.calculate_points/build_day (ROBUST_EQUAL_NATIVE_CNY_EXACT_V1,
which stays untouched and runnable). Same inputs, membership, admission, ratio
domain [1/1000, 1000], A-E grades, qualities and gap/segment rules. What differs:

  * the per-member value is ln(P_t / P_t-1), never the simple return, so the
    chained index has no Carli (arithmetic-mean-of-ratios) upward drift;
  * METHOD_H: monthly cohort from the previous calendar month-end frame, three
    reference-price tiers (<100, [100, 1000), >=1000 CNY), equal tier mass,
    sqrt(reference price) scores with a 1% cap (exact port of the research
    H_TIER_G weights); scopes where H cannot be formed use the equal geometric
    mean of all admitted members (no winsor);
  * METHOD_V2: equal geometric mean of all admitted members, symmetric 1% winsor
    on the logs only when at least 100 members are admitted (kept, never launched);
  * METHOD_E: equal geometric mean over the same monthly cohort as H (cohort
    members admitted on both days), no winsor, no small-scope rule; before the
    first month-end cohort the equal geometric mean of all admitted members (H's
    start rule). No outlier guard (SPEC amendment 1): every admitted cohort
    member-day counts; this is the research series E;
  * numeric state is fixed 50-significant-digit decimal (ROUND_HALF_EVEN): per
    scope a segment anchor and a cumulative log sum; level = anchor * exp(sum).
    No multiplicative drift, never an exact-rational chain.

No I/O, FX, provider request, database writer or publication-pointer mutation.
"""
from collections import Counter
from datetime import date, timedelta
from decimal import Context, Decimal, ROUND_HALF_EVEN, localcontext
from fractions import Fraction
import re

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.ingestion import native_cny as n
from . import native_cny_index as idx
from . import native_cny_measurements as m

METHOD_H = 'PRICE_TIER_BALANCED_NATIVE_CNY_V1'
METHOD_V2 = 'ROBUST_EQUAL_GEOMETRIC_NATIVE_CNY_V2'
METHOD_E = 'EQUAL_GEOMETRIC_COHORT_NATIVE_CNY_V1'
METHODS = (METHOD_H, METHOD_V2, METHOD_E)
COHORT_METHODS = (METHOD_H, METHOD_E)
SPEC = 'native-cny-geometric-index-spec/1'
POINTS = 'native-cny-geometric-index-day/1'
COHORT = 'native-cny-price-tier-cohort/1'
SCALE_ORIGIN = 'native-cny-geometric-scale-origin/1'
DIGITS = 50
WORK_PRECISION = 70
NUMERIC_RULE = 'FIXED_50_SIGNIFICANT_DECIMAL_DIGITS_CUMULATIVE_LOG_CHAIN_ROUND_HALF_EVEN_DISPLAY_ROUNDING'
STATE_BELOW = 'BELOW_MINIMUM_INTERPRETABLE_COVERAGE'
STATE_ADJACENT = 'ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN'
STATE_NEW = 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN'
STATES = (STATE_BELOW, STATE_ADJACENT, STATE_NEW)
ESTIMATOR_H = 'PRICE_TIER_BALANCED_H'
ESTIMATOR_EQUAL = 'EQUAL_GEOMETRIC_NO_WINSOR'
ESTIMATOR_WINSOR = 'LOG_SYMMETRIC_1_PERCENT_WINSOR'
ESTIMATOR_E = 'EQUAL_GEOMETRIC_COHORT_NO_WINSOR'
ESTIMATORS = {METHOD_H: (ESTIMATOR_H, ESTIMATOR_EQUAL), METHOD_V2: (ESTIMATOR_WINSOR, ESTIMATOR_EQUAL),
              METHOD_E: (ESTIMATOR_E, ESTIMATOR_EQUAL)}
# Exact research H_TIER_G constants (gh-price-tier-guard native_cny_shadow_core).
CAP = Decimal('0.01')
MINIMUM_N = 100
TIER_EDGES = (Fraction(100), Fraction(1000))
TIERS = ('LT_100', 'GE_100_LT_1000', 'GE_1000')
WEIGHT_QUANTUM = Decimal('1e-30')
WINSOR_MINIMUM = 100
MIN_RATIO, MAX_RATIO = Fraction(1, 1000), Fraction(1000)
TOP_CONTRIBUTIONS = 5
_FIXED = Context(prec=DIGITS, rounding=ROUND_HALF_EVEN, Emin=-999999, Emax=999999)
_FIXED_TEXT = re.compile(r'-?(0|[1-9][0-9]*)(\.[0-9]*[1-9])?|-?0\.0*[1-9][0-9]*')


def _work():
    return localcontext(Context(prec=WORK_PRECISION, rounding=ROUND_HALF_EVEN, Emin=-999999, Emax=999999))


# --------------------------------------------------------------------------- fixed decimals

def fixed(value):
    """Decimal -> nearest 50-significant-digit Decimal, ROUND_HALF_EVEN (no exponent limits)."""
    m._require(isinstance(value, Decimal) and value.is_finite(), 'FIXED_DOMAIN')
    return _FIXED.plus(value)


def fixed_text(value):
    """Canonical plain text of a fixed value: no exponent, no trailing zeros, '0' for zero."""
    if value is None:
        return None
    value = fixed(value)
    if value.is_zero():
        return '0'
    return format(value.normalize(_FIXED), 'f')


def parse_fixed(text):
    if text is None:
        return None
    m._require(type(text) is str and len(text) <= 4096 and _FIXED_TEXT.fullmatch(text) is not None,
               'FIXED_LEXEME')
    value = Decimal(text)
    m._require(fixed_text(value) == text, 'FIXED_NOT_CANONICAL')
    return value


def decimal_of(value):
    """Exact Decimal of a terminating positive-or-zero rational (prices, quantized levels)."""
    m._require(isinstance(value, Fraction), 'DECIMAL_DOMAIN')
    p, q = value.numerator, value.denominator
    twos = fives = 0
    while q % 2 == 0:
        q //= 2; twos += 1
    while q % 5 == 0:
        q //= 5; fives += 1
    m._require(q == 1, 'DECIMAL_NOT_TERMINATING')
    k = max(twos, fives)
    return Decimal(str(p * (10 ** k // value.denominator)) + 'E' + str(-k))


def price_text(value):
    m._require(isinstance(value, Fraction) and value > 0, 'PRICE_DOMAIN')
    text = format(decimal_of(value), 'f')
    if '.' in text:
        text = text.rstrip('0').rstrip('.')
    return text


def parse_price(text):
    m._require(type(text) is str and re.fullmatch(r'(0|[1-9][0-9]*)(\.[0-9]*[1-9])?', text) is not None
               and len(text) <= 200, 'PRICE_LEXEME')
    value = Fraction(Decimal(text))
    m._require(value > 0 and price_text(value) == text, 'PRICE_LEXEME')
    return value


def level_of(anchor, cumulative_log):
    """Segment anchor (quantized rational) * exp(cumulative log) -> 50-digit quantized level."""
    m._require(isinstance(anchor, Fraction) and anchor > 0 and idx.quantize(anchor, DIGITS) == anchor,
               'LEVEL_ANCHOR')
    with _work():
        value = decimal_of(anchor) * cumulative_log.exp()
    return idx.quantize(Fraction(value), DIGITS)


def log_ratio(ratio):
    with _work():
        return (Decimal(ratio.numerator) / Decimal(ratio.denominator)).ln()


def _sum(values):
    with localcontext(Context(prec=90, rounding=ROUND_HALF_EVEN)):
        return sum(values, Decimal(0))


# --------------------------------------------------------------------------- H weights (exact port)

def tier(price):
    if price < TIER_EDGES[0]:
        return TIERS[0]
    if price < TIER_EDGES[1]:
        return TIERS[1]
    return TIERS[2]


def _quantized_allocation(scores, *, mass, cap):
    m._require(bool(scores) and mass > 0 and cap > 0, 'ALLOCATION_INPUT')
    m._require(len(scores) * cap >= mass, 'CAPACITY_INFEASIBLE')
    m._require(tuple(k for k, _ in scores) == tuple(sorted({k for k, _ in scores})), 'ALLOCATION_KEYS')
    m._require(all(s.is_finite() and s > 0 for _, s in scores), 'ALLOCATION_SCORE')
    active = [k for k, _ in scores]
    score_by_key = dict(scores)
    output = {k: Decimal(0) for k in active}
    remaining = mass
    with localcontext() as context:
        context.prec = 70
        context.rounding = ROUND_HALF_EVEN
        while active:
            score_sum = sum((score_by_key[k] for k in active), Decimal(0))
            trial = {k: remaining * score_by_key[k] / score_sum for k in active}
            hits = [k for k in active if trial[k] > cap]
            if not hits:
                for k in active:
                    output[k] = trial[k]
                break
            for k in hits:
                output[k] = cap
            hit_set = set(hits)
            active = [k for k in active if k not in hit_set]
            remaining = mass - _sum(output.values())
        output = {k: v.quantize(WEIGHT_QUANTUM) for k, v in output.items()}
    residual = mass - _sum(output.values())
    if residual:
        candidates = sorted(output, key=lambda k: (cap - output[k], k), reverse=True)
        m._require(bool(candidates) and output[candidates[0]] + residual > 0, 'ALLOCATION_RESIDUAL')
        m._require(output[candidates[0]] + residual <= cap, 'ALLOCATION_RESIDUAL_CAP')
        output[candidates[0]] += residual
    m._require(_sum(output.values()) == mass, 'ALLOCATION_SUM')
    m._require(all(Decimal(0) < v <= cap for v in output.values()), 'ALLOCATION_CAP')
    return dict(sorted(output.items()))


def h_weights(prices):
    """{unit: positive reference price Fraction} -> ({unit: weight Decimal} | None, reason | None).

    The whole construction runs at 70 digits, like the research cohort builder
    (its tier mass 1/len(groups) is quantized to 1e-30 from a 70-digit quotient).
    """
    if len(prices) < MINIMUM_N:
        return None, 'REFERENCE_MEMBER_COUNT_LT_100'
    with _work():
        return _h_weights(prices)


def _h_weights(prices):
    scores = tuple(sorted((k, decimal_of(v).sqrt()) for k, v in prices.items()))
    groups = {}
    for key, score in scores:
        groups.setdefault(tier(prices[key]), []).append((key, score))
    mass = (Decimal(1) / len(groups)).quantize(WEIGHT_QUANTUM)
    if any(len(group) * CAP < mass for group in groups.values()):
        return None, 'PRICE_TIER_CAPACITY_INFEASIBLE'
    output = {}
    names = sorted(groups)
    remaining = Decimal(1)
    for position, name in enumerate(names):
        tier_mass = remaining if position == len(names) - 1 else mass
        allocation = _quantized_allocation(tuple(groups[name]), mass=tier_mass, cap=CAP)
        output.update(allocation)
        remaining -= _sum(allocation.values())
    m._require(_sum(output.values()) == 1, 'TIER_ALLOCATION_SUM')
    return dict(sorted(output.items())), None


# --------------------------------------------------------------------------- cohort

def make_cohort(*, reference_date, reference_rows, reference_sha256, reference_kind, scopes, method=METHOD_H):
    """Month-end reference frame -> H (or E) cohort (reference prices only; H weights are derived).

    Members are the frame's units with a positive fused price. Units without a
    reference price (or added later) are not in the cohort until the next month.
    E uses the identical rule and prices; only the document's method differs.
    """
    m._require(method in COHORT_METHODS, 'COHORT_METHOD')
    m._hash(reference_sha256)
    ref = date.fromisoformat(reference_date)
    m._require(ref.isoformat() == reference_date and (ref + timedelta(days=1)).day == 1,
               'COHORT_REFERENCE_NOT_MONTH_END')
    m._require(reference_kind in ('ARCHIVE_LAST_OBSERVED_UTC_DAY', 'CONTEMPORANEOUS_EOD'), 'COHORT_REFERENCE_KIND')
    prices = {}
    for unit, row in sorted(reference_rows.items()):
        m._require(unit in scopes, 'COHORT_UNIT_SCOPE')
        if row['price'] is not None:
            m._require(row['price'] > 0, 'COHORT_PRICE')
            prices[unit] = price_text(row['price'])
    return m._seal({'schema': COHORT, 'method': method, 'reference_date': reference_date,
        'reference_kind': reference_kind, 'reference_sha256': reference_sha256,
        'reference_frame_member_count': len(reference_rows), 'prices': prices,
        'rule': 'PREVIOUS_CALENDAR_MONTH_END_POSITIVE_FUSED_PRICE_NEW_MEMBERS_DEFERRED'})


def check_cohort(cohort, scopes, method=METHOD_H):
    m._require(method in COHORT_METHODS, 'COHORT_METHOD')
    m._require(type(cohort) is dict and set(cohort) == {'schema', 'method', 'reference_date', 'reference_kind',
        'reference_sha256', 'reference_frame_member_count', 'prices', 'rule', 'document_sha256'}
        and cohort['schema'] == COHORT and cohort['method'] == method, 'COHORT_FIELDS')
    idx._checked(cohort, cohort['document_sha256'], COHORT)
    ref = date.fromisoformat(cohort['reference_date'])
    m._require(ref.isoformat() == cohort['reference_date'] and (ref + timedelta(days=1)).day == 1
               and cohort['reference_kind'] in ('ARCHIVE_LAST_OBSERVED_UTC_DAY', 'CONTEMPORANEOUS_EOD')
               and cohort['rule'] == 'PREVIOUS_CALENDAR_MONTH_END_POSITIVE_FUSED_PRICE_NEW_MEMBERS_DEFERRED',
               'COHORT_REFERENCE')
    m._hash(cohort['reference_sha256'])
    prices = cohort['prices']
    m._require(type(prices) is dict and list(prices) == sorted(prices)
               and type(cohort['reference_frame_member_count']) is int
               and len(prices) <= cohort['reference_frame_member_count'], 'COHORT_PRICES')
    out = {}
    for unit, text in prices.items():
        m._require(unit in scopes, 'COHORT_UNIT_SCOPE')
        out[unit] = parse_price(text)
    return ref, out


class WeightCache:
    """One calculation's per-(cohort, scope) H weights; replaced when the cohort changes."""
    def __init__(self):
        self.cohort = None
        self.values = {}

    def get(self, cohort_sha256, scope, compute):
        if self.cohort != cohort_sha256:
            self.cohort, self.values = cohort_sha256, {}
        if scope not in self.values:
            self.values[scope] = compute()
        return self.values[scope]


# --------------------------------------------------------------------------- calculation

def member_pairs(right, left, resource_check=None):
    """Same admission/grades as calculate_points; the value is the exact ratio (log is lazy)."""
    check = resource_check if resource_check is not None else lambda: None
    pairs = {}
    for ordinal, (unit, new) in enumerate(sorted(right.items())):
        if ordinal % 256 == 0:
            check()
        old = None if left is None else left.get(unit)
        grade, ratio, rejected = 'E', None, False
        if old is not None and old['price'] is not None and new['price'] is not None:
            a, b = set(old['sources']), set(new['sources'])
            grade = ('A' if a == b else 'B') if len(a) >= 2 and len(b) >= 2 else ('C' if a & b else 'D')
            ratio = new['price'] / old['price']
            rejected = not MIN_RATIO <= ratio <= MAX_RATIO
        pairs[unit] = {'grade': grade, 'ratio': ratio, 'rejected': rejected, 'old': old, 'new': new}
    return pairs


def _log(pairs, unit):
    pair = pairs[unit]
    if 'log' not in pair:
        pair['log'] = log_ratio(pair['ratio'])
    return pair['log']


def _estimate(method, units, admitted, pairs, cohort_prices, cohort_sha256, scope, weight_cache):
    """-> (estimator, period log Decimal | None, disclosure dict)."""
    if method == METHOD_E:
        return _estimate_e(units, admitted, pairs, cohort_prices)
    disclosure = {'estimator_member_count': 0, 'winsor_adjusted_member_count': 0, 'cohort': None,
                  'top_log_contributions': []}
    if method == METHOD_H:
        scope_prices = None if cohort_prices is None else {u: cohort_prices[u] for u in units if u in cohort_prices}
        if scope_prices is None:
            weights, reason = None, 'NO_MONTH_END_REFERENCE_BEFORE_FIRST_COHORT'
        else:
            compute = lambda: h_weights(scope_prices)
            weights, reason = (weight_cache.get(cohort_sha256, scope, compute) if weight_cache is not None
                               else compute())
        if weights is not None:
            population = [u for u in units if u in weights and u in admitted]
            counts = Counter(tier(scope_prices[u]) for u in scope_prices)
            with _work():
                mass = _sum(weights[u] for u in population)
                log = None
                top = []
                if population:
                    total = _sum(weights[u] * _log(pairs, u) for u in population)
                    log = total / mass
                    top = sorted(((weights[u] / mass * _log(pairs, u), u) for u in population),
                                 key=lambda item: (-abs(item[0]), item[1]))[:TOP_CONTRIBUTIONS]
            disclosure.update(estimator_member_count=len(population), cohort={
                'status': 'AVAILABLE', 'reason': None, 'member_count': len(scope_prices),
                'tier_member_counts': {t: counts[t] for t in TIERS},
                'admitted_member_count': len(population),
                'deferred_member_count': sum(u not in scope_prices for u in units),
                'retained_initial_weight_fixed': fixed_text(mass)},
                top_log_contributions=[{'analysis_unit_id': u, 'log_contribution_fixed': fixed_text(c)}
                                       for c, u in top])
            return (ESTIMATOR_H if population else None), log, disclosure
        disclosure['cohort'] = {'status': 'INAPPLICABLE', 'reason': reason,
            'member_count': 0 if scope_prices is None else len(scope_prices),
            'tier_member_counts': None, 'admitted_member_count': 0,
            'deferred_member_count': sum(scope_prices is None or u not in scope_prices for u in units),
            'retained_initial_weight_fixed': None}
    population = sorted(admitted)
    if not population:
        return None, None, disclosure
    with _work():
        logs = {u: _log(pairs, u) for u in population}
        adjusted = dict(logs)
        estimator = ESTIMATOR_EQUAL
        if method == METHOD_V2 and len(population) >= WINSOR_MINIMUM:
            ordered = sorted(logs.values())
            tail = len(ordered) // 100
            lower, upper = ordered[tail], ordered[-tail - 1]
            adjusted = {u: min(max(v, lower), upper) for u, v in logs.items()}
            estimator = ESTIMATOR_WINSOR
        log = _sum(adjusted.values()) / len(adjusted)
        top = sorted(((v / len(adjusted), u) for u, v in adjusted.items()),
                     key=lambda item: (-abs(item[0]), item[1]))[:TOP_CONTRIBUTIONS]
    disclosure.update(estimator_member_count=len(population),
        winsor_adjusted_member_count=sum(adjusted[u] != logs[u] for u in population),
        top_log_contributions=[{'analysis_unit_id': u, 'log_contribution_fixed': fixed_text(c)} for c, u in top])
    return estimator, log, disclosure


def _estimate_e(units, admitted, pairs, cohort_prices):
    """METHOD_E: equal mean of logs over cohort & admitted (all admitted before the first
    cohort); no winsor, no guard. -> (estimator, period log Decimal | None, disclosure)."""
    if cohort_prices is None:
        population = sorted(admitted)
        cohort = {'status': 'INAPPLICABLE', 'reason': 'NO_MONTH_END_REFERENCE_BEFORE_FIRST_COHORT',
                  'member_count': 0, 'tier_member_counts': None, 'admitted_member_count': 0,
                  'deferred_member_count': len(units), 'retained_initial_weight_fixed': None}
        estimator = ESTIMATOR_EQUAL
    else:
        held = [u for u in units if u in cohort_prices]
        population = [u for u in held if u in admitted]
        cohort = {'status': 'AVAILABLE', 'reason': None, 'member_count': len(held), 'tier_member_counts': None,
                  'admitted_member_count': len(population), 'deferred_member_count': len(units) - len(held),
                  'retained_initial_weight_fixed': None}
        estimator = ESTIMATOR_E
    disclosure = {'estimator_member_count': len(population), 'winsor_adjusted_member_count': 0,
                  'cohort': cohort, 'top_log_contributions': []}
    if not population:
        return None, None, disclosure
    with _work():
        log = _sum(_log(pairs, u) for u in population) / len(population)
        top = sorted(((_log(pairs, u) / len(population), u) for u in population),
                     key=lambda item: (-abs(item[0]), item[1]))[:TOP_CONTRIBUTIONS]
    disclosure['top_log_contributions'] = [{'analysis_unit_id': u, 'log_contribution_fixed': fixed_text(c)}
                                           for c, u in top]
    return estimator, log, disclosure


def _prior_state(last, scope, check):
    """Decode and cross-check one prior point's fixed chain state."""
    check()
    level = idx.from_exact(last['index_exact'])
    carried = idx.from_exact(last['carried_scale_exact'])
    anchor = idx.from_exact(last['segment_anchor_exact'])
    cumulative = parse_fixed(last['cumulative_log_fixed'])
    m._require(type(last['segment_number']) is int and last['segment_number'] >= 0, 'PRIOR_SEGMENT')
    m._require(carried is not None and carried > 0 and idx.quantize(carried, DIGITS) == carried,
               'PRIOR_CARRIED_SCALE')
    if level is None:
        m._require(anchor is None and cumulative is None, 'PRIOR_CHAIN_STATE')
    else:
        m._require(level == carried and anchor is not None and anchor > 0 and cumulative is not None
                   and level_of(anchor, cumulative) == level, 'PRIOR_CHAIN_STATE')
    check()
    return level, carried, anchor, cumulative


def calculate_points(*, method, right, left, scopes, anchors, prior_points, linked, cohort=None,
                     pairs=None, weight_cache=None, resource_check=None):
    """Pure arithmetic for validated frames; grants no admission (same contract as V1).

    cohort is the validated cohort document of the same method (METHOD_H, METHOD_E)
    or None (V2, or no month-end reference yet). anchors are quantized rationals
    (exact encoding).
    """
    check = resource_check if resource_check is not None else lambda: None
    check()
    m._require(method in METHODS, 'GEOMETRIC_METHOD')
    m._require(method in COHORT_METHODS or cohort is None, 'COHORT_ONLY_FOR_H')
    cohort_prices = cohort_sha256 = None
    if cohort is not None:
        _, cohort_prices = check_cohort(cohort, scopes, method)
        cohort_sha256 = cohort['document_sha256']
    pairs = member_pairs(right, left, check) if pairs is None else pairs
    output = []
    for scope in sorted(anchors):
        check()
        units = sorted(u for u in scopes if scope == 'ALL' or scope in scopes[u])
        rows = {u: pairs[u] for u in units}
        paired = {u: r for u, r in rows.items() if r['ratio'] is not None}
        admitted = {u for u, r in paired.items() if not r['rejected']}
        estimator, log, disclosure = _estimate(method, units, admitted, pairs, cohort_prices,
                                               cohort_sha256, scope, weight_cache)
        check()
        prices = [r['new']['price'] for r in rows.values() if r['new']['price'] is not None]
        price_quality = idx.quality(len(prices), len(rows))
        return_quality = idx.quality(disclosure['estimator_member_count'], len(rows))
        last = prior_points.get(scope)
        if last is None:
            carried = idx.from_exact(anchors[scope])
            segment, last_level, last_anchor, last_cumulative = 0, None, None, None
        else:
            last_level, carried, last_anchor, last_cumulative = _prior_state(last, scope, check)
            segment = last['segment_number']
        period_log = None if log is None else fixed(log)
        period = anchor = cumulative = None
        if price_quality == 'UNAVAILABLE':
            level, state = None, STATE_BELOW
        elif linked and last_level is not None and return_quality != 'UNAVAILABLE' and period_log is not None:
            with _work():
                cumulative = fixed(last_cumulative + period_log)
                period = fixed(period_log.exp() - 1)
            anchor = last_anchor
            level = level_of(anchor, cumulative)
            state = STATE_ADJACENT
        else:
            level, segment, anchor, cumulative = carried, segment + 1, carried, Decimal(0)
            state = STATE_NEW
        if level is not None:
            carried = level
        grades = Counter(rows[u]['grade'] for u in admitted)
        grade_counts = {g: grades[g] for g in 'ABCD'}
        grade_counts['E'] = len(rows) - len(paired)
        source_pairs = Counter(
            f"{sum(idx.MASKS[s] for s in r['old']['sources'])}->{sum(idx.MASKS[s] for s in r['new']['sources'])}"
            for r in paired.values())
        d_share = Fraction(grades['D'], len(admitted)) if admitted else None
        period_fraction = None if period is None else Fraction(period)
        output.append({'scope_code': scope, 'expected_member_count': len(rows),
            'paired_member_count': len(paired), 'qualified_member_count': len(admitted),
            'rejected_return_domain_count': len(paired) - len(admitted),
            'rejected_members': [u for u in paired if paired[u]['rejected']],
            'grade_counts': grade_counts, 'source_pair_counts': dict(sorted(source_pairs.items())),
            'grade_d_share_exact': idx.exact(d_share),
            'warnings': ['GRADE_D_SHARE_ABOVE_WARNING_LEVEL'] if d_share is not None and d_share > Fraction(1, 4) else [],
            'absolute_price_qualified_member_count': len(prices),
            'ask_sum_cny_exact': idx.exact(sum(prices, Fraction())) if prices else None,
            'ask_median_cny_exact': idx.exact(idx._median(prices)),
            'absolute_price_semantic': 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE',
            'estimator_log_fixed': fixed_text(period_log),
            'period_log_fixed': None if period is None else fixed_text(period_log),
            'period_return_fixed': fixed_text(period),
            'period_return_display': idx.display(period_fraction),
            'index_exact': idx.exact(level), 'index_display': idx.display(level, 8),
            'carried_scale_exact': idx.exact(carried),
            'segment_anchor_exact': idx.exact(anchor if level is not None else None),
            'cumulative_log_fixed': fixed_text(cumulative) if level is not None else None,
            'segment_number': segment,
            'price_quality': price_quality, 'return_quality': return_quality, 'state': state,
            'effective_estimator': estimator,
            **disclosure})
        check()
    return output


# --------------------------------------------------------------------------- spec and day

def make_spec(*, method, identities, membership_sha256, scopes, scopes_sha256, anchors, anchors_sha256,
              implementation_commit, scale_origin, initial_cohort=None):
    """Freeze a geometric series: never splices into the V1 robust-equal chain.

    anchors are the quantized 50-digit first-day levels from scale_origin (the
    recomputed archive terminal level of the SAME method times the same-method
    archive -> first measured day bridge factor). initial_cohort is the H (E)
    cohort of the first measured day's month (None for V2).
    """
    m._require(method in METHODS, 'GEOMETRIC_METHOD')
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
    m._require(isinstance(anchors, dict) and set(anchors) == scope_set, 'ANCHOR_SCOPES')
    for value in anchors.values():
        scale = idx.from_exact(value)
        m._require(scale is not None and scale > 0 and idx.quantize(scale, DIGITS) == scale, 'ANCHOR_VALUES')
    fields = {'schema', 'method', 'archive_calculation_revision_sha256', 'archive_terminal_day_sha256',
              'bridge_sha256', 'membership_sha256', 'scopes_sha256', 'anchors_sha256', 'source_interval',
              'source_bucket_date', 'first_measured_day', 'source_calculation_as_of', 'rule'}
    m._require(type(scale_origin) is dict and set(scale_origin) == fields
               and scale_origin['schema'] == SCALE_ORIGIN and scale_origin['method'] == method
               and scale_origin['source_interval'] == '1d'
               and scale_origin['membership_sha256'] == membership_sha256
               and scale_origin['scopes_sha256'] == scopes_sha256
               and scale_origin['anchors_sha256'] == anchors_sha256
               and scale_origin['rule'] == 'SAME_METHOD_ARCHIVE_TERMINAL_LEVEL_TIMES_SAME_METHOD_BRIDGE_FACTOR',
               'SCALE_ORIGIN_CONTRACT')
    for key in fields:
        if key.endswith('_sha256'):
            m._hash(scale_origin[key])
    old = date.fromisoformat(scale_origin['source_bucket_date'])
    first = date.fromisoformat(scale_origin['first_measured_day'])
    m._require(old.isoformat() == scale_origin['source_bucket_date']
               and first.isoformat() == scale_origin['first_measured_day']
               and first == old + timedelta(days=1), 'SCALE_ORIGIN_DATES')
    m._require(n.timestamp(scale_origin['source_calculation_as_of']).date() > old, 'SCALE_ORIGIN_KNOWLEDGE_CLOCK')
    if method in COHORT_METHODS:
        reference, _ = check_cohort(initial_cohort, scopes, method)
        m._require(reference == first.replace(day=1) - timedelta(days=1), 'INITIAL_COHORT_MONTH')
    else:
        m._require(initial_cohort is None, 'V2_HAS_NO_COHORT')
    m._require(isinstance(implementation_commit, str)
               and re.fullmatch('[0-9a-f]{40}', implementation_commit), 'IMPLEMENTATION_COMMIT')
    rules = ({'weight_rule': 'PRICE_TIER_BALANCED_H_MONTHLY_PREVIOUS_MONTH_END_REFERENCE_SQRT_PRICE_CAP_1_PERCENT',
              'small_scope_rule': 'EQUAL_GEOMETRIC_NO_WINSOR_WHEN_H_INAPPLICABLE'} if method == METHOD_H else
             {'weight_rule': 'EQUAL_MONTHLY_PREVIOUS_MONTH_END_COHORT_ADMITTED_MEMBERS_NO_WINSOR',
              'start_rule': 'EQUAL_GEOMETRIC_ALL_ADMITTED_UNTIL_FIRST_MONTH_END_COHORT'} if method == METHOD_E else
             {'weight_rule': 'EQUAL_ADMITTED_MEMBERS',
              'robust_rule': 'LOG_SYMMETRIC_1_PERCENT_WINSOR_MINIMUM_ONE_HUNDRED'})
    return m._seal({'schema': SPEC, 'method': method, 'basis': m.BASIS, 'eod_policy': m.POLICY,
        'membership_sha256': membership_sha256, 'scopes_sha256': scopes_sha256,
        'anchors_sha256': anchors_sha256, 'implementation_commit': implementation_commit,
        'return_rule': 'ADJACENT_COMPLETE_UTC_DAY_LOG_RATIO_ALL_POSITIVE_PAIRS_WITH_A_TO_D_DISCLOSURE',
        'fusion_rule': 'ONE_SOURCE_VALUE_TWO_SOURCE_MEAN_THREE_SOURCE_MEDIAN',
        'ratio_domain': 'ONE_THOUSANDTH_TO_ONE_THOUSAND_INCLUSIVE', **rules,
        'gap_rule': 'NEW_SEGMENT_NO_FILL_NO_CROSS_GAP_RETURN',
        'chain_rule': 'LEVEL_EQUALS_SEGMENT_ANCHOR_TIMES_EXP_CUMULATIVE_LOG',
        'numeric_rule': NUMERIC_RULE, 'significant_digits': DIGITS, 'rounding': 'ROUND_HALF_EVEN',
        'anchor_encoding': 'QUANTIZED_EXACT_RATIONAL_SCALE_ONLY_FROM_SCALE_ORIGIN',
        'scale_origin': scale_origin, 'initial_cohort': initial_cohort, 'formal_state_eligible': False})


def is_geometric_spec(spec):
    return type(spec) is dict and spec.get('schema') == SPEC


def build_day(*, spec, spec_sha256, identities, membership_sha256, scopes, anchors,
              current, current_sha256, measured_at, previous=None, previous_sha256=None,
              prior=None, prior_sha256=None, resource_check=None):
    """Complete typed CNY EOD -> geometric scope calculations (same envelope as V1 build_day).

    The H cohort: on day 1 of a month with the month-end frame as `previous`,
    a new cohort is built from it; otherwise the prior day's cohort (or the
    spec's initial cohort on the first measured day) is carried and disclosed.
    """
    check = resource_check if resource_check is not None else lambda: None
    check()
    m._require(is_geometric_spec(spec), 'SPEC_SCHEMA')
    idx._checked(spec, spec_sha256, SPEC)
    expected = make_spec(method=spec['method'], identities=identities, membership_sha256=membership_sha256,
        scopes=scopes, scopes_sha256=spec['scopes_sha256'], anchors=anchors,
        anchors_sha256=spec['anchors_sha256'], implementation_commit=spec['implementation_commit'],
        scale_origin=spec.get('scale_origin'), initial_cohort=spec.get('initial_cohort'))
    m._require(spec == expected, 'SPEC_RULE_DRIFT')
    method = spec['method']
    now = n.timestamp(measured_at)
    m._require(now >= n.timestamp(spec['scale_origin']['source_calculation_as_of']), 'SCALE_KNOWLEDGE_CLOCK')
    day, right = idx._frame(current, current_sha256, identities, membership_sha256, now)
    check()
    first = date.fromisoformat(spec['scale_origin']['first_measured_day'])
    m._require(day >= first, 'BEFORE_SCALE_EPOCH')
    if day == first:
        m._require(previous is None and previous_sha256 is None and prior is None and prior_sha256 is None,
                   'SCALE_FIRST_DAY_NO_BRIDGE')
    else:
        m._require(prior is not None, 'SCALE_EPOCH_STATE_REQUIRED')
    left = None
    if previous is not None:
        prev_day, left = idx._frame(previous, previous_sha256, identities, membership_sha256, now)
        check()
        m._require(prev_day + timedelta(days=1) == day, 'NON_ADJACENT_FRAMES')
    else:
        m._require(previous_sha256 is None, 'PREVIOUS_PIN_WITHOUT_FRAME')
    prior_points = {}
    if prior is not None:
        check()
        idx._checked(prior, prior_sha256, POINTS)
        m._require(prior['spec_sha256'] == spec_sha256 and prior['basis'] == m.BASIS
                   and prior['method'] == method and n.timestamp(prior['measured_at']) <= now
                   and first <= date.fromisoformat(prior['bucket_date']) < day, 'PRIOR_CONTEXT')
        for point in prior['points']:
            code = point['scope_code']
            m._require(code not in prior_points and code in anchors, 'PRIOR_SCOPES')
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
    cohort = carried_cohort = None
    if method in COHORT_METHODS:
        month_end = day.replace(day=1) - timedelta(days=1)
        if day.day == 1 and left is not None:
            cohort = make_cohort(reference_date=month_end.isoformat(), reference_rows=left,
                reference_sha256=previous_sha256, reference_kind='CONTEMPORANEOUS_EOD', scopes=scopes,
                method=method)
        else:
            cohort = prior['cohort'] if prior is not None else spec['initial_cohort']
        reference, _ = check_cohort(cohort, scopes, method)
        m._require(reference < day, 'COHORT_FROM_FUTURE')
        carried_cohort = reference != month_end
    output = calculate_points(method=method, right=right, left=left, scopes=scopes, anchors=anchors,
                              prior_points=prior_points, linked=linked, cohort=cohort, resource_check=check)
    check()
    return m._seal({'schema': POINTS, 'method': method, 'basis': m.BASIS,
        'currency': 'CNY', 'fx': None, 'spec_sha256': spec_sha256, 'bucket_date': day.isoformat(),
        'current_eod_sha256': current_sha256, 'previous_eod_sha256': previous_sha256,
        'prior_day_sha256': prior_sha256, 'measured_at': measured_at,
        'numeric_rule': NUMERIC_RULE, 'cohort': cohort,
        'cohort_reference_carried': carried_cohort,
        'points': output, 'formal_state_eligible': False})


def frame_digest(rows):
    """Canonical digest of an in-memory frame {unit: {'price', 'sources'}} (archive references)."""
    return sha256_hex(canonical_json_bytes([[u, idx.exact(r['price']), list(r['sources'])]
                                            for u, r in sorted(rows.items())]))
