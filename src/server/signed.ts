import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Short-lived signed links, so a calendar app or the phone's browser can fetch one file
// without the session token. Each link names the person, the item and an expiry.
// BEACON_LINK_SECRET is optional; set it to stop anyone who has read this code from forging links.
const key = () => process.env.BEACON_LINK_SECRET ?? "beacon-demo-link-secret";
const mac = (payload: string) => createHmac("sha256", key()).update(payload).digest("base64url");

export function signedPath(path: string, userId: string, ttlSeconds: number, suffix = "") {
  // Round the expiry to the hour so the same link comes back on every load.
  const e = Math.ceil((Date.now() / 1000 + ttlSeconds) / 3600) * 3600;
  const s = mac(`${path}|${userId}|${e}`);
  return `/api/v1/${path}${suffix}?u=${encodeURIComponent(userId)}&e=${e}&s=${s}`;
}

/** The user id the link was issued to, or null if it's forged or expired. */
export function verifySigned(path: string, url: URL) {
  const u = url.searchParams.get("u") ?? "";
  const e = Number(url.searchParams.get("e"));
  const s = url.searchParams.get("s") ?? "";
  if (!u || !e || e < Date.now() / 1000) return null;
  const want = Buffer.from(mac(`${path}|${u}|${e}`));
  const got = Buffer.from(s);
  return want.length === got.length && timingSafeEqual(want, got) ? u : null;
}
