import "server-only";
import type { Prisma, User } from "@prisma/client";
import { db } from "./db";
import { isStaff } from "./auth";
import { notFound } from "@/server/http";

// Every permission decision lives here and is checked on the server for every request.
// Hiding something in the interface is never the control. Unknown and forbidden both answer 404.

/** The case if this user may open it. */
export async function caseFor(user: User, caseId: string) {
  const c = await db.case.findUnique({ where: { id: caseId }, include: { members: { include: { user: true } } } });
  if (!c) return notFound();
  if (user.role === "ADMIN") return c;
  const m = c.members.find((x) => x.userId === user.id && x.active);
  if (!m) return notFound();
  if (isStaff(user)) return m.role === "MEDIATOR" ? c : notFound();
  if (m.role !== "PARTICIPANT" || !m.invitedAt || participantAccessExpired(c)) return notFound();
  return c;
}

/** Which documents this user can see in a case. */
export function documentScope(user: Pick<User, "id" | "role">, caseId: string): Prisma.DocumentWhereInput {
  if (isStaff(user)) return { caseId };
  return {
    caseId,
    OR: [
      { state: "RELEASED", visibility: "JOINT" },
      { state: "RELEASED", visibility: "RESTRICTED", recipients: { some: { userId: user.id } } },
      { state: "SUBMITTED", uploadedById: user.id },
    ],
  };
}

/** Which checklist items this user can see: joint items plus their own. */
export function checklistScope(user: Pick<User, "id" | "role">, caseId: string): Prisma.ChecklistItemWhereInput {
  if (isStaff(user)) return { caseId };
  return { caseId, OR: [{ assigneeId: null }, { assigneeId: user.id }] };
}

/** Participants keep read-only access for 90 days after a case closes, then lose it. */
export const CLOSED_ACCESS_DAYS = 90;
export function participantAccessExpired(c: { status: string; closedAt: Date | null }) {
  return c.status === "CLOSED" && !!c.closedAt && Date.now() - c.closedAt.getTime() > CLOSED_ACCESS_DAYS * 86400_000;
}
