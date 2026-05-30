import { desc, eq } from "drizzle-orm";
import { bookings, getDb, mapBooking, users } from "@tablebook/db";
import { jsonError, requireOwner } from "@/lib/auth-helpers";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    await requireOwner(request, id);

    const db = getDb();
    const rows = await db
      .select({
        booking: bookings,
        guestName: users.displayName
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.restaurantId, id))
      .orderBy(desc(bookings.date), desc(bookings.time));

    return Response.json(
      rows.map((row) => {
        const booking = mapBooking(row.booking);
        return {
          ...booking,
          guest_name: booking.guest_name ?? row.guestName ?? null
        };
      })
    );
  } catch (error) {
    return jsonError(error);
  }
}
