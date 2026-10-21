import {
  decodeNativeCnyIndexResponse,
  NativeCnyIndexWireError,
  snapshotNativeCnyIndexRequest,
  type NativeCnyIndexPublicDay,
  type NativeCnyIndexReadResult,
  type NativeCnyIndexRequest,
} from '../wire/nativeCnyIndexPublicApi'

export type NativeCnyIndexView = Readonly<{
  target: NativeCnyIndexRequest
  result: NativeCnyIndexReadResult
  days: readonly NativeCnyIndexPublicDay[]
  missingPublicationDates: readonly string[]
}>

/** Presentation only: never parse, round, scale, or replace a decimal string. */
export function nativeCnyIndexDecimalText(value: string | null): string {
  return value === null ? '— (null)' : value
}

/** CNY_MAJOR is already yuan; this is a label, not a conversion. */
export function nativeCnyIndexCnyText(value: string | null): string {
  return value === null ? '— (null)' : `CNY ${value}`
}

/** Recheck injected gateway results against the caller's target, not response identities. */
export function nativeCnyIndexView(
  result: NativeCnyIndexReadResult,
  request: NativeCnyIndexRequest,
): NativeCnyIndexView {
  const target = snapshotNativeCnyIndexRequest(request)
  if (result === null || typeof result !== 'object' || !['DAY', 'HISTORY', 'ERROR'].includes(result.kind)) {
    throw new NativeCnyIndexWireError('INVALID_RESPONSE')
  }
  const expectedKind = target.kind === 'CURRENT' ? 'DAY' : target.kind === 'WINDOW' ? 'HISTORY' : target.kind
  if (result.kind !== 'ERROR' && result.kind !== expectedKind) throw new NativeCnyIndexWireError('TARGET_MISMATCH')
  const checked = result.kind === 'ERROR'
    ? decodeNativeCnyIndexResponse(
      { api_contract: result.api_contract, error: result.error }, result.http_status, target,
    )
    : decodeNativeCnyIndexResponse(result.kind === 'DAY' ? result.day : result.history, 200, target)
  return Object.freeze({
    target,
    result: checked,
    days: checked.kind === 'DAY' ? Object.freeze([checked.day])
      : checked.kind === 'HISTORY' ? checked.history.days : Object.freeze([]),
    missingPublicationDates: checked.kind === 'HISTORY'
      ? checked.history.missing_publication_dates : Object.freeze([]),
  })
}
