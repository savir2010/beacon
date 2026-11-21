import "server-only";
import type { QAEntry } from "@prisma/client";
import { LEGAL_ADVICE_SIGNALS, SAFETY_SIGNALS } from "@/content/library.mjs";
import { db } from "./db";

// Retrieval only: the Navigator returns reviewed text exactly as written, or hands off to a person.
// No answer is ever generated. Swap scoreEntries() for embedding similarity later without
// changing anything else.

const STOP = new Set(
  "a an and are as at be but by can could do does for from had has have how i if in into is it its me my of on or our so that the their them then there they this to us was we what when where which who why will with would you your about am im i'm".split(" "),
);
const SYNONYMS: Record<string, string> = {
  husband: "spouse", wife: "spouse", partner: "spouse", ex: "spouse", coparent: "spouse",
  attorney: "lawyer", counsel: "lawyer", legal: "lawyer",
  custody: "parenting", visitation: "parenting", kids: "children", child: "children", kid: "children",
  fee: "cost", fees: "cost", price: "cost", pay: "cost", expensive: "cost",
  paperwork: "documents", papers: "documents", forms: "documents", form: "documents", statements: "documents",
  meeting: "session", meetings: "session", sessions: "session",
  house: "home", property: "home",
  private: "confidential", privacy: "confidential",
  agreed: "agree", agreeing: "agree", agreement: "agree",
};
const CASE_SPECIFIC = ["my case", "our case", "my situation", "in my agreement", "our agreement says", "my judgment", "my court date"];

const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "") || w;
export function tokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .map((w) => stem(SYNONYMS[w] ?? w));
}
/** Multi-word signals match as phrases; single words match whole words (or word starts, for safety). */
function hasPhrase(text: string, list: string[], prefix = false) {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ")} `;
  const words = t.trim().split(" ");
  return list.some((p) =>
    p.includes(" ") ? t.includes(` ${p} `) || t.includes(` ${p}`) : words.some((w) => (prefix ? w.startsWith(p) : w === p)),
  );
}

export type NavigatorResult =
  | { kind: "safety" }
  | { kind: "legal"; related: QAEntry[] }
  | { kind: "case"; related: QAEntry[] }
  | { kind: "answer"; best: QAEntry; related: QAEntry[]; confidence: number }
  | { kind: "none"; related: QAEntry[] };

function scoreEntries(query: string, entries: QAEntry[]) {
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  const docs = entries.map((e) => ({
    e,
    strong: new Set(tokens(`${e.question}\n${e.phrasings}`)),
    weak: new Set(tokens(e.answer)),
  }));
  const df = (t: string) => docs.filter((d) => d.strong.has(t) || d.weak.has(t)).length;
  const idf = Object.fromEntries(q.map((t) => [t, Math.log(1 + (docs.length + 1) / (df(t) + 0.5))]));
  const max = q.reduce((s, t) => s + idf[t], 0);
  return docs
    .map(({ e, strong, weak }) => {
      let s = 0;
      for (const t of q) s += strong.has(t) ? idf[t] : weak.has(t) ? idf[t] * 0.35 : 0;
      return { e, score: s / max };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

export const ANSWER_THRESHOLD = 0.5;

export async function navigate(query: string): Promise<NavigatorResult> {
  if (hasPhrase(query, SAFETY_SIGNALS, true)) return { kind: "safety" };
  const entries = await db.qAEntry.findMany();
  const ranked = scoreEntries(query, entries);
  const related = ranked.slice(0, 3).map((r) => r.e);
  if (hasPhrase(query, LEGAL_ADVICE_SIGNALS)) {
    await logUnanswered(query, "LEGAL_ADVICE");
    return { kind: "legal", related };
  }
  if (hasPhrase(query, CASE_SPECIFIC)) {
    await logUnanswered(query, "CASE_SPECIFIC");
    return { kind: "case", related };
  }
  const top = ranked[0];
  if (top && top.score >= ANSWER_THRESHOLD) {
    return { kind: "answer", best: top.e, related: ranked.slice(1, 4).map((r) => r.e), confidence: top.score };
  }
  await logUnanswered(query, "NO_MATCH");
  return { kind: "none", related };
}

async function logUnanswered(text: string, reason: string) {
  // Only the first 160 characters, for the content team to see which questions need answers.
  await db.unansweredQuestion.create({ data: { text: text.slice(0, 160), reason } });
}

/** Articles ranked for a query, using the same words, synonyms and weighting as the Navigator. */
export async function searchArticles(query: string) {
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  const articles = await db.article.findMany();
  const docs = articles.map((a) => ({ a, strong: new Set(tokens(`${a.title}\n${a.summary}`)), weak: new Set(tokens(a.body)) }));
  const df = (t: string) => docs.filter((d) => d.strong.has(t) || d.weak.has(t)).length;
  const idf = Object.fromEntries(q.map((t) => [t, Math.log(1 + (docs.length + 1) / (df(t) + 0.5))]));
  const max = q.reduce((s, t) => s + idf[t], 0);
  return docs
    .map(({ a, strong, weak }) => ({ a, score: q.reduce((s, t) => s + (strong.has(t) ? idf[t] : weak.has(t) ? idf[t] * 0.5 : 0), 0) / max }))
    .filter((x) => x.score >= 0.2)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a);
}
