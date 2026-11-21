import "server-only";
import { baseUrl } from "@/lib/base-url";
import { db } from "@/lib/db";
import { isStaff } from "@/lib/auth";
import { caseFor, checklistScope } from "@/lib/access";
import { fail } from "../http";
import { verifySigned } from "../signed";

// Calendar files (.ics) for sessions and due dates. Opening one on an iPhone or Mac offers
// "Add to Calendar". Participants' entries stay neutral ("Beacon appointment"), because other
// people can often see a family's calendar. The team's entries carry the case reference.

const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(d).replace(/-/g, "");
const appUrl = () => `${baseUrl()}/app`;

function ics(uid: string, fields: string[]) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Beacon Mediation Services//Beacon//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${uid}@beacon`, `DTSTAMP:${stamp(new Date())}`, ...fields, "END:VEVENT", "END:VCALENDAR"];
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `inline; filename="beacon-${uid.slice(-6)}.ics"`, "Cache-Control": "private, no-store" },
  });
}

async function signer(req: Request, path: string) {
  const uid = verifySigned(path, new URL(req.url));
  const u = uid ? await db.user.findUnique({ where: { id: uid } }) : null;
  return u?.active ? u : fail(403, "This calendar link has expired. Add the event again from the Beacon app.");
}

export async function session(req: Request, raw: string) {
  const id = raw.replace(/\.ics$/, "");
  const u = await signer(req, `calendar/session/${id}`);
  const x = await db.mediationSession.findUnique({ where: { id }, include: { case: true } });
  if (!x) return fail(404, "Not found");
  await caseFor(u, x.caseId);
  const staff = isStaff(u);
  const end = new Date(x.startsAt.getTime() + x.durationMin * 60_000);
  return ics(`session-${x.id}`, [
    `DTSTART:${stamp(x.startsAt)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(staff ? `${x.case.reference}: ${x.title}` : "Beacon appointment")}`,
    `LOCATION:${esc(x.location)}`,
    `DESCRIPTION:${esc(`Details are in the Beacon app: ${appUrl()}`)}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Beacon appointment", "TRIGGER:-PT1H", "END:VALARM",
  ]);
}

export async function item(req: Request, raw: string) {
  const id = raw.replace(/\.ics$/, "");
  const u = await signer(req, `calendar/item/${id}`);
  const it = await db.checklistItem.findFirst({ where: { id }, include: { case: true } });
  if (!it || !it.dueDate) return fail(404, "Not found");
  await caseFor(u, it.caseId);
  if (!(await db.checklistItem.findFirst({ where: { AND: [{ id }, checklistScope(u, it.caseId)] } }))) return fail(404, "Not found");
  const next = new Date(it.dueDate.getTime() + 86400_000);
  return ics(`item-${it.id}`, [
    `DTSTART;VALUE=DATE:${day(it.dueDate)}`, `DTEND;VALUE=DATE:${day(next)}`,
    `SUMMARY:${esc(isStaff(u) ? `${it.case.reference}: ${it.title} due` : "Beacon: something is due")}`,
    `DESCRIPTION:${esc(`See what's due in the Beacon app: ${appUrl()}`)}`,
  ]);
}
