import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Download } from "lucide-react";
import { PageShell } from "@/components/public/PageShell";
import { SafetyLink } from "@/components/SiteChrome";
import { buildGuided, parseGuided } from "@/content/guided";
import { track } from "@/lib/metrics";

export const metadata = { title: "Your preparation checklist" };

export default async function ResultPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { stageKey, aware, topicKeys } = parseGuided(sp);
  if (!stageKey) redirect("/navigator/guided");
  const r = buildGuided(stageKey, topicKeys, aware);
  await track("checklist.view");
  const qs = new URLSearchParams({ stage: stageKey, aware, topics: topicKeys.join(",") });

  return (
    <PageShell
      title="Your preparation checklist"
      intro={<>For someone who is <strong className="font-semibold">{r.stage.label.toLowerCase()}</strong>, preparing for {r.topics.map((t) => t.label.toLowerCase()).join(", ")}.</>}
      aside={
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <a href={`/api/checklist?${qs}`} className="btn btn-primary btn-lg">
            <Download size={18} aria-hidden /> Download PDF
          </a>
          <Link href="/navigator/guided" className="text-[14px] font-medium underline-offset-4 hover:underline">Change my answers</Link>
        </div>
      }
    >
      <div className="container-b grid gap-16 py-16 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {r.awarenessNote && (
            <p className="mb-12 rounded-[var(--radius-card)] bg-[var(--color-raised-2)] p-5 text-[16px]">{r.awarenessNote}</p>
          )}
          <section aria-labelledby="first">
            <h2 id="first" className="text-[24px] font-semibold tracking-[-0.02em]">Your next steps</h2>
            <ol className="mt-5 border-t border-[var(--color-hairline)]">
              {r.steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[32px_1fr] gap-3 border-b border-[var(--color-hairline)] py-5">
                  <span className={`grid size-7 place-items-center rounded-full text-[13px] font-semibold num ${i === 0 ? "bg-[var(--color-accent)] text-white" : "border border-[var(--color-hairline-strong)]"}`}>{i + 1}</span>
                  <div>
                    <p className="text-[17px] font-medium">{s.title}</p>
                    {s.detail && <p className="mt-1 text-[15px] text-[var(--color-muted)]">{s.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {r.checklist.map((g) => (
            <section key={g.topic} className="mt-14" aria-label={g.topic}>
              <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{g.topic}: what to gather</h2>
              <ul className="mt-5 border-t border-[var(--color-hairline)]">
                {g.items.map((it) => (
                  <li key={it.title} className="flex gap-4 border-b border-[var(--color-hairline)] py-4">
                    <span aria-hidden className="mt-1 size-[18px] flex-none rounded-[5px] border-[1.5px] border-[var(--color-ink)]/35" />
                    <div>
                      <p className="text-[16px] font-medium">{it.title}</p>
                      {it.detail && <p className="mt-0.5 text-[15px] text-[var(--color-muted)]">{it.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="border-t border-[var(--color-hairline-strong)] pt-5">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Questions to discuss with a mediator</h2>
            {r.questions.map((g) => (
              <div key={g.topic} className="mt-6">
                <h3 className="text-[13px] font-medium text-[var(--color-muted)]">{g.topic}</h3>
                <ul className="mt-2 space-y-2.5">
                  {g.items.map((q) => (
                    <li key={q} className="text-[15px] leading-snug">{q}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-[var(--color-hairline-strong)] pt-5">
            <p className="text-[17px] font-semibold">Ready to talk it through?</p>
            <p className="mt-2 text-[15px] text-[var(--color-muted)]">Share only your contact details. Beacon will reach out the way you choose.</p>
            <Link href={`/consultation?topics=${topicKeys.join(",")}`} className="btn btn-outline mt-4">
              Request a consultation <ArrowRight size={15} aria-hidden />
            </Link>
            <SafetyLink className="mt-6" />
          </div>
          <p className="mt-8 text-[13px] text-[var(--color-muted)]">Draft content, pending legal review. General information only, not legal advice.</p>
        </aside>
      </div>
    </PageShell>
  );
}
