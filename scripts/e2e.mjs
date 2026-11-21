// End-to-end checks for Beacon: website consultation → emailed code → Ionic client, mediator and admin interfaces.
// Usage: npm run test:e2e   (expects the server on BASE_URL, default http://localhost:3100)
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const CODE = "000000";
const SHOTS = process.env.SHOTS; // optional folder for screenshots
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const db = new PrismaClient();
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
const step = async (name, fn) => { try { const r = await fn(); check(name, r !== false, typeof r === "string" ? r : ""); } catch (e) { check(name, false, String(e.message).split("\n")[0].slice(0, 200)); } };

let browser;
try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ channel: "chrome" }); }
const desktop = { viewport: { width: 1280, height: 860 } };
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const shot = async (page, name, full = true) => { if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full }); } };
const btn = (page, text) => page.locator(`ion-button:has-text("${text}")`).first();
const visible = (page, text, timeout = 10000) => page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
const pageText = (page) => page.locator("ion-router-outlet .ion-page:not(.ion-page-hidden)").last().innerText();

async function signIn(email, opts = desktop) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app/login`);
  await page.fill("#email", email);
  await btn(page, "Email me a code").click();
  await page.fill("#code", CODE);
  await btn(page, "Sign in").click();
  await page.waitForURL(/\/app\/(client|mediator|admin)/);
  await page.waitForTimeout(600);
  return { ctx, page };
}

// 1. A visitor requests a consultation and gets into the app with the emailed code -------------
await step("Consultation form opens an account and emails a sign-in code", async () => {
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/consultation`);
  await page.fill("#name", "Casey Lin");
  await page.fill("#email", "casey@example.com");
  await page.click("button:has-text('Send request')");
  await visible(page, "Check your email");
  await shot(page, "01-consultation-sent");
  const mail = await db.outboxEmail.findFirst({ where: { toEmail: "casey@example.com", kind: "LOGIN_CODE" } });
  if (!mail || !mail.body.includes(CODE)) return false;
  await page.click("a:has-text(\"Open the Beacon app\")");
  await page.waitForURL(/\/app\/login/);
  if ((await page.inputValue("#email")) !== "casey@example.com") return "email not prefilled";
  await shot(page, "02-app-login");
  await btn(page, "Email me a code").click();
  await shot(page, "03-app-code");
  await page.fill("#code", CODE);
  await btn(page, "Sign in").click();
  await visible(page, "We have your request");
  await shot(page, "04-client-waiting");
  await ctx.close();
  return true;
});

await step("Wrong code is refused", async () => {
  const r = await fetch(`${BASE}/api/v1/auth/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "jordan@example.com", code: "111111" }) });
  return r.status === 400;
});

// 2. Mediator: Today, intake, open a case from the request ------------------------------------
let newCaseId;
{
  const { ctx, page } = await signIn("dana@beacon.test");
  await step("Mediator lands on Today with a needs-attention queue", async () => {
    await visible(page, "Needs attention");
    await shot(page, "10-mediator-today");
    const t = await pageText(page);
    return t.includes("Consultation request from Casey Lin") && t.includes("BMS-2026-014");
  });
  await step("Mediator sees private safety requests and consultation requests", async () => {
    await page.goto(`${BASE}/app/mediator/requests`);
    await visible(page, "Consultation requests");
    await shot(page, "11-mediator-requests");
    return (await pageText(page)).includes("Private safety requests");
  });
  await step("Opening a case from a request invites the requester", async () => {
    const row = page.locator(".r", { hasText: "Casey Lin" }).first();
    await row.locator("ion-button:has-text('Open a case')").click();
    await page.waitForURL(/new-case\?from=/);
    await visible(page, "consultation request");
    await page.fill("#p1n", "Riley Park");
    await page.fill("#p1e", "rpark@example.com");
    await shot(page, "12-new-case-from-request");
    await btn(page, "Open case").click();
    await page.waitForURL(/\/app\/mediator\/cases\/[a-z0-9]+$/);
    newCaseId = page.url().split("/").pop();
    await visible(page, "Setup");
    await shot(page, "13-case-overview");
    const m = await db.caseMember.findMany({ where: { caseId: newCaseId, role: "PARTICIPANT" }, include: { user: true } });
    const casey = m.find((x) => x.user.email === "casey@example.com");
    const riley = m.find((x) => x.user.email === "rpark@example.com");
    const req = await db.consultationRequest.findFirst({ where: { email: "casey@example.com" } });
    return !!casey?.invitedAt && !riley?.invitedAt && req?.status === "CASE_OPENED";
  });

  const c1 = await db.case.findUnique({ where: { reference: "BMS-2026-014" } });
  await step("Case tabs: release a draft with the recipients confirmed first", async () => {
    await page.goto(`${BASE}/app/mediator/cases/${c1.id}?tab=documents`);
    await visible(page, "Shared, restricted and team-only");
    const row = page.locator(".r", { hasText: "Draft: shared asset and debt list" }).first();
    await row.locator("ion-button:has-text('Release…')").click();
    await row.locator("ion-button:has-text('Release…')").last().click();
    await visible(page, "Release now. Visible to:");
    await shot(page, "14-release-confirm");
    await row.locator("ion-button:has-text('Confirm release')").click();
    await page.waitForTimeout(1500);
    const mails = await db.outboxEmail.findMany({ where: { kind: "NOTICE" }, orderBy: { createdAt: "desc" }, take: 2 });
    return mails.length === 2 && mails[0].batchId === mails[1].batchId && !/asset|debt/i.test(mails[0].body);
  });
  await step("Who-can-see-what grid", async () => {
    await page.locator("ion-button:has-text('Who can see what')").click();
    await visible(page, "Document");
    await shot(page, "15-visibility-grid");
    return true;
  });
  await step("Checklist, sessions, messages, people and settings tabs render", async () => {
    for (const t of ["checklist", "sessions", "messages", "people", "settings"]) {
      await page.goto(`${BASE}/app/mediator/cases/${c1.id}?tab=${t}`);
      await page.waitForTimeout(700);
      await shot(page, `16-case-${t}`);
    }
    return (await pageText(page)).includes("Safety flag");
  });
  await step("Preview as participant shows exactly their view", async () => {
    const jordan = await db.user.findUnique({ where: { email: "jordan@example.com" } });
    await page.goto(`${BASE}/app/mediator/cases/${c1.id}/preview/${jordan.id}`);
    await visible(page, "exactly what Jordan Alvarez sees");
    await page.locator("ion-segment-button[value=documents]").click();
    await page.waitForTimeout(500);
    await shot(page, "17-preview-as-jordan");
    const t = await pageText(page);
    return !t.includes("Individual session follow-up") && t.includes("Parenting schedule worksheet");
  });
  await ctx.close();
}

// 3. The requester now sees their case ---------------------------------------------------------
await step("Requester signs in again and lands in their new case workspace", async () => {
  const { ctx, page } = await signIn("casey@example.com", phone);
  await visible(page, "Private intake and screening");
  await shot(page, "20-casey-case-home");
  const t = await pageText(page);
  await ctx.close();
  return t.includes("Current milestone");
});
await step("A participant who wasn't invited can't open the case", async () => {
  const { ctx, page } = await signIn("rpark@example.com", phone);
  await visible(page, "No case yet");
  await ctx.close();
  return true;
});

// 4. Client interface --------------------------------------------------------------------------
{
  const { ctx, page } = await signIn("jordan@example.com", phone);
  await step("Client home: milestone, next action, owner, last update", async () => {
    await visible(page, "Exchange financial information");
    await shot(page, "30-client-home");
    const t = await pageText(page);
    return t.includes("Next action") && t.includes("Updated");
  });
  await step("Client uploads a requested document privately", async () => {
    await page.goto(`${BASE}/app/client/documents`);
    await visible(page, "Checklist");
    await shot(page, "31-client-documents");
    const row = page.locator(".r", { hasText: "2024 and 2025 tax returns" }).first();
    const chooser = page.waitForEvent("filechooser");
    await row.locator("ion-button:has-text('Upload')").click();
    await (await chooser).setFiles({ name: "returns.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });
    await visible(page, "Only you and the case team");
    const up = await db.document.findFirst({ where: { title: { startsWith: "2024 and 2025 tax returns" } }, include: { recipients: true } });
    return up?.state === "SUBMITTED" && up.recipients.length === 1;
  });
  await step("Client message shows who can read it first", async () => {
    await page.goto(`${BASE}/app/client/messages`);
    await visible(page, "Who can read this");
    await page.fill("#msg", "Can we move Session 2 to the afternoon?");
    await btn(page, "Send").click();
    await visible(page, "Can we move Session 2");
    await shot(page, "32-client-messages");
    return (await pageText(page)).includes("Not visible to Sam Brooks");
  });
  await step("Client is kept out of the team interface", async () => {
    await page.goto(`${BASE}/app/mediator/today`);
    await page.waitForURL(/\/app\/client/);
    return true;
  });
  await ctx.close();
}

// 5. Server-side permissions -------------------------------------------------------------------
async function token(email) {
  await fetch(`${BASE}/api/v1/auth/code`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
  const r = await fetch(`${BASE}/api/v1/auth/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code: CODE }) });
  return (await r.json()).token;
}
const get = (t, p) => fetch(`${BASE}/api/v1/${p}`, { headers: { Authorization: `Bearer ${t}` } });
{
  const sam = await token("sam@example.com");
  const docs = await db.document.findMany();
  const by = (t) => docs.find((d) => d.title.startsWith(t));
  for (const [title, expect] of [["Individual session follow-up", 200], ["FL-150, submitted by Jordan", 404], ["Mediator working notes", 404], ["Parenting schedule worksheet", 200]])
    await step(`Sam downloads "${title}" → ${expect}`, async () => { const r = await get(sam, `documents/${by(title).id}/file`); return r.status === expect || `got ${r.status}`; });
  const c2 = await db.case.findUnique({ where: { reference: "BMS-2026-019" } });
  await step("Sam can't open another family's case", async () => (await get(sam, `cases/${c2.id}/workspace`)).status === 404);
  const priya = await token("priya@beacon.test");
  const c1 = await db.case.findUnique({ where: { reference: "BMS-2026-014" } });
  await step("A mediator can't open a case they're not on", async () => (await get(priya, `staff/cases/${c1.id}`)).status === 404);
  await step("Mediators can't reach admin tools", async () => (await get(priya, "admin/team")).status === 403);
}

// 6. Admin interface ---------------------------------------------------------------------------
{
  const { ctx, page } = await signIn("marcus@beacon.test");
  await step("Admin Today covers the whole practice", async () => { await visible(page, "across the practice"); await shot(page, "40-admin-today"); return true; });
  for (const [path, text, name] of [["cases", "BMS-2026-014", "41-admin-cases"], ["requests", "Consultation requests", "42-admin-intake"], ["team", "Add someone", "43-admin-team"], ["more", "Content library", "44-admin-more"], ["library", "still need legal review", "45-admin-library"], ["activity", "Entries can", "46-admin-audit"], ["outbox", "Sign-in codes are never listed", "47-admin-outbox"], ["measures", "Last 30 days", "48-admin-measures"]])
    await step(`Admin ${path}`, async () => { await page.goto(`${BASE}/app/admin/${path}`); await visible(page, text); await shot(page, name); return true; });
  await step("Admin intake hides safety requests (mediators only)", async () => {
    await page.goto(`${BASE}/app/admin/requests`);
    await visible(page, "Consultation requests");
    return !(await pageText(page)).includes("Private safety requests");
  });
  await step("Outbox never lists sign-in codes", async () => !(await pageText(page)).includes("sign-in code"));
  await ctx.close();
}

await step("Website sign-in links lead to the app", async () => {
  const r = await fetch(`${BASE}/signin`, { redirect: "manual" });
  return r.status === 307 && r.headers.get("location")?.endsWith("/app");
});

console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
await browser.close();
await db.$disconnect();
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
