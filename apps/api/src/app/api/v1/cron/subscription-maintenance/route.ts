import { assertCronSecret, CronAuthError } from "@/lib/cron-auth";
import { processSubscriptionMaintenance } from "@/lib/subscription-service";

export async function POST(request: Request) {
  try {
    assertCronSecret(request);
    const result = await processSubscriptionMaintenance();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CronAuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
