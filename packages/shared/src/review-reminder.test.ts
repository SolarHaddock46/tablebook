import { describe, expect, it } from "vitest";
import { canSendReviewReminder, getBookingVisitDate, isVisitEnded } from "./review-reminder";
import type { Booking } from "./types";

const baseBooking: Booking = {
  id: "b1",
  restaurant_id: "r1",
  user_id: "u1",
  table_id: "t1",
  date: "2020-01-01",
  time: "19:00",
  guests: 2,
  source: "direct",
  status: "confirmed",
  guest_name: null,
  guest_phone: null,
  is_manual: false,
  manual_note: null,
  rejection_reason: null,
  revenue_cents: 1000,
  cancelled_at: null,
  review_reminder_sent: false,
  created_at: "",
  updated_at: ""
};

describe("review reminder", () => {
  it("detects ended visits by date and time", () => {
    expect(isVisitEnded(baseBooking, new Date("2020-01-02T10:00:00"))).toBe(true);
    expect(isVisitEnded(baseBooking, new Date("2020-01-01T18:00:00"))).toBe(false);
    expect(isVisitEnded({ ...baseBooking, status: "pending" }, new Date("2020-01-02T10:00:00"))).toBe(
      false
    );
  });

  it("uses booking start date for visit datetime", () => {
    const booking = { ...baseBooking, date: "2026-05-21", time: "14:30" };
    expect(getBookingVisitDate(booking).getTime()).toBe(
      new Date("2026-05-21T14:30:00").getTime()
    );
  });

  it("blocks reminders when already sent or reviewed", () => {
    const now = new Date("2020-01-02T10:00:00");
    expect(canSendReviewReminder(baseBooking, { hasReview: false, now }).eligible).toBe(true);
    expect(
      canSendReviewReminder({ ...baseBooking, review_reminder_sent: true }, { hasReview: false, now })
        .eligible
    ).toBe(false);
    expect(canSendReviewReminder(baseBooking, { hasReview: true, now }).eligible).toBe(false);
    expect(
      canSendReviewReminder(baseBooking, {
        hasReview: false,
        now,
        skipSentCheck: true
      }).eligible
    ).toBe(true);
  });
});
