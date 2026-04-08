"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type Locale } from "@/lib/types";

type Props = {
  locale: Locale;
};

export function LocaleSwitcher({ locale }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(nextLocale: Locale) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", nextLocale);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Select language">
      <button
        type="button"
        onClick={() => onChange("ru")}
        className={`rounded-lg border px-3 py-1 text-sm ${
          locale === "ru" ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-slate-600 bg-slate-800 text-slate-200"
        }`}
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-lg border px-3 py-1 text-sm ${
          locale === "en" ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-slate-600 bg-slate-800 text-slate-200"
        }`}
      >
        EN
      </button>
    </div>
  );
}
