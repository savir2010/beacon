import { ApiError, json } from "@/server/http";
import * as auth from "@/server/routes/auth";
import * as client from "@/server/routes/client";
import * as staff from "@/server/routes/staff";
import * as admin from "@/server/routes/admin";
import * as resources from "@/server/routes/resources";
import * as calendar from "@/server/routes/calendar";

// The Beacon app API. Every route checks the session and permissions on the server.
type H = (req: Request, ...p: string[]) => Promise<Response>;
const routes: [string, string, H][] = [
  ["POST", "auth/code", auth.requestCode],
  ["POST", "auth/verify", auth.verify],
  ["POST", "auth/signout", auth.signOut],
  ["GET", "me", auth.whoami],

  ["GET", "client/home", client.home],
  ["GET", "cases/:id/workspace", client.workspace],
  ["POST", "cases/:id/submissions", client.submit],
  ["POST", "cases/:id/messages", client.message],
  ["GET", "documents/:id/file", client.download],
  ["POST", "documents/:id/link", client.documentLink],
  ["GET", "documents/:id/open", client.openDocument],
  ["GET", "calendar/session/:id", calendar.session],
  ["GET", "calendar/item/:id", calendar.item],

  ["GET", "resources", resources.list],
  ["GET", "resources/:slug", resources.article],
  ["POST", "resources/search", resources.search],
  ["GET", "answers/:id", resources.answer],

  ["GET", "staff/today", staff.today],
  ["GET", "staff/cases", staff.cases],
  ["POST", "staff/cases", staff.createCase],
  ["GET", "staff/cases/:id", staff.getCase],
  ["POST", "staff/cases/:id/documents", staff.upload],
  ["POST", "staff/cases/:id/:action", staff.caseAction],
  ["GET", "staff/requests", staff.requests],
  ["POST", "staff/requests/:kind/:id", staff.updateRequest],

  ["GET", "admin/team", admin.team],
  ["POST", "admin/team", admin.addTeam],
  ["POST", "admin/team/:id", admin.updateTeam],
  ["GET", "admin/library", admin.library],
  ["POST", "admin/library/articles/:id", admin.saveArticle],
  ["POST", "admin/library/qa/:id", admin.saveQA],
  ["GET", "admin/activity", admin.activity],
  ["GET", "admin/outbox", admin.outbox],
  ["GET", "admin/measures", admin.measures],
];

// The iOS and Android app (Capacitor) runs from its own origin and sends a bearer token, never cookies.
const ORIGINS = new Set(["capacitor://localhost", "ionic://localhost", "http://localhost", "http://localhost:8100", ...(process.env.BEACON_APP_ORIGINS ?? "").split(",").filter(Boolean)]);
function cors(req: Request, res: Response) {
  const o = req.headers.get("origin");
  if (o && ORIGINS.has(o)) {
    res.headers.set("Access-Control-Allow-Origin", o);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Expose-Headers", "Content-Disposition");
  }
  return res;
}
export async function OPTIONS(req: Request) {
  return cors(req, new Response(null, { status: 204, headers: { "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "600" } }));
}

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return cors(req, await route(req, ctx));
}

async function route(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const parts = (await ctx.params).path;
  for (const [method, pattern, h] of routes) {
    if (method !== req.method) continue;
    const pp = pattern.split("/");
    if (pp.length !== parts.length) continue;
    const args: string[] = [];
    if (pp.every((p, i) => (p.startsWith(":") ? (args.push(decodeURIComponent(parts[i])), true) : p === parts[i]))) {
      try {
        return await h(req, ...args);
      } catch (e) {
        if (e instanceof ApiError) return json({ error: e.message }, e.status);
        console.error(e);
        return json({ error: "Something went wrong on our side. Try again in a moment." }, 500);
      }
    }
  }
  return json({ error: "Not found" }, 404);
}

export const GET = handle;
export const POST = handle;
