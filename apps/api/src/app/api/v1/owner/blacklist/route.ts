import { BlacklistEntrySchema } from "@tablebook/shared";
import { jsonError, requireRole } from "@/lib/auth-helpers";
import {
  addBlacklistEntry,
  getOwnerRestaurantId,
  listBlacklist,
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
    const entries = await listBlacklist(restaurantId);
    return Response.json({ entries });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, "restaurant_owner");
    const parsed = BlacklistEntrySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const restaurantId = await getOwnerRestaurantId(user.id);
    if (!restaurantId) {
      return Response.json({ error: "Restaurant not found" }, { status: 404 });
    }

    await requirePremium(restaurantId);
    const entry = await addBlacklistEntry(restaurantId, parsed.data);
    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
