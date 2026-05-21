import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb, mapUser, users } from "@tablebook/db";
import type { AuthUser } from "@tablebook/shared";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) {
          return null;
        }

        const db = getDb();
        const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!row) {
          return null;
        }

        const valid = await bcrypt.compare(password, row.passwordHash);
        if (!valid) {
          return null;
        }

        const user = mapUser(row);
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.display_name,
          locale: user.locale
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.locale = user.locale;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        (session.user as AuthUser & { id: string }).role = token.role as AuthUser["role"];
      }
      return session;
    }
  },
  pages: {
    signIn: "/"
  },
  trustHost: true
});
