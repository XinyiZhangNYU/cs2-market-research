import { describe, expect, it } from 'vitest'
import { nativeCnyTimestampMicros } from '../src/wire/nativeCnyTimestamp'

describe('exact backend-compatible native CNY timestamps', () => {
  for (const value of [
    '1970-01-01T00:00:00Z', '1970-01-01t00:00:00Z',
    '1970-01-01 00:00:00,000000000Z', '1970-01-01T08:00:00+08:00',
    '1969-12-31T20:00:00-04:00', '1969-12-31T24:00:00Z',
  ]) it('accepts equivalent zero instant ' + value, () => {
    expect(nativeCnyTimestampMicros(value)).toBe(0n)
  })
  it('retains exact fractional microseconds before and after epoch', () => {
    expect(nativeCnyTimestampMicros('1970-01-01T00:00:00.123456000Z')).toBe(123456n)
    expect(nativeCnyTimestampMicros('1969-12-31T23:59:59.123456Z')).toBe(-876544n)
  })
  it('accepts both Python datetime range endpoints exactly', () => {
    expect(nativeCnyTimestampMicros('0001-01-01T00:00:00Z')).toBe(-62135596800000000n)
    expect(nativeCnyTimestampMicros('9999-12-31T23:59:59.999999Z')).toBe(253402300799999999n)
  })
  for (const value of [
    '0000-01-01T00:00:00Z', '0001-01-01T00:00:00+00:01',
    '9999-12-31T23:59:59-00:01', '9999-12-31T24:00:00+01:00',
    '2026-02-29T00:00:00Z', '2026-04-31T00:00:00Z',
    '2026-10-04T24:00:01Z', '2026-10-04T24:00:00.000001Z',
    '2026-10-04T00:00:00.1234561Z', '2026-10-04T00:00:00+24:00',
    '2026-10-04T00:00:00+00:60', '2026-10-04T00:00:60Z',
    '2026-10-04T00:00:00Z\n', '2026-10-04T00:00:00',
  ]) it('rejects unsupported or nonrepresentable clock ' + value, () => {
    expect(() => nativeCnyTimestampMicros(value)).toThrow('INVALID_NATIVE_CNY_TIMESTAMP')
  })
})
