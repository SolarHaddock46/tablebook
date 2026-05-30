import { SubscriptionPaySchema } from "@tablebook/shared";
import { jsonError, requireRole } from "@/lib/auth-helpers";
import { getOwnerRestaurantId, processSubscriptionPayment } from "@/lib/subscription-service";

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, "restaurant_owner");
    const parsed = SubscriptionPaySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const restaurantId = await getOwnerRestaurantId(user.id);
    if (!restaurantId) {
      return Response.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const subscription = await processSubscriptionPayment(restaurantId, parsed.data.plan_id);
    return Response.json({ subscription });
  } catch (error) {
    return jsonError(error);
  }
}
