/**
 * Reset a user's password.
 *
 * Usage:
 *   npx tsx scripts/reset-password.ts <email> <new-password>
 *
 * Requires DATABASE_URL in .env.local
 */
import { config } from "dotenv"
import { resolve } from "path"
config({ path: resolve(process.cwd(), ".env.local") })

import { Pool } from "pg"
import bcrypt from "bcryptjs"

const [email, newPassword] = process.argv.slice(2)

if (!email || !newPassword) {
  console.error("Usage: npx tsx scripts/reset-password.ts <email> <new-password>")
  process.exit(1)
}
if (newPassword.length < 6) {
  console.error("Password must be at least 6 characters")
  process.exit(1)
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const hash = await bcrypt.hash(newPassword, 10)
    const { rows } = await pool.query(
      `UPDATE users SET password = $1
       WHERE email = $2
       RETURNING id, name, email, role`,
      [hash, email.toLowerCase().trim()]
    )
    if (!rows.length) {
      console.error(`No user found with email ${email}`)
      process.exit(1)
    }
    console.log("Password reset for:", rows[0])
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
