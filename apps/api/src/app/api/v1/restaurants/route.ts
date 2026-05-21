import { and, eq, ilike, or } from "drizzle-orm";
import { getDb, mapRestaurant, restaurants } from "@tablebook/db";
import {
  computeSearchFallback,
  Constants,
  t,
  type Locale,
  type RestaurantSearchHit,
  type RestaurantSearchResponse
} from "@tablebook/shared";
import { computeHasAvailability } from "@/lib/restaurants-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale: Locale = searchParams.get("locale") === "en" ? "en" : "ru";
  const cuisine = searchParams.get("cuisine")?.trim();
  const district = searchParams.get("district")?.trim();
  const priceLevel = Number(searchParams.get("price_level") ?? "0");
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const time = searchParams.get("time") ?? "19:00";
  const guests = Number(searchParams.get("guests") ?? "2");
  const limit = Math.min(Number(searchParams.get("limit") ?? Constants.DefaultLimit), Constants.MaxLimit);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const dict = t(locale);

  const db = getDb();
  const filters = [eq(restaurants.status, "active")];

  if (cuisine) {
    filters.push(or(ilike(restaurants.cuisineEn, `%${cuisine}%`), ilike(restaurants.cuisineRu, `%${cuisine}%`))!);
  }
  if (district) {
    filters.push(or(ilike(restaurants.districtEn, `%${district}%`), ilike(restaurants.districtRu, `%${district}%`))!);
  }
  if (priceLevel >= 1 && priceLevel <= 4) {
    filters.push(eq(restaurants.priceLevel, priceLevel));
  }

  const rows = await db
    .select()
    .from(restaurants)
    .where(and(...filters))
    .limit(limit)
    .offset(offset);

  const strictResults = await enrichRestaurants(rows, date, time, guests);

  if (strictResults.length > 0) {
    const response: RestaurantSearchResponse = {
      results: strictResults,
      is_fallback: false
    };
    return Response.json(response);
  }

  const allRows = await db.select().from(restaurants).where(eq(restaurants.status, "active")).limit(Constants.MaxLimit);
  const allEnriched = await enrichRestaurants(allRows, date, time, guests);
  const fallbackResults = computeSearchFallback(
    {
      cuisine: cuisine || undefined,
      district: district || undefined,
      price_level: priceLevel >= 1 && priceLevel <= 4 ? priceLevel : undefined
    },
    allEnriched,
    {
      sameCuisine: dict.sameCuisine,
      similarPrice: dict.similarPrice,
      samePrice: dict.samePrice,
      otherDistrict: dict.otherDistrict,
      availableSlot: dict.availableSlot,
      nearby: dict.nearby,
      highRating: dict.highRating
    },
    limit
  );

  const response: RestaurantSearchResponse = {
    results: fallbackResults,
    is_fallback: true
  };
  return Response.json(response);
}

async function enrichRestaurants(
  rows: Array<(typeof restaurants.$inferSelect)>,
  date: string,
  time: string,
  guests: number
): Promise<RestaurantSearchHit[]> {
  return Promise.all(
    rows.map(async (row) => {
      const restaurant = mapRestaurant(row);
      const hasAvailability = await computeHasAvailability(restaurant, date, time, guests);
      return { ...restaurant, has_availability: hasAvailability };
    })
  );
}
