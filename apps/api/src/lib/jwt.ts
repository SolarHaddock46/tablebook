import { SignJWT, jwtVerify } from "jose";
import type { AuthUser } from "@tablebook/shared";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing env var: AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(user: AuthUser) {
  return new SignJWT({
    role: user.role,
    email: user.email,
    display_name: user.display_name,
    full_name: user.full_name,
    phone: user.phone,
    email_verified: user.email_verified,
    locale: user.locale
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) {
      return null;
    }
    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      role: payload.role as AuthUser["role"],
      display_name: (payload.display_name as string | null | undefined) ?? null,
      full_name: (payload.full_name as string | null | undefined) ?? null,
      phone: (payload.phone as string | null | undefined) ?? null,
      email_verified: Boolean(payload.email_verified),
      locale: (payload.locale as AuthUser["locale"] | undefined) ?? "ru"
    };
  } catch {
    return null;
  }
}
