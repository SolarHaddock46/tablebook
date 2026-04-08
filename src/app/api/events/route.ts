import { NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/events";

const EventSchema = z.object({
  event_name: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  user_id: z.string().uuid().nullable().optional()
});

export async function POST(request: Request) {
  const raw = await request.json();
  const parsed = EventSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await logEvent(parsed.data.event_name, parsed.data.payload, parsed.data.user_id);
  return NextResponse.json({ ok: true });
}
