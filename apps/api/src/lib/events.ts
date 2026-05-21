import { getDb } from "@tablebook/db";
import { events } from "@tablebook/db";

export async function logEvent(
  event_name: string,
  payload: Record<string, unknown>,
  user_id?: string | null
) {
  const db = getDb();
  await db.insert(events).values({
    eventName: event_name,
    payload,
    userId: user_id ?? null
  });
}
