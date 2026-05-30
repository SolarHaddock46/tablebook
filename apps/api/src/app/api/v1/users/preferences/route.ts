import { eq } from "drizzle-orm";
import { getDb, mapAuthUser, users } from "@tablebook/db";
import { UserPreferencesSchema } from "@tablebook/shared";
import { jsonError, requireAuth } from "@/lib/auth-helpers";

export async function PATCH(request: Request) {
  try {
    const authUser = await requireAuth(request);
    const parsed = UserPreferencesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const updates: Partial<{
      preferredCuisines: string[] | null;
      preferredDistricts: string[] | null;
      preferredPriceLevel: number | null;
    }> = {};
    if (parsed.data.preferred_cuisines !== undefined) {
      updates.preferredCuisines = parsed.data.preferred_cuisines;
    }
    if (parsed.data.preferred_districts !== undefined) {
      updates.preferredDistricts = parsed.data.preferred_districts;
    }
    if (parsed.data.preferred_price_level !== undefined) {
      updates.preferredPriceLevel = parsed.data.preferred_price_level;
    }

    const [row] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, authUser.id))
      .returning();

    return Response.json(mapAuthUser(row));
  } catch (error) {
    return jsonError(error);
  }
}
