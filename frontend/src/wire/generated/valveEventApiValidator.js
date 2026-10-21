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
export const validateValveEventApiResponse = validate163;
const schema250 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://cs2.example.invalid/schemas/valve-event-public-api-v1.schema.json","title":"Valve Event Public Read API V1","oneOf":[{"$ref":"#/$defs/listResponse"},{"$ref":"#/$defs/detailResponse"}],"$defs":{"nonblank":{"type":"string","minLength":1},"sha256":{"type":"string","pattern":"^[0-9a-f]{64}$"},"timestamp":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},"status":{"type":"string"},"temporalMode":{"type":"string"},"direction":{"type":"string"},"flags":{"type":"object","additionalProperties":true,"required":["corrected","source_updated","withdrawn"],"properties":{"corrected":{"type":"boolean"},"source_updated":{"type":"boolean"},"withdrawn":{"type":"boolean"}}},"source":{"type":"object","additionalProperties":true,"required":["event_id","first_observed_at","official_published_at","official_title","official_url","source_code","source_notice_version_id","source_updated_at"],"properties":{"event_id":{"$ref":"#/$defs/nonblank"},"first_observed_at":{"$ref":"#/$defs/timestamp"},"official_published_at":{"$ref":"#/$defs/timestamp"},"official_title":{"$ref":"#/$defs/nonblank"},"official_url":{"type":["string","null"],"maxLength":2048},"source_code":{"const":"STEAM_ISteamNews_V2"},"source_notice_version_id":{"$ref":"#/$defs/nonblank"},"source_updated_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]}}},"article":{"oneOf":[{"$ref":"#/$defs/sectionedArticle"},{"$ref":"#/$defs/bilingualReaderArticle"}]},"claim":{"type":"object","additionalProperties":true,"required":["claim_id","direction","falsification_conditions","horizon","limitations","mechanism_codes","observation_targets","reasoning_section_ref","scope_display","scope_kind","scope_ref","tracking_status"],"properties":{"claim_id":{"$ref":"#/$defs/nonblank"},"direction":{"$ref":"#/$defs/direction"},"falsification_conditions":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"horizon":{"type":"string"},"limitations":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"mechanism_codes":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"observation_targets":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"reasoning_section_ref":{"$ref":"#/$defs/nonblank"},"scope_display":{"$ref":"#/$defs/nonblank"},"scope_kind":{"type":"string"},"scope_ref":{"type":["string","null"]},"tracking_status":{"type":"string"}}},"assessment":{"type":"object","additionalProperties":true,"required":["article","claims","context_snapshot_id","context_status","correction_of_publication_id","disclosures","event_cutoff_at","known_at","public_payload_sha256","publication_id","publication_version_no","published_at","source_notice_version_id","temporal_mode"],"properties":{"article":{"$ref":"#/$defs/article"},"claims":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/claim"}},"context_snapshot_id":{"$ref":"#/$defs/nonblank"},"context_status":{"type":"string"},"correction_of_publication_id":{"type":["string","null"]},"disclosures":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/nonblank"}},"event_cutoff_at":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"public_payload_sha256":{"$ref":"#/$defs/sha256"},"publication_id":{"$ref":"#/$defs/nonblank"},"publication_version_no":{"type":"integer","minimum":1},"published_at":{"$ref":"#/$defs/timestamp"},"source_notice_version_id":{"$ref":"#/$defs/nonblank"},"temporal_mode":{"$ref":"#/$defs/temporalMode"}}},"outcome":{"type":"object","additionalProperties":true,"required":["evidence_status","explanation","label","noise_and_causality_disclosure","observation_cutoff_at","outcome_evaluation_id","outcome_publication_id","policy_release_id","published_at"],"properties":{"evidence_status":{"$ref":"#/$defs/nonblank"},"explanation":{"$ref":"#/$defs/nonblank"},"label":{"type":"string"},"noise_and_causality_disclosure":{"$ref":"#/$defs/nonblank"},"observation_cutoff_at":{"$ref":"#/$defs/timestamp"},"outcome_evaluation_id":{"$ref":"#/$defs/nonblank"},"outcome_publication_id":{"$ref":"#/$defs/nonblank"},"policy_release_id":{"$ref":"#/$defs/nonblank"},"published_at":{"$ref":"#/$defs/timestamp"}}},"version":{"type":"object","additionalProperties":true,"required":["publication_id","publication_version_no","published_at","temporal_mode","withdrawal_reason","withdrawn"],"properties":{"publication_id":{"$ref":"#/$defs/nonblank"},"publication_version_no":{"type":"integer","minimum":1},"published_at":{"$ref":"#/$defs/timestamp"},"temporal_mode":{"$ref":"#/$defs/temporalMode"},"withdrawal_reason":{"type":["string","null"]},"withdrawn":{"type":"boolean"}}},"summary":{"type":"object","additionalProperties":true,"required":["conclusion_summary","flags","outcome_label","primary_direction","scope_labels","source","status","temporal_mode"],"properties":{"conclusion_summary":{"oneOf":[{"type":"string","minLength":1},{"$ref":"#/$defs/localizedSummary"},{"type":"null"}]},"flags":{"$ref":"#/$defs/flags"},"outcome_label":{"type":["string","null"]},"primary_direction":{"oneOf":[{"$ref":"#/$defs/direction"},{"type":"null"}]},"scope_labels":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"source":{"$ref":"#/$defs/source"},"status":{"$ref":"#/$defs/status"},"temporal_mode":{"oneOf":[{"$ref":"#/$defs/temporalMode"},{"type":"null"}]}}},"event":{"type":"object","additionalProperties":true,"required":["flags","latest_outcome","latest_publication","public_versions","source","status"],"properties":{"flags":{"$ref":"#/$defs/flags"},"latest_outcome":{"oneOf":[{"$ref":"#/$defs/outcome"},{"type":"null"}]},"latest_publication":{"oneOf":[{"$ref":"#/$defs/assessment"},{"type":"null"}]},"public_versions":{"type":"array","items":{"$ref":"#/$defs/version"}},"source":{"$ref":"#/$defs/source"},"status":{"$ref":"#/$defs/status"}}},"listResponse":{"type":"object","additionalProperties":true,"required":["api_contract","api_version","events","next_cursor","query_hash","response_kind"],"properties":{"api_contract":{"const":"valve-event-public-api"},"api_version":{"const":"v1"},"events":{"type":"array","items":{"$ref":"#/$defs/summary"}},"next_cursor":{"type":["string","null"]},"query_hash":{"$ref":"#/$defs/sha256"},"response_kind":{"const":"VALVE_EVENT_LIST"}}},"detailResponse":{"type":"object","additionalProperties":true,"required":["api_contract","api_version","etag","event","response_kind"],"properties":{"api_contract":{"const":"valve-event-public-api"},"api_version":{"const":"v1"},"etag":{"$ref":"#/$defs/sha256"},"event":{"$ref":"#/$defs/event"},"response_kind":{"const":"VALVE_EVENT_DETAIL"}}},"sectionedArticle":{"type":"object","additionalProperties":true,"required":["conclusion","factual_summary","observation_and_falsification","scope_analysis","title","transmission_mechanisms","uncertainties_and_counterforces"],"properties":{"conclusion":{"$ref":"#/$defs/nonblank"},"factual_summary":{"$ref":"#/$defs/nonblank"},"observation_and_falsification":{"$ref":"#/$defs/nonblank"},"scope_analysis":{"$ref":"#/$defs/nonblank"},"title":{"$ref":"#/$defs/nonblank"},"transmission_mechanisms":{"$ref":"#/$defs/nonblank"},"uncertainties_and_counterforces":{"$ref":"#/$defs/nonblank"}}},"localizedReaderMember":{"type":"object","additionalProperties":true,"required":["title","body"],"properties":{"title":{"$ref":"#/$defs/nonblank"},"body":{"$ref":"#/$defs/nonblank"}}},"bilingualReaderArticle":{"type":"object","additionalProperties":true,"required":["zh_cn","en"],"properties":{"zh_cn":{"$ref":"#/$defs/localizedReaderMember"},"en":{"$ref":"#/$defs/localizedReaderMember"}}},"localizedSummary":{"type":"object","additionalProperties":true,"required":["zh_cn","en"],"properties":{"zh_cn":{"$ref":"#/$defs/nonblank"},"en":{"$ref":"#/$defs/nonblank"}}}}};
const schema251 = {"type":"object","additionalProperties":true,"required":["api_contract","api_version","events","next_cursor","query_hash","response_kind"],"properties":{"api_contract":{"const":"valve-event-public-api"},"api_version":{"const":"v1"},"events":{"type":"array","items":{"$ref":"#/$defs/summary"}},"next_cursor":{"type":["string","null"]},"query_hash":{"$ref":"#/$defs/sha256"},"response_kind":{"const":"VALVE_EVENT_LIST"}}};
const schema268 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const schema252 = {"type":"object","additionalProperties":true,"required":["conclusion_summary","flags","outcome_label","primary_direction","scope_labels","source","status","temporal_mode"],"properties":{"conclusion_summary":{"oneOf":[{"type":"string","minLength":1},{"$ref":"#/$defs/localizedSummary"},{"type":"null"}]},"flags":{"$ref":"#/$defs/flags"},"outcome_label":{"type":["string","null"]},"primary_direction":{"oneOf":[{"$ref":"#/$defs/direction"},{"type":"null"}]},"scope_labels":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"source":{"$ref":"#/$defs/source"},"status":{"$ref":"#/$defs/status"},"temporal_mode":{"oneOf":[{"$ref":"#/$defs/temporalMode"},{"type":"null"}]}}};
const schema256 = {"type":"object","additionalProperties":true,"required":["corrected","source_updated","withdrawn"],"properties":{"corrected":{"type":"boolean"},"source_updated":{"type":"boolean"},"withdrawn":{"type":"boolean"}}};
const schema257 = {"type":"string"};
const schema254 = {"type":"string","minLength":1};
const schema266 = {"type":"string"};
const schema267 = {"type":"string"};
const func2 = __wireUcs2Length;
const schema253 = {"type":"object","additionalProperties":true,"required":["zh_cn","en"],"properties":{"zh_cn":{"$ref":"#/$defs/nonblank"},"en":{"$ref":"#/$defs/nonblank"}}};

function validate166(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate166.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.zh_cn === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "zh_cn"},message:"must have required property '"+"zh_cn"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.en === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "en"},message:"must have required property '"+"en"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.zh_cn !== undefined){
let data0 = data.zh_cn;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err2 = {instancePath:instancePath+"/zh_cn",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err3 = {instancePath:instancePath+"/zh_cn",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.en !== undefined){
let data1 = data.en;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err4 = {instancePath:instancePath+"/en",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err5 = {instancePath:instancePath+"/en",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate166.errors = vErrors;
return errors === 0;
}
validate166.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema259 = {"type":"object","additionalProperties":true,"required":["event_id","first_observed_at","official_published_at","official_title","official_url","source_code","source_notice_version_id","source_updated_at"],"properties":{"event_id":{"$ref":"#/$defs/nonblank"},"first_observed_at":{"$ref":"#/$defs/timestamp"},"official_published_at":{"$ref":"#/$defs/timestamp"},"official_title":{"$ref":"#/$defs/nonblank"},"official_url":{"type":["string","null"],"maxLength":2048},"source_code":{"const":"STEAM_ISteamNews_V2"},"source_notice_version_id":{"$ref":"#/$defs/nonblank"},"source_updated_at":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]}}};
const schema261 = {"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"};
const pattern19 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$", "u");

function validate168(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate168.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.event_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "event_id"},message:"must have required property '"+"event_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.first_observed_at === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "first_observed_at"},message:"must have required property '"+"first_observed_at"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.official_published_at === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "official_published_at"},message:"must have required property '"+"official_published_at"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.official_title === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "official_title"},message:"must have required property '"+"official_title"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.official_url === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "official_url"},message:"must have required property '"+"official_url"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.source_code === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_code"},message:"must have required property '"+"source_code"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.source_notice_version_id === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_notice_version_id"},message:"must have required property '"+"source_notice_version_id"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.source_updated_at === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_updated_at"},message:"must have required property '"+"source_updated_at"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.event_id !== undefined){
let data0 = data.event_id;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err8 = {instancePath:instancePath+"/event_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err9 = {instancePath:instancePath+"/event_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.first_observed_at !== undefined){
let data1 = data.first_observed_at;
if(typeof data1 === "string"){
if(!pattern19.test(data1)){
const err10 = {instancePath:instancePath+"/first_observed_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err11 = {instancePath:instancePath+"/first_observed_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.official_published_at !== undefined){
let data2 = data.official_published_at;
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
const err12 = {instancePath:instancePath+"/official_published_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err13 = {instancePath:instancePath+"/official_published_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.official_title !== undefined){
let data3 = data.official_title;
if(typeof data3 === "string"){
if(func2(data3) < 1){
const err14 = {instancePath:instancePath+"/official_title",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err15 = {instancePath:instancePath+"/official_title",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.official_url !== undefined){
let data4 = data.official_url;
if((typeof data4 !== "string") && (data4 !== null)){
const err16 = {instancePath:instancePath+"/official_url",schemaPath:"#/properties/official_url/type",keyword:"type",params:{type: schema259.properties.official_url.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(typeof data4 === "string"){
if(func2(data4) > 2048){
const err17 = {instancePath:instancePath+"/official_url",schemaPath:"#/properties/official_url/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
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
if(data.source_code !== undefined){
if("STEAM_ISteamNews_V2" !== data.source_code){
const err18 = {instancePath:instancePath+"/source_code",schemaPath:"#/properties/source_code/const",keyword:"const",params:{allowedValue: "STEAM_ISteamNews_V2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.source_notice_version_id !== undefined){
let data6 = data.source_notice_version_id;
if(typeof data6 === "string"){
if(func2(data6) < 1){
const err19 = {instancePath:instancePath+"/source_notice_version_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err20 = {instancePath:instancePath+"/source_notice_version_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.source_updated_at !== undefined){
let data7 = data.source_updated_at;
const _errs21 = errors;
let valid6 = false;
let passing0 = null;
const _errs22 = errors;
if(typeof data7 === "string"){
if(!pattern19.test(data7)){
const err21 = {instancePath:instancePath+"/source_updated_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err22 = {instancePath:instancePath+"/source_updated_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs22 === errors;
if(_valid0){
valid6 = true;
passing0 = 0;
}
const _errs25 = errors;
if(data7 !== null){
const err23 = {instancePath:instancePath+"/source_updated_at",schemaPath:"#/properties/source_updated_at/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
var _valid0 = _errs25 === errors;
if(_valid0 && valid6){
valid6 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid6 = true;
passing0 = 1;
}
}
if(!valid6){
const err24 = {instancePath:instancePath+"/source_updated_at",schemaPath:"#/properties/source_updated_at/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
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
validate168.errors = vErrors;
return errors === 0;
}
validate168.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate165(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate165.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.conclusion_summary === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "conclusion_summary"},message:"must have required property '"+"conclusion_summary"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.flags === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "flags"},message:"must have required property '"+"flags"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.outcome_label === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "outcome_label"},message:"must have required property '"+"outcome_label"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.primary_direction === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "primary_direction"},message:"must have required property '"+"primary_direction"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.scope_labels === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_labels"},message:"must have required property '"+"scope_labels"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.source === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source"},message:"must have required property '"+"source"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.status === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.temporal_mode === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "temporal_mode"},message:"must have required property '"+"temporal_mode"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.conclusion_summary !== undefined){
let data0 = data.conclusion_summary;
const _errs3 = errors;
let valid1 = false;
let passing0 = null;
const _errs4 = errors;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err8 = {instancePath:instancePath+"/conclusion_summary",schemaPath:"#/properties/conclusion_summary/oneOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err9 = {instancePath:instancePath+"/conclusion_summary",schemaPath:"#/properties/conclusion_summary/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid0 = _errs4 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs6 = errors;
if(!(validate166(data0, {instancePath:instancePath+"/conclusion_summary",parentData:data,parentDataProperty:"conclusion_summary",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate166.errors : vErrors.concat(validate166.errors);
errors = vErrors.length;
}
var _valid0 = _errs6 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
const _errs7 = errors;
if(data0 !== null){
const err10 = {instancePath:instancePath+"/conclusion_summary",schemaPath:"#/properties/conclusion_summary/oneOf/2/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs7 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid1 = true;
passing0 = 2;
}
}
}
if(!valid1){
const err11 = {instancePath:instancePath+"/conclusion_summary",schemaPath:"#/properties/conclusion_summary/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
if(data.flags !== undefined){
let data1 = data.flags;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.corrected === undefined){
const err12 = {instancePath:instancePath+"/flags",schemaPath:"#/$defs/flags/required",keyword:"required",params:{missingProperty: "corrected"},message:"must have required property '"+"corrected"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data1.source_updated === undefined){
const err13 = {instancePath:instancePath+"/flags",schemaPath:"#/$defs/flags/required",keyword:"required",params:{missingProperty: "source_updated"},message:"must have required property '"+"source_updated"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data1.withdrawn === undefined){
const err14 = {instancePath:instancePath+"/flags",schemaPath:"#/$defs/flags/required",keyword:"required",params:{missingProperty: "withdrawn"},message:"must have required property '"+"withdrawn"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data1.corrected !== undefined){
if(typeof data1.corrected !== "boolean"){
const err15 = {instancePath:instancePath+"/flags/corrected",schemaPath:"#/$defs/flags/properties/corrected/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data1.source_updated !== undefined){
if(typeof data1.source_updated !== "boolean"){
const err16 = {instancePath:instancePath+"/flags/source_updated",schemaPath:"#/$defs/flags/properties/source_updated/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data1.withdrawn !== undefined){
if(typeof data1.withdrawn !== "boolean"){
const err17 = {instancePath:instancePath+"/flags/withdrawn",schemaPath:"#/$defs/flags/properties/withdrawn/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
const err18 = {instancePath:instancePath+"/flags",schemaPath:"#/$defs/flags/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.outcome_label !== undefined){
let data5 = data.outcome_label;
if((typeof data5 !== "string") && (data5 !== null)){
const err19 = {instancePath:instancePath+"/outcome_label",schemaPath:"#/properties/outcome_label/type",keyword:"type",params:{type: schema252.properties.outcome_label.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.primary_direction !== undefined){
let data6 = data.primary_direction;
const _errs22 = errors;
let valid4 = false;
let passing1 = null;
const _errs23 = errors;
if(typeof data6 !== "string"){
const err20 = {instancePath:instancePath+"/primary_direction",schemaPath:"#/$defs/direction/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid1 = _errs23 === errors;
if(_valid1){
valid4 = true;
passing1 = 0;
}
const _errs26 = errors;
if(data6 !== null){
const err21 = {instancePath:instancePath+"/primary_direction",schemaPath:"#/properties/primary_direction/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
var _valid1 = _errs26 === errors;
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
const err22 = {instancePath:instancePath+"/primary_direction",schemaPath:"#/properties/primary_direction/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
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
if(data.scope_labels !== undefined){
let data7 = data.scope_labels;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if(typeof data8 === "string"){
if(func2(data8) < 1){
const err23 = {instancePath:instancePath+"/scope_labels/" + i0,schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err24 = {instancePath:instancePath+"/scope_labels/" + i0,schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err25 = {instancePath:instancePath+"/scope_labels",schemaPath:"#/properties/scope_labels/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.source !== undefined){
if(!(validate168(data.source, {instancePath:instancePath+"/source",parentData:data,parentDataProperty:"source",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate168.errors : vErrors.concat(validate168.errors);
errors = vErrors.length;
}
}
if(data.status !== undefined){
if(typeof data.status !== "string"){
const err26 = {instancePath:instancePath+"/status",schemaPath:"#/$defs/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.temporal_mode !== undefined){
let data11 = data.temporal_mode;
const _errs38 = errors;
let valid10 = false;
let passing2 = null;
const _errs39 = errors;
if(typeof data11 !== "string"){
const err27 = {instancePath:instancePath+"/temporal_mode",schemaPath:"#/$defs/temporalMode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
var _valid2 = _errs39 === errors;
if(_valid2){
valid10 = true;
passing2 = 0;
}
const _errs42 = errors;
if(data11 !== null){
const err28 = {instancePath:instancePath+"/temporal_mode",schemaPath:"#/properties/temporal_mode/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
var _valid2 = _errs42 === errors;
if(_valid2 && valid10){
valid10 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid10 = true;
passing2 = 1;
}
}
if(!valid10){
const err29 = {instancePath:instancePath+"/temporal_mode",schemaPath:"#/properties/temporal_mode/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
else {
errors = _errs38;
if(vErrors !== null){
if(_errs38){
vErrors.length = _errs38;
}
else {
vErrors = null;
}
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
validate165.errors = vErrors;
return errors === 0;
}
validate165.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");

function validate164(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate164.evaluated;
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
if(data.events === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "events"},message:"must have required property '"+"events"+"'"};
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
if(data.query_hash === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_hash"},message:"must have required property '"+"query_hash"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.response_kind === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.api_contract !== undefined){
if("valve-event-public-api" !== data.api_contract){
const err6 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "valve-event-public-api"},message:"must be equal to constant"};
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
if(data.events !== undefined){
let data2 = data.events;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
if(!(validate165(data2[i0], {instancePath:instancePath+"/events/" + i0,parentData:data2,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate165.errors : vErrors.concat(validate165.errors);
errors = vErrors.length;
}
}
}
else {
const err8 = {instancePath:instancePath+"/events",schemaPath:"#/properties/events/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.next_cursor !== undefined){
let data4 = data.next_cursor;
if((typeof data4 !== "string") && (data4 !== null)){
const err9 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/type",keyword:"type",params:{type: schema251.properties.next_cursor.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.query_hash !== undefined){
let data5 = data.query_hash;
if(typeof data5 === "string"){
if(!pattern5.test(data5)){
const err10 = {instancePath:instancePath+"/query_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err11 = {instancePath:instancePath+"/query_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.response_kind !== undefined){
if("VALVE_EVENT_LIST" !== data.response_kind){
const err12 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "VALVE_EVENT_LIST"},message:"must be equal to constant"};
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
validate164.errors = vErrors;
return errors === 0;
}
validate164.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema269 = {"type":"object","additionalProperties":true,"required":["api_contract","api_version","etag","event","response_kind"],"properties":{"api_contract":{"const":"valve-event-public-api"},"api_version":{"const":"v1"},"etag":{"$ref":"#/$defs/sha256"},"event":{"$ref":"#/$defs/event"},"response_kind":{"const":"VALVE_EVENT_DETAIL"}}};
const schema271 = {"type":"object","additionalProperties":true,"required":["flags","latest_outcome","latest_publication","public_versions","source","status"],"properties":{"flags":{"$ref":"#/$defs/flags"},"latest_outcome":{"oneOf":[{"$ref":"#/$defs/outcome"},{"type":"null"}]},"latest_publication":{"oneOf":[{"$ref":"#/$defs/assessment"},{"type":"null"}]},"public_versions":{"type":"array","items":{"$ref":"#/$defs/version"}},"source":{"$ref":"#/$defs/source"},"status":{"$ref":"#/$defs/status"}}};
const schema273 = {"type":"object","additionalProperties":true,"required":["evidence_status","explanation","label","noise_and_causality_disclosure","observation_cutoff_at","outcome_evaluation_id","outcome_publication_id","policy_release_id","published_at"],"properties":{"evidence_status":{"$ref":"#/$defs/nonblank"},"explanation":{"$ref":"#/$defs/nonblank"},"label":{"type":"string"},"noise_and_causality_disclosure":{"$ref":"#/$defs/nonblank"},"observation_cutoff_at":{"$ref":"#/$defs/timestamp"},"outcome_evaluation_id":{"$ref":"#/$defs/nonblank"},"outcome_publication_id":{"$ref":"#/$defs/nonblank"},"policy_release_id":{"$ref":"#/$defs/nonblank"},"published_at":{"$ref":"#/$defs/timestamp"}}};

function validate174(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate174.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.evidence_status === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_status"},message:"must have required property '"+"evidence_status"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.explanation === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "explanation"},message:"must have required property '"+"explanation"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.label === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "label"},message:"must have required property '"+"label"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.noise_and_causality_disclosure === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "noise_and_causality_disclosure"},message:"must have required property '"+"noise_and_causality_disclosure"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.observation_cutoff_at === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observation_cutoff_at"},message:"must have required property '"+"observation_cutoff_at"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.outcome_evaluation_id === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "outcome_evaluation_id"},message:"must have required property '"+"outcome_evaluation_id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.outcome_publication_id === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "outcome_publication_id"},message:"must have required property '"+"outcome_publication_id"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.policy_release_id === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "policy_release_id"},message:"must have required property '"+"policy_release_id"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.published_at === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at"},message:"must have required property '"+"published_at"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.evidence_status !== undefined){
let data0 = data.evidence_status;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err9 = {instancePath:instancePath+"/evidence_status",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err10 = {instancePath:instancePath+"/evidence_status",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.explanation !== undefined){
let data1 = data.explanation;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err11 = {instancePath:instancePath+"/explanation",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err12 = {instancePath:instancePath+"/explanation",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.label !== undefined){
if(typeof data.label !== "string"){
const err13 = {instancePath:instancePath+"/label",schemaPath:"#/properties/label/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.noise_and_causality_disclosure !== undefined){
let data3 = data.noise_and_causality_disclosure;
if(typeof data3 === "string"){
if(func2(data3) < 1){
const err14 = {instancePath:instancePath+"/noise_and_causality_disclosure",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err15 = {instancePath:instancePath+"/noise_and_causality_disclosure",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.observation_cutoff_at !== undefined){
let data4 = data.observation_cutoff_at;
if(typeof data4 === "string"){
if(!pattern19.test(data4)){
const err16 = {instancePath:instancePath+"/observation_cutoff_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err17 = {instancePath:instancePath+"/observation_cutoff_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.outcome_evaluation_id !== undefined){
let data5 = data.outcome_evaluation_id;
if(typeof data5 === "string"){
if(func2(data5) < 1){
const err18 = {instancePath:instancePath+"/outcome_evaluation_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err19 = {instancePath:instancePath+"/outcome_evaluation_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.outcome_publication_id !== undefined){
let data6 = data.outcome_publication_id;
if(typeof data6 === "string"){
if(func2(data6) < 1){
const err20 = {instancePath:instancePath+"/outcome_publication_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err21 = {instancePath:instancePath+"/outcome_publication_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.policy_release_id !== undefined){
let data7 = data.policy_release_id;
if(typeof data7 === "string"){
if(func2(data7) < 1){
const err22 = {instancePath:instancePath+"/policy_release_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err23 = {instancePath:instancePath+"/policy_release_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data8 = data.published_at;
if(typeof data8 === "string"){
if(!pattern19.test(data8)){
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
validate174.errors = vErrors;
return errors === 0;
}
validate174.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema282 = {"type":"object","additionalProperties":true,"required":["article","claims","context_snapshot_id","context_status","correction_of_publication_id","disclosures","event_cutoff_at","known_at","public_payload_sha256","publication_id","publication_version_no","published_at","source_notice_version_id","temporal_mode"],"properties":{"article":{"$ref":"#/$defs/article"},"claims":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/claim"}},"context_snapshot_id":{"$ref":"#/$defs/nonblank"},"context_status":{"type":"string"},"correction_of_publication_id":{"type":["string","null"]},"disclosures":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/nonblank"}},"event_cutoff_at":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"public_payload_sha256":{"$ref":"#/$defs/sha256"},"publication_id":{"$ref":"#/$defs/nonblank"},"publication_version_no":{"type":"integer","minimum":1},"published_at":{"$ref":"#/$defs/timestamp"},"source_notice_version_id":{"$ref":"#/$defs/nonblank"},"temporal_mode":{"$ref":"#/$defs/temporalMode"}}};
const schema283 = {"oneOf":[{"$ref":"#/$defs/sectionedArticle"},{"$ref":"#/$defs/bilingualReaderArticle"}]};
const schema284 = {"type":"object","additionalProperties":true,"required":["conclusion","factual_summary","observation_and_falsification","scope_analysis","title","transmission_mechanisms","uncertainties_and_counterforces"],"properties":{"conclusion":{"$ref":"#/$defs/nonblank"},"factual_summary":{"$ref":"#/$defs/nonblank"},"observation_and_falsification":{"$ref":"#/$defs/nonblank"},"scope_analysis":{"$ref":"#/$defs/nonblank"},"title":{"$ref":"#/$defs/nonblank"},"transmission_mechanisms":{"$ref":"#/$defs/nonblank"},"uncertainties_and_counterforces":{"$ref":"#/$defs/nonblank"}}};

function validate178(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate178.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.conclusion === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "conclusion"},message:"must have required property '"+"conclusion"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.factual_summary === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "factual_summary"},message:"must have required property '"+"factual_summary"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.observation_and_falsification === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observation_and_falsification"},message:"must have required property '"+"observation_and_falsification"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.scope_analysis === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_analysis"},message:"must have required property '"+"scope_analysis"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.title === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.transmission_mechanisms === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "transmission_mechanisms"},message:"must have required property '"+"transmission_mechanisms"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.uncertainties_and_counterforces === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "uncertainties_and_counterforces"},message:"must have required property '"+"uncertainties_and_counterforces"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.conclusion !== undefined){
let data0 = data.conclusion;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err7 = {instancePath:instancePath+"/conclusion",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err8 = {instancePath:instancePath+"/conclusion",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.factual_summary !== undefined){
let data1 = data.factual_summary;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err9 = {instancePath:instancePath+"/factual_summary",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err10 = {instancePath:instancePath+"/factual_summary",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.observation_and_falsification !== undefined){
let data2 = data.observation_and_falsification;
if(typeof data2 === "string"){
if(func2(data2) < 1){
const err11 = {instancePath:instancePath+"/observation_and_falsification",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err12 = {instancePath:instancePath+"/observation_and_falsification",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.scope_analysis !== undefined){
let data3 = data.scope_analysis;
if(typeof data3 === "string"){
if(func2(data3) < 1){
const err13 = {instancePath:instancePath+"/scope_analysis",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err14 = {instancePath:instancePath+"/scope_analysis",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.title !== undefined){
let data4 = data.title;
if(typeof data4 === "string"){
if(func2(data4) < 1){
const err15 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err16 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.transmission_mechanisms !== undefined){
let data5 = data.transmission_mechanisms;
if(typeof data5 === "string"){
if(func2(data5) < 1){
const err17 = {instancePath:instancePath+"/transmission_mechanisms",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err18 = {instancePath:instancePath+"/transmission_mechanisms",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.uncertainties_and_counterforces !== undefined){
let data6 = data.uncertainties_and_counterforces;
if(typeof data6 === "string"){
if(func2(data6) < 1){
const err19 = {instancePath:instancePath+"/uncertainties_and_counterforces",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err20 = {instancePath:instancePath+"/uncertainties_and_counterforces",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate178.errors = vErrors;
return errors === 0;
}
validate178.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema292 = {"type":"object","additionalProperties":true,"required":["zh_cn","en"],"properties":{"zh_cn":{"$ref":"#/$defs/localizedReaderMember"},"en":{"$ref":"#/$defs/localizedReaderMember"}}};
const schema293 = {"type":"object","additionalProperties":true,"required":["title","body"],"properties":{"title":{"$ref":"#/$defs/nonblank"},"body":{"$ref":"#/$defs/nonblank"}}};

function validate181(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate181.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.title === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.body === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body"},message:"must have required property '"+"body"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.title !== undefined){
let data0 = data.title;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err2 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err3 = {instancePath:instancePath+"/title",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.body !== undefined){
let data1 = data.body;
if(typeof data1 === "string"){
if(func2(data1) < 1){
const err4 = {instancePath:instancePath+"/body",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err5 = {instancePath:instancePath+"/body",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate181.errors = vErrors;
return errors === 0;
}
validate181.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate180(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate180.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.zh_cn === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "zh_cn"},message:"must have required property '"+"zh_cn"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.en === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "en"},message:"must have required property '"+"en"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.zh_cn !== undefined){
if(!(validate181(data.zh_cn, {instancePath:instancePath+"/zh_cn",parentData:data,parentDataProperty:"zh_cn",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate181.errors : vErrors.concat(validate181.errors);
errors = vErrors.length;
}
}
if(data.en !== undefined){
if(!(validate181(data.en, {instancePath:instancePath+"/en",parentData:data,parentDataProperty:"en",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate181.errors : vErrors.concat(validate181.errors);
errors = vErrors.length;
}
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate180.errors = vErrors;
return errors === 0;
}
validate180.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate177(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate177.evaluated;
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
if(!(validate178(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate178.errors : vErrors.concat(validate178.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate180(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate180.errors : vErrors.concat(validate180.errors);
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
validate177.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate177.evaluated = {"dynamicProps":true,"dynamicItems":false};

const schema296 = {"type":"object","additionalProperties":true,"required":["claim_id","direction","falsification_conditions","horizon","limitations","mechanism_codes","observation_targets","reasoning_section_ref","scope_display","scope_kind","scope_ref","tracking_status"],"properties":{"claim_id":{"$ref":"#/$defs/nonblank"},"direction":{"$ref":"#/$defs/direction"},"falsification_conditions":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"horizon":{"type":"string"},"limitations":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"mechanism_codes":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"observation_targets":{"type":"array","items":{"$ref":"#/$defs/nonblank"}},"reasoning_section_ref":{"$ref":"#/$defs/nonblank"},"scope_display":{"$ref":"#/$defs/nonblank"},"scope_kind":{"type":"string"},"scope_ref":{"type":["string","null"]},"tracking_status":{"type":"string"}}};

function validate186(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate186.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.claim_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "claim_id"},message:"must have required property '"+"claim_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.direction === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "direction"},message:"must have required property '"+"direction"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.falsification_conditions === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "falsification_conditions"},message:"must have required property '"+"falsification_conditions"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.horizon === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "horizon"},message:"must have required property '"+"horizon"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.limitations === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "limitations"},message:"must have required property '"+"limitations"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.mechanism_codes === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mechanism_codes"},message:"must have required property '"+"mechanism_codes"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.observation_targets === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observation_targets"},message:"must have required property '"+"observation_targets"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.reasoning_section_ref === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reasoning_section_ref"},message:"must have required property '"+"reasoning_section_ref"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.scope_display === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_display"},message:"must have required property '"+"scope_display"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.scope_kind === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_kind"},message:"must have required property '"+"scope_kind"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.scope_ref === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_ref"},message:"must have required property '"+"scope_ref"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.tracking_status === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tracking_status"},message:"must have required property '"+"tracking_status"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.claim_id !== undefined){
let data0 = data.claim_id;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err12 = {instancePath:instancePath+"/claim_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err13 = {instancePath:instancePath+"/claim_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.direction !== undefined){
if(typeof data.direction !== "string"){
const err14 = {instancePath:instancePath+"/direction",schemaPath:"#/$defs/direction/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.falsification_conditions !== undefined){
let data2 = data.falsification_conditions;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(typeof data3 === "string"){
if(func2(data3) < 1){
const err15 = {instancePath:instancePath+"/falsification_conditions/" + i0,schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err16 = {instancePath:instancePath+"/falsification_conditions/" + i0,schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err17 = {instancePath:instancePath+"/falsification_conditions",schemaPath:"#/properties/falsification_conditions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.horizon !== undefined){
if(typeof data.horizon !== "string"){
const err18 = {instancePath:instancePath+"/horizon",schemaPath:"#/properties/horizon/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.limitations !== undefined){
let data5 = data.limitations;
if(Array.isArray(data5)){
const len1 = data5.length;
for(let i1=0; i1<len1; i1++){
let data6 = data5[i1];
if(typeof data6 === "string"){
if(func2(data6) < 1){
const err19 = {instancePath:instancePath+"/limitations/" + i1,schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err20 = {instancePath:instancePath+"/limitations/" + i1,schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err21 = {instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.mechanism_codes !== undefined){
let data7 = data.mechanism_codes;
if(Array.isArray(data7)){
const len2 = data7.length;
for(let i2=0; i2<len2; i2++){
let data8 = data7[i2];
if(typeof data8 === "string"){
if(func2(data8) < 1){
const err22 = {instancePath:instancePath+"/mechanism_codes/" + i2,schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err23 = {instancePath:instancePath+"/mechanism_codes/" + i2,schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err24 = {instancePath:instancePath+"/mechanism_codes",schemaPath:"#/properties/mechanism_codes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.observation_targets !== undefined){
let data9 = data.observation_targets;
if(Array.isArray(data9)){
const len3 = data9.length;
for(let i3=0; i3<len3; i3++){
let data10 = data9[i3];
if(typeof data10 === "string"){
if(func2(data10) < 1){
const err25 = {instancePath:instancePath+"/observation_targets/" + i3,schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err26 = {instancePath:instancePath+"/observation_targets/" + i3,schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err27 = {instancePath:instancePath+"/observation_targets",schemaPath:"#/properties/observation_targets/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.reasoning_section_ref !== undefined){
let data11 = data.reasoning_section_ref;
if(typeof data11 === "string"){
if(func2(data11) < 1){
const err28 = {instancePath:instancePath+"/reasoning_section_ref",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err29 = {instancePath:instancePath+"/reasoning_section_ref",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.scope_display !== undefined){
let data12 = data.scope_display;
if(typeof data12 === "string"){
if(func2(data12) < 1){
const err30 = {instancePath:instancePath+"/scope_display",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err31 = {instancePath:instancePath+"/scope_display",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(typeof data.scope_kind !== "string"){
const err32 = {instancePath:instancePath+"/scope_kind",schemaPath:"#/properties/scope_kind/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.scope_ref !== undefined){
let data14 = data.scope_ref;
if((typeof data14 !== "string") && (data14 !== null)){
const err33 = {instancePath:instancePath+"/scope_ref",schemaPath:"#/properties/scope_ref/type",keyword:"type",params:{type: schema296.properties.scope_ref.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.tracking_status !== undefined){
if(typeof data.tracking_status !== "string"){
const err34 = {instancePath:instancePath+"/tracking_status",schemaPath:"#/properties/tracking_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err35 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
validate186.errors = vErrors;
return errors === 0;
}
validate186.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate176(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate176.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.article === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "article"},message:"must have required property '"+"article"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.claims === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "claims"},message:"must have required property '"+"claims"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.context_snapshot_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "context_snapshot_id"},message:"must have required property '"+"context_snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.context_status === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "context_status"},message:"must have required property '"+"context_status"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.correction_of_publication_id === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "correction_of_publication_id"},message:"must have required property '"+"correction_of_publication_id"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.disclosures === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "disclosures"},message:"must have required property '"+"disclosures"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.event_cutoff_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "event_cutoff_at"},message:"must have required property '"+"event_cutoff_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.known_at === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "known_at"},message:"must have required property '"+"known_at"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.public_payload_sha256 === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "public_payload_sha256"},message:"must have required property '"+"public_payload_sha256"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.publication_id === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication_id"},message:"must have required property '"+"publication_id"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.publication_version_no === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication_version_no"},message:"must have required property '"+"publication_version_no"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.published_at === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at"},message:"must have required property '"+"published_at"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.source_notice_version_id === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_notice_version_id"},message:"must have required property '"+"source_notice_version_id"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.temporal_mode === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "temporal_mode"},message:"must have required property '"+"temporal_mode"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.article !== undefined){
if(!(validate177(data.article, {instancePath:instancePath+"/article",parentData:data,parentDataProperty:"article",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate177.errors : vErrors.concat(validate177.errors);
errors = vErrors.length;
}
}
if(data.claims !== undefined){
let data1 = data.claims;
if(Array.isArray(data1)){
if(data1.length < 1){
const err14 = {instancePath:instancePath+"/claims",schemaPath:"#/properties/claims/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
if(!(validate186(data1[i0], {instancePath:instancePath+"/claims/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate186.errors : vErrors.concat(validate186.errors);
errors = vErrors.length;
}
}
}
else {
const err15 = {instancePath:instancePath+"/claims",schemaPath:"#/properties/claims/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.context_snapshot_id !== undefined){
let data3 = data.context_snapshot_id;
if(typeof data3 === "string"){
if(func2(data3) < 1){
const err16 = {instancePath:instancePath+"/context_snapshot_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err17 = {instancePath:instancePath+"/context_snapshot_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.context_status !== undefined){
if(typeof data.context_status !== "string"){
const err18 = {instancePath:instancePath+"/context_status",schemaPath:"#/properties/context_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.correction_of_publication_id !== undefined){
let data5 = data.correction_of_publication_id;
if((typeof data5 !== "string") && (data5 !== null)){
const err19 = {instancePath:instancePath+"/correction_of_publication_id",schemaPath:"#/properties/correction_of_publication_id/type",keyword:"type",params:{type: schema282.properties.correction_of_publication_id.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.disclosures !== undefined){
let data6 = data.disclosures;
if(Array.isArray(data6)){
if(data6.length < 1){
const err20 = {instancePath:instancePath+"/disclosures",schemaPath:"#/properties/disclosures/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
const len1 = data6.length;
for(let i1=0; i1<len1; i1++){
let data7 = data6[i1];
if(typeof data7 === "string"){
if(func2(data7) < 1){
const err21 = {instancePath:instancePath+"/disclosures/" + i1,schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err22 = {instancePath:instancePath+"/disclosures/" + i1,schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err23 = {instancePath:instancePath+"/disclosures",schemaPath:"#/properties/disclosures/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.event_cutoff_at !== undefined){
let data8 = data.event_cutoff_at;
if(typeof data8 === "string"){
if(!pattern19.test(data8)){
const err24 = {instancePath:instancePath+"/event_cutoff_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err25 = {instancePath:instancePath+"/event_cutoff_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.known_at !== undefined){
let data9 = data.known_at;
if(typeof data9 === "string"){
if(!pattern19.test(data9)){
const err26 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err27 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.public_payload_sha256 !== undefined){
let data10 = data.public_payload_sha256;
if(typeof data10 === "string"){
if(!pattern5.test(data10)){
const err28 = {instancePath:instancePath+"/public_payload_sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err29 = {instancePath:instancePath+"/public_payload_sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.publication_id !== undefined){
let data11 = data.publication_id;
if(typeof data11 === "string"){
if(func2(data11) < 1){
const err30 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err31 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.publication_version_no !== undefined){
let data12 = data.publication_version_no;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err32 = {instancePath:instancePath+"/publication_version_no",schemaPath:"#/properties/publication_version_no/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 < 1 || isNaN(data12)){
const err33 = {instancePath:instancePath+"/publication_version_no",schemaPath:"#/properties/publication_version_no/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.published_at !== undefined){
let data13 = data.published_at;
if(typeof data13 === "string"){
if(!pattern19.test(data13)){
const err34 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err35 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.source_notice_version_id !== undefined){
let data14 = data.source_notice_version_id;
if(typeof data14 === "string"){
if(func2(data14) < 1){
const err36 = {instancePath:instancePath+"/source_notice_version_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err37 = {instancePath:instancePath+"/source_notice_version_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.temporal_mode !== undefined){
if(typeof data.temporal_mode !== "string"){
const err38 = {instancePath:instancePath+"/temporal_mode",schemaPath:"#/$defs/temporalMode/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate176.errors = vErrors;
return errors === 0;
}
validate176.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema314 = {"type":"object","additionalProperties":true,"required":["publication_id","publication_version_no","published_at","temporal_mode","withdrawal_reason","withdrawn"],"properties":{"publication_id":{"$ref":"#/$defs/nonblank"},"publication_version_no":{"type":"integer","minimum":1},"published_at":{"$ref":"#/$defs/timestamp"},"temporal_mode":{"$ref":"#/$defs/temporalMode"},"withdrawal_reason":{"type":["string","null"]},"withdrawn":{"type":"boolean"}}};

function validate189(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate189.evaluated;
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
if(data.publication_version_no === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publication_version_no"},message:"must have required property '"+"publication_version_no"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.published_at === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at"},message:"must have required property '"+"published_at"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.temporal_mode === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "temporal_mode"},message:"must have required property '"+"temporal_mode"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.withdrawal_reason === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "withdrawal_reason"},message:"must have required property '"+"withdrawal_reason"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.withdrawn === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "withdrawn"},message:"must have required property '"+"withdrawn"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.publication_id !== undefined){
let data0 = data.publication_id;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err6 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/nonblank/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err7 = {instancePath:instancePath+"/publication_id",schemaPath:"#/$defs/nonblank/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.publication_version_no !== undefined){
let data1 = data.publication_version_no;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err8 = {instancePath:instancePath+"/publication_version_no",schemaPath:"#/properties/publication_version_no/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 < 1 || isNaN(data1)){
const err9 = {instancePath:instancePath+"/publication_version_no",schemaPath:"#/properties/publication_version_no/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.published_at !== undefined){
let data2 = data.published_at;
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
const err10 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err11 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.temporal_mode !== undefined){
if(typeof data.temporal_mode !== "string"){
const err12 = {instancePath:instancePath+"/temporal_mode",schemaPath:"#/$defs/temporalMode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.withdrawal_reason !== undefined){
let data4 = data.withdrawal_reason;
if((typeof data4 !== "string") && (data4 !== null)){
const err13 = {instancePath:instancePath+"/withdrawal_reason",schemaPath:"#/properties/withdrawal_reason/type",keyword:"type",params:{type: schema314.properties.withdrawal_reason.type},message:"must be string,null"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.withdrawn !== undefined){
if(typeof data.withdrawn !== "boolean"){
const err14 = {instancePath:instancePath+"/withdrawn",schemaPath:"#/properties/withdrawn/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
validate189.errors = vErrors;
return errors === 0;
}
validate189.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate173(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate173.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.flags === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "flags"},message:"must have required property '"+"flags"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.latest_outcome === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "latest_outcome"},message:"must have required property '"+"latest_outcome"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.latest_publication === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "latest_publication"},message:"must have required property '"+"latest_publication"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.public_versions === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "public_versions"},message:"must have required property '"+"public_versions"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.source === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source"},message:"must have required property '"+"source"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.status === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.flags !== undefined){
let data0 = data.flags;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.corrected === undefined){
const err6 = {instancePath:instancePath+"/flags",schemaPath:"#/$defs/flags/required",keyword:"required",params:{missingProperty: "corrected"},message:"must have required property '"+"corrected"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data0.source_updated === undefined){
const err7 = {instancePath:instancePath+"/flags",schemaPath:"#/$defs/flags/required",keyword:"required",params:{missingProperty: "source_updated"},message:"must have required property '"+"source_updated"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data0.withdrawn === undefined){
const err8 = {instancePath:instancePath+"/flags",schemaPath:"#/$defs/flags/required",keyword:"required",params:{missingProperty: "withdrawn"},message:"must have required property '"+"withdrawn"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data0.corrected !== undefined){
if(typeof data0.corrected !== "boolean"){
const err9 = {instancePath:instancePath+"/flags/corrected",schemaPath:"#/$defs/flags/properties/corrected/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data0.source_updated !== undefined){
if(typeof data0.source_updated !== "boolean"){
const err10 = {instancePath:instancePath+"/flags/source_updated",schemaPath:"#/$defs/flags/properties/source_updated/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data0.withdrawn !== undefined){
if(typeof data0.withdrawn !== "boolean"){
const err11 = {instancePath:instancePath+"/flags/withdrawn",schemaPath:"#/$defs/flags/properties/withdrawn/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
const err12 = {instancePath:instancePath+"/flags",schemaPath:"#/$defs/flags/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.latest_outcome !== undefined){
let data4 = data.latest_outcome;
const _errs13 = errors;
let valid3 = false;
let passing0 = null;
const _errs14 = errors;
if(!(validate174(data4, {instancePath:instancePath+"/latest_outcome",parentData:data,parentDataProperty:"latest_outcome",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate174.errors : vErrors.concat(validate174.errors);
errors = vErrors.length;
}
var _valid0 = _errs14 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs15 = errors;
if(data4 !== null){
const err13 = {instancePath:instancePath+"/latest_outcome",schemaPath:"#/properties/latest_outcome/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
var _valid0 = _errs15 === errors;
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
const err14 = {instancePath:instancePath+"/latest_outcome",schemaPath:"#/properties/latest_outcome/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
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
}
if(data.latest_publication !== undefined){
let data5 = data.latest_publication;
const _errs18 = errors;
let valid4 = false;
let passing1 = null;
const _errs19 = errors;
if(!(validate176(data5, {instancePath:instancePath+"/latest_publication",parentData:data,parentDataProperty:"latest_publication",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate176.errors : vErrors.concat(validate176.errors);
errors = vErrors.length;
}
var _valid1 = _errs19 === errors;
if(_valid1){
valid4 = true;
passing1 = 0;
}
const _errs20 = errors;
if(data5 !== null){
const err15 = {instancePath:instancePath+"/latest_publication",schemaPath:"#/properties/latest_publication/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid1 = _errs20 === errors;
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
const err16 = {instancePath:instancePath+"/latest_publication",schemaPath:"#/properties/latest_publication/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
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
if(data.public_versions !== undefined){
let data6 = data.public_versions;
if(Array.isArray(data6)){
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
if(!(validate189(data6[i0], {instancePath:instancePath+"/public_versions/" + i0,parentData:data6,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate189.errors : vErrors.concat(validate189.errors);
errors = vErrors.length;
}
}
}
else {
const err17 = {instancePath:instancePath+"/public_versions",schemaPath:"#/properties/public_versions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.source !== undefined){
if(!(validate168(data.source, {instancePath:instancePath+"/source",parentData:data,parentDataProperty:"source",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate168.errors : vErrors.concat(validate168.errors);
errors = vErrors.length;
}
}
if(data.status !== undefined){
if(typeof data.status !== "string"){
const err18 = {instancePath:instancePath+"/status",schemaPath:"#/$defs/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate173.errors = vErrors;
return errors === 0;
}
validate173.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate172(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate172.evaluated;
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
if(data.etag === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "etag"},message:"must have required property '"+"etag"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.event === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "event"},message:"must have required property '"+"event"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.response_kind === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "response_kind"},message:"must have required property '"+"response_kind"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.api_contract !== undefined){
if("valve-event-public-api" !== data.api_contract){
const err5 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "valve-event-public-api"},message:"must be equal to constant"};
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
if(data.etag !== undefined){
let data2 = data.etag;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err7 = {instancePath:instancePath+"/etag",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}$"},message:"must match pattern \""+"^[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/etag",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.event !== undefined){
if(!(validate173(data.event, {instancePath:instancePath+"/event",parentData:data,parentDataProperty:"event",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate173.errors : vErrors.concat(validate173.errors);
errors = vErrors.length;
}
}
if(data.response_kind !== undefined){
if("VALVE_EVENT_DETAIL" !== data.response_kind){
const err9 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "VALVE_EVENT_DETAIL"},message:"must be equal to constant"};
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
validate172.errors = vErrors;
return errors === 0;
}
validate172.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate163(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://cs2.example.invalid/schemas/valve-event-public-api-v1.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate163.evaluated;
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
if(!(validate164(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate164.errors : vErrors.concat(validate164.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate172(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate172.errors : vErrors.concat(validate172.errors);
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
validate163.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate163.evaluated = {"dynamicProps":true,"dynamicItems":false};
