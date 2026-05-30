import { eq } from "drizzle-orm";
import { getDb, mapRestaurant, restaurants } from "@tablebook/db";
import { OnboardRestaurantSchema } from "@tablebook/shared";
import { jsonError, requireRole } from "@/lib/auth-helpers";
import { createTrialSubscription } from "@/lib/subscription-service";

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, "restaurant_owner");
    const parsed = OnboardRestaurantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .insert(restaurants)
      .values({
        nameEn: parsed.data.name_en,
        nameRu: parsed.data.name_ru,
        cuisineEn: parsed.data.cuisine_en,
        cuisineRu: parsed.data.cuisine_ru,
        districtEn: parsed.data.district_en,
        districtRu: parsed.data.district_ru,
        priceLevel: parsed.data.price_level,
        distanceKm: "1.0",
        lat: String(parsed.data.lat),
        lng: String(parsed.data.lng),
        ownerId: user.id,
        status: "draft",
        hasAvailability: false,
        tables: []
      })
      .returning();

    await createTrialSubscription(row.id);

    return Response.json(mapRestaurant(row), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
