\set ON_ERROR_STOP on

BEGIN;

DO $precondition$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM control.schema_release
         WHERE release_name = 'v0.4a-ingestion-contract'
    ) OR NOT EXISTS (
        SELECT 1 FROM control.schema_release
         WHERE release_name = 'v0.4b-catalog-contract'
    ) THEN
        RAISE EXCEPTION 'v0.4c requires v0.4a and v0.4b';
    END IF;
    IF EXISTS (SELECT 1 FROM control.request_plan)
       OR EXISTS (SELECT 1 FROM control.collection_run)
       OR EXISTS (SELECT 1 FROM control.input_dataset_snapshot)
       OR EXISTS (SELECT 1 FROM fact.quote_observation) THEN
        RAISE EXCEPTION
            'v0.4c refuses to rewrite existing operational rows; rebuild the synthetic development database or migrate data explicitly';
    END IF;
END
$precondition$;

COMMENT ON TABLE control.source_item_mapping_version IS
    'LEGACY V0.4a mapping. V0.4c quote facts must use catalog.source_mapping_version.';

ALTER TABLE control.request_plan
    ADD COLUMN item_key_kind TEXT NOT NULL CHECK (item_key_kind IN (
        'MARKET_HASH_NAME', 'SOURCE_ITEM_ID', 'OTHER', 'NOT_APPLICABLE'
    ));

CREATE TABLE control.request_plan_item (
    request_plan_id        UUID NOT NULL REFERENCES control.request_plan(request_plan_id),
    item_ordinal           INTEGER NOT NULL CHECK (item_ordinal > 0),
    item_key_kind          TEXT NOT NULL CHECK (item_key_kind IN (
        'MARKET_HASH_NAME', 'SOURCE_ITEM_ID', 'OTHER'
    )),
    item_key               TEXT NOT NULL CHECK (btrim(item_key) <> ''),
    PRIMARY KEY (request_plan_id, item_ordinal),
    UNIQUE (request_plan_id, item_key)
);

CREATE FUNCTION control.compute_request_item_manifest_hash(target_plan UUID)
RETURNS control.sha256_hex
LANGUAGE SQL
STABLE
SET search_path = pg_catalog, control
AS $function$
    SELECT encode(
        public.digest(
            convert_to(
                COALESCE(
                    '[' || string_agg(to_json(item_key)::TEXT, ',' ORDER BY item_key) || ']',
                    '[]'
                ) || E'\n',
                'UTF8'
            ),
            'sha256'
        ),
        'hex'
    )::control.sha256_hex
      FROM control.request_plan_item
     WHERE request_plan_id = target_plan
$function$;

CREATE FUNCTION control.enforce_request_plan_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    plan_kind TEXT;
BEGIN
    IF EXISTS (
        SELECT 1 FROM control.collection_run
         WHERE request_plan_id = NEW.request_plan_id
    ) THEN
        RAISE EXCEPTION 'a started request plan cannot accept more item keys';
    END IF;
    SELECT item_key_kind INTO plan_kind
      FROM control.request_plan
     WHERE request_plan_id = NEW.request_plan_id;
    IF plan_kind IS DISTINCT FROM NEW.item_key_kind THEN
        RAISE EXCEPTION 'request item key kind does not match plan';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER request_plan_item_admission
BEFORE INSERT ON control.request_plan_item
FOR EACH ROW EXECUTE FUNCTION control.enforce_request_plan_item();

CREATE OR REPLACE FUNCTION control.enforce_collection_run()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
DECLARE
    plan_row control.request_plan%ROWTYPE;
    actual_item_count INTEGER;
    actual_item_hash control.sha256_hex;
BEGIN
    SELECT * INTO plan_row
      FROM control.request_plan
     WHERE request_plan_id = NEW.request_plan_id;
    SELECT count(*)::INTEGER,
           control.compute_request_item_manifest_hash(NEW.request_plan_id)
      INTO actual_item_count, actual_item_hash
      FROM control.request_plan_item
     WHERE request_plan_id = NEW.request_plan_id;
    IF actual_item_hash <> plan_row.item_manifest_hash THEN
        RAISE EXCEPTION 'request plan item manifest mismatch';
    END IF;
    IF (plan_row.item_key_kind = 'NOT_APPLICABLE' AND actual_item_count <> 0)
       OR (plan_row.item_key_kind <> 'NOT_APPLICABLE' AND actual_item_count = 0) THEN
        RAISE EXCEPTION 'request plan item count does not match item_key_kind';
    END IF;
    IF plan_row.execution_mode = 'FIXTURE' AND NEW.network_request_count <> 0 THEN
        RAISE EXCEPTION 'fixture run must have zero network requests';
    END IF;
    RETURN NEW;
END
$function$;

DROP TABLE fact.quote_observation;
DROP TRIGGER input_dataset_seal_admission ON control.input_dataset_seal;
DROP TRIGGER input_dataset_member_admission ON control.input_dataset_member;
DROP TRIGGER input_dataset_scope ON control.input_dataset_snapshot;
DROP FUNCTION control.enforce_dataset_seal();
DROP FUNCTION control.compute_dataset_manifest_hash(UUID);
DROP FUNCTION control.enforce_dataset_member();
DROP FUNCTION control.enforce_dataset_scope();
DROP TABLE control.input_dataset_seal;
DROP TABLE control.input_dataset_member;
DROP TABLE control.input_dataset_snapshot;

CREATE FUNCTION control.canonical_field_text(
    field_name TEXT,
    type_tag TEXT,
    field_value TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $function$
BEGIN
    IF field_name !~ '^[a-z][a-z0-9_]*$' THEN
        RAISE EXCEPTION 'invalid canonical field name';
    END IF;
    IF type_tag !~ '^[a-z][a-z0-9_-]*$' THEN
        RAISE EXCEPTION 'invalid canonical type tag';
    END IF;
    IF field_value IS NULL THEN
        RETURN octet_length(convert_to(field_name, 'UTF8'))::TEXT || ':' ||
               field_name || ':' || type_tag || ':N:' || E'\n';
    END IF;
    RETURN octet_length(convert_to(field_name, 'UTF8'))::TEXT || ':' ||
           field_name || ':' || type_tag || ':V:' ||
           octet_length(convert_to(field_value, 'UTF8'))::TEXT || ':' ||
           field_value || E'\n';
END
$function$;

CREATE FUNCTION control.canonical_timestamp_text(value TIMESTAMPTZ)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $function$
    SELECT CASE WHEN value IS NULL THEN NULL ELSE
        to_char(value AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    END
$function$;

CREATE FUNCTION control.canonical_decimal_38_8_text(value NUMERIC)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $function$
    SELECT CASE WHEN value IS NULL THEN NULL ELSE (value::NUMERIC(38,8))::TEXT END
$function$;

CREATE FUNCTION control.canonical_enum_map_text(value JSONB)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $function$
    SELECT COALESCE(
        string_agg(
            octet_length(convert_to(key, 'UTF8'))::TEXT || ':' || key || ':' ||
            octet_length(convert_to(member, 'UTF8'))::TEXT || ':' || member,
            E'\n' ORDER BY key
        ),
        ''
    )
      FROM jsonb_each_text(value)
           AS entries(key, member)
$function$;

CREATE FUNCTION control.canonical_string_list_text(value TEXT[])
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $function$
    SELECT COALESCE(
        string_agg(
            octet_length(convert_to(member, 'UTF8'))::TEXT || ':' || member,
            E'\n' ORDER BY member
        ),
        ''
    )
      FROM unnest(COALESCE(value, ARRAY[]::TEXT[])) AS entries(member)
$function$;

CREATE FUNCTION control.valid_field_availability(value JSONB)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $function$
    SELECT jsonb_typeof(value) = 'object'
       AND value <> '{}'::JSONB
       AND NOT EXISTS (
            SELECT 1 FROM jsonb_each_text(value) AS entries(key, member)
             WHERE key = '' OR member NOT IN ('MISSING', 'NULL', 'PRESENT')
       )
$function$;

CREATE FUNCTION control.valid_string_set(value TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $function$
    SELECT COALESCE(array_length(value, 1), 0) = (
        SELECT count(DISTINCT member)
          FROM unnest(COALESCE(value, ARRAY[]::TEXT[])) AS entries(member)
    )
    AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(value, ARRAY[]::TEXT[])) AS entries(member)
         WHERE member IS NULL OR btrim(member) = ''
    )
$function$;

CREATE FUNCTION control.compute_quote_record_hash(
    evidence_id UUID,
    request_item_key TEXT,
    source_item_id TEXT,
    source_mapping_version_id BIGINT,
    mapping_valid_at TIMESTAMPTZ,
    mapping_known_at TIMESTAMPTZ,
    parser_version TEXT,
    schema_version INTEGER,
    source_event_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ,
    available_at TIMESTAMPTZ,
    currency_code TEXT,
    best_ask_minor BIGINT,
    ask_volume_raw NUMERIC,
    ask_volume_unit TEXT,
    ask_volume_source_field TEXT,
    best_bid_minor BIGINT,
    bid_volume_raw NUMERIC,
    bid_volume_unit TEXT,
    bid_volume_source_field TEXT,
    field_availability JSONB,
    unconsumed_source_fields TEXT[]
)
RETURNS control.sha256_hex
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog, control, public
AS $function$
    SELECT encode(
        public.digest(
            convert_to(
                'quote-record-v2' || E'\n' ||
                control.canonical_field_text('evidence_id', 'uuid', evidence_id::TEXT) ||
                control.canonical_field_text('request_item_key', 'string', request_item_key) ||
                control.canonical_field_text('source_item_id', 'string', source_item_id) ||
                control.canonical_field_text('source_mapping_version_id', 'integer', source_mapping_version_id::TEXT) ||
                control.canonical_field_text('mapping_valid_at', 'timestamp', control.canonical_timestamp_text(mapping_valid_at)) ||
                control.canonical_field_text('mapping_known_at', 'timestamp', control.canonical_timestamp_text(mapping_known_at)) ||
                control.canonical_field_text('parser_version', 'string', parser_version) ||
                control.canonical_field_text('schema_version', 'integer', schema_version::TEXT) ||
                control.canonical_field_text('source_event_at', 'timestamp', control.canonical_timestamp_text(source_event_at)) ||
                control.canonical_field_text('fetched_at', 'timestamp', control.canonical_timestamp_text(fetched_at)) ||
                control.canonical_field_text('ingested_at', 'timestamp', control.canonical_timestamp_text(ingested_at)) ||
                control.canonical_field_text('available_at', 'timestamp', control.canonical_timestamp_text(available_at)) ||
                control.canonical_field_text('currency_code', 'string', currency_code) ||
                control.canonical_field_text('best_ask_minor', 'integer', best_ask_minor::TEXT) ||
                control.canonical_field_text('ask_volume_raw', 'decimal', control.canonical_decimal_38_8_text(ask_volume_raw)) ||
                control.canonical_field_text('ask_volume_unit', 'string', ask_volume_unit) ||
                control.canonical_field_text('ask_volume_source_field', 'string', ask_volume_source_field) ||
                control.canonical_field_text('best_bid_minor', 'integer', best_bid_minor::TEXT) ||
                control.canonical_field_text('bid_volume_raw', 'decimal', control.canonical_decimal_38_8_text(bid_volume_raw)) ||
                control.canonical_field_text('bid_volume_unit', 'string', bid_volume_unit) ||
                control.canonical_field_text('bid_volume_source_field', 'string', bid_volume_source_field) ||
                control.canonical_field_text('field_availability', 'enum_map', control.canonical_enum_map_text(field_availability)) ||
                control.canonical_field_text('unconsumed_source_fields', 'string_list', control.canonical_string_list_text(unconsumed_source_fields)),
                'UTF8'
            ),
            'sha256'
        ),
        'hex'
    )::control.sha256_hex
$function$;

CREATE FUNCTION control.compute_dataset_issue_hash(
    issue_code TEXT,
    severity TEXT,
    detail_code TEXT,
    request_item_key TEXT,
    source_member_key TEXT,
    source_item_id TEXT,
    field_name TEXT
)
RETURNS control.sha256_hex
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog, control, public
AS $function$
    SELECT encode(
        public.digest(
            convert_to(
                'dataset-issue-v1' || E'\n' ||
                control.canonical_field_text('issue_code', 'string', issue_code) ||
                control.canonical_field_text('severity', 'string', severity) ||
                control.canonical_field_text('detail_code', 'string', detail_code) ||
                control.canonical_field_text('request_item_key', 'string', request_item_key) ||
                control.canonical_field_text('source_member_key', 'string', source_member_key) ||
                control.canonical_field_text('source_item_id', 'string', source_item_id) ||
                control.canonical_field_text('field_name', 'string', field_name),
                'UTF8'
            ),
            'sha256'
        ),
        'hex'
    )::control.sha256_hex
$function$;

CREATE TABLE control.input_dataset_snapshot (
    dataset_snapshot_id     UUID PRIMARY KEY,
    run_id                  UUID NOT NULL REFERENCES control.collection_run(run_id),
    usage_scope             TEXT NOT NULL CHECK (usage_scope IN (
        'TEST_ONLY', 'VALIDATION_ONLY', 'RESEARCH'
    )),
    parser_version          TEXT NOT NULL CHECK (btrim(parser_version) <> ''),
    schema_version          INTEGER NOT NULL CHECK (schema_version > 0),
    completeness_status     TEXT NOT NULL CHECK (completeness_status IN (
        'COMPLETE', 'PARTIAL'
    )),
    requested_member_count  INTEGER NOT NULL CHECK (requested_member_count > 0),
    returned_member_count   INTEGER NOT NULL CHECK (returned_member_count >= 0),
    accepted_member_count   INTEGER NOT NULL CHECK (accepted_member_count > 0),
    rejected_member_count   INTEGER NOT NULL CHECK (rejected_member_count >= 0),
    missing_member_count    INTEGER NOT NULL CHECK (missing_member_count >= 0),
    issue_count             INTEGER NOT NULL CHECK (issue_count >= 0),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (dataset_snapshot_id, run_id),
    CHECK (accepted_member_count + rejected_member_count = returned_member_count),
    CHECK (accepted_member_count <= requested_member_count),
    CHECK (missing_member_count <= requested_member_count),
    CHECK (
        (completeness_status = 'COMPLETE'
         AND accepted_member_count = requested_member_count
         AND returned_member_count = accepted_member_count
         AND rejected_member_count = 0
         AND missing_member_count = 0
         AND issue_count = 0)
        OR
        (completeness_status = 'PARTIAL' AND issue_count > 0)
    )
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
    request_count INTEGER;
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
    SELECT count(*)::INTEGER INTO request_count
      FROM control.collection_run AS cr
      JOIN control.request_plan_item AS item
        ON item.request_plan_id = cr.request_plan_id
     WHERE cr.run_id = NEW.run_id;
    IF request_count <> NEW.requested_member_count THEN
        RAISE EXCEPTION 'dataset requested member count does not match sealed request plan';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER input_dataset_scope
BEFORE INSERT ON control.input_dataset_snapshot
FOR EACH ROW EXECUTE FUNCTION control.enforce_dataset_scope();

CREATE TABLE control.input_dataset_member (
    dataset_snapshot_id       UUID NOT NULL,
    run_id                    UUID NOT NULL,
    member_ordinal            INTEGER NOT NULL CHECK (member_ordinal > 0),
    evidence_id               UUID NOT NULL,
    request_item_key          TEXT NOT NULL CHECK (btrim(request_item_key) <> ''),
    source_item_id            TEXT NOT NULL CHECK (btrim(source_item_id) <> ''),
    source_mapping_version_id BIGINT NOT NULL,
    mapping_valid_at          TIMESTAMPTZ NOT NULL,
    mapping_known_at          TIMESTAMPTZ NOT NULL,
    normalized_member_hash    control.sha256_hex NOT NULL,
    PRIMARY KEY (dataset_snapshot_id, member_ordinal),
    FOREIGN KEY (dataset_snapshot_id, run_id)
        REFERENCES control.input_dataset_snapshot(dataset_snapshot_id, run_id),
    FOREIGN KEY (evidence_id, run_id)
        REFERENCES control.evidence_envelope(evidence_id, run_id),
    FOREIGN KEY (source_mapping_version_id)
        REFERENCES catalog.source_mapping_version(source_mapping_version_id),
    UNIQUE (dataset_snapshot_id, run_id, member_ordinal, source_item_id,
            source_mapping_version_id, normalized_member_hash)
);

CREATE FUNCTION control.enforce_dataset_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control, catalog
AS $function$
DECLARE
    plan_source_id BIGINT;
    target_plan_id UUID;
    mapping_row catalog.source_mapping_version%ROWTYPE;
    current_mapping_id BIGINT;
BEGIN
    IF EXISTS (
        SELECT 1 FROM control.input_dataset_seal
         WHERE dataset_snapshot_id = NEW.dataset_snapshot_id
    ) THEN
        RAISE EXCEPTION 'sealed dataset cannot accept more members';
    END IF;
    SELECT rp.source_id, rp.request_plan_id
      INTO plan_source_id, target_plan_id
      FROM control.collection_run AS cr
      JOIN control.request_plan AS rp ON rp.request_plan_id = cr.request_plan_id
     WHERE cr.run_id = NEW.run_id;
    IF NOT EXISTS (
        SELECT 1 FROM control.request_plan_item
         WHERE request_plan_id = target_plan_id
           AND item_key = NEW.request_item_key
    ) THEN
        RAISE EXCEPTION 'dataset member was not present in the sealed request item set';
    END IF;
    SELECT * INTO mapping_row
      FROM catalog.source_mapping_version
     WHERE source_mapping_version_id = NEW.source_mapping_version_id;
    IF NOT FOUND OR mapping_row.source_id <> plan_source_id
       OR mapping_row.source_item_id <> NEW.source_item_id
       OR mapping_row.mapping_status <> 'RESOLVED' THEN
        RAISE EXCEPTION 'dataset member mapping does not match run source/item or is unresolved';
    END IF;
    SELECT source_mapping_version_id INTO current_mapping_id
      FROM catalog.source_mapping_version
     WHERE source_id = mapping_row.source_id
       AND source_item_id = mapping_row.source_item_id
       AND source_style_id IS NOT DISTINCT FROM mapping_row.source_style_id
       AND scope_kind = mapping_row.scope_kind
       AND min_float IS NOT DISTINCT FROM mapping_row.min_float
       AND max_float IS NOT DISTINCT FROM mapping_row.max_float
       AND effective_from <= NEW.mapping_valid_at
       AND recorded_at <= NEW.mapping_known_at
     ORDER BY effective_from DESC, recorded_at DESC, source_mapping_version_id DESC
     LIMIT 1;
    IF current_mapping_id IS DISTINCT FROM NEW.source_mapping_version_id THEN
        RAISE EXCEPTION 'dataset member must use current known PIT mapping %', current_mapping_id;
    END IF;
    RETURN NEW;
END
$function$;

CREATE TABLE control.input_dataset_issue (
    dataset_snapshot_id    UUID NOT NULL,
    run_id                 UUID NOT NULL,
    issue_ordinal          INTEGER NOT NULL CHECK (issue_ordinal > 0),
    issue_code             TEXT NOT NULL CHECK (issue_code ~ '^[A-Z][A-Z0-9_]*$'),
    severity               TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'BLOCKER')),
    detail_code            TEXT NOT NULL CHECK (detail_code ~ '^[A-Z][A-Z0-9_]*$'),
    request_item_key       TEXT,
    source_member_key      TEXT,
    source_item_id         TEXT,
    field_name             TEXT,
    normalized_issue_hash control.sha256_hex NOT NULL,
    PRIMARY KEY (dataset_snapshot_id, issue_ordinal),
    FOREIGN KEY (dataset_snapshot_id, run_id)
        REFERENCES control.input_dataset_snapshot(dataset_snapshot_id, run_id),
    CHECK (request_item_key IS NULL OR btrim(request_item_key) <> ''),
    CHECK (source_member_key IS NULL OR btrim(source_member_key) <> ''),
    CHECK (source_item_id IS NULL OR btrim(source_item_id) <> ''),
    CHECK (field_name IS NULL OR btrim(field_name) <> '')
);

CREATE FUNCTION control.enforce_dataset_issue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control
AS $function$
BEGIN
    IF EXISTS (
        SELECT 1 FROM control.input_dataset_seal
         WHERE dataset_snapshot_id = NEW.dataset_snapshot_id
    ) THEN
        RAISE EXCEPTION 'sealed dataset cannot accept more issues';
    END IF;
    IF NEW.normalized_issue_hash <> control.compute_dataset_issue_hash(
        NEW.issue_code, NEW.severity, NEW.detail_code, NEW.request_item_key,
        NEW.source_member_key, NEW.source_item_id, NEW.field_name
    ) THEN
        RAISE EXCEPTION 'dataset issue canonical hash mismatch';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TABLE fact.quote_observation (
    quote_observation_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dataset_snapshot_id     UUID NOT NULL,
    run_id                  UUID NOT NULL,
    member_ordinal          INTEGER NOT NULL,
    source_item_id          TEXT NOT NULL,
    source_mapping_version_id BIGINT NOT NULL,
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
    field_availability      JSONB NOT NULL CHECK (control.valid_field_availability(field_availability)),
    unconsumed_source_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
        CHECK (control.valid_string_set(unconsumed_source_fields)),
    FOREIGN KEY (dataset_snapshot_id, run_id)
        REFERENCES control.input_dataset_snapshot(dataset_snapshot_id, run_id),
    FOREIGN KEY (dataset_snapshot_id, run_id, member_ordinal, source_item_id,
                 source_mapping_version_id, normalized_record_hash)
        REFERENCES control.input_dataset_member
            (dataset_snapshot_id, run_id, member_ordinal, source_item_id,
             source_mapping_version_id, normalized_member_hash),
    CHECK (fetched_at <= ingested_at AND ingested_at <= available_at),
    CHECK (source_event_at IS NULL OR source_event_at <= available_at),
    UNIQUE (dataset_snapshot_id, member_ordinal, parser_version, schema_version)
);

CREATE FUNCTION control.enforce_quote_observation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control, fact
AS $function$
DECLARE
    member_row control.input_dataset_member%ROWTYPE;
    snapshot_row control.input_dataset_snapshot%ROWTYPE;
    expected_hash control.sha256_hex;
BEGIN
    IF EXISTS (
        SELECT 1 FROM control.input_dataset_seal
         WHERE dataset_snapshot_id = NEW.dataset_snapshot_id
    ) THEN
        RAISE EXCEPTION 'sealed dataset cannot accept more facts';
    END IF;
    SELECT * INTO member_row
      FROM control.input_dataset_member
     WHERE dataset_snapshot_id = NEW.dataset_snapshot_id
       AND member_ordinal = NEW.member_ordinal;
    SELECT * INTO snapshot_row
      FROM control.input_dataset_snapshot
     WHERE dataset_snapshot_id = NEW.dataset_snapshot_id;
    IF snapshot_row.parser_version <> NEW.parser_version
       OR snapshot_row.schema_version <> NEW.schema_version THEN
        RAISE EXCEPTION 'quote parser/schema does not match dataset';
    END IF;
    expected_hash := control.compute_quote_record_hash(
        member_row.evidence_id,
        member_row.request_item_key,
        NEW.source_item_id,
        NEW.source_mapping_version_id,
        member_row.mapping_valid_at,
        member_row.mapping_known_at,
        NEW.parser_version,
        NEW.schema_version,
        NEW.source_event_at,
        NEW.fetched_at,
        NEW.ingested_at,
        NEW.available_at,
        NEW.currency_code,
        NEW.best_ask_minor,
        NEW.ask_volume_raw,
        NEW.ask_volume_unit,
        NEW.ask_volume_source_field,
        NEW.best_bid_minor,
        NEW.bid_volume_raw,
        NEW.bid_volume_unit,
        NEW.bid_volume_source_field,
        NEW.field_availability,
        NEW.unconsumed_source_fields
    );
    IF NEW.normalized_record_hash <> expected_hash THEN
        RAISE EXCEPTION 'quote canonical hash mismatch';
    END IF;
    RETURN NEW;
END
$function$;

CREATE FUNCTION control.compute_dataset_manifest_hash(target_snapshot UUID)
RETURNS control.sha256_hex
LANGUAGE SQL
STABLE
SET search_path = pg_catalog, control, public
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

CREATE FUNCTION control.compute_dataset_issue_manifest_hash(target_snapshot UUID)
RETURNS control.sha256_hex
LANGUAGE SQL
STABLE
SET search_path = pg_catalog, control, public
AS $function$
    SELECT encode(
        public.digest(
            COALESCE(string_agg(
                issue_ordinal::TEXT || ':' ||
                octet_length(convert_to(issue_code, 'UTF8'))::TEXT || ':' ||
                issue_code || ':' || normalized_issue_hash,
                E'\n' ORDER BY issue_ordinal
            ), ''),
            'sha256'
        ),
        'hex'
    )::control.sha256_hex
      FROM control.input_dataset_issue
     WHERE dataset_snapshot_id = target_snapshot
$function$;

CREATE FUNCTION control.compute_dataset_content_hash(
    run_id UUID,
    usage_scope TEXT,
    parser_version TEXT,
    schema_version INTEGER,
    sealed_at TIMESTAMPTZ,
    completeness_status TEXT,
    requested_member_count INTEGER,
    returned_member_count INTEGER,
    accepted_member_count INTEGER,
    rejected_member_count INTEGER,
    missing_member_count INTEGER,
    issue_count INTEGER,
    member_manifest_hash TEXT,
    issue_manifest_hash TEXT
)
RETURNS control.sha256_hex
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog, control, public
AS $function$
    SELECT encode(
        public.digest(
            convert_to(
                'quote-dataset-v2' || E'\n' ||
                control.canonical_field_text('run_id', 'uuid', run_id::TEXT) ||
                control.canonical_field_text('usage_scope', 'string', usage_scope) ||
                control.canonical_field_text('parser_version', 'string', parser_version) ||
                control.canonical_field_text('schema_version', 'integer', schema_version::TEXT) ||
                control.canonical_field_text('sealed_at', 'timestamp', control.canonical_timestamp_text(sealed_at)) ||
                control.canonical_field_text('completeness_status', 'string', completeness_status) ||
                control.canonical_field_text('requested_member_count', 'integer', requested_member_count::TEXT) ||
                control.canonical_field_text('returned_member_count', 'integer', returned_member_count::TEXT) ||
                control.canonical_field_text('accepted_member_count', 'integer', accepted_member_count::TEXT) ||
                control.canonical_field_text('rejected_member_count', 'integer', rejected_member_count::TEXT) ||
                control.canonical_field_text('missing_member_count', 'integer', missing_member_count::TEXT) ||
                control.canonical_field_text('issue_count', 'integer', issue_count::TEXT) ||
                control.canonical_field_text('member_manifest_hash', 'hash', member_manifest_hash) ||
                control.canonical_field_text('issue_manifest_hash', 'hash', issue_manifest_hash),
                'UTF8'
            ),
            'sha256'
        ),
        'hex'
    )::control.sha256_hex
$function$;

CREATE TABLE control.input_dataset_seal (
    dataset_snapshot_id     UUID PRIMARY KEY,
    run_id                  UUID NOT NULL,
    member_count            INTEGER NOT NULL CHECK (member_count > 0),
    member_manifest_hash    control.sha256_hex NOT NULL,
    issue_count             INTEGER NOT NULL CHECK (issue_count >= 0),
    issue_manifest_hash     control.sha256_hex NOT NULL,
    dataset_content_hash    control.sha256_hex NOT NULL,
    sealed_at               TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (dataset_snapshot_id, run_id)
        REFERENCES control.input_dataset_snapshot(dataset_snapshot_id, run_id),
    UNIQUE (dataset_snapshot_id, run_id)
);

CREATE FUNCTION control.enforce_dataset_seal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, control, fact
AS $function$
DECLARE
    snapshot_row control.input_dataset_snapshot%ROWTYPE;
    actual_member_count INTEGER;
    actual_issue_count INTEGER;
    actual_fact_count INTEGER;
    actual_member_hash control.sha256_hex;
    actual_issue_hash control.sha256_hex;
    actual_content_hash control.sha256_hex;
    latest_ingested_at TIMESTAMPTZ;
    earliest_available_at TIMESTAMPTZ;
BEGIN
    SELECT * INTO snapshot_row
      FROM control.input_dataset_snapshot
     WHERE dataset_snapshot_id = NEW.dataset_snapshot_id;
    SELECT count(*)::INTEGER, control.compute_dataset_manifest_hash(NEW.dataset_snapshot_id)
      INTO actual_member_count, actual_member_hash
      FROM control.input_dataset_member
     WHERE dataset_snapshot_id = NEW.dataset_snapshot_id;
    SELECT count(*)::INTEGER, control.compute_dataset_issue_manifest_hash(NEW.dataset_snapshot_id)
      INTO actual_issue_count, actual_issue_hash
      FROM control.input_dataset_issue
     WHERE dataset_snapshot_id = NEW.dataset_snapshot_id;
    SELECT count(*)::INTEGER, max(ingested_at), min(available_at)
      INTO actual_fact_count, latest_ingested_at, earliest_available_at
      FROM fact.quote_observation
     WHERE dataset_snapshot_id = NEW.dataset_snapshot_id;
    IF actual_member_count = 0
       OR actual_member_count <> actual_fact_count
       OR NEW.member_count <> actual_member_count
       OR snapshot_row.accepted_member_count <> actual_member_count
       OR NEW.member_manifest_hash <> actual_member_hash
       OR NEW.issue_count <> actual_issue_count
       OR snapshot_row.issue_count <> actual_issue_count
       OR NEW.issue_manifest_hash <> actual_issue_hash THEN
        RAISE EXCEPTION 'dataset seal count or manifest mismatch';
    END IF;
    IF NOT (latest_ingested_at <= NEW.sealed_at AND NEW.sealed_at <= earliest_available_at) THEN
        RAISE EXCEPTION 'dataset sealed_at must be between ingestion and availability';
    END IF;
    actual_content_hash := control.compute_dataset_content_hash(
        snapshot_row.run_id,
        snapshot_row.usage_scope,
        snapshot_row.parser_version,
        snapshot_row.schema_version,
        NEW.sealed_at,
        snapshot_row.completeness_status,
        snapshot_row.requested_member_count,
        snapshot_row.returned_member_count,
        snapshot_row.accepted_member_count,
        snapshot_row.rejected_member_count,
        snapshot_row.missing_member_count,
        snapshot_row.issue_count,
        NEW.member_manifest_hash,
        NEW.issue_manifest_hash
    );
    IF NEW.dataset_content_hash <> actual_content_hash THEN
        RAISE EXCEPTION 'dataset content hash mismatch';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER input_dataset_member_admission
BEFORE INSERT ON control.input_dataset_member
FOR EACH ROW EXECUTE FUNCTION control.enforce_dataset_member();

CREATE TRIGGER input_dataset_issue_admission
BEFORE INSERT ON control.input_dataset_issue
FOR EACH ROW EXECUTE FUNCTION control.enforce_dataset_issue();

CREATE TRIGGER quote_observation_admission
BEFORE INSERT ON fact.quote_observation
FOR EACH ROW EXECUTE FUNCTION control.enforce_quote_observation();

CREATE TRIGGER input_dataset_seal_admission
BEFORE INSERT ON control.input_dataset_seal
FOR EACH ROW EXECUTE FUNCTION control.enforce_dataset_seal();

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON control.request_plan_item
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON control.input_dataset_snapshot
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON control.input_dataset_member
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON control.input_dataset_issue
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON control.input_dataset_seal
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON fact.quote_observation
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

INSERT INTO control.schema_release(release_name, status, notes)
VALUES (
    'v0.4c-unified-quote-contract',
    'CANDIDATE',
    'V0.4b catalog is authoritative for quotes; request members, partial datasets and typed content hashes are mechanically sealed.'
);

GRANT SELECT, INSERT ON control.request_plan_item TO cs2_plan_writer;
GRANT SELECT ON control.request_plan_item TO cs2_collector_writer;

GRANT SELECT ON ALL TABLES IN SCHEMA control, catalog TO cs2_normalizer_writer;
GRANT INSERT ON control.input_dataset_snapshot, control.input_dataset_member,
    control.input_dataset_issue, control.input_dataset_seal TO cs2_normalizer_writer;
GRANT INSERT ON fact.quote_observation TO cs2_normalizer_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA control, fact TO cs2_normalizer_writer;

GRANT SELECT ON ALL TABLES IN SCHEMA control, catalog, fact TO cs2_research_reader;

REVOKE ALL ON control.request_plan_item, control.input_dataset_snapshot,
    control.input_dataset_member, control.input_dataset_issue,
    control.input_dataset_seal, fact.quote_observation FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA control FROM PUBLIC;
GRANT EXECUTE ON FUNCTION control.valid_field_availability(JSONB),
    control.valid_string_set(TEXT[]) TO cs2_normalizer_writer;

COMMIT;
