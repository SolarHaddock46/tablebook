import { eq } from "drizzle-orm";
import { getDb, mapUser, restaurants, users } from "@tablebook/db";
import type { AuthUser, UserRole } from "@tablebook/shared";
import { verifyAccessToken } from "./jwt";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status = 401
  ) {
    super(message);
  }
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return verifyAccessToken(header.slice(7));
  }
  return null;
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new AuthError("Unauthorized");
  }
  return user;
}

export async function requireRole(request: Request, role: UserRole): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== role && user.role !== "admin") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requireOwner(request: Request, restaurantId: string): Promise<AuthUser> {
  const user = await requireAuth(request);
  const db = getDb();
  const [row] = await db
    .select({ ownerId: restaurants.ownerId })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);

  if (!row || row.ownerId !== user.id) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function loadUserByEmail(email: string) {
  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return row ? mapUser(row) : null;
}

export function jsonError(error: unknown, fallbackStatus = 500) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && "status" in error) {
    const status = (error as Error & { status?: number }).status ?? fallbackStatus;
    const code = (error as Error & { code?: string }).code;
    return Response.json(
      { error: sanitizePublicErrorMessage(error), ...(code ? { code } : {}) },
      { status }
    );
  }
  if (error instanceof Error) {
    return Response.json(
      { error: sanitizePublicErrorMessage(error) },
      { status: fallbackStatus }
    );
  }
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

function sanitizePublicErrorMessage(error: Error): string {
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause && typeof cause === "object" && cause !== null && "code" in cause) {
    const code = String((cause as { code?: unknown }).code ?? "");
    if (code === "53300" || code === "57P03") {
      return "Сервис временно перегружен. Подождите несколько секунд и попробуйте снова.";
    }
  }
  if (error.message.startsWith("Failed query:")) {
    return "Сервис временно недоступен. Попробуйте снова через несколько секунд.";
  }
  return error.message;
}
