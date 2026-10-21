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
export const validateSingleItemCurrentPublicApiResponse = validate499;
const schema859 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:single-item-current-public-api:v1","title":"Point-in-time single-item current-stage publication","oneOf":[{"$ref":"#/$defs/success"},{"$ref":"#/$defs/error"}],"$defs":{"sha":{"type":"string","pattern":"^[0-9a-f]{64}$"},"timestamp":{"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},"date":{"type":"string","format":"date"},"publication":{"type":"object","additionalProperties":false,"required":["publication_id","parent_publication_id","manifest_sha256","rights_revision","published_at","withdrawn_at"],"properties":{"publication_id":{"$ref":"#/$defs/sha"},"parent_publication_id":{"oneOf":[{"$ref":"#/$defs/sha"},{"type":"null"}]},"manifest_sha256":{"$ref":"#/$defs/sha"},"rights_revision":{"$ref":"#/$defs/sha"},"published_at":{"$ref":"#/$defs/timestamp"},"withdrawn_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]}}},"coverage":{"type":"object","additionalProperties":false,"required":["expected_slots","qualified_paired_slots","longest_missing_run","quality"],"properties":{"expected_slots":{"const":288},"qualified_paired_slots":{"type":"integer","minimum":0,"maximum":288},"longest_missing_run":{"type":"integer","minimum":0,"maximum":288},"quality":{"enum":["FULL","HIGH_COVERAGE","PARTIAL_USABLE"]}}},"snapshot":{"type":"object","additionalProperties":false,"required":["catalog_snapshot_id","membership_version","input_head_sha256","source_observed_through","source_available_through","imported_at"],"properties":{"catalog_snapshot_id":{"$ref":"#/$defs/sha"},"membership_version":{"$ref":"#/$defs/sha"},"input_head_sha256":{"$ref":"#/$defs/sha"},"source_observed_through":{"$ref":"#/$defs/date"},"source_available_through":{"$ref":"#/$defs/timestamp"},"imported_at":{"$ref":"#/$defs/timestamp"}}},"release":{"type":"object","additionalProperties":false,"required":["runtime_version","projection_version","causal_kernel_version","policy_sha256","coverage_policy_version","full_member_count","evaluated_member_count","public_stage_count"],"properties":{"runtime_version":{"const":"single-item-prospective-runtime/4"},"projection_version":{"const":"single-item-prospective-stage/1"},"causal_kernel_version":{"const":"single-item-causal-kernel/2.4"},"policy_sha256":{"$ref":"#/$defs/sha"},"coverage_policy_version":{"$ref":"#/$defs/sha"},"full_member_count":{"type":"integer","minimum":1,"maximum":20000},"evaluated_member_count":{"type":"integer","minimum":0,"maximum":20000},"public_stage_count":{"type":"integer","minimum":0,"maximum":20000}}},"member":{"type":"object","additionalProperties":false,"required":["stage_token","catalog_snapshot_id","catalog","stage","first_leg","as_of","supply_onset","supply_detected_at","price_onset","price_detected_at","pairing_deadline_on","timing_relationship","supply_contraction_ratio","supply_measurement_confidence","confidence_is_probability","bid_role","coverage","retrospective_peak","retrospective_ended_on"],"properties":{"stage_token":{"$ref":"#/$defs/sha"},"catalog_snapshot_id":{"$ref":"#/$defs/sha"},"catalog":{"$ref":"urn:cs2-research:catalog-display-api:v1#/$defs/projection"},"stage":{"enum":["SUPPLY_PRESSURE","PRICE_RESPONSE_ONLY","PAIRED_RESPONSE"]},"first_leg":{"enum":["SUPPLY","PRICE"]},"as_of":{"$ref":"#/$defs/timestamp"},"supply_onset":{"oneOf":[{"$ref":"#/$defs/date"},{"type":"null"}]},"supply_detected_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]},"price_onset":{"oneOf":[{"$ref":"#/$defs/date"},{"type":"null"}]},"price_detected_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]},"pairing_deadline_on":{"$ref":"#/$defs/date"},"timing_relationship":{"oneOf":[{"enum":["SUPPLY_LEADS","PRICE_LEADS","CONCURRENT_DAILY"]},{"type":"null"}]},"supply_contraction_ratio":{"oneOf":[{"type":"string","pattern":"^(0(\\.[0-9]+)?|1(\\.0+)?)$"},{"type":"null"}]},"supply_measurement_confidence":{"enum":["STANDARD","LOW_BASELINE_DEPTH"]},"confidence_is_probability":{"const":false},"bid_role":{"const":"QUOTE_QUALITY_CONTEXT_ONLY"},"coverage":{"$ref":"#/$defs/coverage"},"retrospective_peak":{"type":"null"},"retrospective_ended_on":{"type":"null"}}},"freshness":{"type":"object","additionalProperties":false,"required":["evaluated_at","expected_latest_complete_date","lag_complete_days","status","headline_data_date"],"properties":{"evaluated_at":{"$ref":"#/$defs/timestamp"},"expected_latest_complete_date":{"$ref":"#/$defs/date"},"lag_complete_days":{"type":"integer","minimum":0,"maximum":100000},"status":{"enum":["CURRENT","STALE_RETAINED"]},"headline_data_date":{"$ref":"#/$defs/date"}}},"projection":{"type":"object","additionalProperties":false,"required":["snapshot","release","empty_reason","members"],"properties":{"snapshot":{"$ref":"#/$defs/snapshot"},"release":{"$ref":"#/$defs/release"},"empty_reason":{"enum":[null,"NO_CURRENT_STAGE"]},"members":{"type":"array","minItems":0,"maxItems":20000,"items":{"$ref":"#/$defs/member"}}}},"success":{"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","operation","publication","snapshot","release","freshness","empty_reason","sort","page_size","members","next_cursor"],"properties":{"contract_name":{"const":"single-item-current-public-api"},"contract_version":{"const":"1"},"response_kind":{"enum":["RESULT","EMPTY"]},"operation":{"enum":["LIST","DETAIL"]},"publication":{"$ref":"#/$defs/publication"},"snapshot":{"$ref":"#/$defs/snapshot"},"release":{"$ref":"#/$defs/release"},"freshness":{"$ref":"#/$defs/freshness"},"empty_reason":{"enum":[null,"NO_CURRENT_STAGE"]},"sort":{"enum":["RELIABLE_SIGNAL_DESC","DETECTED_DESC","SUPPLY_CONTRACTION_DESC"]},"page_size":{"type":"integer","minimum":1,"maximum":100},"members":{"type":"array","minItems":0,"maxItems":100,"items":{"$ref":"#/$defs/member"}},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":4096,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]}}},"error":{"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","error"],"properties":{"contract_name":{"const":"single-item-current-public-api"},"contract_version":{"const":"1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_REQUEST","NOT_PUBLISHED","NOT_FOUND","WITHDRAWN","STALE_EXPIRED","CORRUPT_PUBLICATION","TEMPORARILY_UNAVAILABLE"]},"retryable":{"type":"boolean"}}}}}}};
const schema898 = {"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","error"],"properties":{"contract_name":{"const":"single-item-current-public-api"},"contract_version":{"const":"1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_REQUEST","NOT_PUBLISHED","NOT_FOUND","WITHDRAWN","STALE_EXPIRED","CORRUPT_PUBLICATION","TEMPORARILY_UNAVAILABLE"]},"retryable":{"type":"boolean"}}}}};
const schema860 = {"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","operation","publication","snapshot","release","freshness","empty_reason","sort","page_size","members","next_cursor"],"properties":{"contract_name":{"const":"single-item-current-public-api"},"contract_version":{"const":"1"},"response_kind":{"enum":["RESULT","EMPTY"]},"operation":{"enum":["LIST","DETAIL"]},"publication":{"$ref":"#/$defs/publication"},"snapshot":{"$ref":"#/$defs/snapshot"},"release":{"$ref":"#/$defs/release"},"freshness":{"$ref":"#/$defs/freshness"},"empty_reason":{"enum":[null,"NO_CURRENT_STAGE"]},"sort":{"enum":["RELIABLE_SIGNAL_DESC","DETECTED_DESC","SUPPLY_CONTRACTION_DESC"]},"page_size":{"type":"integer","minimum":1,"maximum":100},"members":{"type":"array","minItems":0,"maxItems":100,"items":{"$ref":"#/$defs/member"}},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":4096,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]}}};
const func9 = Object.prototype.hasOwnProperty;
const func2 = __wireUcs2Length;
const schema861 = {"type":"object","additionalProperties":false,"required":["publication_id","parent_publication_id","manifest_sha256","rights_revision","published_at","withdrawn_at"],"properties":{"publication_id":{"$ref":"#/$defs/sha"},"parent_publication_id":{"oneOf":[{"$ref":"#/$defs/sha"},{"type":"null"}]},"manifest_sha256":{"$ref":"#/$defs/sha"},"rights_revision":{"$ref":"#/$defs/sha"},"published_at":{"$ref":"#/$defs/timestamp"},"withdrawn_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]}}};
const schema862 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const schema866 = {"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"};
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");
const pattern319 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$", "u");
const formats0 = __wireFullFormats["date-time"];

function validate501(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate501.evaluated;
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
validate501.errors = vErrors;
return errors === 0;
}
validate501.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema868 = {"type":"object","additionalProperties":false,"required":["catalog_snapshot_id","membership_version","input_head_sha256","source_observed_through","source_available_through","imported_at"],"properties":{"catalog_snapshot_id":{"$ref":"#/$defs/sha"},"membership_version":{"$ref":"#/$defs/sha"},"input_head_sha256":{"$ref":"#/$defs/sha"},"source_observed_through":{"$ref":"#/$defs/date"},"source_available_through":{"$ref":"#/$defs/timestamp"},"imported_at":{"$ref":"#/$defs/timestamp"}}};
const schema872 = {"type":"string","format":"date"};
const formats40 = __wireFullFormats.date;

function validate503(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate503.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.catalog_snapshot_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_snapshot_id"},message:"must have required property '"+"catalog_snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.membership_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "membership_version"},message:"must have required property '"+"membership_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.input_head_sha256 === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_head_sha256"},message:"must have required property '"+"input_head_sha256"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.source_observed_through === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_observed_through"},message:"must have required property '"+"source_observed_through"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.source_available_through === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_available_through"},message:"must have required property '"+"source_available_through"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.imported_at === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "imported_at"},message:"must have required property '"+"imported_at"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "catalog_snapshot_id") || (key0 === "membership_version")) || (key0 === "input_head_sha256")) || (key0 === "source_observed_through")) || (key0 === "source_available_through")) || (key0 === "imported_at"))){
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
if(data.catalog_snapshot_id !== undefined){
let data0 = data.catalog_snapshot_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err7 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.membership_version !== undefined){
let data1 = data.membership_version;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err9 = {instancePath:instancePath+"/membership_version",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err10 = {instancePath:instancePath+"/membership_version",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.input_head_sha256 !== undefined){
let data2 = data.input_head_sha256;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err11 = {instancePath:instancePath+"/input_head_sha256",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err12 = {instancePath:instancePath+"/input_head_sha256",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.source_observed_through !== undefined){
let data3 = data.source_observed_through;
if(typeof data3 === "string"){
if(!(formats40.validate(data3))){
const err13 = {instancePath:instancePath+"/source_observed_through",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err14 = {instancePath:instancePath+"/source_observed_through",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.source_available_through !== undefined){
let data4 = data.source_available_through;
if(typeof data4 === "string"){
if(!pattern319.test(data4)){
const err15 = {instancePath:instancePath+"/source_available_through",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!(formats0.validate(data4))){
const err16 = {instancePath:instancePath+"/source_available_through",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err17 = {instancePath:instancePath+"/source_available_through",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.imported_at !== undefined){
let data5 = data.imported_at;
if(typeof data5 === "string"){
if(!pattern319.test(data5)){
const err18 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!(formats0.validate(data5))){
const err19 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err20 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate503.errors = vErrors;
return errors === 0;
}
validate503.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema875 = {"type":"object","additionalProperties":false,"required":["runtime_version","projection_version","causal_kernel_version","policy_sha256","coverage_policy_version","full_member_count","evaluated_member_count","public_stage_count"],"properties":{"runtime_version":{"const":"single-item-prospective-runtime/4"},"projection_version":{"const":"single-item-prospective-stage/1"},"causal_kernel_version":{"const":"single-item-causal-kernel/2.4"},"policy_sha256":{"$ref":"#/$defs/sha"},"coverage_policy_version":{"$ref":"#/$defs/sha"},"full_member_count":{"type":"integer","minimum":1,"maximum":20000},"evaluated_member_count":{"type":"integer","minimum":0,"maximum":20000},"public_stage_count":{"type":"integer","minimum":0,"maximum":20000}}};

function validate505(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate505.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.runtime_version === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "runtime_version"},message:"must have required property '"+"runtime_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.projection_version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "projection_version"},message:"must have required property '"+"projection_version"+"'"};
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
if(data.policy_sha256 === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "policy_sha256"},message:"must have required property '"+"policy_sha256"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.coverage_policy_version === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "coverage_policy_version"},message:"must have required property '"+"coverage_policy_version"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.full_member_count === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "full_member_count"},message:"must have required property '"+"full_member_count"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.evaluated_member_count === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evaluated_member_count"},message:"must have required property '"+"evaluated_member_count"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.public_stage_count === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "public_stage_count"},message:"must have required property '"+"public_stage_count"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "runtime_version") || (key0 === "projection_version")) || (key0 === "causal_kernel_version")) || (key0 === "policy_sha256")) || (key0 === "coverage_policy_version")) || (key0 === "full_member_count")) || (key0 === "evaluated_member_count")) || (key0 === "public_stage_count"))){
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
if(data.runtime_version !== undefined){
if("single-item-prospective-runtime/4" !== data.runtime_version){
const err9 = {instancePath:instancePath+"/runtime_version",schemaPath:"#/properties/runtime_version/const",keyword:"const",params:{allowedValue: "single-item-prospective-runtime/4"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.projection_version !== undefined){
if("single-item-prospective-stage/1" !== data.projection_version){
const err10 = {instancePath:instancePath+"/projection_version",schemaPath:"#/properties/projection_version/const",keyword:"const",params:{allowedValue: "single-item-prospective-stage/1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.causal_kernel_version !== undefined){
if("single-item-causal-kernel/2.4" !== data.causal_kernel_version){
const err11 = {instancePath:instancePath+"/causal_kernel_version",schemaPath:"#/properties/causal_kernel_version/const",keyword:"const",params:{allowedValue: "single-item-causal-kernel/2.4"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.policy_sha256 !== undefined){
let data3 = data.policy_sha256;
if(typeof data3 === "string"){
if(!pattern5.test(data3)){
const err12 = {instancePath:instancePath+"/policy_sha256",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err13 = {instancePath:instancePath+"/policy_sha256",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.coverage_policy_version !== undefined){
let data4 = data.coverage_policy_version;
if(typeof data4 === "string"){
if(!pattern5.test(data4)){
const err14 = {instancePath:instancePath+"/coverage_policy_version",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err15 = {instancePath:instancePath+"/coverage_policy_version",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.full_member_count !== undefined){
let data5 = data.full_member_count;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err16 = {instancePath:instancePath+"/full_member_count",schemaPath:"#/properties/full_member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 20000 || isNaN(data5)){
const err17 = {instancePath:instancePath+"/full_member_count",schemaPath:"#/properties/full_member_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 20000},message:"must be <= 20000"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data5 < 1 || isNaN(data5)){
const err18 = {instancePath:instancePath+"/full_member_count",schemaPath:"#/properties/full_member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.evaluated_member_count !== undefined){
let data6 = data.evaluated_member_count;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err19 = {instancePath:instancePath+"/evaluated_member_count",schemaPath:"#/properties/evaluated_member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 > 20000 || isNaN(data6)){
const err20 = {instancePath:instancePath+"/evaluated_member_count",schemaPath:"#/properties/evaluated_member_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 20000},message:"must be <= 20000"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data6 < 0 || isNaN(data6)){
const err21 = {instancePath:instancePath+"/evaluated_member_count",schemaPath:"#/properties/evaluated_member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.public_stage_count !== undefined){
let data7 = data.public_stage_count;
if(!(((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7))) && (isFinite(data7)))){
const err22 = {instancePath:instancePath+"/public_stage_count",schemaPath:"#/properties/public_stage_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if((typeof data7 == "number") && (isFinite(data7))){
if(data7 > 20000 || isNaN(data7)){
const err23 = {instancePath:instancePath+"/public_stage_count",schemaPath:"#/properties/public_stage_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 20000},message:"must be <= 20000"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data7 < 0 || isNaN(data7)){
const err24 = {instancePath:instancePath+"/public_stage_count",schemaPath:"#/properties/public_stage_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
validate505.errors = vErrors;
return errors === 0;
}
validate505.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema878 = {"type":"object","additionalProperties":false,"required":["evaluated_at","expected_latest_complete_date","lag_complete_days","status","headline_data_date"],"properties":{"evaluated_at":{"$ref":"#/$defs/timestamp"},"expected_latest_complete_date":{"$ref":"#/$defs/date"},"lag_complete_days":{"type":"integer","minimum":0,"maximum":100000},"status":{"enum":["CURRENT","STALE_RETAINED"]},"headline_data_date":{"$ref":"#/$defs/date"}}};

function validate507(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate507.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.evaluated_at === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evaluated_at"},message:"must have required property '"+"evaluated_at"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.expected_latest_complete_date === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expected_latest_complete_date"},message:"must have required property '"+"expected_latest_complete_date"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.lag_complete_days === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "lag_complete_days"},message:"must have required property '"+"lag_complete_days"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.status === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.headline_data_date === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "headline_data_date"},message:"must have required property '"+"headline_data_date"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "evaluated_at") || (key0 === "expected_latest_complete_date")) || (key0 === "lag_complete_days")) || (key0 === "status")) || (key0 === "headline_data_date"))){
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
if(data.evaluated_at !== undefined){
let data0 = data.evaluated_at;
if(typeof data0 === "string"){
if(!pattern319.test(data0)){
const err6 = {instancePath:instancePath+"/evaluated_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!(formats0.validate(data0))){
const err7 = {instancePath:instancePath+"/evaluated_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err8 = {instancePath:instancePath+"/evaluated_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.expected_latest_complete_date !== undefined){
let data1 = data.expected_latest_complete_date;
if(typeof data1 === "string"){
if(!(formats40.validate(data1))){
const err9 = {instancePath:instancePath+"/expected_latest_complete_date",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err10 = {instancePath:instancePath+"/expected_latest_complete_date",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.lag_complete_days !== undefined){
let data2 = data.lag_complete_days;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err11 = {instancePath:instancePath+"/lag_complete_days",schemaPath:"#/properties/lag_complete_days/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 100000 || isNaN(data2)){
const err12 = {instancePath:instancePath+"/lag_complete_days",schemaPath:"#/properties/lag_complete_days/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100000},message:"must be <= 100000"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err13 = {instancePath:instancePath+"/lag_complete_days",schemaPath:"#/properties/lag_complete_days/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.status !== undefined){
let data3 = data.status;
if(!((data3 === "CURRENT") || (data3 === "STALE_RETAINED"))){
const err14 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema878.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.headline_data_date !== undefined){
let data4 = data.headline_data_date;
if(typeof data4 === "string"){
if(!(formats40.validate(data4))){
const err15 = {instancePath:instancePath+"/headline_data_date",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err16 = {instancePath:instancePath+"/headline_data_date",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate507.errors = vErrors;
return errors === 0;
}
validate507.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema882 = {"type":"object","additionalProperties":false,"required":["stage_token","catalog_snapshot_id","catalog","stage","first_leg","as_of","supply_onset","supply_detected_at","price_onset","price_detected_at","pairing_deadline_on","timing_relationship","supply_contraction_ratio","supply_measurement_confidence","confidence_is_probability","bid_role","coverage","retrospective_peak","retrospective_ended_on"],"properties":{"stage_token":{"$ref":"#/$defs/sha"},"catalog_snapshot_id":{"$ref":"#/$defs/sha"},"catalog":{"$ref":"urn:cs2-research:catalog-display-api:v1#/$defs/projection"},"stage":{"enum":["SUPPLY_PRESSURE","PRICE_RESPONSE_ONLY","PAIRED_RESPONSE"]},"first_leg":{"enum":["SUPPLY","PRICE"]},"as_of":{"$ref":"#/$defs/timestamp"},"supply_onset":{"oneOf":[{"$ref":"#/$defs/date"},{"type":"null"}]},"supply_detected_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]},"price_onset":{"oneOf":[{"$ref":"#/$defs/date"},{"type":"null"}]},"price_detected_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]},"pairing_deadline_on":{"$ref":"#/$defs/date"},"timing_relationship":{"oneOf":[{"enum":["SUPPLY_LEADS","PRICE_LEADS","CONCURRENT_DAILY"]},{"type":"null"}]},"supply_contraction_ratio":{"oneOf":[{"type":"string","pattern":"^(0(\\.[0-9]+)?|1(\\.0+)?)$"},{"type":"null"}]},"supply_measurement_confidence":{"enum":["STANDARD","LOW_BASELINE_DEPTH"]},"confidence_is_probability":{"const":false},"bid_role":{"const":"QUOTE_QUALITY_CONTEXT_ONLY"},"coverage":{"$ref":"#/$defs/coverage"},"retrospective_peak":{"type":"null"},"retrospective_ended_on":{"type":"null"}}};
const schema897 = {"type":"object","additionalProperties":false,"required":["expected_slots","qualified_paired_slots","longest_missing_run","quality"],"properties":{"expected_slots":{"const":288},"qualified_paired_slots":{"type":"integer","minimum":0,"maximum":288},"longest_missing_run":{"type":"integer","minimum":0,"maximum":288},"quality":{"enum":["FULL","HIGH_COVERAGE","PARTIAL_USABLE"]}}};
const pattern6 = new RegExp("^(0(\\.[0-9]+)?|1(\\.0+)?)$", "u");
const schema173 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","analysis_unit_kind","base_item_code","catalog_version","edition_kind","item_kind","localized_name","media","parent_analysis_unit_id","projection_hash","valid_from","version_context","wear_tier"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/identifier"},{"type":"null"}]},"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"item_kind":{"enum":["WEAPON","KNIFE","GLOVE","AGENT","OTHER","UNKNOWN"]},"base_item_code":{"$ref":"#/$defs/identifier"},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]},"wear_tier":{"enum":["FACTORY_NEW","MINIMAL_WEAR","FIELD_TESTED","WELL_WORN","BATTLE_SCARRED","NOT_APPLICABLE","UNKNOWN"]},"localized_name":{"$ref":"#/$defs/localizedName"},"media":{"$ref":"#/$defs/media"},"catalog_version":{"type":"string","minLength":1,"maxLength":128,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"version_context":{"$ref":"#/$defs/versionContext"},"valid_from":{"$ref":"#/$defs/timestamp"},"projection_hash":{"type":"string","pattern":"^[0-9a-f]{64}$"}}};
const schema170 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"};
const schema177 = {"type":"object","additionalProperties":false,"required":["authority","en","zh_cn"],"properties":{"authority":{"enum":["VALVE_STEAM","MARKET_D","MARKET_B"]},"en":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"zh_cn":{"type":"string","minLength":1,"maxLength":512,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"}}};
const schema169 = {"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"};
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


function validate510(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate510.evaluated;
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
validate510.errors = vErrors;
return errors === 0;
}
validate510.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate509(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate509.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.stage_token === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage_token"},message:"must have required property '"+"stage_token"+"'"};
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
if(data.stage === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.first_leg === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "first_leg"},message:"must have required property '"+"first_leg"+"'"};
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
if(data.supply_onset === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supply_onset"},message:"must have required property '"+"supply_onset"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.supply_detected_at === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supply_detected_at"},message:"must have required property '"+"supply_detected_at"+"'"};
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
if(data.price_detected_at === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "price_detected_at"},message:"must have required property '"+"price_detected_at"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.pairing_deadline_on === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pairing_deadline_on"},message:"must have required property '"+"pairing_deadline_on"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.timing_relationship === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "timing_relationship"},message:"must have required property '"+"timing_relationship"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.supply_contraction_ratio === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supply_contraction_ratio"},message:"must have required property '"+"supply_contraction_ratio"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.supply_measurement_confidence === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supply_measurement_confidence"},message:"must have required property '"+"supply_measurement_confidence"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.confidence_is_probability === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "confidence_is_probability"},message:"must have required property '"+"confidence_is_probability"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.bid_role === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "bid_role"},message:"must have required property '"+"bid_role"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.coverage === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "coverage"},message:"must have required property '"+"coverage"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.retrospective_peak === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "retrospective_peak"},message:"must have required property '"+"retrospective_peak"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.retrospective_ended_on === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "retrospective_ended_on"},message:"must have required property '"+"retrospective_ended_on"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema882.properties, key0))){
const err19 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.stage_token !== undefined){
let data0 = data.stage_token;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err20 = {instancePath:instancePath+"/stage_token",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err21 = {instancePath:instancePath+"/stage_token",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.catalog_snapshot_id !== undefined){
let data1 = data.catalog_snapshot_id;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err22 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err23 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.catalog !== undefined){
if(!(validate510(data.catalog, {instancePath:instancePath+"/catalog",parentData:data,parentDataProperty:"catalog",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate510.errors : vErrors.concat(validate510.errors);
errors = vErrors.length;
}
}
if(data.stage !== undefined){
let data3 = data.stage;
if(!(((data3 === "SUPPLY_PRESSURE") || (data3 === "PRICE_RESPONSE_ONLY")) || (data3 === "PAIRED_RESPONSE"))){
const err24 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/enum",keyword:"enum",params:{allowedValues: schema882.properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.first_leg !== undefined){
let data4 = data.first_leg;
if(!((data4 === "SUPPLY") || (data4 === "PRICE"))){
const err25 = {instancePath:instancePath+"/first_leg",schemaPath:"#/properties/first_leg/enum",keyword:"enum",params:{allowedValues: schema882.properties.first_leg.enum},message:"must be equal to one of the allowed values"};
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
let data5 = data.as_of;
if(typeof data5 === "string"){
if(!pattern319.test(data5)){
const err26 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(!(formats0.validate(data5))){
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
if(data.supply_onset !== undefined){
let data6 = data.supply_onset;
const _errs15 = errors;
let valid4 = false;
let passing0 = null;
const _errs16 = errors;
if(typeof data6 === "string"){
if(!(formats40.validate(data6))){
const err29 = {instancePath:instancePath+"/supply_onset",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err30 = {instancePath:instancePath+"/supply_onset",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
var _valid0 = _errs16 === errors;
if(_valid0){
valid4 = true;
passing0 = 0;
}
const _errs19 = errors;
if(data6 !== null){
const err31 = {instancePath:instancePath+"/supply_onset",schemaPath:"#/properties/supply_onset/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
var _valid0 = _errs19 === errors;
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
const err32 = {instancePath:instancePath+"/supply_onset",schemaPath:"#/properties/supply_onset/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
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
if(data.supply_detected_at !== undefined){
let data7 = data.supply_detected_at;
const _errs22 = errors;
let valid6 = false;
let passing1 = null;
const _errs23 = errors;
if(typeof data7 === "string"){
if(!pattern319.test(data7)){
const err33 = {instancePath:instancePath+"/supply_detected_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(!(formats0.validate(data7))){
const err34 = {instancePath:instancePath+"/supply_detected_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err35 = {instancePath:instancePath+"/supply_detected_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
var _valid1 = _errs23 === errors;
if(_valid1){
valid6 = true;
passing1 = 0;
}
const _errs26 = errors;
if(data7 !== null){
const err36 = {instancePath:instancePath+"/supply_detected_at",schemaPath:"#/properties/supply_detected_at/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
var _valid1 = _errs26 === errors;
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
const err37 = {instancePath:instancePath+"/supply_detected_at",schemaPath:"#/properties/supply_detected_at/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
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
if(data.price_onset !== undefined){
let data8 = data.price_onset;
const _errs29 = errors;
let valid8 = false;
let passing2 = null;
const _errs30 = errors;
if(typeof data8 === "string"){
if(!(formats40.validate(data8))){
const err38 = {instancePath:instancePath+"/price_onset",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err39 = {instancePath:instancePath+"/price_onset",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
var _valid2 = _errs30 === errors;
if(_valid2){
valid8 = true;
passing2 = 0;
}
const _errs33 = errors;
if(data8 !== null){
const err40 = {instancePath:instancePath+"/price_onset",schemaPath:"#/properties/price_onset/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
var _valid2 = _errs33 === errors;
if(_valid2 && valid8){
valid8 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid8 = true;
passing2 = 1;
}
}
if(!valid8){
const err41 = {instancePath:instancePath+"/price_onset",schemaPath:"#/properties/price_onset/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
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
if(data.price_detected_at !== undefined){
let data9 = data.price_detected_at;
const _errs36 = errors;
let valid10 = false;
let passing3 = null;
const _errs37 = errors;
if(typeof data9 === "string"){
if(!pattern319.test(data9)){
const err42 = {instancePath:instancePath+"/price_detected_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(!(formats0.validate(data9))){
const err43 = {instancePath:instancePath+"/price_detected_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err44 = {instancePath:instancePath+"/price_detected_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
var _valid3 = _errs37 === errors;
if(_valid3){
valid10 = true;
passing3 = 0;
}
const _errs40 = errors;
if(data9 !== null){
const err45 = {instancePath:instancePath+"/price_detected_at",schemaPath:"#/properties/price_detected_at/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
var _valid3 = _errs40 === errors;
if(_valid3 && valid10){
valid10 = false;
passing3 = [passing3, 1];
}
else {
if(_valid3){
valid10 = true;
passing3 = 1;
}
}
if(!valid10){
const err46 = {instancePath:instancePath+"/price_detected_at",schemaPath:"#/properties/price_detected_at/oneOf",keyword:"oneOf",params:{passingSchemas: passing3},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
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
if(data.pairing_deadline_on !== undefined){
let data10 = data.pairing_deadline_on;
if(typeof data10 === "string"){
if(!(formats40.validate(data10))){
const err47 = {instancePath:instancePath+"/pairing_deadline_on",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err48 = {instancePath:instancePath+"/pairing_deadline_on",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data.timing_relationship !== undefined){
let data11 = data.timing_relationship;
const _errs46 = errors;
let valid13 = false;
let passing4 = null;
const _errs47 = errors;
if(!(((data11 === "SUPPLY_LEADS") || (data11 === "PRICE_LEADS")) || (data11 === "CONCURRENT_DAILY"))){
const err49 = {instancePath:instancePath+"/timing_relationship",schemaPath:"#/properties/timing_relationship/oneOf/0/enum",keyword:"enum",params:{allowedValues: schema882.properties.timing_relationship.oneOf[0].enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
var _valid4 = _errs47 === errors;
if(_valid4){
valid13 = true;
passing4 = 0;
}
const _errs48 = errors;
if(data11 !== null){
const err50 = {instancePath:instancePath+"/timing_relationship",schemaPath:"#/properties/timing_relationship/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
var _valid4 = _errs48 === errors;
if(_valid4 && valid13){
valid13 = false;
passing4 = [passing4, 1];
}
else {
if(_valid4){
valid13 = true;
passing4 = 1;
}
}
if(!valid13){
const err51 = {instancePath:instancePath+"/timing_relationship",schemaPath:"#/properties/timing_relationship/oneOf",keyword:"oneOf",params:{passingSchemas: passing4},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
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
if(data.supply_contraction_ratio !== undefined){
let data12 = data.supply_contraction_ratio;
const _errs51 = errors;
let valid14 = false;
let passing5 = null;
const _errs52 = errors;
if(typeof data12 === "string"){
if(!pattern6.test(data12)){
const err52 = {instancePath:instancePath+"/supply_contraction_ratio",schemaPath:"#/properties/supply_contraction_ratio/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^(0(\\.[0-9]+)?|1(\\.0+)?)$"},message:"must match pattern \""+"^(0(\\.[0-9]+)?|1(\\.0+)?)$"+"\""};
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
const err53 = {instancePath:instancePath+"/supply_contraction_ratio",schemaPath:"#/properties/supply_contraction_ratio/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
var _valid5 = _errs52 === errors;
if(_valid5){
valid14 = true;
passing5 = 0;
}
const _errs54 = errors;
if(data12 !== null){
const err54 = {instancePath:instancePath+"/supply_contraction_ratio",schemaPath:"#/properties/supply_contraction_ratio/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
var _valid5 = _errs54 === errors;
if(_valid5 && valid14){
valid14 = false;
passing5 = [passing5, 1];
}
else {
if(_valid5){
valid14 = true;
passing5 = 1;
}
}
if(!valid14){
const err55 = {instancePath:instancePath+"/supply_contraction_ratio",schemaPath:"#/properties/supply_contraction_ratio/oneOf",keyword:"oneOf",params:{passingSchemas: passing5},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
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
if(data.supply_measurement_confidence !== undefined){
let data13 = data.supply_measurement_confidence;
if(!((data13 === "STANDARD") || (data13 === "LOW_BASELINE_DEPTH"))){
const err56 = {instancePath:instancePath+"/supply_measurement_confidence",schemaPath:"#/properties/supply_measurement_confidence/enum",keyword:"enum",params:{allowedValues: schema882.properties.supply_measurement_confidence.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data.confidence_is_probability !== undefined){
if(false !== data.confidence_is_probability){
const err57 = {instancePath:instancePath+"/confidence_is_probability",schemaPath:"#/properties/confidence_is_probability/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data.bid_role !== undefined){
if("QUOTE_QUALITY_CONTEXT_ONLY" !== data.bid_role){
const err58 = {instancePath:instancePath+"/bid_role",schemaPath:"#/properties/bid_role/const",keyword:"const",params:{allowedValue: "QUOTE_QUALITY_CONTEXT_ONLY"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data.coverage !== undefined){
let data16 = data.coverage;
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.expected_slots === undefined){
const err59 = {instancePath:instancePath+"/coverage",schemaPath:"#/$defs/coverage/required",keyword:"required",params:{missingProperty: "expected_slots"},message:"must have required property '"+"expected_slots"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data16.qualified_paired_slots === undefined){
const err60 = {instancePath:instancePath+"/coverage",schemaPath:"#/$defs/coverage/required",keyword:"required",params:{missingProperty: "qualified_paired_slots"},message:"must have required property '"+"qualified_paired_slots"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data16.longest_missing_run === undefined){
const err61 = {instancePath:instancePath+"/coverage",schemaPath:"#/$defs/coverage/required",keyword:"required",params:{missingProperty: "longest_missing_run"},message:"must have required property '"+"longest_missing_run"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data16.quality === undefined){
const err62 = {instancePath:instancePath+"/coverage",schemaPath:"#/$defs/coverage/required",keyword:"required",params:{missingProperty: "quality"},message:"must have required property '"+"quality"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
for(const key1 in data16){
if(!((((key1 === "expected_slots") || (key1 === "qualified_paired_slots")) || (key1 === "longest_missing_run")) || (key1 === "quality"))){
const err63 = {instancePath:instancePath+"/coverage",schemaPath:"#/$defs/coverage/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data16.expected_slots !== undefined){
if(288 !== data16.expected_slots){
const err64 = {instancePath:instancePath+"/coverage/expected_slots",schemaPath:"#/$defs/coverage/properties/expected_slots/const",keyword:"const",params:{allowedValue: 288},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data16.qualified_paired_slots !== undefined){
let data18 = data16.qualified_paired_slots;
if(!(((typeof data18 == "number") && (!(data18 % 1) && !isNaN(data18))) && (isFinite(data18)))){
const err65 = {instancePath:instancePath+"/coverage/qualified_paired_slots",schemaPath:"#/$defs/coverage/properties/qualified_paired_slots/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if((typeof data18 == "number") && (isFinite(data18))){
if(data18 > 288 || isNaN(data18)){
const err66 = {instancePath:instancePath+"/coverage/qualified_paired_slots",schemaPath:"#/$defs/coverage/properties/qualified_paired_slots/maximum",keyword:"maximum",params:{comparison: "<=", limit: 288},message:"must be <= 288"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(data18 < 0 || isNaN(data18)){
const err67 = {instancePath:instancePath+"/coverage/qualified_paired_slots",schemaPath:"#/$defs/coverage/properties/qualified_paired_slots/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
}
if(data16.longest_missing_run !== undefined){
let data19 = data16.longest_missing_run;
if(!(((typeof data19 == "number") && (!(data19 % 1) && !isNaN(data19))) && (isFinite(data19)))){
const err68 = {instancePath:instancePath+"/coverage/longest_missing_run",schemaPath:"#/$defs/coverage/properties/longest_missing_run/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if((typeof data19 == "number") && (isFinite(data19))){
if(data19 > 288 || isNaN(data19)){
const err69 = {instancePath:instancePath+"/coverage/longest_missing_run",schemaPath:"#/$defs/coverage/properties/longest_missing_run/maximum",keyword:"maximum",params:{comparison: "<=", limit: 288},message:"must be <= 288"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data19 < 0 || isNaN(data19)){
const err70 = {instancePath:instancePath+"/coverage/longest_missing_run",schemaPath:"#/$defs/coverage/properties/longest_missing_run/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data16.quality !== undefined){
let data20 = data16.quality;
if(!(((data20 === "FULL") || (data20 === "HIGH_COVERAGE")) || (data20 === "PARTIAL_USABLE"))){
const err71 = {instancePath:instancePath+"/coverage/quality",schemaPath:"#/$defs/coverage/properties/quality/enum",keyword:"enum",params:{allowedValues: schema897.properties.quality.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
}
else {
const err72 = {instancePath:instancePath+"/coverage",schemaPath:"#/$defs/coverage/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data.retrospective_peak !== undefined){
if(data.retrospective_peak !== null){
const err73 = {instancePath:instancePath+"/retrospective_peak",schemaPath:"#/properties/retrospective_peak/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data.retrospective_ended_on !== undefined){
if(data.retrospective_ended_on !== null){
const err74 = {instancePath:instancePath+"/retrospective_ended_on",schemaPath:"#/properties/retrospective_ended_on/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
else {
const err75 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
validate509.errors = vErrors;
return errors === 0;
}
validate509.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const pattern73 = new RegExp("^[A-Za-z0-9_-]+$", "u");

function validate500(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate500.evaluated;
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
if(data.operation === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation"},message:"must have required property '"+"operation"+"'"};
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
if(data.snapshot === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
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
if(data.freshness === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "freshness"},message:"must have required property '"+"freshness"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.empty_reason === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "empty_reason"},message:"must have required property '"+"empty_reason"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.sort === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sort"},message:"must have required property '"+"sort"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.page_size === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.members === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.next_cursor === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema860.properties, key0))){
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
if(data.contract_name !== undefined){
if("single-item-current-public-api" !== data.contract_name){
const err14 = {instancePath:instancePath+"/contract_name",schemaPath:"#/properties/contract_name/const",keyword:"const",params:{allowedValue: "single-item-current-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.contract_version !== undefined){
if("1" !== data.contract_version){
const err15 = {instancePath:instancePath+"/contract_version",schemaPath:"#/properties/contract_version/const",keyword:"const",params:{allowedValue: "1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.response_kind !== undefined){
let data2 = data.response_kind;
if(!((data2 === "RESULT") || (data2 === "EMPTY"))){
const err16 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/enum",keyword:"enum",params:{allowedValues: schema860.properties.response_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.operation !== undefined){
let data3 = data.operation;
if(!((data3 === "LIST") || (data3 === "DETAIL"))){
const err17 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/enum",keyword:"enum",params:{allowedValues: schema860.properties.operation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.publication !== undefined){
if(!(validate501(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate501.errors : vErrors.concat(validate501.errors);
errors = vErrors.length;
}
}
if(data.snapshot !== undefined){
if(!(validate503(data.snapshot, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate503.errors : vErrors.concat(validate503.errors);
errors = vErrors.length;
}
}
if(data.release !== undefined){
if(!(validate505(data.release, {instancePath:instancePath+"/release",parentData:data,parentDataProperty:"release",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate505.errors : vErrors.concat(validate505.errors);
errors = vErrors.length;
}
}
if(data.freshness !== undefined){
if(!(validate507(data.freshness, {instancePath:instancePath+"/freshness",parentData:data,parentDataProperty:"freshness",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate507.errors : vErrors.concat(validate507.errors);
errors = vErrors.length;
}
}
if(data.empty_reason !== undefined){
let data8 = data.empty_reason;
if(!((data8 === null) || (data8 === "NO_CURRENT_STAGE"))){
const err18 = {instancePath:instancePath+"/empty_reason",schemaPath:"#/properties/empty_reason/enum",keyword:"enum",params:{allowedValues: schema860.properties.empty_reason.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.sort !== undefined){
let data9 = data.sort;
if(!(((data9 === "RELIABLE_SIGNAL_DESC") || (data9 === "DETECTED_DESC")) || (data9 === "SUPPLY_CONTRACTION_DESC"))){
const err19 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/enum",keyword:"enum",params:{allowedValues: schema860.properties.sort.enum},message:"must be equal to one of the allowed values"};
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
let data10 = data.page_size;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err20 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 > 100 || isNaN(data10)){
const err21 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data10 < 1 || isNaN(data10)){
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
if(data.members !== undefined){
let data11 = data.members;
if(Array.isArray(data11)){
if(data11.length > 100){
const err23 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/maxItems",keyword:"maxItems",params:{limit: 100},message:"must NOT have more than 100 items"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data11.length < 0){
const err24 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
const len0 = data11.length;
for(let i0=0; i0<len0; i0++){
if(!(validate509(data11[i0], {instancePath:instancePath+"/members/" + i0,parentData:data11,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate509.errors : vErrors.concat(validate509.errors);
errors = vErrors.length;
}
}
}
else {
const err25 = {instancePath:instancePath+"/members",schemaPath:"#/properties/members/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data13 = data.next_cursor;
const _errs18 = errors;
let valid3 = false;
let passing0 = null;
const _errs19 = errors;
if(typeof data13 === "string"){
if(func2(data13) > 4096){
const err26 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(func2(data13) < 1){
const err27 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(!pattern73.test(data13)){
const err28 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$"+"\""};
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
const err29 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
var _valid0 = _errs19 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs21 = errors;
if(data13 !== null){
const err30 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
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
const err31 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
else {
errors = _errs18;
if(vErrors !== null){
if(_errs18){
vErrors.length = _errs18;
}
else {
vErrors = null;
}
}
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
validate500.errors = vErrors;
return errors === 0;
}
validate500.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate499(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:single-item-current-public-api:v1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate499.evaluated;
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
if(!(validate500(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate500.errors : vErrors.concat(validate500.errors);
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
if("single-item-current-public-api" !== data.contract_name){
const err5 = {instancePath:instancePath+"/contract_name",schemaPath:"#/$defs/error/properties/contract_name/const",keyword:"const",params:{allowedValue: "single-item-current-public-api"},message:"must be equal to constant"};
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
const err11 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/properties/error/properties/code/enum",keyword:"enum",params:{allowedValues: schema898.properties.error.properties.code.enum},message:"must be equal to one of the allowed values"};
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
validate499.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate499.evaluated = {"dynamicProps":true,"dynamicItems":false};
