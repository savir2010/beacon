import "server-only";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { navigate, searchArticles } from "@/lib/search";
import { body, fail, json, s } from "../http";

// The Resource Center and Navigator inside the app. Same reviewed library, same handoffs as the website.

const card = (a: { slug: string; title: string; summary: string; stage: string; readMinutes: number; reviewStatus: string; reviewerName: string | null; reviewedAt: Date | null }) => ({
  slug: a.slug, title: a.title, summary: a.summary, stage: a.stage, readMinutes: a.readMinutes,
  review: a.reviewStatus === "REVIEWED" && a.reviewerName ? { by: a.reviewerName, on: a.reviewedAt } : null,
});

export async function list(req: Request) {
  await requireUser(req);
  const articles = await db.article.findMany({ orderBy: { title: "asc" } });
  return json({ articles: articles.map(card) });
}

export async function article(req: Request, slug: string) {
  await requireUser(req);
  const a = await db.article.findUnique({ where: { slug } });
  if (!a) return fail(404, "Not found");
  const related = await db.qAEntry.findMany({ where: { articleSlug: slug }, take: 4 });
  return json({ ...card(a), body: a.body, officialLinks: JSON.parse(a.officialLinks), related: related.map((q) => ({ id: q.id, question: q.question })) });
}

export async function search(req: Request) {
  await requireUser(req);
  const q = s((await body(req)).q, 300);
  if (q.length < 2) return fail(400, "Type a question or a few words.");
  const [r, articles] = await Promise.all([navigate(q), searchArticles(q)]);
  const entry = (e: { id: string; question: string; answer: string; sourceLabel: string; sourceUrl: string; nextLabel: string; nextHref: string; articleSlug: string | null; reviewStatus: string }) => ({
    id: e.id, question: e.question, answer: e.answer, source: { label: e.sourceLabel, url: e.sourceUrl },
    next: { label: e.nextLabel, href: e.nextHref }, articleSlug: e.articleSlug, draft: e.reviewStatus !== "REVIEWED",
  });
  return json({
    kind: r.kind,
    answer: r.kind === "answer" ? entry(r.best) : null,
    related: "related" in r ? r.related.map(entry) : [],
    articles: r.kind === "safety" ? [] : articles.slice(0, 4).map(card),
  });
}

export async function answer(req: Request, id: string) {
  await requireUser(req);
  const e = await db.qAEntry.findUnique({ where: { id } });
  if (!e) return fail(404, "Not found");
  return json({ id: e.id, question: e.question, answer: e.answer, source: { label: e.sourceLabel, url: e.sourceUrl }, next: { label: e.nextLabel, href: e.nextHref }, articleSlug: e.articleSlug, draft: e.reviewStatus !== "REVIEWED" });
}
