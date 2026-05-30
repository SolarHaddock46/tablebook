export type Locale = "ru" | "en";

export type UserRole = "user" | "restaurant_owner" | "admin";

export type RestaurantStatus = "draft" | "pending" | "active" | "suspended";

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";

export type RestaurantTable = {
  id: string;
  zone_en: string;
  zone_ru: string;
  capacity: number;
};

export type RestaurantPhoto = {
  id: string;
  restaurant_id: string;
  url: string;
  is_avatar: boolean;
  sort_order: number;
  created_at: string;
};

export type Restaurant = {
  id: string;
  name_en: string;
  name_ru: string;
  cuisine_en: string;
  cuisine_ru: string;
  district_en: string;
  district_ru: string;
  price_level: number;
  rating: number;
  review_count: number;
  distance_km: number;
  has_availability: boolean;
  tables: RestaurantTable[];
  lat: number;
  lng: number;
  owner_id: string | null;
  status: RestaurantStatus;
  created_at: string;
  avatar_url?: string | null;
  photos?: RestaurantPhoto[];
  is_premium?: boolean;
};

export type RestaurantSearchHit = Restaurant & {
  matchScore?: number;
  matchReasons?: string[];
};

export type RestaurantSearchResponse = {
  results: RestaurantSearchHit[];
  is_fallback: boolean;
};

export type SearchCriteria = {
  cuisine?: string;
  district?: string;
  price_level?: number;
};

export type BookingSource = "direct" | "ai-alternative" | "quick-book";

export type Booking = {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  table_id: string;
  date: string;
  time: string;
  guests: number;
  source: BookingSource;
  status: BookingStatus;
  guest_name: string | null;
  guest_phone: string | null;
  is_manual: boolean;
  manual_note: string | null;
  rejection_reason: string | null;
  revenue_cents: number;
  cancelled_at: string | null;
  review_reminder_sent: boolean;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  restaurant_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
  author_name?: string | null;
};

export type UserPreferences = {
  preferred_cuisines: string[] | null;
  preferred_districts: string[] | null;
  preferred_price_level: number | null;
};

export type User = {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  full_name: string | null;
  phone: string | null;
  email_verified: boolean;
  locale: Locale;
  preferred_cuisines: string[] | null;
  preferred_districts: string[] | null;
  preferred_price_level: number | null;
  created_at: string;
};

export type BookingInput = {
  restaurant_id: string;
  table_id: string;
  date: string;
  time: string;
  guests: number;
  source: BookingSource;
  revenue_cents: number;
};

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  full_name: string | null;
  phone: string | null;
  email_verified: boolean;
  locale: Locale;
  preferred_cuisines: string[] | null;
  preferred_districts: string[] | null;
  preferred_price_level: number | null;
};

export type SubscriptionPlanType = "trial" | "premium";

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled";

export type SubscriptionPlan = {
  id: string;
  name: SubscriptionPlanType;
  price_cents: number;
  max_bookings_monthly: number;
  features: string[];
  created_at: string;
};

export type RestaurantSubscription = {
  id: string;
  restaurant_id: string;
  plan_id: string;
  plan_name: SubscriptionPlanType;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  bookings_this_month: number;
  bookings_remaining: number | null;
  last_reset_at: string;
  created_at: string;
};

export type SubscriptionPayment = {
  id: string;
  subscription_id: string;
  amount_cents: number;
  status: string;
  created_at: string;
};

export type RestaurantBlacklistEntry = {
  id: string;
  restaurant_id: string;
  guest_phone: string;
  guest_name: string | null;
  reason: string | null;
  created_at: string;
};

export type SubscriptionAnalyticsDay = {
  date: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  revenue_cents: number;
  occupancy_rate: number;
};

export type SubscriptionAnalyticsSummary = {
  days: SubscriptionAnalyticsDay[];
  totals: {
    total_bookings: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    revenue_cents: number;
    avg_occupancy_rate: number;
  };
};
