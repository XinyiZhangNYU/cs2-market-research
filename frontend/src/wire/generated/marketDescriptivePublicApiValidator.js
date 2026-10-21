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
export const validateMarketDescriptivePublicApiResponse = validate346;
const schema539 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2:market-descriptive-public-api:1","title":"Bounded descriptive MARKET/SECTOR public page facts","oneOf":[{"$ref":"#/$defs/success"},{"$ref":"#/$defs/error"}],"$defs":{"hash":{"type":"string","pattern":"^[0-9a-f]{64}$"},"nullableHash":{"oneOf":[{"$ref":"#/$defs/hash"},{"type":"null"}]},"clock":{"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$","maxLength":27},"day":{"type":"string","format":"date","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},"decimal":{"type":"string","maxLength":128,"pattern":"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"},"nullableDecimal":{"oneOf":[{"$ref":"#/$defs/decimal"},{"type":"null"}]},"count":{"type":"integer","minimum":0,"maximum":1000000},"scopeId":{"type":"string","minLength":1,"maxLength":64,"pattern":"^[A-Z][A-Z0-9_]*(:[A-Z0-9_]+)?$"},"scope":{"type":"object","additionalProperties":false,"required":["scope_token","scope_id","scope_kind","parent_scope_id","ancestor_scope_ids","labels","fixed_member_count","paired_member_count","day_price_member_count","paired_coverage_ratio","day_price_coverage_ratio","coverage_grade","headline_eligible","raw_return_ratio","suppressed_return_ratio","return_selected_for_display","return_method","missing_endpoint_count","source_set_break_count","single_source_pair_count","unmapped_member_count","other_unavailable_count","member_price_sum_cny","member_price_mean_cny","price_basis"],"properties":{"scope_token":{"$ref":"#/$defs/hash"},"scope_id":{"$ref":"#/$defs/scopeId"},"scope_kind":{"enum":["MARKET","SECTOR","SUBSECTOR"]},"parent_scope_id":{"oneOf":[{"$ref":"#/$defs/scopeId"},{"type":"null"}]},"ancestor_scope_ids":{"type":"array","maxItems":8,"uniqueItems":true,"items":{"$ref":"#/$defs/scopeId"}},"labels":{"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"type":"string","minLength":1,"maxLength":128},"zh_cn":{"type":"string","minLength":1,"maxLength":128}}},"fixed_member_count":{"type":"integer","minimum":1,"maximum":1000000},"paired_member_count":{"$ref":"#/$defs/count"},"day_price_member_count":{"$ref":"#/$defs/count"},"paired_coverage_ratio":{"$ref":"#/$defs/decimal"},"day_price_coverage_ratio":{"$ref":"#/$defs/decimal"},"coverage_grade":{"enum":["HIGH","PARTIAL","DETAIL_ONLY"]},"headline_eligible":{"type":"boolean"},"raw_return_ratio":{"$ref":"#/$defs/nullableDecimal"},"suppressed_return_ratio":{"$ref":"#/$defs/nullableDecimal"},"return_selected_for_display":{"$ref":"#/$defs/nullableDecimal"},"return_method":{"enum":["RAW_EQUAL_MEMBER_RETURN","SYMMETRIC_WINSOR_1_PERCENT"]},"missing_endpoint_count":{"$ref":"#/$defs/count"},"source_set_break_count":{"$ref":"#/$defs/count"},"single_source_pair_count":{"$ref":"#/$defs/count"},"unmapped_member_count":{"$ref":"#/$defs/count"},"other_unavailable_count":{"$ref":"#/$defs/count"},"member_price_sum_cny":{"$ref":"#/$defs/nullableDecimal"},"member_price_mean_cny":{"$ref":"#/$defs/nullableDecimal"},"price_basis":{"const":"ONE_SELECTED_EOD_PRICE_PER_AVAILABLE_MEMBER"}}},"dayPair":{"type":"object","additionalProperties":false,"required":["from_date","to_date","is_adjacent_utc_day","eod_window"],"properties":{"from_date":{"$ref":"#/$defs/day"},"to_date":{"$ref":"#/$defs/day"},"is_adjacent_utc_day":{"const":true},"eod_window":{"type":"object","additionalProperties":false,"required":["expected_slots","minimum_qualified_slots","maximum_latest_slot_age_minutes"],"properties":{"expected_slots":{"const":12},"minimum_qualified_slots":{"const":9},"maximum_latest_slot_age_minutes":{"const":15}}}}},"publication":{"type":"object","additionalProperties":false,"required":["publication_id","parent_publication_id","manifest_sha256","rights_revision","published_at","withdrawn_at"],"properties":{"publication_id":{"$ref":"#/$defs/hash"},"parent_publication_id":{"$ref":"#/$defs/nullableHash"},"manifest_sha256":{"$ref":"#/$defs/hash"},"rights_revision":{"$ref":"#/$defs/hash"},"published_at":{"$ref":"#/$defs/clock"},"withdrawn_at":{"oneOf":[{"$ref":"#/$defs/clock"},{"type":"null"}]},"clock_disclosure":{"oneOf":[{"$ref":"#/$defs/clockDisclosure"},{"type":"null"}]}}},"clockDisclosure":{"type":"object","additionalProperties":false,"required":["status","published_at_kind","actual_public_available_at","known_not_before_at","recorded_at","reason"],"properties":{"status":{"const":"PREPARED_CLOCK_NOT_ACTUAL"},"published_at_kind":{"const":"PREPARED_VALUE"},"actual_public_available_at":{"type":"null"},"known_not_before_at":{"$ref":"#/$defs/clock"},"recorded_at":{"$ref":"#/$defs/clock"},"reason":{"const":"INITIAL_ACTIVE_APPLY_CLOCK_NOT_OBSERVED"}}},"snapshot":{"type":"object","additionalProperties":false,"required":["catalog_snapshot_id","membership_version","input_sha256","start_date","end_date","source_export_as_of","imported_at"],"properties":{"catalog_snapshot_id":{"type":"null"},"membership_version":{"type":"string","pattern":"^[a-zA-Z0-9_-]{1,128}$"},"input_sha256":{"$ref":"#/$defs/hash"},"start_date":{"$ref":"#/$defs/day"},"end_date":{"$ref":"#/$defs/day"},"source_export_as_of":{"$ref":"#/$defs/clock"},"imported_at":{"$ref":"#/$defs/clock"}}},"freshness":{"type":"object","additionalProperties":false,"required":["evaluated_at","expected_latest_complete_date","lag_complete_days","status","headline_data_date"],"properties":{"evaluated_at":{"$ref":"#/$defs/clock"},"expected_latest_complete_date":{"$ref":"#/$defs/day"},"lag_complete_days":{"type":"integer","minimum":0},"status":{"enum":["CURRENT","HISTORICAL_VALUE_DISPLAY_ONLY","NO_RECENT_STATISTIC"]},"headline_data_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]}}},"quality":{"type":"object","additionalProperties":false,"required":["date","status","scope"],"properties":{"date":{"$ref":"#/$defs/day"},"status":{"enum":["AVAILABLE","NO_PUBLISHED_DAY","UNAVAILABLE","BASELINE_ONLY"]},"scope":{"oneOf":[{"$ref":"#/$defs/scope"},{"type":"null"}]}}},"headline":{"type":"object","additionalProperties":false,"required":["publication_id","day_pair","scope"],"properties":{"publication_id":{"$ref":"#/$defs/hash"},"day_pair":{"$ref":"#/$defs/dayPair"},"scope":{"$ref":"#/$defs/scope"}}},"history":{"type":"object","additionalProperties":false,"required":["publication_id","day_pair","scopes","connect_to_previous"],"properties":{"publication_id":{"$ref":"#/$defs/hash"},"day_pair":{"$ref":"#/$defs/dayPair"},"scopes":{"type":"array","minItems":1,"maxItems":128,"items":{"$ref":"#/$defs/scope"}},"connect_to_previous":{"type":"boolean"}}},"success":{"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","operation","product_kind","method","publication","snapshot","freshness","day_pair","headline","current_day_quality","scopes","history"],"properties":{"contract_name":{"const":"market-descriptive-public-api"},"contract_version":{"const":"1"},"response_kind":{"enum":["RESULT","EMPTY"]},"operation":{"enum":["OVERVIEW","SCOPE"]},"product_kind":{"const":"MARKET_DESCRIPTIVE"},"method":{"const":"EQUAL_WEIGHTED_MEMBER_RETURN"},"publication":{"$ref":"#/$defs/publication"},"snapshot":{"$ref":"#/$defs/snapshot"},"freshness":{"$ref":"#/$defs/freshness"},"day_pair":{"oneOf":[{"$ref":"#/$defs/dayPair"},{"type":"null"}]},"headline":{"oneOf":[{"$ref":"#/$defs/headline"},{"type":"null"}]},"current_day_quality":{"$ref":"#/$defs/quality"},"scopes":{"type":"array","maxItems":128,"items":{"$ref":"#/$defs/scope"}},"history":{"type":"array","maxItems":3,"items":{"$ref":"#/$defs/history"}}},"allOf":[{"if":{"properties":{"response_kind":{"const":"EMPTY"}}},"then":{"properties":{"scopes":{"maxItems":0},"day_pair":{"type":"null"}}}},{"if":{"properties":{"response_kind":{"const":"RESULT"}}},"then":{"properties":{"scopes":{"minItems":1},"day_pair":{"$ref":"#/$defs/dayPair"}}}}]},"error":{"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","error"],"properties":{"contract_name":{"const":"market-descriptive-public-api"},"contract_version":{"const":"1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_REQUEST","NOT_PUBLISHED","NOT_FOUND","WITHDRAWN","STALE_EXPIRED","CORRUPT_PUBLICATION","TEMPORARILY_UNAVAILABLE"]},"retryable":{"type":"boolean"}}}}}}};
const schema587 = {"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","error"],"properties":{"contract_name":{"const":"market-descriptive-public-api"},"contract_version":{"const":"1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","retryable"],"properties":{"code":{"enum":["INVALID_REQUEST","NOT_PUBLISHED","NOT_FOUND","WITHDRAWN","STALE_EXPIRED","CORRUPT_PUBLICATION","TEMPORARILY_UNAVAILABLE"]},"retryable":{"type":"boolean"}}}}};
const schema540 = {"type":"object","additionalProperties":false,"required":["contract_name","contract_version","response_kind","operation","product_kind","method","publication","snapshot","freshness","day_pair","headline","current_day_quality","scopes","history"],"properties":{"contract_name":{"const":"market-descriptive-public-api"},"contract_version":{"const":"1"},"response_kind":{"enum":["RESULT","EMPTY"]},"operation":{"enum":["OVERVIEW","SCOPE"]},"product_kind":{"const":"MARKET_DESCRIPTIVE"},"method":{"const":"EQUAL_WEIGHTED_MEMBER_RETURN"},"publication":{"$ref":"#/$defs/publication"},"snapshot":{"$ref":"#/$defs/snapshot"},"freshness":{"$ref":"#/$defs/freshness"},"day_pair":{"oneOf":[{"$ref":"#/$defs/dayPair"},{"type":"null"}]},"headline":{"oneOf":[{"$ref":"#/$defs/headline"},{"type":"null"}]},"current_day_quality":{"$ref":"#/$defs/quality"},"scopes":{"type":"array","maxItems":128,"items":{"$ref":"#/$defs/scope"}},"history":{"type":"array","maxItems":3,"items":{"$ref":"#/$defs/history"}}},"allOf":[{"if":{"properties":{"response_kind":{"const":"EMPTY"}}},"then":{"properties":{"scopes":{"maxItems":0},"day_pair":{"type":"null"}}}},{"if":{"properties":{"response_kind":{"const":"RESULT"}}},"then":{"properties":{"scopes":{"minItems":1},"day_pair":{"$ref":"#/$defs/dayPair"}}}}]};
const schema541 = {"type":"object","additionalProperties":false,"required":["from_date","to_date","is_adjacent_utc_day","eod_window"],"properties":{"from_date":{"$ref":"#/$defs/day"},"to_date":{"$ref":"#/$defs/day"},"is_adjacent_utc_day":{"const":true},"eod_window":{"type":"object","additionalProperties":false,"required":["expected_slots","minimum_qualified_slots","maximum_latest_slot_age_minutes"],"properties":{"expected_slots":{"const":12},"minimum_qualified_slots":{"const":9},"maximum_latest_slot_age_minutes":{"const":15}}}}};
const schema542 = {"type":"string","format":"date","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"};
const formats40 = __wireFullFormats.date;
const pattern313 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$", "u");

function validate348(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate348.evaluated;
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
if(data.is_adjacent_utc_day === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "is_adjacent_utc_day"},message:"must have required property '"+"is_adjacent_utc_day"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.eod_window === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "eod_window"},message:"must have required property '"+"eod_window"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "from_date") || (key0 === "to_date")) || (key0 === "is_adjacent_utc_day")) || (key0 === "eod_window"))){
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
if(data.from_date !== undefined){
let data0 = data.from_date;
if(typeof data0 === "string"){
if(!pattern313.test(data0)){
const err5 = {instancePath:instancePath+"/from_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!(formats40.validate(data0))){
const err6 = {instancePath:instancePath+"/from_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err7 = {instancePath:instancePath+"/from_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.to_date !== undefined){
let data1 = data.to_date;
if(typeof data1 === "string"){
if(!pattern313.test(data1)){
const err8 = {instancePath:instancePath+"/to_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!(formats40.validate(data1))){
const err9 = {instancePath:instancePath+"/to_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err10 = {instancePath:instancePath+"/to_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.is_adjacent_utc_day !== undefined){
if(true !== data.is_adjacent_utc_day){
const err11 = {instancePath:instancePath+"/is_adjacent_utc_day",schemaPath:"#/properties/is_adjacent_utc_day/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.eod_window !== undefined){
let data3 = data.eod_window;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.expected_slots === undefined){
const err12 = {instancePath:instancePath+"/eod_window",schemaPath:"#/properties/eod_window/required",keyword:"required",params:{missingProperty: "expected_slots"},message:"must have required property '"+"expected_slots"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data3.minimum_qualified_slots === undefined){
const err13 = {instancePath:instancePath+"/eod_window",schemaPath:"#/properties/eod_window/required",keyword:"required",params:{missingProperty: "minimum_qualified_slots"},message:"must have required property '"+"minimum_qualified_slots"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data3.maximum_latest_slot_age_minutes === undefined){
const err14 = {instancePath:instancePath+"/eod_window",schemaPath:"#/properties/eod_window/required",keyword:"required",params:{missingProperty: "maximum_latest_slot_age_minutes"},message:"must have required property '"+"maximum_latest_slot_age_minutes"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data3){
if(!(((key1 === "expected_slots") || (key1 === "minimum_qualified_slots")) || (key1 === "maximum_latest_slot_age_minutes"))){
const err15 = {instancePath:instancePath+"/eod_window",schemaPath:"#/properties/eod_window/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data3.expected_slots !== undefined){
if(12 !== data3.expected_slots){
const err16 = {instancePath:instancePath+"/eod_window/expected_slots",schemaPath:"#/properties/eod_window/properties/expected_slots/const",keyword:"const",params:{allowedValue: 12},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data3.minimum_qualified_slots !== undefined){
if(9 !== data3.minimum_qualified_slots){
const err17 = {instancePath:instancePath+"/eod_window/minimum_qualified_slots",schemaPath:"#/properties/eod_window/properties/minimum_qualified_slots/const",keyword:"const",params:{allowedValue: 9},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data3.maximum_latest_slot_age_minutes !== undefined){
if(15 !== data3.maximum_latest_slot_age_minutes){
const err18 = {instancePath:instancePath+"/eod_window/maximum_latest_slot_age_minutes",schemaPath:"#/properties/eod_window/properties/maximum_latest_slot_age_minutes/const",keyword:"const",params:{allowedValue: 15},message:"must be equal to constant"};
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
const err19 = {instancePath:instancePath+"/eod_window",schemaPath:"#/properties/eod_window/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
validate348.errors = vErrors;
return errors === 0;
}
validate348.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema544 = {"type":"object","additionalProperties":false,"required":["publication_id","parent_publication_id","manifest_sha256","rights_revision","published_at","withdrawn_at"],"properties":{"publication_id":{"$ref":"#/$defs/hash"},"parent_publication_id":{"$ref":"#/$defs/nullableHash"},"manifest_sha256":{"$ref":"#/$defs/hash"},"rights_revision":{"$ref":"#/$defs/hash"},"published_at":{"$ref":"#/$defs/clock"},"withdrawn_at":{"oneOf":[{"$ref":"#/$defs/clock"},{"type":"null"}]},"clock_disclosure":{"oneOf":[{"$ref":"#/$defs/clockDisclosure"},{"type":"null"}]}}};
const schema545 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const schema550 = {"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$","maxLength":27};
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");
const pattern319 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$", "u");
const schema546 = {"oneOf":[{"$ref":"#/$defs/hash"},{"type":"null"}]};

function validate351(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate351.evaluated;
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
const err0 = {instancePath,schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err1 = {instancePath,schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate351.errors = vErrors;
return errors === 0;
}
validate351.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema552 = {"type":"object","additionalProperties":false,"required":["status","published_at_kind","actual_public_available_at","known_not_before_at","recorded_at","reason"],"properties":{"status":{"const":"PREPARED_CLOCK_NOT_ACTUAL"},"published_at_kind":{"const":"PREPARED_VALUE"},"actual_public_available_at":{"type":"null"},"known_not_before_at":{"$ref":"#/$defs/clock"},"recorded_at":{"$ref":"#/$defs/clock"},"reason":{"const":"INITIAL_ACTIVE_APPLY_CLOCK_NOT_OBSERVED"}}};
const formats0 = __wireFullFormats["date-time"];
const func2 = __wireUcs2Length;

function validate353(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate353.evaluated;
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
if(data.published_at_kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at_kind"},message:"must have required property '"+"published_at_kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.actual_public_available_at === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "actual_public_available_at"},message:"must have required property '"+"actual_public_available_at"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.known_not_before_at === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "known_not_before_at"},message:"must have required property '"+"known_not_before_at"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.recorded_at === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recorded_at"},message:"must have required property '"+"recorded_at"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.reason === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "status") || (key0 === "published_at_kind")) || (key0 === "actual_public_available_at")) || (key0 === "known_not_before_at")) || (key0 === "recorded_at")) || (key0 === "reason"))){
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
if("PREPARED_CLOCK_NOT_ACTUAL" !== data.status){
const err7 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "PREPARED_CLOCK_NOT_ACTUAL"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.published_at_kind !== undefined){
if("PREPARED_VALUE" !== data.published_at_kind){
const err8 = {instancePath:instancePath+"/published_at_kind",schemaPath:"#/properties/published_at_kind/const",keyword:"const",params:{allowedValue: "PREPARED_VALUE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.actual_public_available_at !== undefined){
if(data.actual_public_available_at !== null){
const err9 = {instancePath:instancePath+"/actual_public_available_at",schemaPath:"#/properties/actual_public_available_at/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.known_not_before_at !== undefined){
let data3 = data.known_not_before_at;
if(typeof data3 === "string"){
if(func2(data3) > 27){
const err10 = {instancePath:instancePath+"/known_not_before_at",schemaPath:"#/$defs/clock/maxLength",keyword:"maxLength",params:{limit: 27},message:"must NOT have more than 27 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern319.test(data3)){
const err11 = {instancePath:instancePath+"/known_not_before_at",schemaPath:"#/$defs/clock/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!(formats0.validate(data3))){
const err12 = {instancePath:instancePath+"/known_not_before_at",schemaPath:"#/$defs/clock/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err13 = {instancePath:instancePath+"/known_not_before_at",schemaPath:"#/$defs/clock/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.recorded_at !== undefined){
let data4 = data.recorded_at;
if(typeof data4 === "string"){
if(func2(data4) > 27){
const err14 = {instancePath:instancePath+"/recorded_at",schemaPath:"#/$defs/clock/maxLength",keyword:"maxLength",params:{limit: 27},message:"must NOT have more than 27 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern319.test(data4)){
const err15 = {instancePath:instancePath+"/recorded_at",schemaPath:"#/$defs/clock/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!(formats0.validate(data4))){
const err16 = {instancePath:instancePath+"/recorded_at",schemaPath:"#/$defs/clock/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err17 = {instancePath:instancePath+"/recorded_at",schemaPath:"#/$defs/clock/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.reason !== undefined){
if("INITIAL_ACTIVE_APPLY_CLOCK_NOT_OBSERVED" !== data.reason){
const err18 = {instancePath:instancePath+"/reason",schemaPath:"#/properties/reason/const",keyword:"const",params:{allowedValue: "INITIAL_ACTIVE_APPLY_CLOCK_NOT_OBSERVED"},message:"must be equal to constant"};
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
validate353.errors = vErrors;
return errors === 0;
}
validate353.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate350(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate350.evaluated;
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
if(!(((((((key0 === "publication_id") || (key0 === "parent_publication_id")) || (key0 === "manifest_sha256")) || (key0 === "rights_revision")) || (key0 === "published_at")) || (key0 === "withdrawn_at")) || (key0 === "clock_disclosure"))){
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
const err7 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(!(validate351(data.parent_publication_id, {instancePath:instancePath+"/parent_publication_id",parentData:data,parentDataProperty:"parent_publication_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate351.errors : vErrors.concat(validate351.errors);
errors = vErrors.length;
}
}
if(data.manifest_sha256 !== undefined){
let data2 = data.manifest_sha256;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err9 = {instancePath:instancePath+"/manifest_sha256",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err10 = {instancePath:instancePath+"/manifest_sha256",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.rights_revision !== undefined){
let data3 = data.rights_revision;
if(typeof data3 === "string"){
if(!pattern5.test(data3)){
const err11 = {instancePath:instancePath+"/rights_revision",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err12 = {instancePath:instancePath+"/rights_revision",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.published_at !== undefined){
let data4 = data.published_at;
if(typeof data4 === "string"){
if(func2(data4) > 27){
const err13 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/clock/maxLength",keyword:"maxLength",params:{limit: 27},message:"must NOT have more than 27 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern319.test(data4)){
const err14 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/clock/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!(formats0.validate(data4))){
const err15 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/clock/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err16 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/clock/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.withdrawn_at !== undefined){
let data5 = data.withdrawn_at;
const _errs16 = errors;
let valid5 = false;
let passing0 = null;
const _errs17 = errors;
if(typeof data5 === "string"){
if(func2(data5) > 27){
const err17 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/clock/maxLength",keyword:"maxLength",params:{limit: 27},message:"must NOT have more than 27 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!pattern319.test(data5)){
const err18 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/clock/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!(formats0.validate(data5))){
const err19 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/clock/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err20 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/$defs/clock/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
valid5 = true;
passing0 = 0;
}
const _errs20 = errors;
if(data5 !== null){
const err21 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/properties/withdrawn_at/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
var _valid0 = _errs20 === errors;
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
const err22 = {instancePath:instancePath+"/withdrawn_at",schemaPath:"#/properties/withdrawn_at/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
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
if(data.clock_disclosure !== undefined){
let data6 = data.clock_disclosure;
const _errs23 = errors;
let valid7 = false;
let passing1 = null;
const _errs24 = errors;
if(!(validate353(data6, {instancePath:instancePath+"/clock_disclosure",parentData:data,parentDataProperty:"clock_disclosure",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate353.errors : vErrors.concat(validate353.errors);
errors = vErrors.length;
}
var _valid1 = _errs24 === errors;
if(_valid1){
valid7 = true;
passing1 = 0;
}
const _errs25 = errors;
if(data6 !== null){
const err23 = {instancePath:instancePath+"/clock_disclosure",schemaPath:"#/properties/clock_disclosure/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
var _valid1 = _errs25 === errors;
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
const err24 = {instancePath:instancePath+"/clock_disclosure",schemaPath:"#/properties/clock_disclosure/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
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
validate350.errors = vErrors;
return errors === 0;
}
validate350.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema555 = {"type":"object","additionalProperties":false,"required":["catalog_snapshot_id","membership_version","input_sha256","start_date","end_date","source_export_as_of","imported_at"],"properties":{"catalog_snapshot_id":{"type":"null"},"membership_version":{"type":"string","pattern":"^[a-zA-Z0-9_-]{1,128}$"},"input_sha256":{"$ref":"#/$defs/hash"},"start_date":{"$ref":"#/$defs/day"},"end_date":{"$ref":"#/$defs/day"},"source_export_as_of":{"$ref":"#/$defs/clock"},"imported_at":{"$ref":"#/$defs/clock"}}};
const pattern323 = new RegExp("^[a-zA-Z0-9_-]{1,128}$", "u");

function validate356(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate356.evaluated;
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
if(data.input_sha256 === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "input_sha256"},message:"must have required property '"+"input_sha256"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.start_date === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "start_date"},message:"must have required property '"+"start_date"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.end_date === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "end_date"},message:"must have required property '"+"end_date"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.source_export_as_of === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_export_as_of"},message:"must have required property '"+"source_export_as_of"+"'"};
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
if(!(((((((key0 === "catalog_snapshot_id") || (key0 === "membership_version")) || (key0 === "input_sha256")) || (key0 === "start_date")) || (key0 === "end_date")) || (key0 === "source_export_as_of")) || (key0 === "imported_at"))){
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
if(data.catalog_snapshot_id !== undefined){
if(data.catalog_snapshot_id !== null){
const err8 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/properties/catalog_snapshot_id/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
if(!pattern323.test(data1)){
const err9 = {instancePath:instancePath+"/membership_version",schemaPath:"#/properties/membership_version/pattern",keyword:"pattern",params:{pattern: "^[a-zA-Z0-9_-]{1,128}$"},message:"must match pattern \""+"^[a-zA-Z0-9_-]{1,128}$"+"\""};
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
const err10 = {instancePath:instancePath+"/membership_version",schemaPath:"#/properties/membership_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.input_sha256 !== undefined){
let data2 = data.input_sha256;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err11 = {instancePath:instancePath+"/input_sha256",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err12 = {instancePath:instancePath+"/input_sha256",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.start_date !== undefined){
let data3 = data.start_date;
if(typeof data3 === "string"){
if(!pattern313.test(data3)){
const err13 = {instancePath:instancePath+"/start_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!(formats40.validate(data3))){
const err14 = {instancePath:instancePath+"/start_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err15 = {instancePath:instancePath+"/start_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.end_date !== undefined){
let data4 = data.end_date;
if(typeof data4 === "string"){
if(!pattern313.test(data4)){
const err16 = {instancePath:instancePath+"/end_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!(formats40.validate(data4))){
const err17 = {instancePath:instancePath+"/end_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err18 = {instancePath:instancePath+"/end_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.source_export_as_of !== undefined){
let data5 = data.source_export_as_of;
if(typeof data5 === "string"){
if(func2(data5) > 27){
const err19 = {instancePath:instancePath+"/source_export_as_of",schemaPath:"#/$defs/clock/maxLength",keyword:"maxLength",params:{limit: 27},message:"must NOT have more than 27 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!pattern319.test(data5)){
const err20 = {instancePath:instancePath+"/source_export_as_of",schemaPath:"#/$defs/clock/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!(formats0.validate(data5))){
const err21 = {instancePath:instancePath+"/source_export_as_of",schemaPath:"#/$defs/clock/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err22 = {instancePath:instancePath+"/source_export_as_of",schemaPath:"#/$defs/clock/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.imported_at !== undefined){
let data6 = data.imported_at;
if(typeof data6 === "string"){
if(func2(data6) > 27){
const err23 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/clock/maxLength",keyword:"maxLength",params:{limit: 27},message:"must NOT have more than 27 characters"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(!pattern319.test(data6)){
const err24 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/clock/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!(formats0.validate(data6))){
const err25 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/clock/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err26 = {instancePath:instancePath+"/imported_at",schemaPath:"#/$defs/clock/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate356.errors = vErrors;
return errors === 0;
}
validate356.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema561 = {"type":"object","additionalProperties":false,"required":["evaluated_at","expected_latest_complete_date","lag_complete_days","status","headline_data_date"],"properties":{"evaluated_at":{"$ref":"#/$defs/clock"},"expected_latest_complete_date":{"$ref":"#/$defs/day"},"lag_complete_days":{"type":"integer","minimum":0},"status":{"enum":["CURRENT","HISTORICAL_VALUE_DISPLAY_ONLY","NO_RECENT_STATISTIC"]},"headline_data_date":{"oneOf":[{"$ref":"#/$defs/day"},{"type":"null"}]}}};

function validate358(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate358.evaluated;
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
if(func2(data0) > 27){
const err6 = {instancePath:instancePath+"/evaluated_at",schemaPath:"#/$defs/clock/maxLength",keyword:"maxLength",params:{limit: 27},message:"must NOT have more than 27 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern319.test(data0)){
const err7 = {instancePath:instancePath+"/evaluated_at",schemaPath:"#/$defs/clock/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z$"+"\""};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!(formats0.validate(data0))){
const err8 = {instancePath:instancePath+"/evaluated_at",schemaPath:"#/$defs/clock/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err9 = {instancePath:instancePath+"/evaluated_at",schemaPath:"#/$defs/clock/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.expected_latest_complete_date !== undefined){
let data1 = data.expected_latest_complete_date;
if(typeof data1 === "string"){
if(!pattern313.test(data1)){
const err10 = {instancePath:instancePath+"/expected_latest_complete_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!(formats40.validate(data1))){
const err11 = {instancePath:instancePath+"/expected_latest_complete_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err12 = {instancePath:instancePath+"/expected_latest_complete_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.lag_complete_days !== undefined){
let data2 = data.lag_complete_days;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err13 = {instancePath:instancePath+"/lag_complete_days",schemaPath:"#/properties/lag_complete_days/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 < 0 || isNaN(data2)){
const err14 = {instancePath:instancePath+"/lag_complete_days",schemaPath:"#/properties/lag_complete_days/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.status !== undefined){
let data3 = data.status;
if(!(((data3 === "CURRENT") || (data3 === "HISTORICAL_VALUE_DISPLAY_ONLY")) || (data3 === "NO_RECENT_STATISTIC"))){
const err15 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema561.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.headline_data_date !== undefined){
let data4 = data.headline_data_date;
const _errs12 = errors;
let valid3 = false;
let passing0 = null;
const _errs13 = errors;
if(typeof data4 === "string"){
if(!pattern313.test(data4)){
const err16 = {instancePath:instancePath+"/headline_data_date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!(formats40.validate(data4))){
const err17 = {instancePath:instancePath+"/headline_data_date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err18 = {instancePath:instancePath+"/headline_data_date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid0 = _errs13 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs16 = errors;
if(data4 !== null){
const err19 = {instancePath:instancePath+"/headline_data_date",schemaPath:"#/properties/headline_data_date/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid0 = _errs16 === errors;
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
const err20 = {instancePath:instancePath+"/headline_data_date",schemaPath:"#/properties/headline_data_date/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
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
validate358.errors = vErrors;
return errors === 0;
}
validate358.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema565 = {"type":"object","additionalProperties":false,"required":["publication_id","day_pair","scope"],"properties":{"publication_id":{"$ref":"#/$defs/hash"},"day_pair":{"$ref":"#/$defs/dayPair"},"scope":{"$ref":"#/$defs/scope"}}};
const schema567 = {"type":"object","additionalProperties":false,"required":["scope_token","scope_id","scope_kind","parent_scope_id","ancestor_scope_ids","labels","fixed_member_count","paired_member_count","day_price_member_count","paired_coverage_ratio","day_price_coverage_ratio","coverage_grade","headline_eligible","raw_return_ratio","suppressed_return_ratio","return_selected_for_display","return_method","missing_endpoint_count","source_set_break_count","single_source_pair_count","unmapped_member_count","other_unavailable_count","member_price_sum_cny","member_price_mean_cny","price_basis"],"properties":{"scope_token":{"$ref":"#/$defs/hash"},"scope_id":{"$ref":"#/$defs/scopeId"},"scope_kind":{"enum":["MARKET","SECTOR","SUBSECTOR"]},"parent_scope_id":{"oneOf":[{"$ref":"#/$defs/scopeId"},{"type":"null"}]},"ancestor_scope_ids":{"type":"array","maxItems":8,"uniqueItems":true,"items":{"$ref":"#/$defs/scopeId"}},"labels":{"type":"object","additionalProperties":false,"required":["en","zh_cn"],"properties":{"en":{"type":"string","minLength":1,"maxLength":128},"zh_cn":{"type":"string","minLength":1,"maxLength":128}}},"fixed_member_count":{"type":"integer","minimum":1,"maximum":1000000},"paired_member_count":{"$ref":"#/$defs/count"},"day_price_member_count":{"$ref":"#/$defs/count"},"paired_coverage_ratio":{"$ref":"#/$defs/decimal"},"day_price_coverage_ratio":{"$ref":"#/$defs/decimal"},"coverage_grade":{"enum":["HIGH","PARTIAL","DETAIL_ONLY"]},"headline_eligible":{"type":"boolean"},"raw_return_ratio":{"$ref":"#/$defs/nullableDecimal"},"suppressed_return_ratio":{"$ref":"#/$defs/nullableDecimal"},"return_selected_for_display":{"$ref":"#/$defs/nullableDecimal"},"return_method":{"enum":["RAW_EQUAL_MEMBER_RETURN","SYMMETRIC_WINSOR_1_PERCENT"]},"missing_endpoint_count":{"$ref":"#/$defs/count"},"source_set_break_count":{"$ref":"#/$defs/count"},"single_source_pair_count":{"$ref":"#/$defs/count"},"unmapped_member_count":{"$ref":"#/$defs/count"},"other_unavailable_count":{"$ref":"#/$defs/count"},"member_price_sum_cny":{"$ref":"#/$defs/nullableDecimal"},"member_price_mean_cny":{"$ref":"#/$defs/nullableDecimal"},"price_basis":{"const":"ONE_SELECTED_EOD_PRICE_PER_AVAILABLE_MEMBER"}}};
const schema569 = {"type":"string","minLength":1,"maxLength":64,"pattern":"^[A-Z][A-Z0-9_]*(:[A-Z0-9_]+)?$"};
const schema572 = {"type":"integer","minimum":0,"maximum":1000000};
const schema574 = {"type":"string","maxLength":128,"pattern":"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"};
const func9 = Object.prototype.hasOwnProperty;
const func0 = __wireEqual;
const pattern334 = new RegExp("^[A-Z][A-Z0-9_]*(:[A-Z0-9_]+)?$", "u");
const pattern7 = new RegExp("^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$", "u");
const schema576 = {"oneOf":[{"$ref":"#/$defs/decimal"},{"type":"null"}]};

function validate364(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate364.evaluated;
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
if(func2(data) > 128){
const err0 = {instancePath,schemaPath:"#/$defs/decimal/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern7.test(data)){
const err1 = {instancePath,schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
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
const err3 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
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
validate364.errors = vErrors;
return errors === 0;
}
validate364.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate363(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate363.evaluated;
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
if(data.scope_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_id"},message:"must have required property '"+"scope_id"+"'"};
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
if(data.parent_scope_id === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parent_scope_id"},message:"must have required property '"+"parent_scope_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.ancestor_scope_ids === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ancestor_scope_ids"},message:"must have required property '"+"ancestor_scope_ids"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.labels === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "labels"},message:"must have required property '"+"labels"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.fixed_member_count === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fixed_member_count"},message:"must have required property '"+"fixed_member_count"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.paired_member_count === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "paired_member_count"},message:"must have required property '"+"paired_member_count"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.day_price_member_count === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "day_price_member_count"},message:"must have required property '"+"day_price_member_count"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.paired_coverage_ratio === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "paired_coverage_ratio"},message:"must have required property '"+"paired_coverage_ratio"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.day_price_coverage_ratio === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "day_price_coverage_ratio"},message:"must have required property '"+"day_price_coverage_ratio"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.coverage_grade === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "coverage_grade"},message:"must have required property '"+"coverage_grade"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.headline_eligible === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "headline_eligible"},message:"must have required property '"+"headline_eligible"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.raw_return_ratio === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "raw_return_ratio"},message:"must have required property '"+"raw_return_ratio"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.suppressed_return_ratio === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "suppressed_return_ratio"},message:"must have required property '"+"suppressed_return_ratio"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.return_selected_for_display === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "return_selected_for_display"},message:"must have required property '"+"return_selected_for_display"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.return_method === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "return_method"},message:"must have required property '"+"return_method"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.missing_endpoint_count === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "missing_endpoint_count"},message:"must have required property '"+"missing_endpoint_count"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.source_set_break_count === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_set_break_count"},message:"must have required property '"+"source_set_break_count"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.single_source_pair_count === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "single_source_pair_count"},message:"must have required property '"+"single_source_pair_count"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.unmapped_member_count === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "unmapped_member_count"},message:"must have required property '"+"unmapped_member_count"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.other_unavailable_count === undefined){
const err21 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "other_unavailable_count"},message:"must have required property '"+"other_unavailable_count"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.member_price_sum_cny === undefined){
const err22 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_price_sum_cny"},message:"must have required property '"+"member_price_sum_cny"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data.member_price_mean_cny === undefined){
const err23 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_price_mean_cny"},message:"must have required property '"+"member_price_mean_cny"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data.price_basis === undefined){
const err24 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "price_basis"},message:"must have required property '"+"price_basis"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema567.properties, key0))){
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
if(data.scope_token !== undefined){
let data0 = data.scope_token;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err26 = {instancePath:instancePath+"/scope_token",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err27 = {instancePath:instancePath+"/scope_token",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.scope_id !== undefined){
let data1 = data.scope_id;
if(typeof data1 === "string"){
if(func2(data1) > 64){
const err28 = {instancePath:instancePath+"/scope_id",schemaPath:"#/$defs/scopeId/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(func2(data1) < 1){
const err29 = {instancePath:instancePath+"/scope_id",schemaPath:"#/$defs/scopeId/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(!pattern334.test(data1)){
const err30 = {instancePath:instancePath+"/scope_id",schemaPath:"#/$defs/scopeId/pattern",keyword:"pattern",params:{pattern: "^[A-Z][A-Z0-9_]*(:[A-Z0-9_]+)?$"},message:"must match pattern \""+"^[A-Z][A-Z0-9_]*(:[A-Z0-9_]+)?$"+"\""};
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
const err31 = {instancePath:instancePath+"/scope_id",schemaPath:"#/$defs/scopeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data2 = data.scope_kind;
if(!(((data2 === "MARKET") || (data2 === "SECTOR")) || (data2 === "SUBSECTOR"))){
const err32 = {instancePath:instancePath+"/scope_kind",schemaPath:"#/properties/scope_kind/enum",keyword:"enum",params:{allowedValues: schema567.properties.scope_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.parent_scope_id !== undefined){
let data3 = data.parent_scope_id;
const _errs10 = errors;
let valid3 = false;
let passing0 = null;
const _errs11 = errors;
if(typeof data3 === "string"){
if(func2(data3) > 64){
const err33 = {instancePath:instancePath+"/parent_scope_id",schemaPath:"#/$defs/scopeId/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(func2(data3) < 1){
const err34 = {instancePath:instancePath+"/parent_scope_id",schemaPath:"#/$defs/scopeId/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(!pattern334.test(data3)){
const err35 = {instancePath:instancePath+"/parent_scope_id",schemaPath:"#/$defs/scopeId/pattern",keyword:"pattern",params:{pattern: "^[A-Z][A-Z0-9_]*(:[A-Z0-9_]+)?$"},message:"must match pattern \""+"^[A-Z][A-Z0-9_]*(:[A-Z0-9_]+)?$"+"\""};
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
const err36 = {instancePath:instancePath+"/parent_scope_id",schemaPath:"#/$defs/scopeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
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
const err37 = {instancePath:instancePath+"/parent_scope_id",schemaPath:"#/properties/parent_scope_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
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
const err38 = {instancePath:instancePath+"/parent_scope_id",schemaPath:"#/properties/parent_scope_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
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
if(data.ancestor_scope_ids !== undefined){
let data4 = data.ancestor_scope_ids;
if(Array.isArray(data4)){
if(data4.length > 8){
const err39 = {instancePath:instancePath+"/ancestor_scope_ids",schemaPath:"#/properties/ancestor_scope_ids/maxItems",keyword:"maxItems",params:{limit: 8},message:"must NOT have more than 8 items"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
let data5 = data4[i0];
if(typeof data5 === "string"){
if(func2(data5) > 64){
const err40 = {instancePath:instancePath+"/ancestor_scope_ids/" + i0,schemaPath:"#/$defs/scopeId/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(func2(data5) < 1){
const err41 = {instancePath:instancePath+"/ancestor_scope_ids/" + i0,schemaPath:"#/$defs/scopeId/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(!pattern334.test(data5)){
const err42 = {instancePath:instancePath+"/ancestor_scope_ids/" + i0,schemaPath:"#/$defs/scopeId/pattern",keyword:"pattern",params:{pattern: "^[A-Z][A-Z0-9_]*(:[A-Z0-9_]+)?$"},message:"must match pattern \""+"^[A-Z][A-Z0-9_]*(:[A-Z0-9_]+)?$"+"\""};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
else {
const err43 = {instancePath:instancePath+"/ancestor_scope_ids/" + i0,schemaPath:"#/$defs/scopeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
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
const err44 = {instancePath:instancePath+"/ancestor_scope_ids",schemaPath:"#/properties/ancestor_scope_ids/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err45 = {instancePath:instancePath+"/ancestor_scope_ids",schemaPath:"#/properties/ancestor_scope_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.labels !== undefined){
let data6 = data.labels;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.en === undefined){
const err46 = {instancePath:instancePath+"/labels",schemaPath:"#/properties/labels/required",keyword:"required",params:{missingProperty: "en"},message:"must have required property '"+"en"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data6.zh_cn === undefined){
const err47 = {instancePath:instancePath+"/labels",schemaPath:"#/properties/labels/required",keyword:"required",params:{missingProperty: "zh_cn"},message:"must have required property '"+"zh_cn"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
for(const key1 in data6){
if(!((key1 === "en") || (key1 === "zh_cn"))){
const err48 = {instancePath:instancePath+"/labels",schemaPath:"#/properties/labels/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data6.en !== undefined){
let data7 = data6.en;
if(typeof data7 === "string"){
if(func2(data7) > 128){
const err49 = {instancePath:instancePath+"/labels/en",schemaPath:"#/properties/labels/properties/en/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(func2(data7) < 1){
const err50 = {instancePath:instancePath+"/labels/en",schemaPath:"#/properties/labels/properties/en/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err51 = {instancePath:instancePath+"/labels/en",schemaPath:"#/properties/labels/properties/en/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data6.zh_cn !== undefined){
let data8 = data6.zh_cn;
if(typeof data8 === "string"){
if(func2(data8) > 128){
const err52 = {instancePath:instancePath+"/labels/zh_cn",schemaPath:"#/properties/labels/properties/zh_cn/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(func2(data8) < 1){
const err53 = {instancePath:instancePath+"/labels/zh_cn",schemaPath:"#/properties/labels/properties/zh_cn/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err54 = {instancePath:instancePath+"/labels/zh_cn",schemaPath:"#/properties/labels/properties/zh_cn/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err55 = {instancePath:instancePath+"/labels",schemaPath:"#/properties/labels/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data.fixed_member_count !== undefined){
let data9 = data.fixed_member_count;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err56 = {instancePath:instancePath+"/fixed_member_count",schemaPath:"#/properties/fixed_member_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if((typeof data9 == "number") && (isFinite(data9))){
if(data9 > 1000000 || isNaN(data9)){
const err57 = {instancePath:instancePath+"/fixed_member_count",schemaPath:"#/properties/fixed_member_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data9 < 1 || isNaN(data9)){
const err58 = {instancePath:instancePath+"/fixed_member_count",schemaPath:"#/properties/fixed_member_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.paired_member_count !== undefined){
let data10 = data.paired_member_count;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err59 = {instancePath:instancePath+"/paired_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 > 1000000 || isNaN(data10)){
const err60 = {instancePath:instancePath+"/paired_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data10 < 0 || isNaN(data10)){
const err61 = {instancePath:instancePath+"/paired_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.day_price_member_count !== undefined){
let data11 = data.day_price_member_count;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err62 = {instancePath:instancePath+"/day_price_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 > 1000000 || isNaN(data11)){
const err63 = {instancePath:instancePath+"/day_price_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(data11 < 0 || isNaN(data11)){
const err64 = {instancePath:instancePath+"/day_price_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.paired_coverage_ratio !== undefined){
let data12 = data.paired_coverage_ratio;
if(typeof data12 === "string"){
if(func2(data12) > 128){
const err65 = {instancePath:instancePath+"/paired_coverage_ratio",schemaPath:"#/$defs/decimal/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(!pattern7.test(data12)){
const err66 = {instancePath:instancePath+"/paired_coverage_ratio",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
else {
const err67 = {instancePath:instancePath+"/paired_coverage_ratio",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data.day_price_coverage_ratio !== undefined){
let data13 = data.day_price_coverage_ratio;
if(typeof data13 === "string"){
if(func2(data13) > 128){
const err68 = {instancePath:instancePath+"/day_price_coverage_ratio",schemaPath:"#/$defs/decimal/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(!pattern7.test(data13)){
const err69 = {instancePath:instancePath+"/day_price_coverage_ratio",schemaPath:"#/$defs/decimal/pattern",keyword:"pattern",params:{pattern: "^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"},message:"must match pattern \""+"^-?(0|[1-9][0-9]*)(\\.[0-9]+)?$"+"\""};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
else {
const err70 = {instancePath:instancePath+"/day_price_coverage_ratio",schemaPath:"#/$defs/decimal/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data.coverage_grade !== undefined){
let data14 = data.coverage_grade;
if(!(((data14 === "HIGH") || (data14 === "PARTIAL")) || (data14 === "DETAIL_ONLY"))){
const err71 = {instancePath:instancePath+"/coverage_grade",schemaPath:"#/properties/coverage_grade/enum",keyword:"enum",params:{allowedValues: schema567.properties.coverage_grade.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data.headline_eligible !== undefined){
if(typeof data.headline_eligible !== "boolean"){
const err72 = {instancePath:instancePath+"/headline_eligible",schemaPath:"#/properties/headline_eligible/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data.raw_return_ratio !== undefined){
if(!(validate364(data.raw_return_ratio, {instancePath:instancePath+"/raw_return_ratio",parentData:data,parentDataProperty:"raw_return_ratio",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate364.errors : vErrors.concat(validate364.errors);
errors = vErrors.length;
}
}
if(data.suppressed_return_ratio !== undefined){
if(!(validate364(data.suppressed_return_ratio, {instancePath:instancePath+"/suppressed_return_ratio",parentData:data,parentDataProperty:"suppressed_return_ratio",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate364.errors : vErrors.concat(validate364.errors);
errors = vErrors.length;
}
}
if(data.return_selected_for_display !== undefined){
if(!(validate364(data.return_selected_for_display, {instancePath:instancePath+"/return_selected_for_display",parentData:data,parentDataProperty:"return_selected_for_display",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate364.errors : vErrors.concat(validate364.errors);
errors = vErrors.length;
}
}
if(data.return_method !== undefined){
let data19 = data.return_method;
if(!((data19 === "RAW_EQUAL_MEMBER_RETURN") || (data19 === "SYMMETRIC_WINSOR_1_PERCENT"))){
const err73 = {instancePath:instancePath+"/return_method",schemaPath:"#/properties/return_method/enum",keyword:"enum",params:{allowedValues: schema567.properties.return_method.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data.missing_endpoint_count !== undefined){
let data20 = data.missing_endpoint_count;
if(!(((typeof data20 == "number") && (!(data20 % 1) && !isNaN(data20))) && (isFinite(data20)))){
const err74 = {instancePath:instancePath+"/missing_endpoint_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if((typeof data20 == "number") && (isFinite(data20))){
if(data20 > 1000000 || isNaN(data20)){
const err75 = {instancePath:instancePath+"/missing_endpoint_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(data20 < 0 || isNaN(data20)){
const err76 = {instancePath:instancePath+"/missing_endpoint_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
}
if(data.source_set_break_count !== undefined){
let data21 = data.source_set_break_count;
if(!(((typeof data21 == "number") && (!(data21 % 1) && !isNaN(data21))) && (isFinite(data21)))){
const err77 = {instancePath:instancePath+"/source_set_break_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if((typeof data21 == "number") && (isFinite(data21))){
if(data21 > 1000000 || isNaN(data21)){
const err78 = {instancePath:instancePath+"/source_set_break_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(data21 < 0 || isNaN(data21)){
const err79 = {instancePath:instancePath+"/source_set_break_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
}
if(data.single_source_pair_count !== undefined){
let data22 = data.single_source_pair_count;
if(!(((typeof data22 == "number") && (!(data22 % 1) && !isNaN(data22))) && (isFinite(data22)))){
const err80 = {instancePath:instancePath+"/single_source_pair_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if((typeof data22 == "number") && (isFinite(data22))){
if(data22 > 1000000 || isNaN(data22)){
const err81 = {instancePath:instancePath+"/single_source_pair_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(data22 < 0 || isNaN(data22)){
const err82 = {instancePath:instancePath+"/single_source_pair_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
}
if(data.unmapped_member_count !== undefined){
let data23 = data.unmapped_member_count;
if(!(((typeof data23 == "number") && (!(data23 % 1) && !isNaN(data23))) && (isFinite(data23)))){
const err83 = {instancePath:instancePath+"/unmapped_member_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if((typeof data23 == "number") && (isFinite(data23))){
if(data23 > 1000000 || isNaN(data23)){
const err84 = {instancePath:instancePath+"/unmapped_member_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data23 < 0 || isNaN(data23)){
const err85 = {instancePath:instancePath+"/unmapped_member_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.other_unavailable_count !== undefined){
let data24 = data.other_unavailable_count;
if(!(((typeof data24 == "number") && (!(data24 % 1) && !isNaN(data24))) && (isFinite(data24)))){
const err86 = {instancePath:instancePath+"/other_unavailable_count",schemaPath:"#/$defs/count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if((typeof data24 == "number") && (isFinite(data24))){
if(data24 > 1000000 || isNaN(data24)){
const err87 = {instancePath:instancePath+"/other_unavailable_count",schemaPath:"#/$defs/count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1000000},message:"must be <= 1000000"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if(data24 < 0 || isNaN(data24)){
const err88 = {instancePath:instancePath+"/other_unavailable_count",schemaPath:"#/$defs/count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.member_price_sum_cny !== undefined){
if(!(validate364(data.member_price_sum_cny, {instancePath:instancePath+"/member_price_sum_cny",parentData:data,parentDataProperty:"member_price_sum_cny",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate364.errors : vErrors.concat(validate364.errors);
errors = vErrors.length;
}
}
if(data.member_price_mean_cny !== undefined){
if(!(validate364(data.member_price_mean_cny, {instancePath:instancePath+"/member_price_mean_cny",parentData:data,parentDataProperty:"member_price_mean_cny",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate364.errors : vErrors.concat(validate364.errors);
errors = vErrors.length;
}
}
if(data.price_basis !== undefined){
if("ONE_SELECTED_EOD_PRICE_PER_AVAILABLE_MEMBER" !== data.price_basis){
const err89 = {instancePath:instancePath+"/price_basis",schemaPath:"#/properties/price_basis/const",keyword:"const",params:{allowedValue: "ONE_SELECTED_EOD_PRICE_PER_AVAILABLE_MEMBER"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
}
else {
const err90 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
validate363.errors = vErrors;
return errors === 0;
}
validate363.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate361(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate361.evaluated;
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
if(data.day_pair === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "day_pair"},message:"must have required property '"+"day_pair"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.scope === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope"},message:"must have required property '"+"scope"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "publication_id") || (key0 === "day_pair")) || (key0 === "scope"))){
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
if(data.publication_id !== undefined){
let data0 = data.publication_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err4 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err5 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.day_pair !== undefined){
if(!(validate348(data.day_pair, {instancePath:instancePath+"/day_pair",parentData:data,parentDataProperty:"day_pair",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate348.errors : vErrors.concat(validate348.errors);
errors = vErrors.length;
}
}
if(data.scope !== undefined){
if(!(validate363(data.scope, {instancePath:instancePath+"/scope",parentData:data,parentDataProperty:"scope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate363.errors : vErrors.concat(validate363.errors);
errors = vErrors.length;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate361.errors = vErrors;
return errors === 0;
}
validate361.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema583 = {"type":"object","additionalProperties":false,"required":["date","status","scope"],"properties":{"date":{"$ref":"#/$defs/day"},"status":{"enum":["AVAILABLE","NO_PUBLISHED_DAY","UNAVAILABLE","BASELINE_ONLY"]},"scope":{"oneOf":[{"$ref":"#/$defs/scope"},{"type":"null"}]}}};

function validate372(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate372.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.date === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "date"},message:"must have required property '"+"date"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.status === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.scope === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope"},message:"must have required property '"+"scope"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "date") || (key0 === "status")) || (key0 === "scope"))){
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
if(data.date !== undefined){
let data0 = data.date;
if(typeof data0 === "string"){
if(!pattern313.test(data0)){
const err4 = {instancePath:instancePath+"/date",schemaPath:"#/$defs/day/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!(formats40.validate(data0))){
const err5 = {instancePath:instancePath+"/date",schemaPath:"#/$defs/day/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err6 = {instancePath:instancePath+"/date",schemaPath:"#/$defs/day/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data1 = data.status;
if(!((((data1 === "AVAILABLE") || (data1 === "NO_PUBLISHED_DAY")) || (data1 === "UNAVAILABLE")) || (data1 === "BASELINE_ONLY"))){
const err7 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema583.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.scope !== undefined){
let data2 = data.scope;
const _errs7 = errors;
let valid2 = false;
let passing0 = null;
const _errs8 = errors;
if(!(validate363(data2, {instancePath:instancePath+"/scope",parentData:data,parentDataProperty:"scope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate363.errors : vErrors.concat(validate363.errors);
errors = vErrors.length;
}
var _valid0 = _errs8 === errors;
if(_valid0){
valid2 = true;
passing0 = 0;
}
const _errs9 = errors;
if(data2 !== null){
const err8 = {instancePath:instancePath+"/scope",schemaPath:"#/properties/scope/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
var _valid0 = _errs9 === errors;
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
const err9 = {instancePath:instancePath+"/scope",schemaPath:"#/properties/scope/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
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
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate372.errors = vErrors;
return errors === 0;
}
validate372.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema585 = {"type":"object","additionalProperties":false,"required":["publication_id","day_pair","scopes","connect_to_previous"],"properties":{"publication_id":{"$ref":"#/$defs/hash"},"day_pair":{"$ref":"#/$defs/dayPair"},"scopes":{"type":"array","minItems":1,"maxItems":128,"items":{"$ref":"#/$defs/scope"}},"connect_to_previous":{"type":"boolean"}}};

function validate376(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate376.evaluated;
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
if(data.day_pair === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "day_pair"},message:"must have required property '"+"day_pair"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.scopes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scopes"},message:"must have required property '"+"scopes"+"'"};
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
for(const key0 in data){
if(!((((key0 === "publication_id") || (key0 === "day_pair")) || (key0 === "scopes")) || (key0 === "connect_to_previous"))){
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
if(data.publication_id !== undefined){
let data0 = data.publication_id;
if(typeof data0 === "string"){
if(!pattern5.test(data0)){
const err5 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/hash/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err6 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.day_pair !== undefined){
if(!(validate348(data.day_pair, {instancePath:instancePath+"/day_pair",parentData:data,parentDataProperty:"day_pair",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate348.errors : vErrors.concat(validate348.errors);
errors = vErrors.length;
}
}
if(data.scopes !== undefined){
let data2 = data.scopes;
if(Array.isArray(data2)){
if(data2.length > 128){
const err7 = {instancePath:instancePath+"/scopes",schemaPath:"#/properties/scopes/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data2.length < 1){
const err8 = {instancePath:instancePath+"/scopes",schemaPath:"#/properties/scopes/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
if(!(validate363(data2[i0], {instancePath:instancePath+"/scopes/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate363.errors : vErrors.concat(validate363.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath:instancePath+"/scopes",schemaPath:"#/properties/scopes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.connect_to_previous !== undefined){
if(typeof data.connect_to_previous !== "boolean"){
const err10 = {instancePath:instancePath+"/connect_to_previous",schemaPath:"#/properties/connect_to_previous/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
validate376.errors = vErrors;
return errors === 0;
}
validate376.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate347(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate347.evaluated;
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
if(data.response_kind !== undefined){
if("EMPTY" !== data.response_kind){
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
if(_valid0){
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.scopes !== undefined){
let data1 = data.scopes;
if(Array.isArray(data1)){
if(data1.length > 0){
const err1 = {instancePath:instancePath+"/scopes",schemaPath:"#/allOf/0/then/properties/scopes/maxItems",keyword:"maxItems",params:{limit: 0},message:"must NOT have more than 0 items"};
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
if(data.day_pair !== undefined){
if(data.day_pair !== null){
const err2 = {instancePath:instancePath+"/day_pair",schemaPath:"#/allOf/0/then/properties/day_pair/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
props0.scopes = true;
props0.day_pair = true;
props0.response_kind = true;
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
const _errs10 = errors;
let valid4 = true;
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.response_kind !== undefined){
if("RESULT" !== data.response_kind){
const err4 = {};
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
var _valid1 = _errs11 === errors;
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs13 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.scopes !== undefined){
let data4 = data.scopes;
if(Array.isArray(data4)){
if(data4.length < 1){
const err5 = {instancePath:instancePath+"/scopes",schemaPath:"#/allOf/1/then/properties/scopes/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
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
if(data.day_pair !== undefined){
if(!(validate348(data.day_pair, {instancePath:instancePath+"/day_pair",parentData:data,parentDataProperty:"day_pair",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate348.errors : vErrors.concat(validate348.errors);
errors = vErrors.length;
}
}
}
var _valid1 = _errs13 === errors;
valid4 = _valid1;
if(valid4){
var props1 = {};
props1.scopes = true;
props1.day_pair = true;
props1.response_kind = true;
}
}
if(!valid4){
const err6 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
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
if(data.contract_name === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_name"},message:"must have required property '"+"contract_name"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.contract_version === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_version"},message:"must have required property '"+"contract_version"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.response_kind === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.operation === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation"},message:"must have required property '"+"operation"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.product_kind === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "product_kind"},message:"must have required property '"+"product_kind"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.method === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "method"},message:"must have required property '"+"method"+"'"};
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
if(data.freshness === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "freshness"},message:"must have required property '"+"freshness"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.day_pair === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "day_pair"},message:"must have required property '"+"day_pair"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.headline === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "headline"},message:"must have required property '"+"headline"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.current_day_quality === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "current_day_quality"},message:"must have required property '"+"current_day_quality"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.scopes === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scopes"},message:"must have required property '"+"scopes"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.history === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "history"},message:"must have required property '"+"history"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema540.properties, key0))){
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
if(data.contract_name !== undefined){
if("market-descriptive-public-api" !== data.contract_name){
const err22 = {instancePath:instancePath+"/contract_name",schemaPath:"#/properties/contract_name/const",keyword:"const",params:{allowedValue: "market-descriptive-public-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.contract_version !== undefined){
if("1" !== data.contract_version){
const err23 = {instancePath:instancePath+"/contract_version",schemaPath:"#/properties/contract_version/const",keyword:"const",params:{allowedValue: "1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.response_kind !== undefined){
let data8 = data.response_kind;
if(!((data8 === "RESULT") || (data8 === "EMPTY"))){
const err24 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/enum",keyword:"enum",params:{allowedValues: schema540.properties.response_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.operation !== undefined){
let data9 = data.operation;
if(!((data9 === "OVERVIEW") || (data9 === "SCOPE"))){
const err25 = {instancePath:instancePath+"/operation",schemaPath:"#/properties/operation/enum",keyword:"enum",params:{allowedValues: schema540.properties.operation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.product_kind !== undefined){
if("MARKET_DESCRIPTIVE" !== data.product_kind){
const err26 = {instancePath:instancePath+"/product_kind",schemaPath:"#/properties/product_kind/const",keyword:"const",params:{allowedValue: "MARKET_DESCRIPTIVE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.method !== undefined){
if("EQUAL_WEIGHTED_MEMBER_RETURN" !== data.method){
const err27 = {instancePath:instancePath+"/method",schemaPath:"#/properties/method/const",keyword:"const",params:{allowedValue: "EQUAL_WEIGHTED_MEMBER_RETURN"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.publication !== undefined){
if(!(validate350(data.publication, {instancePath:instancePath+"/publication",parentData:data,parentDataProperty:"publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate350.errors : vErrors.concat(validate350.errors);
errors = vErrors.length;
}
}
if(data.snapshot !== undefined){
if(!(validate356(data.snapshot, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate356.errors : vErrors.concat(validate356.errors);
errors = vErrors.length;
}
}
if(data.freshness !== undefined){
if(!(validate358(data.freshness, {instancePath:instancePath+"/freshness",parentData:data,parentDataProperty:"freshness",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate358.errors : vErrors.concat(validate358.errors);
errors = vErrors.length;
}
}
if(data.day_pair !== undefined){
let data15 = data.day_pair;
const _errs27 = errors;
let valid8 = false;
let passing0 = null;
const _errs28 = errors;
if(!(validate348(data15, {instancePath:instancePath+"/day_pair",parentData:data,parentDataProperty:"day_pair",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate348.errors : vErrors.concat(validate348.errors);
errors = vErrors.length;
}
var _valid2 = _errs28 === errors;
if(_valid2){
valid8 = true;
passing0 = 0;
}
const _errs29 = errors;
if(data15 !== null){
const err28 = {instancePath:instancePath+"/day_pair",schemaPath:"#/properties/day_pair/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
var _valid2 = _errs29 === errors;
if(_valid2 && valid8){
valid8 = false;
passing0 = [passing0, 1];
}
else {
if(_valid2){
valid8 = true;
passing0 = 1;
}
}
if(!valid8){
const err29 = {instancePath:instancePath+"/day_pair",schemaPath:"#/properties/day_pair/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
else {
errors = _errs27;
if(vErrors !== null){
if(_errs27){
vErrors.length = _errs27;
}
else {
vErrors = null;
}
}
}
}
if(data.headline !== undefined){
let data16 = data.headline;
const _errs32 = errors;
let valid9 = false;
let passing1 = null;
const _errs33 = errors;
if(!(validate361(data16, {instancePath:instancePath+"/headline",parentData:data,parentDataProperty:"headline",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate361.errors : vErrors.concat(validate361.errors);
errors = vErrors.length;
}
var _valid3 = _errs33 === errors;
if(_valid3){
valid9 = true;
passing1 = 0;
}
const _errs34 = errors;
if(data16 !== null){
const err30 = {instancePath:instancePath+"/headline",schemaPath:"#/properties/headline/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
var _valid3 = _errs34 === errors;
if(_valid3 && valid9){
valid9 = false;
passing1 = [passing1, 1];
}
else {
if(_valid3){
valid9 = true;
passing1 = 1;
}
}
if(!valid9){
const err31 = {instancePath:instancePath+"/headline",schemaPath:"#/properties/headline/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
else {
errors = _errs32;
if(vErrors !== null){
if(_errs32){
vErrors.length = _errs32;
}
else {
vErrors = null;
}
}
}
}
if(data.current_day_quality !== undefined){
if(!(validate372(data.current_day_quality, {instancePath:instancePath+"/current_day_quality",parentData:data,parentDataProperty:"current_day_quality",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate372.errors : vErrors.concat(validate372.errors);
errors = vErrors.length;
}
}
if(data.scopes !== undefined){
let data18 = data.scopes;
if(Array.isArray(data18)){
if(data18.length > 128){
const err32 = {instancePath:instancePath+"/scopes",schemaPath:"#/properties/scopes/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
const len0 = data18.length;
for(let i0=0; i0<len0; i0++){
if(!(validate363(data18[i0], {instancePath:instancePath+"/scopes/" + i0,parentData:data18,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate363.errors : vErrors.concat(validate363.errors);
errors = vErrors.length;
}
}
}
else {
const err33 = {instancePath:instancePath+"/scopes",schemaPath:"#/properties/scopes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.history !== undefined){
let data20 = data.history;
if(Array.isArray(data20)){
if(data20.length > 3){
const err34 = {instancePath:instancePath+"/history",schemaPath:"#/properties/history/maxItems",keyword:"maxItems",params:{limit: 3},message:"must NOT have more than 3 items"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
const len1 = data20.length;
for(let i1=0; i1<len1; i1++){
if(!(validate376(data20[i1], {instancePath:instancePath+"/history/" + i1,parentData:data20,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate376.errors : vErrors.concat(validate376.errors);
errors = vErrors.length;
}
}
}
else {
const err35 = {instancePath:instancePath+"/history",schemaPath:"#/properties/history/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
validate347.errors = vErrors;
return errors === 0;
}
validate347.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate346(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2:market-descriptive-public-api:1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate346.evaluated;
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
if(!(validate347(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate347.errors : vErrors.concat(validate347.errors);
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
if("market-descriptive-public-api" !== data.contract_name){
const err5 = {instancePath:instancePath+"/contract_name",schemaPath:"#/$defs/error/properties/contract_name/const",keyword:"const",params:{allowedValue: "market-descriptive-public-api"},message:"must be equal to constant"};
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
const err11 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/properties/error/properties/code/enum",keyword:"enum",params:{allowedValues: schema587.properties.error.properties.code.enum},message:"must be equal to one of the allowed values"};
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
validate346.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate346.evaluated = {"dynamicProps":true,"dynamicItems":false};
