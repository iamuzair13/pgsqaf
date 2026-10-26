import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { fetchSapEmployee } from "@/lib/sap";
import type { UserRole } from "@/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const rows = await query<{
          id: number;
          name: string;
          email: string;
          password: string;
          role: UserRole;
          status: boolean;
        }>(
          "SELECT id, name, email, password, role, status FROM users WHERE email = $1 LIMIT 1",
          [email.toLowerCase().trim()]
        );

        const user = rows[0];
        if (!user || !user.status) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),

    Credentials({
      id: "faculty-test",
      name: "faculty-test",
      credentials: {
        email: { label: "Faculty email", type: "email" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        if (!email || !email.includes("@")) return null;

        const employee = await fetchSapEmployee(email);
        if (!employee) return null;

        return {
          id: employee.empId ?? email,
          name: employee.name,
          email,
          role: "FACULTY" as UserRole,
        };
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        // The Google identity alone isn't enough — the email must exist in
        // SAP empinfoSet (case-insensitive retries handled inside).
        const employee = await fetchSapEmployee(email);
        if (!employee) return false;

        user.name = employee.name;
        // Normalize to lowercase so submissions key on a canonical erp_id
        // regardless of Google account display casing.
        user.email = email.toLowerCase();
        (user as { role?: string }).role = "FACULTY";

        return true;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = (user as { role?: string }).role ?? "";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        } as typeof session.user;
      }
      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
  },

  session: { strategy: "jwt" },

  secret: process.env.NEXTAUTH_SECRET,
});
