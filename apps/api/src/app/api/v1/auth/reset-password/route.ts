import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, mapAuthUser, users } from "@tablebook/db";
import { ResetPasswordSchema } from "@tablebook/shared";
import { jsonError } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const parsed = ResetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const now = new Date();
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, parsed.data.token))
      .limit(1);

    if (!row || !row.passwordResetExpires || row.passwordResetExpires <= now) {
      return Response.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const [updated] = await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      })
      .where(eq(users.id, row.id))
      .returning();

    return Response.json({ ok: true, user: mapAuthUser(updated) });
  } catch (error) {
    return jsonError(error);
  }
}
