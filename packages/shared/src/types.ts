export type Locale = "ru" | "en";

export type UserRole = "user" | "restaurant_owner" | "admin";

export type RestaurantStatus = "draft" | "pending" | "active" | "suspended";

export type BookingStatus = "confirmed" | "cancelled" | "completed";

export type RestaurantTable = {
  id: string;
  zone_en: string;
  zone_ru: string;
  capacity: number;
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
  user_id: string;
  table_id: string;
  date: string;
  time: string;
  guests: number;
  source: BookingSource;
  status: BookingStatus;
  revenue_cents: number;
  cancelled_at: string | null;
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

export type User = {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  full_name: string | null;
  phone: string | null;
  email_verified: boolean;
  locale: Locale;
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
};
