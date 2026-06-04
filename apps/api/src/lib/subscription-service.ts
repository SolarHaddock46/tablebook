import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  bookings,
  getDb,
  mapBlacklistEntry,
  mapRestaurantSubscription,
  mapSubscriptionAnalyticsDay,
  mapSubscriptionPlan,
  restaurantBlacklist,
  restaurants,
  restaurantSubscriptions,
  subscriptionAnalytics,
  subscriptionPayments,
  subscriptionPlans
} from "@tablebook/db";
import type { RestaurantSubscriptionRow, SubscriptionPlanRow } from "@tablebook/db";
import {
  canAcceptBooking,
  isPremiumSubscription,
  isSubscriptionActive,
  SubscriptionConstants,
  type SubscriptionAnalyticsSummary,
  type SubscriptionPlanType
} from "@tablebook/shared";

export class SubscriptionError extends Error {
  constructor(
    message: string,
    readonly status = 403,
    readonly code?: string
  ) {
    super(message);
  }
}

type SubscriptionWithPlan = {
  subscription: RestaurantSubscriptionRow;
  plan: SubscriptionPlanRow;
};

export async function getSubscriptionPlans() {
  const db = getDb();
  const rows = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.priceCents);
  return rows.map(mapSubscriptionPlan);
}

export async function getPlanById(planId: string) {
  const db = getDb();
  const [row] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
  return row ?? null;
}

export async function getPlanByName(name: SubscriptionPlanType) {
  const db = getDb();
  const [row] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, name)).limit(1);
  return row ?? null;
}

export async function getOwnerRestaurantId(ownerId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(eq(restaurants.ownerId, ownerId))
    .limit(1);
  return row?.id ?? null;
}

export async function loadLatestSubscription(restaurantId: string): Promise<SubscriptionWithPlan | null> {
  const db = getDb();
  const rows = await db
    .select({
      subscription: restaurantSubscriptions,
      plan: subscriptionPlans
    })
    .from(restaurantSubscriptions)
    .innerJoin(subscriptionPlans, eq(restaurantSubscriptions.planId, subscriptionPlans.id))
    .where(eq(restaurantSubscriptions.restaurantId, restaurantId))
    .orderBy(desc(restaurantSubscriptions.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  await maybeResetMonthlyCounter(row.subscription);
  await maybeExpireSubscription(row.subscription);

  const refreshed = await db
    .select({
      subscription: restaurantSubscriptions,
      plan: subscriptionPlans
    })
    .from(restaurantSubscriptions)
    .innerJoin(subscriptionPlans, eq(restaurantSubscriptions.planId, subscriptionPlans.id))
    .where(eq(restaurantSubscriptions.id, row.subscription.id))
    .limit(1);

  return refreshed[0] ?? null;
}

export async function getSubscriptionStatus(restaurantId: string) {
  const loaded = await loadLatestSubscription(restaurantId);
  if (!loaded) {
    return null;
  }
  return mapRestaurantSubscription(
    loaded.subscription,
    loaded.plan.name as SubscriptionPlanType,
    loaded.plan.maxBookingsMonthly
  );
}

export async function createTrialSubscription(restaurantId: string) {
  const db = getDb();
  const trialPlan = await getPlanByName("trial");
  if (!trialPlan) {
    throw new Error("Trial plan not configured");
  }

  const expiresAt = addDays(new Date(), SubscriptionConstants.TrialDurationDays);
  const [row] = await db
    .insert(restaurantSubscriptions)
    .values({
      restaurantId,
      planId: trialPlan.id,
      status: "trial",
      expiresAt
    })
    .returning();

  return mapRestaurantSubscription(row, "trial", trialPlan.maxBookingsMonthly);
}

export async function resetRestaurantToTrial(restaurantId: string) {
  const db = getDb();
  const trialPlan = await getPlanByName("trial");
  if (!trialPlan) {
    throw new Error("Trial plan not configured");
  }

  const expiresAt = addDays(new Date(), SubscriptionConstants.TrialDurationDays);
  const loaded = await loadLatestSubscription(restaurantId);
  if (loaded) {
    const [updated] = await db
      .update(restaurantSubscriptions)
      .set({
        planId: trialPlan.id,
        status: "trial",
        startedAt: new Date(),
        expiresAt,
        bookingsThisMonth: 0
      })
      .where(eq(restaurantSubscriptions.id, loaded.subscription.id))
      .returning();
    return mapRestaurantSubscription(updated, "trial", trialPlan.maxBookingsMonthly);
  }

  return createTrialSubscription(restaurantId);
}

export async function processSubscriptionPayment(restaurantId: string, planId: string) {
  const db = getDb();
  const plan = await getPlanById(planId);
  if (!plan) {
    throw new SubscriptionError("Plan not found", 404);
  }
  if (plan.name === "trial") {
    throw new SubscriptionError("Cannot purchase trial plan", 400);
  }

  const loaded = await loadLatestSubscription(restaurantId);
  const expiresAt = addDays(new Date(), SubscriptionConstants.PremiumDurationDays);

  let subscriptionRow: RestaurantSubscriptionRow;
  if (loaded) {
    const [updated] = await db
      .update(restaurantSubscriptions)
      .set({
        planId: plan.id,
        status: "active",
        startedAt: new Date(),
        expiresAt
      })
      .where(eq(restaurantSubscriptions.id, loaded.subscription.id))
      .returning();
    subscriptionRow = updated;
  } else {
    const [created] = await db
      .insert(restaurantSubscriptions)
      .values({
        restaurantId,
        planId: plan.id,
        status: "active",
        expiresAt
      })
      .returning();
    subscriptionRow = created;
  }

  await db.insert(subscriptionPayments).values({
    subscriptionId: subscriptionRow.id,
    amountCents: plan.priceCents,
    status: "success"
  });

  return mapRestaurantSubscription(
    subscriptionRow,
    plan.name as SubscriptionPlanType,
    plan.maxBookingsMonthly
  );
}

function subscriptionsRevenueRecord(amountCents: number) {
  const month = new Date().toISOString().slice(0, 7);
  return sql`INSERT INTO subscriptions_revenue (month, total_revenue_cents)
    VALUES (${month}, ${amountCents})
    ON CONFLICT DO NOTHING`;
}

export async function cancelSubscription(restaurantId: string) {
  const loaded = await loadLatestSubscription(restaurantId);
  if (!loaded) {
    throw new SubscriptionError("Subscription not found", 404);
  }

  const db = getDb();
  const [updated] = await db
    .update(restaurantSubscriptions)
    .set({ status: "cancelled" })
    .where(eq(restaurantSubscriptions.id, loaded.subscription.id))
    .returning();

  return mapRestaurantSubscription(
    updated,
    loaded.plan.name as SubscriptionPlanType,
    loaded.plan.maxBookingsMonthly
  );
}

export async function requireActiveSubscription(restaurantId: string) {
  const status = await getSubscriptionStatus(restaurantId);
  if (!status || !isSubscriptionActive(status)) {
    throw new SubscriptionError("Active subscription required", 403, "SUBSCRIPTION_REQUIRED");
  }
  return status;
}

export async function requirePremium(restaurantId: string) {
  const status = await requireActiveSubscription(restaurantId);
  if (!isPremiumSubscription(status)) {
    throw new SubscriptionError("Premium subscription required", 403, "PREMIUM_REQUIRED");
  }
  return status;
}

export async function checkBookingLimit(restaurantId: string) {
  const loaded = await loadLatestSubscription(restaurantId);
  if (!loaded) {
    throw new SubscriptionError("Restaurant has no subscription", 403, "NO_SUBSCRIPTION");
  }

  const mapped = mapRestaurantSubscription(
    loaded.subscription,
    loaded.plan.name as SubscriptionPlanType,
    loaded.plan.maxBookingsMonthly
  );
  const check = canAcceptBooking(mapped, loaded.plan.maxBookingsMonthly);
  if (!check.allowed) {
    throw new SubscriptionError("Monthly booking limit reached", 403, "BOOKING_LIMIT_REACHED");
  }
}

export async function incrementBookingCount(restaurantId: string) {
  const loaded = await loadLatestSubscription(restaurantId);
  if (!loaded) {
    return;
  }

  const db = getDb();
  await db
    .update(restaurantSubscriptions)
    .set({ bookingsThisMonth: sql`${restaurantSubscriptions.bookingsThisMonth} + 1` })
    .where(eq(restaurantSubscriptions.id, loaded.subscription.id));
}

export async function isGuestBlacklisted(restaurantId: string, guestPhone: string): Promise<boolean> {
  const normalized = normalizePhone(guestPhone);
  if (!normalized) {
    return false;
  }

  const db = getDb();
  const [row] = await db
    .select({ id: restaurantBlacklist.id })
    .from(restaurantBlacklist)
    .where(
      and(
        eq(restaurantBlacklist.restaurantId, restaurantId),
        eq(restaurantBlacklist.guestPhone, normalized)
      )
    )
    .limit(1);

  return Boolean(row);
}

export async function listBlacklist(restaurantId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(restaurantBlacklist)
    .where(eq(restaurantBlacklist.restaurantId, restaurantId))
    .orderBy(desc(restaurantBlacklist.createdAt));
  return rows.map(mapBlacklistEntry);
}

export async function addBlacklistEntry(
  restaurantId: string,
  input: { guest_phone: string; guest_name?: string; reason?: string }
) {
  const normalized = normalizePhone(input.guest_phone);
  if (!normalized) {
    throw new SubscriptionError("Invalid phone number", 400);
  }

  const db = getDb();
  const [row] = await db
    .insert(restaurantBlacklist)
    .values({
      restaurantId,
      guestPhone: normalized,
      guestName: input.guest_name ?? null,
      reason: input.reason ?? null
    })
    .returning();

  return mapBlacklistEntry(row);
}

export async function loadPremiumRestaurantIds(): Promise<Set<string>> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({
      restaurantId: restaurantSubscriptions.restaurantId,
      status: restaurantSubscriptions.status,
      expiresAt: restaurantSubscriptions.expiresAt,
      planName: subscriptionPlans.name
    })
    .from(restaurantSubscriptions)
    .innerJoin(subscriptionPlans, eq(restaurantSubscriptions.planId, subscriptionPlans.id))
    .where(
      and(
        eq(subscriptionPlans.name, "premium"),
        inArray(restaurantSubscriptions.status, ["active"])
      )
    );

  const premiumIds = new Set<string>();
  for (const row of rows) {
    if (row.expiresAt && row.expiresAt <= now) {
      continue;
    }
    premiumIds.add(row.restaurantId);
  }
  return premiumIds;
}

export async function isRestaurantPremium(restaurantId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(restaurantId);
  return isPremiumSubscription(status);
}

export async function getAnalytics(
  restaurantId: string,
  fromDate: string,
  toDate: string
): Promise<SubscriptionAnalyticsSummary> {
  const db = getDb();
  const rows = await db
    .select()
    .from(subscriptionAnalytics)
    .where(
      and(
        eq(subscriptionAnalytics.restaurantId, restaurantId),
        gte(subscriptionAnalytics.date, fromDate),
        lte(subscriptionAnalytics.date, toDate)
      )
    )
    .orderBy(subscriptionAnalytics.date);

  const days = rows.map(mapSubscriptionAnalyticsDay);
  const totals = days.reduce(
    (acc, day) => ({
      total_bookings: acc.total_bookings + day.total_bookings,
      confirmed_bookings: acc.confirmed_bookings + day.confirmed_bookings,
      cancelled_bookings: acc.cancelled_bookings + day.cancelled_bookings,
      revenue_cents: acc.revenue_cents + day.revenue_cents,
      avg_occupancy_rate: acc.avg_occupancy_rate + day.occupancy_rate
    }),
    {
      total_bookings: 0,
      confirmed_bookings: 0,
      cancelled_bookings: 0,
      revenue_cents: 0,
      avg_occupancy_rate: 0
    }
  );

  return {
    days,
    totals: {
      ...totals,
      avg_occupancy_rate: days.length > 0 ? totals.avg_occupancy_rate / days.length : 0
    }
  };
}

export async function refreshAnalyticsForRestaurant(restaurantId: string, targetDate: string) {
  const db = getDb();

  const [restaurantRow] = await db
    .select({ tables: restaurants.tables })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);

  const tableCount = Array.isArray(restaurantRow?.tables) ? restaurantRow.tables.length : 0;

  const dayBookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.restaurantId, restaurantId), eq(bookings.date, targetDate)));

  const totalBookings = dayBookings.length;
  const confirmedBookings = dayBookings.filter((b) => b.status === "confirmed").length;
  const cancelledBookings = dayBookings.filter((b) => b.status === "cancelled").length;
  const revenueCents = dayBookings.reduce((sum, b) => sum + b.revenueCents, 0);
  const occupancyRate =
    tableCount > 0 ? Math.min(100, (confirmedBookings / tableCount) * 100) : 0;

  await db
    .insert(subscriptionAnalytics)
    .values({
      restaurantId,
      date: targetDate,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      revenueCents,
      occupancyRate: String(occupancyRate.toFixed(2))
    })
    .onConflictDoUpdate({
      target: [subscriptionAnalytics.restaurantId, subscriptionAnalytics.date],
      set: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        revenueCents,
        occupancyRate: String(occupancyRate.toFixed(2))
      }
    });
}

export async function refreshAnalyticsRange(restaurantId: string, days: number) {
  const today = new Date();
  for (let index = 0; index < days; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    await refreshAnalyticsForRestaurant(restaurantId, date.toISOString().slice(0, 10));
  }
}

export async function processSubscriptionMaintenance() {
  const db = getDb();
  const now = new Date();

  const expired = await db
    .select()
    .from(restaurantSubscriptions)
    .where(
      and(
        inArray(restaurantSubscriptions.status, ["trial", "active"]),
        lte(restaurantSubscriptions.expiresAt, now)
      )
    );

  let expiredCount = 0;
  for (const row of expired) {
    await db
      .update(restaurantSubscriptions)
      .set({ status: "expired" })
      .where(eq(restaurantSubscriptions.id, row.id));
    expiredCount += 1;
  }

  const allActive = await db
    .select()
    .from(restaurantSubscriptions)
    .where(inArray(restaurantSubscriptions.status, ["trial", "active"]));

  let resetCount = 0;
  for (const row of allActive) {
    const didReset = await maybeResetMonthlyCounter(row);
    if (didReset) {
      resetCount += 1;
    }
  }

  return { expiredCount, resetCount };
}

async function maybeResetMonthlyCounter(row: RestaurantSubscriptionRow): Promise<boolean> {
  const now = new Date();
  const lastReset = row.lastResetAt;
  if (lastReset.getMonth() === now.getMonth() && lastReset.getFullYear() === now.getFullYear()) {
    return false;
  }

  const db = getDb();
  await db
    .update(restaurantSubscriptions)
    .set({
      bookingsThisMonth: 0,
      lastResetAt: now
    })
    .where(eq(restaurantSubscriptions.id, row.id));
  return true;
}

async function maybeExpireSubscription(row: RestaurantSubscriptionRow) {
  if (!row.expiresAt || row.status === "cancelled" || row.status === "expired") {
    return;
  }
  if (row.expiresAt > new Date()) {
    return;
  }

  const db = getDb();
  await db
    .update(restaurantSubscriptions)
    .set({ status: "expired" })
    .where(eq(restaurantSubscriptions.id, row.id));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 5) {
    return null;
  }
  return digits;
}
