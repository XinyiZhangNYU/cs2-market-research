export type TradeUpEdition = 'standard' | 'stattrak' | 'souvenir'

export type TradeUpCatalogBinding = Readonly<{
  analysis_unit_id: string | null
  base_item_code: string | null
  localized_name: Readonly<{ en: string; zh_cn: string }> | null
  media:
    | Readonly<{
        status: 'BOUND'
        media_key: string
        media_asset_version_id: string
      }>
    | Readonly<{ status: 'NOT_PRODUCED' }>
}>

export type TradeUpSkin = Readonly<{
  id: string
  weapon: string
  finish: string
  kind: 'weapon' | 'knife' | 'glove'
  rarity_tier: number
  rarity_name: string
  collection: string | null
  cases: readonly string[]
  float_min: string
  float_max: string
  has_stattrak: boolean
  names: Readonly<{ en: string; zh_cn: string }>
  catalog: TradeUpCatalogBinding
}>

export type TradeUpGraphDocument = Readonly<{
  schema: 'cs2rotate.tradeup.public-graph.v1'
  source: Readonly<{
    rules_schema: string
    rules_as_of: string
    subset_rules_sha256: string
    subset_catalog_sha256: string
    catalog_as_of: string
    catalog_media_bound: number
    catalog_media_not_produced: number
  }>
  skins: readonly TradeUpSkin[]
  collections: Readonly<Record<string, Readonly<{ by_tier: Readonly<Record<string, readonly string[]>> }>>>
  cases: Readonly<Record<string, Readonly<{ gold_ids: readonly string[] }>>>
  labels_zh: Readonly<{
    collections: Readonly<Record<string, string>>
    cases: Readonly<Record<string, string>>
  }>
}>

export type TradeUpInput = Readonly<{
  id: string
  float: string | null
  edition: TradeUpEdition
}>

export type TradeUpOutcome = Readonly<{
  skin: TradeUpSkin
  probability: Readonly<{ numerator: bigint; denominator: bigint }>
  probability_text: string
  output_float: string | null
  wear_en: string | null
  wear_zh: string | null
  group: string
  group_zh: string | null
}>

export type TradeUpSimulation = Readonly<{
  contract: 'weapon_10' | 'gold_5'
  slots: 10 | 5
  rarity_tier: number
  edition: 'standard' | 'stattrak'
  avg_normalized: string | null
  outcomes: readonly TradeUpOutcome[]
  groups: readonly Readonly<{ name: string; inputs: number; pool: number }>[]
}>

export class TradeUpError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'TradeUpError'
  }
}
