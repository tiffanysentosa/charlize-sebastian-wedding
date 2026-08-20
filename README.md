# Charlize & Sebastian — Wedding Website

Mobile-first Next.js wedding invitation for Charlize Sentosa & Sebastian Suherman, designed for Vercel.

## What is already built

- Private invitation-code entry
- Signed, HTTP-only guest session cookie
- Two test guests with different schedules
- Animated envelope + invitation-card opening sequence
- Hero water video (optimized from the supplied 4K clip)
- Couple photography throughout the site
- Personalized date range and itinerary
- Live countdown to the ceremony
- RSVP form
- Google Sheets RSVP integration
- Local JSON fallback for RSVP testing before Google Sheets is configured
- Optional music that starts from the envelope tap (browser-safe user gesture)
- Responsive mobile + desktop layouts
- Reduced-motion support
- `noindex` metadata so search engines do not index the invitation

## Wedding date assumption

The supplied itinerary says Friday August 13, Saturday August 14, and Sunday August 15. Those weekdays line up with **2027**, so this starter uses 2027. Change `lib/wedding.ts` if needed.

## 1. Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

### Demo invitation codes

Until `GUESTS_JSON` is configured, the app includes two test guests:

```text
sunset-tide   -> August 13–15 schedule (extended, +1)
seashell      -> August 14–15 schedule (standard)
```

These are intentionally test-only. Replace them before publishing the real URL.

## 2. Add the music

The repo intentionally does **not** include a commercial recording of *The Carnival of the Animals*.

Use a public-domain/licensed recording and save it as:

```text
public/audio/carnival-of-the-animals.mp3
```

`Aquarium` is a strong fit for the opening animation. The envelope tap calls `audio.play()`, so the playback starts from a user gesture rather than blocked autoplay.

## 3. Configure real guests

For the first production version, guest access is controlled by the server-only `GUESTS_JSON` environment variable.

Example:

```env
GUESTS_JSON=[{"id":"guest-001","name":"Jeremy","passcode":"paradise","scheduleType":"extended","plusOneAllowed":true},{"id":"guest-002","name":"Sarah","passcode":"sandbar","scheduleType":"standard","plusOneAllowed":false}]
```

Allowed `scheduleType` values:

```text
extended -> August 13–15
standard -> August 14–15
```

For a larger list, the natural next step is moving the guest directory into a Google Sheet/database so you do not maintain a long JSON environment variable.

## 4. RSVP -> Google Sheet

Create a Google Sheet with a tab named `RSVPs` (or change `GOOGLE_SHEET_NAME`).

Create a Google Cloud service account with access to the Google Sheets API, then share the target spreadsheet with the service account email as an **Editor**.

Set these values in `.env.local`:

```env
GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_SHEET_NAME=RSVPs
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The app automatically creates the header row if row 1 is empty, then appends each RSVP as a new row.

Without Google credentials, local RSVPs are written to:

```text
data/rsvps.local.json
```

That file is gitignored. In production, Google Sheets configuration is required.

## 5. Session secret

Generate a production secret:

```bash
openssl rand -base64 32
```

Put the result in:

```env
SESSION_SECRET=...
```

Do not prefix any guest, Sheets, or session secrets with `NEXT_PUBLIC_`.

## 6. Deploy to GitHub + Vercel

Create a GitHub repo and push this project:

```bash
git init
git add .
git commit -m "Initial wedding website"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

In Vercel:

1. Import the GitHub repository.
2. Add `SESSION_SECRET`.
3. Add `GUESTS_JSON`.
4. Add the four Google Sheets variables.
5. Deploy.

Vercel auto-detects Next.js. You can also use `vercel env pull .env.local` after linking the project to sync Vercel variables into local development.

## 7. Where to edit content

- Wedding names, dates, venue, schedule: `lib/wedding.ts`
- Guest list: `GUESTS_JSON` / `lib/guests.ts`
- Main experience and RSVP fields: `components/WeddingExperience.tsx`
- Styling: `app/globals.css`
- Couple photos: `public/images/`
- Hero video: `public/video/water-hero.mp4`
- Music: `public/audio/carnival-of-the-animals.mp3`

## Before production

- Replace the two demo codes with long unique guest codes.
- Confirm the wedding year is 2027.
- Replace `Restaurant name to be confirmed` for the welcome dinner.
- Add the licensed/public-domain audio recording.
- Configure the Google Sheet and submit test RSVPs on desktop + iPhone.
- Consider rate limiting if the final guest codes are short or easy to guess.
