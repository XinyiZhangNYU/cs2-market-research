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
export const validateSingleItemTrendingPublicApiV4Response = validate560;
const schema1010 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:single-item-trending-public-api:v4","title":"Single-item Trending historical and hybrid public API V4","oneOf":[{"$ref":"#/$defs/listResponse"},{"$ref":"#/$defs/errorResponse"}],"$defs":{"sha256":{"type":"string","pattern":"^[0-9a-f]{64}$"},"timestamp":{"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},"date":{"type":"string","format":"date"},"identifier":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"ratio":{"type":"string","description":"Eight-place display ratio; negative exact values retain a minus sign even when rounded to -0.00000000.","pattern":"^-?(0|[1-9][0-9]*)\\.[0-9]{8}$"},"nullableSha256":{"oneOf":[{"$ref":"#/$defs/sha256"},{"type":"null"}]},"nullableCursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]},"catalogDescriptor":{"type":"object","additionalProperties":false,"required":["catalog_publication_id","snapshot_id","catalog_version","as_of","available_at","published_at","member_count","member_set_hash","decision","withdrawn"],"properties":{"catalog_publication_id":{"$ref":"#/$defs/sha256"},"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_version":{"$ref":"#/$defs/identifier"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"member_count":{"type":"integer","minimum":1},"member_set_hash":{"$ref":"#/$defs/sha256"},"decision":{"const":"APPROVED"},"withdrawn":{"const":false}}},"localizedName":{"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"$ref":"#/$defs/identifier"},"zh_cn":{"$ref":"#/$defs/identifier"}}},"media":{"oneOf":[{"type":"object","additionalProperties":false,"required":["status"],"properties":{"status":{"const":"NOT_PRODUCED"}}},{"type":"object","additionalProperties":false,"required":["status","media_asset_version_id","media_key","presentation_kind"],"properties":{"status":{"const":"BOUND"},"media_asset_version_id":{"type":"string","pattern":"^[1-9][0-9]*$"},"media_key":{"type":"string","minLength":1,"maxLength":1024,"pattern":"^[A-Za-z0-9][A-Za-z0-9._/-]*$"},"presentation_kind":{"enum":["SERIES_REPRESENTATIVE","STYLE_REPRESENTATIVE"]}}}]},"catalogProjection":{"type":"object","additionalProperties":false,"required":["analysis_unit_id","parent_analysis_unit_id","analysis_unit_kind","item_kind","base_item_code","edition_kind","wear_tier","localized_name","media","catalog_version"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"base_item_code":{"$ref":"#/$defs/identifier"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/localizedName"},"media":{"$ref":"#/$defs/media"},"catalog_version":{"$ref":"#/$defs/identifier"}}},"member":{"type":"object","additionalProperties":false,"required":["rank","tie_break_key","measurement_id","analysis_unit_id","direction","evidence_grade","conservative_source_code","conservative_same_direction_change_floor_ratio","catalog","supporting_sources","unavailable_sources"],"properties":{"rank":{"type":"integer","minimum":1,"maximum":50},"tie_break_key":{"$ref":"#/$defs/identifier"},"measurement_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"direction":{"enum":["GAINERS","LOSERS"]},"evidence_grade":{"enum":["THREE_SOURCE_CONFIRMED","TWO_SOURCE_SUPPORTED"]},"conservative_source_code":{"enum":["market_a","market_b","market_c"]},"conservative_same_direction_change_floor_ratio":{"$ref":"#/$defs/ratio"},"catalog":{"$ref":"#/$defs/catalogProjection"},"supporting_sources":{"type":"array","uniqueItems":true,"minItems":2,"maxItems":3,"items":{"enum":["market_a","market_b","market_c"]}},"unavailable_sources":{"type":"array","maxItems":1,"items":{"type":"object","additionalProperties":false,"required":["source_code","start_reason","end_reason"],"properties":{"source_code":{"enum":["market_a","market_b","market_c"]},"start_reason":{"enum":["QUALIFIED","PROVIDER_HISTORY_SOURCE_ABSENT","NO_ACTIVE_ASK"]},"end_reason":{"enum":["QUALIFIED","PROVIDER_HISTORY_SOURCE_ABSENT","NO_ACTIVE_ASK"]}}}}}},"producerRelease":{"type":"object","additionalProperties":false,"required":["release_code","algorithm_version","data_quality_policy_version","public_top_n_per_direction"],"properties":{"release_code":{"$ref":"#/$defs/identifier"},"algorithm_version":{"$ref":"#/$defs/identifier"},"data_quality_policy_version":{"$ref":"#/$defs/identifier"},"public_top_n_per_direction":{"type":"integer","minimum":1,"maximum":50}}},"numericProfile":{"type":"object","additionalProperties":false,"required":["profile_code","method_id","segment","horizon_days","analysis_currency","minimum_endpoint_cny_minor","minimum_abs_leg_delta_cny_minor"],"properties":{"profile_code":{"$ref":"#/$defs/identifier"},"method_id":{"const":"M3"},"segment":{"const":"SOURCE_TIERED_HISTORY_HYBRID"},"horizon_days":{"const":30},"analysis_currency":{"const":"CNY"},"minimum_endpoint_cny_minor":{"type":"integer","minimum":1},"minimum_abs_leg_delta_cny_minor":{"type":"integer","minimum":1}}},"statusCounts":{"type":"object","additionalProperties":false,"required":["ELIGIBLE_A3","CONFLICTED_DIRECTION","INSUFFICIENT_THREE_SOURCES","FLAT_OR_ZERO_CONFLICT","WITHHELD_ANOMALY","WITHHELD_ANOMALY_UNKNOWN","WITHHELD_WINDOW_EVIDENCE","WITHHELD_MICROPRICE","STALE_ENDPOINT","TEMPORAL_VIOLATION","CONTRACT_MISMATCH","ELIGIBLE_A2","WITHHELD_SOURCE_EVIDENCE"],"properties":{"ELIGIBLE_A3":{"type":"integer","minimum":0},"CONFLICTED_DIRECTION":{"type":"integer","minimum":0},"INSUFFICIENT_THREE_SOURCES":{"type":"integer","minimum":0},"FLAT_OR_ZERO_CONFLICT":{"type":"integer","minimum":0},"WITHHELD_ANOMALY":{"type":"integer","minimum":0},"WITHHELD_ANOMALY_UNKNOWN":{"type":"integer","minimum":0},"WITHHELD_WINDOW_EVIDENCE":{"type":"integer","minimum":0},"WITHHELD_MICROPRICE":{"type":"integer","minimum":0},"STALE_ENDPOINT":{"type":"integer","minimum":0},"TEMPORAL_VIOLATION":{"type":"integer","minimum":0},"CONTRACT_MISMATCH":{"type":"integer","minimum":0},"ELIGIBLE_A2":{"type":"integer","minimum":0},"WITHHELD_SOURCE_EVIDENCE":{"type":"integer","minimum":0}}},"accounting":{"type":"object","additionalProperties":false,"required":["member_count","three_source_endpoint_count","three_source_endpoint_ratio_bps","direction_eligible_count","direction_eligible_ratio_bps","eligible_count","excluded_count","status_counts","gainer_count","loser_count","qualified_three_source_endpoint_count","qualified_three_source_endpoint_ratio_bps","qualified_two_source_endpoint_count","qualified_supported_endpoint_count","three_source_confirmed_count","two_source_supported_count","qualified_supported_endpoint_ratio_bps","source_endpoint_reason_counts"],"properties":{"member_count":{"type":"integer","minimum":1},"three_source_endpoint_count":{"type":"integer","minimum":0},"three_source_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"direction_eligible_count":{"type":"integer","minimum":0},"direction_eligible_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"eligible_count":{"type":"integer","minimum":0},"excluded_count":{"type":"integer","minimum":0},"status_counts":{"$ref":"#/$defs/statusCounts"},"gainer_count":{"type":"integer","minimum":0,"maximum":50},"loser_count":{"type":"integer","minimum":0,"maximum":50},"qualified_three_source_endpoint_count":{"type":"integer","minimum":0},"qualified_three_source_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"qualified_two_source_endpoint_count":{"type":"integer","minimum":0},"qualified_supported_endpoint_count":{"type":"integer","minimum":0},"three_source_confirmed_count":{"type":"integer","minimum":0},"two_source_supported_count":{"type":"integer","minimum":0},"qualified_supported_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"source_endpoint_reason_counts":{"type":"object","additionalProperties":false,"required":["market_a","market_b","market_c"],"properties":{"market_a":{"type":"object","additionalProperties":false,"properties":{"QUALIFIED":{"type":"integer","minimum":0},"NO_ACTIVE_ASK":{"type":"integer","minimum":0},"QUOTE_VALUE_MISSING_OR_INVALID":{"type":"integer","minimum":0},"SOURCE_REFRESH_LAG":{"type":"integer","minimum":0},"MISSING_SOURCE_CLOCK":{"type":"integer","minimum":0},"TEMPORAL_VIOLATION":{"type":"integer","minimum":0},"INSUFFICIENT_SLOTS":{"type":"integer","minimum":0},"CONTRACT_MISMATCH":{"type":"integer","minimum":0},"EVIDENCE_UNAVAILABLE":{"type":"integer","minimum":0},"PROVIDER_HISTORY_SOURCE_ABSENT":{"type":"integer","minimum":0},"PROVIDER_HISTORY_NONPOSITIVE_ASK":{"type":"integer","minimum":0},"PROVIDER_HISTORY_CROSSED_BOOK":{"type":"integer","minimum":0}}},"market_b":{"type":"object","additionalProperties":false,"properties":{"QUALIFIED":{"type":"integer","minimum":0},"NO_ACTIVE_ASK":{"type":"integer","minimum":0},"QUOTE_VALUE_MISSING_OR_INVALID":{"type":"integer","minimum":0},"SOURCE_REFRESH_LAG":{"type":"integer","minimum":0},"MISSING_SOURCE_CLOCK":{"type":"integer","minimum":0},"TEMPORAL_VIOLATION":{"type":"integer","minimum":0},"INSUFFICIENT_SLOTS":{"type":"integer","minimum":0},"CONTRACT_MISMATCH":{"type":"integer","minimum":0},"EVIDENCE_UNAVAILABLE":{"type":"integer","minimum":0},"PROVIDER_HISTORY_SOURCE_ABSENT":{"type":"integer","minimum":0},"PROVIDER_HISTORY_NONPOSITIVE_ASK":{"type":"integer","minimum":0},"PROVIDER_HISTORY_CROSSED_BOOK":{"type":"integer","minimum":0}}},"market_c":{"type":"object","additionalProperties":false,"properties":{"QUALIFIED":{"type":"integer","minimum":0},"NO_ACTIVE_ASK":{"type":"integer","minimum":0},"QUOTE_VALUE_MISSING_OR_INVALID":{"type":"integer","minimum":0},"SOURCE_REFRESH_LAG":{"type":"integer","minimum":0},"MISSING_SOURCE_CLOCK":{"type":"integer","minimum":0},"TEMPORAL_VIOLATION":{"type":"integer","minimum":0},"INSUFFICIENT_SLOTS":{"type":"integer","minimum":0},"CONTRACT_MISMATCH":{"type":"integer","minimum":0},"EVIDENCE_UNAVAILABLE":{"type":"integer","minimum":0},"PROVIDER_HISTORY_SOURCE_ABSENT":{"type":"integer","minimum":0},"PROVIDER_HISTORY_NONPOSITIVE_ASK":{"type":"integer","minimum":0},"PROVIDER_HISTORY_CROSSED_BOOK":{"type":"integer","minimum":0}}}}}}},"publication":{"type":"object","additionalProperties":false,"required":["publication_id","manifest_hash","result_as_of","input_available_at","public_available_at","published_at","freshness_anchor_at","fresh_until","retain_until","freshness","supersedes_publication_id","producer_release","numeric_profile","rights_release_code","rights_maximum_public_members_per_direction","evidence_release_code","catalog","accounting","tiering_policy","window_start_date","evidence_class","evidence_disclosure","currency_disclosure"],"properties":{"publication_id":{"$ref":"#/$defs/sha256"},"manifest_hash":{"$ref":"#/$defs/sha256"},"result_as_of":{"$ref":"#/$defs/date"},"input_available_at":{"$ref":"#/$defs/timestamp"},"public_available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"freshness_anchor_at":{"$ref":"#/$defs/timestamp"},"fresh_until":{"$ref":"#/$defs/timestamp"},"retain_until":{"$ref":"#/$defs/timestamp"},"freshness":{"enum":["FRESH","STALE_RETAINED"]},"supersedes_publication_id":{"$ref":"#/$defs/nullableSha256"},"producer_release":{"$ref":"#/$defs/producerRelease"},"numeric_profile":{"$ref":"#/$defs/numericProfile"},"rights_release_code":{"$ref":"#/$defs/identifier"},"rights_maximum_public_members_per_direction":{"type":"integer","minimum":1,"maximum":50},"evidence_release_code":{"$ref":"#/$defs/identifier"},"catalog":{"$ref":"#/$defs/catalogDescriptor"},"accounting":{"$ref":"#/$defs/accounting"},"tiering_policy":{"type":"object","additionalProperties":false,"required":["policy_id","policy_code","evidence_class","allowed_missing_reasons","minimum_supported_endpoint_ratio_bps","public_readiness_policy_id","minimum_qualified_three_source_endpoint_ratio_bps","minimum_public_candidates_per_direction","empty_public_lane_state","public_primary_grade","two_source_publication_state"],"properties":{"policy_id":{"$ref":"#/$defs/sha256"},"policy_code":{"$ref":"#/$defs/identifier"},"evidence_class":{"enum":["RECONSTRUCTED_HISTORY","HYBRID_BRIDGED","CONTEMPORANEOUSLY_MEASURED"]},"allowed_missing_reasons":{"type":"array","uniqueItems":true,"maxItems":3,"items":{"enum":["PROVIDER_HISTORY_SOURCE_ABSENT","NO_ACTIVE_ASK"]}},"minimum_supported_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"public_readiness_policy_id":{"$ref":"#/$defs/sha256"},"minimum_qualified_three_source_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"minimum_public_candidates_per_direction":{"type":"integer","minimum":1,"maximum":50},"empty_public_lane_state":{"const":"WITHHOLD_PUBLICATION"},"public_primary_grade":{"const":"THREE_SOURCE_CONFIRMED"},"two_source_publication_state":{"const":"WITHHELD_PENDING_SEPARATE_RIGHTS_AND_PRODUCT_APPROVAL"}}},"window_start_date":{"$ref":"#/$defs/date"},"evidence_class":{"enum":["RECONSTRUCTED_HISTORY","HYBRID_BRIDGED","CONTEMPORANEOUSLY_MEASURED"]},"evidence_disclosure":{"type":"object","additionalProperties":false,"required":["start_endpoint_acquisition","end_endpoint_acquisition","historical_obtained_at","late_bound_current_membership","pit_membership_claimed","prospective_continuity_credit","public_label"],"properties":{"start_endpoint_acquisition":{"enum":["HISTORICAL_PROVIDER_ARCHIVE","CONTEMPORANEOUS_EOD"]},"end_endpoint_acquisition":{"enum":["HISTORICAL_PROVIDER_ARCHIVE","CONTEMPORANEOUS_EOD"]},"historical_obtained_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]},"late_bound_current_membership":{"type":"boolean"},"pit_membership_claimed":{"const":false},"prospective_continuity_credit":{"type":"boolean"},"public_label":{"enum":["历史重建","混合桥接","当前实测"]}}},"currency_disclosure":{"type":"object","additionalProperties":false,"required":["source_currency","source_native_semantics","analysis_currency","analysis_semantics","conversion_policy","start_fx_source_event_date","end_fx_source_event_date","current_fx_repricing_forbidden"],"properties":{"source_currency":{"const":"USD"},"source_native_semantics":{"const":"UPSTREAM_PROVIDER_USD_REFERENCE_NOT_PROVEN_PLATFORM_NATIVE"},"analysis_currency":{"const":"CNY"},"analysis_semantics":{"const":"FX_RECONSTRUCTED_CNY_REFERENCE"},"conversion_policy":{"const":"analysis-cny-minor-half-even/1"},"start_fx_source_event_date":{"$ref":"#/$defs/date"},"end_fx_source_event_date":{"$ref":"#/$defs/date"},"current_fx_repricing_forbidden":{"const":true}}}}},"filters":{"type":"object","additionalProperties":false,"required":["item_kind","base_item_code","edition_kind","wear_tier"],"properties":{"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN",null]},"base_item_code":{"oneOf":[{"allOf":[{"$ref":"#/$defs/identifier"},{"maxLength":256}]},{"type":"null"}]},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN",null]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN",null]}}},"query":{"type":"object","additionalProperties":false,"required":["as_of","snapshot_known_at","request_known_at","publication_id","direction","page_size","cursor","filters"],"properties":{"as_of":{"oneOf":[{"$ref":"#/$defs/date"},{"type":"null"}]},"snapshot_known_at":{"$ref":"#/$defs/timestamp"},"request_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/nullableSha256"},"direction":{"enum":["GAINERS","LOSERS"]},"page_size":{"type":"integer","minimum":1,"maximum":100},"cursor":{"$ref":"#/$defs/nullableCursor"},"filters":{"$ref":"#/$defs/filters"}}},"listResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","publication","total","members","next_cursor"],"properties":{"api_contract":{"const":"single-item-trending-public-api"},"api_version":{"const":"v4"},"response_kind":{"const":"TRENDING_LIST"},"query":{"$ref":"#/$defs/query"},"publication":{"$ref":"#/$defs/publication"},"total":{"type":"integer","minimum":0,"maximum":50},"members":{"type":"array","items":{"$ref":"#/$defs/member"},"maxItems":50},"next_cursor":{"$ref":"#/$defs/nullableCursor"}}},"errorResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"single-item-trending-public-api"},"api_version":{"const":"v4"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","NOT_PUBLISHED","BACKEND_UNAVAILABLE","PUBLICATION_EXPIRED","PUBLICATION_WITHDRAWN","RESULT_CORRUPT"]},"retryable":{"type":"boolean"}}}}}}};
const schema1071 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"single-item-trending-public-api"},"api_version":{"const":"v4"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","NOT_PUBLISHED","BACKEND_UNAVAILABLE","PUBLICATION_EXPIRED","PUBLICATION_WITHDRAWN","RESULT_CORRUPT"]},"retryable":{"type":"boolean"}}}}};
const schema1011 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","publication","total","members","next_cursor"],"properties":{"api_contract":{"const":"single-item-trending-public-api"},"api_version":{"const":"v4"},"response_kind":{"const":"TRENDING_LIST"},"query":{"$ref":"#/$defs/query"},"publication":{"$ref":"#/$defs/publication"},"total":{"type":"integer","minimum":0,"maximum":50},"members":{"type":"array","items":{"$ref":"#/$defs/member"},"maxItems":50},"next_cursor":{"$ref":"#/$defs/nullableCursor"}}};
const schema1018 = {"oneOf":[{"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]};
const schema1012 = {"type":"object","additionalProperties":false,"required":["as_of","snapshot_known_at","request_known_at","publication_id","direction","page_size","cursor","filters"],"properties":{"as_of":{"oneOf":[{"$ref":"#/$defs/date"},{"type":"null"}]},"snapshot_known_at":{"$ref":"#/$defs/timestamp"},"request_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/nullableSha256"},"direction":{"enum":["GAINERS","LOSERS"]},"page_size":{"type":"integer","minimum":1,"maximum":100},"cursor":{"$ref":"#/$defs/nullableCursor"},"filters":{"$ref":"#/$defs/filters"}}};
const schema1013 = {"type":"string","format":"date"};
const schema1014 = {"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"};
const formats40 = __wireFullFormats.date;
const formats0 = __wireFullFormats["date-time"];
const pattern19 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$", "u");
const pattern73 = new RegExp("^[A-Za-z0-9_-]+$", "u");
const schema1016 = {"oneOf":[{"$ref":"#/$defs/sha256"},{"type":"null"}]};
const schema1017 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");

function validate563(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate563.evaluated;
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
if(typeof data === "string"){
if(!pattern5.test(data)){
const err0 = {instancePath,schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
}
const _errs4 = errors;
if(data !== null){
const err2 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
var _valid0 = _errs4 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
}
}
if(!valid0){
const err3 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
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
validate563.errors = vErrors;
return errors === 0;
}
validate563.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema1019 = {"type":"object","additionalProperties":false,"required":["item_kind","base_item_code","edition_kind","wear_tier"],"properties":{"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN",null]},"base_item_code":{"oneOf":[{"allOf":[{"$ref":"#/$defs/identifier"},{"maxLength":256}]},{"type":"null"}]},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN",null]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN",null]}}};
const schema1020 = {"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"};
const func2 = __wireUcs2Length;
const pattern87 = new RegExp("^[^\\u0000-\\u001f\\u007f]+$", "u");

function validate565(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate565.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.item_kind === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "item_kind"},message:"must have required property '"+"item_kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.base_item_code === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "base_item_code"},message:"must have required property '"+"base_item_code"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.edition_kind === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "edition_kind"},message:"must have required property '"+"edition_kind"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.wear_tier === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "wear_tier"},message:"must have required property '"+"wear_tier"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "item_kind") || (key0 === "base_item_code")) || (key0 === "edition_kind")) || (key0 === "wear_tier"))){
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
if(data.item_kind !== undefined){
let data0 = data.item_kind;
if(!(((((((data0 === "WEAPON") || (data0 === "KNIFE")) || (data0 === "GLOVE")) || (data0 === "AGENT")) || (data0 === "OTHER")) || (data0 === "UNKNOWN")) || (data0 === null))){
const err5 = {instancePath:instancePath+"/item_kind",schemaPath:"#/properties/item_kind/enum",keyword:"enum",params:{allowedValues: schema1019.properties.item_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.base_item_code !== undefined){
let data1 = data.base_item_code;
const _errs4 = errors;
let valid1 = false;
let passing0 = null;
const _errs5 = errors;
if(typeof data1 === "string"){
if(func2(data1) > 512){
const err6 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data1) < 1){
const err7 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern87.test(data1)){
const err8 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err9 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err10 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/oneOf/0/allOf/1/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
var _valid0 = _errs5 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs10 = errors;
if(data1 !== null){
const err11 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs10 === errors;
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
const err12 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/properties/base_item_code/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
errors = _errs4;
if(vErrors !== null){
if(_errs4){
vErrors.length = _errs4;
}
else {
vErrors = null;
}
}
}
}
if(data.edition_kind !== undefined){
let data2 = data.edition_kind;
if(!(((((data2 === "STANDARD") || (data2 === "STATTRAK")) || (data2 === "SOUVENIR")) || (data2 === "UNKNOWN")) || (data2 === null))){
const err13 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema1019.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.wear_tier !== undefined){
let data3 = data.wear_tier;
if(!((((((((data3 === "FACTORY_NEW") || (data3 === "MINIMAL_WEAR")) || (data3 === "FIELD_TESTED")) || (data3 === "WELL_WORN")) || (data3 === "BATTLE_SCARRED")) || (data3 === "NOT_APPLICABLE")) || (data3 === "UNKNOWN")) || (data3 === null))){
const err14 = {instancePath:instancePath+"/wear_tier",schemaPath:"#/properties/wear_tier/enum",keyword:"enum",params:{allowedValues: schema1019.properties.wear_tier.enum},message:"must be equal to one of the allowed values"};
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
const err15 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
validate565.errors = vErrors;
return errors === 0;
}
validate565.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate562(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate562.evaluated;
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
if(data.snapshot_known_at === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_known_at"},message:"must have required property '"+"snapshot_known_at"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.request_known_at === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_known_at"},message:"must have required property '"+"request_known_at"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.publication_id === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication_id"},message:"must have required property '"+"publication_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.direction === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "direction"},message:"must have required property '"+"direction"+"'"};
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
if(data.cursor === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cursor"},message:"must have required property '"+"cursor"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.filters === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "filters"},message:"must have required property '"+"filters"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "as_of") || (key0 === "snapshot_known_at")) || (key0 === "request_known_at")) || (key0 === "publication_id")) || (key0 === "direction")) || (key0 === "page_size")) || (key0 === "cursor")) || (key0 === "filters"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.as_of !== undefined){
let data0 = data.as_of;
const _errs3 = errors;
let valid1 = false;
let passing0 = null;
const _errs4 = errors;
if(typeof data0 === "string"){
if(!(formats40.validate(data0))){
const err9 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err10 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs4 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs7 = errors;
if(data0 !== null){
const err11 = {instancePath:instancePath+"/as_of",schemaPath:"#/properties/as_of/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs7 === errors;
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
const err12 = {instancePath:instancePath+"/as_of",schemaPath:"#/properties/as_of/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
errors = _errs3;
if(vErrors !== null){
if(_errs3){
vErrors.length = _errs3;
}
else {
vErrors = null;
}
}
}
}
if(data.snapshot_known_at !== undefined){
let data1 = data.snapshot_known_at;
if(typeof data1 === "string"){
if(!pattern19.test(data1)){
const err13 = {instancePath:instancePath+"/snapshot_known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!(formats0.validate(data1))){
const err14 = {instancePath:instancePath+"/snapshot_known_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err15 = {instancePath:instancePath+"/snapshot_known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.request_known_at !== undefined){
let data2 = data.request_known_at;
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
const err16 = {instancePath:instancePath+"/request_known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!(formats0.validate(data2))){
const err17 = {instancePath:instancePath+"/request_known_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err18 = {instancePath:instancePath+"/request_known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.publication_id !== undefined){
if(!(validate563(data.publication_id, {instancePath:instancePath+"/publication_id",parentData:data,parentDataProperty:"publication_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate563.errors : vErrors.concat(validate563.errors);
errors = vErrors.length;
}
}
if(data.direction !== undefined){
let data4 = data.direction;
if(!((data4 === "GAINERS") || (data4 === "LOSERS"))){
const err19 = {instancePath:instancePath+"/direction",schemaPath:"#/properties/direction/enum",keyword:"enum",params:{allowedValues: schema1012.properties.direction.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.page_size !== undefined){
let data5 = data.page_size;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err20 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 100 || isNaN(data5)){
const err21 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data5 < 1 || isNaN(data5)){
const err22 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.cursor !== undefined){
let data6 = data.cursor;
const _errs21 = errors;
let valid6 = false;
let passing1 = null;
const _errs22 = errors;
if(typeof data6 === "string"){
if(func2(data6) > 8192){
const err23 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/nullableCursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(func2(data6) < 1){
const err24 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/nullableCursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!pattern73.test(data6)){
const err25 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/nullableCursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
const err26 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/nullableCursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
var _valid1 = _errs22 === errors;
if(_valid1){
valid6 = true;
passing1 = 0;
}
const _errs24 = errors;
if(data6 !== null){
const err27 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/nullableCursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
var _valid1 = _errs24 === errors;
if(_valid1 && valid6){
valid6 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid6 = true;
passing1 = 1;
}
}
if(!valid6){
const err28 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/nullableCursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
else {
errors = _errs21;
if(vErrors !== null){
if(_errs21){
vErrors.length = _errs21;
}
else {
vErrors = null;
}
}
}
}
if(data.filters !== undefined){
if(!(validate565(data.filters, {instancePath:instancePath+"/filters",parentData:data,parentDataProperty:"filters",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate565.errors : vErrors.concat(validate565.errors);
errors = vErrors.length;
}
}
}
else {
const err29 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
validate562.errors = vErrors;
return errors === 0;
}
validate562.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema1021 = {"type":"object","additionalProperties":false,"required":["publication_id","manifest_hash","result_as_of","input_available_at","public_available_at","published_at","freshness_anchor_at","fresh_until","retain_until","freshness","supersedes_publication_id","producer_release","numeric_profile","rights_release_code","rights_maximum_public_members_per_direction","evidence_release_code","catalog","accounting","tiering_policy","window_start_date","evidence_class","evidence_disclosure","currency_disclosure"],"properties":{"publication_id":{"$ref":"#/$defs/sha256"},"manifest_hash":{"$ref":"#/$defs/sha256"},"result_as_of":{"$ref":"#/$defs/date"},"input_available_at":{"$ref":"#/$defs/timestamp"},"public_available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"freshness_anchor_at":{"$ref":"#/$defs/timestamp"},"fresh_until":{"$ref":"#/$defs/timestamp"},"retain_until":{"$ref":"#/$defs/timestamp"},"freshness":{"enum":["FRESH","STALE_RETAINED"]},"supersedes_publication_id":{"$ref":"#/$defs/nullableSha256"},"producer_release":{"$ref":"#/$defs/producerRelease"},"numeric_profile":{"$ref":"#/$defs/numericProfile"},"rights_release_code":{"$ref":"#/$defs/identifier"},"rights_maximum_public_members_per_direction":{"type":"integer","minimum":1,"maximum":50},"evidence_release_code":{"$ref":"#/$defs/identifier"},"catalog":{"$ref":"#/$defs/catalogDescriptor"},"accounting":{"$ref":"#/$defs/accounting"},"tiering_policy":{"type":"object","additionalProperties":false,"required":["policy_id","policy_code","evidence_class","allowed_missing_reasons","minimum_supported_endpoint_ratio_bps","public_readiness_policy_id","minimum_qualified_three_source_endpoint_ratio_bps","minimum_public_candidates_per_direction","empty_public_lane_state","public_primary_grade","two_source_publication_state"],"properties":{"policy_id":{"$ref":"#/$defs/sha256"},"policy_code":{"$ref":"#/$defs/identifier"},"evidence_class":{"enum":["RECONSTRUCTED_HISTORY","HYBRID_BRIDGED","CONTEMPORANEOUSLY_MEASURED"]},"allowed_missing_reasons":{"type":"array","uniqueItems":true,"maxItems":3,"items":{"enum":["PROVIDER_HISTORY_SOURCE_ABSENT","NO_ACTIVE_ASK"]}},"minimum_supported_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"public_readiness_policy_id":{"$ref":"#/$defs/sha256"},"minimum_qualified_three_source_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"minimum_public_candidates_per_direction":{"type":"integer","minimum":1,"maximum":50},"empty_public_lane_state":{"const":"WITHHOLD_PUBLICATION"},"public_primary_grade":{"const":"THREE_SOURCE_CONFIRMED"},"two_source_publication_state":{"const":"WITHHELD_PENDING_SEPARATE_RIGHTS_AND_PRODUCT_APPROVAL"}}},"window_start_date":{"$ref":"#/$defs/date"},"evidence_class":{"enum":["RECONSTRUCTED_HISTORY","HYBRID_BRIDGED","CONTEMPORANEOUSLY_MEASURED"]},"evidence_disclosure":{"type":"object","additionalProperties":false,"required":["start_endpoint_acquisition","end_endpoint_acquisition","historical_obtained_at","late_bound_current_membership","pit_membership_claimed","prospective_continuity_credit","public_label"],"properties":{"start_endpoint_acquisition":{"enum":["HISTORICAL_PROVIDER_ARCHIVE","CONTEMPORANEOUS_EOD"]},"end_endpoint_acquisition":{"enum":["HISTORICAL_PROVIDER_ARCHIVE","CONTEMPORANEOUS_EOD"]},"historical_obtained_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]},"late_bound_current_membership":{"type":"boolean"},"pit_membership_claimed":{"const":false},"prospective_continuity_credit":{"type":"boolean"},"public_label":{"enum":["历史重建","混合桥接","当前实测"]}}},"currency_disclosure":{"type":"object","additionalProperties":false,"required":["source_currency","source_native_semantics","analysis_currency","analysis_semantics","conversion_policy","start_fx_source_event_date","end_fx_source_event_date","current_fx_repricing_forbidden"],"properties":{"source_currency":{"const":"USD"},"source_native_semantics":{"const":"UPSTREAM_PROVIDER_USD_REFERENCE_NOT_PROVEN_PLATFORM_NATIVE"},"analysis_currency":{"const":"CNY"},"analysis_semantics":{"const":"FX_RECONSTRUCTED_CNY_REFERENCE"},"conversion_policy":{"const":"analysis-cny-minor-half-even/1"},"start_fx_source_event_date":{"$ref":"#/$defs/date"},"end_fx_source_event_date":{"$ref":"#/$defs/date"},"current_fx_repricing_forbidden":{"const":true}}}}};
const func9 = Object.prototype.hasOwnProperty;
const func0 = __wireEqual;
const schema1031 = {"type":"object","additionalProperties":false,"required":["release_code","algorithm_version","data_quality_policy_version","public_top_n_per_direction"],"properties":{"release_code":{"$ref":"#/$defs/identifier"},"algorithm_version":{"$ref":"#/$defs/identifier"},"data_quality_policy_version":{"$ref":"#/$defs/identifier"},"public_top_n_per_direction":{"type":"integer","minimum":1,"maximum":50}}};

function validate570(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate570.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.release_code === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "release_code"},message:"must have required property '"+"release_code"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.algorithm_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "algorithm_version"},message:"must have required property '"+"algorithm_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.data_quality_policy_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_quality_policy_version"},message:"must have required property '"+"data_quality_policy_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.public_top_n_per_direction === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "public_top_n_per_direction"},message:"must have required property '"+"public_top_n_per_direction"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "release_code") || (key0 === "algorithm_version")) || (key0 === "data_quality_policy_version")) || (key0 === "public_top_n_per_direction"))){
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
if(data.release_code !== undefined){
let data0 = data.release_code;
if(typeof data0 === "string"){
if(func2(data0) > 512){
const err5 = {instancePath:instancePath+"/release_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data0) < 1){
const err6 = {instancePath:instancePath+"/release_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern87.test(data0)){
const err7 = {instancePath:instancePath+"/release_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/release_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.algorithm_version !== undefined){
let data1 = data.algorithm_version;
if(typeof data1 === "string"){
if(func2(data1) > 512){
const err9 = {instancePath:instancePath+"/algorithm_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(func2(data1) < 1){
const err10 = {instancePath:instancePath+"/algorithm_version",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern87.test(data1)){
const err11 = {instancePath:instancePath+"/algorithm_version",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err12 = {instancePath:instancePath+"/algorithm_version",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.data_quality_policy_version !== undefined){
let data2 = data.data_quality_policy_version;
if(typeof data2 === "string"){
if(func2(data2) > 512){
const err13 = {instancePath:instancePath+"/data_quality_policy_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data2) < 1){
const err14 = {instancePath:instancePath+"/data_quality_policy_version",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern87.test(data2)){
const err15 = {instancePath:instancePath+"/data_quality_policy_version",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err16 = {instancePath:instancePath+"/data_quality_policy_version",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.public_top_n_per_direction !== undefined){
let data3 = data.public_top_n_per_direction;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err17 = {instancePath:instancePath+"/public_top_n_per_direction",schemaPath:"#/properties/public_top_n_per_direction/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 50 || isNaN(data3)){
const err18 = {instancePath:instancePath+"/public_top_n_per_direction",schemaPath:"#/properties/public_top_n_per_direction/maximum",keyword:"maximum",params:{comparison: "<=", limit: 50},message:"must be <= 50"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data3 < 1 || isNaN(data3)){
const err19 = {instancePath:instancePath+"/public_top_n_per_direction",schemaPath:"#/properties/public_top_n_per_direction/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
}
else {
const err20 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
validate570.errors = vErrors;
return errors === 0;
}
validate570.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema1035 = {"type":"object","additionalProperties":false,"required":["profile_code","method_id","segment","horizon_days","analysis_currency","minimum_endpoint_cny_minor","minimum_abs_leg_delta_cny_minor"],"properties":{"profile_code":{"$ref":"#/$defs/identifier"},"method_id":{"const":"M3"},"segment":{"const":"SOURCE_TIERED_HISTORY_HYBRID"},"horizon_days":{"const":30},"analysis_currency":{"const":"CNY"},"minimum_endpoint_cny_minor":{"type":"integer","minimum":1},"minimum_abs_leg_delta_cny_minor":{"type":"integer","minimum":1}}};

function validate572(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate572.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.profile_code === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "profile_code"},message:"must have required property '"+"profile_code"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.method_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "method_id"},message:"must have required property '"+"method_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.segment === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "segment"},message:"must have required property '"+"segment"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.horizon_days === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "horizon_days"},message:"must have required property '"+"horizon_days"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.analysis_currency === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_currency"},message:"must have required property '"+"analysis_currency"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.minimum_endpoint_cny_minor === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "minimum_endpoint_cny_minor"},message:"must have required property '"+"minimum_endpoint_cny_minor"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.minimum_abs_leg_delta_cny_minor === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "minimum_abs_leg_delta_cny_minor"},message:"must have required property '"+"minimum_abs_leg_delta_cny_minor"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "profile_code") || (key0 === "method_id")) || (key0 === "segment")) || (key0 === "horizon_days")) || (key0 === "analysis_currency")) || (key0 === "minimum_endpoint_cny_minor")) || (key0 === "minimum_abs_leg_delta_cny_minor"))){
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
if(data.profile_code !== undefined){
let data0 = data.profile_code;
if(typeof data0 === "string"){
if(func2(data0) > 512){
const err8 = {instancePath:instancePath+"/profile_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data0) < 1){
const err9 = {instancePath:instancePath+"/profile_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern87.test(data0)){
const err10 = {instancePath:instancePath+"/profile_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/profile_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.method_id !== undefined){
if("M3" !== data.method_id){
const err12 = {instancePath:instancePath+"/method_id",schemaPath:"#/properties/method_id/const",keyword:"const",params:{allowedValue: "M3"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.segment !== undefined){
if("SOURCE_TIERED_HISTORY_HYBRID" !== data.segment){
const err13 = {instancePath:instancePath+"/segment",schemaPath:"#/properties/segment/const",keyword:"const",params:{allowedValue: "SOURCE_TIERED_HISTORY_HYBRID"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.horizon_days !== undefined){
if(30 !== data.horizon_days){
const err14 = {instancePath:instancePath+"/horizon_days",schemaPath:"#/properties/horizon_days/const",keyword:"const",params:{allowedValue: 30},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.analysis_currency !== undefined){
if("CNY" !== data.analysis_currency){
const err15 = {instancePath:instancePath+"/analysis_currency",schemaPath:"#/properties/analysis_currency/const",keyword:"const",params:{allowedValue: "CNY"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.minimum_endpoint_cny_minor !== undefined){
let data5 = data.minimum_endpoint_cny_minor;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err16 = {instancePath:instancePath+"/minimum_endpoint_cny_minor",schemaPath:"#/properties/minimum_endpoint_cny_minor/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 < 1 || isNaN(data5)){
const err17 = {instancePath:instancePath+"/minimum_endpoint_cny_minor",schemaPath:"#/properties/minimum_endpoint_cny_minor/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.minimum_abs_leg_delta_cny_minor !== undefined){
let data6 = data.minimum_abs_leg_delta_cny_minor;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err18 = {instancePath:instancePath+"/minimum_abs_leg_delta_cny_minor",schemaPath:"#/properties/minimum_abs_leg_delta_cny_minor/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 < 1 || isNaN(data6)){
const err19 = {instancePath:instancePath+"/minimum_abs_leg_delta_cny_minor",schemaPath:"#/properties/minimum_abs_leg_delta_cny_minor/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
}
else {
const err20 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
validate572.errors = vErrors;
return errors === 0;
}
validate572.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema1039 = {"type":"object","additionalProperties":false,"required":["catalog_publication_id","snapshot_id","catalog_version","as_of","available_at","published_at","member_count","member_set_hash","decision","withdrawn"],"properties":{"catalog_publication_id":{"$ref":"#/$defs/sha256"},"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_version":{"$ref":"#/$defs/identifier"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"member_count":{"type":"integer","minimum":1},"member_set_hash":{"$ref":"#/$defs/sha256"},"decision":{"const":"APPROVED"},"withdrawn":{"const":false}}};

function validate574(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate574.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.catalog_publication_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_publication_id"},message:"must have required property '"+"catalog_publication_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.snapshot_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
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
if(data.as_of === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "as_of"},message:"must have required property '"+"as_of"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.available_at === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.published_at === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at"},message:"must have required property '"+"published_at"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.member_count === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_count"},message:"must have required property '"+"member_count"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.member_set_hash === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_set_hash"},message:"must have required property '"+"member_set_hash"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.decision === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "decision"},message:"must have required property '"+"decision"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.withdrawn === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "withdrawn"},message:"must have required property '"+"withdrawn"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema1039.properties, key0))){
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
if(data.catalog_publication_id !== undefined){
let data0 = data.catalog_publication_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err11 = {instancePath:instancePath+"/catalog_publication_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err12 = {instancePath:instancePath+"/catalog_publication_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.snapshot_id !== undefined){
let data1 = data.snapshot_id;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err13 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err14 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.catalog_version !== undefined){
let data2 = data.catalog_version;
if(typeof data2 === "string"){
if(func2(data2) > 512){
const err15 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(func2(data2) < 1){
const err16 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern87.test(data2)){
const err17 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err18 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.as_of !== undefined){
let data3 = data.as_of;
if(typeof data3 === "string"){
if(!pattern19.test(data3)){
const err19 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!(formats0.validate(data3))){
const err20 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
else {
const err21 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.available_at !== undefined){
let data4 = data.available_at;
if(typeof data4 === "string"){
if(!pattern19.test(data4)){
const err22 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!(formats0.validate(data4))){
const err23 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err24 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.published_at !== undefined){
let data5 = data.published_at;
if(typeof data5 === "string"){
if(!pattern19.test(data5)){
const err25 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!(formats0.validate(data5))){
const err26 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
else {
const err27 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.member_count !== undefined){
let data6 = data.member_count;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err28 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 < 1 || isNaN(data6)){
const err29 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.member_set_hash !== undefined){
let data7 = data.member_set_hash;
if(typeof data7 === "string"){
if(!pattern5.test(data7)){
const err30 = {instancePath:instancePath+"/member_set_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
else {
const err31 = {instancePath:instancePath+"/member_set_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.decision !== undefined){
if("APPROVED" !== data.decision){
const err32 = {instancePath:instancePath+"/decision",schemaPath:"#/properties/decision/const",keyword:"const",params:{allowedValue: "APPROVED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.withdrawn !== undefined){
if(false !== data.withdrawn){
const err33 = {instancePath:instancePath+"/withdrawn",schemaPath:"#/properties/withdrawn/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
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
const err34 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
validate574.errors = vErrors;
return errors === 0;
}
validate574.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema1047 = {"type":"object","additionalProperties":false,"required":["member_count","three_source_endpoint_count","three_source_endpoint_ratio_bps","direction_eligible_count","direction_eligible_ratio_bps","eligible_count","excluded_count","status_counts","gainer_count","loser_count","qualified_three_source_endpoint_count","qualified_three_source_endpoint_ratio_bps","qualified_two_source_endpoint_count","qualified_supported_endpoint_count","three_source_confirmed_count","two_source_supported_count","qualified_supported_endpoint_ratio_bps","source_endpoint_reason_counts"],"properties":{"member_count":{"type":"integer","minimum":1},"three_source_endpoint_count":{"type":"integer","minimum":0},"three_source_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"direction_eligible_count":{"type":"integer","minimum":0},"direction_eligible_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"eligible_count":{"type":"integer","minimum":0},"excluded_count":{"type":"integer","minimum":0},"status_counts":{"$ref":"#/$defs/statusCounts"},"gainer_count":{"type":"integer","minimum":0,"maximum":50},"loser_count":{"type":"integer","minimum":0,"maximum":50},"qualified_three_source_endpoint_count":{"type":"integer","minimum":0},"qualified_three_source_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"qualified_two_source_endpoint_count":{"type":"integer","minimum":0},"qualified_supported_endpoint_count":{"type":"integer","minimum":0},"three_source_confirmed_count":{"type":"integer","minimum":0},"two_source_supported_count":{"type":"integer","minimum":0},"qualified_supported_endpoint_ratio_bps":{"type":"integer","minimum":0,"maximum":10000},"source_endpoint_reason_counts":{"type":"object","additionalProperties":false,"required":["market_a","market_b","market_c"],"properties":{"market_a":{"type":"object","additionalProperties":false,"properties":{"QUALIFIED":{"type":"integer","minimum":0},"NO_ACTIVE_ASK":{"type":"integer","minimum":0},"QUOTE_VALUE_MISSING_OR_INVALID":{"type":"integer","minimum":0},"SOURCE_REFRESH_LAG":{"type":"integer","minimum":0},"MISSING_SOURCE_CLOCK":{"type":"integer","minimum":0},"TEMPORAL_VIOLATION":{"type":"integer","minimum":0},"INSUFFICIENT_SLOTS":{"type":"integer","minimum":0},"CONTRACT_MISMATCH":{"type":"integer","minimum":0},"EVIDENCE_UNAVAILABLE":{"type":"integer","minimum":0},"PROVIDER_HISTORY_SOURCE_ABSENT":{"type":"integer","minimum":0},"PROVIDER_HISTORY_NONPOSITIVE_ASK":{"type":"integer","minimum":0},"PROVIDER_HISTORY_CROSSED_BOOK":{"type":"integer","minimum":0}}},"market_b":{"type":"object","additionalProperties":false,"properties":{"QUALIFIED":{"type":"integer","minimum":0},"NO_ACTIVE_ASK":{"type":"integer","minimum":0},"QUOTE_VALUE_MISSING_OR_INVALID":{"type":"integer","minimum":0},"SOURCE_REFRESH_LAG":{"type":"integer","minimum":0},"MISSING_SOURCE_CLOCK":{"type":"integer","minimum":0},"TEMPORAL_VIOLATION":{"type":"integer","minimum":0},"INSUFFICIENT_SLOTS":{"type":"integer","minimum":0},"CONTRACT_MISMATCH":{"type":"integer","minimum":0},"EVIDENCE_UNAVAILABLE":{"type":"integer","minimum":0},"PROVIDER_HISTORY_SOURCE_ABSENT":{"type":"integer","minimum":0},"PROVIDER_HISTORY_NONPOSITIVE_ASK":{"type":"integer","minimum":0},"PROVIDER_HISTORY_CROSSED_BOOK":{"type":"integer","minimum":0}}},"market_c":{"type":"object","additionalProperties":false,"properties":{"QUALIFIED":{"type":"integer","minimum":0},"NO_ACTIVE_ASK":{"type":"integer","minimum":0},"QUOTE_VALUE_MISSING_OR_INVALID":{"type":"integer","minimum":0},"SOURCE_REFRESH_LAG":{"type":"integer","minimum":0},"MISSING_SOURCE_CLOCK":{"type":"integer","minimum":0},"TEMPORAL_VIOLATION":{"type":"integer","minimum":0},"INSUFFICIENT_SLOTS":{"type":"integer","minimum":0},"CONTRACT_MISMATCH":{"type":"integer","minimum":0},"EVIDENCE_UNAVAILABLE":{"type":"integer","minimum":0},"PROVIDER_HISTORY_SOURCE_ABSENT":{"type":"integer","minimum":0},"PROVIDER_HISTORY_NONPOSITIVE_ASK":{"type":"integer","minimum":0},"PROVIDER_HISTORY_CROSSED_BOOK":{"type":"integer","minimum":0}}}}}}};
const schema1048 = {"type":"object","additionalProperties":false,"required":["ELIGIBLE_A3","CONFLICTED_DIRECTION","INSUFFICIENT_THREE_SOURCES","FLAT_OR_ZERO_CONFLICT","WITHHELD_ANOMALY","WITHHELD_ANOMALY_UNKNOWN","WITHHELD_WINDOW_EVIDENCE","WITHHELD_MICROPRICE","STALE_ENDPOINT","TEMPORAL_VIOLATION","CONTRACT_MISMATCH","ELIGIBLE_A2","WITHHELD_SOURCE_EVIDENCE"],"properties":{"ELIGIBLE_A3":{"type":"integer","minimum":0},"CONFLICTED_DIRECTION":{"type":"integer","minimum":0},"INSUFFICIENT_THREE_SOURCES":{"type":"integer","minimum":0},"FLAT_OR_ZERO_CONFLICT":{"type":"integer","minimum":0},"WITHHELD_ANOMALY":{"type":"integer","minimum":0},"WITHHELD_ANOMALY_UNKNOWN":{"type":"integer","minimum":0},"WITHHELD_WINDOW_EVIDENCE":{"type":"integer","minimum":0},"WITHHELD_MICROPRICE":{"type":"integer","minimum":0},"STALE_ENDPOINT":{"type":"integer","minimum":0},"TEMPORAL_VIOLATION":{"type":"integer","minimum":0},"CONTRACT_MISMATCH":{"type":"integer","minimum":0},"ELIGIBLE_A2":{"type":"integer","minimum":0},"WITHHELD_SOURCE_EVIDENCE":{"type":"integer","minimum":0}}};

function validate576(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate576.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.member_count === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_count"},message:"must have required property '"+"member_count"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.three_source_endpoint_count === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "three_source_endpoint_count"},message:"must have required property '"+"three_source_endpoint_count"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.three_source_endpoint_ratio_bps === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "three_source_endpoint_ratio_bps"},message:"must have required property '"+"three_source_endpoint_ratio_bps"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.direction_eligible_count === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "direction_eligible_count"},message:"must have required property '"+"direction_eligible_count"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.direction_eligible_ratio_bps === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "direction_eligible_ratio_bps"},message:"must have required property '"+"direction_eligible_ratio_bps"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.eligible_count === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "eligible_count"},message:"must have required property '"+"eligible_count"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.excluded_count === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "excluded_count"},message:"must have required property '"+"excluded_count"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.status_counts === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status_counts"},message:"must have required property '"+"status_counts"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.gainer_count === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "gainer_count"},message:"must have required property '"+"gainer_count"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.loser_count === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "loser_count"},message:"must have required property '"+"loser_count"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.qualified_three_source_endpoint_count === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "qualified_three_source_endpoint_count"},message:"must have required property '"+"qualified_three_source_endpoint_count"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.qualified_three_source_endpoint_ratio_bps === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "qualified_three_source_endpoint_ratio_bps"},message:"must have required property '"+"qualified_three_source_endpoint_ratio_bps"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.qualified_two_source_endpoint_count === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "qualified_two_source_endpoint_count"},message:"must have required property '"+"qualified_two_source_endpoint_count"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.qualified_supported_endpoint_count === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "qualified_supported_endpoint_count"},message:"must have required property '"+"qualified_supported_endpoint_count"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.three_source_confirmed_count === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "three_source_confirmed_count"},message:"must have required property '"+"three_source_confirmed_count"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.two_source_supported_count === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "two_source_supported_count"},message:"must have required property '"+"two_source_supported_count"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.qualified_supported_endpoint_ratio_bps === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "qualified_supported_endpoint_ratio_bps"},message:"must have required property '"+"qualified_supported_endpoint_ratio_bps"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.source_endpoint_reason_counts === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_endpoint_reason_counts"},message:"must have required property '"+"source_endpoint_reason_counts"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema1047.properties, key0))){
const err18 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.member_count !== undefined){
let data0 = data.member_count;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err19 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 < 1 || isNaN(data0)){
const err20 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.three_source_endpoint_count !== undefined){
let data1 = data.three_source_endpoint_count;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err21 = {instancePath:instancePath+"/three_source_endpoint_count",schemaPath:"#/properties/three_source_endpoint_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 < 0 || isNaN(data1)){
const err22 = {instancePath:instancePath+"/three_source_endpoint_count",schemaPath:"#/properties/three_source_endpoint_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.three_source_endpoint_ratio_bps !== undefined){
let data2 = data.three_source_endpoint_ratio_bps;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err23 = {instancePath:instancePath+"/three_source_endpoint_ratio_bps",schemaPath:"#/properties/three_source_endpoint_ratio_bps/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 10000 || isNaN(data2)){
const err24 = {instancePath:instancePath+"/three_source_endpoint_ratio_bps",schemaPath:"#/properties/three_source_endpoint_ratio_bps/maximum",keyword:"maximum",params:{comparison: "<=", limit: 10000},message:"must be <= 10000"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err25 = {instancePath:instancePath+"/three_source_endpoint_ratio_bps",schemaPath:"#/properties/three_source_endpoint_ratio_bps/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.direction_eligible_count !== undefined){
let data3 = data.direction_eligible_count;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err26 = {instancePath:instancePath+"/direction_eligible_count",schemaPath:"#/properties/direction_eligible_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 < 0 || isNaN(data3)){
const err27 = {instancePath:instancePath+"/direction_eligible_count",schemaPath:"#/properties/direction_eligible_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.direction_eligible_ratio_bps !== undefined){
let data4 = data.direction_eligible_ratio_bps;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err28 = {instancePath:instancePath+"/direction_eligible_ratio_bps",schemaPath:"#/properties/direction_eligible_ratio_bps/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 10000 || isNaN(data4)){
const err29 = {instancePath:instancePath+"/direction_eligible_ratio_bps",schemaPath:"#/properties/direction_eligible_ratio_bps/maximum",keyword:"maximum",params:{comparison: "<=", limit: 10000},message:"must be <= 10000"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err30 = {instancePath:instancePath+"/direction_eligible_ratio_bps",schemaPath:"#/properties/direction_eligible_ratio_bps/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.eligible_count !== undefined){
let data5 = data.eligible_count;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err31 = {instancePath:instancePath+"/eligible_count",schemaPath:"#/properties/eligible_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 < 0 || isNaN(data5)){
const err32 = {instancePath:instancePath+"/eligible_count",schemaPath:"#/properties/eligible_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.excluded_count !== undefined){
let data6 = data.excluded_count;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err33 = {instancePath:instancePath+"/excluded_count",schemaPath:"#/properties/excluded_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 < 0 || isNaN(data6)){
const err34 = {instancePath:instancePath+"/excluded_count",schemaPath:"#/properties/excluded_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.status_counts !== undefined){
let data7 = data.status_counts;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.ELIGIBLE_A3 === undefined){
const err35 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "ELIGIBLE_A3"},message:"must have required property '"+"ELIGIBLE_A3"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data7.CONFLICTED_DIRECTION === undefined){
const err36 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "CONFLICTED_DIRECTION"},message:"must have required property '"+"CONFLICTED_DIRECTION"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data7.INSUFFICIENT_THREE_SOURCES === undefined){
const err37 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "INSUFFICIENT_THREE_SOURCES"},message:"must have required property '"+"INSUFFICIENT_THREE_SOURCES"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data7.FLAT_OR_ZERO_CONFLICT === undefined){
const err38 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "FLAT_OR_ZERO_CONFLICT"},message:"must have required property '"+"FLAT_OR_ZERO_CONFLICT"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data7.WITHHELD_ANOMALY === undefined){
const err39 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "WITHHELD_ANOMALY"},message:"must have required property '"+"WITHHELD_ANOMALY"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data7.WITHHELD_ANOMALY_UNKNOWN === undefined){
const err40 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "WITHHELD_ANOMALY_UNKNOWN"},message:"must have required property '"+"WITHHELD_ANOMALY_UNKNOWN"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data7.WITHHELD_WINDOW_EVIDENCE === undefined){
const err41 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "WITHHELD_WINDOW_EVIDENCE"},message:"must have required property '"+"WITHHELD_WINDOW_EVIDENCE"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data7.WITHHELD_MICROPRICE === undefined){
const err42 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "WITHHELD_MICROPRICE"},message:"must have required property '"+"WITHHELD_MICROPRICE"+"'"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data7.STALE_ENDPOINT === undefined){
const err43 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "STALE_ENDPOINT"},message:"must have required property '"+"STALE_ENDPOINT"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data7.TEMPORAL_VIOLATION === undefined){
const err44 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "TEMPORAL_VIOLATION"},message:"must have required property '"+"TEMPORAL_VIOLATION"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data7.CONTRACT_MISMATCH === undefined){
const err45 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "CONTRACT_MISMATCH"},message:"must have required property '"+"CONTRACT_MISMATCH"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data7.ELIGIBLE_A2 === undefined){
const err46 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "ELIGIBLE_A2"},message:"must have required property '"+"ELIGIBLE_A2"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data7.WITHHELD_SOURCE_EVIDENCE === undefined){
const err47 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/required",keyword:"required",params:{missingProperty: "WITHHELD_SOURCE_EVIDENCE"},message:"must have required property '"+"WITHHELD_SOURCE_EVIDENCE"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
for(const key1 in data7){
if(!(func9.call(schema1048.properties, key1))){
const err48 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data7.ELIGIBLE_A3 !== undefined){
let data8 = data7.ELIGIBLE_A3;
if(!(((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))) && (isFinite(data8)))){
const err49 = {instancePath:instancePath+"/status_counts/ELIGIBLE_A3",schemaPath:"#/$defs/statusCounts/properties/ELIGIBLE_A3/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 < 0 || isNaN(data8)){
const err50 = {instancePath:instancePath+"/status_counts/ELIGIBLE_A3",schemaPath:"#/$defs/statusCounts/properties/ELIGIBLE_A3/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
}
if(data7.CONFLICTED_DIRECTION !== undefined){
let data9 = data7.CONFLICTED_DIRECTION;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err51 = {instancePath:instancePath+"/status_counts/CONFLICTED_DIRECTION",schemaPath:"#/$defs/statusCounts/properties/CONFLICTED_DIRECTION/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if((typeof data9 == "number") && (isFinite(data9))){
if(data9 < 0 || isNaN(data9)){
const err52 = {instancePath:instancePath+"/status_counts/CONFLICTED_DIRECTION",schemaPath:"#/$defs/statusCounts/properties/CONFLICTED_DIRECTION/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data7.INSUFFICIENT_THREE_SOURCES !== undefined){
let data10 = data7.INSUFFICIENT_THREE_SOURCES;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err53 = {instancePath:instancePath+"/status_counts/INSUFFICIENT_THREE_SOURCES",schemaPath:"#/$defs/statusCounts/properties/INSUFFICIENT_THREE_SOURCES/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 < 0 || isNaN(data10)){
const err54 = {instancePath:instancePath+"/status_counts/INSUFFICIENT_THREE_SOURCES",schemaPath:"#/$defs/statusCounts/properties/INSUFFICIENT_THREE_SOURCES/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data7.FLAT_OR_ZERO_CONFLICT !== undefined){
let data11 = data7.FLAT_OR_ZERO_CONFLICT;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err55 = {instancePath:instancePath+"/status_counts/FLAT_OR_ZERO_CONFLICT",schemaPath:"#/$defs/statusCounts/properties/FLAT_OR_ZERO_CONFLICT/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 < 0 || isNaN(data11)){
const err56 = {instancePath:instancePath+"/status_counts/FLAT_OR_ZERO_CONFLICT",schemaPath:"#/$defs/statusCounts/properties/FLAT_OR_ZERO_CONFLICT/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data7.WITHHELD_ANOMALY !== undefined){
let data12 = data7.WITHHELD_ANOMALY;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err57 = {instancePath:instancePath+"/status_counts/WITHHELD_ANOMALY",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_ANOMALY/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 < 0 || isNaN(data12)){
const err58 = {instancePath:instancePath+"/status_counts/WITHHELD_ANOMALY",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_ANOMALY/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
}
if(data7.WITHHELD_ANOMALY_UNKNOWN !== undefined){
let data13 = data7.WITHHELD_ANOMALY_UNKNOWN;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err59 = {instancePath:instancePath+"/status_counts/WITHHELD_ANOMALY_UNKNOWN",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_ANOMALY_UNKNOWN/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 < 0 || isNaN(data13)){
const err60 = {instancePath:instancePath+"/status_counts/WITHHELD_ANOMALY_UNKNOWN",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_ANOMALY_UNKNOWN/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
}
if(data7.WITHHELD_WINDOW_EVIDENCE !== undefined){
let data14 = data7.WITHHELD_WINDOW_EVIDENCE;
if(!(((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))) && (isFinite(data14)))){
const err61 = {instancePath:instancePath+"/status_counts/WITHHELD_WINDOW_EVIDENCE",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_WINDOW_EVIDENCE/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if((typeof data14 == "number") && (isFinite(data14))){
if(data14 < 0 || isNaN(data14)){
const err62 = {instancePath:instancePath+"/status_counts/WITHHELD_WINDOW_EVIDENCE",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_WINDOW_EVIDENCE/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
}
if(data7.WITHHELD_MICROPRICE !== undefined){
let data15 = data7.WITHHELD_MICROPRICE;
if(!(((typeof data15 == "number") && (!(data15 % 1) && !isNaN(data15))) && (isFinite(data15)))){
const err63 = {instancePath:instancePath+"/status_counts/WITHHELD_MICROPRICE",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_MICROPRICE/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if((typeof data15 == "number") && (isFinite(data15))){
if(data15 < 0 || isNaN(data15)){
const err64 = {instancePath:instancePath+"/status_counts/WITHHELD_MICROPRICE",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_MICROPRICE/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
}
if(data7.STALE_ENDPOINT !== undefined){
let data16 = data7.STALE_ENDPOINT;
if(!(((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16))) && (isFinite(data16)))){
const err65 = {instancePath:instancePath+"/status_counts/STALE_ENDPOINT",schemaPath:"#/$defs/statusCounts/properties/STALE_ENDPOINT/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if((typeof data16 == "number") && (isFinite(data16))){
if(data16 < 0 || isNaN(data16)){
const err66 = {instancePath:instancePath+"/status_counts/STALE_ENDPOINT",schemaPath:"#/$defs/statusCounts/properties/STALE_ENDPOINT/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
}
if(data7.TEMPORAL_VIOLATION !== undefined){
let data17 = data7.TEMPORAL_VIOLATION;
if(!(((typeof data17 == "number") && (!(data17 % 1) && !isNaN(data17))) && (isFinite(data17)))){
const err67 = {instancePath:instancePath+"/status_counts/TEMPORAL_VIOLATION",schemaPath:"#/$defs/statusCounts/properties/TEMPORAL_VIOLATION/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if((typeof data17 == "number") && (isFinite(data17))){
if(data17 < 0 || isNaN(data17)){
const err68 = {instancePath:instancePath+"/status_counts/TEMPORAL_VIOLATION",schemaPath:"#/$defs/statusCounts/properties/TEMPORAL_VIOLATION/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
}
if(data7.CONTRACT_MISMATCH !== undefined){
let data18 = data7.CONTRACT_MISMATCH;
if(!(((typeof data18 == "number") && (!(data18 % 1) && !isNaN(data18))) && (isFinite(data18)))){
const err69 = {instancePath:instancePath+"/status_counts/CONTRACT_MISMATCH",schemaPath:"#/$defs/statusCounts/properties/CONTRACT_MISMATCH/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if((typeof data18 == "number") && (isFinite(data18))){
if(data18 < 0 || isNaN(data18)){
const err70 = {instancePath:instancePath+"/status_counts/CONTRACT_MISMATCH",schemaPath:"#/$defs/statusCounts/properties/CONTRACT_MISMATCH/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
}
if(data7.ELIGIBLE_A2 !== undefined){
let data19 = data7.ELIGIBLE_A2;
if(!(((typeof data19 == "number") && (!(data19 % 1) && !isNaN(data19))) && (isFinite(data19)))){
const err71 = {instancePath:instancePath+"/status_counts/ELIGIBLE_A2",schemaPath:"#/$defs/statusCounts/properties/ELIGIBLE_A2/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if((typeof data19 == "number") && (isFinite(data19))){
if(data19 < 0 || isNaN(data19)){
const err72 = {instancePath:instancePath+"/status_counts/ELIGIBLE_A2",schemaPath:"#/$defs/statusCounts/properties/ELIGIBLE_A2/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
}
if(data7.WITHHELD_SOURCE_EVIDENCE !== undefined){
let data20 = data7.WITHHELD_SOURCE_EVIDENCE;
if(!(((typeof data20 == "number") && (!(data20 % 1) && !isNaN(data20))) && (isFinite(data20)))){
const err73 = {instancePath:instancePath+"/status_counts/WITHHELD_SOURCE_EVIDENCE",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_SOURCE_EVIDENCE/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if((typeof data20 == "number") && (isFinite(data20))){
if(data20 < 0 || isNaN(data20)){
const err74 = {instancePath:instancePath+"/status_counts/WITHHELD_SOURCE_EVIDENCE",schemaPath:"#/$defs/statusCounts/properties/WITHHELD_SOURCE_EVIDENCE/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
}
}
else {
const err75 = {instancePath:instancePath+"/status_counts",schemaPath:"#/$defs/statusCounts/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data.gainer_count !== undefined){
let data21 = data.gainer_count;
if(!(((typeof data21 == "number") && (!(data21 % 1) && !isNaN(data21))) && (isFinite(data21)))){
const err76 = {instancePath:instancePath+"/gainer_count",schemaPath:"#/properties/gainer_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if((typeof data21 == "number") && (isFinite(data21))){
if(data21 > 50 || isNaN(data21)){
const err77 = {instancePath:instancePath+"/gainer_count",schemaPath:"#/properties/gainer_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 50},message:"must be <= 50"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data21 < 0 || isNaN(data21)){
const err78 = {instancePath:instancePath+"/gainer_count",schemaPath:"#/properties/gainer_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
}
if(data.loser_count !== undefined){
let data22 = data.loser_count;
if(!(((typeof data22 == "number") && (!(data22 % 1) && !isNaN(data22))) && (isFinite(data22)))){
const err79 = {instancePath:instancePath+"/loser_count",schemaPath:"#/properties/loser_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if((typeof data22 == "number") && (isFinite(data22))){
if(data22 > 50 || isNaN(data22)){
const err80 = {instancePath:instancePath+"/loser_count",schemaPath:"#/properties/loser_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 50},message:"must be <= 50"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data22 < 0 || isNaN(data22)){
const err81 = {instancePath:instancePath+"/loser_count",schemaPath:"#/properties/loser_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
}
if(data.qualified_three_source_endpoint_count !== undefined){
let data23 = data.qualified_three_source_endpoint_count;
if(!(((typeof data23 == "number") && (!(data23 % 1) && !isNaN(data23))) && (isFinite(data23)))){
const err82 = {instancePath:instancePath+"/qualified_three_source_endpoint_count",schemaPath:"#/properties/qualified_three_source_endpoint_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if((typeof data23 == "number") && (isFinite(data23))){
if(data23 < 0 || isNaN(data23)){
const err83 = {instancePath:instancePath+"/qualified_three_source_endpoint_count",schemaPath:"#/properties/qualified_three_source_endpoint_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
}
if(data.qualified_three_source_endpoint_ratio_bps !== undefined){
let data24 = data.qualified_three_source_endpoint_ratio_bps;
if(!(((typeof data24 == "number") && (!(data24 % 1) && !isNaN(data24))) && (isFinite(data24)))){
const err84 = {instancePath:instancePath+"/qualified_three_source_endpoint_ratio_bps",schemaPath:"#/properties/qualified_three_source_endpoint_ratio_bps/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if((typeof data24 == "number") && (isFinite(data24))){
if(data24 > 10000 || isNaN(data24)){
const err85 = {instancePath:instancePath+"/qualified_three_source_endpoint_ratio_bps",schemaPath:"#/properties/qualified_three_source_endpoint_ratio_bps/maximum",keyword:"maximum",params:{comparison: "<=", limit: 10000},message:"must be <= 10000"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(data24 < 0 || isNaN(data24)){
const err86 = {instancePath:instancePath+"/qualified_three_source_endpoint_ratio_bps",schemaPath:"#/properties/qualified_three_source_endpoint_ratio_bps/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
}
if(data.qualified_two_source_endpoint_count !== undefined){
let data25 = data.qualified_two_source_endpoint_count;
if(!(((typeof data25 == "number") && (!(data25 % 1) && !isNaN(data25))) && (isFinite(data25)))){
const err87 = {instancePath:instancePath+"/qualified_two_source_endpoint_count",schemaPath:"#/properties/qualified_two_source_endpoint_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if((typeof data25 == "number") && (isFinite(data25))){
if(data25 < 0 || isNaN(data25)){
const err88 = {instancePath:instancePath+"/qualified_two_source_endpoint_count",schemaPath:"#/properties/qualified_two_source_endpoint_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
}
if(data.qualified_supported_endpoint_count !== undefined){
let data26 = data.qualified_supported_endpoint_count;
if(!(((typeof data26 == "number") && (!(data26 % 1) && !isNaN(data26))) && (isFinite(data26)))){
const err89 = {instancePath:instancePath+"/qualified_supported_endpoint_count",schemaPath:"#/properties/qualified_supported_endpoint_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if((typeof data26 == "number") && (isFinite(data26))){
if(data26 < 0 || isNaN(data26)){
const err90 = {instancePath:instancePath+"/qualified_supported_endpoint_count",schemaPath:"#/properties/qualified_supported_endpoint_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
}
if(data.three_source_confirmed_count !== undefined){
let data27 = data.three_source_confirmed_count;
if(!(((typeof data27 == "number") && (!(data27 % 1) && !isNaN(data27))) && (isFinite(data27)))){
const err91 = {instancePath:instancePath+"/three_source_confirmed_count",schemaPath:"#/properties/three_source_confirmed_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if((typeof data27 == "number") && (isFinite(data27))){
if(data27 < 0 || isNaN(data27)){
const err92 = {instancePath:instancePath+"/three_source_confirmed_count",schemaPath:"#/properties/three_source_confirmed_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
}
if(data.two_source_supported_count !== undefined){
let data28 = data.two_source_supported_count;
if(!(((typeof data28 == "number") && (!(data28 % 1) && !isNaN(data28))) && (isFinite(data28)))){
const err93 = {instancePath:instancePath+"/two_source_supported_count",schemaPath:"#/properties/two_source_supported_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if((typeof data28 == "number") && (isFinite(data28))){
if(data28 < 0 || isNaN(data28)){
const err94 = {instancePath:instancePath+"/two_source_supported_count",schemaPath:"#/properties/two_source_supported_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
}
if(data.qualified_supported_endpoint_ratio_bps !== undefined){
let data29 = data.qualified_supported_endpoint_ratio_bps;
if(!(((typeof data29 == "number") && (!(data29 % 1) && !isNaN(data29))) && (isFinite(data29)))){
const err95 = {instancePath:instancePath+"/qualified_supported_endpoint_ratio_bps",schemaPath:"#/properties/qualified_supported_endpoint_ratio_bps/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if((typeof data29 == "number") && (isFinite(data29))){
if(data29 > 10000 || isNaN(data29)){
const err96 = {instancePath:instancePath+"/qualified_supported_endpoint_ratio_bps",schemaPath:"#/properties/qualified_supported_endpoint_ratio_bps/maximum",keyword:"maximum",params:{comparison: "<=", limit: 10000},message:"must be <= 10000"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data29 < 0 || isNaN(data29)){
const err97 = {instancePath:instancePath+"/qualified_supported_endpoint_ratio_bps",schemaPath:"#/properties/qualified_supported_endpoint_ratio_bps/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
}
if(data.source_endpoint_reason_counts !== undefined){
let data30 = data.source_endpoint_reason_counts;
if(data30 && typeof data30 == "object" && !Array.isArray(data30)){
if(data30.market_a === undefined){
const err98 = {instancePath:instancePath+"/source_endpoint_reason_counts",schemaPath:"#/properties/source_endpoint_reason_counts/required",keyword:"required",params:{missingProperty: "market_a"},message:"must have required property '"+"market_a"+"'"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data30.market_b === undefined){
const err99 = {instancePath:instancePath+"/source_endpoint_reason_counts",schemaPath:"#/properties/source_endpoint_reason_counts/required",keyword:"required",params:{missingProperty: "market_b"},message:"must have required property '"+"market_b"+"'"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
if(data30.market_c === undefined){
const err100 = {instancePath:instancePath+"/source_endpoint_reason_counts",schemaPath:"#/properties/source_endpoint_reason_counts/required",keyword:"required",params:{missingProperty: "market_c"},message:"must have required property '"+"market_c"+"'"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
for(const key2 in data30){
if(!(((key2 === "market_a") || (key2 === "market_b")) || (key2 === "market_c"))){
const err101 = {instancePath:instancePath+"/source_endpoint_reason_counts",schemaPath:"#/properties/source_endpoint_reason_counts/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(data30.market_a !== undefined){
let data31 = data30.market_a;
if(data31 && typeof data31 == "object" && !Array.isArray(data31)){
for(const key3 in data31){
if(!(func9.call(schema1047.properties.source_endpoint_reason_counts.properties.market_a.properties, key3))){
const err102 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
if(data31.QUALIFIED !== undefined){
let data32 = data31.QUALIFIED;
if(!(((typeof data32 == "number") && (!(data32 % 1) && !isNaN(data32))) && (isFinite(data32)))){
const err103 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/QUALIFIED",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/QUALIFIED/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if((typeof data32 == "number") && (isFinite(data32))){
if(data32 < 0 || isNaN(data32)){
const err104 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/QUALIFIED",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/QUALIFIED/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
}
if(data31.NO_ACTIVE_ASK !== undefined){
let data33 = data31.NO_ACTIVE_ASK;
if(!(((typeof data33 == "number") && (!(data33 % 1) && !isNaN(data33))) && (isFinite(data33)))){
const err105 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/NO_ACTIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/NO_ACTIVE_ASK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if((typeof data33 == "number") && (isFinite(data33))){
if(data33 < 0 || isNaN(data33)){
const err106 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/NO_ACTIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/NO_ACTIVE_ASK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
}
if(data31.QUOTE_VALUE_MISSING_OR_INVALID !== undefined){
let data34 = data31.QUOTE_VALUE_MISSING_OR_INVALID;
if(!(((typeof data34 == "number") && (!(data34 % 1) && !isNaN(data34))) && (isFinite(data34)))){
const err107 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/QUOTE_VALUE_MISSING_OR_INVALID",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/QUOTE_VALUE_MISSING_OR_INVALID/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if((typeof data34 == "number") && (isFinite(data34))){
if(data34 < 0 || isNaN(data34)){
const err108 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/QUOTE_VALUE_MISSING_OR_INVALID",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/QUOTE_VALUE_MISSING_OR_INVALID/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
}
if(data31.SOURCE_REFRESH_LAG !== undefined){
let data35 = data31.SOURCE_REFRESH_LAG;
if(!(((typeof data35 == "number") && (!(data35 % 1) && !isNaN(data35))) && (isFinite(data35)))){
const err109 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/SOURCE_REFRESH_LAG",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/SOURCE_REFRESH_LAG/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if((typeof data35 == "number") && (isFinite(data35))){
if(data35 < 0 || isNaN(data35)){
const err110 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/SOURCE_REFRESH_LAG",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/SOURCE_REFRESH_LAG/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
}
if(data31.MISSING_SOURCE_CLOCK !== undefined){
let data36 = data31.MISSING_SOURCE_CLOCK;
if(!(((typeof data36 == "number") && (!(data36 % 1) && !isNaN(data36))) && (isFinite(data36)))){
const err111 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/MISSING_SOURCE_CLOCK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/MISSING_SOURCE_CLOCK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if((typeof data36 == "number") && (isFinite(data36))){
if(data36 < 0 || isNaN(data36)){
const err112 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/MISSING_SOURCE_CLOCK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/MISSING_SOURCE_CLOCK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
}
}
if(data31.TEMPORAL_VIOLATION !== undefined){
let data37 = data31.TEMPORAL_VIOLATION;
if(!(((typeof data37 == "number") && (!(data37 % 1) && !isNaN(data37))) && (isFinite(data37)))){
const err113 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/TEMPORAL_VIOLATION",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/TEMPORAL_VIOLATION/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if((typeof data37 == "number") && (isFinite(data37))){
if(data37 < 0 || isNaN(data37)){
const err114 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/TEMPORAL_VIOLATION",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/TEMPORAL_VIOLATION/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
}
if(data31.INSUFFICIENT_SLOTS !== undefined){
let data38 = data31.INSUFFICIENT_SLOTS;
if(!(((typeof data38 == "number") && (!(data38 % 1) && !isNaN(data38))) && (isFinite(data38)))){
const err115 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/INSUFFICIENT_SLOTS",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/INSUFFICIENT_SLOTS/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
if((typeof data38 == "number") && (isFinite(data38))){
if(data38 < 0 || isNaN(data38)){
const err116 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/INSUFFICIENT_SLOTS",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/INSUFFICIENT_SLOTS/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
}
if(data31.CONTRACT_MISMATCH !== undefined){
let data39 = data31.CONTRACT_MISMATCH;
if(!(((typeof data39 == "number") && (!(data39 % 1) && !isNaN(data39))) && (isFinite(data39)))){
const err117 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/CONTRACT_MISMATCH",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/CONTRACT_MISMATCH/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
if((typeof data39 == "number") && (isFinite(data39))){
if(data39 < 0 || isNaN(data39)){
const err118 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/CONTRACT_MISMATCH",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/CONTRACT_MISMATCH/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
}
if(data31.EVIDENCE_UNAVAILABLE !== undefined){
let data40 = data31.EVIDENCE_UNAVAILABLE;
if(!(((typeof data40 == "number") && (!(data40 % 1) && !isNaN(data40))) && (isFinite(data40)))){
const err119 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/EVIDENCE_UNAVAILABLE",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/EVIDENCE_UNAVAILABLE/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if((typeof data40 == "number") && (isFinite(data40))){
if(data40 < 0 || isNaN(data40)){
const err120 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/EVIDENCE_UNAVAILABLE",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/EVIDENCE_UNAVAILABLE/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
}
if(data31.PROVIDER_HISTORY_SOURCE_ABSENT !== undefined){
let data41 = data31.PROVIDER_HISTORY_SOURCE_ABSENT;
if(!(((typeof data41 == "number") && (!(data41 % 1) && !isNaN(data41))) && (isFinite(data41)))){
const err121 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/PROVIDER_HISTORY_SOURCE_ABSENT",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/PROVIDER_HISTORY_SOURCE_ABSENT/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if((typeof data41 == "number") && (isFinite(data41))){
if(data41 < 0 || isNaN(data41)){
const err122 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/PROVIDER_HISTORY_SOURCE_ABSENT",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/PROVIDER_HISTORY_SOURCE_ABSENT/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
}
if(data31.PROVIDER_HISTORY_NONPOSITIVE_ASK !== undefined){
let data42 = data31.PROVIDER_HISTORY_NONPOSITIVE_ASK;
if(!(((typeof data42 == "number") && (!(data42 % 1) && !isNaN(data42))) && (isFinite(data42)))){
const err123 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/PROVIDER_HISTORY_NONPOSITIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/PROVIDER_HISTORY_NONPOSITIVE_ASK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if((typeof data42 == "number") && (isFinite(data42))){
if(data42 < 0 || isNaN(data42)){
const err124 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/PROVIDER_HISTORY_NONPOSITIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/PROVIDER_HISTORY_NONPOSITIVE_ASK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
}
if(data31.PROVIDER_HISTORY_CROSSED_BOOK !== undefined){
let data43 = data31.PROVIDER_HISTORY_CROSSED_BOOK;
if(!(((typeof data43 == "number") && (!(data43 % 1) && !isNaN(data43))) && (isFinite(data43)))){
const err125 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/PROVIDER_HISTORY_CROSSED_BOOK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/PROVIDER_HISTORY_CROSSED_BOOK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if((typeof data43 == "number") && (isFinite(data43))){
if(data43 < 0 || isNaN(data43)){
const err126 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a/PROVIDER_HISTORY_CROSSED_BOOK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/properties/PROVIDER_HISTORY_CROSSED_BOOK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
}
}
else {
const err127 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_a",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_a/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
if(data30.market_b !== undefined){
let data44 = data30.market_b;
if(data44 && typeof data44 == "object" && !Array.isArray(data44)){
for(const key4 in data44){
if(!(func9.call(schema1047.properties.source_endpoint_reason_counts.properties.market_b.properties, key4))){
const err128 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
if(data44.QUALIFIED !== undefined){
let data45 = data44.QUALIFIED;
if(!(((typeof data45 == "number") && (!(data45 % 1) && !isNaN(data45))) && (isFinite(data45)))){
const err129 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/QUALIFIED",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/QUALIFIED/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if((typeof data45 == "number") && (isFinite(data45))){
if(data45 < 0 || isNaN(data45)){
const err130 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/QUALIFIED",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/QUALIFIED/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
}
}
if(data44.NO_ACTIVE_ASK !== undefined){
let data46 = data44.NO_ACTIVE_ASK;
if(!(((typeof data46 == "number") && (!(data46 % 1) && !isNaN(data46))) && (isFinite(data46)))){
const err131 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/NO_ACTIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/NO_ACTIVE_ASK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
if((typeof data46 == "number") && (isFinite(data46))){
if(data46 < 0 || isNaN(data46)){
const err132 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/NO_ACTIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/NO_ACTIVE_ASK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
}
if(data44.QUOTE_VALUE_MISSING_OR_INVALID !== undefined){
let data47 = data44.QUOTE_VALUE_MISSING_OR_INVALID;
if(!(((typeof data47 == "number") && (!(data47 % 1) && !isNaN(data47))) && (isFinite(data47)))){
const err133 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/QUOTE_VALUE_MISSING_OR_INVALID",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/QUOTE_VALUE_MISSING_OR_INVALID/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
if((typeof data47 == "number") && (isFinite(data47))){
if(data47 < 0 || isNaN(data47)){
const err134 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/QUOTE_VALUE_MISSING_OR_INVALID",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/QUOTE_VALUE_MISSING_OR_INVALID/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
}
if(data44.SOURCE_REFRESH_LAG !== undefined){
let data48 = data44.SOURCE_REFRESH_LAG;
if(!(((typeof data48 == "number") && (!(data48 % 1) && !isNaN(data48))) && (isFinite(data48)))){
const err135 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/SOURCE_REFRESH_LAG",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/SOURCE_REFRESH_LAG/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
if((typeof data48 == "number") && (isFinite(data48))){
if(data48 < 0 || isNaN(data48)){
const err136 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/SOURCE_REFRESH_LAG",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/SOURCE_REFRESH_LAG/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
}
}
if(data44.MISSING_SOURCE_CLOCK !== undefined){
let data49 = data44.MISSING_SOURCE_CLOCK;
if(!(((typeof data49 == "number") && (!(data49 % 1) && !isNaN(data49))) && (isFinite(data49)))){
const err137 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/MISSING_SOURCE_CLOCK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/MISSING_SOURCE_CLOCK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if((typeof data49 == "number") && (isFinite(data49))){
if(data49 < 0 || isNaN(data49)){
const err138 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/MISSING_SOURCE_CLOCK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/MISSING_SOURCE_CLOCK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
}
if(data44.TEMPORAL_VIOLATION !== undefined){
let data50 = data44.TEMPORAL_VIOLATION;
if(!(((typeof data50 == "number") && (!(data50 % 1) && !isNaN(data50))) && (isFinite(data50)))){
const err139 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/TEMPORAL_VIOLATION",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/TEMPORAL_VIOLATION/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if((typeof data50 == "number") && (isFinite(data50))){
if(data50 < 0 || isNaN(data50)){
const err140 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/TEMPORAL_VIOLATION",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/TEMPORAL_VIOLATION/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
}
}
if(data44.INSUFFICIENT_SLOTS !== undefined){
let data51 = data44.INSUFFICIENT_SLOTS;
if(!(((typeof data51 == "number") && (!(data51 % 1) && !isNaN(data51))) && (isFinite(data51)))){
const err141 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/INSUFFICIENT_SLOTS",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/INSUFFICIENT_SLOTS/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if((typeof data51 == "number") && (isFinite(data51))){
if(data51 < 0 || isNaN(data51)){
const err142 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/INSUFFICIENT_SLOTS",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/INSUFFICIENT_SLOTS/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
}
}
if(data44.CONTRACT_MISMATCH !== undefined){
let data52 = data44.CONTRACT_MISMATCH;
if(!(((typeof data52 == "number") && (!(data52 % 1) && !isNaN(data52))) && (isFinite(data52)))){
const err143 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/CONTRACT_MISMATCH",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/CONTRACT_MISMATCH/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if((typeof data52 == "number") && (isFinite(data52))){
if(data52 < 0 || isNaN(data52)){
const err144 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/CONTRACT_MISMATCH",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/CONTRACT_MISMATCH/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
}
}
if(data44.EVIDENCE_UNAVAILABLE !== undefined){
let data53 = data44.EVIDENCE_UNAVAILABLE;
if(!(((typeof data53 == "number") && (!(data53 % 1) && !isNaN(data53))) && (isFinite(data53)))){
const err145 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/EVIDENCE_UNAVAILABLE",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/EVIDENCE_UNAVAILABLE/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
if((typeof data53 == "number") && (isFinite(data53))){
if(data53 < 0 || isNaN(data53)){
const err146 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/EVIDENCE_UNAVAILABLE",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/EVIDENCE_UNAVAILABLE/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
}
}
if(data44.PROVIDER_HISTORY_SOURCE_ABSENT !== undefined){
let data54 = data44.PROVIDER_HISTORY_SOURCE_ABSENT;
if(!(((typeof data54 == "number") && (!(data54 % 1) && !isNaN(data54))) && (isFinite(data54)))){
const err147 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/PROVIDER_HISTORY_SOURCE_ABSENT",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/PROVIDER_HISTORY_SOURCE_ABSENT/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if((typeof data54 == "number") && (isFinite(data54))){
if(data54 < 0 || isNaN(data54)){
const err148 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/PROVIDER_HISTORY_SOURCE_ABSENT",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/PROVIDER_HISTORY_SOURCE_ABSENT/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
}
if(data44.PROVIDER_HISTORY_NONPOSITIVE_ASK !== undefined){
let data55 = data44.PROVIDER_HISTORY_NONPOSITIVE_ASK;
if(!(((typeof data55 == "number") && (!(data55 % 1) && !isNaN(data55))) && (isFinite(data55)))){
const err149 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/PROVIDER_HISTORY_NONPOSITIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/PROVIDER_HISTORY_NONPOSITIVE_ASK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
if((typeof data55 == "number") && (isFinite(data55))){
if(data55 < 0 || isNaN(data55)){
const err150 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/PROVIDER_HISTORY_NONPOSITIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/PROVIDER_HISTORY_NONPOSITIVE_ASK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
}
}
if(data44.PROVIDER_HISTORY_CROSSED_BOOK !== undefined){
let data56 = data44.PROVIDER_HISTORY_CROSSED_BOOK;
if(!(((typeof data56 == "number") && (!(data56 % 1) && !isNaN(data56))) && (isFinite(data56)))){
const err151 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/PROVIDER_HISTORY_CROSSED_BOOK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/PROVIDER_HISTORY_CROSSED_BOOK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
if((typeof data56 == "number") && (isFinite(data56))){
if(data56 < 0 || isNaN(data56)){
const err152 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b/PROVIDER_HISTORY_CROSSED_BOOK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/properties/PROVIDER_HISTORY_CROSSED_BOOK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
}
}
}
else {
const err153 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_b",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_b/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
}
if(data30.market_c !== undefined){
let data57 = data30.market_c;
if(data57 && typeof data57 == "object" && !Array.isArray(data57)){
for(const key5 in data57){
if(!(func9.call(schema1047.properties.source_endpoint_reason_counts.properties.market_c.properties, key5))){
const err154 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
}
if(data57.QUALIFIED !== undefined){
let data58 = data57.QUALIFIED;
if(!(((typeof data58 == "number") && (!(data58 % 1) && !isNaN(data58))) && (isFinite(data58)))){
const err155 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/QUALIFIED",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/QUALIFIED/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
if((typeof data58 == "number") && (isFinite(data58))){
if(data58 < 0 || isNaN(data58)){
const err156 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/QUALIFIED",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/QUALIFIED/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
}
}
if(data57.NO_ACTIVE_ASK !== undefined){
let data59 = data57.NO_ACTIVE_ASK;
if(!(((typeof data59 == "number") && (!(data59 % 1) && !isNaN(data59))) && (isFinite(data59)))){
const err157 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/NO_ACTIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/NO_ACTIVE_ASK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
if((typeof data59 == "number") && (isFinite(data59))){
if(data59 < 0 || isNaN(data59)){
const err158 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/NO_ACTIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/NO_ACTIVE_ASK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
}
}
if(data57.QUOTE_VALUE_MISSING_OR_INVALID !== undefined){
let data60 = data57.QUOTE_VALUE_MISSING_OR_INVALID;
if(!(((typeof data60 == "number") && (!(data60 % 1) && !isNaN(data60))) && (isFinite(data60)))){
const err159 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/QUOTE_VALUE_MISSING_OR_INVALID",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/QUOTE_VALUE_MISSING_OR_INVALID/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if((typeof data60 == "number") && (isFinite(data60))){
if(data60 < 0 || isNaN(data60)){
const err160 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/QUOTE_VALUE_MISSING_OR_INVALID",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/QUOTE_VALUE_MISSING_OR_INVALID/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
}
}
if(data57.SOURCE_REFRESH_LAG !== undefined){
let data61 = data57.SOURCE_REFRESH_LAG;
if(!(((typeof data61 == "number") && (!(data61 % 1) && !isNaN(data61))) && (isFinite(data61)))){
const err161 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/SOURCE_REFRESH_LAG",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/SOURCE_REFRESH_LAG/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if((typeof data61 == "number") && (isFinite(data61))){
if(data61 < 0 || isNaN(data61)){
const err162 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/SOURCE_REFRESH_LAG",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/SOURCE_REFRESH_LAG/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
}
}
if(data57.MISSING_SOURCE_CLOCK !== undefined){
let data62 = data57.MISSING_SOURCE_CLOCK;
if(!(((typeof data62 == "number") && (!(data62 % 1) && !isNaN(data62))) && (isFinite(data62)))){
const err163 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/MISSING_SOURCE_CLOCK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/MISSING_SOURCE_CLOCK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
if((typeof data62 == "number") && (isFinite(data62))){
if(data62 < 0 || isNaN(data62)){
const err164 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/MISSING_SOURCE_CLOCK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/MISSING_SOURCE_CLOCK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
}
if(data57.TEMPORAL_VIOLATION !== undefined){
let data63 = data57.TEMPORAL_VIOLATION;
if(!(((typeof data63 == "number") && (!(data63 % 1) && !isNaN(data63))) && (isFinite(data63)))){
const err165 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/TEMPORAL_VIOLATION",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/TEMPORAL_VIOLATION/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
if((typeof data63 == "number") && (isFinite(data63))){
if(data63 < 0 || isNaN(data63)){
const err166 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/TEMPORAL_VIOLATION",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/TEMPORAL_VIOLATION/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
}
}
if(data57.INSUFFICIENT_SLOTS !== undefined){
let data64 = data57.INSUFFICIENT_SLOTS;
if(!(((typeof data64 == "number") && (!(data64 % 1) && !isNaN(data64))) && (isFinite(data64)))){
const err167 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/INSUFFICIENT_SLOTS",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/INSUFFICIENT_SLOTS/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
if((typeof data64 == "number") && (isFinite(data64))){
if(data64 < 0 || isNaN(data64)){
const err168 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/INSUFFICIENT_SLOTS",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/INSUFFICIENT_SLOTS/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
}
}
if(data57.CONTRACT_MISMATCH !== undefined){
let data65 = data57.CONTRACT_MISMATCH;
if(!(((typeof data65 == "number") && (!(data65 % 1) && !isNaN(data65))) && (isFinite(data65)))){
const err169 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/CONTRACT_MISMATCH",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/CONTRACT_MISMATCH/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
if((typeof data65 == "number") && (isFinite(data65))){
if(data65 < 0 || isNaN(data65)){
const err170 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/CONTRACT_MISMATCH",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/CONTRACT_MISMATCH/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
}
}
if(data57.EVIDENCE_UNAVAILABLE !== undefined){
let data66 = data57.EVIDENCE_UNAVAILABLE;
if(!(((typeof data66 == "number") && (!(data66 % 1) && !isNaN(data66))) && (isFinite(data66)))){
const err171 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/EVIDENCE_UNAVAILABLE",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/EVIDENCE_UNAVAILABLE/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
if((typeof data66 == "number") && (isFinite(data66))){
if(data66 < 0 || isNaN(data66)){
const err172 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/EVIDENCE_UNAVAILABLE",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/EVIDENCE_UNAVAILABLE/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
}
}
if(data57.PROVIDER_HISTORY_SOURCE_ABSENT !== undefined){
let data67 = data57.PROVIDER_HISTORY_SOURCE_ABSENT;
if(!(((typeof data67 == "number") && (!(data67 % 1) && !isNaN(data67))) && (isFinite(data67)))){
const err173 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/PROVIDER_HISTORY_SOURCE_ABSENT",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/PROVIDER_HISTORY_SOURCE_ABSENT/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
if((typeof data67 == "number") && (isFinite(data67))){
if(data67 < 0 || isNaN(data67)){
const err174 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/PROVIDER_HISTORY_SOURCE_ABSENT",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/PROVIDER_HISTORY_SOURCE_ABSENT/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
}
}
if(data57.PROVIDER_HISTORY_NONPOSITIVE_ASK !== undefined){
let data68 = data57.PROVIDER_HISTORY_NONPOSITIVE_ASK;
if(!(((typeof data68 == "number") && (!(data68 % 1) && !isNaN(data68))) && (isFinite(data68)))){
const err175 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/PROVIDER_HISTORY_NONPOSITIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/PROVIDER_HISTORY_NONPOSITIVE_ASK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
if((typeof data68 == "number") && (isFinite(data68))){
if(data68 < 0 || isNaN(data68)){
const err176 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/PROVIDER_HISTORY_NONPOSITIVE_ASK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/PROVIDER_HISTORY_NONPOSITIVE_ASK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
}
}
if(data57.PROVIDER_HISTORY_CROSSED_BOOK !== undefined){
let data69 = data57.PROVIDER_HISTORY_CROSSED_BOOK;
if(!(((typeof data69 == "number") && (!(data69 % 1) && !isNaN(data69))) && (isFinite(data69)))){
const err177 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/PROVIDER_HISTORY_CROSSED_BOOK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/PROVIDER_HISTORY_CROSSED_BOOK/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
if((typeof data69 == "number") && (isFinite(data69))){
if(data69 < 0 || isNaN(data69)){
const err178 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c/PROVIDER_HISTORY_CROSSED_BOOK",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/properties/PROVIDER_HISTORY_CROSSED_BOOK/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
}
}
}
else {
const err179 = {instancePath:instancePath+"/source_endpoint_reason_counts/market_c",schemaPath:"#/properties/source_endpoint_reason_counts/properties/market_c/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
}
}
else {
const err180 = {instancePath:instancePath+"/source_endpoint_reason_counts",schemaPath:"#/properties/source_endpoint_reason_counts/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
}
}
else {
const err181 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
validate576.errors = vErrors;
return errors === 0;
}
validate576.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate568(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate568.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.publication_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication_id"},message:"must have required property '"+"publication_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.manifest_hash === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_hash"},message:"must have required property '"+"manifest_hash"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.result_as_of === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "result_as_of"},message:"must have required property '"+"result_as_of"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.input_available_at === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_available_at"},message:"must have required property '"+"input_available_at"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.public_available_at === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "public_available_at"},message:"must have required property '"+"public_available_at"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.published_at === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at"},message:"must have required property '"+"published_at"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.freshness_anchor_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "freshness_anchor_at"},message:"must have required property '"+"freshness_anchor_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.fresh_until === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fresh_until"},message:"must have required property '"+"fresh_until"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.retain_until === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "retain_until"},message:"must have required property '"+"retain_until"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.freshness === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "freshness"},message:"must have required property '"+"freshness"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.supersedes_publication_id === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supersedes_publication_id"},message:"must have required property '"+"supersedes_publication_id"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.producer_release === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "producer_release"},message:"must have required property '"+"producer_release"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.numeric_profile === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "numeric_profile"},message:"must have required property '"+"numeric_profile"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.rights_release_code === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rights_release_code"},message:"must have required property '"+"rights_release_code"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.rights_maximum_public_members_per_direction === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rights_maximum_public_members_per_direction"},message:"must have required property '"+"rights_maximum_public_members_per_direction"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.evidence_release_code === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_release_code"},message:"must have required property '"+"evidence_release_code"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.catalog === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog"},message:"must have required property '"+"catalog"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.accounting === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "accounting"},message:"must have required property '"+"accounting"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.tiering_policy === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tiering_policy"},message:"must have required property '"+"tiering_policy"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.window_start_date === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "window_start_date"},message:"must have required property '"+"window_start_date"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.evidence_class === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_class"},message:"must have required property '"+"evidence_class"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.evidence_disclosure === undefined){
const err21 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_disclosure"},message:"must have required property '"+"evidence_disclosure"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.currency_disclosure === undefined){
const err22 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "currency_disclosure"},message:"must have required property '"+"currency_disclosure"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema1021.properties, key0))){
const err23 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.publication_id !== undefined){
let data0 = data.publication_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err24 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err25 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.manifest_hash !== undefined){
let data1 = data.manifest_hash;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err26 = {instancePath:instancePath+"/manifest_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
else {
const err27 = {instancePath:instancePath+"/manifest_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.result_as_of !== undefined){
let data2 = data.result_as_of;
if(typeof data2 === "string"){
if(!(formats40.validate(data2))){
const err28 = {instancePath:instancePath+"/result_as_of",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err29 = {instancePath:instancePath+"/result_as_of",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.input_available_at !== undefined){
let data3 = data.input_available_at;
if(typeof data3 === "string"){
if(!pattern19.test(data3)){
const err30 = {instancePath:instancePath+"/input_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(!(formats0.validate(data3))){
const err31 = {instancePath:instancePath+"/input_available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err32 = {instancePath:instancePath+"/input_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.public_available_at !== undefined){
let data4 = data.public_available_at;
if(typeof data4 === "string"){
if(!pattern19.test(data4)){
const err33 = {instancePath:instancePath+"/public_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(!(formats0.validate(data4))){
const err34 = {instancePath:instancePath+"/public_available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err35 = {instancePath:instancePath+"/public_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.published_at !== undefined){
let data5 = data.published_at;
if(typeof data5 === "string"){
if(!pattern19.test(data5)){
const err36 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(!(formats0.validate(data5))){
const err37 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err38 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.freshness_anchor_at !== undefined){
let data6 = data.freshness_anchor_at;
if(typeof data6 === "string"){
if(!pattern19.test(data6)){
const err39 = {instancePath:instancePath+"/freshness_anchor_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(!(formats0.validate(data6))){
const err40 = {instancePath:instancePath+"/freshness_anchor_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err41 = {instancePath:instancePath+"/freshness_anchor_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.fresh_until !== undefined){
let data7 = data.fresh_until;
if(typeof data7 === "string"){
if(!pattern19.test(data7)){
const err42 = {instancePath:instancePath+"/fresh_until",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(!(formats0.validate(data7))){
const err43 = {instancePath:instancePath+"/fresh_until",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
else {
const err44 = {instancePath:instancePath+"/fresh_until",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data.retain_until !== undefined){
let data8 = data.retain_until;
if(typeof data8 === "string"){
if(!pattern19.test(data8)){
const err45 = {instancePath:instancePath+"/retain_until",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(!(formats0.validate(data8))){
const err46 = {instancePath:instancePath+"/retain_until",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
else {
const err47 = {instancePath:instancePath+"/retain_until",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data.freshness !== undefined){
let data9 = data.freshness;
if(!((data9 === "FRESH") || (data9 === "STALE_RETAINED"))){
const err48 = {instancePath:instancePath+"/freshness",schemaPath:"#/properties/freshness/enum",keyword:"enum",params:{allowedValues: schema1021.properties.freshness.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data.supersedes_publication_id !== undefined){
if(!(validate563(data.supersedes_publication_id, {instancePath:instancePath+"/supersedes_publication_id",parentData:data,parentDataProperty:"supersedes_publication_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate563.errors : vErrors.concat(validate563.errors);
errors = vErrors.length;
}
}
if(data.producer_release !== undefined){
if(!(validate570(data.producer_release, {instancePath:instancePath+"/producer_release",parentData:data,parentDataProperty:"producer_release",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate570.errors : vErrors.concat(validate570.errors);
errors = vErrors.length;
}
}
if(data.numeric_profile !== undefined){
if(!(validate572(data.numeric_profile, {instancePath:instancePath+"/numeric_profile",parentData:data,parentDataProperty:"numeric_profile",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate572.errors : vErrors.concat(validate572.errors);
errors = vErrors.length;
}
}
if(data.rights_release_code !== undefined){
let data13 = data.rights_release_code;
if(typeof data13 === "string"){
if(func2(data13) > 512){
const err49 = {instancePath:instancePath+"/rights_release_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(func2(data13) < 1){
const err50 = {instancePath:instancePath+"/rights_release_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(!pattern87.test(data13)){
const err51 = {instancePath:instancePath+"/rights_release_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err52 = {instancePath:instancePath+"/rights_release_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data.rights_maximum_public_members_per_direction !== undefined){
let data14 = data.rights_maximum_public_members_per_direction;
if(!(((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))) && (isFinite(data14)))){
const err53 = {instancePath:instancePath+"/rights_maximum_public_members_per_direction",schemaPath:"#/properties/rights_maximum_public_members_per_direction/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if((typeof data14 == "number") && (isFinite(data14))){
if(data14 > 50 || isNaN(data14)){
const err54 = {instancePath:instancePath+"/rights_maximum_public_members_per_direction",schemaPath:"#/properties/rights_maximum_public_members_per_direction/maximum",keyword:"maximum",params:{comparison: "<=", limit: 50},message:"must be <= 50"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data14 < 1 || isNaN(data14)){
const err55 = {instancePath:instancePath+"/rights_maximum_public_members_per_direction",schemaPath:"#/properties/rights_maximum_public_members_per_direction/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
}
if(data.evidence_release_code !== undefined){
let data15 = data.evidence_release_code;
if(typeof data15 === "string"){
if(func2(data15) > 512){
const err56 = {instancePath:instancePath+"/evidence_release_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(func2(data15) < 1){
const err57 = {instancePath:instancePath+"/evidence_release_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(!pattern87.test(data15)){
const err58 = {instancePath:instancePath+"/evidence_release_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
else {
const err59 = {instancePath:instancePath+"/evidence_release_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data.catalog !== undefined){
if(!(validate574(data.catalog, {instancePath:instancePath+"/catalog",parentData:data,parentDataProperty:"catalog",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate574.errors : vErrors.concat(validate574.errors);
errors = vErrors.length;
}
}
if(data.accounting !== undefined){
if(!(validate576(data.accounting, {instancePath:instancePath+"/accounting",parentData:data,parentDataProperty:"accounting",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate576.errors : vErrors.concat(validate576.errors);
errors = vErrors.length;
}
}
if(data.tiering_policy !== undefined){
let data18 = data.tiering_policy;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if(data18.policy_id === undefined){
const err60 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "policy_id"},message:"must have required property '"+"policy_id"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data18.policy_code === undefined){
const err61 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "policy_code"},message:"must have required property '"+"policy_code"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data18.evidence_class === undefined){
const err62 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "evidence_class"},message:"must have required property '"+"evidence_class"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data18.allowed_missing_reasons === undefined){
const err63 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "allowed_missing_reasons"},message:"must have required property '"+"allowed_missing_reasons"+"'"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(data18.minimum_supported_endpoint_ratio_bps === undefined){
const err64 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "minimum_supported_endpoint_ratio_bps"},message:"must have required property '"+"minimum_supported_endpoint_ratio_bps"+"'"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data18.public_readiness_policy_id === undefined){
const err65 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "public_readiness_policy_id"},message:"must have required property '"+"public_readiness_policy_id"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data18.minimum_qualified_three_source_endpoint_ratio_bps === undefined){
const err66 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "minimum_qualified_three_source_endpoint_ratio_bps"},message:"must have required property '"+"minimum_qualified_three_source_endpoint_ratio_bps"+"'"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(data18.minimum_public_candidates_per_direction === undefined){
const err67 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "minimum_public_candidates_per_direction"},message:"must have required property '"+"minimum_public_candidates_per_direction"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data18.empty_public_lane_state === undefined){
const err68 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "empty_public_lane_state"},message:"must have required property '"+"empty_public_lane_state"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(data18.public_primary_grade === undefined){
const err69 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "public_primary_grade"},message:"must have required property '"+"public_primary_grade"+"'"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data18.two_source_publication_state === undefined){
const err70 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/required",keyword:"required",params:{missingProperty: "two_source_publication_state"},message:"must have required property '"+"two_source_publication_state"+"'"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
for(const key1 in data18){
if(!(func9.call(schema1021.properties.tiering_policy.properties, key1))){
const err71 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data18.policy_id !== undefined){
let data19 = data18.policy_id;
if(typeof data19 === "string"){
if(!pattern5.test(data19)){
const err72 = {instancePath:instancePath+"/tiering_policy/policy_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
else {
const err73 = {instancePath:instancePath+"/tiering_policy/policy_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data18.policy_code !== undefined){
let data20 = data18.policy_code;
if(typeof data20 === "string"){
if(func2(data20) > 512){
const err74 = {instancePath:instancePath+"/tiering_policy/policy_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(func2(data20) < 1){
const err75 = {instancePath:instancePath+"/tiering_policy/policy_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(!pattern87.test(data20)){
const err76 = {instancePath:instancePath+"/tiering_policy/policy_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
else {
const err77 = {instancePath:instancePath+"/tiering_policy/policy_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data18.evidence_class !== undefined){
let data21 = data18.evidence_class;
if(!(((data21 === "RECONSTRUCTED_HISTORY") || (data21 === "HYBRID_BRIDGED")) || (data21 === "CONTEMPORANEOUSLY_MEASURED"))){
const err78 = {instancePath:instancePath+"/tiering_policy/evidence_class",schemaPath:"#/properties/tiering_policy/properties/evidence_class/enum",keyword:"enum",params:{allowedValues: schema1021.properties.tiering_policy.properties.evidence_class.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data18.allowed_missing_reasons !== undefined){
let data22 = data18.allowed_missing_reasons;
if(Array.isArray(data22)){
if(data22.length > 3){
const err79 = {instancePath:instancePath+"/tiering_policy/allowed_missing_reasons",schemaPath:"#/properties/tiering_policy/properties/allowed_missing_reasons/maxItems",keyword:"maxItems",params:{limit: 3},message:"must NOT have more than 3 items"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
const len0 = data22.length;
for(let i0=0; i0<len0; i0++){
let data23 = data22[i0];
if(!((data23 === "PROVIDER_HISTORY_SOURCE_ABSENT") || (data23 === "NO_ACTIVE_ASK"))){
const err80 = {instancePath:instancePath+"/tiering_policy/allowed_missing_reasons/" + i0,schemaPath:"#/properties/tiering_policy/properties/allowed_missing_reasons/items/enum",keyword:"enum",params:{allowedValues: schema1021.properties.tiering_policy.properties.allowed_missing_reasons.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
let i1 = data22.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data22[i1], data22[j0])){
const err81 = {instancePath:instancePath+"/tiering_policy/allowed_missing_reasons",schemaPath:"#/properties/tiering_policy/properties/allowed_missing_reasons/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err82 = {instancePath:instancePath+"/tiering_policy/allowed_missing_reasons",schemaPath:"#/properties/tiering_policy/properties/allowed_missing_reasons/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
if(data18.minimum_supported_endpoint_ratio_bps !== undefined){
let data24 = data18.minimum_supported_endpoint_ratio_bps;
if(!(((typeof data24 == "number") && (!(data24 % 1) && !isNaN(data24))) && (isFinite(data24)))){
const err83 = {instancePath:instancePath+"/tiering_policy/minimum_supported_endpoint_ratio_bps",schemaPath:"#/properties/tiering_policy/properties/minimum_supported_endpoint_ratio_bps/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if((typeof data24 == "number") && (isFinite(data24))){
if(data24 > 10000 || isNaN(data24)){
const err84 = {instancePath:instancePath+"/tiering_policy/minimum_supported_endpoint_ratio_bps",schemaPath:"#/properties/tiering_policy/properties/minimum_supported_endpoint_ratio_bps/maximum",keyword:"maximum",params:{comparison: "<=", limit: 10000},message:"must be <= 10000"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data24 < 0 || isNaN(data24)){
const err85 = {instancePath:instancePath+"/tiering_policy/minimum_supported_endpoint_ratio_bps",schemaPath:"#/properties/tiering_policy/properties/minimum_supported_endpoint_ratio_bps/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
}
if(data18.public_readiness_policy_id !== undefined){
let data25 = data18.public_readiness_policy_id;
if(typeof data25 === "string"){
if(!pattern5.test(data25)){
const err86 = {instancePath:instancePath+"/tiering_policy/public_readiness_policy_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
else {
const err87 = {instancePath:instancePath+"/tiering_policy/public_readiness_policy_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(data18.minimum_qualified_three_source_endpoint_ratio_bps !== undefined){
let data26 = data18.minimum_qualified_three_source_endpoint_ratio_bps;
if(!(((typeof data26 == "number") && (!(data26 % 1) && !isNaN(data26))) && (isFinite(data26)))){
const err88 = {instancePath:instancePath+"/tiering_policy/minimum_qualified_three_source_endpoint_ratio_bps",schemaPath:"#/properties/tiering_policy/properties/minimum_qualified_three_source_endpoint_ratio_bps/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if((typeof data26 == "number") && (isFinite(data26))){
if(data26 > 10000 || isNaN(data26)){
const err89 = {instancePath:instancePath+"/tiering_policy/minimum_qualified_three_source_endpoint_ratio_bps",schemaPath:"#/properties/tiering_policy/properties/minimum_qualified_three_source_endpoint_ratio_bps/maximum",keyword:"maximum",params:{comparison: "<=", limit: 10000},message:"must be <= 10000"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(data26 < 0 || isNaN(data26)){
const err90 = {instancePath:instancePath+"/tiering_policy/minimum_qualified_three_source_endpoint_ratio_bps",schemaPath:"#/properties/tiering_policy/properties/minimum_qualified_three_source_endpoint_ratio_bps/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
}
if(data18.minimum_public_candidates_per_direction !== undefined){
let data27 = data18.minimum_public_candidates_per_direction;
if(!(((typeof data27 == "number") && (!(data27 % 1) && !isNaN(data27))) && (isFinite(data27)))){
const err91 = {instancePath:instancePath+"/tiering_policy/minimum_public_candidates_per_direction",schemaPath:"#/properties/tiering_policy/properties/minimum_public_candidates_per_direction/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if((typeof data27 == "number") && (isFinite(data27))){
if(data27 > 50 || isNaN(data27)){
const err92 = {instancePath:instancePath+"/tiering_policy/minimum_public_candidates_per_direction",schemaPath:"#/properties/tiering_policy/properties/minimum_public_candidates_per_direction/maximum",keyword:"maximum",params:{comparison: "<=", limit: 50},message:"must be <= 50"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if(data27 < 1 || isNaN(data27)){
const err93 = {instancePath:instancePath+"/tiering_policy/minimum_public_candidates_per_direction",schemaPath:"#/properties/tiering_policy/properties/minimum_public_candidates_per_direction/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
}
if(data18.empty_public_lane_state !== undefined){
if("WITHHOLD_PUBLICATION" !== data18.empty_public_lane_state){
const err94 = {instancePath:instancePath+"/tiering_policy/empty_public_lane_state",schemaPath:"#/properties/tiering_policy/properties/empty_public_lane_state/const",keyword:"const",params:{allowedValue: "WITHHOLD_PUBLICATION"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
if(data18.public_primary_grade !== undefined){
if("THREE_SOURCE_CONFIRMED" !== data18.public_primary_grade){
const err95 = {instancePath:instancePath+"/tiering_policy/public_primary_grade",schemaPath:"#/properties/tiering_policy/properties/public_primary_grade/const",keyword:"const",params:{allowedValue: "THREE_SOURCE_CONFIRMED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data18.two_source_publication_state !== undefined){
if("WITHHELD_PENDING_SEPARATE_RIGHTS_AND_PRODUCT_APPROVAL" !== data18.two_source_publication_state){
const err96 = {instancePath:instancePath+"/tiering_policy/two_source_publication_state",schemaPath:"#/properties/tiering_policy/properties/two_source_publication_state/const",keyword:"const",params:{allowedValue: "WITHHELD_PENDING_SEPARATE_RIGHTS_AND_PRODUCT_APPROVAL"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
}
else {
const err97 = {instancePath:instancePath+"/tiering_policy",schemaPath:"#/properties/tiering_policy/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(data.window_start_date !== undefined){
let data31 = data.window_start_date;
if(typeof data31 === "string"){
if(!(formats40.validate(data31))){
const err98 = {instancePath:instancePath+"/window_start_date",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
else {
const err99 = {instancePath:instancePath+"/window_start_date",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
if(data.evidence_class !== undefined){
let data32 = data.evidence_class;
if(!(((data32 === "RECONSTRUCTED_HISTORY") || (data32 === "HYBRID_BRIDGED")) || (data32 === "CONTEMPORANEOUSLY_MEASURED"))){
const err100 = {instancePath:instancePath+"/evidence_class",schemaPath:"#/properties/evidence_class/enum",keyword:"enum",params:{allowedValues: schema1021.properties.evidence_class.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(data.evidence_disclosure !== undefined){
let data33 = data.evidence_disclosure;
if(data33 && typeof data33 == "object" && !Array.isArray(data33)){
if(data33.start_endpoint_acquisition === undefined){
const err101 = {instancePath:instancePath+"/evidence_disclosure",schemaPath:"#/properties/evidence_disclosure/required",keyword:"required",params:{missingProperty: "start_endpoint_acquisition"},message:"must have required property '"+"start_endpoint_acquisition"+"'"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(data33.end_endpoint_acquisition === undefined){
const err102 = {instancePath:instancePath+"/evidence_disclosure",schemaPath:"#/properties/evidence_disclosure/required",keyword:"required",params:{missingProperty: "end_endpoint_acquisition"},message:"must have required property '"+"end_endpoint_acquisition"+"'"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if(data33.historical_obtained_at === undefined){
const err103 = {instancePath:instancePath+"/evidence_disclosure",schemaPath:"#/properties/evidence_disclosure/required",keyword:"required",params:{missingProperty: "historical_obtained_at"},message:"must have required property '"+"historical_obtained_at"+"'"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(data33.late_bound_current_membership === undefined){
const err104 = {instancePath:instancePath+"/evidence_disclosure",schemaPath:"#/properties/evidence_disclosure/required",keyword:"required",params:{missingProperty: "late_bound_current_membership"},message:"must have required property '"+"late_bound_current_membership"+"'"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
if(data33.pit_membership_claimed === undefined){
const err105 = {instancePath:instancePath+"/evidence_disclosure",schemaPath:"#/properties/evidence_disclosure/required",keyword:"required",params:{missingProperty: "pit_membership_claimed"},message:"must have required property '"+"pit_membership_claimed"+"'"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(data33.prospective_continuity_credit === undefined){
const err106 = {instancePath:instancePath+"/evidence_disclosure",schemaPath:"#/properties/evidence_disclosure/required",keyword:"required",params:{missingProperty: "prospective_continuity_credit"},message:"must have required property '"+"prospective_continuity_credit"+"'"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if(data33.public_label === undefined){
const err107 = {instancePath:instancePath+"/evidence_disclosure",schemaPath:"#/properties/evidence_disclosure/required",keyword:"required",params:{missingProperty: "public_label"},message:"must have required property '"+"public_label"+"'"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
for(const key2 in data33){
if(!(((((((key2 === "start_endpoint_acquisition") || (key2 === "end_endpoint_acquisition")) || (key2 === "historical_obtained_at")) || (key2 === "late_bound_current_membership")) || (key2 === "pit_membership_claimed")) || (key2 === "prospective_continuity_credit")) || (key2 === "public_label"))){
const err108 = {instancePath:instancePath+"/evidence_disclosure",schemaPath:"#/properties/evidence_disclosure/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
if(data33.start_endpoint_acquisition !== undefined){
let data34 = data33.start_endpoint_acquisition;
if(!((data34 === "HISTORICAL_PROVIDER_ARCHIVE") || (data34 === "CONTEMPORANEOUS_EOD"))){
const err109 = {instancePath:instancePath+"/evidence_disclosure/start_endpoint_acquisition",schemaPath:"#/properties/evidence_disclosure/properties/start_endpoint_acquisition/enum",keyword:"enum",params:{allowedValues: schema1021.properties.evidence_disclosure.properties.start_endpoint_acquisition.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
}
if(data33.end_endpoint_acquisition !== undefined){
let data35 = data33.end_endpoint_acquisition;
if(!((data35 === "HISTORICAL_PROVIDER_ARCHIVE") || (data35 === "CONTEMPORANEOUS_EOD"))){
const err110 = {instancePath:instancePath+"/evidence_disclosure/end_endpoint_acquisition",schemaPath:"#/properties/evidence_disclosure/properties/end_endpoint_acquisition/enum",keyword:"enum",params:{allowedValues: schema1021.properties.evidence_disclosure.properties.end_endpoint_acquisition.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
if(data33.historical_obtained_at !== undefined){
let data36 = data33.historical_obtained_at;
const _errs78 = errors;
let valid21 = false;
let passing0 = null;
const _errs79 = errors;
if(typeof data36 === "string"){
if(!pattern19.test(data36)){
const err111 = {instancePath:instancePath+"/evidence_disclosure/historical_obtained_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(!(formats0.validate(data36))){
const err112 = {instancePath:instancePath+"/evidence_disclosure/historical_obtained_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
}
else {
const err113 = {instancePath:instancePath+"/evidence_disclosure/historical_obtained_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
var _valid0 = _errs79 === errors;
if(_valid0){
valid21 = true;
passing0 = 0;
}
const _errs82 = errors;
if(data36 !== null){
const err114 = {instancePath:instancePath+"/evidence_disclosure/historical_obtained_at",schemaPath:"#/properties/evidence_disclosure/properties/historical_obtained_at/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
var _valid0 = _errs82 === errors;
if(_valid0 && valid21){
valid21 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid21 = true;
passing0 = 1;
}
}
if(!valid21){
const err115 = {instancePath:instancePath+"/evidence_disclosure/historical_obtained_at",schemaPath:"#/properties/evidence_disclosure/properties/historical_obtained_at/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
else {
errors = _errs78;
if(vErrors !== null){
if(_errs78){
vErrors.length = _errs78;
}
else {
vErrors = null;
}
}
}
}
if(data33.late_bound_current_membership !== undefined){
if(typeof data33.late_bound_current_membership !== "boolean"){
const err116 = {instancePath:instancePath+"/evidence_disclosure/late_bound_current_membership",schemaPath:"#/properties/evidence_disclosure/properties/late_bound_current_membership/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
if(data33.pit_membership_claimed !== undefined){
if(false !== data33.pit_membership_claimed){
const err117 = {instancePath:instancePath+"/evidence_disclosure/pit_membership_claimed",schemaPath:"#/properties/evidence_disclosure/properties/pit_membership_claimed/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
if(data33.prospective_continuity_credit !== undefined){
if(typeof data33.prospective_continuity_credit !== "boolean"){
const err118 = {instancePath:instancePath+"/evidence_disclosure/prospective_continuity_credit",schemaPath:"#/properties/evidence_disclosure/properties/prospective_continuity_credit/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
if(data33.public_label !== undefined){
let data40 = data33.public_label;
if(!(((data40 === "历史重建") || (data40 === "混合桥接")) || (data40 === "当前实测"))){
const err119 = {instancePath:instancePath+"/evidence_disclosure/public_label",schemaPath:"#/properties/evidence_disclosure/properties/public_label/enum",keyword:"enum",params:{allowedValues: schema1021.properties.evidence_disclosure.properties.public_label.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
}
}
else {
const err120 = {instancePath:instancePath+"/evidence_disclosure",schemaPath:"#/properties/evidence_disclosure/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
if(data.currency_disclosure !== undefined){
let data41 = data.currency_disclosure;
if(data41 && typeof data41 == "object" && !Array.isArray(data41)){
if(data41.source_currency === undefined){
const err121 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/required",keyword:"required",params:{missingProperty: "source_currency"},message:"must have required property '"+"source_currency"+"'"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data41.source_native_semantics === undefined){
const err122 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/required",keyword:"required",params:{missingProperty: "source_native_semantics"},message:"must have required property '"+"source_native_semantics"+"'"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if(data41.analysis_currency === undefined){
const err123 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/required",keyword:"required",params:{missingProperty: "analysis_currency"},message:"must have required property '"+"analysis_currency"+"'"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if(data41.analysis_semantics === undefined){
const err124 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/required",keyword:"required",params:{missingProperty: "analysis_semantics"},message:"must have required property '"+"analysis_semantics"+"'"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(data41.conversion_policy === undefined){
const err125 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/required",keyword:"required",params:{missingProperty: "conversion_policy"},message:"must have required property '"+"conversion_policy"+"'"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(data41.start_fx_source_event_date === undefined){
const err126 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/required",keyword:"required",params:{missingProperty: "start_fx_source_event_date"},message:"must have required property '"+"start_fx_source_event_date"+"'"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
if(data41.end_fx_source_event_date === undefined){
const err127 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/required",keyword:"required",params:{missingProperty: "end_fx_source_event_date"},message:"must have required property '"+"end_fx_source_event_date"+"'"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
if(data41.current_fx_repricing_forbidden === undefined){
const err128 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/required",keyword:"required",params:{missingProperty: "current_fx_repricing_forbidden"},message:"must have required property '"+"current_fx_repricing_forbidden"+"'"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
for(const key3 in data41){
if(!((((((((key3 === "source_currency") || (key3 === "source_native_semantics")) || (key3 === "analysis_currency")) || (key3 === "analysis_semantics")) || (key3 === "conversion_policy")) || (key3 === "start_fx_source_event_date")) || (key3 === "end_fx_source_event_date")) || (key3 === "current_fx_repricing_forbidden"))){
const err129 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
}
if(data41.source_currency !== undefined){
if("USD" !== data41.source_currency){
const err130 = {instancePath:instancePath+"/currency_disclosure/source_currency",schemaPath:"#/properties/currency_disclosure/properties/source_currency/const",keyword:"const",params:{allowedValue: "USD"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
}
if(data41.source_native_semantics !== undefined){
if("UPSTREAM_PROVIDER_USD_REFERENCE_NOT_PROVEN_PLATFORM_NATIVE" !== data41.source_native_semantics){
const err131 = {instancePath:instancePath+"/currency_disclosure/source_native_semantics",schemaPath:"#/properties/currency_disclosure/properties/source_native_semantics/const",keyword:"const",params:{allowedValue: "UPSTREAM_PROVIDER_USD_REFERENCE_NOT_PROVEN_PLATFORM_NATIVE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
if(data41.analysis_currency !== undefined){
if("CNY" !== data41.analysis_currency){
const err132 = {instancePath:instancePath+"/currency_disclosure/analysis_currency",schemaPath:"#/properties/currency_disclosure/properties/analysis_currency/const",keyword:"const",params:{allowedValue: "CNY"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
if(data41.analysis_semantics !== undefined){
if("FX_RECONSTRUCTED_CNY_REFERENCE" !== data41.analysis_semantics){
const err133 = {instancePath:instancePath+"/currency_disclosure/analysis_semantics",schemaPath:"#/properties/currency_disclosure/properties/analysis_semantics/const",keyword:"const",params:{allowedValue: "FX_RECONSTRUCTED_CNY_REFERENCE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
}
if(data41.conversion_policy !== undefined){
if("analysis-cny-minor-half-even/1" !== data41.conversion_policy){
const err134 = {instancePath:instancePath+"/currency_disclosure/conversion_policy",schemaPath:"#/properties/currency_disclosure/properties/conversion_policy/const",keyword:"const",params:{allowedValue: "analysis-cny-minor-half-even/1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
if(data41.start_fx_source_event_date !== undefined){
let data47 = data41.start_fx_source_event_date;
if(typeof data47 === "string"){
if(!(formats40.validate(data47))){
const err135 = {instancePath:instancePath+"/currency_disclosure/start_fx_source_event_date",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
else {
const err136 = {instancePath:instancePath+"/currency_disclosure/start_fx_source_event_date",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
}
if(data41.end_fx_source_event_date !== undefined){
let data48 = data41.end_fx_source_event_date;
if(typeof data48 === "string"){
if(!(formats40.validate(data48))){
const err137 = {instancePath:instancePath+"/currency_disclosure/end_fx_source_event_date",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
}
else {
const err138 = {instancePath:instancePath+"/currency_disclosure/end_fx_source_event_date",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
if(data41.current_fx_repricing_forbidden !== undefined){
if(true !== data41.current_fx_repricing_forbidden){
const err139 = {instancePath:instancePath+"/currency_disclosure/current_fx_repricing_forbidden",schemaPath:"#/properties/currency_disclosure/properties/current_fx_repricing_forbidden/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
}
}
else {
const err140 = {instancePath:instancePath+"/currency_disclosure",schemaPath:"#/properties/currency_disclosure/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
}
}
else {
const err141 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
validate568.errors = vErrors;
return errors === 0;
}
validate568.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema1056 = {"type":"object","additionalProperties":false,"required":["rank","tie_break_key","measurement_id","analysis_unit_id","direction","evidence_grade","conservative_source_code","conservative_same_direction_change_floor_ratio","catalog","supporting_sources","unavailable_sources"],"properties":{"rank":{"type":"integer","minimum":1,"maximum":50},"tie_break_key":{"$ref":"#/$defs/identifier"},"measurement_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"direction":{"enum":["GAINERS","LOSERS"]},"evidence_grade":{"enum":["THREE_SOURCE_CONFIRMED","TWO_SOURCE_SUPPORTED"]},"conservative_source_code":{"enum":["market_a","market_b","market_c"]},"conservative_same_direction_change_floor_ratio":{"$ref":"#/$defs/ratio"},"catalog":{"$ref":"#/$defs/catalogProjection"},"supporting_sources":{"type":"array","uniqueItems":true,"minItems":2,"maxItems":3,"items":{"enum":["market_a","market_b","market_c"]}},"unavailable_sources":{"type":"array","maxItems":1,"items":{"type":"object","additionalProperties":false,"required":["source_code","start_reason","end_reason"],"properties":{"source_code":{"enum":["market_a","market_b","market_c"]},"start_reason":{"enum":["QUALIFIED","PROVIDER_HISTORY_SOURCE_ABSENT","NO_ACTIVE_ASK"]},"end_reason":{"enum":["QUALIFIED","PROVIDER_HISTORY_SOURCE_ABSENT","NO_ACTIVE_ASK"]}}}}}};
const schema1060 = {"type":"string","description":"Eight-place display ratio; negative exact values retain a minus sign even when rounded to -0.00000000.","pattern":"^-?(0|[1-9][0-9]*)\\.[0-9]{8}$"};
const pattern461 = new RegExp("^-?(0|[1-9][0-9]*)\\.[0-9]{8}$", "u");
const schema1061 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","parent_analysis_unit_id","analysis_unit_kind","item_kind","base_item_code","edition_kind","wear_tier","localized_name","media","catalog_version"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"base_item_code":{"$ref":"#/$defs/identifier"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/localizedName"},"media":{"$ref":"#/$defs/media"},"catalog_version":{"$ref":"#/$defs/identifier"}}};
const schema1068 = {"oneOf":[{"type":"object","additionalProperties":false,"required":["status"],"properties":{"status":{"const":"NOT_PRODUCED"}}},{"type":"object","additionalProperties":false,"required":["status","media_asset_version_id","media_key","presentation_kind"],"properties":{"status":{"const":"BOUND"},"media_asset_version_id":{"type":"string","pattern":"^[1-9][0-9]*$"},"media_key":{"type":"string","minLength":1,"maxLength":1024,"pattern":"^[A-Za-z0-9][A-Za-z0-9._/-]*$"},"presentation_kind":{"enum":["SERIES_REPRESENTATIVE","STYLE_REPRESENTATIVE"]}}}]};
const pattern97 = new RegExp("^[1-9][0-9]*$", "u");
const pattern468 = new RegExp("^[A-Za-z0-9][A-Za-z0-9._/-]*$", "u");
const schema1065 = {"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"$ref":"#/$defs/identifier"},"zh_cn":{"$ref":"#/$defs/identifier"}}};

function validate581(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate581.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.en === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "en"},message:"must have required property '"+"en"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.zh_cn === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "zh_cn"},message:"must have required property '"+"zh_cn"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "en") || (key0 === "zh_cn"))){
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
if(data.en !== undefined){
let data0 = data.en;
if(typeof data0 === "string"){
if(func2(data0) > 512){
const err3 = {instancePath:instancePath+"/en",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func2(data0) < 1){
const err4 = {instancePath:instancePath+"/en",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern87.test(data0)){
const err5 = {instancePath:instancePath+"/en",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/en",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.zh_cn !== undefined){
let data1 = data.zh_cn;
if(typeof data1 === "string"){
if(func2(data1) > 512){
const err7 = {instancePath:instancePath+"/zh_cn",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func2(data1) < 1){
const err8 = {instancePath:instancePath+"/zh_cn",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern87.test(data1)){
const err9 = {instancePath:instancePath+"/zh_cn",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err10 = {instancePath:instancePath+"/zh_cn",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate581.errors = vErrors;
return errors === 0;
}
validate581.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate580(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate580.evaluated;
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
if(data.parent_analysis_unit_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parent_analysis_unit_id"},message:"must have required property '"+"parent_analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.analysis_unit_kind === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_kind"},message:"must have required property '"+"analysis_unit_kind"+"'"};
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
if(data.base_item_code === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "base_item_code"},message:"must have required property '"+"base_item_code"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.edition_kind === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "edition_kind"},message:"must have required property '"+"edition_kind"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.wear_tier === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "wear_tier"},message:"must have required property '"+"wear_tier"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.localized_name === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "localized_name"},message:"must have required property '"+"localized_name"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.media === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media"},message:"must have required property '"+"media"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.catalog_version === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_version"},message:"must have required property '"+"catalog_version"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema1061.properties, key0))){
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
if(data.analysis_unit_id !== undefined){
let data0 = data.analysis_unit_id;
if(typeof data0 === "string"){
if(func2(data0) > 512){
const err11 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func2(data0) < 1){
const err12 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern87.test(data0)){
const err13 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err14 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.parent_analysis_unit_id !== undefined){
let data1 = data.parent_analysis_unit_id;
const _errs6 = errors;
let valid2 = false;
let passing0 = null;
const _errs7 = errors;
if(typeof data1 === "string"){
if(func2(data1) > 512){
const err15 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(func2(data1) < 1){
const err16 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern87.test(data1)){
const err17 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err18 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
valid2 = true;
passing0 = 0;
}
const _errs10 = errors;
if(data1 !== null){
const err19 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid0 = _errs10 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid2 = true;
passing0 = 1;
}
}
if(!valid2){
const err20 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
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
if(data.analysis_unit_kind !== undefined){
let data2 = data.analysis_unit_kind;
if(!(((data2 === "BASE_MHN") || (data2 === "STYLE_VARIANT")) || (data2 === "PATTERN_VARIANT"))){
const err21 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema1061.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.item_kind !== undefined){
let data3 = data.item_kind;
if(!((((((data3 === "WEAPON") || (data3 === "KNIFE")) || (data3 === "GLOVE")) || (data3 === "AGENT")) || (data3 === "OTHER")) || (data3 === "UNKNOWN"))){
const err22 = {instancePath:instancePath+"/item_kind",schemaPath:"#/properties/item_kind/enum",keyword:"enum",params:{allowedValues: schema1061.properties.item_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.base_item_code !== undefined){
let data4 = data.base_item_code;
if(typeof data4 === "string"){
if(func2(data4) > 512){
const err23 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(func2(data4) < 1){
const err24 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!pattern87.test(data4)){
const err25 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err26 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data5 = data.edition_kind;
if(!((((data5 === "STANDARD") || (data5 === "STATTRAK")) || (data5 === "SOUVENIR")) || (data5 === "UNKNOWN"))){
const err27 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema1061.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.wear_tier !== undefined){
let data6 = data.wear_tier;
if(!(((((((data6 === "FACTORY_NEW") || (data6 === "MINIMAL_WEAR")) || (data6 === "FIELD_TESTED")) || (data6 === "WELL_WORN")) || (data6 === "BATTLE_SCARRED")) || (data6 === "NOT_APPLICABLE")) || (data6 === "UNKNOWN"))){
const err28 = {instancePath:instancePath+"/wear_tier",schemaPath:"#/properties/wear_tier/enum",keyword:"enum",params:{allowedValues: schema1061.properties.wear_tier.enum},message:"must be equal to one of the allowed values"};
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
if(!(validate581(data.localized_name, {instancePath:instancePath+"/localized_name",parentData:data,parentDataProperty:"localized_name",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate581.errors : vErrors.concat(validate581.errors);
errors = vErrors.length;
}
}
if(data.media !== undefined){
let data8 = data.media;
const _errs22 = errors;
let valid6 = false;
let passing1 = null;
const _errs23 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.status === undefined){
const err29 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf/0/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
for(const key1 in data8){
if(!(key1 === "status")){
const err30 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data8.status !== undefined){
if("NOT_PRODUCED" !== data8.status){
const err31 = {instancePath:instancePath+"/media/status",schemaPath:"#/$defs/media/oneOf/0/properties/status/const",keyword:"const",params:{allowedValue: "NOT_PRODUCED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
var _valid1 = _errs23 === errors;
if(_valid1){
valid6 = true;
passing1 = 0;
var props0 = true;
}
const _errs27 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.status === undefined){
const err33 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf/1/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data8.media_asset_version_id === undefined){
const err34 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf/1/required",keyword:"required",params:{missingProperty: "media_asset_version_id"},message:"must have required property '"+"media_asset_version_id"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data8.media_key === undefined){
const err35 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf/1/required",keyword:"required",params:{missingProperty: "media_key"},message:"must have required property '"+"media_key"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data8.presentation_kind === undefined){
const err36 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf/1/required",keyword:"required",params:{missingProperty: "presentation_kind"},message:"must have required property '"+"presentation_kind"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
for(const key2 in data8){
if(!((((key2 === "status") || (key2 === "media_asset_version_id")) || (key2 === "media_key")) || (key2 === "presentation_kind"))){
const err37 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data8.status !== undefined){
if("BOUND" !== data8.status){
const err38 = {instancePath:instancePath+"/media/status",schemaPath:"#/$defs/media/oneOf/1/properties/status/const",keyword:"const",params:{allowedValue: "BOUND"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data8.media_asset_version_id !== undefined){
let data11 = data8.media_asset_version_id;
if(typeof data11 === "string"){
if(!pattern97.test(data11)){
const err39 = {instancePath:instancePath+"/media/media_asset_version_id",schemaPath:"#/$defs/media/oneOf/1/properties/media_asset_version_id/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]*$"},message:"must match pattern \""+"^[1-9][0-9]*$"+"\""};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
else {
const err40 = {instancePath:instancePath+"/media/media_asset_version_id",schemaPath:"#/$defs/media/oneOf/1/properties/media_asset_version_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data8.media_key !== undefined){
let data12 = data8.media_key;
if(typeof data12 === "string"){
if(func2(data12) > 1024){
const err41 = {instancePath:instancePath+"/media/media_key",schemaPath:"#/$defs/media/oneOf/1/properties/media_key/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(func2(data12) < 1){
const err42 = {instancePath:instancePath+"/media/media_key",schemaPath:"#/$defs/media/oneOf/1/properties/media_key/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(!pattern468.test(data12)){
const err43 = {instancePath:instancePath+"/media/media_key",schemaPath:"#/$defs/media/oneOf/1/properties/media_key/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._/-]*$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._/-]*$"+"\""};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
else {
const err44 = {instancePath:instancePath+"/media/media_key",schemaPath:"#/$defs/media/oneOf/1/properties/media_key/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data8.presentation_kind !== undefined){
let data13 = data8.presentation_kind;
if(!((data13 === "SERIES_REPRESENTATIVE") || (data13 === "STYLE_REPRESENTATIVE"))){
const err45 = {instancePath:instancePath+"/media/presentation_kind",schemaPath:"#/$defs/media/oneOf/1/properties/presentation_kind/enum",keyword:"enum",params:{allowedValues: schema1068.oneOf[1].properties.presentation_kind.enum},message:"must be equal to one of the allowed values"};
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
const err46 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
var _valid1 = _errs27 === errors;
if(_valid1 && valid6){
valid6 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid6 = true;
passing1 = 1;
if(props0 !== true){
props0 = true;
}
}
}
if(!valid6){
const err47 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/media/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
else {
errors = _errs22;
if(vErrors !== null){
if(_errs22){
vErrors.length = _errs22;
}
else {
vErrors = null;
}
}
}
}
if(data.catalog_version !== undefined){
let data14 = data.catalog_version;
if(typeof data14 === "string"){
if(func2(data14) > 512){
const err48 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(func2(data14) < 1){
const err49 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(!pattern87.test(data14)){
const err50 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
else {
const err51 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
}
else {
const err52 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
validate580.errors = vErrors;
return errors === 0;
}
validate580.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate579(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate579.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.rank === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rank"},message:"must have required property '"+"rank"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.tie_break_key === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tie_break_key"},message:"must have required property '"+"tie_break_key"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.measurement_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "measurement_id"},message:"must have required property '"+"measurement_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.analysis_unit_id === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.direction === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "direction"},message:"must have required property '"+"direction"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.evidence_grade === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_grade"},message:"must have required property '"+"evidence_grade"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.conservative_source_code === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "conservative_source_code"},message:"must have required property '"+"conservative_source_code"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.conservative_same_direction_change_floor_ratio === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "conservative_same_direction_change_floor_ratio"},message:"must have required property '"+"conservative_same_direction_change_floor_ratio"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.catalog === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog"},message:"must have required property '"+"catalog"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.supporting_sources === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supporting_sources"},message:"must have required property '"+"supporting_sources"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.unavailable_sources === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "unavailable_sources"},message:"must have required property '"+"unavailable_sources"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema1056.properties, key0))){
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
if(data.rank !== undefined){
let data0 = data.rank;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err12 = {instancePath:instancePath+"/rank",schemaPath:"#/properties/rank/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 50 || isNaN(data0)){
const err13 = {instancePath:instancePath+"/rank",schemaPath:"#/properties/rank/maximum",keyword:"maximum",params:{comparison: "<=", limit: 50},message:"must be <= 50"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data0 < 1 || isNaN(data0)){
const err14 = {instancePath:instancePath+"/rank",schemaPath:"#/properties/rank/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.tie_break_key !== undefined){
let data1 = data.tie_break_key;
if(typeof data1 === "string"){
if(func2(data1) > 512){
const err15 = {instancePath:instancePath+"/tie_break_key",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(func2(data1) < 1){
const err16 = {instancePath:instancePath+"/tie_break_key",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern87.test(data1)){
const err17 = {instancePath:instancePath+"/tie_break_key",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err18 = {instancePath:instancePath+"/tie_break_key",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.measurement_id !== undefined){
let data2 = data.measurement_id;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err19 = {instancePath:instancePath+"/measurement_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err20 = {instancePath:instancePath+"/measurement_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data3 = data.analysis_unit_id;
if(typeof data3 === "string"){
if(func2(data3) > 512){
const err21 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(func2(data3) < 1){
const err22 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!pattern87.test(data3)){
const err23 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err24 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.direction !== undefined){
let data4 = data.direction;
if(!((data4 === "GAINERS") || (data4 === "LOSERS"))){
const err25 = {instancePath:instancePath+"/direction",schemaPath:"#/properties/direction/enum",keyword:"enum",params:{allowedValues: schema1056.properties.direction.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.evidence_grade !== undefined){
let data5 = data.evidence_grade;
if(!((data5 === "THREE_SOURCE_CONFIRMED") || (data5 === "TWO_SOURCE_SUPPORTED"))){
const err26 = {instancePath:instancePath+"/evidence_grade",schemaPath:"#/properties/evidence_grade/enum",keyword:"enum",params:{allowedValues: schema1056.properties.evidence_grade.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.conservative_source_code !== undefined){
let data6 = data.conservative_source_code;
if(!(((data6 === "market_a") || (data6 === "market_b")) || (data6 === "market_c"))){
const err27 = {instancePath:instancePath+"/conservative_source_code",schemaPath:"#/properties/conservative_source_code/enum",keyword:"enum",params:{allowedValues: schema1056.properties.conservative_source_code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.conservative_same_direction_change_floor_ratio !== undefined){
let data7 = data.conservative_same_direction_change_floor_ratio;
if(typeof data7 === "string"){
if(!pattern461.test(data7)){
const err28 = {instancePath:instancePath+"/conservative_same_direction_change_floor_ratio",schemaPath:"#/$defs/ratio/pattern",keyword:"pattern",params:{pattern: "^-?(0|[1-9][0-9]*)\\.[0-9]{8}$"},message:"must match pattern \""+"^-?(0|[1-9][0-9]*)\\.[0-9]{8}$"+"\""};
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
const err29 = {instancePath:instancePath+"/conservative_same_direction_change_floor_ratio",schemaPath:"#/$defs/ratio/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.catalog !== undefined){
if(!(validate580(data.catalog, {instancePath:instancePath+"/catalog",parentData:data,parentDataProperty:"catalog",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate580.errors : vErrors.concat(validate580.errors);
errors = vErrors.length;
}
}
if(data.supporting_sources !== undefined){
let data9 = data.supporting_sources;
if(Array.isArray(data9)){
if(data9.length > 3){
const err30 = {instancePath:instancePath+"/supporting_sources",schemaPath:"#/properties/supporting_sources/maxItems",keyword:"maxItems",params:{limit: 3},message:"must NOT have more than 3 items"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data9.length < 2){
const err31 = {instancePath:instancePath+"/supporting_sources",schemaPath:"#/properties/supporting_sources/minItems",keyword:"minItems",params:{limit: 2},message:"must NOT have fewer than 2 items"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
const len0 = data9.length;
for(let i0=0; i0<len0; i0++){
let data10 = data9[i0];
if(!(((data10 === "market_a") || (data10 === "market_b")) || (data10 === "market_c"))){
const err32 = {instancePath:instancePath+"/supporting_sources/" + i0,schemaPath:"#/properties/supporting_sources/items/enum",keyword:"enum",params:{allowedValues: schema1056.properties.supporting_sources.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
let i1 = data9.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data9[i1], data9[j0])){
const err33 = {instancePath:instancePath+"/supporting_sources",schemaPath:"#/properties/supporting_sources/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err34 = {instancePath:instancePath+"/supporting_sources",schemaPath:"#/properties/supporting_sources/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.unavailable_sources !== undefined){
let data11 = data.unavailable_sources;
if(Array.isArray(data11)){
if(data11.length > 1){
const err35 = {instancePath:instancePath+"/unavailable_sources",schemaPath:"#/properties/unavailable_sources/maxItems",keyword:"maxItems",params:{limit: 1},message:"must NOT have more than 1 items"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
const len1 = data11.length;
for(let i2=0; i2<len1; i2++){
let data12 = data11[i2];
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.source_code === undefined){
const err36 = {instancePath:instancePath+"/unavailable_sources/" + i2,schemaPath:"#/properties/unavailable_sources/items/required",keyword:"required",params:{missingProperty: "source_code"},message:"must have required property '"+"source_code"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data12.start_reason === undefined){
const err37 = {instancePath:instancePath+"/unavailable_sources/" + i2,schemaPath:"#/properties/unavailable_sources/items/required",keyword:"required",params:{missingProperty: "start_reason"},message:"must have required property '"+"start_reason"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data12.end_reason === undefined){
const err38 = {instancePath:instancePath+"/unavailable_sources/" + i2,schemaPath:"#/properties/unavailable_sources/items/required",keyword:"required",params:{missingProperty: "end_reason"},message:"must have required property '"+"end_reason"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
for(const key1 in data12){
if(!(((key1 === "source_code") || (key1 === "start_reason")) || (key1 === "end_reason"))){
const err39 = {instancePath:instancePath+"/unavailable_sources/" + i2,schemaPath:"#/properties/unavailable_sources/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data12.source_code !== undefined){
let data13 = data12.source_code;
if(!(((data13 === "market_a") || (data13 === "market_b")) || (data13 === "market_c"))){
const err40 = {instancePath:instancePath+"/unavailable_sources/" + i2+"/source_code",schemaPath:"#/properties/unavailable_sources/items/properties/source_code/enum",keyword:"enum",params:{allowedValues: schema1056.properties.unavailable_sources.items.properties.source_code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data12.start_reason !== undefined){
let data14 = data12.start_reason;
if(!(((data14 === "QUALIFIED") || (data14 === "PROVIDER_HISTORY_SOURCE_ABSENT")) || (data14 === "NO_ACTIVE_ASK"))){
const err41 = {instancePath:instancePath+"/unavailable_sources/" + i2+"/start_reason",schemaPath:"#/properties/unavailable_sources/items/properties/start_reason/enum",keyword:"enum",params:{allowedValues: schema1056.properties.unavailable_sources.items.properties.start_reason.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data12.end_reason !== undefined){
let data15 = data12.end_reason;
if(!(((data15 === "QUALIFIED") || (data15 === "PROVIDER_HISTORY_SOURCE_ABSENT")) || (data15 === "NO_ACTIVE_ASK"))){
const err42 = {instancePath:instancePath+"/unavailable_sources/" + i2+"/end_reason",schemaPath:"#/properties/unavailable_sources/items/properties/end_reason/enum",keyword:"enum",params:{allowedValues: schema1056.properties.unavailable_sources.items.properties.end_reason.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
}
else {
const err43 = {instancePath:instancePath+"/unavailable_sources/" + i2,schemaPath:"#/properties/unavailable_sources/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
}
else {
const err44 = {instancePath:instancePath+"/unavailable_sources",schemaPath:"#/properties/unavailable_sources/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err45 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
validate579.errors = vErrors;
return errors === 0;
}
validate579.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate561(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate561.evaluated;
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
if(data.response_kind === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.query === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.publication === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication"},message:"must have required property '"+"publication"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.total === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "total"},message:"must have required property '"+"total"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.members === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.next_cursor === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query")) || (key0 === "publication")) || (key0 === "total")) || (key0 === "members")) || (key0 === "next_cursor"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.api_contract !== undefined){
if("single-item-trending-public-api" !== data.api_contract){
const err9 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "single-item-trending-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v4" !== data.api_version){
const err10 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v4"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("TRENDING_LIST" !== data.response_kind){
const err11 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "TRENDING_LIST"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.query !== undefined){
if(!(validate562(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate562.errors : vErrors.concat(validate562.errors);
errors = vErrors.length;
}
}
if(data.publication !== undefined){
if(!(validate568(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate568.errors : vErrors.concat(validate568.errors);
errors = vErrors.length;
}
}
if(data.total !== undefined){
let data5 = data.total;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err12 = {instancePath:instancePath+"/total",schemaPath:"#/properties/total/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 50 || isNaN(data5)){
const err13 = {instancePath:instancePath+"/total",schemaPath:"#/properties/total/maximum",keyword:"maximum",params:{comparison: "<=", limit: 50},message:"must be <= 50"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err14 = {instancePath:instancePath+"/total",schemaPath:"#/properties/total/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.members !== undefined){
let data6 = data.members;
if(Array.isArray(data6)){
if(data6.length > 50){
const err15 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 50},message:"must NOT have more than 50 items"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
if(!(validate579(data6[i0], {instancePath:instancePath+"/members/" + i0,parentData:data6,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate579.errors : vErrors.concat(validate579.errors);
errors = vErrors.length;
}
}
}
else {
const err16 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data8 = data.next_cursor;
const _errs14 = errors;
let valid4 = false;
let passing0 = null;
const _errs15 = errors;
if(typeof data8 === "string"){
if(func2(data8) > 8192){
const err17 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/nullableCursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(func2(data8) < 1){
const err18 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/nullableCursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!pattern73.test(data8)){
const err19 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/nullableCursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
const err20 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/nullableCursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid0 = _errs15 === errors;
if(_valid0){
valid4 = true;
passing0 = 0;
}
const _errs17 = errors;
if(data8 !== null){
const err21 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/nullableCursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
var _valid0 = _errs17 === errors;
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
const err22 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/nullableCursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
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
}
else {
const err23 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
validate561.errors = vErrors;
return errors === 0;
}
validate561.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate560(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:single-item-trending-public-api:v4" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate560.evaluated;
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
if(!(validate561(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate561.errors : vErrors.concat(validate561.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
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
if(data.response_kind === undefined){
const err2 = {instancePath,schemaPath:"#/$defs/errorResponse/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.error === undefined){
const err3 = {instancePath,schemaPath:"#/$defs/errorResponse/required",keyword:"required",params:{missingProperty: "error"},message:"must have required property '"+"error"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "error"))){
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
if("single-item-trending-public-api" !== data.api_contract){
const err5 = {instancePath:instancePath+"/api_contract",schemaPath:"#/$defs/errorResponse/properties/api_contract/const",keyword:"const",params:{allowedValue: "single-item-trending-public-api"},message:"must be equal to constant"};
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
if("v4" !== data.api_version){
const err6 = {instancePath:instancePath+"/api_version",schemaPath:"#/$defs/errorResponse/properties/api_version/const",keyword:"const",params:{allowedValue: "v4"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("ERROR" !== data.response_kind){
const err7 = {instancePath:instancePath+"/response_kind",schemaPath:"#/$defs/errorResponse/properties/response_kind/const",keyword:"const",params:{allowedValue: "ERROR"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.error !== undefined){
let data3 = data.error;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.code === undefined){
const err8 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data3.retryable === undefined){
const err9 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "code") || (key1 === "retryable"))){
const err10 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data3.code !== undefined){
let data4 = data3.code;
if(!(((((((data4 === "INVALID_ARGUMENT") || (data4 === "INVALID_CURSOR")) || (data4 === "NOT_PUBLISHED")) || (data4 === "BACKEND_UNAVAILABLE")) || (data4 === "PUBLICATION_EXPIRED")) || (data4 === "PUBLICATION_WITHDRAWN")) || (data4 === "RESULT_CORRUPT"))){
const err11 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/properties/code/enum",keyword:"enum",params:{allowedValues: schema1071.properties.error.properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data3.retryable !== undefined){
if(typeof data3.retryable !== "boolean"){
const err12 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/errorResponse/properties/error/properties/retryable/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
const err13 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err14 = {instancePath,schemaPath:"#/$defs/errorResponse/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
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
}
if(!valid0){
const err15 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
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
validate560.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate560.evaluated = {"dynamicProps":true,"dynamicItems":false};
