import { EventSchema } from "@tablebook/shared";
import { getAuthUser, jsonError } from "@/lib/auth-helpers";
import { logEvent } from "@/lib/events";

export async function POST(request: Request) {
  try {
    const parsed = EventSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const user = await getAuthUser(request);
    await logEvent(parsed.data.event_name, parsed.data.payload, user?.id ?? null);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
