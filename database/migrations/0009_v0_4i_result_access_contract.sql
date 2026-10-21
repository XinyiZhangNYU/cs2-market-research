\set ON_ERROR_STOP on

BEGIN;

DO $block$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM control.schema_release
         WHERE release_name = 'v0.4h-market-identity-contract'
           AND status = 'CANDIDATE'
    ) THEN
        RAISE EXCEPTION 'v0.4i requires v0.4h';
    END IF;
END
$block$;

-- This release freezes only the access boundary.  It deliberately does not
-- freeze a public/AI output DTO or expose source facts through convenience
-- views.  Future result tables require an explicit migration and table-level
-- grant; schema USAGE alone cannot read or write them.
CREATE SCHEMA result;
REVOKE ALL ON SCHEMA result FROM PUBLIC;

DO $roles$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cs2_result_writer') THEN
        CREATE ROLE cs2_result_writer NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cs2_api_reader') THEN
        CREATE ROLE cs2_api_reader NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cs2_ai_reader') THEN
        CREATE ROLE cs2_ai_reader NOLOGIN;
    END IF;
END
$roles$;

CREATE TABLE result.output_contract_release (
    contract_code             TEXT NOT NULL,
    version_label             TEXT NOT NULL,
    status                    TEXT NOT NULL CHECK (status IN (
        'CANDIDATE', 'ACTIVE', 'RETIRED'
    )),
    contains_raw_source_data  BOOLEAN NOT NULL DEFAULT FALSE
        CHECK (NOT contains_raw_source_data),
    contains_source_user_data BOOLEAN NOT NULL DEFAULT FALSE
        CHECK (NOT contains_source_user_data),
    notes                     TEXT NOT NULL CHECK (btrim(notes) <> ''),
    recorded_at               TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (contract_code, version_label),
    CHECK (btrim(contract_code) <> ''),
    CHECK (btrim(version_label) <> '')
);

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON result.output_contract_release
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

INSERT INTO result.output_contract_release(
    contract_code,
    version_label,
    status,
    notes
)
VALUES (
    'private-derived-output-boundary',
    'v0.4i',
    'CANDIDATE',
    'Access boundary only: no product output DTO or result payload table is frozen in this release.'
);

INSERT INTO control.schema_release(release_name, status, notes)
VALUES (
    'v0.4i-result-access-contract',
    'CANDIDATE',
    'Fail-closed result schema and separate NOLOGIN writer/API/AI roles. No role receives raw control, catalog, staging, derived, or fact access through this release.'
);

GRANT USAGE ON SCHEMA result
    TO cs2_result_writer, cs2_api_reader, cs2_ai_reader;
GRANT SELECT ON result.output_contract_release
    TO cs2_result_writer, cs2_api_reader, cs2_ai_reader;

REVOKE ALL ON ALL TABLES IN SCHEMA result FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA result FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA result FROM PUBLIC;

COMMIT;
