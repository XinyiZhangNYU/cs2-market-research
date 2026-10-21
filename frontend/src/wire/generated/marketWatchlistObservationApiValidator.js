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
export const validateMarketWatchlistObservationApiResponse = validate318;
const schema486 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:market-watchlist-public-observation-api:v1","title":"CS2 public item observation API V1","oneOf":[{"$ref":"#/$defs/watchlistResponse"},{"$ref":"#/$defs/detailResponse"},{"$ref":"#/$defs/errorResponse"}],"$defs":{"sha256":{"type":"string","pattern":"^[0-9a-f]{64}$"},"timestamp":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},"identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"nullableTimestamp":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]},"nullableSha256":{"oneOf":[{"$ref":"#/$defs/sha256"},{"type":"null"}]},"reasonCodes":{"type":"array","minItems":1,"maxItems":5,"uniqueItems":true,"items":{"enum":["COINCIDENT","FIRST_ENTRY","RECENT_PERSISTENT","REENTRY","SUPPLY_LEAD"]}},"qualityReasonCodes":{"type":"array","uniqueItems":true,"items":{"enum":["CLOCK_SKEW","INPUT_GAP","OPTIONAL_SOURCE_UNAVAILABLE","STALE_RETAINED"]}},"sourceCoverage":{"type":"object","additionalProperties":false,"required":["status","expected_source_count","observed_source_count","observation_count"],"properties":{"status":{"const":"COMPLETE"},"expected_source_count":{"type":"integer","minimum":1,"maximum":64},"observed_source_count":{"type":"integer","minimum":1,"maximum":64},"observation_count":{"type":"integer","minimum":1,"maximum":10000000}}},"dataQuality":{"type":"object","additionalProperties":false,"required":["status","reason_codes"],"properties":{"status":{"enum":["COMPLETE","DEGRADED_OPTIONAL"]},"reason_codes":{"$ref":"#/$defs/qualityReasonCodes"}},"allOf":[{"if":{"properties":{"status":{"const":"COMPLETE"}}},"then":{"properties":{"reason_codes":{"maxItems":0}}},"else":{"properties":{"reason_codes":{"minItems":1}}}}]},"catalogDescriptor":{"type":"object","additionalProperties":false,"required":["snapshot_id","catalog_version","as_of","available_at","member_count","member_set_hash"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_version":{"$ref":"#/$defs/identifier"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"member_count":{"type":"integer","minimum":0},"member_set_hash":{"$ref":"#/$defs/sha256"}}},"catalogLocalizedName":{"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"zh_cn":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"}}},"catalogMedia":{"oneOf":[{"type":"object","additionalProperties":false,"required":["status"],"properties":{"status":{"const":"NOT_PRODUCED"}}},{"type":"object","additionalProperties":false,"required":["status","media_asset_version_id","media_key","presentation_kind"],"properties":{"status":{"const":"BOUND"},"media_asset_version_id":{"type":"string","pattern":"^[1-9][0-9]*$"},"media_key":{"type":"string","maxLength":256,"pattern":"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$","not":{"pattern":"(^|/)\\.{1,2}(/|$)"}},"presentation_kind":{"enum":["SERIES_REPRESENTATIVE","STYLE_REPRESENTATIVE"]}}}]},"catalogProjection":{"type":"object","additionalProperties":false,"required":["analysis_unit_id","parent_analysis_unit_id","analysis_unit_kind","item_kind","base_item_code","edition_kind","wear_tier","localized_name","media","catalog_version"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"base_item_code":{"$ref":"#/$defs/identifier"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/catalogLocalizedName"},"media":{"$ref":"#/$defs/catalogMedia"},"catalog_version":{"$ref":"#/$defs/identifier"}}},"producerRelease":{"type":"object","additionalProperties":false,"required":["release_code","algorithm_version","data_quality_policy_version","input_contract_version"],"properties":{"release_code":{"$ref":"#/$defs/identifier"},"algorithm_version":{"$ref":"#/$defs/identifier"},"data_quality_policy_version":{"$ref":"#/$defs/identifier"},"input_contract_version":{"const":"market-watchlist-observation-input/1"}}},"policy":{"type":"object","additionalProperties":false,"required":["policy_code","policy_version","order"],"properties":{"policy_code":{"const":"SYSTEM_PROSPECTIVE_ITEM_OBSERVATION_V1"},"policy_version":{"const":"v1"},"order":{"const":"SIGNAL_TIME_DESC"}}},"publicPurpose":{"type":"object","additionalProperties":false,"required":["purpose_code","rights_version_label","terms_sha256","distribution_mode"],"properties":{"purpose_code":{"const":"CS2_ROTATE_BOUNDED_ITEM_OBSERVATION_PAGE_V1"},"rights_version_label":{"const":"upstream-bounded-item-observation-page-2026-09-06"},"terms_sha256":{"const":"547a6a0d29f78f038ca785c60aad1788b8d7acd628322fc0c54799ccea1be1e9"},"distribution_mode":{"const":"BOUNDED_SAME_ORIGIN_DERIVED_PAGE"}}},"publication":{"type":"object","additionalProperties":false,"required":["publication_id","manifest_hash","as_of","known_at","public_available_at","published_at","fresh_until","retain_until","freshness","supersedes_publication_id","producer_release","policy","public_purpose","catalog","source_coverage","data_quality"],"properties":{"publication_id":{"$ref":"#/$defs/sha256"},"manifest_hash":{"$ref":"#/$defs/sha256"},"as_of":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"public_available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"fresh_until":{"$ref":"#/$defs/timestamp"},"retain_until":{"$ref":"#/$defs/timestamp"},"freshness":{"enum":["FRESH","STALE_RETAINED"]},"supersedes_publication_id":{"$ref":"#/$defs/nullableSha256"},"producer_release":{"$ref":"#/$defs/producerRelease"},"policy":{"$ref":"#/$defs/policy"},"public_purpose":{"$ref":"#/$defs/publicPurpose"},"catalog":{"$ref":"#/$defs/catalogDescriptor"},"source_coverage":{"$ref":"#/$defs/sourceCoverage"},"data_quality":{"$ref":"#/$defs/dataQuality"}}},"member":{"type":"object","additionalProperties":false,"required":["position","lane","validation_status","observation_id","analysis_unit_id","signal_observed_at","known_at","reason_codes","source_coverage","data_quality","catalog"],"properties":{"position":{"type":"integer","minimum":1,"maximum":500},"lane":{"const":"OBSERVATION"},"validation_status":{"const":"SHADOW_UNVALIDATED"},"observation_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"signal_observed_at":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"reason_codes":{"$ref":"#/$defs/reasonCodes"},"source_coverage":{"$ref":"#/$defs/sourceCoverage"},"data_quality":{"$ref":"#/$defs/dataQuality"},"catalog":{"$ref":"#/$defs/catalogProjection"}}},"listQuery":{"type":"object","additionalProperties":false,"required":["as_of","query_known_at","publication_id","sort","page_size","cursor"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/sha256"},"sort":{"const":"SIGNAL_TIME_DESC"},"page_size":{"type":"integer","minimum":1,"maximum":100},"cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}},"watchlistResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","lane","validation_status","query","publication","total","members","next_cursor"],"properties":{"api_contract":{"const":"market-watchlist-public-observation-api"},"api_version":{"const":"v1"},"response_kind":{"const":"OBSERVATION_WATCHLIST"},"lane":{"const":"OBSERVATION"},"validation_status":{"const":"SHADOW_UNVALIDATED"},"query":{"$ref":"#/$defs/listQuery"},"publication":{"$ref":"#/$defs/publication"},"total":{"type":"integer","minimum":0,"maximum":500},"members":{"type":"array","items":{"$ref":"#/$defs/member"}},"next_cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}},"detailQuery":{"type":"object","additionalProperties":false,"required":["query_known_at","publication_id","analysis_unit_id"],"properties":{"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"}}},"detailResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","lane","validation_status","query","publication","member"],"properties":{"api_contract":{"const":"market-watchlist-public-observation-api"},"api_version":{"const":"v1"},"response_kind":{"const":"OBSERVATION_DETAIL"},"lane":{"const":"OBSERVATION"},"validation_status":{"const":"SHADOW_UNVALIDATED"},"query":{"$ref":"#/$defs/detailQuery"},"publication":{"$ref":"#/$defs/publication"},"member":{"$ref":"#/$defs/member"}}},"errorResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"market-watchlist-public-observation-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","NOT_PUBLISHED","NOT_FOUND","BACKEND_UNAVAILABLE","PUBLICATION_EXPIRED","PUBLICATION_WITHDRAWN","RESULT_CORRUPT"]},"retryable":{"type":"boolean"}}}}}}};
const schema538 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"market-watchlist-public-observation-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","NOT_PUBLISHED","NOT_FOUND","BACKEND_UNAVAILABLE","PUBLICATION_EXPIRED","PUBLICATION_WITHDRAWN","RESULT_CORRUPT"]},"retryable":{"type":"boolean"}}}}};
const schema487 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","lane","validation_status","query","publication","total","members","next_cursor"],"properties":{"api_contract":{"const":"market-watchlist-public-observation-api"},"api_version":{"const":"v1"},"response_kind":{"const":"OBSERVATION_WATCHLIST"},"lane":{"const":"OBSERVATION"},"validation_status":{"const":"SHADOW_UNVALIDATED"},"query":{"$ref":"#/$defs/listQuery"},"publication":{"$ref":"#/$defs/publication"},"total":{"type":"integer","minimum":0,"maximum":500},"members":{"type":"array","items":{"$ref":"#/$defs/member"}},"next_cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}};
const func9 = Object.prototype.hasOwnProperty;
const func2 = __wireUcs2Length;
const schema488 = {"type":"object","additionalProperties":false,"required":["as_of","query_known_at","publication_id","sort","page_size","cursor"],"properties":{"as_of":{"$ref":"#/$defs/nullableTimestamp"},"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/sha256"},"sort":{"const":"SIGNAL_TIME_DESC"},"page_size":{"type":"integer","minimum":1,"maximum":100},"cursor":{"type":["string","null"],"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"}}};
const schema490 = {"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"};
const schema492 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const schema489 = {"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]};
const pattern19 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$", "u");

function validate321(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate321.evaluated;
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
validate321.errors = vErrors;
return errors === 0;
}
validate321.evaluated = {"dynamicProps":false,"dynamicItems":false};

const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");
const pattern73 = new RegExp("^[A-Za-z0-9_-]+$", "u");

function validate320(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate320.evaluated;
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
if(!(validate321(data.as_of, {instancePath:instancePath+"/as_of",parentData:data,parentDataProperty:"as_of",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate321.errors : vErrors.concat(validate321.errors);
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
let data2 = data.publication_id;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err9 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err10 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.sort !== undefined){
if("SIGNAL_TIME_DESC" !== data.sort){
const err11 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/const",keyword:"const",params:{allowedValue: "SIGNAL_TIME_DESC"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.page_size !== undefined){
let data4 = data.page_size;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err12 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 100 || isNaN(data4)){
const err13 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data4 < 1 || isNaN(data4)){
const err14 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.cursor !== undefined){
let data5 = data.cursor;
if((typeof data5 !== "string") && (data5 !== null)){
const err15 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/type",keyword:"type",params:{type: schema488.properties.cursor.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(typeof data5 === "string"){
if(func2(data5) > 8192){
const err16 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern73.test(data5)){
const err17 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
validate320.errors = vErrors;
return errors === 0;
}
validate320.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema493 = {"type":"object","additionalProperties":false,"required":["publication_id","manifest_hash","as_of","known_at","public_available_at","published_at","fresh_until","retain_until","freshness","supersedes_publication_id","producer_release","policy","public_purpose","catalog","source_coverage","data_quality"],"properties":{"publication_id":{"$ref":"#/$defs/sha256"},"manifest_hash":{"$ref":"#/$defs/sha256"},"as_of":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"public_available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"fresh_until":{"$ref":"#/$defs/timestamp"},"retain_until":{"$ref":"#/$defs/timestamp"},"freshness":{"enum":["FRESH","STALE_RETAINED"]},"supersedes_publication_id":{"$ref":"#/$defs/nullableSha256"},"producer_release":{"$ref":"#/$defs/producerRelease"},"policy":{"$ref":"#/$defs/policy"},"public_purpose":{"$ref":"#/$defs/publicPurpose"},"catalog":{"$ref":"#/$defs/catalogDescriptor"},"source_coverage":{"$ref":"#/$defs/sourceCoverage"},"data_quality":{"$ref":"#/$defs/dataQuality"}}};
const schema508 = {"type":"object","additionalProperties":false,"required":["policy_code","policy_version","order"],"properties":{"policy_code":{"const":"SYSTEM_PROSPECTIVE_ITEM_OBSERVATION_V1"},"policy_version":{"const":"v1"},"order":{"const":"SIGNAL_TIME_DESC"}}};
const schema509 = {"type":"object","additionalProperties":false,"required":["purpose_code","rights_version_label","terms_sha256","distribution_mode"],"properties":{"purpose_code":{"const":"CS2_ROTATE_BOUNDED_ITEM_OBSERVATION_PAGE_V1"},"rights_version_label":{"const":"upstream-bounded-item-observation-page-2026-09-06"},"terms_sha256":{"const":"547a6a0d29f78f038ca785c60aad1788b8d7acd628322fc0c54799ccea1be1e9"},"distribution_mode":{"const":"BOUNDED_SAME_ORIGIN_DERIVED_PAGE"}}};
const schema516 = {"type":"object","additionalProperties":false,"required":["status","expected_source_count","observed_source_count","observation_count"],"properties":{"status":{"const":"COMPLETE"},"expected_source_count":{"type":"integer","minimum":1,"maximum":64},"observed_source_count":{"type":"integer","minimum":1,"maximum":64},"observation_count":{"type":"integer","minimum":1,"maximum":10000000}}};
const schema502 = {"oneOf":[{"$ref":"#/$defs/sha256"},{"type":"null"}]};

function validate325(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate325.evaluated;
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
validate325.errors = vErrors;
return errors === 0;
}
validate325.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema504 = {"type":"object","additionalProperties":false,"required":["release_code","algorithm_version","data_quality_policy_version","input_contract_version"],"properties":{"release_code":{"$ref":"#/$defs/identifier"},"algorithm_version":{"$ref":"#/$defs/identifier"},"data_quality_policy_version":{"$ref":"#/$defs/identifier"},"input_contract_version":{"const":"market-watchlist-observation-input/1"}}};
const schema505 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"};
const pattern87 = new RegExp("^[^\\u0000-\\u001f\\u007f]+$", "u");

function validate327(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate327.evaluated;
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
if(data.input_contract_version === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_contract_version"},message:"must have required property '"+"input_contract_version"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "release_code") || (key0 === "algorithm_version")) || (key0 === "data_quality_policy_version")) || (key0 === "input_contract_version"))){
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
if(data.data_quality_policy_version !== undefined){
let data2 = data.data_quality_policy_version;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err13 = {instancePath:instancePath+"/data_quality_policy_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
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
if(data.input_contract_version !== undefined){
if("market-watchlist-observation-input/1" !== data.input_contract_version){
const err17 = {instancePath:instancePath+"/input_contract_version",schemaPath:"#/properties/input_contract_version/const",keyword:"const",params:{allowedValue: "market-watchlist-observation-input/1"},message:"must be equal to constant"};
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
validate327.errors = vErrors;
return errors === 0;
}
validate327.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema510 = {"type":"object","additionalProperties":false,"required":["snapshot_id","catalog_version","as_of","available_at","member_count","member_set_hash"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_version":{"$ref":"#/$defs/identifier"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"member_count":{"type":"integer","minimum":0},"member_set_hash":{"$ref":"#/$defs/sha256"}}};

function validate329(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate329.evaluated;
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
validate329.errors = vErrors;
return errors === 0;
}
validate329.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema517 = {"type":"object","additionalProperties":false,"required":["status","reason_codes"],"properties":{"status":{"enum":["COMPLETE","DEGRADED_OPTIONAL"]},"reason_codes":{"$ref":"#/$defs/qualityReasonCodes"}},"allOf":[{"if":{"properties":{"status":{"const":"COMPLETE"}}},"then":{"properties":{"reason_codes":{"maxItems":0}}},"else":{"properties":{"reason_codes":{"minItems":1}}}}]};
const schema518 = {"type":"array","uniqueItems":true,"items":{"enum":["CLOCK_SKEW","INPUT_GAP","OPTIONAL_SOURCE_UNAVAILABLE","STALE_RETAINED"]}};
const func0 = __wireEqual;

function validate331(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate331.evaluated;
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
if(data.status !== undefined){
if("COMPLETE" !== data.status){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
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
let ifClause0;
if(_valid0){
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.reason_codes !== undefined){
let data1 = data.reason_codes;
if(Array.isArray(data1)){
if(data1.length > 0){
const err1 = {instancePath:instancePath+"/reason_codes",schemaPath:"#/allOf/0/then/properties/reason_codes/maxItems",keyword:"maxItems",params:{limit: 0},message:"must NOT have more than 0 items"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.reason_codes = true;
props0.status = true;
}
ifClause0 = "then";
}
else {
const _errs7 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.reason_codes !== undefined){
let data2 = data.reason_codes;
if(Array.isArray(data2)){
if(data2.length < 1){
const err2 = {instancePath:instancePath+"/reason_codes",schemaPath:"#/allOf/0/else/properties/reason_codes/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
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
var _valid0 = _errs7 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.reason_codes = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err3 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.reason_codes === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason_codes"},message:"must have required property '"+"reason_codes"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "status") || (key0 === "reason_codes"))){
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
if(data.status !== undefined){
let data3 = data.status;
if(!((data3 === "COMPLETE") || (data3 === "DEGRADED_OPTIONAL"))){
const err7 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema517.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.reason_codes !== undefined){
let data4 = data.reason_codes;
if(Array.isArray(data4)){
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
let data5 = data4[i0];
if(!((((data5 === "CLOCK_SKEW") || (data5 === "INPUT_GAP")) || (data5 === "OPTIONAL_SOURCE_UNAVAILABLE")) || (data5 === "STALE_RETAINED"))){
const err8 = {instancePath:instancePath+"/reason_codes/" + i0,schemaPath:"#/$defs/qualityReasonCodes/items/enum",keyword:"enum",params:{allowedValues: schema518.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
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
const err9 = {instancePath:instancePath+"/reason_codes",schemaPath:"#/$defs/qualityReasonCodes/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err10 = {instancePath:instancePath+"/reason_codes",schemaPath:"#/$defs/qualityReasonCodes/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
validate331.errors = vErrors;
return errors === 0;
}
validate331.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate324(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate324.evaluated;
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
if(data.known_at === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "known_at"},message:"must have required property '"+"known_at"+"'"};
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
if(data.policy === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "policy"},message:"must have required property '"+"policy"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.public_purpose === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "public_purpose"},message:"must have required property '"+"public_purpose"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.catalog === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog"},message:"must have required property '"+"catalog"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.source_coverage === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_coverage"},message:"must have required property '"+"source_coverage"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.data_quality === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_quality"},message:"must have required property '"+"data_quality"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema493.properties, key0))){
const err16 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.publication_id !== undefined){
let data0 = data.publication_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err17 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err18 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.manifest_hash !== undefined){
let data1 = data.manifest_hash;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err19 = {instancePath:instancePath+"/manifest_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err20 = {instancePath:instancePath+"/manifest_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.as_of !== undefined){
let data2 = data.as_of;
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
const err21 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err22 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.known_at !== undefined){
let data3 = data.known_at;
if(typeof data3 === "string"){
if(!pattern19.test(data3)){
const err23 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err24 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.public_available_at !== undefined){
let data4 = data.public_available_at;
if(typeof data4 === "string"){
if(!pattern19.test(data4)){
const err25 = {instancePath:instancePath+"/public_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err26 = {instancePath:instancePath+"/public_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.published_at !== undefined){
let data5 = data.published_at;
if(typeof data5 === "string"){
if(!pattern19.test(data5)){
const err27 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
else {
const err28 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.fresh_until !== undefined){
let data6 = data.fresh_until;
if(typeof data6 === "string"){
if(!pattern19.test(data6)){
const err29 = {instancePath:instancePath+"/fresh_until",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
else {
const err30 = {instancePath:instancePath+"/fresh_until",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.retain_until !== undefined){
let data7 = data.retain_until;
if(typeof data7 === "string"){
if(!pattern19.test(data7)){
const err31 = {instancePath:instancePath+"/retain_until",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err32 = {instancePath:instancePath+"/retain_until",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.freshness !== undefined){
let data8 = data.freshness;
if(!((data8 === "FRESH") || (data8 === "STALE_RETAINED"))){
const err33 = {instancePath:instancePath+"/freshness",schemaPath:"#/properties/freshness/enum",keyword:"enum",params:{allowedValues: schema493.properties.freshness.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.supersedes_publication_id !== undefined){
if(!(validate325(data.supersedes_publication_id, {instancePath:instancePath+"/supersedes_publication_id",parentData:data,parentDataProperty:"supersedes_publication_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate325.errors : vErrors.concat(validate325.errors);
errors = vErrors.length;
}
}
if(data.producer_release !== undefined){
if(!(validate327(data.producer_release, {instancePath:instancePath+"/producer_release",parentData:data,parentDataProperty:"producer_release",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate327.errors : vErrors.concat(validate327.errors);
errors = vErrors.length;
}
}
if(data.policy !== undefined){
let data11 = data.policy;
if(data11 && typeof data11 == "object" && !Array.isArray(data11)){
if(data11.policy_code === undefined){
const err34 = {instancePath:instancePath+"/policy",schemaPath:"#/$defs/policy/required",keyword:"required",params:{missingProperty: "policy_code"},message:"must have required property '"+"policy_code"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data11.policy_version === undefined){
const err35 = {instancePath:instancePath+"/policy",schemaPath:"#/$defs/policy/required",keyword:"required",params:{missingProperty: "policy_version"},message:"must have required property '"+"policy_version"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data11.order === undefined){
const err36 = {instancePath:instancePath+"/policy",schemaPath:"#/$defs/policy/required",keyword:"required",params:{missingProperty: "order"},message:"must have required property '"+"order"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
for(const key1 in data11){
if(!(((key1 === "policy_code") || (key1 === "policy_version")) || (key1 === "order"))){
const err37 = {instancePath:instancePath+"/policy",schemaPath:"#/$defs/policy/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data11.policy_code !== undefined){
if("SYSTEM_PROSPECTIVE_ITEM_OBSERVATION_V1" !== data11.policy_code){
const err38 = {instancePath:instancePath+"/policy/policy_code",schemaPath:"#/$defs/policy/properties/policy_code/const",keyword:"const",params:{allowedValue: "SYSTEM_PROSPECTIVE_ITEM_OBSERVATION_V1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data11.policy_version !== undefined){
if("v1" !== data11.policy_version){
const err39 = {instancePath:instancePath+"/policy/policy_version",schemaPath:"#/$defs/policy/properties/policy_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data11.order !== undefined){
if("SIGNAL_TIME_DESC" !== data11.order){
const err40 = {instancePath:instancePath+"/policy/order",schemaPath:"#/$defs/policy/properties/order/const",keyword:"const",params:{allowedValue: "SIGNAL_TIME_DESC"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
}
else {
const err41 = {instancePath:instancePath+"/policy",schemaPath:"#/$defs/policy/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.public_purpose !== undefined){
let data15 = data.public_purpose;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.purpose_code === undefined){
const err42 = {instancePath:instancePath+"/public_purpose",schemaPath:"#/$defs/publicPurpose/required",keyword:"required",params:{missingProperty: "purpose_code"},message:"must have required property '"+"purpose_code"+"'"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data15.rights_version_label === undefined){
const err43 = {instancePath:instancePath+"/public_purpose",schemaPath:"#/$defs/publicPurpose/required",keyword:"required",params:{missingProperty: "rights_version_label"},message:"must have required property '"+"rights_version_label"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data15.terms_sha256 === undefined){
const err44 = {instancePath:instancePath+"/public_purpose",schemaPath:"#/$defs/publicPurpose/required",keyword:"required",params:{missingProperty: "terms_sha256"},message:"must have required property '"+"terms_sha256"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data15.distribution_mode === undefined){
const err45 = {instancePath:instancePath+"/public_purpose",schemaPath:"#/$defs/publicPurpose/required",keyword:"required",params:{missingProperty: "distribution_mode"},message:"must have required property '"+"distribution_mode"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
for(const key2 in data15){
if(!((((key2 === "purpose_code") || (key2 === "rights_version_label")) || (key2 === "terms_sha256")) || (key2 === "distribution_mode"))){
const err46 = {instancePath:instancePath+"/public_purpose",schemaPath:"#/$defs/publicPurpose/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data15.purpose_code !== undefined){
if("CS2_ROTATE_BOUNDED_ITEM_OBSERVATION_PAGE_V1" !== data15.purpose_code){
const err47 = {instancePath:instancePath+"/public_purpose/purpose_code",schemaPath:"#/$defs/publicPurpose/properties/purpose_code/const",keyword:"const",params:{allowedValue: "CS2_ROTATE_BOUNDED_ITEM_OBSERVATION_PAGE_V1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data15.rights_version_label !== undefined){
if("upstream-bounded-item-observation-page-2026-09-06" !== data15.rights_version_label){
const err48 = {instancePath:instancePath+"/public_purpose/rights_version_label",schemaPath:"#/$defs/publicPurpose/properties/rights_version_label/const",keyword:"const",params:{allowedValue: "upstream-bounded-item-observation-page-2026-09-06"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data15.terms_sha256 !== undefined){
if("547a6a0d29f78f038ca785c60aad1788b8d7acd628322fc0c54799ccea1be1e9" !== data15.terms_sha256){
const err49 = {instancePath:instancePath+"/public_purpose/terms_sha256",schemaPath:"#/$defs/publicPurpose/properties/terms_sha256/const",keyword:"const",params:{allowedValue: "547a6a0d29f78f038ca785c60aad1788b8d7acd628322fc0c54799ccea1be1e9"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data15.distribution_mode !== undefined){
if("BOUNDED_SAME_ORIGIN_DERIVED_PAGE" !== data15.distribution_mode){
const err50 = {instancePath:instancePath+"/public_purpose/distribution_mode",schemaPath:"#/$defs/publicPurpose/properties/distribution_mode/const",keyword:"const",params:{allowedValue: "BOUNDED_SAME_ORIGIN_DERIVED_PAGE"},message:"must be equal to constant"};
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
else {
const err51 = {instancePath:instancePath+"/public_purpose",schemaPath:"#/$defs/publicPurpose/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data.catalog !== undefined){
if(!(validate329(data.catalog, {instancePath:instancePath+"/catalog",parentData:data,parentDataProperty:"catalog",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate329.errors : vErrors.concat(validate329.errors);
errors = vErrors.length;
}
}
if(data.source_coverage !== undefined){
let data21 = data.source_coverage;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.status === undefined){
const err52 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(data21.expected_source_count === undefined){
const err53 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/required",keyword:"required",params:{missingProperty: "expected_source_count"},message:"must have required property '"+"expected_source_count"+"'"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data21.observed_source_count === undefined){
const err54 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/required",keyword:"required",params:{missingProperty: "observed_source_count"},message:"must have required property '"+"observed_source_count"+"'"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data21.observation_count === undefined){
const err55 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/required",keyword:"required",params:{missingProperty: "observation_count"},message:"must have required property '"+"observation_count"+"'"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
for(const key3 in data21){
if(!((((key3 === "status") || (key3 === "expected_source_count")) || (key3 === "observed_source_count")) || (key3 === "observation_count"))){
const err56 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data21.status !== undefined){
if("COMPLETE" !== data21.status){
const err57 = {instancePath:instancePath+"/source_coverage/status",schemaPath:"#/$defs/sourceCoverage/properties/status/const",keyword:"const",params:{allowedValue: "COMPLETE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data21.expected_source_count !== undefined){
let data23 = data21.expected_source_count;
if(!(((typeof data23 == "number") && (!(data23 % 1) && !isNaN(data23))) && (isFinite(data23)))){
const err58 = {instancePath:instancePath+"/source_coverage/expected_source_count",schemaPath:"#/$defs/sourceCoverage/properties/expected_source_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if((typeof data23 == "number") && (isFinite(data23))){
if(data23 > 64 || isNaN(data23)){
const err59 = {instancePath:instancePath+"/source_coverage/expected_source_count",schemaPath:"#/$defs/sourceCoverage/properties/expected_source_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 64},message:"must be <= 64"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data23 < 1 || isNaN(data23)){
const err60 = {instancePath:instancePath+"/source_coverage/expected_source_count",schemaPath:"#/$defs/sourceCoverage/properties/expected_source_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data21.observed_source_count !== undefined){
let data24 = data21.observed_source_count;
if(!(((typeof data24 == "number") && (!(data24 % 1) && !isNaN(data24))) && (isFinite(data24)))){
const err61 = {instancePath:instancePath+"/source_coverage/observed_source_count",schemaPath:"#/$defs/sourceCoverage/properties/observed_source_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if((typeof data24 == "number") && (isFinite(data24))){
if(data24 > 64 || isNaN(data24)){
const err62 = {instancePath:instancePath+"/source_coverage/observed_source_count",schemaPath:"#/$defs/sourceCoverage/properties/observed_source_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 64},message:"must be <= 64"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data24 < 1 || isNaN(data24)){
const err63 = {instancePath:instancePath+"/source_coverage/observed_source_count",schemaPath:"#/$defs/sourceCoverage/properties/observed_source_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
}
if(data21.observation_count !== undefined){
let data25 = data21.observation_count;
if(!(((typeof data25 == "number") && (!(data25 % 1) && !isNaN(data25))) && (isFinite(data25)))){
const err64 = {instancePath:instancePath+"/source_coverage/observation_count",schemaPath:"#/$defs/sourceCoverage/properties/observation_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if((typeof data25 == "number") && (isFinite(data25))){
if(data25 > 10000000 || isNaN(data25)){
const err65 = {instancePath:instancePath+"/source_coverage/observation_count",schemaPath:"#/$defs/sourceCoverage/properties/observation_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 10000000},message:"must be <= 10000000"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data25 < 1 || isNaN(data25)){
const err66 = {instancePath:instancePath+"/source_coverage/observation_count",schemaPath:"#/$defs/sourceCoverage/properties/observation_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
}
else {
const err67 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data.data_quality !== undefined){
if(!(validate331(data.data_quality, {instancePath:instancePath+"/data_quality",parentData:data,parentDataProperty:"data_quality",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate331.errors : vErrors.concat(validate331.errors);
errors = vErrors.length;
}
}
}
else {
const err68 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
validate324.errors = vErrors;
return errors === 0;
}
validate324.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema519 = {"type":"object","additionalProperties":false,"required":["position","lane","validation_status","observation_id","analysis_unit_id","signal_observed_at","known_at","reason_codes","source_coverage","data_quality","catalog"],"properties":{"position":{"type":"integer","minimum":1,"maximum":500},"lane":{"const":"OBSERVATION"},"validation_status":{"const":"SHADOW_UNVALIDATED"},"observation_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"signal_observed_at":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"reason_codes":{"$ref":"#/$defs/reasonCodes"},"source_coverage":{"$ref":"#/$defs/sourceCoverage"},"data_quality":{"$ref":"#/$defs/dataQuality"},"catalog":{"$ref":"#/$defs/catalogProjection"}}};
const schema524 = {"type":"array","minItems":1,"maxItems":5,"uniqueItems":true,"items":{"enum":["COINCIDENT","FIRST_ENTRY","RECENT_PERSISTENT","REENTRY","SUPPLY_LEAD"]}};
const schema526 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","parent_analysis_unit_id","analysis_unit_kind","item_kind","base_item_code","edition_kind","wear_tier","localized_name","media","catalog_version"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"base_item_code":{"$ref":"#/$defs/identifier"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/catalogLocalizedName"},"media":{"$ref":"#/$defs/catalogMedia"},"catalog_version":{"$ref":"#/$defs/identifier"}}};
const schema530 = {"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"zh_cn":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"}}};
const schema531 = {"oneOf":[{"type":"object","additionalProperties":false,"required":["status"],"properties":{"status":{"const":"NOT_PRODUCED"}}},{"type":"object","additionalProperties":false,"required":["status","media_asset_version_id","media_key","presentation_kind"],"properties":{"status":{"const":"BOUND"},"media_asset_version_id":{"type":"string","pattern":"^[1-9][0-9]*$"},"media_key":{"type":"string","maxLength":256,"pattern":"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$","not":{"pattern":"(^|/)\\.{1,2}(/|$)"}},"presentation_kind":{"enum":["SERIES_REPRESENTATIVE","STYLE_REPRESENTATIVE"]}}}]};
const pattern97 = new RegExp("^[1-9][0-9]*$", "u");
const pattern94 = new RegExp("(^|/)\\.{1,2}(/|$)", "u");
const pattern95 = new RegExp("^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$", "u");

function validate336(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate336.evaluated;
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
if(!(func9.call(schema526.properties, key0))){
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
const err21 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema526.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
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
const err22 = {instancePath:instancePath+"/item_kind",schemaPath:"#/properties/item_kind/enum",keyword:"enum",params:{allowedValues: schema526.properties.item_kind.enum},message:"must be equal to one of the allowed values"};
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
const err27 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema526.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
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
const err28 = {instancePath:instancePath+"/wear_tier",schemaPath:"#/properties/wear_tier/enum",keyword:"enum",params:{allowedValues: schema526.properties.wear_tier.enum},message:"must be equal to one of the allowed values"};
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
let data10 = data.media;
const _errs29 = errors;
let valid8 = false;
let passing1 = null;
const _errs30 = errors;
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
if(data10.status === undefined){
const err41 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf/0/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
for(const key2 in data10){
if(!(key2 === "status")){
const err42 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data10.status !== undefined){
if("NOT_PRODUCED" !== data10.status){
const err43 = {instancePath:instancePath+"/media/status",schemaPath:"#/$defs/catalogMedia/oneOf/0/properties/status/const",keyword:"const",params:{allowedValue: "NOT_PRODUCED"},message:"must be equal to constant"};
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
const err44 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
var _valid1 = _errs30 === errors;
if(_valid1){
valid8 = true;
passing1 = 0;
var props0 = true;
}
const _errs34 = errors;
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
if(data10.status === undefined){
const err45 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf/1/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data10.media_asset_version_id === undefined){
const err46 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf/1/required",keyword:"required",params:{missingProperty: "media_asset_version_id"},message:"must have required property '"+"media_asset_version_id"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data10.media_key === undefined){
const err47 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf/1/required",keyword:"required",params:{missingProperty: "media_key"},message:"must have required property '"+"media_key"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data10.presentation_kind === undefined){
const err48 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf/1/required",keyword:"required",params:{missingProperty: "presentation_kind"},message:"must have required property '"+"presentation_kind"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
for(const key3 in data10){
if(!((((key3 === "status") || (key3 === "media_asset_version_id")) || (key3 === "media_key")) || (key3 === "presentation_kind"))){
const err49 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data10.status !== undefined){
if("BOUND" !== data10.status){
const err50 = {instancePath:instancePath+"/media/status",schemaPath:"#/$defs/catalogMedia/oneOf/1/properties/status/const",keyword:"const",params:{allowedValue: "BOUND"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data10.media_asset_version_id !== undefined){
let data13 = data10.media_asset_version_id;
if(typeof data13 === "string"){
if(!pattern97.test(data13)){
const err51 = {instancePath:instancePath+"/media/media_asset_version_id",schemaPath:"#/$defs/catalogMedia/oneOf/1/properties/media_asset_version_id/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]*$"},message:"must match pattern \""+"^[1-9][0-9]*$"+"\""};
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
const err52 = {instancePath:instancePath+"/media/media_asset_version_id",schemaPath:"#/$defs/catalogMedia/oneOf/1/properties/media_asset_version_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data10.media_key !== undefined){
let data14 = data10.media_key;
const _errs42 = errors;
const _errs43 = errors;
if(typeof data14 === "string"){
if(!pattern94.test(data14)){
const err53 = {};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
var valid11 = _errs43 === errors;
if(valid11){
const err54 = {instancePath:instancePath+"/media/media_key",schemaPath:"#/$defs/catalogMedia/oneOf/1/properties/media_key/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
else {
errors = _errs42;
if(vErrors !== null){
if(_errs42){
vErrors.length = _errs42;
}
else {
vErrors = null;
}
}
}
if(typeof data14 === "string"){
if(func2(data14) > 256){
const err55 = {instancePath:instancePath+"/media/media_key",schemaPath:"#/$defs/catalogMedia/oneOf/1/properties/media_key/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(!pattern95.test(data14)){
const err56 = {instancePath:instancePath+"/media/media_key",schemaPath:"#/$defs/catalogMedia/oneOf/1/properties/media_key/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$"},message:"must match pattern \""+"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*$"+"\""};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
else {
const err57 = {instancePath:instancePath+"/media/media_key",schemaPath:"#/$defs/catalogMedia/oneOf/1/properties/media_key/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data10.presentation_kind !== undefined){
let data15 = data10.presentation_kind;
if(!((data15 === "SERIES_REPRESENTATIVE") || (data15 === "STYLE_REPRESENTATIVE"))){
const err58 = {instancePath:instancePath+"/media/presentation_kind",schemaPath:"#/$defs/catalogMedia/oneOf/1/properties/presentation_kind/enum",keyword:"enum",params:{allowedValues: schema531.oneOf[1].properties.presentation_kind.enum},message:"must be equal to one of the allowed values"};
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
else {
const err59 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
var _valid1 = _errs34 === errors;
if(_valid1 && valid8){
valid8 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid8 = true;
passing1 = 1;
if(props0 !== true){
props0 = true;
}
}
}
if(!valid8){
const err60 = {instancePath:instancePath+"/media",schemaPath:"#/$defs/catalogMedia/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
else {
errors = _errs29;
if(vErrors !== null){
if(_errs29){
vErrors.length = _errs29;
}
else {
vErrors = null;
}
}
}
}
if(data.catalog_version !== undefined){
let data16 = data.catalog_version;
if(typeof data16 === "string"){
if(func2(data16) > 256){
const err61 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(func2(data16) < 1){
const err62 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(!pattern87.test(data16)){
const err63 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
else {
const err64 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err65 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
validate336.errors = vErrors;
return errors === 0;
}
validate336.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate334(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate334.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.position === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "position"},message:"must have required property '"+"position"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.lane === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "lane"},message:"must have required property '"+"lane"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.validation_status === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "validation_status"},message:"must have required property '"+"validation_status"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.observation_id === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observation_id"},message:"must have required property '"+"observation_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.analysis_unit_id === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.signal_observed_at === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "signal_observed_at"},message:"must have required property '"+"signal_observed_at"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.known_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "known_at"},message:"must have required property '"+"known_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.reason_codes === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason_codes"},message:"must have required property '"+"reason_codes"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.source_coverage === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_coverage"},message:"must have required property '"+"source_coverage"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.data_quality === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_quality"},message:"must have required property '"+"data_quality"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.catalog === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog"},message:"must have required property '"+"catalog"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema519.properties, key0))){
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
if(data.position !== undefined){
let data0 = data.position;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err12 = {instancePath:instancePath+"/position",schemaPath:"#/properties/position/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 500 || isNaN(data0)){
const err13 = {instancePath:instancePath+"/position",schemaPath:"#/properties/position/maximum",keyword:"maximum",params:{comparison: "<=", limit: 500},message:"must be <= 500"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data0 < 1 || isNaN(data0)){
const err14 = {instancePath:instancePath+"/position",schemaPath:"#/properties/position/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.lane !== undefined){
if("OBSERVATION" !== data.lane){
const err15 = {instancePath:instancePath+"/lane",schemaPath:"#/properties/lane/const",keyword:"const",params:{allowedValue: "OBSERVATION"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.validation_status !== undefined){
if("SHADOW_UNVALIDATED" !== data.validation_status){
const err16 = {instancePath:instancePath+"/validation_status",schemaPath:"#/properties/validation_status/const",keyword:"const",params:{allowedValue: "SHADOW_UNVALIDATED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.observation_id !== undefined){
let data3 = data.observation_id;
if(typeof data3 === "string"){
if(!pattern5.test(data3)){
const err17 = {instancePath:instancePath+"/observation_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err18 = {instancePath:instancePath+"/observation_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data4 = data.analysis_unit_id;
if(typeof data4 === "string"){
if(func2(data4) > 256){
const err19 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(func2(data4) < 1){
const err20 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!pattern87.test(data4)){
const err21 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err22 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.signal_observed_at !== undefined){
let data5 = data.signal_observed_at;
if(typeof data5 === "string"){
if(!pattern19.test(data5)){
const err23 = {instancePath:instancePath+"/signal_observed_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err24 = {instancePath:instancePath+"/signal_observed_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.known_at !== undefined){
let data6 = data.known_at;
if(typeof data6 === "string"){
if(!pattern19.test(data6)){
const err25 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err26 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.reason_codes !== undefined){
let data7 = data.reason_codes;
if(Array.isArray(data7)){
if(data7.length > 5){
const err27 = {instancePath:instancePath+"/reason_codes",schemaPath:"#/$defs/reasonCodes/maxItems",keyword:"maxItems",params:{limit: 5},message:"must NOT have more than 5 items"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data7.length < 1){
const err28 = {instancePath:instancePath+"/reason_codes",schemaPath:"#/$defs/reasonCodes/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if(!(((((data8 === "COINCIDENT") || (data8 === "FIRST_ENTRY")) || (data8 === "RECENT_PERSISTENT")) || (data8 === "REENTRY")) || (data8 === "SUPPLY_LEAD"))){
const err29 = {instancePath:instancePath+"/reason_codes/" + i0,schemaPath:"#/$defs/reasonCodes/items/enum",keyword:"enum",params:{allowedValues: schema524.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
let i1 = data7.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data7[i1], data7[j0])){
const err30 = {instancePath:instancePath+"/reason_codes",schemaPath:"#/$defs/reasonCodes/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err31 = {instancePath:instancePath+"/reason_codes",schemaPath:"#/$defs/reasonCodes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.source_coverage !== undefined){
let data9 = data.source_coverage;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.status === undefined){
const err32 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data9.expected_source_count === undefined){
const err33 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/required",keyword:"required",params:{missingProperty: "expected_source_count"},message:"must have required property '"+"expected_source_count"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data9.observed_source_count === undefined){
const err34 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/required",keyword:"required",params:{missingProperty: "observed_source_count"},message:"must have required property '"+"observed_source_count"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data9.observation_count === undefined){
const err35 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/required",keyword:"required",params:{missingProperty: "observation_count"},message:"must have required property '"+"observation_count"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
for(const key1 in data9){
if(!((((key1 === "status") || (key1 === "expected_source_count")) || (key1 === "observed_source_count")) || (key1 === "observation_count"))){
const err36 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data9.status !== undefined){
if("COMPLETE" !== data9.status){
const err37 = {instancePath:instancePath+"/source_coverage/status",schemaPath:"#/$defs/sourceCoverage/properties/status/const",keyword:"const",params:{allowedValue: "COMPLETE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data9.expected_source_count !== undefined){
let data11 = data9.expected_source_count;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err38 = {instancePath:instancePath+"/source_coverage/expected_source_count",schemaPath:"#/$defs/sourceCoverage/properties/expected_source_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 > 64 || isNaN(data11)){
const err39 = {instancePath:instancePath+"/source_coverage/expected_source_count",schemaPath:"#/$defs/sourceCoverage/properties/expected_source_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 64},message:"must be <= 64"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data11 < 1 || isNaN(data11)){
const err40 = {instancePath:instancePath+"/source_coverage/expected_source_count",schemaPath:"#/$defs/sourceCoverage/properties/expected_source_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
}
if(data9.observed_source_count !== undefined){
let data12 = data9.observed_source_count;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err41 = {instancePath:instancePath+"/source_coverage/observed_source_count",schemaPath:"#/$defs/sourceCoverage/properties/observed_source_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 > 64 || isNaN(data12)){
const err42 = {instancePath:instancePath+"/source_coverage/observed_source_count",schemaPath:"#/$defs/sourceCoverage/properties/observed_source_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 64},message:"must be <= 64"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data12 < 1 || isNaN(data12)){
const err43 = {instancePath:instancePath+"/source_coverage/observed_source_count",schemaPath:"#/$defs/sourceCoverage/properties/observed_source_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data9.observation_count !== undefined){
let data13 = data9.observation_count;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err44 = {instancePath:instancePath+"/source_coverage/observation_count",schemaPath:"#/$defs/sourceCoverage/properties/observation_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 > 10000000 || isNaN(data13)){
const err45 = {instancePath:instancePath+"/source_coverage/observation_count",schemaPath:"#/$defs/sourceCoverage/properties/observation_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 10000000},message:"must be <= 10000000"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data13 < 1 || isNaN(data13)){
const err46 = {instancePath:instancePath+"/source_coverage/observation_count",schemaPath:"#/$defs/sourceCoverage/properties/observation_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
}
else {
const err47 = {instancePath:instancePath+"/source_coverage",schemaPath:"#/$defs/sourceCoverage/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data.data_quality !== undefined){
if(!(validate331(data.data_quality, {instancePath:instancePath+"/data_quality",parentData:data,parentDataProperty:"data_quality",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate331.errors : vErrors.concat(validate331.errors);
errors = vErrors.length;
}
}
if(data.catalog !== undefined){
if(!(validate336(data.catalog, {instancePath:instancePath+"/catalog",parentData:data,parentDataProperty:"catalog",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate336.errors : vErrors.concat(validate336.errors);
errors = vErrors.length;
}
}
}
else {
const err48 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
validate334.errors = vErrors;
return errors === 0;
}
validate334.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate319(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate319.evaluated;
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
if(data.lane === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "lane"},message:"must have required property '"+"lane"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.validation_status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "validation_status"},message:"must have required property '"+"validation_status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.query === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.publication === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication"},message:"must have required property '"+"publication"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.total === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "total"},message:"must have required property '"+"total"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.members === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.next_cursor === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema487.properties, key0))){
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
if("market-watchlist-public-observation-api" !== data.api_contract){
const err11 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "market-watchlist-public-observation-api"},message:"must be equal to constant"};
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
if(data.response_kind !== undefined){
if("OBSERVATION_WATCHLIST" !== data.response_kind){
const err13 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "OBSERVATION_WATCHLIST"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.lane !== undefined){
if("OBSERVATION" !== data.lane){
const err14 = {instancePath:instancePath+"/lane",schemaPath:"#/properties/lane/const",keyword:"const",params:{allowedValue: "OBSERVATION"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.validation_status !== undefined){
if("SHADOW_UNVALIDATED" !== data.validation_status){
const err15 = {instancePath:instancePath+"/validation_status",schemaPath:"#/properties/validation_status/const",keyword:"const",params:{allowedValue: "SHADOW_UNVALIDATED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.query !== undefined){
if(!(validate320(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate320.errors : vErrors.concat(validate320.errors);
errors = vErrors.length;
}
}
if(data.publication !== undefined){
if(!(validate324(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate324.errors : vErrors.concat(validate324.errors);
errors = vErrors.length;
}
}
if(data.total !== undefined){
let data7 = data.total;
if(!(((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7))) && (isFinite(data7)))){
const err16 = {instancePath:instancePath+"/total",schemaPath:"#/properties/total/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if((typeof data7 == "number") && (isFinite(data7))){
if(data7 > 500 || isNaN(data7)){
const err17 = {instancePath:instancePath+"/total",schemaPath:"#/properties/total/maximum",keyword:"maximum",params:{comparison: "<=", limit: 500},message:"must be <= 500"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data7 < 0 || isNaN(data7)){
const err18 = {instancePath:instancePath+"/total",schemaPath:"#/properties/total/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.members !== undefined){
let data8 = data.members;
if(Array.isArray(data8)){
const len0 = data8.length;
for(let i0=0; i0<len0; i0++){
if(!(validate334(data8[i0], {instancePath:instancePath+"/members/" + i0,parentData:data8,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate334.errors : vErrors.concat(validate334.errors);
errors = vErrors.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data10 = data.next_cursor;
if((typeof data10 !== "string") && (data10 !== null)){
const err20 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/type",keyword:"type",params:{type: schema487.properties.next_cursor.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(typeof data10 === "string"){
if(func2(data10) > 8192){
const err21 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(!pattern73.test(data10)){
const err22 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
validate319.errors = vErrors;
return errors === 0;
}
validate319.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema533 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","lane","validation_status","query","publication","member"],"properties":{"api_contract":{"const":"market-watchlist-public-observation-api"},"api_version":{"const":"v1"},"response_kind":{"const":"OBSERVATION_DETAIL"},"lane":{"const":"OBSERVATION"},"validation_status":{"const":"SHADOW_UNVALIDATED"},"query":{"$ref":"#/$defs/detailQuery"},"publication":{"$ref":"#/$defs/publication"},"member":{"$ref":"#/$defs/member"}}};
const schema534 = {"type":"object","additionalProperties":false,"required":["query_known_at","publication_id","analysis_unit_id"],"properties":{"query_known_at":{"$ref":"#/$defs/timestamp"},"publication_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"}}};

function validate341(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate341.evaluated;
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
for(const key0 in data){
if(!(((key0 === "query_known_at") || (key0 === "publication_id")) || (key0 === "analysis_unit_id"))){
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
if(data.query_known_at !== undefined){
let data0 = data.query_known_at;
if(typeof data0 === "string"){
if(!pattern19.test(data0)){
const err4 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/query_known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.publication_id !== undefined){
let data1 = data.publication_id;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err6 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err7 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data2 = data.analysis_unit_id;
if(typeof data2 === "string"){
if(func2(data2) > 256){
const err8 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(func2(data2) < 1){
const err9 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern87.test(data2)){
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
validate341.errors = vErrors;
return errors === 0;
}
validate341.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate340(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate340.evaluated;
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
if(data.lane === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "lane"},message:"must have required property '"+"lane"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.validation_status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "validation_status"},message:"must have required property '"+"validation_status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.query === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.publication === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication"},message:"must have required property '"+"publication"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.member === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member"},message:"must have required property '"+"member"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "lane")) || (key0 === "validation_status")) || (key0 === "query")) || (key0 === "publication")) || (key0 === "member"))){
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
if("market-watchlist-public-observation-api" !== data.api_contract){
const err9 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "market-watchlist-public-observation-api"},message:"must be equal to constant"};
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
if("OBSERVATION_DETAIL" !== data.response_kind){
const err11 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "OBSERVATION_DETAIL"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.lane !== undefined){
if("OBSERVATION" !== data.lane){
const err12 = {instancePath:instancePath+"/lane",schemaPath:"#/properties/lane/const",keyword:"const",params:{allowedValue: "OBSERVATION"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.validation_status !== undefined){
if("SHADOW_UNVALIDATED" !== data.validation_status){
const err13 = {instancePath:instancePath+"/validation_status",schemaPath:"#/properties/validation_status/const",keyword:"const",params:{allowedValue: "SHADOW_UNVALIDATED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.query !== undefined){
if(!(validate341(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate341.errors : vErrors.concat(validate341.errors);
errors = vErrors.length;
}
}
if(data.publication !== undefined){
if(!(validate324(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate324.errors : vErrors.concat(validate324.errors);
errors = vErrors.length;
}
}
if(data.member !== undefined){
if(!(validate334(data.member, {instancePath:instancePath+"/member",parentData:data,parentDataProperty:"member",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate334.errors : vErrors.concat(validate334.errors);
errors = vErrors.length;
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
validate340.errors = vErrors;
return errors === 0;
}
validate340.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate318(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:market-watchlist-public-observation-api:v1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate318.evaluated;
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
if(!(validate319(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate319.errors : vErrors.concat(validate319.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate340(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate340.errors : vErrors.concat(validate340.errors);
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
if("market-watchlist-public-observation-api" !== data.api_contract){
const err5 = {instancePath:instancePath+"/api_contract",schemaPath:"#/$defs/errorResponse/properties/api_contract/const",keyword:"const",params:{allowedValue: "market-watchlist-public-observation-api"},message:"must be equal to constant"};
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
const err11 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/properties/code/enum",keyword:"enum",params:{allowedValues: schema538.properties.error.properties.code.enum},message:"must be equal to one of the allowed values"};
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
validate318.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate318.evaluated = {"dynamicProps":true,"dynamicItems":false};
