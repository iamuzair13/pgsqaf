import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"
import type { UserRole } from "@/types"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const rows = await query<{
          id: number
          name: string
          email: string
          password: string
          role: UserRole
          status: boolean
        }>(
          "SELECT id, name, email, password, role, status FROM users WHERE email = $1 LIMIT 1",
          [email.toLowerCase().trim()]
        )

        const user = rows[0]
        if (!user || !user.status) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return {
          id:    String(user.id),
          name:  user.name,
          email: user.email,
          role:  user.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },

  pages: {
    signIn: "/sign-in",
  },

  session: { strategy: "jwt" },

  secret: process.env.NEXTAUTH_SECRET,
})
