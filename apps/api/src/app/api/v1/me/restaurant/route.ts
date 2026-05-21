import { eq } from "drizzle-orm";
import { getDb, mapRestaurant, restaurants } from "@tablebook/db";
import { jsonError, requireRole } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, "restaurant_owner");
    const db = getDb();
    const [row] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, user.id))
      .limit(1);

    if (!row) {
      return Response.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return Response.json(mapRestaurant(row));
  } catch (error) {
    return jsonError(error);
  }
}
