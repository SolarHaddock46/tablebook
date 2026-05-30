import { eq } from "drizzle-orm";
import { bookings, getDb } from "@tablebook/db";
import { jsonError } from "@/lib/auth-helpers";
import { loadOwnerBooking } from "@/lib/bookings-owner-service";
import { sendReviewReminderForBooking } from "@/lib/review-reminders-service";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    await loadOwnerBooking(id, request);

    const db = getDb();
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!row) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const result = await sendReviewReminderForBooking(row, { skipSentCheck: true });
    if (!result.sent) {
      return Response.json({ error: result.reason }, { status: 400 });
    }

    return Response.json({ ok: true, booking_id: result.bookingId });
  } catch (error) {
    return jsonError(error);
  }
}
