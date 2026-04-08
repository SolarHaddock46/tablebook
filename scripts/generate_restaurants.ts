import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { faker } from "@faker-js/faker";

type RestaurantTable = {
  id: string;
  zone_en: string;
  zone_ru: string;
  capacity: number;
  time: string;
};

type Restaurant = {
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

const cuisinePairs: ReadonlyArray<[string, string]> = [
  ["Italian", "Итальянская"],
  ["Japanese", "Японская"],
  ["Georgian", "Грузинская"],
  ["Russian", "Русская"],
  ["French", "Французская"],
  ["Mediterranean", "Средиземноморская"]
];

const districtPairs: ReadonlyArray<[string, string]> = [
  ["Tverskoy", "Тверской"],
  ["Arbat", "Арбат"],
  ["Basmanny", "Басманный"],
  ["Tagansky", "Таганский"],
  ["Khamovniki", "Хамовники"],
  ["Presnensky", "Пресненский"]
];

function parseCountArg(): number {
  const arg = process.argv.find((item) => item.startsWith("--count="));
  const value = Number(arg?.split("=")[1] ?? "1000");
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1000;
}

function randomLat(): number {
  return Number(faker.number.float({ min: 55.55, max: 55.95, fractionDigits: 6 }));
}

function randomLng(): number {
  return Number(faker.number.float({ min: 37.35, max: 37.85, fractionDigits: 6 }));
}

function randomTables(): RestaurantTable[] {
  return Array.from({ length: faker.number.int({ min: 1, max: 4 }) }).map((_, index) => ({
    id: `T${index + 1}`,
    zone_en: faker.helpers.arrayElement(["Main Hall", "Window", "Terrace", "Bar"]),
    zone_ru: faker.helpers.arrayElement(["Основной зал", "Окно", "Терраса", "Бар"]),
    capacity: faker.number.int({ min: 2, max: 8 }),
    time: faker.helpers.arrayElement(["18:00", "18:30", "19:00", "19:30", "20:00"])
  }));
}

function generateRestaurant(): Restaurant {
  const cuisine = faker.helpers.arrayElement(cuisinePairs);
  const district = faker.helpers.arrayElement(districtPairs);
  return {
    id: faker.string.uuid(),
    name_en: `${faker.company.name()} Restaurant`,
    name_ru: `${faker.company.name()} Ресторан`,
    cuisine_en: cuisine[0],
    cuisine_ru: cuisine[1],
    district_en: district[0],
    district_ru: district[1],
    price_level: faker.number.int({ min: 1, max: 4 }),
    rating: Number(faker.number.float({ min: 3, max: 5, fractionDigits: 1 })),
    distance_km: Number(faker.number.float({ min: 0.2, max: 20, fractionDigits: 2 })),
    has_availability: faker.datatype.boolean(0.7),
    tables: randomTables(),
    lat: randomLat(),
    lng: randomLng(),
    created_at: new Date().toISOString()
  };
}

function run() {
  const count = parseCountArg();
  const restaurants = Array.from({ length: count }).map(() => generateRestaurant());
  const fixturesDir = path.join(process.cwd(), "fixtures");
  fs.mkdirSync(fixturesDir, { recursive: true });
  const jsonPath = path.join(fixturesDir, "restaurants.json");
  const gzPath = path.join(fixturesDir, "restaurants.json.gz");
  const json = JSON.stringify(restaurants, null, 2);
  fs.writeFileSync(jsonPath, json, "utf-8");
  fs.writeFileSync(gzPath, zlib.gzipSync(Buffer.from(json, "utf-8")));
  process.stdout.write(`Generated ${count} restaurants to fixtures/restaurants.json(.gz)\n`);
}

run();
