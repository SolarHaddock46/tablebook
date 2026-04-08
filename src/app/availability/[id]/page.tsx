import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Clock, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase";
import { type Locale, type Restaurant } from "@/lib/types";
import { t } from "@/lib/i18n";
import { getRestaurantName } from "@/lib/restaurant-view";

type SearchParams = { locale?: string; date?: string; time?: string; guests?: string; table_id?: string };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function AvailabilityPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const queryParams = await searchParams;
  const locale: Locale = queryParams.locale === "en" ? "en" : "ru";
  const dict = t(locale);
  const date = queryParams.date ?? new Date().toISOString().slice(0, 10);
  const guests = Number(queryParams.guests ?? "2");
  const requestedTime = queryParams.time ?? "19:00";
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("restaurants").select("*").eq("id", routeParams.id).single();
  const restaurant = data as Restaurant | null;

  if (!restaurant) {
    redirect(`/results?locale=${locale}`);
  }
  if (!restaurant.has_availability) {
    redirect(`/no-availability/${restaurant.id}?locale=${locale}&date=${date}&guests=${guests}`);
  }

  const selectedTableId = queryParams.table_id ?? restaurant.tables[0]?.id;
  const selectedTable =
    restaurant.tables.find((table) => table.id === selectedTableId) ?? restaurant.tables[0];
  const restaurantName = getRestaurantName(restaurant, locale);
  if (!selectedTable) {
    redirect(`/no-availability/${restaurant.id}?locale=${locale}&date=${date}&guests=${guests}`);
  }

  return (
    <section className="space-y-4">
      <Link
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        href={`/results?locale=${locale}&date=${date}&time=${requestedTime}&guests=${guests}`}
      >
        <ArrowLeft className="h-4 w-4" />
        {dict.back}
      </Link>
      <h1 className="text-2xl font-semibold text-slate-100">{restaurantName}</h1>
      <p className="text-sm text-slate-400">
        {dict.availability}: {date}, {guests} {dict.forGuests}
      </p>
      <div className="space-y-3">
        {restaurant.tables.map((table) => {
          const zone = locale === "ru" ? table.zone_ru : table.zone_en;
          const isSelected = selectedTable?.id === table.id;
          return (
            <Link
              key={table.id}
              href={`/availability/${restaurant.id}?locale=${locale}&date=${date}&time=${requestedTime}&guests=${guests}&table_id=${table.id}`}
              className={`block rounded-2xl border-2 p-4 ${
                isSelected ? "border-cyan-400 bg-cyan-500/10" : "border-slate-700 bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-100">{zone}</p>
                  <p className="mt-1 flex items-center gap-4 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {table.capacity} {dict.forGuests}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {table.time}
                    </span>
                  </p>
                </div>
                {isSelected ? (
                  <span className="rounded-full bg-cyan-300 p-1.5">
                    <Check className="h-4 w-4 text-slate-900" />
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
      <form action="/api/bookings" method="post">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="restaurant_id" value={restaurant.id} />
        <input type="hidden" name="table_id" value={selectedTable.id} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="time" value={selectedTable.time} />
        <input type="hidden" name="guests" value={guests} />
        <input type="hidden" name="source" value="direct" />
        <input type="hidden" name="revenue_cents" value={3500} />
        <button
          type="submit"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-300 px-4 py-3 font-semibold text-slate-950"
        >
          <Check className="h-4 w-4" />
          {dict.confirmation}
        </button>
      </form>
    </section>
  );
}
