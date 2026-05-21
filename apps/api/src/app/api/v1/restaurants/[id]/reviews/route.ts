import { desc, eq, and, lt, or } from "drizzle-orm";
import {
  bookings,
  getDb,
  mapReview,
  recalculateRestaurantRating,
  reviews,
  users
} from "@tablebook/db";
import { ReviewSchema } from "@tablebook/shared";
import { jsonError, requireAuth } from "@/lib/auth-helpers";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  const db = getDb();
  const rows = await db
    .select({
      review: reviews,
      authorName: users.displayName
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.restaurantId, id))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset);

  return Response.json(rows.map((row) => mapReview(row.review, row.authorName)));
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { id: restaurantId } = await params;
    const authUser = await requireAuth(request);
    const parsed = ReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const [eligibleBooking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.restaurantId, restaurantId),
          eq(bookings.userId, authUser.id),
          lt(bookings.date, today),
          or(eq(bookings.status, "confirmed"), eq(bookings.status, "completed"))
        )
      )
      .limit(1);

    if (!eligibleBooking) {
      return Response.json({ error: "Review requires a completed visit" }, { status: 403 });
    }

    const [row] = await db
      .insert(reviews)
      .values({
        restaurantId,
        userId: authUser.id,
        rating: parsed.data.rating,
        body: parsed.data.body ?? null
      })
      .returning();

    await recalculateRestaurantRating(restaurantId);
    return Response.json(mapReview(row, authUser.display_name), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
