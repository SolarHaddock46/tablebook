import { and, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { bookings, getDb, mapBooking, restaurants, reviews, users } from "@tablebook/db";
import type { BookingRow } from "@tablebook/db";
import { canSendReviewReminder, type Locale } from "@tablebook/shared";
import { sendReviewReminderEmail } from "@/lib/email";
import { signReviewReminderToken } from "@/lib/review-reminder-token";
import { isRestaurantPremium } from "@/lib/subscription-service";

export type ReviewReminderSendResult =
  | { sent: true; bookingId: string }
  | { sent: false; bookingId: string; reason: string };

export async function sendReviewReminderForBooking(
  row: BookingRow,
  options?: { skipSentCheck?: boolean }
): Promise<ReviewReminderSendResult> {
  const db = getDb();
  const booking = mapBooking(row);

  if (!row.userId) {
    return { sent: false, bookingId: row.id, reason: "no_user" };
  }

  const [userRow] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  if (!userRow) {
    return { sent: false, bookingId: row.id, reason: "no_user" };
  }

  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.restaurantId, row.restaurantId), eq(reviews.userId, row.userId)))
    .limit(1);

  const eligibility = canSendReviewReminder(booking, {
    hasReview: Boolean(existingReview),
    skipSentCheck: options?.skipSentCheck
  });

  if (!eligibility.eligible) {
    return { sent: false, bookingId: row.id, reason: eligibility.reason };
  }

  const [restaurantRow] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, row.restaurantId))
    .limit(1);

  if (!restaurantRow) {
    return { sent: false, bookingId: row.id, reason: "restaurant_not_found" };
  }

  const premium = await isRestaurantPremium(row.restaurantId);
  if (!premium) {
    return { sent: false, bookingId: row.id, reason: "premium_required" };
  }

  const locale = userRow.locale as Locale;
  const restaurantName = locale === "ru" ? restaurantRow.nameRu : restaurantRow.nameEn;

  const token = await signReviewReminderToken({
    bookingId: row.id,
    restaurantId: row.restaurantId,
    userId: row.userId
  });

  await sendReviewReminderEmail({
    email: userRow.email,
    token,
    locale,
    restaurantName
  });

  await db
    .update(bookings)
    .set({
      reviewReminderSent: true,
      updatedAt: new Date()
    })
    .where(eq(bookings.id, row.id));

  return { sent: true, bookingId: row.id };
}

export async function processDueReviewReminders() {
  const db = getDb();
  const rows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.reviewReminderSent, false),
        isNotNull(bookings.userId),
        or(eq(bookings.status, "confirmed"), eq(bookings.status, "completed")),
        sql`(${bookings.date} + ${bookings.time}) < now()`
      )
    )
    .limit(Constants.BatchSize);

  const results: ReviewReminderSendResult[] = [];
  for (const row of rows) {
    results.push(await sendReviewReminderForBooking(row));
  }

  const sent = results.filter((item) => item.sent).length;
  const skipped = results.length - sent;

  return {
    processed: results.length,
    sent,
    skipped,
    results
  };
}

const Constants = {
  BatchSize: 50
} as const;
