import { eq } from "drizzle-orm";
import { bookings, getDb, restaurants, users } from "@tablebook/db";
import { getBrandName } from "@tablebook/shared";
import { buildReviewReminderRedirectHtml } from "@/lib/review-reminder-links";
import { verifyReviewReminderToken } from "@/lib/review-reminder-token";

type Props = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, { params }: Props) {
  try {
    const { token: rawToken } = await params;
    const token = decodeURIComponent(rawToken);
    const payload = await verifyReviewReminderToken(token);
    if (!payload) {
      return new Response("Invalid or expired link", { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .select({
        restaurantId: bookings.restaurantId,
        userId: bookings.userId
      })
      .from(bookings)
      .where(eq(bookings.id, payload.bookingId))
      .limit(1);

    if (!row || row.restaurantId !== payload.restaurantId || row.userId !== payload.userId) {
      return new Response("Invalid or expired link", { status: 400 });
    }

    const [restaurantRow] = await db
      .select({ nameRu: restaurants.nameRu, nameEn: restaurants.nameEn })
      .from(restaurants)
      .where(eq(restaurants.id, row.restaurantId))
      .limit(1);

    const [userRow] = await db
      .select({ locale: users.locale })
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);

    const locale = (userRow?.locale === "en" ? "en" : "ru") as "ru" | "en";
    const restaurantName =
      locale === "ru"
        ? (restaurantRow?.nameRu ?? getBrandName("ru"))
        : (restaurantRow?.nameEn ?? getBrandName("en"));

    const html = buildReviewReminderRedirectHtml({ token, restaurantName, locale });
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response("Internal server error", { status: 500 });
  }
}
