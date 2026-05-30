import { eq } from "drizzle-orm";
import { getDb, users } from "@tablebook/db";
import { jsonError, requireAuth } from "@/lib/auth-helpers";
import { issueEmailVerification } from "@/lib/email-verification";

export async function POST(request: Request) {
  try {
    const authUser = await requireAuth(request);
    const db = getDb();
    const [row] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!row) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (row.emailVerified) {
      return Response.json({ ok: true, message: "Email already verified" });
    }

    await issueEmailVerification(row);
    return Response.json({ ok: true, message: "Verification email sent" });
  } catch (error) {
    return jsonError(error);
  }
}
