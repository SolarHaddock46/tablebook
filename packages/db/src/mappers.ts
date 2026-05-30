import type {
  AuthUser,
  Booking,
  BookingStatus,
  Locale,
  Restaurant,
  RestaurantBlacklistEntry,
  RestaurantPhoto,
  RestaurantStatus,
  RestaurantSubscription,
  RestaurantTable,
  Review,
  SubscriptionAnalyticsDay,
  SubscriptionPlan,
  SubscriptionPlanType,
  SubscriptionStatus,
  User,
  UserRole
} from "@tablebook/shared";
import type {
  BookingRow,
  RestaurantBlacklistRow,
  RestaurantPhotoRow,
  RestaurantRow,
  RestaurantSubscriptionRow,
  ReviewRow,
  SubscriptionAnalyticsRow,
  SubscriptionPlanRow,
  UserRow
} from "./schema/index";

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role as UserRole,
    display_name: row.displayName,
    full_name: row.fullName,
    phone: row.phone,
    email_verified: row.emailVerified,
    locale: row.locale as Locale,
    preferred_cuisines: row.preferredCuisines ?? null,
    preferred_districts: row.preferredDistricts ?? null,
    preferred_price_level: row.preferredPriceLevel ?? null,
    created_at: row.createdAt.toISOString()
  };
}

export function mapAuthUser(row: UserRow): AuthUser {
  const user = mapUser(row);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: user.display_name,
    full_name: user.full_name,
    phone: user.phone,
    email_verified: user.email_verified,
    locale: user.locale,
    preferred_cuisines: user.preferred_cuisines,
    preferred_districts: user.preferred_districts,
    preferred_price_level: user.preferred_price_level
  };
}

export function mapRestaurant(row: RestaurantRow, extras?: { avatar_url?: string | null; photos?: RestaurantPhoto[] }): Restaurant {
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
    created_at: row.createdAt.toISOString(),
    avatar_url: extras?.avatar_url ?? null,
    photos: extras?.photos
  };
}

export function mapRestaurantPhoto(row: RestaurantPhotoRow): RestaurantPhoto {
  return {
    id: row.id,
    restaurant_id: row.restaurantId,
    url: row.url,
    is_avatar: row.isAvatar,
    sort_order: row.sortOrder,
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
    guest_name: row.guestName,
    guest_phone: row.guestPhone,
    is_manual: row.isManual,
    manual_note: row.manualNote,
    rejection_reason: row.rejectionReason,
    revenue_cents: row.revenueCents,
    cancelled_at: row.cancelledAt?.toISOString() ?? null,
    review_reminder_sent: row.reviewReminderSent,
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

export function mapSubscriptionPlan(row: SubscriptionPlanRow): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name as SubscriptionPlanType,
    price_cents: row.priceCents,
    max_bookings_monthly: row.maxBookingsMonthly,
    features: (row.features as string[]) ?? [],
    created_at: row.createdAt.toISOString()
  };
}

export function mapRestaurantSubscription(
  row: RestaurantSubscriptionRow,
  planName: SubscriptionPlanType,
  maxBookingsMonthly: number
): RestaurantSubscription {
  const bookingsRemaining =
    maxBookingsMonthly >= 999999 ? null : Math.max(0, maxBookingsMonthly - row.bookingsThisMonth);
  return {
    id: row.id,
    restaurant_id: row.restaurantId,
    plan_id: row.planId,
    plan_name: planName,
    status: row.status as SubscriptionStatus,
    started_at: row.startedAt.toISOString(),
    expires_at: row.expiresAt?.toISOString() ?? null,
    bookings_this_month: row.bookingsThisMonth,
    bookings_remaining: bookingsRemaining,
    last_reset_at: row.lastResetAt.toISOString(),
    created_at: row.createdAt.toISOString()
  };
}

export function mapBlacklistEntry(row: RestaurantBlacklistRow): RestaurantBlacklistEntry {
  return {
    id: row.id,
    restaurant_id: row.restaurantId,
    guest_phone: row.guestPhone,
    guest_name: row.guestName,
    reason: row.reason,
    created_at: row.createdAt.toISOString()
  };
}

export function mapSubscriptionAnalyticsDay(row: SubscriptionAnalyticsRow): SubscriptionAnalyticsDay {
  return {
    date: String(row.date),
    total_bookings: row.totalBookings,
    confirmed_bookings: row.confirmedBookings,
    cancelled_bookings: row.cancelledBookings,
    revenue_cents: row.revenueCents,
    occupancy_rate: Number(row.occupancyRate)
  };
}
