\set ON_ERROR_STOP on

BEGIN;

DO $block$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM control.schema_release
         WHERE release_name = 'v0.4i-result-access-contract'
           AND status = 'CANDIDATE'
    ) THEN
        RAISE EXCEPTION 'v0.4j requires v0.4i';
    END IF;
END
$block$;

-- Result payloads are private, provider-neutral projections.  They must never
-- become a second route to source listings, seller identities, credentials or
-- raw API responses.
CREATE FUNCTION result.payload_has_forbidden_key(payload JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $function$
DECLARE
    member_key TEXT;
    member_value JSONB;
BEGIN
    IF jsonb_typeof(payload) = 'object' THEN
        FOR member_key, member_value IN SELECT * FROM jsonb_each(payload)
        LOOP
            IF member_key = ANY (ARRAY[
                'raw_payload', 'payload_bytes', 'request_url',
                'app_key', 'app_secret',
                'seller_id', 'seller_uid', 'seller_name',
                'product_id', 'listing_id', 'provider_listing_id',
                'source_item_id', 'source_style_id', 'provider_item_id'
            ]) THEN
                RETURN TRUE;
            END IF;
            IF result.payload_has_forbidden_key(member_value) THEN
                RETURN TRUE;
            END IF;
        END LOOP;
    ELSIF jsonb_typeof(payload) = 'array' THEN
        FOR member_value IN SELECT value FROM jsonb_array_elements(payload)
        LOOP
            IF result.payload_has_forbidden_key(member_value) THEN
                RETURN TRUE;
            END IF;
        END LOOP;
    END IF;
    RETURN FALSE;
END
$function$;

CREATE TABLE result.unit_result_snapshot (
    snapshot_id            control.sha256_hex PRIMARY KEY,
    document_hash          control.sha256_hex NOT NULL UNIQUE,
    contract_code          TEXT NOT NULL,
    contract_version       TEXT NOT NULL,
    scope_kind             TEXT NOT NULL CHECK (scope_kind IN (
        'MARKET', 'SECTOR', 'ITEM'
    )),
    analysis_unit_id       TEXT NOT NULL CHECK (btrim(analysis_unit_id) <> ''),
    analysis_unit_kind     TEXT CHECK (analysis_unit_kind IN (
        'BASE_MHN', 'STYLE_VARIANT', 'PATTERN_VARIANT'
    )),
    edition_kind           TEXT CHECK (edition_kind IN (
        'STANDARD', 'STATTRAK', 'SOUVENIR', 'UNKNOWN'
    )),
    identity_available_at  TIMESTAMPTZ NOT NULL,
    result_as_of           TIMESTAMPTZ NOT NULL,
    available_at           TIMESTAMPTZ NOT NULL,
    published_at           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    data_branch            TEXT NOT NULL CHECK (data_branch IN ('A', 'B')),
    data_status            TEXT NOT NULL CHECK (data_status IN (
        'COMPLETE', 'UNAVAILABLE_BY_DESIGN', 'DEGRADED_OPTIONAL',
        'DATA_UNAVAILABLE_RUNTIME_GRACE', 'STALE_GRACE',
        'DATA_UNAVAILABLE_RUNTIME', 'STALE', 'CONFLICTED'
    )),
    catalog_version        TEXT NOT NULL CHECK (btrim(catalog_version) <> ''),
    payload                JSONB NOT NULL,
    CHECK (contract_code = 'research-result-envelope'),
    CHECK (contract_version = 'v1'),
    CHECK (identity_available_at <= result_as_of),
    CHECK (available_at <= result_as_of),
    CHECK (result_as_of <= published_at),
    CHECK (
        (scope_kind = 'ITEM'
         AND analysis_unit_kind IS NOT NULL
         AND edition_kind IS NOT NULL)
        OR
        (scope_kind IN ('MARKET', 'SECTOR')
         AND analysis_unit_kind IS NULL
         AND edition_kind IS NULL)
    ),
    CHECK (jsonb_typeof(payload) = 'object'),
    CHECK (NOT result.payload_has_forbidden_key(payload)),
    CHECK (payload ->> 'snapshot_id' = snapshot_id),
    CHECK (payload ->> 'contract_code' = contract_code),
    CHECK (payload ->> 'contract_version' = contract_version),
    CHECK (payload ->> 'envelope_kind' = 'UNIT'),
    CHECK (jsonb_typeof(payload -> 'identity') = 'object'),
    CHECK (payload -> 'identity' ->> 'scope_kind' = scope_kind),
    CHECK (payload -> 'identity' ->> 'analysis_unit_id' = analysis_unit_id),
    CHECK (
        payload -> 'identity' ->> 'analysis_unit_kind'
        IS NOT DISTINCT FROM analysis_unit_kind
    ),
    CHECK (
        payload -> 'identity' ->> 'edition_kind'
        IS NOT DISTINCT FROM edition_kind
    ),
    CHECK (
        (payload -> 'identity' ->> 'identity_available_at')::TIMESTAMPTZ
        = identity_available_at
    ),
    CHECK ((payload ->> 'as_of')::TIMESTAMPTZ = result_as_of),
    CHECK ((payload ->> 'available_at')::TIMESTAMPTZ = available_at),
    CHECK (payload ->> 'data_branch' = data_branch),
    CHECK (payload ->> 'data_status' = data_status),
    CHECK (payload -> 'versions' ->> 'catalog_version' = catalog_version)
);

CREATE INDEX unit_result_snapshot_pit_lookup
    ON result.unit_result_snapshot(
        analysis_unit_id, result_as_of DESC, available_at DESC,
        published_at DESC, snapshot_id DESC
    );
CREATE INDEX unit_result_snapshot_scope_pit
    ON result.unit_result_snapshot(
        scope_kind, result_as_of DESC, published_at DESC, analysis_unit_id
    );

CREATE TABLE result.collection_result_snapshot (
    snapshot_id             control.sha256_hex PRIMARY KEY,
    document_hash           control.sha256_hex NOT NULL UNIQUE,
    contract_code           TEXT NOT NULL,
    contract_version        TEXT NOT NULL,
    collection_id           TEXT NOT NULL CHECK (btrim(collection_id) <> ''),
    scope_kind              TEXT NOT NULL CHECK (scope_kind IN (
        'MARKET', 'SECTOR', 'ITEM'
    )),
    result_as_of            TIMESTAMPTZ NOT NULL,
    available_at            TIMESTAMPTZ NOT NULL,
    published_at            TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    data_branch             TEXT NOT NULL CHECK (data_branch IN ('A', 'B')),
    data_status             TEXT NOT NULL CHECK (data_status IN (
        'COMPLETE', 'UNAVAILABLE_BY_DESIGN', 'DEGRADED_OPTIONAL',
        'DATA_UNAVAILABLE_RUNTIME_GRACE', 'STALE_GRACE',
        'DATA_UNAVAILABLE_RUNTIME', 'STALE', 'CONFLICTED'
    )),
    member_count            INTEGER NOT NULL CHECK (member_count >= 0),
    returned_member_count   INTEGER NOT NULL CHECK (
        returned_member_count >= 0 AND returned_member_count <= member_count
    ),
    payload                 JSONB NOT NULL,
    CHECK (contract_code = 'research-result-envelope'),
    CHECK (contract_version = 'v1'),
    CHECK (available_at <= result_as_of),
    CHECK (result_as_of <= published_at),
    CHECK (jsonb_typeof(payload) = 'object'),
    CHECK (NOT result.payload_has_forbidden_key(payload)),
    CHECK (payload ->> 'snapshot_id' = snapshot_id),
    CHECK (payload ->> 'contract_code' = contract_code),
    CHECK (payload ->> 'contract_version' = contract_version),
    CHECK (payload ->> 'envelope_kind' = 'COLLECTION'),
    CHECK (payload ->> 'collection_id' = collection_id),
    CHECK (payload ->> 'scope_kind' = scope_kind),
    CHECK ((payload ->> 'as_of')::TIMESTAMPTZ = result_as_of),
    CHECK ((payload ->> 'available_at')::TIMESTAMPTZ = available_at),
    CHECK (payload ->> 'data_branch' = data_branch),
    CHECK (payload ->> 'data_status' = data_status),
    CHECK ((payload ->> 'member_count')::INTEGER = member_count),
    CHECK (
        (payload ->> 'returned_member_count')::INTEGER = returned_member_count
    ),
    CHECK (jsonb_typeof(payload -> 'member_result_ids') = 'array'),
    CHECK (jsonb_typeof(payload -> 'missing_member_ids') = 'array'),
    CHECK (jsonb_typeof(payload -> 'unavailable_member_ids') = 'array'),
    CHECK (jsonb_array_length(payload -> 'member_result_ids') = returned_member_count),
    CHECK (
        jsonb_array_length(payload -> 'member_result_ids')
        + jsonb_array_length(payload -> 'missing_member_ids')
        + jsonb_array_length(payload -> 'unavailable_member_ids')
        = member_count
    )
);

CREATE INDEX collection_result_snapshot_pit_lookup
    ON result.collection_result_snapshot(
        collection_id, result_as_of DESC, available_at DESC,
        published_at DESC, snapshot_id DESC
    );

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON result.unit_result_snapshot
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON result.collection_result_snapshot
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

INSERT INTO result.output_contract_release(
    contract_code,
    version_label,
    status,
    notes
)
VALUES (
    'research-result-envelope',
    'v1',
    'CANDIDATE',
    'Provider-neutral unit and collection result envelope. Candidate fields RC-O01 through RC-O04 remain subject to joint frontend/backend review.'
);

INSERT INTO control.schema_release(release_name, status, notes)
VALUES (
    'v0.4j-result-read-model',
    'CANDIDATE',
    'Append-only provider-neutral result snapshots, strict point-in-time columns, forbidden source-detail keys, and least-privilege writer/API/AI access.'
);

GRANT SELECT ON result.unit_result_snapshot,
    result.collection_result_snapshot TO cs2_result_writer;
GRANT INSERT (
    snapshot_id, document_hash, contract_code, contract_version,
    scope_kind, analysis_unit_id, analysis_unit_kind, edition_kind,
    identity_available_at, result_as_of, available_at, data_branch,
    data_status, catalog_version, payload
) ON result.unit_result_snapshot TO cs2_result_writer;
GRANT INSERT (
    snapshot_id, document_hash, contract_code, contract_version,
    collection_id, scope_kind, result_as_of, available_at,
    data_branch, data_status, member_count, returned_member_count, payload
) ON result.collection_result_snapshot TO cs2_result_writer;

GRANT SELECT ON result.unit_result_snapshot,
    result.collection_result_snapshot TO cs2_api_reader, cs2_ai_reader;
GRANT EXECUTE ON FUNCTION result.payload_has_forbidden_key(JSONB)
    TO cs2_result_writer;

REVOKE ALL ON result.unit_result_snapshot,
    result.collection_result_snapshot FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION result.payload_has_forbidden_key(JSONB) FROM PUBLIC;

COMMIT;
