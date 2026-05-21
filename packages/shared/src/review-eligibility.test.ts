import { describe, expect, it } from "vitest";
import { canUserReviewRestaurant, isPastVisitBooking } from "./review-eligibility";
import type { Booking, Review } from "./types";

const baseBooking: Booking = {
  id: "b1",
  restaurant_id: "r1",
  user_id: "u1",
  table_id: "t1",
  date: "2020-01-01",
  time: "19:00",
  guests: 2,
  source: "direct",
  status: "completed",
  revenue_cents: 1000,
  cancelled_at: null,
  created_at: "",
  updated_at: ""
};

describe("review eligibility", () => {
  it("detects past visit bookings", () => {
    expect(isPastVisitBooking(baseBooking, "2026-05-21")).toBe(true);
    expect(isPastVisitBooking({ ...baseBooking, date: "2026-05-22" }, "2026-05-21")).toBe(false);
    expect(isPastVisitBooking({ ...baseBooking, status: "cancelled" }, "2026-05-21")).toBe(false);
  });

  it("blocks duplicate reviews", () => {
    const reviews: Review[] = [
      {
        id: "rev1",
        restaurant_id: "r1",
        user_id: "u1",
        rating: 5,
        body: null,
        created_at: ""
      }
    ];
    const result = canUserReviewRestaurant("r1", "u1", [baseBooking], reviews);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("already_reviewed");
    }
  });
});
