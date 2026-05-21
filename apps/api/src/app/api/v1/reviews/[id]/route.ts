import { eq } from "drizzle-orm";
import { getDb, mapReview, recalculateRestaurantRating, reviews } from "@tablebook/db";
import { ReviewSchema } from "@tablebook/shared";
import { jsonError, requireAuth } from "@/lib/auth-helpers";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const parsed = ReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const [existing] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.userId !== authUser.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const [row] = await db
      .update(reviews)
      .set({
        rating: parsed.data.rating,
        body: parsed.data.body ?? null
      })
      .where(eq(reviews.id, id))
      .returning();

    await recalculateRestaurantRating(row.restaurantId);
    return Response.json(mapReview(row, authUser.display_name));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const db = getDb();
    const [existing] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.userId !== authUser.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(reviews).where(eq(reviews.id, id));
    await recalculateRestaurantRating(existing.restaurantId);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
