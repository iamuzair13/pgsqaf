-- 0001_init.sql — core users + framework schema
-- Idempotent: safe to run on databases that already applied schema.sql.

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE framework_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    role        user_role       NOT NULL DEFAULT 'ADMIN',
    status      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS frameworks (
    id          BIGSERIAL       PRIMARY KEY,
    title       VARCHAR(255)    NOT NULL,
    description TEXT,
    status      framework_status NOT NULL DEFAULT 'DRAFT',
    version     VARCHAR(50)     NOT NULL,
    created_by  BIGINT          NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_frameworks_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
DROP TRIGGER IF EXISTS trg_frameworks_updated_at ON frameworks;
CREATE TRIGGER trg_frameworks_updated_at
    BEFORE UPDATE ON frameworks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- total_weight is application-calculated (SUM of child indicator weights).
CREATE TABLE IF NOT EXISTS criteria (
    id            BIGSERIAL       PRIMARY KEY,
    framework_id  BIGINT          NOT NULL,
    title         VARCHAR(255)    NOT NULL,
    domain        VARCHAR(255)    NOT NULL,
    measure       VARCHAR(255)    NOT NULL,
    total_weight  DECIMAL(5, 2)   NOT NULL DEFAULT 0.00,
    display_order INT             NOT NULL DEFAULT 0,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_criteria_framework
        FOREIGN KEY (framework_id) REFERENCES frameworks (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
DROP TRIGGER IF EXISTS trg_criteria_updated_at ON criteria;
CREATE TRIGGER trg_criteria_updated_at
    BEFORE UPDATE ON criteria
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS indicators (
    id                  BIGSERIAL       PRIMARY KEY,
    criteria_id         BIGINT          NOT NULL,
    question            TEXT            NOT NULL,
    weight              DECIMAL(5, 2)   NOT NULL,
    require_attachment  BOOLEAN         NOT NULL DEFAULT FALSE,
    display_order       INT             NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_indicators_criteria
        FOREIGN KEY (criteria_id) REFERENCES criteria (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
DROP TRIGGER IF EXISTS trg_indicators_updated_at ON indicators;
CREATE TRIGGER trg_indicators_updated_at
    BEFORE UPDATE ON indicators
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS rubric_descriptors (
    id         BIGSERIAL       PRIMARY KEY,
    name       VARCHAR(100)    NOT NULL UNIQUE,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO rubric_descriptors (name) VALUES
    ('Outstanding'), ('Excellent'), ('Good'), ('Average'), ('Poor'), ('Unsatisfactory')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS rubrics (
    id                   BIGSERIAL       PRIMARY KEY,
    criteria_id          BIGINT          NOT NULL,
    score                INTEGER         NOT NULL,
    descriptor_id        BIGINT          NOT NULL,
    performance_standard TEXT            NOT NULL,
    display_order        INT             NOT NULL DEFAULT 0,
    created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rubrics_criteria
        FOREIGN KEY (criteria_id) REFERENCES criteria (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_rubrics_descriptor
        FOREIGN KEY (descriptor_id) REFERENCES rubric_descriptors (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
DROP TRIGGER IF EXISTS trg_rubrics_updated_at ON rubrics;
CREATE TRIGGER trg_rubrics_updated_at
    BEFORE UPDATE ON rubrics
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS criteria_quantification (
    id             BIGSERIAL       PRIMARY KEY,
    criteria_id    BIGINT          NOT NULL UNIQUE,
    assigned_score INTEGER         NOT NULL DEFAULT 0,
    weight_factor  DECIMAL(5, 3)   NOT NULL DEFAULT 0.000,
    weighted_score DECIMAL(10, 3)  NOT NULL DEFAULT 0.000,
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quantification_criteria
        FOREIGN KEY (criteria_id) REFERENCES criteria (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
DROP TRIGGER IF EXISTS trg_criteria_quantification_updated_at ON criteria_quantification;
CREATE TRIGGER trg_criteria_quantification_updated_at
    BEFORE UPDATE ON criteria_quantification
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS evidence (
    id                  BIGSERIAL       PRIMARY KEY,
    criteria_id         BIGINT          NOT NULL,
    title               VARCHAR(255)    NOT NULL,
    description         TEXT,
    require_attachment  BOOLEAN         NOT NULL DEFAULT FALSE,
    file_path           VARCHAR(500),
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_evidence_criteria
        FOREIGN KEY (criteria_id) REFERENCES criteria (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
DROP TRIGGER IF EXISTS trg_evidence_updated_at ON evidence;
CREATE TRIGGER trg_evidence_updated_at
    BEFORE UPDATE ON evidence
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_frameworks_status     ON frameworks (status);
CREATE INDEX IF NOT EXISTS idx_frameworks_created_by ON frameworks (created_by);
CREATE INDEX IF NOT EXISTS idx_criteria_framework    ON criteria (framework_id);
CREATE INDEX IF NOT EXISTS idx_criteria_order        ON criteria (framework_id, display_order);
CREATE INDEX IF NOT EXISTS idx_indicators_criteria   ON indicators (criteria_id);
CREATE INDEX IF NOT EXISTS idx_indicators_order      ON indicators (criteria_id, display_order);
CREATE INDEX IF NOT EXISTS idx_rubrics_criteria      ON rubrics (criteria_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_descriptor    ON rubrics (descriptor_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_order         ON rubrics (criteria_id, display_order);
CREATE INDEX IF NOT EXISTS idx_evidence_criteria     ON evidence (criteria_id);
