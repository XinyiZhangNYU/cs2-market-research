// Match ingestion.native_cny.timestamp's accepted clock domain. Original wire
// strings are retained by callers; only comparisons use exact integer micros.
export function nativeCnyTimestampMicros(value: unknown): bigint {
  const reject = (): never => { throw new TypeError('INVALID_NATIVE_CNY_TIMESTAMP') }
  if (typeof value !== 'string' || value.length > 1024 * 1024) return reject()
  const match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})[Tt ]([0-9]{2}):([0-9]{2}):([0-9]{2})(?:[.,]([0-9]+))?(Z|[+-][0-9]{2}:[0-9]{2})$/u.exec(value)
  if (match === null || match[0] !== value || match[1].startsWith('0000-')) return reject()
  const day = Date.parse(`${match[1]}T00:00:00Z`)
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== match[1]) return reject()
  const hour = Number(match[2]), minute = Number(match[3]), second = Number(match[4])
  const fraction = match[5] ?? ''
  if (hour > 24 || minute > 59 || second > 59 || /[1-9]/u.test(fraction.slice(6)) ||
    (hour === 24 && (minute !== 0 || second !== 0 || /[1-9]/u.test(fraction)))) return reject()
  const zone = match[6]
  const zoneHour = zone === 'Z' ? 0 : Number(zone.slice(1, 3))
  const zoneMinute = zone === 'Z' ? 0 : Number(zone.slice(4, 6))
  if (zoneHour > 23 || zoneMinute > 59) return reject()
  const localMillis = day + (hour * 3600 + minute * 60 + second) * 1000
  // Python validates a 24:00 rollover before converting the offset, so a local
  // year overflow cannot be rescued by an offset. UTC must also remain in range.
  const localYear = new Date(localMillis).getUTCFullYear()
  const offsetMinutes = (zone[0] === '-' ? -1 : 1) * (zoneHour * 60 + zoneMinute)
  const utcMillis = localMillis - offsetMinutes * 60_000
  const utcYear = new Date(utcMillis).getUTCFullYear()
  if (localYear < 1 || localYear > 9999 || utcYear < 1 || utcYear > 9999) return reject()
  return BigInt(utcMillis) * 1000n + BigInt(fraction.slice(0, 6).padEnd(6, '0'))
}
