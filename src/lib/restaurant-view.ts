import { type Locale, type Restaurant } from "@/lib/types";

export type RestaurantAlternative = Restaurant & {
  matchScore: number;
  matchReasons: string[];
};

export function getRestaurantName(restaurant: Restaurant, locale: Locale): string {
  return locale === "ru" ? restaurant.name_ru : restaurant.name_en;
}

export function getRestaurantCuisine(restaurant: Restaurant, locale: Locale): string {
  return locale === "ru" ? restaurant.cuisine_ru : restaurant.cuisine_en;
}

export function getRestaurantDistrict(restaurant: Restaurant, locale: Locale): string {
  return locale === "ru" ? restaurant.district_ru : restaurant.district_en;
}

export function getPriceLabel(priceLevel: number): string {
  return "$".repeat(Math.max(1, Math.min(4, priceLevel)));
}

export function computeAlternatives(
  selectedRestaurant: Restaurant,
  allRestaurants: Restaurant[],
  reasons: {
    sameCuisine: string;
    sameDistrict: string;
    nearby: string;
    similarPrice: string;
    samePrice: string;
    highRating: string;
  }
): RestaurantAlternative[] {
  const availableRestaurants = allRestaurants.filter(
    (restaurant) => restaurant.has_availability && restaurant.id !== selectedRestaurant.id
  );

  const scored = availableRestaurants.map((restaurant) => {
    let score = 0;
    const matchReasons: string[] = [];

    if (restaurant.cuisine_en === selectedRestaurant.cuisine_en) {
      score += 35;
      matchReasons.push(reasons.sameCuisine);
    }

    const priceDiff = Math.abs(restaurant.price_level - selectedRestaurant.price_level);
    if (priceDiff === 0) {
      score += 25;
      matchReasons.push(reasons.samePrice);
    } else if (priceDiff === 1) {
      score += 15;
      matchReasons.push(reasons.similarPrice);
    }

    if (restaurant.district_en === selectedRestaurant.district_en) {
      score += 20;
      matchReasons.push(reasons.sameDistrict);
    }
    if (restaurant.distance_km <= 2) {
      score += 10;
      matchReasons.push(reasons.nearby);
    }
    if (restaurant.rating >= 4.5) {
      score += 10;
      matchReasons.push(reasons.highRating);
    }

    return { ...restaurant, matchScore: Math.min(score, 98), matchReasons };
  });

  return scored.sort((left, right) => right.matchScore - left.matchScore).slice(0, 3);
}
