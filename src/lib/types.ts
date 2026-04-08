export type Locale = "ru" | "en";

export type RestaurantTable = {
  id: string;
  zone_en: string;
  zone_ru: string;
  capacity: number;
  time: string;
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
  distance_km: number;
  has_availability: boolean;
  tables: RestaurantTable[];
  lat: number;
  lng: number;
  created_at: string;
};

export type BookingSource = "direct" | "ai-alternative" | "quick-book";

export type BookingInput = {
  restaurant_id: string;
  table_id: string;
  date: string;
  time: string;
  guests: number;
  source: BookingSource;
  revenue_cents: number;
};
