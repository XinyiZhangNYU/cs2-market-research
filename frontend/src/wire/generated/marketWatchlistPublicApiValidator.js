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
export const validateMarketWatchlistPublicApiResponse = validate247;
const schema400 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:market-watchlist-public-api:v1","title":"CS2 public market and watchlist result API V1","oneOf":[{"$ref":"#/$defs/marketOverviewResponse"},{"$ref":"#/$defs/marketHistoryResponse"},{"$ref":"#/$defs/watchlistResponse"},{"$ref":"#/$defs/watchlistDetailResponse"},{"$ref":"#/$defs/watchlistHistoryResponse"},{"$ref":"#/$defs/errorResponse"}],"$defs":{"sha256":{"type":"string","pattern":"^[0-9a-f]{64}$"},"timestamp":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},"identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"nullableTimestamp":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]},"nullableSha256":{"oneOf":[{"$ref":"#/$defs/sha256"},{"type":"null"}]},"dataStatus":{"enum":["COMPLETE","DEGRADED_OPTIONAL"]},"freshness":{"enum":["FRESH","STALE_RETAINED"]},"trendStage":{"enum":["UP_BUILDING","UP_ACTIVE","UP_COOLING","NEUTRAL","DOWN_BUILDING","DOWN_ACTIVE","DOWN_COOLING"]},"recommendation":{"enum":["IGNORE","WATCH","RECOMMENDED_CANDIDATE","STRONG_CANDIDATE","OVERHEATED_DO_NOT_CHASE","COOLING_REMOVE_FROM_PRIORITY","WITHHELD_DATA_INCOMPLETE"]},"caseStatus":{"type":["string","null"],"enum":["ACTIVE","SUSPENDED","RESOLVED","UNRESOLVED","RETRACTED",null]},"evidenceFlags":{"type":"array","uniqueItems":true,"items":{"enum":["DEMAND_ACCELERATING","SUPPLY_CONTRACTING","PRICE_RISING","SUSPECTED_SWEEPING","SWEEPING_CONFIRMED","REACCELERATION","OVERHEATED","SHOCK","BREADTH_COLLAPSE","LIQUIDITY_CONTRACTION","CONCENTRATION_WARNING"]}},"catalogDescriptor":{"type":"object","additionalProperties":false,"required":["snapshot_id","catalog_version","as_of","available_at","member_count","member_set_hash"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_version":{"$ref":"#/$defs/identifier"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"member_count":{"type":"integer","minimum":0},"member_set_hash":{"$ref":"#/$defs/sha256"}}},"producerRelease":{"type":"object","additionalProperties":false,"required":["release_code","algorithm_version","parameter_set_version","data_quality_policy_version"],"properties":{"release_code":{"$ref":"#/$defs/identifier"},"algorithm_version":{"$ref":"#/$defs/identifier"},"parameter_set_version":{"$ref":"#/$defs/identifier"},"data_quality_policy_version":{"$ref":"#/$defs/identifier"}}},"publication":{"type":"object","additionalProperties":false,"required":["publication_id","manifest_hash","result_as_of","input_available_at","public_available_at","published_at","fresh_until","retain_until","freshness","supersedes_publication_id","producer_release","watchlist_policy_code","catalog"],"properties":{"publication_id":{"$ref":"#/$defs/sha256"},"manifest_hash":{"$ref":"#/$defs/sha256"},"result_as_of":{"$ref":"#/$defs/timestamp"},"input_available_at":{"$ref":"#/$defs/timestamp"},"public_available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"fresh_until":{"$ref":"#/$defs/timestamp"},"retain_until":{"$ref":"#/$defs/timestamp"},"freshness":{"$ref":"#/$defs/freshness"},"supersedes_publication_id":{"$ref":"#/$defs/nullableSha256"},"producer_release":{"$ref":"#/$defs/producerRelease"},"watchlist_policy_code":{"$ref":"#/$defs/identifier"},"catalog":{"$ref":"#/$defs/catalogDescriptor"}}},"queryBound":{"type":"object","additionalProperties":false,"required":["as_of","query_known_at"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"}}},"marketState":{"type":"object","additionalProperties":false,"required":["analysis_unit_id","data_status","trend_stage","level_regime","evidence_flags","recommendation","case_status"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"data_status":{"$ref":"#/$defs/dataStatus"},"trend_stage":{"$ref":"#/$defs/trendStage"},"level_regime":{"enum":["DEPRESSED","NORMAL","ELEVATED","UNKNOWN"]},"evidence_flags":{"$ref":"#/$defs/evidenceFlags"},"recommendation":{"$ref":"#/$defs/recommendation"},"case_status":{"$ref":"#/$defs/caseStatus"}}},"breadth":{"type":"object","additionalProperties":false,"required":["advancing_member_ratio","median_member_return","breadth_expanding","breadth_narrowing","concentration_warning"],"properties":{"advancing_member_ratio":{"type":["string","null"],"pattern":"^(0(\\.[0-9]+)?|1(\\.0+)?)$"},"median_member_return":{"type":["string","null"],"pattern":"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"},"breadth_expanding":{"type":"boolean"},"breadth_narrowing":{"type":"boolean"},"concentration_warning":{"type":"boolean"}}},"sectorState":{"type":"object","additionalProperties":false,"required":["display_order","sector_code","analysis_unit_id","data_status","trend_stage","relative_strength","breadth","evidence_flags","recommendation","case_status"],"properties":{"display_order":{"type":"integer","minimum":1,"maximum":3},"sector_code":{"enum":["GLOVE","KNIFE","WEAPON"]},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"data_status":{"$ref":"#/$defs/dataStatus"},"trend_stage":{"$ref":"#/$defs/trendStage"},"relative_strength":{"enum":["LEADING","IN_LINE","LAGGING","UNKNOWN"]},"breadth":{"$ref":"#/$defs/breadth"},"evidence_flags":{"$ref":"#/$defs/evidenceFlags"},"recommendation":{"$ref":"#/$defs/recommendation"},"case_status":{"$ref":"#/$defs/caseStatus"}}},"recommendationDetail":{"type":"object","additionalProperties":false,"required":["recommendation","signal_strength","evidence_coverage","trade_confirmation"],"properties":{"recommendation":{"$ref":"#/$defs/recommendation"},"signal_strength":{"enum":["NONE","WEAK","MODERATE","STRONG"]},"evidence_coverage":{"type":"string","pattern":"^(0(\\.[0-9]+)?|1(\\.0+)?)$"},"trade_confirmation":{"enum":["UNAVAILABLE","AVAILABLE_NOT_CONFIRMED","CONFIRMED"]}}},"evidenceDomain":{"type":"object","additionalProperties":false,"required":["domain","strength","contributing_feature_keys","missing_reason"],"properties":{"domain":{"enum":["P","D","S"]},"strength":{"enum":["UNAVAILABLE","CONFLICTED","ABSENT","WEAK","MODERATE","STRONG"]},"contributing_feature_keys":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/identifier"}},"missing_reason":{"type":["string","null"],"enum":["UNAVAILABLE_BY_DESIGN","OPTIONAL_DATA_UNAVAILABLE","DATA_UNAVAILABLE_RUNTIME_GRACE","DATA_UNAVAILABLE_RUNTIME","STALE_GRACE","STALE","CONFLICTED_INPUTS",null]}}},"itemState":{"type":"object","additionalProperties":false,"required":["analysis_unit_id","data_status","cycle_stage","evidence_flags","regime_relation","recommendation","case_status","recommendation_detail","evidence_domains","claims"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"data_status":{"$ref":"#/$defs/dataStatus"},"cycle_stage":{"enum":["BASELINE","PRESSURE_BUILDING","CONFIRMED_UP","COOLING"]},"evidence_flags":{"$ref":"#/$defs/evidenceFlags"},"regime_relation":{"type":"array","uniqueItems":true,"items":{"enum":["MARKET_DRIVEN","SECTOR_DRIVEN","ITEM_SPECIFIC","COUNTER_REGIME","IN_LINE","UNKNOWN"]}},"recommendation":{"$ref":"#/$defs/recommendation"},"case_status":{"$ref":"#/$defs/caseStatus"},"recommendation_detail":{"$ref":"#/$defs/recommendationDetail"},"evidence_domains":{"type":"array","minItems":3,"maxItems":3,"items":{"$ref":"#/$defs/evidenceDomain"}},"claims":{"type":"array","uniqueItems":true,"items":{"enum":["UNIFIED_PRICE_RISING","BID_PRICE_RISING","BUY_DEMAND_STRENGTHENING","SELLABLE_SUPPLY_DECLINING","MULTI_SOURCE_ALIGNED","TRUSTED_TRADE_VOLUME_INCREASING","SWEEPING_CONFIRMED"]}}}},"catalogLocalizedName":{"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"zh_cn":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"}}},"versionId":{"type":"string","pattern":"^[1-9][0-9]*$"},"catalogMediaNotProduced":{"type":"object","additionalProperties":false,"required":["status"],"properties":{"status":{"const":"NOT_PRODUCED"}}},"catalogMediaBound":{"type":"object","additionalProperties":false,"required":["status","media_asset_version_id","media_key","presentation_kind"],"properties":{"status":{"const":"BOUND"},"media_asset_version_id":{"$ref":"#/$defs/versionId"},"media_key":{"type":"string","maxLength":256,"pattern":"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$","not":{"pattern":"(^|/)\\.{1,2}(/|$)"}},"presentation_kind":{"enum":["SERIES_REPRESENTATIVE","STYLE_REPRESENTATIVE"]}}},"catalogMedia":{"oneOf":[{"$ref":"#/$defs/catalogMediaNotProduced"},{"$ref":"#/$defs/catalogMediaBound"}]},"catalogProjection":{"type":"object","additionalProperties":false,"required":["analysis_unit_id","parent_analysis_unit_id","analysis_unit_kind","item_kind","base_item_code","edition_kind","wear_tier","localized_name","media","catalog_version"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"base_item_code":{"$ref":"#/$defs/identifier"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/catalogLocalizedName"},"media":{"$ref":"#/$defs/catalogMedia"},"catalog_version":{"type":"string","minLength":1,"maxLength":128,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"}}},"watchlistMember":{"type":"object","additionalProperties":false,"required":["rank","tie_break_key","inclusion_reason_codes","result","catalog"],"properties":{"rank":{"type":"integer","minimum":1,"maximum":500},"tie_break_key":{"$ref":"#/$defs/identifier"},"inclusion_reason_codes":{"type":"array","uniqueItems":true,"items":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,63}$"}},"result":{"$ref":"#/$defs/itemState"},"catalog":{"$ref":"#/$defs/catalogProjection"}}},"marketPublicationSummary":{"type":"object","additionalProperties":false,"required":["publication","market","sectors"],"properties":{"publication":{"$ref":"#/$defs/publication"},"market":{"$ref":"#/$defs/marketState"},"sectors":{"type":"array","minItems":3,"maxItems":3,"prefixItems":[{"allOf":[{"$ref":"#/$defs/sectorState"},{"properties":{"display_order":{"const":1},"sector_code":{"const":"GLOVE"}}}]},{"allOf":[{"$ref":"#/$defs/sectorState"},{"properties":{"display_order":{"const":2},"sector_code":{"const":"KNIFE"}}}]},{"allOf":[{"$ref":"#/$defs/sectorState"},{"properties":{"display_order":{"const":3},"sector_code":{"const":"WEAPON"}}}]}],"items":false}}},"marketOverviewResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","publication","market","sectors"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"MARKET_OVERVIEW"},"query":{"$ref":"#/$defs/queryBound"},"publication":{"$ref":"#/$defs/publication"},"market":{"$ref":"#/$defs/marketState"},"sectors":{"$ref":"#/$defs/marketPublicationSummary/properties/sectors"}}},"marketHistoryQuery":{"type":"object","additionalProperties":false,"required":["as_of","query_known_at","page_size","cursor"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"},"page_size":{"type":"integer","minimum":1,"maximum":32},"cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}},"marketHistoryResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","members","next_cursor"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"MARKET_HISTORY"},"query":{"$ref":"#/$defs/marketHistoryQuery"},"members":{"type":"array","items":{"$ref":"#/$defs/marketPublicationSummary"}},"next_cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}},"watchlistQuery":{"type":"object","additionalProperties":false,"required":["as_of","query_known_at","publication_id","sort","page_size","cursor"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/nullableSha256"},"sort":{"const":"RANK_ASC"},"page_size":{"type":"integer","minimum":1,"maximum":100},"cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}},"watchlistResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","publication","total","members","next_cursor"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"WATCHLIST"},"query":{"$ref":"#/$defs/watchlistQuery"},"publication":{"$ref":"#/$defs/publication"},"total":{"type":"integer","minimum":0,"maximum":500},"members":{"type":"array","items":{"$ref":"#/$defs/watchlistMember"}},"next_cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}},"detailQuery":{"type":"object","additionalProperties":false,"required":["as_of","query_known_at","publication_id","analysis_unit_id"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"}}},"watchlistDetailResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","publication","member"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"WATCHLIST_DETAIL"},"query":{"$ref":"#/$defs/detailQuery"},"publication":{"$ref":"#/$defs/publication"},"member":{"$ref":"#/$defs/watchlistMember"}}},"watchlistHistoryMember":{"type":"object","additionalProperties":false,"required":["publication","rank","inclusion_reason_codes","result"],"properties":{"publication":{"$ref":"#/$defs/publication"},"rank":{"type":"integer","minimum":1,"maximum":500},"inclusion_reason_codes":{"type":"array","uniqueItems":true,"items":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,63}$"}},"result":{"$ref":"#/$defs/itemState"}}},"watchlistHistoryQuery":{"type":"object","additionalProperties":false,"required":["query_known_at","publication_id","analysis_unit_id","page_size","cursor"],"properties":{"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"page_size":{"type":"integer","minimum":1,"maximum":50},"cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}},"watchlistHistoryResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","members","next_cursor"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"WATCHLIST_HISTORY"},"query":{"$ref":"#/$defs/watchlistHistoryQuery"},"members":{"type":"array","items":{"$ref":"#/$defs/watchlistHistoryMember"}},"next_cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}},"errorResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","NOT_PUBLISHED","NOT_FOUND","BACKEND_UNAVAILABLE","PUBLICATION_EXPIRED","PUBLICATION_WITHDRAWN","RESULT_CORRUPT"]},"retryable":{"type":"boolean"}}}}}}};
const schema485 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","NOT_PUBLISHED","NOT_FOUND","BACKEND_UNAVAILABLE","PUBLICATION_EXPIRED","PUBLICATION_WITHDRAWN","RESULT_CORRUPT"]},"retryable":{"type":"boolean"}}}}};
const schema401 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","publication","market","sectors"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"MARKET_OVERVIEW"},"query":{"$ref":"#/$defs/queryBound"},"publication":{"$ref":"#/$defs/publication"},"market":{"$ref":"#/$defs/marketState"},"sectors":{"$ref":"#/$defs/marketPublicationSummary/properties/sectors"}}};
const schema402 = {"type":"object","additionalProperties":false,"required":["as_of","query_known_at"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"}}};
const schema404 = {"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"};
const schema403 = {"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]};
const pattern19 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$", "u");

function validate250(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate250.evaluated;
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
if(!pattern19.test(data)){
const err0 = {instancePath,schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err1 = {instancePath,schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate250.errors = vErrors;
return errors === 0;
}
validate250.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate249(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate249.evaluated;
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
if(data.query_known_at === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_known_at"},message:"must have required property '"+"query_known_at"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "as_of") || (key0 === "query_known_at"))){
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
if(data.as_of !== undefined){
if(!(validate250(data.as_of, {instancePath:instancePath+"/as_of",parentData:data,parentDataProperty:"as_of",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate250.errors : vErrors.concat(validate250.errors);
errors = vErrors.length;
}
}
if(data.query_known_at !== undefined){
let data1 = data.query_known_at;
if(typeof data1 === "string"){
if(!pattern19.test(data1)){
const err3 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
else {
const err4 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
}
else {
const err5 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
validate249.errors = vErrors;
return errors === 0;
}
validate249.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema406 = {"type":"object","additionalProperties":false,"required":["publication_id","manifest_hash","result_as_of","input_available_at","public_available_at","published_at","fresh_until","retain_until","freshness","supersedes_publication_id","producer_release","watchlist_policy_code","catalog"],"properties":{"publication_id":{"$ref":"#/$defs/sha256"},"manifest_hash":{"$ref":"#/$defs/sha256"},"result_as_of":{"$ref":"#/$defs/timestamp"},"input_available_at":{"$ref":"#/$defs/timestamp"},"public_available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"fresh_until":{"$ref":"#/$defs/timestamp"},"retain_until":{"$ref":"#/$defs/timestamp"},"freshness":{"$ref":"#/$defs/freshness"},"supersedes_publication_id":{"$ref":"#/$defs/nullableSha256"},"producer_release":{"$ref":"#/$defs/producerRelease"},"watchlist_policy_code":{"$ref":"#/$defs/identifier"},"catalog":{"$ref":"#/$defs/catalogDescriptor"}}};
const schema407 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const schema415 = {"enum":["FRESH","STALE_RETAINED"]};
const schema419 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"};
const func9 = Object.prototype.hasOwnProperty;
const func2 = __wireUcs2Length;
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");
const pattern87 = new RegExp("^[^\\u0000-\\u001f\\u007f]+$", "u");
const schema416 = {"oneOf":[{"$ref":"#/$defs/sha256"},{"type":"null"}]};

function validate254(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate254.evaluated;
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
validate254.errors = vErrors;
return errors === 0;
}
validate254.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema418 = {"type":"object","additionalProperties":false,"required":["release_code","algorithm_version","parameter_set_version","data_quality_policy_version"],"properties":{"release_code":{"$ref":"#/$defs/identifier"},"algorithm_version":{"$ref":"#/$defs/identifier"},"parameter_set_version":{"$ref":"#/$defs/identifier"},"data_quality_policy_version":{"$ref":"#/$defs/identifier"}}};

function validate256(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate256.evaluated;
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
if(data.parameter_set_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parameter_set_version"},message:"must have required property '"+"parameter_set_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.data_quality_policy_version === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_quality_policy_version"},message:"must have required property '"+"data_quality_policy_version"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "release_code") || (key0 === "algorithm_version")) || (key0 === "parameter_set_version")) || (key0 === "data_quality_policy_version"))){
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
if(func2(data0) > 256){
const err5 = {instancePath:instancePath+"/release_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
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
if(func2(data1) > 256){
const err9 = {instancePath:instancePath+"/algorithm_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
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
if(data.parameter_set_version !== undefined){
let data2 = data.parameter_set_version;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err13 = {instancePath:instancePath+"/parameter_set_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data2) < 1){
const err14 = {instancePath:instancePath+"/parameter_set_version",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern87.test(data2)){
const err15 = {instancePath:instancePath+"/parameter_set_version",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err16 = {instancePath:instancePath+"/parameter_set_version",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.data_quality_policy_version !== undefined){
let data3 = data.data_quality_policy_version;
if(typeof data3 === "string"){
if(func2(data3) > 256){
const err17 = {instancePath:instancePath+"/data_quality_policy_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(func2(data3) < 1){
const err18 = {instancePath:instancePath+"/data_quality_policy_version",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!pattern87.test(data3)){
const err19 = {instancePath:instancePath+"/data_quality_policy_version",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err20 = {instancePath:instancePath+"/data_quality_policy_version",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate256.errors = vErrors;
return errors === 0;
}
validate256.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema424 = {"type":"object","additionalProperties":false,"required":["snapshot_id","catalog_version","as_of","available_at","member_count","member_set_hash"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_version":{"$ref":"#/$defs/identifier"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"member_count":{"type":"integer","minimum":0},"member_set_hash":{"$ref":"#/$defs/sha256"}}};

function validate258(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate258.evaluated;
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
if(data.catalog_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_version"},message:"must have required property '"+"catalog_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.as_of === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "as_of"},message:"must have required property '"+"as_of"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.available_at === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.member_count === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_count"},message:"must have required property '"+"member_count"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.member_set_hash === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_set_hash"},message:"must have required property '"+"member_set_hash"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "snapshot_id") || (key0 === "catalog_version")) || (key0 === "as_of")) || (key0 === "available_at")) || (key0 === "member_count")) || (key0 === "member_set_hash"))){
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
if(data.snapshot_id !== undefined){
let data0 = data.snapshot_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err7 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.catalog_version !== undefined){
let data1 = data.catalog_version;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err9 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(func2(data1) < 1){
const err10 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern87.test(data1)){
const err11 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err12 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.as_of !== undefined){
let data2 = data.as_of;
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
const err13 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err14 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.available_at !== undefined){
let data3 = data.available_at;
if(typeof data3 === "string"){
if(!pattern19.test(data3)){
const err15 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err16 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.member_count !== undefined){
let data4 = data.member_count;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err17 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 < 0 || isNaN(data4)){
const err18 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
if(data.member_set_hash !== undefined){
let data5 = data.member_set_hash;
if(typeof data5 === "string"){
if(!pattern5.test(data5)){
const err19 = {instancePath:instancePath+"/member_set_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err20 = {instancePath:instancePath+"/member_set_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate258.errors = vErrors;
return errors === 0;
}
validate258.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate253(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate253.evaluated;
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
if(data.fresh_until === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fresh_until"},message:"must have required property '"+"fresh_until"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.retain_until === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "retain_until"},message:"must have required property '"+"retain_until"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.freshness === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "freshness"},message:"must have required property '"+"freshness"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.supersedes_publication_id === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supersedes_publication_id"},message:"must have required property '"+"supersedes_publication_id"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.producer_release === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "producer_release"},message:"must have required property '"+"producer_release"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.watchlist_policy_code === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "watchlist_policy_code"},message:"must have required property '"+"watchlist_policy_code"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.catalog === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog"},message:"must have required property '"+"catalog"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema406.properties, key0))){
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
if(data.publication_id !== undefined){
let data0 = data.publication_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err14 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err15 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.manifest_hash !== undefined){
let data1 = data.manifest_hash;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err16 = {instancePath:instancePath+"/manifest_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err17 = {instancePath:instancePath+"/manifest_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.result_as_of !== undefined){
let data2 = data.result_as_of;
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
const err18 = {instancePath:instancePath+"/result_as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err19 = {instancePath:instancePath+"/result_as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.input_available_at !== undefined){
let data3 = data.input_available_at;
if(typeof data3 === "string"){
if(!pattern19.test(data3)){
const err20 = {instancePath:instancePath+"/input_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err21 = {instancePath:instancePath+"/input_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.public_available_at !== undefined){
let data4 = data.public_available_at;
if(typeof data4 === "string"){
if(!pattern19.test(data4)){
const err22 = {instancePath:instancePath+"/public_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
else {
const err23 = {instancePath:instancePath+"/public_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.published_at !== undefined){
let data5 = data.published_at;
if(typeof data5 === "string"){
if(!pattern19.test(data5)){
const err24 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err25 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.fresh_until !== undefined){
let data6 = data.fresh_until;
if(typeof data6 === "string"){
if(!pattern19.test(data6)){
const err26 = {instancePath:instancePath+"/fresh_until",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err27 = {instancePath:instancePath+"/fresh_until",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.retain_until !== undefined){
let data7 = data.retain_until;
if(typeof data7 === "string"){
if(!pattern19.test(data7)){
const err28 = {instancePath:instancePath+"/retain_until",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err29 = {instancePath:instancePath+"/retain_until",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.freshness !== undefined){
let data8 = data.freshness;
if(!((data8 === "FRESH") || (data8 === "STALE_RETAINED"))){
const err30 = {instancePath:instancePath+"/freshness",schemaPath:"#/$defs/freshness/enum",keyword:"enum",params:{allowedValues: schema415.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.supersedes_publication_id !== undefined){
if(!(validate254(data.supersedes_publication_id, {instancePath:instancePath+"/supersedes_publication_id",parentData:data,parentDataProperty:"supersedes_publication_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate254.errors : vErrors.concat(validate254.errors);
errors = vErrors.length;
}
}
if(data.producer_release !== undefined){
if(!(validate256(data.producer_release, {instancePath:instancePath+"/producer_release",parentData:data,parentDataProperty:"producer_release",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate256.errors : vErrors.concat(validate256.errors);
errors = vErrors.length;
}
}
if(data.watchlist_policy_code !== undefined){
let data11 = data.watchlist_policy_code;
if(typeof data11 === "string"){
if(func2(data11) > 256){
const err31 = {instancePath:instancePath+"/watchlist_policy_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(func2(data11) < 1){
const err32 = {instancePath:instancePath+"/watchlist_policy_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(!pattern87.test(data11)){
const err33 = {instancePath:instancePath+"/watchlist_policy_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err34 = {instancePath:instancePath+"/watchlist_policy_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.catalog !== undefined){
if(!(validate258(data.catalog, {instancePath:instancePath+"/catalog",parentData:data,parentDataProperty:"catalog",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate258.errors : vErrors.concat(validate258.errors);
errors = vErrors.length;
}
}
}
else {
const err35 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
validate253.errors = vErrors;
return errors === 0;
}
validate253.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema430 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","data_status","trend_stage","level_regime","evidence_flags","recommendation","case_status"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"data_status":{"$ref":"#/$defs/dataStatus"},"trend_stage":{"$ref":"#/$defs/trendStage"},"level_regime":{"enum":["DEPRESSED","NORMAL","ELEVATED","UNKNOWN"]},"evidence_flags":{"$ref":"#/$defs/evidenceFlags"},"recommendation":{"$ref":"#/$defs/recommendation"},"case_status":{"$ref":"#/$defs/caseStatus"}}};
const schema432 = {"enum":["COMPLETE","DEGRADED_OPTIONAL"]};
const schema433 = {"enum":["UP_BUILDING","UP_ACTIVE","UP_COOLING","NEUTRAL","DOWN_BUILDING","DOWN_ACTIVE","DOWN_COOLING"]};
const schema434 = {"type":"array","uniqueItems":true,"items":{"enum":["DEMAND_ACCELERATING","SUPPLY_CONTRACTING","PRICE_RISING","SUSPECTED_SWEEPING","SWEEPING_CONFIRMED","REACCELERATION","OVERHEATED","SHOCK","BREADTH_COLLAPSE","LIQUIDITY_CONTRACTION","CONCENTRATION_WARNING"]}};
const schema435 = {"enum":["IGNORE","WATCH","RECOMMENDED_CANDIDATE","STRONG_CANDIDATE","OVERHEATED_DO_NOT_CHASE","COOLING_REMOVE_FROM_PRIORITY","WITHHELD_DATA_INCOMPLETE"]};
const schema436 = {"type":["string","null"],"enum":["ACTIVE","SUSPENDED","RESOLVED","UNRESOLVED","RETRACTED",null]};
const func0 = __wireEqual;

function validate261(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate261.evaluated;
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
if(data.data_status === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_status"},message:"must have required property '"+"data_status"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.trend_stage === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trend_stage"},message:"must have required property '"+"trend_stage"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.level_regime === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "level_regime"},message:"must have required property '"+"level_regime"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.evidence_flags === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_flags"},message:"must have required property '"+"evidence_flags"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.recommendation === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommendation"},message:"must have required property '"+"recommendation"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.case_status === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "case_status"},message:"must have required property '"+"case_status"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "analysis_unit_id") || (key0 === "data_status")) || (key0 === "trend_stage")) || (key0 === "level_regime")) || (key0 === "evidence_flags")) || (key0 === "recommendation")) || (key0 === "case_status"))){
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
if(data.analysis_unit_id !== undefined){
let data0 = data.analysis_unit_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err8 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data0) < 1){
const err9 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern87.test(data0)){
const err10 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.data_status !== undefined){
let data1 = data.data_status;
if(!((data1 === "COMPLETE") || (data1 === "DEGRADED_OPTIONAL"))){
const err12 = {instancePath:instancePath+"/data_status",schemaPath:"#/$defs/dataStatus/enum",keyword:"enum",params:{allowedValues: schema432.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.trend_stage !== undefined){
let data2 = data.trend_stage;
if(!(((((((data2 === "UP_BUILDING") || (data2 === "UP_ACTIVE")) || (data2 === "UP_COOLING")) || (data2 === "NEUTRAL")) || (data2 === "DOWN_BUILDING")) || (data2 === "DOWN_ACTIVE")) || (data2 === "DOWN_COOLING"))){
const err13 = {instancePath:instancePath+"/trend_stage",schemaPath:"#/$defs/trendStage/enum",keyword:"enum",params:{allowedValues: schema433.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.level_regime !== undefined){
let data3 = data.level_regime;
if(!((((data3 === "DEPRESSED") || (data3 === "NORMAL")) || (data3 === "ELEVATED")) || (data3 === "UNKNOWN"))){
const err14 = {instancePath:instancePath+"/level_regime",schemaPath:"#/properties/level_regime/enum",keyword:"enum",params:{allowedValues: schema430.properties.level_regime.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.evidence_flags !== undefined){
let data4 = data.evidence_flags;
if(Array.isArray(data4)){
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
let data5 = data4[i0];
if(!(((((((((((data5 === "DEMAND_ACCELERATING") || (data5 === "SUPPLY_CONTRACTING")) || (data5 === "PRICE_RISING")) || (data5 === "SUSPECTED_SWEEPING")) || (data5 === "SWEEPING_CONFIRMED")) || (data5 === "REACCELERATION")) || (data5 === "OVERHEATED")) || (data5 === "SHOCK")) || (data5 === "BREADTH_COLLAPSE")) || (data5 === "LIQUIDITY_CONTRACTION")) || (data5 === "CONCENTRATION_WARNING"))){
const err15 = {instancePath:instancePath+"/evidence_flags/" + i0,schemaPath:"#/$defs/evidenceFlags/items/enum",keyword:"enum",params:{allowedValues: schema434.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
let i1 = data4.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data4[i1], data4[j0])){
const err16 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidenceFlags/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err17 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidenceFlags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.recommendation !== undefined){
let data6 = data.recommendation;
if(!(((((((data6 === "IGNORE") || (data6 === "WATCH")) || (data6 === "RECOMMENDED_CANDIDATE")) || (data6 === "STRONG_CANDIDATE")) || (data6 === "OVERHEATED_DO_NOT_CHASE")) || (data6 === "COOLING_REMOVE_FROM_PRIORITY")) || (data6 === "WITHHELD_DATA_INCOMPLETE"))){
const err18 = {instancePath:instancePath+"/recommendation",schemaPath:"#/$defs/recommendation/enum",keyword:"enum",params:{allowedValues: schema435.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.case_status !== undefined){
let data7 = data.case_status;
if((typeof data7 !== "string") && (data7 !== null)){
const err19 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/caseStatus/type",keyword:"type",params:{type: schema436.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!((((((data7 === "ACTIVE") || (data7 === "SUSPENDED")) || (data7 === "RESOLVED")) || (data7 === "UNRESOLVED")) || (data7 === "RETRACTED")) || (data7 === null))){
const err20 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/caseStatus/enum",keyword:"enum",params:{allowedValues: schema436.enum},message:"must be equal to one of the allowed values"};
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
validate261.errors = vErrors;
return errors === 0;
}
validate261.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema437 = {"type":"array","minItems":3,"maxItems":3,"prefixItems":[{"allOf":[{"$ref":"#/$defs/sectorState"},{"properties":{"display_order":{"const":1},"sector_code":{"const":"GLOVE"}}}]},{"allOf":[{"$ref":"#/$defs/sectorState"},{"properties":{"display_order":{"const":2},"sector_code":{"const":"KNIFE"}}}]},{"allOf":[{"$ref":"#/$defs/sectorState"},{"properties":{"display_order":{"const":3},"sector_code":{"const":"WEAPON"}}}]}],"items":false};
const schema438 = {"type":"object","additionalProperties":false,"required":["display_order","sector_code","analysis_unit_id","data_status","trend_stage","relative_strength","breadth","evidence_flags","recommendation","case_status"],"properties":{"display_order":{"type":"integer","minimum":1,"maximum":3},"sector_code":{"enum":["GLOVE","KNIFE","WEAPON"]},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"data_status":{"$ref":"#/$defs/dataStatus"},"trend_stage":{"$ref":"#/$defs/trendStage"},"relative_strength":{"enum":["LEADING","IN_LINE","LAGGING","UNKNOWN"]},"breadth":{"$ref":"#/$defs/breadth"},"evidence_flags":{"$ref":"#/$defs/evidenceFlags"},"recommendation":{"$ref":"#/$defs/recommendation"},"case_status":{"$ref":"#/$defs/caseStatus"}}};
const schema442 = {"type":"object","additionalProperties":false,"required":["advancing_member_ratio","median_member_return","breadth_expanding","breadth_narrowing","concentration_warning"],"properties":{"advancing_member_ratio":{"type":["string","null"],"pattern":"^(0(\\.[0-9]+)?|1(\\.0+)?)$"},"median_member_return":{"type":["string","null"],"pattern":"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"},"breadth_expanding":{"type":"boolean"},"breadth_narrowing":{"type":"boolean"},"concentration_warning":{"type":"boolean"}}};
const pattern6 = new RegExp("^(0(\\.[0-9]+)?|1(\\.0+)?)$", "u");
const pattern7 = new RegExp("^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$", "u");

function validate264(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate264.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.display_order === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "display_order"},message:"must have required property '"+"display_order"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.sector_code === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sector_code"},message:"must have required property '"+"sector_code"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.analysis_unit_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.data_status === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_status"},message:"must have required property '"+"data_status"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.trend_stage === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trend_stage"},message:"must have required property '"+"trend_stage"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.relative_strength === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "relative_strength"},message:"must have required property '"+"relative_strength"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.breadth === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "breadth"},message:"must have required property '"+"breadth"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.evidence_flags === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_flags"},message:"must have required property '"+"evidence_flags"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.recommendation === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommendation"},message:"must have required property '"+"recommendation"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.case_status === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "case_status"},message:"must have required property '"+"case_status"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema438.properties, key0))){
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
if(data.display_order !== undefined){
let data0 = data.display_order;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err11 = {instancePath:instancePath+"/display_order",schemaPath:"#/properties/display_order/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 3 || isNaN(data0)){
const err12 = {instancePath:instancePath+"/display_order",schemaPath:"#/properties/display_order/maximum",keyword:"maximum",params:{comparison: "<=", limit: 3},message:"must be <= 3"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data0 < 1 || isNaN(data0)){
const err13 = {instancePath:instancePath+"/display_order",schemaPath:"#/properties/display_order/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.sector_code !== undefined){
let data1 = data.sector_code;
if(!(((data1 === "GLOVE") || (data1 === "KNIFE")) || (data1 === "WEAPON"))){
const err14 = {instancePath:instancePath+"/sector_code",schemaPath:"#/properties/sector_code/enum",keyword:"enum",params:{allowedValues: schema438.properties.sector_code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data2 = data.analysis_unit_id;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err15 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(func2(data2) < 1){
const err16 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern87.test(data2)){
const err17 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err18 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.data_status !== undefined){
let data3 = data.data_status;
if(!((data3 === "COMPLETE") || (data3 === "DEGRADED_OPTIONAL"))){
const err19 = {instancePath:instancePath+"/data_status",schemaPath:"#/$defs/dataStatus/enum",keyword:"enum",params:{allowedValues: schema432.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.trend_stage !== undefined){
let data4 = data.trend_stage;
if(!(((((((data4 === "UP_BUILDING") || (data4 === "UP_ACTIVE")) || (data4 === "UP_COOLING")) || (data4 === "NEUTRAL")) || (data4 === "DOWN_BUILDING")) || (data4 === "DOWN_ACTIVE")) || (data4 === "DOWN_COOLING"))){
const err20 = {instancePath:instancePath+"/trend_stage",schemaPath:"#/$defs/trendStage/enum",keyword:"enum",params:{allowedValues: schema433.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.relative_strength !== undefined){
let data5 = data.relative_strength;
if(!((((data5 === "LEADING") || (data5 === "IN_LINE")) || (data5 === "LAGGING")) || (data5 === "UNKNOWN"))){
const err21 = {instancePath:instancePath+"/relative_strength",schemaPath:"#/properties/relative_strength/enum",keyword:"enum",params:{allowedValues: schema438.properties.relative_strength.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.breadth !== undefined){
let data6 = data.breadth;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.advancing_member_ratio === undefined){
const err22 = {instancePath:instancePath+"/breadth",schemaPath:"#/$defs/breadth/required",keyword:"required",params:{missingProperty: "advancing_member_ratio"},message:"must have required property '"+"advancing_member_ratio"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data6.median_member_return === undefined){
const err23 = {instancePath:instancePath+"/breadth",schemaPath:"#/$defs/breadth/required",keyword:"required",params:{missingProperty: "median_member_return"},message:"must have required property '"+"median_member_return"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data6.breadth_expanding === undefined){
const err24 = {instancePath:instancePath+"/breadth",schemaPath:"#/$defs/breadth/required",keyword:"required",params:{missingProperty: "breadth_expanding"},message:"must have required property '"+"breadth_expanding"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data6.breadth_narrowing === undefined){
const err25 = {instancePath:instancePath+"/breadth",schemaPath:"#/$defs/breadth/required",keyword:"required",params:{missingProperty: "breadth_narrowing"},message:"must have required property '"+"breadth_narrowing"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data6.concentration_warning === undefined){
const err26 = {instancePath:instancePath+"/breadth",schemaPath:"#/$defs/breadth/required",keyword:"required",params:{missingProperty: "concentration_warning"},message:"must have required property '"+"concentration_warning"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
for(const key1 in data6){
if(!(((((key1 === "advancing_member_ratio") || (key1 === "median_member_return")) || (key1 === "breadth_expanding")) || (key1 === "breadth_narrowing")) || (key1 === "concentration_warning"))){
const err27 = {instancePath:instancePath+"/breadth",schemaPath:"#/$defs/breadth/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data6.advancing_member_ratio !== undefined){
let data7 = data6.advancing_member_ratio;
if((typeof data7 !== "string") && (data7 !== null)){
const err28 = {instancePath:instancePath+"/breadth/advancing_member_ratio",schemaPath:"#/$defs/breadth/properties/advancing_member_ratio/type",keyword:"type",params:{type: schema442.properties.advancing_member_ratio.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(typeof data7 === "string"){
if(!pattern6.test(data7)){
const err29 = {instancePath:instancePath+"/breadth/advancing_member_ratio",schemaPath:"#/$defs/breadth/properties/advancing_member_ratio/pattern",keyword:"pattern",params:{pattern: "^(0(\\.[0-9]+)?|1(\\.0+)?)$"},message:"must match pattern \""+"^(0(\\.[0-9]+)?|1(\\.0+)?)$"+"\""};
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
if(data6.median_member_return !== undefined){
let data8 = data6.median_member_return;
if((typeof data8 !== "string") && (data8 !== null)){
const err30 = {instancePath:instancePath+"/breadth/median_member_return",schemaPath:"#/$defs/breadth/properties/median_member_return/type",keyword:"type",params:{type: schema442.properties.median_member_return.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(typeof data8 === "string"){
if(!pattern7.test(data8)){
const err31 = {instancePath:instancePath+"/breadth/median_member_return",schemaPath:"#/$defs/breadth/properties/median_member_return/pattern",keyword:"pattern",params:{pattern: "^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
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
if(data6.breadth_expanding !== undefined){
if(typeof data6.breadth_expanding !== "boolean"){
const err32 = {instancePath:instancePath+"/breadth/breadth_expanding",schemaPath:"#/$defs/breadth/properties/breadth_expanding/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data6.breadth_narrowing !== undefined){
if(typeof data6.breadth_narrowing !== "boolean"){
const err33 = {instancePath:instancePath+"/breadth/breadth_narrowing",schemaPath:"#/$defs/breadth/properties/breadth_narrowing/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data6.concentration_warning !== undefined){
if(typeof data6.concentration_warning !== "boolean"){
const err34 = {instancePath:instancePath+"/breadth/concentration_warning",schemaPath:"#/$defs/breadth/properties/concentration_warning/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
const err35 = {instancePath:instancePath+"/breadth",schemaPath:"#/$defs/breadth/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.evidence_flags !== undefined){
let data12 = data.evidence_flags;
if(Array.isArray(data12)){
const len0 = data12.length;
for(let i0=0; i0<len0; i0++){
let data13 = data12[i0];
if(!(((((((((((data13 === "DEMAND_ACCELERATING") || (data13 === "SUPPLY_CONTRACTING")) || (data13 === "PRICE_RISING")) || (data13 === "SUSPECTED_SWEEPING")) || (data13 === "SWEEPING_CONFIRMED")) || (data13 === "REACCELERATION")) || (data13 === "OVERHEATED")) || (data13 === "SHOCK")) || (data13 === "BREADTH_COLLAPSE")) || (data13 === "LIQUIDITY_CONTRACTION")) || (data13 === "CONCENTRATION_WARNING"))){
const err36 = {instancePath:instancePath+"/evidence_flags/" + i0,schemaPath:"#/$defs/evidenceFlags/items/enum",keyword:"enum",params:{allowedValues: schema434.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
let i1 = data12.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data12[i1], data12[j0])){
const err37 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidenceFlags/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err38 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidenceFlags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.recommendation !== undefined){
let data14 = data.recommendation;
if(!(((((((data14 === "IGNORE") || (data14 === "WATCH")) || (data14 === "RECOMMENDED_CANDIDATE")) || (data14 === "STRONG_CANDIDATE")) || (data14 === "OVERHEATED_DO_NOT_CHASE")) || (data14 === "COOLING_REMOVE_FROM_PRIORITY")) || (data14 === "WITHHELD_DATA_INCOMPLETE"))){
const err39 = {instancePath:instancePath+"/recommendation",schemaPath:"#/$defs/recommendation/enum",keyword:"enum",params:{allowedValues: schema435.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data.case_status !== undefined){
let data15 = data.case_status;
if((typeof data15 !== "string") && (data15 !== null)){
const err40 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/caseStatus/type",keyword:"type",params:{type: schema436.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(!((((((data15 === "ACTIVE") || (data15 === "SUSPENDED")) || (data15 === "RESOLVED")) || (data15 === "UNRESOLVED")) || (data15 === "RETRACTED")) || (data15 === null))){
const err41 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/caseStatus/enum",keyword:"enum",params:{allowedValues: schema436.enum},message:"must be equal to one of the allowed values"};
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
const err42 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
validate264.errors = vErrors;
return errors === 0;
}
validate264.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate263(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate263.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(Array.isArray(data)){
if(data.length > 3){
const err0 = {instancePath,schemaPath:"#/maxItems",keyword:"maxItems",params:{limit: 3},message:"must NOT have more than 3 items"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.length < 3){
const err1 = {instancePath,schemaPath:"#/minItems",keyword:"minItems",params:{limit: 3},message:"must NOT have fewer than 3 items"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
const len0 = data.length;
if(len0 > 0){
let data0 = data[0];
if(!(validate264(data0, {instancePath:instancePath+"/0",parentData:data,parentDataProperty:0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate264.errors : vErrors.concat(validate264.errors);
errors = vErrors.length;
}
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.display_order !== undefined){
if(1 !== data0.display_order){
const err2 = {instancePath:instancePath+"/0/display_order",schemaPath:"#/prefixItems/0/allOf/1/properties/display_order/const",keyword:"const",params:{allowedValue: 1},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data0.sector_code !== undefined){
if("GLOVE" !== data0.sector_code){
const err3 = {instancePath:instancePath+"/0/sector_code",schemaPath:"#/prefixItems/0/allOf/1/properties/sector_code/const",keyword:"const",params:{allowedValue: "GLOVE"},message:"must be equal to constant"};
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
}
if(len0 > 1){
let data3 = data[1];
if(!(validate264(data3, {instancePath:instancePath+"/1",parentData:data,parentDataProperty:1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate264.errors : vErrors.concat(validate264.errors);
errors = vErrors.length;
}
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.display_order !== undefined){
if(2 !== data3.display_order){
const err4 = {instancePath:instancePath+"/1/display_order",schemaPath:"#/prefixItems/1/allOf/1/properties/display_order/const",keyword:"const",params:{allowedValue: 2},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data3.sector_code !== undefined){
if("KNIFE" !== data3.sector_code){
const err5 = {instancePath:instancePath+"/1/sector_code",schemaPath:"#/prefixItems/1/allOf/1/properties/sector_code/const",keyword:"const",params:{allowedValue: "KNIFE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
}
if(len0 > 2){
let data6 = data[2];
if(!(validate264(data6, {instancePath:instancePath+"/2",parentData:data,parentDataProperty:2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate264.errors : vErrors.concat(validate264.errors);
errors = vErrors.length;
}
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.display_order !== undefined){
if(3 !== data6.display_order){
const err6 = {instancePath:instancePath+"/2/display_order",schemaPath:"#/prefixItems/2/allOf/1/properties/display_order/const",keyword:"const",params:{allowedValue: 3},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data6.sector_code !== undefined){
if("WEAPON" !== data6.sector_code){
const err7 = {instancePath:instancePath+"/2/sector_code",schemaPath:"#/prefixItems/2/allOf/1/properties/sector_code/const",keyword:"const",params:{allowedValue: "WEAPON"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
}
const len1 = data.length;
if(!(len1 <= 3)){
const err8 = {instancePath,schemaPath:"#/items",keyword:"items",params:{limit: 3},message:"must NOT have more than 3 items"};
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
const err9 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
validate263.errors = vErrors;
return errors === 0;
}
validate263.evaluated = {"items":true,"dynamicProps":false,"dynamicItems":false};


function validate248(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate248.evaluated;
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
if(data.market === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "market"},message:"must have required property '"+"market"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.sectors === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sectors"},message:"must have required property '"+"sectors"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query")) || (key0 === "publication")) || (key0 === "market")) || (key0 === "sectors"))){
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
if(data.api_contract !== undefined){
if("market-watchlist-public-api" !== data.api_contract){
const err8 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "market-watchlist-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err9 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("MARKET_OVERVIEW" !== data.response_kind){
const err10 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "MARKET_OVERVIEW"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.query !== undefined){
if(!(validate249(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate249.errors : vErrors.concat(validate249.errors);
errors = vErrors.length;
}
}
if(data.publication !== undefined){
if(!(validate253(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate253.errors : vErrors.concat(validate253.errors);
errors = vErrors.length;
}
}
if(data.market !== undefined){
if(!(validate261(data.market, {instancePath:instancePath+"/market",parentData:data,parentDataProperty:"market",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate261.errors : vErrors.concat(validate261.errors);
errors = vErrors.length;
}
}
if(data.sectors !== undefined){
if(!(validate263(data.sectors, {instancePath:instancePath+"/sectors",parentData:data,parentDataProperty:"sectors",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate263.errors : vErrors.concat(validate263.errors);
errors = vErrors.length;
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
validate248.errors = vErrors;
return errors === 0;
}
validate248.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema446 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","members","next_cursor"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"MARKET_HISTORY"},"query":{"$ref":"#/$defs/marketHistoryQuery"},"members":{"type":"array","items":{"$ref":"#/$defs/marketPublicationSummary"}},"next_cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}};
const schema447 = {"type":"object","additionalProperties":false,"required":["as_of","query_known_at","page_size","cursor"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"},"page_size":{"type":"integer","minimum":1,"maximum":32},"cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}};
const pattern73 = new RegExp("^[A-Za-z0-9_-]+$", "u");

function validate271(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate271.evaluated;
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
if(data.query_known_at === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_known_at"},message:"must have required property '"+"query_known_at"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.page_size === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.cursor === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cursor"},message:"must have required property '"+"cursor"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "as_of") || (key0 === "query_known_at")) || (key0 === "page_size")) || (key0 === "cursor"))){
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
if(data.as_of !== undefined){
if(!(validate250(data.as_of, {instancePath:instancePath+"/as_of",parentData:data,parentDataProperty:"as_of",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate250.errors : vErrors.concat(validate250.errors);
errors = vErrors.length;
}
}
if(data.query_known_at !== undefined){
let data1 = data.query_known_at;
if(typeof data1 === "string"){
if(!pattern19.test(data1)){
const err5 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err6 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.page_size !== undefined){
let data2 = data.page_size;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err7 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 32 || isNaN(data2)){
const err8 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 32},message:"must be <= 32"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data2 < 1 || isNaN(data2)){
const err9 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
if(data.cursor !== undefined){
let data3 = data.cursor;
if((typeof data3 !== "string") && (data3 !== null)){
const err10 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/type",keyword:"type",params:{type: schema447.properties.cursor.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(typeof data3 === "string"){
if(func2(data3) > 8192){
const err11 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern73.test(data3)){
const err12 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
validate271.errors = vErrors;
return errors === 0;
}
validate271.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema449 = {"type":"object","additionalProperties":false,"required":["publication","market","sectors"],"properties":{"publication":{"$ref":"#/$defs/publication"},"market":{"$ref":"#/$defs/marketState"},"sectors":{"type":"array","minItems":3,"maxItems":3,"prefixItems":[{"allOf":[{"$ref":"#/$defs/sectorState"},{"properties":{"display_order":{"const":1},"sector_code":{"const":"GLOVE"}}}]},{"allOf":[{"$ref":"#/$defs/sectorState"},{"properties":{"display_order":{"const":2},"sector_code":{"const":"KNIFE"}}}]},{"allOf":[{"$ref":"#/$defs/sectorState"},{"properties":{"display_order":{"const":3},"sector_code":{"const":"WEAPON"}}}]}],"items":false}}};

function validate274(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate274.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.publication === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication"},message:"must have required property '"+"publication"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.market === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "market"},message:"must have required property '"+"market"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.sectors === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sectors"},message:"must have required property '"+"sectors"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "publication") || (key0 === "market")) || (key0 === "sectors"))){
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
if(data.publication !== undefined){
if(!(validate253(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate253.errors : vErrors.concat(validate253.errors);
errors = vErrors.length;
}
}
if(data.market !== undefined){
if(!(validate261(data.market, {instancePath:instancePath+"/market",parentData:data,parentDataProperty:"market",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate261.errors : vErrors.concat(validate261.errors);
errors = vErrors.length;
}
}
if(data.sectors !== undefined){
let data2 = data.sectors;
if(Array.isArray(data2)){
if(data2.length > 3){
const err4 = {instancePath:instancePath+"/sectors",schemaPath:"#/properties/sectors/maxItems",keyword:"maxItems",params:{limit: 3},message:"must NOT have more than 3 items"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data2.length < 3){
const err5 = {instancePath:instancePath+"/sectors",schemaPath:"#/properties/sectors/minItems",keyword:"minItems",params:{limit: 3},message:"must NOT have fewer than 3 items"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const len0 = data2.length;
if(len0 > 0){
let data3 = data2[0];
if(!(validate264(data3, {instancePath:instancePath+"/sectors/0",parentData:data2,parentDataProperty:0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate264.errors : vErrors.concat(validate264.errors);
errors = vErrors.length;
}
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.display_order !== undefined){
if(1 !== data3.display_order){
const err6 = {instancePath:instancePath+"/sectors/0/display_order",schemaPath:"#/properties/sectors/prefixItems/0/allOf/1/properties/display_order/const",keyword:"const",params:{allowedValue: 1},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data3.sector_code !== undefined){
if("GLOVE" !== data3.sector_code){
const err7 = {instancePath:instancePath+"/sectors/0/sector_code",schemaPath:"#/properties/sectors/prefixItems/0/allOf/1/properties/sector_code/const",keyword:"const",params:{allowedValue: "GLOVE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
}
if(len0 > 1){
let data6 = data2[1];
if(!(validate264(data6, {instancePath:instancePath+"/sectors/1",parentData:data2,parentDataProperty:1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate264.errors : vErrors.concat(validate264.errors);
errors = vErrors.length;
}
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.display_order !== undefined){
if(2 !== data6.display_order){
const err8 = {instancePath:instancePath+"/sectors/1/display_order",schemaPath:"#/properties/sectors/prefixItems/1/allOf/1/properties/display_order/const",keyword:"const",params:{allowedValue: 2},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data6.sector_code !== undefined){
if("KNIFE" !== data6.sector_code){
const err9 = {instancePath:instancePath+"/sectors/1/sector_code",schemaPath:"#/properties/sectors/prefixItems/1/allOf/1/properties/sector_code/const",keyword:"const",params:{allowedValue: "KNIFE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
}
if(len0 > 2){
let data9 = data2[2];
if(!(validate264(data9, {instancePath:instancePath+"/sectors/2",parentData:data2,parentDataProperty:2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate264.errors : vErrors.concat(validate264.errors);
errors = vErrors.length;
}
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.display_order !== undefined){
if(3 !== data9.display_order){
const err10 = {instancePath:instancePath+"/sectors/2/display_order",schemaPath:"#/properties/sectors/prefixItems/2/allOf/1/properties/display_order/const",keyword:"const",params:{allowedValue: 3},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data9.sector_code !== undefined){
if("WEAPON" !== data9.sector_code){
const err11 = {instancePath:instancePath+"/sectors/2/sector_code",schemaPath:"#/properties/sectors/prefixItems/2/allOf/1/properties/sector_code/const",keyword:"const",params:{allowedValue: "WEAPON"},message:"must be equal to constant"};
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
}
const len1 = data2.length;
if(!(len1 <= 3)){
const err12 = {instancePath:instancePath+"/sectors",schemaPath:"#/properties/sectors/items",keyword:"items",params:{limit: 3},message:"must NOT have more than 3 items"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
else {
const err13 = {instancePath:instancePath+"/sectors",schemaPath:"#/properties/sectors/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
const err14 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
validate274.errors = vErrors;
return errors === 0;
}
validate274.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate270(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate270.evaluated;
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
if(data.members === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.next_cursor === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query")) || (key0 === "members")) || (key0 === "next_cursor"))){
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
if(data.api_contract !== undefined){
if("market-watchlist-public-api" !== data.api_contract){
const err7 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "market-watchlist-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err8 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("MARKET_HISTORY" !== data.response_kind){
const err9 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "MARKET_HISTORY"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.query !== undefined){
if(!(validate271(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate271.errors : vErrors.concat(validate271.errors);
errors = vErrors.length;
}
}
if(data.members !== undefined){
let data4 = data.members;
if(Array.isArray(data4)){
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate274(data4[i0], {instancePath:instancePath+"/members/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate274.errors : vErrors.concat(validate274.errors);
errors = vErrors.length;
}
}
}
else {
const err10 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data6 = data.next_cursor;
if((typeof data6 !== "string") && (data6 !== null)){
const err11 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/type",keyword:"type",params:{type: schema446.properties.next_cursor.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(typeof data6 === "string"){
if(func2(data6) > 8192){
const err12 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern73.test(data6)){
const err13 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
}
else {
const err14 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
validate270.errors = vErrors;
return errors === 0;
}
validate270.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema450 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","publication","total","members","next_cursor"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"WATCHLIST"},"query":{"$ref":"#/$defs/watchlistQuery"},"publication":{"$ref":"#/$defs/publication"},"total":{"type":"integer","minimum":0,"maximum":500},"members":{"type":"array","items":{"$ref":"#/$defs/watchlistMember"}},"next_cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}};
const schema451 = {"type":"object","additionalProperties":false,"required":["as_of","query_known_at","publication_id","sort","page_size","cursor"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/nullableSha256"},"sort":{"const":"RANK_ASC"},"page_size":{"type":"integer","minimum":1,"maximum":100},"cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}};

function validate283(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate283.evaluated;
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
if(data.query_known_at === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_known_at"},message:"must have required property '"+"query_known_at"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.publication_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication_id"},message:"must have required property '"+"publication_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.sort === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sort"},message:"must have required property '"+"sort"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.page_size === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.cursor === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cursor"},message:"must have required property '"+"cursor"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "as_of") || (key0 === "query_known_at")) || (key0 === "publication_id")) || (key0 === "sort")) || (key0 === "page_size")) || (key0 === "cursor"))){
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
if(!(validate250(data.as_of, {instancePath:instancePath+"/as_of",parentData:data,parentDataProperty:"as_of",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate250.errors : vErrors.concat(validate250.errors);
errors = vErrors.length;
}
}
if(data.query_known_at !== undefined){
let data1 = data.query_known_at;
if(typeof data1 === "string"){
if(!pattern19.test(data1)){
const err7 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err8 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.publication_id !== undefined){
if(!(validate254(data.publication_id, {instancePath:instancePath+"/publication_id",parentData:data,parentDataProperty:"publication_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate254.errors : vErrors.concat(validate254.errors);
errors = vErrors.length;
}
}
if(data.sort !== undefined){
if("RANK_ASC" !== data.sort){
const err9 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/const",keyword:"const",params:{allowedValue: "RANK_ASC"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.page_size !== undefined){
let data4 = data.page_size;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err10 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 100 || isNaN(data4)){
const err11 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data4 < 1 || isNaN(data4)){
const err12 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.cursor !== undefined){
let data5 = data.cursor;
if((typeof data5 !== "string") && (data5 !== null)){
const err13 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/type",keyword:"type",params:{type: schema451.properties.cursor.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(typeof data5 === "string"){
if(func2(data5) > 8192){
const err14 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern73.test(data5)){
const err15 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
}
else {
const err16 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
validate283.errors = vErrors;
return errors === 0;
}
validate283.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema453 = {"type":"object","additionalProperties":false,"required":["rank","tie_break_key","inclusion_reason_codes","result","catalog"],"properties":{"rank":{"type":"integer","minimum":1,"maximum":500},"tie_break_key":{"$ref":"#/$defs/identifier"},"inclusion_reason_codes":{"type":"array","uniqueItems":true,"items":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,63}$"}},"result":{"$ref":"#/$defs/itemState"},"catalog":{"$ref":"#/$defs/catalogProjection"}}};
const pattern252 = new RegExp("^[A-Z][A-Z0-9_]{0,63}$", "u");
const schema455 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","data_status","cycle_stage","evidence_flags","regime_relation","recommendation","case_status","recommendation_detail","evidence_domains","claims"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"data_status":{"$ref":"#/$defs/dataStatus"},"cycle_stage":{"enum":["BASELINE","PRESSURE_BUILDING","CONFIRMED_UP","COOLING"]},"evidence_flags":{"$ref":"#/$defs/evidenceFlags"},"regime_relation":{"type":"array","uniqueItems":true,"items":{"enum":["MARKET_DRIVEN","SECTOR_DRIVEN","ITEM_SPECIFIC","COUNTER_REGIME","IN_LINE","UNKNOWN"]}},"recommendation":{"$ref":"#/$defs/recommendation"},"case_status":{"$ref":"#/$defs/caseStatus"},"recommendation_detail":{"$ref":"#/$defs/recommendationDetail"},"evidence_domains":{"type":"array","minItems":3,"maxItems":3,"items":{"$ref":"#/$defs/evidenceDomain"}},"claims":{"type":"array","uniqueItems":true,"items":{"enum":["UNIFIED_PRICE_RISING","BID_PRICE_RISING","BUY_DEMAND_STRENGTHENING","SELLABLE_SUPPLY_DECLINING","MULTI_SOURCE_ALIGNED","TRUSTED_TRADE_VOLUME_INCREASING","SWEEPING_CONFIRMED"]}}}};
const schema461 = {"type":"object","additionalProperties":false,"required":["recommendation","signal_strength","evidence_coverage","trade_confirmation"],"properties":{"recommendation":{"$ref":"#/$defs/recommendation"},"signal_strength":{"enum":["NONE","WEAK","MODERATE","STRONG"]},"evidence_coverage":{"type":"string","pattern":"^(0(\\.[0-9]+)?|1(\\.0+)?)$"},"trade_confirmation":{"enum":["UNAVAILABLE","AVAILABLE_NOT_CONFIRMED","CONFIRMED"]}}};

function validate290(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate290.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.recommendation === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommendation"},message:"must have required property '"+"recommendation"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.signal_strength === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "signal_strength"},message:"must have required property '"+"signal_strength"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.evidence_coverage === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_coverage"},message:"must have required property '"+"evidence_coverage"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.trade_confirmation === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trade_confirmation"},message:"must have required property '"+"trade_confirmation"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "recommendation") || (key0 === "signal_strength")) || (key0 === "evidence_coverage")) || (key0 === "trade_confirmation"))){
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
if(data.recommendation !== undefined){
let data0 = data.recommendation;
if(!(((((((data0 === "IGNORE") || (data0 === "WATCH")) || (data0 === "RECOMMENDED_CANDIDATE")) || (data0 === "STRONG_CANDIDATE")) || (data0 === "OVERHEATED_DO_NOT_CHASE")) || (data0 === "COOLING_REMOVE_FROM_PRIORITY")) || (data0 === "WITHHELD_DATA_INCOMPLETE"))){
const err5 = {instancePath:instancePath+"/recommendation",schemaPath:"#/$defs/recommendation/enum",keyword:"enum",params:{allowedValues: schema435.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.signal_strength !== undefined){
let data1 = data.signal_strength;
if(!((((data1 === "NONE") || (data1 === "WEAK")) || (data1 === "MODERATE")) || (data1 === "STRONG"))){
const err6 = {instancePath:instancePath+"/signal_strength",schemaPath:"#/properties/signal_strength/enum",keyword:"enum",params:{allowedValues: schema461.properties.signal_strength.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.evidence_coverage !== undefined){
let data2 = data.evidence_coverage;
if(typeof data2 === "string"){
if(!pattern6.test(data2)){
const err7 = {instancePath:instancePath+"/evidence_coverage",schemaPath:"#/properties/evidence_coverage/pattern",keyword:"pattern",params:{pattern: "^(0(\\.[0-9]+)?|1(\\.0+)?)$"},message:"must match pattern \""+"^(0(\\.[0-9]+)?|1(\\.0+)?)$"+"\""};
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
const err8 = {instancePath:instancePath+"/evidence_coverage",schemaPath:"#/properties/evidence_coverage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.trade_confirmation !== undefined){
let data3 = data.trade_confirmation;
if(!(((data3 === "UNAVAILABLE") || (data3 === "AVAILABLE_NOT_CONFIRMED")) || (data3 === "CONFIRMED"))){
const err9 = {instancePath:instancePath+"/trade_confirmation",schemaPath:"#/properties/trade_confirmation/enum",keyword:"enum",params:{allowedValues: schema461.properties.trade_confirmation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate290.errors = vErrors;
return errors === 0;
}
validate290.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema463 = {"type":"object","additionalProperties":false,"required":["domain","strength","contributing_feature_keys","missing_reason"],"properties":{"domain":{"enum":["P","D","S"]},"strength":{"enum":["UNAVAILABLE","CONFLICTED","ABSENT","WEAK","MODERATE","STRONG"]},"contributing_feature_keys":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/identifier"}},"missing_reason":{"type":["string","null"],"enum":["UNAVAILABLE_BY_DESIGN","OPTIONAL_DATA_UNAVAILABLE","DATA_UNAVAILABLE_RUNTIME_GRACE","DATA_UNAVAILABLE_RUNTIME","STALE_GRACE","STALE","CONFLICTED_INPUTS",null]}}};

function validate292(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate292.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.domain === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "domain"},message:"must have required property '"+"domain"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.strength === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "strength"},message:"must have required property '"+"strength"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.contributing_feature_keys === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contributing_feature_keys"},message:"must have required property '"+"contributing_feature_keys"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.missing_reason === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "missing_reason"},message:"must have required property '"+"missing_reason"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "domain") || (key0 === "strength")) || (key0 === "contributing_feature_keys")) || (key0 === "missing_reason"))){
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
if(data.domain !== undefined){
let data0 = data.domain;
if(!(((data0 === "P") || (data0 === "D")) || (data0 === "S"))){
const err5 = {instancePath:instancePath+"/domain",schemaPath:"#/properties/domain/enum",keyword:"enum",params:{allowedValues: schema463.properties.domain.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.strength !== undefined){
let data1 = data.strength;
if(!((((((data1 === "UNAVAILABLE") || (data1 === "CONFLICTED")) || (data1 === "ABSENT")) || (data1 === "WEAK")) || (data1 === "MODERATE")) || (data1 === "STRONG"))){
const err6 = {instancePath:instancePath+"/strength",schemaPath:"#/properties/strength/enum",keyword:"enum",params:{allowedValues: schema463.properties.strength.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.contributing_feature_keys !== undefined){
let data2 = data.contributing_feature_keys;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(typeof data3 === "string"){
if(func2(data3) > 256){
const err7 = {instancePath:instancePath+"/contributing_feature_keys/" + i0,schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func2(data3) < 1){
const err8 = {instancePath:instancePath+"/contributing_feature_keys/" + i0,schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern87.test(data3)){
const err9 = {instancePath:instancePath+"/contributing_feature_keys/" + i0,schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err10 = {instancePath:instancePath+"/contributing_feature_keys/" + i0,schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
let i1 = data2.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data2[i1], data2[j0])){
const err11 = {instancePath:instancePath+"/contributing_feature_keys",schemaPath:"#/properties/contributing_feature_keys/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err12 = {instancePath:instancePath+"/contributing_feature_keys",schemaPath:"#/properties/contributing_feature_keys/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.missing_reason !== undefined){
let data4 = data.missing_reason;
if((typeof data4 !== "string") && (data4 !== null)){
const err13 = {instancePath:instancePath+"/missing_reason",schemaPath:"#/properties/missing_reason/type",keyword:"type",params:{type: schema463.properties.missing_reason.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!((((((((data4 === "UNAVAILABLE_BY_DESIGN") || (data4 === "OPTIONAL_DATA_UNAVAILABLE")) || (data4 === "DATA_UNAVAILABLE_RUNTIME_GRACE")) || (data4 === "DATA_UNAVAILABLE_RUNTIME")) || (data4 === "STALE_GRACE")) || (data4 === "STALE")) || (data4 === "CONFLICTED_INPUTS")) || (data4 === null))){
const err14 = {instancePath:instancePath+"/missing_reason",schemaPath:"#/properties/missing_reason/enum",keyword:"enum",params:{allowedValues: schema463.properties.missing_reason.enum},message:"must be equal to one of the allowed values"};
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
validate292.errors = vErrors;
return errors === 0;
}
validate292.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate289(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate289.evaluated;
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
if(data.data_status === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_status"},message:"must have required property '"+"data_status"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.cycle_stage === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cycle_stage"},message:"must have required property '"+"cycle_stage"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.evidence_flags === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_flags"},message:"must have required property '"+"evidence_flags"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.regime_relation === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "regime_relation"},message:"must have required property '"+"regime_relation"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.recommendation === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommendation"},message:"must have required property '"+"recommendation"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.case_status === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "case_status"},message:"must have required property '"+"case_status"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.recommendation_detail === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommendation_detail"},message:"must have required property '"+"recommendation_detail"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.evidence_domains === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_domains"},message:"must have required property '"+"evidence_domains"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.claims === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "claims"},message:"must have required property '"+"claims"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema455.properties, key0))){
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
if(func2(data0) > 256){
const err11 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
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
if(data.data_status !== undefined){
let data1 = data.data_status;
if(!((data1 === "COMPLETE") || (data1 === "DEGRADED_OPTIONAL"))){
const err15 = {instancePath:instancePath+"/data_status",schemaPath:"#/$defs/dataStatus/enum",keyword:"enum",params:{allowedValues: schema432.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.cycle_stage !== undefined){
let data2 = data.cycle_stage;
if(!((((data2 === "BASELINE") || (data2 === "PRESSURE_BUILDING")) || (data2 === "CONFIRMED_UP")) || (data2 === "COOLING"))){
const err16 = {instancePath:instancePath+"/cycle_stage",schemaPath:"#/properties/cycle_stage/enum",keyword:"enum",params:{allowedValues: schema455.properties.cycle_stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.evidence_flags !== undefined){
let data3 = data.evidence_flags;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(!(((((((((((data4 === "DEMAND_ACCELERATING") || (data4 === "SUPPLY_CONTRACTING")) || (data4 === "PRICE_RISING")) || (data4 === "SUSPECTED_SWEEPING")) || (data4 === "SWEEPING_CONFIRMED")) || (data4 === "REACCELERATION")) || (data4 === "OVERHEATED")) || (data4 === "SHOCK")) || (data4 === "BREADTH_COLLAPSE")) || (data4 === "LIQUIDITY_CONTRACTION")) || (data4 === "CONCENTRATION_WARNING"))){
const err17 = {instancePath:instancePath+"/evidence_flags/" + i0,schemaPath:"#/$defs/evidenceFlags/items/enum",keyword:"enum",params:{allowedValues: schema434.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
let i1 = data3.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data3[i1], data3[j0])){
const err18 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidenceFlags/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
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
const err19 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidenceFlags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.regime_relation !== undefined){
let data5 = data.regime_relation;
if(Array.isArray(data5)){
const len1 = data5.length;
for(let i2=0; i2<len1; i2++){
let data6 = data5[i2];
if(!((((((data6 === "MARKET_DRIVEN") || (data6 === "SECTOR_DRIVEN")) || (data6 === "ITEM_SPECIFIC")) || (data6 === "COUNTER_REGIME")) || (data6 === "IN_LINE")) || (data6 === "UNKNOWN"))){
const err20 = {instancePath:instancePath+"/regime_relation/" + i2,schemaPath:"#/properties/regime_relation/items/enum",keyword:"enum",params:{allowedValues: schema455.properties.regime_relation.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
let i3 = data5.length;
let j1;
if(i3 > 1){
outer1:
for(;i3--;){
for(j1 = i3; j1--;){
if(func0(data5[i3], data5[j1])){
const err21 = {instancePath:instancePath+"/regime_relation",schemaPath:"#/properties/regime_relation/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err22 = {instancePath:instancePath+"/regime_relation",schemaPath:"#/properties/regime_relation/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.recommendation !== undefined){
let data7 = data.recommendation;
if(!(((((((data7 === "IGNORE") || (data7 === "WATCH")) || (data7 === "RECOMMENDED_CANDIDATE")) || (data7 === "STRONG_CANDIDATE")) || (data7 === "OVERHEATED_DO_NOT_CHASE")) || (data7 === "COOLING_REMOVE_FROM_PRIORITY")) || (data7 === "WITHHELD_DATA_INCOMPLETE"))){
const err23 = {instancePath:instancePath+"/recommendation",schemaPath:"#/$defs/recommendation/enum",keyword:"enum",params:{allowedValues: schema435.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.case_status !== undefined){
let data8 = data.case_status;
if((typeof data8 !== "string") && (data8 !== null)){
const err24 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/caseStatus/type",keyword:"type",params:{type: schema436.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!((((((data8 === "ACTIVE") || (data8 === "SUSPENDED")) || (data8 === "RESOLVED")) || (data8 === "UNRESOLVED")) || (data8 === "RETRACTED")) || (data8 === null))){
const err25 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/caseStatus/enum",keyword:"enum",params:{allowedValues: schema436.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.recommendation_detail !== undefined){
if(!(validate290(data.recommendation_detail, {instancePath:instancePath+"/recommendation_detail",parentData:data,parentDataProperty:"recommendation_detail",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate290.errors : vErrors.concat(validate290.errors);
errors = vErrors.length;
}
}
if(data.evidence_domains !== undefined){
let data10 = data.evidence_domains;
if(Array.isArray(data10)){
if(data10.length > 3){
const err26 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/properties/evidence_domains/maxItems",keyword:"maxItems",params:{limit: 3},message:"must NOT have more than 3 items"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data10.length < 3){
const err27 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/properties/evidence_domains/minItems",keyword:"minItems",params:{limit: 3},message:"must NOT have fewer than 3 items"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
const len2 = data10.length;
for(let i4=0; i4<len2; i4++){
if(!(validate292(data10[i4], {instancePath:instancePath+"/evidence_domains/" + i4,parentData:data10,parentDataProperty:i4,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate292.errors : vErrors.concat(validate292.errors);
errors = vErrors.length;
}
}
}
else {
const err28 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/properties/evidence_domains/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.claims !== undefined){
let data12 = data.claims;
if(Array.isArray(data12)){
const len3 = data12.length;
for(let i5=0; i5<len3; i5++){
let data13 = data12[i5];
if(!(((((((data13 === "UNIFIED_PRICE_RISING") || (data13 === "BID_PRICE_RISING")) || (data13 === "BUY_DEMAND_STRENGTHENING")) || (data13 === "SELLABLE_SUPPLY_DECLINING")) || (data13 === "MULTI_SOURCE_ALIGNED")) || (data13 === "TRUSTED_TRADE_VOLUME_INCREASING")) || (data13 === "SWEEPING_CONFIRMED"))){
const err29 = {instancePath:instancePath+"/claims/" + i5,schemaPath:"#/properties/claims/items/enum",keyword:"enum",params:{allowedValues: schema455.properties.claims.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
let i6 = data12.length;
let j2;
if(i6 > 1){
outer2:
for(;i6--;){
for(j2 = i6; j2--;){
if(func0(data12[i6], data12[j2])){
const err30 = {instancePath:instancePath+"/claims",schemaPath:"#/properties/claims/uniqueItems",keyword:"uniqueItems",params:{i: i6, j: j2},message:"must NOT have duplicate items (items ## "+j2+" and "+i6+" are identical)"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
break outer2;
}
}
}
}
}
else {
const err31 = {instancePath:instancePath+"/claims",schemaPath:"#/properties/claims/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
const err32 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
validate289.errors = vErrors;
return errors === 0;
}
validate289.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema465 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","parent_analysis_unit_id","analysis_unit_kind","item_kind","base_item_code","edition_kind","wear_tier","localized_name","media","catalog_version"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"base_item_code":{"$ref":"#/$defs/identifier"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/catalogLocalizedName"},"media":{"$ref":"#/$defs/catalogMedia"},"catalog_version":{"type":"string","minLength":1,"maxLength":128,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"}}};
const schema469 = {"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"zh_cn":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"}}};
const schema470 = {"oneOf":[{"$ref":"#/$defs/catalogMediaNotProduced"},{"$ref":"#/$defs/catalogMediaBound"}]};
const schema471 = {"type":"object","additionalProperties":false,"required":["status"],"properties":{"status":{"const":"NOT_PRODUCED"}}};
const schema472 = {"type":"object","additionalProperties":false,"required":["status","media_asset_version_id","media_key","presentation_kind"],"properties":{"status":{"const":"BOUND"},"media_asset_version_id":{"$ref":"#/$defs/versionId"},"media_key":{"type":"string","maxLength":256,"pattern":"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$","not":{"pattern":"(^|/)\\.{1,2}(/|$)"}},"presentation_kind":{"enum":["SERIES_REPRESENTATIVE","STYLE_REPRESENTATIVE"]}}};
const schema473 = {"type":"string","pattern":"^[1-9][0-9]*$"};
const pattern97 = new RegExp("^[1-9][0-9]*$", "u");
const pattern94 = new RegExp("(^|/)\\.{1,2}(/|$)", "u");
const pattern95 = new RegExp("^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$", "u");

function validate297(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate297.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.media_asset_version_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_asset_version_id"},message:"must have required property '"+"media_asset_version_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.media_key === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_key"},message:"must have required property '"+"media_key"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.presentation_kind === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "presentation_kind"},message:"must have required property '"+"presentation_kind"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "status") || (key0 === "media_asset_version_id")) || (key0 === "media_key")) || (key0 === "presentation_kind"))){
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
if(data.status !== undefined){
if("BOUND" !== data.status){
const err5 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "BOUND"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.media_asset_version_id !== undefined){
let data1 = data.media_asset_version_id;
if(typeof data1 === "string"){
if(!pattern97.test(data1)){
const err6 = {instancePath:instancePath+"/media_asset_version_id",schemaPath:"#/$defs/versionId/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]*$"},message:"must match pattern \""+"^[1-9][0-9]*$"+"\""};
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
const err7 = {instancePath:instancePath+"/media_asset_version_id",schemaPath:"#/$defs/versionId/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data2 = data.media_key;
const _errs8 = errors;
const _errs9 = errors;
if(typeof data2 === "string"){
if(!pattern94.test(data2)){
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
var valid2 = _errs9 === errors;
if(valid2){
const err9 = {instancePath:instancePath+"/media_key",schemaPath:"#/properties/media_key/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
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
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err10 = {instancePath:instancePath+"/media_key",schemaPath:"#/properties/media_key/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern95.test(data2)){
const err11 = {instancePath:instancePath+"/media_key",schemaPath:"#/properties/media_key/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$"},message:"must match pattern \""+"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$"+"\""};
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
const err12 = {instancePath:instancePath+"/media_key",schemaPath:"#/properties/media_key/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data3 = data.presentation_kind;
if(!((data3 === "SERIES_REPRESENTATIVE") || (data3 === "STYLE_REPRESENTATIVE"))){
const err13 = {instancePath:instancePath+"/presentation_kind",schemaPath:"#/properties/presentation_kind/enum",keyword:"enum",params:{allowedValues: schema472.properties.presentation_kind.enum},message:"must be equal to one of the allowed values"};
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
const err14 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
validate297.errors = vErrors;
return errors === 0;
}
validate297.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate296(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate296.evaluated;
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
const err0 = {instancePath,schemaPath:"#/$defs/catalogMediaNotProduced/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
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
const err1 = {instancePath,schemaPath:"#/$defs/catalogMediaNotProduced/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
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
const err2 = {instancePath:instancePath+"/status",schemaPath:"#/$defs/catalogMediaNotProduced/properties/status/const",keyword:"const",params:{allowedValue: "NOT_PRODUCED"},message:"must be equal to constant"};
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
const err3 = {instancePath,schemaPath:"#/$defs/catalogMediaNotProduced/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
if(!(validate297(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
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
const err4 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
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
validate296.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate296.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate295(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate295.evaluated;
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
if(!(func9.call(schema465.properties, key0))){
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
if(func2(data0) > 256){
const err11 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
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
if(func2(data1) > 256){
const err15 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
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
const err21 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema465.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
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
const err22 = {instancePath:instancePath+"/item_kind",schemaPath:"#/properties/item_kind/enum",keyword:"enum",params:{allowedValues: schema465.properties.item_kind.enum},message:"must be equal to one of the allowed values"};
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
if(func2(data4) > 256){
const err23 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
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
const err27 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema465.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
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
const err28 = {instancePath:instancePath+"/wear_tier",schemaPath:"#/properties/wear_tier/enum",keyword:"enum",params:{allowedValues: schema465.properties.wear_tier.enum},message:"must be equal to one of the allowed values"};
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
let data7 = data.localized_name;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.en === undefined){
const err29 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/catalogLocalizedName/required",keyword:"required",params:{missingProperty: "en"},message:"must have required property '"+"en"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data7.zh_cn === undefined){
const err30 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/catalogLocalizedName/required",keyword:"required",params:{missingProperty: "zh_cn"},message:"must have required property '"+"zh_cn"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
for(const key1 in data7){
if(!((key1 === "en") || (key1 === "zh_cn"))){
const err31 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/catalogLocalizedName/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data7.en !== undefined){
let data8 = data7.en;
if(typeof data8 === "string"){
if(func2(data8) > 512){
const err32 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/catalogLocalizedName/properties/en/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(func2(data8) < 1){
const err33 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/catalogLocalizedName/properties/en/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(!pattern87.test(data8)){
const err34 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/catalogLocalizedName/properties/en/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err35 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/catalogLocalizedName/properties/en/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data7.zh_cn !== undefined){
let data9 = data7.zh_cn;
if(typeof data9 === "string"){
if(func2(data9) > 512){
const err36 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/catalogLocalizedName/properties/zh_cn/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(func2(data9) < 1){
const err37 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/catalogLocalizedName/properties/zh_cn/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(!pattern87.test(data9)){
const err38 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/catalogLocalizedName/properties/zh_cn/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
else {
const err39 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/catalogLocalizedName/properties/zh_cn/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
}
else {
const err40 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/catalogLocalizedName/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.media !== undefined){
if(!(validate296(data.media, {instancePath:instancePath+"/media",parentData:data,parentDataProperty:"media",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate296.errors : vErrors.concat(validate296.errors);
errors = vErrors.length;
}
}
if(data.catalog_version !== undefined){
let data11 = data.catalog_version;
if(typeof data11 === "string"){
if(func2(data11) > 128){
const err41 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(func2(data11) < 1){
const err42 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(!pattern87.test(data11)){
const err43 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err44 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate295.errors = vErrors;
return errors === 0;
}
validate295.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate288(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate288.evaluated;
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
if(data.inclusion_reason_codes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "inclusion_reason_codes"},message:"must have required property '"+"inclusion_reason_codes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.result === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "result"},message:"must have required property '"+"result"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.catalog === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog"},message:"must have required property '"+"catalog"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "rank") || (key0 === "tie_break_key")) || (key0 === "inclusion_reason_codes")) || (key0 === "result")) || (key0 === "catalog"))){
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
if(data.rank !== undefined){
let data0 = data.rank;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err6 = {instancePath:instancePath+"/rank",schemaPath:"#/properties/rank/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 500 || isNaN(data0)){
const err7 = {instancePath:instancePath+"/rank",schemaPath:"#/properties/rank/maximum",keyword:"maximum",params:{comparison: "<=", limit: 500},message:"must be <= 500"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data0 < 1 || isNaN(data0)){
const err8 = {instancePath:instancePath+"/rank",schemaPath:"#/properties/rank/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
if(data.tie_break_key !== undefined){
let data1 = data.tie_break_key;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err9 = {instancePath:instancePath+"/tie_break_key",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(func2(data1) < 1){
const err10 = {instancePath:instancePath+"/tie_break_key",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern87.test(data1)){
const err11 = {instancePath:instancePath+"/tie_break_key",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err12 = {instancePath:instancePath+"/tie_break_key",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.inclusion_reason_codes !== undefined){
let data2 = data.inclusion_reason_codes;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(typeof data3 === "string"){
if(!pattern252.test(data3)){
const err13 = {instancePath:instancePath+"/inclusion_reason_codes/" + i0,schemaPath:"#/properties/inclusion_reason_codes/items/pattern",keyword:"pattern",params:{pattern: "^[A-Z][A-Z0-9_]{0,63}$"},message:"must match pattern \""+"^[A-Z][A-Z0-9_]{0,63}$"+"\""};
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
const err14 = {instancePath:instancePath+"/inclusion_reason_codes/" + i0,schemaPath:"#/properties/inclusion_reason_codes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
let i1 = data2.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data2[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err15 = {instancePath:instancePath+"/inclusion_reason_codes",schemaPath:"#/properties/inclusion_reason_codes/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err16 = {instancePath:instancePath+"/inclusion_reason_codes",schemaPath:"#/properties/inclusion_reason_codes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.result !== undefined){
if(!(validate289(data.result, {instancePath:instancePath+"/result",parentData:data,parentDataProperty:"result",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate289.errors : vErrors.concat(validate289.errors);
errors = vErrors.length;
}
}
if(data.catalog !== undefined){
if(!(validate295(data.catalog, {instancePath:instancePath+"/catalog",parentData:data,parentDataProperty:"catalog",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate295.errors : vErrors.concat(validate295.errors);
errors = vErrors.length;
}
}
}
else {
const err17 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
validate288.errors = vErrors;
return errors === 0;
}
validate288.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate282(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate282.evaluated;
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
if("market-watchlist-public-api" !== data.api_contract){
const err9 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "market-watchlist-public-api"},message:"must be equal to constant"};
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
if("v1" !== data.api_version){
const err10 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
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
if("WATCHLIST" !== data.response_kind){
const err11 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "WATCHLIST"},message:"must be equal to constant"};
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
if(!(validate283(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate283.errors : vErrors.concat(validate283.errors);
errors = vErrors.length;
}
}
if(data.publication !== undefined){
if(!(validate253(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate253.errors : vErrors.concat(validate253.errors);
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
if(data5 > 500 || isNaN(data5)){
const err13 = {instancePath:instancePath+"/total",schemaPath:"#/properties/total/maximum",keyword:"maximum",params:{comparison: "<=", limit: 500},message:"must be <= 500"};
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
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
if(!(validate288(data6[i0], {instancePath:instancePath+"/members/" + i0,parentData:data6,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate288.errors : vErrors.concat(validate288.errors);
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
let data8 = data.next_cursor;
if((typeof data8 !== "string") && (data8 !== null)){
const err16 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/type",keyword:"type",params:{type: schema450.properties.next_cursor.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(typeof data8 === "string"){
if(func2(data8) > 8192){
const err17 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!pattern73.test(data8)){
const err18 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
}
else {
const err19 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
validate282.errors = vErrors;
return errors === 0;
}
validate282.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema474 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","publication","member"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"WATCHLIST_DETAIL"},"query":{"$ref":"#/$defs/detailQuery"},"publication":{"$ref":"#/$defs/publication"},"member":{"$ref":"#/$defs/watchlistMember"}}};
const schema475 = {"type":"object","additionalProperties":false,"required":["as_of","query_known_at","publication_id","analysis_unit_id"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"}}};

function validate304(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate304.evaluated;
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
if(data.query_known_at === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_known_at"},message:"must have required property '"+"query_known_at"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.publication_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication_id"},message:"must have required property '"+"publication_id"+"'"};
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
for(const key0 in data){
if(!((((key0 === "as_of") || (key0 === "query_known_at")) || (key0 === "publication_id")) || (key0 === "analysis_unit_id"))){
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
if(data.as_of !== undefined){
if(!(validate250(data.as_of, {instancePath:instancePath+"/as_of",parentData:data,parentDataProperty:"as_of",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate250.errors : vErrors.concat(validate250.errors);
errors = vErrors.length;
}
}
if(data.query_known_at !== undefined){
let data1 = data.query_known_at;
if(typeof data1 === "string"){
if(!pattern19.test(data1)){
const err5 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err6 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.publication_id !== undefined){
let data2 = data.publication_id;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err7 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data3 = data.analysis_unit_id;
if(typeof data3 === "string"){
if(func2(data3) > 256){
const err9 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(func2(data3) < 1){
const err10 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern87.test(data3)){
const err11 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err12 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate304.errors = vErrors;
return errors === 0;
}
validate304.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate303(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate303.evaluated;
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
if(data.member === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member"},message:"must have required property '"+"member"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query")) || (key0 === "publication")) || (key0 === "member"))){
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
if(data.api_contract !== undefined){
if("market-watchlist-public-api" !== data.api_contract){
const err7 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "market-watchlist-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err8 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("WATCHLIST_DETAIL" !== data.response_kind){
const err9 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "WATCHLIST_DETAIL"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.query !== undefined){
if(!(validate304(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate304.errors : vErrors.concat(validate304.errors);
errors = vErrors.length;
}
}
if(data.publication !== undefined){
if(!(validate253(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate253.errors : vErrors.concat(validate253.errors);
errors = vErrors.length;
}
}
if(data.member !== undefined){
if(!(validate288(data.member, {instancePath:instancePath+"/member",parentData:data,parentDataProperty:"member",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate288.errors : vErrors.concat(validate288.errors);
errors = vErrors.length;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate303.errors = vErrors;
return errors === 0;
}
validate303.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema479 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","members","next_cursor"],"properties":{"api_contract":{"const":"market-watchlist-public-api"},"api_version":{"const":"v1"},"response_kind":{"const":"WATCHLIST_HISTORY"},"query":{"$ref":"#/$defs/watchlistHistoryQuery"},"members":{"type":"array","items":{"$ref":"#/$defs/watchlistHistoryMember"}},"next_cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}};
const schema480 = {"type":"object","additionalProperties":false,"required":["query_known_at","publication_id","analysis_unit_id","page_size","cursor"],"properties":{"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"page_size":{"type":"integer","minimum":1,"maximum":50},"cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}};

function validate311(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate311.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.query_known_at === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_known_at"},message:"must have required property '"+"query_known_at"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.publication_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication_id"},message:"must have required property '"+"publication_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.analysis_unit_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
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
if(data.cursor === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cursor"},message:"must have required property '"+"cursor"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "query_known_at") || (key0 === "publication_id")) || (key0 === "analysis_unit_id")) || (key0 === "page_size")) || (key0 === "cursor"))){
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
if(data.query_known_at !== undefined){
let data0 = data.query_known_at;
if(typeof data0 === "string"){
if(!pattern19.test(data0)){
const err6 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err7 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.publication_id !== undefined){
let data1 = data.publication_id;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err8 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err9 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data2 = data.analysis_unit_id;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err10 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func2(data2) < 1){
const err11 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern87.test(data2)){
const err12 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
else {
const err13 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.page_size !== undefined){
let data3 = data.page_size;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err14 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 50 || isNaN(data3)){
const err15 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 50},message:"must be <= 50"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data3 < 1 || isNaN(data3)){
const err16 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.cursor !== undefined){
let data4 = data.cursor;
if((typeof data4 !== "string") && (data4 !== null)){
const err17 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/type",keyword:"type",params:{type: schema480.properties.cursor.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(typeof data4 === "string"){
if(func2(data4) > 8192){
const err18 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!pattern73.test(data4)){
const err19 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
validate311.errors = vErrors;
return errors === 0;
}
validate311.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema484 = {"type":"object","additionalProperties":false,"required":["publication","rank","inclusion_reason_codes","result"],"properties":{"publication":{"$ref":"#/$defs/publication"},"rank":{"type":"integer","minimum":1,"maximum":500},"inclusion_reason_codes":{"type":"array","uniqueItems":true,"items":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,63}$"}},"result":{"$ref":"#/$defs/itemState"}}};

function validate313(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate313.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.publication === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication"},message:"must have required property '"+"publication"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.rank === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rank"},message:"must have required property '"+"rank"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.inclusion_reason_codes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "inclusion_reason_codes"},message:"must have required property '"+"inclusion_reason_codes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.result === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "result"},message:"must have required property '"+"result"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "publication") || (key0 === "rank")) || (key0 === "inclusion_reason_codes")) || (key0 === "result"))){
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
if(data.publication !== undefined){
if(!(validate253(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate253.errors : vErrors.concat(validate253.errors);
errors = vErrors.length;
}
}
if(data.rank !== undefined){
let data1 = data.rank;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err5 = {instancePath:instancePath+"/rank",schemaPath:"#/properties/rank/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 500 || isNaN(data1)){
const err6 = {instancePath:instancePath+"/rank",schemaPath:"#/properties/rank/maximum",keyword:"maximum",params:{comparison: "<=", limit: 500},message:"must be <= 500"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data1 < 1 || isNaN(data1)){
const err7 = {instancePath:instancePath+"/rank",schemaPath:"#/properties/rank/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
if(data.inclusion_reason_codes !== undefined){
let data2 = data.inclusion_reason_codes;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(typeof data3 === "string"){
if(!pattern252.test(data3)){
const err8 = {instancePath:instancePath+"/inclusion_reason_codes/" + i0,schemaPath:"#/properties/inclusion_reason_codes/items/pattern",keyword:"pattern",params:{pattern: "^[A-Z][A-Z0-9_]{0,63}$"},message:"must match pattern \""+"^[A-Z][A-Z0-9_]{0,63}$"+"\""};
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
const err9 = {instancePath:instancePath+"/inclusion_reason_codes/" + i0,schemaPath:"#/properties/inclusion_reason_codes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
let i1 = data2.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data2[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err10 = {instancePath:instancePath+"/inclusion_reason_codes",schemaPath:"#/properties/inclusion_reason_codes/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err11 = {instancePath:instancePath+"/inclusion_reason_codes",schemaPath:"#/properties/inclusion_reason_codes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.result !== undefined){
if(!(validate289(data.result, {instancePath:instancePath+"/result",parentData:data,parentDataProperty:"result",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate289.errors : vErrors.concat(validate289.errors);
errors = vErrors.length;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate313.errors = vErrors;
return errors === 0;
}
validate313.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate310(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate310.evaluated;
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
if(data.members === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.next_cursor === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query")) || (key0 === "members")) || (key0 === "next_cursor"))){
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
if(data.api_contract !== undefined){
if("market-watchlist-public-api" !== data.api_contract){
const err7 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "market-watchlist-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err8 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("WATCHLIST_HISTORY" !== data.response_kind){
const err9 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "WATCHLIST_HISTORY"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.query !== undefined){
if(!(validate311(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate311.errors : vErrors.concat(validate311.errors);
errors = vErrors.length;
}
}
if(data.members !== undefined){
let data4 = data.members;
if(Array.isArray(data4)){
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate313(data4[i0], {instancePath:instancePath+"/members/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate313.errors : vErrors.concat(validate313.errors);
errors = vErrors.length;
}
}
}
else {
const err10 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data6 = data.next_cursor;
if((typeof data6 !== "string") && (data6 !== null)){
const err11 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/type",keyword:"type",params:{type: schema479.properties.next_cursor.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(typeof data6 === "string"){
if(func2(data6) > 8192){
const err12 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern73.test(data6)){
const err13 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
}
else {
const err14 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
validate310.errors = vErrors;
return errors === 0;
}
validate310.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate247(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:market-watchlist-public-api:v1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate247.evaluated;
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
if(!(validate248(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate248.errors : vErrors.concat(validate248.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate270(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate270.errors : vErrors.concat(validate270.errors);
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
if(!(validate282(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate282.errors : vErrors.concat(validate282.errors);
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
if(!(validate303(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate303.errors : vErrors.concat(validate303.errors);
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
if(!(validate310(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate310.errors : vErrors.concat(validate310.errors);
errors = vErrors.length;
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
const _errs6 = errors;
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
if("market-watchlist-public-api" !== data.api_contract){
const err5 = {instancePath:instancePath+"/api_contract",schemaPath:"#/$defs/errorResponse/properties/api_contract/const",keyword:"const",params:{allowedValue: "market-watchlist-public-api"},message:"must be equal to constant"};
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
if(!((((((((data4 === "INVALID_ARGUMENT") || (data4 === "INVALID_CURSOR")) || (data4 === "NOT_PUBLISHED")) || (data4 === "NOT_FOUND")) || (data4 === "BACKEND_UNAVAILABLE")) || (data4 === "PUBLICATION_EXPIRED")) || (data4 === "PUBLICATION_WITHDRAWN")) || (data4 === "RESULT_CORRUPT"))){
const err11 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/properties/code/enum",keyword:"enum",params:{allowedValues: schema485.properties.error.properties.code.enum},message:"must be equal to one of the allowed values"};
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
var _valid0 = _errs6 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid0 = true;
passing0 = 5;
if(props0 !== true){
props0 = true;
}
}
}
}
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
validate247.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate247.evaluated = {"dynamicProps":true,"dynamicItems":false};
