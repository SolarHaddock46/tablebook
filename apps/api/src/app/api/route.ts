import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "TableBook API",
    version: "v1",
    status: "ok"
  });
}
