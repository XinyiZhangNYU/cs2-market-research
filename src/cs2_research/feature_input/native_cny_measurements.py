"""Pure CNY successor measurement boundary, not a production publication writer.

Consumes hash-pinned native latest observations. Does not emit legacy USD facts,
coerce to integer cents, perform FX, or confer rights/install eligibility.
The EOD preserves exact decimal medians, with a distinct successor policy rather
than falsely claiming V3's scale-8 rounding bytes. Historical USD cannot mix.
"""
from collections import Counter, defaultdict
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, InvalidOperation
from fractions import Fraction
import re

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.ingestion import native_cny as n
from cs2_research.ingestion.native_cny_latest import REQUEST, SCHEMA, decode_wire, normalize_latest

BASIS = 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1'
POLICY = 'NATIVE_CNY_LAST_HOUR_9_OF_12_EXACT_DECIMAL_MEDIAN_V1'
SCALE = 100_000_000


def _require(condition, code):
    if not condition:
        raise ValueError(code)


def _hash(value):
    _require(isinstance(value, str) and re.fullmatch('[0-9a-f]{64}', value), 'HASH')
    return value


def _seal(document):
    return {**document, 'document_sha256': sha256_hex(canonical_json_bytes(document))}


def _verify(document, digest):
    _hash(digest)
    _require(sha256_hex(canonical_json_bytes(document)) == digest, 'INPUT_HASH')


def _price(text):
    if text is None:
        return None
    _require(isinstance(text, str) and len(text) <= 200, 'PRICE_TEXT')
    try:
        value = Decimal(text)
    except InvalidOperation:
        raise ValueError('PRICE_TEXT') from None
    _require(value.is_finite() and len(value.as_tuple().digits) <= 50
             and (not value or abs(value.adjusted()) <= 50), 'PRICE_RANGE')
    return Fraction(value)


def _text(value):
    """Exact finite decimal serialization, independent of Decimal context."""
    if value is None:
        return None
    denominator=value.denominator
    powers=[]
    for prime in (2,5):
        count=0
        while denominator % prime == 0:
            count+=1;denominator//=prime
        powers.append(count)
    _require(denominator == 1, 'NONTERMINATING_PRICE')
    scale=max(powers)
    integer=abs(value.numerator)*2**(scale-powers[0])*5**(scale-powers[1])
    digits=str(integer).rjust(scale+1,'0')
    text=digits if not scale else (digits[:-scale]+'.'+digits[-scale:]).rstrip('0').rstrip('.')
    return ('-' if value < 0 else '')+text


def _members(identities, membership_sha256):
    _verify(identities, membership_sha256)
    _require(set(identities) == {'members'} and isinstance(identities['members'], list)
             and bool(identities['members']), 'MEMBERSHIP')
    members, units = {}, set()
    for member in identities['members']:
        _require(set(member) == {'analysis_unit_id', 'market_hash_name', 'variant_version',
                                'identity_sha256', 'source_ids'}, 'MEMBER_FIELDS')
        _hash(member['identity_sha256'])
        _require(all(isinstance(member[k], str) and member[k] for k in
                     ('analysis_unit_id', 'market_hash_name')), 'MEMBER_ID')
        _require(member['variant_version'] is None or isinstance(member['variant_version'], str)
                 and bool(member['variant_version']), 'MEMBER_VARIANT')
        _require(isinstance(member['source_ids'], list)
                 and all(isinstance(s,str) for s in member['source_ids'])
                 and len(set(member['source_ids'])) == len(member['source_ids'])
                 and set(member['source_ids']) <= set(n.SOURCES), 'MEMBER_SOURCES')
        key = (member['market_hash_name'], member['variant_version'])
        _require(key not in members and member['analysis_unit_id'] not in units, 'MEMBER_DUPLICATE')
        members[key] = member; units.add(member['analysis_unit_id'])
    return members


def project_slot(rows, *, slot_at, finished_at, wire_sha256, catalog_sha256,
                 identities, membership_sha256):
    """Bind every input before selecting known base/explicit-version identities.

    Internal helper: a row self-hash is NOT proof it came from the pinned wire.
    Runtime callers must use project_capture, which rederives from pinned bytes.
    identities is an externally authenticated frozen mapping, not an inferred
    universe. Its canonical document hash must equal membership_sha256. Raw
    missing rows are retained as diagnostic non-measurements, not carried prices.
    """
    _hash(wire_sha256); _hash(catalog_sha256)
    members = _members(identities, membership_sha256)
    slot, finished = n.timestamp(slot_at), n.timestamp(finished_at)
    _require(slot.minute % 5 == slot.second == slot.microsecond == 0, 'SLOT_ALIGNMENT')
    _require(slot <= finished < slot + timedelta(minutes=5), 'SLOT_CLOCK')
    request_sha256 = n.digest(n.canonical_request(REQUEST))
    seen, facts, counts = set(), [], Counter()
    for row in rows:
        _require(isinstance(row, dict) and 'record_hash' in row, 'ROW_SHAPE')
        _hash(row['record_hash'])
        _require(n.digest(n.canonical_request({k:v for k,v in row.items() if k != 'record_hash'}))
                 == row['record_hash'], 'INPUT_HASH')
        _require(row.get('schema') == SCHEMA and row.get('currency') == 'CNY'
                 and row.get('currency_unit') == 'CNY_MAJOR'
                 and row.get('basis') == 'VENDOR_DECLARED_NATIVE_CNY'
                 and row.get('fx_applied') is False and row.get('fx_vintage') is None
                 and row.get('observation_kind') == 'QUOTE', 'NATIVE_BASIS')
        _require(row.get('route') == REQUEST['route']
                 and row.get('request_sha256') == request_sha256
                 and row.get('wire_sha256') == wire_sha256
                 and row.get('catalog_sha256') == catalog_sha256, 'ROW_BINDING')
        _require(n.timestamp(row['slot_at']) == slot
                 and n.timestamp(row['retrieved_at']) == finished
                 and slot <= n.timestamp(row['requested_at']) <= finished, 'ROW_CLOCK')
        _require(n.precise_timestamp_key(row['response_time']) <= n.precise_timestamp_key(finished_at),
                 'RESPONSE_CLOCK')
        _require(row['source'] in n.SOURCES, 'SOURCE')
        variant = row.get('variant_version')
        _require((row.get('variant_key') == '' and variant is None)
                 or bool(row.get('variant_key')) and isinstance(variant, str) and bool(variant),
                 'VARIANT_IDENTITY')
        key = (row['market_hash_name'], variant, row['source'])
        _require(key not in seen, 'DUPLICATE_SOURCE_ROW'); seen.add(key)
        ask, bid = _price(row['ask_text']), _price(row['bid_text'])
        # Validate clocks even for a row outside membership; don't leak good prefix.
        updated = None if row['observed_at'] is None else n.timestamp(row['observed_at'])
        collected = None if row['collected_at'] is None else n.timestamp(row['collected_at'])
        observed = next((v for v in (updated, collected) if v is not None and v <= finished), None)
        member = members.get(key[:2])
        if member is None or row['source'] not in member['source_ids']:
            counts['OUTSIDE_FROZEN_MEMBERSHIP'] += 1; continue
        # Same ask-only admission as V3. Bid/listing diagnostics do not silently
        # introduce a new price or weighting method.
        state, price = 'USABLE_SOURCE_MEASUREMENT', None
        if ask is None or ask <= 0:
            state = 'INVALID_OR_MISSING_ASK'
        elif observed is None:
            state = 'MISSING_SOURCE_CLOCK'
        elif finished - observed > timedelta(minutes=15):
            state = 'STALE_QUOTE'
        else:
            price = _text(ask)
        counts[state] += 1
        facts.append({'analysis_unit_id':member['analysis_unit_id'],
                      'identity_sha256':member['identity_sha256'], 'source':row['source'],
                      'source_record_sha256':row['record_hash'], 'ask_cny_major':price,
                      'legacy_scale8_compatible':ask is None or
                          (ask*SCALE).denominator == 1 and ask < 10**30,
                      'raw_ask_cny_major':row['ask_text'], 'state':state,
                      'source_observed_at':None if observed is None else observed.isoformat(),
                      'flags':list(row['flags']),
                      'crossed_bid_diagnostic':ask is not None and bid is not None and bid > ask})
    expected = {(m['analysis_unit_id'], s) for m in members.values() for s in m['source_ids']}
    supplied = {(f['analysis_unit_id'], f['source']) for f in facts}
    return _seal({'schema':'native-cny-slot-measurements/1','basis':BASIS,'currency':'CNY',
        'unit':'CNY_MAJOR_EXACT','fx':None,'slot_at':slot.isoformat(),
        'available_at':finished.isoformat(),'membership_sha256':membership_sha256,
        'wire_sha256':wire_sha256,'catalog_sha256':catalog_sha256,
        'facts':sorted(facts,key=lambda f:(f['analysis_unit_id'],f['source'])),
        'missing_member_sources':[list(k) for k in sorted(expected-supplied)],
        'counts':dict(counts),'formal_state_eligible':False})


def validate_capture_clock(receipt, intent):
    """Bind immutable claim and actual-send clocks without rewriting either.

    Old receipts have no claimed_at and retain their exact requested-at binding.
    Presence of claimed_at opts into the separated-clock contract; a null, empty
    or otherwise invalid field is never treated as a legacy receipt. This pure
    check conveys no raw-data, source, purpose or publication qualification.
    """
    _require(receipt['slot_at'] == intent['slot_at'], 'CAPTURE_BINDING')
    requested = n.timestamp(receipt['requested_at'])
    finished = n.timestamp(receipt['finished_at'])
    _require(requested <= finished, 'CAPTURE_CLOCK')
    if 'claimed_at' not in receipt:
        _require(receipt['requested_at'] == intent['requested_at'], 'CAPTURE_BINDING')
        return
    _require(receipt['claimed_at'] == intent['requested_at'], 'CAPTURE_CLAIM_BINDING')
    slot = n.timestamp(intent['slot_at'])
    claimed = n.timestamp(receipt['claimed_at'])
    _require(type(receipt.get('request_attempts')) is int
             and receipt['request_attempts'] == 1, 'CAPTURE_CLAIM_ATTEMPTS')
    _require(slot <= claimed <= requested < slot + timedelta(minutes=1), 'CAPTURE_SEND_WINDOW')


def verified_capture_rows(*, wire, receipt_bytes, receipt_sha256, intent_bytes, request_bytes,
                          catalog_bytes, catalog_sha256):
    """No files/network. Re-derive rows, never trust a supplied normalized cache.

    receipt_sha256/catalog_sha256/membership_sha256 must come from the separately
    approved input manifest. Checking them does not create that authorization.
    Code/source/rights and installation binding remain the outer runner's duty.
    """
    _require(n.digest(receipt_bytes) == _hash(receipt_sha256), 'RECEIPT_PIN')
    _require(n.digest(catalog_bytes) == _hash(catalog_sha256), 'CATALOG_PIN')
    receipt=n.control_loads(receipt_bytes)
    _require(receipt.get('schema')=='native-cny-latest-preservation-receipt/1'
             and receipt.get('state')=='PRESERVED_NOT_QUALIFIED'
             and receipt.get('http_status')==200 and receipt.get('request_attempts')==1,
             'CAPTURE_NOT_SUCCESSFUL')
    _require(n.digest(intent_bytes)==receipt['intent_sha256'], 'INTENT_PIN')
    intent=n.control_loads(intent_bytes)
    _require(intent.get('schema')=='native-cny-latest-preservation-intent/1'
             and intent.get('max_requests')==1 and intent.get('retry_allowed') is False,
             'INTENT_CONTRACT')
    _require(n.digest(request_bytes)==receipt['request_sha256']==intent['request_sha256'],
             'REQUEST_PIN')
    request=n.control_loads(request_bytes)
    _require(request==REQUEST, 'CAPTURE_BINDING')
    validate_capture_clock(receipt, intent)
    _require(n.digest(wire)==receipt['wire_sha256'], 'WIRE_PIN')
    decoded=decode_wire(wire,receipt['headers'].get('content-encoding','identity'))
    _require(n.digest(decoded)==receipt['decoded_sha256'], 'DECODED_PIN')
    catalog=n.control_loads(catalog_bytes)
    targets=[r['localized_name']['en'] for r in catalog['records']]
    rows,_=normalize_latest(decoded,request=request,wire_sha256=receipt['wire_sha256'],
        slot_at=receipt['slot_at'],requested_at=receipt['requested_at'],
        finished_at=receipt['finished_at'],target_names=targets,catalog_sha256=catalog_sha256)
    return rows, receipt


def project_capture(*, wire, receipt_bytes, receipt_sha256, intent_bytes, request_bytes,
                    catalog_bytes, catalog_sha256, identities, membership_sha256):
    rows, receipt = verified_capture_rows(wire=wire, receipt_bytes=receipt_bytes,
        receipt_sha256=receipt_sha256, intent_bytes=intent_bytes, request_bytes=request_bytes,
        catalog_bytes=catalog_bytes, catalog_sha256=catalog_sha256)
    result=project_slot(rows,slot_at=receipt['slot_at'],finished_at=receipt['finished_at'],
        wire_sha256=receipt['wire_sha256'],catalog_sha256=catalog_sha256,
        identities=identities,membership_sha256=membership_sha256)
    body={k:v for k,v in result.items() if k!='document_sha256'}
    body['receipt_sha256']=receipt_sha256
    body['intent_sha256']=receipt['intent_sha256']
    return _seal(body)


def reduce_eod(projections, *, bucket_date, reduced_at, identities, membership_sha256):
    """Separate successor EOD. No prospective/PIT/rights or installation claim."""
    membership = _members(identities, membership_sha256)
    day = date.fromisoformat(bucket_date)
    end = datetime.combine(day + timedelta(days=1), time.min, tzinfo=UTC)
    reduced = n.timestamp(reduced_at)
    _require(reduced >= end, 'DAY_NOT_CLOSED')
    expected = {end-timedelta(minutes=5*i) for i in range(1,13)}
    slots, groups, inputs = set(), defaultdict(list), []
    members = {m['analysis_unit_id']:m for m in membership.values()}
    for projection in projections:
        _verify({k:v for k,v in projection.items() if k != 'document_sha256'},projection['document_sha256'])
        _require(projection.get('schema') == 'native-cny-slot-measurements/1'
                 and projection.get('basis') == BASIS and projection.get('currency') == 'CNY'
                 and projection.get('unit') == 'CNY_MAJOR_EXACT'
                 and projection.get('fx') is None, 'EOD_BASIS')
        _require(projection['membership_sha256'] == membership_sha256, 'EOD_MEMBERSHIP')
        slot = n.timestamp(projection['slot_at'])
        _require(slot in expected and slot not in slots, 'EOD_SLOT'); slots.add(slot)
        available = n.timestamp(projection['available_at'])
        _require(slot <= available < slot+timedelta(minutes=5) and available <= reduced, 'EOD_CLOCK')
        seen = set()
        for fact in projection['facts']:
            key = (fact['analysis_unit_id'],fact['source'])
            member = members.get(key[0])
            _require(member is not None and fact['identity_sha256'] == member['identity_sha256']
                     and key[1] in member['source_ids'] and key not in seen, 'EOD_FACT_IDENTITY')
            seen.add(key)
            if fact['state'] == 'USABLE_SOURCE_MEASUREMENT':
                value = _price(fact['ask_cny_major'])
                observed = n.timestamp(fact['source_observed_at'])
                _require(value is not None and value > 0
                         and 0 <= (available-observed).total_seconds() <= 900, 'EOD_FACT_VALUE')
                _require(_price(fact['raw_ask_cny_major']) == value, 'EOD_EXACT_VALUE')
                groups[key].append((slot,value,fact['source_record_sha256']))
        inputs.append((slot,projection['document_sha256']))
    output=[]
    for unit, member in sorted(members.items()):
        source_rows=[]
        for source in n.SOURCES:
            rows=sorted(groups[(unit,source)])
            values=sorted(r[1] for r in rows); count=len(values); value=None
            if count >= 9:
                mid=count//2
                value=values[mid] if count%2 else (values[mid-1]+values[mid])/2
            source_rows.append({'source':source,'qualified_slots':count,'ask_cny_major':_text(value),
                                'source_records':[r[2] for r in rows],
                                'state':'QUALIFIED_MEASUREMENT' if value is not None else 'INSUFFICIENT_SLOTS'})
        prices=[_price(r['ask_cny_major']) for r in source_rows if r['ask_cny_major'] is not None]
        if len(prices)>=2 and max(prices)>1000*min(prices):
            for row in source_rows:
                if row['ask_cny_major'] is not None:
                    row['state']='CROSS_SOURCE_INCOHERENT'; row['ask_cny_major']=None
        output.append({'analysis_unit_id':unit,'identity_sha256':member['identity_sha256'],'sources':source_rows})
    return _seal({'schema':'native-cny-eod-measurements/1','basis':BASIS,'policy':POLICY,
        'currency':'CNY','unit':'CNY_MAJOR_EXACT','fx':None,'bucket_date':bucket_date,
        'reduced_at':reduced_at,'membership_sha256':membership_sha256,
        'supplied_slots':len(slots),'missing_slots':[s.isoformat() for s in sorted(expected-slots)],
        'input_sha256':[h for _,h in sorted(inputs)],'members':output,'formal_state_eligible':False})


def source_returns(start, end, *, start_sha256, end_sha256, expected_days):
    """Exact same-source CNY endpoint returns; not a rank or index formula.

    Consumers must separately bind membership/history/rights and their own method.
    No bridge is inferred across a currency, membership or date mismatch. A null
    endpoint stays missing, rather than borrowing a platform or an earlier price.
    """
    _require(type(expected_days) is int and expected_days > 0, 'RETURN_WINDOW')
    def checked(doc, pin):
        _require(doc.get('document_sha256') == pin, 'ENDPOINT_PIN')
        _verify({k:v for k,v in doc.items() if k!='document_sha256'},pin)
        _require(doc.get('schema') == 'native-cny-eod-measurements/1'
                 and doc.get('basis') == BASIS and doc.get('currency') == 'CNY'
                 and doc.get('unit') == 'CNY_MAJOR_EXACT'
                 and doc.get('fx') is None and doc.get('policy') == POLICY, 'RETURN_BASIS')
        result={}
        for member in doc['members']:
            for source in member['sources']:
                key=(member['analysis_unit_id'],source['source'])
                _require(key not in result and key[1] in n.SOURCES, 'RETURN_DUPLICATE_OR_SOURCE')
                value=_price(source['ask_cny_major'])
                _require(value is None or value > 0, 'RETURN_VALUE')
                _require(value is None or source['state']=='QUALIFIED_MEASUREMENT', 'RETURN_STATE')
                result[key]=(member['identity_sha256'],value)
        return result
    left,right=checked(start,start_sha256),checked(end,end_sha256)
    _require(start['membership_sha256']==end['membership_sha256'], 'RETURN_MEMBERSHIP')
    _require((date.fromisoformat(end['bucket_date'])-date.fromisoformat(start['bucket_date'])).days
             == expected_days, 'RETURN_DATE_GAP')
    output=[]
    for key in sorted(set(left)|set(right)):
        l,r=left.get(key),right.get(key)
        _require(l is None or r is None or l[0]==r[0], 'RETURN_IDENTITY')
        value=None if l is None or r is None or l[1] is None or r[1] is None else Fraction(r[1]-l[1],l[1])
        output.append({'analysis_unit_id':key[0],'source':key[1],
                       'state':'MISSING_ENDPOINT' if value is None else 'EXACT_NATIVE_RETURN',
                       'return_numerator':None if value is None else str(value.numerator),
                       'return_denominator':None if value is None else str(value.denominator)})
    return _seal({'schema':'native-cny-source-returns/1','basis':BASIS,'fx':None,
        'start_sha256':start_sha256,'end_sha256':end_sha256,'expected_days':expected_days,
        'returns':output,'formal_state_eligible':False})
