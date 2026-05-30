import { eq } from "drizzle-orm";
import { bookings, getDb, mapBooking, mapRestaurant, restaurants } from "@tablebook/db";
import { canCancelBooking } from "@tablebook/shared";
import { jsonError, requireAuth } from "@/lib/auth-helpers";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const db = getDb();
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!row) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (row.userId && row.userId !== authUser.id) {
      const [restaurant] = await db
        .select({ ownerId: restaurants.ownerId })
        .from(restaurants)
        .where(eq(restaurants.id, row.restaurantId))
        .limit(1);
      if (!restaurant || restaurant.ownerId !== authUser.id) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [restaurantRow] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, row.restaurantId))
      .limit(1);

    const booking = mapBooking(row);
    const cancellation = canCancelBooking(booking);

    return Response.json({
      ...booking,
      can_cancel: cancellation.allowed,
      cancellation_deadline: cancellation.deadline.toISOString(),
      restaurant: restaurantRow ? mapRestaurant(restaurantRow) : undefined
    });
  } catch (error) {
    return jsonError(error);
  }
}
