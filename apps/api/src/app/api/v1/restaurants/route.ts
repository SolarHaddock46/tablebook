import { and, eq, ilike, or } from "drizzle-orm";
import { getDb, mapRestaurant, restaurants, users } from "@tablebook/db";
import {
  computeSearchFallback,
  Constants,
  t,
  type Locale,
  type RestaurantSearchHit,
  type RestaurantSearchResponse
} from "@tablebook/shared";
import { getAuthUser } from "@/lib/auth-helpers";
import { computeHasAvailability } from "@/lib/restaurants-service";
import { loadAvatarUrls } from "@/lib/restaurant-photos-service";
import { loadPremiumRestaurantIds } from "@/lib/subscription-service";

type ResolvedSearchFilters = {
  cuisines: string[];
  districts: string[];
  priceLevel: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale: Locale = searchParams.get("locale") === "en" ? "en" : "ru";
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const time = searchParams.get("time") ?? "19:00";
  const guests = Number(searchParams.get("guests") ?? "2");
  const limit = Math.min(Number(searchParams.get("limit") ?? Constants.DefaultLimit), Constants.MaxLimit);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const dict = t(locale);
  const filters = await resolveSearchFilters(searchParams, request);

  const db = getDb();
  const queryFilters = [eq(restaurants.status, "active")];
  const cuisineFilter = buildTextOrFilter(filters.cuisines, restaurants.cuisineEn, restaurants.cuisineRu);
  if (cuisineFilter) {
    queryFilters.push(cuisineFilter);
  }
  const districtFilter = buildTextOrFilter(filters.districts, restaurants.districtEn, restaurants.districtRu);
  if (districtFilter) {
    queryFilters.push(districtFilter);
  }
  if (filters.priceLevel >= 1 && filters.priceLevel <= 4) {
    queryFilters.push(eq(restaurants.priceLevel, filters.priceLevel));
  }

  const rows = await db
    .select()
    .from(restaurants)
    .where(and(...queryFilters))
    .limit(limit)
    .offset(offset);

  const premiumIds = await loadPremiumRestaurantIds();
  const strictResults = await enrichRestaurants(rows, date, time, guests, premiumIds);

  if (strictResults.length > 0) {
    const sorted = sortByPremium(strictResults);
    const response: RestaurantSearchResponse = {
      results: sorted,
      is_fallback: false
    };
    return Response.json(response);
  }

  const allRows = await db.select().from(restaurants).where(eq(restaurants.status, "active")).limit(Constants.MaxLimit);
  const allEnriched = await enrichRestaurants(allRows, date, time, guests, premiumIds);
  const fallbackResults = computeSearchFallback(
    {
      cuisine: filters.cuisines[0],
      district: filters.districts[0],
      price_level: filters.priceLevel >= 1 && filters.priceLevel <= 4 ? filters.priceLevel : undefined
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
  guests: number,
  premiumIds: Set<string>
): Promise<RestaurantSearchHit[]> {
  const avatarUrls = await loadAvatarUrls(rows.map((row) => row.id));
  return Promise.all(
    rows.map(async (row) => {
      const restaurant = mapRestaurant(row, { avatar_url: avatarUrls.get(row.id) ?? null });
      const hasAvailability = await computeHasAvailability(restaurant, date, time, guests);
      return {
        ...restaurant,
        has_availability: hasAvailability,
        is_premium: premiumIds.has(row.id)
      };
    })
  );
}

function sortByPremium(results: RestaurantSearchHit[]): RestaurantSearchHit[] {
  return [...results].sort((left, right) => {
    const leftPremium = left.is_premium ? 1 : 0;
    const rightPremium = right.is_premium ? 1 : 0;
    if (rightPremium !== leftPremium) {
      return rightPremium - leftPremium;
    }
    return right.rating - left.rating;
  });
}

async function resolveSearchFilters(
  searchParams: URLSearchParams,
  request: Request
): Promise<ResolvedSearchFilters> {
  const cuisines: string[] = [];
  const districts: string[] = [];
  let priceLevel = 0;

  if (searchParams.has("cuisine")) {
    const value = searchParams.get("cuisine")?.trim();
    if (value) {
      cuisines.push(value);
    }
  }
  if (searchParams.has("district")) {
    const value = searchParams.get("district")?.trim();
    if (value) {
      districts.push(value);
    }
  }
  if (searchParams.has("price_level")) {
    priceLevel = Number(searchParams.get("price_level") ?? "0");
  }

  const authUser = await getAuthUser(request);
  if (authUser?.role !== "user") {
    return { cuisines, districts, priceLevel };
  }

  const prefs = await loadUserPreferences(authUser.id);
  if (!prefs) {
    return { cuisines, districts, priceLevel };
  }

  if (!searchParams.has("cuisine") && prefs.preferredCuisines?.length) {
    cuisines.push(...prefs.preferredCuisines);
  }
  if (!searchParams.has("district") && prefs.preferredDistricts?.length) {
    districts.push(...prefs.preferredDistricts);
  }
  if (!searchParams.has("price_level") && prefs.preferredPriceLevel && prefs.preferredPriceLevel >= 1) {
    priceLevel = prefs.preferredPriceLevel;
  }

  return { cuisines, districts, priceLevel };
}

async function loadUserPreferences(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      preferredCuisines: users.preferredCuisines,
      preferredDistricts: users.preferredDistricts,
      preferredPriceLevel: users.preferredPriceLevel
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

function buildTextOrFilter(
  values: string[],
  columnEn: typeof restaurants.cuisineEn | typeof restaurants.districtEn,
  columnRu: typeof restaurants.cuisineRu | typeof restaurants.districtRu
) {
  if (values.length === 0) {
    return null;
  }
  const conditions = values.flatMap((value) => [
    ilike(columnEn, `%${value}%`),
    ilike(columnRu, `%${value}%`)
  ]);
  return or(...conditions)!;
}
