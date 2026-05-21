import { eq } from "drizzle-orm";
import { getDb, mapRestaurant, restaurants } from "@tablebook/db";
import { computeAlternatives, t, type Locale } from "@tablebook/shared";
import { computeHasAvailability } from "@/lib/restaurants-service";
import { logEvent } from "@/lib/events";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const locale: Locale = searchParams.get("locale") === "en" ? "en" : "ru";
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const time = searchParams.get("time") ?? "19:00";
  const guests = Number(searchParams.get("guests") ?? "2");
  const dict = t(locale);

  const db = getDb();
  const [selectedRow] = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  if (!selectedRow) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const selected = mapRestaurant(selectedRow);
  const allRows = await db.select().from(restaurants).where(eq(restaurants.status, "active")).limit(50);

  const availableRows = await Promise.all(
    allRows.map(async (row) => {
      const restaurant = mapRestaurant(row);
      const hasAvailability = await computeHasAvailability(restaurant, date, time, guests);
      return { ...restaurant, has_availability: hasAvailability };
    })
  );

  const alternatives = computeAlternatives(selected, availableRows, {
    sameCuisine: dict.sameCuisine,
    sameDistrict: dict.sameDistrict,
    nearby: dict.nearby,
    similarPrice: dict.similarPrice,
    samePrice: dict.samePrice,
    highRating: dict.highRating
  });

  await logEvent("alternatives_shown", {
    restaurant_id: selected.id,
    alternative_ids: alternatives.map((item) => item.id)
  });

  return Response.json(alternatives);
}
