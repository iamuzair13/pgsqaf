-- 0003_submissions.sql — student submissions + answers

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('DRAFT', 'SUBMITTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS submissions (
    id                  BIGSERIAL          PRIMARY KEY,
    erp_id              VARCHAR(100)       NOT NULL,
    student_name        VARCHAR(255)       NOT NULL,
    student_email       VARCHAR(255)       NOT NULL,
    registration_no     VARCHAR(100)       NOT NULL,
    faculty             VARCHAR(255)       NOT NULL,
    department          VARCHAR(255)       NOT NULL,
    program             VARCHAR(255)       NOT NULL,
    framework_id        BIGINT             NOT NULL,
    status              submission_status  NOT NULL DEFAULT 'DRAFT',
    progress            INTEGER            NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    total_score         DECIMAL(10, 3),
    submitted_at        TIMESTAMP,
    created_at          TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_submissions_framework
        FOREIGN KEY (framework_id) REFERENCES frameworks (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
DROP TRIGGER IF EXISTS trg_submissions_updated_at ON submissions;
CREATE TRIGGER trg_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS submission_answers (
    id                  BIGSERIAL       PRIMARY KEY,
    submission_id       BIGINT          NOT NULL,
    indicator_id        BIGINT          NOT NULL,
    rubric_id           BIGINT,
    score               INTEGER,
    response            TEXT            NOT NULL DEFAULT '',
    attachment_name     VARCHAR(255),
    attachment_type     VARCHAR(100),
    attachment_data     TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_submission_indicator UNIQUE (submission_id, indicator_id),
    CONSTRAINT fk_answers_submission
        FOREIGN KEY (submission_id) REFERENCES submissions (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_answers_indicator
        FOREIGN KEY (indicator_id) REFERENCES indicators (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_answers_rubric
        FOREIGN KEY (rubric_id) REFERENCES rubrics (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
DROP TRIGGER IF EXISTS trg_submission_answers_updated_at ON submission_answers;
CREATE TRIGGER trg_submission_answers_updated_at
    BEFORE UPDATE ON submission_answers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_submissions_erp_id    ON submissions (erp_id);
CREATE INDEX IF NOT EXISTS idx_submissions_framework ON submissions (framework_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status    ON submissions (status);
CREATE INDEX IF NOT EXISTS idx_answers_submission    ON submission_answers (submission_id);
