import { jsonError, requireRole } from "@/lib/auth-helpers";
import {
  getAnalytics,
  getOwnerRestaurantId,
  refreshAnalyticsRange,
  requirePremium
} from "@/lib/subscription-service";

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, "restaurant_owner");
    const restaurantId = await getOwnerRestaurantId(user.id);
    if (!restaurantId) {
      return Response.json({ error: "Restaurant not found" }, { status: 404 });
    }

    await requirePremium(restaurantId);

    const { searchParams } = new URL(request.url);
    const days = Math.min(Number(searchParams.get("days") ?? Constants.DefaultDays), Constants.MaxDays);
    const toDate = new Date().toISOString().slice(0, 10);
    const fromDate = new Date(Date.now() - days * Constants.MillisecondsPerDay).toISOString().slice(0, 10);

    await refreshAnalyticsRange(restaurantId, days);
    const analytics = await getAnalytics(restaurantId, fromDate, toDate);
    return Response.json(analytics);
  } catch (error) {
    return jsonError(error);
  }
}

enum Constants {
  DefaultDays = 30,
  MaxDays = 90,
  MillisecondsPerDay = 86400000
}
