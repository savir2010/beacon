import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/public/PageShell";
import { db } from "@/lib/db";
import { COST_OF_CONFLICT } from "@/content/tools";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resource Center" };

const STAGE: Record<string, string> = { BEFORE: "Before mediation", DURING: "During mediation", AFTER: "After an agreement" };

export default async function Resources() {
  const articles = await db.article.findMany();
  const groups = ["BEFORE", "DURING", "AFTER"].map((s) => ({ s, items: articles.filter((a) => a.stage === s) })).filter((g) => g.items.length);
  return (
    <PageShell title="Resource Center" intro="Short, plain-language articles on the questions families ask most. Each one links to official California resources.">
      <div className="container-b py-16 sm:py-20">
        <section className="grid gap-6 pb-10 lg:grid-cols-12">
          <h2 className="text-[15px] font-semibold lg:col-span-3">Tools</h2>
          <div className="lg:col-span-9">
            <Link href={COST_OF_CONFLICT.href} className="group grid gap-4 rounded-[var(--radius-panel)] border border-[var(--color-hairline-strong)] bg-[var(--color-raised)] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-10 sm:p-8">
              <span>
                <span className="block text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">Interactive worksheet</span>
                <span className="mt-2 block text-[24px] font-semibold tracking-[-0.02em] group-hover:text-[var(--color-accent)]">{COST_OF_CONFLICT.title}</span>
                <span className="mt-2 block max-w-[62ch] text-[16px] text-[var(--color-muted)]">{COST_OF_CONFLICT.summary}</span>
              </span>
              <span className="btn btn-outline btn-sm justify-self-start">Open the worksheet <ArrowRight size={15} aria-hidden /></span>
            </Link>
          </div>
        </section>
        {groups.map((g) => (
          <section key={g.s} className="grid gap-6 border-t border-[var(--color-hairline-strong)] py-10 lg:grid-cols-12">
            <h2 className="text-[15px] font-semibold lg:col-span-3">{STAGE[g.s]}</h2>
            <ul className="lg:col-span-9">
              {g.items.map((a) => (
                <li key={a.slug} className="border-b border-[var(--color-hairline)] last:border-0">
                  <Link href={`/resources/${a.slug}`} className="group grid gap-2 py-6 first:pt-0 sm:grid-cols-[1fr_auto] sm:gap-10">
                    <span>
                      <span className="block text-[24px] font-semibold tracking-[-0.02em] group-hover:text-[var(--color-accent)]">{a.title}</span>
                      <span className="mt-2 block max-w-[62ch] text-[16px] text-[var(--color-muted)]">{a.summary}</span>
                    </span>
                    <span className="text-[14px] text-[var(--color-muted)] sm:pt-2">{a.readMinutes} min read</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="mt-10 text-[13px] text-[var(--color-muted)]">All articles are draft, pending legal review. General information only, not legal advice.</p>
      </div>
    </PageShell>
  );
}
