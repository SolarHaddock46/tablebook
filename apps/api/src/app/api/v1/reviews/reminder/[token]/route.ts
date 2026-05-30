import { eq } from "drizzle-orm";
import { bookings, getDb } from "@tablebook/db";
import { verifyReviewReminderToken } from "@/lib/review-reminder-token";

type Props = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  try {
    const { token } = await params;
    const payload = await verifyReviewReminderToken(token);
    if (!payload) {
      return Response.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .select({ id: bookings.id, restaurantId: bookings.restaurantId, userId: bookings.userId })
      .from(bookings)
      .where(eq(bookings.id, payload.bookingId))
      .limit(1);

    if (
      !row ||
      row.restaurantId !== payload.restaurantId ||
      row.userId !== payload.userId
    ) {
      return Response.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    return Response.json({
      ok: true,
      booking_id: row.id,
      restaurant_id: row.restaurantId
    });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
