// Reusable consumption point for an already decoded formal API response.
//
// It is intentionally not a product page and performs no request. The existing prototype pages
// still use their mock proposal DTO; FormalFixtureWorkspace composes this panel with an injected
// offline gateway so the exact Python-generated API fixtures travel through the shared decoder,
// safe view adapters and formal components without inventing fields that V1 does not produce.
import { qualityResultView } from '../adapter/qualityViewModel'
import { collectionResultView, unitResultView } from '../adapter/resultViewModel'
import {
  isValidatedResultReadResponse,
} from '../wire/resultReadApiDecode'
import type { ValidatedResultReadResponse } from '../wire/resultReadApiTypes'
import { QualityEnvelopeView } from './QualityEnvelopeView'
import {
  ResultCollectionEnvelopeView,
  ResultUnitEnvelopeView,
} from './ResultEnvelopeView'

export function FormalResultReadPanel({
  response,
}: {
  response: ValidatedResultReadResponse
}) {
  if (!isValidatedResultReadResponse(response, response.response_kind)) {
    throw new TypeError('FormalResultReadPanel requires a decoded result-read API response')
  }
  if (response.response_kind === 'ERROR') {
    return (
      <section data-testid="formal-result-read-error" data-contract="result-read-api/v1">
        <code>{response.error.code}</code>
        <code>http_status={response.error.http_status}</code>
        <code>retryable={String(response.error.retryable)}</code>
      </section>
    )
  }
  if (response.response_kind === 'UNIT_DETAIL') {
    return <ResultUnitEnvelopeView view={unitResultView(response.resource.envelope)} />
  }
  if (response.response_kind === 'COLLECTION_DETAIL') {
    return (
      <ResultCollectionEnvelopeView view={collectionResultView(response.resource.envelope)} />
    )
  }
  if (response.response_kind === 'QUALITY_DETAIL') {
    return <QualityEnvelopeView view={qualityResultView(response.resource.envelope)} />
  }
  if (response.response_kind === 'QUALITY_LIST') {
    return (
      <section data-testid="formal-quality-read-list" data-contract="result-read-api/v1">
        {response.members.map((resource) => (
          <QualityEnvelopeView
            key={resource.envelope.snapshot_id}
            view={qualityResultView(resource.envelope)}
          />
        ))}
      </section>
    )
  }
  return (
    <section data-testid="formal-result-read-list" data-contract="result-read-api/v1">
      {response.members.map((resource) => (
        <ResultUnitEnvelopeView
          key={resource.envelope.snapshot_id}
          view={unitResultView(resource.envelope)}
        />
      ))}
    </section>
  )
}
