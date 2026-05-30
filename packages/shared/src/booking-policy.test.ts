import { describe, expect, it } from "vitest";
import { canCancelBooking, getCancellationDeadline } from "./booking-policy";
import type { Booking } from "./types";

const baseBooking: Booking = {
  id: "b1",
  restaurant_id: "r1",
  user_id: "u1",
  table_id: "t1",
  date: "2026-05-30",
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
  created_at: "",
  updated_at: ""
};

describe("booking cancellation policy", () => {
  it("allows cancellation more than 4 hours before start", () => {
    const now = new Date("2026-05-30T14:00:00");
    const result = canCancelBooking(baseBooking, now);
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.deadline).toEqual(new Date("2026-05-30T15:00:00"));
    }
  });

  it("blocks cancellation within 4 hours of start", () => {
    const now = new Date("2026-05-30T15:00:00");
    const result = canCancelBooking(baseBooking, now);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("window_expired");
    }
  });

  it("blocks cancellation after booking start", () => {
    const now = new Date("2026-05-30T19:30:00");
    const result = canCancelBooking(baseBooking, now);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("past");
    }
  });

  it("blocks cancellation for non-cancellable bookings", () => {
    const now = new Date("2026-05-29T10:00:00");
    const result = canCancelBooking({ ...baseBooking, status: "cancelled" }, now);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("not_cancellable");
    }
  });

  it("allows cancellation for pending bookings before start", () => {
    const now = new Date("2026-05-30T18:30:00");
    const result = canCancelBooking({ ...baseBooking, status: "pending" }, now);
    expect(result.allowed).toBe(true);
  });

  it("computes cancellation deadline as start minus 4 hours", () => {
    expect(getCancellationDeadline(baseBooking)).toEqual(new Date("2026-05-30T15:00:00"));
  });
});
