import { eq, sql } from "drizzle-orm";
import { getDb } from "./client";
import { restaurants, reviews } from "./schema/index";

export async function recalculateRestaurantRating(restaurantId: string) {
  const db = getDb();
  const [stats] = await db
    .select({
      avgRating: sql<string>`coalesce(avg(${reviews.rating})::numeric(2,1), 4.0)`,
      count: sql<number>`count(*)::int`
    })
    .from(reviews)
    .where(eq(reviews.restaurantId, restaurantId));

  await db
    .update(restaurants)
    .set({
      rating: stats?.avgRating ?? "4.0",
      reviewCount: stats?.count ?? 0
    })
    .where(eq(restaurants.id, restaurantId));
}
