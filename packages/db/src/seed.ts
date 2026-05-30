import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { getDb, closeDb } from "./client";
import { recalculateRestaurantRating } from "./reviews";
import { bookings, restaurants, restaurantSubscriptions, reviews, subscriptionPlans, users } from "./schema/index";

type SeedUser = {
  email: string;
  displayName: string;
};

type TestRestaurant = {
  id: string;
  nameEn: string;
  nameRu: string;
  cuisineEn: string;
  cuisineRu: string;
  districtEn: string;
  districtRu: string;
  priceLevel: number;
  rating: string;
  distanceKm: string;
  lat: string;
  lng: string;
  tables: Array<{ id: string; zone_en: string; zone_ru: string; capacity: number }>;
  isOwnerDemo?: boolean;
};

const Constants = {
  TestRestaurantCount: 10,
  SeedPassword: "Test1234!",
  FullEveningProbability: 0.5,
  FullEveningDayMinOffset: 1,
  FullEveningDayMaxOffset: 6
} as const;

const BookingTimeOptions = ["18:00", "19:00", "20:00", "21:00"] as const;

const TestRestaurants: TestRestaurant[] = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    nameEn: "TableBook Demo Bistro",
    nameRu: "ЗаСтолом Бистро",
    cuisineEn: "European",
    cuisineRu: "Европейская",
    districtEn: "Center",
    districtRu: "Центр",
    priceLevel: 2,
    rating: "4.6",
    distanceKm: "0.8",
    lat: "55.755800",
    lng: "37.617600",
    isOwnerDemo: true,
    tables: [
      { id: "demo-t1", zone_en: "Main Hall", zone_ru: "Основной зал", capacity: 2 },
      { id: "demo-t2", zone_en: "Window", zone_ru: "У окна", capacity: 4 },
      { id: "demo-t3", zone_en: "Terrace", zone_ru: "Терраса", capacity: 6 }
    ]
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    nameEn: "Arbat Garden",
    nameRu: "Сад на Арбате",
    cuisineEn: "Italian",
    cuisineRu: "Итальянская",
    districtEn: "Arbat",
    districtRu: "Арбат",
    priceLevel: 3,
    rating: "4.8",
    distanceKm: "1.2",
    lat: "55.752200",
    lng: "37.591400",
    tables: [
      { id: "arb-t1", zone_en: "Main Hall", zone_ru: "Основной зал", capacity: 2 },
      { id: "arb-t2", zone_en: "Bar", zone_ru: "Барная зона", capacity: 4 }
    ]
  },
  {
    id: "11111111-1111-1111-1111-111111111103",
    nameEn: "Taganka House",
    nameRu: "Дом на Таганке",
    cuisineEn: "Georgian",
    cuisineRu: "Грузинская",
    districtEn: "Taganka",
    districtRu: "Таганка",
    priceLevel: 2,
    rating: "4.5",
    distanceKm: "2.1",
    lat: "55.741000",
    lng: "37.653000",
    tables: [
      { id: "tag-t1", zone_en: "Main Hall", zone_ru: "Зал", capacity: 4 },
      { id: "tag-t2", zone_en: "Private Room", zone_ru: "Приватная комната", capacity: 6 }
    ]
  },
  {
    id: "11111111-1111-1111-1111-111111111104",
    nameEn: "Tverskaya Sushi",
    nameRu: "Суши на Тверской",
    cuisineEn: "Japanese",
    cuisineRu: "Японская",
    districtEn: "Tverskaya",
    districtRu: "Тверская",
    priceLevel: 4,
    rating: "4.7",
    distanceKm: "0.5",
    lat: "55.760100",
    lng: "37.609300",
    tables: [
      { id: "tvr-t1", zone_en: "Counter", zone_ru: "Барная стойка", capacity: 2 },
      { id: "tvr-t2", zone_en: "Main Hall", zone_ru: "Зал", capacity: 4 }
    ]
  },
  {
    id: "11111111-1111-1111-1111-111111111105",
    nameEn: "Center Lunch",
    nameRu: "Обед в центре",
    cuisineEn: "European",
    cuisineRu: "Европейская",
    districtEn: "Center",
    districtRu: "Центр",
    priceLevel: 1,
    rating: "4.2",
    distanceKm: "1.0",
    lat: "55.757000",
    lng: "37.620000",
    tables: [
      { id: "ctr-t1", zone_en: "Main Hall", zone_ru: "Зал", capacity: 2 },
      { id: "ctr-t2", zone_en: "Window", zone_ru: "У окна", capacity: 4 }
    ]
  },
  {
    id: "11111111-1111-1111-1111-111111111106",
    nameEn: "Pasta Arbat",
    nameRu: "Паста на Арбате",
    cuisineEn: "Italian",
    cuisineRu: "Итальянская",
    districtEn: "Arbat",
    districtRu: "Арбат",
    priceLevel: 2,
    rating: "4.4",
    distanceKm: "1.5",
    lat: "55.751000",
    lng: "37.595000",
    tables: [
      { id: "pas-t1", zone_en: "Main Hall", zone_ru: "Зал", capacity: 2 },
      { id: "pas-t2", zone_en: "Terrace", zone_ru: "Терраса", capacity: 4 }
    ]
  },
  {
    id: "11111111-1111-1111-1111-111111111107",
    nameEn: "Khinkali Point",
    nameRu: "Хинкали поинт",
    cuisineEn: "Georgian",
    cuisineRu: "Грузинская",
    districtEn: "Taganka",
    districtRu: "Таганка",
    priceLevel: 1,
    rating: "4.3",
    distanceKm: "2.4",
    lat: "55.742500",
    lng: "37.655500",
    tables: [
      { id: "khi-t1", zone_en: "Main Hall", zone_ru: "Зал", capacity: 4 },
      { id: "khi-t2", zone_en: "Bar", zone_ru: "Бар", capacity: 2 }
    ]
  },
  {
    id: "11111111-1111-1111-1111-111111111108",
    nameEn: "Ramen Tverskaya",
    nameRu: "Рамен Тверская",
    cuisineEn: "Japanese",
    cuisineRu: "Японская",
    districtEn: "Tverskaya",
    districtRu: "Тверская",
    priceLevel: 2,
    rating: "4.6",
    distanceKm: "0.7",
    lat: "55.761000",
    lng: "37.611000",
    tables: [
      { id: "ram-t1", zone_en: "Main Hall", zone_ru: "Зал", capacity: 2 },
      { id: "ram-t2", zone_en: "Counter", zone_ru: "Стойка", capacity: 4 }
    ]
  },
  {
    id: "11111111-1111-1111-1111-111111111109",
    nameEn: "Business Plate",
    nameRu: "Бизнес обед",
    cuisineEn: "European",
    cuisineRu: "Европейская",
    districtEn: "Center",
    districtRu: "Центр",
    priceLevel: 3,
    rating: "4.1",
    distanceKm: "0.9",
    lat: "55.756500",
    lng: "37.615500",
    tables: [
      { id: "biz-t1", zone_en: "Main Hall", zone_ru: "Зал", capacity: 2 },
      { id: "biz-t2", zone_en: "Private Room", zone_ru: "Кабинет", capacity: 6 }
    ]
  },
  {
    id: "11111111-1111-1111-1111-111111111110",
    nameEn: "Trattoria Night",
    nameRu: "Траттория Ночь",
    cuisineEn: "Italian",
    cuisineRu: "Итальянская",
    districtEn: "Arbat",
    districtRu: "Арбат",
    priceLevel: 4,
    rating: "4.9",
    distanceKm: "1.3",
    lat: "55.750500",
    lng: "37.592500",
    tables: [
      { id: "tra-t1", zone_en: "Main Hall", zone_ru: "Зал", capacity: 2 },
      { id: "tra-t2", zone_en: "Wine Room", zone_ru: "Винный зал", capacity: 4 },
      { id: "tra-t3", zone_en: "Terrace", zone_ru: "Терраса", capacity: 6 }
    ]
  }
];

async function run() {
  const db = getDb();
  const seededPasswordHash = await bcrypt.hash(Constants.SeedPassword, 10);
  const ownerEmail = "demo.owner@tablebook.local";

  await db.delete(restaurants);
  process.stdout.write("Removed all previous restaurants (bookings/reviews cascaded)\n");

  const [ownerRow] = await db
    .insert(users)
    .values({
      email: ownerEmail,
      displayName: "Demo Owner",
      locale: "ru",
      role: "restaurant_owner",
      passwordHash: seededPasswordHash
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        displayName: "Demo Owner",
        locale: "ru",
        role: "restaurant_owner",
        passwordHash: seededPasswordHash
      }
    })
    .returning({ id: users.id });

  const seedUsers: SeedUser[] = Array.from({ length: Constants.TestRestaurantCount }).map((_, index) => ({
    email: index === 0 ? "demo.user@tablebook.local" : `mock.user${index + 1}@tablebook.local`,
    displayName: index === 0 ? "Demo User" : `Mock User ${index + 1}`
  }));

  await db
    .insert(users)
    .values(
      seedUsers.map((item) => ({
        email: item.email,
        displayName: item.displayName,
        locale: "ru",
        role: "user" as const,
        passwordHash: seededPasswordHash
      }))
    )
    .onConflictDoUpdate({
      target: users.email,
      set: {
        locale: "ru",
        role: "user",
        passwordHash: seededPasswordHash
      }
    });

  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, [...seedUsers.map((item) => item.email), ownerEmail]));

  await db.insert(restaurants).values(
    TestRestaurants.map((item) => ({
      id: item.id,
      nameEn: item.nameEn,
      nameRu: item.nameRu,
      cuisineEn: item.cuisineEn,
      cuisineRu: item.cuisineRu,
      districtEn: item.districtEn,
      districtRu: item.districtRu,
      priceLevel: item.priceLevel,
      rating: item.rating,
      reviewCount: 0,
      distanceKm: item.distanceKm,
      hasAvailability: true,
      tables: item.tables,
      lat: item.lat,
      lng: item.lng,
      ownerId: item.isOwnerDemo ? ownerRow.id : null,
      status: "active" as const
    }))
  );

  const restaurantRows = await db
    .select({
      id: restaurants.id,
      tables: restaurants.tables
    })
    .from(restaurants);

  await seedSubscriptions(db, restaurantRows.map((row) => row.id));

  const todayIso = new Date().toISOString().slice(0, 10);
  const usedConfirmedSlots = new Set<string>();
  const createdBookings: Array<{ userId: string; restaurantId: string; date: string; status: string }> = [];
  const bookerUsers = userRows.filter((item) => item.email !== ownerEmail);

  const fullEveningSummary = await seedFullEvenings(db, {
    restaurants: restaurantRows,
    bookerUsers,
    usedConfirmedSlots,
    createdBookings,
    restaurantNames: new Map(TestRestaurants.map((item) => [item.id, item.nameRu]))
  });

  for (const user of bookerUsers) {
    const bookingCount = randomInt(1, 3);
    for (let index = 0; index < bookingCount; index += 1) {
      const restaurant = pickRandom(restaurantRows);
      if (!restaurant) continue;

      const tables = normalizeTables(restaurant.tables);
      const table = pickRandom(tables);
      if (!table) continue;

      const date = randomDateWithinDays(-7, 14);
      let status: "pending" | "confirmed" | "cancelled" | "completed" =
        date < todayIso
          ? "completed"
          : pickRandom(["pending", "confirmed", "cancelled"]) ?? "pending";
      const bookingTime = pickRandom([...BookingTimeOptions]) ?? "19:00";
      const slotKey = `${restaurant.id}:${table.id}:${date}:${bookingTime}`;
      if (status === "confirmed" && usedConfirmedSlots.has(slotKey)) {
        status = "cancelled";
      }
      if (status === "confirmed") {
        usedConfirmedSlots.add(slotKey);
      }

      try {
        await db.insert(bookings).values({
          restaurantId: restaurant.id,
          userId: user.id,
          tableId: table.id,
          date,
          time: bookingTime,
          guests: Math.max(1, Math.min(table.capacity, randomInt(1, table.capacity))),
          source: pickRandom(["direct", "ai-alternative", "quick-book"]) ?? "direct",
          status,
          revenueCents: randomInt(2500, 9500)
        });
        createdBookings.push({ userId: user.id, restaurantId: restaurant.id, date, status });
      } catch {
        // Skip slot collisions.
      }
    }
  }

  const reviewCandidates = shuffle(
    createdBookings.filter((item) => item.date < todayIso && (item.status === "completed" || item.status === "confirmed"))
  );
  const touchedRestaurants = new Set<string>();

  for (const booking of reviewCandidates.slice(0, 20)) {
    const rating = randomInt(3, 5);
    await db
      .insert(reviews)
      .values({
        restaurantId: booking.restaurantId,
        userId: booking.userId,
        rating,
        body: randomReviewText(rating)
      })
      .onConflictDoUpdate({
        target: [reviews.restaurantId, reviews.userId],
        set: { rating, body: randomReviewText(rating) }
      });
    touchedRestaurants.add(booking.restaurantId);
  }

  for (const restaurantId of touchedRestaurants) {
    await recalculateRestaurantRating(restaurantId);
  }

  process.stdout.write(`Seeded ${restaurantRows.length} test restaurants\n`);
  TestRestaurants.forEach((item) => {
    process.stdout.write(`- ${item.nameRu} (${item.cuisineRu}, ${item.districtRu})\n`);
  });
  if (fullEveningSummary.length > 0) {
    process.stdout.write("Full evening (all tables, 18:00-21:00):\n");
    fullEveningSummary.forEach((item) => {
      process.stdout.write(`- ${item.nameRu}: ${item.date}\n`);
    });
  } else {
    process.stdout.write("Full evening: none this seed run\n");
  }
  process.stdout.write(
    `Mock data: users=${userRows.length}, bookings=${createdBookings.length}, reviews=${touchedRestaurants.size}\n`
  );
  process.stdout.write(
    `Credentials:\n- user: demo.user@tablebook.local / ${Constants.SeedPassword}\n- owner: ${ownerEmail} / ${Constants.SeedPassword}\n`
  );

  await closeDb();
  process.stdout.write("Seed complete\n");
}

type SeedDb = ReturnType<typeof getDb>;

type FullEveningSeedInput = {
  restaurants: Array<{ id: string; tables: unknown }>;
  bookerUsers: Array<{ id: string; email: string }>;
  usedConfirmedSlots: Set<string>;
  createdBookings: Array<{ userId: string; restaurantId: string; date: string; status: string }>;
  restaurantNames: Map<string, string>;
};

async function seedFullEvenings(
  db: SeedDb,
  input: FullEveningSeedInput
): Promise<Array<{ nameRu: string; date: string }>> {
  const summary: Array<{ nameRu: string; date: string }> = [];
  if (input.bookerUsers.length === 0) {
    return summary;
  }

  let bookerIndex = 0;

  for (const restaurant of input.restaurants) {
    if (Math.random() >= Constants.FullEveningProbability) {
      continue;
    }

    const tables = normalizeTables(restaurant.tables);
    if (tables.length === 0) {
      continue;
    }

    const fullDate = randomDateWithinDays(
      Constants.FullEveningDayMinOffset,
      Constants.FullEveningDayMaxOffset
    );
    const nameRu = input.restaurantNames.get(restaurant.id) ?? restaurant.id;

    for (const table of tables) {
      for (const bookingTime of BookingTimeOptions) {
        const slotKey = `${restaurant.id}:${table.id}:${fullDate}:${bookingTime}`;
        if (input.usedConfirmedSlots.has(slotKey)) {
          continue;
        }

        const booker = input.bookerUsers[bookerIndex % input.bookerUsers.length]!;
        bookerIndex += 1;

        await db.insert(bookings).values({
          restaurantId: restaurant.id,
          userId: booker.id,
          tableId: table.id,
          date: fullDate,
          time: bookingTime,
          guests: table.capacity,
          source: "direct",
          status: "confirmed",
          revenueCents: randomInt(3000, 12000)
        });

        input.usedConfirmedSlots.add(slotKey);
        input.createdBookings.push({
          userId: booker.id,
          restaurantId: restaurant.id,
          date: fullDate,
          status: "confirmed"
        });
      }
    }

    summary.push({ nameRu, date: fullDate });
  }

  return summary;
}

function normalizeTables(raw: unknown): Array<{ id: string; capacity: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const capacity = Number(record.capacity ?? 2);
      const id = String(record.id ?? "");
      if (!id || !Number.isFinite(capacity) || capacity <= 0) return null;
      return { id, capacity };
    })
    .filter((item): item is { id: string; capacity: number } => item !== null);
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[randomInt(0, items.length - 1)] ?? null;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWithinDays(minOffset: number, maxOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + randomInt(minOffset, maxOffset));
  return date.toISOString().slice(0, 10);
}

function shuffle<T>(items: T[]): T[] {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [clone[index], clone[swapIndex]] = [clone[swapIndex]!, clone[index]!];
  }
  return clone;
}

function randomReviewText(rating: number): string {
  if (rating >= 5) return "Отличный сервис и очень вкусно.";
  if (rating === 4) return "В целом хорошо, вернусь еще.";
  return "Нормально, но есть куда улучшать.";
}

async function seedSubscriptions(db: ReturnType<typeof getDb>, restaurantIds: string[]) {
  const [trialPlan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, "trial"))
    .limit(1);

  if (!trialPlan || restaurantIds.length === 0) {
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db.insert(restaurantSubscriptions).values(
    restaurantIds.map((restaurantId) => ({
      restaurantId,
      planId: trialPlan.id,
      status: "trial" as const,
      expiresAt
    }))
  );
}

run().catch(async (error) => {
  process.stderr.write(`${String(error)}\n`);
  await closeDb();
  process.exit(1);
});
