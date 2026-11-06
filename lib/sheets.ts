import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type RsvpRecord = {
  timestamp: string;
  guestId: string;
  guestName: string;
  scheduleType: string;
  hotelType: string;
  invitationType: string;
  invited: number;
  attending: string;
  invitationName: string;
  email: string;
  whatsapp: string;
  guestCount: number;
  guestNames: string;
  welcomeDinnerCount: number;
  welcomeDinnerNames: string;
  weddingCount: number;
  weddingNames: string;
  accommodation: string;
  stayingCount: number;
  dietaryRestrictions: string;
  message: string;
};

const headers = [
  "Timestamp",
  "Guest ID",
  "Guest Name",
  "Schedule Type",
  "Hotel",
  "Invitation Type",
  "Invited",
  "Attending",
  "Invitation Name",
  "Email",
  "WhatsApp",
  "Guests Coming",
  "Guest Names",
  "Welcome Dinner #",
  "Welcome Dinner Names",
  "Wedding #",
  "Wedding Names",
  "Accommodation",
  "# Staying",
  "Dietary Restrictions",
  "Message",
];

function normalizePrivateKey(raw: string) {
  let key = raw.trim().replace(/^\uFEFF/, "");
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();

  // Vercel paste sometimes collapses the PEM into one line.
  if (key.includes("BEGIN") && !key.includes("\n")) {
    const match = key.match(/-----BEGIN ([^-]+)-----(.+)-----END ([^-]+)-----/);
    if (match) {
      const [, beginLabel, body, endLabel] = match;
      const lines = body.replace(/\s+/g, "").match(/.{1,64}/g) ?? [];
      key = `-----BEGIN ${beginLabel}-----\n${lines.join("\n")}\n-----END ${endLabel}-----`;
    }
  }

  return key;
}

function missingGoogleEnvVars() {
  const required = [
    "GOOGLE_SHEET_ID",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
  ] as const;
  return required.filter((name) => !process.env[name]?.trim());
}

function googleConfigured() {
  return missingGoogleEnvVars().length === 0;
}

function b64url(value: string | Buffer) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer.toString("base64url");
}

async function getGoogleAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY!);
  if (!privateKey.includes("BEGIN PRIVATE KEY") && !privateKey.includes("BEGIN RSA PRIVATE KEY")) {
    throw new Error("Google authentication failed: GOOGLE_PRIVATE_KEY does not look like a valid private key.");
  }

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
  let signature: string;
  try {
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(unsigned);
    signer.end();
    signature = b64url(signer.sign(privateKey));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid key";
    throw new Error(`Google authentication failed: could not sign with GOOGLE_PRIVATE_KEY (${detail})`);
  }
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

async function saveToGoogleSheet(record: RsvpRecord) {
  const token = await getGoogleAccessToken();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "RSVPs";
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values`;
  const lastColumn = "U";
  const headerRange = `${sheetName}!A1:${lastColumn}1`;

  const headerResponse = await sheetsRequest(`${base}/${encodeURIComponent(headerRange)}`, token);
  const headerData = (await headerResponse.json()) as { values?: unknown[][] };

  if (headerData.values?.[0]?.join("|") !== headers.join("|")) {
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
    record.hotelType,
    record.invitationType,
    record.invited,
    record.attending,
    record.invitationName,
    record.email,
    record.whatsapp,
    record.guestCount,
    record.guestNames,
    record.welcomeDinnerCount,
    record.welcomeDinnerNames,
    record.weddingCount,
    record.weddingNames,
    record.accommodation,
    record.stayingCount,
    record.dietaryRestrictions,
    record.message,
  ];

  // Each invitation keeps one row, so an updated RSVP replaces the earlier answer.
  const idResponse = await sheetsRequest(`${base}/${encodeURIComponent(`${sheetName}!B:B`)}`, token);
  const idData = (await idResponse.json()) as { values?: unknown[][] };
  const existingIndex = (idData.values ?? []).findIndex((cells, index) => index > 0 && cells[0] === record.guestId);

  // RAW keeps WhatsApp numbers' leading "+" and stores guest text exactly as typed.
  if (existingIndex > 0) {
    const rowNumber = existingIndex + 1;
    const rowRange = `${sheetName}!A${rowNumber}:${lastColumn}${rowNumber}`;
    await sheetsRequest(`${base}/${encodeURIComponent(rowRange)}?valueInputOption=RAW`, token, {
      method: "PUT",
      body: JSON.stringify({ values: [row] }),
    });
    return;
  }

  const appendRange = `${sheetName}!A:${lastColumn}`;
  const appendUrl = `${base}/${encodeURIComponent(appendRange)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
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
  current = current.filter((saved) => saved.guestId !== record.guestId);
  current.push(record);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(current, null, 2));
}

export async function saveRsvp(record: RsvpRecord) {
  if (googleConfigured()) {
    await saveToGoogleSheet(record);
    return { destination: "google-sheet" as const };
  }

  if (process.env.NODE_ENV === "production") {
    const missing = missingGoogleEnvVars();
    throw new Error(
      `Google Sheets environment variables are not configured. Missing: ${missing.join(", ") || "unknown"}.`,
    );
  }

  await appendLocally(record);
  return { destination: "local-json" as const };
}
