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
export const validateQualityEnvelope = validate45;
const schema97 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:research-quality-envelope:v1","title":"CS2 provider-neutral research quality envelope v1 candidate","type":"object","additionalProperties":false,"required":["snapshot_id","contract_code","contract_version","envelope_kind","identity","as_of","available_at","policy_version","input_quality_snapshot_id","expected_cell_count","observed_cell_count","fresh_cell_count","coverage_ratio","fresh_coverage_ratio","missing_cell_count","stale_cell_count","future_fact_count","source_summaries","conflicts","query_observations"],"properties":{"snapshot_id":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/sha256"},"contract_code":{"const":"research-quality-envelope"},"contract_version":{"const":"v1"},"envelope_kind":{"const":"QUALITY"},"identity":{"allOf":[{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/identity"},{"type":"object","properties":{"scope_kind":{"const":"ITEM"}}}]},"as_of":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"available_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"policy_version":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"input_quality_snapshot_id":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"expected_cell_count":{"type":"integer","minimum":0},"observed_cell_count":{"type":"integer","minimum":0},"fresh_cell_count":{"type":"integer","minimum":0},"coverage_ratio":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/ratio_decimal_text"},"fresh_coverage_ratio":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/ratio_decimal_text"},"missing_cell_count":{"type":"integer","minimum":0},"stale_cell_count":{"type":"integer","minimum":0},"future_fact_count":{"type":"integer","minimum":0},"source_summaries":{"type":"array","items":{"$ref":"#/$defs/source_summary"}},"conflicts":{"type":"array","items":{"$ref":"#/$defs/conflict_summary"}},"query_observations":{"type":"array","items":{"$ref":"#/$defs/query_observation"}}},"$defs":{"nonnegative_decimal_text":{"type":"string","pattern":"^(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$"},"source_summary":{"type":"object","additionalProperties":false,"required":["source_ref","expected_feature_count","observed_feature_count","fresh_feature_count","missing_feature_count","stale_feature_count"],"properties":{"source_ref":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"expected_feature_count":{"type":"integer","minimum":0},"observed_feature_count":{"type":"integer","minimum":0},"fresh_feature_count":{"type":"integer","minimum":0},"missing_feature_count":{"type":"integer","minimum":0},"stale_feature_count":{"type":"integer","minimum":0}}},"conflict_summary":{"type":"object","additionalProperties":false,"required":["feature_key","reason_code","participating_source_refs","source_fact_count","relative_dispersion"],"properties":{"feature_key":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"reason_code":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"participating_source_refs":{"type":"array","uniqueItems":true,"items":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"}},"source_fact_count":{"type":"integer","minimum":1},"relative_dispersion":{"oneOf":[{"$ref":"#/$defs/nonnegative_decimal_text"},{"type":"null"}]}}},"query_observation":{"type":"object","additionalProperties":false,"required":["observation_id","source_ref","query_kind","sample_state","capability_state","returned_member_count","observed_at","available_at"],"properties":{"observation_id":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"source_ref":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/nonblank_text"},"query_kind":{"enum":["BASE_QUOTE","LISTING_PAGE","STYLE_LISTING","STYLE_BID","MARKET_SNAPSHOT"]},"sample_state":{"enum":["POSITIVE_SAMPLE","ZERO_CURRENT_SAMPLE"]},"capability_state":{"enum":["CONFIRMED","UNKNOWN","NOT_APPLICABLE"]},"returned_member_count":{"type":"integer","minimum":0},"observed_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"},"available_at":{"$ref":"urn:cs2-research:research-result-envelope:v1#/$defs/timestamp"}}}}};
const schema38 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const schema63 = {"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"};
const schema37 = {"type":"string","minLength":1,"pattern":"^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$"};
const schema40 = {"type":"string","pattern":"^(0(\\.[0-9]+)?|1(\\.0+)?)$"};
const func9 = Object.prototype.hasOwnProperty;
const func2 = __wireUcs2Length;
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");
const pattern19 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$", "u");
const pattern4 = new RegExp("^(?=[^\\u0000\\ud800-\\udfff]*[^\\u0000\\u0009-\\u000d\\u0020\\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ud800-\\udfff])[^\\u0000\\ud800-\\udfff]+$", "u");
const pattern6 = new RegExp("^(0(\\.[0-9]+)?|1(\\.0+)?)$", "u");
const schema58 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","scope_kind","display_name","identity_available_at","catalog_version","analysis_unit_kind","edition_kind","parent_analysis_unit_id"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/nonblank_text"},"scope_kind":{"$ref":"#/$defs/scope_kind"},"display_name":{"$ref":"#/$defs/nonblank_text"},"identity_available_at":{"$ref":"#/$defs/timestamp"},"catalog_version":{"$ref":"#/$defs/nonblank_text"},"analysis_unit_kind":{"type":["string","null"],"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT",null]},"edition_kind":{"type":["string","null"],"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN",null]},"parent_analysis_unit_id":{"oneOf":[{"$ref":"#/$defs/nonblank_text"},{"type":"null"}]}},"allOf":[{"if":{"properties":{"scope_kind":{"const":"ITEM"}},"required":["scope_kind"]},"then":{"properties":{"analysis_unit_kind":{"enum":["BASE_MHN","STYLE_VARIANT","PATTERN_VARIANT"]},"edition_kind":{"enum":["STANDARD","STATTRAK","SOUVENIR","UNKNOWN"]}}},"else":{"properties":{"analysis_unit_kind":{"type":"null"},"edition_kind":{"type":"null"},"parent_analysis_unit_id":{"type":"null"}}}},{"if":{"properties":{"scope_kind":{"const":"ITEM"},"analysis_unit_kind":{"const":"BASE_MHN"}},"required":["scope_kind","analysis_unit_kind"]},"then":{"properties":{"parent_analysis_unit_id":{"type":"null"}}}},{"if":{"properties":{"scope_kind":{"const":"ITEM"},"analysis_unit_kind":{"enum":["STYLE_VARIANT","PATTERN_VARIANT"]}},"required":["scope_kind","analysis_unit_kind"]},"then":{"properties":{"parent_analysis_unit_id":{"$ref":"#/$defs/nonblank_text"}}}}]};
const schema61 = {"enum":["MARKET","SECTOR","ITEM"]};
const formats0 = __wireFullFormats["date-time"];

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
const func0 = __wireEqual;
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
