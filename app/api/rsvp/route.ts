import { NextResponse } from "next/server";
import { publicGuest } from "@/lib/guests";
import { getCurrentGuest } from "@/lib/session";
import { saveRsvp } from "@/lib/sheets";

export const runtime = "nodejs";

function clean(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseFamilyMembers(value: unknown, familySize: number, extended: boolean) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, familySize).map((entry) => {
    const member = (entry ?? {}) as Record<string, unknown>;
    return {
      name: clean(member.name, 200),
      dinner: extended && member.dinner === true,
      wedding: extended ? member.wedding === true : true,
    };
  });
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

  const invite = publicGuest(guest);
  const extended = guest.scheduleType === "extended";
  const joining = attending === "yes";
  let guestNames: string[] = [];
  let welcomeDinnerNames: string[] = [];
  let weddingNames: string[] = [];

  if (joining && invite.familySize !== null) {
    const members = parseFamilyMembers(body.familyMembers, invite.familySize, extended);
    if (!members.length || members.some((member) => !member.name)) {
      return NextResponse.json({ error: "Please add the name of each guest joining us." }, { status: 400 });
    }
    if (members.some((member) => !member.dinner && !member.wedding)) {
      return NextResponse.json({ error: "Please choose at least one event for each guest." }, { status: 400 });
    }
    guestNames = members.map((member) => member.name);
    welcomeDinnerNames = members.filter((member) => member.dinner).map((member) => member.name);
    weddingNames = members.filter((member) => member.wedding).map((member) => member.name);
  } else if (joining) {
    const plusOneName = invite.plusOneAllowed && clean(body.plusOne, 20) === "yes" ? clean(body.plusOneName, 200) : "";
    guestNames = plusOneName ? [guest.name, plusOneName] : [guest.name];
    if (extended && clean(body.welcomeDinner, 20) === "yes") welcomeDinnerNames = guestNames;
    if (clean(body.weddingDay, 20) === "yes") weddingNames = guestNames;
  }

  const accommodation = joining ? clean(body.accommodation, 40) : "";
  const wantsRoom = accommodation !== "" && accommodation !== "no";
  const requestedStaying = Number(body.stayingCount);
  const stayingCount = !wantsRoom
    ? 0
    : invite.familySize !== null && requestedStaying >= 1
      ? Math.min(Math.floor(requestedStaying), guestNames.length)
      : guestNames.length;

  try {
    const result = await saveRsvp({
      timestamp: new Date().toISOString(),
      guestId: guest.id,
      guestName: guest.name,
      scheduleType: guest.scheduleType,
      hotelType: invite.hotelType,
      invitationType: invite.familySize !== null ? "family" : invite.plusOneAllowed ? "plus-one" : "single",
      invited: invite.familySize ?? (invite.plusOneAllowed ? 2 : 1),
      attending,
      invitationName: clean(body.invitationName, 200),
      email: clean(body.email, 200),
      whatsapp: clean(body.whatsapp, 80),
      guestCount: guestNames.length,
      guestNames: guestNames.join(", "),
      welcomeDinnerCount: welcomeDinnerNames.length,
      welcomeDinnerNames: welcomeDinnerNames.join(", "),
      weddingCount: weddingNames.length,
      weddingNames: weddingNames.join(", "),
      accommodation,
      stayingCount,
      dietaryRestrictions: clean(body.dietaryRestrictions, 500),
      message: clean(body.message, 1200),
    });

    return NextResponse.json({ ok: true, destination: result.destination });
  } catch (error) {
    console.error("RSVP save failed", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    // Surface actionable setup errors on the form while debugging Vercel env.
    const message =
      detail.includes("Google Sheets environment variables") ||
      detail.includes("Google authentication failed") ||
      detail.includes("Google Sheets API")
        ? detail
        : "We couldn't save your RSVP. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
