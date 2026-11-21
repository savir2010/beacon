import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { User } from "@prisma/client";
import { db } from "./db";
import { audit } from "./audit";
import { sendLoginCode } from "./notify";
import { fail } from "@/server/http";

// Passwordless sign-in. A 6-digit code is emailed, lasts 10 minutes and allows 5 tries.
// The session token is returned once and only its hash is stored.

export const SESSION_COOKIE = "beacon_session";
export const STAFF_ROLES = ["ADMIN", "MEDIATOR"] as const;
export const isStaff = (u: Pick<User, "role">) => (STAFF_ROLES as readonly string[]).includes(u.role);

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
const codeHash = (userId: string, code: string) => hashToken(`${userId}:${code}`);

const CODE_MINUTES = 10;
const CODE_TRIES = 5;
const CODES_PER_15_MIN = 5;
/**
 * Live-demo mode: BEACON_DEMO_CODE=000000 in .env makes every emailed code that value.
 * Never set it on a real deployment; it is ignored when NODE_ENV is production unless
 * BEACON_ALLOW_DEMO_CODE=1 is also set (the local demo server sets both).
 */
function demoCode() {
  const c = process.env.BEACON_DEMO_CODE;
  if (!c || !/^\d{6}$/.test(c)) return null;
  if (process.env.NODE_ENV === "production" && process.env.BEACON_ALLOW_DEMO_CODE !== "1") return null;
  return c;
}
export const demoMode = () => demoCode() !== null;

const sessionHours = (u: User) => (isStaff(u) ? 12 : 24 * 14);

/** Emails a sign-in code. Says nothing about whether the email has an account. */
export async function issueLoginCode(emailRaw: string, intro?: string) {
  const email = emailRaw.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active) return;
  const demo = demoCode();
  const recent = await db.loginCode.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } } });
  if (recent >= CODES_PER_15_MIN && !demo) return;
  await db.loginCode.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  const code = demo ?? String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.loginCode.create({ data: { userId: user.id, codeHash: codeHash(user.id, code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000) } });
  await sendLoginCode(user.email, code, intro);
}

/** Checks a code and opens a session. Returns the raw token once. */
export async function verifyLoginCode(emailRaw: string, codeRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.replace(/\D/g, "");
  const wrong = "That code didn't match or has expired. Check the latest email, or send a new code.";
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || code.length !== 6) return fail(400, wrong);
  const lc = await db.loginCode.findFirst({ where: { userId: user.id, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (!lc || lc.expiresAt < new Date() || lc.attempts >= CODE_TRIES) return fail(400, wrong);
  const ok = timingSafeEqual(Buffer.from(lc.codeHash), Buffer.from(codeHash(user.id, code)));
  if (!ok) {
    await db.loginCode.update({ where: { id: lc.id }, data: { attempts: { increment: 1 } } });
    return fail(400, wrong);
  }
  await db.loginCode.update({ where: { id: lc.id }, data: { usedAt: new Date() } });
  const token = newToken();
  const hours = sessionHours(user);
  await db.authSession.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + hours * 3600_000) } });
  await db.user.update({ where: { id: user.id }, data: { lastSignInAt: new Date() } });
  await audit(user, "auth.signin", "Signed in with an emailed code");
  return { token, user, maxAge: hours * 3600 };
}

function tokenFrom(req: Request) {
  const h = req.headers.get("authorization");
  if (h?.startsWith("Bearer ")) return h.slice(7);
  const c = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return c ? decodeURIComponent(c[1]) : null;
}

export async function userFrom(req: Request) {
  const token = tokenFrom(req);
  if (!token) return null;
  const s = await db.authSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date() || !s.user.active) return null;
  return s.user;
}

export async function endSession(req: Request) {
  const token = tokenFrom(req);
  if (token) await db.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function requireUser(req: Request) {
  return (await userFrom(req)) ?? fail(401, "Please sign in.");
}
export async function requireStaff(req: Request) {
  const u = await requireUser(req);
  return isStaff(u) ? u : fail(403, "This area is for the Beacon team.");
}
export async function requireAdmin(req: Request) {
  const u = await requireUser(req);
  return u.role === "ADMIN" ? u : fail(403, "This area is for administrators.");
}
