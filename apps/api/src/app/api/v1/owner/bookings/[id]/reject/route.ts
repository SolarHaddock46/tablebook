import { eq } from "drizzle-orm";
import { bookings, getDb, mapBooking } from "@tablebook/db";
import { RejectBookingSchema } from "@tablebook/shared";
import { jsonError } from "@/lib/auth-helpers";
import { loadOwnerBooking } from "@/lib/bookings-owner-service";
import { logEvent } from "@/lib/events";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const row = await loadOwnerBooking(id, request);

    if (row.status !== "pending") {
      return Response.json({ error: "Only pending bookings can be rejected" }, { status: 400 });
    }

    const parsed = RejectBookingSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(bookings)
      .set({
        status: "rejected",
        rejectionReason: parsed.data.reason ?? null,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id))
      .returning();

    await logEvent(
      "booking_rejected",
      {
        booking_id: updated.id,
        restaurant_id: updated.restaurantId,
        reason: parsed.data.reason ?? null
      },
      null
    );

    return Response.json({ booking: mapBooking(updated) });
  } catch (error) {
    return jsonError(error);
  }
}
