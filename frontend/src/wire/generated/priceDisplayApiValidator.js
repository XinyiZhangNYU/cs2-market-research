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
export const validatePriceDisplayApiResponse = validate201;
const schema329 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:cs2-research:price-display-api:v1","title":"Immutable native and bicurrency price display API V1","oneOf":[{"$ref":"#/$defs/snapshotListResponse"},{"$ref":"#/$defs/itemResponse"},{"$ref":"#/$defs/historyResponse"},{"$ref":"#/$defs/errorResponse"}],"$defs":{"timestamp":{"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},"date":{"type":"string","format":"date","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}(?![\\s\\S])"},"sha256":{"type":"string","pattern":"^[0-9a-f]{64}(?![\\s\\S])"},"identifier":{"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f\\ud800-\\udfff]+(?![\\s\\S])"},"itemId":{"type":"string","pattern":"^[1-9][0-9]{0,18}(?![\\s\\S])"},"usdValue":{"type":"string","pattern":"^(?:0|[1-9][0-9]{0,29})\\.[0-9]{8}(?![\\s\\S])"},"cnyValue":{"type":"string","pattern":"^(?:0|[1-9][0-9]{0,16})\\.[0-9]{2}(?![\\s\\S])"},"minorValue":{"type":"string","pattern":"^(?:0|[1-9][0-9]{0,18})(?![\\s\\S])"},"rateValue":{"type":"string","pattern":"^(?:0|[1-9][0-9]{0,19})\\.[0-9]{18}(?![\\s\\S])","not":{"const":"0.000000000000000000"}},"currency":{"enum":["USD","CNY"]},"sourceReason":{"enum":["SOURCE_UNAVAILABLE","CAPTURE_GAP","SOURCE_CONFLICT"]},"amountReason":{"enum":["SOURCE_UNAVAILABLE","CAPTURE_GAP","SOURCE_CONFLICT","NO_ELIGIBLE_FX","FX_STALE","AMOUNT_OUT_OF_RANGE"]},"sourcePrice":{"type":"object","additionalProperties":false,"required":["value","currency","unit","normalized_fraction_digits","upstream_fraction_digits"],"properties":{"value":{"type":"string","minLength":1,"maxLength":39},"currency":{"$ref":"#/$defs/currency"},"unit":{"enum":["USD_DECIMAL","CNY_MINOR"]},"normalized_fraction_digits":{"type":"integer","enum":[0,8]},"upstream_fraction_digits":{"oneOf":[{"type":"integer","minimum":0,"maximum":9007199254740991},{"type":"null"}]}},"allOf":[{"if":{"properties":{"unit":{"const":"USD_DECIMAL"}},"required":["unit"]},"then":{"properties":{"value":{"$ref":"#/$defs/usdValue"},"currency":{"const":"USD"},"normalized_fraction_digits":{"const":8}}}},{"if":{"properties":{"unit":{"const":"CNY_MINOR"}},"required":["unit"]},"then":{"properties":{"value":{"$ref":"#/$defs/minorValue"},"currency":{"const":"CNY"},"normalized_fraction_digits":{"const":0}}}}]},"availableAmount":{"type":"object","additionalProperties":false,"required":["status","currency","amount","scale","basis","rounding","reason"],"properties":{"status":{"const":"AVAILABLE"},"currency":{"$ref":"#/$defs/currency"},"amount":{"type":"string"},"scale":{"type":"integer","enum":[2,8]},"basis":{"enum":["NATIVE","FX_DERIVED"]},"rounding":{"enum":["EXACT","ROUNDED","ROUNDED_TO_ZERO"]},"reason":{"type":"null"}},"allOf":[{"if":{"properties":{"currency":{"const":"USD"}},"required":["currency"]},"then":{"properties":{"amount":{"$ref":"#/$defs/usdValue"},"scale":{"const":8}}}},{"if":{"properties":{"currency":{"const":"CNY"}},"required":["currency"]},"then":{"properties":{"amount":{"$ref":"#/$defs/cnyValue"},"scale":{"const":2}}}},{"if":{"properties":{"basis":{"const":"NATIVE"}},"required":["basis"]},"then":{"properties":{"rounding":{"const":"EXACT"}}}},{"if":{"properties":{"rounding":{"const":"ROUNDED_TO_ZERO"}},"required":["rounding"]},"then":{"properties":{"amount":{"enum":["0.00","0.00000000"]}}}}]},"unavailableAmount":{"type":"object","additionalProperties":false,"required":["status","currency","amount","scale","basis","rounding","reason"],"properties":{"status":{"const":"UNAVAILABLE"},"currency":{"$ref":"#/$defs/currency"},"amount":{"type":"null"},"scale":{"type":"null"},"basis":{"type":"null"},"rounding":{"type":"null"},"reason":{"$ref":"#/$defs/amountReason"}}},"amount":{"oneOf":[{"$ref":"#/$defs/availableAmount"},{"$ref":"#/$defs/unavailableAmount"}]},"amounts":{"type":"object","additionalProperties":false,"required":["USD","CNY"],"properties":{"USD":{"allOf":[{"$ref":"#/$defs/amount"},{"properties":{"currency":{"const":"USD"}}}]},"CNY":{"allOf":[{"$ref":"#/$defs/amount"},{"properties":{"currency":{"const":"CNY"}}}]}}},"source":{"type":"object","additionalProperties":false,"required":["quote_origin","logical_market","transport"],"properties":{"quote_origin":{"enum":["SOURCE_QUOTE","PROVIDER_AGGREGATE"]},"logical_market":{"enum":["market_a","market_c","market_b",null]},"transport":{"enum":["upstream","market_b_direct"]}},"allOf":[{"if":{"properties":{"quote_origin":{"const":"PROVIDER_AGGREGATE"}},"required":["quote_origin"]},"then":{"properties":{"logical_market":{"type":"null"},"transport":{"const":"upstream"}}},"else":{"properties":{"logical_market":{"enum":["market_a","market_c","market_b"]}}}},{"if":{"properties":{"transport":{"const":"market_b_direct"}},"required":["transport"]},"then":{"properties":{"quote_origin":{"const":"SOURCE_QUOTE"},"logical_market":{"const":"market_b"}}}}]},"fx":{"type":"object","additionalProperties":false,"required":["public_rate_id","authority","method","source_event_date","cny_per_usd","carry_days","available_at","cny_valid_from","usd_valid_from","fx_selection_policy_version","conversion_policy_version","usage"],"properties":{"public_rate_id":{"$ref":"#/$defs/sha256"},"authority":{"const":"ECB"},"method":{"const":"ECB_EUR_CROSS"},"source_event_date":{"$ref":"#/$defs/date"},"cny_per_usd":{"$ref":"#/$defs/rateValue"},"carry_days":{"type":"integer","minimum":0,"maximum":7},"available_at":{"$ref":"#/$defs/timestamp"},"cny_valid_from":{"$ref":"#/$defs/timestamp"},"usd_valid_from":{"$ref":"#/$defs/timestamp"},"fx_selection_policy_version":{"const":"ecb-eur-cross-daily/2"},"conversion_policy_version":{"enum":["price-display-bicurrency/1","ecb-eur-cross-daily/2"]},"usage":{"const":"PRICE_DISPLAY_ONLY"}}},"nullableTimestamp":{"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]},"quote":{"type":"object","additionalProperties":false,"required":["quote_id","analysis_unit_id","item_id","quote_kind","source","bucket_at","observed_at","time_basis","source_updated_at","source_collected_at","source_available_at","identity_available_at","identity_policy","late_bound","source_price","source_price_reason","amounts","fx","available_at"],"properties":{"quote_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"item_id":{"$ref":"#/$defs/itemId"},"quote_kind":{"enum":["ASK","BID"]},"source":{"$ref":"#/$defs/source"},"bucket_at":{"$ref":"#/$defs/nullableTimestamp"},"observed_at":{"$ref":"#/$defs/nullableTimestamp"},"time_basis":{"enum":["BUCKET_AT","OBSERVED_AT","UNAVAILABLE"]},"source_updated_at":{"$ref":"#/$defs/nullableTimestamp"},"source_collected_at":{"$ref":"#/$defs/nullableTimestamp"},"source_available_at":{"$ref":"#/$defs/timestamp"},"identity_available_at":{"$ref":"#/$defs/timestamp"},"identity_policy":{"enum":["CATALOG_SNAPSHOT_EXACT_ITEM_V1","CURRENT_EXACT_MHN_LATE_BIND_V1"]},"late_bound":{"type":"boolean"},"source_price":{"oneOf":[{"$ref":"#/$defs/sourcePrice"},{"type":"null"}]},"source_price_reason":{"oneOf":[{"$ref":"#/$defs/sourceReason"},{"type":"null"}]},"amounts":{"$ref":"#/$defs/amounts"},"fx":{"oneOf":[{"$ref":"#/$defs/fx"},{"type":"null"}]},"available_at":{"$ref":"#/$defs/timestamp"}},"allOf":[{"if":{"properties":{"source_price":{"type":"null"}},"required":["source_price"]},"then":{"properties":{"source_price_reason":{"$ref":"#/$defs/sourceReason"},"fx":{"type":"null"},"amounts":{"properties":{"USD":{"$ref":"#/$defs/unavailableAmount"},"CNY":{"$ref":"#/$defs/unavailableAmount"}}}}},"else":{"properties":{"source_price_reason":{"type":"null"}}}},{"if":{"properties":{"time_basis":{"const":"BUCKET_AT"}},"required":["time_basis"]},"then":{"properties":{"bucket_at":{"$ref":"#/$defs/timestamp"}}}},{"if":{"properties":{"time_basis":{"const":"OBSERVED_AT"}},"required":["time_basis"]},"then":{"properties":{"bucket_at":{"type":"null"},"observed_at":{"$ref":"#/$defs/timestamp"}}}},{"if":{"properties":{"time_basis":{"const":"UNAVAILABLE"}},"required":["time_basis"]},"then":{"properties":{"bucket_at":{"type":"null"},"observed_at":{"type":"null"},"fx":{"type":"null"},"source_price":{"$ref":"#/$defs/sourcePrice"}}}},{"if":{"properties":{"identity_policy":{"const":"CURRENT_EXACT_MHN_LATE_BIND_V1"}},"required":["identity_policy"]},"then":{"properties":{"late_bound":{"const":true}}},"else":{"properties":{"late_bound":{"const":false}}}}]},"snapshot":{"type":"object","additionalProperties":false,"required":["snapshot_id","catalog_snapshot_id","catalog_as_of","catalog_available_at","market_as_of","available_at","published_at","kind","price_policy_version"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_as_of":{"$ref":"#/$defs/timestamp"},"catalog_available_at":{"$ref":"#/$defs/timestamp"},"market_as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"kind":{"enum":["CURRENT","HISTORY"]},"price_policy_version":{"const":"price-display-read/1"}}},"snapshotQuery":{"type":"object","additionalProperties":false,"required":["query_as_of","known_at","catalog_snapshot_id","kind","page_size","sort"],"properties":{"query_as_of":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"catalog_snapshot_id":{"$ref":"#/$defs/sha256"},"kind":{"enum":["CURRENT","HISTORY"]},"page_size":{"type":"integer","minimum":1,"maximum":20},"sort":{"const":"MARKET_AS_OF_DESC"}}},"itemQuery":{"type":"object","additionalProperties":false,"required":["analysis_unit_id","snapshot_id","as_of","known_at"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"snapshot_id":{"$ref":"#/$defs/sha256"},"as_of":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"}}},"cursor":{"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+(?![\\s\\S])"},"historyQuery":{"type":"object","additionalProperties":false,"required":["analysis_unit_id","snapshot_id","as_of","known_at","from","to","quote_origin","logical_market","quote_kind","page_size","cursor","sort"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"snapshot_id":{"$ref":"#/$defs/sha256"},"as_of":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"from":{"$ref":"#/$defs/timestamp"},"to":{"$ref":"#/$defs/timestamp"},"quote_origin":{"enum":["SOURCE_QUOTE","PROVIDER_AGGREGATE",null]},"logical_market":{"enum":["market_a","market_c","market_b",null]},"quote_kind":{"enum":["ASK","BID",null]},"page_size":{"type":"integer","minimum":1,"maximum":200},"cursor":{"oneOf":[{"$ref":"#/$defs/cursor"},{"type":"null"}]},"sort":{"const":"EVENT_SOURCE_QUOTE_ID_ASC"}}},"pagination":{"type":"object","additionalProperties":false,"required":["page_size","next_cursor"],"properties":{"page_size":{"type":"integer","minimum":1,"maximum":200},"next_cursor":{"oneOf":[{"$ref":"#/$defs/cursor"},{"type":"null"}]}}},"snapshotListResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","snapshot","items","pagination","document_hash"],"properties":{"api_contract":{"const":"price-display-api"},"api_version":{"const":"v1"},"response_kind":{"const":"PRICE_SNAPSHOT_LIST"},"query":{"$ref":"#/$defs/snapshotQuery"},"snapshot":{"type":"null"},"items":{"type":"array","maxItems":20,"items":{"$ref":"#/$defs/snapshot"}},"pagination":{"allOf":[{"$ref":"#/$defs/pagination"},{"properties":{"page_size":{"maximum":20},"next_cursor":{"type":"null"}}}]},"document_hash":{"$ref":"#/$defs/sha256"}}},"itemResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","snapshot","items","pagination","document_hash"],"properties":{"api_contract":{"const":"price-display-api"},"api_version":{"const":"v1"},"response_kind":{"const":"PRICE_ITEM"},"query":{"$ref":"#/$defs/itemQuery"},"snapshot":{"allOf":[{"$ref":"#/$defs/snapshot"},{"properties":{"kind":{"const":"CURRENT"}}}]},"items":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/quote"}},"pagination":{"type":"null"},"document_hash":{"$ref":"#/$defs/sha256"}}},"historyResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","snapshot","items","pagination","document_hash"],"properties":{"api_contract":{"const":"price-display-api"},"api_version":{"const":"v1"},"response_kind":{"const":"PRICE_HISTORY"},"query":{"$ref":"#/$defs/historyQuery"},"snapshot":{"allOf":[{"$ref":"#/$defs/snapshot"},{"properties":{"kind":{"const":"HISTORY"}}}]},"items":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/quote"}},"pagination":{"$ref":"#/$defs/pagination"},"document_hash":{"$ref":"#/$defs/sha256"}}},"error":{"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","NOT_FOUND","CONTRACT_UNAVAILABLE","RECORD_CORRUPT","BACKEND_UNAVAILABLE"]},"http_status":{"type":"integer","enum":[400,404,503]},"retryable":{"type":"boolean"}},"oneOf":[{"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR"]},"http_status":{"const":400},"retryable":{"const":false}}},{"properties":{"code":{"const":"NOT_FOUND"},"http_status":{"const":404},"retryable":{"const":false}}},{"properties":{"code":{"const":"RECORD_CORRUPT"},"http_status":{"const":503},"retryable":{"const":false}}},{"properties":{"code":{"enum":["CONTRACT_UNAVAILABLE","BACKEND_UNAVAILABLE"]},"http_status":{"const":503},"retryable":{"const":true}}}]},"errorResponse":{"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","snapshot","items","pagination","error","document_hash"],"properties":{"api_contract":{"const":"price-display-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"query":{"type":"null"},"snapshot":{"type":"null"},"items":{"type":"array","maxItems":0},"pagination":{"type":"null"},"error":{"$ref":"#/$defs/error"},"document_hash":{"$ref":"#/$defs/sha256"}}}}};
const schema330 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","snapshot","items","pagination","document_hash"],"properties":{"api_contract":{"const":"price-display-api"},"api_version":{"const":"v1"},"response_kind":{"const":"PRICE_SNAPSHOT_LIST"},"query":{"$ref":"#/$defs/snapshotQuery"},"snapshot":{"type":"null"},"items":{"type":"array","maxItems":20,"items":{"$ref":"#/$defs/snapshot"}},"pagination":{"allOf":[{"$ref":"#/$defs/pagination"},{"properties":{"page_size":{"maximum":20},"next_cursor":{"type":"null"}}}]},"document_hash":{"$ref":"#/$defs/sha256"}}};
const schema334 = {"type":"string","pattern":"^[0-9a-f]{64}(?![\\s\\S])"};
const schema331 = {"type":"object","additionalProperties":false,"required":["query_as_of","known_at","catalog_snapshot_id","kind","page_size","sort"],"properties":{"query_as_of":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"catalog_snapshot_id":{"$ref":"#/$defs/sha256"},"kind":{"enum":["CURRENT","HISTORY"]},"page_size":{"type":"integer","minimum":1,"maximum":20},"sort":{"const":"MARKET_AS_OF_DESC"}}};
const schema332 = {"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"};
const formats0 = __wireFullFormats["date-time"];
const pattern176 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])", "u");
const pattern178 = new RegExp("^[0-9a-f]{64}(?![\\s\\S])", "u");

function validate203(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate203.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.query_as_of === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query_as_of"},message:"must have required property '"+"query_as_of"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.known_at === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "known_at"},message:"must have required property '"+"known_at"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.catalog_snapshot_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_snapshot_id"},message:"must have required property '"+"catalog_snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.kind === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
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
if(data.sort === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sort"},message:"must have required property '"+"sort"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "query_as_of") || (key0 === "known_at")) || (key0 === "catalog_snapshot_id")) || (key0 === "kind")) || (key0 === "page_size")) || (key0 === "sort"))){
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
if(data.query_as_of !== undefined){
let data0 = data.query_as_of;
if(typeof data0 === "string"){
if(!pattern176.test(data0)){
const err7 = {instancePath:instancePath+"/query_as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!(formats0.validate(data0))){
const err8 = {instancePath:instancePath+"/query_as_of",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err9 = {instancePath:instancePath+"/query_as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.known_at !== undefined){
let data1 = data.known_at;
if(typeof data1 === "string"){
if(!pattern176.test(data1)){
const err10 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!(formats0.validate(data1))){
const err11 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err12 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data2 = data.catalog_snapshot_id;
if(typeof data2 === "string"){
if(!pattern178.test(data2)){
const err13 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err14 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.kind !== undefined){
let data3 = data.kind;
if(!((data3 === "CURRENT") || (data3 === "HISTORY"))){
const err15 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema331.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.page_size !== undefined){
let data4 = data.page_size;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err16 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 20 || isNaN(data4)){
const err17 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 20},message:"must be <= 20"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data4 < 1 || isNaN(data4)){
const err18 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.sort !== undefined){
if("MARKET_AS_OF_DESC" !== data.sort){
const err19 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/const",keyword:"const",params:{allowedValue: "MARKET_AS_OF_DESC"},message:"must be equal to constant"};
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
validate203.errors = vErrors;
return errors === 0;
}
validate203.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema335 = {"type":"object","additionalProperties":false,"required":["snapshot_id","catalog_snapshot_id","catalog_as_of","catalog_available_at","market_as_of","available_at","published_at","kind","price_policy_version"],"properties":{"snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_snapshot_id":{"$ref":"#/$defs/sha256"},"catalog_as_of":{"$ref":"#/$defs/timestamp"},"catalog_available_at":{"$ref":"#/$defs/timestamp"},"market_as_of":{"$ref":"#/$defs/timestamp"},"available_at":{"$ref":"#/$defs/timestamp"},"published_at":{"$ref":"#/$defs/timestamp"},"kind":{"enum":["CURRENT","HISTORY"]},"price_policy_version":{"const":"price-display-read/1"}}};
const func9 = Object.prototype.hasOwnProperty;

function validate205(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate205.evaluated;
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
if(data.catalog_as_of === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_as_of"},message:"must have required property '"+"catalog_as_of"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.catalog_available_at === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_available_at"},message:"must have required property '"+"catalog_available_at"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.market_as_of === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "market_as_of"},message:"must have required property '"+"market_as_of"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.available_at === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.published_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_at"},message:"must have required property '"+"published_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.kind === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.price_policy_version === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "price_policy_version"},message:"must have required property '"+"price_policy_version"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema335.properties, key0))){
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
if(data.snapshot_id !== undefined){
let data0 = data.snapshot_id;
if(typeof data0 === "string"){
if(!pattern178.test(data0)){
const err10 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err11 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.catalog_snapshot_id !== undefined){
let data1 = data.catalog_snapshot_id;
if(typeof data1 === "string"){
if(!pattern178.test(data1)){
const err12 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err13 = {instancePath:instancePath+"/catalog_snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.catalog_as_of !== undefined){
let data2 = data.catalog_as_of;
if(typeof data2 === "string"){
if(!pattern176.test(data2)){
const err14 = {instancePath:instancePath+"/catalog_as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!(formats0.validate(data2))){
const err15 = {instancePath:instancePath+"/catalog_as_of",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err16 = {instancePath:instancePath+"/catalog_as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.catalog_available_at !== undefined){
let data3 = data.catalog_available_at;
if(typeof data3 === "string"){
if(!pattern176.test(data3)){
const err17 = {instancePath:instancePath+"/catalog_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!(formats0.validate(data3))){
const err18 = {instancePath:instancePath+"/catalog_available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err19 = {instancePath:instancePath+"/catalog_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.market_as_of !== undefined){
let data4 = data.market_as_of;
if(typeof data4 === "string"){
if(!pattern176.test(data4)){
const err20 = {instancePath:instancePath+"/market_as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!(formats0.validate(data4))){
const err21 = {instancePath:instancePath+"/market_as_of",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err22 = {instancePath:instancePath+"/market_as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data5 = data.available_at;
if(typeof data5 === "string"){
if(!pattern176.test(data5)){
const err23 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(!(formats0.validate(data5))){
const err24 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err25 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.published_at !== undefined){
let data6 = data.published_at;
if(typeof data6 === "string"){
if(!pattern176.test(data6)){
const err26 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(!(formats0.validate(data6))){
const err27 = {instancePath:instancePath+"/published_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
if(data.kind !== undefined){
let data7 = data.kind;
if(!((data7 === "CURRENT") || (data7 === "HISTORY"))){
const err29 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema335.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.price_policy_version !== undefined){
if("price-display-read/1" !== data.price_policy_version){
const err30 = {instancePath:instancePath+"/price_policy_version",schemaPath:"#/properties/price_policy_version/const",keyword:"const",params:{allowedValue: "price-display-read/1"},message:"must be equal to constant"};
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
validate205.errors = vErrors;
return errors === 0;
}
validate205.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema343 = {"type":"object","additionalProperties":false,"required":["page_size","next_cursor"],"properties":{"page_size":{"type":"integer","minimum":1,"maximum":200},"next_cursor":{"oneOf":[{"$ref":"#/$defs/cursor"},{"type":"null"}]}}};
const schema344 = {"type":"string","minLength":1,"maxLength":8192,"pattern":"^[A-Za-z0-9_-]+(?![\\s\\S])"};
const func2 = __wireUcs2Length;
const pattern186 = new RegExp("^[A-Za-z0-9_-]+(?![\\s\\S])", "u");

function validate207(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate207.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.page_size === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_size"},message:"must have required property '"+"page_size"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.next_cursor === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_cursor"},message:"must have required property '"+"next_cursor"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "page_size") || (key0 === "next_cursor"))){
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
if(data.page_size !== undefined){
let data0 = data.page_size;
if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
const err3 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((typeof data0 == "number") && (isFinite(data0))){
if(data0 > 200 || isNaN(data0)){
const err4 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 200},message:"must be <= 200"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data0 < 1 || isNaN(data0)){
const err5 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.next_cursor !== undefined){
let data1 = data.next_cursor;
const _errs5 = errors;
let valid1 = false;
let passing0 = null;
const _errs6 = errors;
if(typeof data1 === "string"){
if(func2(data1) > 8192){
const err6 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(func2(data1) < 1){
const err7 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/cursor/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern186.test(data1)){
const err8 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_-]+(?![\\s\\S])"+"\""};
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
const err9 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/$defs/cursor/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid0 = _errs6 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs9 = errors;
if(data1 !== null){
const err10 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs9 === errors;
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
const err11 = {instancePath:instancePath+"/next_cursor",schemaPath:"#/properties/next_cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
else {
errors = _errs5;
if(vErrors !== null){
if(_errs5){
vErrors.length = _errs5;
}
else {
vErrors = null;
}
}
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
validate207.errors = vErrors;
return errors === 0;
}
validate207.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate202(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate202.evaluated;
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
if(data.snapshot === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.items === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "items"},message:"must have required property '"+"items"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.pagination === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pagination"},message:"must have required property '"+"pagination"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.document_hash === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_hash"},message:"must have required property '"+"document_hash"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query")) || (key0 === "snapshot")) || (key0 === "items")) || (key0 === "pagination")) || (key0 === "document_hash"))){
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
if("price-display-api" !== data.api_contract){
const err9 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "price-display-api"},message:"must be equal to constant"};
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
if("PRICE_SNAPSHOT_LIST" !== data.response_kind){
const err11 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "PRICE_SNAPSHOT_LIST"},message:"must be equal to constant"};
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
if(!(validate203(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate203.errors : vErrors.concat(validate203.errors);
errors = vErrors.length;
}
}
if(data.snapshot !== undefined){
if(data.snapshot !== null){
const err12 = {instancePath:instancePath+"/snapshot",schemaPath:"#/properties/snapshot/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.items !== undefined){
let data5 = data.items;
if(Array.isArray(data5)){
if(data5.length > 20){
const err13 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/maxItems",keyword:"maxItems",params:{limit: 20},message:"must NOT have more than 20 items"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
if(!(validate205(data5[i0], {instancePath:instancePath+"/items/" + i0,parentData:data5,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate205.errors : vErrors.concat(validate205.errors);
errors = vErrors.length;
}
}
}
else {
const err14 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.pagination !== undefined){
let data7 = data.pagination;
if(!(validate207(data7, {instancePath:instancePath+"/pagination",parentData:data,parentDataProperty:"pagination",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate207.errors : vErrors.concat(validate207.errors);
errors = vErrors.length;
}
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.page_size !== undefined){
let data8 = data7.page_size;
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 > 20 || isNaN(data8)){
const err15 = {instancePath:instancePath+"/pagination/page_size",schemaPath:"#/properties/pagination/allOf/1/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 20},message:"must be <= 20"};
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
if(data7.next_cursor !== undefined){
if(data7.next_cursor !== null){
const err16 = {instancePath:instancePath+"/pagination/next_cursor",schemaPath:"#/properties/pagination/allOf/1/properties/next_cursor/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
}
if(data.document_hash !== undefined){
let data10 = data.document_hash;
if(typeof data10 === "string"){
if(!pattern178.test(data10)){
const err17 = {instancePath:instancePath+"/document_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err18 = {instancePath:instancePath+"/document_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate202.errors = vErrors;
return errors === 0;
}
validate202.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema346 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","snapshot","items","pagination","document_hash"],"properties":{"api_contract":{"const":"price-display-api"},"api_version":{"const":"v1"},"response_kind":{"const":"PRICE_ITEM"},"query":{"$ref":"#/$defs/itemQuery"},"snapshot":{"allOf":[{"$ref":"#/$defs/snapshot"},{"properties":{"kind":{"const":"CURRENT"}}}]},"items":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/quote"}},"pagination":{"type":"null"},"document_hash":{"$ref":"#/$defs/sha256"}}};
const schema347 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","snapshot_id","as_of","known_at"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"snapshot_id":{"$ref":"#/$defs/sha256"},"as_of":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"}}};
const schema348 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[^\\u0000-\\u001f\\u007f\\ud800-\\udfff]+(?![\\s\\S])"};
const pattern188 = new RegExp("^[^\\u0000-\\u001f\\u007f\\ud800-\\udfff]+(?![\\s\\S])", "u");

function validate211(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate211.evaluated;
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
if(data.snapshot_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
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
for(const key0 in data){
if(!((((key0 === "analysis_unit_id") || (key0 === "snapshot_id")) || (key0 === "as_of")) || (key0 === "known_at"))){
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
if(data.analysis_unit_id !== undefined){
let data0 = data.analysis_unit_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err5 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(func2(data0) < 1){
const err6 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!pattern188.test(data0)){
const err7 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f\\ud800-\\udfff]+(?![\\s\\S])"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f\\ud800-\\udfff]+(?![\\s\\S])"+"\""};
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
const err8 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.snapshot_id !== undefined){
let data1 = data.snapshot_id;
if(typeof data1 === "string"){
if(!pattern178.test(data1)){
const err9 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err10 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(!pattern176.test(data2)){
const err11 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!(formats0.validate(data2))){
const err12 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err13 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.known_at !== undefined){
let data3 = data.known_at;
if(typeof data3 === "string"){
if(!pattern176.test(data3)){
const err14 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!(formats0.validate(data3))){
const err15 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err16 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate211.errors = vErrors;
return errors === 0;
}
validate211.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema352 = {"type":"object","additionalProperties":false,"required":["quote_id","analysis_unit_id","item_id","quote_kind","source","bucket_at","observed_at","time_basis","source_updated_at","source_collected_at","source_available_at","identity_available_at","identity_policy","late_bound","source_price","source_price_reason","amounts","fx","available_at"],"properties":{"quote_id":{"$ref":"#/$defs/sha256"},"analysis_unit_id":{"$ref":"#/$defs/identifier"},"item_id":{"$ref":"#/$defs/itemId"},"quote_kind":{"enum":["ASK","BID"]},"source":{"$ref":"#/$defs/source"},"bucket_at":{"$ref":"#/$defs/nullableTimestamp"},"observed_at":{"$ref":"#/$defs/nullableTimestamp"},"time_basis":{"enum":["BUCKET_AT","OBSERVED_AT","UNAVAILABLE"]},"source_updated_at":{"$ref":"#/$defs/nullableTimestamp"},"source_collected_at":{"$ref":"#/$defs/nullableTimestamp"},"source_available_at":{"$ref":"#/$defs/timestamp"},"identity_available_at":{"$ref":"#/$defs/timestamp"},"identity_policy":{"enum":["CATALOG_SNAPSHOT_EXACT_ITEM_V1","CURRENT_EXACT_MHN_LATE_BIND_V1"]},"late_bound":{"type":"boolean"},"source_price":{"oneOf":[{"$ref":"#/$defs/sourcePrice"},{"type":"null"}]},"source_price_reason":{"oneOf":[{"$ref":"#/$defs/sourceReason"},{"type":"null"}]},"amounts":{"$ref":"#/$defs/amounts"},"fx":{"oneOf":[{"$ref":"#/$defs/fx"},{"type":"null"}]},"available_at":{"$ref":"#/$defs/timestamp"}},"allOf":[{"if":{"properties":{"source_price":{"type":"null"}},"required":["source_price"]},"then":{"properties":{"source_price_reason":{"$ref":"#/$defs/sourceReason"},"fx":{"type":"null"},"amounts":{"properties":{"USD":{"$ref":"#/$defs/unavailableAmount"},"CNY":{"$ref":"#/$defs/unavailableAmount"}}}}},"else":{"properties":{"source_price_reason":{"type":"null"}}}},{"if":{"properties":{"time_basis":{"const":"BUCKET_AT"}},"required":["time_basis"]},"then":{"properties":{"bucket_at":{"$ref":"#/$defs/timestamp"}}}},{"if":{"properties":{"time_basis":{"const":"OBSERVED_AT"}},"required":["time_basis"]},"then":{"properties":{"bucket_at":{"type":"null"},"observed_at":{"$ref":"#/$defs/timestamp"}}}},{"if":{"properties":{"time_basis":{"const":"UNAVAILABLE"}},"required":["time_basis"]},"then":{"properties":{"bucket_at":{"type":"null"},"observed_at":{"type":"null"},"fx":{"type":"null"},"source_price":{"$ref":"#/$defs/sourcePrice"}}}},{"if":{"properties":{"identity_policy":{"const":"CURRENT_EXACT_MHN_LATE_BIND_V1"}},"required":["identity_policy"]},"then":{"properties":{"late_bound":{"const":true}}},"else":{"properties":{"late_bound":{"const":false}}}}]};
const schema353 = {"enum":["SOURCE_UNAVAILABLE","CAPTURE_GAP","SOURCE_CONFLICT"]};
const schema365 = {"type":"string","pattern":"^[1-9][0-9]{0,18}(?![\\s\\S])"};
const schema366 = {"type":"object","additionalProperties":false,"required":["quote_origin","logical_market","transport"],"properties":{"quote_origin":{"enum":["SOURCE_QUOTE","PROVIDER_AGGREGATE"]},"logical_market":{"enum":["market_a","market_c","market_b",null]},"transport":{"enum":["upstream","market_b_direct"]}},"allOf":[{"if":{"properties":{"quote_origin":{"const":"PROVIDER_AGGREGATE"}},"required":["quote_origin"]},"then":{"properties":{"logical_market":{"type":"null"},"transport":{"const":"upstream"}}},"else":{"properties":{"logical_market":{"enum":["market_a","market_c","market_b"]}}}},{"if":{"properties":{"transport":{"const":"market_b_direct"}},"required":["transport"]},"then":{"properties":{"quote_origin":{"const":"SOURCE_QUOTE"},"logical_market":{"const":"market_b"}}}}]};
const schema354 = {"type":"object","additionalProperties":false,"required":["status","currency","amount","scale","basis","rounding","reason"],"properties":{"status":{"const":"UNAVAILABLE"},"currency":{"$ref":"#/$defs/currency"},"amount":{"type":"null"},"scale":{"type":"null"},"basis":{"type":"null"},"rounding":{"type":"null"},"reason":{"$ref":"#/$defs/amountReason"}}};
const schema355 = {"enum":["USD","CNY"]};
const schema356 = {"enum":["SOURCE_UNAVAILABLE","CAPTURE_GAP","SOURCE_CONFLICT","NO_ELIGIBLE_FX","FX_STALE","AMOUNT_OUT_OF_RANGE"]};

function validate215(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate215.evaluated;
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
if(data.currency === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "currency"},message:"must have required property '"+"currency"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.amount === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "amount"},message:"must have required property '"+"amount"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.scale === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scale"},message:"must have required property '"+"scale"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.basis === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "basis"},message:"must have required property '"+"basis"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.rounding === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rounding"},message:"must have required property '"+"rounding"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.reason === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "status") || (key0 === "currency")) || (key0 === "amount")) || (key0 === "scale")) || (key0 === "basis")) || (key0 === "rounding")) || (key0 === "reason"))){
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
if(data.status !== undefined){
if("UNAVAILABLE" !== data.status){
const err8 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "UNAVAILABLE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.currency !== undefined){
let data1 = data.currency;
if(!((data1 === "USD") || (data1 === "CNY"))){
const err9 = {instancePath:instancePath+"/currency",schemaPath:"#/$defs/currency/enum",keyword:"enum",params:{allowedValues: schema355.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.amount !== undefined){
if(data.amount !== null){
const err10 = {instancePath:instancePath+"/amount",schemaPath:"#/properties/amount/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.scale !== undefined){
if(data.scale !== null){
const err11 = {instancePath:instancePath+"/scale",schemaPath:"#/properties/scale/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.basis !== undefined){
if(data.basis !== null){
const err12 = {instancePath:instancePath+"/basis",schemaPath:"#/properties/basis/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.rounding !== undefined){
if(data.rounding !== null){
const err13 = {instancePath:instancePath+"/rounding",schemaPath:"#/properties/rounding/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.reason !== undefined){
let data6 = data.reason;
if(!((((((data6 === "SOURCE_UNAVAILABLE") || (data6 === "CAPTURE_GAP")) || (data6 === "SOURCE_CONFLICT")) || (data6 === "NO_ELIGIBLE_FX")) || (data6 === "FX_STALE")) || (data6 === "AMOUNT_OUT_OF_RANGE"))){
const err14 = {instancePath:instancePath+"/reason",schemaPath:"#/$defs/amountReason/enum",keyword:"enum",params:{allowedValues: schema356.enum},message:"must be equal to one of the allowed values"};
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
validate215.errors = vErrors;
return errors === 0;
}
validate215.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema359 = {"type":"object","additionalProperties":false,"required":["value","currency","unit","normalized_fraction_digits","upstream_fraction_digits"],"properties":{"value":{"type":"string","minLength":1,"maxLength":39},"currency":{"$ref":"#/$defs/currency"},"unit":{"enum":["USD_DECIMAL","CNY_MINOR"]},"normalized_fraction_digits":{"type":"integer","enum":[0,8]},"upstream_fraction_digits":{"oneOf":[{"type":"integer","minimum":0,"maximum":9007199254740991},{"type":"null"}]}},"allOf":[{"if":{"properties":{"unit":{"const":"USD_DECIMAL"}},"required":["unit"]},"then":{"properties":{"value":{"$ref":"#/$defs/usdValue"},"currency":{"const":"USD"},"normalized_fraction_digits":{"const":8}}}},{"if":{"properties":{"unit":{"const":"CNY_MINOR"}},"required":["unit"]},"then":{"properties":{"value":{"$ref":"#/$defs/minorValue"},"currency":{"const":"CNY"},"normalized_fraction_digits":{"const":0}}}}]};
const schema360 = {"type":"string","pattern":"^(?:0|[1-9][0-9]{0,29})\\.[0-9]{8}(?![\\s\\S])"};
const schema361 = {"type":"string","pattern":"^(?:0|[1-9][0-9]{0,18})(?![\\s\\S])"};
const pattern194 = new RegExp("^(?:0|[1-9][0-9]{0,29})\\.[0-9]{8}(?![\\s\\S])", "u");
const pattern195 = new RegExp("^(?:0|[1-9][0-9]{0,18})(?![\\s\\S])", "u");

function validate218(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate218.evaluated;
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
if((data.unit === undefined) && (missing0 = "unit")){
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
if(data.unit !== undefined){
if("USD_DECIMAL" !== data.unit){
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
if(data.value !== undefined){
let data1 = data.value;
if(typeof data1 === "string"){
if(!pattern194.test(data1)){
const err2 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/usdValue/pattern",keyword:"pattern",params:{pattern: "^(?:0|[1-9][0-9]{0,29})\\.[0-9]{8}(?![\\s\\S])"},message:"must match pattern \""+"^(?:0|[1-9][0-9]{0,29})\\.[0-9]{8}(?![\\s\\S])"+"\""};
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
const err3 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/usdValue/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.currency !== undefined){
if("USD" !== data.currency){
const err4 = {instancePath:instancePath+"/currency",schemaPath:"#/allOf/0/then/properties/currency/const",keyword:"const",params:{allowedValue: "USD"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.normalized_fraction_digits !== undefined){
if(8 !== data.normalized_fraction_digits){
const err5 = {instancePath:instancePath+"/normalized_fraction_digits",schemaPath:"#/allOf/0/then/properties/normalized_fraction_digits/const",keyword:"const",params:{allowedValue: 8},message:"must be equal to constant"};
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
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.value = true;
props0.currency = true;
props0.normalized_fraction_digits = true;
props0.unit = true;
}
}
if(!valid1){
const err6 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
const _errs12 = errors;
let valid5 = true;
const _errs13 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.unit === undefined) && (missing1 = "unit")){
const err7 = {};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
else {
if(data.unit !== undefined){
if("CNY_MINOR" !== data.unit){
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
}
}
var _valid1 = _errs13 === errors;
errors = _errs12;
if(vErrors !== null){
if(_errs12){
vErrors.length = _errs12;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs15 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.value !== undefined){
let data5 = data.value;
if(typeof data5 === "string"){
if(!pattern195.test(data5)){
const err9 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/minorValue/pattern",keyword:"pattern",params:{pattern: "^(?:0|[1-9][0-9]{0,18})(?![\\s\\S])"},message:"must match pattern \""+"^(?:0|[1-9][0-9]{0,18})(?![\\s\\S])"+"\""};
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
const err10 = {instancePath:instancePath+"/value",schemaPath:"#/$defs/minorValue/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.currency !== undefined){
if("CNY" !== data.currency){
const err11 = {instancePath:instancePath+"/currency",schemaPath:"#/allOf/1/then/properties/currency/const",keyword:"const",params:{allowedValue: "CNY"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.normalized_fraction_digits !== undefined){
if(0 !== data.normalized_fraction_digits){
const err12 = {instancePath:instancePath+"/normalized_fraction_digits",schemaPath:"#/allOf/1/then/properties/normalized_fraction_digits/const",keyword:"const",params:{allowedValue: 0},message:"must be equal to constant"};
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
var _valid1 = _errs15 === errors;
valid5 = _valid1;
if(valid5){
var props1 = {};
props1.value = true;
props1.currency = true;
props1.normalized_fraction_digits = true;
props1.unit = true;
}
}
if(!valid5){
const err13 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
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
if(data.value === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.currency === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "currency"},message:"must have required property '"+"currency"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.unit === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "unit"},message:"must have required property '"+"unit"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.normalized_fraction_digits === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "normalized_fraction_digits"},message:"must have required property '"+"normalized_fraction_digits"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.upstream_fraction_digits === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "upstream_fraction_digits"},message:"must have required property '"+"upstream_fraction_digits"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "value") || (key0 === "currency")) || (key0 === "unit")) || (key0 === "normalized_fraction_digits")) || (key0 === "upstream_fraction_digits"))){
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
if(data.value !== undefined){
let data8 = data.value;
if(typeof data8 === "string"){
if(func2(data8) > 39){
const err20 = {instancePath:instancePath+"/value",schemaPath:"#/properties/value/maxLength",keyword:"maxLength",params:{limit: 39},message:"must NOT have more than 39 characters"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(func2(data8) < 1){
const err21 = {instancePath:instancePath+"/value",schemaPath:"#/properties/value/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err22 = {instancePath:instancePath+"/value",schemaPath:"#/properties/value/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.currency !== undefined){
let data9 = data.currency;
if(!((data9 === "USD") || (data9 === "CNY"))){
const err23 = {instancePath:instancePath+"/currency",schemaPath:"#/$defs/currency/enum",keyword:"enum",params:{allowedValues: schema355.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.unit !== undefined){
let data10 = data.unit;
if(!((data10 === "USD_DECIMAL") || (data10 === "CNY_MINOR"))){
const err24 = {instancePath:instancePath+"/unit",schemaPath:"#/properties/unit/enum",keyword:"enum",params:{allowedValues: schema359.properties.unit.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.normalized_fraction_digits !== undefined){
let data11 = data.normalized_fraction_digits;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err25 = {instancePath:instancePath+"/normalized_fraction_digits",schemaPath:"#/properties/normalized_fraction_digits/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!((data11 === 0) || (data11 === 8))){
const err26 = {instancePath:instancePath+"/normalized_fraction_digits",schemaPath:"#/properties/normalized_fraction_digits/enum",keyword:"enum",params:{allowedValues: schema359.properties.normalized_fraction_digits.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.upstream_fraction_digits !== undefined){
let data12 = data.upstream_fraction_digits;
const _errs30 = errors;
let valid11 = false;
let passing0 = null;
const _errs31 = errors;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err27 = {instancePath:instancePath+"/upstream_fraction_digits",schemaPath:"#/properties/upstream_fraction_digits/oneOf/0/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 > 9007199254740991 || isNaN(data12)){
const err28 = {instancePath:instancePath+"/upstream_fraction_digits",schemaPath:"#/properties/upstream_fraction_digits/oneOf/0/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data12 < 0 || isNaN(data12)){
const err29 = {instancePath:instancePath+"/upstream_fraction_digits",schemaPath:"#/properties/upstream_fraction_digits/oneOf/0/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
var _valid2 = _errs31 === errors;
if(_valid2){
valid11 = true;
passing0 = 0;
}
const _errs33 = errors;
if(data12 !== null){
const err30 = {instancePath:instancePath+"/upstream_fraction_digits",schemaPath:"#/properties/upstream_fraction_digits/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
var _valid2 = _errs33 === errors;
if(_valid2 && valid11){
valid11 = false;
passing0 = [passing0, 1];
}
else {
if(_valid2){
valid11 = true;
passing0 = 1;
}
}
if(!valid11){
const err31 = {instancePath:instancePath+"/upstream_fraction_digits",schemaPath:"#/properties/upstream_fraction_digits/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
else {
errors = _errs30;
if(vErrors !== null){
if(_errs30){
vErrors.length = _errs30;
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
validate218.errors = vErrors;
return errors === 0;
}
validate218.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema367 = {"oneOf":[{"$ref":"#/$defs/timestamp"},{"type":"null"}]};

function validate220(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate220.evaluated;
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
if(!pattern176.test(data)){
const err0 = {instancePath,schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!(formats0.validate(data))){
const err1 = {instancePath,schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err2 = {instancePath,schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate220.errors = vErrors;
return errors === 0;
}
validate220.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema372 = {"type":"object","additionalProperties":false,"required":["USD","CNY"],"properties":{"USD":{"allOf":[{"$ref":"#/$defs/amount"},{"properties":{"currency":{"const":"USD"}}}]},"CNY":{"allOf":[{"$ref":"#/$defs/amount"},{"properties":{"currency":{"const":"CNY"}}}]}}};
const schema373 = {"oneOf":[{"$ref":"#/$defs/availableAmount"},{"$ref":"#/$defs/unavailableAmount"}]};
const schema374 = {"type":"object","additionalProperties":false,"required":["status","currency","amount","scale","basis","rounding","reason"],"properties":{"status":{"const":"AVAILABLE"},"currency":{"$ref":"#/$defs/currency"},"amount":{"type":"string"},"scale":{"type":"integer","enum":[2,8]},"basis":{"enum":["NATIVE","FX_DERIVED"]},"rounding":{"enum":["EXACT","ROUNDED","ROUNDED_TO_ZERO"]},"reason":{"type":"null"}},"allOf":[{"if":{"properties":{"currency":{"const":"USD"}},"required":["currency"]},"then":{"properties":{"amount":{"$ref":"#/$defs/usdValue"},"scale":{"const":8}}}},{"if":{"properties":{"currency":{"const":"CNY"}},"required":["currency"]},"then":{"properties":{"amount":{"$ref":"#/$defs/cnyValue"},"scale":{"const":2}}}},{"if":{"properties":{"basis":{"const":"NATIVE"}},"required":["basis"]},"then":{"properties":{"rounding":{"const":"EXACT"}}}},{"if":{"properties":{"rounding":{"const":"ROUNDED_TO_ZERO"}},"required":["rounding"]},"then":{"properties":{"amount":{"enum":["0.00","0.00000000"]}}}}]};
const schema376 = {"type":"string","pattern":"^(?:0|[1-9][0-9]{0,16})\\.[0-9]{2}(?![\\s\\S])"};
const pattern203 = new RegExp("^(?:0|[1-9][0-9]{0,16})\\.[0-9]{2}(?![\\s\\S])", "u");

function validate228(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate228.evaluated;
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
if((data.currency === undefined) && (missing0 = "currency")){
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
if(data.currency !== undefined){
if("USD" !== data.currency){
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
if(data.amount !== undefined){
let data1 = data.amount;
if(typeof data1 === "string"){
if(!pattern194.test(data1)){
const err2 = {instancePath:instancePath+"/amount",schemaPath:"#/$defs/usdValue/pattern",keyword:"pattern",params:{pattern: "^(?:0|[1-9][0-9]{0,29})\\.[0-9]{8}(?![\\s\\S])"},message:"must match pattern \""+"^(?:0|[1-9][0-9]{0,29})\\.[0-9]{8}(?![\\s\\S])"+"\""};
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
const err3 = {instancePath:instancePath+"/amount",schemaPath:"#/$defs/usdValue/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.scale !== undefined){
if(8 !== data.scale){
const err4 = {instancePath:instancePath+"/scale",schemaPath:"#/allOf/0/then/properties/scale/const",keyword:"const",params:{allowedValue: 8},message:"must be equal to constant"};
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
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.amount = true;
props0.scale = true;
props0.currency = true;
}
}
if(!valid1){
const err5 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const _errs11 = errors;
let valid5 = true;
const _errs12 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.currency === undefined) && (missing1 = "currency")){
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
if(data.currency !== undefined){
if("CNY" !== data.currency){
const err7 = {};
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
var _valid1 = _errs12 === errors;
errors = _errs11;
if(vErrors !== null){
if(_errs11){
vErrors.length = _errs11;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs14 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.amount !== undefined){
let data4 = data.amount;
if(typeof data4 === "string"){
if(!pattern203.test(data4)){
const err8 = {instancePath:instancePath+"/amount",schemaPath:"#/$defs/cnyValue/pattern",keyword:"pattern",params:{pattern: "^(?:0|[1-9][0-9]{0,16})\\.[0-9]{2}(?![\\s\\S])"},message:"must match pattern \""+"^(?:0|[1-9][0-9]{0,16})\\.[0-9]{2}(?![\\s\\S])"+"\""};
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
const err9 = {instancePath:instancePath+"/amount",schemaPath:"#/$defs/cnyValue/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.scale !== undefined){
if(2 !== data.scale){
const err10 = {instancePath:instancePath+"/scale",schemaPath:"#/allOf/1/then/properties/scale/const",keyword:"const",params:{allowedValue: 2},message:"must be equal to constant"};
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
var _valid1 = _errs14 === errors;
valid5 = _valid1;
if(valid5){
var props1 = {};
props1.amount = true;
props1.scale = true;
props1.currency = true;
}
}
if(!valid5){
const err11 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
const _errs20 = errors;
let valid9 = true;
const _errs21 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.basis === undefined) && (missing2 = "basis")){
const err12 = {};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
if(data.basis !== undefined){
if("NATIVE" !== data.basis){
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
var _valid2 = _errs21 === errors;
errors = _errs20;
if(vErrors !== null){
if(_errs20){
vErrors.length = _errs20;
}
else {
vErrors = null;
}
}
if(_valid2){
const _errs23 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.rounding !== undefined){
if("EXACT" !== data.rounding){
const err14 = {instancePath:instancePath+"/rounding",schemaPath:"#/allOf/2/then/properties/rounding/const",keyword:"const",params:{allowedValue: "EXACT"},message:"must be equal to constant"};
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
var _valid2 = _errs23 === errors;
valid9 = _valid2;
if(valid9){
var props2 = {};
props2.rounding = true;
props2.basis = true;
}
}
if(!valid9){
const err15 = {instancePath,schemaPath:"#/allOf/2/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
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
const _errs26 = errors;
let valid12 = true;
const _errs27 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing3;
if((data.rounding === undefined) && (missing3 = "rounding")){
const err16 = {};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
else {
if(data.rounding !== undefined){
if("ROUNDED_TO_ZERO" !== data.rounding){
const err17 = {};
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
var _valid3 = _errs27 === errors;
errors = _errs26;
if(vErrors !== null){
if(_errs26){
vErrors.length = _errs26;
}
else {
vErrors = null;
}
}
if(_valid3){
const _errs29 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.amount !== undefined){
let data9 = data.amount;
if(!((data9 === "0.00") || (data9 === "0.00000000"))){
const err18 = {instancePath:instancePath+"/amount",schemaPath:"#/allOf/3/then/properties/amount/enum",keyword:"enum",params:{allowedValues: schema374.allOf[3].then.properties.amount.enum},message:"must be equal to one of the allowed values"};
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
var _valid3 = _errs29 === errors;
valid12 = _valid3;
if(valid12){
var props3 = {};
props3.amount = true;
props3.rounding = true;
}
}
if(!valid12){
const err19 = {instancePath,schemaPath:"#/allOf/3/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
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
if(data.status === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.currency === undefined){
const err21 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "currency"},message:"must have required property '"+"currency"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.amount === undefined){
const err22 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "amount"},message:"must have required property '"+"amount"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data.scale === undefined){
const err23 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scale"},message:"must have required property '"+"scale"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data.basis === undefined){
const err24 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "basis"},message:"must have required property '"+"basis"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data.rounding === undefined){
const err25 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rounding"},message:"must have required property '"+"rounding"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data.reason === undefined){
const err26 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "status") || (key0 === "currency")) || (key0 === "amount")) || (key0 === "scale")) || (key0 === "basis")) || (key0 === "rounding")) || (key0 === "reason"))){
const err27 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.status !== undefined){
if("AVAILABLE" !== data.status){
const err28 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "AVAILABLE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.currency !== undefined){
let data11 = data.currency;
if(!((data11 === "USD") || (data11 === "CNY"))){
const err29 = {instancePath:instancePath+"/currency",schemaPath:"#/$defs/currency/enum",keyword:"enum",params:{allowedValues: schema355.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.amount !== undefined){
if(typeof data.amount !== "string"){
const err30 = {instancePath:instancePath+"/amount",schemaPath:"#/properties/amount/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.scale !== undefined){
let data13 = data.scale;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err31 = {instancePath:instancePath+"/scale",schemaPath:"#/properties/scale/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(!((data13 === 2) || (data13 === 8))){
const err32 = {instancePath:instancePath+"/scale",schemaPath:"#/properties/scale/enum",keyword:"enum",params:{allowedValues: schema374.properties.scale.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.basis !== undefined){
let data14 = data.basis;
if(!((data14 === "NATIVE") || (data14 === "FX_DERIVED"))){
const err33 = {instancePath:instancePath+"/basis",schemaPath:"#/properties/basis/enum",keyword:"enum",params:{allowedValues: schema374.properties.basis.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.rounding !== undefined){
let data15 = data.rounding;
if(!(((data15 === "EXACT") || (data15 === "ROUNDED")) || (data15 === "ROUNDED_TO_ZERO"))){
const err34 = {instancePath:instancePath+"/rounding",schemaPath:"#/properties/rounding/enum",keyword:"enum",params:{allowedValues: schema374.properties.rounding.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.reason !== undefined){
if(data.reason !== null){
const err35 = {instancePath:instancePath+"/reason",schemaPath:"#/properties/reason/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
validate228.errors = vErrors;
return errors === 0;
}
validate228.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate227(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate227.evaluated;
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
if(!(validate228(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate228.errors : vErrors.concat(validate228.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate215(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate215.errors : vErrors.concat(validate215.errors);
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
validate227.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate227.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate226(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate226.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.USD === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "USD"},message:"must have required property '"+"USD"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.CNY === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "CNY"},message:"must have required property '"+"CNY"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "USD") || (key0 === "CNY"))){
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
if(data.USD !== undefined){
let data0 = data.USD;
if(!(validate227(data0, {instancePath:instancePath+"/USD",parentData:data,parentDataProperty:"USD",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate227.errors : vErrors.concat(validate227.errors);
errors = vErrors.length;
}
else {
var props0 = validate227.evaluated.props;
}
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.currency !== undefined){
if("USD" !== data0.currency){
const err3 = {instancePath:instancePath+"/USD/currency",schemaPath:"#/properties/USD/allOf/1/properties/currency/const",keyword:"const",params:{allowedValue: "USD"},message:"must be equal to constant"};
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
if(props0 !== true){
props0 = props0 || {};
props0.currency = true;
}
}
if(data.CNY !== undefined){
let data2 = data.CNY;
if(!(validate227(data2, {instancePath:instancePath+"/CNY",parentData:data,parentDataProperty:"CNY",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate227.errors : vErrors.concat(validate227.errors);
errors = vErrors.length;
}
else {
var props1 = validate227.evaluated.props;
}
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.currency !== undefined){
if("CNY" !== data2.currency){
const err4 = {instancePath:instancePath+"/CNY/currency",schemaPath:"#/properties/CNY/allOf/1/properties/currency/const",keyword:"const",params:{allowedValue: "CNY"},message:"must be equal to constant"};
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
if(props1 !== true){
props1 = props1 || {};
props1.currency = true;
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
validate226.errors = vErrors;
return errors === 0;
}
validate226.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema378 = {"type":"object","additionalProperties":false,"required":["public_rate_id","authority","method","source_event_date","cny_per_usd","carry_days","available_at","cny_valid_from","usd_valid_from","fx_selection_policy_version","conversion_policy_version","usage"],"properties":{"public_rate_id":{"$ref":"#/$defs/sha256"},"authority":{"const":"ECB"},"method":{"const":"ECB_EUR_CROSS"},"source_event_date":{"$ref":"#/$defs/date"},"cny_per_usd":{"$ref":"#/$defs/rateValue"},"carry_days":{"type":"integer","minimum":0,"maximum":7},"available_at":{"$ref":"#/$defs/timestamp"},"cny_valid_from":{"$ref":"#/$defs/timestamp"},"usd_valid_from":{"$ref":"#/$defs/timestamp"},"fx_selection_policy_version":{"const":"ecb-eur-cross-daily/2"},"conversion_policy_version":{"enum":["price-display-bicurrency/1","ecb-eur-cross-daily/2"]},"usage":{"const":"PRICE_DISPLAY_ONLY"}}};
const schema380 = {"type":"string","format":"date","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}(?![\\s\\S])"};
const schema381 = {"type":"string","pattern":"^(?:0|[1-9][0-9]{0,19})\\.[0-9]{18}(?![\\s\\S])","not":{"const":"0.000000000000000000"}};
const pattern205 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}(?![\\s\\S])", "u");
const pattern206 = new RegExp("^(?:0|[1-9][0-9]{0,19})\\.[0-9]{18}(?![\\s\\S])", "u");
const formats40 = __wireFullFormats.date;

function validate234(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate234.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.public_rate_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "public_rate_id"},message:"must have required property '"+"public_rate_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.authority === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority"},message:"must have required property '"+"authority"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.method === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "method"},message:"must have required property '"+"method"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.source_event_date === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_event_date"},message:"must have required property '"+"source_event_date"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.cny_per_usd === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cny_per_usd"},message:"must have required property '"+"cny_per_usd"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.carry_days === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "carry_days"},message:"must have required property '"+"carry_days"+"'"};
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
if(data.cny_valid_from === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cny_valid_from"},message:"must have required property '"+"cny_valid_from"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.usd_valid_from === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "usd_valid_from"},message:"must have required property '"+"usd_valid_from"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.fx_selection_policy_version === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fx_selection_policy_version"},message:"must have required property '"+"fx_selection_policy_version"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.conversion_policy_version === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "conversion_policy_version"},message:"must have required property '"+"conversion_policy_version"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.usage === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "usage"},message:"must have required property '"+"usage"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema378.properties, key0))){
const err12 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.public_rate_id !== undefined){
let data0 = data.public_rate_id;
if(typeof data0 === "string"){
if(!pattern178.test(data0)){
const err13 = {instancePath:instancePath+"/public_rate_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err14 = {instancePath:instancePath+"/public_rate_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.authority !== undefined){
if("ECB" !== data.authority){
const err15 = {instancePath:instancePath+"/authority",schemaPath:"#/properties/authority/const",keyword:"const",params:{allowedValue: "ECB"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.method !== undefined){
if("ECB_EUR_CROSS" !== data.method){
const err16 = {instancePath:instancePath+"/method",schemaPath:"#/properties/method/const",keyword:"const",params:{allowedValue: "ECB_EUR_CROSS"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.source_event_date !== undefined){
let data3 = data.source_event_date;
if(typeof data3 === "string"){
if(!pattern205.test(data3)){
const err17 = {instancePath:instancePath+"/source_event_date",schemaPath:"#/$defs/date/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!(formats40.validate(data3))){
const err18 = {instancePath:instancePath+"/source_event_date",schemaPath:"#/$defs/date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
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
const err19 = {instancePath:instancePath+"/source_event_date",schemaPath:"#/$defs/date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.cny_per_usd !== undefined){
let data4 = data.cny_per_usd;
const _errs13 = errors;
const _errs14 = errors;
if("0.000000000000000000" !== data4){
const err20 = {};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var valid4 = _errs14 === errors;
if(valid4){
const err21 = {instancePath:instancePath+"/cny_per_usd",schemaPath:"#/$defs/rateValue/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
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
if(typeof data4 === "string"){
if(!pattern206.test(data4)){
const err22 = {instancePath:instancePath+"/cny_per_usd",schemaPath:"#/$defs/rateValue/pattern",keyword:"pattern",params:{pattern: "^(?:0|[1-9][0-9]{0,19})\\.[0-9]{18}(?![\\s\\S])"},message:"must match pattern \""+"^(?:0|[1-9][0-9]{0,19})\\.[0-9]{18}(?![\\s\\S])"+"\""};
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
const err23 = {instancePath:instancePath+"/cny_per_usd",schemaPath:"#/$defs/rateValue/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.carry_days !== undefined){
let data5 = data.carry_days;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err24 = {instancePath:instancePath+"/carry_days",schemaPath:"#/properties/carry_days/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 7 || isNaN(data5)){
const err25 = {instancePath:instancePath+"/carry_days",schemaPath:"#/properties/carry_days/maximum",keyword:"maximum",params:{comparison: "<=", limit: 7},message:"must be <= 7"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err26 = {instancePath:instancePath+"/carry_days",schemaPath:"#/properties/carry_days/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.available_at !== undefined){
let data6 = data.available_at;
if(typeof data6 === "string"){
if(!pattern176.test(data6)){
const err27 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(!(formats0.validate(data6))){
const err28 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err29 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.cny_valid_from !== undefined){
let data7 = data.cny_valid_from;
if(typeof data7 === "string"){
if(!pattern176.test(data7)){
const err30 = {instancePath:instancePath+"/cny_valid_from",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(!(formats0.validate(data7))){
const err31 = {instancePath:instancePath+"/cny_valid_from",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err32 = {instancePath:instancePath+"/cny_valid_from",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.usd_valid_from !== undefined){
let data8 = data.usd_valid_from;
if(typeof data8 === "string"){
if(!pattern176.test(data8)){
const err33 = {instancePath:instancePath+"/usd_valid_from",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(!(formats0.validate(data8))){
const err34 = {instancePath:instancePath+"/usd_valid_from",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err35 = {instancePath:instancePath+"/usd_valid_from",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.fx_selection_policy_version !== undefined){
if("ecb-eur-cross-daily/2" !== data.fx_selection_policy_version){
const err36 = {instancePath:instancePath+"/fx_selection_policy_version",schemaPath:"#/properties/fx_selection_policy_version/const",keyword:"const",params:{allowedValue: "ecb-eur-cross-daily/2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.conversion_policy_version !== undefined){
let data10 = data.conversion_policy_version;
if(!((data10 === "price-display-bicurrency/1") || (data10 === "ecb-eur-cross-daily/2"))){
const err37 = {instancePath:instancePath+"/conversion_policy_version",schemaPath:"#/properties/conversion_policy_version/enum",keyword:"enum",params:{allowedValues: schema378.properties.conversion_policy_version.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.usage !== undefined){
if("PRICE_DISPLAY_ONLY" !== data.usage){
const err38 = {instancePath:instancePath+"/usage",schemaPath:"#/properties/usage/const",keyword:"const",params:{allowedValue: "PRICE_DISPLAY_ONLY"},message:"must be equal to constant"};
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
validate234.errors = vErrors;
return errors === 0;
}
validate234.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const pattern198 = new RegExp("^[1-9][0-9]{0,18}(?![\\s\\S])", "u");

function validate214(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate214.evaluated;
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
if((data.source_price === undefined) && (missing0 = "source_price")){
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
if(data.source_price !== undefined){
if(data.source_price !== null){
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
const _errs6 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.source_price_reason !== undefined){
let data1 = data.source_price_reason;
if(!(((data1 === "SOURCE_UNAVAILABLE") || (data1 === "CAPTURE_GAP")) || (data1 === "SOURCE_CONFLICT"))){
const err2 = {instancePath:instancePath+"/source_price_reason",schemaPath:"#/$defs/sourceReason/enum",keyword:"enum",params:{allowedValues: schema353.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.fx !== undefined){
if(data.fx !== null){
const err3 = {instancePath:instancePath+"/fx",schemaPath:"#/allOf/0/then/properties/fx/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.amounts !== undefined){
let data3 = data.amounts;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.USD !== undefined){
if(!(validate215(data3.USD, {instancePath:instancePath+"/amounts/USD",parentData:data3,parentDataProperty:"USD",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate215.errors : vErrors.concat(validate215.errors);
errors = vErrors.length;
}
}
if(data3.CNY !== undefined){
if(!(validate215(data3.CNY, {instancePath:instancePath+"/amounts/CNY",parentData:data3,parentDataProperty:"CNY",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate215.errors : vErrors.concat(validate215.errors);
errors = vErrors.length;
}
}
}
}
}
var _valid0 = _errs6 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.source_price_reason = true;
props0.fx = true;
props0.amounts = true;
props0.source_price = true;
}
ifClause0 = "then";
}
else {
const _errs14 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.source_price_reason !== undefined){
if(data.source_price_reason !== null){
const err4 = {instancePath:instancePath+"/source_price_reason",schemaPath:"#/allOf/0/else/properties/source_price_reason/type",keyword:"type",params:{type: "null"},message:"must be null"};
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
var _valid0 = _errs14 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.source_price_reason = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err5 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
const _errs18 = errors;
let valid7 = true;
const _errs19 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.time_basis === undefined) && (missing1 = "time_basis")){
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
if(data.time_basis !== undefined){
if("BUCKET_AT" !== data.time_basis){
const err7 = {};
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
var _valid1 = _errs19 === errors;
errors = _errs18;
if(vErrors !== null){
if(_errs18){
vErrors.length = _errs18;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs21 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.bucket_at !== undefined){
let data8 = data.bucket_at;
if(typeof data8 === "string"){
if(!pattern176.test(data8)){
const err8 = {instancePath:instancePath+"/bucket_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!(formats0.validate(data8))){
const err9 = {instancePath:instancePath+"/bucket_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err10 = {instancePath:instancePath+"/bucket_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
var _valid1 = _errs21 === errors;
valid7 = _valid1;
if(valid7){
var props1 = {};
props1.bucket_at = true;
props1.time_basis = true;
}
}
if(!valid7){
const err11 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
const _errs26 = errors;
let valid11 = true;
const _errs27 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.time_basis === undefined) && (missing2 = "time_basis")){
const err12 = {};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
if(data.time_basis !== undefined){
if("OBSERVED_AT" !== data.time_basis){
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
var _valid2 = _errs27 === errors;
errors = _errs26;
if(vErrors !== null){
if(_errs26){
vErrors.length = _errs26;
}
else {
vErrors = null;
}
}
if(_valid2){
const _errs29 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.bucket_at !== undefined){
if(data.bucket_at !== null){
const err14 = {instancePath:instancePath+"/bucket_at",schemaPath:"#/allOf/2/then/properties/bucket_at/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.observed_at !== undefined){
let data11 = data.observed_at;
if(typeof data11 === "string"){
if(!pattern176.test(data11)){
const err15 = {instancePath:instancePath+"/observed_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!(formats0.validate(data11))){
const err16 = {instancePath:instancePath+"/observed_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err17 = {instancePath:instancePath+"/observed_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
var _valid2 = _errs29 === errors;
valid11 = _valid2;
if(valid11){
var props2 = {};
props2.bucket_at = true;
props2.observed_at = true;
props2.time_basis = true;
}
}
if(!valid11){
const err18 = {instancePath,schemaPath:"#/allOf/2/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
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
const _errs36 = errors;
let valid15 = true;
const _errs37 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing3;
if((data.time_basis === undefined) && (missing3 = "time_basis")){
const err19 = {};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
else {
if(data.time_basis !== undefined){
if("UNAVAILABLE" !== data.time_basis){
const err20 = {};
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
}
var _valid3 = _errs37 === errors;
errors = _errs36;
if(vErrors !== null){
if(_errs36){
vErrors.length = _errs36;
}
else {
vErrors = null;
}
}
if(_valid3){
const _errs39 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.bucket_at !== undefined){
if(data.bucket_at !== null){
const err21 = {instancePath:instancePath+"/bucket_at",schemaPath:"#/allOf/3/then/properties/bucket_at/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.observed_at !== undefined){
if(data.observed_at !== null){
const err22 = {instancePath:instancePath+"/observed_at",schemaPath:"#/allOf/3/then/properties/observed_at/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.fx !== undefined){
if(data.fx !== null){
const err23 = {instancePath:instancePath+"/fx",schemaPath:"#/allOf/3/then/properties/fx/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.source_price !== undefined){
if(!(validate218(data.source_price, {instancePath:instancePath+"/source_price",parentData:data,parentDataProperty:"source_price",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate218.errors : vErrors.concat(validate218.errors);
errors = vErrors.length;
}
}
}
var _valid3 = _errs39 === errors;
valid15 = _valid3;
if(valid15){
var props3 = {};
props3.bucket_at = true;
props3.observed_at = true;
props3.fx = true;
props3.source_price = true;
props3.time_basis = true;
}
}
if(!valid15){
const err24 = {instancePath,schemaPath:"#/allOf/3/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
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
const _errs48 = errors;
let valid18 = true;
const _errs49 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing4;
if((data.identity_policy === undefined) && (missing4 = "identity_policy")){
const err25 = {};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
else {
if(data.identity_policy !== undefined){
if("CURRENT_EXACT_MHN_LATE_BIND_V1" !== data.identity_policy){
const err26 = {};
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
}
var _valid4 = _errs49 === errors;
errors = _errs48;
if(vErrors !== null){
if(_errs48){
vErrors.length = _errs48;
}
else {
vErrors = null;
}
}
let ifClause1;
if(_valid4){
const _errs51 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.late_bound !== undefined){
if(true !== data.late_bound){
const err27 = {instancePath:instancePath+"/late_bound",schemaPath:"#/allOf/4/then/properties/late_bound/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
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
var _valid4 = _errs51 === errors;
valid18 = _valid4;
if(valid18){
var props4 = {};
props4.late_bound = true;
props4.identity_policy = true;
}
ifClause1 = "then";
}
else {
const _errs53 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.late_bound !== undefined){
if(false !== data.late_bound){
const err28 = {instancePath:instancePath+"/late_bound",schemaPath:"#/allOf/4/else/properties/late_bound/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
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
var _valid4 = _errs53 === errors;
valid18 = _valid4;
if(valid18){
if(props4 !== true){
props4 = props4 || {};
props4.late_bound = true;
}
}
ifClause1 = "else";
}
if(!valid18){
const err29 = {instancePath,schemaPath:"#/allOf/4/if",keyword:"if",params:{failingKeyword: ifClause1},message:"must match \""+ifClause1+"\" schema"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(props0 !== true && props4 !== undefined){
if(props4 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props4);
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.quote_id === undefined){
const err30 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "quote_id"},message:"must have required property '"+"quote_id"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data.analysis_unit_id === undefined){
const err31 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "analysis_unit_id"},message:"must have required property '"+"analysis_unit_id"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data.item_id === undefined){
const err32 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "item_id"},message:"must have required property '"+"item_id"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data.quote_kind === undefined){
const err33 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "quote_kind"},message:"must have required property '"+"quote_kind"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data.source === undefined){
const err34 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source"},message:"must have required property '"+"source"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data.bucket_at === undefined){
const err35 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "bucket_at"},message:"must have required property '"+"bucket_at"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data.observed_at === undefined){
const err36 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observed_at"},message:"must have required property '"+"observed_at"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data.time_basis === undefined){
const err37 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "time_basis"},message:"must have required property '"+"time_basis"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data.source_updated_at === undefined){
const err38 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_updated_at"},message:"must have required property '"+"source_updated_at"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data.source_collected_at === undefined){
const err39 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_collected_at"},message:"must have required property '"+"source_collected_at"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data.source_available_at === undefined){
const err40 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_available_at"},message:"must have required property '"+"source_available_at"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data.identity_available_at === undefined){
const err41 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identity_available_at"},message:"must have required property '"+"identity_available_at"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data.identity_policy === undefined){
const err42 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identity_policy"},message:"must have required property '"+"identity_policy"+"'"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data.late_bound === undefined){
const err43 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "late_bound"},message:"must have required property '"+"late_bound"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data.source_price === undefined){
const err44 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_price"},message:"must have required property '"+"source_price"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data.source_price_reason === undefined){
const err45 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_price_reason"},message:"must have required property '"+"source_price_reason"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data.amounts === undefined){
const err46 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "amounts"},message:"must have required property '"+"amounts"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data.fx === undefined){
const err47 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fx"},message:"must have required property '"+"fx"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data.available_at === undefined){
const err48 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "available_at"},message:"must have required property '"+"available_at"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema352.properties, key0))){
const err49 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data.quote_id !== undefined){
let data20 = data.quote_id;
if(typeof data20 === "string"){
if(!pattern178.test(data20)){
const err50 = {instancePath:instancePath+"/quote_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err51 = {instancePath:instancePath+"/quote_id",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data21 = data.analysis_unit_id;
if(typeof data21 === "string"){
if(func2(data21) > 256){
const err52 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(func2(data21) < 1){
const err53 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(!pattern188.test(data21)){
const err54 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f\\ud800-\\udfff]+(?![\\s\\S])"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f\\ud800-\\udfff]+(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
else {
const err55 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data.item_id !== undefined){
let data22 = data.item_id;
if(typeof data22 === "string"){
if(!pattern198.test(data22)){
const err56 = {instancePath:instancePath+"/item_id",schemaPath:"#/$defs/itemId/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]{0,18}(?![\\s\\S])"},message:"must match pattern \""+"^[1-9][0-9]{0,18}(?![\\s\\S])"+"\""};
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
const err57 = {instancePath:instancePath+"/item_id",schemaPath:"#/$defs/itemId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data.quote_kind !== undefined){
let data23 = data.quote_kind;
if(!((data23 === "ASK") || (data23 === "BID"))){
const err58 = {instancePath:instancePath+"/quote_kind",schemaPath:"#/properties/quote_kind/enum",keyword:"enum",params:{allowedValues: schema352.properties.quote_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data.source !== undefined){
let data24 = data.source;
const _errs70 = errors;
let valid28 = true;
const _errs71 = errors;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
let missing5;
if((data24.quote_origin === undefined) && (missing5 = "quote_origin")){
const err59 = {};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
else {
if(data24.quote_origin !== undefined){
if("PROVIDER_AGGREGATE" !== data24.quote_origin){
const err60 = {};
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
}
var _valid5 = _errs71 === errors;
errors = _errs70;
if(vErrors !== null){
if(_errs70){
vErrors.length = _errs70;
}
else {
vErrors = null;
}
}
let ifClause2;
if(_valid5){
const _errs73 = errors;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
if(data24.logical_market !== undefined){
if(data24.logical_market !== null){
const err61 = {instancePath:instancePath+"/source/logical_market",schemaPath:"#/$defs/source/allOf/0/then/properties/logical_market/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data24.transport !== undefined){
if("upstream" !== data24.transport){
const err62 = {instancePath:instancePath+"/source/transport",schemaPath:"#/$defs/source/allOf/0/then/properties/transport/const",keyword:"const",params:{allowedValue: "upstream"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
}
var _valid5 = _errs73 === errors;
valid28 = _valid5;
if(valid28){
var props5 = {};
props5.logical_market = true;
props5.transport = true;
props5.quote_origin = true;
}
ifClause2 = "then";
}
else {
const _errs77 = errors;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
if(data24.logical_market !== undefined){
let data28 = data24.logical_market;
if(!(((data28 === "market_a") || (data28 === "market_c")) || (data28 === "market_b"))){
const err63 = {instancePath:instancePath+"/source/logical_market",schemaPath:"#/$defs/source/allOf/0/else/properties/logical_market/enum",keyword:"enum",params:{allowedValues: schema366.allOf[0].else.properties.logical_market.enum},message:"must be equal to one of the allowed values"};
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
var _valid5 = _errs77 === errors;
valid28 = _valid5;
if(valid28){
if(props5 !== true){
props5 = props5 || {};
props5.logical_market = true;
}
}
ifClause2 = "else";
}
if(!valid28){
const err64 = {instancePath:instancePath+"/source",schemaPath:"#/$defs/source/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause2},message:"must match \""+ifClause2+"\" schema"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
const _errs80 = errors;
let valid32 = true;
const _errs81 = errors;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
let missing6;
if((data24.transport === undefined) && (missing6 = "transport")){
const err65 = {};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
else {
if(data24.transport !== undefined){
if("market_b_direct" !== data24.transport){
const err66 = {};
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
var _valid6 = _errs81 === errors;
errors = _errs80;
if(vErrors !== null){
if(_errs80){
vErrors.length = _errs80;
}
else {
vErrors = null;
}
}
if(_valid6){
const _errs83 = errors;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
if(data24.quote_origin !== undefined){
if("SOURCE_QUOTE" !== data24.quote_origin){
const err67 = {instancePath:instancePath+"/source/quote_origin",schemaPath:"#/$defs/source/allOf/1/then/properties/quote_origin/const",keyword:"const",params:{allowedValue: "SOURCE_QUOTE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data24.logical_market !== undefined){
if("market_b" !== data24.logical_market){
const err68 = {instancePath:instancePath+"/source/logical_market",schemaPath:"#/$defs/source/allOf/1/then/properties/logical_market/const",keyword:"const",params:{allowedValue: "market_b"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
}
var _valid6 = _errs83 === errors;
valid32 = _valid6;
if(valid32){
var props6 = {};
props6.quote_origin = true;
props6.logical_market = true;
props6.transport = true;
}
}
if(!valid32){
const err69 = {instancePath:instancePath+"/source",schemaPath:"#/$defs/source/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(props5 !== true && props6 !== undefined){
if(props6 === true){
props5 = true;
}
else {
props5 = props5 || {};
Object.assign(props5, props6);
}
}
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
if(data24.quote_origin === undefined){
const err70 = {instancePath:instancePath+"/source",schemaPath:"#/$defs/source/required",keyword:"required",params:{missingProperty: "quote_origin"},message:"must have required property '"+"quote_origin"+"'"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(data24.logical_market === undefined){
const err71 = {instancePath:instancePath+"/source",schemaPath:"#/$defs/source/required",keyword:"required",params:{missingProperty: "logical_market"},message:"must have required property '"+"logical_market"+"'"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(data24.transport === undefined){
const err72 = {instancePath:instancePath+"/source",schemaPath:"#/$defs/source/required",keyword:"required",params:{missingProperty: "transport"},message:"must have required property '"+"transport"+"'"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
for(const key1 in data24){
if(!(((key1 === "quote_origin") || (key1 === "logical_market")) || (key1 === "transport"))){
const err73 = {instancePath:instancePath+"/source",schemaPath:"#/$defs/source/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data24.quote_origin !== undefined){
let data32 = data24.quote_origin;
if(!((data32 === "SOURCE_QUOTE") || (data32 === "PROVIDER_AGGREGATE"))){
const err74 = {instancePath:instancePath+"/source/quote_origin",schemaPath:"#/$defs/source/properties/quote_origin/enum",keyword:"enum",params:{allowedValues: schema366.properties.quote_origin.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data24.logical_market !== undefined){
let data33 = data24.logical_market;
if(!((((data33 === "market_a") || (data33 === "market_c")) || (data33 === "market_b")) || (data33 === null))){
const err75 = {instancePath:instancePath+"/source/logical_market",schemaPath:"#/$defs/source/properties/logical_market/enum",keyword:"enum",params:{allowedValues: schema366.properties.logical_market.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data24.transport !== undefined){
let data34 = data24.transport;
if(!((data34 === "upstream") || (data34 === "market_b_direct"))){
const err76 = {instancePath:instancePath+"/source/transport",schemaPath:"#/$defs/source/properties/transport/enum",keyword:"enum",params:{allowedValues: schema366.properties.transport.enum},message:"must be equal to one of the allowed values"};
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
else {
const err77 = {instancePath:instancePath+"/source",schemaPath:"#/$defs/source/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data.bucket_at !== undefined){
if(!(validate220(data.bucket_at, {instancePath:instancePath+"/bucket_at",parentData:data,parentDataProperty:"bucket_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
errors = vErrors.length;
}
}
if(data.observed_at !== undefined){
if(!(validate220(data.observed_at, {instancePath:instancePath+"/observed_at",parentData:data,parentDataProperty:"observed_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
errors = vErrors.length;
}
}
if(data.time_basis !== undefined){
let data37 = data.time_basis;
if(!(((data37 === "BUCKET_AT") || (data37 === "OBSERVED_AT")) || (data37 === "UNAVAILABLE"))){
const err78 = {instancePath:instancePath+"/time_basis",schemaPath:"#/properties/time_basis/enum",keyword:"enum",params:{allowedValues: schema352.properties.time_basis.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data.source_updated_at !== undefined){
if(!(validate220(data.source_updated_at, {instancePath:instancePath+"/source_updated_at",parentData:data,parentDataProperty:"source_updated_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
errors = vErrors.length;
}
}
if(data.source_collected_at !== undefined){
if(!(validate220(data.source_collected_at, {instancePath:instancePath+"/source_collected_at",parentData:data,parentDataProperty:"source_collected_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
errors = vErrors.length;
}
}
if(data.source_available_at !== undefined){
let data40 = data.source_available_at;
if(typeof data40 === "string"){
if(!pattern176.test(data40)){
const err79 = {instancePath:instancePath+"/source_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(!(formats0.validate(data40))){
const err80 = {instancePath:instancePath+"/source_available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
else {
const err81 = {instancePath:instancePath+"/source_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
if(data.identity_available_at !== undefined){
let data41 = data.identity_available_at;
if(typeof data41 === "string"){
if(!pattern176.test(data41)){
const err82 = {instancePath:instancePath+"/identity_available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(!(formats0.validate(data41))){
const err83 = {instancePath:instancePath+"/identity_available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
else {
const err84 = {instancePath:instancePath+"/identity_available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
if(data.identity_policy !== undefined){
let data42 = data.identity_policy;
if(!((data42 === "CATALOG_SNAPSHOT_EXACT_ITEM_V1") || (data42 === "CURRENT_EXACT_MHN_LATE_BIND_V1"))){
const err85 = {instancePath:instancePath+"/identity_policy",schemaPath:"#/properties/identity_policy/enum",keyword:"enum",params:{allowedValues: schema352.properties.identity_policy.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data.late_bound !== undefined){
if(typeof data.late_bound !== "boolean"){
const err86 = {instancePath:instancePath+"/late_bound",schemaPath:"#/properties/late_bound/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data.source_price !== undefined){
let data44 = data.source_price;
const _errs105 = errors;
let valid38 = false;
let passing0 = null;
const _errs106 = errors;
if(!(validate218(data44, {instancePath:instancePath+"/source_price",parentData:data,parentDataProperty:"source_price",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate218.errors : vErrors.concat(validate218.errors);
errors = vErrors.length;
}
var _valid7 = _errs106 === errors;
if(_valid7){
valid38 = true;
passing0 = 0;
}
const _errs107 = errors;
if(data44 !== null){
const err87 = {instancePath:instancePath+"/source_price",schemaPath:"#/properties/source_price/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
var _valid7 = _errs107 === errors;
if(_valid7 && valid38){
valid38 = false;
passing0 = [passing0, 1];
}
else {
if(_valid7){
valid38 = true;
passing0 = 1;
}
}
if(!valid38){
const err88 = {instancePath:instancePath+"/source_price",schemaPath:"#/properties/source_price/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
else {
errors = _errs105;
if(vErrors !== null){
if(_errs105){
vErrors.length = _errs105;
}
else {
vErrors = null;
}
}
}
}
if(data.source_price_reason !== undefined){
let data45 = data.source_price_reason;
const _errs110 = errors;
let valid39 = false;
let passing1 = null;
const _errs111 = errors;
if(!(((data45 === "SOURCE_UNAVAILABLE") || (data45 === "CAPTURE_GAP")) || (data45 === "SOURCE_CONFLICT"))){
const err89 = {instancePath:instancePath+"/source_price_reason",schemaPath:"#/$defs/sourceReason/enum",keyword:"enum",params:{allowedValues: schema353.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
var _valid8 = _errs111 === errors;
if(_valid8){
valid39 = true;
passing1 = 0;
}
const _errs113 = errors;
if(data45 !== null){
const err90 = {instancePath:instancePath+"/source_price_reason",schemaPath:"#/properties/source_price_reason/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
var _valid8 = _errs113 === errors;
if(_valid8 && valid39){
valid39 = false;
passing1 = [passing1, 1];
}
else {
if(_valid8){
valid39 = true;
passing1 = 1;
}
}
if(!valid39){
const err91 = {instancePath:instancePath+"/source_price_reason",schemaPath:"#/properties/source_price_reason/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
else {
errors = _errs110;
if(vErrors !== null){
if(_errs110){
vErrors.length = _errs110;
}
else {
vErrors = null;
}
}
}
}
if(data.amounts !== undefined){
if(!(validate226(data.amounts, {instancePath:instancePath+"/amounts",parentData:data,parentDataProperty:"amounts",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate226.errors : vErrors.concat(validate226.errors);
errors = vErrors.length;
}
}
if(data.fx !== undefined){
let data47 = data.fx;
const _errs117 = errors;
let valid41 = false;
let passing2 = null;
const _errs118 = errors;
if(!(validate234(data47, {instancePath:instancePath+"/fx",parentData:data,parentDataProperty:"fx",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate234.errors : vErrors.concat(validate234.errors);
errors = vErrors.length;
}
var _valid9 = _errs118 === errors;
if(_valid9){
valid41 = true;
passing2 = 0;
}
const _errs119 = errors;
if(data47 !== null){
const err92 = {instancePath:instancePath+"/fx",schemaPath:"#/properties/fx/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
var _valid9 = _errs119 === errors;
if(_valid9 && valid41){
valid41 = false;
passing2 = [passing2, 1];
}
else {
if(_valid9){
valid41 = true;
passing2 = 1;
}
}
if(!valid41){
const err93 = {instancePath:instancePath+"/fx",schemaPath:"#/properties/fx/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
else {
errors = _errs117;
if(vErrors !== null){
if(_errs117){
vErrors.length = _errs117;
}
else {
vErrors = null;
}
}
}
}
if(data.available_at !== undefined){
let data48 = data.available_at;
if(typeof data48 === "string"){
if(!pattern176.test(data48)){
const err94 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
if(!(formats0.validate(data48))){
const err95 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
else {
const err96 = {instancePath:instancePath+"/available_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
}
else {
const err97 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
validate214.errors = vErrors;
return errors === 0;
}
validate214.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate210(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate210.evaluated;
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
if(data.snapshot === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.items === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "items"},message:"must have required property '"+"items"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.pagination === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pagination"},message:"must have required property '"+"pagination"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.document_hash === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_hash"},message:"must have required property '"+"document_hash"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query")) || (key0 === "snapshot")) || (key0 === "items")) || (key0 === "pagination")) || (key0 === "document_hash"))){
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
if("price-display-api" !== data.api_contract){
const err9 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "price-display-api"},message:"must be equal to constant"};
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
if("PRICE_ITEM" !== data.response_kind){
const err11 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "PRICE_ITEM"},message:"must be equal to constant"};
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
if(!(validate211(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate211.errors : vErrors.concat(validate211.errors);
errors = vErrors.length;
}
}
if(data.snapshot !== undefined){
let data4 = data.snapshot;
if(!(validate205(data4, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate205.errors : vErrors.concat(validate205.errors);
errors = vErrors.length;
}
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.kind !== undefined){
if("CURRENT" !== data4.kind){
const err12 = {instancePath:instancePath+"/snapshot/kind",schemaPath:"#/properties/snapshot/allOf/1/properties/kind/const",keyword:"const",params:{allowedValue: "CURRENT"},message:"must be equal to constant"};
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
if(data.items !== undefined){
let data6 = data.items;
if(Array.isArray(data6)){
if(data6.length > 200){
const err13 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/maxItems",keyword:"maxItems",params:{limit: 200},message:"must NOT have more than 200 items"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
if(!(validate214(data6[i0], {instancePath:instancePath+"/items/" + i0,parentData:data6,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate214.errors : vErrors.concat(validate214.errors);
errors = vErrors.length;
}
}
}
else {
const err14 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.pagination !== undefined){
if(data.pagination !== null){
const err15 = {instancePath:instancePath+"/pagination",schemaPath:"#/properties/pagination/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.document_hash !== undefined){
let data9 = data.document_hash;
if(typeof data9 === "string"){
if(!pattern178.test(data9)){
const err16 = {instancePath:instancePath+"/document_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err17 = {instancePath:instancePath+"/document_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate210.errors = vErrors;
return errors === 0;
}
validate210.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema387 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","snapshot","items","pagination","document_hash"],"properties":{"api_contract":{"const":"price-display-api"},"api_version":{"const":"v1"},"response_kind":{"const":"PRICE_HISTORY"},"query":{"$ref":"#/$defs/historyQuery"},"snapshot":{"allOf":[{"$ref":"#/$defs/snapshot"},{"properties":{"kind":{"const":"HISTORY"}}}]},"items":{"type":"array","maxItems":200,"items":{"$ref":"#/$defs/quote"}},"pagination":{"$ref":"#/$defs/pagination"},"document_hash":{"$ref":"#/$defs/sha256"}}};
const schema388 = {"type":"object","additionalProperties":false,"required":["analysis_unit_id","snapshot_id","as_of","known_at","from","to","quote_origin","logical_market","quote_kind","page_size","cursor","sort"],"properties":{"analysis_unit_id":{"$ref":"#/$defs/identifier"},"snapshot_id":{"$ref":"#/$defs/sha256"},"as_of":{"$ref":"#/$defs/timestamp"},"known_at":{"$ref":"#/$defs/timestamp"},"from":{"$ref":"#/$defs/timestamp"},"to":{"$ref":"#/$defs/timestamp"},"quote_origin":{"enum":["SOURCE_QUOTE","PROVIDER_AGGREGATE",null]},"logical_market":{"enum":["market_a","market_c","market_b",null]},"quote_kind":{"enum":["ASK","BID",null]},"page_size":{"type":"integer","minimum":1,"maximum":200},"cursor":{"oneOf":[{"$ref":"#/$defs/cursor"},{"type":"null"}]},"sort":{"const":"EVENT_SOURCE_QUOTE_ID_ASC"}}};

function validate239(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate239.evaluated;
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
if(data.snapshot_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
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
if(data.from === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "from"},message:"must have required property '"+"from"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.to === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "to"},message:"must have required property '"+"to"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.quote_origin === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "quote_origin"},message:"must have required property '"+"quote_origin"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.logical_market === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "logical_market"},message:"must have required property '"+"logical_market"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.quote_kind === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "quote_kind"},message:"must have required property '"+"quote_kind"+"'"};
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
if(data.cursor === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cursor"},message:"must have required property '"+"cursor"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.sort === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sort"},message:"must have required property '"+"sort"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema388.properties, key0))){
const err12 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.analysis_unit_id !== undefined){
let data0 = data.analysis_unit_id;
if(typeof data0 === "string"){
if(func2(data0) > 256){
const err13 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data0) < 1){
const err14 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!pattern188.test(data0)){
const err15 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/pattern",keyword:"pattern",params:{pattern: "^[^\\u0000-\\u001f\\u007f\\ud800-\\udfff]+(?![\\s\\S])"},message:"must match pattern \""+"^[^\\u0000-\\u001f\\u007f\\ud800-\\udfff]+(?![\\s\\S])"+"\""};
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
const err16 = {instancePath:instancePath+"/analysis_unit_id",schemaPath:"#/$defs/identifier/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data1 = data.snapshot_id;
if(typeof data1 === "string"){
if(!pattern178.test(data1)){
const err17 = {instancePath:instancePath+"/snapshot_id",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
if(data.as_of !== undefined){
let data2 = data.as_of;
if(typeof data2 === "string"){
if(!pattern176.test(data2)){
const err19 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!(formats0.validate(data2))){
const err20 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err21 = {instancePath:instancePath+"/as_of",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.known_at !== undefined){
let data3 = data.known_at;
if(typeof data3 === "string"){
if(!pattern176.test(data3)){
const err22 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(!(formats0.validate(data3))){
const err23 = {instancePath:instancePath+"/known_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
if(data.from !== undefined){
let data4 = data.from;
if(typeof data4 === "string"){
if(!pattern176.test(data4)){
const err25 = {instancePath:instancePath+"/from",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!(formats0.validate(data4))){
const err26 = {instancePath:instancePath+"/from",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err27 = {instancePath:instancePath+"/from",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.to !== undefined){
let data5 = data.to;
if(typeof data5 === "string"){
if(!pattern176.test(data5)){
const err28 = {instancePath:instancePath+"/to",schemaPath:"#/$defs/timestamp/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{6}Z(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(!(formats0.validate(data5))){
const err29 = {instancePath:instancePath+"/to",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err30 = {instancePath:instancePath+"/to",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.quote_origin !== undefined){
let data6 = data.quote_origin;
if(!(((data6 === "SOURCE_QUOTE") || (data6 === "PROVIDER_AGGREGATE")) || (data6 === null))){
const err31 = {instancePath:instancePath+"/quote_origin",schemaPath:"#/properties/quote_origin/enum",keyword:"enum",params:{allowedValues: schema388.properties.quote_origin.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.logical_market !== undefined){
let data7 = data.logical_market;
if(!((((data7 === "market_a") || (data7 === "market_c")) || (data7 === "market_b")) || (data7 === null))){
const err32 = {instancePath:instancePath+"/logical_market",schemaPath:"#/properties/logical_market/enum",keyword:"enum",params:{allowedValues: schema388.properties.logical_market.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.quote_kind !== undefined){
let data8 = data.quote_kind;
if(!(((data8 === "ASK") || (data8 === "BID")) || (data8 === null))){
const err33 = {instancePath:instancePath+"/quote_kind",schemaPath:"#/properties/quote_kind/enum",keyword:"enum",params:{allowedValues: schema388.properties.quote_kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.page_size !== undefined){
let data9 = data.page_size;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err34 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if((typeof data9 == "number") && (isFinite(data9))){
if(data9 > 200 || isNaN(data9)){
const err35 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 200},message:"must be <= 200"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data9 < 1 || isNaN(data9)){
const err36 = {instancePath:instancePath+"/page_size",schemaPath:"#/properties/page_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.cursor !== undefined){
let data10 = data.cursor;
const _errs26 = errors;
let valid7 = false;
let passing0 = null;
const _errs27 = errors;
if(typeof data10 === "string"){
if(func2(data10) > 8192){
const err37 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/cursor/maxLength",keyword:"maxLength",params:{limit: 8192},message:"must NOT have more than 8192 characters"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(func2(data10) < 1){
const err38 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/cursor/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(!pattern186.test(data10)){
const err39 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/cursor/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_-]+(?![\\s\\S])"+"\""};
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
const err40 = {instancePath:instancePath+"/cursor",schemaPath:"#/$defs/cursor/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
var _valid0 = _errs27 === errors;
if(_valid0){
valid7 = true;
passing0 = 0;
}
const _errs30 = errors;
if(data10 !== null){
const err41 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
var _valid0 = _errs30 === errors;
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
const err42 = {instancePath:instancePath+"/cursor",schemaPath:"#/properties/cursor/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
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
if(data.sort !== undefined){
if("EVENT_SOURCE_QUOTE_ID_ASC" !== data.sort){
const err43 = {instancePath:instancePath+"/sort",schemaPath:"#/properties/sort/const",keyword:"const",params:{allowedValue: "EVENT_SOURCE_QUOTE_ID_ASC"},message:"must be equal to constant"};
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
const err44 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
validate239.errors = vErrors;
return errors === 0;
}
validate239.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate238(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate238.evaluated;
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
if(data.snapshot === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.items === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "items"},message:"must have required property '"+"items"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.pagination === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pagination"},message:"must have required property '"+"pagination"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.document_hash === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_hash"},message:"must have required property '"+"document_hash"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "api_contract") || (key0 === "api_version")) || (key0 === "response_kind")) || (key0 === "query")) || (key0 === "snapshot")) || (key0 === "items")) || (key0 === "pagination")) || (key0 === "document_hash"))){
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
if("price-display-api" !== data.api_contract){
const err9 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "price-display-api"},message:"must be equal to constant"};
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
if("PRICE_HISTORY" !== data.response_kind){
const err11 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "PRICE_HISTORY"},message:"must be equal to constant"};
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
if(!(validate239(data.query, {instancePath:instancePath+"/query",parentData:data,parentDataProperty:"query",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate239.errors : vErrors.concat(validate239.errors);
errors = vErrors.length;
}
}
if(data.snapshot !== undefined){
let data4 = data.snapshot;
if(!(validate205(data4, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate205.errors : vErrors.concat(validate205.errors);
errors = vErrors.length;
}
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.kind !== undefined){
if("HISTORY" !== data4.kind){
const err12 = {instancePath:instancePath+"/snapshot/kind",schemaPath:"#/properties/snapshot/allOf/1/properties/kind/const",keyword:"const",params:{allowedValue: "HISTORY"},message:"must be equal to constant"};
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
if(data.items !== undefined){
let data6 = data.items;
if(Array.isArray(data6)){
if(data6.length > 200){
const err13 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/maxItems",keyword:"maxItems",params:{limit: 200},message:"must NOT have more than 200 items"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
if(!(validate214(data6[i0], {instancePath:instancePath+"/items/" + i0,parentData:data6,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate214.errors : vErrors.concat(validate214.errors);
errors = vErrors.length;
}
}
}
else {
const err14 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.pagination !== undefined){
if(!(validate207(data.pagination, {instancePath:instancePath+"/pagination",parentData:data,parentDataProperty:"pagination",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate207.errors : vErrors.concat(validate207.errors);
errors = vErrors.length;
}
}
if(data.document_hash !== undefined){
let data9 = data.document_hash;
if(typeof data9 === "string"){
if(!pattern178.test(data9)){
const err15 = {instancePath:instancePath+"/document_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err16 = {instancePath:instancePath+"/document_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate238.errors = vErrors;
return errors === 0;
}
validate238.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema397 = {"type":"object","additionalProperties":false,"required":["api_contract","api_version","response_kind","query","snapshot","items","pagination","error","document_hash"],"properties":{"api_contract":{"const":"price-display-api"},"api_version":{"const":"v1"},"response_kind":{"const":"ERROR"},"query":{"type":"null"},"snapshot":{"type":"null"},"items":{"type":"array","maxItems":0},"pagination":{"type":"null"},"error":{"$ref":"#/$defs/error"},"document_hash":{"$ref":"#/$defs/sha256"}}};
const schema398 = {"type":"object","additionalProperties":false,"required":["code","http_status","retryable"],"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR","NOT_FOUND","CONTRACT_UNAVAILABLE","RECORD_CORRUPT","BACKEND_UNAVAILABLE"]},"http_status":{"type":"integer","enum":[400,404,503]},"retryable":{"type":"boolean"}},"oneOf":[{"properties":{"code":{"enum":["INVALID_ARGUMENT","INVALID_CURSOR"]},"http_status":{"const":400},"retryable":{"const":false}}},{"properties":{"code":{"const":"NOT_FOUND"},"http_status":{"const":404},"retryable":{"const":false}}},{"properties":{"code":{"const":"RECORD_CORRUPT"},"http_status":{"const":503},"retryable":{"const":false}}},{"properties":{"code":{"enum":["CONTRACT_UNAVAILABLE","BACKEND_UNAVAILABLE"]},"http_status":{"const":503},"retryable":{"const":true}}}]};

function validate245(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate245.evaluated;
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
if(data.snapshot === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.items === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "items"},message:"must have required property '"+"items"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.pagination === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pagination"},message:"must have required property '"+"pagination"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.error === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "error"},message:"must have required property '"+"error"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.document_hash === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_hash"},message:"must have required property '"+"document_hash"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func9.call(schema397.properties, key0))){
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
if(data.api_contract !== undefined){
if("price-display-api" !== data.api_contract){
const err10 = {instancePath:instancePath+"/api_contract",schemaPath:"#/properties/api_contract/const",keyword:"const",params:{allowedValue: "price-display-api"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.api_version !== undefined){
if("v1" !== data.api_version){
const err11 = {instancePath:instancePath+"/api_version",schemaPath:"#/properties/api_version/const",keyword:"const",params:{allowedValue: "v1"},message:"must be equal to constant"};
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
if("ERROR" !== data.response_kind){
const err12 = {instancePath:instancePath+"/response_kind",schemaPath:"#/properties/response_kind/const",keyword:"const",params:{allowedValue: "ERROR"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.query !== undefined){
if(data.query !== null){
const err13 = {instancePath:instancePath+"/query",schemaPath:"#/properties/query/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.snapshot !== undefined){
if(data.snapshot !== null){
const err14 = {instancePath:instancePath+"/snapshot",schemaPath:"#/properties/snapshot/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.items !== undefined){
let data5 = data.items;
if(Array.isArray(data5)){
if(data5.length > 0){
const err15 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/maxItems",keyword:"maxItems",params:{limit: 0},message:"must NOT have more than 0 items"};
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
const err16 = {instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.pagination !== undefined){
if(data.pagination !== null){
const err17 = {instancePath:instancePath+"/pagination",schemaPath:"#/properties/pagination/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.error !== undefined){
let data7 = data.error;
const _errs16 = errors;
let valid2 = false;
let passing0 = null;
const _errs17 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.code !== undefined){
let data8 = data7.code;
if(!((data8 === "INVALID_ARGUMENT") || (data8 === "INVALID_CURSOR"))){
const err18 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/oneOf/0/properties/code/enum",keyword:"enum",params:{allowedValues: schema398.oneOf[0].properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data7.http_status !== undefined){
if(400 !== data7.http_status){
const err19 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/oneOf/0/properties/http_status/const",keyword:"const",params:{allowedValue: 400},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data7.retryable !== undefined){
if(false !== data7.retryable){
const err20 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/oneOf/0/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
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
var _valid0 = _errs17 === errors;
if(_valid0){
valid2 = true;
passing0 = 0;
var props0 = {};
props0.code = true;
props0.http_status = true;
props0.retryable = true;
}
const _errs21 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.code !== undefined){
if("NOT_FOUND" !== data7.code){
const err21 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/oneOf/1/properties/code/const",keyword:"const",params:{allowedValue: "NOT_FOUND"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data7.http_status !== undefined){
if(404 !== data7.http_status){
const err22 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/oneOf/1/properties/http_status/const",keyword:"const",params:{allowedValue: 404},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data7.retryable !== undefined){
if(false !== data7.retryable){
const err23 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/oneOf/1/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
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
var _valid0 = _errs21 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid2 = true;
passing0 = 1;
if(props0 !== true){
props0 = props0 || {};
props0.code = true;
props0.http_status = true;
props0.retryable = true;
}
}
const _errs25 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.code !== undefined){
if("RECORD_CORRUPT" !== data7.code){
const err24 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/oneOf/2/properties/code/const",keyword:"const",params:{allowedValue: "RECORD_CORRUPT"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data7.http_status !== undefined){
if(503 !== data7.http_status){
const err25 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/oneOf/2/properties/http_status/const",keyword:"const",params:{allowedValue: 503},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data7.retryable !== undefined){
if(false !== data7.retryable){
const err26 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/oneOf/2/properties/retryable/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
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
var _valid0 = _errs25 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid2 = true;
passing0 = 2;
if(props0 !== true){
props0 = props0 || {};
props0.code = true;
props0.http_status = true;
props0.retryable = true;
}
}
const _errs29 = errors;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.code !== undefined){
let data17 = data7.code;
if(!((data17 === "CONTRACT_UNAVAILABLE") || (data17 === "BACKEND_UNAVAILABLE"))){
const err27 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/oneOf/3/properties/code/enum",keyword:"enum",params:{allowedValues: schema398.oneOf[3].properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data7.http_status !== undefined){
if(503 !== data7.http_status){
const err28 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/oneOf/3/properties/http_status/const",keyword:"const",params:{allowedValue: 503},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data7.retryable !== undefined){
if(true !== data7.retryable){
const err29 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/oneOf/3/properties/retryable/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
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
var _valid0 = _errs29 === errors;
if(_valid0 && valid2){
valid2 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid2 = true;
passing0 = 3;
if(props0 !== true){
props0 = props0 || {};
props0.code = true;
props0.http_status = true;
props0.retryable = true;
}
}
}
}
}
if(!valid2){
const err30 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
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
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.code === undefined){
const err31 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data7.http_status === undefined){
const err32 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/required",keyword:"required",params:{missingProperty: "http_status"},message:"must have required property '"+"http_status"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data7.retryable === undefined){
const err33 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
for(const key1 in data7){
if(!(((key1 === "code") || (key1 === "http_status")) || (key1 === "retryable"))){
const err34 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data7.code !== undefined){
let data20 = data7.code;
if(!((((((data20 === "INVALID_ARGUMENT") || (data20 === "INVALID_CURSOR")) || (data20 === "NOT_FOUND")) || (data20 === "CONTRACT_UNAVAILABLE")) || (data20 === "RECORD_CORRUPT")) || (data20 === "BACKEND_UNAVAILABLE"))){
const err35 = {instancePath:instancePath+"/error/code",schemaPath:"#/$defs/error/properties/code/enum",keyword:"enum",params:{allowedValues: schema398.properties.code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data7.http_status !== undefined){
let data21 = data7.http_status;
if(!(((typeof data21 == "number") && (!(data21 % 1) && !isNaN(data21))) && (isFinite(data21)))){
const err36 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/properties/http_status/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(!(((data21 === 400) || (data21 === 404)) || (data21 === 503))){
const err37 = {instancePath:instancePath+"/error/http_status",schemaPath:"#/$defs/error/properties/http_status/enum",keyword:"enum",params:{allowedValues: schema398.properties.http_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data7.retryable !== undefined){
if(typeof data7.retryable !== "boolean"){
const err38 = {instancePath:instancePath+"/error/retryable",schemaPath:"#/$defs/error/properties/retryable/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
const err39 = {instancePath:instancePath+"/error",schemaPath:"#/$defs/error/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data.document_hash !== undefined){
let data23 = data.document_hash;
if(typeof data23 === "string"){
if(!pattern178.test(data23)){
const err40 = {instancePath:instancePath+"/document_hash",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
const err41 = {instancePath:instancePath+"/document_hash",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate245.errors = vErrors;
return errors === 0;
}
validate245.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate201(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:cs2-research:price-display-api:v1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate201.evaluated;
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
if(!(validate202(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate202.errors : vErrors.concat(validate202.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate210(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate210.errors : vErrors.concat(validate210.errors);
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
if(!(validate238(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate238.errors : vErrors.concat(validate238.errors);
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
if(!(validate245(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate245.errors : vErrors.concat(validate245.errors);
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
validate201.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate201.evaluated = {"dynamicProps":true,"dynamicItems":false};
