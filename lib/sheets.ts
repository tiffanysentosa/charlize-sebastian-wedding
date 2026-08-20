import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type RsvpRecord = {
  timestamp: string;
  guestId: string;
  guestName: string;
  scheduleType: string;
  attending: string;
  invitationName: string;
  email: string;
  whatsapp: string;
  plusOne: string;
  welcomeDinner: string;
  weddingDay: string;
  brunch: string;
  accommodation: string;
  partySize: string;
  dietaryRestrictions: string;
  message: string;
};

const headers = [
  "Timestamp",
  "Guest ID",
  "Guest Name",
  "Schedule Type",
  "Attending",
  "Invitation Name",
  "Email",
  "WhatsApp",
  "Plus One",
  "Welcome Dinner",
  "Wedding Day",
  "Brunch",
  "Accommodation",
  "Party Size",
  "Dietary Restrictions",
  "Message",
];

function normalizePrivateKey(raw: string) {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEET_ID?.trim() &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() &&
      process.env.GOOGLE_PRIVATE_KEY?.trim(),
  );
}

function b64url(value: string | Buffer) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer.toString("base64url");
}

async function getGoogleAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY!);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = b64url(signer.sign(privateKey));
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = (await response.json()) as { access_token?: string; error_description?: string; error?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(`Google authentication failed: ${data.error_description || data.error || response.statusText}`);
  }
  return data.access_token;
}

async function sheetsRequest(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Sheets API ${response.status}: ${detail.slice(0, 500)}`);
  }
  return response;
}

async function appendToGoogleSheet(record: RsvpRecord) {
  const token = await getGoogleAccessToken();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "RSVPs";
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values`;
  const headerRange = `${sheetName}!A1:P1`;

  const headerResponse = await sheetsRequest(`${base}/${encodeURIComponent(headerRange)}`, token);
  const headerData = (await headerResponse.json()) as { values?: unknown[][] };

  if (!headerData.values?.length) {
    await sheetsRequest(`${base}/${encodeURIComponent(headerRange)}?valueInputOption=RAW`, token, {
      method: "PUT",
      body: JSON.stringify({ values: [headers] }),
    });
  }

  const row = [
    record.timestamp,
    record.guestId,
    record.guestName,
    record.scheduleType,
    record.attending,
    record.invitationName,
    record.email,
    record.whatsapp,
    record.plusOne,
    record.welcomeDinner,
    record.weddingDay,
    record.brunch,
    record.accommodation,
    record.partySize,
    record.dietaryRestrictions,
    record.message,
  ];

  const appendRange = `${sheetName}!A:P`;
  const appendUrl = `${base}/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  await sheetsRequest(appendUrl, token, {
    method: "POST",
    body: JSON.stringify({ values: [row] }),
  });
}

async function appendLocally(record: RsvpRecord) {
  const file = path.join(process.cwd(), "data", "rsvps.local.json");
  let current: RsvpRecord[] = [];
  try {
    current = JSON.parse(await fs.readFile(file, "utf8")) as RsvpRecord[];
  } catch {
    // First local RSVP.
  }
  current.push(record);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(current, null, 2));
}

export async function saveRsvp(record: RsvpRecord) {
  if (googleConfigured()) {
    await appendToGoogleSheet(record);
    return { destination: "google-sheet" as const };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Google Sheets environment variables are not configured.");
  }

  await appendLocally(record);
  return { destination: "local-json" as const };
}
