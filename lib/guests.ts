import "server-only";
import type { ScheduleType } from "./wedding";

export type Guest = {
  id: string;
  name: string;
  passcode: string;
  scheduleType: ScheduleType;
};

const demoGuests: Guest[] = [
  {
    id: "test-extended",
    name: "Extended Test Guest",
    passcode: "bali-extended",
    scheduleType: "extended",
  },
  {
    id: "test-standard",
    name: "Standard Test Guest",
    passcode: "bali-standard",
    scheduleType: "standard",
  },
];

function getGuests(): Guest[] {
  if (!process.env.GUESTS_JSON) return demoGuests;

  try {
    const parsed = JSON.parse(process.env.GUESTS_JSON) as Guest[];
    if (!Array.isArray(parsed)) throw new Error("GUESTS_JSON must be an array");
    return parsed;
  } catch (error) {
    console.error("Invalid GUESTS_JSON; falling back to demo guests", error);
    return demoGuests;
  }
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
  };
}
