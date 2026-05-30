import { getSubscriptionPlans } from "@/lib/subscription-service";

export async function GET() {
  const plans = await getSubscriptionPlans();
  return Response.json({ plans });
}
