import { and, eq, inArray } from "drizzle-orm";
import { bookings, getDb } from "@tablebook/db";
import { getFreeTables, restaurantHasAvailability, type Restaurant } from "@tablebook/shared";

function normalizeTime(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 5) {
    return trimmed.slice(0, 5);
  }
  return trimmed;
}

export async function getBookedTableIds(
  restaurantId: string,
  date: string,
  time: string
): Promise<Set<string>> {
  const db = getDb();
  const slotTime = normalizeTime(time);
  const rows = await db
    .select({ tableId: bookings.tableId })
    .from(bookings)
    .where(
      and(
        eq(bookings.restaurantId, restaurantId),
        eq(bookings.date, date),
        eq(bookings.time, slotTime),
        eq(bookings.status, "confirmed")
      )
    );

  return new Set(rows.map((row) => row.tableId));
}

export async function getBookedTableIdsByRestaurant(
  restaurantIds: string[],
  date: string,
  time: string
): Promise<Map<string, Set<string>>> {
  const uniqueIds = [...new Set(restaurantIds)];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const db = getDb();
  const slotTime = normalizeTime(time);
  const rows = await db
    .select({ restaurantId: bookings.restaurantId, tableId: bookings.tableId })
    .from(bookings)
    .where(
      and(
        inArray(bookings.restaurantId, uniqueIds),
        eq(bookings.date, date),
        eq(bookings.time, slotTime),
        eq(bookings.status, "confirmed")
      )
    );

  const result = new Map<string, Set<string>>();
  for (const restaurantId of uniqueIds) {
    result.set(restaurantId, new Set());
  }
  for (const row of rows) {
    result.get(row.restaurantId)?.add(row.tableId);
  }
  return result;
}

export function computeHasAvailabilityFromBooked(
  restaurant: Restaurant,
  booked: Set<string>,
  guests: number
) {
  if (!restaurant.has_availability || restaurant.status !== "active") {
    return false;
  }
  return restaurantHasAvailability(restaurant, booked, guests);
}

export async function getAvailabilityForRestaurant(
  restaurant: Restaurant,
  date: string,
  time: string,
  guests: number
) {
  const booked = await getBookedTableIds(restaurant.id, date, time);
  return getFreeTables(restaurant, booked, guests);
}

export async function computeHasAvailability(
  restaurant: Restaurant,
  date: string,
  time: string,
  guests: number
) {
  if (!restaurant.has_availability || restaurant.status !== "active") {
    return false;
  }
  const booked = await getBookedTableIds(restaurant.id, date, time);
  return restaurantHasAvailability(restaurant, booked, guests);
}
