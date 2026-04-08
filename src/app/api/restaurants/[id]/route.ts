import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const routeParams = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("restaurants").select("*").eq("id", routeParams.id).single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}
