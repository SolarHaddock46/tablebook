import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, mapAuthUser, users } from "@tablebook/db";
import { LoginSchema } from "@tablebook/shared";
import { jsonError } from "@/lib/auth-helpers";
import { signAccessToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const parsed = LoginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const email = parsed.data.email.toLowerCase();
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!row) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, row.passwordHash);
    if (!valid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = mapAuthUser(row);
    const accessToken = await signAccessToken(user);
    return Response.json({ user, accessToken, email_verified: user.email_verified });
  } catch (error) {
    return jsonError(error);
  }
}
