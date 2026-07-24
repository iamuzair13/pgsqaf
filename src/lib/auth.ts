import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { fetchSapStudent, extractSapIdFromEmail } from "@/lib/sap";
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
      id: "student-test",
      name: "student-test",
      credentials: {
        sapId: { label: "Student ID", type: "text" },
      },
      async authorize(credentials) {
        const sapId = String(credentials?.sapId ?? "").trim();
        if (!sapId) return null;

        const student = await fetchSapStudent(sapId);
        if (!student) return null;

        return {
          id: student.sapId,
          name: student.name,
          email: student.email ?? `${student.sapId}@student.uol.edu.pk`,
          role: "STUDENT" as UserRole,
          sapId: student.sapId,
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

        const sapId = extractSapIdFromEmail(email);
        if (!sapId) return false;

        const student = await fetchSapStudent(sapId);
        if (!student) return false;

        (user as { sapId?: string }).sapId = student.sapId;
        (user as { role?: string }).role = "STUDENT";
        user.name = student.name;

        return true;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = (user as { role?: string }).role ?? "";

        if (account?.provider === "google" || account?.provider === "student-test") {
          token.sapId = (user as { sapId?: string }).sapId;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          sapId: token.sapId as string | undefined,
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
