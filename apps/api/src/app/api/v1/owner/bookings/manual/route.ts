import { eq } from "drizzle-orm";
import { bookings, getDb, mapBooking, mapRestaurant, restaurants } from "@tablebook/db";
import { ManualBookingSchema } from "@tablebook/shared";
import { jsonError, requireOwner } from "@/lib/auth-helpers";
import { logEvent } from "@/lib/events";
import { getAvailabilityForRestaurant } from "@/lib/restaurants-service";

export async function POST(request: Request) {
  try {
    const parsed = ManualBookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const authUser = await requireOwner(request, parsed.data.restaurant_id);
    const db = getDb();
    const [restaurantRow] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, parsed.data.restaurant_id))
      .limit(1);

    if (!restaurantRow || restaurantRow.status !== "active") {
      return Response.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const restaurant = mapRestaurant(restaurantRow);
    const freeTables = await getAvailabilityForRestaurant(
      restaurant,
      parsed.data.date,
      parsed.data.time,
      parsed.data.guests
    );
    const table = freeTables.find((item) => item.id === parsed.data.table_id);
    if (!table) {
      return Response.json({ error: "Slot unavailable" }, { status: 409 });
    }

    try {
      const [bookingRow] = await db
        .insert(bookings)
        .values({
          restaurantId: parsed.data.restaurant_id,
          userId: null,
          tableId: parsed.data.table_id,
          date: parsed.data.date,
          time: parsed.data.time,
          guests: parsed.data.guests,
          source: "direct",
          status: "confirmed",
          guestName: parsed.data.guest_name,
          guestPhone: parsed.data.guest_phone,
          isManual: true,
          manualNote: parsed.data.manual_note ?? null,
          revenueCents: 0
        })
        .returning();

      await logEvent(
        "manual_booking_created",
        {
          booking_id: bookingRow.id,
          restaurant_id: bookingRow.restaurantId
        },
        authUser.id
      );

      return Response.json({ booking: mapBooking(bookingRow) }, { status: 201 });
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
