import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase";
import { logEvent } from "@/lib/events";

const BookingSchema = z.object({
  restaurant_id: z.string().uuid(),
  table_id: z.string().min(1),
  date: z.string().min(8),
  time: z.string().min(4),
  guests: z.coerce.number().int().min(1).max(20),
  source: z.enum(["direct", "ai-alternative", "quick-book"]),
  revenue_cents: z.coerce.number().int().min(0)
});

function getPayloadFromRequest(formData: FormData): Record<string, unknown> {
  return {
    locale: formData.get("locale"),
    restaurant_id: formData.get("restaurant_id"),
    table_id: formData.get("table_id"),
    date: formData.get("date"),
    time: formData.get("time"),
    guests: formData.get("guests"),
    source: formData.get("source"),
    revenue_cents: formData.get("revenue_cents")
  };
}

export async function POST(request: Request) {
  const isJson = request.headers.get("content-type")?.includes("application/json");
  const rawData = isJson ? await request.json() : getPayloadFromRequest(await request.formData());
  const parsed = BookingSchema.safeParse(rawData);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("bookings").insert(parsed.data).select("*").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logEvent("booking_created", {
    booking_id: data.id,
    restaurant_id: data.restaurant_id,
    table_id: data.table_id,
    source: data.source,
    revenue_cents: data.revenue_cents
  });

  if (data.source === "ai-alternative") {
    await logEvent("alternative_booking_success", {
      restaurant_id: data.restaurant_id,
      booking_id: data.id,
      source: data.source,
      revenue_cents: data.revenue_cents
    });
  }

  const confirmationUrl = new URL("/confirmation", request.url);
  const locale = rawData?.locale === "en" ? "en" : "ru";
  confirmationUrl.searchParams.set("locale", locale);
  confirmationUrl.searchParams.set("restaurant_id", data.restaurant_id);
  confirmationUrl.searchParams.set("booking_id", data.id);
  confirmationUrl.searchParams.set("date", String(data.date));
  confirmationUrl.searchParams.set("time", String(data.time));
  confirmationUrl.searchParams.set("guests", String(data.guests));
  confirmationUrl.searchParams.set("source", String(data.source));
  confirmationUrl.searchParams.set("table_id", String(data.table_id));
  return NextResponse.redirect(confirmationUrl);
}
