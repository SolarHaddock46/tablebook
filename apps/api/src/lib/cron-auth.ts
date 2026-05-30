export function assertCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing env var: CRON_SECRET");
  }

  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const cronHeader = request.headers.get("x-cron-secret");
  const provided = bearer ?? cronHeader;

  if (!provided || provided !== secret) {
    throw new CronAuthError("Unauthorized");
  }
}

export class CronAuthError extends Error {
  constructor(message: string) {
    super(message);
  }
}
