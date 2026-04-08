import Link from "next/link";
import { ArrowLeft, ChevronRight, MapPin, Star, Utensils } from "lucide-react";
import { Constants } from "@/lib/constants";
import { t } from "@/lib/i18n";
import {
  getPriceLabel,
  getRestaurantCuisine,
  getRestaurantDistrict,
  getRestaurantName
} from "@/lib/restaurant-view";
import { createSupabaseServerClient } from "@/lib/supabase";
import { type Locale, type Restaurant } from "@/lib/types";

type SearchParams = {
  cuisine?: string;
  district?: string;
  locale?: string;
  date?: string;
  time?: string;
  guests?: string;
  price?: string;
  limit?: string;
  offset?: string;
};

export default async function ResultsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale: Locale = params.locale === "en" ? "en" : "ru";
  const dict = t(locale);
  const cuisine = params.cuisine?.trim();
  const district = params.district?.trim();
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const time = params.time ?? "19:00";
  const guests = params.guests ?? "2";
  const price = params.price ?? "all";
  const limit = Math.min(Number(params.limit || Constants.DefaultLimit), Constants.MaxLimit);
  const offset = Math.max(0, Number(params.offset || 0));
  const supabase = createSupabaseServerClient();
  let query = supabase.from("restaurants").select("*").range(offset, offset + limit - 1);

  if (cuisine) {
    query = query.or(`cuisine_en.ilike.%${cuisine}%,cuisine_ru.ilike.%${cuisine}%`);
  }
  if (district) {
    query = query.or(`district_en.ilike.%${district}%,district_ru.ilike.%${district}%`);
  }
  if (price !== "all") {
    query = query.eq("price_level", Number(price));
  }

  const { data } = await query;
  const restaurants: Restaurant[] = data ?? [];

  return (
    <section className="space-y-4">
      <div className="mb-1 flex items-center justify-between">
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
          href={`/search?locale=${locale}&date=${date}&time=${time}&guests=${guests}&price=${price}&cuisine=${cuisine ?? ""}&district=${district ?? ""}`}
        >
          <ArrowLeft className="h-4 w-4" />
          {dict.back}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-slate-100">{dict.results}</h1>
      <p className="text-sm text-slate-400">
        {dict.found} {restaurants.length}
      </p>
      {!restaurants.length ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="font-medium text-slate-200">{dict.noData}</p>
          <p className="text-sm text-slate-400">{dict.noDataHint}</p>
        </div>
      ) : null}
      <ul className="space-y-3">
        {restaurants.map((restaurant) => (
          <li className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-xl" key={restaurant.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-slate-100">{getRestaurantName(restaurant, locale)}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      restaurant.has_availability
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {restaurant.has_availability ? dict.available : dict.unavailable}
                  </span>
                </div>
                <p className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {restaurant.rating.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Utensils className="h-3.5 w-3.5 text-cyan-300" />
                    {getRestaurantCuisine(restaurant, locale)}
                  </span>
                  <span>{getPriceLabel(restaurant.price_level)}</span>
                </p>
                <p className="inline-flex items-center gap-1 text-sm text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {getRestaurantDistrict(restaurant, locale)}, {restaurant.distance_km.toFixed(1)} km
                </p>
              </div>
              <Link
                aria-label={dict.view}
                className="rounded-xl bg-slate-900 p-3 text-cyan-300"
                href={`/availability/${restaurant.id}?locale=${locale}&date=${date}&time=${time}&guests=${guests}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
