import { verifyEmailToken } from "@/lib/email-verification";
import { jsonError } from "@/lib/auth-helpers";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const user = await verifyEmailToken(token);
    if (!user) {
      return Response.json({ error: "Invalid or expired verification token" }, { status: 400 });
    }
    return Response.json({ ok: true, user });
  } catch (error) {
    return jsonError(error);
  }
}
