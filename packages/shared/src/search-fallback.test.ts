import { describe, expect, it } from "vitest";
import { computeSearchFallback } from "./restaurant-view";
import type { Restaurant } from "./types";

const reasons = {
  sameCuisine: "cuisine",
  similarPrice: "price~",
  samePrice: "price",
  otherDistrict: "district",
  availableSlot: "slot",
  nearby: "near",
  highRating: "rating"
};

function makeRestaurant(overrides: Partial<Restaurant>): Restaurant {
  return {
    id: "1",
    name_en: "Test",
    name_ru: "Тест",
    cuisine_en: "Italian",
    cuisine_ru: "Итальянская",
    district_en: "Arbat",
    district_ru: "Арбат",
    price_level: 2,
    rating: 4.5,
    review_count: 10,
    distance_km: 1,
    has_availability: true,
    tables: [],
    lat: 55.75,
    lng: 37.62,
    owner_id: null,
    status: "active",
    created_at: new Date().toISOString(),
    ...overrides
  };
}

describe("computeSearchFallback", () => {
  it("returns closest matches for other districts on the same criteria", () => {
    const results = computeSearchFallback(
      { cuisine: "Japanese", district: "Center", price_level: 3 },
      [
        makeRestaurant({
          id: "a",
          cuisine_en: "Japanese",
          district_en: "Tverskaya",
          price_level: 3,
          has_availability: true
        }),
        makeRestaurant({
          id: "b",
          cuisine_en: "European",
          district_en: "Center",
          price_level: 1,
          has_availability: false
        })
      ],
      reasons,
      5
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.id).toBe("a");
    expect(results[0]?.matchReasons).toContain("district");
  });
});
