import { createHash } from 'node:crypto'
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import standaloneCode from 'ajv/dist/standalone/index.js'
import addFormats from 'ajv-formats'

const frontendRoot = resolve(import.meta.dirname, '..')
const repositoryRoot = resolve(frontendRoot, '..')
const outputRoot = resolve(frontendRoot, 'src', 'wire', 'generated')

const schemaSpecs = [
  {
    exportName: 'validateResultEnvelope',
    fileStem: 'resultEnvelopeValidator',
    schema: 'research-result-envelope.v1.schema.json',
  },
  {
    exportName: 'validateQualityEnvelope',
    fileStem: 'qualityEnvelopeValidator',
    schema: 'research-quality-envelope.v1.schema.json',
  },
  {
    exportName: 'validateResultReadApiResponse',
    fileStem: 'resultReadApiValidator',
    schema: 'result-read-api.v1.schema.json',
  },
  {
    exportName: 'validateCatalogDisplayApiResponse',
    fileStem: 'catalogDisplayApiValidator',
    schema: 'catalog-display-api.v1.schema.json',
  },
  {
    exportName: 'validateCatalogDisplaySnapshotApiResponse',
    fileStem: 'catalogDisplaySnapshotApiValidator',
    schema: 'catalog-display-snapshot-api.v1.schema.json',
  },
  {
    exportName: 'validateCatalogDisplayQueryApiResponse',
    fileStem: 'catalogDisplayQueryApiValidator',
    schema: 'catalog-display-query-api.v1.schema.json',
  },
  {
    exportName: 'validateValveEventApiResponse',
    fileStem: 'valveEventApiValidator',
    schema: 'valve-event-public-api-v1.schema.json',
    transform: relaxValveEventConsumerSchema,
  },
  {
    exportName: 'validateFxReferenceApiResponse',
    fileStem: 'fxReferenceApiValidator',
    schema: 'fx-reference-api.v1.schema.json',
  },
  {
    exportName: 'validatePriceDisplayApiResponse',
    fileStem: 'priceDisplayApiValidator',
    schema: 'price-display-api.v1.schema.json',
  },
  {
    exportName: 'validateMarketWatchlistPublicApiResponse',
    fileStem: 'marketWatchlistPublicApiValidator',
    schema: 'market-watchlist-public-api.v1.schema.json',
  },
  {
    exportName: 'validateMarketWatchlistObservationApiResponse',
    fileStem: 'marketWatchlistObservationApiValidator',
    schema: 'market-watchlist-public-observation-api.v1.schema.json',
  },
  {
    exportName: 'validateMarketDescriptivePublicApiResponse',
    fileStem: 'marketDescriptivePublicApiValidator',
    schema: 'market-descriptive-public-api.v1.schema.json',
  },
  {
    exportName: 'validateMarketSectorIndexPublicApiResponse',
    fileStem: 'marketSectorIndexPublicApiValidator',
    schema: 'market-sector-index-public-api.v1.schema.json',
    transform: makeMarketSectorIndexStrictRequiredExplicit,
  },
  {
    exportName: 'validateMarketSectorIndexPublicApiV2Response',
    fileStem: 'marketSectorIndexPublicApiV2Validator',
    schema: 'market-sector-index-public-api.v2.schema.json',
  },
  {
    exportName: 'validateMarketSectorIndexPublicApiV3Response',
    fileStem: 'marketSectorIndexPublicApiV3Validator',
    schema: 'market-sector-index-public-api.v3.schema.json',
  },
  {
    exportName: 'validateSingleItemTrendingPublicApiResponse',
    fileStem: 'singleItemTrendingPublicApiValidator',
    schema: 'single-item-trending-public-api.v2.schema.json',
  },
  {
    exportName: 'validateSingleItemMonitorPublicApiResponse',
    fileStem: 'singleItemMonitorPublicApiValidator',
    schema: 'single-item-monitor-public-api.v1.schema.json',
  },
  {
    exportName: 'validateSingleItemCurrentPublicApiResponse',
    fileStem: 'singleItemCurrentPublicApiValidator',
    schema: 'single-item-current-public-api.v1.schema.json',
  },
  {
    exportName: 'validateSingleItemHistoryPublicApiResponse',
    fileStem: 'singleItemHistoryPublicApiValidator',
    schema: 'single-item-history-public-api.v1.schema.json',
  },
  {
    exportName: 'validateSingleItemTrendingPublicApiV3Response',
    fileStem: 'singleItemTrendingPublicApiV3Validator',
    schema: 'single-item-trending-public-api.v3.schema.json',
  },
  {
    exportName: 'validateSingleItemTrendingPublicApiV4Response',
    fileStem: 'singleItemTrendingPublicApiV4Validator',
    schema: 'single-item-trending-public-api.v4.schema.json',
  },
]

const outputNames = [
  'wireValidators.js',
  'wireValidators.d.ts',
  ...schemaSpecs.flatMap(({ fileStem }) => [
    `${fileStem}.js`,
    `${fileStem}.d.ts`,
  ]),
]

function schemaSource(name, lineEndingProbe = null) {
  const path = resolve(repositoryRoot, 'schemas', name)
  let text = readFileSync(path, 'utf8')
  if (lineEndingProbe !== null) text = text.replace(/\r\n?/gu, '\n').replaceAll('\n', lineEndingProbe)
  // Source hashes identify LF-normalized schema text, never historical evidence bytes.
  const canonicalText = text.replace(/\r\n?/gu, '\n')
  const value = JSON.parse(canonicalText)
  if (typeof value.$id !== 'string' || value.$id.length === 0) {
    throw new Error(`${name} has no stable $id`)
  }
  return {
    name,
    sha256: createHash('sha256').update(canonicalText, 'utf8').digest('hex'),
    value,
  }
}

function enumType(values) {
  const types = [
    ...new Set(values.map((value) => (value === null ? 'null' : typeof value))),
  ]
  return types.length === 1 ? types[0] : types
}

function relaxValveEventConsumerSchema(schema) {
  const copy = structuredClone(schema)
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (value === null || typeof value !== 'object') return
    if (value.additionalProperties === false) value.additionalProperties = true
    if (Array.isArray(value.enum)) {
      value.type = enumType(value.enum)
      delete value.enum
    }
    Object.values(value).forEach(visit)
  }
  visit(copy)
  return copy
}

function makeMarketSectorIndexStrictRequiredExplicit(schema) {
  const copy = structuredClone(schema)
  const success = copy.$defs?.success
  const directoryThen = success?.allOf?.[0]?.then
  if (directoryThen?.properties === undefined || success?.properties?.scopes === undefined) {
    throw new Error('market-sector index schema directory branch shape changed')
  }
  // Ajv strictRequired only considers properties declared in the same branch.
  // Repeating the existing parent declaration changes no accepted documents.
  directoryThen.properties.scopes = structuredClone(success.properties.scopes)
  return copy
}

function replaceRuntimeRequires(source) {
  let transformed = source
  const runtimeExpressions = [
    [
      'require("ajv-formats/dist/formats").fullFormats',
      '__wireFullFormats',
    ],
    ['require("ajv/dist/runtime/equal").default', '__wireEqual'],
    [
      'require("ajv/dist/runtime/ucs2length").default',
      '__wireUcs2Length',
    ],
  ]
  for (const [expression, replacement] of runtimeExpressions) {
    transformed = transformed.replaceAll(expression, replacement)
  }
  if (/\brequire\s*\(/u.test(transformed)) {
    const retained = [
      ...new Set(
        [...transformed.matchAll(/require\("([^"]+)"\)/gu)].map(
          (match) => match[1],
        ),
      ),
    ]
    throw new Error(
      `standalone validators retained unsupported CommonJS runtime requires: ${retained.join(', ')}`,
    )
  }
  const imports = `import __wireFormatsModule from 'ajv-formats/dist/formats.js'
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
}`
  return {
    imports,
    source: transformed,
  }
}

function declaration() {
  const declarations = schemaSpecs
    .map(
      ({ exportName }) =>
        `export declare const ${exportName}: GeneratedValidator`,
    )
    .join('\n')
  return `import type { ErrorObject } from 'ajv'

export interface GeneratedValidator {
  (data: unknown): boolean
  errors?: ErrorObject[] | null
  evaluated?: unknown
}

${declarations}
`
}

function singleDeclaration(exportName) {
  return `import type { ErrorObject } from 'ajv'

interface GeneratedValidator {
  (data: unknown): boolean
  errors?: ErrorObject[] | null
  evaluated?: unknown
}

export declare const ${exportName}: GeneratedValidator
`
}

function renderOutputs(lineEndingProbe = null) {
  const sources = schemaSpecs.map((spec) => ({
    ...schemaSource(spec.schema, lineEndingProbe),
    exportName: spec.exportName,
    fileStem: spec.fileStem,
    transform: spec.transform,
  }))
  const ajv = new Ajv2020({
    strict: true,
    strictTypes: false,
    allErrors: true,
    code: {
      source: true,
      esm: true,
      lines: true,
      optimize: true,
    },
  })
  addFormats(ajv)
  for (const source of sources) {
    const schema = source.transform
      ? source.transform(source.value)
      : source.value
    ajv.addSchema(schema)
  }
  const sourceHashes = sources
    .map((source) => `${source.name}:${source.sha256}`)
    .join(', ')
  const banner =
    '// GENERATED FILE. DO NOT EDIT.\n' +
    '// Source: scripts/generate-wire-validators.mjs\n' +
    `// Shared schemas (SHA-256 of LF-normalized UTF-8 text): ${sourceHashes}\n`
  const outputs = {
    'wireValidators.js':
      banner +
      sources
        .map(
          ({ exportName, fileStem }) =>
            `export { ${exportName} } from './${fileStem}.js'`,
        )
        .join('\n') +
      '\n',
    'wireValidators.d.ts': declaration(),
  }

  for (const source of sources) {
    const standalone = replaceRuntimeRequires(
      standaloneCode(ajv, { [source.exportName]: source.value.$id }),
    )
    const javascript =
      banner +
      (standalone.imports.length > 0 ? `${standalone.imports}\n` : '') +
      standalone.source.trimEnd() +
      '\n'
    if (/\bnew\s+Function\b|\beval\s*\(/u.test(javascript)) {
      throw new Error(
        `${source.fileStem} retained runtime code generation`,
      )
    }
    outputs[`${source.fileStem}.js`] = javascript.replace(/\r\n?/gu, '\n')
    outputs[`${source.fileStem}.d.ts`] = singleDeclaration(source.exportName)
  }

  return Object.fromEntries(Object.entries(outputs).map(([name, text]) => [name, text.replace(/\r\n?/gu, '\n')]))
}

function writeOutputs(outputs) {
  mkdirSync(outputRoot, { recursive: true })
  for (const [name, contents] of Object.entries(outputs)) {
    writeFileSync(resolve(outputRoot, name), contents, 'utf8')
  }
}

function checkOutputs(outputs) {
  const actualNames = readdirSync(outputRoot).sort()
  if (JSON.stringify(actualNames) !== JSON.stringify([...outputNames].sort())) {
    throw new Error(
      `generated validator file set drifted: expected ${outputNames.join(', ')}, got ${actualNames.join(', ')}`,
    )
  }
  for (const [name, contents] of Object.entries(outputs)) {
    if (readFileSync(resolve(outputRoot, name), 'utf8') !== contents) {
      throw new Error(
        `${name} is stale; run npm.cmd run generate:wire-validators`,
      )
    }
  }
}

const mode = process.argv[2]
const outputs = renderOutputs()
if (mode === '--write') {
  writeOutputs(outputs)
  console.log(`WIRE_VALIDATORS_GENERATED=${Object.keys(outputs).length}`)
} else if (mode === '--check') {
  checkOutputs(outputs)
  console.log(`WIRE_VALIDATORS_CURRENT=${Object.keys(outputs).length}`)
} else if (mode === '--check-eol-parity') {
  if (JSON.stringify(renderOutputs('\n')) !== JSON.stringify(renderOutputs('\r\n'))) {
    throw new Error('LF/CRLF schema inputs produced different validators')
  }
  checkOutputs(outputs)
  console.log(`WIRE_VALIDATORS_EOL_PARITY=${Object.keys(outputs).length}`)
} else {
  throw new Error('usage: generate-wire-validators.mjs --write|--check|--check-eol-parity')
}




