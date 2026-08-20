import { NextResponse } from "next/server";
import { getCurrentGuest } from "@/lib/session";
import { saveRsvp } from "@/lib/sheets";

export const runtime = "nodejs";

function clean(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const guest = await getCurrentGuest();
  if (!guest) return NextResponse.json({ error: "Your invitation session expired." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid RSVP." }, { status: 400 });
  }

  const attending = clean(body.attending, 20);
  if (!['yes', 'no'].includes(attending)) {
    return NextResponse.json({ error: "Please tell us whether you'll be joining." }, { status: 400 });
  }

  try {
    const result = await saveRsvp({
      timestamp: new Date().toISOString(),
      guestId: guest.id,
      guestName: guest.name,
      scheduleType: guest.scheduleType,
      attending,
      invitationName: clean(body.invitationName, 200),
      email: clean(body.email, 200),
      whatsapp: clean(body.whatsapp, 80),
      plusOne: guest.plusOneAllowed ? clean(body.plusOne, 20) : "not-allotted",
      welcomeDinner: guest.scheduleType === "extended" ? clean(body.welcomeDinner, 20) : "not-invited",
      weddingDay: clean(body.weddingDay, 20),
      brunch: clean(body.brunch, 20),
      accommodation: clean(body.accommodation, 40),
      partySize: guest.plusOneAllowed && clean(body.plusOne, 20) === "yes" ? "2" : attending === "yes" ? "1" : "0",
      dietaryRestrictions: clean(body.dietaryRestrictions, 500),
      message: clean(body.message, 1200),
    });

    return NextResponse.json({ ok: true, destination: result.destination });
  } catch (error) {
    console.error("RSVP save failed", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    const message = detail.includes("Google Sheets environment variables")
      ? "RSVP storage is not configured on the server. Please contact the couple."
      : detail.includes("Google authentication failed")
        ? "We couldn't connect to Google Sheets. Please check the server credentials."
        : detail.includes("Google Sheets API 403")
          ? "The Google Sheet isn't shared with the service account email."
          : "We couldn't save your RSVP. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
