import { eq } from "drizzle-orm";
import { getDb, mapAuthUser, users } from "@tablebook/db";
import type { UserRow } from "@tablebook/db";
import { sendVerificationEmail } from "@/lib/email";
import { emailVerificationExpiry, generateAuthToken } from "@/lib/auth-tokens";

export async function issueEmailVerification(row: UserRow) {
  const token = generateAuthToken();
  const expires = emailVerificationExpiry();
  const db = getDb();

  const [updated] = await db
    .update(users)
    .set({
      emailVerificationToken: token,
      emailVerificationExpires: expires
    })
    .where(eq(users.id, row.id))
    .returning();

  await sendVerificationEmail({
    email: updated.email,
    token,
    locale: updated.locale as "ru" | "en"
  });

  return updated;
}

export async function verifyEmailToken(token: string) {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.emailVerificationToken, token))
    .limit(1);

  if (!row || !row.emailVerificationExpires || row.emailVerificationExpires <= now) {
    return null;
  }

  const [updated] = await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    })
    .where(eq(users.id, row.id))
    .returning();

  return mapAuthUser(updated);
}
