\set ON_ERROR_STOP on

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA control;
CREATE SCHEMA fact;

REVOKE ALL ON SCHEMA control, fact FROM PUBLIC;

DO $roles$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cs2_plan_writer') THEN
        CREATE ROLE cs2_plan_writer NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cs2_collector_writer') THEN
        CREATE ROLE cs2_collector_writer NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cs2_normalizer_writer') THEN
        CREATE ROLE cs2_normalizer_writer NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cs2_research_reader') THEN
        CREATE ROLE cs2_research_reader NOLOGIN;
    END IF;
END
$roles$;

CREATE DOMAIN control.sha256_hex AS TEXT
    CHECK (VALUE ~ '^[0-9a-f]{64}$');

CREATE DOMAIN control.permission_state AS TEXT
    CHECK (VALUE IN ('ALLOW', 'DENY', 'UNKNOWN', 'NOT_APPLICABLE'));

CREATE DOMAIN control.currency_code AS TEXT
    CHECK (VALUE ~ '^[A-Z]{3}$');

CREATE DOMAIN control.volume_unit AS TEXT
    CHECK (VALUE IN ('ORDER_COUNT', 'ITEM_COUNT', 'UNKNOWN', 'NOT_APPLICABLE'));

CREATE FUNCTION control.reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION '% is append-only; % is not allowed', TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, TG_OP;
END
$function$;

CREATE TABLE control.schema_release (
    release_name        TEXT PRIMARY KEY,
    applied_at          TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    status              TEXT NOT NULL,
    notes               TEXT NOT NULL
);

CREATE TABLE control.data_source (
    source_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_code         TEXT NOT NULL UNIQUE CHECK (source_code ~ '^[a-z0-9_]+$'),
    display_name        TEXT NOT NULL,
    market_region       TEXT,
    default_currency    control.currency_code,
    lifecycle_status    TEXT NOT NULL CHECK (lifecycle_status IN (
        'CANDIDATE', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'RETIRED'
    )),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE control.source_rights_version (
    rights_version_id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_id                       BIGINT NOT NULL REFERENCES control.data_source(source_id),
    version_label                   TEXT NOT NULL,
    supersedes_rights_version_id    BIGINT,
    evidence_ref                    TEXT NOT NULL,
    agreement_title                 TEXT,
    agreement_url                   TEXT,
    agreement_hash                  control.sha256_hex,
    acquisition                     control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    systematic_collection           control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    historical_backfill             control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    raw_storage                     control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    normalized_storage              control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    internal_derivative_use         control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    derived_storage                 control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    post_termination_raw_retention  control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    post_termination_normalized_retention control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    post_termination_derived_retention control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    post_termination_derivative_use control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    public_derivative_output        control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    commercial_use                  control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    third_party_ai_processing       control.permission_state NOT NULL DEFAULT 'UNKNOWN',
    effective_from                  TIMESTAMPTZ NOT NULL,
    recorded_at                     TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (source_id, version_label),
    UNIQUE (source_id, effective_from),
    UNIQUE (rights_version_id, source_id),
    UNIQUE (supersedes_rights_version_id),
    FOREIGN KEY (supersedes_rights_version_id, source_id)
        REFERENCES control.source_rights_version(rights_version_id, source_id)
);

CREATE FUNCTION control.enforce_rights_revision_chain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    prior control.source_rights_version%ROWTYPE;
    latest_id BIGINT;
BEGIN
    SELECT rights_version_id INTO latest_id
      FROM control.source_rights_version
     WHERE source_id = NEW.source_id
     ORDER BY effective_from DESC, recorded_at DESC, rights_version_id DESC
     LIMIT 1;

    IF latest_id IS NULL THEN
        IF NEW.supersedes_rights_version_id IS NOT NULL THEN
            RAISE EXCEPTION 'first rights version cannot supersede another row';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.supersedes_rights_version_id IS NULL THEN
        RAISE EXCEPTION 'later rights version must supersede the current latest row';
    END IF;
    IF NEW.supersedes_rights_version_id <> latest_id THEN
        RAISE EXCEPTION 'rights version must supersede latest row %, got %',
            latest_id, NEW.supersedes_rights_version_id;
    END IF;

    SELECT * INTO prior
      FROM control.source_rights_version
     WHERE rights_version_id = NEW.supersedes_rights_version_id
       AND source_id = NEW.source_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'superseded rights row does not belong to source';
    END IF;
    IF NEW.effective_from <= prior.effective_from THEN
        RAISE EXCEPTION 'new rights effective_from must be later than prior version';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER source_rights_revision_chain
BEFORE INSERT ON control.source_rights_version
FOR EACH ROW EXECUTE FUNCTION control.enforce_rights_revision_chain();

CREATE TABLE control.source_endpoint (
    endpoint_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_id           BIGINT NOT NULL REFERENCES control.data_source(source_id),
    endpoint_code       TEXT NOT NULL,
    data_kind           TEXT NOT NULL CHECK (data_kind IN ('QUOTE', 'OTHER')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (source_id, endpoint_code),
    UNIQUE (endpoint_id, source_id)
);

CREATE TABLE control.source_endpoint_version (
    endpoint_version_id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    endpoint_id                     BIGINT NOT NULL,
    source_id                       BIGINT NOT NULL,
    version_label                   TEXT NOT NULL,
    supersedes_endpoint_version_id  BIGINT,
    route_template                  TEXT NOT NULL,
    request_schema_ref              TEXT,
    response_schema_ref             TEXT,
    evidence_ref                    TEXT NOT NULL,
    evidence_hash                   control.sha256_hex,
    enabled                         BOOLEAN NOT NULL,
    effective_from                  TIMESTAMPTZ NOT NULL,
    recorded_at                     TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    FOREIGN KEY (endpoint_id, source_id)
        REFERENCES control.source_endpoint(endpoint_id, source_id),
    FOREIGN KEY (supersedes_endpoint_version_id, endpoint_id, source_id)
        REFERENCES control.source_endpoint_version(endpoint_version_id, endpoint_id, source_id),
    UNIQUE (endpoint_version_id, endpoint_id, source_id),
    UNIQUE (endpoint_id, version_label),
    UNIQUE (endpoint_id, effective_from),
    UNIQUE (supersedes_endpoint_version_id)
);

CREATE FUNCTION control.enforce_endpoint_revision_chain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    prior control.source_endpoint_version%ROWTYPE;
    latest_id BIGINT;
BEGIN
    SELECT endpoint_version_id INTO latest_id
      FROM control.source_endpoint_version
     WHERE endpoint_id = NEW.endpoint_id
     ORDER BY effective_from DESC, recorded_at DESC, endpoint_version_id DESC
     LIMIT 1;

    IF latest_id IS NULL THEN
        IF NEW.supersedes_endpoint_version_id IS NOT NULL THEN
            RAISE EXCEPTION 'first endpoint version cannot supersede another row';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.supersedes_endpoint_version_id IS NULL
       OR NEW.supersedes_endpoint_version_id <> latest_id THEN
        RAISE EXCEPTION 'endpoint version must supersede latest row %', latest_id;
    END IF;
    SELECT * INTO prior
      FROM control.source_endpoint_version
     WHERE endpoint_version_id = NEW.supersedes_endpoint_version_id
       AND endpoint_id = NEW.endpoint_id
       AND source_id = NEW.source_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'superseded endpoint row does not match endpoint/source';
    END IF;
    IF NEW.effective_from <= prior.effective_from THEN
        RAISE EXCEPTION 'new endpoint effective_from must be later than prior version';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER source_endpoint_revision_chain
BEFORE INSERT ON control.source_endpoint_version
FOR EACH ROW EXECUTE FUNCTION control.enforce_endpoint_revision_chain();

CREATE TABLE control.fixture_provenance (
    fixture_id              UUID PRIMARY KEY,
    source_id               BIGINT NOT NULL,
    endpoint_id             BIGINT NOT NULL,
    endpoint_version_id     BIGINT NOT NULL,
    fixture_kind            TEXT NOT NULL CHECK (fixture_kind IN (
        'SYNTHETIC_CONTRACT', 'OFFICIAL_DOCUMENT_EXAMPLE', 'DESENSITIZED_REAL_SAMPLE'
    )),
    contains_real_market_data BOOLEAN NOT NULL,
    evidence_ref            TEXT NOT NULL,
    source_document_hash    control.sha256_hex,
    fixture_payload_hash    control.sha256_hex NOT NULL,
    frozen_fetched_at       TIMESTAMPTZ NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    FOREIGN KEY (endpoint_version_id, endpoint_id, source_id)
        REFERENCES control.source_endpoint_version(endpoint_version_id, endpoint_id, source_id)
);

CREATE TABLE control.request_plan (
    request_plan_id        UUID PRIMARY KEY,
    source_id              BIGINT NOT NULL,
    endpoint_id            BIGINT NOT NULL,
    endpoint_version_id    BIGINT NOT NULL,
    rights_version_id      BIGINT NOT NULL,
    fixture_id             UUID REFERENCES control.fixture_provenance(fixture_id),
    execution_mode         TEXT NOT NULL CHECK (execution_mode IN (
        'FIXTURE', 'SAMPLE', 'SYSTEMATIC', 'BACKFILL'
    )),
    planned_for            TIMESTAMPTZ NOT NULL,
    network_allowed        BOOLEAN NOT NULL,
    user_authorization_ref TEXT,
    item_manifest_hash     control.sha256_hex NOT NULL,
    request_canonical_hash control.sha256_hex NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    FOREIGN KEY (rights_version_id, source_id)
        REFERENCES control.source_rights_version(rights_version_id, source_id),
    FOREIGN KEY (endpoint_version_id, endpoint_id, source_id)
        REFERENCES control.source_endpoint_version(endpoint_version_id, endpoint_id, source_id),
    UNIQUE (request_canonical_hash)
);

CREATE FUNCTION control.enforce_request_plan_admission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    rights_row control.source_rights_version%ROWTYPE;
    endpoint_row control.source_endpoint_version%ROWTYPE;
    fixture_row control.fixture_provenance%ROWTYPE;
    latest_rights_id BIGINT;
    latest_endpoint_id BIGINT;
BEGIN
    SELECT * INTO rights_row
      FROM control.source_rights_version
     WHERE rights_version_id = NEW.rights_version_id
       AND source_id = NEW.source_id;
    SELECT rights_version_id INTO latest_rights_id
      FROM control.source_rights_version
     WHERE source_id = NEW.source_id
       AND effective_from <= NEW.planned_for
     ORDER BY effective_from DESC, recorded_at DESC, rights_version_id DESC
     LIMIT 1;
    IF latest_rights_id IS DISTINCT FROM NEW.rights_version_id THEN
        RAISE EXCEPTION 'request plan must use latest rights version % at %',
            latest_rights_id, NEW.planned_for;
    END IF;

    SELECT * INTO endpoint_row
      FROM control.source_endpoint_version
     WHERE endpoint_version_id = NEW.endpoint_version_id
       AND endpoint_id = NEW.endpoint_id
       AND source_id = NEW.source_id;
    SELECT endpoint_version_id INTO latest_endpoint_id
      FROM control.source_endpoint_version
     WHERE endpoint_id = NEW.endpoint_id
       AND source_id = NEW.source_id
       AND effective_from <= NEW.planned_for
     ORDER BY effective_from DESC, recorded_at DESC, endpoint_version_id DESC
     LIMIT 1;
    IF latest_endpoint_id IS DISTINCT FROM NEW.endpoint_version_id
       OR NOT endpoint_row.enabled THEN
        RAISE EXCEPTION 'request plan must use latest enabled endpoint version %', latest_endpoint_id;
    END IF;

    IF NEW.execution_mode = 'FIXTURE' THEN
        IF NEW.network_allowed OR NEW.fixture_id IS NULL OR NEW.user_authorization_ref IS NOT NULL THEN
            RAISE EXCEPTION 'FIXTURE requires network_allowed=false, fixture_id, and no user authorization';
        END IF;
        SELECT * INTO fixture_row
          FROM control.fixture_provenance
         WHERE fixture_id = NEW.fixture_id;
        IF NOT FOUND
           OR fixture_row.source_id <> NEW.source_id
           OR fixture_row.endpoint_id <> NEW.endpoint_id
           OR fixture_row.endpoint_version_id <> NEW.endpoint_version_id
           OR fixture_row.contains_real_market_data
           OR fixture_row.fixture_kind <> 'SYNTHETIC_CONTRACT' THEN
            RAISE EXCEPTION 'FIXTURE plan requires matching non-real SYNTHETIC_CONTRACT provenance';
        END IF;
    ELSE
        IF NEW.fixture_id IS NOT NULL OR NOT NEW.network_allowed
           OR NEW.user_authorization_ref IS NULL THEN
            RAISE EXCEPTION 'real request plan requires network, authorization_ref, and no fixture';
        END IF;
        IF rights_row.acquisition <> 'ALLOW' THEN
            RAISE EXCEPTION 'rights version does not allow acquisition';
        END IF;
        IF NEW.execution_mode IN ('SYSTEMATIC', 'BACKFILL')
           AND rights_row.systematic_collection <> 'ALLOW' THEN
            RAISE EXCEPTION 'rights version does not allow systematic collection';
        END IF;
        IF NEW.execution_mode = 'BACKFILL'
           AND rights_row.historical_backfill <> 'ALLOW' THEN
            RAISE EXCEPTION 'rights version does not allow historical backfill';
        END IF;
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER request_plan_admission
BEFORE INSERT ON control.request_plan
FOR EACH ROW EXECUTE FUNCTION control.enforce_request_plan_admission();

CREATE TABLE control.collection_run (
    run_id                 UUID PRIMARY KEY,
    request_plan_id        UUID NOT NULL REFERENCES control.request_plan(request_plan_id),
    collector_version      TEXT NOT NULL,
    started_at             TIMESTAMPTZ NOT NULL,
    network_request_count  INTEGER NOT NULL CHECK (network_request_count >= 0),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (run_id, request_plan_id)
);

CREATE FUNCTION control.enforce_collection_run()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    plan_mode TEXT;
BEGIN
    SELECT execution_mode INTO plan_mode
      FROM control.request_plan
     WHERE request_plan_id = NEW.request_plan_id;
    IF plan_mode = 'FIXTURE' AND NEW.network_request_count <> 0 THEN
        RAISE EXCEPTION 'fixture run must have zero network requests';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER collection_run_admission
BEFORE INSERT ON control.collection_run
FOR EACH ROW EXECUTE FUNCTION control.enforce_collection_run();

CREATE TABLE control.collection_run_event (
    run_id                 UUID NOT NULL REFERENCES control.collection_run(run_id),
    event_sequence         INTEGER NOT NULL CHECK (event_sequence > 0),
    event_type             TEXT NOT NULL CHECK (event_type IN (
        'STARTED', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED'
    )),
    event_at               TIMESTAMPTZ NOT NULL,
    detail_code            TEXT,
    detail_summary         TEXT,
    PRIMARY KEY (run_id, event_sequence)
);

CREATE FUNCTION control.enforce_run_event_sequence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    previous_type TEXT;
BEGIN
    IF NEW.event_sequence = 1 THEN
        IF NEW.event_type <> 'STARTED' THEN
            RAISE EXCEPTION 'first run event must be STARTED';
        END IF;
        RETURN NEW;
    END IF;
    SELECT event_type INTO previous_type
      FROM control.collection_run_event
     WHERE run_id = NEW.run_id
       AND event_sequence = NEW.event_sequence - 1;
    IF previous_type IS NULL THEN
        RAISE EXCEPTION 'run event sequence must be contiguous';
    END IF;
    IF previous_type IN ('SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED') THEN
        RAISE EXCEPTION 'terminal run event cannot be followed by another event';
    END IF;
    IF NEW.event_type = 'STARTED' THEN
        RAISE EXCEPTION 'STARTED can appear only once';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER collection_run_event_sequence
BEFORE INSERT ON control.collection_run_event
FOR EACH ROW EXECUTE FUNCTION control.enforce_run_event_sequence();

CREATE TABLE control.evidence_envelope (
    evidence_id             UUID PRIMARY KEY,
    run_id                  UUID NOT NULL REFERENCES control.collection_run(run_id),
    evidence_mode           TEXT NOT NULL CHECK (evidence_mode IN (
        'PERSISTED_RAW', 'EPHEMERAL_NORMALIZED', 'SYNTHETIC_FIXTURE'
    )),
    object_key              TEXT,
    raw_payload_hash        control.sha256_hex,
    byte_count              BIGINT CHECK (byte_count IS NULL OR byte_count >= 0),
    content_type            TEXT NOT NULL,
    compression             TEXT NOT NULL CHECK (compression IN ('NONE', 'GZIP', 'ZSTD')),
    canonical_evidence_hash control.sha256_hex NOT NULL,
    raw_discarded_at        TIMESTAMPTZ,
    test_only               BOOLEAN NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (evidence_id, run_id),
    CHECK (
        (evidence_mode = 'PERSISTED_RAW'
         AND object_key IS NOT NULL AND raw_payload_hash IS NOT NULL AND byte_count IS NOT NULL
         AND raw_discarded_at IS NULL AND NOT test_only)
        OR
        (evidence_mode = 'EPHEMERAL_NORMALIZED'
         AND object_key IS NULL AND raw_payload_hash IS NULL AND byte_count IS NULL
         AND raw_discarded_at IS NOT NULL AND NOT test_only)
        OR
        (evidence_mode = 'SYNTHETIC_FIXTURE'
         AND object_key IS NOT NULL AND raw_payload_hash IS NOT NULL AND byte_count IS NOT NULL
         AND raw_discarded_at IS NULL AND test_only)
    )
);

CREATE FUNCTION control.enforce_evidence_admission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    plan_mode TEXT;
    rights_row control.source_rights_version%ROWTYPE;
BEGIN
    SELECT rp.execution_mode
      INTO plan_mode
      FROM control.collection_run AS cr
      JOIN control.request_plan AS rp ON rp.request_plan_id = cr.request_plan_id
     WHERE cr.run_id = NEW.run_id;
    SELECT sr.*
      INTO rights_row
      FROM control.collection_run AS cr
      JOIN control.request_plan AS rp ON rp.request_plan_id = cr.request_plan_id
      JOIN control.source_rights_version AS sr ON sr.rights_version_id = rp.rights_version_id
     WHERE cr.run_id = NEW.run_id;

    IF NEW.evidence_mode = 'SYNTHETIC_FIXTURE' THEN
        IF plan_mode <> 'FIXTURE' THEN
            RAISE EXCEPTION 'synthetic fixture evidence requires FIXTURE plan';
        END IF;
    ELSIF plan_mode = 'FIXTURE' THEN
        RAISE EXCEPTION 'fixture plan cannot create real-data evidence mode';
    ELSIF NEW.evidence_mode = 'PERSISTED_RAW' THEN
        IF rights_row.raw_storage <> 'ALLOW' THEN
            RAISE EXCEPTION 'rights do not allow persisted raw evidence';
        END IF;
    ELSIF NEW.evidence_mode = 'EPHEMERAL_NORMALIZED' THEN
        IF rights_row.normalized_storage <> 'ALLOW' THEN
            RAISE EXCEPTION 'rights do not allow normalized storage';
        END IF;
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER evidence_admission
BEFORE INSERT ON control.evidence_envelope
FOR EACH ROW EXECUTE FUNCTION control.enforce_evidence_admission();

CREATE TABLE control.evidence_deletion_event (
    deletion_event_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evidence_id             UUID NOT NULL REFERENCES control.evidence_envelope(evidence_id),
    event_type              TEXT NOT NULL CHECK (event_type IN (
        'DELETE_REQUESTED', 'DELETE_CONFIRMED', 'RECONCILED'
    )),
    event_at                TIMESTAMPTZ NOT NULL,
    request_event_id        BIGINT REFERENCES control.evidence_deletion_event(deletion_event_id),
    provider_receipt        TEXT,
    executor_ref            TEXT NOT NULL,
    CHECK (
        (event_type = 'DELETE_REQUESTED' AND request_event_id IS NULL AND provider_receipt IS NULL)
        OR (event_type = 'DELETE_CONFIRMED' AND request_event_id IS NOT NULL AND provider_receipt IS NOT NULL)
        OR (event_type = 'RECONCILED' AND provider_receipt IS NOT NULL)
    )
);

CREATE FUNCTION control.enforce_deletion_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    evidence_kind TEXT;
    requested control.evidence_deletion_event%ROWTYPE;
BEGIN
    SELECT evidence_mode INTO evidence_kind
      FROM control.evidence_envelope
     WHERE evidence_id = NEW.evidence_id;
    IF evidence_kind <> 'PERSISTED_RAW' THEN
        RAISE EXCEPTION 'deletion events apply only to persisted raw evidence';
    END IF;
    IF NEW.event_type = 'DELETE_CONFIRMED' THEN
        SELECT * INTO requested
          FROM control.evidence_deletion_event
         WHERE deletion_event_id = NEW.request_event_id;
        IF NOT FOUND OR requested.evidence_id <> NEW.evidence_id
           OR requested.event_type <> 'DELETE_REQUESTED'
           OR requested.event_at > NEW.event_at THEN
            RAISE EXCEPTION 'delete confirmation requires earlier matching request';
        END IF;
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER evidence_deletion_event_admission
BEFORE INSERT ON control.evidence_deletion_event
FOR EACH ROW EXECUTE FUNCTION control.enforce_deletion_event();

CREATE TABLE control.item_identity (
    item_id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_seen_at           TIMESTAMPTZ NOT NULL
);

CREATE TABLE control.item_version (
    item_version_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id                 BIGINT NOT NULL REFERENCES control.item_identity(item_id),
    version_label           TEXT NOT NULL,
    supersedes_item_version_id BIGINT,
    market_hash_name        TEXT NOT NULL,
    effective_from          TIMESTAMPTZ NOT NULL,
    recorded_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    FOREIGN KEY (supersedes_item_version_id, item_id)
        REFERENCES control.item_version(item_version_id, item_id),
    UNIQUE (item_version_id, item_id),
    UNIQUE (item_id, version_label),
    UNIQUE (item_id, effective_from),
    UNIQUE (supersedes_item_version_id)
);

CREATE FUNCTION control.enforce_item_revision_chain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    latest control.item_version%ROWTYPE;
BEGIN
    SELECT * INTO latest
      FROM control.item_version
     WHERE item_id = NEW.item_id
     ORDER BY effective_from DESC, recorded_at DESC, item_version_id DESC
     LIMIT 1;
    IF NOT FOUND THEN
        IF NEW.supersedes_item_version_id IS NOT NULL THEN
            RAISE EXCEPTION 'first item version cannot supersede another row';
        END IF;
        RETURN NEW;
    END IF;
    IF NEW.supersedes_item_version_id IS NULL
       OR NEW.supersedes_item_version_id <> latest.item_version_id THEN
        RAISE EXCEPTION 'item version must supersede latest row %', latest.item_version_id;
    END IF;
    IF NEW.effective_from <= latest.effective_from THEN
        RAISE EXCEPTION 'new item effective_from must be later than prior version';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER item_revision_chain
BEFORE INSERT ON control.item_version
FOR EACH ROW EXECUTE FUNCTION control.enforce_item_revision_chain();

CREATE TABLE control.source_item_mapping_version (
    mapping_version_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_id               BIGINT NOT NULL REFERENCES control.data_source(source_id),
    source_item_id          TEXT NOT NULL,
    item_id                 BIGINT NOT NULL REFERENCES control.item_identity(item_id),
    market_hash_name        TEXT NOT NULL,
    version_label           TEXT NOT NULL,
    supersedes_mapping_version_id BIGINT,
    semantic_status         TEXT NOT NULL CHECK (semantic_status IN (
        'CONFIRMED', 'INFERRED', 'UNVERIFIED'
    )),
    effective_from          TIMESTAMPTZ NOT NULL,
    recorded_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    FOREIGN KEY (supersedes_mapping_version_id, source_id)
        REFERENCES control.source_item_mapping_version(mapping_version_id, source_id),
    UNIQUE (mapping_version_id, source_id),
    UNIQUE (source_id, source_item_id, version_label),
    UNIQUE (source_id, source_item_id, effective_from),
    UNIQUE (supersedes_mapping_version_id)
);

CREATE FUNCTION control.enforce_mapping_revision_chain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    latest control.source_item_mapping_version%ROWTYPE;
BEGIN
    SELECT * INTO latest
      FROM control.source_item_mapping_version
     WHERE source_id = NEW.source_id
       AND source_item_id = NEW.source_item_id
     ORDER BY effective_from DESC, recorded_at DESC, mapping_version_id DESC
     LIMIT 1;
    IF NOT FOUND THEN
        IF NEW.supersedes_mapping_version_id IS NOT NULL THEN
            RAISE EXCEPTION 'first mapping version cannot supersede another row';
        END IF;
        RETURN NEW;
    END IF;
    IF NEW.supersedes_mapping_version_id IS NULL
       OR NEW.supersedes_mapping_version_id <> latest.mapping_version_id THEN
        RAISE EXCEPTION 'mapping version must supersede latest row %', latest.mapping_version_id;
    END IF;
    IF NEW.effective_from <= latest.effective_from THEN
        RAISE EXCEPTION 'new mapping effective_from must be later than prior version';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER source_item_mapping_revision_chain
BEFORE INSERT ON control.source_item_mapping_version
FOR EACH ROW EXECUTE FUNCTION control.enforce_mapping_revision_chain();

CREATE TABLE control.input_dataset_snapshot (
    dataset_snapshot_id     UUID PRIMARY KEY,
    run_id                  UUID NOT NULL REFERENCES control.collection_run(run_id),
    usage_scope             TEXT NOT NULL CHECK (usage_scope IN (
        'TEST_ONLY', 'VALIDATION_ONLY', 'RESEARCH'
    )),
    parser_version          TEXT NOT NULL,
    schema_version          INTEGER NOT NULL CHECK (schema_version > 0),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (dataset_snapshot_id, run_id)
);

CREATE FUNCTION control.enforce_dataset_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    plan_mode TEXT;
    normalized_right control.permission_state;
BEGIN
    SELECT rp.execution_mode, sr.normalized_storage
      INTO plan_mode, normalized_right
      FROM control.collection_run AS cr
      JOIN control.request_plan AS rp ON rp.request_plan_id = cr.request_plan_id
      JOIN control.source_rights_version AS sr ON sr.rights_version_id = rp.rights_version_id
     WHERE cr.run_id = NEW.run_id;
    IF plan_mode = 'FIXTURE' AND NEW.usage_scope <> 'TEST_ONLY' THEN
        RAISE EXCEPTION 'fixture dataset must be TEST_ONLY';
    END IF;
    IF plan_mode <> 'FIXTURE' AND normalized_right <> 'ALLOW' THEN
        RAISE EXCEPTION 'real dataset requires normalized_storage=ALLOW';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER input_dataset_scope
BEFORE INSERT ON control.input_dataset_snapshot
FOR EACH ROW EXECUTE FUNCTION control.enforce_dataset_scope();

CREATE TABLE control.input_dataset_member (
    dataset_snapshot_id     UUID NOT NULL,
    run_id                  UUID NOT NULL,
    member_ordinal          INTEGER NOT NULL CHECK (member_ordinal > 0),
    evidence_id             UUID NOT NULL,
    source_item_id          TEXT NOT NULL,
    mapping_version_id      BIGINT NOT NULL,
    as_of_at                TIMESTAMPTZ NOT NULL,
    normalized_member_hash  control.sha256_hex NOT NULL,
    PRIMARY KEY (dataset_snapshot_id, member_ordinal),
    FOREIGN KEY (dataset_snapshot_id, run_id)
        REFERENCES control.input_dataset_snapshot(dataset_snapshot_id, run_id),
    FOREIGN KEY (evidence_id, run_id)
        REFERENCES control.evidence_envelope(evidence_id, run_id),
    FOREIGN KEY (mapping_version_id)
        REFERENCES control.source_item_mapping_version(mapping_version_id),
    UNIQUE (dataset_snapshot_id, run_id, member_ordinal, source_item_id,
            mapping_version_id, normalized_member_hash)
);

CREATE FUNCTION control.enforce_dataset_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    plan_source_id BIGINT;
    mapping_row control.source_item_mapping_version%ROWTYPE;
    current_mapping_id BIGINT;
BEGIN
    IF EXISTS (
        SELECT 1 FROM control.input_dataset_seal
         WHERE dataset_snapshot_id = NEW.dataset_snapshot_id
    ) THEN
        RAISE EXCEPTION 'sealed dataset cannot accept more members';
    END IF;
    SELECT rp.source_id INTO plan_source_id
      FROM control.collection_run AS cr
      JOIN control.request_plan AS rp ON rp.request_plan_id = cr.request_plan_id
     WHERE cr.run_id = NEW.run_id;
    SELECT * INTO mapping_row
      FROM control.source_item_mapping_version
     WHERE mapping_version_id = NEW.mapping_version_id;
    IF NOT FOUND OR mapping_row.source_id <> plan_source_id
       OR mapping_row.source_item_id <> NEW.source_item_id THEN
        RAISE EXCEPTION 'dataset member mapping does not match run source/item';
    END IF;
    SELECT mapping_version_id INTO current_mapping_id
      FROM control.source_item_mapping_version
     WHERE source_id = plan_source_id
       AND source_item_id = NEW.source_item_id
       AND effective_from <= NEW.as_of_at
     ORDER BY effective_from DESC, recorded_at DESC, mapping_version_id DESC
     LIMIT 1;
    IF current_mapping_id IS DISTINCT FROM NEW.mapping_version_id THEN
        RAISE EXCEPTION 'dataset member must use current PIT mapping %', current_mapping_id;
    END IF;
    RETURN NEW;
END
$function$;

-- Declared before the member trigger executes at runtime; PostgreSQL resolves this table in function execution.
CREATE TABLE control.input_dataset_seal (
    dataset_snapshot_id     UUID PRIMARY KEY,
    run_id                  UUID NOT NULL,
    member_count            INTEGER NOT NULL CHECK (member_count > 0),
    manifest_hash           control.sha256_hex NOT NULL,
    sealed_at               TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (dataset_snapshot_id, run_id)
        REFERENCES control.input_dataset_snapshot(dataset_snapshot_id, run_id),
    UNIQUE (dataset_snapshot_id, run_id)
);

CREATE TRIGGER input_dataset_member_admission
BEFORE INSERT ON control.input_dataset_member
FOR EACH ROW EXECUTE FUNCTION control.enforce_dataset_member();

CREATE FUNCTION control.compute_dataset_manifest_hash(target_snapshot UUID)
RETURNS control.sha256_hex
LANGUAGE SQL
STABLE
SET search_path = pg_catalog, control
AS $function$
    SELECT encode(
        public.digest(
            COALESCE(string_agg(
                member_ordinal::TEXT || ':' ||
                octet_length(convert_to(source_item_id, 'UTF8'))::TEXT || ':' ||
                source_item_id || ':' || normalized_member_hash,
                E'\n' ORDER BY member_ordinal
            ), ''),
            'sha256'
        ),
        'hex'
    )::control.sha256_hex
      FROM control.input_dataset_member
     WHERE dataset_snapshot_id = target_snapshot
$function$;

CREATE FUNCTION control.enforce_dataset_seal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    actual_count INTEGER;
    actual_hash control.sha256_hex;
BEGIN
    SELECT count(*)::INTEGER, control.compute_dataset_manifest_hash(NEW.dataset_snapshot_id)
      INTO actual_count, actual_hash
      FROM control.input_dataset_member
     WHERE dataset_snapshot_id = NEW.dataset_snapshot_id;
    IF actual_count = 0 OR NEW.member_count <> actual_count OR NEW.manifest_hash <> actual_hash THEN
        RAISE EXCEPTION 'dataset seal mismatch: count %/% hash %/%',
            NEW.member_count, actual_count, NEW.manifest_hash, actual_hash;
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER input_dataset_seal_admission
BEFORE INSERT ON control.input_dataset_seal
FOR EACH ROW EXECUTE FUNCTION control.enforce_dataset_seal();

CREATE TABLE control.quality_event (
    quality_event_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_id                  UUID NOT NULL REFERENCES control.collection_run(run_id),
    evidence_id             UUID,
    source_item_id          TEXT,
    event_code              TEXT NOT NULL,
    severity                TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'BLOCKER')),
    context                 JSONB NOT NULL CHECK (jsonb_typeof(context) = 'object'),
    observed_at             TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (evidence_id, run_id)
        REFERENCES control.evidence_envelope(evidence_id, run_id)
);

CREATE TABLE fact.quote_observation (
    quote_observation_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dataset_snapshot_id     UUID NOT NULL,
    run_id                  UUID NOT NULL,
    member_ordinal          INTEGER NOT NULL,
    source_item_id          TEXT NOT NULL,
    mapping_version_id      BIGINT NOT NULL,
    normalized_record_hash  control.sha256_hex NOT NULL,
    parser_version          TEXT NOT NULL,
    schema_version          INTEGER NOT NULL CHECK (schema_version > 0),
    source_event_at         TIMESTAMPTZ,
    fetched_at              TIMESTAMPTZ NOT NULL,
    ingested_at             TIMESTAMPTZ NOT NULL,
    available_at            TIMESTAMPTZ NOT NULL,
    currency_code           control.currency_code NOT NULL,
    best_ask_minor          BIGINT CHECK (best_ask_minor IS NULL OR best_ask_minor >= 0),
    ask_volume_raw          NUMERIC(38,8) CHECK (ask_volume_raw IS NULL OR ask_volume_raw >= 0),
    ask_volume_unit         control.volume_unit NOT NULL,
    ask_volume_source_field TEXT,
    best_bid_minor          BIGINT CHECK (best_bid_minor IS NULL OR best_bid_minor >= 0),
    bid_volume_raw          NUMERIC(38,8) CHECK (bid_volume_raw IS NULL OR bid_volume_raw >= 0),
    bid_volume_unit         control.volume_unit NOT NULL,
    bid_volume_source_field TEXT,
    field_availability      JSONB NOT NULL CHECK (jsonb_typeof(field_availability) = 'object'),
    FOREIGN KEY (dataset_snapshot_id, run_id)
        REFERENCES control.input_dataset_seal(dataset_snapshot_id, run_id),
    FOREIGN KEY (dataset_snapshot_id, run_id, member_ordinal, source_item_id,
                 mapping_version_id, normalized_record_hash)
        REFERENCES control.input_dataset_member
            (dataset_snapshot_id, run_id, member_ordinal, source_item_id,
             mapping_version_id, normalized_member_hash),
    CHECK (fetched_at <= ingested_at AND ingested_at <= available_at),
    UNIQUE (dataset_snapshot_id, member_ordinal, parser_version, schema_version)
);

-- Append-only protection. The database owner/superuser remains an explicit trusted boundary.
DO $append_only$
DECLARE
    qualified_name TEXT;
BEGIN
    FOREACH qualified_name IN ARRAY ARRAY[
        'control.schema_release',
        'control.data_source',
        'control.source_rights_version',
        'control.source_endpoint',
        'control.source_endpoint_version',
        'control.fixture_provenance',
        'control.request_plan',
        'control.collection_run',
        'control.collection_run_event',
        'control.evidence_envelope',
        'control.evidence_deletion_event',
        'control.item_identity',
        'control.item_version',
        'control.source_item_mapping_version',
        'control.input_dataset_snapshot',
        'control.input_dataset_member',
        'control.input_dataset_seal',
        'control.quality_event',
        'fact.quote_observation'
    ]
    LOOP
        EXECUTE format(
            'CREATE TRIGGER reject_update_delete BEFORE UPDATE OR DELETE ON %s '
            'FOR EACH ROW EXECUTE FUNCTION control.reject_mutation()',
            qualified_name
        );
    END LOOP;
END
$append_only$;

INSERT INTO control.schema_release(release_name, status, notes)
VALUES (
    'v0.4a-ingestion-contract',
    'CANDIDATE',
    'Minimal control/fact ingestion contract; no research, result, AI, case, evaluation, or trade_event layer.'
);

GRANT USAGE ON SCHEMA control TO cs2_plan_writer;
GRANT SELECT ON control.data_source, control.source_rights_version,
    control.source_endpoint, control.source_endpoint_version,
    control.fixture_provenance TO cs2_plan_writer;
GRANT INSERT ON control.request_plan TO cs2_plan_writer;

GRANT USAGE ON SCHEMA control TO cs2_collector_writer;
GRANT SELECT ON control.request_plan, control.source_rights_version,
    control.collection_run, control.evidence_envelope TO cs2_collector_writer;
GRANT INSERT ON control.collection_run, control.collection_run_event,
    control.evidence_envelope, control.evidence_deletion_event TO cs2_collector_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA control TO cs2_collector_writer;

GRANT USAGE ON SCHEMA control, fact TO cs2_normalizer_writer;
GRANT SELECT ON ALL TABLES IN SCHEMA control TO cs2_normalizer_writer;
GRANT INSERT ON control.input_dataset_snapshot, control.input_dataset_member,
    control.input_dataset_seal, control.quality_event TO cs2_normalizer_writer;
GRANT INSERT ON fact.quote_observation TO cs2_normalizer_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA control, fact TO cs2_normalizer_writer;

GRANT USAGE ON SCHEMA control, fact TO cs2_research_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA control, fact TO cs2_research_reader;

REVOKE ALL ON ALL TABLES IN SCHEMA control, fact FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA control, fact FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA control FROM PUBLIC;

COMMIT;
