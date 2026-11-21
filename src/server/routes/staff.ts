import "server-only";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { caseFor } from "@/lib/access";
import { audit } from "@/lib/audit";
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, storeEncrypted } from "@/lib/files";
import { notifyParticipants, sendInvitation } from "@/lib/notify";
import { body, fail, isEmail, json, s } from "../http";
import { attentionFor, staffCaseView } from "../views";

type B = Record<string, unknown>;
type Case = Awaited<ReturnType<typeof caseFor>>;
const touch = (caseId: string) => db.case.update({ where: { id: caseId }, data: { updatedAt: new Date() } });

const DEFAULT_MILESTONES = [
  ["Private intake and screening", "Beacon meets with each person separately.", "BEACON"],
  ["First joint session", "Process, ground rules and the list of topics.", "BEACON"],
  ["Exchange financial information", "Each person shares income, assets and debts.", "BEACON"],
  ["Work through each topic", "Parenting, support, property and timing.", "BEACON"],
  ["Review the draft agreement", "Have your own lawyer review it before signing.", "BEACON"],
  ["Judgment entered by the court", "Only the court can confirm this date.", "COURT"],
] as const;

async function participantFor(name: string, email: string) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && existing.role !== "PARTICIPANT") return fail(400, "That email belongs to a Beacon team account.");
  return existing ?? (await db.user.create({ data: { email, name, role: "PARTICIPANT" } }));
}

async function invite(actor: User, caseId: string, memberId: string) {
  const m = await db.caseMember.update({ where: { id: memberId }, data: { invitedAt: new Date() }, include: { user: true } });
  await sendInvitation(m.user.email);
  await audit(actor, "invitation.send", `Invited ${m.user.name} to the workspace`, { caseId, targetId: m.userId });
}

/** "2026-12-03" + "10:00" in California time, as a UTC Date. */
function pacificToUtc(date: string, time: string) {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const t = time.match(/^(\d{2}):(\d{2})$/);
  if (!m || !t) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]);
  const off = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", timeZoneName: "shortOffset" })
    .formatToParts(new Date(guess)).find((p) => p.type === "timeZoneName")?.value.match(/GMT([+-]\d+)/);
  return new Date(guess - (off ? Number(off[1]) : -8) * 3600_000);
}

// Dashboard ---------------------------------------------------------------------------------

export async function today(req: Request) {
  const u = await requireStaff(req);
  return json(await attentionFor(u));
}

export async function cases(req: Request) {
  const u = await requireStaff(req);
  const status = new URL(req.url).searchParams.get("status") === "CLOSED" ? "CLOSED" : "OPEN";
  const where = u.role === "ADMIN" ? { status } : { status, members: { some: { userId: u.id, active: true, role: "MEDIATOR" } } };
  const rows = await db.case.findMany({ where, include: { members: { include: { user: true } }, milestones: { where: { status: "CURRENT" } } }, orderBy: { updatedAt: "desc" } });
  return json({
    cases: rows.map((c) => ({
      id: c.id, reference: c.reference, title: c.title, status: c.status, safetyFlag: c.safetyFlag, updatedAt: c.updatedAt,
      participants: c.members.filter((m) => m.role === "PARTICIPANT" && m.active).map((m) => m.user.name),
      mediators: c.members.filter((m) => m.role === "MEDIATOR" && m.active).map((m) => m.user.name),
      milestone: c.milestones[0]?.title ?? null, nextAction: c.nextAction,
    })),
  });
}

export async function getCase(req: Request, id: string) {
  const u = await requireStaff(req);
  const v = await staffCaseView(u, id);
  const mediators = u.role === "ADMIN" ? await db.user.findMany({ where: { role: "MEDIATOR", active: true }, select: { id: true, name: true } }) : [];
  return json({ ...v, mediators });
}

// Intake ------------------------------------------------------------------------------------

export async function requests(req: Request) {
  const u = await requireStaff(req);
  const where = u.role === "ADMIN" ? { status: { in: ["NEW", "SCREENING"] } } : { status: { in: ["NEW", "SCREENING"] }, OR: [{ assigneeId: u.id }, { assigneeId: null }] };
  const [consults, safety, mediators] = await Promise.all([
    db.consultationRequest.findMany({ where, orderBy: { createdAt: "desc" }, include: { assignee: true } }),
    u.role === "MEDIATOR" ? db.safetyRequest.findMany({ where: { status: { not: "CLOSED" } }, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    db.user.findMany({ where: { role: "MEDIATOR", active: true }, select: { id: true, name: true } }),
  ]);
  return json({
    consultations: consults.map((r) => ({
      id: r.id, name: r.name, email: r.email, phone: r.phone, preferredContact: r.preferredContact, bestTime: r.bestTime,
      safeToLeaveMessage: r.safeToLeaveMessage, topics: r.topics ? r.topics.split(",") : [], status: r.status, createdAt: r.createdAt,
      assignee: r.assignee ? { id: r.assignee.id, name: r.assignee.name } : null,
    })),
    safety: safety.map((r) => ({ id: r.id, contactMethod: r.contactMethod, contactValue: r.contactValue, safeTimes: r.safeTimes, safeToLeaveMessage: r.safeToLeaveMessage, status: r.status, createdAt: r.createdAt })),
    canSeeSafety: u.role === "MEDIATOR",
    mediators,
  });
}

export async function updateRequest(req: Request, kind: string, id: string) {
  const u = await requireStaff(req);
  const b = await body(req);
  if (kind === "safety") {
    if (u.role !== "MEDIATOR") return fail(403, "Only mediators handle safety requests.");
    const status = s(b.status);
    if (!["NEW", "CONTACTED", "CLOSED"].includes(status)) return fail(400, "Unknown status.");
    await db.safetyRequest.update({ where: { id }, data: { status } });
    await audit(u, "inbox.update", `Marked a safety request ${status.toLowerCase()}`);
    return json({ ok: true });
  }
  const r = await db.consultationRequest.findUnique({ where: { id } });
  if (!r) return fail(404, "Not found");
  const data: { status?: string; assigneeId?: string | null } = {};
  if (b.status !== undefined) {
    const status = s(b.status);
    if (!["NEW", "SCREENING", "CLOSED"].includes(status)) return fail(400, "Unknown status.");
    data.status = status;
  }
  if (b.assigneeId !== undefined) {
    const a = s(b.assigneeId);
    if (a && !(await db.user.findFirst({ where: { id: a, role: "MEDIATOR", active: true } }))) return fail(400, "Choose a mediator.");
    if (u.role !== "ADMIN" && a && a !== u.id) return fail(403, "Mediators can only take requests themselves.");
    data.assigneeId = a || null;
    if (a && r.status === "NEW") data.status = "SCREENING";
  }
  await db.consultationRequest.update({ where: { id }, data });
  await audit(u, "inbox.update", `Consultation request from ${r.name}: ${data.status ? data.status.toLowerCase() : "reassigned"}`);
  return json({ ok: true });
}

// Create a case -----------------------------------------------------------------------------

export async function createCase(req: Request) {
  const u = await requireStaff(req);
  const b = await body<{ title?: string; safety?: boolean; consultationId?: string; mediatorId?: string; participants?: { name?: string; email?: string; invite?: boolean }[] }>(req);
  const title = s(b.title, 80);
  if (!title) return fail(400, "Give the case an internal label, like the family names.");
  const consult = b.consultationId ? await db.consultationRequest.findUnique({ where: { id: s(b.consultationId) } }) : null;
  if (b.consultationId && (!consult || consult.caseId)) return fail(400, "That request already has a case.");
  const people: { name: string; email: string; invite: boolean }[] = [];
  for (const [i, p] of (b.participants ?? []).slice(0, 4).entries()) {
    const name = s(p.name, 80);
    const email = s(p.email, 120).toLowerCase();
    if (!name && !email) continue;
    if (!name || !isEmail(email)) return fail(400, `Participant ${i + 1} needs a name and a valid email.`);
    people.push({ name, email, invite: !!p.invite });
  }
  if (!people.length) return fail(400, "Add at least one participant.");
  let mediator = u;
  if (u.role === "ADMIN") {
    const m = await db.user.findFirst({ where: { id: s(b.mediatorId), role: "MEDIATOR", active: true } });
    if (!m) return fail(400, "Assign a mediator to the case.");
    mediator = m;
  }
  const safety = !!b.safety;
  const users = [];
  for (const p of people) users.push(await participantFor(p.name, p.email));
  const year = new Date().getFullYear();
  const count = await db.case.count({ where: { reference: { startsWith: `BMS-${year}-` } } });
  const c = await db.case.create({
    data: {
      reference: `BMS-${year}-${String(count + 20).padStart(3, "0")}`,
      title, safetyFlag: safety,
      nextAction: "Private intake and screening", nextActionOwner: "Beacon case team",
      members: {
        create: [
          { userId: mediator.id, role: "MEDIATOR" },
          ...users.map((x) => ({ userId: x.id, role: "PARTICIPANT", notificationsEnabled: !safety })),
        ],
      },
      milestones: { create: DEFAULT_MILESTONES.map(([t, d, k], i) => ({ title: t, description: d, kind: k, position: i, status: i === 0 ? "CURRENT" : "UPCOMING" })) },
    },
    include: { members: true },
  });
  await audit(u, "case.create", `Created case ${c.reference}${safety ? " with the safety flag on" : ""}; mediator ${mediator.name}`, { caseId: c.id });
  for (const [i, x] of users.entries()) {
    await audit(u, "access.grant", `Added ${x.name} as a participant`, { caseId: c.id, targetId: x.id });
    const member = c.members.find((m) => m.userId === x.id)!;
    // The person who asked for the consultation already has an account and expects to hear back.
    if (people[i].invite || (consult && consult.userId === x.id)) await invite(u, c.id, member.id);
  }
  if (consult) {
    await db.consultationRequest.update({ where: { id: consult.id }, data: { caseId: c.id, status: "CASE_OPENED", assigneeId: mediator.id } });
    await audit(u, "inbox.update", `Opened case ${c.reference} from ${consult.name}'s consultation request`, { caseId: c.id });
  }
  return json({ ok: true, id: c.id, reference: c.reference });
}

// Case actions ------------------------------------------------------------------------------

type Handler = (u: User, c: Case, b: B) => Promise<string | void>;

const participantIds = (c: Case) => c.members.filter((m) => m.role === "PARTICIPANT" && m.active).map((m) => m.userId);
const names = (c: Case, ids: string[]) => c.members.filter((m) => ids.includes(m.userId)).map((m) => m.user.name);

async function afterRelease(u: User, c: Case, docId: string, title: string, visibility: string, recipients: string[], itemId?: string | null) {
  const ids = visibility === "JOINT" ? participantIds(c) : recipients;
  const who = names(c, ids);
  await audit(u, "document.release", `Released "${title}" to ${who.join(", ")}`, { caseId: c.id, documentId: docId });
  if (itemId) await db.checklistItem.update({ where: { id: itemId }, data: { status: "AVAILABLE", updatedAt: new Date() } });
  const n = await notifyParticipants(c.id, ids);
  return `Released to ${who.join(" and ")}.${n.sent.length ? ` Sign-in notice sent to ${n.sent.join(" and ")} at the same time.` : ""}${n.skipped.length ? ` No email to ${n.skipped.join(" and ")} (notifications off or not invited yet).` : ""}`;
}

function audience(b: B, c: Case) {
  const visibility = s(b.visibility);
  if (!["JOINT", "RESTRICTED", "STAFF_ONLY"].includes(visibility)) return fail(400, "Choose who can see this document.");
  const ids = participantIds(c);
  const recipients = visibility === "RESTRICTED" ? (Array.isArray(b.recipients) ? b.recipients.map(String).filter((x) => ids.includes(x)) : []) : [];
  if (visibility === "RESTRICTED" && !recipients.length) return fail(400, "Choose at least one recipient.");
  return { visibility, recipients };
}

const ACTIONS: Record<string, Handler> = {
  async nextAction(u, c, b) {
    const nextAction = s(b.nextAction, 200) || null;
    const nextActionOwner = s(b.nextActionOwner, 80) || null;
    await db.case.update({ where: { id: c.id }, data: { nextAction, nextActionOwner, updatedAt: new Date() } });
    await audit(u, "case.update", `Set next action: ${nextAction ?? "none"}${nextActionOwner ? ` (owner: ${nextActionOwner})` : ""}`, { caseId: c.id });
    return "Next action saved. Participants see it at the top of their workspace.";
  },
  async status(u, c, b) {
    const close = s(b.status) === "CLOSED";
    await db.case.update({ where: { id: c.id }, data: { status: close ? "CLOSED" : "OPEN", closedAt: close ? new Date() : null, updatedAt: new Date() } });
    await audit(u, close ? "case.close" : "case.reopen", close ? "Closed the case; participants keep read-only access to released documents for 90 days" : "Reopened the case", { caseId: c.id });
    if (close) await notifyParticipants(c.id);
    return close ? "Case closed. Participants can download their documents for 90 days." : "Case reopened.";
  },
  async safety(u, c, b) {
    const on = !!b.on;
    await db.case.update({ where: { id: c.id }, data: { safetyFlag: on } });
    if (on) await db.caseMember.updateMany({ where: { caseId: c.id, role: "PARTICIPANT" }, data: { notificationsEnabled: false } });
    await audit(u, "case.safety", on ? "Safety flag turned on; email notifications off for all participants" : "Safety flag turned off (notifications unchanged)", { caseId: c.id });
    return on ? "Safety flag on. Email notifications are off for every participant." : "Safety flag off. Notification settings were left as they are.";
  },
  async milestoneCurrent(u, c, b) {
    const ms = await db.milestone.findMany({ where: { caseId: c.id }, orderBy: { position: "asc" } });
    const target = ms.find((m) => m.id === s(b.milestoneId));
    if (!target || target.kind === "COURT") return fail(400, "Choose a Beacon step.");
    for (const m of ms) {
      if (m.kind === "COURT") continue;
      const status = m.position < target.position ? "DONE" : m.id === target.id ? "CURRENT" : "UPCOMING";
      if (m.status !== status) await db.milestone.update({ where: { id: m.id }, data: { status } });
    }
    await touch(c.id);
    await audit(u, "milestone.update", `Current milestone: ${target.title}`, { caseId: c.id });
    return `Current milestone: ${target.title}.`;
  },
  async milestoneVerify(u, c, b) {
    const m = await db.milestone.findFirst({ where: { id: s(b.milestoneId), caseId: c.id, kind: "COURT" } });
    if (!m) return fail(400, "Choose a court event.");
    const verified = !!b.verified;
    await db.milestone.update({ where: { id: m.id }, data: { verified, status: verified ? "DONE" : "UPCOMING" } });
    await touch(c.id);
    await audit(u, "milestone.update", `${m.title}: ${verified ? "verified against the court record" : "marked unverified"}`, { caseId: c.id });
    return verified ? "Marked verified against the court record." : "Marked unverified.";
  },
  async milestoneAdd(u, c, b) {
    const title = s(b.title, 120);
    if (!title) return fail(400, "Give the milestone a title.");
    const kind = s(b.kind) === "COURT" ? "COURT" : "BEACON";
    const last = await db.milestone.findFirst({ where: { caseId: c.id }, orderBy: { position: "desc" } });
    await db.milestone.create({ data: { caseId: c.id, title, description: s(b.description, 200) || null, kind, position: (last?.position ?? -1) + 1 } });
    await audit(u, "milestone.update", `Added ${kind === "COURT" ? "court event" : "milestone"}: ${title}`, { caseId: c.id });
    return "Added.";
  },
  async checklistAdd(u, c, b) {
    const title = s(b.title, 160);
    if (!title) return fail(400, "Say what you're requesting.");
    const assignee = s(b.assigneeId);
    if (assignee && !participantIds(c).includes(assignee)) return fail(400, "Choose a participant on this case.");
    const due = s(b.dueDate);
    await db.checklistItem.create({ data: { caseId: c.id, title, description: s(b.description, 300) || null, assigneeId: assignee || null, dueDate: /^\d{4}-\d{2}-\d{2}$/.test(due) ? new Date(`${due}T17:00:00Z`) : null } });
    await touch(c.id);
    const who = assignee ? names(c, [assignee])[0] : "all participants (joint)";
    await audit(u, "checklist.update", `Requested "${title}" from ${who}`, { caseId: c.id });
    return `Requested from ${who}.`;
  },
  async checklistStatus(u, c, b) {
    const status = s(b.status);
    if (!["REQUESTED", "RECEIVED", "UNDER_REVIEW", "AVAILABLE"].includes(status)) return fail(400, "Unknown status.");
    const it = await db.checklistItem.findFirst({ where: { id: s(b.itemId), caseId: c.id } });
    if (!it) return fail(404, "Not found");
    await db.checklistItem.update({ where: { id: it.id }, data: { status, updatedAt: new Date() } });
    await touch(c.id);
    await audit(u, "checklist.update", `"${it.title}" is now ${status.toLowerCase().replace("_", " ")}`, { caseId: c.id });
    return `"${it.title}" is now ${status.toLowerCase().replace("_", " ")}.`;
  },
  async sessionAdd(u, c, b) {
    const title = s(b.title, 120);
    const startsAt = pacificToUtc(s(b.date), s(b.time));
    if (!title || !startsAt) return fail(400, "Add a title, a date and a time.");
    await db.mediationSession.create({ data: { caseId: c.id, title, startsAt, durationMin: Math.min(480, Math.max(15, Number(b.duration) || 90)), location: s(b.location, 160) || "To be confirmed", prep: s(b.prep, 300) || null } });
    await touch(c.id);
    await audit(u, "session.update", `Scheduled "${title}"`, { caseId: c.id });
    return "Session scheduled. Participants see it in their workspace.";
  },
  async sessionDelete(u, c, b) {
    const x = await db.mediationSession.findFirst({ where: { id: s(b.sessionId), caseId: c.id } });
    if (!x) return fail(404, "Not found");
    await db.mediationSession.delete({ where: { id: x.id } });
    await touch(c.id);
    await audit(u, "session.update", `Removed "${x.title}"`, { caseId: c.id });
    return "Session removed.";
  },
  async release(u, c, b) {
    const a = audience(b, c);
    if (a.visibility === "STAFF_ONLY") return fail(400, "Choose who receives this document.");
    const doc = await db.document.findFirst({ where: { id: s(b.documentId), caseId: c.id } });
    if (!doc) return fail(404, "Not found");
    if (doc.state === "SUBMITTED") return fail(400, "Participant submissions can't be released directly. Upload a version to share instead.");
    await db.documentRecipient.deleteMany({ where: { documentId: doc.id } });
    await db.document.update({ where: { id: doc.id }, data: { state: "RELEASED", visibility: a.visibility, releasedAt: new Date(), releasedById: u.id, recipients: { create: a.recipients.map((userId) => ({ userId })) } } });
    await touch(c.id);
    return afterRelease(u, c, doc.id, doc.title, a.visibility, a.recipients, doc.checklistItemId);
  },
  async withdraw(u, c, b) {
    const doc = await db.document.findFirst({ where: { id: s(b.documentId), caseId: c.id, state: "RELEASED" } });
    if (!doc) return fail(404, "Not found");
    await db.document.update({ where: { id: doc.id }, data: { state: "DRAFT", releasedAt: null } });
    await audit(u, "permission.change", `Withdrew "${doc.title}"; participants can no longer see it`, { caseId: c.id, documentId: doc.id });
    return "Withdrawn. Participants can no longer see it.";
  },
  async participantAdd(u, c, b) {
    const name = s(b.name, 80);
    const email = s(b.email, 120).toLowerCase();
    if (!name || !isEmail(email)) return fail(400, "Enter a name and a valid email.");
    const x = await participantFor(name, email);
    const m = await db.caseMember.upsert({
      where: { caseId_userId: { caseId: c.id, userId: x.id } },
      create: { caseId: c.id, userId: x.id, role: "PARTICIPANT", notificationsEnabled: !c.safetyFlag },
      update: { active: true, removedAt: null },
    });
    await audit(u, "access.grant", `Added ${x.name} as a participant`, { caseId: c.id, targetId: x.id });
    if (b.invite) await invite(u, c.id, m.id);
    return b.invite ? `${x.name} added and invited.` : `${x.name} added. They can't see the case until you invite them.`;
  },
  async invite(u, c, b) {
    const m = c.members.find((x) => x.id === s(b.memberId) && x.role === "PARTICIPANT" && x.active);
    if (!m) return fail(404, "Not found");
    await invite(u, c.id, m.id);
    return `Invitation sent to ${m.user.email}.`;
  },
  async access(u, c, b) {
    const m = c.members.find((x) => x.id === s(b.memberId));
    if (!m || m.userId === u.id) return fail(400, "You can't change your own access.");
    const active = !!b.active;
    await db.caseMember.update({ where: { id: m.id }, data: { active, removedAt: active ? null : new Date() } });
    await audit(u, active ? "access.grant" : "access.revoke", `${active ? "Restored" : "Removed"} access for ${m.user.name}`, { caseId: c.id, targetId: m.userId });
    return `${active ? "Restored" : "Removed"} access for ${m.user.name}. This takes effect immediately.`;
  },
  async notifications(u, c, b) {
    const m = c.members.find((x) => x.id === s(b.memberId) && x.role === "PARTICIPANT");
    if (!m) return fail(404, "Not found");
    const on = !!b.on;
    await db.caseMember.update({ where: { id: m.id }, data: { notificationsEnabled: on } });
    await audit(u, "permission.change", `Email notifications ${on ? "on" : "off"} for ${m.user.name}`, { caseId: c.id, targetId: m.userId });
    return `Email notifications ${on ? "on" : "off"} for ${m.user.name}.`;
  },
  async assignMediator(u, c, b) {
    if (u.role !== "ADMIN") return fail(403, "Only administrators assign mediators.");
    const m = await db.user.findFirst({ where: { id: s(b.userId), role: "MEDIATOR", active: true } });
    if (!m) return fail(400, "Choose a mediator.");
    await db.caseMember.upsert({ where: { caseId_userId: { caseId: c.id, userId: m.id } }, create: { caseId: c.id, userId: m.id, role: "MEDIATOR" }, update: { active: true, removedAt: null, role: "MEDIATOR" } });
    await audit(u, "access.grant", `Gave ${m.name} mediator access to this case`, { caseId: c.id, targetId: m.id });
    return `${m.name} can now open this case.`;
  },
  async reply(u, c, b) {
    const threadUserId = s(b.threadUserId);
    if (!participantIds(c).includes(threadUserId)) return fail(400, "Unknown thread.");
    const text = s(b.body, 2000);
    if (!text) return fail(400, "Write a reply first.");
    await db.message.create({ data: { caseId: c.id, threadUserId, authorId: u.id, body: text } });
    await notifyParticipants(c.id, [threadUserId]);
    return "Reply sent.";
  },
  async jointUpdate(u, c, b) {
    const text = s(b.body, 600);
    if (!text) return fail(400, "Write the update first.");
    await db.jointUpdate.create({ data: { caseId: c.id, body: text, releasedById: u.id } });
    await touch(c.id);
    const n = await notifyParticipants(c.id);
    await audit(u, "update.release", "Released a joint update to all participants", { caseId: c.id });
    return `Released.${n.sent.length ? ` Sign-in notices sent together to ${n.sent.join(" and ")}.` : ""}${n.skipped.length ? ` No email to ${n.skipped.join(" and ")}.` : ""}`;
  },
};

export async function caseAction(req: Request, id: string, action: string) {
  const u = await requireStaff(req);
  const c = await caseFor(u, id);
  const h = ACTIONS[action];
  if (!h) return fail(404, "Unknown action");
  const message = await h(u, c, await body(req));
  return json({ ok: true, message: message ?? "Saved." });
}

export async function upload(req: Request, id: string) {
  const u = await requireStaff(req);
  const c = await caseFor(u, id);
  const fd = await req.formData();
  const a = audience({ visibility: fd.get("visibility"), recipients: fd.getAll("recipients") }, c);
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose a file.");
  if (file.size > MAX_UPLOAD_BYTES) return fail(400, `Files must be ${MAX_UPLOAD_BYTES / 1024 / 1024} MB or smaller.`);
  if (!ALLOWED_TYPES[file.type]) return fail(400, "Upload a PDF, image, Word or Excel file.");
  const title = s(fd.get("title"), 160) || file.name;
  const release = fd.get("mode") === "release" && a.visibility !== "STAFF_ONLY";
  const itemId = s(fd.get("checklistItemId"));
  const item = itemId ? await db.checklistItem.findFirst({ where: { id: itemId, caseId: c.id } }) : null;
  const stored = await storeEncrypted(Buffer.from(await file.arrayBuffer()));
  const doc = await db.document.create({
    data: {
      caseId: c.id, title, filename: file.name.replace(/[^\w.\- ]/g, "_").slice(0, 120), mime: file.type, size: file.size, ...stored,
      visibility: a.visibility, state: release ? "RELEASED" : "DRAFT", uploadedById: u.id,
      releasedById: release ? u.id : null, releasedAt: release ? new Date() : null, checklistItemId: item?.id,
      recipients: { create: a.recipients.map((userId) => ({ userId })) },
    },
  });
  await audit(u, "document.upload", `Uploaded "${title}" (${a.visibility === "STAFF_ONLY" ? "staff only" : release ? "released" : "draft"})`, { caseId: c.id, documentId: doc.id });
  let message = a.visibility === "STAFF_ONLY" ? "Saved for the case team only." : "Saved as a draft. Participants can't see it until you release it.";
  if (release) message = await afterRelease(u, c, doc.id, title, a.visibility, a.recipients, item?.id);
  await touch(c.id);
  return json({ ok: true, message });
}
