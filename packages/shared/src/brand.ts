import type { Locale } from "./types";

export function getBrandName(locale: Locale): string {
  return locale === "ru" ? Constants.BrandRu : Constants.BrandEn;
}

enum Constants {
  BrandRu = "ЗаСтолом",
  BrandEn = "TableBook"
}
