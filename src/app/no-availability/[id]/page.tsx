import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Sparkles, Star, Zap } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase";
import { logEvent } from "@/lib/events";
import { t } from "@/lib/i18n";
import { type Locale, type Restaurant } from "@/lib/types";
import {
  computeAlternatives,
  getPriceLabel,
  getRestaurantCuisine,
  getRestaurantName
} from "@/lib/restaurant-view";

type SearchParams = { locale?: string; date?: string; guests?: string };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function NoAvailabilityPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const queryParams = await searchParams;
  const locale: Locale = queryParams.locale === "en" ? "en" : "ru";
  const dict = t(locale);
  const date = queryParams.date ?? new Date().toISOString().slice(0, 10);
  const guests = Number(queryParams.guests ?? "2");
  const supabase = createSupabaseServerClient();
  const { data: selected } = await supabase.from("restaurants").select("*").eq("id", routeParams.id).single();
  const restaurant = selected as Restaurant | null;

  if (!restaurant) {
    return <p>Not found</p>;
  }

  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .limit(30);
  const alternatives = computeAlternatives(restaurant, (data ?? []) as Restaurant[], {
    sameCuisine: dict.sameCuisine,
    sameDistrict: dict.sameDistrict,
    nearby: dict.nearby,
    similarPrice: dict.similarPrice,
    samePrice: dict.samePrice,
    highRating: dict.highRating
  });

  await logEvent("alternatives_shown", {
    restaurant_id: restaurant.id,
    request_filters: { district: restaurant.district_en, cuisine: restaurant.cuisine_en },
    alternative_ids: alternatives.map((item) => item.id)
  });

  return (
    <section className="space-y-4">
      <Link
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        href={`/results?locale=${locale}&date=${date}&guests=${guests}`}
      >
        <ArrowLeft className="h-4 w-4" />
        {dict.back}
      </Link>
      <h1 className="text-2xl font-semibold text-slate-100">{getRestaurantName(restaurant, locale)}</h1>
      <p className="text-sm text-rose-300">{dict.noSpotsForDate}</p>
      <div className="rounded-2xl bg-gradient-to-r from-violet-700 via-violet-600 to-violet-800 p-4 shadow-2xl">
        <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-amber-300" />
          {dict.alternatives}
        </p>
        <p className="text-sm text-violet-100">{dict.alternativesHint}</p>
      </div>
      <ul className="space-y-3">
        {alternatives.map((alternative) => {
          const name = locale === "ru" ? alternative.name_ru : alternative.name_en;
          return (
            <li className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-xl" key={alternative.id}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-100">{name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      alternative.matchScore >= 80
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {alternative.matchScore}% {dict.matching}
                  </span>
                </div>
                <p className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {alternative.rating.toFixed(1)}
                  </span>
                  <span>{getRestaurantCuisine(alternative, locale)}</span>
                  <span>{getPriceLabel(alternative.price_level)}</span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {alternative.distance_km.toFixed(1)} km
                  </span>
                </p>
                <p className="inline-flex items-center gap-1 text-sm text-cyan-300">
                  <Clock className="h-3.5 w-3.5" />
                  {dict.availableTimes}: {alternative.tables.map((table) => table.time).join(", ")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {alternative.matchReasons.map((reason) => (
                    <span key={`${alternative.id}-${reason}`} className="rounded-md bg-violet-500/20 px-2 py-1 text-xs text-violet-200">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              <form action="/api/bookings" method="post" className="mt-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="restaurant_id" value={alternative.id} />
                <input type="hidden" name="table_id" value={alternative.tables[0]?.id ?? "A1"} />
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="time" value={alternative.tables[0]?.time ?? "19:00"} />
                <input type="hidden" name="guests" value={guests} />
                <input type="hidden" name="source" value="ai-alternative" />
                <input type="hidden" name="revenue_cents" value={3500} />
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-violet-500 px-3 py-2 font-semibold text-white"
                  type="submit"
                >
                  <Zap className="h-4 w-4" />
                  {dict.quickBookFull}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      <Link href={`/search?locale=${locale}`}>{dict.newSearch}</Link>
    </section>
  );
}
