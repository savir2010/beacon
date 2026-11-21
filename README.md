# Beacon: version 1

A family mediation platform for Beacon Mediation Services, built from `Beacon_App_White_Paper.docx`. It has two parts:

- **The website** (Next.js) is public: the landing page, the Mediation Navigator, the Resource Center, the consultation request and the private safety request.
- **The Beacon app** (Ionic React, in `ionic/`, served at `/app`) contains only sign-in and three interfaces. Each person lands in the one for their role: **client**, **mediator** or **administrator**.

## Run it

Needs Node 20+ and a local Postgres (`brew install postgresql@14 && brew services start postgresql@14 && createdb beacon`).

```bash
npm install
npm run setup      # installs the app, writes .env (new file-encryption key), creates the database, seeds demo data
npm run build      # builds the Ionic app into public/app, then the website
npx next start -p 3100
```

Open http://localhost:3100 for the website and http://localhost:3100/app for the app.

- `npm run db:reset` reseeds the demo data.
- `npm run test:e2e` runs 34 browser and permission checks against the server on port 3100, then reseeds.
- `npm run app:dev` runs the app with hot reload on port 8100. It sends API calls to the server on port 3100.

## Deploy to Vercel

1. Import the GitHub repo in Vercel (framework: Next.js; the `vercel-build` script is picked up automatically).
2. Add a Postgres database from the Vercel Marketplace (Neon). It sets `DATABASE_URL`.
3. Set environment variables:
   - `BEACON_FILE_KEY`: a new key, `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `BEACON_APP_URL`: the site's https address (optional; defaults to the Vercel production domain)
   - For a live demo only: `BEACON_DEMO_CODE="000000"` and `BEACON_ALLOW_DEMO_CODE="1"`
4. Deploy. The build creates the tables (`prisma db push`), builds the app into `/app`, then the website.
5. Load the demo data once from your machine: `DATABASE_URL="<vercel postgres url>" BEACON_FILE_KEY="<same key>" npm run db:reset`

Documents are encrypted and stored in Postgres (`StoredFile`), so nothing is written to disk. On Vercel, uploads are capped at 4 MB (Vercel's request limit).

## Signing in

There are no passwords and no authenticator apps. Everyone types their email address, and Beacon emails a 6-digit code. The code works for 10 minutes and allows 5 tries.

**Live demo mode:** `.env` contains `BEACON_DEMO_CODE="000000"`, so every code is **000000**. Delete both `BEACON_DEMO_CODE` lines before any real use. In production the setting is ignored unless `BEACON_ALLOW_DEMO_CODE=1` is also set.

Emails are written to a stand-in outbox (the `OutboxEmail` table). Administrators can read it in the app, but sign-in codes are never shown there.

### Demo accounts

| Who | Email | Interface |
|---|---|---|
| Marcus Oyelaran | marcus@beacon.test | Administrator |
| Dana Whitfield | dana@beacon.test | Mediator on both demo cases |
| Priya Raman | priya@beacon.test | Mediator with no cases yet |
| Jordan Alvarez | jordan@example.com | Client, case BMS-2026-014 |
| Sam Brooks | sam@example.com | Client, same case. Sees different restricted documents |
| Riley Nguyen | riley@example.com | Client, case BMS-2026-019 (safety flag on) |
| A. Morales | amorales@example.com | Client with a consultation request and no case yet |

All people and cases are fictional.

## The flow

1. A visitor uses the Navigator or the guided checklist on the website. No login is needed.
2. They request a consultation. That creates their client account and emails a sign-in code. The success screen links straight to the app with their email filled in.
3. In the app, the client sees a waiting room: where their request stands, what happens next, and preparation links.
4. A mediator takes the request, or an administrator assigns it. The mediator screens the person privately, then chooses **Open a case**. The requester is invited automatically. Anyone else added to the case stays uninvited until screening allows it. An uninvited person can't see the case, and nobody tells them it exists.
5. The client's app becomes their case workspace: **Home** (milestone, next action and owner, last update, sessions, path), **Documents** (checklist with private uploads, released documents), **Messages** (shows who can read before sending), and **Account**.

## Interfaces

**Client**
- Waiting room before a case opens.
- Case workspace in four tabs.
- After closing: read-only for 90 days.

**Mediator** (only their own cases)
- **Today:** everything that needs them, most urgent first. That covers safety requests, families waiting for a reply, documents to review, overdue items, new requests and uninvited participants.
- **Cases:** search, open and closed.
- **Requests:** consultation requests and private safety requests.
- **Case page tabs:**
  - **Overview:** setup progress, next action, joint update with recipient confirmation, milestones and court verification, activity.
  - **Documents:** upload and release with recipient confirmation, withdraw, and a who-can-see-what grid.
  - **Checklist**
  - **Sessions**
  - **Messages:** one private thread per participant.
  - **People:** invite or resend, notifications, remove or restore access, and **View as participant**, which renders exactly what that person sees using their own permissions.
  - **Settings:** safety flag, close or reopen.

**Administrator** (every case)
- Everything a mediator has except private safety requests. Those stay with mediators.
- **Intake:** assign consultation requests to mediators.
- **Team:** add mediators and administrators, change roles, turn accounts off.
- **More:**
  - Content library editor with legal-review fields
  - Measures (last 30 days, unanswered questions)
  - Audit log with filters
  - Email outbox

## Security

- **Sign-in:** passwordless email codes. Codes and session tokens are stored only as hashes.
- **Sessions:** 12 hours for staff, 14 days for clients. Turning off a staff account ends its sessions.
- **Server-side checks:** every permission is checked on the server (`src/lib/access.ts`, `src/server/`). Forbidden and unknown both return "not found".
- **Documents:** encrypted at rest with AES-256-GCM. Every download is permission-checked and audited.
- **Separation:** joint, restricted and team-only material are kept separate, and participant uploads are visible only to that participant and the team.
- **Neutral notifications:** emails only say "please sign in". Joint notices go out together. The safety flag turns them off.
- **Audit log:** sign-ins, previews, downloads, releases, invitations and permission changes.

## Before a real pilot

- **Demo mode off.** Remove the `BEACON_DEMO_CODE` lines from `.env`.
- **Multifactor for staff.** The white paper asks for staff multifactor authentication. An emailed code proves access to the inbox, but it isn't a second factor on top of a password. Before real cases, add a second factor for staff, for example a passkey or an authenticator app, or have counsel accept email codes.
- **Legal review.** Every article and Navigator answer is a draft, and every official link needs checking. California counsel should also review disclosure, confidentiality, retention and export rules.
- **Hosting.** Move from SQLite to Postgres, move documents to encrypted object storage, keep `BEACON_FILE_KEY` in a secrets manager, and serve over HTTPS.
- **Email.** Replace the outbox in `src/lib/notify.ts` with a provider that will sign a data-protection agreement.
- **Shared rate limiting** for code requests across server instances.
- **External security review and penetration test.**
- **Native builds (optional).** The Ionic app can be wrapped with Capacitor for iOS and Android. Set `VITE_API_BASE` to the HTTPS server address.
- **Semantic search (optional).** `scoreEntries()` in `src/lib/search.ts` can be swapped for embeddings without changing anything else.

## Design

"Still Water Light" covers both parts: light blue and white, deep ink-blue type, Manrope throughout, and one pool-blue accent that means "act here" or "you are here".

- **Website:** the hero has a slow WebGL water layer (`src/components/StillWater.tsx`). Its currents drift slowly and the light stays faint so text reads first. The pointer stirs a gentle swirl into it. It shows a single still frame when reduced motion is on.
- **App:** the same tokens in Ionic (`ionic/src/theme.css`), flat and hairline-divided, with iOS-style controls on every device. Tabs sit at the bottom on phones and along the top on desktop.
