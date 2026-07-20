-- =============================================================================
-- PGSQAF — Postgraduate Studies Quality Appraisal Framework
-- The University of Lahore
-- Database Schema  (PostgreSQL)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------
CREATE TYPE user_role        AS ENUM ('SUPER_ADMIN', 'ADMIN');
CREATE TYPE framework_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- -----------------------------------------------------------------------------
-- updated_at trigger function  (replaces MySQL ON UPDATE CURRENT_TIMESTAMP)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. USERS
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    role        user_role       NOT NULL DEFAULT 'ADMIN',
    status      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. FRAMEWORKS
-- -----------------------------------------------------------------------------
CREATE TABLE frameworks (
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
CREATE TRIGGER trg_frameworks_updated_at
    BEFORE UPDATE ON frameworks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. CRITERIA
-- total_weight is application-calculated (SUM of child indicator weights).
-- It is stored here for query performance but must never be set manually.
-- -----------------------------------------------------------------------------
CREATE TABLE criteria (
    id            BIGSERIAL       PRIMARY KEY,
    framework_id  BIGINT          NOT NULL,
    title         VARCHAR(255)    NOT NULL,
    domain        VARCHAR(255)    NOT NULL,   -- free-text, admin-defined
    measure       VARCHAR(255)    NOT NULL,   -- free-text, admin-defined
    total_weight  DECIMAL(5, 2)   NOT NULL DEFAULT 0.00,  -- auto-calculated by app
    display_order INT             NOT NULL DEFAULT 0,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_criteria_framework
        FOREIGN KEY (framework_id) REFERENCES frameworks (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE TRIGGER trg_criteria_updated_at
    BEFORE UPDATE ON criteria
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. INDICATORS
-- Each indicator belongs to a criterion. weight is a % value (e.g. 20.00).
-- The application must ensure SUM(weight) per criteria_id = criteria.total_weight.
-- -----------------------------------------------------------------------------
CREATE TABLE indicators (
    id                  BIGSERIAL       PRIMARY KEY,
    criteria_id         BIGINT          NOT NULL,
    question            TEXT            NOT NULL,
    weight              DECIMAL(5, 2)   NOT NULL,  -- percentage, e.g. 20.00
    require_attachment  BOOLEAN         NOT NULL DEFAULT FALSE,
    display_order       INT             NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_indicators_criteria
        FOREIGN KEY (criteria_id) REFERENCES criteria (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE TRIGGER trg_indicators_updated_at
    BEFORE UPDATE ON indicators
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. RUBRIC DESCRIPTORS  (master / lookup table)
-- Reusable across all criteria rubrics.
-- Examples: Outstanding, Excellent, Good, Average, Poor, Unsatisfactory
-- -----------------------------------------------------------------------------
CREATE TABLE rubric_descriptors (
    id         BIGSERIAL       PRIMARY KEY,
    name       VARCHAR(100)    NOT NULL UNIQUE,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default descriptors (can be edited/extended by administrator)
INSERT INTO rubric_descriptors (name) VALUES
    ('Outstanding'),
    ('Excellent'),
    ('Good'),
    ('Average'),
    ('Poor'),
    ('Unsatisfactory');

-- -----------------------------------------------------------------------------
-- 6. RUBRICS
-- Each criteria has its own independent set of rubric rows.
-- score       : numeric value assigned to this level (e.g. 5, 4, 3, 2, 1)
-- descriptor  : FK to rubric_descriptors
-- performance_standard : free-text description of the level
-- -----------------------------------------------------------------------------
CREATE TABLE rubrics (
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
CREATE TRIGGER trg_rubrics_updated_at
    BEFORE UPDATE ON rubrics
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. CRITERIA QUANTIFICATION
-- One record per criteria.
-- weighted_score = assigned_score × weight_factor  (calculated by application)
-- -----------------------------------------------------------------------------
CREATE TABLE criteria_quantification (
    id             BIGSERIAL       PRIMARY KEY,
    criteria_id    BIGINT          NOT NULL UNIQUE,  -- one-to-one with criteria
    assigned_score INTEGER         NOT NULL DEFAULT 0,
    weight_factor  DECIMAL(5, 3)   NOT NULL DEFAULT 0.000,
    weighted_score DECIMAL(10, 3)  NOT NULL DEFAULT 0.000,  -- app-calculated
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quantification_criteria
        FOREIGN KEY (criteria_id) REFERENCES criteria (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE TRIGGER trg_criteria_quantification_updated_at
    BEFORE UPDATE ON criteria_quantification
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. EVIDENCE  (future module — table created now for scalability)
-- -----------------------------------------------------------------------------
CREATE TABLE evidence (
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
CREATE TRIGGER trg_evidence_updated_at
    BEFORE UPDATE ON evidence
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- INDEXES
-- =============================================================================

-- frameworks
CREATE INDEX idx_frameworks_status     ON frameworks (status);
CREATE INDEX idx_frameworks_created_by ON frameworks (created_by);

-- criteria
CREATE INDEX idx_criteria_framework    ON criteria (framework_id);
CREATE INDEX idx_criteria_order        ON criteria (framework_id, display_order);

-- indicators
CREATE INDEX idx_indicators_criteria   ON indicators (criteria_id);
CREATE INDEX idx_indicators_order      ON indicators (criteria_id, display_order);

-- rubrics
CREATE INDEX idx_rubrics_criteria      ON rubrics (criteria_id);
CREATE INDEX idx_rubrics_descriptor    ON rubrics (descriptor_id);
CREATE INDEX idx_rubrics_order         ON rubrics (criteria_id, display_order);

-- evidence
CREATE INDEX idx_evidence_criteria     ON evidence (criteria_id);

-- =============================================================================
-- 9. ORGANIZATION: FACULTIES
-- =============================================================================
CREATE TABLE faculties (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    code        VARCHAR(20)     NOT NULL UNIQUE,
    dean        VARCHAR(255),
    description TEXT,
    status      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_faculties_updated_at
    BEFORE UPDATE ON faculties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 10. ORGANIZATION: DEPARTMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
    id          BIGSERIAL       PRIMARY KEY,
    faculty_id  BIGINT          NOT NULL,
    name        VARCHAR(255)    NOT NULL,
    code        VARCHAR(20)     NOT NULL UNIQUE,
    head        VARCHAR(255),
    description TEXT,
    status      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_departments_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 11. ORGANIZATION: PROGRAMS
-- -----------------------------------------------------------------------------
CREATE TABLE programs (
    id              BIGSERIAL       PRIMARY KEY,
    department_id   BIGINT          NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    code            VARCHAR(20)     NOT NULL UNIQUE,
    level           VARCHAR(50)     NOT NULL,  -- e.g. MPhil, PhD, MS
    duration_years  DECIMAL(3, 1)   NOT NULL DEFAULT 2.0,
    description     TEXT,
    status          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_programs_department
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE TRIGGER trg_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 12. FRAMEWORK ASSIGNMENTS
-- A framework can be assigned to the entire organization or to specific
-- faculties, departments, and programs.  When scope_type = 'ORGANIZATION'
-- the faculty_id / department_id / program_id columns are NULL.
-- When scope_type = 'FACULTY' only faculty_id is set, etc.
-- -----------------------------------------------------------------------------
CREATE TYPE assignment_scope AS ENUM ('ORGANIZATION', 'FACULTY', 'DEPARTMENT', 'PROGRAM');

CREATE TABLE framework_assignments (
    id            BIGSERIAL          PRIMARY KEY,
    framework_id  BIGINT             NOT NULL,
    scope_type    assignment_scope   NOT NULL,
    faculty_id    BIGINT,
    department_id BIGINT,
    program_id    BIGINT,
    created_at    TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_framework
        FOREIGN KEY (framework_id) REFERENCES frameworks (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_department
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_program
        FOREIGN KEY (program_id) REFERENCES programs (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =============================================================================
-- ORGANIZATION INDEXES
-- =============================================================================
CREATE INDEX idx_departments_faculty   ON departments (faculty_id);
CREATE INDEX idx_programs_department   ON programs (department_id);
CREATE INDEX idx_faculties_status      ON faculties (status);
CREATE INDEX idx_departments_status    ON departments (status);
CREATE INDEX idx_programs_status       ON programs (status);

-- framework assignments
CREATE INDEX idx_assignment_framework  ON framework_assignments (framework_id);
CREATE INDEX idx_assignment_scope      ON framework_assignments (scope_type);
