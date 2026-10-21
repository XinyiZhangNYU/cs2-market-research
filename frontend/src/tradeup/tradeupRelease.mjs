// Reviewed release identity. A graph update requires a new reviewed pin;
// never derive this expected identity from the untrusted build input.
// This repository ships a subset of the graph (eight collections, six cases).
export const TRADEUP_RELEASE = Object.freeze({
  id: 'tradeup-showcase-subset-v1',
  url: '/tradeup/tradeup-graph.628d16fb80138ea6d12757c4fc4181d9af95148df6a33a3501e4af895c6534c8.json',
  sha256: '628d16fb80138ea6d12757c4fc4181d9af95148df6a33a3501e4af895c6534c8',
  skins: 188,
  source: Object.freeze({
    rules_schema: 'cs2-tradeup-graph/1',
    rules_as_of: '2026-08-28T00:00:00Z',
    // Digests of this subset's own rule edges and catalog bindings.
    subset_rules_sha256: 'b67d6149dc22788ca3478d7239541217c658afd63866f7142425b0ed7732f19e',
    subset_catalog_sha256: '436a33b0e0996bfc7afa1d1ff8dd45593fb8b0ba3b52cbdd94b7389d84a2eeda',
    catalog_as_of: '2026-09-04T00:00:00Z',
    catalog_media_bound: 188,
    catalog_media_not_produced: 0,
  }),
})
