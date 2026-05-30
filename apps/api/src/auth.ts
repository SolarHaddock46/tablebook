import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb, mapAuthUser, users } from "@tablebook/db";
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

        const user = mapAuthUser(row);
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.display_name,
          locale: user.locale,
          display_name: user.display_name,
          full_name: user.full_name,
          phone: user.phone,
          email_verified: user.email_verified
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser & { id: string };
        token.role = authUser.role;
        token.locale = authUser.locale;
        token.display_name = authUser.display_name;
        token.full_name = authUser.full_name;
        token.phone = authUser.phone;
        token.email_verified = authUser.email_verified;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const authUser = session.user as unknown as AuthUser & { id: string };
        authUser.id = token.sub ?? "";
        authUser.role = token.role as AuthUser["role"];
        authUser.display_name = (token.display_name as string | null | undefined) ?? null;
        authUser.full_name = (token.full_name as string | null | undefined) ?? null;
        authUser.phone = (token.phone as string | null | undefined) ?? null;
        authUser.email_verified = Boolean(token.email_verified);
        authUser.locale = (token.locale as AuthUser["locale"] | undefined) ?? "ru";
      }
      return session;
    }
  },
  pages: {
    signIn: "/"
  },
  trustHost: true
});
