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
  /** When omitted, defaults to false. Set true per guest to show the +1 RSVP question. */
  plusOneAllowed?: boolean;
};

const demoGuests: Guest[] = [
  {
    id: "guest-renaissance-extended-plus",
    name: "Jane Smith",
    passcode: "paradise_in_bali",
    scheduleType: "extended",
    hotelType: "renaissance",
    plusOneAllowed: true,
  },
  {
    id: "guest-renaissance-extended",
    name: "Alex Chen",
    passcode: "tidal_pool",
    scheduleType: "extended",
    hotelType: "renaissance",
    plusOneAllowed: false,
  },
  {
    id: "guest-stregis-extended-plus",
    name: "Tiffany Sentosa",
    passcode: "coral_reefs_in_bali",
    scheduleType: "extended",
    hotelType: "st-regis",
    plusOneAllowed: true,
  },
  {
    id: "guest-stregis-extended",
    name: "Maya Hartono",
    passcode: "sea_glass",
    scheduleType: "extended",
    hotelType: "st-regis",
    plusOneAllowed: false,
  },
  {
    id: "guest-renaissance-standard-plus",
    name: "Sarah Lee",
    passcode: "sandbars_in_bali",
    scheduleType: "standard",
    hotelType: "renaissance",
    plusOneAllowed: true,
  },
  {
    id: "guest-renaissance-standard",
    name: "Daniel Okoye",
    passcode: "palm_shade",
    scheduleType: "standard",
    hotelType: "renaissance",
    plusOneAllowed: false,
  },
];

function normalizeGuest(guest: Guest): Guest {
  return {
    ...guest,
    hotelType: guest.hotelType === "st-regis" ? "st-regis" : "renaissance",
    plusOneAllowed: guest.plusOneAllowed ?? false,
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

export function publicGuest(guest: Guest) {
  return {
    id: guest.id,
    name: guest.name,
    scheduleType: guest.scheduleType,
    hotelType: guest.hotelType === "st-regis" ? "st-regis" : "renaissance",
    plusOneAllowed: guest.plusOneAllowed ?? false,
  };
}
