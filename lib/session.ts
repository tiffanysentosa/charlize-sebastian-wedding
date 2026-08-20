import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { findGuestById } from "./guests";

const COOKIE_NAME = "cs_wedding_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

type SessionPayload = {
  guestId: string;
  exp: number;
};

function secret() {
  return process.env.SESSION_SECRET || "dev-only-change-me-before-deploying";
}

function sign(encodedPayload: string) {
  return crypto.createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

export function createSessionToken(guestId: string) {
  const payload: SessionPayload = {
    guestId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
    if (!payload.guestId || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentGuest() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  return payload ? findGuestById(payload.guestId) ?? null : null;
}

export const sessionCookie = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
};
