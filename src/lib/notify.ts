import "server-only";
import { baseUrl } from "@/lib/base-url";
import { randomBytes } from "node:crypto";
import { db } from "./db";

// Every notification is the same neutral sign-in prompt. No case names, people, documents or dates.
const appUrl = () => `${baseUrl()}/app`;
const SUBJECT = "You have an update from Beacon";
const notice = () =>
  `There is an update in your Beacon workspace.\n\nSign in with this email address to see it:\n${appUrl()}\n\nFor your privacy, this email does not include any details.`;

/** Notifies invited participants together. Skips anyone whose notifications are off (for example, a safety plan). */
export async function notifyParticipants(caseId: string, userIds?: string[]) {
  const members = await db.caseMember.findMany({
    where: { caseId, role: "PARTICIPANT", active: true, ...(userIds ? { userId: { in: userIds } } : {}) },
    include: { user: true },
  });
  const batchId = randomBytes(6).toString("hex");
  const sent: string[] = [];
  const skipped: string[] = [];
  const now = new Date();
  for (const m of members) {
    if (!m.notificationsEnabled || !m.invitedAt) {
      skipped.push(m.user.name);
      continue;
    }
    await db.outboxEmail.create({ data: { toEmail: m.user.email, subject: SUBJECT, body: notice(), batchId, createdAt: now } });
    sent.push(m.user.name);
  }
  return { sent, skipped };
}

export async function sendInvitation(email: string) {
  await db.outboxEmail.create({
    data: {
      kind: "INVITE",
      toEmail: email,
      subject: "Your Beacon workspace is ready",
      body: `Beacon Mediation Services has opened a private case workspace for you.\n\nSign in with this email address. We'll email you a one-time code each time:\n${appUrl()}\n\nIf you weren't expecting this, you can ignore this email.`,
    },
  });
}

export async function sendStaffWelcome(email: string) {
  await db.outboxEmail.create({
    data: {
      kind: "INVITE",
      toEmail: email,
      subject: "Your Beacon team account",
      body: `You now have a Beacon team account.\n\nSign in with this email address. We'll email you a one-time code each time:\n${appUrl()}`,
    },
  });
}

/** Login codes are kept out of the staff outbox view; only the person they're for should see them. */
export async function sendLoginCode(email: string, code: string, intro?: string) {
  await db.outboxEmail.create({
    data: {
      kind: "LOGIN_CODE",
      toEmail: email,
      subject: `Your Beacon sign-in code: ${code}`,
      body: `${intro ? intro + "\n\n" : ""}Your sign-in code is ${code}\n\nIt works for 10 minutes. Enter it in the Beacon app:\n${appUrl()}/login?email=${encodeURIComponent(email)}\n\nIf you didn't ask for this, you can ignore it. Nobody can sign in without the code.`,
    },
  });
}
