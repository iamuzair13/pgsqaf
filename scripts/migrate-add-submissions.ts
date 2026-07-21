import { config } from "dotenv"
config({ path: ".env.local" })

import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 1,
})

async function run() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE submission_status AS ENUM ('DRAFT', 'SUBMITTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id BIGSERIAL PRIMARY KEY,
        erp_id VARCHAR(100) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        student_email VARCHAR(255) NOT NULL,
        registration_no VARCHAR(100) NOT NULL,
        faculty VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        program VARCHAR(255) NOT NULL,
        framework_id BIGINT NOT NULL REFERENCES frameworks(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        status submission_status NOT NULL DEFAULT 'DRAFT',
        progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        total_score DECIMAL(10, 3),
        submitted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS submission_answers (
        id BIGSERIAL PRIMARY KEY,
        submission_id BIGINT NOT NULL REFERENCES submissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
        indicator_id BIGINT NOT NULL REFERENCES indicators(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        rubric_id BIGINT REFERENCES rubrics(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        score INTEGER,
        response TEXT NOT NULL DEFAULT '',
        attachment_name VARCHAR(255),
        attachment_type VARCHAR(100),
        attachment_data TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_submission_indicator UNIQUE (submission_id, indicator_id)
      )
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TRIGGER trg_submissions_updated_at BEFORE UPDATE ON submissions
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TRIGGER trg_submission_answers_updated_at BEFORE UPDATE ON submission_answers
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `)
    await client.query("CREATE INDEX IF NOT EXISTS idx_submissions_erp_id ON submissions (erp_id)")
    await client.query("CREATE INDEX IF NOT EXISTS idx_submissions_framework ON submissions (framework_id)")
    await client.query("CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status)")
    await client.query("CREATE INDEX IF NOT EXISTS idx_answers_submission ON submission_answers (submission_id)")
    await client.query("COMMIT")
    console.log("Submission migration complete")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((error) => {
  console.error("Migration failed:", error)
  process.exit(1)
})
