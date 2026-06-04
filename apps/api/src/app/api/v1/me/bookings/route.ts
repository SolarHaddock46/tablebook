import { and, desc, eq, gte, inArray, lt, or } from "drizzle-orm";
import { bookings, getDb, mapBooking } from "@tablebook/db";
import { jsonError, requireAuth } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming");
    const today = new Date().toISOString().slice(0, 10);

    const db = getDb();
    const filters = [eq(bookings.userId, authUser.id)];
    if (status) {
      filters.push(eq(bookings.status, status as "pending" | "confirmed" | "rejected" | "cancelled" | "completed"));
    }
    if (upcoming === "true") {
      filters.push(
        or(
          eq(bookings.status, "pending"),
          and(gte(bookings.date, today), inArray(bookings.status, ["confirmed"]))
        )
      );
    }
    if (upcoming === "false") {
      filters.push(lt(bookings.date, today));
    }

    const rows = await db
      .select()
      .from(bookings)
      .where(and(...filters))
      .orderBy(desc(bookings.date), desc(bookings.time));

    return Response.json(rows.map(mapBooking));
  } catch (error) {
    return jsonError(error);
  }
}
