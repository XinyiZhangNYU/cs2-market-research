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
export const validateMarketSectorIndexPublicApiV2Response = validate401;
const schema636 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2:market-sector-index-public-api:2","title":"Descriptive market and sector history plus contemporaneous daily measurements","type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","product_kind","purpose","prediction_status","release","scope","query","points"],"properties":{"contract_name":{"const":"market-sector-index-public-api"},"contract_version":{"const":"2"},"response_kind":{"const":"INDEX_SERIES"},"product_kind":{"const":"DESCRIPTIVE_MARKET_SECTOR_INDEX"},"purpose":{"const":"CS2_ROTATE_DESCRIPTIVE_MARKET_SECTOR_INDEX_HISTORY_AND_CURRENT_V2"},"prediction_status":{"const":"NOT_A_PREDICTION"},"release":{"$ref":"#/$defs/release"},"scope":{"$ref":"#/$defs/scope"},"query":{"$ref":"#/$defs/query"},"points":{"type":"array","maxItems":512,"items":{"$ref":"#/$defs/point"}}},"$defs":{"hash":{"type":"string","pattern":"^[0-9a-f]{64}$"},"clock":{"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},"day":{"type":"string","format":"date","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},"decimal":{"type":"string","pattern":"^-?[0-9]+(?:\\.[0-9]+)?$"},"decimalOrNull":{"oneOf":[{"$ref":"#/$defs/decimal"},{"type":"null"}]},"count":{"type":"integer","minimum":0,"maximum":1000000},"scope":{"type":"object","additionalProperties":false,"required":["scope_token","scope_code","scope_kind","labels","price_history_eligibility","first_available_date","last_available_date","current_member_count","observed_price_member_count","origin_uncertainty_disclosed"],"properties":{"scope_token":{"$ref":"#/$defs/hash"},"scope_code":{"type":"string","pattern":"^[A-Z][A-Z0-9_]*(?::[A-Z0-9_]+)?$"},"scope_kind":{"enum":["MARKET","SECTOR","SUBSECTOR"]},"labels":{"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"type":"string"},"zh_cn":{"type":"string"}}},"price_history_eligibility":{"enum":["RECONSTRUCTED_HISTORY","FORWARD_ONLY"]},"first_available_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"last_available_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"current_member_count":{"$ref":"#/$defs/count"},"observed_price_member_count":{"$ref":"#/$defs/count"},"origin_uncertainty_disclosed":{"type":"boolean"}}},"release":{"type":"object","additionalProperties":false,"required":["publication_id","manifest_sha256","rights_revision","published_at","withdrawn_at","series_revision_id","product_policy_sha256","historical_publication_id","historical_manifest_sha256","continuation_spec_sha256","history_start","history_end","measured_start","measured_end","availability_semantics"],"properties":{"publication_id":{"$ref":"#/$defs/hash"},"manifest_sha256":{"$ref":"#/$defs/hash"},"rights_revision":{"$ref":"#/$defs/hash"},"published_at":{"$ref":"#/$defs/clock"},"withdrawn_at":{"oneOf":[{"$ref":"#/$defs/clock"},{"type":"null"}]},"series_revision_id":{"type":"string","pattern":"^market_sector_index_series_[0-9a-f]{64}$"},"product_policy_sha256":{"$ref":"#/$defs/hash"},"historical_publication_id":{"$ref":"#/$defs/hash"},"historical_manifest_sha256":{"$ref":"#/$defs/hash"},"continuation_spec_sha256":{"$ref":"#/$defs/hash"},"history_start":{"$ref":"#/$defs/day"},"history_end":{"$ref":"#/$defs/day"},"measured_start":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"measured_end":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"availability_semantics":{"const":["RECONSTRUCTED_LATE_BOUND","CONTEMPORANEOUSLY_MEASURED"]}}},"query":{"type":"object","additionalProperties":false,"required":["from_date","to_date","after_date","limit","next_after_date"],"properties":{"from_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"to_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"after_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"limit":{"type":"integer","minimum":1,"maximum":512},"next_after_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]}}},"point":{"type":"object","additionalProperties":false,"required":["point_id","date","segment_id","connect_to_previous","availability","index","absolute_price","coverage","quality","origin_uncertainty"],"properties":{"point_id":{"$ref":"#/$defs/hash"},"date":{"$ref":"#/$defs/day"},"segment_id":{"type":["string","null"]},"connect_to_previous":{"type":"boolean"},"availability":{"enum":["RECONSTRUCTED_LATE_BOUND","CONTEMPORANEOUSLY_MEASURED"]},"index":{"type":"object","additionalProperties":false,"required":["value","period_return","raw_equal_return","robust_equal_return","effective_estimator"],"properties":{"value":{"$ref":"#/$defs/decimalOrNull"},"period_return":{"$ref":"#/$defs/decimalOrNull"},"raw_equal_return":{"$ref":"#/$defs/decimalOrNull"},"robust_equal_return":{"$ref":"#/$defs/decimalOrNull"},"effective_estimator":{"type":["string","null"]}}},"absolute_price":{"type":"object","additionalProperties":false,"required":["member_minimum_ask_sum_cny","member_minimum_ask_median_cny","semantic"],"properties":{"member_minimum_ask_sum_cny":{"$ref":"#/$defs/decimalOrNull"},"member_minimum_ask_median_cny":{"$ref":"#/$defs/decimalOrNull"},"semantic":{"const":"SUM_AND_MEDIAN_OF_MEMBER_MINIMUM_ASKS_NOT_MARKET_VALUE"}}},"coverage":{"type":"object","additionalProperties":false,"required":["expected_member_count","expected_member_count_upper_bound","qualified_member_count","paired_member_count","coverage_ratio","coverage_ratio_lower_bound","absolute_price_qualified_member_count","absolute_price_coverage_ratio","absolute_price_coverage_ratio_lower_bound"],"properties":{"expected_member_count":{"$ref":"#/$defs/count"},"expected_member_count_upper_bound":{"$ref":"#/$defs/count"},"qualified_member_count":{"$ref":"#/$defs/count"},"paired_member_count":{"$ref":"#/$defs/count"},"coverage_ratio":{"$ref":"#/$defs/decimal"},"coverage_ratio_lower_bound":{"$ref":"#/$defs/decimal"},"absolute_price_qualified_member_count":{"$ref":"#/$defs/count"},"absolute_price_coverage_ratio":{"$ref":"#/$defs/decimal"},"absolute_price_coverage_ratio_lower_bound":{"$ref":"#/$defs/decimal"}}},"quality":{"type":"object","additionalProperties":false,"required":["overall","return","price","grade_counts","grade_d_share","anomaly_member_count","anomaly_contributions","rejected_return_domain_count","reason_codes"],"properties":{"overall":{"enum":["HIGH","PARTIAL","LOW","UNAVAILABLE"]},"return":{"enum":["HIGH","PARTIAL","LOW","UNAVAILABLE"]},"price":{"enum":["HIGH","PARTIAL","LOW","UNAVAILABLE"]},"grade_counts":{"type":"object","additionalProperties":false,"required":["A","B","C","D","E"],"properties":{"A":{"$ref":"#/$defs/count"},"B":{"$ref":"#/$defs/count"},"C":{"$ref":"#/$defs/count"},"D":{"$ref":"#/$defs/count"},"E":{"$ref":"#/$defs/count"}}},"grade_d_share":{"$ref":"#/$defs/decimalOrNull"},"anomaly_member_count":{"$ref":"#/$defs/count"},"anomaly_contributions":{"type":"array","maxItems":10,"items":{"type":"object","additionalProperties":false,"required":["analysis_unit_id","raw_return","suppressed_return","adjustment"],"properties":{"analysis_unit_id":{"type":"string"},"raw_return":{"$ref":"#/$defs/decimal"},"suppressed_return":{"$ref":"#/$defs/decimal"},"adjustment":{"$ref":"#/$defs/decimal"}}}},"rejected_return_domain_count":{"$ref":"#/$defs/count"},"reason_codes":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string"}}}},"origin_uncertainty":{"type":"object","additionalProperties":false,"required":["status","active_uncertain_origin_member_count","possible_unadmitted_member_count"],"properties":{"status":{"enum":["NONE","ACTIVE_UNCERTAIN_ORIGIN","POSSIBLE_UNADMITTED_MEMBERS","ACTIVE_AND_POSSIBLE_UNCERTAIN_ORIGIN"]},"active_uncertain_origin_member_count":{"$ref":"#/$defs/count"},"possible_unadmitted_member_count":{"$ref":"#/$defs/count"}}}}}}};
const func9 = Object.prototype.hasOwnProperty;
const schema637 = {"type":"object","additionalProperties":false,"required":["publication_id","manifest_sha256","rights_revision","published_at","withdrawn_at","series_revision_id","product_policy_sha256","historical_publication_id","historical_manifest_sha256","continuation_spec_sha256","history_start","history_end","measured_start","measured_end","availability_semantics"],"properties":{"publication_id":{"$ref":"#/$defs/hash"},"manifest_sha256":{"$ref":"#/$defs/hash"},"rights_revision":{"$ref":"#/$defs/hash"},"published_at":{"$ref":"#/$defs/clock"},"withdrawn_at":{"oneOf":[{"$ref":"#/$defs/clock"},{"type":"null"}]},"series_revision_id":{"type":"string","pattern":"^market_sector_index_series_[0-9a-f]{64}$"},"product_policy_sha256":{"$ref":"#/$defs/hash"},"historical_publication_id":{"$ref":"#/$defs/hash"},"historical_manifest_sha256":{"$ref":"#/$defs/hash"},"continuation_spec_sha256":{"$ref":"#/$defs/hash"},"history_start":{"$ref":"#/$defs/day"},"history_end":{"$ref":"#/$defs/day"},"measured_start":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"measured_end":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"availability_semantics":{"const":["RECONSTRUCTED_LATE_BOUND","CONTEMPORANEOUSLY_MEASURED"]}}};
const schema638 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const schema641 = {"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"};
const schema647 = {"type":"string","format":"date","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"};
const func0 = __wireEqual;
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");
const pattern319 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$", "u");
const pattern351 = new RegExp("^market_sector_index_series_[0-9a-f]{64}$", "u");
const pattern313 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$", "u");
const formats0 = __wireFullFormats["date-time"];
const formats40 = __wireFullFormats.date;

function validate402(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate402.evaluated;
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
if(data.manifest_sha256 === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_sha256"},message:"must have required property '"+"manifest_sha256"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.rights_revision === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rights_revision"},message:"must have required property '"+"rights_revision"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.published_at === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at"},message:"must have required property '"+"published_at"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.withdrawn_at === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "withdrawn_at"},message:"must have required property '"+"withdrawn_at"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.series_revision_id === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "series_revision_id"},message:"must have required property '"+"series_revision_id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.product_policy_sha256 === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "product_policy_sha256"},message:"must have required property '"+"product_policy_sha256"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.historical_publication_id === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "historical_publication_id"},message:"must have required property '"+"historical_publication_id"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.historical_manifest_sha256 === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "historical_manifest_sha256"},message:"must have required property '"+"historical_manifest_sha256"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.continuation_spec_sha256 === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "continuation_spec_sha256"},message:"must have required property '"+"continuation_spec_sha256"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.history_start === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "history_start"},message:"must have required property '"+"history_start"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.history_end === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "history_end"},message:"must have required property '"+"history_end"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.measured_start === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "measured_start"},message:"must have required property '"+"measured_start"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.measured_end === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "measured_end"},message:"must have required property '"+"measured_end"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.availability_semantics === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "availability_semantics"},message:"must have required property '"+"availability_semantics"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema637.properties, key0))){
const err15 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.publication_id !== undefined){
let data0 = data.publication_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err16 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err17 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.manifest_sha256 !== undefined){
let data1 = data.manifest_sha256;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err18 = {instancePath:instancePath+"/manifest_sha256",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err19 = {instancePath:instancePath+"/manifest_sha256",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.rights_revision !== undefined){
let data2 = data.rights_revision;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err20 = {instancePath:instancePath+"/rights_revision",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err21 = {instancePath:instancePath+"/rights_revision",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.published_at !== undefined){
let data3 = data.published_at;
if(typeof data3 === "string"){
if(!pattern319.test(data3)){
const err22 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/clock/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!(formats0.validate(data3))){
const err23 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/clock/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err24 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/clock/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.withdrawn_at !== undefined){
let data4 = data.withdrawn_at;
const _errs15 = errors;
let valid5 = false;
let passing0 = null;
const _errs16 = errors;
if(typeof data4 === "string"){
if(!pattern319.test(data4)){
const err25 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/clock/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!(formats0.validate(data4))){
const err26 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/clock/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err27 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/clock/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
var _valid0 = _errs16 === errors;
if(_valid0){
valid5 = true;
passing0 = 0;
}
const _errs19 = errors;
if(data4 !== null){
const err28 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/properties/withdrawn_at/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
var _valid0 = _errs19 === errors;
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
const err29 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/properties/withdrawn_at/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
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
if(data.series_revision_id !== undefined){
let data5 = data.series_revision_id;
if(typeof data5 === "string"){
if(!pattern351.test(data5)){
const err30 = {instancePath:instancePath+"/series_revision_id",schemaPath:"#/properties/series_revision_id/pattern",keyword:"pattern",params:{pattern: "^market_sector_index_series_[0-9a-f]{64}$"},message:"must match pattern \""+"^market_sector_index_series_[0-9a-f]{64}$"+"\""};
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
const err31 = {instancePath:instancePath+"/series_revision_id",schemaPath:"#/properties/series_revision_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.product_policy_sha256 !== undefined){
let data6 = data.product_policy_sha256;
if(typeof data6 === "string"){
if(!pattern5.test(data6)){
const err32 = {instancePath:instancePath+"/product_policy_sha256",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err33 = {instancePath:instancePath+"/product_policy_sha256",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.historical_publication_id !== undefined){
let data7 = data.historical_publication_id;
if(typeof data7 === "string"){
if(!pattern5.test(data7)){
const err34 = {instancePath:instancePath+"/historical_publication_id",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err35 = {instancePath:instancePath+"/historical_publication_id",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.historical_manifest_sha256 !== undefined){
let data8 = data.historical_manifest_sha256;
if(typeof data8 === "string"){
if(!pattern5.test(data8)){
const err36 = {instancePath:instancePath+"/historical_manifest_sha256",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err37 = {instancePath:instancePath+"/historical_manifest_sha256",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.continuation_spec_sha256 !== undefined){
let data9 = data.continuation_spec_sha256;
if(typeof data9 === "string"){
if(!pattern5.test(data9)){
const err38 = {instancePath:instancePath+"/continuation_spec_sha256",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err39 = {instancePath:instancePath+"/continuation_spec_sha256",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data.history_start !== undefined){
let data10 = data.history_start;
if(typeof data10 === "string"){
if(!pattern313.test(data10)){
const err40 = {instancePath:instancePath+"/history_start",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(!(formats40.validate(data10))){
const err41 = {instancePath:instancePath+"/history_start",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err42 = {instancePath:instancePath+"/history_start",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.history_end !== undefined){
let data11 = data.history_end;
if(typeof data11 === "string"){
if(!pattern313.test(data11)){
const err43 = {instancePath:instancePath+"/history_end",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(!(formats40.validate(data11))){
const err44 = {instancePath:instancePath+"/history_end",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
else {
const err45 = {instancePath:instancePath+"/history_end",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.measured_start !== undefined){
let data12 = data.measured_start;
const _errs42 = errors;
let valid13 = false;
let passing1 = null;
const _errs43 = errors;
if(typeof data12 === "string"){
if(!pattern313.test(data12)){
const err46 = {instancePath:instancePath+"/measured_start",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(!(formats40.validate(data12))){
const err47 = {instancePath:instancePath+"/measured_start",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err48 = {instancePath:instancePath+"/measured_start",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
var _valid1 = _errs43 === errors;
if(_valid1){
valid13 = true;
passing1 = 0;
}
const _errs46 = errors;
if(data12 !== null){
const err49 = {instancePath:instancePath+"/measured_start",schemaPath:"#/properties/measured_start/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
var _valid1 = _errs46 === errors;
if(_valid1 && valid13){
valid13 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid13 = true;
passing1 = 1;
}
}
if(!valid13){
const err50 = {instancePath:instancePath+"/measured_start",schemaPath:"#/properties/measured_start/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
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
}
if(data.measured_end !== undefined){
let data13 = data.measured_end;
const _errs49 = errors;
let valid15 = false;
let passing2 = null;
const _errs50 = errors;
if(typeof data13 === "string"){
if(!pattern313.test(data13)){
const err51 = {instancePath:instancePath+"/measured_end",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(!(formats40.validate(data13))){
const err52 = {instancePath:instancePath+"/measured_end",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err53 = {instancePath:instancePath+"/measured_end",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
var _valid2 = _errs50 === errors;
if(_valid2){
valid15 = true;
passing2 = 0;
}
const _errs53 = errors;
if(data13 !== null){
const err54 = {instancePath:instancePath+"/measured_end",schemaPath:"#/properties/measured_end/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
var _valid2 = _errs53 === errors;
if(_valid2 && valid15){
valid15 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid15 = true;
passing2 = 1;
}
}
if(!valid15){
const err55 = {instancePath:instancePath+"/measured_end",schemaPath:"#/properties/measured_end/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
else {
errors = _errs49;
if(vErrors !== null){
if(_errs49){
vErrors.length = _errs49;
}
else {
vErrors = null;
}
}
}
}
if(data.availability_semantics !== undefined){
if(!func0(data.availability_semantics, schema637.properties.availability_semantics.const)){
const err56 = {instancePath:instancePath+"/availability_semantics",schemaPath:"#/properties/availability_semantics/const",keyword:"const",params:{allowedValue: schema637.properties.availability_semantics.const},message:"must be equal to constant"};
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
const err57 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
validate402.errors = vErrors;
return errors === 0;
}
validate402.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema651 = {"type":"object","additionalProperties":false,"required":["scope_token","scope_code","scope_kind","labels","price_history_eligibility","first_available_date","last_available_date","current_member_count","observed_price_member_count","origin_uncertainty_disclosed"],"properties":{"scope_token":{"$ref":"#/$defs/hash"},"scope_code":{"type":"string","pattern":"^[A-Z][A-Z0-9_]*(?::[A-Z0-9_]+)?$"},"scope_kind":{"enum":["MARKET","SECTOR","SUBSECTOR"]},"labels":{"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"type":"string"},"zh_cn":{"type":"string"}}},"price_history_eligibility":{"enum":["RECONSTRUCTED_HISTORY","FORWARD_ONLY"]},"first_available_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"last_available_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"current_member_count":{"$ref":"#/$defs/count"},"observed_price_member_count":{"$ref":"#/$defs/count"},"origin_uncertainty_disclosed":{"type":"boolean"}}};
const schema655 = {"type":"integer","minimum":0,"maximum":1000000};
const pattern343 = new RegExp("^[A-Z][A-Z0-9_]*(?::[A-Z0-9_]+)?$", "u");

function validate404(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate404.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.scope_token === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_token"},message:"must have required property '"+"scope_token"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.scope_code === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_code"},message:"must have required property '"+"scope_code"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.scope_kind === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_kind"},message:"must have required property '"+"scope_kind"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.labels === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "labels"},message:"must have required property '"+"labels"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.price_history_eligibility === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "price_history_eligibility"},message:"must have required property '"+"price_history_eligibility"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.first_available_date === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "first_available_date"},message:"must have required property '"+"first_available_date"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.last_available_date === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "last_available_date"},message:"must have required property '"+"last_available_date"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.current_member_count === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "current_member_count"},message:"must have required property '"+"current_member_count"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.observed_price_member_count === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observed_price_member_count"},message:"must have required property '"+"observed_price_member_count"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.origin_uncertainty_disclosed === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "origin_uncertainty_disclosed"},message:"must have required property '"+"origin_uncertainty_disclosed"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema651.properties, key0))){
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
if(data.scope_token !== undefined){
let data0 = data.scope_token;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err11 = {instancePath:instancePath+"/scope_token",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err12 = {instancePath:instancePath+"/scope_token",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.scope_code !== undefined){
let data1 = data.scope_code;
if(typeof data1 === "string"){
if(!pattern343.test(data1)){
const err13 = {instancePath:instancePath+"/scope_code",schemaPath:"#/properties/scope_code/pattern",keyword:"pattern",params:{pattern: "^[A-Z][A-Z0-9_]*(?::[A-Z0-9_]+)?$"},message:"must match pattern \""+"^[A-Z][A-Z0-9_]*(?::[A-Z0-9_]+)?$"+"\""};
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
const err14 = {instancePath:instancePath+"/scope_code",schemaPath:"#/properties/scope_code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.scope_kind !== undefined){
let data2 = data.scope_kind;
if(!(((data2 === "MARKET") || (data2 === "SECTOR")) || (data2 === "SUBSECTOR"))){
const err15 = {instancePath:instancePath+"/scope_kind",schemaPath:"#/properties/scope_kind/enum",keyword:"enum",params:{allowedValues: schema651.properties.scope_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.labels !== undefined){
let data3 = data.labels;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.en === undefined){
const err16 = {instancePath:instancePath+"/labels",schemaPath:"#/properties/labels/required",keyword:"required",params:{missingProperty: "en"},message:"must have required property '"+"en"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data3.zh_cn === undefined){
const err17 = {instancePath:instancePath+"/labels",schemaPath:"#/properties/labels/required",keyword:"required",params:{missingProperty: "zh_cn"},message:"must have required property '"+"zh_cn"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "en") || (key1 === "zh_cn"))){
const err18 = {instancePath:instancePath+"/labels",schemaPath:"#/properties/labels/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data3.en !== undefined){
if(typeof data3.en !== "string"){
const err19 = {instancePath:instancePath+"/labels/en",schemaPath:"#/properties/labels/properties/en/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data3.zh_cn !== undefined){
if(typeof data3.zh_cn !== "string"){
const err20 = {instancePath:instancePath+"/labels/zh_cn",schemaPath:"#/properties/labels/properties/zh_cn/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err21 = {instancePath:instancePath+"/labels",schemaPath:"#/properties/labels/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.price_history_eligibility !== undefined){
let data6 = data.price_history_eligibility;
if(!((data6 === "RECONSTRUCTED_HISTORY") || (data6 === "FORWARD_ONLY"))){
const err22 = {instancePath:instancePath+"/price_history_eligibility",schemaPath:"#/properties/price_history_eligibility/enum",keyword:"enum",params:{allowedValues: schema651.properties.price_history_eligibility.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.first_available_date !== undefined){
let data7 = data.first_available_date;
const _errs17 = errors;
let valid3 = false;
let passing0 = null;
const _errs18 = errors;
if(typeof data7 === "string"){
if(!pattern313.test(data7)){
const err23 = {instancePath:instancePath+"/first_available_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(!(formats40.validate(data7))){
const err24 = {instancePath:instancePath+"/first_available_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err25 = {instancePath:instancePath+"/first_available_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
var _valid0 = _errs18 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs21 = errors;
if(data7 !== null){
const err26 = {instancePath:instancePath+"/first_available_date",schemaPath:"#/properties/first_available_date/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
var _valid0 = _errs21 === errors;
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
const err27 = {instancePath:instancePath+"/first_available_date",schemaPath:"#/properties/first_available_date/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
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
if(data.last_available_date !== undefined){
let data8 = data.last_available_date;
const _errs24 = errors;
let valid5 = false;
let passing1 = null;
const _errs25 = errors;
if(typeof data8 === "string"){
if(!pattern313.test(data8)){
const err28 = {instancePath:instancePath+"/last_available_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(!(formats40.validate(data8))){
const err29 = {instancePath:instancePath+"/last_available_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err30 = {instancePath:instancePath+"/last_available_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
var _valid1 = _errs25 === errors;
if(_valid1){
valid5 = true;
passing1 = 0;
}
const _errs28 = errors;
if(data8 !== null){
const err31 = {instancePath:instancePath+"/last_available_date",schemaPath:"#/properties/last_available_date/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
var _valid1 = _errs28 === errors;
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
const err32 = {instancePath:instancePath+"/last_available_date",schemaPath:"#/properties/last_available_date/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
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
if(data.current_member_count !== undefined){
let data9 = data.current_member_count;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err33 = {instancePath:instancePath+"/current_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if((typeof data9 == "number") && (isFinite(data9))){
if(data9 > 1000000 || isNaN(data9)){
const err34 = {instancePath:instancePath+"/current_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data9 < 0 || isNaN(data9)){
const err35 = {instancePath:instancePath+"/current_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.observed_price_member_count !== undefined){
let data10 = data.observed_price_member_count;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err36 = {instancePath:instancePath+"/observed_price_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 > 1000000 || isNaN(data10)){
const err37 = {instancePath:instancePath+"/observed_price_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data10 < 0 || isNaN(data10)){
const err38 = {instancePath:instancePath+"/observed_price_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.origin_uncertainty_disclosed !== undefined){
if(typeof data.origin_uncertainty_disclosed !== "boolean"){
const err39 = {instancePath:instancePath+"/origin_uncertainty_disclosed",schemaPath:"#/properties/origin_uncertainty_disclosed/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
validate404.errors = vErrors;
return errors === 0;
}
validate404.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema657 = {"type":"object","additionalProperties":false,"required":["from_date","to_date","after_date","limit","next_after_date"],"properties":{"from_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"to_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"after_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]},"limit":{"type":"integer","minimum":1,"maximum":512},"next_after_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]}}};

function validate406(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate406.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.from_date === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "from_date"},message:"must have required property '"+"from_date"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.to_date === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "to_date"},message:"must have required property '"+"to_date"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.after_date === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "after_date"},message:"must have required property '"+"after_date"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.limit === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "limit"},message:"must have required property '"+"limit"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.next_after_date === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_after_date"},message:"must have required property '"+"next_after_date"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "from_date") || (key0 === "to_date")) || (key0 === "after_date")) || (key0 === "limit")) || (key0 === "next_after_date"))){
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
if(data.from_date !== undefined){
let data0 = data.from_date;
const _errs3 = errors;
let valid1 = false;
let passing0 = null;
const _errs4 = errors;
if(typeof data0 === "string"){
if(!pattern313.test(data0)){
const err6 = {instancePath:instancePath+"/from_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!(formats40.validate(data0))){
const err7 = {instancePath:instancePath+"/from_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err8 = {instancePath:instancePath+"/from_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
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
const err9 = {instancePath:instancePath+"/from_date",schemaPath:"#/properties/from_date/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
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
const err10 = {instancePath:instancePath+"/from_date",schemaPath:"#/properties/from_date/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
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
if(data.to_date !== undefined){
let data1 = data.to_date;
const _errs10 = errors;
let valid3 = false;
let passing1 = null;
const _errs11 = errors;
if(typeof data1 === "string"){
if(!pattern313.test(data1)){
const err11 = {instancePath:instancePath+"/to_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!(formats40.validate(data1))){
const err12 = {instancePath:instancePath+"/to_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err13 = {instancePath:instancePath+"/to_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
var _valid1 = _errs11 === errors;
if(_valid1){
valid3 = true;
passing1 = 0;
}
const _errs14 = errors;
if(data1 !== null){
const err14 = {instancePath:instancePath+"/to_date",schemaPath:"#/properties/to_date/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid1 = _errs14 === errors;
if(_valid1 && valid3){
valid3 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid3 = true;
passing1 = 1;
}
}
if(!valid3){
const err15 = {instancePath:instancePath+"/to_date",schemaPath:"#/properties/to_date/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
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
if(data.after_date !== undefined){
let data2 = data.after_date;
const _errs17 = errors;
let valid5 = false;
let passing2 = null;
const _errs18 = errors;
if(typeof data2 === "string"){
if(!pattern313.test(data2)){
const err16 = {instancePath:instancePath+"/after_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!(formats40.validate(data2))){
const err17 = {instancePath:instancePath+"/after_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err18 = {instancePath:instancePath+"/after_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid2 = _errs18 === errors;
if(_valid2){
valid5 = true;
passing2 = 0;
}
const _errs21 = errors;
if(data2 !== null){
const err19 = {instancePath:instancePath+"/after_date",schemaPath:"#/properties/after_date/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid2 = _errs21 === errors;
if(_valid2 && valid5){
valid5 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid5 = true;
passing2 = 1;
}
}
if(!valid5){
const err20 = {instancePath:instancePath+"/after_date",schemaPath:"#/properties/after_date/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
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
if(data.limit !== undefined){
let data3 = data.limit;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err21 = {instancePath:instancePath+"/limit",schemaPath:"#/properties/limit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 512 || isNaN(data3)){
const err22 = {instancePath:instancePath+"/limit",schemaPath:"#/properties/limit/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data3 < 1 || isNaN(data3)){
const err23 = {instancePath:instancePath+"/limit",schemaPath:"#/properties/limit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.next_after_date !== undefined){
let data4 = data.next_after_date;
const _errs26 = errors;
let valid7 = false;
let passing3 = null;
const _errs27 = errors;
if(typeof data4 === "string"){
if(!pattern313.test(data4)){
const err24 = {instancePath:instancePath+"/next_after_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!(formats40.validate(data4))){
const err25 = {instancePath:instancePath+"/next_after_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err26 = {instancePath:instancePath+"/next_after_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
var _valid3 = _errs27 === errors;
if(_valid3){
valid7 = true;
passing3 = 0;
}
const _errs30 = errors;
if(data4 !== null){
const err27 = {instancePath:instancePath+"/next_after_date",schemaPath:"#/properties/next_after_date/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
var _valid3 = _errs30 === errors;
if(_valid3 && valid7){
valid7 = false;
passing3 = [passing3, 1];
}
else {
if(_valid3){
valid7 = true;
passing3 = 1;
}
}
if(!valid7){
const err28 = {instancePath:instancePath+"/next_after_date",schemaPath:"#/properties/next_after_date/oneOf",keyword:"oneOf",params:{passingSchemas: passing3},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
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
validate406.errors = vErrors;
return errors === 0;
}
validate406.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema662 = {"type":"object","additionalProperties":false,"required":["point_id","date","segment_id","connect_to_previous","availability","index","absolute_price","coverage","quality","origin_uncertainty"],"properties":{"point_id":{"$ref":"#/$defs/hash"},"date":{"$ref":"#/$defs/day"},"segment_id":{"type":["string","null"]},"connect_to_previous":{"type":"boolean"},"availability":{"enum":["RECONSTRUCTED_LATE_BOUND","CONTEMPORANEOUSLY_MEASURED"]},"index":{"type":"object","additionalProperties":false,"required":["value","period_return","raw_equal_return","robust_equal_return","effective_estimator"],"properties":{"value":{"$ref":"#/$defs/decimalOrNull"},"period_return":{"$ref":"#/$defs/decimalOrNull"},"raw_equal_return":{"$ref":"#/$defs/decimalOrNull"},"robust_equal_return":{"$ref":"#/$defs/decimalOrNull"},"effective_estimator":{"type":["string","null"]}}},"absolute_price":{"type":"object","additionalProperties":false,"required":["member_minimum_ask_sum_cny","member_minimum_ask_median_cny","semantic"],"properties":{"member_minimum_ask_sum_cny":{"$ref":"#/$defs/decimalOrNull"},"member_minimum_ask_median_cny":{"$ref":"#/$defs/decimalOrNull"},"semantic":{"const":"SUM_AND_MEDIAN_OF_MEMBER_MINIMUM_ASKS_NOT_MARKET_VALUE"}}},"coverage":{"type":"object","additionalProperties":false,"required":["expected_member_count","expected_member_count_upper_bound","qualified_member_count","paired_member_count","coverage_ratio","coverage_ratio_lower_bound","absolute_price_qualified_member_count","absolute_price_coverage_ratio","absolute_price_coverage_ratio_lower_bound"],"properties":{"expected_member_count":{"$ref":"#/$defs/count"},"expected_member_count_upper_bound":{"$ref":"#/$defs/count"},"qualified_member_count":{"$ref":"#/$defs/count"},"paired_member_count":{"$ref":"#/$defs/count"},"coverage_ratio":{"$ref":"#/$defs/decimal"},"coverage_ratio_lower_bound":{"$ref":"#/$defs/decimal"},"absolute_price_qualified_member_count":{"$ref":"#/$defs/count"},"absolute_price_coverage_ratio":{"$ref":"#/$defs/decimal"},"absolute_price_coverage_ratio_lower_bound":{"$ref":"#/$defs/decimal"}}},"quality":{"type":"object","additionalProperties":false,"required":["overall","return","price","grade_counts","grade_d_share","anomaly_member_count","anomaly_contributions","rejected_return_domain_count","reason_codes"],"properties":{"overall":{"enum":["HIGH","PARTIAL","LOW","UNAVAILABLE"]},"return":{"enum":["HIGH","PARTIAL","LOW","UNAVAILABLE"]},"price":{"enum":["HIGH","PARTIAL","LOW","UNAVAILABLE"]},"grade_counts":{"type":"object","additionalProperties":false,"required":["A","B","C","D","E"],"properties":{"A":{"$ref":"#/$defs/count"},"B":{"$ref":"#/$defs/count"},"C":{"$ref":"#/$defs/count"},"D":{"$ref":"#/$defs/count"},"E":{"$ref":"#/$defs/count"}}},"grade_d_share":{"$ref":"#/$defs/decimalOrNull"},"anomaly_member_count":{"$ref":"#/$defs/count"},"anomaly_contributions":{"type":"array","maxItems":10,"items":{"type":"object","additionalProperties":false,"required":["analysis_unit_id","raw_return","suppressed_return","adjustment"],"properties":{"analysis_unit_id":{"type":"string"},"raw_return":{"$ref":"#/$defs/decimal"},"suppressed_return":{"$ref":"#/$defs/decimal"},"adjustment":{"$ref":"#/$defs/decimal"}}}},"rejected_return_domain_count":{"$ref":"#/$defs/count"},"reason_codes":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string"}}}},"origin_uncertainty":{"type":"object","additionalProperties":false,"required":["status","active_uncertain_origin_member_count","possible_unadmitted_member_count"],"properties":{"status":{"enum":["NONE","ACTIVE_UNCERTAIN_ORIGIN","POSSIBLE_UNADMITTED_MEMBERS","ACTIVE_AND_POSSIBLE_UNCERTAIN_ORIGIN"]},"active_uncertain_origin_member_count":{"$ref":"#/$defs/count"},"possible_unadmitted_member_count":{"$ref":"#/$defs/count"}}}}};
const schema666 = {"type":"string","pattern":"^-?[0-9]+(?:\\.[0-9]+)?$"};
const pattern362 = new RegExp("^-?[0-9]+(?:\\.[0-9]+)?$", "u");
const schema665 = {"oneOf":[{"$ref":"#/$defs/decimal"},{"type":"null"}]};

function validate409(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate409.evaluated;
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
if(!pattern362.test(data)){
const err0 = {instancePath,schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?[0-9]+(?:\\.[0-9]+)?$"},message:"must match pattern \""+"^-?[0-9]+(?:\\.[0-9]+)?$"+"\""};
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
const err1 = {instancePath,schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate409.errors = vErrors;
return errors === 0;
}
validate409.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate408(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate408.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.point_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "point_id"},message:"must have required property '"+"point_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.date === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "date"},message:"must have required property '"+"date"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.segment_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "segment_id"},message:"must have required property '"+"segment_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.connect_to_previous === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "connect_to_previous"},message:"must have required property '"+"connect_to_previous"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.availability === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "availability"},message:"must have required property '"+"availability"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.index === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "index"},message:"must have required property '"+"index"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.absolute_price === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "absolute_price"},message:"must have required property '"+"absolute_price"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.coverage === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "coverage"},message:"must have required property '"+"coverage"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.quality === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "quality"},message:"must have required property '"+"quality"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.origin_uncertainty === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "origin_uncertainty"},message:"must have required property '"+"origin_uncertainty"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema662.properties, key0))){
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
if(data.point_id !== undefined){
let data0 = data.point_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err11 = {instancePath:instancePath+"/point_id",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err12 = {instancePath:instancePath+"/point_id",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.date !== undefined){
let data1 = data.date;
if(typeof data1 === "string"){
if(!pattern313.test(data1)){
const err13 = {instancePath:instancePath+"/date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!(formats40.validate(data1))){
const err14 = {instancePath:instancePath+"/date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err15 = {instancePath:instancePath+"/date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.segment_id !== undefined){
let data2 = data.segment_id;
if((typeof data2 !== "string") && (data2 !== null)){
const err16 = {instancePath:instancePath+"/segment_id",schemaPath:"#/properties/segment_id/type",keyword:"type",params:{type: schema662.properties.segment_id.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.connect_to_previous !== undefined){
if(typeof data.connect_to_previous !== "boolean"){
const err17 = {instancePath:instancePath+"/connect_to_previous",schemaPath:"#/properties/connect_to_previous/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.availability !== undefined){
let data4 = data.availability;
if(!((data4 === "RECONSTRUCTED_LATE_BOUND") || (data4 === "CONTEMPORANEOUSLY_MEASURED"))){
const err18 = {instancePath:instancePath+"/availability",schemaPath:"#/properties/availability/enum",keyword:"enum",params:{allowedValues: schema662.properties.availability.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.index !== undefined){
let data5 = data.index;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.value === undefined){
const err19 = {instancePath:instancePath+"/index",schemaPath:"#/properties/index/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data5.period_return === undefined){
const err20 = {instancePath:instancePath+"/index",schemaPath:"#/properties/index/required",keyword:"required",params:{missingProperty: "period_return"},message:"must have required property '"+"period_return"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data5.raw_equal_return === undefined){
const err21 = {instancePath:instancePath+"/index",schemaPath:"#/properties/index/required",keyword:"required",params:{missingProperty: "raw_equal_return"},message:"must have required property '"+"raw_equal_return"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data5.robust_equal_return === undefined){
const err22 = {instancePath:instancePath+"/index",schemaPath:"#/properties/index/required",keyword:"required",params:{missingProperty: "robust_equal_return"},message:"must have required property '"+"robust_equal_return"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data5.effective_estimator === undefined){
const err23 = {instancePath:instancePath+"/index",schemaPath:"#/properties/index/required",keyword:"required",params:{missingProperty: "effective_estimator"},message:"must have required property '"+"effective_estimator"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
for(const key1 in data5){
if(!(((((key1 === "value") || (key1 === "period_return")) || (key1 === "raw_equal_return")) || (key1 === "robust_equal_return")) || (key1 === "effective_estimator"))){
const err24 = {instancePath:instancePath+"/index",schemaPath:"#/properties/index/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data5.value !== undefined){
if(!(validate409(data5.value, {instancePath:instancePath+"/index/value",parentData:data5,parentDataProperty:"value",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate409.errors : vErrors.concat(validate409.errors);
errors = vErrors.length;
}
}
if(data5.period_return !== undefined){
if(!(validate409(data5.period_return, {instancePath:instancePath+"/index/period_return",parentData:data5,parentDataProperty:"period_return",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate409.errors : vErrors.concat(validate409.errors);
errors = vErrors.length;
}
}
if(data5.raw_equal_return !== undefined){
if(!(validate409(data5.raw_equal_return, {instancePath:instancePath+"/index/raw_equal_return",parentData:data5,parentDataProperty:"raw_equal_return",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate409.errors : vErrors.concat(validate409.errors);
errors = vErrors.length;
}
}
if(data5.robust_equal_return !== undefined){
if(!(validate409(data5.robust_equal_return, {instancePath:instancePath+"/index/robust_equal_return",parentData:data5,parentDataProperty:"robust_equal_return",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate409.errors : vErrors.concat(validate409.errors);
errors = vErrors.length;
}
}
if(data5.effective_estimator !== undefined){
let data10 = data5.effective_estimator;
if((typeof data10 !== "string") && (data10 !== null)){
const err25 = {instancePath:instancePath+"/index/effective_estimator",schemaPath:"#/properties/index/properties/effective_estimator/type",keyword:"type",params:{type: schema662.properties.index.properties.effective_estimator.type},message:"must be string,null"};
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
const err26 = {instancePath:instancePath+"/index",schemaPath:"#/properties/index/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.absolute_price !== undefined){
let data11 = data.absolute_price;
if(data11 && typeof data11 == "object" && !Array.isArray(data11)){
if(data11.member_minimum_ask_sum_cny === undefined){
const err27 = {instancePath:instancePath+"/absolute_price",schemaPath:"#/properties/absolute_price/required",keyword:"required",params:{missingProperty: "member_minimum_ask_sum_cny"},message:"must have required property '"+"member_minimum_ask_sum_cny"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data11.member_minimum_ask_median_cny === undefined){
const err28 = {instancePath:instancePath+"/absolute_price",schemaPath:"#/properties/absolute_price/required",keyword:"required",params:{missingProperty: "member_minimum_ask_median_cny"},message:"must have required property '"+"member_minimum_ask_median_cny"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data11.semantic === undefined){
const err29 = {instancePath:instancePath+"/absolute_price",schemaPath:"#/properties/absolute_price/required",keyword:"required",params:{missingProperty: "semantic"},message:"must have required property '"+"semantic"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
for(const key2 in data11){
if(!(((key2 === "member_minimum_ask_sum_cny") || (key2 === "member_minimum_ask_median_cny")) || (key2 === "semantic"))){
const err30 = {instancePath:instancePath+"/absolute_price",schemaPath:"#/properties/absolute_price/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data11.member_minimum_ask_sum_cny !== undefined){
if(!(validate409(data11.member_minimum_ask_sum_cny, {instancePath:instancePath+"/absolute_price/member_minimum_ask_sum_cny",parentData:data11,parentDataProperty:"member_minimum_ask_sum_cny",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate409.errors : vErrors.concat(validate409.errors);
errors = vErrors.length;
}
}
if(data11.member_minimum_ask_median_cny !== undefined){
if(!(validate409(data11.member_minimum_ask_median_cny, {instancePath:instancePath+"/absolute_price/member_minimum_ask_median_cny",parentData:data11,parentDataProperty:"member_minimum_ask_median_cny",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate409.errors : vErrors.concat(validate409.errors);
errors = vErrors.length;
}
}
if(data11.semantic !== undefined){
if("SUM_AND_MEDIAN_OF_MEMBER_MINIMUM_ASKS_NOT_MARKET_VALUE" !== data11.semantic){
const err31 = {instancePath:instancePath+"/absolute_price/semantic",schemaPath:"#/properties/absolute_price/properties/semantic/const",keyword:"const",params:{allowedValue: "SUM_AND_MEDIAN_OF_MEMBER_MINIMUM_ASKS_NOT_MARKET_VALUE"},message:"must be equal to constant"};
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
const err32 = {instancePath:instancePath+"/absolute_price",schemaPath:"#/properties/absolute_price/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.coverage !== undefined){
let data15 = data.coverage;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.expected_member_count === undefined){
const err33 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "expected_member_count"},message:"must have required property '"+"expected_member_count"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data15.expected_member_count_upper_bound === undefined){
const err34 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "expected_member_count_upper_bound"},message:"must have required property '"+"expected_member_count_upper_bound"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data15.qualified_member_count === undefined){
const err35 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "qualified_member_count"},message:"must have required property '"+"qualified_member_count"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data15.paired_member_count === undefined){
const err36 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "paired_member_count"},message:"must have required property '"+"paired_member_count"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data15.coverage_ratio === undefined){
const err37 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "coverage_ratio"},message:"must have required property '"+"coverage_ratio"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data15.coverage_ratio_lower_bound === undefined){
const err38 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "coverage_ratio_lower_bound"},message:"must have required property '"+"coverage_ratio_lower_bound"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data15.absolute_price_qualified_member_count === undefined){
const err39 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "absolute_price_qualified_member_count"},message:"must have required property '"+"absolute_price_qualified_member_count"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data15.absolute_price_coverage_ratio === undefined){
const err40 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "absolute_price_coverage_ratio"},message:"must have required property '"+"absolute_price_coverage_ratio"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data15.absolute_price_coverage_ratio_lower_bound === undefined){
const err41 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "absolute_price_coverage_ratio_lower_bound"},message:"must have required property '"+"absolute_price_coverage_ratio_lower_bound"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
for(const key3 in data15){
if(!(func9.call(schema662.properties.coverage.properties, key3))){
const err42 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data15.expected_member_count !== undefined){
let data16 = data15.expected_member_count;
if(!(((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16))) && (isFinite(data16)))){
const err43 = {instancePath:instancePath+"/coverage/expected_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if((typeof data16 == "number") && (isFinite(data16))){
if(data16 > 1000000 || isNaN(data16)){
const err44 = {instancePath:instancePath+"/coverage/expected_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data16 < 0 || isNaN(data16)){
const err45 = {instancePath:instancePath+"/coverage/expected_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data15.expected_member_count_upper_bound !== undefined){
let data17 = data15.expected_member_count_upper_bound;
if(!(((typeof data17 == "number") && (!(data17 % 1) && !isNaN(data17))) && (isFinite(data17)))){
const err46 = {instancePath:instancePath+"/coverage/expected_member_count_upper_bound",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if((typeof data17 == "number") && (isFinite(data17))){
if(data17 > 1000000 || isNaN(data17)){
const err47 = {instancePath:instancePath+"/coverage/expected_member_count_upper_bound",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data17 < 0 || isNaN(data17)){
const err48 = {instancePath:instancePath+"/coverage/expected_member_count_upper_bound",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
}
if(data15.qualified_member_count !== undefined){
let data18 = data15.qualified_member_count;
if(!(((typeof data18 == "number") && (!(data18 % 1) && !isNaN(data18))) && (isFinite(data18)))){
const err49 = {instancePath:instancePath+"/coverage/qualified_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if((typeof data18 == "number") && (isFinite(data18))){
if(data18 > 1000000 || isNaN(data18)){
const err50 = {instancePath:instancePath+"/coverage/qualified_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data18 < 0 || isNaN(data18)){
const err51 = {instancePath:instancePath+"/coverage/qualified_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data15.paired_member_count !== undefined){
let data19 = data15.paired_member_count;
if(!(((typeof data19 == "number") && (!(data19 % 1) && !isNaN(data19))) && (isFinite(data19)))){
const err52 = {instancePath:instancePath+"/coverage/paired_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if((typeof data19 == "number") && (isFinite(data19))){
if(data19 > 1000000 || isNaN(data19)){
const err53 = {instancePath:instancePath+"/coverage/paired_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data19 < 0 || isNaN(data19)){
const err54 = {instancePath:instancePath+"/coverage/paired_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data15.coverage_ratio !== undefined){
let data20 = data15.coverage_ratio;
if(typeof data20 === "string"){
if(!pattern362.test(data20)){
const err55 = {instancePath:instancePath+"/coverage/coverage_ratio",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?[0-9]+(?:\\.[0-9]+)?$"},message:"must match pattern \""+"^-?[0-9]+(?:\\.[0-9]+)?$"+"\""};
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
const err56 = {instancePath:instancePath+"/coverage/coverage_ratio",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data15.coverage_ratio_lower_bound !== undefined){
let data21 = data15.coverage_ratio_lower_bound;
if(typeof data21 === "string"){
if(!pattern362.test(data21)){
const err57 = {instancePath:instancePath+"/coverage/coverage_ratio_lower_bound",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?[0-9]+(?:\\.[0-9]+)?$"},message:"must match pattern \""+"^-?[0-9]+(?:\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
else {
const err58 = {instancePath:instancePath+"/coverage/coverage_ratio_lower_bound",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data15.absolute_price_qualified_member_count !== undefined){
let data22 = data15.absolute_price_qualified_member_count;
if(!(((typeof data22 == "number") && (!(data22 % 1) && !isNaN(data22))) && (isFinite(data22)))){
const err59 = {instancePath:instancePath+"/coverage/absolute_price_qualified_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if((typeof data22 == "number") && (isFinite(data22))){
if(data22 > 1000000 || isNaN(data22)){
const err60 = {instancePath:instancePath+"/coverage/absolute_price_qualified_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data22 < 0 || isNaN(data22)){
const err61 = {instancePath:instancePath+"/coverage/absolute_price_qualified_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
}
if(data15.absolute_price_coverage_ratio !== undefined){
let data23 = data15.absolute_price_coverage_ratio;
if(typeof data23 === "string"){
if(!pattern362.test(data23)){
const err62 = {instancePath:instancePath+"/coverage/absolute_price_coverage_ratio",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?[0-9]+(?:\\.[0-9]+)?$"},message:"must match pattern \""+"^-?[0-9]+(?:\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
else {
const err63 = {instancePath:instancePath+"/coverage/absolute_price_coverage_ratio",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data15.absolute_price_coverage_ratio_lower_bound !== undefined){
let data24 = data15.absolute_price_coverage_ratio_lower_bound;
if(typeof data24 === "string"){
if(!pattern362.test(data24)){
const err64 = {instancePath:instancePath+"/coverage/absolute_price_coverage_ratio_lower_bound",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?[0-9]+(?:\\.[0-9]+)?$"},message:"must match pattern \""+"^-?[0-9]+(?:\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
else {
const err65 = {instancePath:instancePath+"/coverage/absolute_price_coverage_ratio_lower_bound",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
}
else {
const err66 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data.quality !== undefined){
let data25 = data.quality;
if(data25 && typeof data25 == "object" && !Array.isArray(data25)){
if(data25.overall === undefined){
const err67 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/required",keyword:"required",params:{missingProperty: "overall"},message:"must have required property '"+"overall"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data25.return === undefined){
const err68 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/required",keyword:"required",params:{missingProperty: "return"},message:"must have required property '"+"return"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(data25.price === undefined){
const err69 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/required",keyword:"required",params:{missingProperty: "price"},message:"must have required property '"+"price"+"'"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data25.grade_counts === undefined){
const err70 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/required",keyword:"required",params:{missingProperty: "grade_counts"},message:"must have required property '"+"grade_counts"+"'"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(data25.grade_d_share === undefined){
const err71 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/required",keyword:"required",params:{missingProperty: "grade_d_share"},message:"must have required property '"+"grade_d_share"+"'"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(data25.anomaly_member_count === undefined){
const err72 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/required",keyword:"required",params:{missingProperty: "anomaly_member_count"},message:"must have required property '"+"anomaly_member_count"+"'"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(data25.anomaly_contributions === undefined){
const err73 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/required",keyword:"required",params:{missingProperty: "anomaly_contributions"},message:"must have required property '"+"anomaly_contributions"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(data25.rejected_return_domain_count === undefined){
const err74 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/required",keyword:"required",params:{missingProperty: "rejected_return_domain_count"},message:"must have required property '"+"rejected_return_domain_count"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data25.reason_codes === undefined){
const err75 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/required",keyword:"required",params:{missingProperty: "reason_codes"},message:"must have required property '"+"reason_codes"+"'"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
for(const key4 in data25){
if(!(func9.call(schema662.properties.quality.properties, key4))){
const err76 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data25.overall !== undefined){
let data26 = data25.overall;
if(!((((data26 === "HIGH") || (data26 === "PARTIAL")) || (data26 === "LOW")) || (data26 === "UNAVAILABLE"))){
const err77 = {instancePath:instancePath+"/quality/overall",schemaPath:"#/properties/quality/properties/overall/enum",keyword:"enum",params:{allowedValues: schema662.properties.quality.properties.overall.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data25.return !== undefined){
let data27 = data25.return;
if(!((((data27 === "HIGH") || (data27 === "PARTIAL")) || (data27 === "LOW")) || (data27 === "UNAVAILABLE"))){
const err78 = {instancePath:instancePath+"/quality/return",schemaPath:"#/properties/quality/properties/return/enum",keyword:"enum",params:{allowedValues: schema662.properties.quality.properties.return.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data25.price !== undefined){
let data28 = data25.price;
if(!((((data28 === "HIGH") || (data28 === "PARTIAL")) || (data28 === "LOW")) || (data28 === "UNAVAILABLE"))){
const err79 = {instancePath:instancePath+"/quality/price",schemaPath:"#/properties/quality/properties/price/enum",keyword:"enum",params:{allowedValues: schema662.properties.quality.properties.price.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data25.grade_counts !== undefined){
let data29 = data25.grade_counts;
if(data29 && typeof data29 == "object" && !Array.isArray(data29)){
if(data29.A === undefined){
const err80 = {instancePath:instancePath+"/quality/grade_counts",schemaPath:"#/properties/quality/properties/grade_counts/required",keyword:"required",params:{missingProperty: "A"},message:"must have required property '"+"A"+"'"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data29.B === undefined){
const err81 = {instancePath:instancePath+"/quality/grade_counts",schemaPath:"#/properties/quality/properties/grade_counts/required",keyword:"required",params:{missingProperty: "B"},message:"must have required property '"+"B"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(data29.C === undefined){
const err82 = {instancePath:instancePath+"/quality/grade_counts",schemaPath:"#/properties/quality/properties/grade_counts/required",keyword:"required",params:{missingProperty: "C"},message:"must have required property '"+"C"+"'"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(data29.D === undefined){
const err83 = {instancePath:instancePath+"/quality/grade_counts",schemaPath:"#/properties/quality/properties/grade_counts/required",keyword:"required",params:{missingProperty: "D"},message:"must have required property '"+"D"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data29.E === undefined){
const err84 = {instancePath:instancePath+"/quality/grade_counts",schemaPath:"#/properties/quality/properties/grade_counts/required",keyword:"required",params:{missingProperty: "E"},message:"must have required property '"+"E"+"'"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
for(const key5 in data29){
if(!(((((key5 === "A") || (key5 === "B")) || (key5 === "C")) || (key5 === "D")) || (key5 === "E"))){
const err85 = {instancePath:instancePath+"/quality/grade_counts",schemaPath:"#/properties/quality/properties/grade_counts/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data29.A !== undefined){
let data30 = data29.A;
if(!(((typeof data30 == "number") && (!(data30 % 1) && !isNaN(data30))) && (isFinite(data30)))){
const err86 = {instancePath:instancePath+"/quality/grade_counts/A",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if((typeof data30 == "number") && (isFinite(data30))){
if(data30 > 1000000 || isNaN(data30)){
const err87 = {instancePath:instancePath+"/quality/grade_counts/A",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if(data30 < 0 || isNaN(data30)){
const err88 = {instancePath:instancePath+"/quality/grade_counts/A",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data29.B !== undefined){
let data31 = data29.B;
if(!(((typeof data31 == "number") && (!(data31 % 1) && !isNaN(data31))) && (isFinite(data31)))){
const err89 = {instancePath:instancePath+"/quality/grade_counts/B",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if((typeof data31 == "number") && (isFinite(data31))){
if(data31 > 1000000 || isNaN(data31)){
const err90 = {instancePath:instancePath+"/quality/grade_counts/B",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if(data31 < 0 || isNaN(data31)){
const err91 = {instancePath:instancePath+"/quality/grade_counts/B",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
}
if(data29.C !== undefined){
let data32 = data29.C;
if(!(((typeof data32 == "number") && (!(data32 % 1) && !isNaN(data32))) && (isFinite(data32)))){
const err92 = {instancePath:instancePath+"/quality/grade_counts/C",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if((typeof data32 == "number") && (isFinite(data32))){
if(data32 > 1000000 || isNaN(data32)){
const err93 = {instancePath:instancePath+"/quality/grade_counts/C",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(data32 < 0 || isNaN(data32)){
const err94 = {instancePath:instancePath+"/quality/grade_counts/C",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data29.D !== undefined){
let data33 = data29.D;
if(!(((typeof data33 == "number") && (!(data33 % 1) && !isNaN(data33))) && (isFinite(data33)))){
const err95 = {instancePath:instancePath+"/quality/grade_counts/D",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if((typeof data33 == "number") && (isFinite(data33))){
if(data33 > 1000000 || isNaN(data33)){
const err96 = {instancePath:instancePath+"/quality/grade_counts/D",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data33 < 0 || isNaN(data33)){
const err97 = {instancePath:instancePath+"/quality/grade_counts/D",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data29.E !== undefined){
let data34 = data29.E;
if(!(((typeof data34 == "number") && (!(data34 % 1) && !isNaN(data34))) && (isFinite(data34)))){
const err98 = {instancePath:instancePath+"/quality/grade_counts/E",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if((typeof data34 == "number") && (isFinite(data34))){
if(data34 > 1000000 || isNaN(data34)){
const err99 = {instancePath:instancePath+"/quality/grade_counts/E",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
if(data34 < 0 || isNaN(data34)){
const err100 = {instancePath:instancePath+"/quality/grade_counts/E",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
}
}
else {
const err101 = {instancePath:instancePath+"/quality/grade_counts",schemaPath:"#/properties/quality/properties/grade_counts/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(data25.grade_d_share !== undefined){
if(!(validate409(data25.grade_d_share, {instancePath:instancePath+"/quality/grade_d_share",parentData:data25,parentDataProperty:"grade_d_share",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate409.errors : vErrors.concat(validate409.errors);
errors = vErrors.length;
}
}
if(data25.anomaly_member_count !== undefined){
let data36 = data25.anomaly_member_count;
if(!(((typeof data36 == "number") && (!(data36 % 1) && !isNaN(data36))) && (isFinite(data36)))){
const err102 = {instancePath:instancePath+"/quality/anomaly_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if((typeof data36 == "number") && (isFinite(data36))){
if(data36 > 1000000 || isNaN(data36)){
const err103 = {instancePath:instancePath+"/quality/anomaly_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(data36 < 0 || isNaN(data36)){
const err104 = {instancePath:instancePath+"/quality/anomaly_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data25.anomaly_contributions !== undefined){
let data37 = data25.anomaly_contributions;
if(Array.isArray(data37)){
if(data37.length > 10){
const err105 = {instancePath:instancePath+"/quality/anomaly_contributions",schemaPath:"#/properties/quality/properties/anomaly_contributions/maxItems",keyword:"maxItems",params:{limit: 10},message:"must NOT have more than 10 items"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
const len0 = data37.length;
for(let i0=0; i0<len0; i0++){
let data38 = data37[i0];
if(data38 && typeof data38 == "object" && !Array.isArray(data38)){
if(data38.analysis_unit_id === undefined){
const err106 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0,schemaPath:"#/properties/quality/properties/anomaly_contributions/items/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if(data38.raw_return === undefined){
const err107 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0,schemaPath:"#/properties/quality/properties/anomaly_contributions/items/required",keyword:"required",params:{missingProperty: "raw_return"},message:"must have required property '"+"raw_return"+"'"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(data38.suppressed_return === undefined){
const err108 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0,schemaPath:"#/properties/quality/properties/anomaly_contributions/items/required",keyword:"required",params:{missingProperty: "suppressed_return"},message:"must have required property '"+"suppressed_return"+"'"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
if(data38.adjustment === undefined){
const err109 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0,schemaPath:"#/properties/quality/properties/anomaly_contributions/items/required",keyword:"required",params:{missingProperty: "adjustment"},message:"must have required property '"+"adjustment"+"'"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
for(const key6 in data38){
if(!((((key6 === "analysis_unit_id") || (key6 === "raw_return")) || (key6 === "suppressed_return")) || (key6 === "adjustment"))){
const err110 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0,schemaPath:"#/properties/quality/properties/anomaly_contributions/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
if(data38.analysis_unit_id !== undefined){
if(typeof data38.analysis_unit_id !== "string"){
const err111 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0+"/analysis_unit_id",schemaPath:"#/properties/quality/properties/anomaly_contributions/items/properties/analysis_unit_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
if(data38.raw_return !== undefined){
let data40 = data38.raw_return;
if(typeof data40 === "string"){
if(!pattern362.test(data40)){
const err112 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0+"/raw_return",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?[0-9]+(?:\\.[0-9]+)?$"},message:"must match pattern \""+"^-?[0-9]+(?:\\.[0-9]+)?$"+"\""};
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
const err113 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0+"/raw_return",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
}
if(data38.suppressed_return !== undefined){
let data41 = data38.suppressed_return;
if(typeof data41 === "string"){
if(!pattern362.test(data41)){
const err114 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0+"/suppressed_return",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?[0-9]+(?:\\.[0-9]+)?$"},message:"must match pattern \""+"^-?[0-9]+(?:\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
else {
const err115 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0+"/suppressed_return",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
if(data38.adjustment !== undefined){
let data42 = data38.adjustment;
if(typeof data42 === "string"){
if(!pattern362.test(data42)){
const err116 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0+"/adjustment",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?[0-9]+(?:\\.[0-9]+)?$"},message:"must match pattern \""+"^-?[0-9]+(?:\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
else {
const err117 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0+"/adjustment",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
}
else {
const err118 = {instancePath:instancePath+"/quality/anomaly_contributions/" + i0,schemaPath:"#/properties/quality/properties/anomaly_contributions/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err119 = {instancePath:instancePath+"/quality/anomaly_contributions",schemaPath:"#/properties/quality/properties/anomaly_contributions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
}
if(data25.rejected_return_domain_count !== undefined){
let data43 = data25.rejected_return_domain_count;
if(!(((typeof data43 == "number") && (!(data43 % 1) && !isNaN(data43))) && (isFinite(data43)))){
const err120 = {instancePath:instancePath+"/quality/rejected_return_domain_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if((typeof data43 == "number") && (isFinite(data43))){
if(data43 > 1000000 || isNaN(data43)){
const err121 = {instancePath:instancePath+"/quality/rejected_return_domain_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data43 < 0 || isNaN(data43)){
const err122 = {instancePath:instancePath+"/quality/rejected_return_domain_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data25.reason_codes !== undefined){
let data44 = data25.reason_codes;
if(Array.isArray(data44)){
if(data44.length < 1){
const err123 = {instancePath:instancePath+"/quality/reason_codes",schemaPath:"#/properties/quality/properties/reason_codes/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
const len1 = data44.length;
for(let i1=0; i1<len1; i1++){
if(typeof data44[i1] !== "string"){
const err124 = {instancePath:instancePath+"/quality/reason_codes/" + i1,schemaPath:"#/properties/quality/properties/reason_codes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
let i2 = data44.length;
let j0;
if(i2 > 1){
const indices0 = {};
for(;i2--;){
let item0 = data44[i2];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err125 = {instancePath:instancePath+"/quality/reason_codes",schemaPath:"#/properties/quality/properties/reason_codes/uniqueItems",keyword:"uniqueItems",params:{i: i2, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i2+" are identical)"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
break;
}
indices0[item0] = i2;
}
}
}
else {
const err126 = {instancePath:instancePath+"/quality/reason_codes",schemaPath:"#/properties/quality/properties/reason_codes/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err127 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
if(data.origin_uncertainty !== undefined){
let data46 = data.origin_uncertainty;
if(data46 && typeof data46 == "object" && !Array.isArray(data46)){
if(data46.status === undefined){
const err128 = {instancePath:instancePath+"/origin_uncertainty",schemaPath:"#/properties/origin_uncertainty/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
if(data46.active_uncertain_origin_member_count === undefined){
const err129 = {instancePath:instancePath+"/origin_uncertainty",schemaPath:"#/properties/origin_uncertainty/required",keyword:"required",params:{missingProperty: "active_uncertain_origin_member_count"},message:"must have required property '"+"active_uncertain_origin_member_count"+"'"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if(data46.possible_unadmitted_member_count === undefined){
const err130 = {instancePath:instancePath+"/origin_uncertainty",schemaPath:"#/properties/origin_uncertainty/required",keyword:"required",params:{missingProperty: "possible_unadmitted_member_count"},message:"must have required property '"+"possible_unadmitted_member_count"+"'"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
for(const key7 in data46){
if(!(((key7 === "status") || (key7 === "active_uncertain_origin_member_count")) || (key7 === "possible_unadmitted_member_count"))){
const err131 = {instancePath:instancePath+"/origin_uncertainty",schemaPath:"#/properties/origin_uncertainty/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
if(data46.status !== undefined){
let data47 = data46.status;
if(!((((data47 === "NONE") || (data47 === "ACTIVE_UNCERTAIN_ORIGIN")) || (data47 === "POSSIBLE_UNADMITTED_MEMBERS")) || (data47 === "ACTIVE_AND_POSSIBLE_UNCERTAIN_ORIGIN"))){
const err132 = {instancePath:instancePath+"/origin_uncertainty/status",schemaPath:"#/properties/origin_uncertainty/properties/status/enum",keyword:"enum",params:{allowedValues: schema662.properties.origin_uncertainty.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
if(data46.active_uncertain_origin_member_count !== undefined){
let data48 = data46.active_uncertain_origin_member_count;
if(!(((typeof data48 == "number") && (!(data48 % 1) && !isNaN(data48))) && (isFinite(data48)))){
const err133 = {instancePath:instancePath+"/origin_uncertainty/active_uncertain_origin_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
if((typeof data48 == "number") && (isFinite(data48))){
if(data48 > 1000000 || isNaN(data48)){
const err134 = {instancePath:instancePath+"/origin_uncertainty/active_uncertain_origin_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
if(data48 < 0 || isNaN(data48)){
const err135 = {instancePath:instancePath+"/origin_uncertainty/active_uncertain_origin_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
}
if(data46.possible_unadmitted_member_count !== undefined){
let data49 = data46.possible_unadmitted_member_count;
if(!(((typeof data49 == "number") && (!(data49 % 1) && !isNaN(data49))) && (isFinite(data49)))){
const err136 = {instancePath:instancePath+"/origin_uncertainty/possible_unadmitted_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
if((typeof data49 == "number") && (isFinite(data49))){
if(data49 > 1000000 || isNaN(data49)){
const err137 = {instancePath:instancePath+"/origin_uncertainty/possible_unadmitted_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(data49 < 0 || isNaN(data49)){
const err138 = {instancePath:instancePath+"/origin_uncertainty/possible_unadmitted_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err139 = {instancePath:instancePath+"/origin_uncertainty",schemaPath:"#/properties/origin_uncertainty/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err140 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
validate408.errors = vErrors;
return errors === 0;
}
validate408.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate401(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2:market-sector-index-public-api:2" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate401.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.contract_name === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_name"},message:"must have required property '"+"contract_name"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.contract_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_version"},message:"must have required property '"+"contract_version"+"'"};
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
if(data.product_kind === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "product_kind"},message:"must have required property '"+"product_kind"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.purpose === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.prediction_status === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "prediction_status"},message:"must have required property '"+"prediction_status"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.release === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "release"},message:"must have required property '"+"release"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.scope === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope"},message:"must have required property '"+"scope"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.query === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.points === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "points"},message:"must have required property '"+"points"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema636.properties, key0))){
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
if(data.contract_name !== undefined){
if("market-sector-index-public-api" !== data.contract_name){
const err11 = {instancePath:instancePath+"/contract_name",schemaPath:"#/properties/contract_name/const",keyword:"const",params:{allowedValue: "market-sector-index-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.contract_version !== undefined){
if("2" !== data.contract_version){
const err12 = {instancePath:instancePath+"/contract_version",schemaPath:"#/properties/contract_version/const",keyword:"const",params:{allowedValue: "2"},message:"must be equal to constant"};
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
if("INDEX_SERIES" !== data.response_kind){
const err13 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "INDEX_SERIES"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.product_kind !== undefined){
if("DESCRIPTIVE_MARKET_SECTOR_INDEX" !== data.product_kind){
const err14 = {instancePath:instancePath+"/product_kind",schemaPath:"#/properties/product_kind/const",keyword:"const",params:{allowedValue: "DESCRIPTIVE_MARKET_SECTOR_INDEX"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.purpose !== undefined){
if("CS2_ROTATE_DESCRIPTIVE_MARKET_SECTOR_INDEX_HISTORY_AND_CURRENT_V2" !== data.purpose){
const err15 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/const",keyword:"const",params:{allowedValue: "CS2_ROTATE_DESCRIPTIVE_MARKET_SECTOR_INDEX_HISTORY_AND_CURRENT_V2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.prediction_status !== undefined){
if("NOT_A_PREDICTION" !== data.prediction_status){
const err16 = {instancePath:instancePath+"/prediction_status",schemaPath:"#/properties/prediction_status/const",keyword:"const",params:{allowedValue: "NOT_A_PREDICTION"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.release !== undefined){
if(!(validate402(data.release, {instancePath:instancePath+"/release",parentData:data,parentDataProperty:"release",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate402.errors : vErrors.concat(validate402.errors);
errors = vErrors.length;
}
}
if(data.scope !== undefined){
if(!(validate404(data.scope, {instancePath:instancePath+"/scope",parentData:data,parentDataProperty:"scope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate404.errors : vErrors.concat(validate404.errors);
errors = vErrors.length;
}
}
if(data.query !== undefined){
if(!(validate406(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate406.errors : vErrors.concat(validate406.errors);
errors = vErrors.length;
}
}
if(data.points !== undefined){
let data9 = data.points;
if(Array.isArray(data9)){
if(data9.length > 512){
const err17 = {instancePath:instancePath+"/points",schemaPath:"#/properties/points/maxItems",keyword:"maxItems",params:{limit: 512},message:"must NOT have more than 512 items"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
const len0 = data9.length;
for(let i0=0; i0<len0; i0++){
if(!(validate408(data9[i0], {instancePath:instancePath+"/points/" + i0,parentData:data9,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate408.errors : vErrors.concat(validate408.errors);
errors = vErrors.length;
}
}
}
else {
const err18 = {instancePath:instancePath+"/points",schemaPath:"#/properties/points/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
validate401.errors = vErrors;
return errors === 0;
}
validate401.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
