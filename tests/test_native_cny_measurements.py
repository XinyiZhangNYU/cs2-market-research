import copy
from datetime import UTC, datetime, timedelta
import json

import pytest

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.ingestion import native_cny as n
from cs2_research.ingestion import native_cny_latest as latest
from cs2_research.feature_input import native_cny_measurements as c

MEMBERS={'members':[{'analysis_unit_id':'item:1','market_hash_name':'item',
    'variant_version':None,'identity_sha256':'1'*64,'source_ids':['market_a','market_c','market_b']}]}
PIN=sha256_hex(canonical_json_bytes(MEMBERS))


def fixture(ordinal=0, ask='7.25', **quote):
    slot=datetime(2026,9,27,23,tzinfo=UTC)+timedelta(minutes=5*ordinal)
    finished=(slot+timedelta(seconds=2)).isoformat()
    q={'ask':0,'bid':0,'updated_at':slot.isoformat(),**quote}
    # Opaque synthetic upstream bytes; decoding them is the private provider adapter's job.
    data=json.dumps({'synthetic_upstream_slot':finished,'ask':ask,'quote':q}).encode()
    rows,_=latest.normalize_latest(data,request=latest.REQUEST,wire_sha256='a'*64,
        slot_at=slot.isoformat(),requested_at=slot.isoformat(),finished_at=finished,
        target_names=['item'],catalog_sha256='b'*64)
    args=dict(slot_at=slot.isoformat(),finished_at=finished,wire_sha256='a'*64,
              catalog_sha256='b'*64,identities=MEMBERS,membership_sha256=PIN)
    return rows,args


def projection(ordinal=0, ask='7.25', **quote):
    rows,args=fixture(ordinal,ask,**quote)
    return c.project_slot(rows,**args)


def eod(projections, **kw):
    args=dict(bucket_date='2026-09-27',reduced_at='2026-09-28T00:00:00Z',
              identities=MEMBERS,membership_sha256=PIN)
    args.update(kw)
    return c.reduce_eod(projections,**args)


def rehash_row(row):
    row['record_hash']=n.digest(n.canonical_request({k:v for k,v in row.items() if k!='record_hash'}))


def reseal(doc):
    return c._seal({k:v for k,v in doc.items() if k!='document_sha256'})
























def test_eod_all_missing_still_records_denominator():
    r=eod([])
    assert len(r['missing_slots'])==12
    assert len(r['members'])==1 and len(r['members'][0]['sources'])==3








def endpoints():
    a=eod([projection(i) for i in range(9)])
    # Explicit synthetic endpoint, not a claim of a second real day.
    b=copy.deepcopy(a);b['bucket_date']='2026-09-28';b['reduced_at']='2026-09-29T00:00:00Z'
    b['members'][0]['sources'][0]['ask_cny_major']='14.5'
    return a,reseal(b)


def returns(a,b,**kw):
    args=dict(start_sha256=a['document_sha256'],end_sha256=b['document_sha256'],expected_days=1)
    args.update(kw)
    return c.source_returns(a,b,**args)






def test_empty_membership_rejected_even_empty_day():
    ids={'members':[]}
    with pytest.raises(ValueError,match='MEMBERSHIP'):
        eod([],identities=ids,membership_sha256=sha256_hex(canonical_json_bytes(ids)))










@pytest.mark.parametrize('value',['0','0.000000001','1.25','100000000000000000000',
                                 '-0.0123','123456789.123456789123456789'])
def test_exact_serializer_no_ambient_decimal_rounding(value):
    from decimal import localcontext
    with localcontext() as ctx:
        ctx.prec=2
        assert c._text(c._price(value))==value
