import { type Locale, type Restaurant, type RestaurantSearchHit, type SearchCriteria } from "./types";

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

export function computeSearchFallback(
  criteria: SearchCriteria,
  candidates: Restaurant[],
  reasons: {
    sameCuisine: string;
    similarPrice: string;
    samePrice: string;
    otherDistrict: string;
    availableSlot: string;
    nearby: string;
    highRating: string;
  },
  limit = 10
): RestaurantSearchHit[] {
  const scored = candidates.map((restaurant) => {
    let score = 0;
    const matchReasons: string[] = [];

    if (criteria.cuisine && restaurant.cuisine_en.toLowerCase() === criteria.cuisine.toLowerCase()) {
      score += 35;
      matchReasons.push(reasons.sameCuisine);
    }

    const targetPrice = criteria.price_level ?? 0;
    if (targetPrice >= 1 && targetPrice <= 4) {
      const priceDiff = Math.abs(restaurant.price_level - targetPrice);
      if (priceDiff === 0) {
        score += 25;
        matchReasons.push(reasons.samePrice);
      } else if (priceDiff === 1) {
        score += 15;
        matchReasons.push(reasons.similarPrice);
      }
    }

    if (criteria.district && restaurant.district_en.toLowerCase() !== criteria.district.toLowerCase()) {
      score += 18;
      matchReasons.push(reasons.otherDistrict);
    }

    if (restaurant.has_availability) {
      score += 40;
      matchReasons.push(reasons.availableSlot);
    }

    if (restaurant.distance_km <= 2) {
      score += 10;
      matchReasons.push(reasons.nearby);
    }

    if (restaurant.rating >= 4.5) {
      score += 10;
      matchReasons.push(reasons.highRating);
    }

    if (restaurant.is_premium) {
      score += 20;
    }

    score += restaurant.rating * 2;

    return {
      ...restaurant,
      matchScore: Math.min(Math.round(score), 98),
      matchReasons: [...new Set(matchReasons)]
    };
  });

  return scored
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return (right.matchScore ?? 0) - (left.matchScore ?? 0);
      }
      return right.rating - left.rating;
    })
    .slice(0, limit);
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

export function getFreeTables(
  restaurant: Restaurant,
  bookedTableIds: Set<string>,
  guests: number
): Restaurant["tables"] {
  return restaurant.tables.filter(
    (table) => !bookedTableIds.has(table.id) && table.capacity >= guests
  );
}

export function restaurantHasAvailability(
  restaurant: Restaurant,
  bookedTableIds: Set<string>,
  guests: number
): boolean {
  return getFreeTables(restaurant, bookedTableIds, guests).length > 0;
}
