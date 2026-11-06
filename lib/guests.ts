import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { HotelType, ScheduleType } from "./wedding";

export type Guest = {
  id: string;
  name: string;
  passcode: string;
  scheduleType: ScheduleType;
  /** When omitted, defaults to Renaissance. */
  hotelType?: HotelType;
  /**
   * Additional guests on this invitation, not counting this guest.
   * Omitted or 0: just this guest. 1: a plus one. 2 or more: a family (3 means a family of 4).
   */
  guestCount?: number;
};

const demoGuests: Guest[] = [
  {
    id: "guest-renaissance-extended-plus",
    name: "Jane Smith",
    passcode: "paradise_in_bali",
    scheduleType: "extended",
    hotelType: "renaissance",
    guestCount: 1,
  },
  {
    id: "guest-renaissance-extended",
    name: "Alex Chen",
    passcode: "tidal_pool",
    scheduleType: "extended",
    hotelType: "renaissance",
  },
  {
    id: "guest-stregis-extended-plus",
    name: "Tiffany Sentosa",
    passcode: "coral_reefs_in_bali",
    scheduleType: "extended",
    hotelType: "st-regis",
    guestCount: 1,
  },
  {
    id: "guest-stregis-extended",
    name: "Maya Hartono",
    passcode: "sea_glass",
    scheduleType: "extended",
    hotelType: "st-regis",
  },
  {
    id: "guest-renaissance-standard-plus",
    name: "Sarah Lee",
    passcode: "sandbars_in_bali",
    scheduleType: "standard",
    hotelType: "renaissance",
    guestCount: 1,
  },
  {
    id: "guest-renaissance-standard",
    name: "Daniel Okoye",
    passcode: "palm_shade",
    scheduleType: "standard",
    hotelType: "renaissance",
  },
  {
    id: "guest-renaissance-extended-family",
    name: "Budi Santoso",
    passcode: "family_in_bali",
    scheduleType: "extended",
    hotelType: "renaissance",
    guestCount: 3,
  },
  {
    id: "guest-stregis-standard-family",
    name: "Ayu Wijaya",
    passcode: "family_by_the_sea",
    scheduleType: "standard",
    hotelType: "st-regis",
    guestCount: 4,
  },
];

function normalizeGuest(guest: Guest): Guest {
  return {
    ...guest,
    hotelType: guest.hotelType === "st-regis" ? "st-regis" : "renaissance",
  };
}

function parseGuestList(raw: unknown): Guest[] {
  if (!Array.isArray(raw)) throw new Error("Guest list must be an array");
  return raw.map((entry) => normalizeGuest(entry as Guest));
}

function loadGuestsFromFile(): Guest[] | null {
  try {
    const file = path.join(process.cwd(), "data", "guests.json");
    return parseGuestList(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    return null;
  }
}

function loadGuestsFromEnv(): Guest[] | null {
  if (!process.env.GUESTS_JSON) return null;

  try {
    return parseGuestList(JSON.parse(process.env.GUESTS_JSON));
  } catch (error) {
    console.error("Invalid GUESTS_JSON; falling back to demo guests", error);
    return null;
  }
}

function getGuests(): Guest[] {
  return loadGuestsFromFile() ?? loadGuestsFromEnv() ?? demoGuests;
}

export function findGuestByPasscode(passcode: string) {
  const normalized = passcode.trim().toLowerCase();
  return getGuests().find((guest) => guest.passcode.trim().toLowerCase() === normalized);
}

export function findGuestById(id: string) {
  return getGuests().find((guest) => guest.id === id);
}

function additionalGuests(guest: Guest) {
  const count = Number(guest.guestCount);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

export function publicGuest(guest: Guest) {
  const additional = additionalGuests(guest);
  return {
    id: guest.id,
    name: guest.name,
    scheduleType: guest.scheduleType,
    hotelType: guest.hotelType === "st-regis" ? "st-regis" : "renaissance",
    plusOneAllowed: additional === 1,
    familySize: additional >= 2 ? additional + 1 : null,
  };
}
