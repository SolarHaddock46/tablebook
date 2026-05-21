import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, mapUser, users } from "@tablebook/db";
import { RegisterSchema } from "@tablebook/shared";
import { jsonError } from "@/lib/auth-helpers";
import { signAccessToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const parsed = RegisterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const email = parsed.data.email.toLowerCase();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const [row] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: parsed.data.role,
        displayName: parsed.data.display_name ?? null
      })
      .returning();

    const user = mapUser(row);
    const accessToken = await signAccessToken(user);
    return Response.json({ user, accessToken }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
