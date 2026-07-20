/**
 * Usage:
 *   npx tsx scripts/seed-super-admin.ts
 *
 * Requires DATABASE_URL in .env.local
 */

import { config } from "dotenv"
import { resolve } from "path"
config({ path: resolve(process.cwd(), ".env.local") })

import { Pool } from "pg"
import bcrypt from "bcryptjs"

const SUPER_ADMIN = {
  name:     "Super Admin",
  email:    "admin@pgsqaf.edu",
  password: "Admin@1234",
  role:     "SUPER_ADMIN",
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    console.log("🔌 Connecting to database…")
    await pool.query("SELECT 1")
    console.log("✅ Connected\n")

    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [SUPER_ADMIN.email]
    )

    if (rows.length > 0) {
      console.log(`ℹ️  Super admin already exists (id=${rows[0].id}). Skipping.`)
      return
    }

    const hash = await bcrypt.hash(SUPER_ADMIN.password, 12)

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, name, email, role`,
      [SUPER_ADMIN.name, SUPER_ADMIN.email, hash, SUPER_ADMIN.role]
    )

    const created = result.rows[0]
    console.log("✅ Super admin created:")
    console.log(`   ID    : ${created.id}`)
    console.log(`   Name  : ${created.name}`)
    console.log(`   Email : ${created.email}`)
    console.log(`   Role  : ${created.role}`)
    console.log(`\n🔑 Default password: ${SUPER_ADMIN.password}`)
    console.log("   (Change this immediately after first login)\n")
  } catch (err) {
    console.error("❌ Error:", err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
