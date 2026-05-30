import { eq } from "drizzle-orm";
import { getDb, mapAuthUser, users } from "@tablebook/db";
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
    return Response.json(mapAuthUser(row));
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
    const updates: Partial<{
      displayName: string | null;
      fullName: string | null;
      phone: string | null;
      locale: string;
      preferredCuisines: string[] | null;
      preferredDistricts: string[] | null;
      preferredPriceLevel: number | null;
    }> = {};
    if (parsed.data.display_name !== undefined) {
      updates.displayName = parsed.data.display_name;
    }
    if (parsed.data.full_name !== undefined) {
      updates.fullName = parsed.data.full_name;
    }
    if (parsed.data.phone !== undefined) {
      updates.phone = parsed.data.phone;
    }
    if (parsed.data.locale !== undefined) {
      updates.locale = parsed.data.locale;
    }
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
