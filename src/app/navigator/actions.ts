"use server";

import { navigate, type NavigatorResult } from "@/lib/search";
import { track } from "@/lib/metrics";

type Public = { id: string; question: string; answer: string; sourceLabel: string; sourceUrl: string; nextLabel: string; nextHref: string; articleSlug: string | null };
export type AskResult =
  | { kind: "safety" }
  | { kind: "legal" | "case" | "none"; related: Public[] }
  | { kind: "answer"; best: Public; related: Public[] };

const pub = (e: Public): Public => ({
  id: e.id, question: e.question, answer: e.answer, sourceLabel: e.sourceLabel, sourceUrl: e.sourceUrl,
  nextLabel: e.nextLabel, nextHref: e.nextHref, articleSlug: e.articleSlug,
});

export async function ask(question: string): Promise<AskResult> {
  const q = question.trim().slice(0, 400);
  if (!q) return { kind: "none", related: [] };
  const r: NavigatorResult = await navigate(q);
  if (r.kind === "safety") return { kind: "safety" };
  if (r.kind === "answer") {
    await track("navigator.answer");
    return { kind: "answer", best: pub(r.best), related: r.related.map(pub) };
  }
  await track("navigator.handoff");
  return { kind: r.kind, related: r.related.map(pub) };
}

export async function rateNextStep(clear: boolean) {
  await track(clear ? "nextstep.clear" : "nextstep.unclear");
}
