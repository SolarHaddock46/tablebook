import { eq } from "drizzle-orm";
import { getDb, mapUser, users } from "@tablebook/db";
import { UpdateMeSchema } from "@tablebook/shared";
import { jsonError, requireAuth } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth(request);
    const db = getDb();
    const [row] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!row) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json(mapUser(row));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await requireAuth(request);
    const parsed = UpdateMeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const updates: Partial<{ displayName: string; locale: string }> = {};
    if (parsed.data.display_name !== undefined) {
      updates.displayName = parsed.data.display_name;
    }
    if (parsed.data.locale !== undefined) {
      updates.locale = parsed.data.locale;
    }

    const [row] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, authUser.id))
      .returning();

    return Response.json(mapUser(row));
  } catch (error) {
    return jsonError(error);
  }
}
