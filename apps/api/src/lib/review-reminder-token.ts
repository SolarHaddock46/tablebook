import { SignJWT, jwtVerify } from "jose";

export type ReviewReminderTokenPayload = {
  bookingId: string;
  restaurantId: string;
  userId: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing env var: AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function signReviewReminderToken(payload: ReviewReminderTokenPayload) {
  return new SignJWT({
    rid: payload.restaurantId,
    uid: payload.userId,
    typ: "review_reminder"
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.bookingId)
    .setIssuedAt()
    .setExpirationTime(`${Constants.TokenTtlDays}d`)
    .sign(getSecret());
}

export async function verifyReviewReminderToken(
  token: string
): Promise<ReviewReminderTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.typ !== "review_reminder" || !payload.sub) {
      return null;
    }

    const restaurantId = payload.rid;
    const userId = payload.uid;
    if (typeof restaurantId !== "string" || typeof userId !== "string") {
      return null;
    }

    return {
      bookingId: payload.sub,
      restaurantId,
      userId
    };
  } catch {
    return null;
  }
}

const Constants = {
  TokenTtlDays: 14
} as const;
