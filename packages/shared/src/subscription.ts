import type { RestaurantSubscription, SubscriptionPlanType, SubscriptionStatus } from "./types";

export type SubscriptionCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "no_subscription" | "expired" | "cancelled" | "limit_reached" };

export function isSubscriptionActive(subscription: RestaurantSubscription | null, now = new Date()): boolean {
  if (!subscription) {
    return false;
  }
  if (subscription.status === "cancelled" || subscription.status === "expired") {
    return false;
  }
  if (subscription.expires_at && new Date(subscription.expires_at) < now) {
    return false;
  }
  return subscription.status === "trial" || subscription.status === "active";
}

export function isPremiumSubscription(subscription: RestaurantSubscription | null, now = new Date()): boolean {
  if (!isSubscriptionActive(subscription, now)) {
    return false;
  }
  return subscription!.plan_name === "premium";
}

export function isCurrentSubscriptionPlan(
  subscription: RestaurantSubscription | null,
  planId: string,
  now = new Date()
): boolean {
  if (!subscription || subscription.plan_id !== planId || !isSubscriptionActive(subscription, now)) {
    return false;
  }
  return true;
}

export function canPurchasePremiumPlan(subscription: RestaurantSubscription | null, now = new Date()): boolean {
  if (!subscription) {
    return true;
  }
  if (!isSubscriptionActive(subscription, now)) {
    return true;
  }
  return subscription.plan_name === "trial";
}

export function canAcceptBooking(
  subscription: RestaurantSubscription | null,
  maxBookingsMonthly: number,
  now = new Date()
): SubscriptionCheckResult {
  if (!subscription) {
    return { allowed: false, reason: "no_subscription" };
  }
  if (subscription.status === "cancelled") {
    return { allowed: false, reason: "cancelled" };
  }
  if (subscription.status === "expired") {
    return { allowed: false, reason: "expired" };
  }
  if (subscription.expires_at && new Date(subscription.expires_at) < now) {
    return { allowed: false, reason: "expired" };
  }
  if (subscription.bookings_this_month >= maxBookingsMonthly) {
    return { allowed: false, reason: "limit_reached" };
  }
  return { allowed: true };
}

export function computeBookingsRemaining(
  bookingsThisMonth: number,
  maxBookingsMonthly: number
): number | null {
  if (maxBookingsMonthly >= 999999) {
    return null;
  }
  return Math.max(0, maxBookingsMonthly - bookingsThisMonth);
}

export function formatPlanPrice(priceCents: number, locale: "ru" | "en" = "ru"): string {
  if (priceCents === 0) {
    return locale === "ru" ? "Бесплатно" : "Free";
  }
  const rubles = priceCents / 100;
  return locale === "ru" ? `${rubles.toLocaleString("ru-RU")} ₽/мес` : `${rubles.toLocaleString("en-US")} ₽/mo`;
}

export function subscriptionStatusLabel(status: SubscriptionStatus, locale: "ru" | "en" = "ru"): string {
  const labels: Record<SubscriptionStatus, { ru: string; en: string }> = {
    trial: { ru: "Пробный период", en: "Trial" },
    active: { ru: "Активна", en: "Active" },
    expired: { ru: "Истекла", en: "Expired" },
    cancelled: { ru: "Отменена", en: "Cancelled" }
  };
  return labels[status][locale];
}

export function planTypeLabel(plan: SubscriptionPlanType, locale: "ru" | "en" = "ru"): string {
  const labels: Record<SubscriptionPlanType, { ru: string; en: string }> = {
    trial: { ru: "Trial", en: "Trial" },
    premium: { ru: "Premium", en: "Premium" }
  };
  return labels[plan][locale];
}

enum Constants {
  PremiumSearchBoost = 20,
  TrialDurationDays = 30,
  PremiumDurationDays = 30
}

export { Constants as SubscriptionConstants };
