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
