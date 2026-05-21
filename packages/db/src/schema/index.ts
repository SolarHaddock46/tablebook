import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "restaurant_owner", "admin"]);

export const bookingStatusEnum = pgEnum("booking_status", ["confirmed", "cancelled", "completed"]);

export const restaurantStatusEnum = pgEnum("restaurant_status", [
  "draft",
  "pending",
  "active",
  "suspended"
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  displayName: text("display_name"),
  locale: text("locale").notNull().default("ru"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameRu: text("name_ru").notNull(),
  cuisineEn: text("cuisine_en").notNull(),
  cuisineRu: text("cuisine_ru").notNull(),
  districtEn: text("district_en").notNull(),
  districtRu: text("district_ru").notNull(),
  priceLevel: integer("price_level").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull().default("4.0"),
  reviewCount: integer("review_count").notNull().default(0),
  distanceKm: numeric("distance_km", { precision: 4, scale: 2 }).notNull(),
  hasAvailability: boolean("has_availability").notNull().default(false),
  tables: jsonb("tables").notNull().default([]),
  lat: numeric("lat", { precision: 8, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 8, scale: 6 }).notNull(),
  ownerId: uuid("owner_id").references(() => users.id),
  status: restaurantStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tableId: text("table_id").notNull(),
    date: date("date").notNull(),
    time: time("time").notNull(),
    guests: integer("guests").notNull(),
    source: text("source").notNull(),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
    revenueCents: integer("revenue_cents").notNull().default(0),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("idx_bookings_slot")
      .on(table.restaurantId, table.tableId, table.date, table.time)
      .where(sql`${table.status} = 'confirmed'`)
  ]
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("reviews_restaurant_user").on(table.restaurantId, table.userId)]
);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventName: text("event_name").notNull(),
  payload: jsonb("payload").notNull().default({}),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const subscriptionsRevenue = pgTable("subscriptions_revenue", {
  month: text("month").notNull(),
  totalRevenueCents: integer("total_revenue_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export type UserRow = typeof users.$inferSelect;
export type RestaurantRow = typeof restaurants.$inferSelect;
export type BookingRow = typeof bookings.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
