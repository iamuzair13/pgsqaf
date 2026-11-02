-- 0002_org.sql — organization hierarchy + framework assignments

CREATE TABLE IF NOT EXISTS faculties (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    code        VARCHAR(20)     NOT NULL UNIQUE,
    dean        VARCHAR(255),
    description TEXT,
    status      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS trg_faculties_updated_at ON faculties;
CREATE TRIGGER trg_faculties_updated_at
    BEFORE UPDATE ON faculties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS departments (
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
DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;
CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS programs (
    id              BIGSERIAL       PRIMARY KEY,
    department_id   BIGINT          NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    code            VARCHAR(20)     NOT NULL UNIQUE,
    level           VARCHAR(50)     NOT NULL,
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
DROP TRIGGER IF EXISTS trg_programs_updated_at ON programs;
CREATE TRIGGER trg_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $$ BEGIN
    CREATE TYPE assignment_scope AS ENUM ('ORGANIZATION', 'FACULTY', 'DEPARTMENT', 'PROGRAM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- scope_type = 'ORGANIZATION' leaves the faculty/department/program FKs NULL.
CREATE TABLE IF NOT EXISTS framework_assignments (
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

CREATE INDEX IF NOT EXISTS idx_departments_faculty   ON departments (faculty_id);
CREATE INDEX IF NOT EXISTS idx_programs_department   ON programs (department_id);
CREATE INDEX IF NOT EXISTS idx_faculties_status      ON faculties (status);
CREATE INDEX IF NOT EXISTS idx_departments_status    ON departments (status);
CREATE INDEX IF NOT EXISTS idx_programs_status       ON programs (status);
CREATE INDEX IF NOT EXISTS idx_assignment_framework  ON framework_assignments (framework_id);
CREATE INDEX IF NOT EXISTS idx_assignment_scope      ON framework_assignments (scope_type);
