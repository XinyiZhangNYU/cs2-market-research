import { describe, expect, it } from 'vitest'
import { nativeCnySingleDetailView, nativeCnySingleProblem, NativeCnySingleViewError } from '../src/adapter/nativeCnySingleViewModel'
import { NativeCnySingleHttpError } from '../src/api/HttpNativeCnySingleGateway'
import { BoundedJsonFetchError } from '../src/api/boundedJsonFetch'
import { NativeCnySingleDecodeError } from '../src/wire/nativeCnySingleDecode'
import type { NativeCnySingleDay } from '../src/wire/nativeCnySingleDecode'
import { pin, singleDocument, singleSelection } from './native-cny-single-view.fixtures'

describe('pure native single detail projection (author synthetic)', () => {
  for (const itemId of ['0', '9007199254740993', '9223372036854775807']) {
    it(`retains exact int64 text ${itemId} with no rank, stage or price`, () => {
      const selected = singleSelection(itemId)
      const view = nativeCnySingleDetailView(singleDocument(selected), selected)
      expect(view.selection.itemId).toBe(itemId)
      expect(view.feature.item_id).toBe(itemId)
      expect(view.families[0].trigger?.item_id).toBe(itemId)
      expect(view.rank).toBe('NO_RANK')
      expect(view.stage).toBeNull()
      expect(view.price).toBe('NOT_PUBLISHED_IN_SINGLE_DETAIL')
      expect(view.publication.data.currency).toBe('CNY')
      expect(view.publication.data.fx_applied).toBe(false)
    })
  }
  it('retains HH55/X3, exact clock text, retrospective/no-credit and external pins', () => {
    const selected = singleSelection()
    const document = singleDocument(selected)
    const view = nativeCnySingleDetailView(document, selected)
    expect(view.publication.data.method).toBe('CLAUDE_SEED_V2_HH55_X3')
    expect(view.publication.released_at).toBe(document.released_at)
    expect(view.publication.data.first_available_at).toBe(document.data.first_available_at)
    expect(view.publication.data.computed_at).toBe(document.data.computed_at)
    expect(view.publication.data.knowledge_mode).toBe('RETROSPECTIVE_LATE_BOUND')
    expect(view.publication.data.prospective_validation_credit).toBe(false)
    expect(view.publicDigestScope).toBe('ORIGINAL_PUBLISHED_DAY_NOT_FILTERED_DETAIL')
    expect(view.selection).toEqual(selected)
    expect(view.selection).not.toBe(selected)
    expect(Object.isFrozen(view.selection)).toBe(true)
    expect(Object.isFrozen(view.families)).toBe(true)
    expect(Object.isFrozen(view.families[0])).toBe(true)
  })
  it('keeps UNKNOWN and CONTINUATION separate from a published observed trigger', () => {
    const view = nativeCnySingleDetailView(singleDocument(), singleSelection())
    expect(view.families.map(({ family }) => family)).toEqual(['SUPPLY_LEAD', 'RECENT_PERSISTENT', 'COINCIDENT'])
    expect(view.families[0].triggerFact).toBe('PUBLISHED_OBSERVED_TRIGGER')
    expect(view.families[1]).toMatchObject({ signal: 'TRUE', disposition: 'CONTINUATION', trigger: null,
      triggerFact: 'NO_PUBLISHED_TRIGGER_FOR_FAMILY' })
    expect(view.families[2]).toMatchObject({ signal: 'UNKNOWN', disposition: 'UNKNOWN', trigger: null })
    expect(view.feature.history_state).toBe('UNKNOWN_NO_ARCHIVE_IDENTITY')
    expect(view.families[0].trigger?.public_label).toBeNull()
  })
  it('retains REENTRY, historical public label and LEFT_CENSORED without creating triggers', () => {
    const original = singleDocument()
    const document: NativeCnySingleDay = { ...original, data: { ...original.data,
      features: [{ ...original.data.features[0], dispositions: {
        SUPPLY_LEAD: 'REENTRY', RECENT_PERSISTENT: 'LEFT_CENSORED', COINCIDENT: 'UNKNOWN' } }],
      triggers: [{ ...original.data.triggers[0], entry_kind: 'REENTRY', public_label: '历史重建' }] } }
    const view = nativeCnySingleDetailView(document, singleSelection())
    expect(view.families[0].trigger).toMatchObject({ entry_kind: 'REENTRY', public_label: '历史重建' })
    expect(view.families[1]).toMatchObject({ disposition: 'LEFT_CENSORED', trigger: null })
    expect(view.publication.data.triggers).toHaveLength(1)
  })
  it('retains FALSE without turning absence of a family trigger into an item-wide conclusion', () => {
    const original = singleDocument()
    const document: NativeCnySingleDay = { ...original, data: { ...original.data,
      features: [{ ...original.data.features[0], signals: { ...original.data.features[0].signals, RECENT_PERSISTENT: 'FALSE' },
        dispositions: { ...original.data.features[0].dispositions, RECENT_PERSISTENT: 'FALSE' } }] } }
    const view = nativeCnySingleDetailView(document, singleSelection())
    expect(view.families[1]).toMatchObject({ signal: 'FALSE', disposition: 'FALSE', trigger: null })
    expect(view.families[0].trigger).not.toBeNull()
  })
  it('retains all three published families without ranking trigger input order', () => {
    const original = singleDocument()
    const document: NativeCnySingleDay = { ...original, data: { ...original.data,
      features: [{ ...original.data.features[0], signals: { SUPPLY_LEAD: 'TRUE', RECENT_PERSISTENT: 'TRUE', COINCIDENT: 'TRUE' },
        dispositions: { SUPPLY_LEAD: 'FIRST_ENTRY', RECENT_PERSISTENT: 'REENTRY', COINCIDENT: 'FIRST_ENTRY' } }],
      triggers: [
        { ...original.data.triggers[0], family: 'COINCIDENT', trigger_id: pin('0') },
        { ...original.data.triggers[0], family: 'RECENT_PERSISTENT', entry_kind: 'REENTRY', trigger_id: pin('1') },
        original.data.triggers[0],
      ] } }
    const view = nativeCnySingleDetailView(document, singleSelection())
    expect(view.families.every((row) => row.triggerFact === 'PUBLISHED_OBSERVED_TRIGGER')).toBe(true)
    expect(view.families[1].trigger?.entry_kind).toBe('REENTRY')
    expect(view.rank).toBe('NO_RANK')
    expect(view.publication.data.triggers.map((trigger) => trigger.family)).toEqual(['COINCIDENT', 'RECENT_PERSISTENT', 'SUPPLY_LEAD'])
  })
  for (const name of ['publicationId', 'publicSha256', 'rightsSha256', 'reviewSha256', 'catalogPublicationId'] as const) {
    it(`rejects wrong external ${name} rather than learning it from the response`, () => {
      expect(() => nativeCnySingleDetailView(singleDocument(), { ...singleSelection(), [name]: pin('0') })).toThrow()
    })
  }
  it('rejects wrong day and adjacent above-safe-integer identity', () => {
    expect(() => nativeCnySingleDetailView(singleDocument(), { ...singleSelection(), day: '2026-10-02' })).toThrow()
    const selected = singleSelection('9007199254740993')
    expect(() => nativeCnySingleDetailView(singleDocument(selected), singleSelection('9007199254740992'))).toThrow()
  })
  it('refuses numeric/coerced item identity from an injected gateway', () => {
    const document = singleDocument()
    const invalid = { ...document, data: { ...document.data, features: [{ ...document.data.features[0], item_id: 9007199254740992 }] } }
    expect(() => nativeCnySingleDetailView(invalid as unknown as NativeCnySingleDay, singleSelection())).toThrow(NativeCnySingleViewError)
    const trigger = { ...document, data: { ...document.data, triggers: [{ ...document.data.triggers[0], item_id: '01' }] } }
    expect(() => nativeCnySingleDetailView(trigger, singleSelection())).toThrow(NativeCnySingleViewError)
  })
  for (const drift of [{ currency: 'USD' }, { fx_applied: true }, { prospective_validation_credit: true },
    { method: 'LEGACY_288' }, { knowledge_mode: 'PROSPECTIVE' }]) {
    it(`refuses contract drift ${Object.keys(drift)[0]}`, () => {
      const document = singleDocument()
      const invalid = { ...document, data: { ...document.data, ...drift } } as unknown as NativeCnySingleDay
      expect(() => nativeCnySingleDetailView(invalid, singleSelection())).toThrow(NativeCnySingleDecodeError)
    })
  }
  it('refuses extra rank/stage, empty trigger details and missing trigger coverage', () => {
    const document = singleDocument()
    for (const change of [{ stage: 'RISING' }, { rank: 1 }]) {
      const invalid = { ...document, data: { ...document.data, features: [{ ...document.data.features[0], ...change }] } }
      expect(() => nativeCnySingleDetailView(invalid as unknown as NativeCnySingleDay, singleSelection())).toThrow()
    }
    expect(() => nativeCnySingleDetailView({ ...document, data: { ...document.data, triggers: [] } }, singleSelection())).toThrow()
    const invalid = { ...document, data: { ...document.data, features: [{ ...document.data.features[0],
      dispositions: { ...document.data.features[0].dispositions, RECENT_PERSISTENT: 'FIRST_ENTRY' } }] } }
    expect(() => nativeCnySingleDetailView(invalid as unknown as NativeCnySingleDay, singleSelection())).toThrow()
  })
  it('reuses exact clock and count checks instead of rounding', () => {
    const document = singleDocument()
    expect(() => nativeCnySingleDetailView({ ...document, released_at: '9999-12-31T24:00:00+01:00' }, singleSelection())).toThrow()
    expect(() => nativeCnySingleDetailView({ ...document, data: { ...document.data,
      first_available_at: '2026-10-04T01:00:00.000003Z' } }, singleSelection())).toThrow()
    for (const count of [366, -1, 1.5, Number.NaN]) {
      const invalid = { ...document, data: { ...document.data, features: [{ ...document.data.features[0], qualified_baseline_days: count }] } }
      expect(() => nativeCnySingleDetailView(invalid, singleSelection())).toThrow()
    }
  })
  for (const [error, code] of [
    [new NativeCnySingleHttpError(400, 'INVALID_REQUEST'), 'INVALID_REQUEST'],
    [new NativeCnySingleHttpError(404, 'NOT_PUBLISHED'), 'NOT_PUBLISHED'],
    [new NativeCnySingleHttpError(503, 'TEMPORARILY_UNAVAILABLE'), 'TEMPORARILY_UNAVAILABLE'],
    [new NativeCnySingleDecodeError('private synthetic text'), 'VALIDATION_ERROR'],
    [new BoundedJsonFetchError('REQUEST_TIMEOUT'), 'REQUEST_TIMEOUT'],
    [new BoundedJsonFetchError('INVALID_JSON_RESPONSE'), 'VALIDATION_ERROR'],
    [new DOMException('private synthetic text', 'AbortError'), 'CANCELLED'],
    [new Error('private synthetic text'), 'NETWORK_UNAVAILABLE'],
  ] as const) {
    it(`uses fixed public problem code ${code}`, () => {
      expect(nativeCnySingleProblem(error)).toBe(code)
    })
  }
})
