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
export const validateCatalogDisplaySnapshotApiResponse = validate114;
const schema191 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:catalog-display-snapshot-api:v1","title":"Catalog display sealed snapshot discovery API V1","oneOf":[{"$ref":"#/$defs/listResponse"},{"$ref":"#/$defs/errorResponse"}],"$defs":{"timestamp":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},"sha256":{"type":"string","pattern":"^[0-9a-f]{64}$"},"snapshot":{"type":"object","additionalProperties":false,"required":["as_of","available_at","catalog_version","member_count","member_set_hash","snapshot_id"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_version":{"type":"string","minLength":1,"maxLength":128,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"member_count":{"type":"integer","minimum":0},"member_set_hash":{"$ref":"#/$defs/sha256"}}},"query":{"type":"object","additionalProperties":false,"required":["known_at","page_size","query_as_of","sort"],"properties":{"known_at":{"$ref":"#/$defs/timestamp"},"page_size":{"type":"integer","minimum":1,"maximum":200},"query_as_of":{"$ref":"#/$defs/timestamp"},"sort":{"const":"AS_OF_DESC"}}},"listResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","members","next_cursor","query","response_kind"],"properties":{"api_contract":{"const":"catalog-display-snapshot-api"},"api_version":{"const":"v1"},"response_kind":{"const":"CATALOG_DISPLAY_SNAPSHOT_LIST"},"query":{"$ref":"#/$defs/query"},"members":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/snapshot"}},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]}}},"errorResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"catalog-display-snapshot-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","CONTRACT_UNAVAILABLE","RECORD_CORRUPT","BACKEND_UNAVAILABLE"]},"http_status":{"enum":[400,503]},"retryable":{"type":"boolean"}}}}}}};
const schema201 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","error"],"properties":{"api_contract":{"const":"catalog-display-snapshot-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"error":{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","CONTRACT_UNAVAILABLE","RECORD_CORRUPT","BACKEND_UNAVAILABLE"]},"http_status":{"enum":[400,503]},"retryable":{"type":"boolean"}}}}};
const schema192 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","members","next_cursor","query","response_kind"],"properties":{"api_contract":{"const":"catalog-display-snapshot-api"},"api_version":{"const":"v1"},"response_kind":{"const":"CATALOG_DISPLAY_SNAPSHOT_LIST"},"query":{"$ref":"#/$defs/query"},"members":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/snapshot"}},"next_cursor":{"oneOf":[{"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+$"},{"type":"null"}]}}};
const schema193 = {"type":"object","additionalProperties":false,"required":["known_at","page_size","query_as_of","sort"],"properties":{"known_at":{"$ref":"#/$defs/timestamp"},"page_size":{"type":"integer","minimum":1,"maximum":200},"query_as_of":{"$ref":"#/$defs/timestamp"},"sort":{"const":"AS_OF_DESC"}}};
const schema194 = {"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"};
const pattern19 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$", "u");

function validate116(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate116.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.known_at === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "known_at"},message:"must have required property '"+"known_at"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.page_size === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.query_as_of === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_as_of"},message:"must have required property '"+"query_as_of"+"'"};
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
for(const key0 in data){
if(!((((key0 === "known_at") || (key0 === "page_size")) || (key0 === "query_as_of")) || (key0 === "sort"))){
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
if(data.known_at !== undefined){
let data0 = data.known_at;
if(typeof data0 === "string"){
if(!pattern19.test(data0)){
const err5 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err6 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data1 = data.page_size;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err7 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 200 || isNaN(data1)){
const err8 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 200},message:"must be <= 200"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1 < 1 || isNaN(data1)){
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
if(data.query_as_of !== undefined){
let data2 = data.query_as_of;
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
const err10 = {instancePath:instancePath+"/query_as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z$"+"\""};
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
const err11 = {instancePath:instancePath+"/query_as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.sort !== undefined){
if("AS_OF_DESC" !== data.sort){
const err12 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/const",keyword:"const",params:{allowedValue: "AS_OF_DESC"},message:"must be equal to constant"};
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
validate116.errors = vErrors;
return errors === 0;
}
validate116.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema196 = {"type":"object","additionalProperties":false,"required":["as_of","available_at","catalog_version","member_count","member_set_hash","snapshot_id"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_version":{"type":"string","minLength":1,"maxLength":128,"pattern":"^[^\\u0000-\\u001f\\u007f]+$"},"as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"member_count":{"type":"integer","minimum":0},"member_set_hash":{"$ref":"#/$defs/sha256"}}};
const schema197 = {"type":"string","pattern":"^[0-9a-f]{64}$"};
const pattern5 = new RegExp("^[0-9a-f]{64}$", "u");
const pattern87 = new RegExp("^[^\\u0000-\\u001f\\u007f]+$", "u");
const func2 = __wireUcs2Length;

function validate118(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate118.evaluated;
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
if(data.available_at === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
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
if(data.member_count === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_count"},message:"must have required property '"+"member_count"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.member_set_hash === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "member_set_hash"},message:"must have required property '"+"member_set_hash"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.snapshot_id === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
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
if(func2(data1) > 128){
const err9 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(func2(data1) < 1){
const err10 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!pattern87.test(data1)){
const err11 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f]+$"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f]+$"+"\""};
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
const err12 = {instancePath:instancePath+"/catalog_version",schemaPath:"#/properties/catalog_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate118.errors = vErrors;
return errors === 0;
}
validate118.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const pattern73 = new RegExp("^[A-Za-z0-9_-]+$", "u");

function validate115(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate115.evaluated;
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
if(data.members === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "members"},message:"must have required property '"+"members"+"'"};
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
if(data.query === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
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
if("catalog-display-snapshot-api" !== data.api_contract){
const err7 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "catalog-display-snapshot-api"},message:"must be equal to constant"};
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
if("CATALOG_DISPLAY_SNAPSHOT_LIST" !== data.response_kind){
const err9 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "CATALOG_DISPLAY_SNAPSHOT_LIST"},message:"must be equal to constant"};
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
if(!(validate116(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate116.errors : vErrors.concat(validate116.errors);
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
if(!(validate118(data4[i0], {instancePath:instancePath+"/members/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate118.errors : vErrors.concat(validate118.errors);
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
validate115.errors = vErrors;
return errors === 0;
}
validate115.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate114(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:catalog-display-snapshot-api:v1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate114.evaluated;
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
if(!(validate115(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
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
if("catalog-display-snapshot-api" !== data.api_contract){
const err5 = {instancePath:instancePath+"/api_contract",schemaPath:"#/$defs/errorResponse/properties/api_contract/const",keyword:"const",params:{allowedValue: "catalog-display-snapshot-api"},message:"must be equal to constant"};
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
if(data3.http_status === undefined){
const err9 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data3.retryable === undefined){
const err10 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
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
const err11 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
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
if(!(((((data4 === "INVALID_ARGUMENT") || (data4 === "INVALID_CURSOR")) || (data4 === "CONTRACT_UNAVAILABLE")) || (data4 === "RECORD_CORRUPT")) || (data4 === "BACKEND_UNAVAILABLE"))){
const err12 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/errorResponse/properties/error/properties/code/enum",keyword:"enum",params:{allowedValues: schema201.properties.error.properties.code.enum},message:"must be equal to one of the allowed values"};
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
let data5 = data3.http_status;
if(!((data5 === 400) || (data5 === 503))){
const err13 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/errorResponse/properties/error/properties/http_status/enum",keyword:"enum",params:{allowedValues: schema201.properties.error.properties.http_status.enum},message:"must be equal to one of the allowed values"};
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
if(typeof data3.retryable !== "boolean"){
const err14 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/errorResponse/properties/error/properties/retryable/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
const err15 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/errorResponse/properties/error/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err16 = {instancePath,schemaPath:"#/$defs/errorResponse/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
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
const err17 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
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
validate114.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate114.evaluated = {"dynamicProps":true,"dynamicItems":false};
