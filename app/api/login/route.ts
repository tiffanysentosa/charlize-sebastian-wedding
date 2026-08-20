import { NextResponse } from "next/server";
import { findGuestByPasscode, publicGuest } from "@/lib/guests";
import { createSessionToken, sessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { passcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const passcode = body.passcode?.trim();
  if (!passcode) {
    return NextResponse.json({ error: "Enter your invitation code." }, { status: 400 });
  }

  const guest = findGuestByPasscode(passcode);
  if (!guest) {
    // Small fixed delay makes rapid guessing less convenient without affecting normal use.
    await new Promise((resolve) => setTimeout(resolve, 450));
    return NextResponse.json({ error: "We couldn't find that invitation code." }, { status: 401 });
  }

  const response = NextResponse.json({ guest: publicGuest(guest) });
  response.cookies.set({
    name: sessionCookie.name,
    value: createSessionToken(guest.id),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionCookie.maxAge,
  });
  return response;
}
