/**
 * Migration runner — applies db/migrations/*.sql in order, once each.
 *
 * Usage:
 *   npm run migrate
 *
 * Requires DATABASE_URL in .env.local. Each file runs inside a transaction
 * and is recorded in the schema_migrations table, so re-runs are safe.
 */
import { config } from "dotenv"
import { resolve } from "path"
import { readdir, readFile } from "fs/promises"

config({ path: resolve(process.cwd(), ".env.local") })

import { Pool } from "pg"

const MIGRATIONS_DIR = resolve(process.cwd(), "db", "migrations")

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const { rows: applied } = await pool.query<{ name: string }>(
      "SELECT name FROM schema_migrations"
    )
    const appliedSet = new Set(applied.map((r) => r.name))

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort()

    if (!files.length) {
      console.log("No migration files found in db/migrations/")
      return
    }

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`= ${file} (already applied)`)
        continue
      }

      const sql = await readFile(resolve(MIGRATIONS_DIR, file), "utf8")
      const client = await pool.connect()
      try {
        await client.query("BEGIN")
        await client.query(sql)
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file])
        await client.query("COMMIT")
        console.log(`✓ ${file}`)
      } catch (err) {
        await client.query("ROLLBACK")
        console.error(`✗ ${file} failed:`)
        throw err
      } finally {
        client.release()
      }
    }

    console.log("\nDone.")
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
