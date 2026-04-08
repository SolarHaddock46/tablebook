import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { Constants } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cuisine = searchParams.get("cuisine")?.trim();
  const district = searchParams.get("district")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? Constants.DefaultLimit), Constants.MaxLimit);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  const supabase = createSupabaseServerClient();
  let query = supabase.from("restaurants").select("*").range(offset, offset + limit - 1);
  if (cuisine) {
    query = query.or(`cuisine_en.ilike.%${cuisine}%,cuisine_ru.ilike.%${cuisine}%`);
  }
  if (district) {
    query = query.or(`district_en.ilike.%${district}%,district_ru.ilike.%${district}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
