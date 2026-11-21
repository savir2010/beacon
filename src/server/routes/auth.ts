import "server-only";
import { baseUrl } from "@/lib/base-url";
import { endSession, issueLoginCode, requireUser, SESSION_COOKIE, verifyLoginCode } from "@/lib/auth";
import { body, fail, isEmail, json, s } from "../http";
import { me } from "../views";

export async function requestCode(req: Request) {
  const b = await body(req);
  const email = s(b.email, 120).toLowerCase();
  if (!isEmail(email)) return fail(400, "Enter the email address Beacon has for you, like name@example.com.");
  await issueLoginCode(email);
  // Same answer whether or not the address has an account.
  return json({ ok: true, message: `If ${email} has a Beacon account, a 6-digit code is on its way. It works for 10 minutes.` });
}

export async function verify(req: Request) {
  const b = await body(req);
  const { token, user, maxAge } = await verifyLoginCode(s(b.email, 120), s(b.code, 12));
  const secure = process.env.NODE_ENV === "production" && baseUrl().startsWith("https");
  return json({ token, user: me(user) }, 200, {
    "Set-Cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`,
  });
}

export async function signOut(req: Request) {
  await endSession(req);
  return json({ ok: true }, 200, { "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` });
}

export async function whoami(req: Request) {
  return json({ user: me(await requireUser(req)) });
}
