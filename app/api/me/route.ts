import { NextResponse } from "next/server";
import { publicGuest } from "@/lib/guests";
import { getCurrentGuest } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const guest = await getCurrentGuest();
  if (!guest) return NextResponse.json({ guest: null }, { status: 401 });
  return NextResponse.json({ guest: publicGuest(guest) });
}
