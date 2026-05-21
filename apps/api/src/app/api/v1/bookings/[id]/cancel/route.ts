import { and, eq, gte } from "drizzle-orm";
import { bookings, getDb, mapBooking } from "@tablebook/db";
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
    if (row.userId !== authUser.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (row.status !== "confirmed") {
      return Response.json({ error: "Booking cannot be cancelled" }, { status: 400 });
    }
    if (String(row.date) < today) {
      return Response.json({ error: "Past bookings cannot be cancelled" }, { status: 400 });
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
