"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { track } from "@/lib/metrics";
import { issueLoginCode } from "@/lib/auth";

export type FormState = { ok?: boolean; errors?: Record<string, string>; message?: string; email?: string };

const Consult = z
  .object({
    name: z.string().trim().min(1, "Enter a name we can use").max(80),
    preferredContact: z.enum(["EMAIL", "PHONE", "TEXT"], { message: "Choose how we should contact you" }),
    email: z.string().trim().toLowerCase().max(120).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter an email address, like name@example.com. We'll send your sign-in code there."),
    phone: z.string().trim().max(30).optional(),
    bestTime: z.string().trim().max(80).optional(),
    safeToLeaveMessage: z.boolean(),
    topics: z.string().max(80).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.preferredContact !== "EMAIL" && (v.phone ?? "").replace(/\D/g, "").length < 10)
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a 10-digit phone number" });
  });

export async function requestConsultation(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = Consult.safeParse({
    name: fd.get("name"),
    preferredContact: fd.get("preferredContact") ?? undefined,
    email: fd.get("email") ?? "",
    phone: fd.get("phone") || undefined,
    bestTime: fd.get("bestTime") || undefined,
    safeToLeaveMessage: fd.get("safeToLeaveMessage") === "on",
    topics: fd.get("topics") || undefined,
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors };
  }
  // The request opens a client account, so the person can sign in and follow it.
  const { email, name } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && existing.role !== "PARTICIPANT")
    return { errors: { email: "That email belongs to a Beacon team account. Use a personal email address." } };
  const user = existing ?? (await db.user.create({ data: { email, name, role: "PARTICIPANT", phone: parsed.data.phone } }));
  await db.consultationRequest.create({ data: { ...parsed.data, userId: user.id } });
  await issueLoginCode(email, "Thanks for contacting Beacon Mediation Services. We received your consultation request, and you can follow it in the Beacon app.");
  await track("consultation.request");
  return { ok: true, email };
}

const Safety = z.object({
  contactMethod: z.enum(["PHONE", "TEXT", "EMAIL"], { message: "Choose a safe way to reach you" }),
  contactValue: z.string().trim().min(5, "Enter a phone number or email that is safe to use").max(120),
  safeTimes: z.string().trim().max(120).optional(),
  safeToLeaveMessage: z.boolean(),
});

export async function requestSafetyContact(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = Safety.safeParse({
    contactMethod: fd.get("contactMethod") ?? undefined,
    contactValue: fd.get("contactValue"),
    safeTimes: fd.get("safeTimes") || undefined,
    safeToLeaveMessage: fd.get("safeToLeaveMessage") === "on",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors };
  }
  await db.safetyRequest.create({ data: parsed.data });
  return { ok: true };
}
