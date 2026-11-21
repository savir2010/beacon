import "server-only";
import { db } from "@/lib/db";
import { isStaff, requireUser } from "@/lib/auth";
import { caseFor, documentScope, participantAccessExpired } from "@/lib/access";
import { audit } from "@/lib/audit";
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, readDecrypted, storeEncrypted } from "@/lib/files";
import type { User } from "@prisma/client";
import { body, fail, json, notFound, s } from "../http";
import { signedPath, verifySigned } from "../signed";
import { clientHome, requireParticipantOf, workspaceView } from "../views";

export async function home(req: Request) {
  const u = await requireUser(req);
  if (isStaff(u)) return fail(403, "Staff use the team interface.");
  return json(await clientHome(u));
}

/** A participant's workspace. Staff may pass ?as=<participantId> to preview exactly what that person sees. */
export async function workspace(req: Request, caseId: string) {
  const u = await requireUser(req);
  if (!isStaff(u)) return json(await workspaceView(u, caseId));
  await caseFor(u, caseId);
  const as = new URL(req.url).searchParams.get("as") ?? "";
  const m = await requireParticipantOf(caseId, as);
  await audit(u, "case.preview", `Previewed the workspace as ${m.user.name}`, { caseId, targetId: m.userId });
  // Preview uses the participant's own scopes; an uninvited participant sees what they would after invitation.
  return json(await workspaceView({ ...m.user, role: "PARTICIPANT" }, caseId).catch(async () => {
    return fail(404, `${m.user.name} can't open this case right now (not invited, removed, or access ended).`);
  }));
}

export async function submit(req: Request, caseId: string) {
  const u = await requireUser(req);
  if (isStaff(u)) return fail(403, "Staff upload from the case's Documents tab.");
  const c = await caseFor(u, caseId);
  if (c.status !== "OPEN") return fail(400, "This case is closed. Contact your case team.");
  const fd = await req.formData();
  const item = await db.checklistItem.findFirst({ where: { id: String(fd.get("itemId")), caseId, assigneeId: u.id } });
  if (!item) return fail(400, "That request isn't assigned to you.");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose a file to upload.");
  if (file.size > MAX_UPLOAD_BYTES) return fail(400, `That file is over ${MAX_UPLOAD_BYTES / 1024 / 1024} MB. Try a smaller scan or split it into parts.`);
  if (!ALLOWED_TYPES[file.type]) return fail(400, "Upload a PDF, photo (JPEG, PNG, HEIC), Word or Excel file.");
  const stored = await storeEncrypted(Buffer.from(await file.arrayBuffer()));
  const doc = await db.document.create({
    data: {
      caseId, title: `${item.title}, submitted by ${u.name.split(" ")[0]}`,
      filename: file.name.replace(/[^\w.\- ]/g, "_").slice(0, 120), mime: file.type, size: file.size, ...stored,
      visibility: "RESTRICTED", state: "SUBMITTED", uploadedById: u.id, checklistItemId: item.id,
      recipients: { create: [{ userId: u.id }] },
    },
  });
  await db.checklistItem.update({ where: { id: item.id }, data: { status: "RECEIVED", updatedAt: new Date() } });
  await db.case.update({ where: { id: caseId }, data: { updatedAt: new Date() } });
  await audit(u, "document.upload", `Submitted "${doc.title}" (visible to ${u.name} and the case team)`, { caseId, documentId: doc.id });
  return json({ ok: true, message: "Uploaded. Only you and the case team can see it." });
}

export async function message(req: Request, caseId: string) {
  const u = await requireUser(req);
  if (isStaff(u)) return fail(403, "Staff reply from the case's Messages tab.");
  const c = await caseFor(u, caseId);
  if (c.status !== "OPEN") return fail(400, "This case is closed, so messages are off. Call the Beacon office instead.");
  const text = s((await body(req)).body, 4000);
  if (!text) return fail(400, "Write a message first.");
  if (text.length > 2000) return fail(400, "Keep messages under 2,000 characters.");
  await db.message.create({ data: { caseId, threadUserId: u.id, authorId: u.id, body: text } });
  return json({ ok: true });
}

/** Every download is permission-checked and written to the audit log. */
async function sendDocument(u: User, docId: string, disposition: "attachment" | "inline") {
  const d = await db.document.findUnique({ where: { id: docId } });
  if (!d) return notFound();
  const c = await caseFor(u, d.caseId);
  if (!isStaff(u) && participantAccessExpired(c)) return notFound();
  const doc = await db.document.findFirst({ where: { AND: [{ id: docId }, documentScope(u, d.caseId)] } });
  if (!doc) return notFound();
  const buf = await readDecrypted(doc);
  await audit(u, "document.download", `Downloaded "${doc.title}"`, { caseId: doc.caseId, documentId: doc.id });
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": doc.mime, "Content-Disposition": `${disposition}; filename="${doc.filename.replace(/"/g, "")}"`, "Cache-Control": "private, no-store" },
  });
}

export async function download(req: Request, docId: string) {
  return sendDocument(await requireUser(req), docId, "attachment");
}

/** A 5-minute link the phone's browser can open (native apps can't save files from the web view). */
export async function documentLink(req: Request, docId: string) {
  const u = await requireUser(req);
  const d = await db.document.findFirst({ where: { id: docId } });
  if (!d) return notFound();
  await caseFor(u, d.caseId);
  if (!(await db.document.findFirst({ where: { AND: [{ id: docId }, documentScope(u, d.caseId)] } }))) return notFound();
  return json({ url: signedPath(`documents/${docId}/open`, u.id, 300) });
}

export async function openDocument(req: Request, docId: string) {
  const uid = verifySigned(`documents/${docId}/open`, new URL(req.url));
  const u = uid ? await db.user.findUnique({ where: { id: uid } }) : null;
  if (!u || !u.active) return fail(403, "This link has expired. Open the document again from the Beacon app.");
  return sendDocument(u, docId, "inline");
}
