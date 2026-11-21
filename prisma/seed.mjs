// Seeds Beacon with the draft content library and two demonstration cases.
// All people and cases below are fictional demonstration data.
import { PrismaClient } from "@prisma/client";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ARTICLES, QA } from "../src/content/library.mjs";

// Load .env manually so the seed works without extra tooling.
try {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const db = new PrismaClient();
const KEY = Buffer.from(process.env.BEACON_FILE_KEY ?? "", "base64");
if (KEY.length !== 32) throw new Error("BEACON_FILE_KEY must be 32 bytes, base64. Run npm run setup.");
const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-11-19T17:00:00.000Z");
const at = (days, hour = 17) => {
  const d = new Date(now.getTime() + days * day);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

async function pdf(title, lines) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.086, 0.196, 0.29);
  page.drawText("Beacon Mediation Services", { x: 56, y: 736, size: 10, font, color: rgb(0.3, 0.4, 0.5) });
  page.drawText(title, { x: 56, y: 704, size: 18, font: bold, color: ink });
  let y = 670;
  for (const line of [...lines, "", "Demonstration document. Fictional case data."]) {
    page.drawText(line, { x: 56, y, size: 11, font, color: ink });
    y -= 18;
  }
  return Buffer.from(await doc.save());
}

async function store(buf) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(buf), cipher.final()]);
  const storageKey = randomBytes(16).toString("hex");
  await db.storedFile.create({ data: { key: storageKey, data: enc } });
  return { storageKey, iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64"), size: buf.length };
}

const token = () => randomBytes(24).toString("base64url");
const sha = (t) => createHash("sha256").update(t).digest("hex");

async function main() {
  for (const m of [
    "metricEvent", "auditEvent", "outboxEmail", "documentRecipient", "document", "message", "jointUpdate", "checklistItem",
    "mediationSession", "milestone", "caseMember", "loginCode", "authSession", "consultationRequest", "case", "user",
    "article", "qAEntry", "safetyRequest", "unansweredQuestion", "storedFile",
  ]) await db[m].deleteMany();

  // Content library (draft, pending legal review)
  for (const a of ARTICLES) {
    await db.article.create({
      data: {
        slug: a.slug, title: a.title, summary: a.summary, body: a.body, stage: a.stage,
        readMinutes: a.readMinutes, officialLinks: JSON.stringify(a.officialLinks),
      },
    });
  }
  for (const q of QA) {
    await db.qAEntry.create({
      data: {
        question: q.question, phrasings: q.phrasings, answer: q.answer, topic: q.topic, stage: q.stage,
        articleSlug: q.articleSlug, sourceLabel: q.source.label, sourceUrl: q.source.url,
        nextLabel: q.nextLabel, nextHref: q.nextHref,
      },
    });
  }

  // Sign-in is by emailed code; no passwords exist.
  const user = (email, name, role, extra = {}) => db.user.create({ data: { email, name, role, ...extra } });

  const marcus = await user("marcus@beacon.test", "Marcus Oyelaran", "ADMIN");
  const dana = await user("dana@beacon.test", "Dana Whitfield", "MEDIATOR");
  await user("priya@beacon.test", "Priya Raman", "MEDIATOR");
  const jordan = await user("jordan@example.com", "Jordan Alvarez", "PARTICIPANT");
  const sam = await user("sam@example.com", "Sam Brooks", "PARTICIPANT");
  const riley = await user("riley@example.com", "Riley Nguyen", "PARTICIPANT");
  const morales = await user("amorales@example.com", "A. Morales", "PARTICIPANT");

  // Case 1: active, mid-process
  const c1 = await db.case.create({
    data: {
      reference: "BMS-2026-014",
      title: "Alvarez / Brooks",
      nextAction: "Upload your Income and Expense Declaration (FL-150)",
      nextActionOwner: "Each participant",
      updatedAt: at(-1, 22),
      createdAt: at(-34),
    },
  });
  for (const [u, role] of [[dana, "MEDIATOR"], [jordan, "PARTICIPANT"], [sam, "PARTICIPANT"]]) {
    await db.caseMember.create({ data: { caseId: c1.id, userId: u.id, role, addedAt: at(-34), invitedAt: role === "PARTICIPANT" ? at(-33) : null } });
  }
  const ms = [
    ["Private intake and screening", "Each of you met with Beacon separately.", "BEACON", "DONE", at(-30)],
    ["First joint session", "Process, ground rules and the list of topics.", "BEACON", "DONE", at(-14)],
    ["Exchange financial information", "Each person shares income, assets and debts.", "BEACON", "CURRENT", null],
    ["Parenting schedule session", "School weeks, holidays and transportation.", "BEACON", "UPCOMING", at(14)],
    ["Review the draft agreement", "Have your own lawyer review it before signing.", "BEACON", "UPCOMING", null],
    ["Judgment entered by the court", "Only the court can confirm this date.", "COURT", "UPCOMING", null],
  ];
  for (const [i, [title, description, kind, status, date]] of ms.entries()) {
    await db.milestone.create({ data: { caseId: c1.id, title, description, kind, status, date, position: i } });
  }
  await db.mediationSession.create({
    data: {
      caseId: c1.id, title: "Session 2: parenting schedule", startsAt: at(14, 18), durationMin: 120,
      location: "Video meeting. The link appears here 24 hours before.",
      prep: "Bring your children's school calendar and your work schedule.",
    },
  });
  await db.mediationSession.create({
    data: {
      caseId: c1.id, title: "Session 3: finances and property", startsAt: at(28, 18), durationMin: 120,
      location: "Beacon office, 410 Harbor Way, Suite 200",
    },
  });

  const item = (data) => db.checklistItem.create({ data: { caseId: c1.id, ...data } });
  const iJointList = await item({ title: "Shared list of assets and debts", description: "One list both of you can see and edit with the team.", status: "UNDER_REVIEW", updatedAt: at(-2) });
  const iJordanFL150 = await item({ title: "Income and Expense Declaration (FL-150)", assigneeId: jordan.id, status: "RECEIVED", dueDate: at(7), updatedAt: at(-1) });
  await item({ title: "2024 and 2025 tax returns", assigneeId: jordan.id, status: "REQUESTED", dueDate: at(10) });
  await item({ title: "Income and Expense Declaration (FL-150)", assigneeId: sam.id, status: "REQUESTED", dueDate: at(7) });
  await item({ title: "Recent pay stubs (last 3 months)", assigneeId: sam.id, status: "REQUESTED", dueDate: at(10) });
  const iSummary = await item({ title: "Session 1 summary", description: "Topics you listed together.", status: "AVAILABLE", updatedAt: at(-12) });

  const doc = async ({ title, filename, lines, visibility, state, uploadedBy, releasedBy, releasedAt, recipients = [], checklistItemId, createdAt }) => {
    const s = await store(await pdf(title, lines));
    const d = await db.document.create({
      data: {
        caseId: c1.id, title, filename, mime: "application/pdf", size: s.size, storageKey: s.storageKey, iv: s.iv,
        authTag: s.authTag, visibility, state, uploadedById: uploadedBy.id, releasedById: releasedBy?.id,
        releasedAt, checklistItemId, createdAt: createdAt ?? releasedAt ?? now,
      },
    });
    for (const r of recipients) await db.documentRecipient.create({ data: { documentId: d.id, userId: r.id } });
    return d;
  };
  await doc({ title: "Agreement to mediate", filename: "agreement-to-mediate.pdf", lines: ["Signed by both participants on intake.", "Explains the mediator's neutral role and confidentiality."], visibility: "JOINT", state: "RELEASED", uploadedBy: dana, releasedBy: dana, releasedAt: at(-28) });
  await doc({ title: "Session 1 summary", filename: "session-1-summary.pdf", lines: ["Topics listed together:", "- Parenting schedule (school weeks, holidays, transportation)", "- Child support", "- The family home", "- Retirement accounts"], visibility: "JOINT", state: "RELEASED", uploadedBy: dana, releasedBy: dana, releasedAt: at(-12), checklistItemId: iSummary.id });
  await doc({ title: "Parenting schedule worksheet", filename: "parenting-schedule-worksheet.pdf", lines: ["Fill in your children's current weekly routine before Session 2."], visibility: "JOINT", state: "RELEASED", uploadedBy: marcus, releasedBy: dana, releasedAt: at(-1, 22) });
  await doc({ title: "FL-150, submitted by Jordan", filename: "fl-150-alvarez.pdf", lines: ["Submitted by Jordan Alvarez.", "Visible to Jordan and the Beacon case team only."], visibility: "RESTRICTED", state: "SUBMITTED", uploadedBy: jordan, recipients: [jordan], checklistItemId: iJordanFL150.id, createdAt: at(-1, 15) });
  await doc({ title: "Individual session follow-up", filename: "follow-up-brooks.pdf", lines: ["Notes from Sam's individual check-in, released to Sam only."], visibility: "RESTRICTED", state: "RELEASED", uploadedBy: dana, releasedBy: dana, releasedAt: at(-9), recipients: [sam] });
  await doc({ title: "Mediator working notes", filename: "working-notes.pdf", lines: ["Staff working material. Never released."], visibility: "STAFF_ONLY", state: "DRAFT", uploadedBy: dana, createdAt: at(-3) });
  await doc({ title: "Draft: shared asset and debt list", filename: "asset-debt-list-draft.pdf", lines: ["Draft prepared from both participants' lists.", "Under review by the case team."], visibility: "JOINT", state: "DRAFT", uploadedBy: marcus, checklistItemId: iJointList.id, createdAt: at(-2) });

  await db.message.create({ data: { caseId: c1.id, threadUserId: jordan.id, authorId: jordan.id, body: "Could Session 2 start at 10:30 instead of 10? I have a school drop-off.", createdAt: at(-3, 16) } });
  await db.message.create({ data: { caseId: c1.id, threadUserId: jordan.id, authorId: dana.id, body: "We'll check with everyone and confirm by Friday. Nothing changes until you see it in your workspace.", createdAt: at(-3, 19) } });
  await db.jointUpdate.create({ data: { caseId: c1.id, body: "Session 2 is scheduled. The parenting schedule worksheet is ready in your documents.", releasedById: dana.id, releasedAt: at(-1, 22) } });

  // Case 2: safety flag on, one participant invited and not yet signed in
  const c2 = await db.case.create({
    data: {
      reference: "BMS-2026-019",
      title: "Nguyen / (pending)",
      safetyFlag: true,
      nextAction: "Private intake call with your mediator",
      nextActionOwner: "Riley",
      createdAt: at(-2),
      updatedAt: at(-2),
    },
  });
  await db.caseMember.create({ data: { caseId: c2.id, userId: dana.id, role: "MEDIATOR" } });
  await db.caseMember.create({ data: { caseId: c2.id, userId: riley.id, role: "PARTICIPANT", notificationsEnabled: false, invitedAt: at(-2) } });
  await db.milestone.create({ data: { caseId: c2.id, title: "Private intake and screening", status: "CURRENT", position: 0 } });
  await db.consultationRequest.create({ data: { userId: morales.id, name: "A. Morales", email: "amorales@example.com", preferredContact: "EMAIL", bestTime: "Weekday evenings", topics: "PARENTING,DOCUMENTS", createdAt: at(-1, 14) } });

  for (const [action, actor, detail, when, caseId] of [
    ["case.create", dana, "Created case BMS-2026-014", at(-34), c1.id],
    ["document.release", dana, "Released \"Session 1 summary\" to Jordan Alvarez, Sam Brooks", at(-12), c1.id],
    ["document.release", dana, "Released \"Individual session follow-up\" to Sam Brooks", at(-9), c1.id],
    ["document.upload", jordan, "Submitted \"FL-150, submitted by Jordan\"", at(-1, 15), c1.id],
    ["document.release", dana, "Released \"Parenting schedule worksheet\" to Jordan Alvarez, Sam Brooks", at(-1, 22), c1.id],
    ["case.create", dana, "Created case BMS-2026-019", at(-2), c2.id],
    ["case.safety", dana, "Safety flag turned on; notifications off for Riley Nguyen", at(-2), c2.id],
  ]) {
    await db.auditEvent.create({ data: { action, actorId: actor.id, actorLabel: actor.name, detail, at: when, caseId } });
  }

  console.log("\nSeeded Beacon demo data.");
  console.log(`  App:      /app  (sign in with an email; the code is emailed${process.env.BEACON_DEMO_CODE ? `, demo code ${process.env.BEACON_DEMO_CODE}` : ""})`);
  console.log(`  Admin:    marcus@beacon.test`);
  console.log(`  Mediator: dana@beacon.test, priya@beacon.test`);
  console.log(`  Clients:  jordan@example.com, sam@example.com, riley@example.com, amorales@example.com (consultation only)\n`);
}

main().finally(() => db.$disconnect());
