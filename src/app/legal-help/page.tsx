import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/public/PageShell";
import { OFFICIAL } from "@/content/library.mjs";

export const metadata = { title: "Independent legal help" };

const ROWS = [
  { ...OFFICIAL.barReferral, body: "Certified lawyer referral services, by county." },
  { ...OFFICIAL.lawHelp, body: "Free and low-cost legal aid organizations across California." },
  { ...OFFICIAL.selfHelp, body: "Free guides, forms and court self-help centers." },
];

export default function LegalHelp() {
  return (
    <PageShell
      title="Independent legal help"
      intro="Beacon's mediators are neutral and can't advise either person. For questions about your rights, what you should accept, or what a court is likely to do, talk with a lawyer who works only for you."
    >
      <div className="container-b grid gap-16 py-16 sm:py-20 lg:grid-cols-12">
        <ul className="border-t border-[var(--color-hairline)] lg:col-span-7">
          {ROWS.map((r) => (
            <li key={r.url} className="border-b border-[var(--color-hairline)]">
              <a href={r.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-6 py-7">
                <span>
                  <span className="block text-[22px] font-semibold tracking-[-0.02em] group-hover:text-[var(--color-accent)]">{r.label}</span>
                  <span className="mt-1.5 block text-[16px] text-[var(--color-muted)]">{r.body}</span>
                </span>
                <ArrowUpRight size={20} className="mt-1 flex-none" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        <aside className="lg:col-span-4 lg:col-start-9">
          <h2 className="text-[17px] font-semibold">When to talk with a lawyer</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-[var(--color-ink)]/90">
            <li>Before you sign any agreement.</li>
            <li>When you aren&rsquo;t sure a proposal is fair to you.</li>
            <li>When your question is about your own rights or a likely court outcome.</li>
          </ul>
          <p className="mt-8 text-[13px] text-[var(--color-muted)]">Beacon lists these public resources for convenience and does not endorse a particular lawyer. Draft content, pending legal review.</p>
        </aside>
      </div>
    </PageShell>
  );
}
