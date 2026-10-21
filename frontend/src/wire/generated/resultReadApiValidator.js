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
export const validateResultReadApiResponse = validate54;
const schema125 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:result-read-api:v1","title":"CS2 provider-neutral result read API v1","oneOf":[{"$ref":"#/$defs/unit_detail"},{"$ref":"#/$defs/unit_list"},{"$ref":"#/$defs/collection_detail"},{"$ref":"#/$defs/quality_detail"},{"$ref":"#/$defs/quality_list"},{"$ref":"#/$defs/error_response"}],"$defs":{"storage_metadata":{"type":"object","additionalProperties":false,"required":["published_at","document_hash"],"properties":{"published_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"document_hash":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/sha256"}}},"unit_resource":{"type":"object","additionalProperties":false,"required":["envelope","storage"],"properties":{"envelope":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/unit_result"},"storage":{"$ref":"#/$defs/storage_metadata"}}},"collection_resource":{"type":"object","additionalProperties":false,"required":["envelope","storage"],"properties":{"envelope":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/collection_result"},"storage":{"$ref":"#/$defs/storage_metadata"}}},"quality_resource":{"type":"object","additionalProperties":false,"required":["envelope","storage"],"properties":{"envelope":{"$ref":"urn:cs2-research:research-quality-envelope:v1"},"storage":{"$ref":"#/$defs/storage_metadata"}}},"query_binding":{"type":"object","additionalProperties":false,"required":["as_of","scope_kind","analysis_unit_kind","edition_kind","parent_analysis_unit_id","data_status","sort","page_size"],"properties":{"as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"scope_kind":{"enum":["MARKET","SECTOR","ITEM",null]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT",null]},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN",null]},"parent_analysis_unit_id":{"oneOf":[{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},{"type":"null"}]},"data_status":{"oneOf":[{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/data_status"},{"type":"null"}]},"sort":{"const":"ANALYSIS_UNIT_ID_ASC"},"page_size":{"type":"integer","minimum":1,"maximum":200}},"allOf":[{"if":{"anyOf":[{"properties":{"analysis_unit_kind":{"not":{"type":"null"}}}},{"properties":{"edition_kind":{"not":{"type":"null"}}}},{"properties":{"parent_analysis_unit_id":{"not":{"type":"null"}}}}]},"then":{"properties":{"scope_kind":{"const":"ITEM"}}}},{"if":{"properties":{"analysis_unit_kind":{"const":"BASE_MHN"}},"required":["analysis_unit_kind"]},"then":{"properties":{"parent_analysis_unit_id":{"type":"null"}}}}]},"quality_query_binding":{"type":"object","additionalProperties":false,"required":["as_of","analysis_unit_kind","edition_kind","parent_analysis_unit_id","sort","page_size"],"properties":{"as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT",null]},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN",null]},"parent_analysis_unit_id":{"oneOf":[{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},{"type":"null"}]},"sort":{"const":"ANALYSIS_UNIT_ID_ASC"},"page_size":{"type":"integer","minimum":1,"maximum":200}},"allOf":[{"if":{"properties":{"analysis_unit_kind":{"const":"BASE_MHN"}},"required":["analysis_unit_kind"]},"then":{"properties":{"parent_analysis_unit_id":{"type":"null"}}}}]},"unit_detail":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query_as_of","resource"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"UNIT_DETAIL"},"query_as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"resource":{"$ref":"#/$defs/unit_resource"}}},"collection_detail":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query_as_of","resource"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"COLLECTION_DETAIL"},"query_as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"resource":{"$ref":"#/$defs/collection_resource"}}},"quality_detail":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query_as_of","resource"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"QUALITY_DETAIL"},"query_as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"resource":{"$ref":"#/$defs/quality_resource"}}},"unit_list":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","members","next_cursor"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"UNIT_LIST"},"query":{"$ref":"#/$defs/query_binding"},"members":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/unit_resource"}},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]}}},"quality_list":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","members","next_cursor"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"QUALITY_LIST"},"query":{"$ref":"#/$defs/quality_query_binding"},"members":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/quality_resource"}},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]}}},"error":{"oneOf":[{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR"]},"http_status":{"const":400},"retryable":{"const":false}}},{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"const":"NOT_FOUND"},"http_status":{"const":404},"retryable":{"const":false}}},{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"enum":["CONTRACT_UNAVAILABLE","BACKEND_UNAVAILABLE"]},"http_status":{"const":503},"retryable":{"const":true}}},{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"const":"RESULT_CORRUPT"},"http_status":{"const":503},"retryable":{"const":false}}}]},"error_response":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"error":{"$ref":"#/$defs/error"}}}}};
const schema126 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query_as_of","resource"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"UNIT_DETAIL"},"query_as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"resource":{"$ref":"#/$defs/unit_resource"}}};
const schema63 = {"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"};
const formats0 = __wireFullFormats["date-time"];
const pattern19 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$", "u");
const schema128 = {"type":"object","additionalProperties":false,"required":["envelope","storage"],"properties":{"envelope":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/unit_result"},"storage":{"$ref":"#/$defs/storage_metadata"}}};
const schema32 = {"type":"object","additionalProperties":false,"required":["snapshot_id","contract_code","contract_version","envelope_kind","identity","as_of","available_at","data_branch","data_status","versions","state","recommendation_detail","evidence_domains","claims"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"contract_code":{"const":"research-result-envelope"},"contract_version":{"const":"v1"},"envelope_kind":{"const":"UNIT"},"identity":{"$ref":"#/$defs/identity"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"data_branch":{"$ref":"#/$defs/data_branch"},"data_status":{"$ref":"#/$defs/data_status"},"versions":{"$ref":"#/$defs/versions"},"state":{"oneOf":[{"$ref":"#/$defs/market_state"},{"$ref":"#/$defs/sector_state"},{"$ref":"#/$defs/item_state"}]},"recommendation_detail":{"oneOf":[{"$ref":"#/$defs/recommendation_detail"},{"type":"null"}]},"evidence_domains":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/evidence_domain"}},"claims":{"type":"array","uniqueItems":true,"items":{"enum":["UNIFIED_PRICE_RISING","BID_PRICE_RISING","BUY_DEMAND_STRENGTHENING","SELLABLE_SUPPLY_DECLINING","MULTI_SOURCE_ALIGNED","TRUSTED_TRADE_VOLUME_INCREASING","SWEEPING_CONFIRMED"]}}},"allOf":[{"if":{"properties":{"identity":{"type":"object","properties":{"scope_kind":{"const":"MARKET"}},"required":["scope_kind"]}},"required":["identity"]},"then":{"properties":{"state":{"$ref":"#/$defs/market_state"},"recommendation_detail":{"type":"null"},"evidence_domains":{"type":"array","maxItems":0},"claims":{"type":"array","maxItems":0}}}},{"if":{"properties":{"identity":{"type":"object","properties":{"scope_kind":{"const":"SECTOR"}},"required":["scope_kind"]}},"required":["identity"]},"then":{"properties":{"state":{"$ref":"#/$defs/sector_state"},"recommendation_detail":{"type":"null"},"evidence_domains":{"type":"array","maxItems":0},"claims":{"type":"array","maxItems":0}}}},{"if":{"properties":{"identity":{"type":"object","properties":{"scope_kind":{"const":"ITEM"}},"required":["scope_kind"]}},"required":["identity"]},"then":{"properties":{"state":{"$ref":"#/$defs/item_state"},"recommendation_detail":{"$ref":"#/$defs/recommendation_detail"},"evidence_domains":{"type":"array","minItems":3,"maxItems":3,"allOf":[{"contains":{"type":"object","properties":{"domain":{"const":"P"}},"required":["domain"]}},{"contains":{"type":"object","properties":{"domain":{"const":"D"}},"required":["domain"]}},{"contains":{"type":"object","properties":{"domain":{"const":"S"}},"required":["domain"]}}]}}}},{"if":{"properties":{"data_branch":{"const":"B"},"identity":{"type":"object","properties":{"scope_kind":{"const":"ITEM"}},"required":["scope_kind"]}},"required":["data_branch","identity"]},"then":{"properties":{"recommendation_detail":{"allOf":[{"$ref":"#/$defs/recommendation_detail"},{"type":"object","properties":{"trade_confirmation":{"const":"UNAVAILABLE"}}}]},"claims":{"type":"array","not":{"contains":{"enum":["TRUSTED_TRADE_VOLUME_INCREASING","SWEEPING_CONFIRMED"]}}}}}}]};
const schema38 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const schema68 = {"enum":["A","B"]};
const schema69 = {"enum":["COMPLETE","UNAVAILABLE_BY_DESIGN","DEGRADED_OPTIONAL","DATA_UNAVAILABLE_RUNTIME_GRACE","STALE_GRACE","DATA_UNAVAILABLE_RUNTIME","STALE","CONFLICTED"]};
const schema33 = {"type":"object","additionalProperties":false,"required":["trend_stage","level_regime","evidence_flags","recommendation","case_status","analysis_case_id","input_snapshot_hash"],"properties":{"trend_stage":{"enum":["UP_BUILDING","UP_ACTIVE","UP_COOLING","NEUTRAL","DOWN_BUILDING","DOWN_ACTIVE","DOWN_COOLING"]},"level_regime":{"enum":["DEPRESSED","NORMAL","ELEVATED","UNKNOWN"]},"evidence_flags":{"$ref":"#/$defs/evidence_flags"},"recommendation":{"$ref":"#/$defs/recommendation"},"case_status":{"$ref":"#/$defs/nullable_case_status"},"analysis_case_id":{"oneOf":[{"$ref":"#/$defs/nonblank_text"},{"type":"null"}]},"input_snapshot_hash":{"$ref":"#/$defs/sha256"}}};
const schema34 = {"type":"array","uniqueItems":true,"items":{"enum":["DEMAND_ACCELERATING","SUPPLY_CONTRACTING","PRICE_RISING","SUSPECTED_SWEEPING","SWEEPING_CONFIRMED","REACCELERATION","OVERHEATED","SHOCK","BREADTH_COLLAPSE","LIQUIDITY_CONTRACTION","CONCENTRATION_WARNING"]}};
const schema35 = {"enum":["IGNORE","WATCH","RECOMMENDED_CANDIDATE","STRONG_CANDIDATE","OVERHEATED_DO_NOT_CHASE","COOLING_REMOVE_FROM_PRIORITY","WITHHELD_DATA_INCOMPLETE"]};
const schema36 = {"type":["string","null"],"enum":["ACTIVE","SUSPENDED","RESOLVED","UNRESOLVED","RETRACTED",null]};
const schema37 = {"type":"string","minLength":1,"pattern":"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"};
const func0 = __wireEqual;
const func2 = __wireUcs2Length;
const pattern4 = new RegExp("^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$", "u");
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");

function validate22(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate22.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.trend_stage === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trend_stage"},message:"must have required property '"+"trend_stage"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.level_regime === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "level_regime"},message:"must have required property '"+"level_regime"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.evidence_flags === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_flags"},message:"must have required property '"+"evidence_flags"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.recommendation === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommendation"},message:"must have required property '"+"recommendation"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.case_status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "case_status"},message:"must have required property '"+"case_status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.analysis_case_id === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_case_id"},message:"must have required property '"+"analysis_case_id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.input_snapshot_hash === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_snapshot_hash"},message:"must have required property '"+"input_snapshot_hash"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "trend_stage") || (key0 === "level_regime")) || (key0 === "evidence_flags")) || (key0 === "recommendation")) || (key0 === "case_status")) || (key0 === "analysis_case_id")) || (key0 === "input_snapshot_hash"))){
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
if(data.trend_stage !== undefined){
let data0 = data.trend_stage;
if(!(((((((data0 === "UP_BUILDING") || (data0 === "UP_ACTIVE")) || (data0 === "UP_COOLING")) || (data0 === "NEUTRAL")) || (data0 === "DOWN_BUILDING")) || (data0 === "DOWN_ACTIVE")) || (data0 === "DOWN_COOLING"))){
const err8 = {instancePath:instancePath+"/trend_stage",schemaPath:"#/properties/trend_stage/enum",keyword:"enum",params:{allowedValues: schema33.properties.trend_stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.level_regime !== undefined){
let data1 = data.level_regime;
if(!((((data1 === "DEPRESSED") || (data1 === "NORMAL")) || (data1 === "ELEVATED")) || (data1 === "UNKNOWN"))){
const err9 = {instancePath:instancePath+"/level_regime",schemaPath:"#/properties/level_regime/enum",keyword:"enum",params:{allowedValues: schema33.properties.level_regime.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.evidence_flags !== undefined){
let data2 = data.evidence_flags;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(!(((((((((((data3 === "DEMAND_ACCELERATING") || (data3 === "SUPPLY_CONTRACTING")) || (data3 === "PRICE_RISING")) || (data3 === "SUSPECTED_SWEEPING")) || (data3 === "SWEEPING_CONFIRMED")) || (data3 === "REACCELERATION")) || (data3 === "OVERHEATED")) || (data3 === "SHOCK")) || (data3 === "BREADTH_COLLAPSE")) || (data3 === "LIQUIDITY_CONTRACTION")) || (data3 === "CONCENTRATION_WARNING"))){
const err10 = {instancePath:instancePath+"/evidence_flags/" + i0,schemaPath:"#/$defs/evidence_flags/items/enum",keyword:"enum",params:{allowedValues: schema34.items.enum},message:"must be equal to one of the allowed values"};
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
const err11 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidence_flags/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
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
const err12 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidence_flags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.recommendation !== undefined){
let data4 = data.recommendation;
if(!(((((((data4 === "IGNORE") || (data4 === "WATCH")) || (data4 === "RECOMMENDED_CANDIDATE")) || (data4 === "STRONG_CANDIDATE")) || (data4 === "OVERHEATED_DO_NOT_CHASE")) || (data4 === "COOLING_REMOVE_FROM_PRIORITY")) || (data4 === "WITHHELD_DATA_INCOMPLETE"))){
const err13 = {instancePath:instancePath+"/recommendation",schemaPath:"#/$defs/recommendation/enum",keyword:"enum",params:{allowedValues: schema35.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.case_status !== undefined){
let data5 = data.case_status;
if((typeof data5 !== "string") && (data5 !== null)){
const err14 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/nullable_case_status/type",keyword:"type",params:{type: schema36.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!((((((data5 === "ACTIVE") || (data5 === "SUSPENDED")) || (data5 === "RESOLVED")) || (data5 === "UNRESOLVED")) || (data5 === "RETRACTED")) || (data5 === null))){
const err15 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/nullable_case_status/enum",keyword:"enum",params:{allowedValues: schema36.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.analysis_case_id !== undefined){
let data6 = data.analysis_case_id;
const _errs14 = errors;
let valid7 = false;
let passing0 = null;
const _errs15 = errors;
if(typeof data6 === "string"){
if(func2(data6) < 1){
const err16 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern4.test(data6)){
const err17 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err18 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid0 = _errs15 === errors;
if(_valid0){
valid7 = true;
passing0 = 0;
}
const _errs18 = errors;
if(data6 !== null){
const err19 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/properties/analysis_case_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid0 = _errs18 === errors;
if(_valid0 && valid7){
valid7 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid7 = true;
passing0 = 1;
}
}
if(!valid7){
const err20 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/properties/analysis_case_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
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
if(data.input_snapshot_hash !== undefined){
let data7 = data.input_snapshot_hash;
if(typeof data7 === "string"){
if(!pattern5.test(data7)){
const err21 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err22 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema39 = {"type":"object","additionalProperties":false,"required":["trend_stage","relative_strength","breadth","evidence_flags","recommendation","case_status","analysis_case_id","input_snapshot_hash"],"properties":{"trend_stage":{"enum":["UP_BUILDING","UP_ACTIVE","UP_COOLING","NEUTRAL","DOWN_BUILDING","DOWN_ACTIVE","DOWN_COOLING"]},"relative_strength":{"enum":["LEADING","IN_LINE","LAGGING","UNKNOWN"]},"breadth":{"type":"object","additionalProperties":false,"required":["advancing_member_ratio","median_member_return","breadth_expanding","breadth_narrowing","concentration_warning"],"properties":{"advancing_member_ratio":{"oneOf":[{"$ref":"#/$defs/ratio_decimal_text"},{"type":"null"}]},"median_member_return":{"oneOf":[{"$ref":"#/$defs/signed_fixed_decimal_text"},{"type":"null"}]},"breadth_expanding":{"type":"boolean"},"breadth_narrowing":{"type":"boolean"},"concentration_warning":{"type":"boolean"}}},"evidence_flags":{"$ref":"#/$defs/evidence_flags"},"recommendation":{"$ref":"#/$defs/recommendation"},"case_status":{"$ref":"#/$defs/nullable_case_status"},"analysis_case_id":{"oneOf":[{"$ref":"#/$defs/nonblank_text"},{"type":"null"}]},"input_snapshot_hash":{"$ref":"#/$defs/sha256"}}};
const schema40 = {"type":"string","pattern":"^(0(\\.[0-9]+)?|1(\\.0+)?)$"};
const schema41 = {"type":"string","pattern":"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"};
const pattern6 = new RegExp("^(0(\\.[0-9]+)?|1(\\.0+)?)$", "u");
const pattern7 = new RegExp("^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$", "u");

function validate24(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate24.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.trend_stage === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trend_stage"},message:"must have required property '"+"trend_stage"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.relative_strength === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "relative_strength"},message:"must have required property '"+"relative_strength"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.breadth === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "breadth"},message:"must have required property '"+"breadth"+"'"};
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
if(data.recommendation === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommendation"},message:"must have required property '"+"recommendation"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.case_status === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "case_status"},message:"must have required property '"+"case_status"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.analysis_case_id === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_case_id"},message:"must have required property '"+"analysis_case_id"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.input_snapshot_hash === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_snapshot_hash"},message:"must have required property '"+"input_snapshot_hash"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "trend_stage") || (key0 === "relative_strength")) || (key0 === "breadth")) || (key0 === "evidence_flags")) || (key0 === "recommendation")) || (key0 === "case_status")) || (key0 === "analysis_case_id")) || (key0 === "input_snapshot_hash"))){
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
if(data.trend_stage !== undefined){
let data0 = data.trend_stage;
if(!(((((((data0 === "UP_BUILDING") || (data0 === "UP_ACTIVE")) || (data0 === "UP_COOLING")) || (data0 === "NEUTRAL")) || (data0 === "DOWN_BUILDING")) || (data0 === "DOWN_ACTIVE")) || (data0 === "DOWN_COOLING"))){
const err9 = {instancePath:instancePath+"/trend_stage",schemaPath:"#/properties/trend_stage/enum",keyword:"enum",params:{allowedValues: schema39.properties.trend_stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.relative_strength !== undefined){
let data1 = data.relative_strength;
if(!((((data1 === "LEADING") || (data1 === "IN_LINE")) || (data1 === "LAGGING")) || (data1 === "UNKNOWN"))){
const err10 = {instancePath:instancePath+"/relative_strength",schemaPath:"#/properties/relative_strength/enum",keyword:"enum",params:{allowedValues: schema39.properties.relative_strength.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.breadth !== undefined){
let data2 = data.breadth;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.advancing_member_ratio === undefined){
const err11 = {instancePath:instancePath+"/breadth",schemaPath:"#/properties/breadth/required",keyword:"required",params:{missingProperty: "advancing_member_ratio"},message:"must have required property '"+"advancing_member_ratio"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data2.median_member_return === undefined){
const err12 = {instancePath:instancePath+"/breadth",schemaPath:"#/properties/breadth/required",keyword:"required",params:{missingProperty: "median_member_return"},message:"must have required property '"+"median_member_return"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data2.breadth_expanding === undefined){
const err13 = {instancePath:instancePath+"/breadth",schemaPath:"#/properties/breadth/required",keyword:"required",params:{missingProperty: "breadth_expanding"},message:"must have required property '"+"breadth_expanding"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data2.breadth_narrowing === undefined){
const err14 = {instancePath:instancePath+"/breadth",schemaPath:"#/properties/breadth/required",keyword:"required",params:{missingProperty: "breadth_narrowing"},message:"must have required property '"+"breadth_narrowing"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data2.concentration_warning === undefined){
const err15 = {instancePath:instancePath+"/breadth",schemaPath:"#/properties/breadth/required",keyword:"required",params:{missingProperty: "concentration_warning"},message:"must have required property '"+"concentration_warning"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
for(const key1 in data2){
if(!(((((key1 === "advancing_member_ratio") || (key1 === "median_member_return")) || (key1 === "breadth_expanding")) || (key1 === "breadth_narrowing")) || (key1 === "concentration_warning"))){
const err16 = {instancePath:instancePath+"/breadth",schemaPath:"#/properties/breadth/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data2.advancing_member_ratio !== undefined){
let data3 = data2.advancing_member_ratio;
const _errs8 = errors;
let valid2 = false;
let passing0 = null;
const _errs9 = errors;
if(typeof data3 === "string"){
if(!pattern6.test(data3)){
const err17 = {instancePath:instancePath+"/breadth/advancing_member_ratio",schemaPath:"#/$defs/ratio_decimal_text/pattern",keyword:"pattern",params:{pattern: "^(0(\\.[0-9]+)?|1(\\.0+)?)$"},message:"must match pattern \""+"^(0(\\.[0-9]+)?|1(\\.0+)?)$"+"\""};
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
const err18 = {instancePath:instancePath+"/breadth/advancing_member_ratio",schemaPath:"#/$defs/ratio_decimal_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
valid2 = true;
passing0 = 0;
}
const _errs12 = errors;
if(data3 !== null){
const err19 = {instancePath:instancePath+"/breadth/advancing_member_ratio",schemaPath:"#/properties/breadth/properties/advancing_member_ratio/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid0 = _errs12 === errors;
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
const err20 = {instancePath:instancePath+"/breadth/advancing_member_ratio",schemaPath:"#/properties/breadth/properties/advancing_member_ratio/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
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
if(data2.median_member_return !== undefined){
let data4 = data2.median_member_return;
const _errs15 = errors;
let valid4 = false;
let passing1 = null;
const _errs16 = errors;
if(typeof data4 === "string"){
if(!pattern7.test(data4)){
const err21 = {instancePath:instancePath+"/breadth/median_member_return",schemaPath:"#/$defs/signed_fixed_decimal_text/pattern",keyword:"pattern",params:{pattern: "^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
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
const err22 = {instancePath:instancePath+"/breadth/median_member_return",schemaPath:"#/$defs/signed_fixed_decimal_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid1 = _errs16 === errors;
if(_valid1){
valid4 = true;
passing1 = 0;
}
const _errs19 = errors;
if(data4 !== null){
const err23 = {instancePath:instancePath+"/breadth/median_member_return",schemaPath:"#/properties/breadth/properties/median_member_return/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
var _valid1 = _errs19 === errors;
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
const err24 = {instancePath:instancePath+"/breadth/median_member_return",schemaPath:"#/properties/breadth/properties/median_member_return/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
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
if(data2.breadth_expanding !== undefined){
if(typeof data2.breadth_expanding !== "boolean"){
const err25 = {instancePath:instancePath+"/breadth/breadth_expanding",schemaPath:"#/properties/breadth/properties/breadth_expanding/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data2.breadth_narrowing !== undefined){
if(typeof data2.breadth_narrowing !== "boolean"){
const err26 = {instancePath:instancePath+"/breadth/breadth_narrowing",schemaPath:"#/properties/breadth/properties/breadth_narrowing/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data2.concentration_warning !== undefined){
if(typeof data2.concentration_warning !== "boolean"){
const err27 = {instancePath:instancePath+"/breadth/concentration_warning",schemaPath:"#/properties/breadth/properties/concentration_warning/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
else {
const err28 = {instancePath:instancePath+"/breadth",schemaPath:"#/properties/breadth/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.evidence_flags !== undefined){
let data8 = data.evidence_flags;
if(Array.isArray(data8)){
const len0 = data8.length;
for(let i0=0; i0<len0; i0++){
let data9 = data8[i0];
if(!(((((((((((data9 === "DEMAND_ACCELERATING") || (data9 === "SUPPLY_CONTRACTING")) || (data9 === "PRICE_RISING")) || (data9 === "SUSPECTED_SWEEPING")) || (data9 === "SWEEPING_CONFIRMED")) || (data9 === "REACCELERATION")) || (data9 === "OVERHEATED")) || (data9 === "SHOCK")) || (data9 === "BREADTH_COLLAPSE")) || (data9 === "LIQUIDITY_CONTRACTION")) || (data9 === "CONCENTRATION_WARNING"))){
const err29 = {instancePath:instancePath+"/evidence_flags/" + i0,schemaPath:"#/$defs/evidence_flags/items/enum",keyword:"enum",params:{allowedValues: schema34.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
let i1 = data8.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data8[i1], data8[j0])){
const err30 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidence_flags/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
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
const err31 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidence_flags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.recommendation !== undefined){
let data10 = data.recommendation;
if(!(((((((data10 === "IGNORE") || (data10 === "WATCH")) || (data10 === "RECOMMENDED_CANDIDATE")) || (data10 === "STRONG_CANDIDATE")) || (data10 === "OVERHEATED_DO_NOT_CHASE")) || (data10 === "COOLING_REMOVE_FROM_PRIORITY")) || (data10 === "WITHHELD_DATA_INCOMPLETE"))){
const err32 = {instancePath:instancePath+"/recommendation",schemaPath:"#/$defs/recommendation/enum",keyword:"enum",params:{allowedValues: schema35.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.case_status !== undefined){
let data11 = data.case_status;
if((typeof data11 !== "string") && (data11 !== null)){
const err33 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/nullable_case_status/type",keyword:"type",params:{type: schema36.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(!((((((data11 === "ACTIVE") || (data11 === "SUSPENDED")) || (data11 === "RESOLVED")) || (data11 === "UNRESOLVED")) || (data11 === "RETRACTED")) || (data11 === null))){
const err34 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/nullable_case_status/enum",keyword:"enum",params:{allowedValues: schema36.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.analysis_case_id !== undefined){
let data12 = data.analysis_case_id;
const _errs37 = errors;
let valid12 = false;
let passing2 = null;
const _errs38 = errors;
if(typeof data12 === "string"){
if(func2(data12) < 1){
const err35 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(!pattern4.test(data12)){
const err36 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err37 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
var _valid2 = _errs38 === errors;
if(_valid2){
valid12 = true;
passing2 = 0;
}
const _errs41 = errors;
if(data12 !== null){
const err38 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/properties/analysis_case_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
var _valid2 = _errs41 === errors;
if(_valid2 && valid12){
valid12 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid12 = true;
passing2 = 1;
}
}
if(!valid12){
const err39 = {instancePath:instancePath+"/analysis_case_id",schemaPath:"#/properties/analysis_case_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
else {
errors = _errs37;
if(vErrors !== null){
if(_errs37){
vErrors.length = _errs37;
}
else {
vErrors = null;
}
}
}
}
if(data.input_snapshot_hash !== undefined){
let data13 = data.input_snapshot_hash;
if(typeof data13 === "string"){
if(!pattern5.test(data13)){
const err40 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err41 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema47 = {"type":"object","additionalProperties":false,"required":["cycle_stage","evidence_flags","regime_relation","recommendation","case_status","candidate_episode_id","cycle_case_id","input_snapshot_hash"],"properties":{"cycle_stage":{"enum":["BASELINE","PRESSURE_BUILDING","CONFIRMED_UP","COOLING"]},"evidence_flags":{"$ref":"#/$defs/evidence_flags"},"regime_relation":{"type":"array","uniqueItems":true,"items":{"enum":["MARKET_DRIVEN","SECTOR_DRIVEN","ITEM_SPECIFIC","COUNTER_REGIME","IN_LINE","UNKNOWN"]}},"recommendation":{"$ref":"#/$defs/recommendation"},"case_status":{"$ref":"#/$defs/nullable_case_status"},"candidate_episode_id":{"oneOf":[{"$ref":"#/$defs/nonblank_text"},{"type":"null"}]},"cycle_case_id":{"oneOf":[{"$ref":"#/$defs/nonblank_text"},{"type":"null"}]},"input_snapshot_hash":{"$ref":"#/$defs/sha256"}}};

function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate26.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.cycle_stage === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cycle_stage"},message:"must have required property '"+"cycle_stage"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.evidence_flags === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_flags"},message:"must have required property '"+"evidence_flags"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.regime_relation === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "regime_relation"},message:"must have required property '"+"regime_relation"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.recommendation === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommendation"},message:"must have required property '"+"recommendation"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.case_status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "case_status"},message:"must have required property '"+"case_status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.candidate_episode_id === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "candidate_episode_id"},message:"must have required property '"+"candidate_episode_id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.cycle_case_id === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cycle_case_id"},message:"must have required property '"+"cycle_case_id"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.input_snapshot_hash === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_snapshot_hash"},message:"must have required property '"+"input_snapshot_hash"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "cycle_stage") || (key0 === "evidence_flags")) || (key0 === "regime_relation")) || (key0 === "recommendation")) || (key0 === "case_status")) || (key0 === "candidate_episode_id")) || (key0 === "cycle_case_id")) || (key0 === "input_snapshot_hash"))){
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
if(data.cycle_stage !== undefined){
let data0 = data.cycle_stage;
if(!((((data0 === "BASELINE") || (data0 === "PRESSURE_BUILDING")) || (data0 === "CONFIRMED_UP")) || (data0 === "COOLING"))){
const err9 = {instancePath:instancePath+"/cycle_stage",schemaPath:"#/properties/cycle_stage/enum",keyword:"enum",params:{allowedValues: schema47.properties.cycle_stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.evidence_flags !== undefined){
let data1 = data.evidence_flags;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(!(((((((((((data2 === "DEMAND_ACCELERATING") || (data2 === "SUPPLY_CONTRACTING")) || (data2 === "PRICE_RISING")) || (data2 === "SUSPECTED_SWEEPING")) || (data2 === "SWEEPING_CONFIRMED")) || (data2 === "REACCELERATION")) || (data2 === "OVERHEATED")) || (data2 === "SHOCK")) || (data2 === "BREADTH_COLLAPSE")) || (data2 === "LIQUIDITY_CONTRACTION")) || (data2 === "CONCENTRATION_WARNING"))){
const err10 = {instancePath:instancePath+"/evidence_flags/" + i0,schemaPath:"#/$defs/evidence_flags/items/enum",keyword:"enum",params:{allowedValues: schema34.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
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
const err11 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidence_flags/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
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
const err12 = {instancePath:instancePath+"/evidence_flags",schemaPath:"#/$defs/evidence_flags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.regime_relation !== undefined){
let data3 = data.regime_relation;
if(Array.isArray(data3)){
const len1 = data3.length;
for(let i2=0; i2<len1; i2++){
let data4 = data3[i2];
if(!((((((data4 === "MARKET_DRIVEN") || (data4 === "SECTOR_DRIVEN")) || (data4 === "ITEM_SPECIFIC")) || (data4 === "COUNTER_REGIME")) || (data4 === "IN_LINE")) || (data4 === "UNKNOWN"))){
const err13 = {instancePath:instancePath+"/regime_relation/" + i2,schemaPath:"#/properties/regime_relation/items/enum",keyword:"enum",params:{allowedValues: schema47.properties.regime_relation.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
let i3 = data3.length;
let j1;
if(i3 > 1){
outer1:
for(;i3--;){
for(j1 = i3; j1--;){
if(func0(data3[i3], data3[j1])){
const err14 = {instancePath:instancePath+"/regime_relation",schemaPath:"#/properties/regime_relation/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err15 = {instancePath:instancePath+"/regime_relation",schemaPath:"#/properties/regime_relation/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.recommendation !== undefined){
let data5 = data.recommendation;
if(!(((((((data5 === "IGNORE") || (data5 === "WATCH")) || (data5 === "RECOMMENDED_CANDIDATE")) || (data5 === "STRONG_CANDIDATE")) || (data5 === "OVERHEATED_DO_NOT_CHASE")) || (data5 === "COOLING_REMOVE_FROM_PRIORITY")) || (data5 === "WITHHELD_DATA_INCOMPLETE"))){
const err16 = {instancePath:instancePath+"/recommendation",schemaPath:"#/$defs/recommendation/enum",keyword:"enum",params:{allowedValues: schema35.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.case_status !== undefined){
let data6 = data.case_status;
if((typeof data6 !== "string") && (data6 !== null)){
const err17 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/nullable_case_status/type",keyword:"type",params:{type: schema36.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!((((((data6 === "ACTIVE") || (data6 === "SUSPENDED")) || (data6 === "RESOLVED")) || (data6 === "UNRESOLVED")) || (data6 === "RETRACTED")) || (data6 === null))){
const err18 = {instancePath:instancePath+"/case_status",schemaPath:"#/$defs/nullable_case_status/enum",keyword:"enum",params:{allowedValues: schema36.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.candidate_episode_id !== undefined){
let data7 = data.candidate_episode_id;
const _errs16 = errors;
let valid10 = false;
let passing0 = null;
const _errs17 = errors;
if(typeof data7 === "string"){
if(func2(data7) < 1){
const err19 = {instancePath:instancePath+"/candidate_episode_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!pattern4.test(data7)){
const err20 = {instancePath:instancePath+"/candidate_episode_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err21 = {instancePath:instancePath+"/candidate_episode_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
var _valid0 = _errs17 === errors;
if(_valid0){
valid10 = true;
passing0 = 0;
}
const _errs20 = errors;
if(data7 !== null){
const err22 = {instancePath:instancePath+"/candidate_episode_id",schemaPath:"#/properties/candidate_episode_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs20 === errors;
if(_valid0 && valid10){
valid10 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid10 = true;
passing0 = 1;
}
}
if(!valid10){
const err23 = {instancePath:instancePath+"/candidate_episode_id",schemaPath:"#/properties/candidate_episode_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
else {
errors = _errs16;
if(vErrors !== null){
if(_errs16){
vErrors.length = _errs16;
}
else {
vErrors = null;
}
}
}
}
if(data.cycle_case_id !== undefined){
let data8 = data.cycle_case_id;
const _errs23 = errors;
let valid12 = false;
let passing1 = null;
const _errs24 = errors;
if(typeof data8 === "string"){
if(func2(data8) < 1){
const err24 = {instancePath:instancePath+"/cycle_case_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!pattern4.test(data8)){
const err25 = {instancePath:instancePath+"/cycle_case_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err26 = {instancePath:instancePath+"/cycle_case_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
var _valid1 = _errs24 === errors;
if(_valid1){
valid12 = true;
passing1 = 0;
}
const _errs27 = errors;
if(data8 !== null){
const err27 = {instancePath:instancePath+"/cycle_case_id",schemaPath:"#/properties/cycle_case_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
var _valid1 = _errs27 === errors;
if(_valid1 && valid12){
valid12 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid12 = true;
passing1 = 1;
}
}
if(!valid12){
const err28 = {instancePath:instancePath+"/cycle_case_id",schemaPath:"#/properties/cycle_case_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
else {
errors = _errs23;
if(vErrors !== null){
if(_errs23){
vErrors.length = _errs23;
}
else {
vErrors = null;
}
}
}
}
if(data.input_snapshot_hash !== undefined){
let data9 = data.input_snapshot_hash;
if(typeof data9 === "string"){
if(!pattern5.test(data9)){
const err29 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err30 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema54 = {"type":"object","additionalProperties":false,"required":["recommendation","signal_strength","evidence_coverage","trade_confirmation","input_snapshot_hash"],"properties":{"recommendation":{"$ref":"#/$defs/recommendation"},"signal_strength":{"enum":["NONE","WEAK","MODERATE","STRONG"]},"evidence_coverage":{"type":"string","pattern":"^(0(\\.[0-9]+)?|1(\\.0+)?)$"},"trade_confirmation":{"enum":["UNAVAILABLE","AVAILABLE_NOT_CONFIRMED","CONFIRMED"]},"input_snapshot_hash":{"$ref":"#/$defs/sha256"}}};

function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate28.evaluated;
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
if(data.input_snapshot_hash === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_snapshot_hash"},message:"must have required property '"+"input_snapshot_hash"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "recommendation") || (key0 === "signal_strength")) || (key0 === "evidence_coverage")) || (key0 === "trade_confirmation")) || (key0 === "input_snapshot_hash"))){
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
if(data.recommendation !== undefined){
let data0 = data.recommendation;
if(!(((((((data0 === "IGNORE") || (data0 === "WATCH")) || (data0 === "RECOMMENDED_CANDIDATE")) || (data0 === "STRONG_CANDIDATE")) || (data0 === "OVERHEATED_DO_NOT_CHASE")) || (data0 === "COOLING_REMOVE_FROM_PRIORITY")) || (data0 === "WITHHELD_DATA_INCOMPLETE"))){
const err6 = {instancePath:instancePath+"/recommendation",schemaPath:"#/$defs/recommendation/enum",keyword:"enum",params:{allowedValues: schema35.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.signal_strength !== undefined){
let data1 = data.signal_strength;
if(!((((data1 === "NONE") || (data1 === "WEAK")) || (data1 === "MODERATE")) || (data1 === "STRONG"))){
const err7 = {instancePath:instancePath+"/signal_strength",schemaPath:"#/properties/signal_strength/enum",keyword:"enum",params:{allowedValues: schema54.properties.signal_strength.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.evidence_coverage !== undefined){
let data2 = data.evidence_coverage;
if(typeof data2 === "string"){
if(!pattern6.test(data2)){
const err8 = {instancePath:instancePath+"/evidence_coverage",schemaPath:"#/properties/evidence_coverage/pattern",keyword:"pattern",params:{pattern: "^(0(\\.[0-9]+)?|1(\\.0+)?)$"},message:"must match pattern \""+"^(0(\\.[0-9]+)?|1(\\.0+)?)$"+"\""};
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
const err9 = {instancePath:instancePath+"/evidence_coverage",schemaPath:"#/properties/evidence_coverage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.trade_confirmation !== undefined){
let data3 = data.trade_confirmation;
if(!(((data3 === "UNAVAILABLE") || (data3 === "AVAILABLE_NOT_CONFIRMED")) || (data3 === "CONFIRMED"))){
const err10 = {instancePath:instancePath+"/trade_confirmation",schemaPath:"#/properties/trade_confirmation/enum",keyword:"enum",params:{allowedValues: schema54.properties.trade_confirmation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.input_snapshot_hash !== undefined){
let data4 = data.input_snapshot_hash;
if(typeof data4 === "string"){
if(!pattern5.test(data4)){
const err11 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err12 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema58 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","scope_kind","display_name","identity_available_at","catalog_version","analysis_unit_kind","edition_kind","parent_analysis_unit_id"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/nonblank_text"},"scope_kind":{"$ref":"#/$defs/scope_kind"},"display_name":{"$ref":"#/$defs/nonblank_text"},"identity_available_at":{"$ref":"#/$defs/timestamp"},"catalog_version":{"$ref":"#/$defs/nonblank_text"},"analysis_unit_kind":{"type":["string","null"],"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT",null]},"edition_kind":{"type":["string","null"],"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN",null]},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/nonblank_text"},{"type":"null"}]}},"allOf":[{"if":{"properties":{"scope_kind":{"const":"ITEM"}},"required":["scope_kind"]},"then":{"properties":{"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]}}},"else":{"properties":{"analysis_unit_kind":{"type":"null"},"edition_kind":{"type":"null"},"parent_analysis_unit_id":{"type":"null"}}}},{"if":{"properties":{"scope_kind":{"const":"ITEM"},"analysis_unit_kind":{"const":"BASE_MHN"}},"required":["scope_kind","analysis_unit_kind"]},"then":{"properties":{"parent_analysis_unit_id":{"type":"null"}}}},{"if":{"properties":{"scope_kind":{"const":"ITEM"},"analysis_unit_kind":{"enum":["STYLE_VARIANT","PATTERN_VARIANT"]}},"required":["scope_kind","analysis_unit_kind"]},"then":{"properties":{"parent_analysis_unit_id":{"$ref":"#/$defs/nonblank_text"}}}}]};
const schema61 = {"enum":["MARKET","SECTOR","ITEM"]};

function validate31(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate31.evaluated;
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
if((data.scope_kind === undefined) && (missing0 = "scope_kind")){
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
if(data.scope_kind !== undefined){
if("ITEM" !== data.scope_kind){
const err1 = {};
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
if(data.analysis_unit_kind !== undefined){
let data1 = data.analysis_unit_kind;
if(!(((data1 === "BASE_MHN") || (data1 === "STYLE_VARIANT")) || (data1 === "PATTERN_VARIANT"))){
const err2 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/allOf/0/then/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema58.allOf[0].then.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.edition_kind !== undefined){
let data2 = data.edition_kind;
if(!((((data2 === "STANDARD") || (data2 === "STATTRAK")) || (data2 === "SOUVENIR")) || (data2 === "UNKNOWN"))){
const err3 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/allOf/0/then/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema58.allOf[0].then.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
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
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.analysis_unit_kind = true;
props0.edition_kind = true;
props0.scope_kind = true;
}
ifClause0 = "then";
}
else {
const _errs8 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.analysis_unit_kind !== undefined){
if(data.analysis_unit_kind !== null){
const err4 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/allOf/0/else/properties/analysis_unit_kind/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.edition_kind !== undefined){
if(data.edition_kind !== null){
const err5 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/allOf/0/else/properties/edition_kind/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.parent_analysis_unit_id !== undefined){
if(data.parent_analysis_unit_id !== null){
const err6 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/allOf/0/else/properties/parent_analysis_unit_id/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
var _valid0 = _errs8 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.analysis_unit_kind = true;
props0.edition_kind = true;
props0.parent_analysis_unit_id = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err7 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
const _errs16 = errors;
let valid5 = true;
const _errs17 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if(((data.scope_kind === undefined) && (missing1 = "scope_kind")) || ((data.analysis_unit_kind === undefined) && (missing1 = "analysis_unit_kind"))){
const err8 = {};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
if(data.scope_kind !== undefined){
const _errs18 = errors;
if("ITEM" !== data.scope_kind){
const err9 = {};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var valid6 = _errs18 === errors;
}
else {
var valid6 = true;
}
if(valid6){
if(data.analysis_unit_kind !== undefined){
const _errs19 = errors;
if("BASE_MHN" !== data.analysis_unit_kind){
const err10 = {};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var valid6 = _errs19 === errors;
}
else {
var valid6 = true;
}
}
}
}
var _valid1 = _errs17 === errors;
errors = _errs16;
if(vErrors !== null){
if(_errs16){
vErrors.length = _errs16;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs20 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.parent_analysis_unit_id !== undefined){
if(data.parent_analysis_unit_id !== null){
const err11 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/allOf/1/then/properties/parent_analysis_unit_id/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
var _valid1 = _errs20 === errors;
valid5 = _valid1;
if(valid5){
var props1 = {};
props1.parent_analysis_unit_id = true;
props1.scope_kind = true;
props1.analysis_unit_kind = true;
}
}
if(!valid5){
const err12 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
const _errs24 = errors;
let valid8 = true;
const _errs25 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if(((data.scope_kind === undefined) && (missing2 = "scope_kind")) || ((data.analysis_unit_kind === undefined) && (missing2 = "analysis_unit_kind"))){
const err13 = {};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
if(data.scope_kind !== undefined){
const _errs26 = errors;
if("ITEM" !== data.scope_kind){
const err14 = {};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var valid9 = _errs26 === errors;
}
else {
var valid9 = true;
}
if(valid9){
if(data.analysis_unit_kind !== undefined){
let data10 = data.analysis_unit_kind;
const _errs27 = errors;
if(!((data10 === "STYLE_VARIANT") || (data10 === "PATTERN_VARIANT"))){
const err15 = {};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var valid9 = _errs27 === errors;
}
else {
var valid9 = true;
}
}
}
}
var _valid2 = _errs25 === errors;
errors = _errs24;
if(vErrors !== null){
if(_errs24){
vErrors.length = _errs24;
}
else {
vErrors = null;
}
}
if(_valid2){
const _errs28 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.parent_analysis_unit_id !== undefined){
let data11 = data.parent_analysis_unit_id;
if(typeof data11 === "string"){
if(func2(data11) < 1){
const err16 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern4.test(data11)){
const err17 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err18 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
var _valid2 = _errs28 === errors;
valid8 = _valid2;
if(valid8){
var props2 = {};
props2.parent_analysis_unit_id = true;
props2.scope_kind = true;
props2.analysis_unit_kind = true;
}
}
if(!valid8){
const err19 = {instancePath,schemaPath:"#/allOf/2/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(props0 !== true && props2 !== undefined){
if(props2 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props2);
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.analysis_unit_id === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.scope_kind === undefined){
const err21 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_kind"},message:"must have required property '"+"scope_kind"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.display_name === undefined){
const err22 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "display_name"},message:"must have required property '"+"display_name"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data.identity_available_at === undefined){
const err23 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identity_available_at"},message:"must have required property '"+"identity_available_at"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data.catalog_version === undefined){
const err24 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_version"},message:"must have required property '"+"catalog_version"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data.analysis_unit_kind === undefined){
const err25 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_kind"},message:"must have required property '"+"analysis_unit_kind"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data.edition_kind === undefined){
const err26 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "edition_kind"},message:"must have required property '"+"edition_kind"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data.parent_analysis_unit_id === undefined){
const err27 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parent_analysis_unit_id"},message:"must have required property '"+"parent_analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "analysis_unit_id") || (key0 === "scope_kind")) || (key0 === "display_name")) || (key0 === "identity_available_at")) || (key0 === "catalog_version")) || (key0 === "analysis_unit_kind")) || (key0 === "edition_kind")) || (key0 === "parent_analysis_unit_id"))){
const err28 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data12 = data.analysis_unit_id;
if(typeof data12 === "string"){
if(func2(data12) < 1){
const err29 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(!pattern4.test(data12)){
const err30 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err31 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.scope_kind !== undefined){
let data13 = data.scope_kind;
if(!(((data13 === "MARKET") || (data13 === "SECTOR")) || (data13 === "ITEM"))){
const err32 = {instancePath:instancePath+"/scope_kind",schemaPath:"#/$defs/scope_kind/enum",keyword:"enum",params:{allowedValues: schema61.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.display_name !== undefined){
let data14 = data.display_name;
if(typeof data14 === "string"){
if(func2(data14) < 1){
const err33 = {instancePath:instancePath+"/display_name",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(!pattern4.test(data14)){
const err34 = {instancePath:instancePath+"/display_name",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err35 = {instancePath:instancePath+"/display_name",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.identity_available_at !== undefined){
let data15 = data.identity_available_at;
if(typeof data15 === "string"){
if(!pattern19.test(data15)){
const err36 = {instancePath:instancePath+"/identity_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(!(formats0.validate(data15))){
const err37 = {instancePath:instancePath+"/identity_available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err38 = {instancePath:instancePath+"/identity_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.catalog_version !== undefined){
let data16 = data.catalog_version;
if(typeof data16 === "string"){
if(func2(data16) < 1){
const err39 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(!pattern4.test(data16)){
const err40 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err41 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.analysis_unit_kind !== undefined){
let data17 = data.analysis_unit_kind;
if((typeof data17 !== "string") && (data17 !== null)){
const err42 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/type",keyword:"type",params:{type: schema58.properties.analysis_unit_kind.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(!((((data17 === "BASE_MHN") || (data17 === "STYLE_VARIANT")) || (data17 === "PATTERN_VARIANT")) || (data17 === null))){
const err43 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema58.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data.edition_kind !== undefined){
let data18 = data.edition_kind;
if((typeof data18 !== "string") && (data18 !== null)){
const err44 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/type",keyword:"type",params:{type: schema58.properties.edition_kind.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(!(((((data18 === "STANDARD") || (data18 === "STATTRAK")) || (data18 === "SOUVENIR")) || (data18 === "UNKNOWN")) || (data18 === null))){
const err45 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema58.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.parent_analysis_unit_id !== undefined){
let data19 = data.parent_analysis_unit_id;
const _errs52 = errors;
let valid18 = false;
let passing0 = null;
const _errs53 = errors;
if(typeof data19 === "string"){
if(func2(data19) < 1){
const err46 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(!pattern4.test(data19)){
const err47 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err48 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
var _valid3 = _errs53 === errors;
if(_valid3){
valid18 = true;
passing0 = 0;
}
const _errs56 = errors;
if(data19 !== null){
const err49 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
var _valid3 = _errs56 === errors;
if(_valid3 && valid18){
valid18 = false;
passing0 = [passing0, 1];
}
else {
if(_valid3){
valid18 = true;
passing0 = 1;
}
}
if(!valid18){
const err50 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
else {
errors = _errs52;
if(vErrors !== null){
if(_errs52){
vErrors.length = _errs52;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err51 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema70 = {"type":"object","additionalProperties":false,"required":["catalog_version","group_version","index_version","fusion_method_version","feature_profile_version","algorithm_version","parameter_set_version","stage_policy_version","failure_policy_version"],"properties":{"catalog_version":{"$ref":"#/$defs/nonblank_text"},"group_version":{"$ref":"#/$defs/nonblank_text"},"index_version":{"$ref":"#/$defs/nonblank_text"},"fusion_method_version":{"$ref":"#/$defs/nonblank_text"},"feature_profile_version":{"$ref":"#/$defs/nonblank_text"},"algorithm_version":{"$ref":"#/$defs/nonblank_text"},"parameter_set_version":{"$ref":"#/$defs/nonblank_text"},"stage_policy_version":{"$ref":"#/$defs/nonblank_text"},"failure_policy_version":{"$ref":"#/$defs/nonblank_text"}}};
const func9 = Object.prototype.hasOwnProperty;

function validate33(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate33.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.catalog_version === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_version"},message:"must have required property '"+"catalog_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.group_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "group_version"},message:"must have required property '"+"group_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.index_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "index_version"},message:"must have required property '"+"index_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.fusion_method_version === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fusion_method_version"},message:"must have required property '"+"fusion_method_version"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.feature_profile_version === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "feature_profile_version"},message:"must have required property '"+"feature_profile_version"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.algorithm_version === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "algorithm_version"},message:"must have required property '"+"algorithm_version"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.parameter_set_version === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parameter_set_version"},message:"must have required property '"+"parameter_set_version"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.stage_policy_version === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage_policy_version"},message:"must have required property '"+"stage_policy_version"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.failure_policy_version === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "failure_policy_version"},message:"must have required property '"+"failure_policy_version"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema70.properties, key0))){
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
if(data.catalog_version !== undefined){
let data0 = data.catalog_version;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err10 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern4.test(data0)){
const err11 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err12 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.group_version !== undefined){
let data1 = data.group_version;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err13 = {instancePath:instancePath+"/group_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern4.test(data1)){
const err14 = {instancePath:instancePath+"/group_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err15 = {instancePath:instancePath+"/group_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.index_version !== undefined){
let data2 = data.index_version;
if(typeof data2 === "string"){
if(func2(data2) < 1){
const err16 = {instancePath:instancePath+"/index_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern4.test(data2)){
const err17 = {instancePath:instancePath+"/index_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err18 = {instancePath:instancePath+"/index_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.fusion_method_version !== undefined){
let data3 = data.fusion_method_version;
if(typeof data3 === "string"){
if(func2(data3) < 1){
const err19 = {instancePath:instancePath+"/fusion_method_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!pattern4.test(data3)){
const err20 = {instancePath:instancePath+"/fusion_method_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err21 = {instancePath:instancePath+"/fusion_method_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.feature_profile_version !== undefined){
let data4 = data.feature_profile_version;
if(typeof data4 === "string"){
if(func2(data4) < 1){
const err22 = {instancePath:instancePath+"/feature_profile_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!pattern4.test(data4)){
const err23 = {instancePath:instancePath+"/feature_profile_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err24 = {instancePath:instancePath+"/feature_profile_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.algorithm_version !== undefined){
let data5 = data.algorithm_version;
if(typeof data5 === "string"){
if(func2(data5) < 1){
const err25 = {instancePath:instancePath+"/algorithm_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!pattern4.test(data5)){
const err26 = {instancePath:instancePath+"/algorithm_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err27 = {instancePath:instancePath+"/algorithm_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.parameter_set_version !== undefined){
let data6 = data.parameter_set_version;
if(typeof data6 === "string"){
if(func2(data6) < 1){
const err28 = {instancePath:instancePath+"/parameter_set_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(!pattern4.test(data6)){
const err29 = {instancePath:instancePath+"/parameter_set_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err30 = {instancePath:instancePath+"/parameter_set_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.stage_policy_version !== undefined){
let data7 = data.stage_policy_version;
if(typeof data7 === "string"){
if(func2(data7) < 1){
const err31 = {instancePath:instancePath+"/stage_policy_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(!pattern4.test(data7)){
const err32 = {instancePath:instancePath+"/stage_policy_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
else {
const err33 = {instancePath:instancePath+"/stage_policy_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.failure_policy_version !== undefined){
let data8 = data.failure_policy_version;
if(typeof data8 === "string"){
if(func2(data8) < 1){
const err34 = {instancePath:instancePath+"/failure_policy_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(!pattern4.test(data8)){
const err35 = {instancePath:instancePath+"/failure_policy_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err36 = {instancePath:instancePath+"/failure_policy_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
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
validate33.errors = vErrors;
return errors === 0;
}
validate33.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema80 = {"type":"object","additionalProperties":false,"required":["domain","strength","contributing_feature_keys","missing_reason","policy_version","input_snapshot_hash"],"properties":{"domain":{"enum":["P","D","S"]},"strength":{"enum":["UNAVAILABLE","CONFLICTED","ABSENT","WEAK","MODERATE","STRONG"]},"contributing_feature_keys":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/nonblank_text"}},"missing_reason":{"oneOf":[{"$ref":"#/$defs/domain_missing_reason_code"},{"type":"null"}]},"policy_version":{"$ref":"#/$defs/nonblank_text"},"input_snapshot_hash":{"$ref":"#/$defs/sha256"}},"allOf":[{"if":{"properties":{"strength":{"enum":["UNAVAILABLE","CONFLICTED"]}},"required":["strength"]},"then":{"properties":{"missing_reason":{"$ref":"#/$defs/domain_missing_reason_code"}}},"else":{"properties":{"missing_reason":{"type":"null"}}}}]};
const schema81 = {"enum":["UNAVAILABLE_BY_DESIGN","OPTIONAL_DATA_UNAVAILABLE","DATA_UNAVAILABLE_RUNTIME_GRACE","DATA_UNAVAILABLE_RUNTIME","STALE_GRACE","STALE","CONFLICTED_INPUTS"]};

function validate39(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate39.evaluated;
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
if((data.strength === undefined) && (missing0 = "strength")){
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
if(data.strength !== undefined){
let data0 = data.strength;
if(!((data0 === "UNAVAILABLE") || (data0 === "CONFLICTED"))){
const err1 = {};
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
if(data.missing_reason !== undefined){
let data1 = data.missing_reason;
if(!(((((((data1 === "UNAVAILABLE_BY_DESIGN") || (data1 === "OPTIONAL_DATA_UNAVAILABLE")) || (data1 === "DATA_UNAVAILABLE_RUNTIME_GRACE")) || (data1 === "DATA_UNAVAILABLE_RUNTIME")) || (data1 === "STALE_GRACE")) || (data1 === "STALE")) || (data1 === "CONFLICTED_INPUTS"))){
const err2 = {instancePath:instancePath+"/missing_reason",schemaPath:"#/$defs/domain_missing_reason_code/enum",keyword:"enum",params:{allowedValues: schema81.enum},message:"must be equal to one of the allowed values"};
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
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.missing_reason = true;
props0.strength = true;
}
ifClause0 = "then";
}
else {
const _errs8 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.missing_reason !== undefined){
if(data.missing_reason !== null){
const err3 = {instancePath:instancePath+"/missing_reason",schemaPath:"#/allOf/0/else/properties/missing_reason/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
var _valid0 = _errs8 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.missing_reason = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err4 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.domain === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "domain"},message:"must have required property '"+"domain"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.strength === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "strength"},message:"must have required property '"+"strength"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.contributing_feature_keys === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contributing_feature_keys"},message:"must have required property '"+"contributing_feature_keys"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.missing_reason === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "missing_reason"},message:"must have required property '"+"missing_reason"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.policy_version === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "policy_version"},message:"must have required property '"+"policy_version"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.input_snapshot_hash === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_snapshot_hash"},message:"must have required property '"+"input_snapshot_hash"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "domain") || (key0 === "strength")) || (key0 === "contributing_feature_keys")) || (key0 === "missing_reason")) || (key0 === "policy_version")) || (key0 === "input_snapshot_hash"))){
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
if(data.domain !== undefined){
let data3 = data.domain;
if(!(((data3 === "P") || (data3 === "D")) || (data3 === "S"))){
const err12 = {instancePath:instancePath+"/domain",schemaPath:"#/properties/domain/enum",keyword:"enum",params:{allowedValues: schema80.properties.domain.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.strength !== undefined){
let data4 = data.strength;
if(!((((((data4 === "UNAVAILABLE") || (data4 === "CONFLICTED")) || (data4 === "ABSENT")) || (data4 === "WEAK")) || (data4 === "MODERATE")) || (data4 === "STRONG"))){
const err13 = {instancePath:instancePath+"/strength",schemaPath:"#/properties/strength/enum",keyword:"enum",params:{allowedValues: schema80.properties.strength.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.contributing_feature_keys !== undefined){
let data5 = data.contributing_feature_keys;
if(Array.isArray(data5)){
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
let data6 = data5[i0];
if(typeof data6 === "string"){
if(func2(data6) < 1){
const err14 = {instancePath:instancePath+"/contributing_feature_keys/" + i0,schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern4.test(data6)){
const err15 = {instancePath:instancePath+"/contributing_feature_keys/" + i0,schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err16 = {instancePath:instancePath+"/contributing_feature_keys/" + i0,schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
let i1 = data5.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data5[i1], data5[j0])){
const err17 = {instancePath:instancePath+"/contributing_feature_keys",schemaPath:"#/properties/contributing_feature_keys/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err18 = {instancePath:instancePath+"/contributing_feature_keys",schemaPath:"#/properties/contributing_feature_keys/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.missing_reason !== undefined){
let data7 = data.missing_reason;
const _errs20 = errors;
let valid11 = false;
let passing0 = null;
const _errs21 = errors;
if(!(((((((data7 === "UNAVAILABLE_BY_DESIGN") || (data7 === "OPTIONAL_DATA_UNAVAILABLE")) || (data7 === "DATA_UNAVAILABLE_RUNTIME_GRACE")) || (data7 === "DATA_UNAVAILABLE_RUNTIME")) || (data7 === "STALE_GRACE")) || (data7 === "STALE")) || (data7 === "CONFLICTED_INPUTS"))){
const err19 = {instancePath:instancePath+"/missing_reason",schemaPath:"#/$defs/domain_missing_reason_code/enum",keyword:"enum",params:{allowedValues: schema81.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid1 = _errs21 === errors;
if(_valid1){
valid11 = true;
passing0 = 0;
}
const _errs23 = errors;
if(data7 !== null){
const err20 = {instancePath:instancePath+"/missing_reason",schemaPath:"#/properties/missing_reason/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid1 = _errs23 === errors;
if(_valid1 && valid11){
valid11 = false;
passing0 = [passing0, 1];
}
else {
if(_valid1){
valid11 = true;
passing0 = 1;
}
}
if(!valid11){
const err21 = {instancePath:instancePath+"/missing_reason",schemaPath:"#/properties/missing_reason/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
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
if(data.policy_version !== undefined){
let data8 = data.policy_version;
if(typeof data8 === "string"){
if(func2(data8) < 1){
const err22 = {instancePath:instancePath+"/policy_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!pattern4.test(data8)){
const err23 = {instancePath:instancePath+"/policy_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err24 = {instancePath:instancePath+"/policy_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.input_snapshot_hash !== undefined){
let data9 = data.input_snapshot_hash;
if(typeof data9 === "string"){
if(!pattern5.test(data9)){
const err25 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err26 = {instancePath:instancePath+"/input_snapshot_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
validate39.errors = vErrors;
return errors === 0;
}
validate39.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate57(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate57.evaluated;
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
if((data.identity === undefined) && (missing0 = "identity")){
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
if(data.identity !== undefined){
let data0 = data.identity;
const _errs4 = errors;
if(errors === _errs4){
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
let missing1;
if((data0.scope_kind === undefined) && (missing1 = "scope_kind")){
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
if(data0.scope_kind !== undefined){
if("MARKET" !== data0.scope_kind){
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
else {
const err3 = {};
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
const _errs7 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.state !== undefined){
if(!(validate22(data.state, {instancePath:instancePath+"/state",parentData:data,parentDataProperty:"state",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
}
if(data.recommendation_detail !== undefined){
if(data.recommendation_detail !== null){
const err4 = {instancePath:instancePath+"/recommendation_detail",schemaPath:"#/allOf/0/then/properties/recommendation_detail/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.evidence_domains !== undefined){
let data4 = data.evidence_domains;
if(Array.isArray(data4)){
if(data4.length > 0){
const err5 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/0/then/properties/evidence_domains/maxItems",keyword:"maxItems",params:{limit: 0},message:"must NOT have more than 0 items"};
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
const err6 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/0/then/properties/evidence_domains/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.claims !== undefined){
let data5 = data.claims;
if(Array.isArray(data5)){
if(data5.length > 0){
const err7 = {instancePath:instancePath+"/claims",schemaPath:"#/allOf/0/then/properties/claims/maxItems",keyword:"maxItems",params:{limit: 0},message:"must NOT have more than 0 items"};
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
const err8 = {instancePath:instancePath+"/claims",schemaPath:"#/allOf/0/then/properties/claims/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
var _valid0 = _errs7 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.state = true;
props0.recommendation_detail = true;
props0.evidence_domains = true;
props0.claims = true;
props0.identity = true;
}
}
if(!valid1){
const err9 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
const _errs16 = errors;
let valid5 = true;
const _errs17 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.identity === undefined) && (missing2 = "identity")){
const err10 = {};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
else {
if(data.identity !== undefined){
let data6 = data.identity;
const _errs18 = errors;
if(errors === _errs18){
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
let missing3;
if((data6.scope_kind === undefined) && (missing3 = "scope_kind")){
const err11 = {};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
else {
if(data6.scope_kind !== undefined){
if("SECTOR" !== data6.scope_kind){
const err12 = {};
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
const err13 = {};
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
}
var _valid1 = _errs17 === errors;
errors = _errs16;
if(vErrors !== null){
if(_errs16){
vErrors.length = _errs16;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs21 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.state !== undefined){
if(!(validate24(data.state, {instancePath:instancePath+"/state",parentData:data,parentDataProperty:"state",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
errors = vErrors.length;
}
}
if(data.recommendation_detail !== undefined){
if(data.recommendation_detail !== null){
const err14 = {instancePath:instancePath+"/recommendation_detail",schemaPath:"#/allOf/1/then/properties/recommendation_detail/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.evidence_domains !== undefined){
let data10 = data.evidence_domains;
if(Array.isArray(data10)){
if(data10.length > 0){
const err15 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/1/then/properties/evidence_domains/maxItems",keyword:"maxItems",params:{limit: 0},message:"must NOT have more than 0 items"};
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
const err16 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/1/then/properties/evidence_domains/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.claims !== undefined){
let data11 = data.claims;
if(Array.isArray(data11)){
if(data11.length > 0){
const err17 = {instancePath:instancePath+"/claims",schemaPath:"#/allOf/1/then/properties/claims/maxItems",keyword:"maxItems",params:{limit: 0},message:"must NOT have more than 0 items"};
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
const err18 = {instancePath:instancePath+"/claims",schemaPath:"#/allOf/1/then/properties/claims/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
var _valid1 = _errs21 === errors;
valid5 = _valid1;
if(valid5){
var props1 = {};
props1.state = true;
props1.recommendation_detail = true;
props1.evidence_domains = true;
props1.claims = true;
props1.identity = true;
}
}
if(!valid5){
const err19 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
const _errs30 = errors;
let valid9 = true;
const _errs31 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing4;
if((data.identity === undefined) && (missing4 = "identity")){
const err20 = {};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
else {
if(data.identity !== undefined){
let data12 = data.identity;
const _errs32 = errors;
if(errors === _errs32){
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
let missing5;
if((data12.scope_kind === undefined) && (missing5 = "scope_kind")){
const err21 = {};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
else {
if(data12.scope_kind !== undefined){
if("ITEM" !== data12.scope_kind){
const err22 = {};
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
const err23 = {};
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
}
var _valid2 = _errs31 === errors;
errors = _errs30;
if(vErrors !== null){
if(_errs30){
vErrors.length = _errs30;
}
else {
vErrors = null;
}
}
if(_valid2){
const _errs35 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.state !== undefined){
if(!(validate26(data.state, {instancePath:instancePath+"/state",parentData:data,parentDataProperty:"state",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
}
if(data.recommendation_detail !== undefined){
if(!(validate28(data.recommendation_detail, {instancePath:instancePath+"/recommendation_detail",parentData:data,parentDataProperty:"recommendation_detail",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
}
if(data.evidence_domains !== undefined){
let data16 = data.evidence_domains;
if(Array.isArray(data16)){
const _errs41 = errors;
const len0 = data16.length;
for(let i0=0; i0<len0; i0++){
let data17 = data16[i0];
const _errs42 = errors;
if(data17 && typeof data17 == "object" && !Array.isArray(data17)){
if(data17.domain === undefined){
const err24 = {instancePath:instancePath+"/evidence_domains/" + i0,schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/0/contains/required",keyword:"required",params:{missingProperty: "domain"},message:"must have required property '"+"domain"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data17.domain !== undefined){
if("P" !== data17.domain){
const err25 = {instancePath:instancePath+"/evidence_domains/" + i0+"/domain",schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/0/contains/properties/domain/const",keyword:"const",params:{allowedValue: "P"},message:"must be equal to constant"};
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
else {
const err26 = {instancePath:instancePath+"/evidence_domains/" + i0,schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/0/contains/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
var valid14 = _errs42 === errors;
if(valid14){
break;
}
}
if(!valid14){
const err27 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/0/contains",keyword:"contains",params:{minContains: 1},message:"must contain at least 1 valid item(s)"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
else {
errors = _errs41;
if(vErrors !== null){
if(_errs41){
vErrors.length = _errs41;
}
else {
vErrors = null;
}
}
}
}
if(Array.isArray(data16)){
const _errs46 = errors;
const len1 = data16.length;
for(let i1=0; i1<len1; i1++){
let data19 = data16[i1];
const _errs47 = errors;
if(data19 && typeof data19 == "object" && !Array.isArray(data19)){
if(data19.domain === undefined){
const err28 = {instancePath:instancePath+"/evidence_domains/" + i1,schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/1/contains/required",keyword:"required",params:{missingProperty: "domain"},message:"must have required property '"+"domain"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data19.domain !== undefined){
if("D" !== data19.domain){
const err29 = {instancePath:instancePath+"/evidence_domains/" + i1+"/domain",schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/1/contains/properties/domain/const",keyword:"const",params:{allowedValue: "D"},message:"must be equal to constant"};
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
const err30 = {instancePath:instancePath+"/evidence_domains/" + i1,schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/1/contains/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
var valid16 = _errs47 === errors;
if(valid16){
break;
}
}
if(!valid16){
const err31 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/1/contains",keyword:"contains",params:{minContains: 1},message:"must contain at least 1 valid item(s)"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
else {
errors = _errs46;
if(vErrors !== null){
if(_errs46){
vErrors.length = _errs46;
}
else {
vErrors = null;
}
}
}
}
if(Array.isArray(data16)){
const _errs51 = errors;
const len2 = data16.length;
for(let i2=0; i2<len2; i2++){
let data21 = data16[i2];
const _errs52 = errors;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.domain === undefined){
const err32 = {instancePath:instancePath+"/evidence_domains/" + i2,schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/2/contains/required",keyword:"required",params:{missingProperty: "domain"},message:"must have required property '"+"domain"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data21.domain !== undefined){
if("S" !== data21.domain){
const err33 = {instancePath:instancePath+"/evidence_domains/" + i2+"/domain",schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/2/contains/properties/domain/const",keyword:"const",params:{allowedValue: "S"},message:"must be equal to constant"};
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
const err34 = {instancePath:instancePath+"/evidence_domains/" + i2,schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/2/contains/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
var valid18 = _errs52 === errors;
if(valid18){
break;
}
}
if(!valid18){
const err35 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/2/then/properties/evidence_domains/allOf/2/contains",keyword:"contains",params:{minContains: 1},message:"must contain at least 1 valid item(s)"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
else {
errors = _errs51;
if(vErrors !== null){
if(_errs51){
vErrors.length = _errs51;
}
else {
vErrors = null;
}
}
}
}
if(Array.isArray(data16)){
if(data16.length > 3){
const err36 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/2/then/properties/evidence_domains/maxItems",keyword:"maxItems",params:{limit: 3},message:"must NOT have more than 3 items"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data16.length < 3){
const err37 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/2/then/properties/evidence_domains/minItems",keyword:"minItems",params:{limit: 3},message:"must NOT have fewer than 3 items"};
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
const err38 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/allOf/2/then/properties/evidence_domains/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
var _valid2 = _errs35 === errors;
valid9 = _valid2;
if(valid9){
var props2 = {};
props2.state = true;
props2.recommendation_detail = true;
props2.evidence_domains = true;
props2.identity = true;
}
}
if(!valid9){
const err39 = {instancePath,schemaPath:"#/allOf/2/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(props0 !== true && props2 !== undefined){
if(props2 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props2);
}
}
const _errs56 = errors;
let valid20 = true;
const _errs57 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing6;
if(((data.data_branch === undefined) && (missing6 = "data_branch")) || ((data.identity === undefined) && (missing6 = "identity"))){
const err40 = {};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
else {
if(data.data_branch !== undefined){
const _errs58 = errors;
if("B" !== data.data_branch){
const err41 = {};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
var valid21 = _errs58 === errors;
}
else {
var valid21 = true;
}
if(valid21){
if(data.identity !== undefined){
let data24 = data.identity;
const _errs59 = errors;
if(errors === _errs59){
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
let missing7;
if((data24.scope_kind === undefined) && (missing7 = "scope_kind")){
const err42 = {};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
else {
if(data24.scope_kind !== undefined){
if("ITEM" !== data24.scope_kind){
const err43 = {};
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
}
else {
const err44 = {};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
var valid21 = _errs59 === errors;
}
else {
var valid21 = true;
}
}
}
}
var _valid3 = _errs57 === errors;
errors = _errs56;
if(vErrors !== null){
if(_errs56){
vErrors.length = _errs56;
}
else {
vErrors = null;
}
}
if(_valid3){
const _errs62 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.recommendation_detail !== undefined){
let data26 = data.recommendation_detail;
if(!(validate28(data26, {instancePath:instancePath+"/recommendation_detail",parentData:data,parentDataProperty:"recommendation_detail",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
if(data26.trade_confirmation !== undefined){
if("UNAVAILABLE" !== data26.trade_confirmation){
const err45 = {instancePath:instancePath+"/recommendation_detail/trade_confirmation",schemaPath:"#/allOf/3/then/properties/recommendation_detail/allOf/1/properties/trade_confirmation/const",keyword:"const",params:{allowedValue: "UNAVAILABLE"},message:"must be equal to constant"};
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
const err46 = {instancePath:instancePath+"/recommendation_detail",schemaPath:"#/allOf/3/then/properties/recommendation_detail/allOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.claims !== undefined){
let data28 = data.claims;
if(!(Array.isArray(data28))){
const err47 = {instancePath:instancePath+"/claims",schemaPath:"#/allOf/3/then/properties/claims/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
const _errs70 = errors;
const _errs71 = errors;
if(Array.isArray(data28)){
const _errs72 = errors;
const len3 = data28.length;
for(let i3=0; i3<len3; i3++){
let data29 = data28[i3];
const _errs73 = errors;
if(!((data29 === "TRUSTED_TRADE_VOLUME_INCREASING") || (data29 === "SWEEPING_CONFIRMED"))){
const err48 = {};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
var valid27 = _errs73 === errors;
if(valid27){
break;
}
}
if(!valid27){
const err49 = {};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
else {
errors = _errs72;
if(vErrors !== null){
if(_errs72){
vErrors.length = _errs72;
}
else {
vErrors = null;
}
}
}
}
var valid26 = _errs71 === errors;
if(valid26){
const err50 = {instancePath:instancePath+"/claims",schemaPath:"#/allOf/3/then/properties/claims/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
else {
errors = _errs70;
if(vErrors !== null){
if(_errs70){
vErrors.length = _errs70;
}
else {
vErrors = null;
}
}
}
}
}
var _valid3 = _errs62 === errors;
valid20 = _valid3;
if(valid20){
var props3 = {};
props3.recommendation_detail = true;
props3.claims = true;
props3.data_branch = true;
props3.identity = true;
}
}
if(!valid20){
const err51 = {instancePath,schemaPath:"#/allOf/3/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(props0 !== true && props3 !== undefined){
if(props3 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props3);
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.snapshot_id === undefined){
const err52 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(data.contract_code === undefined){
const err53 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_code"},message:"must have required property '"+"contract_code"+"'"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data.contract_version === undefined){
const err54 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_version"},message:"must have required property '"+"contract_version"+"'"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data.envelope_kind === undefined){
const err55 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "envelope_kind"},message:"must have required property '"+"envelope_kind"+"'"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(data.identity === undefined){
const err56 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identity"},message:"must have required property '"+"identity"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data.as_of === undefined){
const err57 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "as_of"},message:"must have required property '"+"as_of"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data.available_at === undefined){
const err58 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data.data_branch === undefined){
const err59 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_branch"},message:"must have required property '"+"data_branch"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data.data_status === undefined){
const err60 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_status"},message:"must have required property '"+"data_status"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data.versions === undefined){
const err61 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "versions"},message:"must have required property '"+"versions"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data.state === undefined){
const err62 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data.recommendation_detail === undefined){
const err63 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommendation_detail"},message:"must have required property '"+"recommendation_detail"+"'"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(data.evidence_domains === undefined){
const err64 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_domains"},message:"must have required property '"+"evidence_domains"+"'"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data.claims === undefined){
const err65 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "claims"},message:"must have required property '"+"claims"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema32.properties, key0))){
const err66 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data.snapshot_id !== undefined){
let data30 = data.snapshot_id;
if(typeof data30 === "string"){
if(!pattern5.test(data30)){
const err67 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
else {
const err68 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data.contract_code !== undefined){
if("research-result-envelope" !== data.contract_code){
const err69 = {instancePath:instancePath+"/contract_code",schemaPath:"#/properties/contract_code/const",keyword:"const",params:{allowedValue: "research-result-envelope"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data.contract_version !== undefined){
if("v1" !== data.contract_version){
const err70 = {instancePath:instancePath+"/contract_version",schemaPath:"#/properties/contract_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data.envelope_kind !== undefined){
if("UNIT" !== data.envelope_kind){
const err71 = {instancePath:instancePath+"/envelope_kind",schemaPath:"#/properties/envelope_kind/const",keyword:"const",params:{allowedValue: "UNIT"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data.identity !== undefined){
if(!(validate31(data.identity, {instancePath:instancePath+"/identity",parentData:data,parentDataProperty:"identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
errors = vErrors.length;
}
}
if(data.as_of !== undefined){
let data35 = data.as_of;
if(typeof data35 === "string"){
if(!pattern19.test(data35)){
const err72 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(!(formats0.validate(data35))){
const err73 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
else {
const err74 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data.available_at !== undefined){
let data36 = data.available_at;
if(typeof data36 === "string"){
if(!pattern19.test(data36)){
const err75 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(!(formats0.validate(data36))){
const err76 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err77 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data.data_branch !== undefined){
let data37 = data.data_branch;
if(!((data37 === "A") || (data37 === "B"))){
const err78 = {instancePath:instancePath+"/data_branch",schemaPath:"#/$defs/data_branch/enum",keyword:"enum",params:{allowedValues: schema68.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data.data_status !== undefined){
let data38 = data.data_status;
if(!((((((((data38 === "COMPLETE") || (data38 === "UNAVAILABLE_BY_DESIGN")) || (data38 === "DEGRADED_OPTIONAL")) || (data38 === "DATA_UNAVAILABLE_RUNTIME_GRACE")) || (data38 === "STALE_GRACE")) || (data38 === "DATA_UNAVAILABLE_RUNTIME")) || (data38 === "STALE")) || (data38 === "CONFLICTED"))){
const err79 = {instancePath:instancePath+"/data_status",schemaPath:"#/$defs/data_status/enum",keyword:"enum",params:{allowedValues: schema69.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data.versions !== undefined){
if(!(validate33(data.versions, {instancePath:instancePath+"/versions",parentData:data,parentDataProperty:"versions",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate33.errors : vErrors.concat(validate33.errors);
errors = vErrors.length;
}
}
if(data.state !== undefined){
let data40 = data.state;
const _errs94 = errors;
let valid34 = false;
let passing0 = null;
const _errs95 = errors;
if(!(validate22(data40, {instancePath:instancePath+"/state",parentData:data,parentDataProperty:"state",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
var _valid4 = _errs95 === errors;
if(_valid4){
valid34 = true;
passing0 = 0;
var props4 = true;
}
const _errs96 = errors;
if(!(validate24(data40, {instancePath:instancePath+"/state",parentData:data,parentDataProperty:"state",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
errors = vErrors.length;
}
var _valid4 = _errs96 === errors;
if(_valid4 && valid34){
valid34 = false;
passing0 = [passing0, 1];
}
else {
if(_valid4){
valid34 = true;
passing0 = 1;
if(props4 !== true){
props4 = true;
}
}
const _errs97 = errors;
if(!(validate26(data40, {instancePath:instancePath+"/state",parentData:data,parentDataProperty:"state",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
var _valid4 = _errs97 === errors;
if(_valid4 && valid34){
valid34 = false;
passing0 = [passing0, 2];
}
else {
if(_valid4){
valid34 = true;
passing0 = 2;
if(props4 !== true){
props4 = true;
}
}
}
}
if(!valid34){
const err80 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
else {
errors = _errs94;
if(vErrors !== null){
if(_errs94){
vErrors.length = _errs94;
}
else {
vErrors = null;
}
}
}
}
if(data.recommendation_detail !== undefined){
let data41 = data.recommendation_detail;
const _errs99 = errors;
let valid35 = false;
let passing1 = null;
const _errs100 = errors;
if(!(validate28(data41, {instancePath:instancePath+"/recommendation_detail",parentData:data,parentDataProperty:"recommendation_detail",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
var _valid5 = _errs100 === errors;
if(_valid5){
valid35 = true;
passing1 = 0;
}
const _errs101 = errors;
if(data41 !== null){
const err81 = {instancePath:instancePath+"/recommendation_detail",schemaPath:"#/properties/recommendation_detail/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
var _valid5 = _errs101 === errors;
if(_valid5 && valid35){
valid35 = false;
passing1 = [passing1, 1];
}
else {
if(_valid5){
valid35 = true;
passing1 = 1;
}
}
if(!valid35){
const err82 = {instancePath:instancePath+"/recommendation_detail",schemaPath:"#/properties/recommendation_detail/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
else {
errors = _errs99;
if(vErrors !== null){
if(_errs99){
vErrors.length = _errs99;
}
else {
vErrors = null;
}
}
}
}
if(data.evidence_domains !== undefined){
let data42 = data.evidence_domains;
if(Array.isArray(data42)){
const len4 = data42.length;
for(let i4=0; i4<len4; i4++){
if(!(validate39(data42[i4], {instancePath:instancePath+"/evidence_domains/" + i4,parentData:data42,parentDataProperty:i4,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
errors = vErrors.length;
}
}
let i5 = data42.length;
let j0;
if(i5 > 1){
outer0:
for(;i5--;){
for(j0 = i5; j0--;){
if(func0(data42[i5], data42[j0])){
const err83 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/properties/evidence_domains/uniqueItems",keyword:"uniqueItems",params:{i: i5, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i5+" are identical)"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err84 = {instancePath:instancePath+"/evidence_domains",schemaPath:"#/properties/evidence_domains/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
if(data.claims !== undefined){
let data44 = data.claims;
if(Array.isArray(data44)){
const len5 = data44.length;
for(let i6=0; i6<len5; i6++){
let data45 = data44[i6];
if(!(((((((data45 === "UNIFIED_PRICE_RISING") || (data45 === "BID_PRICE_RISING")) || (data45 === "BUY_DEMAND_STRENGTHENING")) || (data45 === "SELLABLE_SUPPLY_DECLINING")) || (data45 === "MULTI_SOURCE_ALIGNED")) || (data45 === "TRUSTED_TRADE_VOLUME_INCREASING")) || (data45 === "SWEEPING_CONFIRMED"))){
const err85 = {instancePath:instancePath+"/claims/" + i6,schemaPath:"#/properties/claims/items/enum",keyword:"enum",params:{allowedValues: schema32.properties.claims.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
let i7 = data44.length;
let j1;
if(i7 > 1){
outer1:
for(;i7--;){
for(j1 = i7; j1--;){
if(func0(data44[i7], data44[j1])){
const err86 = {instancePath:instancePath+"/claims",schemaPath:"#/properties/claims/uniqueItems",keyword:"uniqueItems",params:{i: i7, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i7+" are identical)"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err87 = {instancePath:instancePath+"/claims",schemaPath:"#/properties/claims/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
}
else {
const err88 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
validate57.errors = vErrors;
return errors === 0;
}
validate57.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema135 = {"type":"object","additionalProperties":false,"required":["published_at","document_hash"],"properties":{"published_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"document_hash":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/sha256"}}};

function validate71(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate71.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.published_at === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at"},message:"must have required property '"+"published_at"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.document_hash === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_hash"},message:"must have required property '"+"document_hash"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "published_at") || (key0 === "document_hash"))){
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
if(data.published_at !== undefined){
let data0 = data.published_at;
if(typeof data0 === "string"){
if(!pattern19.test(data0)){
const err3 = {instancePath:instancePath+"/published_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!(formats0.validate(data0))){
const err4 = {instancePath:instancePath+"/published_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err5 = {instancePath:instancePath+"/published_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.document_hash !== undefined){
let data1 = data.document_hash;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err6 = {instancePath:instancePath+"/document_hash",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err7 = {instancePath:instancePath+"/document_hash",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate71.errors = vErrors;
return errors === 0;
}
validate71.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate56(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate56.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.envelope === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "envelope"},message:"must have required property '"+"envelope"+"'"};
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
if(!((key0 === "envelope") || (key0 === "storage"))){
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
if(data.envelope !== undefined){
if(!(validate57(data.envelope, {instancePath:instancePath+"/envelope",parentData:data,parentDataProperty:"envelope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
errors = vErrors.length;
}
}
if(data.storage !== undefined){
if(!(validate71(data.storage, {instancePath:instancePath+"/storage",parentData:data,parentDataProperty:"storage",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
errors = vErrors.length;
}
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate56.errors = vErrors;
return errors === 0;
}
validate56.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate55(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate55.evaluated;
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
if(data.query_as_of === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_as_of"},message:"must have required property '"+"query_as_of"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.resource === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "resource"},message:"must have required property '"+"resource"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query_as_of")) || (key0 === "resource"))){
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
if(data.api_contract !== undefined){
if("result-read-api" !== data.api_contract){
const err6 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "result-read-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err7 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("UNIT_DETAIL" !== data.response_kind){
const err8 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "UNIT_DETAIL"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.query_as_of !== undefined){
let data3 = data.query_as_of;
if(typeof data3 === "string"){
if(!pattern19.test(data3)){
const err9 = {instancePath:instancePath+"/query_as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!(formats0.validate(data3))){
const err10 = {instancePath:instancePath+"/query_as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err11 = {instancePath:instancePath+"/query_as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.resource !== undefined){
if(!(validate56(data.resource, {instancePath:instancePath+"/resource",parentData:data,parentDataProperty:"resource",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
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
validate55.errors = vErrors;
return errors === 0;
}
validate55.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema138 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","members","next_cursor"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"UNIT_LIST"},"query":{"$ref":"#/$defs/query_binding"},"members":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/unit_resource"}},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]}}};
const schema139 = {"type":"object","additionalProperties":false,"required":["as_of","scope_kind","analysis_unit_kind","edition_kind","parent_analysis_unit_id","data_status","sort","page_size"],"properties":{"as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"scope_kind":{"enum":["MARKET","SECTOR","ITEM",null]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT",null]},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN",null]},"parent_analysis_unit_id":{"oneOf":[{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},{"type":"null"}]},"data_status":{"oneOf":[{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/data_status"},{"type":"null"}]},"sort":{"const":"ANALYSIS_UNIT_ID_ASC"},"page_size":{"type":"integer","minimum":1,"maximum":200}},"allOf":[{"if":{"anyOf":[{"properties":{"analysis_unit_kind":{"not":{"type":"null"}}}},{"properties":{"edition_kind":{"not":{"type":"null"}}}},{"properties":{"parent_analysis_unit_id":{"not":{"type":"null"}}}}]},"then":{"properties":{"scope_kind":{"const":"ITEM"}}}},{"if":{"properties":{"analysis_unit_kind":{"const":"BASE_MHN"}},"required":["analysis_unit_kind"]},"then":{"properties":{"parent_analysis_unit_id":{"type":"null"}}}}]};

function validate76(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate76.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
const _errs4 = errors;
let valid2 = false;
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.analysis_unit_kind !== undefined){
const _errs7 = errors;
const _errs8 = errors;
if(data.analysis_unit_kind !== null){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
var valid4 = _errs8 === errors;
if(valid4){
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
}
var _valid1 = _errs5 === errors;
valid2 = valid2 || _valid1;
if(_valid1){
var props0 = {};
props0.analysis_unit_kind = true;
}
const _errs10 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.edition_kind !== undefined){
const _errs12 = errors;
const _errs13 = errors;
if(data.edition_kind !== null){
const err2 = {};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
var valid6 = _errs13 === errors;
if(valid6){
const err3 = {};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
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
}
var _valid1 = _errs10 === errors;
valid2 = valid2 || _valid1;
if(_valid1){
if(props0 !== true){
props0 = props0 || {};
props0.edition_kind = true;
}
}
const _errs15 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.parent_analysis_unit_id !== undefined){
const _errs17 = errors;
const _errs18 = errors;
if(data.parent_analysis_unit_id !== null){
const err4 = {};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var valid8 = _errs18 === errors;
if(valid8){
const err5 = {};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
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
}
var _valid1 = _errs15 === errors;
valid2 = valid2 || _valid1;
if(_valid1){
if(props0 !== true){
props0 = props0 || {};
props0.parent_analysis_unit_id = true;
}
}
if(!valid2){
const err6 = {};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
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
const _errs20 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.scope_kind !== undefined){
if("ITEM" !== data.scope_kind){
const err7 = {instancePath:instancePath+"/scope_kind",schemaPath:"#/allOf/0/then/properties/scope_kind/const",keyword:"const",params:{allowedValue: "ITEM"},message:"must be equal to constant"};
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
var _valid0 = _errs20 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.scope_kind = true;
}
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
const _errs23 = errors;
let valid10 = true;
const _errs24 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.analysis_unit_kind === undefined) && (missing0 = "analysis_unit_kind")){
const err9 = {};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
else {
if(data.analysis_unit_kind !== undefined){
if("BASE_MHN" !== data.analysis_unit_kind){
const err10 = {};
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
}
var _valid2 = _errs24 === errors;
errors = _errs23;
if(vErrors !== null){
if(_errs23){
vErrors.length = _errs23;
}
else {
vErrors = null;
}
}
if(_valid2){
const _errs26 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.parent_analysis_unit_id !== undefined){
if(data.parent_analysis_unit_id !== null){
const err11 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/allOf/1/then/properties/parent_analysis_unit_id/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
var _valid2 = _errs26 === errors;
valid10 = _valid2;
if(valid10){
var props1 = {};
props1.parent_analysis_unit_id = true;
props1.analysis_unit_kind = true;
}
}
if(!valid10){
const err12 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.as_of === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "as_of"},message:"must have required property '"+"as_of"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.scope_kind === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_kind"},message:"must have required property '"+"scope_kind"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.analysis_unit_kind === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_kind"},message:"must have required property '"+"analysis_unit_kind"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.edition_kind === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "edition_kind"},message:"must have required property '"+"edition_kind"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.parent_analysis_unit_id === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parent_analysis_unit_id"},message:"must have required property '"+"parent_analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.data_status === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_status"},message:"must have required property '"+"data_status"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.sort === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sort"},message:"must have required property '"+"sort"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.page_size === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "as_of") || (key0 === "scope_kind")) || (key0 === "analysis_unit_kind")) || (key0 === "edition_kind")) || (key0 === "parent_analysis_unit_id")) || (key0 === "data_status")) || (key0 === "sort")) || (key0 === "page_size"))){
const err21 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.as_of !== undefined){
let data6 = data.as_of;
if(typeof data6 === "string"){
if(!pattern19.test(data6)){
const err22 = {instancePath:instancePath+"/as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!(formats0.validate(data6))){
const err23 = {instancePath:instancePath+"/as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err24 = {instancePath:instancePath+"/as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.scope_kind !== undefined){
let data7 = data.scope_kind;
if(!((((data7 === "MARKET") || (data7 === "SECTOR")) || (data7 === "ITEM")) || (data7 === null))){
const err25 = {instancePath:instancePath+"/scope_kind",schemaPath:"#/properties/scope_kind/enum",keyword:"enum",params:{allowedValues: schema139.properties.scope_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.analysis_unit_kind !== undefined){
let data8 = data.analysis_unit_kind;
if(!((((data8 === "BASE_MHN") || (data8 === "STYLE_VARIANT")) || (data8 === "PATTERN_VARIANT")) || (data8 === null))){
const err26 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema139.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
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
let data9 = data.edition_kind;
if(!(((((data9 === "STANDARD") || (data9 === "STATTRAK")) || (data9 === "SOUVENIR")) || (data9 === "UNKNOWN")) || (data9 === null))){
const err27 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema139.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.parent_analysis_unit_id !== undefined){
let data10 = data.parent_analysis_unit_id;
const _errs37 = errors;
let valid15 = false;
let passing0 = null;
const _errs38 = errors;
if(typeof data10 === "string"){
if(func2(data10) < 1){
const err28 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(!pattern4.test(data10)){
const err29 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err30 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
var _valid3 = _errs38 === errors;
if(_valid3){
valid15 = true;
passing0 = 0;
}
const _errs41 = errors;
if(data10 !== null){
const err31 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
var _valid3 = _errs41 === errors;
if(_valid3 && valid15){
valid15 = false;
passing0 = [passing0, 1];
}
else {
if(_valid3){
valid15 = true;
passing0 = 1;
}
}
if(!valid15){
const err32 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
else {
errors = _errs37;
if(vErrors !== null){
if(_errs37){
vErrors.length = _errs37;
}
else {
vErrors = null;
}
}
}
}
if(data.data_status !== undefined){
let data11 = data.data_status;
const _errs44 = errors;
let valid17 = false;
let passing1 = null;
const _errs45 = errors;
if(!((((((((data11 === "COMPLETE") || (data11 === "UNAVAILABLE_BY_DESIGN")) || (data11 === "DEGRADED_OPTIONAL")) || (data11 === "DATA_UNAVAILABLE_RUNTIME_GRACE")) || (data11 === "STALE_GRACE")) || (data11 === "DATA_UNAVAILABLE_RUNTIME")) || (data11 === "STALE")) || (data11 === "CONFLICTED"))){
const err33 = {instancePath:instancePath+"/data_status",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/data_status/enum",keyword:"enum",params:{allowedValues: schema69.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
var _valid4 = _errs45 === errors;
if(_valid4){
valid17 = true;
passing1 = 0;
}
const _errs47 = errors;
if(data11 !== null){
const err34 = {instancePath:instancePath+"/data_status",schemaPath:"#/properties/data_status/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
var _valid4 = _errs47 === errors;
if(_valid4 && valid17){
valid17 = false;
passing1 = [passing1, 1];
}
else {
if(_valid4){
valid17 = true;
passing1 = 1;
}
}
if(!valid17){
const err35 = {instancePath:instancePath+"/data_status",schemaPath:"#/properties/data_status/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
else {
errors = _errs44;
if(vErrors !== null){
if(_errs44){
vErrors.length = _errs44;
}
else {
vErrors = null;
}
}
}
}
if(data.sort !== undefined){
if("ANALYSIS_UNIT_ID_ASC" !== data.sort){
const err36 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/const",keyword:"const",params:{allowedValue: "ANALYSIS_UNIT_ID_ASC"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.page_size !== undefined){
let data13 = data.page_size;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err37 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 > 200 || isNaN(data13)){
const err38 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 200},message:"must be <= 200"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data13 < 1 || isNaN(data13)){
const err39 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
validate76.errors = vErrors;
return errors === 0;
}
validate76.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const pattern73 = new RegExp("^[A-Za-z0-9_-]+$", "u");

function validate75(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate75.evaluated;
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
if("result-read-api" !== data.api_contract){
const err7 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "result-read-api"},message:"must be equal to constant"};
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
if("UNIT_LIST" !== data.response_kind){
const err9 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "UNIT_LIST"},message:"must be equal to constant"};
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
if(!(validate76(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate76.errors : vErrors.concat(validate76.errors);
errors = vErrors.length;
}
}
if(data.members !== undefined){
let data4 = data.members;
if(Array.isArray(data4)){
if(data4.length > 200){
const err10 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 200},message:"must NOT have more than 200 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate56(data4[i0], {instancePath:instancePath+"/members/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data6 = data.next_cursor;
const _errs10 = errors;
let valid3 = false;
let passing0 = null;
const _errs11 = errors;
if(typeof data6 === "string"){
if(func2(data6) > 8192){
const err12 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func2(data6) < 1){
const err13 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern73.test(data6)){
const err14 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
const err15 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs11 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs13 = errors;
if(data6 !== null){
const err16 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
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
const err17 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
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
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate75.errors = vErrors;
return errors === 0;
}
validate75.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema143 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query_as_of","resource"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"COLLECTION_DETAIL"},"query_as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"resource":{"$ref":"#/$defs/collection_resource"}}};
const schema145 = {"type":"object","additionalProperties":false,"required":["envelope","storage"],"properties":{"envelope":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/collection_result"},"storage":{"$ref":"#/$defs/storage_metadata"}}};
const schema86 = {"type":"object","additionalProperties":false,"required":["snapshot_id","contract_code","contract_version","envelope_kind","collection_id","scope_kind","as_of","available_at","data_branch","data_status","versions","member_count","returned_member_count","member_result_ids","missing_member_ids","unavailable_member_ids"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"contract_code":{"const":"research-result-envelope"},"contract_version":{"const":"v1"},"envelope_kind":{"const":"COLLECTION"},"collection_id":{"$ref":"#/$defs/nonblank_text"},"scope_kind":{"$ref":"#/$defs/scope_kind"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"data_branch":{"$ref":"#/$defs/data_branch"},"data_status":{"$ref":"#/$defs/data_status"},"versions":{"$ref":"#/$defs/versions"},"member_count":{"type":"integer","minimum":0},"returned_member_count":{"type":"integer","minimum":0},"member_result_ids":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/sha256"}},"missing_member_ids":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/nonblank_text"}},"unavailable_member_ids":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/nonblank_text"}}}};

function validate82(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate82.evaluated;
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
if(data.contract_code === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_code"},message:"must have required property '"+"contract_code"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.contract_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_version"},message:"must have required property '"+"contract_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.envelope_kind === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "envelope_kind"},message:"must have required property '"+"envelope_kind"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.collection_id === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "collection_id"},message:"must have required property '"+"collection_id"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.scope_kind === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_kind"},message:"must have required property '"+"scope_kind"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.as_of === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "as_of"},message:"must have required property '"+"as_of"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.available_at === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.data_branch === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_branch"},message:"must have required property '"+"data_branch"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.data_status === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "data_status"},message:"must have required property '"+"data_status"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.versions === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "versions"},message:"must have required property '"+"versions"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.member_count === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_count"},message:"must have required property '"+"member_count"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.returned_member_count === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "returned_member_count"},message:"must have required property '"+"returned_member_count"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.member_result_ids === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_result_ids"},message:"must have required property '"+"member_result_ids"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.missing_member_ids === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "missing_member_ids"},message:"must have required property '"+"missing_member_ids"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.unavailable_member_ids === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "unavailable_member_ids"},message:"must have required property '"+"unavailable_member_ids"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema86.properties, key0))){
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
if(data.snapshot_id !== undefined){
let data0 = data.snapshot_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err17 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err18 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.contract_code !== undefined){
if("research-result-envelope" !== data.contract_code){
const err19 = {instancePath:instancePath+"/contract_code",schemaPath:"#/properties/contract_code/const",keyword:"const",params:{allowedValue: "research-result-envelope"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.contract_version !== undefined){
if("v1" !== data.contract_version){
const err20 = {instancePath:instancePath+"/contract_version",schemaPath:"#/properties/contract_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.envelope_kind !== undefined){
if("COLLECTION" !== data.envelope_kind){
const err21 = {instancePath:instancePath+"/envelope_kind",schemaPath:"#/properties/envelope_kind/const",keyword:"const",params:{allowedValue: "COLLECTION"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.collection_id !== undefined){
let data4 = data.collection_id;
if(typeof data4 === "string"){
if(func2(data4) < 1){
const err22 = {instancePath:instancePath+"/collection_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!pattern4.test(data4)){
const err23 = {instancePath:instancePath+"/collection_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err24 = {instancePath:instancePath+"/collection_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.scope_kind !== undefined){
let data5 = data.scope_kind;
if(!(((data5 === "MARKET") || (data5 === "SECTOR")) || (data5 === "ITEM"))){
const err25 = {instancePath:instancePath+"/scope_kind",schemaPath:"#/$defs/scope_kind/enum",keyword:"enum",params:{allowedValues: schema61.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.as_of !== undefined){
let data6 = data.as_of;
if(typeof data6 === "string"){
if(!pattern19.test(data6)){
const err26 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(!(formats0.validate(data6))){
const err27 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err28 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.available_at !== undefined){
let data7 = data.available_at;
if(typeof data7 === "string"){
if(!pattern19.test(data7)){
const err29 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(!(formats0.validate(data7))){
const err30 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err31 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.data_branch !== undefined){
let data8 = data.data_branch;
if(!((data8 === "A") || (data8 === "B"))){
const err32 = {instancePath:instancePath+"/data_branch",schemaPath:"#/$defs/data_branch/enum",keyword:"enum",params:{allowedValues: schema68.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.data_status !== undefined){
let data9 = data.data_status;
if(!((((((((data9 === "COMPLETE") || (data9 === "UNAVAILABLE_BY_DESIGN")) || (data9 === "DEGRADED_OPTIONAL")) || (data9 === "DATA_UNAVAILABLE_RUNTIME_GRACE")) || (data9 === "STALE_GRACE")) || (data9 === "DATA_UNAVAILABLE_RUNTIME")) || (data9 === "STALE")) || (data9 === "CONFLICTED"))){
const err33 = {instancePath:instancePath+"/data_status",schemaPath:"#/$defs/data_status/enum",keyword:"enum",params:{allowedValues: schema69.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.versions !== undefined){
if(!(validate33(data.versions, {instancePath:instancePath+"/versions",parentData:data,parentDataProperty:"versions",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate33.errors : vErrors.concat(validate33.errors);
errors = vErrors.length;
}
}
if(data.member_count !== undefined){
let data11 = data.member_count;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err34 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 < 0 || isNaN(data11)){
const err35 = {instancePath:instancePath+"/member_count",schemaPath:"#/properties/member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.returned_member_count !== undefined){
let data12 = data.returned_member_count;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err36 = {instancePath:instancePath+"/returned_member_count",schemaPath:"#/properties/returned_member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 < 0 || isNaN(data12)){
const err37 = {instancePath:instancePath+"/returned_member_count",schemaPath:"#/properties/returned_member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.member_result_ids !== undefined){
let data13 = data.member_result_ids;
if(Array.isArray(data13)){
const len0 = data13.length;
for(let i0=0; i0<len0; i0++){
let data14 = data13[i0];
if(typeof data14 === "string"){
if(!pattern5.test(data14)){
const err38 = {instancePath:instancePath+"/member_result_ids/" + i0,schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err39 = {instancePath:instancePath+"/member_result_ids/" + i0,schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
let i1 = data13.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data13[i1], data13[j0])){
const err40 = {instancePath:instancePath+"/member_result_ids",schemaPath:"#/properties/member_result_ids/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err41 = {instancePath:instancePath+"/member_result_ids",schemaPath:"#/properties/member_result_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.missing_member_ids !== undefined){
let data15 = data.missing_member_ids;
if(Array.isArray(data15)){
const len1 = data15.length;
for(let i2=0; i2<len1; i2++){
let data16 = data15[i2];
if(typeof data16 === "string"){
if(func2(data16) < 1){
const err42 = {instancePath:instancePath+"/missing_member_ids/" + i2,schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(!pattern4.test(data16)){
const err43 = {instancePath:instancePath+"/missing_member_ids/" + i2,schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err44 = {instancePath:instancePath+"/missing_member_ids/" + i2,schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
let i3 = data15.length;
let j1;
if(i3 > 1){
outer1:
for(;i3--;){
for(j1 = i3; j1--;){
if(func0(data15[i3], data15[j1])){
const err45 = {instancePath:instancePath+"/missing_member_ids",schemaPath:"#/properties/missing_member_ids/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err46 = {instancePath:instancePath+"/missing_member_ids",schemaPath:"#/properties/missing_member_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.unavailable_member_ids !== undefined){
let data17 = data.unavailable_member_ids;
if(Array.isArray(data17)){
const len2 = data17.length;
for(let i4=0; i4<len2; i4++){
let data18 = data17[i4];
if(typeof data18 === "string"){
if(func2(data18) < 1){
const err47 = {instancePath:instancePath+"/unavailable_member_ids/" + i4,schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(!pattern4.test(data18)){
const err48 = {instancePath:instancePath+"/unavailable_member_ids/" + i4,schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err49 = {instancePath:instancePath+"/unavailable_member_ids/" + i4,schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
let i5 = data17.length;
let j2;
if(i5 > 1){
outer2:
for(;i5--;){
for(j2 = i5; j2--;){
if(func0(data17[i5], data17[j2])){
const err50 = {instancePath:instancePath+"/unavailable_member_ids",schemaPath:"#/properties/unavailable_member_ids/uniqueItems",keyword:"uniqueItems",params:{i: i5, j: j2},message:"must NOT have duplicate items (items ## "+j2+" and "+i5+" are identical)"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
break outer2;
}
}
}
}
}
else {
const err51 = {instancePath:instancePath+"/unavailable_member_ids",schemaPath:"#/properties/unavailable_member_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
validate82.errors = vErrors;
return errors === 0;
}
validate82.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate81(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate81.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.envelope === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "envelope"},message:"must have required property '"+"envelope"+"'"};
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
if(!((key0 === "envelope") || (key0 === "storage"))){
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
if(data.envelope !== undefined){
if(!(validate82(data.envelope, {instancePath:instancePath+"/envelope",parentData:data,parentDataProperty:"envelope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate82.errors : vErrors.concat(validate82.errors);
errors = vErrors.length;
}
}
if(data.storage !== undefined){
if(!(validate71(data.storage, {instancePath:instancePath+"/storage",parentData:data,parentDataProperty:"storage",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
errors = vErrors.length;
}
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate81.errors = vErrors;
return errors === 0;
}
validate81.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate80(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate80.evaluated;
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
if(data.query_as_of === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_as_of"},message:"must have required property '"+"query_as_of"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.resource === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "resource"},message:"must have required property '"+"resource"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query_as_of")) || (key0 === "resource"))){
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
if(data.api_contract !== undefined){
if("result-read-api" !== data.api_contract){
const err6 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "result-read-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err7 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("COLLECTION_DETAIL" !== data.response_kind){
const err8 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "COLLECTION_DETAIL"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.query_as_of !== undefined){
let data3 = data.query_as_of;
if(typeof data3 === "string"){
if(!pattern19.test(data3)){
const err9 = {instancePath:instancePath+"/query_as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!(formats0.validate(data3))){
const err10 = {instancePath:instancePath+"/query_as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err11 = {instancePath:instancePath+"/query_as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.resource !== undefined){
if(!(validate81(data.resource, {instancePath:instancePath+"/resource",parentData:data,parentDataProperty:"resource",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate81.errors : vErrors.concat(validate81.errors);
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
validate80.errors = vErrors;
return errors === 0;
}
validate80.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema157 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query_as_of","resource"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"QUALITY_DETAIL"},"query_as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"resource":{"$ref":"#/$defs/quality_resource"}}};
const schema159 = {"type":"object","additionalProperties":false,"required":["envelope","storage"],"properties":{"envelope":{"$ref":"urn:cs2-research:research-quality-envelope:v1"},"storage":{"$ref":"#/$defs/storage_metadata"}}};
const schema97 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:research-quality-envelope:v1","title":"CS2 provider-neutral research quality envelope v1 candidate","type":"object","additionalProperties":false,"required":["snapshot_id","contract_code","contract_version","envelope_kind","identity","as_of","available_at","policy_version","input_quality_snapshot_id","expected_cell_count","observed_cell_count","fresh_cell_count","coverage_ratio","fresh_coverage_ratio","missing_cell_count","stale_cell_count","future_fact_count","source_summaries","conflicts","query_observations"],"properties":{"snapshot_id":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/sha256"},"contract_code":{"const":"research-quality-envelope"},"contract_version":{"const":"v1"},"envelope_kind":{"const":"QUALITY"},"identity":{"allOf":[{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/identity"},{"type":"object","properties":{"scope_kind":{"const":"ITEM"}}}]},"as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"available_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"policy_version":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"input_quality_snapshot_id":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"expected_cell_count":{"type":"integer","minimum":0},"observed_cell_count":{"type":"integer","minimum":0},"fresh_cell_count":{"type":"integer","minimum":0},"coverage_ratio":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/ratio_decimal_text"},"fresh_coverage_ratio":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/ratio_decimal_text"},"missing_cell_count":{"type":"integer","minimum":0},"stale_cell_count":{"type":"integer","minimum":0},"future_fact_count":{"type":"integer","minimum":0},"source_summaries":{"type":"array","items":{"$ref":"#/$defs/source_summary"}},"conflicts":{"type":"array","items":{"$ref":"#/$defs/conflict_summary"}},"query_observations":{"type":"array","items":{"$ref":"#/$defs/query_observation"}}},"$defs":{"nonnegative_decimal_text":{"type":"string","pattern":"^(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$"},"source_summary":{"type":"object","additionalProperties":false,"required":["source_ref","expected_feature_count","observed_feature_count","fresh_feature_count","missing_feature_count","stale_feature_count"],"properties":{"source_ref":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"expected_feature_count":{"type":"integer","minimum":0},"observed_feature_count":{"type":"integer","minimum":0},"fresh_feature_count":{"type":"integer","minimum":0},"missing_feature_count":{"type":"integer","minimum":0},"stale_feature_count":{"type":"integer","minimum":0}}},"conflict_summary":{"type":"object","additionalProperties":false,"required":["feature_key","reason_code","participating_source_refs","source_fact_count","relative_dispersion"],"properties":{"feature_key":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"reason_code":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"participating_source_refs":{"type":"array","uniqueItems":true,"items":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"}},"source_fact_count":{"type":"integer","minimum":1},"relative_dispersion":{"oneOf":[{"$ref":"#/$defs/nonnegative_decimal_text"},{"type":"null"}]}}},"query_observation":{"type":"object","additionalProperties":false,"required":["observation_id","source_ref","query_kind","sample_state","capability_state","returned_member_count","observed_at","available_at"],"properties":{"observation_id":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"source_ref":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"query_kind":{"enum":["BASE_QUOTE","LISTING_PAGE","STYLE_LISTING","STYLE_BID","MARKET_SNAPSHOT"]},"sample_state":{"enum":["POSITIVE_SAMPLE","ZERO_CURRENT_SAMPLE"]},"capability_state":{"enum":["CONFIRMED","UNKNOWN","NOT_APPLICABLE"]},"returned_member_count":{"type":"integer","minimum":0},"observed_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"available_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"}}}}};

function validate46(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate46.evaluated;
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
if((data.scope_kind === undefined) && (missing0 = "scope_kind")){
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
if(data.scope_kind !== undefined){
if("ITEM" !== data.scope_kind){
const err1 = {};
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
if(data.analysis_unit_kind !== undefined){
let data1 = data.analysis_unit_kind;
if(!(((data1 === "BASE_MHN") || (data1 === "STYLE_VARIANT")) || (data1 === "PATTERN_VARIANT"))){
const err2 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/allOf/0/then/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema58.allOf[0].then.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.edition_kind !== undefined){
let data2 = data.edition_kind;
if(!((((data2 === "STANDARD") || (data2 === "STATTRAK")) || (data2 === "SOUVENIR")) || (data2 === "UNKNOWN"))){
const err3 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/allOf/0/then/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema58.allOf[0].then.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
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
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.analysis_unit_kind = true;
props0.edition_kind = true;
props0.scope_kind = true;
}
ifClause0 = "then";
}
else {
const _errs8 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.analysis_unit_kind !== undefined){
if(data.analysis_unit_kind !== null){
const err4 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/allOf/0/else/properties/analysis_unit_kind/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.edition_kind !== undefined){
if(data.edition_kind !== null){
const err5 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/allOf/0/else/properties/edition_kind/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.parent_analysis_unit_id !== undefined){
if(data.parent_analysis_unit_id !== null){
const err6 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/allOf/0/else/properties/parent_analysis_unit_id/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
var _valid0 = _errs8 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.analysis_unit_kind = true;
props0.edition_kind = true;
props0.parent_analysis_unit_id = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err7 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
const _errs16 = errors;
let valid5 = true;
const _errs17 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if(((data.scope_kind === undefined) && (missing1 = "scope_kind")) || ((data.analysis_unit_kind === undefined) && (missing1 = "analysis_unit_kind"))){
const err8 = {};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
if(data.scope_kind !== undefined){
const _errs18 = errors;
if("ITEM" !== data.scope_kind){
const err9 = {};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var valid6 = _errs18 === errors;
}
else {
var valid6 = true;
}
if(valid6){
if(data.analysis_unit_kind !== undefined){
const _errs19 = errors;
if("BASE_MHN" !== data.analysis_unit_kind){
const err10 = {};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var valid6 = _errs19 === errors;
}
else {
var valid6 = true;
}
}
}
}
var _valid1 = _errs17 === errors;
errors = _errs16;
if(vErrors !== null){
if(_errs16){
vErrors.length = _errs16;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs20 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.parent_analysis_unit_id !== undefined){
if(data.parent_analysis_unit_id !== null){
const err11 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/allOf/1/then/properties/parent_analysis_unit_id/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
var _valid1 = _errs20 === errors;
valid5 = _valid1;
if(valid5){
var props1 = {};
props1.parent_analysis_unit_id = true;
props1.scope_kind = true;
props1.analysis_unit_kind = true;
}
}
if(!valid5){
const err12 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
const _errs24 = errors;
let valid8 = true;
const _errs25 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if(((data.scope_kind === undefined) && (missing2 = "scope_kind")) || ((data.analysis_unit_kind === undefined) && (missing2 = "analysis_unit_kind"))){
const err13 = {};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
if(data.scope_kind !== undefined){
const _errs26 = errors;
if("ITEM" !== data.scope_kind){
const err14 = {};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var valid9 = _errs26 === errors;
}
else {
var valid9 = true;
}
if(valid9){
if(data.analysis_unit_kind !== undefined){
let data10 = data.analysis_unit_kind;
const _errs27 = errors;
if(!((data10 === "STYLE_VARIANT") || (data10 === "PATTERN_VARIANT"))){
const err15 = {};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var valid9 = _errs27 === errors;
}
else {
var valid9 = true;
}
}
}
}
var _valid2 = _errs25 === errors;
errors = _errs24;
if(vErrors !== null){
if(_errs24){
vErrors.length = _errs24;
}
else {
vErrors = null;
}
}
if(_valid2){
const _errs28 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.parent_analysis_unit_id !== undefined){
let data11 = data.parent_analysis_unit_id;
if(typeof data11 === "string"){
if(func2(data11) < 1){
const err16 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern4.test(data11)){
const err17 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err18 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
var _valid2 = _errs28 === errors;
valid8 = _valid2;
if(valid8){
var props2 = {};
props2.parent_analysis_unit_id = true;
props2.scope_kind = true;
props2.analysis_unit_kind = true;
}
}
if(!valid8){
const err19 = {instancePath,schemaPath:"#/allOf/2/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(props0 !== true && props2 !== undefined){
if(props2 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props2);
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.analysis_unit_id === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.scope_kind === undefined){
const err21 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_kind"},message:"must have required property '"+"scope_kind"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.display_name === undefined){
const err22 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "display_name"},message:"must have required property '"+"display_name"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data.identity_available_at === undefined){
const err23 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identity_available_at"},message:"must have required property '"+"identity_available_at"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data.catalog_version === undefined){
const err24 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_version"},message:"must have required property '"+"catalog_version"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data.analysis_unit_kind === undefined){
const err25 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_kind"},message:"must have required property '"+"analysis_unit_kind"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data.edition_kind === undefined){
const err26 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "edition_kind"},message:"must have required property '"+"edition_kind"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data.parent_analysis_unit_id === undefined){
const err27 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parent_analysis_unit_id"},message:"must have required property '"+"parent_analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "analysis_unit_id") || (key0 === "scope_kind")) || (key0 === "display_name")) || (key0 === "identity_available_at")) || (key0 === "catalog_version")) || (key0 === "analysis_unit_kind")) || (key0 === "edition_kind")) || (key0 === "parent_analysis_unit_id"))){
const err28 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data12 = data.analysis_unit_id;
if(typeof data12 === "string"){
if(func2(data12) < 1){
const err29 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(!pattern4.test(data12)){
const err30 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err31 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.scope_kind !== undefined){
let data13 = data.scope_kind;
if(!(((data13 === "MARKET") || (data13 === "SECTOR")) || (data13 === "ITEM"))){
const err32 = {instancePath:instancePath+"/scope_kind",schemaPath:"#/$defs/scope_kind/enum",keyword:"enum",params:{allowedValues: schema61.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.display_name !== undefined){
let data14 = data.display_name;
if(typeof data14 === "string"){
if(func2(data14) < 1){
const err33 = {instancePath:instancePath+"/display_name",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(!pattern4.test(data14)){
const err34 = {instancePath:instancePath+"/display_name",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err35 = {instancePath:instancePath+"/display_name",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.identity_available_at !== undefined){
let data15 = data.identity_available_at;
if(typeof data15 === "string"){
if(!pattern19.test(data15)){
const err36 = {instancePath:instancePath+"/identity_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(!(formats0.validate(data15))){
const err37 = {instancePath:instancePath+"/identity_available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err38 = {instancePath:instancePath+"/identity_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.catalog_version !== undefined){
let data16 = data.catalog_version;
if(typeof data16 === "string"){
if(func2(data16) < 1){
const err39 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(!pattern4.test(data16)){
const err40 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err41 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.analysis_unit_kind !== undefined){
let data17 = data.analysis_unit_kind;
if((typeof data17 !== "string") && (data17 !== null)){
const err42 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/type",keyword:"type",params:{type: schema58.properties.analysis_unit_kind.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(!((((data17 === "BASE_MHN") || (data17 === "STYLE_VARIANT")) || (data17 === "PATTERN_VARIANT")) || (data17 === null))){
const err43 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema58.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data.edition_kind !== undefined){
let data18 = data.edition_kind;
if((typeof data18 !== "string") && (data18 !== null)){
const err44 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/type",keyword:"type",params:{type: schema58.properties.edition_kind.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(!(((((data18 === "STANDARD") || (data18 === "STATTRAK")) || (data18 === "SOUVENIR")) || (data18 === "UNKNOWN")) || (data18 === null))){
const err45 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema58.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.parent_analysis_unit_id !== undefined){
let data19 = data.parent_analysis_unit_id;
const _errs52 = errors;
let valid18 = false;
let passing0 = null;
const _errs53 = errors;
if(typeof data19 === "string"){
if(func2(data19) < 1){
const err46 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(!pattern4.test(data19)){
const err47 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err48 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
var _valid3 = _errs53 === errors;
if(_valid3){
valid18 = true;
passing0 = 0;
}
const _errs56 = errors;
if(data19 !== null){
const err49 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
var _valid3 = _errs56 === errors;
if(_valid3 && valid18){
valid18 = false;
passing0 = [passing0, 1];
}
else {
if(_valid3){
valid18 = true;
passing0 = 1;
}
}
if(!valid18){
const err50 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
else {
errors = _errs52;
if(vErrors !== null){
if(_errs52){
vErrors.length = _errs52;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err51 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
validate46.errors = vErrors;
return errors === 0;
}
validate46.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema113 = {"type":"object","additionalProperties":false,"required":["source_ref","expected_feature_count","observed_feature_count","fresh_feature_count","missing_feature_count","stale_feature_count"],"properties":{"source_ref":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"expected_feature_count":{"type":"integer","minimum":0},"observed_feature_count":{"type":"integer","minimum":0},"fresh_feature_count":{"type":"integer","minimum":0},"missing_feature_count":{"type":"integer","minimum":0},"stale_feature_count":{"type":"integer","minimum":0}}};

function validate48(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate48.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.source_ref === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_ref"},message:"must have required property '"+"source_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.expected_feature_count === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expected_feature_count"},message:"must have required property '"+"expected_feature_count"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.observed_feature_count === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observed_feature_count"},message:"must have required property '"+"observed_feature_count"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.fresh_feature_count === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fresh_feature_count"},message:"must have required property '"+"fresh_feature_count"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.missing_feature_count === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "missing_feature_count"},message:"must have required property '"+"missing_feature_count"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.stale_feature_count === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stale_feature_count"},message:"must have required property '"+"stale_feature_count"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "source_ref") || (key0 === "expected_feature_count")) || (key0 === "observed_feature_count")) || (key0 === "fresh_feature_count")) || (key0 === "missing_feature_count")) || (key0 === "stale_feature_count"))){
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
if(data.source_ref !== undefined){
let data0 = data.source_ref;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err7 = {instancePath:instancePath+"/source_ref",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern4.test(data0)){
const err8 = {instancePath:instancePath+"/source_ref",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err9 = {instancePath:instancePath+"/source_ref",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.expected_feature_count !== undefined){
let data1 = data.expected_feature_count;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err10 = {instancePath:instancePath+"/expected_feature_count",schemaPath:"#/properties/expected_feature_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 < 0 || isNaN(data1)){
const err11 = {instancePath:instancePath+"/expected_feature_count",schemaPath:"#/properties/expected_feature_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.observed_feature_count !== undefined){
let data2 = data.observed_feature_count;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err12 = {instancePath:instancePath+"/observed_feature_count",schemaPath:"#/properties/observed_feature_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 < 0 || isNaN(data2)){
const err13 = {instancePath:instancePath+"/observed_feature_count",schemaPath:"#/properties/observed_feature_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.fresh_feature_count !== undefined){
let data3 = data.fresh_feature_count;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err14 = {instancePath:instancePath+"/fresh_feature_count",schemaPath:"#/properties/fresh_feature_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 < 0 || isNaN(data3)){
const err15 = {instancePath:instancePath+"/fresh_feature_count",schemaPath:"#/properties/fresh_feature_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.missing_feature_count !== undefined){
let data4 = data.missing_feature_count;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err16 = {instancePath:instancePath+"/missing_feature_count",schemaPath:"#/properties/missing_feature_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 < 0 || isNaN(data4)){
const err17 = {instancePath:instancePath+"/missing_feature_count",schemaPath:"#/properties/missing_feature_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.stale_feature_count !== undefined){
let data5 = data.stale_feature_count;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err18 = {instancePath:instancePath+"/stale_feature_count",schemaPath:"#/properties/stale_feature_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 < 0 || isNaN(data5)){
const err19 = {instancePath:instancePath+"/stale_feature_count",schemaPath:"#/properties/stale_feature_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
validate48.errors = vErrors;
return errors === 0;
}
validate48.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema115 = {"type":"object","additionalProperties":false,"required":["feature_key","reason_code","participating_source_refs","source_fact_count","relative_dispersion"],"properties":{"feature_key":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"reason_code":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"participating_source_refs":{"type":"array","uniqueItems":true,"items":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"}},"source_fact_count":{"type":"integer","minimum":1},"relative_dispersion":{"oneOf":[{"$ref":"#/$defs/nonnegative_decimal_text"},{"type":"null"}]}}};
const schema119 = {"type":"string","pattern":"^(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$"};
const pattern60 = new RegExp("^(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$", "u");

function validate50(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate50.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.feature_key === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "feature_key"},message:"must have required property '"+"feature_key"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.reason_code === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason_code"},message:"must have required property '"+"reason_code"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.participating_source_refs === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "participating_source_refs"},message:"must have required property '"+"participating_source_refs"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.source_fact_count === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_fact_count"},message:"must have required property '"+"source_fact_count"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.relative_dispersion === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "relative_dispersion"},message:"must have required property '"+"relative_dispersion"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "feature_key") || (key0 === "reason_code")) || (key0 === "participating_source_refs")) || (key0 === "source_fact_count")) || (key0 === "relative_dispersion"))){
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
if(data.feature_key !== undefined){
let data0 = data.feature_key;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err6 = {instancePath:instancePath+"/feature_key",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern4.test(data0)){
const err7 = {instancePath:instancePath+"/feature_key",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err8 = {instancePath:instancePath+"/feature_key",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.reason_code !== undefined){
let data1 = data.reason_code;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err9 = {instancePath:instancePath+"/reason_code",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern4.test(data1)){
const err10 = {instancePath:instancePath+"/reason_code",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/reason_code",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.participating_source_refs !== undefined){
let data2 = data.participating_source_refs;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(typeof data3 === "string"){
if(func2(data3) < 1){
const err12 = {instancePath:instancePath+"/participating_source_refs/" + i0,schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern4.test(data3)){
const err13 = {instancePath:instancePath+"/participating_source_refs/" + i0,schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err14 = {instancePath:instancePath+"/participating_source_refs/" + i0,schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data2[i1], data2[j0])){
const err15 = {instancePath:instancePath+"/participating_source_refs",schemaPath:"#/properties/participating_source_refs/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err16 = {instancePath:instancePath+"/participating_source_refs",schemaPath:"#/properties/participating_source_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.source_fact_count !== undefined){
let data4 = data.source_fact_count;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err17 = {instancePath:instancePath+"/source_fact_count",schemaPath:"#/properties/source_fact_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 < 1 || isNaN(data4)){
const err18 = {instancePath:instancePath+"/source_fact_count",schemaPath:"#/properties/source_fact_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.relative_dispersion !== undefined){
let data5 = data.relative_dispersion;
const _errs16 = errors;
let valid7 = false;
let passing0 = null;
const _errs17 = errors;
if(typeof data5 === "string"){
if(!pattern60.test(data5)){
const err19 = {instancePath:instancePath+"/relative_dispersion",schemaPath:"#/$defs/nonnegative_decimal_text/pattern",keyword:"pattern",params:{pattern: "^(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$"},message:"must match pattern \""+"^(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$"+"\""};
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
const err20 = {instancePath:instancePath+"/relative_dispersion",schemaPath:"#/$defs/nonnegative_decimal_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid0 = _errs17 === errors;
if(_valid0){
valid7 = true;
passing0 = 0;
}
const _errs20 = errors;
if(data5 !== null){
const err21 = {instancePath:instancePath+"/relative_dispersion",schemaPath:"#/properties/relative_dispersion/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
var _valid0 = _errs20 === errors;
if(_valid0 && valid7){
valid7 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid7 = true;
passing0 = 1;
}
}
if(!valid7){
const err22 = {instancePath:instancePath+"/relative_dispersion",schemaPath:"#/properties/relative_dispersion/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
else {
errors = _errs16;
if(vErrors !== null){
if(_errs16){
vErrors.length = _errs16;
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
validate50.errors = vErrors;
return errors === 0;
}
validate50.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema120 = {"type":"object","additionalProperties":false,"required":["observation_id","source_ref","query_kind","sample_state","capability_state","returned_member_count","observed_at","available_at"],"properties":{"observation_id":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"source_ref":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"query_kind":{"enum":["BASE_QUOTE","LISTING_PAGE","STYLE_LISTING","STYLE_BID","MARKET_SNAPSHOT"]},"sample_state":{"enum":["POSITIVE_SAMPLE","ZERO_CURRENT_SAMPLE"]},"capability_state":{"enum":["CONFIRMED","UNKNOWN","NOT_APPLICABLE"]},"returned_member_count":{"type":"integer","minimum":0},"observed_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"available_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"}}};

function validate52(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate52.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.observation_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observation_id"},message:"must have required property '"+"observation_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.source_ref === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_ref"},message:"must have required property '"+"source_ref"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.query_kind === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_kind"},message:"must have required property '"+"query_kind"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.sample_state === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sample_state"},message:"must have required property '"+"sample_state"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.capability_state === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capability_state"},message:"must have required property '"+"capability_state"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.returned_member_count === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "returned_member_count"},message:"must have required property '"+"returned_member_count"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.observed_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observed_at"},message:"must have required property '"+"observed_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.available_at === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "observation_id") || (key0 === "source_ref")) || (key0 === "query_kind")) || (key0 === "sample_state")) || (key0 === "capability_state")) || (key0 === "returned_member_count")) || (key0 === "observed_at")) || (key0 === "available_at"))){
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
if(data.observation_id !== undefined){
let data0 = data.observation_id;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err9 = {instancePath:instancePath+"/observation_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern4.test(data0)){
const err10 = {instancePath:instancePath+"/observation_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err11 = {instancePath:instancePath+"/observation_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.source_ref !== undefined){
let data1 = data.source_ref;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err12 = {instancePath:instancePath+"/source_ref",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern4.test(data1)){
const err13 = {instancePath:instancePath+"/source_ref",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err14 = {instancePath:instancePath+"/source_ref",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.query_kind !== undefined){
let data2 = data.query_kind;
if(!(((((data2 === "BASE_QUOTE") || (data2 === "LISTING_PAGE")) || (data2 === "STYLE_LISTING")) || (data2 === "STYLE_BID")) || (data2 === "MARKET_SNAPSHOT"))){
const err15 = {instancePath:instancePath+"/query_kind",schemaPath:"#/properties/query_kind/enum",keyword:"enum",params:{allowedValues: schema120.properties.query_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.sample_state !== undefined){
let data3 = data.sample_state;
if(!((data3 === "POSITIVE_SAMPLE") || (data3 === "ZERO_CURRENT_SAMPLE"))){
const err16 = {instancePath:instancePath+"/sample_state",schemaPath:"#/properties/sample_state/enum",keyword:"enum",params:{allowedValues: schema120.properties.sample_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.capability_state !== undefined){
let data4 = data.capability_state;
if(!(((data4 === "CONFIRMED") || (data4 === "UNKNOWN")) || (data4 === "NOT_APPLICABLE"))){
const err17 = {instancePath:instancePath+"/capability_state",schemaPath:"#/properties/capability_state/enum",keyword:"enum",params:{allowedValues: schema120.properties.capability_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.returned_member_count !== undefined){
let data5 = data.returned_member_count;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err18 = {instancePath:instancePath+"/returned_member_count",schemaPath:"#/properties/returned_member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 < 0 || isNaN(data5)){
const err19 = {instancePath:instancePath+"/returned_member_count",schemaPath:"#/properties/returned_member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.observed_at !== undefined){
let data6 = data.observed_at;
if(typeof data6 === "string"){
if(!pattern19.test(data6)){
const err20 = {instancePath:instancePath+"/observed_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!(formats0.validate(data6))){
const err21 = {instancePath:instancePath+"/observed_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err22 = {instancePath:instancePath+"/observed_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.available_at !== undefined){
let data7 = data.available_at;
if(typeof data7 === "string"){
if(!pattern19.test(data7)){
const err23 = {instancePath:instancePath+"/available_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(!(formats0.validate(data7))){
const err24 = {instancePath:instancePath+"/available_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err25 = {instancePath:instancePath+"/available_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate52.errors = vErrors;
return errors === 0;
}
validate52.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate45(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:research-quality-envelope:v1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate45.evaluated;
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
if(data.contract_code === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_code"},message:"must have required property '"+"contract_code"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.contract_version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_version"},message:"must have required property '"+"contract_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.envelope_kind === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "envelope_kind"},message:"must have required property '"+"envelope_kind"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.identity === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identity"},message:"must have required property '"+"identity"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.as_of === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "as_of"},message:"must have required property '"+"as_of"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.available_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.policy_version === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "policy_version"},message:"must have required property '"+"policy_version"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.input_quality_snapshot_id === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_quality_snapshot_id"},message:"must have required property '"+"input_quality_snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.expected_cell_count === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expected_cell_count"},message:"must have required property '"+"expected_cell_count"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.observed_cell_count === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observed_cell_count"},message:"must have required property '"+"observed_cell_count"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.fresh_cell_count === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fresh_cell_count"},message:"must have required property '"+"fresh_cell_count"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.coverage_ratio === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "coverage_ratio"},message:"must have required property '"+"coverage_ratio"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.fresh_coverage_ratio === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fresh_coverage_ratio"},message:"must have required property '"+"fresh_coverage_ratio"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.missing_cell_count === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "missing_cell_count"},message:"must have required property '"+"missing_cell_count"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.stale_cell_count === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stale_cell_count"},message:"must have required property '"+"stale_cell_count"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.future_fact_count === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "future_fact_count"},message:"must have required property '"+"future_fact_count"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.source_summaries === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_summaries"},message:"must have required property '"+"source_summaries"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.conflicts === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "conflicts"},message:"must have required property '"+"conflicts"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.query_observations === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_observations"},message:"must have required property '"+"query_observations"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema97.properties, key0))){
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
if(data.snapshot_id !== undefined){
let data0 = data.snapshot_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err21 = {instancePath:instancePath+"/snapshot_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err22 = {instancePath:instancePath+"/snapshot_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.contract_code !== undefined){
if("research-quality-envelope" !== data.contract_code){
const err23 = {instancePath:instancePath+"/contract_code",schemaPath:"#/properties/contract_code/const",keyword:"const",params:{allowedValue: "research-quality-envelope"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.contract_version !== undefined){
if("v1" !== data.contract_version){
const err24 = {instancePath:instancePath+"/contract_version",schemaPath:"#/properties/contract_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.envelope_kind !== undefined){
if("QUALITY" !== data.envelope_kind){
const err25 = {instancePath:instancePath+"/envelope_kind",schemaPath:"#/properties/envelope_kind/const",keyword:"const",params:{allowedValue: "QUALITY"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.identity !== undefined){
let data4 = data.identity;
if(!(validate46(data4, {instancePath:instancePath+"/identity",parentData:data,parentDataProperty:"identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate46.errors : vErrors.concat(validate46.errors);
errors = vErrors.length;
}
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.scope_kind !== undefined){
if("ITEM" !== data4.scope_kind){
const err26 = {instancePath:instancePath+"/identity/scope_kind",schemaPath:"#/properties/identity/allOf/1/properties/scope_kind/const",keyword:"const",params:{allowedValue: "ITEM"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath:instancePath+"/identity",schemaPath:"#/properties/identity/allOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.as_of !== undefined){
let data6 = data.as_of;
if(typeof data6 === "string"){
if(!pattern19.test(data6)){
const err28 = {instancePath:instancePath+"/as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(!(formats0.validate(data6))){
const err29 = {instancePath:instancePath+"/as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err30 = {instancePath:instancePath+"/as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.available_at !== undefined){
let data7 = data.available_at;
if(typeof data7 === "string"){
if(!pattern19.test(data7)){
const err31 = {instancePath:instancePath+"/available_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(!(formats0.validate(data7))){
const err32 = {instancePath:instancePath+"/available_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
else {
const err33 = {instancePath:instancePath+"/available_at",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.policy_version !== undefined){
let data8 = data.policy_version;
if(typeof data8 === "string"){
if(func2(data8) < 1){
const err34 = {instancePath:instancePath+"/policy_version",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(!pattern4.test(data8)){
const err35 = {instancePath:instancePath+"/policy_version",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err36 = {instancePath:instancePath+"/policy_version",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.input_quality_snapshot_id !== undefined){
let data9 = data.input_quality_snapshot_id;
if(typeof data9 === "string"){
if(func2(data9) < 1){
const err37 = {instancePath:instancePath+"/input_quality_snapshot_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(!pattern4.test(data9)){
const err38 = {instancePath:instancePath+"/input_quality_snapshot_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err39 = {instancePath:instancePath+"/input_quality_snapshot_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data.expected_cell_count !== undefined){
let data10 = data.expected_cell_count;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err40 = {instancePath:instancePath+"/expected_cell_count",schemaPath:"#/properties/expected_cell_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 < 0 || isNaN(data10)){
const err41 = {instancePath:instancePath+"/expected_cell_count",schemaPath:"#/properties/expected_cell_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.observed_cell_count !== undefined){
let data11 = data.observed_cell_count;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err42 = {instancePath:instancePath+"/observed_cell_count",schemaPath:"#/properties/observed_cell_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 < 0 || isNaN(data11)){
const err43 = {instancePath:instancePath+"/observed_cell_count",schemaPath:"#/properties/observed_cell_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.fresh_cell_count !== undefined){
let data12 = data.fresh_cell_count;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err44 = {instancePath:instancePath+"/fresh_cell_count",schemaPath:"#/properties/fresh_cell_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 < 0 || isNaN(data12)){
const err45 = {instancePath:instancePath+"/fresh_cell_count",schemaPath:"#/properties/fresh_cell_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.coverage_ratio !== undefined){
let data13 = data.coverage_ratio;
if(typeof data13 === "string"){
if(!pattern6.test(data13)){
const err46 = {instancePath:instancePath+"/coverage_ratio",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/ratio_decimal_text/pattern",keyword:"pattern",params:{pattern: "^(0(\\.[0-9]+)?|1(\\.0+)?)$"},message:"must match pattern \""+"^(0(\\.[0-9]+)?|1(\\.0+)?)$"+"\""};
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
const err47 = {instancePath:instancePath+"/coverage_ratio",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/ratio_decimal_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data.fresh_coverage_ratio !== undefined){
let data14 = data.fresh_coverage_ratio;
if(typeof data14 === "string"){
if(!pattern6.test(data14)){
const err48 = {instancePath:instancePath+"/fresh_coverage_ratio",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/ratio_decimal_text/pattern",keyword:"pattern",params:{pattern: "^(0(\\.[0-9]+)?|1(\\.0+)?)$"},message:"must match pattern \""+"^(0(\\.[0-9]+)?|1(\\.0+)?)$"+"\""};
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
const err49 = {instancePath:instancePath+"/fresh_coverage_ratio",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/ratio_decimal_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data.missing_cell_count !== undefined){
let data15 = data.missing_cell_count;
if(!(((typeof data15 == "number") && (!(data15 % 1) && !isNaN(data15))) && (isFinite(data15)))){
const err50 = {instancePath:instancePath+"/missing_cell_count",schemaPath:"#/properties/missing_cell_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if((typeof data15 == "number") && (isFinite(data15))){
if(data15 < 0 || isNaN(data15)){
const err51 = {instancePath:instancePath+"/missing_cell_count",schemaPath:"#/properties/missing_cell_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.stale_cell_count !== undefined){
let data16 = data.stale_cell_count;
if(!(((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16))) && (isFinite(data16)))){
const err52 = {instancePath:instancePath+"/stale_cell_count",schemaPath:"#/properties/stale_cell_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if((typeof data16 == "number") && (isFinite(data16))){
if(data16 < 0 || isNaN(data16)){
const err53 = {instancePath:instancePath+"/stale_cell_count",schemaPath:"#/properties/stale_cell_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.future_fact_count !== undefined){
let data17 = data.future_fact_count;
if(!(((typeof data17 == "number") && (!(data17 % 1) && !isNaN(data17))) && (isFinite(data17)))){
const err54 = {instancePath:instancePath+"/future_fact_count",schemaPath:"#/properties/future_fact_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if((typeof data17 == "number") && (isFinite(data17))){
if(data17 < 0 || isNaN(data17)){
const err55 = {instancePath:instancePath+"/future_fact_count",schemaPath:"#/properties/future_fact_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.source_summaries !== undefined){
let data18 = data.source_summaries;
if(Array.isArray(data18)){
const len0 = data18.length;
for(let i0=0; i0<len0; i0++){
if(!(validate48(data18[i0], {instancePath:instancePath+"/source_summaries/" + i0,parentData:data18,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate48.errors : vErrors.concat(validate48.errors);
errors = vErrors.length;
}
}
}
else {
const err56 = {instancePath:instancePath+"/source_summaries",schemaPath:"#/properties/source_summaries/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data.conflicts !== undefined){
let data20 = data.conflicts;
if(Array.isArray(data20)){
const len1 = data20.length;
for(let i1=0; i1<len1; i1++){
if(!(validate50(data20[i1], {instancePath:instancePath+"/conflicts/" + i1,parentData:data20,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate50.errors : vErrors.concat(validate50.errors);
errors = vErrors.length;
}
}
}
else {
const err57 = {instancePath:instancePath+"/conflicts",schemaPath:"#/properties/conflicts/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data.query_observations !== undefined){
let data22 = data.query_observations;
if(Array.isArray(data22)){
const len2 = data22.length;
for(let i2=0; i2<len2; i2++){
if(!(validate52(data22[i2], {instancePath:instancePath+"/query_observations/" + i2,parentData:data22,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
errors = vErrors.length;
}
}
}
else {
const err58 = {instancePath:instancePath+"/query_observations",schemaPath:"#/properties/query_observations/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
const err59 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
validate45.errors = vErrors;
return errors === 0;
}
validate45.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate89(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate89.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.envelope === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "envelope"},message:"must have required property '"+"envelope"+"'"};
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
if(!((key0 === "envelope") || (key0 === "storage"))){
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
if(data.envelope !== undefined){
if(!(validate45(data.envelope, {instancePath:instancePath+"/envelope",parentData:data,parentDataProperty:"envelope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate45.errors : vErrors.concat(validate45.errors);
errors = vErrors.length;
}
}
if(data.storage !== undefined){
if(!(validate71(data.storage, {instancePath:instancePath+"/storage",parentData:data,parentDataProperty:"storage",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
errors = vErrors.length;
}
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate89.errors = vErrors;
return errors === 0;
}
validate89.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate88(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate88.evaluated;
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
if(data.query_as_of === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_as_of"},message:"must have required property '"+"query_as_of"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.resource === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "resource"},message:"must have required property '"+"resource"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query_as_of")) || (key0 === "resource"))){
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
if(data.api_contract !== undefined){
if("result-read-api" !== data.api_contract){
const err6 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "result-read-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err7 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("QUALITY_DETAIL" !== data.response_kind){
const err8 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "QUALITY_DETAIL"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.query_as_of !== undefined){
let data3 = data.query_as_of;
if(typeof data3 === "string"){
if(!pattern19.test(data3)){
const err9 = {instancePath:instancePath+"/query_as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!(formats0.validate(data3))){
const err10 = {instancePath:instancePath+"/query_as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err11 = {instancePath:instancePath+"/query_as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.resource !== undefined){
if(!(validate89(data.resource, {instancePath:instancePath+"/resource",parentData:data,parentDataProperty:"resource",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate89.errors : vErrors.concat(validate89.errors);
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
validate88.errors = vErrors;
return errors === 0;
}
validate88.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema160 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","members","next_cursor"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"QUALITY_LIST"},"query":{"$ref":"#/$defs/quality_query_binding"},"members":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/quality_resource"}},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]}}};
const schema161 = {"type":"object","additionalProperties":false,"required":["as_of","analysis_unit_kind","edition_kind","parent_analysis_unit_id","sort","page_size"],"properties":{"as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT",null]},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN",null]},"parent_analysis_unit_id":{"oneOf":[{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},{"type":"null"}]},"sort":{"const":"ANALYSIS_UNIT_ID_ASC"},"page_size":{"type":"integer","minimum":1,"maximum":200}},"allOf":[{"if":{"properties":{"analysis_unit_kind":{"const":"BASE_MHN"}},"required":["analysis_unit_kind"]},"then":{"properties":{"parent_analysis_unit_id":{"type":"null"}}}}]};

function validate95(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate95.evaluated;
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
if((data.analysis_unit_kind === undefined) && (missing0 = "analysis_unit_kind")){
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
if(data.analysis_unit_kind !== undefined){
if("BASE_MHN" !== data.analysis_unit_kind){
const err1 = {};
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
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.parent_analysis_unit_id !== undefined){
if(data.parent_analysis_unit_id !== null){
const err2 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/allOf/0/then/properties/parent_analysis_unit_id/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.parent_analysis_unit_id = true;
props0.analysis_unit_kind = true;
}
}
if(!valid1){
const err3 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.as_of === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "as_of"},message:"must have required property '"+"as_of"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.analysis_unit_kind === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_kind"},message:"must have required property '"+"analysis_unit_kind"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.edition_kind === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "edition_kind"},message:"must have required property '"+"edition_kind"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.parent_analysis_unit_id === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parent_analysis_unit_id"},message:"must have required property '"+"parent_analysis_unit_id"+"'"};
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
if(data.page_size === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "as_of") || (key0 === "analysis_unit_kind")) || (key0 === "edition_kind")) || (key0 === "parent_analysis_unit_id")) || (key0 === "sort")) || (key0 === "page_size"))){
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
if(data.as_of !== undefined){
let data2 = data.as_of;
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
const err11 = {instancePath:instancePath+"/as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!(formats0.validate(data2))){
const err12 = {instancePath:instancePath+"/as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err13 = {instancePath:instancePath+"/as_of",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.analysis_unit_kind !== undefined){
let data3 = data.analysis_unit_kind;
if(!((((data3 === "BASE_MHN") || (data3 === "STYLE_VARIANT")) || (data3 === "PATTERN_VARIANT")) || (data3 === null))){
const err14 = {instancePath:instancePath+"/analysis_unit_kind",schemaPath:"#/properties/analysis_unit_kind/enum",keyword:"enum",params:{allowedValues: schema161.properties.analysis_unit_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.edition_kind !== undefined){
let data4 = data.edition_kind;
if(!(((((data4 === "STANDARD") || (data4 === "STATTRAK")) || (data4 === "SOUVENIR")) || (data4 === "UNKNOWN")) || (data4 === null))){
const err15 = {instancePath:instancePath+"/edition_kind",schemaPath:"#/properties/edition_kind/enum",keyword:"enum",params:{allowedValues: schema161.properties.edition_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.parent_analysis_unit_id !== undefined){
let data5 = data.parent_analysis_unit_id;
const _errs15 = errors;
let valid6 = false;
let passing0 = null;
const _errs16 = errors;
if(typeof data5 === "string"){
if(func2(data5) < 1){
const err16 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!pattern4.test(data5)){
const err17 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/pattern",keyword:"pattern",params:{pattern: "^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"},message:"must match pattern \""+"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"+"\""};
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
const err18 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid1 = _errs16 === errors;
if(_valid1){
valid6 = true;
passing0 = 0;
}
const _errs19 = errors;
if(data5 !== null){
const err19 = {instancePath:instancePath+"/parent_analysis_unit_id",schemaPath:"#/properties/parent_analysis_unit_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid1 = _errs19 === errors;
if(_valid1 && valid6){
valid6 = false;
passing0 = [passing0, 1];
}
else {
if(_valid1){
valid6 = true;
passing0 = 1;
}
}
if(!valid6){
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
if(data.sort !== undefined){
if("ANALYSIS_UNIT_ID_ASC" !== data.sort){
const err21 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/const",keyword:"const",params:{allowedValue: "ANALYSIS_UNIT_ID_ASC"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.page_size !== undefined){
let data7 = data.page_size;
if(!(((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7))) && (isFinite(data7)))){
const err22 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if((typeof data7 == "number") && (isFinite(data7))){
if(data7 > 200 || isNaN(data7)){
const err23 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 200},message:"must be <= 200"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data7 < 1 || isNaN(data7)){
const err24 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
validate95.errors = vErrors;
return errors === 0;
}
validate95.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate94(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate94.evaluated;
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
if("result-read-api" !== data.api_contract){
const err7 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "result-read-api"},message:"must be equal to constant"};
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
if("QUALITY_LIST" !== data.response_kind){
const err9 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "QUALITY_LIST"},message:"must be equal to constant"};
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
if(!(validate95(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate95.errors : vErrors.concat(validate95.errors);
errors = vErrors.length;
}
}
if(data.members !== undefined){
let data4 = data.members;
if(Array.isArray(data4)){
if(data4.length > 200){
const err10 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 200},message:"must NOT have more than 200 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate89(data4[i0], {instancePath:instancePath+"/members/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate89.errors : vErrors.concat(validate89.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data6 = data.next_cursor;
const _errs10 = errors;
let valid3 = false;
let passing0 = null;
const _errs11 = errors;
if(typeof data6 === "string"){
if(func2(data6) > 8192){
const err12 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(func2(data6) < 1){
const err13 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern73.test(data6)){
const err14 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
const err15 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs11 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs13 = errors;
if(data6 !== null){
const err16 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
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
const err17 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
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
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate94.errors = vErrors;
return errors === 0;
}
validate94.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema164 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"result-read-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"error":{"$ref":"#/$defs/error"}}};
const schema165 = {"oneOf":[{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR"]},"http_status":{"const":400},"retryable":{"const":false}}},{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"const":"NOT_FOUND"},"http_status":{"const":404},"retryable":{"const":false}}},{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"enum":["CONTRACT_UNAVAILABLE","BACKEND_UNAVAILABLE"]},"http_status":{"const":503},"retryable":{"const":true}}},{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"const":"RESULT_CORRUPT"},"http_status":{"const":503},"retryable":{"const":false}}}]};

function validate99(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate99.evaluated;
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
if(data.error === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "error"},message:"must have required property '"+"error"+"'"};
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
if(data.api_contract !== undefined){
if("result-read-api" !== data.api_contract){
const err5 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "result-read-api"},message:"must be equal to constant"};
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
const err6 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
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
const err7 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "ERROR"},message:"must be equal to constant"};
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
const _errs7 = errors;
let valid2 = false;
let passing0 = null;
const _errs8 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.code === undefined){
const err8 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/0/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data3.http_status === undefined){
const err9 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/0/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data3.retryable === undefined){
const err10 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/0/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key1 in data3){
if(!(((key1 === "code") || (key1 === "http_status")) || (key1 === "retryable"))){
const err11 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data3.code !== undefined){
let data4 = data3.code;
if(!((data4 === "INVALID_ARGUMENT") || (data4 === "INVALID_CURSOR"))){
const err12 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/oneOf/0/properties/code/enum",keyword:"enum",params:{allowedValues: schema165.oneOf[0].properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data3.http_status !== undefined){
if(400 !== data3.http_status){
const err13 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/oneOf/0/properties/http_status/const",keyword:"const",params:{allowedValue: 400},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data3.retryable !== undefined){
if(false !== data3.retryable){
const err14 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/oneOf/0/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
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
const err15 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs8 === errors;
if(_valid0){
valid2 = true;
passing0 = 0;
var props0 = true;
}
const _errs14 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.code === undefined){
const err16 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/1/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data3.http_status === undefined){
const err17 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/1/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data3.retryable === undefined){
const err18 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/1/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key2 in data3){
if(!(((key2 === "code") || (key2 === "http_status")) || (key2 === "retryable"))){
const err19 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data3.code !== undefined){
if("NOT_FOUND" !== data3.code){
const err20 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/oneOf/1/properties/code/const",keyword:"const",params:{allowedValue: "NOT_FOUND"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data3.http_status !== undefined){
if(404 !== data3.http_status){
const err21 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/oneOf/1/properties/http_status/const",keyword:"const",params:{allowedValue: 404},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data3.retryable !== undefined){
if(false !== data3.retryable){
const err22 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/oneOf/1/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
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
const err23 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
var _valid0 = _errs14 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid2 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs20 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.code === undefined){
const err24 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/2/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data3.http_status === undefined){
const err25 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/2/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data3.retryable === undefined){
const err26 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/2/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
for(const key3 in data3){
if(!(((key3 === "code") || (key3 === "http_status")) || (key3 === "retryable"))){
const err27 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data3.code !== undefined){
let data10 = data3.code;
if(!((data10 === "CONTRACT_UNAVAILABLE") || (data10 === "BACKEND_UNAVAILABLE"))){
const err28 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/oneOf/2/properties/code/enum",keyword:"enum",params:{allowedValues: schema165.oneOf[2].properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data3.http_status !== undefined){
if(503 !== data3.http_status){
const err29 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/oneOf/2/properties/http_status/const",keyword:"const",params:{allowedValue: 503},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data3.retryable !== undefined){
if(true !== data3.retryable){
const err30 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/oneOf/2/properties/retryable/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
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
else {
const err31 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
var _valid0 = _errs20 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid2 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs26 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.code === undefined){
const err32 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/3/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data3.http_status === undefined){
const err33 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/3/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data3.retryable === undefined){
const err34 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/3/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
for(const key4 in data3){
if(!(((key4 === "code") || (key4 === "http_status")) || (key4 === "retryable"))){
const err35 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data3.code !== undefined){
if("RESULT_CORRUPT" !== data3.code){
const err36 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/oneOf/3/properties/code/const",keyword:"const",params:{allowedValue: "RESULT_CORRUPT"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data3.http_status !== undefined){
if(503 !== data3.http_status){
const err37 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/oneOf/3/properties/http_status/const",keyword:"const",params:{allowedValue: 503},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data3.retryable !== undefined){
if(false !== data3.retryable){
const err38 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/oneOf/3/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
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
const err39 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
var _valid0 = _errs26 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid2 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
}
}
}
if(!valid2){
const err40 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
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
}
else {
const err41 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
validate99.errors = vErrors;
return errors === 0;
}
validate99.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate54(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:result-read-api:v1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate54.evaluated;
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
if(!(validate55(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate75(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate75.errors : vErrors.concat(validate75.errors);
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
if(!(validate80(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
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
if(!(validate88(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate88.errors : vErrors.concat(validate88.errors);
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
if(!(validate94(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate94.errors : vErrors.concat(validate94.errors);
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
if(!(validate99(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
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
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
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
validate54.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate54.evaluated = {"dynamicProps":true,"dynamicItems":false};
