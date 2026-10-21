// GENERATED FILE. DO NOT EDIT.
// Source: scripts/generate-wire-validators.mjs
// Shared schemas (SHA-256 of LF-normalized UTF-8 text): research-result-envelope.v1.schema.json:76d8b44abd287ef905b5e58899f1433eefdd4c4402332523dc05e2aa4c0f057d, research-quality-envelope.v1.schema.json:8499864fb654f618d48a222c7f6ba1620fe9022c5868701b5503ef8244cf7053, result-read-api.v1.schema.json:186eff4e1b708fe78aa4e7b582bd178f97db3c9fffcc8577a3d44a6a7cdfdb16, catalog-display-api.v1.schema.json:a6bd08836aa9182f312b13bdd514b1a97e38445f71b1d6909083e720e4a5655f, catalog-display-snapshot-api.v1.schema.json:45a8790ea22b3d73add54555f433700a9918b428fbdcec80778a3343a83e0a13, catalog-display-query-api.v1.schema.json:73d973b9e7f162e3226f08afc61d99b09f0b86de1a4dffe65e7be20849c42c9f, valve-event-public-api-v1.schema.json:1549eb0b32c1ecd13f5fdf2a7ac73c22e4c178f77d2905b0635548d203029548, fx-reference-api.v1.schema.json:e237f7f9cd41cc38ea0a8e3d8021648294ebcaa2132281c95a65469fe89b4dae, price-display-api.v1.schema.json:0a2aa6bee0f9c83b4ce5bd9c009a9bb61190d7f21904dfa1849e8fe5e519e646, market-watchlist-public-api.v1.schema.json:e1d629ddce00a9c041fc04c110b5240bc8ba37bef72bf0b0cab2959ee42b1c81, market-watchlist-public-observation-api.v1.schema.json:5f036285d65bee33c86d09630ce1d477d6588ab7212289a768f163c4c82385e6, market-descriptive-public-api.v1.schema.json:8e6577e2f584e2d7c211ba1fc68b7084f5c9322fb8e52e13689343206fbdee88, market-sector-index-public-api.v1.schema.json:b195bd1644d5bafb852347bc94e6c81d983e37b194b90acd9d77921666882938, market-sector-index-public-api.v2.schema.json:58059f991153000f658c51ab9e23107501713162d6529e4982e258eaa83051db, market-sector-index-public-api.v3.schema.json:8f8292f95a355b1322bb809f3809c4b498bacf0375560e6022294c5ddf63ac97, single-item-trending-public-api.v2.schema.json:029b1ae35ac59819fa5c69db697e535b2c8a39085531535044efb2e2dceb80af, single-item-monitor-public-api.v1.schema.json:fb8d4d90adfae7cdddeafbef7a66b7351f832ece950eabb6608476fe7460670b, single-item-current-public-api.v1.schema.json:f26191d8c4e471bd06dc75d3c1a16eece04f1d4b8ea83fd19be1b027d0bfdd9c, single-item-history-public-api.v1.schema.json:3a9bca9f3242ae5c7fef6600d0d1252737900a0e34dc46ad81dd7f3b562ea8be, single-item-trending-public-api.v3.schema.json:72a1a063e401531aa9317939c6ff0ed17649d7629239eb12c71370da6989722f, single-item-trending-public-api.v4.schema.json:4cb4d2610c403f250c073be207223bba9964d665b94da9e12ffdcba990946688
import __wireFormatsModule from 'ajv-formats/dist/formats.js'
import __wireEqualModule from 'fast-deep-equal'

const __wireFullFormats =
  __wireFormatsModule.fullFormats ?? __wireFormatsModule.default?.fullFormats
const __wireEqual =
  typeof __wireEqualModule === 'function'
    ? __wireEqualModule
    : __wireEqualModule.default

function __wireUcs2Length(value) {
  let length = 0
  let position = 0
  while (position < value.length) {
    length += 1
    const current = value.charCodeAt(position)
    position += 1
    if (current >= 0xd800 && current <= 0xdbff && position < value.length) {
      const next = value.charCodeAt(position)
      if ((next & 0xfc00) === 0xdc00) position += 1
    }
  }
  return length
}

if (
  __wireFullFormats === undefined ||
  typeof __wireEqual !== 'function'
) {
  throw new Error('precompiled validator runtime helpers are unavailable')
}
"use strict";
export const validateCatalogDisplayQueryApiResponse = validate121;
const schema202 = {"$defs":{"bootstrapQuery":{"additionalProperties":false,"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"}},"required":["snapshot_id"],"type":"object"},"bootstrapResponse":{"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"categories":{"items":{"$ref":"#/$defs/category"},"type":"array"},"equipment":{"items":{"$ref":"#/$defs/equipment"},"type":"array"},"image_counts":{"$ref":"#/$defs/imageCounts"},"profiles":{"$ref":"#/$defs/profiles"},"query":{"$ref":"#/$defs/bootstrapQuery"},"response_kind":{"const":"CATALOG_QUERY_BOOTSTRAP"},"snapshot":{"$ref":"#/$defs/snapshot"}},"required":["api_contract","api_version","categories","equipment","image_counts","profiles","query","response_kind","snapshot"],"type":"object"},"category":{"additionalProperties":false,"properties":{"category_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"member_count":{"minimum":0,"type":"integer"},"series_count":{"minimum":0,"type":"integer"}},"required":["category_id","member_count","series_count"],"type":"object"},"detailQuery":{"additionalProperties":false,"properties":{"analysis_unit_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"page_size":{"maximum":200,"minimum":1,"type":"integer"},"snapshot_id":{"$ref":"#/$defs/sha256"}},"required":["analysis_unit_id","page_size","snapshot_id"],"type":"object"},"detailResponse":{"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"member":{"$ref":"#/$defs/member"},"next_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"parent_present":{"type":"boolean"},"previous_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"profiles":{"$ref":"#/$defs/profiles"},"query":{"$ref":"#/$defs/detailQuery"},"response_kind":{"const":"CATALOG_QUERY_DETAIL"},"sibling_total":{"minimum":1,"type":"integer"},"siblings":{"items":{"$ref":"#/$defs/member"},"maxItems":200,"type":"array"},"snapshot":{"$ref":"#/$defs/snapshot"}},"required":["api_contract","api_version","member","next_cursor","parent_present","previous_cursor","profiles","query","response_kind","sibling_total","siblings","snapshot"],"type":"object"},"editionCount":{"additionalProperties":false,"properties":{"count":{"minimum":1,"type":"integer"},"value":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]}},"required":["count","value"],"type":"object"},"equipment":{"additionalProperties":false,"properties":{"category_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"member_count":{"minimum":0,"type":"integer"},"selection_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"series_count":{"minimum":0,"type":"integer"}},"required":["category_id","item_kind","member_count","selection_id","series_count"],"type":"object"},"errorResponse":{"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"error":{"oneOf":[{"additionalProperties":false,"properties":{"code":{"const":"INVALID_ARGUMENT"},"http_status":{"const":400},"retryable":{"const":false}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"INVALID_CURSOR"},"http_status":{"const":400},"retryable":{"const":false}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"NOT_FOUND"},"http_status":{"const":404},"retryable":{"const":false}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"CONTRACT_UNAVAILABLE"},"http_status":{"const":503},"retryable":{"const":true}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"RECORD_CORRUPT"},"http_status":{"const":503},"retryable":{"const":false}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"BACKEND_UNAVAILABLE"},"http_status":{"const":503},"retryable":{"const":true}},"required":["code","http_status","retryable"],"type":"object"}]},"response_kind":{"const":"ERROR"}},"required":["api_contract","api_version","error","response_kind"],"type":"object"},"facet":{"additionalProperties":false,"properties":{"edition_counts":{"items":{"$ref":"#/$defs/editionCount"},"maxItems":4,"type":"array"},"eligible_member_count":{"minimum":0,"type":"integer"},"image_counts":{"$ref":"#/$defs/imageCounts"},"wear_counts":{"items":{"$ref":"#/$defs/wearCount"},"maxItems":7,"type":"array"}},"required":["edition_counts","eligible_member_count","image_counts","wear_counts"],"type":"object"},"identifier":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"imageCounts":{"additionalProperties":false,"properties":{"bound":{"minimum":0,"type":"integer"},"not_produced":{"minimum":0,"type":"integer"},"total":{"minimum":0,"type":"integer"}},"required":["bound","not_produced","total"],"type":"object"},"listResponse":{"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-api"},"api_version":{"const":"v1"},"members":{"items":{"$ref":"#/$defs/member"},"maxItems":200,"type":"array"},"next_cursor":{"oneOf":[{"maxLength":8192,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"query":{"$ref":"#/$defs/query"},"response_kind":{"const":"CATALOG_DISPLAY_LIST"}},"required":["api_contract","api_version","response_kind","query","members","next_cursor"],"type":"object"},"localizedName":{"additionalProperties":false,"properties":{"authority":{"enum":["VALVE_STEAM","MARKET_D","MARKET_B"]},"en":{"maxLength":512,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"zh_cn":{"maxLength":512,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"}},"required":["authority","en","zh_cn"],"type":"object"},"media":{"oneOf":[{"$ref":"#/$defs/mediaNotProduced"},{"$ref":"#/$defs/mediaBound"}]},"mediaBound":{"additionalProperties":false,"properties":{"media_key":{"maxLength":256,"not":{"pattern":"(^|/)\\.{1,2}(/|$)"},"pattern":"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$","type":"string"},"presentation_kind":{"enum":["SERIES_REPRESENTATIVE","STYLE_REPRESENTATIVE"]},"status":{"const":"BOUND"}},"required":["status","media_key","presentation_kind"],"type":"object"},"mediaNotProduced":{"additionalProperties":false,"properties":{"status":{"const":"NOT_PRODUCED"}},"required":["status"],"type":"object"},"member":{"additionalProperties":false,"properties":{"projection":{"$ref":"#/$defs/projection"},"storage":{"additionalProperties":false,"properties":{"available_at":{"$ref":"#/$defs/timestamp"},"valid_to":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]}},"required":["available_at","valid_to"],"type":"object"}},"required":["projection","storage"],"type":"object"},"profiles":{"additionalProperties":false,"properties":{"navigation_sha256":{"$ref":"#/$defs/sha256"},"navigation_version":{"const":"v1"},"search_profile":{"const":"ECMASCRIPT_NFKC_WS_LOWER_V1"},"sort_profile":{"const":"LOCALIZED_CODEPOINT_V1"},"source_mapping_sha256":{"$ref":"#/$defs/sha256"}},"required":["navigation_sha256","navigation_version","search_profile","sort_profile","source_mapping_sha256"],"type":"object"},"projection":{"additionalProperties":false,"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"base_item_code":{"$ref":"#/$defs/identifier"},"catalog_version":{"maxLength":128,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/localizedName"},"media":{"$ref":"#/$defs/media"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"projection_hash":{"pattern":"^[0-9a-f]{64}$","type":"string"},"valid_from":{"$ref":"#/$defs/timestamp"},"version_context":{"$ref":"#/$defs/versionContext"},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]}},"required":["analysis_unit_id","analysis_unit_kind","base_item_code","catalog_version","edition_kind","item_kind","localized_name","media","parent_analysis_unit_id","projection_hash","valid_from","version_context","wear_tier"],"type":"object"},"query":{"additionalProperties":false,"properties":{"analysis_unit_kind":{"oneOf":[{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},{"type":"null"}]},"as_of":{"$ref":"#/$defs/timestamp"},"base_item_code":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"edition_kind":{"oneOf":[{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},{"type":"null"}]},"item_kind":{"oneOf":[{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},{"type":"null"}]},"known_at":{"$ref":"#/$defs/timestamp"},"page_size":{"maximum":200,"minimum":1,"type":"integer"},"sort":{"const":"ANALYSIS_UNIT_ID_ASC"},"wear_tier":{"oneOf":[{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},{"type":"null"}]}},"required":["analysis_unit_kind","as_of","base_item_code","edition_kind","item_kind","known_at","page_size","sort","wear_tier"],"type":"object"},"seriesMember":{"additionalProperties":false,"properties":{"base_item_code":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"category_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"equipment_model_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"matched_member_count":{"minimum":1,"type":"integer"},"rarity":{"oneOf":[{"enum":["COVERT","CLASSIFIED","RESTRICTED","MIL_SPEC","INDUSTRIAL","CONSUMER","EXTRAORDINARY","CONTRABAND"]},{"type":"null"}]},"representative":{"$ref":"#/$defs/member"}},"required":["base_item_code","category_id","equipment_model_id","item_kind","matched_member_count","rarity","representative"],"type":"object"},"seriesQuery":{"additionalProperties":false,"properties":{"discovery_seed":{"pattern":"^[A-Za-z0-9._-]{1,128}$","type":"string"},"equipment_selection_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"item_category":{"oneOf":[{"enum":["NORMAL","STATTRAK","SOUVENIR","STAR","STAR_STATTRAK"]},{"type":"null"}]},"locale":{"enum":["en","zh_cn"]},"page_size":{"maximum":60,"minimum":1,"type":"integer"},"rarity":{"oneOf":[{"enum":["COVERT","CLASSIFIED","RESTRICTED","MIL_SPEC","INDUSTRIAL","CONSUMER","EXTRAORDINARY","CONTRABAND"]},{"type":"null"}]},"search_normalized":{"oneOf":[{"maxLength":4096,"minLength":1,"type":"string"},{"type":"null"}]},"search_text":{"oneOf":[{"maxLength":128,"minLength":1,"type":"string"},{"type":"null"}]},"snapshot_id":{"$ref":"#/$defs/sha256"},"sort":{"enum":["NAME_ASC","PRODUCT","DISCOVERY"]},"wear_tier":{"oneOf":[{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},{"type":"null"}]}},"required":["equipment_selection_id","item_category","locale","page_size","rarity","search_normalized","search_text","snapshot_id","sort","wear_tier"],"type":"object"},"seriesResponse":{"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"members":{"items":{"$ref":"#/$defs/seriesMember"},"maxItems":60,"type":"array"},"next_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"previous_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"profiles":{"$ref":"#/$defs/profiles"},"query":{"$ref":"#/$defs/seriesQuery"},"response_kind":{"const":"CATALOG_QUERY_SERIES"},"snapshot":{"$ref":"#/$defs/snapshot"},"total_matching_series":{"minimum":0,"type":"integer"}},"required":["api_contract","api_version","members","next_cursor","previous_cursor","profiles","query","response_kind","snapshot","total_matching_series"],"type":"object"},"sha256":{"pattern":"^[0-9a-f]{64}$","type":"string"},"snapshot":{"additionalProperties":false,"properties":{"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"catalog_version":{"maxLength":128,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"member_count":{"minimum":0,"type":"integer"},"member_set_hash":{"$ref":"#/$defs/sha256"},"snapshot_id":{"$ref":"#/$defs/sha256"}},"required":["as_of","available_at","catalog_version","member_count","member_set_hash","snapshot_id"],"type":"object"},"timestamp":{"pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$","type":"string"},"unitsQuery":{"additionalProperties":false,"properties":{"base_item_code":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"edition_kinds":{"items":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"maxItems":4,"minItems":1,"type":"array","uniqueItems":true},"item_category":{"oneOf":[{"enum":["NORMAL","STATTRAK","SOUVENIR","STAR","STAR_STATTRAK"]},{"type":"null"}]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"locale":{"enum":["en","zh_cn"]},"page_size":{"maximum":200,"minimum":1,"type":"integer"},"rarity":{"oneOf":[{"enum":["COVERT","CLASSIFIED","RESTRICTED","MIL_SPEC","INDUSTRIAL","CONSUMER","EXTRAORDINARY","CONTRABAND"]},{"type":"null"}]},"snapshot_id":{"$ref":"#/$defs/sha256"},"sort":{"enum":["NAME_ASC","EDITION_ASC","WEAR_ASC"]},"wear_tiers":{"items":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"maxItems":7,"minItems":1,"type":"array","uniqueItems":true}},"required":["base_item_code","edition_kinds","item_category","item_kind","locale","page_size","rarity","snapshot_id","sort","wear_tiers"],"type":"object"},"unitsResponse":{"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"facet":{"$ref":"#/$defs/facet"},"members":{"items":{"$ref":"#/$defs/member"},"maxItems":200,"type":"array"},"next_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"previous_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"profiles":{"$ref":"#/$defs/profiles"},"query":{"$ref":"#/$defs/unitsQuery"},"response_kind":{"const":"CATALOG_QUERY_UNITS"},"snapshot":{"$ref":"#/$defs/snapshot"},"total_matching_members":{"minimum":0,"type":"integer"}},"required":["api_contract","api_version","facet","members","next_cursor","previous_cursor","profiles","query","response_kind","snapshot","total_matching_members"],"type":"object"},"versionContext":{"additionalProperties":false,"properties":{"analysis_unit_version_id":{"$ref":"#/$defs/versionId"},"item_variant_version_id":{"$ref":"#/$defs/versionId"},"media_asset_version_id":{"oneOf":[{"$ref":"#/$defs/versionId"},{"type":"null"}]},"name_en_version_id":{"$ref":"#/$defs/versionId"},"name_zh_cn_version_id":{"$ref":"#/$defs/versionId"}},"required":["analysis_unit_version_id","item_variant_version_id","media_asset_version_id","name_en_version_id","name_zh_cn_version_id"],"type":"object"},"versionId":{"pattern":"^[1-9][0-9]*$","type":"string"},"wearCount":{"additionalProperties":false,"properties":{"count":{"minimum":1,"type":"integer"},"value":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]}},"required":["count","value"],"type":"object"}},"$id":"urn:cs2-research:catalog-display-query-api:v1","$schema":"https://json-schema.org/draft/2020-12/schema","oneOf":[{"$ref":"#/$defs/bootstrapResponse"},{"$ref":"#/$defs/seriesResponse"},{"$ref":"#/$defs/unitsResponse"},{"$ref":"#/$defs/detailResponse"},{"$ref":"#/$defs/errorResponse"}],"title":"Snapshot-bound catalog display query API V1"};
const schema249 = {"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"error":{"oneOf":[{"additionalProperties":false,"properties":{"code":{"const":"INVALID_ARGUMENT"},"http_status":{"const":400},"retryable":{"const":false}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"INVALID_CURSOR"},"http_status":{"const":400},"retryable":{"const":false}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"NOT_FOUND"},"http_status":{"const":404},"retryable":{"const":false}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"CONTRACT_UNAVAILABLE"},"http_status":{"const":503},"retryable":{"const":true}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"RECORD_CORRUPT"},"http_status":{"const":503},"retryable":{"const":false}},"required":["code","http_status","retryable"],"type":"object"},{"additionalProperties":false,"properties":{"code":{"const":"BACKEND_UNAVAILABLE"},"http_status":{"const":503},"retryable":{"const":true}},"required":["code","http_status","retryable"],"type":"object"}]},"response_kind":{"const":"ERROR"}},"required":["api_contract","api_version","error","response_kind"],"type":"object"};
const schema203 = {"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"categories":{"items":{"$ref":"#/$defs/category"},"type":"array"},"equipment":{"items":{"$ref":"#/$defs/equipment"},"type":"array"},"image_counts":{"$ref":"#/$defs/imageCounts"},"profiles":{"$ref":"#/$defs/profiles"},"query":{"$ref":"#/$defs/bootstrapQuery"},"response_kind":{"const":"CATALOG_QUERY_BOOTSTRAP"},"snapshot":{"$ref":"#/$defs/snapshot"}},"required":["api_contract","api_version","categories","equipment","image_counts","profiles","query","response_kind","snapshot"],"type":"object"};
const schema204 = {"additionalProperties":false,"properties":{"category_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"member_count":{"minimum":0,"type":"integer"},"series_count":{"minimum":0,"type":"integer"}},"required":["category_id","member_count","series_count"],"type":"object"};
const schema205 = {"additionalProperties":false,"properties":{"category_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"member_count":{"minimum":0,"type":"integer"},"selection_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"series_count":{"minimum":0,"type":"integer"}},"required":["category_id","item_kind","member_count","selection_id","series_count"],"type":"object"};
const schema206 = {"additionalProperties":false,"properties":{"bound":{"minimum":0,"type":"integer"},"not_produced":{"minimum":0,"type":"integer"},"total":{"minimum":0,"type":"integer"}},"required":["bound","not_produced","total"],"type":"object"};
const func9 = Object.prototype.hasOwnProperty;
const func2 = __wireUcs2Length;
const pattern87 = new RegExp("^[^\\u0000-\\u001f\\u007f]+$", "u");
const schema207 = {"additionalProperties":false,"properties":{"navigation_sha256":{"$ref":"#/$defs/sha256"},"navigation_version":{"const":"v1"},"search_profile":{"const":"ECMASCRIPT_NFKC_WS_LOWER_V1"},"sort_profile":{"const":"LOCALIZED_CODEPOINT_V1"},"source_mapping_sha256":{"$ref":"#/$defs/sha256"}},"required":["navigation_sha256","navigation_version","search_profile","sort_profile","source_mapping_sha256"],"type":"object"};
const schema208 = {"pattern":"^[0-9a-f]{64}$","type":"string"};
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");

function validate123(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate123.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.navigation_sha256 === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "navigation_sha256"},message:"must have required property '"+"navigation_sha256"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.navigation_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "navigation_version"},message:"must have required property '"+"navigation_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.search_profile === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "search_profile"},message:"must have required property '"+"search_profile"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.sort_profile === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sort_profile"},message:"must have required property '"+"sort_profile"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.source_mapping_sha256 === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_mapping_sha256"},message:"must have required property '"+"source_mapping_sha256"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "navigation_sha256") || (key0 === "navigation_version")) || (key0 === "search_profile")) || (key0 === "sort_profile")) || (key0 === "source_mapping_sha256"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.navigation_sha256 !== undefined){
let data0 = data.navigation_sha256;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err6 = {instancePath:instancePath+"/navigation_sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/navigation_sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.navigation_version !== undefined){
if("v1" !== data.navigation_version){
const err8 = {instancePath:instancePath+"/navigation_version",schemaPath:"#/properties/navigation_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.search_profile !== undefined){
if("ECMASCRIPT_NFKC_WS_LOWER_V1" !== data.search_profile){
const err9 = {instancePath:instancePath+"/search_profile",schemaPath:"#/properties/search_profile/const",keyword:"const",params:{allowedValue: "ECMASCRIPT_NFKC_WS_LOWER_V1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.sort_profile !== undefined){
if("LOCALIZED_CODEPOINT_V1" !== data.sort_profile){
const err10 = {instancePath:instancePath+"/sort_profile",schemaPath:"#/properties/sort_profile/const",keyword:"const",params:{allowedValue: "LOCALIZED_CODEPOINT_V1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.source_mapping_sha256 !== undefined){
let data4 = data.source_mapping_sha256;
if(typeof data4 === "string"){
if(!pattern5.test(data4)){
const err11 = {instancePath:instancePath+"/source_mapping_sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/source_mapping_sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
else {
const err13 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
validate123.errors = vErrors;
return errors === 0;
}
validate123.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema210 = {"additionalProperties":false,"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"}},"required":["snapshot_id"],"type":"object"};

function validate125(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate125.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.snapshot_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "snapshot_id")){
const err1 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.snapshot_id !== undefined){
let data0 = data.snapshot_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err2 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
else {
const err3 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
validate125.errors = vErrors;
return errors === 0;
}
validate125.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema212 = {"additionalProperties":false,"properties":{"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"catalog_version":{"maxLength":128,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"member_count":{"minimum":0,"type":"integer"},"member_set_hash":{"$ref":"#/$defs/sha256"},"snapshot_id":{"$ref":"#/$defs/sha256"}},"required":["as_of","available_at","catalog_version","member_count","member_set_hash","snapshot_id"],"type":"object"};
const schema213 = {"pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$","type":"string"};
const pattern19 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$", "u");

function validate127(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate127.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.as_of === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "as_of"},message:"must have required property '"+"as_of"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.available_at === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.catalog_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_version"},message:"must have required property '"+"catalog_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.member_count === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_count"},message:"must have required property '"+"member_count"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.member_set_hash === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_set_hash"},message:"must have required property '"+"member_set_hash"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.snapshot_id === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "as_of") || (key0 === "available_at")) || (key0 === "catalog_version")) || (key0 === "member_count")) || (key0 === "member_set_hash")) || (key0 === "snapshot_id"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.as_of !== undefined){
let data0 = data.as_of;
if(typeof data0 === "string"){
if(!pattern19.test(data0)){
const err7 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
else {
const err8 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.available_at !== undefined){
let data1 = data.available_at;
if(typeof data1 === "string"){
if(!pattern19.test(data1)){
const err9 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.catalog_version !== undefined){
let data2 = data.catalog_version;
if(typeof data2 === "string"){
if(func2(data2) > 128){
const err11 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func2(data2) < 1){
const err12 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern87.test(data2)){
const err13 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.member_count !== undefined){
let data3 = data.member_count;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err15 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 < 0 || isNaN(data3)){
const err16 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
if(data.member_set_hash !== undefined){
let data4 = data.member_set_hash;
if(typeof data4 === "string"){
if(!pattern5.test(data4)){
const err17 = {instancePath:instancePath+"/member_set_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
else {
const err18 = {instancePath:instancePath+"/member_set_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.snapshot_id !== undefined){
let data5 = data.snapshot_id;
if(typeof data5 === "string"){
if(!pattern5.test(data5)){
const err19 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
else {
const err20 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
else {
const err21 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
validate127.errors = vErrors;
return errors === 0;
}
validate127.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate122(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate122.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.api_contract === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "api_contract"},message:"must have required property '"+"api_contract"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.api_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "api_version"},message:"must have required property '"+"api_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.categories === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "categories"},message:"must have required property '"+"categories"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.equipment === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "equipment"},message:"must have required property '"+"equipment"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.image_counts === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "image_counts"},message:"must have required property '"+"image_counts"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.profiles === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "profiles"},message:"must have required property '"+"profiles"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.query === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.response_kind === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.snapshot === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema203.properties, key0))){
const err9 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.api_contract !== undefined){
if("catalog-display-query-api" !== data.api_contract){
const err10 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "catalog-display-query-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err11 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.categories !== undefined){
let data2 = data.categories;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.category_id === undefined){
const err12 = {instancePath:instancePath+"/categories/" + i0,schemaPath:"#/$defs/category/required",keyword:"required",params:{missingProperty: "category_id"},message:"must have required property '"+"category_id"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data3.member_count === undefined){
const err13 = {instancePath:instancePath+"/categories/" + i0,schemaPath:"#/$defs/category/required",keyword:"required",params:{missingProperty: "member_count"},message:"must have required property '"+"member_count"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data3.series_count === undefined){
const err14 = {instancePath:instancePath+"/categories/" + i0,schemaPath:"#/$defs/category/required",keyword:"required",params:{missingProperty: "series_count"},message:"must have required property '"+"series_count"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data3){
if(!(((key1 === "category_id") || (key1 === "member_count")) || (key1 === "series_count"))){
const err15 = {instancePath:instancePath+"/categories/" + i0,schemaPath:"#/$defs/category/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data3.category_id !== undefined){
let data4 = data3.category_id;
if(typeof data4 === "string"){
if(func2(data4) > 256){
const err16 = {instancePath:instancePath+"/categories/" + i0+"/category_id",schemaPath:"#/$defs/category/properties/category_id/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(func2(data4) < 1){
const err17 = {instancePath:instancePath+"/categories/" + i0+"/category_id",schemaPath:"#/$defs/category/properties/category_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!pattern87.test(data4)){
const err18 = {instancePath:instancePath+"/categories/" + i0+"/category_id",schemaPath:"#/$defs/category/properties/category_id/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/categories/" + i0+"/category_id",schemaPath:"#/$defs/category/properties/category_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data3.member_count !== undefined){
let data5 = data3.member_count;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err20 = {instancePath:instancePath+"/categories/" + i0+"/member_count",schemaPath:"#/$defs/category/properties/member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 < 0 || isNaN(data5)){
const err21 = {instancePath:instancePath+"/categories/" + i0+"/member_count",schemaPath:"#/$defs/category/properties/member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
if(data3.series_count !== undefined){
let data6 = data3.series_count;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err22 = {instancePath:instancePath+"/categories/" + i0+"/series_count",schemaPath:"#/$defs/category/properties/series_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 < 0 || isNaN(data6)){
const err23 = {instancePath:instancePath+"/categories/" + i0+"/series_count",schemaPath:"#/$defs/category/properties/series_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
}
else {
const err24 = {instancePath:instancePath+"/categories/" + i0,schemaPath:"#/$defs/category/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
else {
const err25 = {instancePath:instancePath+"/categories",schemaPath:"#/properties/categories/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.equipment !== undefined){
let data7 = data.equipment;
if(Array.isArray(data7)){
const len1 = data7.length;
for(let i1=0; i1<len1; i1++){
let data8 = data7[i1];
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.category_id === undefined){
const err26 = {instancePath:instancePath+"/equipment/" + i1,schemaPath:"#/$defs/equipment/required",keyword:"required",params:{missingProperty: "category_id"},message:"must have required property '"+"category_id"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data8.item_kind === undefined){
const err27 = {instancePath:instancePath+"/equipment/" + i1,schemaPath:"#/$defs/equipment/required",keyword:"required",params:{missingProperty: "item_kind"},message:"must have required property '"+"item_kind"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data8.member_count === undefined){
const err28 = {instancePath:instancePath+"/equipment/" + i1,schemaPath:"#/$defs/equipment/required",keyword:"required",params:{missingProperty: "member_count"},message:"must have required property '"+"member_count"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data8.selection_id === undefined){
const err29 = {instancePath:instancePath+"/equipment/" + i1,schemaPath:"#/$defs/equipment/required",keyword:"required",params:{missingProperty: "selection_id"},message:"must have required property '"+"selection_id"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data8.series_count === undefined){
const err30 = {instancePath:instancePath+"/equipment/" + i1,schemaPath:"#/$defs/equipment/required",keyword:"required",params:{missingProperty: "series_count"},message:"must have required property '"+"series_count"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
for(const key2 in data8){
if(!(((((key2 === "category_id") || (key2 === "item_kind")) || (key2 === "member_count")) || (key2 === "selection_id")) || (key2 === "series_count"))){
const err31 = {instancePath:instancePath+"/equipment/" + i1,schemaPath:"#/$defs/equipment/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data8.category_id !== undefined){
let data9 = data8.category_id;
if(typeof data9 === "string"){
if(func2(data9) > 256){
const err32 = {instancePath:instancePath+"/equipment/" + i1+"/category_id",schemaPath:"#/$defs/equipment/properties/category_id/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(func2(data9) < 1){
const err33 = {instancePath:instancePath+"/equipment/" + i1+"/category_id",schemaPath:"#/$defs/equipment/properties/category_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(!pattern87.test(data9)){
const err34 = {instancePath:instancePath+"/equipment/" + i1+"/category_id",schemaPath:"#/$defs/equipment/properties/category_id/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
else {
const err35 = {instancePath:instancePath+"/equipment/" + i1+"/category_id",schemaPath:"#/$defs/equipment/properties/category_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data8.item_kind !== undefined){
let data10 = data8.item_kind;
if(!((((((data10 === "WEAPON") || (data10 === "KNIFE")) || (data10 === "GLOVE")) || (data10 === "AGENT")) || (data10 === "OTHER")) || (data10 === "UNKNOWN"))){
const err36 = {instancePath:instancePath+"/equipment/" + i1+"/item_kind",schemaPath:"#/$defs/equipment/properties/item_kind/enum",keyword:"enum",params:{allowedValues: schema205.properties.item_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data8.member_count !== undefined){
let data11 = data8.member_count;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err37 = {instancePath:instancePath+"/equipment/" + i1+"/member_count",schemaPath:"#/$defs/equipment/properties/member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 < 0 || isNaN(data11)){
const err38 = {instancePath:instancePath+"/equipment/" + i1+"/member_count",schemaPath:"#/$defs/equipment/properties/member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
if(data8.selection_id !== undefined){
let data12 = data8.selection_id;
if(typeof data12 === "string"){
if(func2(data12) > 256){
const err39 = {instancePath:instancePath+"/equipment/" + i1+"/selection_id",schemaPath:"#/$defs/equipment/properties/selection_id/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(func2(data12) < 1){
const err40 = {instancePath:instancePath+"/equipment/" + i1+"/selection_id",schemaPath:"#/$defs/equipment/properties/selection_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(!pattern87.test(data12)){
const err41 = {instancePath:instancePath+"/equipment/" + i1+"/selection_id",schemaPath:"#/$defs/equipment/properties/selection_id/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
else {
const err42 = {instancePath:instancePath+"/equipment/" + i1+"/selection_id",schemaPath:"#/$defs/equipment/properties/selection_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data8.series_count !== undefined){
let data13 = data8.series_count;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err43 = {instancePath:instancePath+"/equipment/" + i1+"/series_count",schemaPath:"#/$defs/equipment/properties/series_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 < 0 || isNaN(data13)){
const err44 = {instancePath:instancePath+"/equipment/" + i1+"/series_count",schemaPath:"#/$defs/equipment/properties/series_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
}
}
else {
const err45 = {instancePath:instancePath+"/equipment/" + i1,schemaPath:"#/$defs/equipment/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
}
else {
const err46 = {instancePath:instancePath+"/equipment",schemaPath:"#/properties/equipment/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.image_counts !== undefined){
let data14 = data.image_counts;
if(data14 && typeof data14 == "object" && !Array.isArray(data14)){
if(data14.bound === undefined){
const err47 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/required",keyword:"required",params:{missingProperty: "bound"},message:"must have required property '"+"bound"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data14.not_produced === undefined){
const err48 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/required",keyword:"required",params:{missingProperty: "not_produced"},message:"must have required property '"+"not_produced"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data14.total === undefined){
const err49 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/required",keyword:"required",params:{missingProperty: "total"},message:"must have required property '"+"total"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
for(const key3 in data14){
if(!(((key3 === "bound") || (key3 === "not_produced")) || (key3 === "total"))){
const err50 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data14.bound !== undefined){
let data15 = data14.bound;
if(!(((typeof data15 == "number") && (!(data15 % 1) && !isNaN(data15))) && (isFinite(data15)))){
const err51 = {instancePath:instancePath+"/image_counts/bound",schemaPath:"#/$defs/imageCounts/properties/bound/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if((typeof data15 == "number") && (isFinite(data15))){
if(data15 < 0 || isNaN(data15)){
const err52 = {instancePath:instancePath+"/image_counts/bound",schemaPath:"#/$defs/imageCounts/properties/bound/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
}
if(data14.not_produced !== undefined){
let data16 = data14.not_produced;
if(!(((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16))) && (isFinite(data16)))){
const err53 = {instancePath:instancePath+"/image_counts/not_produced",schemaPath:"#/$defs/imageCounts/properties/not_produced/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if((typeof data16 == "number") && (isFinite(data16))){
if(data16 < 0 || isNaN(data16)){
const err54 = {instancePath:instancePath+"/image_counts/not_produced",schemaPath:"#/$defs/imageCounts/properties/not_produced/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
if(data14.total !== undefined){
let data17 = data14.total;
if(!(((typeof data17 == "number") && (!(data17 % 1) && !isNaN(data17))) && (isFinite(data17)))){
const err55 = {instancePath:instancePath+"/image_counts/total",schemaPath:"#/$defs/imageCounts/properties/total/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if((typeof data17 == "number") && (isFinite(data17))){
if(data17 < 0 || isNaN(data17)){
const err56 = {instancePath:instancePath+"/image_counts/total",schemaPath:"#/$defs/imageCounts/properties/total/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
}
else {
const err57 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data.profiles !== undefined){
if(!(validate123(data.profiles, {instancePath:instancePath+"/profiles",parentData:data,parentDataProperty:"profiles",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate123.errors : vErrors.concat(validate123.errors);
errors = vErrors.length;
}
}
if(data.query !== undefined){
if(!(validate125(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate125.errors : vErrors.concat(validate125.errors);
errors = vErrors.length;
}
}
if(data.response_kind !== undefined){
if("CATALOG_QUERY_BOOTSTRAP" !== data.response_kind){
const err58 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "CATALOG_QUERY_BOOTSTRAP"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data.snapshot !== undefined){
if(!(validate127(data.snapshot, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate127.errors : vErrors.concat(validate127.errors);
errors = vErrors.length;
}
}
}
else {
const err59 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
validate122.errors = vErrors;
return errors === 0;
}
validate122.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema217 = {"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"members":{"items":{"$ref":"#/$defs/seriesMember"},"maxItems":60,"type":"array"},"next_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"previous_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"profiles":{"$ref":"#/$defs/profiles"},"query":{"$ref":"#/$defs/seriesQuery"},"response_kind":{"const":"CATALOG_QUERY_SERIES"},"snapshot":{"$ref":"#/$defs/snapshot"},"total_matching_series":{"minimum":0,"type":"integer"}},"required":["api_contract","api_version","members","next_cursor","previous_cursor","profiles","query","response_kind","snapshot","total_matching_series"],"type":"object"};
const schema218 = {"additionalProperties":false,"properties":{"base_item_code":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"category_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"equipment_model_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"matched_member_count":{"minimum":1,"type":"integer"},"rarity":{"oneOf":[{"enum":["COVERT","CLASSIFIED","RESTRICTED","MIL_SPEC","INDUSTRIAL","CONSUMER","EXTRAORDINARY","CONTRABAND"]},{"type":"null"}]},"representative":{"$ref":"#/$defs/member"}},"required":["base_item_code","category_id","equipment_model_id","item_kind","matched_member_count","rarity","representative"],"type":"object"};
const schema219 = {"additionalProperties":false,"properties":{"projection":{"$ref":"#/$defs/projection"},"storage":{"additionalProperties":false,"properties":{"available_at":{"$ref":"#/$defs/timestamp"},"valid_to":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]}},"required":["available_at","valid_to"],"type":"object"}},"required":["projection","storage"],"type":"object"};
const schema220 = {"additionalProperties":false,"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"base_item_code":{"$ref":"#/$defs/identifier"},"catalog_version":{"maxLength":128,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/localizedName"},"media":{"$ref":"#/$defs/media"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"projection_hash":{"pattern":"^[0-9a-f]{64}$","type":"string"},"valid_from":{"$ref":"#/$defs/timestamp"},"version_context":{"$ref":"#/$defs/versionContext"},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]}},"required":["analysis_unit_id","analysis_unit_kind","base_item_code","catalog_version","edition_kind","item_kind","localized_name","media","parent_analysis_unit_id","projection_hash","valid_from","version_context","wear_tier"],"type":"object"};
const schema221 = {"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"};
const schema223 = {"additionalProperties":false,"properties":{"authority":{"enum":["VALVE_STEAM","MARKET_D","MARKET_B"]},"en":{"maxLength":512,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"zh_cn":{"maxLength":512,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"}},"required":["authority","en","zh_cn"],"type":"object"};
const schema224 = {"oneOf":[{"$ref":"#/$defs/mediaNotProduced"},{"$ref":"#/$defs/mediaBound"}]};
const schema225 = {"additionalProperties":false,"properties":{"status":{"const":"NOT_PRODUCED"}},"required":["status"],"type":"object"};
const schema226 = {"additionalProperties":false,"properties":{"media_key":{"maxLength":256,"not":{"pattern":"(^|/)\\.{1,2}(/|$)"},"pattern":"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$","type":"string"},"presentation_kind":{"enum":["SERIES_REPRESENTATIVE","STYLE_REPRESENTATIVE"]},"status":{"const":"BOUND"}},"required":["status","media_key","presentation_kind"],"type":"object"};
const pattern94 = new RegExp("(^|/)\\.{1,2}(/|$)", "u");
const pattern95 = new RegExp("^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$", "u");

function validate134(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate134.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err0 = {instancePath,schemaPath:"#/$defs/mediaNotProduced/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "status")){
const err1 = {instancePath,schemaPath:"#/$defs/mediaNotProduced/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.status !== undefined){
if("NOT_PRODUCED" !== data.status){
const err2 = {instancePath:instancePath+"/status",schemaPath:"#/$defs/mediaNotProduced/properties/status/const",keyword:"const",params:{allowedValue: "NOT_PRODUCED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
}
else {
const err3 = {instancePath,schemaPath:"#/$defs/mediaNotProduced/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs6 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err4 = {instancePath,schemaPath:"#/$defs/mediaBound/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.media_key === undefined){
const err5 = {instancePath,schemaPath:"#/$defs/mediaBound/required",keyword:"required",params:{missingProperty: "media_key"},message:"must have required property '"+"media_key"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.presentation_kind === undefined){
const err6 = {instancePath,schemaPath:"#/$defs/mediaBound/required",keyword:"required",params:{missingProperty: "presentation_kind"},message:"must have required property '"+"presentation_kind"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key1 in data){
if(!(((key1 === "media_key") || (key1 === "presentation_kind")) || (key1 === "status"))){
const err7 = {instancePath,schemaPath:"#/$defs/mediaBound/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.media_key !== undefined){
let data1 = data.media_key;
const _errs12 = errors;
const _errs13 = errors;
if(typeof data1 === "string"){
if(!pattern94.test(data1)){
const err8 = {};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
var valid5 = _errs13 === errors;
if(valid5){
const err9 = {instancePath:instancePath+"/media_key",schemaPath:"#/$defs/mediaBound/properties/media_key/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
else {
errors = _errs12;
if(vErrors !== null){
if(_errs12){
vErrors.length = _errs12;
}
else {
vErrors = null;
}
}
}
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err10 = {instancePath:instancePath+"/media_key",schemaPath:"#/$defs/mediaBound/properties/media_key/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern95.test(data1)){
const err11 = {instancePath:instancePath+"/media_key",schemaPath:"#/$defs/mediaBound/properties/media_key/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$"},message:"must match pattern \""+"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/media_key",schemaPath:"#/$defs/mediaBound/properties/media_key/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.presentation_kind !== undefined){
let data2 = data.presentation_kind;
if(!((data2 === "SERIES_REPRESENTATIVE") || (data2 === "STYLE_REPRESENTATIVE"))){
const err13 = {instancePath:instancePath+"/presentation_kind",schemaPath:"#/$defs/mediaBound/properties/presentation_kind/enum",keyword:"enum",params:{allowedValues: schema226.properties.presentation_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.status !== undefined){
if("BOUND" !== data.status){
const err14 = {instancePath:instancePath+"/status",schemaPath:"#/$defs/mediaBound/properties/status/const",keyword:"const",params:{allowedValue: "BOUND"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
else {
const err15 = {instancePath,schemaPath:"#/$defs/mediaBound/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs6 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
}
if(!valid0){
const err16 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate134.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate134.evaluated = {"dynamicProps":true,"dynamicItems":false};

const schema229 = {"additionalProperties":false,"properties":{"analysis_unit_version_id":{"$ref":"#/$defs/versionId"},"item_variant_version_id":{"$ref":"#/$defs/versionId"},"media_asset_version_id":{"oneOf":[{"$ref":"#/$defs/versionId"},{"type":"null"}]},"name_en_version_id":{"$ref":"#/$defs/versionId"},"name_zh_cn_version_id":{"$ref":"#/$defs/versionId"}},"required":["analysis_unit_version_id","item_variant_version_id","media_asset_version_id","name_en_version_id","name_zh_cn_version_id"],"type":"object"};
const schema230 = {"pattern":"^[1-9][0-9]*$","type":"string"};
const pattern97 = new RegExp("^[1-9][0-9]*$", "u");

function validate136(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate136.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.analysis_unit_version_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_version_id"},message:"must have required property '"+"analysis_unit_version_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.item_variant_version_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "item_variant_version_id"},message:"must have required property '"+"item_variant_version_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.media_asset_version_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_asset_version_id"},message:"must have required property '"+"media_asset_version_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.name_en_version_id === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name_en_version_id"},message:"must have required property '"+"name_en_version_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.name_zh_cn_version_id === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name_zh_cn_version_id"},message:"must have required property '"+"name_zh_cn_version_id"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "analysis_unit_version_id") || (key0 === "item_variant_version_id")) || (key0 === "media_asset_version_id")) || (key0 === "name_en_version_id")) || (key0 === "name_zh_cn_version_id"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.analysis_unit_version_id !== undefined){
let data0 = data.analysis_unit_version_id;
if(typeof data0 === "string"){
if(!pattern97.test(data0)){
const err6 = {instancePath:instancePath+"/analysis_unit_version_id",schemaPath:"#/$defs/versionId/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]*$"},message:"must match pattern \""+"^[1-9][0-9]*$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/analysis_unit_version_id",schemaPath:"#/$defs/versionId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.item_variant_version_id !== undefined){
let data1 = data.item_variant_version_id;
if(typeof data1 === "string"){
if(!pattern97.test(data1)){
const err8 = {instancePath:instancePath+"/item_variant_version_id",schemaPath:"#/$defs/versionId/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]*$"},message:"must match pattern \""+"^[1-9][0-9]*$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/item_variant_version_id",schemaPath:"#/$defs/versionId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.media_asset_version_id !== undefined){
let data2 = data.media_asset_version_id;
const _errs9 = errors;
let valid3 = false;
let passing0 = null;
const _errs10 = errors;
if(typeof data2 === "string"){
if(!pattern97.test(data2)){
const err10 = {instancePath:instancePath+"/media_asset_version_id",schemaPath:"#/$defs/versionId/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]*$"},message:"must match pattern \""+"^[1-9][0-9]*$"+"\""};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
else {
const err11 = {instancePath:instancePath+"/media_asset_version_id",schemaPath:"#/$defs/versionId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs10 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs13 = errors;
if(data2 !== null){
const err12 = {instancePath:instancePath+"/media_asset_version_id",schemaPath:"#/properties/media_asset_version_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
var _valid0 = _errs13 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
}
}
if(!valid3){
const err13 = {instancePath:instancePath+"/media_asset_version_id",schemaPath:"#/properties/media_asset_version_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
errors = _errs9;
if(vErrors !== null){
if(_errs9){
vErrors.length = _errs9;
}
else {
vErrors = null;
}
}
}
}
if(data.name_en_version_id !== undefined){
let data3 = data.name_en_version_id;
if(typeof data3 === "string"){
if(!pattern97.test(data3)){
const err14 = {instancePath:instancePath+"/name_en_version_id",schemaPath:"#/$defs/versionId/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]*$"},message:"must match pattern \""+"^[1-9][0-9]*$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/name_en_version_id",schemaPath:"#/$defs/versionId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.name_zh_cn_version_id !== undefined){
let data4 = data.name_zh_cn_version_id;
if(typeof data4 === "string"){
if(!pattern97.test(data4)){
const err16 = {instancePath:instancePath+"/name_zh_cn_version_id",schemaPath:"#/$defs/versionId/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]*$"},message:"must match pattern \""+"^[1-9][0-9]*$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
else {
const err17 = {instancePath:instancePath+"/name_zh_cn_version_id",schemaPath:"#/$defs/versionId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate136.errors = vErrors;
return errors === 0;
}
validate136.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate133(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate133.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.analysis_unit_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.analysis_unit_kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_kind"},message:"must have required property '"+"analysis_unit_kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.base_item_code === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "base_item_code"},message:"must have required property '"+"base_item_code"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.catalog_version === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_version"},message:"must have required property '"+"catalog_version"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.edition_kind === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "edition_kind"},message:"must have required property '"+"edition_kind"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.item_kind === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "item_kind"},message:"must have required property '"+"item_kind"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.localized_name === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "localized_name"},message:"must have required property '"+"localized_name"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.media === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media"},message:"must have required property '"+"media"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.parent_analysis_unit_id === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parent_analysis_unit_id"},message:"must have required property '"+"parent_analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.projection_hash === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "projection_hash"},message:"must have required property '"+"projection_hash"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.valid_from === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "valid_from"},message:"must have required property '"+"valid_from"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.version_context === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version_context"},message:"must have required property '"+"version_context"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.wear_tier === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "wear_tier"},message:"must have required property '"+"wear_tier"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema220.properties, key0))){
const err13 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data0 = data.analysis_unit_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err14 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(func2(data0) < 1){
const err15 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!pattern87.test(data0)){
const err16 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
else {
const err17 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.analysis_unit_kind !== undefined){
let data1 = data.analysis_unit_kind;
if(!(((data1 === "BASE_MHN") || (data1 === "STYLE_VARIANT")) || (data1 === "PATTERN_VARIANT"))){
const err18 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema220.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.base_item_code !== undefined){
let data2 = data.base_item_code;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err19 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(func2(data2) < 1){
const err20 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!pattern87.test(data2)){
const err21 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
else {
const err22 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.catalog_version !== undefined){
let data3 = data.catalog_version;
if(typeof data3 === "string"){
if(func2(data3) > 128){
const err23 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(func2(data3) < 1){
const err24 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!pattern87.test(data3)){
const err25 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
else {
const err26 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.edition_kind !== undefined){
let data4 = data.edition_kind;
if(!((((data4 === "STANDARD") || (data4 === "STATTRAK")) || (data4 === "SOUVENIR")) || (data4 === "UNKNOWN"))){
const err27 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema220.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.item_kind !== undefined){
let data5 = data.item_kind;
if(!((((((data5 === "WEAPON") || (data5 === "KNIFE")) || (data5 === "GLOVE")) || (data5 === "AGENT")) || (data5 === "OTHER")) || (data5 === "UNKNOWN"))){
const err28 = {instancePath:instancePath+"/item_kind",schemaPath:"#/properties/item_kind/enum",keyword:"enum",params:{allowedValues: schema220.properties.item_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.localized_name !== undefined){
let data6 = data.localized_name;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.authority === undefined){
const err29 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/required",keyword:"required",params:{missingProperty: "authority"},message:"must have required property '"+"authority"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data6.en === undefined){
const err30 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/required",keyword:"required",params:{missingProperty: "en"},message:"must have required property '"+"en"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data6.zh_cn === undefined){
const err31 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/required",keyword:"required",params:{missingProperty: "zh_cn"},message:"must have required property '"+"zh_cn"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
for(const key1 in data6){
if(!(((key1 === "authority") || (key1 === "en")) || (key1 === "zh_cn"))){
const err32 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data6.authority !== undefined){
let data7 = data6.authority;
if(!(((data7 === "VALVE_STEAM") || (data7 === "MARKET_D")) || (data7 === "MARKET_B"))){
const err33 = {instancePath:instancePath+"/localized_name/authority",schemaPath:"#/$defs/localizedName/properties/authority/enum",keyword:"enum",params:{allowedValues: schema223.properties.authority.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data6.en !== undefined){
let data8 = data6.en;
if(typeof data8 === "string"){
if(func2(data8) > 512){
const err34 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/localizedName/properties/en/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(func2(data8) < 1){
const err35 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/localizedName/properties/en/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(!pattern87.test(data8)){
const err36 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/localizedName/properties/en/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
else {
const err37 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/localizedName/properties/en/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data6.zh_cn !== undefined){
let data9 = data6.zh_cn;
if(typeof data9 === "string"){
if(func2(data9) > 512){
const err38 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/localizedName/properties/zh_cn/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(func2(data9) < 1){
const err39 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/localizedName/properties/zh_cn/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(!pattern87.test(data9)){
const err40 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/localizedName/properties/zh_cn/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
else {
const err41 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/localizedName/properties/zh_cn/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
}
else {
const err42 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.media !== undefined){
if(!(validate134(data.media, {instancePath:instancePath+"/media",parentData:data,parentDataProperty:"media",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate134.errors : vErrors.concat(validate134.errors);
errors = vErrors.length;
}
}
if(data.parent_analysis_unit_id !== undefined){
let data11 = data.parent_analysis_unit_id;
const _errs24 = errors;
let valid5 = false;
let passing0 = null;
const _errs25 = errors;
if(typeof data11 === "string"){
if(func2(data11) > 256){
const err43 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(func2(data11) < 1){
const err44 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(!pattern87.test(data11)){
const err45 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
else {
const err46 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
var _valid0 = _errs25 === errors;
if(_valid0){
valid5 = true;
passing0 = 0;
}
const _errs28 = errors;
if(data11 !== null){
const err47 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
var _valid0 = _errs28 === errors;
if(_valid0 && valid5){
valid5 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid5 = true;
passing0 = 1;
}
}
if(!valid5){
const err48 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
else {
errors = _errs24;
if(vErrors !== null){
if(_errs24){
vErrors.length = _errs24;
}
else {
vErrors = null;
}
}
}
}
if(data.projection_hash !== undefined){
let data12 = data.projection_hash;
if(typeof data12 === "string"){
if(!pattern5.test(data12)){
const err49 = {instancePath:instancePath+"/projection_hash",schemaPath:"#/properties/projection_hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
else {
const err50 = {instancePath:instancePath+"/projection_hash",schemaPath:"#/properties/projection_hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data.valid_from !== undefined){
let data13 = data.valid_from;
if(typeof data13 === "string"){
if(!pattern19.test(data13)){
const err51 = {instancePath:instancePath+"/valid_from",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
else {
const err52 = {instancePath:instancePath+"/valid_from",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data.version_context !== undefined){
if(!(validate136(data.version_context, {instancePath:instancePath+"/version_context",parentData:data,parentDataProperty:"version_context",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate136.errors : vErrors.concat(validate136.errors);
errors = vErrors.length;
}
}
if(data.wear_tier !== undefined){
let data15 = data.wear_tier;
if(!(((((((data15 === "FACTORY_NEW") || (data15 === "MINIMAL_WEAR")) || (data15 === "FIELD_TESTED")) || (data15 === "WELL_WORN")) || (data15 === "BATTLE_SCARRED")) || (data15 === "NOT_APPLICABLE")) || (data15 === "UNKNOWN"))){
const err53 = {instancePath:instancePath+"/wear_tier",schemaPath:"#/properties/wear_tier/enum",keyword:"enum",params:{allowedValues: schema220.properties.wear_tier.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
}
else {
const err54 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
validate133.errors = vErrors;
return errors === 0;
}
validate133.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate132(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate132.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.projection === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "projection"},message:"must have required property '"+"projection"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.storage === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "storage"},message:"must have required property '"+"storage"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "projection") || (key0 === "storage"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.projection !== undefined){
if(!(validate133(data.projection, {instancePath:instancePath+"/projection",parentData:data,parentDataProperty:"projection",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate133.errors : vErrors.concat(validate133.errors);
errors = vErrors.length;
}
}
if(data.storage !== undefined){
let data1 = data.storage;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.available_at === undefined){
const err3 = {instancePath:instancePath+"/storage",schemaPath:"#/properties/storage/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data1.valid_to === undefined){
const err4 = {instancePath:instancePath+"/storage",schemaPath:"#/properties/storage/required",keyword:"required",params:{missingProperty: "valid_to"},message:"must have required property '"+"valid_to"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key1 in data1){
if(!((key1 === "available_at") || (key1 === "valid_to"))){
const err5 = {instancePath:instancePath+"/storage",schemaPath:"#/properties/storage/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data1.available_at !== undefined){
let data2 = data1.available_at;
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
const err6 = {instancePath:instancePath+"/storage/available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/storage/available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data1.valid_to !== undefined){
let data3 = data1.valid_to;
const _errs10 = errors;
let valid3 = false;
let passing0 = null;
const _errs11 = errors;
if(typeof data3 === "string"){
if(!pattern19.test(data3)){
const err8 = {instancePath:instancePath+"/storage/valid_to",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/storage/valid_to",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid0 = _errs11 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs14 = errors;
if(data3 !== null){
const err10 = {instancePath:instancePath+"/storage/valid_to",schemaPath:"#/properties/storage/properties/valid_to/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs14 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
}
}
if(!valid3){
const err11 = {instancePath:instancePath+"/storage/valid_to",schemaPath:"#/properties/storage/properties/valid_to/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
else {
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err12 = {instancePath:instancePath+"/storage",schemaPath:"#/properties/storage/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
else {
const err13 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
validate132.errors = vErrors;
return errors === 0;
}
validate132.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate131(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate131.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.base_item_code === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "base_item_code"},message:"must have required property '"+"base_item_code"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.category_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "category_id"},message:"must have required property '"+"category_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.equipment_model_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "equipment_model_id"},message:"must have required property '"+"equipment_model_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.item_kind === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "item_kind"},message:"must have required property '"+"item_kind"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.matched_member_count === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "matched_member_count"},message:"must have required property '"+"matched_member_count"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.rarity === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rarity"},message:"must have required property '"+"rarity"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.representative === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "representative"},message:"must have required property '"+"representative"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "base_item_code") || (key0 === "category_id")) || (key0 === "equipment_model_id")) || (key0 === "item_kind")) || (key0 === "matched_member_count")) || (key0 === "rarity")) || (key0 === "representative"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.base_item_code !== undefined){
let data0 = data.base_item_code;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err8 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data0) < 1){
const err9 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern87.test(data0)){
const err10 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
else {
const err11 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.category_id !== undefined){
let data1 = data.category_id;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err12 = {instancePath:instancePath+"/category_id",schemaPath:"#/properties/category_id/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func2(data1) < 1){
const err13 = {instancePath:instancePath+"/category_id",schemaPath:"#/properties/category_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern87.test(data1)){
const err14 = {instancePath:instancePath+"/category_id",schemaPath:"#/properties/category_id/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/category_id",schemaPath:"#/properties/category_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.equipment_model_id !== undefined){
let data2 = data.equipment_model_id;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err16 = {instancePath:instancePath+"/equipment_model_id",schemaPath:"#/properties/equipment_model_id/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(func2(data2) < 1){
const err17 = {instancePath:instancePath+"/equipment_model_id",schemaPath:"#/properties/equipment_model_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!pattern87.test(data2)){
const err18 = {instancePath:instancePath+"/equipment_model_id",schemaPath:"#/properties/equipment_model_id/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/equipment_model_id",schemaPath:"#/properties/equipment_model_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.item_kind !== undefined){
let data3 = data.item_kind;
if(!((((((data3 === "WEAPON") || (data3 === "KNIFE")) || (data3 === "GLOVE")) || (data3 === "AGENT")) || (data3 === "OTHER")) || (data3 === "UNKNOWN"))){
const err20 = {instancePath:instancePath+"/item_kind",schemaPath:"#/properties/item_kind/enum",keyword:"enum",params:{allowedValues: schema218.properties.item_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.matched_member_count !== undefined){
let data4 = data.matched_member_count;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err21 = {instancePath:instancePath+"/matched_member_count",schemaPath:"#/properties/matched_member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 < 1 || isNaN(data4)){
const err22 = {instancePath:instancePath+"/matched_member_count",schemaPath:"#/properties/matched_member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
}
if(data.rarity !== undefined){
let data5 = data.rarity;
const _errs12 = errors;
let valid1 = false;
let passing0 = null;
const _errs13 = errors;
if(!((((((((data5 === "COVERT") || (data5 === "CLASSIFIED")) || (data5 === "RESTRICTED")) || (data5 === "MIL_SPEC")) || (data5 === "INDUSTRIAL")) || (data5 === "CONSUMER")) || (data5 === "EXTRAORDINARY")) || (data5 === "CONTRABAND"))){
const err23 = {instancePath:instancePath+"/rarity",schemaPath:"#/properties/rarity/oneOf/0/enum",keyword:"enum",params:{allowedValues: schema218.properties.rarity.oneOf[0].enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
var _valid0 = _errs13 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs14 = errors;
if(data5 !== null){
const err24 = {instancePath:instancePath+"/rarity",schemaPath:"#/properties/rarity/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
var _valid0 = _errs14 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
}
if(!valid1){
const err25 = {instancePath:instancePath+"/rarity",schemaPath:"#/properties/rarity/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
else {
errors = _errs12;
if(vErrors !== null){
if(_errs12){
vErrors.length = _errs12;
}
else {
vErrors = null;
}
}
}
}
if(data.representative !== undefined){
if(!(validate132(data.representative, {instancePath:instancePath+"/representative",parentData:data,parentDataProperty:"representative",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate132.errors : vErrors.concat(validate132.errors);
errors = vErrors.length;
}
}
}
else {
const err26 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
validate131.errors = vErrors;
return errors === 0;
}
validate131.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema237 = {"additionalProperties":false,"properties":{"discovery_seed":{"pattern":"^[A-Za-z0-9._-]{1,128}$","type":"string"},"equipment_selection_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"item_category":{"oneOf":[{"enum":["NORMAL","STATTRAK","SOUVENIR","STAR","STAR_STATTRAK"]},{"type":"null"}]},"locale":{"enum":["en","zh_cn"]},"page_size":{"maximum":60,"minimum":1,"type":"integer"},"rarity":{"oneOf":[{"enum":["COVERT","CLASSIFIED","RESTRICTED","MIL_SPEC","INDUSTRIAL","CONSUMER","EXTRAORDINARY","CONTRABAND"]},{"type":"null"}]},"search_normalized":{"oneOf":[{"maxLength":4096,"minLength":1,"type":"string"},{"type":"null"}]},"search_text":{"oneOf":[{"maxLength":128,"minLength":1,"type":"string"},{"type":"null"}]},"snapshot_id":{"$ref":"#/$defs/sha256"},"sort":{"enum":["NAME_ASC","PRODUCT","DISCOVERY"]},"wear_tier":{"oneOf":[{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},{"type":"null"}]}},"required":["equipment_selection_id","item_category","locale","page_size","rarity","search_normalized","search_text","snapshot_id","sort","wear_tier"],"type":"object"};
const pattern148 = new RegExp("^[A-Za-z0-9._-]{1,128}$", "u");

function validate142(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate142.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.equipment_selection_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "equipment_selection_id"},message:"must have required property '"+"equipment_selection_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.item_category === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "item_category"},message:"must have required property '"+"item_category"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.locale === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "locale"},message:"must have required property '"+"locale"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.page_size === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.rarity === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rarity"},message:"must have required property '"+"rarity"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.search_normalized === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "search_normalized"},message:"must have required property '"+"search_normalized"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.search_text === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "search_text"},message:"must have required property '"+"search_text"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.snapshot_id === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.sort === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sort"},message:"must have required property '"+"sort"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.wear_tier === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "wear_tier"},message:"must have required property '"+"wear_tier"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema237.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.discovery_seed !== undefined){
let data0 = data.discovery_seed;
if(typeof data0 === "string"){
if(!pattern148.test(data0)){
const err11 = {instancePath:instancePath+"/discovery_seed",schemaPath:"#/properties/discovery_seed/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9._-]{1,128}$"},message:"must match pattern \""+"^[A-Za-z0-9._-]{1,128}$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/discovery_seed",schemaPath:"#/properties/discovery_seed/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.equipment_selection_id !== undefined){
let data1 = data.equipment_selection_id;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err13 = {instancePath:instancePath+"/equipment_selection_id",schemaPath:"#/properties/equipment_selection_id/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data1) < 1){
const err14 = {instancePath:instancePath+"/equipment_selection_id",schemaPath:"#/properties/equipment_selection_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern87.test(data1)){
const err15 = {instancePath:instancePath+"/equipment_selection_id",schemaPath:"#/properties/equipment_selection_id/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
else {
const err16 = {instancePath:instancePath+"/equipment_selection_id",schemaPath:"#/properties/equipment_selection_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.item_category !== undefined){
let data2 = data.item_category;
const _errs7 = errors;
let valid1 = false;
let passing0 = null;
const _errs8 = errors;
if(!(((((data2 === "NORMAL") || (data2 === "STATTRAK")) || (data2 === "SOUVENIR")) || (data2 === "STAR")) || (data2 === "STAR_STATTRAK"))){
const err17 = {instancePath:instancePath+"/item_category",schemaPath:"#/properties/item_category/oneOf/0/enum",keyword:"enum",params:{allowedValues: schema237.properties.item_category.oneOf[0].enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
var _valid0 = _errs8 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs9 = errors;
if(data2 !== null){
const err18 = {instancePath:instancePath+"/item_category",schemaPath:"#/properties/item_category/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid0 = _errs9 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
}
if(!valid1){
const err19 = {instancePath:instancePath+"/item_category",schemaPath:"#/properties/item_category/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
else {
errors = _errs7;
if(vErrors !== null){
if(_errs7){
vErrors.length = _errs7;
}
else {
vErrors = null;
}
}
}
}
if(data.locale !== undefined){
let data3 = data.locale;
if(!((data3 === "en") || (data3 === "zh_cn"))){
const err20 = {instancePath:instancePath+"/locale",schemaPath:"#/properties/locale/enum",keyword:"enum",params:{allowedValues: schema237.properties.locale.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.page_size !== undefined){
let data4 = data.page_size;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err21 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 60 || isNaN(data4)){
const err22 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 60},message:"must be <= 60"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data4 < 1 || isNaN(data4)){
const err23 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
if(data.rarity !== undefined){
let data5 = data.rarity;
const _errs15 = errors;
let valid2 = false;
let passing1 = null;
const _errs16 = errors;
if(!((((((((data5 === "COVERT") || (data5 === "CLASSIFIED")) || (data5 === "RESTRICTED")) || (data5 === "MIL_SPEC")) || (data5 === "INDUSTRIAL")) || (data5 === "CONSUMER")) || (data5 === "EXTRAORDINARY")) || (data5 === "CONTRABAND"))){
const err24 = {instancePath:instancePath+"/rarity",schemaPath:"#/properties/rarity/oneOf/0/enum",keyword:"enum",params:{allowedValues: schema237.properties.rarity.oneOf[0].enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
var _valid1 = _errs16 === errors;
if(_valid1){
valid2 = true;
passing1 = 0;
}
const _errs17 = errors;
if(data5 !== null){
const err25 = {instancePath:instancePath+"/rarity",schemaPath:"#/properties/rarity/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
var _valid1 = _errs17 === errors;
if(_valid1 && valid2){
valid2 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid2 = true;
passing1 = 1;
}
}
if(!valid2){
const err26 = {instancePath:instancePath+"/rarity",schemaPath:"#/properties/rarity/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
else {
errors = _errs15;
if(vErrors !== null){
if(_errs15){
vErrors.length = _errs15;
}
else {
vErrors = null;
}
}
}
}
if(data.search_normalized !== undefined){
let data6 = data.search_normalized;
const _errs20 = errors;
let valid3 = false;
let passing2 = null;
const _errs21 = errors;
if(typeof data6 === "string"){
if(func2(data6) > 4096){
const err27 = {instancePath:instancePath+"/search_normalized",schemaPath:"#/properties/search_normalized/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(func2(data6) < 1){
const err28 = {instancePath:instancePath+"/search_normalized",schemaPath:"#/properties/search_normalized/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
else {
const err29 = {instancePath:instancePath+"/search_normalized",schemaPath:"#/properties/search_normalized/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
var _valid2 = _errs21 === errors;
if(_valid2){
valid3 = true;
passing2 = 0;
}
const _errs23 = errors;
if(data6 !== null){
const err30 = {instancePath:instancePath+"/search_normalized",schemaPath:"#/properties/search_normalized/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
var _valid2 = _errs23 === errors;
if(_valid2 && valid3){
valid3 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid3 = true;
passing2 = 1;
}
}
if(!valid3){
const err31 = {instancePath:instancePath+"/search_normalized",schemaPath:"#/properties/search_normalized/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
else {
errors = _errs20;
if(vErrors !== null){
if(_errs20){
vErrors.length = _errs20;
}
else {
vErrors = null;
}
}
}
}
if(data.search_text !== undefined){
let data7 = data.search_text;
const _errs26 = errors;
let valid4 = false;
let passing3 = null;
const _errs27 = errors;
if(typeof data7 === "string"){
if(func2(data7) > 128){
const err32 = {instancePath:instancePath+"/search_text",schemaPath:"#/properties/search_text/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(func2(data7) < 1){
const err33 = {instancePath:instancePath+"/search_text",schemaPath:"#/properties/search_text/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
else {
const err34 = {instancePath:instancePath+"/search_text",schemaPath:"#/properties/search_text/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
var _valid3 = _errs27 === errors;
if(_valid3){
valid4 = true;
passing3 = 0;
}
const _errs29 = errors;
if(data7 !== null){
const err35 = {instancePath:instancePath+"/search_text",schemaPath:"#/properties/search_text/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
var _valid3 = _errs29 === errors;
if(_valid3 && valid4){
valid4 = false;
passing3 = [passing3, 1];
}
else {
if(_valid3){
valid4 = true;
passing3 = 1;
}
}
if(!valid4){
const err36 = {instancePath:instancePath+"/search_text",schemaPath:"#/properties/search_text/oneOf",keyword:"oneOf",params:{passingSchemas: passing3},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
else {
errors = _errs26;
if(vErrors !== null){
if(_errs26){
vErrors.length = _errs26;
}
else {
vErrors = null;
}
}
}
}
if(data.snapshot_id !== undefined){
let data8 = data.snapshot_id;
if(typeof data8 === "string"){
if(!pattern5.test(data8)){
const err37 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
else {
const err38 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.sort !== undefined){
let data9 = data.sort;
if(!(((data9 === "NAME_ASC") || (data9 === "PRODUCT")) || (data9 === "DISCOVERY"))){
const err39 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/enum",keyword:"enum",params:{allowedValues: schema237.properties.sort.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data.wear_tier !== undefined){
let data10 = data.wear_tier;
const _errs36 = errors;
let valid6 = false;
let passing4 = null;
const _errs37 = errors;
if(!(((((((data10 === "FACTORY_NEW") || (data10 === "MINIMAL_WEAR")) || (data10 === "FIELD_TESTED")) || (data10 === "WELL_WORN")) || (data10 === "BATTLE_SCARRED")) || (data10 === "NOT_APPLICABLE")) || (data10 === "UNKNOWN"))){
const err40 = {instancePath:instancePath+"/wear_tier",schemaPath:"#/properties/wear_tier/oneOf/0/enum",keyword:"enum",params:{allowedValues: schema237.properties.wear_tier.oneOf[0].enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
var _valid4 = _errs37 === errors;
if(_valid4){
valid6 = true;
passing4 = 0;
}
const _errs38 = errors;
if(data10 !== null){
const err41 = {instancePath:instancePath+"/wear_tier",schemaPath:"#/properties/wear_tier/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
var _valid4 = _errs38 === errors;
if(_valid4 && valid6){
valid6 = false;
passing4 = [passing4, 1];
}
else {
if(_valid4){
valid6 = true;
passing4 = 1;
}
}
if(!valid6){
const err42 = {instancePath:instancePath+"/wear_tier",schemaPath:"#/properties/wear_tier/oneOf",keyword:"oneOf",params:{passingSchemas: passing4},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
else {
errors = _errs36;
if(vErrors !== null){
if(_errs36){
vErrors.length = _errs36;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err43 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
validate142.errors = vErrors;
return errors === 0;
}
validate142.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const pattern73 = new RegExp("^[A-Za-z0-9_-]+$", "u");

function validate130(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate130.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.api_contract === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "api_contract"},message:"must have required property '"+"api_contract"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.api_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "api_version"},message:"must have required property '"+"api_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.members === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.next_cursor === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.previous_cursor === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "previous_cursor"},message:"must have required property '"+"previous_cursor"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.profiles === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "profiles"},message:"must have required property '"+"profiles"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.query === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.response_kind === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.snapshot === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.total_matching_series === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "total_matching_series"},message:"must have required property '"+"total_matching_series"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema217.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.api_contract !== undefined){
if("catalog-display-query-api" !== data.api_contract){
const err11 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "catalog-display-query-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err12 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.members !== undefined){
let data2 = data.members;
if(Array.isArray(data2)){
if(data2.length > 60){
const err13 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 60},message:"must NOT have more than 60 items"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
if(!(validate131(data2[i0], {instancePath:instancePath+"/members/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate131.errors : vErrors.concat(validate131.errors);
errors = vErrors.length;
}
}
}
else {
const err14 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data4 = data.next_cursor;
const _errs8 = errors;
let valid3 = false;
let passing0 = null;
const _errs9 = errors;
if(typeof data4 === "string"){
if(func2(data4) > 512){
const err15 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(func2(data4) < 1){
const err16 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern73.test(data4)){
const err17 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
else {
const err18 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid0 = _errs9 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs11 = errors;
if(data4 !== null){
const err19 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid0 = _errs11 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
}
}
if(!valid3){
const err20 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
else {
errors = _errs8;
if(vErrors !== null){
if(_errs8){
vErrors.length = _errs8;
}
else {
vErrors = null;
}
}
}
}
if(data.previous_cursor !== undefined){
let data5 = data.previous_cursor;
const _errs14 = errors;
let valid4 = false;
let passing1 = null;
const _errs15 = errors;
if(typeof data5 === "string"){
if(func2(data5) > 512){
const err21 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(func2(data5) < 1){
const err22 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!pattern73.test(data5)){
const err23 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
else {
const err24 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
var _valid1 = _errs15 === errors;
if(_valid1){
valid4 = true;
passing1 = 0;
}
const _errs17 = errors;
if(data5 !== null){
const err25 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
var _valid1 = _errs17 === errors;
if(_valid1 && valid4){
valid4 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid4 = true;
passing1 = 1;
}
}
if(!valid4){
const err26 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
else {
errors = _errs14;
if(vErrors !== null){
if(_errs14){
vErrors.length = _errs14;
}
else {
vErrors = null;
}
}
}
}
if(data.profiles !== undefined){
if(!(validate123(data.profiles, {instancePath:instancePath+"/profiles",parentData:data,parentDataProperty:"profiles",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate123.errors : vErrors.concat(validate123.errors);
errors = vErrors.length;
}
}
if(data.query !== undefined){
if(!(validate142(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate142.errors : vErrors.concat(validate142.errors);
errors = vErrors.length;
}
}
if(data.response_kind !== undefined){
if("CATALOG_QUERY_SERIES" !== data.response_kind){
const err27 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "CATALOG_QUERY_SERIES"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.snapshot !== undefined){
if(!(validate127(data.snapshot, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate127.errors : vErrors.concat(validate127.errors);
errors = vErrors.length;
}
}
if(data.total_matching_series !== undefined){
let data10 = data.total_matching_series;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err28 = {instancePath:instancePath+"/total_matching_series",schemaPath:"#/properties/total_matching_series/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 < 0 || isNaN(data10)){
const err29 = {instancePath:instancePath+"/total_matching_series",schemaPath:"#/properties/total_matching_series/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
}
else {
const err30 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
validate130.errors = vErrors;
return errors === 0;
}
validate130.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema239 = {"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"facet":{"$ref":"#/$defs/facet"},"members":{"items":{"$ref":"#/$defs/member"},"maxItems":200,"type":"array"},"next_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"previous_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"profiles":{"$ref":"#/$defs/profiles"},"query":{"$ref":"#/$defs/unitsQuery"},"response_kind":{"const":"CATALOG_QUERY_UNITS"},"snapshot":{"$ref":"#/$defs/snapshot"},"total_matching_members":{"minimum":0,"type":"integer"}},"required":["api_contract","api_version","facet","members","next_cursor","previous_cursor","profiles","query","response_kind","snapshot","total_matching_members"],"type":"object"};
const schema240 = {"additionalProperties":false,"properties":{"edition_counts":{"items":{"$ref":"#/$defs/editionCount"},"maxItems":4,"type":"array"},"eligible_member_count":{"minimum":0,"type":"integer"},"image_counts":{"$ref":"#/$defs/imageCounts"},"wear_counts":{"items":{"$ref":"#/$defs/wearCount"},"maxItems":7,"type":"array"}},"required":["edition_counts","eligible_member_count","image_counts","wear_counts"],"type":"object"};
const schema241 = {"additionalProperties":false,"properties":{"count":{"minimum":1,"type":"integer"},"value":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]}},"required":["count","value"],"type":"object"};
const schema243 = {"additionalProperties":false,"properties":{"count":{"minimum":1,"type":"integer"},"value":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]}},"required":["count","value"],"type":"object"};

function validate147(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate147.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.edition_counts === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "edition_counts"},message:"must have required property '"+"edition_counts"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.eligible_member_count === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "eligible_member_count"},message:"must have required property '"+"eligible_member_count"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.image_counts === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "image_counts"},message:"must have required property '"+"image_counts"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.wear_counts === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "wear_counts"},message:"must have required property '"+"wear_counts"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "edition_counts") || (key0 === "eligible_member_count")) || (key0 === "image_counts")) || (key0 === "wear_counts"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.edition_counts !== undefined){
let data0 = data.edition_counts;
if(Array.isArray(data0)){
if(data0.length > 4){
const err5 = {instancePath:instancePath+"/edition_counts",schemaPath:"#/properties/edition_counts/maxItems",keyword:"maxItems",params:{limit: 4},message:"must NOT have more than 4 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
let data1 = data0[i0];
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.count === undefined){
const err6 = {instancePath:instancePath+"/edition_counts/" + i0,schemaPath:"#/$defs/editionCount/required",keyword:"required",params:{missingProperty: "count"},message:"must have required property '"+"count"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data1.value === undefined){
const err7 = {instancePath:instancePath+"/edition_counts/" + i0,schemaPath:"#/$defs/editionCount/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key1 in data1){
if(!((key1 === "count") || (key1 === "value"))){
const err8 = {instancePath:instancePath+"/edition_counts/" + i0,schemaPath:"#/$defs/editionCount/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data1.count !== undefined){
let data2 = data1.count;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err9 = {instancePath:instancePath+"/edition_counts/" + i0+"/count",schemaPath:"#/$defs/editionCount/properties/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 < 1 || isNaN(data2)){
const err10 = {instancePath:instancePath+"/edition_counts/" + i0+"/count",schemaPath:"#/$defs/editionCount/properties/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
if(data1.value !== undefined){
let data3 = data1.value;
if(!((((data3 === "STANDARD") || (data3 === "STATTRAK")) || (data3 === "SOUVENIR")) || (data3 === "UNKNOWN"))){
const err11 = {instancePath:instancePath+"/edition_counts/" + i0+"/value",schemaPath:"#/$defs/editionCount/properties/value/enum",keyword:"enum",params:{allowedValues: schema241.properties.value.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath:instancePath+"/edition_counts/" + i0,schemaPath:"#/$defs/editionCount/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
else {
const err13 = {instancePath:instancePath+"/edition_counts",schemaPath:"#/properties/edition_counts/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.eligible_member_count !== undefined){
let data4 = data.eligible_member_count;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err14 = {instancePath:instancePath+"/eligible_member_count",schemaPath:"#/properties/eligible_member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 < 0 || isNaN(data4)){
const err15 = {instancePath:instancePath+"/eligible_member_count",schemaPath:"#/properties/eligible_member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
if(data.image_counts !== undefined){
let data5 = data.image_counts;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.bound === undefined){
const err16 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/required",keyword:"required",params:{missingProperty: "bound"},message:"must have required property '"+"bound"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data5.not_produced === undefined){
const err17 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/required",keyword:"required",params:{missingProperty: "not_produced"},message:"must have required property '"+"not_produced"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data5.total === undefined){
const err18 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/required",keyword:"required",params:{missingProperty: "total"},message:"must have required property '"+"total"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key2 in data5){
if(!(((key2 === "bound") || (key2 === "not_produced")) || (key2 === "total"))){
const err19 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data5.bound !== undefined){
let data6 = data5.bound;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err20 = {instancePath:instancePath+"/image_counts/bound",schemaPath:"#/$defs/imageCounts/properties/bound/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 < 0 || isNaN(data6)){
const err21 = {instancePath:instancePath+"/image_counts/bound",schemaPath:"#/$defs/imageCounts/properties/bound/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
if(data5.not_produced !== undefined){
let data7 = data5.not_produced;
if(!(((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7))) && (isFinite(data7)))){
const err22 = {instancePath:instancePath+"/image_counts/not_produced",schemaPath:"#/$defs/imageCounts/properties/not_produced/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if((typeof data7 == "number") && (isFinite(data7))){
if(data7 < 0 || isNaN(data7)){
const err23 = {instancePath:instancePath+"/image_counts/not_produced",schemaPath:"#/$defs/imageCounts/properties/not_produced/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
if(data5.total !== undefined){
let data8 = data5.total;
if(!(((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))) && (isFinite(data8)))){
const err24 = {instancePath:instancePath+"/image_counts/total",schemaPath:"#/$defs/imageCounts/properties/total/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 < 0 || isNaN(data8)){
const err25 = {instancePath:instancePath+"/image_counts/total",schemaPath:"#/$defs/imageCounts/properties/total/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
}
else {
const err26 = {instancePath:instancePath+"/image_counts",schemaPath:"#/$defs/imageCounts/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.wear_counts !== undefined){
let data9 = data.wear_counts;
if(Array.isArray(data9)){
if(data9.length > 7){
const err27 = {instancePath:instancePath+"/wear_counts",schemaPath:"#/properties/wear_counts/maxItems",keyword:"maxItems",params:{limit: 7},message:"must NOT have more than 7 items"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
const len1 = data9.length;
for(let i1=0; i1<len1; i1++){
let data10 = data9[i1];
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
if(data10.count === undefined){
const err28 = {instancePath:instancePath+"/wear_counts/" + i1,schemaPath:"#/$defs/wearCount/required",keyword:"required",params:{missingProperty: "count"},message:"must have required property '"+"count"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data10.value === undefined){
const err29 = {instancePath:instancePath+"/wear_counts/" + i1,schemaPath:"#/$defs/wearCount/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
for(const key3 in data10){
if(!((key3 === "count") || (key3 === "value"))){
const err30 = {instancePath:instancePath+"/wear_counts/" + i1,schemaPath:"#/$defs/wearCount/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data10.count !== undefined){
let data11 = data10.count;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err31 = {instancePath:instancePath+"/wear_counts/" + i1+"/count",schemaPath:"#/$defs/wearCount/properties/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 < 1 || isNaN(data11)){
const err32 = {instancePath:instancePath+"/wear_counts/" + i1+"/count",schemaPath:"#/$defs/wearCount/properties/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
}
if(data10.value !== undefined){
let data12 = data10.value;
if(!(((((((data12 === "FACTORY_NEW") || (data12 === "MINIMAL_WEAR")) || (data12 === "FIELD_TESTED")) || (data12 === "WELL_WORN")) || (data12 === "BATTLE_SCARRED")) || (data12 === "NOT_APPLICABLE")) || (data12 === "UNKNOWN"))){
const err33 = {instancePath:instancePath+"/wear_counts/" + i1+"/value",schemaPath:"#/$defs/wearCount/properties/value/enum",keyword:"enum",params:{allowedValues: schema243.properties.value.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
}
else {
const err34 = {instancePath:instancePath+"/wear_counts/" + i1,schemaPath:"#/$defs/wearCount/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
else {
const err35 = {instancePath:instancePath+"/wear_counts",schemaPath:"#/properties/wear_counts/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
}
else {
const err36 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
validate147.errors = vErrors;
return errors === 0;
}
validate147.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema244 = {"additionalProperties":false,"properties":{"base_item_code":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"edition_kinds":{"items":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"maxItems":4,"minItems":1,"type":"array","uniqueItems":true},"item_category":{"oneOf":[{"enum":["NORMAL","STATTRAK","SOUVENIR","STAR","STAR_STATTRAK"]},{"type":"null"}]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"locale":{"enum":["en","zh_cn"]},"page_size":{"maximum":200,"minimum":1,"type":"integer"},"rarity":{"oneOf":[{"enum":["COVERT","CLASSIFIED","RESTRICTED","MIL_SPEC","INDUSTRIAL","CONSUMER","EXTRAORDINARY","CONTRABAND"]},{"type":"null"}]},"snapshot_id":{"$ref":"#/$defs/sha256"},"sort":{"enum":["NAME_ASC","EDITION_ASC","WEAR_ASC"]},"wear_tiers":{"items":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"maxItems":7,"minItems":1,"type":"array","uniqueItems":true}},"required":["base_item_code","edition_kinds","item_category","item_kind","locale","page_size","rarity","snapshot_id","sort","wear_tiers"],"type":"object"};
const func0 = __wireEqual;

function validate151(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate151.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.base_item_code === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "base_item_code"},message:"must have required property '"+"base_item_code"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.edition_kinds === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "edition_kinds"},message:"must have required property '"+"edition_kinds"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.item_category === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "item_category"},message:"must have required property '"+"item_category"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.item_kind === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "item_kind"},message:"must have required property '"+"item_kind"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.locale === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "locale"},message:"must have required property '"+"locale"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.page_size === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.rarity === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rarity"},message:"must have required property '"+"rarity"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.snapshot_id === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.sort === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sort"},message:"must have required property '"+"sort"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.wear_tiers === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "wear_tiers"},message:"must have required property '"+"wear_tiers"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema244.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.base_item_code !== undefined){
let data0 = data.base_item_code;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err11 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func2(data0) < 1){
const err12 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern87.test(data0)){
const err13 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.edition_kinds !== undefined){
let data1 = data.edition_kinds;
if(Array.isArray(data1)){
if(data1.length > 4){
const err15 = {instancePath:instancePath+"/edition_kinds",schemaPath:"#/properties/edition_kinds/maxItems",keyword:"maxItems",params:{limit: 4},message:"must NOT have more than 4 items"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data1.length < 1){
const err16 = {instancePath:instancePath+"/edition_kinds",schemaPath:"#/properties/edition_kinds/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(!((((data2 === "STANDARD") || (data2 === "STATTRAK")) || (data2 === "SOUVENIR")) || (data2 === "UNKNOWN"))){
const err17 = {instancePath:instancePath+"/edition_kinds/" + i0,schemaPath:"#/properties/edition_kinds/items/enum",keyword:"enum",params:{allowedValues: schema244.properties.edition_kinds.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
let i1 = data1.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data1[i1], data1[j0])){
const err18 = {instancePath:instancePath+"/edition_kinds",schemaPath:"#/properties/edition_kinds/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err19 = {instancePath:instancePath+"/edition_kinds",schemaPath:"#/properties/edition_kinds/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.item_category !== undefined){
let data3 = data.item_category;
const _errs8 = errors;
let valid4 = false;
let passing0 = null;
const _errs9 = errors;
if(!(((((data3 === "NORMAL") || (data3 === "STATTRAK")) || (data3 === "SOUVENIR")) || (data3 === "STAR")) || (data3 === "STAR_STATTRAK"))){
const err20 = {instancePath:instancePath+"/item_category",schemaPath:"#/properties/item_category/oneOf/0/enum",keyword:"enum",params:{allowedValues: schema244.properties.item_category.oneOf[0].enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid0 = _errs9 === errors;
if(_valid0){
valid4 = true;
passing0 = 0;
}
const _errs10 = errors;
if(data3 !== null){
const err21 = {instancePath:instancePath+"/item_category",schemaPath:"#/properties/item_category/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
var _valid0 = _errs10 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid4 = true;
passing0 = 1;
}
}
if(!valid4){
const err22 = {instancePath:instancePath+"/item_category",schemaPath:"#/properties/item_category/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
else {
errors = _errs8;
if(vErrors !== null){
if(_errs8){
vErrors.length = _errs8;
}
else {
vErrors = null;
}
}
}
}
if(data.item_kind !== undefined){
let data4 = data.item_kind;
if(!((((((data4 === "WEAPON") || (data4 === "KNIFE")) || (data4 === "GLOVE")) || (data4 === "AGENT")) || (data4 === "OTHER")) || (data4 === "UNKNOWN"))){
const err23 = {instancePath:instancePath+"/item_kind",schemaPath:"#/properties/item_kind/enum",keyword:"enum",params:{allowedValues: schema244.properties.item_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.locale !== undefined){
let data5 = data.locale;
if(!((data5 === "en") || (data5 === "zh_cn"))){
const err24 = {instancePath:instancePath+"/locale",schemaPath:"#/properties/locale/enum",keyword:"enum",params:{allowedValues: schema244.properties.locale.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.page_size !== undefined){
let data6 = data.page_size;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err25 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 > 200 || isNaN(data6)){
const err26 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 200},message:"must be <= 200"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data6 < 1 || isNaN(data6)){
const err27 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
if(data.rarity !== undefined){
let data7 = data.rarity;
const _errs17 = errors;
let valid5 = false;
let passing1 = null;
const _errs18 = errors;
if(!((((((((data7 === "COVERT") || (data7 === "CLASSIFIED")) || (data7 === "RESTRICTED")) || (data7 === "MIL_SPEC")) || (data7 === "INDUSTRIAL")) || (data7 === "CONSUMER")) || (data7 === "EXTRAORDINARY")) || (data7 === "CONTRABAND"))){
const err28 = {instancePath:instancePath+"/rarity",schemaPath:"#/properties/rarity/oneOf/0/enum",keyword:"enum",params:{allowedValues: schema244.properties.rarity.oneOf[0].enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
var _valid1 = _errs18 === errors;
if(_valid1){
valid5 = true;
passing1 = 0;
}
const _errs19 = errors;
if(data7 !== null){
const err29 = {instancePath:instancePath+"/rarity",schemaPath:"#/properties/rarity/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
var _valid1 = _errs19 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid5 = true;
passing1 = 1;
}
}
if(!valid5){
const err30 = {instancePath:instancePath+"/rarity",schemaPath:"#/properties/rarity/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
else {
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
}
}
if(data.snapshot_id !== undefined){
let data8 = data.snapshot_id;
if(typeof data8 === "string"){
if(!pattern5.test(data8)){
const err31 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
else {
const err32 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.sort !== undefined){
let data9 = data.sort;
if(!(((data9 === "NAME_ASC") || (data9 === "EDITION_ASC")) || (data9 === "WEAR_ASC"))){
const err33 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/enum",keyword:"enum",params:{allowedValues: schema244.properties.sort.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.wear_tiers !== undefined){
let data10 = data.wear_tiers;
if(Array.isArray(data10)){
if(data10.length > 7){
const err34 = {instancePath:instancePath+"/wear_tiers",schemaPath:"#/properties/wear_tiers/maxItems",keyword:"maxItems",params:{limit: 7},message:"must NOT have more than 7 items"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data10.length < 1){
const err35 = {instancePath:instancePath+"/wear_tiers",schemaPath:"#/properties/wear_tiers/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
const len1 = data10.length;
for(let i2=0; i2<len1; i2++){
let data11 = data10[i2];
if(!(((((((data11 === "FACTORY_NEW") || (data11 === "MINIMAL_WEAR")) || (data11 === "FIELD_TESTED")) || (data11 === "WELL_WORN")) || (data11 === "BATTLE_SCARRED")) || (data11 === "NOT_APPLICABLE")) || (data11 === "UNKNOWN"))){
const err36 = {instancePath:instancePath+"/wear_tiers/" + i2,schemaPath:"#/properties/wear_tiers/items/enum",keyword:"enum",params:{allowedValues: schema244.properties.wear_tiers.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
let i3 = data10.length;
let j1;
if(i3 > 1){
outer1:
for(;i3--;){
for(j1 = i3; j1--;){
if(func0(data10[i3], data10[j1])){
const err37 = {instancePath:instancePath+"/wear_tiers",schemaPath:"#/properties/wear_tiers/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err38 = {instancePath:instancePath+"/wear_tiers",schemaPath:"#/properties/wear_tiers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
else {
const err39 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
validate151.errors = vErrors;
return errors === 0;
}
validate151.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate146(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate146.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.api_contract === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "api_contract"},message:"must have required property '"+"api_contract"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.api_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "api_version"},message:"must have required property '"+"api_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.facet === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "facet"},message:"must have required property '"+"facet"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.members === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.next_cursor === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.previous_cursor === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "previous_cursor"},message:"must have required property '"+"previous_cursor"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.profiles === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "profiles"},message:"must have required property '"+"profiles"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.query === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.response_kind === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.snapshot === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.total_matching_members === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "total_matching_members"},message:"must have required property '"+"total_matching_members"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema239.properties, key0))){
const err11 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.api_contract !== undefined){
if("catalog-display-query-api" !== data.api_contract){
const err12 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "catalog-display-query-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err13 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.facet !== undefined){
if(!(validate147(data.facet, {instancePath:instancePath+"/facet",parentData:data,parentDataProperty:"facet",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate147.errors : vErrors.concat(validate147.errors);
errors = vErrors.length;
}
}
if(data.members !== undefined){
let data3 = data.members;
if(Array.isArray(data3)){
if(data3.length > 200){
const err14 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 200},message:"must NOT have more than 200 items"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
if(!(validate132(data3[i0], {instancePath:instancePath+"/members/" + i0,parentData:data3,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate132.errors : vErrors.concat(validate132.errors);
errors = vErrors.length;
}
}
}
else {
const err15 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data5 = data.next_cursor;
const _errs9 = errors;
let valid3 = false;
let passing0 = null;
const _errs10 = errors;
if(typeof data5 === "string"){
if(func2(data5) > 512){
const err16 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(func2(data5) < 1){
const err17 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!pattern73.test(data5)){
const err18 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid0 = _errs10 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs12 = errors;
if(data5 !== null){
const err20 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid0 = _errs12 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
}
}
if(!valid3){
const err21 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
else {
errors = _errs9;
if(vErrors !== null){
if(_errs9){
vErrors.length = _errs9;
}
else {
vErrors = null;
}
}
}
}
if(data.previous_cursor !== undefined){
let data6 = data.previous_cursor;
const _errs15 = errors;
let valid4 = false;
let passing1 = null;
const _errs16 = errors;
if(typeof data6 === "string"){
if(func2(data6) > 512){
const err22 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(func2(data6) < 1){
const err23 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(!pattern73.test(data6)){
const err24 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
else {
const err25 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
var _valid1 = _errs16 === errors;
if(_valid1){
valid4 = true;
passing1 = 0;
}
const _errs18 = errors;
if(data6 !== null){
const err26 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
var _valid1 = _errs18 === errors;
if(_valid1 && valid4){
valid4 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid4 = true;
passing1 = 1;
}
}
if(!valid4){
const err27 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
else {
errors = _errs15;
if(vErrors !== null){
if(_errs15){
vErrors.length = _errs15;
}
else {
vErrors = null;
}
}
}
}
if(data.profiles !== undefined){
if(!(validate123(data.profiles, {instancePath:instancePath+"/profiles",parentData:data,parentDataProperty:"profiles",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate123.errors : vErrors.concat(validate123.errors);
errors = vErrors.length;
}
}
if(data.query !== undefined){
if(!(validate151(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate151.errors : vErrors.concat(validate151.errors);
errors = vErrors.length;
}
}
if(data.response_kind !== undefined){
if("CATALOG_QUERY_UNITS" !== data.response_kind){
const err28 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "CATALOG_QUERY_UNITS"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.snapshot !== undefined){
if(!(validate127(data.snapshot, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate127.errors : vErrors.concat(validate127.errors);
errors = vErrors.length;
}
}
if(data.total_matching_members !== undefined){
let data11 = data.total_matching_members;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err29 = {instancePath:instancePath+"/total_matching_members",schemaPath:"#/properties/total_matching_members/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 < 0 || isNaN(data11)){
const err30 = {instancePath:instancePath+"/total_matching_members",schemaPath:"#/properties/total_matching_members/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
}
else {
const err31 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
validate146.errors = vErrors;
return errors === 0;
}
validate146.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema246 = {"additionalProperties":false,"properties":{"api_contract":{"const":"catalog-display-query-api"},"api_version":{"const":"v1"},"member":{"$ref":"#/$defs/member"},"next_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"parent_present":{"type":"boolean"},"previous_cursor":{"oneOf":[{"maxLength":512,"minLength":1,"pattern":"^[A-Za-z0-9_-]+$","type":"string"},{"type":"null"}]},"profiles":{"$ref":"#/$defs/profiles"},"query":{"$ref":"#/$defs/detailQuery"},"response_kind":{"const":"CATALOG_QUERY_DETAIL"},"sibling_total":{"minimum":1,"type":"integer"},"siblings":{"items":{"$ref":"#/$defs/member"},"maxItems":200,"type":"array"},"snapshot":{"$ref":"#/$defs/snapshot"}},"required":["api_contract","api_version","member","next_cursor","parent_present","previous_cursor","profiles","query","response_kind","sibling_total","siblings","snapshot"],"type":"object"};
const schema247 = {"additionalProperties":false,"properties":{"analysis_unit_id":{"maxLength":256,"minLength":1,"pattern":"^[^\\u0000-\\u001f\\u007f]+$","type":"string"},"page_size":{"maximum":200,"minimum":1,"type":"integer"},"snapshot_id":{"$ref":"#/$defs/sha256"}},"required":["analysis_unit_id","page_size","snapshot_id"],"type":"object"};

function validate158(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate158.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.analysis_unit_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.page_size === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.snapshot_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "analysis_unit_id") || (key0 === "page_size")) || (key0 === "snapshot_id"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data0 = data.analysis_unit_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err4 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/properties/analysis_unit_id/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func2(data0) < 1){
const err5 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/properties/analysis_unit_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern87.test(data0)){
const err6 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/properties/analysis_unit_id/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/properties/analysis_unit_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.page_size !== undefined){
let data1 = data.page_size;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err8 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 200 || isNaN(data1)){
const err9 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 200},message:"must be <= 200"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data1 < 1 || isNaN(data1)){
const err10 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
if(data.snapshot_id !== undefined){
let data2 = data.snapshot_id;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err11 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
else {
const err13 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
validate158.errors = vErrors;
return errors === 0;
}
validate158.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate155(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate155.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.api_contract === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "api_contract"},message:"must have required property '"+"api_contract"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.api_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "api_version"},message:"must have required property '"+"api_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.member === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member"},message:"must have required property '"+"member"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.next_cursor === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.parent_present === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parent_present"},message:"must have required property '"+"parent_present"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.previous_cursor === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "previous_cursor"},message:"must have required property '"+"previous_cursor"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.profiles === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "profiles"},message:"must have required property '"+"profiles"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.query === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.response_kind === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.sibling_total === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sibling_total"},message:"must have required property '"+"sibling_total"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.siblings === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "siblings"},message:"must have required property '"+"siblings"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.snapshot === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema246.properties, key0))){
const err12 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.api_contract !== undefined){
if("catalog-display-query-api" !== data.api_contract){
const err13 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "catalog-display-query-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err14 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.member !== undefined){
if(!(validate132(data.member, {instancePath:instancePath+"/member",parentData:data,parentDataProperty:"member",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate132.errors : vErrors.concat(validate132.errors);
errors = vErrors.length;
}
}
if(data.next_cursor !== undefined){
let data3 = data.next_cursor;
const _errs6 = errors;
let valid1 = false;
let passing0 = null;
const _errs7 = errors;
if(typeof data3 === "string"){
if(func2(data3) > 512){
const err15 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(func2(data3) < 1){
const err16 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern73.test(data3)){
const err17 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
else {
const err18 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid0 = _errs7 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs9 = errors;
if(data3 !== null){
const err19 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid0 = _errs9 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
}
if(!valid1){
const err20 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
}
if(data.parent_present !== undefined){
if(typeof data.parent_present !== "boolean"){
const err21 = {instancePath:instancePath+"/parent_present",schemaPath:"#/properties/parent_present/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.previous_cursor !== undefined){
let data5 = data.previous_cursor;
const _errs14 = errors;
let valid2 = false;
let passing1 = null;
const _errs15 = errors;
if(typeof data5 === "string"){
if(func2(data5) > 512){
const err22 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(func2(data5) < 1){
const err23 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(!pattern73.test(data5)){
const err24 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
else {
const err25 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
var _valid1 = _errs15 === errors;
if(_valid1){
valid2 = true;
passing1 = 0;
}
const _errs17 = errors;
if(data5 !== null){
const err26 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
var _valid1 = _errs17 === errors;
if(_valid1 && valid2){
valid2 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid2 = true;
passing1 = 1;
}
}
if(!valid2){
const err27 = {instancePath:instancePath+"/previous_cursor",schemaPath:"#/properties/previous_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
else {
errors = _errs14;
if(vErrors !== null){
if(_errs14){
vErrors.length = _errs14;
}
else {
vErrors = null;
}
}
}
}
if(data.profiles !== undefined){
if(!(validate123(data.profiles, {instancePath:instancePath+"/profiles",parentData:data,parentDataProperty:"profiles",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate123.errors : vErrors.concat(validate123.errors);
errors = vErrors.length;
}
}
if(data.query !== undefined){
if(!(validate158(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate158.errors : vErrors.concat(validate158.errors);
errors = vErrors.length;
}
}
if(data.response_kind !== undefined){
if("CATALOG_QUERY_DETAIL" !== data.response_kind){
const err28 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "CATALOG_QUERY_DETAIL"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.sibling_total !== undefined){
let data9 = data.sibling_total;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err29 = {instancePath:instancePath+"/sibling_total",schemaPath:"#/properties/sibling_total/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if((typeof data9 == "number") && (isFinite(data9))){
if(data9 < 1 || isNaN(data9)){
const err30 = {instancePath:instancePath+"/sibling_total",schemaPath:"#/properties/sibling_total/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
if(data.siblings !== undefined){
let data10 = data.siblings;
if(Array.isArray(data10)){
if(data10.length > 200){
const err31 = {instancePath:instancePath+"/siblings",schemaPath:"#/properties/siblings/maxItems",keyword:"maxItems",params:{limit: 200},message:"must NOT have more than 200 items"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
const len0 = data10.length;
for(let i0=0; i0<len0; i0++){
if(!(validate132(data10[i0], {instancePath:instancePath+"/siblings/" + i0,parentData:data10,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate132.errors : vErrors.concat(validate132.errors);
errors = vErrors.length;
}
}
}
else {
const err32 = {instancePath:instancePath+"/siblings",schemaPath:"#/properties/siblings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.snapshot !== undefined){
if(!(validate127(data.snapshot, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate127.errors : vErrors.concat(validate127.errors);
errors = vErrors.length;
}
}
}
else {
const err33 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
validate155.errors = vErrors;
return errors === 0;
}
validate155.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate121(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:catalog-display-query-api:v1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate121.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(!(validate122(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate122.errors : vErrors.concat(validate122.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate130(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate130.errors : vErrors.concat(validate130.errors);
errors = vErrors.length;
}
var _valid0 = _errs2 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs3 = errors;
if(!(validate146(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate146.errors : vErrors.concat(validate146.errors);
errors = vErrors.length;
}
var _valid0 = _errs3 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs4 = errors;
if(!(validate155(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate155.errors : vErrors.concat(validate155.errors);
errors = vErrors.length;
}
var _valid0 = _errs4 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid0 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.api_contract === undefined){
const err0 = {instancePath,schemaPath:"#/$defs/errorResponse/required",keyword:"required",params:{missingProperty: "api_contract"},message:"must have required property '"+"api_contract"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.api_version === undefined){
const err1 = {instancePath,schemaPath:"#/$defs/errorResponse/required",keyword:"required",params:{missingProperty: "api_version"},message:"must have required property '"+"api_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.error === undefined){
const err2 = {instancePath,schemaPath:"#/$defs/errorResponse/required",keyword:"required",params:{missingProperty: "error"},message:"must have required property '"+"error"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.response_kind === undefined){
const err3 = {instancePath,schemaPath:"#/$defs/errorResponse/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "error")) || (key0 === "response_kind"))){
const err4 = {instancePath,schemaPath:"#/$defs/errorResponse/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.api_contract !== undefined){
if("catalog-display-query-api" !== data.api_contract){
const err5 = {instancePath:instancePath+"/api_contract",schemaPath:"#/$defs/errorResponse/properties/api_contract/const",keyword:"const",params:{allowedValue: "catalog-display-query-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err6 = {instancePath:instancePath+"/api_version",schemaPath:"#/$defs/errorResponse/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.error !== undefined){
let data2 = data.error;
const _errs12 = errors;
let valid3 = false;
let passing1 = null;
const _errs13 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.code === undefined){
const err7 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/0/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data2.http_status === undefined){
const err8 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/0/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data2.retryable === undefined){
const err9 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/0/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key1 in data2){
if(!(((key1 === "code") || (key1 === "http_status")) || (key1 === "retryable"))){
const err10 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data2.code !== undefined){
if("INVALID_ARGUMENT" !== data2.code){
const err11 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/0/properties/code/const",keyword:"const",params:{allowedValue: "INVALID_ARGUMENT"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data2.http_status !== undefined){
if(400 !== data2.http_status){
const err12 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/0/properties/http_status/const",keyword:"const",params:{allowedValue: 400},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data2.retryable !== undefined){
if(false !== data2.retryable){
const err13 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/0/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid1 = _errs13 === errors;
if(_valid1){
valid3 = true;
passing1 = 0;
var props1 = true;
}
const _errs19 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.code === undefined){
const err15 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/1/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data2.http_status === undefined){
const err16 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/1/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data2.retryable === undefined){
const err17 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/1/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key2 in data2){
if(!(((key2 === "code") || (key2 === "http_status")) || (key2 === "retryable"))){
const err18 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data2.code !== undefined){
if("INVALID_CURSOR" !== data2.code){
const err19 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/1/properties/code/const",keyword:"const",params:{allowedValue: "INVALID_CURSOR"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data2.http_status !== undefined){
if(400 !== data2.http_status){
const err20 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/1/properties/http_status/const",keyword:"const",params:{allowedValue: 400},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data2.retryable !== undefined){
if(false !== data2.retryable){
const err21 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/1/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
else {
const err22 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid1 = _errs19 === errors;
if(_valid1 && valid3){
valid3 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid3 = true;
passing1 = 1;
if(props1 !== true){
props1 = true;
}
}
const _errs25 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.code === undefined){
const err23 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/2/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data2.http_status === undefined){
const err24 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/2/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data2.retryable === undefined){
const err25 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/2/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
for(const key3 in data2){
if(!(((key3 === "code") || (key3 === "http_status")) || (key3 === "retryable"))){
const err26 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data2.code !== undefined){
if("NOT_FOUND" !== data2.code){
const err27 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/2/properties/code/const",keyword:"const",params:{allowedValue: "NOT_FOUND"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data2.http_status !== undefined){
if(404 !== data2.http_status){
const err28 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/2/properties/http_status/const",keyword:"const",params:{allowedValue: 404},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data2.retryable !== undefined){
if(false !== data2.retryable){
const err29 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/2/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
else {
const err30 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
var _valid1 = _errs25 === errors;
if(_valid1 && valid3){
valid3 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid3 = true;
passing1 = 2;
if(props1 !== true){
props1 = true;
}
}
const _errs31 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.code === undefined){
const err31 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/3/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data2.http_status === undefined){
const err32 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/3/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data2.retryable === undefined){
const err33 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/3/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
for(const key4 in data2){
if(!(((key4 === "code") || (key4 === "http_status")) || (key4 === "retryable"))){
const err34 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data2.code !== undefined){
if("CONTRACT_UNAVAILABLE" !== data2.code){
const err35 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/3/properties/code/const",keyword:"const",params:{allowedValue: "CONTRACT_UNAVAILABLE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data2.http_status !== undefined){
if(503 !== data2.http_status){
const err36 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/3/properties/http_status/const",keyword:"const",params:{allowedValue: 503},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data2.retryable !== undefined){
if(true !== data2.retryable){
const err37 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/3/properties/retryable/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
}
else {
const err38 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
var _valid1 = _errs31 === errors;
if(_valid1 && valid3){
valid3 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid3 = true;
passing1 = 3;
if(props1 !== true){
props1 = true;
}
}
const _errs37 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.code === undefined){
const err39 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/4/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data2.http_status === undefined){
const err40 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/4/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data2.retryable === undefined){
const err41 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/4/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
for(const key5 in data2){
if(!(((key5 === "code") || (key5 === "http_status")) || (key5 === "retryable"))){
const err42 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/4/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data2.code !== undefined){
if("RECORD_CORRUPT" !== data2.code){
const err43 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/4/properties/code/const",keyword:"const",params:{allowedValue: "RECORD_CORRUPT"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data2.http_status !== undefined){
if(503 !== data2.http_status){
const err44 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/4/properties/http_status/const",keyword:"const",params:{allowedValue: 503},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data2.retryable !== undefined){
if(false !== data2.retryable){
const err45 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/4/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
}
else {
const err46 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
var _valid1 = _errs37 === errors;
if(_valid1 && valid3){
valid3 = false;
passing1 = [passing1, 4];
}
else {
if(_valid1){
valid3 = true;
passing1 = 4;
if(props1 !== true){
props1 = true;
}
}
const _errs43 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.code === undefined){
const err47 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/5/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data2.http_status === undefined){
const err48 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/5/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data2.retryable === undefined){
const err49 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/5/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
for(const key6 in data2){
if(!(((key6 === "code") || (key6 === "http_status")) || (key6 === "retryable"))){
const err50 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/5/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data2.code !== undefined){
if("BACKEND_UNAVAILABLE" !== data2.code){
const err51 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/5/properties/code/const",keyword:"const",params:{allowedValue: "BACKEND_UNAVAILABLE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data2.http_status !== undefined){
if(503 !== data2.http_status){
const err52 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/5/properties/http_status/const",keyword:"const",params:{allowedValue: 503},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data2.retryable !== undefined){
if(true !== data2.retryable){
const err53 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/5/properties/retryable/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
}
else {
const err54 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
var _valid1 = _errs43 === errors;
if(_valid1 && valid3){
valid3 = false;
passing1 = [passing1, 5];
}
else {
if(_valid1){
valid3 = true;
passing1 = 5;
if(props1 !== true){
props1 = true;
}
}
}
}
}
}
}
if(!valid3){
const err55 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
else {
errors = _errs12;
if(vErrors !== null){
if(_errs12){
vErrors.length = _errs12;
}
else {
vErrors = null;
}
}
}
}
if(data.response_kind !== undefined){
if("ERROR" !== data.response_kind){
const err56 = {instancePath:instancePath+"/response_kind",schemaPath:"#/$defs/errorResponse/properties/response_kind/const",keyword:"const",params:{allowedValue: "ERROR"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
else {
const err57 = {instancePath,schemaPath:"#/$defs/errorResponse/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
var _valid0 = _errs5 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid0 = true;
passing0 = 4;
if(props0 !== true){
props0 = true;
}
}
}
}
}
}
if(!valid0){
const err58 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate121.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate121.evaluated = {"dynamicProps":true,"dynamicItems":false};
