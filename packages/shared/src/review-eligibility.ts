import type { Booking, Review } from "./types";

export type ReviewEligibility =
  | { allowed: true }
  | { allowed: false; reason: "no_visit" | "already_reviewed" };

export function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPastVisitBooking(booking: Booking, todayIso = getTodayIso()): boolean {
  return (
    booking.date < todayIso &&
    (booking.status === "confirmed" || booking.status === "completed")
  );
}

export function canUserReviewRestaurant(
  restaurantId: string,
  userId: string,
  bookings: Booking[],
  reviews: Review[]
): ReviewEligibility {
  if (reviews.some((review) => review.user_id === userId)) {
    return { allowed: false, reason: "already_reviewed" };
  }

  const hasPastVisit = bookings.some(
    (booking) => booking.restaurant_id === restaurantId && isPastVisitBooking(booking)
  );

  if (!hasPastVisit) {
    return { allowed: false, reason: "no_visit" };
  }

  return { allowed: true };
}
