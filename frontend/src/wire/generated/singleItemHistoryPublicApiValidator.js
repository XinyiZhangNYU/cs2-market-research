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
export const validateSingleItemHistoryPublicApiResponse = validate516;
const schema899 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:single-item-history-public-api:v1","title":"Bounded retrospective single-item history projection V1","oneOf":[{"$ref":"#/$defs/success"},{"$ref":"#/$defs/error"}],"$defs":{"sha":{"type":"string","pattern":"^[0-9a-f]{64}$"},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"date":{"type":"string","format":"date"},"timestamp":{"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},"decimal":{"type":"string","pattern":"^(0|[1-9][0-9]*)(\\.[0-9]+)?$"},"snapshot":{"type":"object","additionalProperties":false,"required":["source_contract","source_manifest_sha256","source_family_events_sha256","catalog_snapshot_id","input_event_count","history_observed_through","imported_at"],"properties":{"source_contract":{"const":"single-item-history-family-relation/2.4"},"source_manifest_sha256":{"$ref":"#/$defs/sha"},"source_family_events_sha256":{"$ref":"#/$defs/sha"},"catalog_snapshot_id":{"$ref":"#/$defs/sha"},"input_event_count":{"type":"integer","minimum":0,"maximum":100000},"history_observed_through":{"$ref":"#/$defs/date"},"imported_at":{"$ref":"#/$defs/timestamp"}}},"release":{"type":"object","additionalProperties":false,"required":["release_id","algorithm_version","causal_kernel_version","source_generator_commit","accepted_verifier_commit","version_contract_sha256","scope","source_event_count","public_event_count","manipulation_labels_enabled"],"properties":{"release_id":{"$ref":"#/$defs/sha"},"algorithm_version":{"const":"single-item-history-reconstruction/2.4"},"causal_kernel_version":{"const":"single-item-causal-kernel/2.4"},"source_generator_commit":{"$ref":"#/$defs/commit"},"accepted_verifier_commit":{"$ref":"#/$defs/commit"},"version_contract_sha256":{"$ref":"#/$defs/sha"},"display_episode_contract":{"const":"single-item-history-display-episode/2"},"display_episode_policy_sha256":{"$ref":"#/$defs/sha"},"display_episode_lineage_sha256":{"$ref":"#/$defs/sha"},"scope":{"const":"HISTORICAL_ANOMALY_CYCLES"},"source_event_count":{"type":"integer","minimum":0,"maximum":100000},"public_event_count":{"type":"integer","minimum":0,"maximum":100000},"manipulation_labels_enabled":{"const":false}},"dependentRequired":{"display_episode_contract":["display_episode_policy_sha256","display_episode_lineage_sha256"],"display_episode_policy_sha256":["display_episode_contract","display_episode_lineage_sha256"],"display_episode_lineage_sha256":["display_episode_contract","display_episode_policy_sha256"]}},"representative_native":{"type":"object","additionalProperties":false,"required":["item_id","family_event_id","family_cycle_ordinal","timing_relationship","supply_onset","price_onset","pairing_detected_on","statistics_from","statistics_through","peak_on"],"properties":{"item_id":{"type":"integer","minimum":1},"family_event_id":{"$ref":"#/$defs/sha"},"family_cycle_ordinal":{"type":"integer","minimum":1},"timing_relationship":{"enum":["SUPPLY_LEADS","CONCURRENT_DAILY","PRICE_LEADS"]},"supply_onset":{"$ref":"#/$defs/date"},"price_onset":{"$ref":"#/$defs/date"},"pairing_detected_on":{"$ref":"#/$defs/date"},"statistics_from":{"$ref":"#/$defs/date"},"statistics_through":{"$ref":"#/$defs/date"},"peak_on":{"$ref":"#/$defs/date"}}},"member":{"type":"object","additionalProperties":false,"required":["history_event_token","catalog_snapshot_id","catalog","product_pool","family_cycle_ordinal","timing_relationship","knowledge_mode","supply_onset","price_onset","pairing_detected_on","observed_through","statistics_from","statistics_through","peak_on","baseline_ask_usd","peak_ask_usd","maximum_price_multiple","baseline_supply","minimum_supply","remaining_supply_ratio","supply_contraction_ratio","supply_measurement_confidence","related_variant_count","event_end_is_economic_claim","manipulation_label"],"properties":{"history_event_token":{"$ref":"#/$defs/sha"},"catalog_snapshot_id":{"$ref":"#/$defs/sha"},"catalog":{"$ref":"urn:cs2-research:catalog-display-api:v1#/$defs/projection"},"product_pool":{"enum":["ORDINARY","SOUVENIR"]},"family_cycle_ordinal":{"type":"integer","minimum":1},"timing_relationship":{"enum":["SUPPLY_LEADS","CONCURRENT_DAILY","PRICE_LEADS"]},"knowledge_mode":{"const":"RETROSPECTIVE_LATE_BOUND"},"supply_onset":{"$ref":"#/$defs/date"},"price_onset":{"$ref":"#/$defs/date"},"pairing_detected_on":{"$ref":"#/$defs/date"},"observed_through":{"$ref":"#/$defs/date"},"statistics_from":{"$ref":"#/$defs/date"},"statistics_through":{"$ref":"#/$defs/date"},"peak_on":{"$ref":"#/$defs/date"},"baseline_ask_usd":{"$ref":"#/$defs/decimal"},"peak_ask_usd":{"$ref":"#/$defs/decimal"},"maximum_price_multiple":{"$ref":"#/$defs/decimal"},"baseline_supply":{"$ref":"#/$defs/decimal"},"minimum_supply":{"type":"integer","minimum":0},"remaining_supply_ratio":{"$ref":"#/$defs/decimal"},"supply_contraction_ratio":{"$ref":"#/$defs/decimal"},"supply_measurement_confidence":{"enum":["STANDARD","LOW_BASELINE_DEPTH"]},"related_variant_count":{"type":"integer","minimum":0,"maximum":1000},"display_episode_timeline_scope":{"const":"DISPLAY_EPISODE_GROUP"},"display_episode_source_cycle_count":{"type":"integer","minimum":1,"maximum":100000},"group_timeline_includes_other_variants":{"type":"boolean"},"representative_native":{"$ref":"#/$defs/representative_native"},"event_end_is_economic_claim":{"const":false},"manipulation_label":{"type":"null"}}},"display_episode_member_requirements":{"type":"object","properties":{"display_episode_timeline_scope":{},"display_episode_source_cycle_count":{},"group_timeline_includes_other_variants":{},"representative_native":{}},"required":["display_episode_timeline_scope","display_episode_source_cycle_count","group_timeline_includes_other_variants","representative_native"]},"projection":{"type":"object","additionalProperties":false,"required":["snapshot","release","members"],"properties":{"snapshot":{"$ref":"#/$defs/snapshot"},"release":{"$ref":"#/$defs/release"},"members":{"type":"array","items":{"$ref":"#/$defs/member"},"maxItems":100000}},"allOf":[{"if":{"properties":{"release":{"properties":{"display_episode_contract":{"const":"single-item-history-display-episode/2"}},"required":["display_episode_contract"]}},"required":["release"]},"then":{"properties":{"members":{"items":{"allOf":[{"$ref":"#/$defs/member"},{"$ref":"#/$defs/display_episode_member_requirements"}]}}}}}]},"publication":{"type":"object","additionalProperties":false,"required":["publication_id","parent_publication_id","manifest_sha256","rights_revision","published_at","withdrawn_at"],"properties":{"publication_id":{"$ref":"#/$defs/sha"},"parent_publication_id":{"oneOf":[{"$ref":"#/$defs/sha"},{"type":"null"}]},"manifest_sha256":{"$ref":"#/$defs/sha"},"rights_revision":{"$ref":"#/$defs/sha"},"published_at":{"$ref":"#/$defs/timestamp"},"withdrawn_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]}}},"success":{"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","operation","publication","snapshot","release","sort","page_size","members","next_cursor"],"properties":{"contract_name":{"const":"single-item-history-public-api"},"contract_version":{"const":"1"},"response_kind":{"const":"RESULT"},"operation":{"enum":["LIST","DETAIL"]},"publication":{"$ref":"#/$defs/publication"},"snapshot":{"$ref":"#/$defs/snapshot"},"release":{"$ref":"#/$defs/release"},"sort":{"enum":["MAX_PRICE_MULTIPLE_DESC","SUPPLY_ONSET_DESC"]},"page_size":{"type":"integer","minimum":1,"maximum":100},"members":{"type":"array","items":{"$ref":"#/$defs/member"},"minItems":1,"maxItems":100},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":4096},{"type":"null"}]}},"allOf":[{"if":{"properties":{"release":{"properties":{"display_episode_contract":{"const":"single-item-history-display-episode/2"}},"required":["display_episode_contract"]}},"required":["release"]},"then":{"properties":{"members":{"items":{"allOf":[{"$ref":"#/$defs/member"},{"$ref":"#/$defs/display_episode_member_requirements"}]}}}}}]},"error":{"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","error"],"properties":{"contract_name":{"const":"single-item-history-public-api"},"contract_version":{"const":"1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_REQUEST","NOT_PUBLISHED","NOT_FOUND","WITHDRAWN","STALE_EXPIRED","CORRUPT_PUBLICATION","TEMPORARILY_UNAVAILABLE"]},"retryable":{"type":"boolean"}}}}}}};
const schema952 = {"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","error"],"properties":{"contract_name":{"const":"single-item-history-public-api"},"contract_version":{"const":"1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_REQUEST","NOT_PUBLISHED","NOT_FOUND","WITHDRAWN","STALE_EXPIRED","CORRUPT_PUBLICATION","TEMPORARILY_UNAVAILABLE"]},"retryable":{"type":"boolean"}}}}};
const schema900 = {"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","operation","publication","snapshot","release","sort","page_size","members","next_cursor"],"properties":{"contract_name":{"const":"single-item-history-public-api"},"contract_version":{"const":"1"},"response_kind":{"const":"RESULT"},"operation":{"enum":["LIST","DETAIL"]},"publication":{"$ref":"#/$defs/publication"},"snapshot":{"$ref":"#/$defs/snapshot"},"release":{"$ref":"#/$defs/release"},"sort":{"enum":["MAX_PRICE_MULTIPLE_DESC","SUPPLY_ONSET_DESC"]},"page_size":{"type":"integer","minimum":1,"maximum":100},"members":{"type":"array","items":{"$ref":"#/$defs/member"},"minItems":1,"maxItems":100},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":4096},{"type":"null"}]}},"allOf":[{"if":{"properties":{"release":{"properties":{"display_episode_contract":{"const":"single-item-history-display-episode/2"}},"required":["display_episode_contract"]}},"required":["release"]},"then":{"properties":{"members":{"items":{"allOf":[{"$ref":"#/$defs/member"},{"$ref":"#/$defs/display_episode_member_requirements"}]}}}}}]};
const schema931 = {"type":"object","properties":{"display_episode_timeline_scope":{},"display_episode_source_cycle_count":{},"group_timeline_includes_other_variants":{},"representative_native":{}},"required":["display_episode_timeline_scope","display_episode_source_cycle_count","group_timeline_includes_other_variants","representative_native"]};
const schema901 = {"type":"object","additionalProperties":false,"required":["history_event_token","catalog_snapshot_id","catalog","product_pool","family_cycle_ordinal","timing_relationship","knowledge_mode","supply_onset","price_onset","pairing_detected_on","observed_through","statistics_from","statistics_through","peak_on","baseline_ask_usd","peak_ask_usd","maximum_price_multiple","baseline_supply","minimum_supply","remaining_supply_ratio","supply_contraction_ratio","supply_measurement_confidence","related_variant_count","event_end_is_economic_claim","manipulation_label"],"properties":{"history_event_token":{"$ref":"#/$defs/sha"},"catalog_snapshot_id":{"$ref":"#/$defs/sha"},"catalog":{"$ref":"urn:cs2-research:catalog-display-api:v1#/$defs/projection"},"product_pool":{"enum":["ORDINARY","SOUVENIR"]},"family_cycle_ordinal":{"type":"integer","minimum":1},"timing_relationship":{"enum":["SUPPLY_LEADS","CONCURRENT_DAILY","PRICE_LEADS"]},"knowledge_mode":{"const":"RETROSPECTIVE_LATE_BOUND"},"supply_onset":{"$ref":"#/$defs/date"},"price_onset":{"$ref":"#/$defs/date"},"pairing_detected_on":{"$ref":"#/$defs/date"},"observed_through":{"$ref":"#/$defs/date"},"statistics_from":{"$ref":"#/$defs/date"},"statistics_through":{"$ref":"#/$defs/date"},"peak_on":{"$ref":"#/$defs/date"},"baseline_ask_usd":{"$ref":"#/$defs/decimal"},"peak_ask_usd":{"$ref":"#/$defs/decimal"},"maximum_price_multiple":{"$ref":"#/$defs/decimal"},"baseline_supply":{"$ref":"#/$defs/decimal"},"minimum_supply":{"type":"integer","minimum":0},"remaining_supply_ratio":{"$ref":"#/$defs/decimal"},"supply_contraction_ratio":{"$ref":"#/$defs/decimal"},"supply_measurement_confidence":{"enum":["STANDARD","LOW_BASELINE_DEPTH"]},"related_variant_count":{"type":"integer","minimum":0,"maximum":1000},"display_episode_timeline_scope":{"const":"DISPLAY_EPISODE_GROUP"},"display_episode_source_cycle_count":{"type":"integer","minimum":1,"maximum":100000},"group_timeline_includes_other_variants":{"type":"boolean"},"representative_native":{"$ref":"#/$defs/representative_native"},"event_end_is_economic_claim":{"const":false},"manipulation_label":{"type":"null"}}};
const schema902 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const schema910 = {"type":"string","format":"date"};
const schema917 = {"type":"string","pattern":"^(0|[1-9][0-9]*)(\\.[0-9]+)?$"};
const func9 = Object.prototype.hasOwnProperty;
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");
const pattern543 = new RegExp("^(0|[1-9][0-9]*)(\\.[0-9]+)?$", "u");
const schema173 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","analysis_unit_kind","base_item_code","catalog_version","edition_kind","item_kind","localized_name","media","parent_analysis_unit_id","projection_hash","valid_from","version_context","wear_tier"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"base_item_code":{"$ref":"#/$defs/identifier"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/localizedName"},"media":{"$ref":"#/$defs/media"},"catalog_version":{"type":"string","minLength":1,"maxLength":128,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"version_context":{"$ref":"#/$defs/versionContext"},"valid_from":{"$ref":"#/$defs/timestamp"},"projection_hash":{"type":"string","pattern":"^[0-9a-f]{64}$"}}};
const schema170 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"};
const schema177 = {"type":"object","additionalProperties":false,"required":["authority","en","zh_cn"],"properties":{"authority":{"enum":["VALVE_STEAM","MARKET_D","MARKET_B"]},"en":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"zh_cn":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"}}};
const schema169 = {"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"};
const func2 = __wireUcs2Length;
const pattern87 = new RegExp("^[^\\u0000-\\u001f\\u007f]+$", "u");
const pattern19 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$", "u");
const schema178 = {"oneOf":[{"$ref":"#/$defs/mediaNotProduced"},{"$ref":"#/$defs/mediaBound"}]};
const schema179 = {"type":"object","additionalProperties":false,"required":["status"],"properties":{"status":{"const":"NOT_PRODUCED"}}};
const schema180 = {"type":"object","additionalProperties":false,"required":["status","media_key","presentation_kind"],"properties":{"status":{"const":"BOUND"},"media_key":{"type":"string","pattern":"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$","maxLength":256,"not":{"pattern":"(^|/)\\.{1,2}(/|$)"}},"presentation_kind":{"enum":["SERIES_REPRESENTATIVE","STYLE_REPRESENTATIVE"]}}};
const pattern94 = new RegExp("(^|/)\\.{1,2}(/|$)", "u");
const pattern95 = new RegExp("^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$", "u");

function validate107(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate107.evaluated;
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
if(!(((key1 === "status") || (key1 === "media_key")) || (key1 === "presentation_kind"))){
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
if(data.status !== undefined){
if("BOUND" !== data.status){
const err8 = {instancePath:instancePath+"/status",schemaPath:"#/$defs/mediaBound/properties/status/const",keyword:"const",params:{allowedValue: "BOUND"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.media_key !== undefined){
let data2 = data.media_key;
const _errs13 = errors;
const _errs14 = errors;
if(typeof data2 === "string"){
if(!pattern94.test(data2)){
const err9 = {};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
var valid5 = _errs14 === errors;
if(valid5){
const err10 = {instancePath:instancePath+"/media_key",schemaPath:"#/$defs/mediaBound/properties/media_key/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
else {
errors = _errs13;
if(vErrors !== null){
if(_errs13){
vErrors.length = _errs13;
}
else {
vErrors = null;
}
}
}
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err11 = {instancePath:instancePath+"/media_key",schemaPath:"#/$defs/mediaBound/properties/media_key/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern95.test(data2)){
const err12 = {instancePath:instancePath+"/media_key",schemaPath:"#/$defs/mediaBound/properties/media_key/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$"},message:"must match pattern \""+"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$"+"\""};
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
const err13 = {instancePath:instancePath+"/media_key",schemaPath:"#/$defs/mediaBound/properties/media_key/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.presentation_kind !== undefined){
let data3 = data.presentation_kind;
if(!((data3 === "SERIES_REPRESENTATIVE") || (data3 === "STYLE_REPRESENTATIVE"))){
const err14 = {instancePath:instancePath+"/presentation_kind",schemaPath:"#/$defs/mediaBound/properties/presentation_kind/enum",keyword:"enum",params:{allowedValues: schema180.properties.presentation_kind.enum},message:"must be equal to one of the allowed values"};
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
validate107.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate107.evaluated = {"dynamicProps":true,"dynamicItems":false};

const schema181 = {"type":"object","additionalProperties":false,"required":["analysis_unit_version_id","item_variant_version_id","media_asset_version_id","name_en_version_id","name_zh_cn_version_id"],"properties":{"analysis_unit_version_id":{"$ref":"#/$defs/versionId"},"item_variant_version_id":{"$ref":"#/$defs/versionId"},"media_asset_version_id":{"oneOf":[{"$ref":"#/$defs/versionId"},{"type":"null"}]},"name_en_version_id":{"$ref":"#/$defs/versionId"},"name_zh_cn_version_id":{"$ref":"#/$defs/versionId"}}};
const schema182 = {"type":"string","pattern":"^[1-9][0-9]*$"};
const pattern97 = new RegExp("^[1-9][0-9]*$", "u");

function validate109(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate109.evaluated;
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
validate109.errors = vErrors;
return errors === 0;
}
validate109.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate519(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate519.evaluated;
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
if(!(func9.call(schema173.properties, key0))){
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
if(data.parent_analysis_unit_id !== undefined){
let data1 = data.parent_analysis_unit_id;
const _errs6 = errors;
let valid2 = false;
let passing0 = null;
const _errs7 = errors;
if(typeof data1 === "string"){
if(func2(data1) > 256){
const err18 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(func2(data1) < 1){
const err19 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!pattern87.test(data1)){
const err20 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err21 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
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
const err22 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
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
const err23 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
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
const err24 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema173.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.item_kind !== undefined){
let data3 = data.item_kind;
if(!((((((data3 === "WEAPON") || (data3 === "KNIFE")) || (data3 === "GLOVE")) || (data3 === "AGENT")) || (data3 === "OTHER")) || (data3 === "UNKNOWN"))){
const err25 = {instancePath:instancePath+"/item_kind",schemaPath:"#/properties/item_kind/enum",keyword:"enum",params:{allowedValues: schema173.properties.item_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.base_item_code !== undefined){
let data4 = data.base_item_code;
if(typeof data4 === "string"){
if(func2(data4) > 256){
const err26 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(func2(data4) < 1){
const err27 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(!pattern87.test(data4)){
const err28 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err29 = {instancePath:instancePath+"/base_item_code",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.edition_kind !== undefined){
let data5 = data.edition_kind;
if(!((((data5 === "STANDARD") || (data5 === "STATTRAK")) || (data5 === "SOUVENIR")) || (data5 === "UNKNOWN"))){
const err30 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema173.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.wear_tier !== undefined){
let data6 = data.wear_tier;
if(!(((((((data6 === "FACTORY_NEW") || (data6 === "MINIMAL_WEAR")) || (data6 === "FIELD_TESTED")) || (data6 === "WELL_WORN")) || (data6 === "BATTLE_SCARRED")) || (data6 === "NOT_APPLICABLE")) || (data6 === "UNKNOWN"))){
const err31 = {instancePath:instancePath+"/wear_tier",schemaPath:"#/properties/wear_tier/enum",keyword:"enum",params:{allowedValues: schema173.properties.wear_tier.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.localized_name !== undefined){
let data7 = data.localized_name;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.authority === undefined){
const err32 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/required",keyword:"required",params:{missingProperty: "authority"},message:"must have required property '"+"authority"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data7.en === undefined){
const err33 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/required",keyword:"required",params:{missingProperty: "en"},message:"must have required property '"+"en"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data7.zh_cn === undefined){
const err34 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/required",keyword:"required",params:{missingProperty: "zh_cn"},message:"must have required property '"+"zh_cn"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
for(const key1 in data7){
if(!(((key1 === "authority") || (key1 === "en")) || (key1 === "zh_cn"))){
const err35 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data7.authority !== undefined){
let data8 = data7.authority;
if(!(((data8 === "VALVE_STEAM") || (data8 === "MARKET_D")) || (data8 === "MARKET_B"))){
const err36 = {instancePath:instancePath+"/localized_name/authority",schemaPath:"#/$defs/localizedName/properties/authority/enum",keyword:"enum",params:{allowedValues: schema177.properties.authority.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data7.en !== undefined){
let data9 = data7.en;
if(typeof data9 === "string"){
if(func2(data9) > 512){
const err37 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/localizedName/properties/en/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(func2(data9) < 1){
const err38 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/localizedName/properties/en/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(!pattern87.test(data9)){
const err39 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/localizedName/properties/en/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err40 = {instancePath:instancePath+"/localized_name/en",schemaPath:"#/$defs/localizedName/properties/en/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data7.zh_cn !== undefined){
let data10 = data7.zh_cn;
if(typeof data10 === "string"){
if(func2(data10) > 512){
const err41 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/localizedName/properties/zh_cn/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(func2(data10) < 1){
const err42 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/localizedName/properties/zh_cn/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(!pattern87.test(data10)){
const err43 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/localizedName/properties/zh_cn/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err44 = {instancePath:instancePath+"/localized_name/zh_cn",schemaPath:"#/$defs/localizedName/properties/zh_cn/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err45 = {instancePath:instancePath+"/localized_name",schemaPath:"#/$defs/localizedName/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.media !== undefined){
if(!(validate107(data.media, {instancePath:instancePath+"/media",parentData:data,parentDataProperty:"media",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate107.errors : vErrors.concat(validate107.errors);
errors = vErrors.length;
}
}
if(data.catalog_version !== undefined){
let data12 = data.catalog_version;
if(typeof data12 === "string"){
if(func2(data12) > 128){
const err46 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(func2(data12) < 1){
const err47 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(!pattern87.test(data12)){
const err48 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
else {
const err49 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data.version_context !== undefined){
if(!(validate109(data.version_context, {instancePath:instancePath+"/version_context",parentData:data,parentDataProperty:"version_context",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate109.errors : vErrors.concat(validate109.errors);
errors = vErrors.length;
}
}
if(data.valid_from !== undefined){
let data14 = data.valid_from;
if(typeof data14 === "string"){
if(!pattern19.test(data14)){
const err50 = {instancePath:instancePath+"/valid_from",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err51 = {instancePath:instancePath+"/valid_from",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data.projection_hash !== undefined){
let data15 = data.projection_hash;
if(typeof data15 === "string"){
if(!pattern5.test(data15)){
const err52 = {instancePath:instancePath+"/projection_hash",schemaPath:"#/properties/projection_hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
else {
const err53 = {instancePath:instancePath+"/projection_hash",schemaPath:"#/properties/projection_hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate519.errors = vErrors;
return errors === 0;
}
validate519.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema923 = {"type":"object","additionalProperties":false,"required":["item_id","family_event_id","family_cycle_ordinal","timing_relationship","supply_onset","price_onset","pairing_detected_on","statistics_from","statistics_through","peak_on"],"properties":{"item_id":{"type":"integer","minimum":1},"family_event_id":{"$ref":"#/$defs/sha"},"family_cycle_ordinal":{"type":"integer","minimum":1},"timing_relationship":{"enum":["SUPPLY_LEADS","CONCURRENT_DAILY","PRICE_LEADS"]},"supply_onset":{"$ref":"#/$defs/date"},"price_onset":{"$ref":"#/$defs/date"},"pairing_detected_on":{"$ref":"#/$defs/date"},"statistics_from":{"$ref":"#/$defs/date"},"statistics_through":{"$ref":"#/$defs/date"},"peak_on":{"$ref":"#/$defs/date"}}};
const formats40 = __wireFullFormats.date;

function validate523(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate523.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.item_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "item_id"},message:"must have required property '"+"item_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.family_event_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "family_event_id"},message:"must have required property '"+"family_event_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.family_cycle_ordinal === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "family_cycle_ordinal"},message:"must have required property '"+"family_cycle_ordinal"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.timing_relationship === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "timing_relationship"},message:"must have required property '"+"timing_relationship"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.supply_onset === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supply_onset"},message:"must have required property '"+"supply_onset"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.price_onset === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "price_onset"},message:"must have required property '"+"price_onset"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.pairing_detected_on === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pairing_detected_on"},message:"must have required property '"+"pairing_detected_on"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.statistics_from === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "statistics_from"},message:"must have required property '"+"statistics_from"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.statistics_through === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "statistics_through"},message:"must have required property '"+"statistics_through"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.peak_on === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "peak_on"},message:"must have required property '"+"peak_on"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema923.properties, key0))){
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
if(data.item_id !== undefined){
let data0 = data.item_id;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err11 = {instancePath:instancePath+"/item_id",schemaPath:"#/properties/item_id/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 < 1 || isNaN(data0)){
const err12 = {instancePath:instancePath+"/item_id",schemaPath:"#/properties/item_id/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.family_event_id !== undefined){
let data1 = data.family_event_id;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err13 = {instancePath:instancePath+"/family_event_id",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err14 = {instancePath:instancePath+"/family_event_id",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.family_cycle_ordinal !== undefined){
let data2 = data.family_cycle_ordinal;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err15 = {instancePath:instancePath+"/family_cycle_ordinal",schemaPath:"#/properties/family_cycle_ordinal/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 < 1 || isNaN(data2)){
const err16 = {instancePath:instancePath+"/family_cycle_ordinal",schemaPath:"#/properties/family_cycle_ordinal/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.timing_relationship !== undefined){
let data3 = data.timing_relationship;
if(!(((data3 === "SUPPLY_LEADS") || (data3 === "CONCURRENT_DAILY")) || (data3 === "PRICE_LEADS"))){
const err17 = {instancePath:instancePath+"/timing_relationship",schemaPath:"#/properties/timing_relationship/enum",keyword:"enum",params:{allowedValues: schema923.properties.timing_relationship.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.supply_onset !== undefined){
let data4 = data.supply_onset;
if(typeof data4 === "string"){
if(!(formats40.validate(data4))){
const err18 = {instancePath:instancePath+"/supply_onset",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err19 = {instancePath:instancePath+"/supply_onset",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.price_onset !== undefined){
let data5 = data.price_onset;
if(typeof data5 === "string"){
if(!(formats40.validate(data5))){
const err20 = {instancePath:instancePath+"/price_onset",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err21 = {instancePath:instancePath+"/price_onset",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.pairing_detected_on !== undefined){
let data6 = data.pairing_detected_on;
if(typeof data6 === "string"){
if(!(formats40.validate(data6))){
const err22 = {instancePath:instancePath+"/pairing_detected_on",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err23 = {instancePath:instancePath+"/pairing_detected_on",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.statistics_from !== undefined){
let data7 = data.statistics_from;
if(typeof data7 === "string"){
if(!(formats40.validate(data7))){
const err24 = {instancePath:instancePath+"/statistics_from",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err25 = {instancePath:instancePath+"/statistics_from",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.statistics_through !== undefined){
let data8 = data.statistics_through;
if(typeof data8 === "string"){
if(!(formats40.validate(data8))){
const err26 = {instancePath:instancePath+"/statistics_through",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err27 = {instancePath:instancePath+"/statistics_through",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.peak_on !== undefined){
let data9 = data.peak_on;
if(typeof data9 === "string"){
if(!(formats40.validate(data9))){
const err28 = {instancePath:instancePath+"/peak_on",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err29 = {instancePath:instancePath+"/peak_on",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err30 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
validate523.errors = vErrors;
return errors === 0;
}
validate523.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate518(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate518.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.history_event_token === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "history_event_token"},message:"must have required property '"+"history_event_token"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.catalog_snapshot_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_snapshot_id"},message:"must have required property '"+"catalog_snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.catalog === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog"},message:"must have required property '"+"catalog"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.product_pool === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "product_pool"},message:"must have required property '"+"product_pool"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.family_cycle_ordinal === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "family_cycle_ordinal"},message:"must have required property '"+"family_cycle_ordinal"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.timing_relationship === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "timing_relationship"},message:"must have required property '"+"timing_relationship"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.knowledge_mode === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "knowledge_mode"},message:"must have required property '"+"knowledge_mode"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.supply_onset === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supply_onset"},message:"must have required property '"+"supply_onset"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.price_onset === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "price_onset"},message:"must have required property '"+"price_onset"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.pairing_detected_on === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pairing_detected_on"},message:"must have required property '"+"pairing_detected_on"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.observed_through === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observed_through"},message:"must have required property '"+"observed_through"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.statistics_from === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "statistics_from"},message:"must have required property '"+"statistics_from"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.statistics_through === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "statistics_through"},message:"must have required property '"+"statistics_through"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.peak_on === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "peak_on"},message:"must have required property '"+"peak_on"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.baseline_ask_usd === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "baseline_ask_usd"},message:"must have required property '"+"baseline_ask_usd"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.peak_ask_usd === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "peak_ask_usd"},message:"must have required property '"+"peak_ask_usd"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.maximum_price_multiple === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "maximum_price_multiple"},message:"must have required property '"+"maximum_price_multiple"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.baseline_supply === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "baseline_supply"},message:"must have required property '"+"baseline_supply"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.minimum_supply === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "minimum_supply"},message:"must have required property '"+"minimum_supply"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.remaining_supply_ratio === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "remaining_supply_ratio"},message:"must have required property '"+"remaining_supply_ratio"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.supply_contraction_ratio === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supply_contraction_ratio"},message:"must have required property '"+"supply_contraction_ratio"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.supply_measurement_confidence === undefined){
const err21 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supply_measurement_confidence"},message:"must have required property '"+"supply_measurement_confidence"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.related_variant_count === undefined){
const err22 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "related_variant_count"},message:"must have required property '"+"related_variant_count"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data.event_end_is_economic_claim === undefined){
const err23 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "event_end_is_economic_claim"},message:"must have required property '"+"event_end_is_economic_claim"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data.manipulation_label === undefined){
const err24 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manipulation_label"},message:"must have required property '"+"manipulation_label"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema901.properties, key0))){
const err25 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.history_event_token !== undefined){
let data0 = data.history_event_token;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err26 = {instancePath:instancePath+"/history_event_token",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err27 = {instancePath:instancePath+"/history_event_token",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.catalog_snapshot_id !== undefined){
let data1 = data.catalog_snapshot_id;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err28 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err29 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(!(validate519(data.catalog, {instancePath:instancePath+"/catalog",parentData:data,parentDataProperty:"catalog",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate519.errors : vErrors.concat(validate519.errors);
errors = vErrors.length;
}
}
if(data.product_pool !== undefined){
let data3 = data.product_pool;
if(!((data3 === "ORDINARY") || (data3 === "SOUVENIR"))){
const err30 = {instancePath:instancePath+"/product_pool",schemaPath:"#/properties/product_pool/enum",keyword:"enum",params:{allowedValues: schema901.properties.product_pool.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.family_cycle_ordinal !== undefined){
let data4 = data.family_cycle_ordinal;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err31 = {instancePath:instancePath+"/family_cycle_ordinal",schemaPath:"#/properties/family_cycle_ordinal/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 < 1 || isNaN(data4)){
const err32 = {instancePath:instancePath+"/family_cycle_ordinal",schemaPath:"#/properties/family_cycle_ordinal/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.timing_relationship !== undefined){
let data5 = data.timing_relationship;
if(!(((data5 === "SUPPLY_LEADS") || (data5 === "CONCURRENT_DAILY")) || (data5 === "PRICE_LEADS"))){
const err33 = {instancePath:instancePath+"/timing_relationship",schemaPath:"#/properties/timing_relationship/enum",keyword:"enum",params:{allowedValues: schema901.properties.timing_relationship.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.knowledge_mode !== undefined){
if("RETROSPECTIVE_LATE_BOUND" !== data.knowledge_mode){
const err34 = {instancePath:instancePath+"/knowledge_mode",schemaPath:"#/properties/knowledge_mode/const",keyword:"const",params:{allowedValue: "RETROSPECTIVE_LATE_BOUND"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.supply_onset !== undefined){
let data7 = data.supply_onset;
if(typeof data7 === "string"){
if(!(formats40.validate(data7))){
const err35 = {instancePath:instancePath+"/supply_onset",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
else {
const err36 = {instancePath:instancePath+"/supply_onset",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.price_onset !== undefined){
let data8 = data.price_onset;
if(typeof data8 === "string"){
if(!(formats40.validate(data8))){
const err37 = {instancePath:instancePath+"/price_onset",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err38 = {instancePath:instancePath+"/price_onset",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.pairing_detected_on !== undefined){
let data9 = data.pairing_detected_on;
if(typeof data9 === "string"){
if(!(formats40.validate(data9))){
const err39 = {instancePath:instancePath+"/pairing_detected_on",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err40 = {instancePath:instancePath+"/pairing_detected_on",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.observed_through !== undefined){
let data10 = data.observed_through;
if(typeof data10 === "string"){
if(!(formats40.validate(data10))){
const err41 = {instancePath:instancePath+"/observed_through",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err42 = {instancePath:instancePath+"/observed_through",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.statistics_from !== undefined){
let data11 = data.statistics_from;
if(typeof data11 === "string"){
if(!(formats40.validate(data11))){
const err43 = {instancePath:instancePath+"/statistics_from",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err44 = {instancePath:instancePath+"/statistics_from",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data.statistics_through !== undefined){
let data12 = data.statistics_through;
if(typeof data12 === "string"){
if(!(formats40.validate(data12))){
const err45 = {instancePath:instancePath+"/statistics_through",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err46 = {instancePath:instancePath+"/statistics_through",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.peak_on !== undefined){
let data13 = data.peak_on;
if(typeof data13 === "string"){
if(!(formats40.validate(data13))){
const err47 = {instancePath:instancePath+"/peak_on",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
else {
const err48 = {instancePath:instancePath+"/peak_on",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data.baseline_ask_usd !== undefined){
let data14 = data.baseline_ask_usd;
if(typeof data14 === "string"){
if(!pattern543.test(data14)){
const err49 = {instancePath:instancePath+"/baseline_ask_usd",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
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
const err50 = {instancePath:instancePath+"/baseline_ask_usd",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data.peak_ask_usd !== undefined){
let data15 = data.peak_ask_usd;
if(typeof data15 === "string"){
if(!pattern543.test(data15)){
const err51 = {instancePath:instancePath+"/peak_ask_usd",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
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
const err52 = {instancePath:instancePath+"/peak_ask_usd",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data.maximum_price_multiple !== undefined){
let data16 = data.maximum_price_multiple;
if(typeof data16 === "string"){
if(!pattern543.test(data16)){
const err53 = {instancePath:instancePath+"/maximum_price_multiple",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
else {
const err54 = {instancePath:instancePath+"/maximum_price_multiple",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data.baseline_supply !== undefined){
let data17 = data.baseline_supply;
if(typeof data17 === "string"){
if(!pattern543.test(data17)){
const err55 = {instancePath:instancePath+"/baseline_supply",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
else {
const err56 = {instancePath:instancePath+"/baseline_supply",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data.minimum_supply !== undefined){
let data18 = data.minimum_supply;
if(!(((typeof data18 == "number") && (!(data18 % 1) && !isNaN(data18))) && (isFinite(data18)))){
const err57 = {instancePath:instancePath+"/minimum_supply",schemaPath:"#/properties/minimum_supply/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if((typeof data18 == "number") && (isFinite(data18))){
if(data18 < 0 || isNaN(data18)){
const err58 = {instancePath:instancePath+"/minimum_supply",schemaPath:"#/properties/minimum_supply/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.remaining_supply_ratio !== undefined){
let data19 = data.remaining_supply_ratio;
if(typeof data19 === "string"){
if(!pattern543.test(data19)){
const err59 = {instancePath:instancePath+"/remaining_supply_ratio",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
else {
const err60 = {instancePath:instancePath+"/remaining_supply_ratio",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data.supply_contraction_ratio !== undefined){
let data20 = data.supply_contraction_ratio;
if(typeof data20 === "string"){
if(!pattern543.test(data20)){
const err61 = {instancePath:instancePath+"/supply_contraction_ratio",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
else {
const err62 = {instancePath:instancePath+"/supply_contraction_ratio",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data.supply_measurement_confidence !== undefined){
let data21 = data.supply_measurement_confidence;
if(!((data21 === "STANDARD") || (data21 === "LOW_BASELINE_DEPTH"))){
const err63 = {instancePath:instancePath+"/supply_measurement_confidence",schemaPath:"#/properties/supply_measurement_confidence/enum",keyword:"enum",params:{allowedValues: schema901.properties.supply_measurement_confidence.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data.related_variant_count !== undefined){
let data22 = data.related_variant_count;
if(!(((typeof data22 == "number") && (!(data22 % 1) && !isNaN(data22))) && (isFinite(data22)))){
const err64 = {instancePath:instancePath+"/related_variant_count",schemaPath:"#/properties/related_variant_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if((typeof data22 == "number") && (isFinite(data22))){
if(data22 > 1000 || isNaN(data22)){
const err65 = {instancePath:instancePath+"/related_variant_count",schemaPath:"#/properties/related_variant_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000},message:"must be <= 1000"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data22 < 0 || isNaN(data22)){
const err66 = {instancePath:instancePath+"/related_variant_count",schemaPath:"#/properties/related_variant_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.display_episode_timeline_scope !== undefined){
if("DISPLAY_EPISODE_GROUP" !== data.display_episode_timeline_scope){
const err67 = {instancePath:instancePath+"/display_episode_timeline_scope",schemaPath:"#/properties/display_episode_timeline_scope/const",keyword:"const",params:{allowedValue: "DISPLAY_EPISODE_GROUP"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data.display_episode_source_cycle_count !== undefined){
let data24 = data.display_episode_source_cycle_count;
if(!(((typeof data24 == "number") && (!(data24 % 1) && !isNaN(data24))) && (isFinite(data24)))){
const err68 = {instancePath:instancePath+"/display_episode_source_cycle_count",schemaPath:"#/properties/display_episode_source_cycle_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if((typeof data24 == "number") && (isFinite(data24))){
if(data24 > 100000 || isNaN(data24)){
const err69 = {instancePath:instancePath+"/display_episode_source_cycle_count",schemaPath:"#/properties/display_episode_source_cycle_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100000},message:"must be <= 100000"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data24 < 1 || isNaN(data24)){
const err70 = {instancePath:instancePath+"/display_episode_source_cycle_count",schemaPath:"#/properties/display_episode_source_cycle_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.group_timeline_includes_other_variants !== undefined){
if(typeof data.group_timeline_includes_other_variants !== "boolean"){
const err71 = {instancePath:instancePath+"/group_timeline_includes_other_variants",schemaPath:"#/properties/group_timeline_includes_other_variants/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data.representative_native !== undefined){
if(!(validate523(data.representative_native, {instancePath:instancePath+"/representative_native",parentData:data,parentDataProperty:"representative_native",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate523.errors : vErrors.concat(validate523.errors);
errors = vErrors.length;
}
}
if(data.event_end_is_economic_claim !== undefined){
if(false !== data.event_end_is_economic_claim){
const err72 = {instancePath:instancePath+"/event_end_is_economic_claim",schemaPath:"#/properties/event_end_is_economic_claim/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data.manipulation_label !== undefined){
if(data.manipulation_label !== null){
const err73 = {instancePath:instancePath+"/manipulation_label",schemaPath:"#/properties/manipulation_label/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
}
else {
const err74 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
validate518.errors = vErrors;
return errors === 0;
}
validate518.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema932 = {"type":"object","additionalProperties":false,"required":["publication_id","parent_publication_id","manifest_sha256","rights_revision","published_at","withdrawn_at"],"properties":{"publication_id":{"$ref":"#/$defs/sha"},"parent_publication_id":{"oneOf":[{"$ref":"#/$defs/sha"},{"type":"null"}]},"manifest_sha256":{"$ref":"#/$defs/sha"},"rights_revision":{"$ref":"#/$defs/sha"},"published_at":{"$ref":"#/$defs/timestamp"},"withdrawn_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]}}};
const schema937 = {"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"};
const pattern319 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$", "u");
const formats0 = __wireFullFormats["date-time"];

function validate526(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate526.evaluated;
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
if(data.parent_publication_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parent_publication_id"},message:"must have required property '"+"parent_publication_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.manifest_sha256 === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_sha256"},message:"must have required property '"+"manifest_sha256"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.rights_revision === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rights_revision"},message:"must have required property '"+"rights_revision"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.published_at === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at"},message:"must have required property '"+"published_at"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.withdrawn_at === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "withdrawn_at"},message:"must have required property '"+"withdrawn_at"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "publication_id") || (key0 === "parent_publication_id")) || (key0 === "manifest_sha256")) || (key0 === "rights_revision")) || (key0 === "published_at")) || (key0 === "withdrawn_at"))){
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
if(data.publication_id !== undefined){
let data0 = data.publication_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err7 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.parent_publication_id !== undefined){
let data1 = data.parent_publication_id;
const _errs6 = errors;
let valid2 = false;
let passing0 = null;
const _errs7 = errors;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err9 = {instancePath:instancePath+"/parent_publication_id",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err10 = {instancePath:instancePath+"/parent_publication_id",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
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
const err11 = {instancePath:instancePath+"/parent_publication_id",schemaPath:"#/properties/parent_publication_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
const err12 = {instancePath:instancePath+"/parent_publication_id",schemaPath:"#/properties/parent_publication_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
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
if(data.manifest_sha256 !== undefined){
let data2 = data.manifest_sha256;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err13 = {instancePath:instancePath+"/manifest_sha256",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err14 = {instancePath:instancePath+"/manifest_sha256",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.rights_revision !== undefined){
let data3 = data.rights_revision;
if(typeof data3 === "string"){
if(!pattern5.test(data3)){
const err15 = {instancePath:instancePath+"/rights_revision",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err16 = {instancePath:instancePath+"/rights_revision",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.published_at !== undefined){
let data4 = data.published_at;
if(typeof data4 === "string"){
if(!pattern319.test(data4)){
const err17 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!(formats0.validate(data4))){
const err18 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err19 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.withdrawn_at !== undefined){
let data5 = data.withdrawn_at;
const _errs22 = errors;
let valid7 = false;
let passing1 = null;
const _errs23 = errors;
if(typeof data5 === "string"){
if(!pattern319.test(data5)){
const err20 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!(formats0.validate(data5))){
const err21 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err22 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid1 = _errs23 === errors;
if(_valid1){
valid7 = true;
passing1 = 0;
}
const _errs26 = errors;
if(data5 !== null){
const err23 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/properties/withdrawn_at/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
var _valid1 = _errs26 === errors;
if(_valid1 && valid7){
valid7 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid7 = true;
passing1 = 1;
}
}
if(!valid7){
const err24 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/properties/withdrawn_at/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
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
}
else {
const err25 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
validate526.errors = vErrors;
return errors === 0;
}
validate526.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema939 = {"type":"object","additionalProperties":false,"required":["source_contract","source_manifest_sha256","source_family_events_sha256","catalog_snapshot_id","input_event_count","history_observed_through","imported_at"],"properties":{"source_contract":{"const":"single-item-history-family-relation/2.4"},"source_manifest_sha256":{"$ref":"#/$defs/sha"},"source_family_events_sha256":{"$ref":"#/$defs/sha"},"catalog_snapshot_id":{"$ref":"#/$defs/sha"},"input_event_count":{"type":"integer","minimum":0,"maximum":100000},"history_observed_through":{"$ref":"#/$defs/date"},"imported_at":{"$ref":"#/$defs/timestamp"}}};

function validate528(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate528.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.source_contract === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_contract"},message:"must have required property '"+"source_contract"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.source_manifest_sha256 === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_manifest_sha256"},message:"must have required property '"+"source_manifest_sha256"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.source_family_events_sha256 === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_family_events_sha256"},message:"must have required property '"+"source_family_events_sha256"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.catalog_snapshot_id === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_snapshot_id"},message:"must have required property '"+"catalog_snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.input_event_count === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_event_count"},message:"must have required property '"+"input_event_count"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.history_observed_through === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "history_observed_through"},message:"must have required property '"+"history_observed_through"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.imported_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "imported_at"},message:"must have required property '"+"imported_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "source_contract") || (key0 === "source_manifest_sha256")) || (key0 === "source_family_events_sha256")) || (key0 === "catalog_snapshot_id")) || (key0 === "input_event_count")) || (key0 === "history_observed_through")) || (key0 === "imported_at"))){
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
if(data.source_contract !== undefined){
if("single-item-history-family-relation/2.4" !== data.source_contract){
const err8 = {instancePath:instancePath+"/source_contract",schemaPath:"#/properties/source_contract/const",keyword:"const",params:{allowedValue: "single-item-history-family-relation/2.4"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.source_manifest_sha256 !== undefined){
let data1 = data.source_manifest_sha256;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err9 = {instancePath:instancePath+"/source_manifest_sha256",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err10 = {instancePath:instancePath+"/source_manifest_sha256",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.source_family_events_sha256 !== undefined){
let data2 = data.source_family_events_sha256;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err11 = {instancePath:instancePath+"/source_family_events_sha256",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err12 = {instancePath:instancePath+"/source_family_events_sha256",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.catalog_snapshot_id !== undefined){
let data3 = data.catalog_snapshot_id;
if(typeof data3 === "string"){
if(!pattern5.test(data3)){
const err13 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err14 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.input_event_count !== undefined){
let data4 = data.input_event_count;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err15 = {instancePath:instancePath+"/input_event_count",schemaPath:"#/properties/input_event_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 100000 || isNaN(data4)){
const err16 = {instancePath:instancePath+"/input_event_count",schemaPath:"#/properties/input_event_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100000},message:"must be <= 100000"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err17 = {instancePath:instancePath+"/input_event_count",schemaPath:"#/properties/input_event_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.history_observed_through !== undefined){
let data5 = data.history_observed_through;
if(typeof data5 === "string"){
if(!(formats40.validate(data5))){
const err18 = {instancePath:instancePath+"/history_observed_through",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err19 = {instancePath:instancePath+"/history_observed_through",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.imported_at !== undefined){
let data6 = data.imported_at;
if(typeof data6 === "string"){
if(!pattern319.test(data6)){
const err20 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!(formats0.validate(data6))){
const err21 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err22 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate528.errors = vErrors;
return errors === 0;
}
validate528.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema945 = {"type":"object","additionalProperties":false,"required":["release_id","algorithm_version","causal_kernel_version","source_generator_commit","accepted_verifier_commit","version_contract_sha256","scope","source_event_count","public_event_count","manipulation_labels_enabled"],"properties":{"release_id":{"$ref":"#/$defs/sha"},"algorithm_version":{"const":"single-item-history-reconstruction/2.4"},"causal_kernel_version":{"const":"single-item-causal-kernel/2.4"},"source_generator_commit":{"$ref":"#/$defs/commit"},"accepted_verifier_commit":{"$ref":"#/$defs/commit"},"version_contract_sha256":{"$ref":"#/$defs/sha"},"display_episode_contract":{"const":"single-item-history-display-episode/2"},"display_episode_policy_sha256":{"$ref":"#/$defs/sha"},"display_episode_lineage_sha256":{"$ref":"#/$defs/sha"},"scope":{"const":"HISTORICAL_ANOMALY_CYCLES"},"source_event_count":{"type":"integer","minimum":0,"maximum":100000},"public_event_count":{"type":"integer","minimum":0,"maximum":100000},"manipulation_labels_enabled":{"const":false}},"dependentRequired":{"display_episode_contract":["display_episode_policy_sha256","display_episode_lineage_sha256"],"display_episode_policy_sha256":["display_episode_contract","display_episode_lineage_sha256"],"display_episode_lineage_sha256":["display_episode_contract","display_episode_policy_sha256"]}};
const schema947 = {"type":"string","pattern":"^[0-9a-f]{40}$"};
const pattern561 = new RegExp("^[0-9a-f]{40}$", "u");

function validate530(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate530.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.release_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "release_id"},message:"must have required property '"+"release_id"+"'"};
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
if(data.causal_kernel_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "causal_kernel_version"},message:"must have required property '"+"causal_kernel_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.source_generator_commit === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_generator_commit"},message:"must have required property '"+"source_generator_commit"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.accepted_verifier_commit === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "accepted_verifier_commit"},message:"must have required property '"+"accepted_verifier_commit"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.version_contract_sha256 === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version_contract_sha256"},message:"must have required property '"+"version_contract_sha256"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.scope === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope"},message:"must have required property '"+"scope"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.source_event_count === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_event_count"},message:"must have required property '"+"source_event_count"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.public_event_count === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "public_event_count"},message:"must have required property '"+"public_event_count"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.manipulation_labels_enabled === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manipulation_labels_enabled"},message:"must have required property '"+"manipulation_labels_enabled"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema945.properties, key0))){
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
if(data.release_id !== undefined){
let data0 = data.release_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err11 = {instancePath:instancePath+"/release_id",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err12 = {instancePath:instancePath+"/release_id",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.algorithm_version !== undefined){
if("single-item-history-reconstruction/2.4" !== data.algorithm_version){
const err13 = {instancePath:instancePath+"/algorithm_version",schemaPath:"#/properties/algorithm_version/const",keyword:"const",params:{allowedValue: "single-item-history-reconstruction/2.4"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.causal_kernel_version !== undefined){
if("single-item-causal-kernel/2.4" !== data.causal_kernel_version){
const err14 = {instancePath:instancePath+"/causal_kernel_version",schemaPath:"#/properties/causal_kernel_version/const",keyword:"const",params:{allowedValue: "single-item-causal-kernel/2.4"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.source_generator_commit !== undefined){
let data3 = data.source_generator_commit;
if(typeof data3 === "string"){
if(!pattern561.test(data3)){
const err15 = {instancePath:instancePath+"/source_generator_commit",schemaPath:"#/$defs/commit/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{40}$"},message:"must match pattern \""+"^[0-9a-f]{40}$"+"\""};
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
const err16 = {instancePath:instancePath+"/source_generator_commit",schemaPath:"#/$defs/commit/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.accepted_verifier_commit !== undefined){
let data4 = data.accepted_verifier_commit;
if(typeof data4 === "string"){
if(!pattern561.test(data4)){
const err17 = {instancePath:instancePath+"/accepted_verifier_commit",schemaPath:"#/$defs/commit/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{40}$"},message:"must match pattern \""+"^[0-9a-f]{40}$"+"\""};
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
const err18 = {instancePath:instancePath+"/accepted_verifier_commit",schemaPath:"#/$defs/commit/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.version_contract_sha256 !== undefined){
let data5 = data.version_contract_sha256;
if(typeof data5 === "string"){
if(!pattern5.test(data5)){
const err19 = {instancePath:instancePath+"/version_contract_sha256",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err20 = {instancePath:instancePath+"/version_contract_sha256",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.display_episode_contract !== undefined){
if("single-item-history-display-episode/2" !== data.display_episode_contract){
const err21 = {instancePath:instancePath+"/display_episode_contract",schemaPath:"#/properties/display_episode_contract/const",keyword:"const",params:{allowedValue: "single-item-history-display-episode/2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.display_episode_policy_sha256 !== undefined){
let data7 = data.display_episode_policy_sha256;
if(typeof data7 === "string"){
if(!pattern5.test(data7)){
const err22 = {instancePath:instancePath+"/display_episode_policy_sha256",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err23 = {instancePath:instancePath+"/display_episode_policy_sha256",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.display_episode_lineage_sha256 !== undefined){
let data8 = data.display_episode_lineage_sha256;
if(typeof data8 === "string"){
if(!pattern5.test(data8)){
const err24 = {instancePath:instancePath+"/display_episode_lineage_sha256",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err25 = {instancePath:instancePath+"/display_episode_lineage_sha256",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.scope !== undefined){
if("HISTORICAL_ANOMALY_CYCLES" !== data.scope){
const err26 = {instancePath:instancePath+"/scope",schemaPath:"#/properties/scope/const",keyword:"const",params:{allowedValue: "HISTORICAL_ANOMALY_CYCLES"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.source_event_count !== undefined){
let data10 = data.source_event_count;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err27 = {instancePath:instancePath+"/source_event_count",schemaPath:"#/properties/source_event_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 > 100000 || isNaN(data10)){
const err28 = {instancePath:instancePath+"/source_event_count",schemaPath:"#/properties/source_event_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100000},message:"must be <= 100000"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data10 < 0 || isNaN(data10)){
const err29 = {instancePath:instancePath+"/source_event_count",schemaPath:"#/properties/source_event_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.public_event_count !== undefined){
let data11 = data.public_event_count;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err30 = {instancePath:instancePath+"/public_event_count",schemaPath:"#/properties/public_event_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 > 100000 || isNaN(data11)){
const err31 = {instancePath:instancePath+"/public_event_count",schemaPath:"#/properties/public_event_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100000},message:"must be <= 100000"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data11 < 0 || isNaN(data11)){
const err32 = {instancePath:instancePath+"/public_event_count",schemaPath:"#/properties/public_event_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.manipulation_labels_enabled !== undefined){
if(false !== data.manipulation_labels_enabled){
const err33 = {instancePath:instancePath+"/manipulation_labels_enabled",schemaPath:"#/properties/manipulation_labels_enabled/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.display_episode_contract !== undefined){
if(data.display_episode_policy_sha256 === undefined){
const err34 = {instancePath,schemaPath:"#/dependentRequired",keyword:"dependentRequired",params:{property: "display_episode_contract",
    missingProperty: "display_episode_policy_sha256",
    depsCount: 2,
    deps: "display_episode_policy_sha256, display_episode_lineage_sha256"},message:"must have properties display_episode_policy_sha256, display_episode_lineage_sha256 when property display_episode_contract is present"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data.display_episode_lineage_sha256 === undefined){
const err35 = {instancePath,schemaPath:"#/dependentRequired",keyword:"dependentRequired",params:{property: "display_episode_contract",
    missingProperty: "display_episode_lineage_sha256",
    depsCount: 2,
    deps: "display_episode_policy_sha256, display_episode_lineage_sha256"},message:"must have properties display_episode_policy_sha256, display_episode_lineage_sha256 when property display_episode_contract is present"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.display_episode_policy_sha256 !== undefined){
if(data.display_episode_contract === undefined){
const err36 = {instancePath,schemaPath:"#/dependentRequired",keyword:"dependentRequired",params:{property: "display_episode_policy_sha256",
    missingProperty: "display_episode_contract",
    depsCount: 2,
    deps: "display_episode_contract, display_episode_lineage_sha256"},message:"must have properties display_episode_contract, display_episode_lineage_sha256 when property display_episode_policy_sha256 is present"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data.display_episode_lineage_sha256 === undefined){
const err37 = {instancePath,schemaPath:"#/dependentRequired",keyword:"dependentRequired",params:{property: "display_episode_policy_sha256",
    missingProperty: "display_episode_lineage_sha256",
    depsCount: 2,
    deps: "display_episode_contract, display_episode_lineage_sha256"},message:"must have properties display_episode_contract, display_episode_lineage_sha256 when property display_episode_policy_sha256 is present"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.display_episode_lineage_sha256 !== undefined){
if(data.display_episode_contract === undefined){
const err38 = {instancePath,schemaPath:"#/dependentRequired",keyword:"dependentRequired",params:{property: "display_episode_lineage_sha256",
    missingProperty: "display_episode_contract",
    depsCount: 2,
    deps: "display_episode_contract, display_episode_policy_sha256"},message:"must have properties display_episode_contract, display_episode_policy_sha256 when property display_episode_lineage_sha256 is present"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data.display_episode_policy_sha256 === undefined){
const err39 = {instancePath,schemaPath:"#/dependentRequired",keyword:"dependentRequired",params:{property: "display_episode_lineage_sha256",
    missingProperty: "display_episode_policy_sha256",
    depsCount: 2,
    deps: "display_episode_contract, display_episode_policy_sha256"},message:"must have properties display_episode_contract, display_episode_policy_sha256 when property display_episode_lineage_sha256 is present"};
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
const err40 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
validate530.errors = vErrors;
return errors === 0;
}
validate530.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate517(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate517.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.release === undefined) && (missing0 = "release")){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
if(data.release !== undefined){
let data0 = data.release;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
let missing1;
if((data0.display_episode_contract === undefined) && (missing1 = "display_episode_contract")){
const err1 = {};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
else {
if(data0.display_episode_contract !== undefined){
if("single-item-history-display-episode/2" !== data0.display_episode_contract){
const err2 = {};
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
}
}
}
}
var _valid0 = _errs3 === errors;
errors = _errs2;
if(vErrors !== null){
if(_errs2){
vErrors.length = _errs2;
}
else {
vErrors = null;
}
}
if(_valid0){
const _errs6 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.members !== undefined){
let data2 = data.members;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(!(validate518(data3, {instancePath:instancePath+"/members/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate518.errors : vErrors.concat(validate518.errors);
errors = vErrors.length;
}
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.display_episode_timeline_scope === undefined){
const err3 = {instancePath:instancePath+"/members/" + i0,schemaPath:"#/$defs/display_episode_member_requirements/required",keyword:"required",params:{missingProperty: "display_episode_timeline_scope"},message:"must have required property '"+"display_episode_timeline_scope"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data3.display_episode_source_cycle_count === undefined){
const err4 = {instancePath:instancePath+"/members/" + i0,schemaPath:"#/$defs/display_episode_member_requirements/required",keyword:"required",params:{missingProperty: "display_episode_source_cycle_count"},message:"must have required property '"+"display_episode_source_cycle_count"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data3.group_timeline_includes_other_variants === undefined){
const err5 = {instancePath:instancePath+"/members/" + i0,schemaPath:"#/$defs/display_episode_member_requirements/required",keyword:"required",params:{missingProperty: "group_timeline_includes_other_variants"},message:"must have required property '"+"group_timeline_includes_other_variants"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data3.representative_native === undefined){
const err6 = {instancePath:instancePath+"/members/" + i0,schemaPath:"#/$defs/display_episode_member_requirements/required",keyword:"required",params:{missingProperty: "representative_native"},message:"must have required property '"+"representative_native"+"'"};
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
const err7 = {instancePath:instancePath+"/members/" + i0,schemaPath:"#/$defs/display_episode_member_requirements/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
}
var _valid0 = _errs6 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.members = true;
props0.release = true;
}
}
if(!valid1){
const err8 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.contract_name === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_name"},message:"must have required property '"+"contract_name"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.contract_version === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_version"},message:"must have required property '"+"contract_version"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.response_kind === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.operation === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation"},message:"must have required property '"+"operation"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.publication === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication"},message:"must have required property '"+"publication"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.snapshot === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.release === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "release"},message:"must have required property '"+"release"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.sort === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sort"},message:"must have required property '"+"sort"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.page_size === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.members === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.next_cursor === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema900.properties, key0))){
const err20 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.contract_name !== undefined){
if("single-item-history-public-api" !== data.contract_name){
const err21 = {instancePath:instancePath+"/contract_name",schemaPath:"#/properties/contract_name/const",keyword:"const",params:{allowedValue: "single-item-history-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.contract_version !== undefined){
if("1" !== data.contract_version){
const err22 = {instancePath:instancePath+"/contract_version",schemaPath:"#/properties/contract_version/const",keyword:"const",params:{allowedValue: "1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("RESULT" !== data.response_kind){
const err23 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "RESULT"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.operation !== undefined){
let data7 = data.operation;
if(!((data7 === "LIST") || (data7 === "DETAIL"))){
const err24 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/enum",keyword:"enum",params:{allowedValues: schema900.properties.operation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.publication !== undefined){
if(!(validate526(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate526.errors : vErrors.concat(validate526.errors);
errors = vErrors.length;
}
}
if(data.snapshot !== undefined){
if(!(validate528(data.snapshot, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate528.errors : vErrors.concat(validate528.errors);
errors = vErrors.length;
}
}
if(data.release !== undefined){
if(!(validate530(data.release, {instancePath:instancePath+"/release",parentData:data,parentDataProperty:"release",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate530.errors : vErrors.concat(validate530.errors);
errors = vErrors.length;
}
}
if(data.sort !== undefined){
let data11 = data.sort;
if(!((data11 === "MAX_PRICE_MULTIPLE_DESC") || (data11 === "SUPPLY_ONSET_DESC"))){
const err25 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/enum",keyword:"enum",params:{allowedValues: schema900.properties.sort.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.page_size !== undefined){
let data12 = data.page_size;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err26 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 > 100 || isNaN(data12)){
const err27 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data12 < 1 || isNaN(data12)){
const err28 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
}
if(data.members !== undefined){
let data13 = data.members;
if(Array.isArray(data13)){
if(data13.length > 100){
const err29 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 100},message:"must NOT have more than 100 items"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data13.length < 1){
const err30 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
const len1 = data13.length;
for(let i1=0; i1<len1; i1++){
if(!(validate518(data13[i1], {instancePath:instancePath+"/members/" + i1,parentData:data13,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate518.errors : vErrors.concat(validate518.errors);
errors = vErrors.length;
}
}
}
else {
const err31 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data15 = data.next_cursor;
const _errs28 = errors;
let valid12 = false;
let passing0 = null;
const _errs29 = errors;
if(typeof data15 === "string"){
if(func2(data15) > 4096){
const err32 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(func2(data15) < 1){
const err33 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err34 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
var _valid1 = _errs29 === errors;
if(_valid1){
valid12 = true;
passing0 = 0;
}
const _errs31 = errors;
if(data15 !== null){
const err35 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
var _valid1 = _errs31 === errors;
if(_valid1 && valid12){
valid12 = false;
passing0 = [passing0, 1];
}
else {
if(_valid1){
valid12 = true;
passing0 = 1;
}
}
if(!valid12){
const err36 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
else {
errors = _errs28;
if(vErrors !== null){
if(_errs28){
vErrors.length = _errs28;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err37 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
validate517.errors = vErrors;
return errors === 0;
}
validate517.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate516(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:single-item-history-public-api:v1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate516.evaluated;
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
if(!(validate517(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate517.errors : vErrors.concat(validate517.errors);
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
if(data.contract_name === undefined){
const err0 = {instancePath,schemaPath:"#/$defs/error/required",keyword:"required",params:{missingProperty: "contract_name"},message:"must have required property '"+"contract_name"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.contract_version === undefined){
const err1 = {instancePath,schemaPath:"#/$defs/error/required",keyword:"required",params:{missingProperty: "contract_version"},message:"must have required property '"+"contract_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.response_kind === undefined){
const err2 = {instancePath,schemaPath:"#/$defs/error/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.error === undefined){
const err3 = {instancePath,schemaPath:"#/$defs/error/required",keyword:"required",params:{missingProperty: "error"},message:"must have required property '"+"error"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "contract_name") || (key0 === "contract_version")) || (key0 === "response_kind")) || (key0 === "error"))){
const err4 = {instancePath,schemaPath:"#/$defs/error/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.contract_name !== undefined){
if("single-item-history-public-api" !== data.contract_name){
const err5 = {instancePath:instancePath+"/contract_name",schemaPath:"#/$defs/error/properties/contract_name/const",keyword:"const",params:{allowedValue: "single-item-history-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.contract_version !== undefined){
if("1" !== data.contract_version){
const err6 = {instancePath:instancePath+"/contract_version",schemaPath:"#/$defs/error/properties/contract_version/const",keyword:"const",params:{allowedValue: "1"},message:"must be equal to constant"};
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
const err7 = {instancePath:instancePath+"/response_kind",schemaPath:"#/$defs/error/properties/response_kind/const",keyword:"const",params:{allowedValue: "ERROR"},message:"must be equal to constant"};
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
const err8 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/properties/error/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data3.retryable === undefined){
const err9 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/properties/error/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
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
const err10 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/properties/error/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
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
if(!(((((((data4 === "INVALID_REQUEST") || (data4 === "NOT_PUBLISHED")) || (data4 === "NOT_FOUND")) || (data4 === "WITHDRAWN")) || (data4 === "STALE_EXPIRED")) || (data4 === "CORRUPT_PUBLICATION")) || (data4 === "TEMPORARILY_UNAVAILABLE"))){
const err11 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/properties/error/properties/code/enum",keyword:"enum",params:{allowedValues: schema952.properties.error.properties.code.enum},message:"must be equal to one of the allowed values"};
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
const err12 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/properties/error/properties/retryable/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
const err13 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/properties/error/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err14 = {instancePath,schemaPath:"#/$defs/error/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
validate516.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate516.evaluated = {"dynamicProps":true,"dynamicItems":false};
