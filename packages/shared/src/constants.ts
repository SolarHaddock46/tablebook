export type FilterOption = {
  id: string;
  titleRu: string;
  titleEn: string;
};

export const CUISINE_FILTER_OPTIONS: FilterOption[] = [
  { id: "European", titleRu: "Европейская", titleEn: "European" },
  { id: "Italian", titleRu: "Итальянская", titleEn: "Italian" },
  { id: "Georgian", titleRu: "Грузинская", titleEn: "Georgian" },
  { id: "Japanese", titleRu: "Японская", titleEn: "Japanese" }
];

export const DISTRICT_FILTER_OPTIONS: FilterOption[] = [
  { id: "Center", titleRu: "Центр", titleEn: "Center" },
  { id: "Arbat", titleRu: "Арбат", titleEn: "Arbat" },
  { id: "Taganka", titleRu: "Таганка", titleEn: "Taganka" },
  { id: "Tverskaya", titleRu: "Тверская", titleEn: "Tverskaya" }
];

export const PRICE_LEVEL_FILTER_OPTIONS = [
  { id: 1, titleRu: "$", titleEn: "$" },
  { id: 2, titleRu: "$$", titleEn: "$$" },
  { id: 3, titleRu: "$$$", titleEn: "$$$" },
  { id: 4, titleRu: "$$$$", titleEn: "$$$$" }
] as const;

export enum Constants {
  DefaultLimit = 20,
  MaxLimit = 100,
  MobileBreakpoint = 640,
  TabletBreakpoint = 1024
}
