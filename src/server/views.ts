import "server-only";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { caseFor, checklistScope, documentScope, participantAccessExpired } from "@/lib/access";
import { fail } from "./http";
import { signedPath } from "./signed";

const CAL_TTL = 60 * 86400;

// Shapes returned to the app. Dates are ISO strings; the app formats them in California time.

const roleLabel = (r: string) => (r === "MEDIATOR" ? "mediator" : r === "ADMIN" ? "administrator" : "participant");
const UPDATE_ACTIONS = ["document.release", "case.update", "update.release", "milestone.update", "checklist.update", "session.update"];

export function me(u: User) {
  return { id: u.id, name: u.name, email: u.email, role: u.role as "ADMIN" | "MEDIATOR" | "PARTICIPANT" };
}

/**
 * What a participant sees in their case. `viewer` is the participant; staff previews pass the
 * participant they are previewing, so the same permission scopes produce exactly their view.
 */
export async function workspaceView(viewer: User, caseId: string) {
  const c = await caseFor(viewer, caseId);
  const [milestones, sessions, items, docs, messages, updates, updater] = await Promise.all([
    db.milestone.findMany({ where: { caseId }, orderBy: { position: "asc" } }),
    db.mediationSession.findMany({ where: { caseId, startsAt: { gte: new Date(Date.now() - 3 * 3600_000) } }, orderBy: { startsAt: "asc" } }),
    db.checklistItem.findMany({ where: checklistScope(viewer, caseId), orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }] }),
    db.document.findMany({ where: documentScope(viewer, caseId), orderBy: { createdAt: "desc" } }),
    db.message.findMany({ where: { caseId, threadUserId: viewer.id }, orderBy: { createdAt: "asc" }, include: { author: true } }),
    db.jointUpdate.findMany({ where: { caseId }, orderBy: { releasedAt: "desc" }, take: 5 }),
    db.auditEvent.findFirst({ where: { caseId, action: { in: UPDATE_ACTIONS } }, orderBy: { at: "desc" } }),
  ]);
  const participants = c.members.filter((m) => m.role === "PARTICIPANT" && m.active).map((m) => m.user);
  const others = participants.filter((p) => p.id !== viewer.id);
  const team = c.members.filter((m) => m.role !== "PARTICIPANT" && m.active).map((m) => ({ name: m.user.name, role: roleLabel(m.role) }));
  const current = milestones.find((m) => m.status === "CURRENT") ?? null;
  const closed = c.status === "CLOSED";
  const othersText = others.map((o) => o.name).join(" and ");

  return {
    viewerName: viewer.name,
    case: {
      id: c.id,
      reference: c.reference,
      closed,
      closedAt: c.closedAt,
      accessUntil: c.closedAt ? new Date(c.closedAt.getTime() + 90 * 86400_000) : null,
      updatedAt: c.updatedAt,
      updatedBy: updater?.actorLabel ?? null,
      nextAction: c.nextAction,
      nextActionOwner: c.nextActionOwner,
    },
    current: current && { title: current.title, description: current.description, step: milestones.indexOf(current) + 1, of: milestones.length },
    milestones: milestones.map((m) => ({ id: m.id, title: m.title, description: m.description, kind: m.kind, verified: m.verified, status: m.status })),
    sessions: sessions.map((x) => ({ id: x.id, title: x.title, startsAt: x.startsAt, durationMin: x.durationMin, location: x.location, prep: x.prep, ics: signedPath(`calendar/session/${x.id}`, viewer.id, CAL_TTL, ".ics") })),
    updates: updates.map((u) => ({ id: u.id, body: u.body, releasedAt: u.releasedAt })),
    checklist: items.map((it) => ({
      id: it.id,
      title: it.title,
      description: it.description,
      status: it.status,
      dueDate: it.dueDate,
      owner: it.assigneeId === null ? "Shared" : "You",
      ics: it.dueDate ? signedPath(`calendar/item/${it.id}`, viewer.id, CAL_TTL, ".ics") : null,
      canUpload: !closed && it.assigneeId === viewer.id && (it.status === "REQUESTED" || it.status === "RECEIVED"),
    })),
    documents: docs.map((d) => ({
      id: d.id,
      title: d.title,
      status: d.state === "SUBMITTED" ? "RECEIVED" : "AVAILABLE",
      owner: d.visibility === "JOINT" ? "Shared" : "You",
      seenBy: d.visibility === "JOINT" && others.length ? `You, ${othersText} and the case team` : "You and the case team",
      date: d.releasedAt ?? d.createdAt,
      size: d.size,
      mime: d.mime,
    })),
    messages: messages.map((m) => ({ id: m.id, mine: m.authorId === viewer.id, author: m.author.name, body: m.body, at: m.createdAt })),
    readers: `${team.map((t) => `${t.name} (${t.role})`).join(", ")}${others.length ? `. Not visible to ${othersText}.` : "."}`,
    privacyNote: others.length ? `${othersText} can't see this conversation.` : "",
    team,
  };
}

/** A participant's home: their cases, and any consultation request still waiting for a case. */
export async function clientHome(u: User) {
  const memberships = await db.caseMember.findMany({
    where: { userId: u.id, role: "PARTICIPANT", active: true, invitedAt: { not: null } },
    include: { case: true },
    orderBy: { addedAt: "desc" },
  });
  const cases = memberships
    .filter((m) => !participantAccessExpired(m.case))
    .map((m) => ({ id: m.case.id, reference: m.case.reference, closed: m.case.status === "CLOSED", updatedAt: m.case.updatedAt }));
  const req = await db.consultationRequest.findFirst({
    where: { userId: u.id, status: { in: ["NEW", "SCREENING"] } },
    orderBy: { createdAt: "desc" },
    include: { assignee: true },
  });
  return {
    cases,
    consultation: req && {
      id: req.id,
      status: req.status,
      createdAt: req.createdAt,
      preferredContact: req.preferredContact,
      bestTime: req.bestTime,
      topics: req.topics ? req.topics.split(",") : [],
      mediator: req.assignee?.name ?? null,
    },
  };
}

/** The full case for the team. */
export async function staffCaseView(user: User, caseId: string) {
  const c = await caseFor(user, caseId);
  const [milestones, sessions, items, docs, messages, updates, activity] = await Promise.all([
    db.milestone.findMany({ where: { caseId }, orderBy: { position: "asc" } }),
    db.mediationSession.findMany({ where: { caseId }, orderBy: { startsAt: "asc" } }),
    db.checklistItem.findMany({ where: { caseId }, orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }], include: { assignee: true } }),
    db.document.findMany({ where: { caseId }, orderBy: { createdAt: "desc" }, include: { recipients: true, uploadedBy: true } }),
    db.message.findMany({ where: { caseId }, orderBy: { createdAt: "asc" }, include: { author: true } }),
    db.jointUpdate.findMany({ where: { caseId }, orderBy: { releasedAt: "desc" } }),
    db.auditEvent.findMany({ where: { caseId }, orderBy: { at: "desc" }, take: 40 }),
  ]);
  const participants = c.members.filter((m) => m.role === "PARTICIPANT");
  const activeP = participants.filter((m) => m.active);
  const nameOf = (id: string) => c.members.find((m) => m.userId === id)?.user.name ?? "Unknown";
  const audience = (d: (typeof docs)[number]) => {
    if (d.visibility === "STAFF_ONLY") return { label: "Case team only", ids: [] as string[] };
    if (d.state === "SUBMITTED") return { label: `${nameOf(d.uploadedById)} and the case team`, ids: [d.uploadedById] };
    const ids = d.visibility === "JOINT" ? activeP.map((p) => p.userId) : d.recipients.map((r) => r.userId);
    return { label: d.visibility === "JOINT" ? "All participants" : ids.map(nameOf).join(", "), ids };
  };
  const now = Date.now();
  const lastMessage = new Map<string, (typeof messages)[number]>();
  for (const m of messages) lastMessage.set(m.threadUserId, m);

  const setup = [
    { key: "people", label: "Participants added", done: activeP.length > 0 },
    { key: "invited", label: "Every participant invited", done: activeP.length > 0 && activeP.every((p) => p.invitedAt) },
    { key: "screened", label: "Private intake and screening done", done: milestones.some((m) => m.position === 0 && m.status === "DONE") },
    { key: "session", label: "First session scheduled", done: sessions.length > 0 },
    { key: "checklist", label: "Documents requested", done: items.length > 0 },
    { key: "release", label: "First document released", done: docs.some((d) => d.state === "RELEASED") },
  ];

  return {
    case: {
      id: c.id, reference: c.reference, title: c.title, status: c.status, safetyFlag: c.safetyFlag,
      nextAction: c.nextAction, nextActionOwner: c.nextActionOwner, updatedAt: c.updatedAt, closedAt: c.closedAt,
    },
    setup,
    participants: participants.map((m) => ({
      memberId: m.id, userId: m.userId, name: m.user.name, email: m.user.email, active: m.active,
      invitedAt: m.invitedAt, notificationsEnabled: m.notificationsEnabled, lastSignInAt: m.user.lastSignInAt,
    })),
    team: c.members.filter((m) => m.role !== "PARTICIPANT").map((m) => ({ memberId: m.id, userId: m.userId, name: m.user.name, role: m.role, active: m.active })),
    milestones: milestones.map((m) => ({ id: m.id, title: m.title, description: m.description, kind: m.kind, verified: m.verified, status: m.status })),
    sessions: sessions.map((x) => ({ id: x.id, title: x.title, startsAt: x.startsAt, durationMin: x.durationMin, location: x.location, prep: x.prep, past: x.startsAt.getTime() < now, ics: signedPath(`calendar/session/${x.id}`, user.id, CAL_TTL, ".ics") })),
    checklist: items.map((it) => ({
      id: it.id, title: it.title, description: it.description, status: it.status, dueDate: it.dueDate,
      assignee: it.assignee ? { id: it.assignee.id, name: it.assignee.name } : null,
      overdue: !!it.dueDate && it.dueDate.getTime() < now && it.status === "REQUESTED",
    })),
    documents: docs.map((d) => {
      const a = audience(d);
      return {
        id: d.id, title: d.title, state: d.state, visibility: d.visibility, size: d.size, mime: d.mime,
        uploadedBy: d.uploadedBy.name, date: d.releasedAt ?? d.createdAt, audience: a.label,
        visibleTo: d.state === "DRAFT" ? [] : a.ids, recipients: d.recipients.map((r) => r.userId),
      };
    }),
    threads: activeP.map((p) => {
      const ms = messages.filter((m) => m.threadUserId === p.userId);
      const last = lastMessage.get(p.userId);
      return {
        userId: p.userId, name: p.user.name,
        awaitingReply: !!last && last.authorId === p.userId,
        messages: ms.map((m) => ({ id: m.id, fromParticipant: m.authorId === p.userId, author: m.author.name, body: m.body, at: m.createdAt })),
      };
    }),
    updates: updates.map((u) => ({ id: u.id, body: u.body, releasedAt: u.releasedAt })),
    activity: activity.map((a) => ({ id: a.id, at: a.at, actor: a.actorLabel, action: a.action, detail: a.detail })),
  };
}

/** Everything that needs a person, across the cases this staff member can open. */
export async function attentionFor(user: User) {
  const caseWhere = user.role === "ADMIN" ? {} : { members: { some: { userId: user.id, active: true, role: "MEDIATOR" } } };
  const cases = await db.case.findMany({
    where: { ...caseWhere, status: "OPEN" },
    include: {
      members: { include: { user: true } },
      checklist: true,
      messages: { orderBy: { createdAt: "desc" } },
      sessions: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 1 },
      milestones: { where: { status: "CURRENT" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  type Item = { kind: string; caseId?: string; reference?: string; title: string; detail: string; at: Date; tab?: string };
  const items: Item[] = [];
  const now = Date.now();
  for (const c of cases) {
    const ref = c.reference;
    const seen = new Set<string>();
    for (const m of c.messages) {
      if (seen.has(m.threadUserId)) continue;
      seen.add(m.threadUserId);
      if (m.authorId === m.threadUserId) {
        const who = c.members.find((x) => x.userId === m.threadUserId)?.user.name ?? "A participant";
        items.push({ kind: "message", caseId: c.id, reference: ref, title: `${who} is waiting for a reply`, detail: m.body.slice(0, 120), at: m.createdAt, tab: "messages" });
      }
    }
    for (const it of c.checklist) {
      if (it.status === "RECEIVED")
        items.push({ kind: "review", caseId: c.id, reference: ref, title: `Review "${it.title}"`, detail: "Received from a participant. Mark it under review or available.", at: it.updatedAt, tab: "checklist" });
      else if (it.status === "REQUESTED" && it.dueDate && it.dueDate.getTime() < now)
        items.push({ kind: "overdue", caseId: c.id, reference: ref, title: `"${it.title}" is overdue`, detail: `Was due ${it.dueDate.toISOString().slice(0, 10)}.`, at: it.dueDate, tab: "checklist" });
    }
    for (const m of c.members)
      if (m.role === "PARTICIPANT" && m.active && !m.invitedAt)
        items.push({ kind: "invite", caseId: c.id, reference: ref, title: `${m.user.name} hasn't been invited`, detail: "Invite them once screening allows it.", at: m.addedAt, tab: "people" });
  }
  const reqWhere = user.role === "ADMIN" ? { status: "NEW" } : { status: { in: ["NEW", "SCREENING"] }, OR: [{ assigneeId: user.id }, { assigneeId: null }] };
  const requests = await db.consultationRequest.findMany({ where: reqWhere, orderBy: { createdAt: "desc" } });
  for (const r of requests)
    items.push({ kind: "consultation", title: `Consultation request from ${r.name}`, detail: r.status === "NEW" ? "New. Screen it and open a case if mediation fits." : "Screening.", at: r.createdAt });
  if (user.role === "MEDIATOR") {
    const safety = await db.safetyRequest.count({ where: { status: "NEW" } });
    if (safety) items.push({ kind: "safety", title: `${safety} private safety request${safety > 1 ? "s" : ""}`, detail: "Contact only by the method and times given.", at: new Date() });
  }
  const order = ["safety", "message", "review", "overdue", "consultation", "invite"];
  items.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || b.at.getTime() - a.at.getTime());

  return {
    items,
    cases: cases.map((c) => ({
      id: c.id, reference: c.reference, title: c.title, safetyFlag: c.safetyFlag, updatedAt: c.updatedAt,
      participants: c.members.filter((m) => m.role === "PARTICIPANT" && m.active).map((m) => m.user.name),
      mediators: c.members.filter((m) => m.role === "MEDIATOR" && m.active).map((m) => m.user.name),
      milestone: c.milestones[0]?.title ?? null, nextAction: c.nextAction, nextSession: c.sessions[0]?.startsAt ?? null,
    })),
  };
}

export const requireParticipantOf = async (caseId: string, userId: string) => {
  const m = await db.caseMember.findFirst({ where: { caseId, userId, role: "PARTICIPANT" }, include: { user: true } });
  return m ?? fail(404, "Not found");
};
