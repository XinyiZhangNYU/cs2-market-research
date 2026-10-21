# CS2 Market Research

A design showcase taken from the research and publication pipeline behind
[cs2rotate.com](https://cs2rotate.com), a public site for the Counter-Strike 2 item market. The
site publishes a market index, 30-day movers ("Trending"), per-item price history, a trade-up
simulator and an analysis of Valve announcements.

This repository is a **reading slice**, not a deployable system. It keeps the contracts, the pure
calculation code and the tests that show how the pipeline is built. The market data, the provider
adapter, the operations tooling and the deployment configuration are left out on purpose, so the
pipeline cannot be run end to end from here.

The code is written for **auditability first**. Every published number traces back through
content-addressed (SHA-256 pinned) intermediate documents to a preserved capture. Inputs that are
missing, late or ambiguous are recorded as such. They are never interpolated or silently
substituted.

## Reading guide

All Python paths are under `src/cs2_research/`.

| Topic | Where to read | What it shows |
| --- | --- | --- |
| Capture chain | `ingestion/capture_v2.py`, `ingestion/artifacts.py`, `ingestion/rights.py` | Strict JSON and clock parsing, immutable request/receipt/raw chains, per-slot preservation receipts |
| Normalized input boundary | `ingestion/native_cny.py`, `ingestion/native_cny_latest.py`, `ingestion/upstream_latest.py` | The normalized quote contracts that the omitted provider adapter would fill |
| Daily measurement | `feature_input/native_cny_measurements.py`, `feature_input/market_sector_daily*.py`, `feature_input/market_sector_eod_v3.py` | 5-minute slots reduced to closed-day end-of-day measurements, with explicit missing-slot denominators |
| Market index | `feature_input/native_cny_index.py`, `feature_input/native_cny_geometric_index.py`, `feature_input/market_sector_index_*.py` | Exact-rational index math. **H** is a price-tier balanced index and **E** an equal-weight geometric cohort curve. Also covers continuation, rebalancing and fixed-precision scale state |
| Trending | `trending/` | 30-day same-source changes with tiered eligibility, availability states and historical identity |
| Single-item qualification | `state_machine/single_item_causal_kernel_v24.py`, `state_machine/single_item_coverage.py` | Point-in-time causal evaluation: a later row never changes an earlier answer |
| Results and quality | `result/`, `planning/source_quality.py`, `state_machine/claims.py` | Result envelopes, quality grading and the wording limits on each claim |
| FX | `fx/` | ECB reference-rate vintages and exact integer USD↔CNY display arithmetic |
| Valve events | `valve_events/`, `valve_event_workflow/` | Normalizing official Steam news, plus the structured-output contract and evaluator for announcement analysis |
| Catalog | `catalog/` | Valve item identity, taxonomy and the display/navigation profile |
| Contracts | `schemas/`, `schemas/examples/` | JSON Schemas for the published documents and API responses, with valid and invalid examples |
| Database design | `database/migrations/` | Selected migrations: ingestion, catalog and quote contracts, a least-privilege writer role and a result read model |
| Frontend | `frontend/` | React + TypeScript + Vite site. Every response is validated at runtime before it reaches a view: structural validators are generated from `schemas/` (`src/wire/generated/`), and hand-written decoders (`src/wire/*Decode.ts`, `src/wire/nativeCnyIndexPublicApi.ts`) add semantic, clock and cross-field checks |

## What is left out

- **Market data.** No captured prices are included. The Python tests use synthetic inputs, and the
  frontend tests use synthetic fixtures.
- **The provider adapter.** Prices come from a third-party provider that aggregates several
  marketplaces. The adapter and its HTTP transport are omitted. The entry points in
  `ingestion/native_cny.py` (`document_metadata`, `iter_quotes`), `ingestion/native_cny_latest.py`
  and `ingestion/upstream_latest.py` keep their normalized output contracts and raise
  `ProviderAdapterUnavailable('PROVIDER_ADAPTER_NOT_INCLUDED')`.
- **Operations.** Schedulers, producers, publication and install scripts, and the database
  migration history are omitted. Only design-relevant migrations are kept.
- **Full public snapshots.** `frontend/public/tradeup/` holds a 188-skin subset of the trade-up
  graph instead of the full catalog. `frontend/src/data/valveAnalysisHistory.public.json` holds four
  announcement cases, each with its final published version only. Both keep their content pins, so
  the integrity checks still apply to them.

Marketplaces appear under neutral names: `market_a`, `market_b`, `market_c` and `market_d`.
Transports are named separately from logical markets: `upstream` is the aggregating provider and
`market_b_direct` is a direct feed for `market_b`. Valve and Steam sources are public and appear
under their real names.

## Design principles

- **Exact arithmetic.** Prices travel as original decimal lexemes. Index math uses exact rationals
  and fixed-precision quantization, never binary floats.
- **Content addressing.** Each intermediate document carries its own `document_sha256` and pins the
  hashes of its inputs, code files and policy. Changing a byte anywhere is detected downstream.
- **Fail closed.** A missing input produces a `WAIT`, `LATE` or `MISSING` state, never a partial
  publication. Withheld items stay withheld until the evidence qualifies them.
- **Separate identities.** Each method version (V1, H, E) is its own series identity. New methods
  never splice into, or rescale, an older chain.
- **Least privilege.** Database roles are split per writer and reader. Public readers see only
  published views.

## Tests

The tests document the design. Most are counterexamples: a future row, a gap, a malformed number,
a withdrawn record, a tampered pin. Each one must be refused or reported, never smoothed over.

Python ≥ 3.11 (developed on 3.14):

```bash
pip install -e . pytest "psycopg[binary]"
pytest
```

The tests never open a network or database connection. Several fixtures patch the socket and
`psycopg.connect` calls so that any such attempt fails.

Frontend, Node ≥ 20:

```bash
cd frontend
npm install
npm test            # wire-validator check + vitest
npm run typecheck
```

## License

MIT. See [LICENSE](LICENSE). Counter-Strike 2 item names and images belong to Valve Corporation.
