import { jsonError, requireRole } from "@/lib/auth-helpers";
import { cancelSubscription, getOwnerRestaurantId } from "@/lib/subscription-service";

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, "restaurant_owner");
    const restaurantId = await getOwnerRestaurantId(user.id);
    if (!restaurantId) {
      return Response.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const subscription = await cancelSubscription(restaurantId);
    return Response.json({ subscription });
  } catch (error) {
    return jsonError(error);
  }
}
