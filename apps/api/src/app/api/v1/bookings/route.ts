import { and, eq } from "drizzle-orm";
import { bookings, getDb, mapBooking, mapRestaurant, restaurants } from "@tablebook/db";
import { BookingSchema } from "@tablebook/shared";
import { jsonError, requireAuth } from "@/lib/auth-helpers";
import { logEvent } from "@/lib/events";
import { getAvailabilityForRestaurant } from "@/lib/restaurants-service";
import {
  checkBookingLimit,
  incrementBookingCount,
  isGuestBlacklisted,
  SubscriptionError
} from "@/lib/subscription-service";

export async function POST(request: Request) {
  try {
    const authUser = await requireAuth(request);
    if (authUser.role !== "user") {
      return Response.json(
        { error: "Restaurant owners cannot create bookings from owner account" },
        { status: 403 }
      );
    }
    const parsed = BookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

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
      await checkBookingLimit(parsed.data.restaurant_id);
    } catch (error) {
      if (error instanceof SubscriptionError) {
        return jsonError(error);
      }
      throw error;
    }

    if (authUser.phone) {
      const blacklisted = await isGuestBlacklisted(parsed.data.restaurant_id, authUser.phone);
      if (blacklisted) {
        return Response.json({ error: "Booking not allowed", code: "GUEST_BLACKLISTED" }, { status: 403 });
      }
    }

    try {
      const [bookingRow] = await db
        .insert(bookings)
        .values({
          restaurantId: parsed.data.restaurant_id,
          userId: authUser.id,
          tableId: parsed.data.table_id,
          date: parsed.data.date,
          time: parsed.data.time,
          guests: parsed.data.guests,
          source: parsed.data.source,
          revenueCents: parsed.data.revenue_cents,
          status: "pending"
        })
        .returning();

      await logEvent(
        "booking_created",
        {
          booking_id: bookingRow.id,
          restaurant_id: bookingRow.restaurantId,
          source: bookingRow.source
        },
        authUser.id
      );

      await incrementBookingCount(parsed.data.restaurant_id);

      if (bookingRow.source === "ai-alternative") {
        await logEvent("alternative_booking_success", { booking_id: bookingRow.id }, authUser.id);
      }

      return Response.json(
        {
          booking: mapBooking(bookingRow),
          restaurant
        },
        { status: 201 }
      );
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
