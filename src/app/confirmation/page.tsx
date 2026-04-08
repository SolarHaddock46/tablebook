import Link from "next/link";
import { Check } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase";
import { t } from "@/lib/i18n";
import { type Locale, type Restaurant } from "@/lib/types";
import { getRestaurantName } from "@/lib/restaurant-view";

type SearchParams = {
  locale?: string;
  restaurant_id?: string;
  booking_id?: string;
  date?: string;
  time?: string;
  guests?: string;
  source?: string;
  table_id?: string;
};

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale: Locale = params.locale === "en" ? "en" : "ru";
  const dict = t(locale);
  const source = params.source ?? "direct";
  const guests = params.guests ?? "2";
  const date = params.date ?? "-";
  const time = params.time ?? "-";
  const tableId = params.table_id ?? "-";
  const supabase = createSupabaseServerClient();

  let restaurantName = "-";
  if (params.restaurant_id) {
    const { data } = await supabase.from("restaurants").select("*").eq("id", params.restaurant_id).single();
    if (data) {
      restaurantName = getRestaurantName(data as Restaurant, locale);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col items-center pt-2 text-center">
        <span className="mb-3 rounded-full bg-emerald-500/15 p-4">
          <Check className="h-8 w-8 text-emerald-400" />
        </span>
        <h1 className="text-2xl font-semibold text-slate-100">{dict.confirmedTitle}</h1>
        <p className="text-sm text-slate-400">{dict.confirmedHint}</p>
      </div>
      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-xl">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{dict.bookingDetails}</h2>
        <div className="space-y-2 text-sm">
          <ConfirmationRow label="Restaurant" value={restaurantName} />
          <ConfirmationRow label={dict.date} value={date} />
          <ConfirmationRow label={dict.time} value={time} />
          <ConfirmationRow label={dict.guests} value={guests} />
          <ConfirmationRow label="Table" value={tableId} />
          <ConfirmationRow
            label={dict.source}
            value={source === "ai-alternative" ? dict.sourceAlternative : dict.sourceDirect}
            highlighted
          />
        </div>
      </div>
      <Link
        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-300 px-4 py-3 font-semibold text-slate-900"
        href={`/search?locale=${locale}`}
      >
        {dict.newSearch}
      </Link>
    </section>
  );
}

function ConfirmationRow({ label, value, highlighted }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700/70 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className={highlighted ? "rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200" : "text-slate-100"}>
        {value}
      </span>
    </div>
  );
}
