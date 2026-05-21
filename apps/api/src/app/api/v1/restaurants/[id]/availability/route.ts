import { eq } from "drizzle-orm";
import { getDb, mapRestaurant, restaurants } from "@tablebook/db";
import { getAvailabilityForRestaurant } from "@/lib/restaurants-service";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const time = searchParams.get("time") ?? "19:00";
  const guests = Number(searchParams.get("guests") ?? "2");

  const db = getDb();
  const [row] = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const restaurant = mapRestaurant(row);
  const tables = await getAvailabilityForRestaurant(restaurant, date, time, guests);
  return Response.json({ tables, date, time, guests });
}
