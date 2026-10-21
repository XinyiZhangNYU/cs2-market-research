\set ON_ERROR_STOP on

BEGIN;

DO $precondition$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM control.schema_release
         WHERE release_name = 'v0.4a-ingestion-contract'
    ) THEN
        RAISE EXCEPTION 'v0.4b requires v0.4a-ingestion-contract';
    END IF;
END
$precondition$;

CREATE SCHEMA catalog;
REVOKE ALL ON SCHEMA catalog FROM PUBLIC;

DO $roles$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cs2_catalog_writer') THEN
        CREATE ROLE cs2_catalog_writer NOLOGIN;
    END IF;
END
$roles$;

CREATE TABLE catalog.item_variant_version (
    item_variant_version_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id                    BIGINT NOT NULL REFERENCES control.item_identity(item_id),
    version_label              TEXT NOT NULL CHECK (btrim(version_label) <> ''),
    supersedes_variant_version_id BIGINT,
    item_kind                  TEXT NOT NULL CHECK (item_kind IN (
        'WEAPON', 'KNIFE', 'GLOVE', 'AGENT', 'OTHER', 'UNKNOWN'
    )),
    canonical_market_hash_name TEXT CHECK (
        canonical_market_hash_name IS NULL OR btrim(canonical_market_hash_name) <> ''
    ),
    base_item_code             TEXT CHECK (base_item_code IS NULL OR btrim(base_item_code) <> ''),
    paint_index                INTEGER CHECK (paint_index IS NULL OR paint_index >= 0),
    wear_tier                  TEXT NOT NULL CHECK (wear_tier IN (
        'FACTORY_NEW', 'MINIMAL_WEAR', 'FIELD_TESTED', 'WELL_WORN',
        'BATTLE_SCARRED', 'NOT_APPLICABLE', 'UNKNOWN'
    )),
    edition_kind               TEXT NOT NULL CHECK (edition_kind IN (
        'STANDARD', 'STATTRAK', 'SOUVENIR', 'UNKNOWN'
    )),
    phase_code                 TEXT CHECK (phase_code IS NULL OR btrim(phase_code) <> ''),
    style_code                 TEXT CHECK (style_code IS NULL OR btrim(style_code) <> ''),
    semantic_status            TEXT NOT NULL CHECK (semantic_status IN (
        'CONFIRMED', 'INFERRED', 'UNVERIFIED'
    )),
    evidence_ref               TEXT NOT NULL CHECK (btrim(evidence_ref) <> ''),
    evidence_hash              control.sha256_hex,
    effective_from             TIMESTAMPTZ NOT NULL,
    recorded_at                TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    FOREIGN KEY (supersedes_variant_version_id, item_id)
        REFERENCES catalog.item_variant_version(item_variant_version_id, item_id),
    UNIQUE (item_variant_version_id, item_id),
    UNIQUE (item_id, version_label),
    UNIQUE (item_id, effective_from),
    UNIQUE (supersedes_variant_version_id)
);

CREATE FUNCTION catalog.enforce_variant_revision_chain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, catalog, control
AS $function$
DECLARE
    latest catalog.item_variant_version%ROWTYPE;
BEGIN
    NEW.recorded_at := clock_timestamp();
    PERFORM 1 FROM control.item_identity WHERE item_id = NEW.item_id FOR UPDATE;
    SELECT * INTO latest
      FROM catalog.item_variant_version
     WHERE item_id = NEW.item_id
     ORDER BY effective_from DESC, recorded_at DESC, item_variant_version_id DESC
     LIMIT 1;
    IF NOT FOUND THEN
        IF NEW.supersedes_variant_version_id IS NOT NULL THEN
            RAISE EXCEPTION 'first variant version cannot supersede another row';
        END IF;
        RETURN NEW;
    END IF;
    IF NEW.supersedes_variant_version_id IS NULL
       OR NEW.supersedes_variant_version_id <> latest.item_variant_version_id THEN
        RAISE EXCEPTION 'variant version must supersede latest row %',
            latest.item_variant_version_id;
    END IF;
    IF NEW.effective_from <= latest.effective_from THEN
        RAISE EXCEPTION 'new variant effective_from must be later than prior version';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER item_variant_revision_chain
BEFORE INSERT ON catalog.item_variant_version
FOR EACH ROW EXECUTE FUNCTION catalog.enforce_variant_revision_chain();

CREATE TABLE catalog.source_mapping_version (
    source_mapping_version_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_id                      BIGINT NOT NULL REFERENCES control.data_source(source_id),
    source_item_id                 TEXT NOT NULL CHECK (btrim(source_item_id) <> ''),
    source_style_id                TEXT,
    scope_kind                     TEXT NOT NULL CHECK (scope_kind IN (
        'AGGREGATE', 'MARKET_HASH_NAME', 'WEAR_RANGE', 'STYLE',
        'STYLE_WEAR', 'EXACT_VARIANT'
    )),
    min_float                      NUMERIC(9,8),
    max_float                      NUMERIC(9,8),
    item_id                        BIGINT REFERENCES control.item_identity(item_id),
    observed_market_hash_name      TEXT CHECK (
        observed_market_hash_name IS NULL OR btrim(observed_market_hash_name) <> ''
    ),
    version_label                  TEXT NOT NULL CHECK (btrim(version_label) <> ''),
    supersedes_mapping_version_id  BIGINT,
    mapping_status                 TEXT NOT NULL CHECK (mapping_status IN (
        'RESOLVED', 'UNKNOWN', 'AMBIGUOUS', 'CONFLICT', 'REJECTED'
    )),
    expected_candidate_count       INTEGER NOT NULL DEFAULT 0,
    semantic_status                TEXT NOT NULL CHECK (semantic_status IN (
        'CONFIRMED', 'INFERRED', 'UNVERIFIED'
    )),
    reason_code                    TEXT CHECK (reason_code IS NULL OR btrim(reason_code) <> ''),
    evidence_ref                   TEXT NOT NULL CHECK (btrim(evidence_ref) <> ''),
    evidence_hash                  control.sha256_hex,
    effective_from                 TIMESTAMPTZ NOT NULL,
    recorded_at                    TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    FOREIGN KEY (supersedes_mapping_version_id, source_id)
        REFERENCES catalog.source_mapping_version(source_mapping_version_id, source_id),
    UNIQUE (source_mapping_version_id, source_id),
    UNIQUE (supersedes_mapping_version_id),
    CHECK (
        (scope_kind IN ('WEAR_RANGE', 'STYLE_WEAR')
         AND min_float IS NOT NULL AND max_float IS NOT NULL
         AND min_float >= 0 AND max_float <= 1 AND min_float <= max_float)
        OR
        (scope_kind NOT IN ('WEAR_RANGE', 'STYLE_WEAR')
         AND min_float IS NULL AND max_float IS NULL)
    ),
    CHECK (source_style_id IS NULL OR btrim(source_style_id) <> ''),
    CHECK (scope_kind NOT IN ('STYLE', 'STYLE_WEAR') OR source_style_id IS NOT NULL),
    CHECK (
        (mapping_status = 'RESOLVED' AND item_id IS NOT NULL)
        OR (mapping_status <> 'RESOLVED' AND item_id IS NULL)
    ),
    CHECK (
        (mapping_status IN ('AMBIGUOUS', 'CONFLICT') AND expected_candidate_count >= 2)
        OR (mapping_status NOT IN ('AMBIGUOUS', 'CONFLICT') AND expected_candidate_count = 0)
    ),
    CHECK (mapping_status = 'RESOLVED' OR reason_code IS NOT NULL)
);

CREATE UNIQUE INDEX source_mapping_version_label_uk
    ON catalog.source_mapping_version (
        source_id, source_item_id, source_style_id, scope_kind,
        min_float, max_float, version_label
    ) NULLS NOT DISTINCT;

CREATE UNIQUE INDEX source_mapping_effective_from_uk
    ON catalog.source_mapping_version (
        source_id, source_item_id, source_style_id, scope_kind,
        min_float, max_float, effective_from
    ) NULLS NOT DISTINCT;

CREATE FUNCTION catalog.enforce_mapping_revision_chain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, catalog, control
AS $function$
DECLARE
    latest catalog.source_mapping_version%ROWTYPE;
BEGIN
    NEW.recorded_at := clock_timestamp();
    -- Early implementation deliberately serializes one source's catalog writes.
    -- This is safe for Gate 0 and can be narrowed after real write-rate evidence exists.
    PERFORM 1 FROM control.data_source WHERE source_id = NEW.source_id FOR UPDATE;
    SELECT * INTO latest
      FROM catalog.source_mapping_version
     WHERE source_id = NEW.source_id
       AND source_item_id = NEW.source_item_id
       AND source_style_id IS NOT DISTINCT FROM NEW.source_style_id
       AND scope_kind = NEW.scope_kind
       AND min_float IS NOT DISTINCT FROM NEW.min_float
       AND max_float IS NOT DISTINCT FROM NEW.max_float
     ORDER BY effective_from DESC, recorded_at DESC, source_mapping_version_id DESC
     LIMIT 1;
    IF NOT FOUND THEN
        IF NEW.supersedes_mapping_version_id IS NOT NULL THEN
            RAISE EXCEPTION 'first source mapping version cannot supersede another row';
        END IF;
        RETURN NEW;
    END IF;
    IF NEW.supersedes_mapping_version_id IS NULL
       OR NEW.supersedes_mapping_version_id <> latest.source_mapping_version_id THEN
        RAISE EXCEPTION 'source mapping must supersede latest row %',
            latest.source_mapping_version_id;
    END IF;
    IF NEW.effective_from <= latest.effective_from THEN
        RAISE EXCEPTION 'new source mapping effective_from must be later than prior version';
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER source_mapping_revision_chain
BEFORE INSERT ON catalog.source_mapping_version
FOR EACH ROW EXECUTE FUNCTION catalog.enforce_mapping_revision_chain();

CREATE TABLE catalog.source_mapping_candidate (
    source_mapping_version_id  BIGINT NOT NULL
        REFERENCES catalog.source_mapping_version(source_mapping_version_id),
    candidate_item_id          BIGINT NOT NULL REFERENCES control.item_identity(item_id),
    candidate_rank             INTEGER NOT NULL CHECK (candidate_rank > 0),
    evidence_ref               TEXT,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (source_mapping_version_id, candidate_item_id),
    UNIQUE (source_mapping_version_id, candidate_rank)
);

CREATE FUNCTION catalog.enforce_mapping_candidate_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, catalog, control
AS $function$
DECLARE
    status TEXT;
    expected_count INTEGER;
    current_count INTEGER;
BEGIN
    NEW.created_at := clock_timestamp();
    SELECT mapping_status, expected_candidate_count INTO status, expected_count
      FROM catalog.source_mapping_version
     WHERE source_mapping_version_id = NEW.source_mapping_version_id;
    IF status NOT IN ('AMBIGUOUS', 'CONFLICT') THEN
        RAISE EXCEPTION 'mapping candidates require AMBIGUOUS or CONFLICT status';
    END IF;
    SELECT count(*) INTO current_count
      FROM catalog.source_mapping_candidate
     WHERE source_mapping_version_id = NEW.source_mapping_version_id;
    IF current_count >= expected_count THEN
        RAISE EXCEPTION 'mapping candidate set is complete at % rows', expected_count;
    END IF;
    RETURN NEW;
END
$function$;

CREATE TRIGGER source_mapping_candidate_status
BEFORE INSERT ON catalog.source_mapping_candidate
FOR EACH ROW EXECUTE FUNCTION catalog.enforce_mapping_candidate_status();

CREATE FUNCTION catalog.enforce_mapping_candidate_cardinality()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, catalog, control
AS $function$
DECLARE
    candidate_count INTEGER;
BEGIN
    SELECT count(*) INTO candidate_count
      FROM catalog.source_mapping_candidate
     WHERE source_mapping_version_id = NEW.source_mapping_version_id;
    IF candidate_count <> NEW.expected_candidate_count THEN
        RAISE EXCEPTION '% mapping requires exactly % candidates, got %',
            NEW.mapping_status, NEW.expected_candidate_count, candidate_count;
    END IF;
    RETURN NULL;
END
$function$;

CREATE CONSTRAINT TRIGGER source_mapping_candidate_cardinality
AFTER INSERT ON catalog.source_mapping_version
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION catalog.enforce_mapping_candidate_cardinality();

CREATE VIEW catalog.item_variant_version_pit AS
SELECT item_variant_version_id,
       item_id,
       version_label,
       supersedes_variant_version_id,
       item_kind,
       canonical_market_hash_name,
       base_item_code,
       paint_index,
       wear_tier,
       edition_kind,
       phase_code,
       style_code,
       semantic_status,
       evidence_ref,
       evidence_hash,
       effective_from AS valid_from,
       lead(effective_from) OVER (
           PARTITION BY item_id
           ORDER BY effective_from, recorded_at, item_variant_version_id
       ) AS valid_to,
       recorded_at
  FROM catalog.item_variant_version;

CREATE VIEW catalog.source_mapping_version_pit AS
SELECT source_mapping_version_id,
       source_id,
       source_item_id,
       source_style_id,
       scope_kind,
       min_float,
       max_float,
       item_id,
       observed_market_hash_name,
       version_label,
       supersedes_mapping_version_id,
       mapping_status,
       expected_candidate_count,
       semantic_status,
       reason_code,
       evidence_ref,
       evidence_hash,
       effective_from AS valid_from,
       lead(effective_from) OVER (
           PARTITION BY source_id, source_item_id, source_style_id,
                        scope_kind, min_float, max_float
           ORDER BY effective_from, recorded_at, source_mapping_version_id
       ) AS valid_to,
       recorded_at
  FROM catalog.source_mapping_version;

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON catalog.item_variant_version
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON catalog.source_mapping_version
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

CREATE TRIGGER reject_update_delete
BEFORE UPDATE OR DELETE ON catalog.source_mapping_candidate
FOR EACH ROW EXECUTE FUNCTION control.reject_mutation();

INSERT INTO control.schema_release(release_name, status, notes)
VALUES (
    'v0.4b-catalog-contract',
    'CANDIDATE',
    'Versioned internal variants and cross-platform mapping states; synthetic/offline validation only.'
);

GRANT USAGE ON SCHEMA control, catalog TO cs2_catalog_writer;
GRANT SELECT ON control.schema_release, control.data_source, control.item_identity
    TO cs2_catalog_writer;
GRANT INSERT ON control.item_identity TO cs2_catalog_writer;
GRANT SELECT, INSERT ON catalog.item_variant_version,
    catalog.source_mapping_version, catalog.source_mapping_candidate
    TO cs2_catalog_writer;
GRANT SELECT ON catalog.item_variant_version_pit,
    catalog.source_mapping_version_pit TO cs2_catalog_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA control, catalog TO cs2_catalog_writer;

GRANT USAGE ON SCHEMA catalog TO cs2_normalizer_writer, cs2_research_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO cs2_normalizer_writer, cs2_research_reader;

REVOKE ALL ON ALL TABLES IN SCHEMA catalog FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA catalog FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA catalog FROM PUBLIC;

COMMIT;
