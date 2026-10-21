\set ON_ERROR_STOP on

BEGIN;

DO $precondition$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM control.schema_release
         WHERE release_name = 'v0.4d-artifact-staging-contract'
    ) THEN
        RAISE EXCEPTION 'v0.4e requires v0.4d';
    END IF;
END
$precondition$;

-- Staging generated columns call the same immutable canonical primitives used
-- by V0.4c triggers.  V0.4c intentionally revoked every control function from
-- PUBLIC, so the least-privilege normalizer role needs these exact functions.
GRANT EXECUTE ON FUNCTION control.canonical_field_text(TEXT, TEXT, TEXT),
    control.canonical_timestamp_text(TIMESTAMPTZ),
    control.canonical_decimal_38_8_text(NUMERIC),
    control.canonical_enum_map_text(JSONB),
    control.canonical_string_list_text(TEXT[]),
    control.compute_dataset_issue_hash(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
TO cs2_normalizer_writer;

INSERT INTO control.schema_release(release_name, status, notes)
VALUES (
    'v0.4e-staging-writer-privileges',
    'CANDIDATE',
    'Least-privilege execution grants for immutable canonical hash functions used by V0.4d generated columns.'
);

COMMIT;
