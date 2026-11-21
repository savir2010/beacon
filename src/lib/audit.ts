import "server-only";
import { db } from "./db";

type Actor = { id: string; name: string } | null;

export async function audit(
  actor: Actor,
  action: string,
  detail: string,
  ids: { caseId?: string; documentId?: string; targetId?: string } = {},
) {
  await db.auditEvent.create({
    data: { actorId: actor?.id, actorLabel: actor?.name ?? "System", action, detail, ...ids },
  });
}
