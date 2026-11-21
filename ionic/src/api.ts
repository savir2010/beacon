import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

// Talks to the Beacon API. The website serves this app at /app, so the API is same-origin by default.
// The iOS build (Capacitor) sets VITE_API_BASE to the server's address; see .env.native.
const ORIGIN = import.meta.env.VITE_API_BASE ?? "";
const BASE = ORIGIN + "/api/v1";
export const isNative = Capacitor.isNativePlatform();

/** A full URL for a server path, for links handed to another app (Calendar, Safari). */
export const absolute = (path: string) => (/^https?:/.test(path) ? path : `${ORIGIN || window.location.origin}${path}`);

/** Opens a link outside the app: a new tab on the web, an in-app Safari sheet on iPhone. */
export async function openExternal(url: string) {
  const full = absolute(url);
  if (isNative) await Browser.open({ url: full, presentationStyle: "popover" });
  else window.open(full, "_blank", "noopener");
}
const KEY = "beacon.session";

export type Role = "ADMIN" | "MEDIATOR" | "PARTICIPANT";
export type Me = { id: string; name: string; email: string; role: Role };

export const session = {
  get token() {
    try { return localStorage.getItem(KEY); } catch { return null; }
  },
  set(token: string | null) {
    try { token ? localStorage.setItem(KEY, token) : localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

async function request<T>(method: string, path: string, data?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const t = session.token;
  if (t) headers.Authorization = `Bearer ${t}`;
  let bodyInit: BodyInit | undefined;
  if (data instanceof FormData) bodyInit = data;
  else if (data !== undefined) { headers["Content-Type"] = "application/json"; bodyInit = JSON.stringify(data); }
  let res: Response;
  try {
    res = await fetch(`${BASE}/${path}`, { method, headers, body: bodyInit, credentials: "same-origin" });
  } catch {
    throw new ApiError(0, "Can't reach Beacon. Check your connection and try again.");
  }
  if (res.status === 401 && !path.startsWith("auth/")) { session.set(null); onUnauthorized(); }
  const json = res.headers.get("content-type")?.includes("json") ? await res.json() : {};
  if (!res.ok) throw new ApiError(res.status, json.error ?? "Something went wrong. Try again.");
  return json as T;
}

export const api = {
  get: <T,>(p: string) => request<T>("GET", p),
  post: <T = { ok: boolean; message?: string },>(p: string, d?: unknown) => request<T>("POST", p, d ?? {}),
  /** Downloads a permission-checked document. On iPhone it opens in a Safari sheet, where Share can save it. */
  async download(docId: string, fallbackName: string) {
    if (isNative) {
      const { url } = await request<{ url: string }>("POST", `documents/${docId}/link`, {});
      return openExternal(url);
    }
    const headers: Record<string, string> = {};
    if (session.token) headers.Authorization = `Bearer ${session.token}`;
    const res = await fetch(`${BASE}/documents/${docId}/file`, { headers });
    if (!res.ok) throw new ApiError(res.status, res.status === 404 ? "That document isn't available to you." : "The download didn't work. Try again.");
    const name = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? fallbackName;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  },
};
