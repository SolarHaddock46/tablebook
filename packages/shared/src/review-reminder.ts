import { getBookingStartDate } from "./booking-policy";
import type { Booking } from "./types";

export type ReviewReminderEligibility =
  | { eligible: true }
  | {
      eligible: false;
      reason:
        | "no_user"
        | "not_ended"
        | "invalid_status"
        | "already_sent"
        | "already_reviewed";
    };

export function getBookingVisitDate(booking: Booking): Date {
  return getBookingStartDate(booking);
}

export function isVisitEnded(booking: Booking, now = new Date()): boolean {
  if (booking.status === "cancelled" || booking.status === "rejected" || booking.status === "pending") {
    return false;
  }
  return getBookingVisitDate(booking) < now;
}

export function canSendReviewReminder(
  booking: Booking,
  options: { hasReview: boolean; now?: Date; skipSentCheck?: boolean }
): ReviewReminderEligibility {
  if (!booking.user_id) {
    return { eligible: false, reason: "no_user" };
  }

  if (booking.status !== "confirmed" && booking.status !== "completed") {
    return { eligible: false, reason: "invalid_status" };
  }

  if (!isVisitEnded(booking, options.now)) {
    return { eligible: false, reason: "not_ended" };
  }

  if (!options.skipSentCheck && booking.review_reminder_sent) {
    return { eligible: false, reason: "already_sent" };
  }

  if (options.hasReview) {
    return { eligible: false, reason: "already_reviewed" };
  }

  return { eligible: true };
}
