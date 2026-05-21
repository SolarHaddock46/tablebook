import type {
  Booking,
  BookingStatus,
  Locale,
  Restaurant,
  RestaurantStatus,
  RestaurantTable,
  Review,
  User,
  UserRole
} from "@tablebook/shared";
import type { BookingRow, RestaurantRow, ReviewRow, UserRow } from "./schema/index";

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role as UserRole,
    display_name: row.displayName,
    locale: row.locale as Locale,
    created_at: row.createdAt.toISOString()
  };
}

export function mapRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    name_en: row.nameEn,
    name_ru: row.nameRu,
    cuisine_en: row.cuisineEn,
    cuisine_ru: row.cuisineRu,
    district_en: row.districtEn,
    district_ru: row.districtRu,
    price_level: row.priceLevel,
    rating: Number(row.rating),
    review_count: row.reviewCount,
    distance_km: Number(row.distanceKm),
    has_availability: row.hasAvailability,
    tables: (row.tables as RestaurantTable[]) ?? [],
    lat: Number(row.lat),
    lng: Number(row.lng),
    owner_id: row.ownerId,
    status: row.status as RestaurantStatus,
    created_at: row.createdAt.toISOString()
  };
}

export function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    restaurant_id: row.restaurantId,
    user_id: row.userId,
    table_id: row.tableId,
    date: String(row.date),
    time: String(row.time).slice(0, 5),
    guests: row.guests,
    source: row.source as Booking["source"],
    status: row.status as BookingStatus,
    revenue_cents: row.revenueCents,
    cancelled_at: row.cancelledAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString()
  };
}

export function mapReview(row: ReviewRow, authorName?: string | null): Review {
  return {
    id: row.id,
    restaurant_id: row.restaurantId,
    user_id: row.userId,
    rating: row.rating,
    body: row.body,
    created_at: row.createdAt.toISOString(),
    author_name: authorName ?? null
  };
}
