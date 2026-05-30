import {
  CUISINE_FILTER_OPTIONS,
  DISTRICT_FILTER_OPTIONS,
  PRICE_LEVEL_FILTER_OPTIONS,
  type FilterOption,
  type Locale
} from "@tablebook/shared";

export function buildFilterOptions(
  options: readonly FilterOption[] | typeof PRICE_LEVEL_FILTER_OPTIONS,
  locale: Locale,
  anyLabel: string
): Array<{ id: string; title: string }> {
  return [
    { id: "", title: anyLabel },
    ...options.map((item) => ({
      id: String(item.id),
      title: locale === "ru" ? item.titleRu : item.titleEn
    }))
  ];
}

export function buildCuisineOptions(locale: Locale, anyLabel: string) {
  return buildFilterOptions(CUISINE_FILTER_OPTIONS, locale, anyLabel);
}

export function buildDistrictOptions(locale: Locale, anyLabel: string) {
  return buildFilterOptions(DISTRICT_FILTER_OPTIONS, locale, anyLabel);
}

export function buildPriceLevelOptions(locale: Locale, anyLabel: string) {
  return buildFilterOptions(PRICE_LEVEL_FILTER_OPTIONS, locale, anyLabel);
}

export function localizedTitle<T extends { titleRu: string; titleEn: string }>(
  item: T,
  locale: Locale
): string {
  return locale === "ru" ? item.titleRu : item.titleEn;
}
