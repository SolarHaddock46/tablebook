import { describe, expect, it } from "vitest";
import {
  canAcceptBooking,
  computeBookingsRemaining,
  isPremiumSubscription,
  isSubscriptionActive
} from "./subscription";
import type { RestaurantSubscription } from "./types";

function makeSubscription(overrides: Partial<RestaurantSubscription> = {}): RestaurantSubscription {
  return {
    id: "sub-1",
    restaurant_id: "rest-1",
    plan_id: "plan-1",
    plan_name: "trial",
    status: "trial",
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    bookings_this_month: 0,
    bookings_remaining: 50,
    last_reset_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides
  };
}

describe("isSubscriptionActive", () => {
  it("returns true for active trial", () => {
    expect(isSubscriptionActive(makeSubscription())).toBe(true);
  });

  it("returns false when expired by date", () => {
    expect(
      isSubscriptionActive(
        makeSubscription({ expires_at: new Date(Date.now() - 1000).toISOString() })
      )
    ).toBe(false);
  });

  it("returns false when cancelled", () => {
    expect(isSubscriptionActive(makeSubscription({ status: "cancelled" }))).toBe(false);
  });
});

describe("isPremiumSubscription", () => {
  it("returns true for active premium", () => {
    expect(
      isPremiumSubscription(makeSubscription({ plan_name: "premium", status: "active" }))
    ).toBe(true);
  });

  it("returns false for trial", () => {
    expect(isPremiumSubscription(makeSubscription({ plan_name: "trial" }))).toBe(false);
  });
});

describe("canAcceptBooking", () => {
  it("allows booking under limit", () => {
    expect(canAcceptBooking(makeSubscription(), 50).allowed).toBe(true);
  });

  it("blocks when limit reached", () => {
    const result = canAcceptBooking(makeSubscription({ bookings_this_month: 50 }), 50);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("limit_reached");
    }
  });
});

describe("computeBookingsRemaining", () => {
  it("returns remaining count for trial", () => {
    expect(computeBookingsRemaining(10, 50)).toBe(40);
  });

  it("returns null for unlimited premium", () => {
    expect(computeBookingsRemaining(100, 999999)).toBeNull();
  });
});
