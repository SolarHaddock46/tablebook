import { jsonError, requireRole } from "@/lib/auth-helpers";
import { getOwnerRestaurantId, getSubscriptionStatus } from "@/lib/subscription-service";

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, "restaurant_owner");
    const restaurantId = await getOwnerRestaurantId(user.id);
    if (!restaurantId) {
      return Response.json({ subscription: null });
    }

    const subscription = await getSubscriptionStatus(restaurantId);
    return Response.json({ subscription });
  } catch (error) {
    return jsonError(error);
  }
}
