import { eq } from "drizzle-orm";
import { getDb, mapRestaurant, restaurants } from "@tablebook/db";
import { UpdateRestaurantSchema } from "@tablebook/shared";
import { getAuthUser, jsonError, requireOwner } from "@/lib/auth-helpers";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const db = getDb();
  const [row] = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (row.status !== "active") {
    const user = await getAuthUser(request);
    if (!user || row.ownerId !== user.id) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
  }

  return Response.json(mapRestaurant(row));
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    await requireOwner(request, id);
    const parsed = UpdateRestaurantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name_en !== undefined) updates.nameEn = parsed.data.name_en;
    if (parsed.data.name_ru !== undefined) updates.nameRu = parsed.data.name_ru;
    if (parsed.data.cuisine_en !== undefined) updates.cuisineEn = parsed.data.cuisine_en;
    if (parsed.data.cuisine_ru !== undefined) updates.cuisineRu = parsed.data.cuisine_ru;
    if (parsed.data.district_en !== undefined) updates.districtEn = parsed.data.district_en;
    if (parsed.data.district_ru !== undefined) updates.districtRu = parsed.data.district_ru;
    if (parsed.data.price_level !== undefined) updates.priceLevel = parsed.data.price_level;
    if (parsed.data.lat !== undefined) updates.lat = String(parsed.data.lat);
    if (parsed.data.lng !== undefined) updates.lng = String(parsed.data.lng);
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.has_availability !== undefined) updates.hasAvailability = parsed.data.has_availability;

    const db = getDb();
    const [row] = await db.update(restaurants).set(updates).where(eq(restaurants.id, id)).returning();

    return Response.json(mapRestaurant(row));
  } catch (error) {
    return jsonError(error);
  }
}
