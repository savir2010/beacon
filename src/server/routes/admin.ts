import "server-only";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendStaffWelcome } from "@/lib/notify";
import { body, fail, isEmail, json, s } from "../http";

export async function team(req: Request) {
  await requireAdmin(req);
  const users = await db.user.findMany({
    where: { role: { in: ["ADMIN", "MEDIATOR"] } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { memberships: { where: { active: true, role: "MEDIATOR", case: { status: "OPEN" } } } },
  });
  return json({
    team: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, lastSignInAt: u.lastSignInAt, openCases: u.memberships.length })),
  });
}

export async function addTeam(req: Request) {
  const a = await requireAdmin(req);
  const b = await body(req);
  const name = s(b.name, 80);
  const email = s(b.email, 120).toLowerCase();
  const role = s(b.role) === "ADMIN" ? "ADMIN" : "MEDIATOR";
  if (!name || !isEmail(email)) return fail(400, "Enter a name and a valid email.");
  if (await db.user.findUnique({ where: { email } })) return fail(400, "Someone already uses that email.");
  const u = await db.user.create({ data: { name, email, role } });
  await sendStaffWelcome(email);
  await audit(a, "access.grant", `Created a ${role === "ADMIN" ? "administrator" : "mediator"} account for ${name}`, { targetId: u.id });
  return json({ ok: true, message: `${name} can now sign in with ${email}.` });
}

export async function updateTeam(req: Request, id: string) {
  const a = await requireAdmin(req);
  if (id === a.id) return fail(400, "You can't change your own account here.");
  const b = await body(req);
  const u = await db.user.findFirst({ where: { id, role: { in: ["ADMIN", "MEDIATOR"] } } });
  if (!u) return fail(404, "Not found");
  const data: { role?: string; active?: boolean } = {};
  if (b.role !== undefined) data.role = s(b.role) === "ADMIN" ? "ADMIN" : "MEDIATOR";
  if (b.active !== undefined) data.active = !!b.active;
  await db.user.update({ where: { id }, data });
  if (data.active === false) await db.authSession.deleteMany({ where: { userId: id } });
  await audit(a, "permission.change", `${u.name}: ${data.active === false ? "account turned off and signed out" : data.active ? "account turned on" : `role set to ${data.role?.toLowerCase()}`}`, { targetId: id });
  return json({ ok: true });
}

export async function library(req: Request) {
  await requireAdmin(req);
  const [articles, qa] = await Promise.all([
    db.article.findMany({ orderBy: { title: "asc" } }),
    db.qAEntry.findMany({ orderBy: [{ topic: "asc" }, { question: "asc" }] }),
  ]);
  return json({ articles, qa });
}

const reviewFields = (b: Record<string, unknown>) => {
  const reviewStatus = s(b.reviewStatus) === "REVIEWED" ? "REVIEWED" : "DRAFT";
  const reviewerName = s(b.reviewerName, 80) || null;
  const d = s(b.reviewedAt);
  const reviewedAt = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T17:00:00Z`) : null;
  if (reviewStatus === "REVIEWED" && (!reviewerName || !reviewedAt)) return fail(400, "Reviewed content needs the reviewer's name and the review date.");
  return { reviewStatus, reviewerName, reviewedAt };
};

export async function saveArticle(req: Request, id: string) {
  const a = await requireAdmin(req);
  const b = await body(req);
  const r = reviewFields(b);
  const title = s(b.title, 160);
  if (!title) return fail(400, "The article needs a title.");
  await db.article.update({ where: { id }, data: { title, summary: s(b.summary, 400), body: typeof b.body === "string" ? b.body.slice(0, 40000) : "", ...r, updatedAt: new Date() } });
  await audit(a, "content.update", `Edited article "${title}" (${r.reviewStatus.toLowerCase()})`);
  return json({ ok: true, message: "Saved. The Resource Center and Navigator use it right away." });
}

export async function saveQA(req: Request, id: string) {
  const a = await requireAdmin(req);
  const b = await body(req);
  const r = reviewFields(b);
  const question = s(b.question, 200);
  if (!question || !s(b.answer)) return fail(400, "A Navigator answer needs a question and an answer.");
  await db.qAEntry.update({
    where: { id },
    data: {
      question, answer: s(b.answer, 1200), phrasings: typeof b.phrasings === "string" ? b.phrasings.slice(0, 2000) : "",
      sourceLabel: s(b.sourceLabel, 120), sourceUrl: s(b.sourceUrl, 300), nextLabel: s(b.nextLabel, 120), nextHref: s(b.nextHref, 300), ...r, updatedAt: new Date(),
    },
  });
  await audit(a, "content.update", `Edited Navigator answer "${question}" (${r.reviewStatus.toLowerCase()})`);
  return json({ ok: true, message: "Saved." });
}

export async function activity(req: Request) {
  await requireAdmin(req);
  const p = new URL(req.url).searchParams;
  const kind = p.get("kind") ?? "";
  const prefix: Record<string, string[]> = {
    access: ["access.", "permission.", "invitation."], documents: ["document."], signin: ["auth."], cases: ["case.", "milestone.", "checklist.", "session.", "update."], content: ["content."],
  };
  const where = prefix[kind] ? { OR: prefix[kind].map((x) => ({ action: { startsWith: x } })) } : {};
  const events = await db.auditEvent.findMany({ where, orderBy: { at: "desc" }, take: 150 });
  const caseIds = [...new Set(events.map((e) => e.caseId).filter(Boolean))] as string[];
  const refs = new Map((await db.case.findMany({ where: { id: { in: caseIds } }, select: { id: true, reference: true } })).map((c) => [c.id, c.reference]));
  return json({ events: events.map((e) => ({ id: e.id, at: e.at, actor: e.actorLabel, action: e.action, detail: e.detail, reference: e.caseId ? refs.get(e.caseId) ?? null : null })) });
}

/** The email stand-in. Sign-in codes are never listed, so no one on the team can sign in as someone else. */
export async function outbox(req: Request) {
  await requireAdmin(req);
  const mails = await db.outboxEmail.findMany({ where: { kind: { not: "LOGIN_CODE" } }, orderBy: { createdAt: "desc" }, take: 100 });
  return json({ emails: mails.map((m) => ({ id: m.id, to: m.toEmail, subject: m.subject, body: m.body, batchId: m.batchId, at: m.createdAt })) });
}

export async function measures(req: Request) {
  await requireAdmin(req);
  const since = new Date(Date.now() - 30 * 86400_000);
  const [metrics, unanswered, openCases, consults] = await Promise.all([
    db.metricEvent.groupBy({ by: ["name"], where: { at: { gte: since } }, _count: true }),
    db.unansweredQuestion.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    db.case.count({ where: { status: "OPEN" } }),
    db.consultationRequest.count({ where: { createdAt: { gte: since } } }),
  ]);
  const m = (k: string) => metrics.find((x) => x.name === k)?._count ?? 0;
  const rated = m("nextstep.clear") + m("nextstep.unclear");
  return json({
    measures: [
      { label: "Open cases", value: String(openCases) },
      { label: "Consultation requests", value: String(consults) },
      { label: "Navigator answers", value: String(m("navigator.answer")) },
      { label: "Handed to a person", value: String(m("navigator.handoff")) },
      { label: "Checklists built", value: String(m("checklist.view")) },
      { label: "Checklists downloaded", value: String(m("checklist.download")) },
      { label: "Next step was clear", value: rated ? `${Math.round((m("nextstep.clear") / rated) * 100)}%` : "No ratings yet" },
    ],
    unanswered: unanswered.map((u) => ({ id: u.id, text: u.text, reason: u.reason, at: u.createdAt })),
  });
}
