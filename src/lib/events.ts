import { createSupabaseServerClient } from "@/lib/supabase";

export async function logEvent(event_name: string, payload: Record<string, unknown>, user_id?: string | null) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("events").insert({
    event_name,
    payload,
    user_id: user_id ?? null
  });
  if (error) {
    throw error;
  }
}
