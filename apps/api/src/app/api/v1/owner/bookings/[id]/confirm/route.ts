import { eq } from "drizzle-orm";
import { bookings, getDb, mapBooking, mapRestaurant, restaurants } from "@tablebook/db";
import { jsonError } from "@/lib/auth-helpers";
import { loadOwnerBooking } from "@/lib/bookings-owner-service";
import { logEvent } from "@/lib/events";
import { getAvailabilityForRestaurant, getBookedTableIds } from "@/lib/restaurants-service";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const row = await loadOwnerBooking(id, request);

    if (row.status !== "pending") {
      return Response.json({ error: "Only pending bookings can be confirmed" }, { status: 400 });
    }

    const db = getDb();
    const [restaurantRow] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, row.restaurantId))
      .limit(1);

    if (!restaurantRow) {
      return Response.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const restaurant = mapRestaurant(restaurantRow);
    const booked = await getBookedTableIds(row.restaurantId, String(row.date), String(row.time));
    if (booked.has(row.tableId)) {
      return Response.json({ error: "Slot unavailable" }, { status: 409 });
    }

    const freeTables = await getAvailabilityForRestaurant(
      restaurant,
      String(row.date),
      String(row.time),
      row.guests
    );
    if (!freeTables.some((table) => table.id === row.tableId)) {
      return Response.json({ error: "Slot unavailable" }, { status: 409 });
    }

    try {
      const [updated] = await db
        .update(bookings)
        .set({
          status: "confirmed",
          updatedAt: new Date()
        })
        .where(eq(bookings.id, id))
        .returning();

      await logEvent(
        "booking_confirmed",
        {
          booking_id: updated.id,
          restaurant_id: updated.restaurantId
        },
        null
      );

      return Response.json({ booking: mapBooking(updated) });
    } catch (error) {
      if (error instanceof Error && error.message.includes("idx_bookings_slot")) {
        return Response.json({ error: "Slot unavailable" }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
