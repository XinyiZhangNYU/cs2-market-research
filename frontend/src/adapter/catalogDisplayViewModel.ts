import type { CatalogProjectionRow } from '../contract/catalogBrowse'
import { ITEM_IMAGE_NOT_PRODUCED, bindItemImageUrl, type ItemImageSource } from '../contract/itemImage'
import type { Localized } from '../i18n'
import { isValidatedCatalogDisplayResponse } from '../wire/catalogDisplayApiDecode'
import type {
  CatalogDisplayErrorCode,
  CatalogNameAuthority,
  ValidatedCatalogDisplayResponse,
  WireCatalogDisplayListResponse,
  WireCatalogDisplayMember,
} from '../wire/catalogDisplayApiTypes'
import type { WireCatalogDisplaySnapshotDescriptor } from '../wire/catalogDisplaySnapshotApiTypes'

export type CatalogDisplayItemView = {
  analysis_unit_id: string
  parent_analysis_unit_id: string | null
  display_name: Localized
  name_authority: CatalogNameAuthority
  image: ItemImageSource
  valid_from: string
  valid_to: string | null
  available_at: string
  catalog_version: string
  projection_hash: string
}

export type CatalogDisplayPresentation = Readonly<{
  data_environment: 'LIVE_LOCAL' | 'LIVE_PUBLIC'
  channel: 'LOCAL_REAL_PIT_CATALOG' | 'PUBLIC_REAL_PIT_CATALOG'
}>

export const LOCAL_CATALOG_DISPLAY_PRESENTATION: CatalogDisplayPresentation =
  Object.freeze({
    data_environment: 'LIVE_LOCAL',
    channel: 'LOCAL_REAL_PIT_CATALOG',
  })

export const PUBLIC_CATALOG_DISPLAY_PRESENTATION: CatalogDisplayPresentation =
  Object.freeze({
    data_environment: 'LIVE_PUBLIC',
    channel: 'PUBLIC_REAL_PIT_CATALOG',
  })

export type CatalogDisplayBrowseView = {
  data_environment: CatalogDisplayPresentation['data_environment']
  channel: CatalogDisplayPresentation['channel']
  query_as_of: string
  query_known_at: string
  snapshot: {
    snapshot_id: string
    catalog_version: string
    available_at: string
    member_count: number
    member_set_hash: string
  } | null
  rows: readonly CatalogProjectionRow[]
  items: readonly CatalogDisplayItemView[]
  next_cursor: string | null
}

export class CatalogDisplayReadUnavailable extends Error {
  constructor(
    readonly code: CatalogDisplayErrorCode,
    readonly retryable: boolean,
    readonly httpStatus: 400 | 404 | 503,
  ) {
    super(`catalog display read unavailable: ${code}`)
    this.name = 'CatalogDisplayReadUnavailable'
  }
}

function assertUnicodeScalarText(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1)
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError('media key must contain Unicode scalar text')
      }
      index += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError('media key must contain Unicode scalar text')
    }
  }
}

export function encodeCatalogMediaKey(mediaKey: string): string {
  if (typeof mediaKey !== 'string' || mediaKey.length === 0) {
    throw new TypeError('media key must be non-empty text')
  }
  assertUnicodeScalarText(mediaKey)
  const bytes = new TextEncoder().encode(mediaKey)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/=+$/gu, '')
}

export function catalogMediaRoute(
  mediaKey: string,
  mediaAssetVersionId: string,
): string {
  if (!/^[1-9][0-9]*$/u.test(mediaAssetVersionId)) {
    throw new TypeError('media asset version must be a positive decimal identifier')
  }
  return `/media/catalog/v1/${mediaAssetVersionId}/${encodeCatalogMediaKey(mediaKey)}`
}

function itemImage(
  projection: WireCatalogDisplayListResponse['members'][number]['projection'],
): ItemImageSource {
  const media = projection.media
  if (media.status === 'NOT_PRODUCED') return ITEM_IMAGE_NOT_PRODUCED
  const mediaAssetVersionId = projection.version_context.media_asset_version_id
  if (mediaAssetVersionId === null) {
    throw new TypeError('BOUND media requires an exact media asset version')
  }
  return bindItemImageUrl(catalogMediaRoute(media.media_key, mediaAssetVersionId))
}

export type CatalogDisplayMemberView = Readonly<{
  row: CatalogProjectionRow
  item: CatalogDisplayItemView
}>

export function toCatalogDisplayMemberView(
  member: WireCatalogDisplayMember,
): CatalogDisplayMemberView {
  const projection = member.projection
  return Object.freeze({
    row: Object.freeze({
      item_kind: projection.item_kind,
      base_item_code: projection.base_item_code,
      analysis_unit_id: projection.analysis_unit_id,
      edition_kind: projection.edition_kind,
      wear_tier: projection.wear_tier,
    }),
    item: Object.freeze({
      analysis_unit_id: projection.analysis_unit_id,
      parent_analysis_unit_id: projection.parent_analysis_unit_id,
      display_name: Object.freeze({
        en: projection.localized_name.en,
        zh: projection.localized_name.zh_cn,
      }),
      name_authority: projection.localized_name.authority,
      image: itemImage(projection),
      valid_from: projection.valid_from,
      valid_to: member.storage.valid_to,
      available_at: member.storage.available_at,
      catalog_version: projection.catalog_version,
      projection_hash: projection.projection_hash,
    }),
  })
}

export function catalogDisplayPitContext(
  descriptor: WireCatalogDisplaySnapshotDescriptor,
  presentation: CatalogDisplayPresentation = LOCAL_CATALOG_DISPLAY_PRESENTATION,
): CatalogDisplayBrowseView {
  return Object.freeze({
    data_environment: presentation.data_environment,
    channel: presentation.channel,
    query_as_of: descriptor.as_of,
    query_known_at: descriptor.available_at,
    snapshot: Object.freeze({
      snapshot_id: descriptor.snapshot_id,
      catalog_version: descriptor.catalog_version,
      available_at: descriptor.available_at,
      member_count: descriptor.member_count,
      member_set_hash: descriptor.member_set_hash,
    }),
    rows: Object.freeze([]),
    items: Object.freeze([]),
    next_cursor: null,
  })
}

export function toCatalogDisplayBrowseView(
  response: ValidatedCatalogDisplayResponse,
  presentation: CatalogDisplayPresentation = LOCAL_CATALOG_DISPLAY_PRESENTATION,
): CatalogDisplayBrowseView {
  if (!isValidatedCatalogDisplayResponse(response, response.response_kind)) {
    throw new TypeError('catalog display adapter requires a validated response')
  }
  if (response.response_kind === 'ERROR') {
    throw new CatalogDisplayReadUnavailable(
      response.error.code,
      response.error.retryable,
      response.error.http_status,
    )
  }
  const rows: CatalogProjectionRow[] = []
  const items: CatalogDisplayItemView[] = []
  for (const member of response.members) {
    const view = toCatalogDisplayMemberView(member)
    rows.push(view.row)
    items.push(view.item)
  }
  return Object.freeze({
    data_environment: presentation.data_environment,
    channel: presentation.channel,
    query_as_of: response.query.as_of,
    query_known_at: response.query.known_at,
    snapshot: null,
    rows: Object.freeze(rows),
    items: Object.freeze(items),
    next_cursor: response.next_cursor,
  })
}
