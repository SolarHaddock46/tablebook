import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, users } from "@tablebook/db";
import { ForgotPasswordSchema } from "@tablebook/shared";
import { jsonError } from "@/lib/auth-helpers";
import { generateAuthToken, passwordResetExpiry } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const parsed = ForgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const email = parsed.data.email.toLowerCase();
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (row) {
      const token = generateAuthToken();
      const expires = passwordResetExpiry();
      await db
        .update(users)
        .set({
          passwordResetToken: token,
          passwordResetExpires: expires
        })
        .where(eq(users.id, row.id));

      await sendPasswordResetEmail({
        email: row.email,
        token,
        locale: row.locale as "ru" | "en"
      });
    }

    return Response.json({
      ok: true,
      message: "If an account exists for this email, a reset link has been sent"
    });
  } catch (error) {
    return jsonError(error);
  }
}
