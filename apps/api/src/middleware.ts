import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? "http://localhost:8081,http://192.168.15.88:8081";
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function applyCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  const allowed = getAllowedOrigins();
  if (origin && (allowed.includes(origin) || allowed.includes("*"))) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return applyCors(request, new NextResponse(null, { status: 204 }));
  }

  const response = NextResponse.next();
  return applyCors(request, response);
}

export const config = {
  matcher: "/api/:path*"
};
