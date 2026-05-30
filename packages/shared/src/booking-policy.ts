import type { Booking } from "./types";

export type CancelBookingEligibility =
  | { allowed: true; deadline: Date }
  | {
      allowed: false;
      reason: "not_confirmed" | "past" | "window_expired";
      deadline: Date;
    };

export function getBookingStartDate(booking: Booking): Date {
  const timePart = booking.time.slice(0, 5);
  return new Date(`${booking.date}T${timePart}:00`);
}

export function getCancellationDeadline(booking: Booking): Date {
  const start = getBookingStartDate(booking);
  return new Date(start.getTime() - Constants.CancellationWindowMs);
}

export function canCancelBooking(booking: Booking, now = new Date()): CancelBookingEligibility {
  const deadline = getCancellationDeadline(booking);

  if (booking.status !== "confirmed") {
    return { allowed: false, reason: "not_confirmed", deadline };
  }

  const start = getBookingStartDate(booking);
  if (now >= start) {
    return { allowed: false, reason: "past", deadline };
  }

  if (now >= deadline) {
    return { allowed: false, reason: "window_expired", deadline };
  }

  return { allowed: true, deadline };
}

enum Constants {
  CancellationWindowMs = 4 * 60 * 60 * 1000
}
