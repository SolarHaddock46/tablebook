import type { Href } from "expo-router";

export function normalizeRouteToken(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

export function restaurantHref(restaurantId: string): Href {
  return `/restaurant/${restaurantId}` as Href;
}

export function loginRedirectHref(restaurantId: string): Href {
  return `/(auth)/login?redirect=${encodeURIComponent(`/restaurant/${restaurantId}`)}` as Href;
}

export function isSafeInAppRedirect(path: string | undefined): path is string {
  return typeof path === "string" && path.startsWith("/restaurant/");
}
