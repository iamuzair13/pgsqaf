import { config } from "dotenv"
config({ path: ".env.local" })

import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 1,
})

async function run() {
  const c = await pool.connect()
  try {
    await c.query("ALTER TABLE indicators ADD COLUMN IF NOT EXISTS require_attachment BOOLEAN NOT NULL DEFAULT FALSE")
    console.log("indicators.require_attachment: OK")

    await c.query("ALTER TABLE evidence ADD COLUMN IF NOT EXISTS require_attachment BOOLEAN NOT NULL DEFAULT FALSE")
    console.log("evidence.require_attachment: OK")

    await c.query(`
      DO $$ BEGIN
        CREATE TYPE assignment_scope AS ENUM ('ORGANIZATION','FACULTY','DEPARTMENT','PROGRAM');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `)
    console.log("assignment_scope enum: OK")

    await c.query(`
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
          ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_assignment_faculty
          FOREIGN KEY (faculty_id) REFERENCES faculties (id)
          ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_assignment_department
          FOREIGN KEY (department_id) REFERENCES departments (id)
          ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_assignment_program
          FOREIGN KEY (program_id) REFERENCES programs (id)
          ON UPDATE CASCADE ON DELETE CASCADE
      )
    `)
    console.log("framework_assignments table: OK")

    await c.query("CREATE INDEX IF NOT EXISTS idx_assignment_framework ON framework_assignments (framework_id)")
    await c.query("CREATE INDEX IF NOT EXISTS idx_assignment_scope ON framework_assignments (scope_type)")
    console.log("indexes: OK")

    console.log("\nMigration complete!")
  } finally {
    c.release()
  }
  process.exit(0)
}

run().catch((e) => {
  console.error("Migration failed:", e)
  process.exit(1)
})
