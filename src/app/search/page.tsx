import { Clock, DollarSign, Search, Users, Utensils, MapPin } from "lucide-react";
import { type Locale } from "@/lib/types";
import { t } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";

type SearchParams = {
  locale?: string;
  date?: string;
  time?: string;
  guests?: string;
  price?: string;
  cuisine?: string;
  district?: string;
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale: Locale = params.locale === "en" ? "en" : "ru";
  const dict = t(locale);
  const defaultDate = params.date ?? new Date().toISOString().slice(0, 10);
  const defaultTime = params.time ?? Constants.DefaultTime;
  const defaultGuests = params.guests ?? String(Constants.DefaultGuests);
  const defaultPrice = params.price ?? "all";
  const defaultCuisine = params.cuisine ?? "";
  const defaultDistrict = params.district ?? "";
  const guestsRange = getGuestsInputRange();
  const cuisineOptions = getCuisineOptions(locale);
  const districtOptions = getDistrictOptions(locale);

  return (
    <section className="space-y-5">
      <header className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-300 p-2">
            <Utensils className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">TableBook</h1>
            <p className="text-xs text-slate-400">{dict.findRestaurant}</p>
          </div>
        </div>
        <LocaleSwitcher locale={locale} />
      </header>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-slate-100">{dict.findRestaurant}</h2>
        <p className="text-sm text-slate-400">{dict.searchHint}</p>
      </div>
      <form action="/results" className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-2xl sm:p-5">
        <input type="hidden" name="locale" value={locale} />
        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <Utensils className="h-4 w-4 text-cyan-300" />
            {dict.cuisine}
          </span>
          <select name="cuisine" defaultValue={defaultCuisine} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2">
            <option value="">{dict.any}</option>
            {cuisineOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="h-4 w-4 text-cyan-300" />
            {dict.district}
          </span>
          <select name="district" defaultValue={defaultDistrict} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2">
            <option value="">{dict.any}</option>
            {districtOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="h-4 w-4 text-cyan-300" />
              {dict.date}
            </span>
            <input type="date" name="date" defaultValue={defaultDate} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="h-4 w-4 text-cyan-300" />
              {dict.time}
            </span>
            <input type="time" name="time" defaultValue={defaultTime} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <Users className="h-4 w-4 text-cyan-300" />
              {dict.guests}
            </span>
            <input
              type="number"
              name="guests"
              min={guestsRange.min}
              max={guestsRange.max}
              defaultValue={defaultGuests}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <DollarSign className="h-4 w-4 text-cyan-300" />
              {dict.price}
            </span>
            <select name="price" defaultValue={defaultPrice} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2">
              <option value="all">{dict.any}</option>
              <option value="1">$</option>
              <option value="2">$$</option>
              <option value="3">$$$</option>
              <option value="4">$$$$</option>
            </select>
          </label>
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-300 px-4 py-3 font-semibold text-slate-950"
          type="submit"
        >
          <Search className="h-4 w-4" />
          {dict.findRestaurant}
        </button>
      </form>
    </section>
  );
}

enum Constants {
  DefaultGuests = 2,
  DefaultTime = "19:00",
  MinGuests = 1,
  MaxGuests = 20
}

function getGuestsInputRange() {
  return { min: Constants.MinGuests, max: Constants.MaxGuests };
}

function getCuisineOptions(locale: Locale): string[] {
  if (locale === "ru") {
    return ["Итальянская", "Японская", "Французская", "Грузинская", "Русская", "Средиземноморская"];
  }
  return ["Italian", "Japanese", "French", "Georgian", "Russian", "Mediterranean"];
}

function getDistrictOptions(locale: Locale): string[] {
  if (locale === "ru") {
    return ["Тверской", "Арбат", "Басманный", "Таганский", "Хамовники", "Пресненский"];
  }
  return ["Tverskoy", "Arbat", "Basmanny", "Tagansky", "Khamovniki", "Presnensky"];
}
