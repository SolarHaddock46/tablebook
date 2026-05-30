import { and, eq, gte } from "drizzle-orm";
import { bookings, getDb, mapBooking } from "@tablebook/db";
import { canCancelBooking } from "@tablebook/shared";
import { jsonError, requireAuth } from "@/lib/auth-helpers";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const today = new Date().toISOString().slice(0, 10);

    const db = getDb();
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!row) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (row.userId && row.userId !== authUser.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const booking = mapBooking(row);
    const cancellation = canCancelBooking(booking);
    if (!cancellation.allowed) {
      if (cancellation.reason === "window_expired") {
        return Response.json(
          {
            error: "Cancellation window expired",
            code: "CANCELLATION_WINDOW_EXPIRED",
            cancellation_deadline: cancellation.deadline.toISOString()
          },
          { status: 403 }
        );
      }
      if (cancellation.reason === "past") {
        return Response.json({ error: "Past bookings cannot be cancelled" }, { status: 400 });
      }
      return Response.json({ error: "Booking cannot be cancelled" }, { status: 400 });
    }

    const [updated] = await db
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(bookings.id, id), gte(bookings.date, today)))
      .returning();

    return Response.json({ booking: mapBooking(updated) });
  } catch (error) {
    return jsonError(error);
  }
}
