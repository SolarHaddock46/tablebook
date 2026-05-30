import { eq } from "drizzle-orm";
import { bookings, getDb } from "@tablebook/db";
import { AuthError, requireOwner } from "@/lib/auth-helpers";

export async function loadOwnerBooking(bookingId: string, request: Request) {
  const db = getDb();
  const [row] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!row) {
    throw new AuthError("Not found", 404);
  }
  await requireOwner(request, row.restaurantId);
  return row;
}
