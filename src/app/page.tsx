import Link from "next/link";
import { ArrowRight, CircleCheck, CircleDashed, Clock3, Download, FileText } from "lucide-react";
import { SafetyLink, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { StillWater } from "@/components/StillWater";
import { AskBox, AnswerBody } from "@/components/navigator/Navigator";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const STAGES = [
  {
    name: "Before mediation",
    body: "Ask questions in your own words, read short articles, and leave with a checklist of what to prepare.",
    link: { href: "/navigator/guided", label: "Build your checklist" },
  },
  {
    name: "During mediation",
    body: "Beacon clients sign in to see the current milestone, their next action, upcoming sessions and the documents released to them.",
    link: { href: "/app", label: "Client sign in" },
  },
  {
    name: "After an agreement",
    body: "Download your authorized final documents and find guides for the tools your family will use day to day.",
    link: { href: "/resources/after-you-reach-an-agreement", label: "What happens after" },
  },
];

export default async function Home() {
  const [example, articles] = await Promise.all([
    db.qAEntry.findFirst({ where: { question: "What should I bring to the first meeting?" } }),
    db.article.findMany({ orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="relative isolate">
      <StillWater className="fixed inset-0 -z-10" />
      <SiteHeader overlay />
      <main id="main">
        {/* First viewport: the Navigator itself, working, over still water light */}
        <section className="relative flex min-h-[100svh] items-center pb-24 pt-28">
          <div className="container-b flex flex-col items-center text-center">
            <h1 className="display max-w-[14ch] animate-[fade-up_900ms_var(--ease-out)_both] text-[46px] tracking-[-0.04em] sm:text-[72px] lg:text-[92px]">
              Know where you are. Know what&rsquo;s next.
            </h1>
            <p className="mt-6 max-w-[46ch] animate-[fade-up_900ms_var(--ease-out)_140ms_both] text-[17px] leading-relaxed text-[var(--color-ink)]/85 sm:text-[19px]">
              Plain answers about family mediation in California, a checklist you can take with you, and a person when you need one.
            </p>
            <div className="mt-10 w-full max-w-[720px] animate-[fade-up_900ms_var(--ease-out)_260ms_both] text-left">
              <AskBox />
            </div>
            <Link href="/navigator/guided" className="mt-8 animate-[fade-up_900ms_var(--ease-out)_380ms_both] text-[15px] font-medium underline-offset-4 hover:underline">
              Or answer four quick questions and get a preparation checklist
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden className="ml-1.5 inline align-[-3px]" />
            </Link>
          </div>
          <div className="container-b absolute inset-x-0 bottom-7">
            <SafetyLink />
          </div>
        </section>

        {/* One reading axis: before, during, after */}
        <section aria-labelledby="path" className="border-t border-[var(--color-hairline)] bg-[var(--color-canvas)]">
          <div data-reveal className="container-b py-24 sm:py-32">
            <div className="grid gap-6 lg:grid-cols-12">
              <h2 id="path" className="display text-[38px] sm:text-[52px] lg:col-span-6">
                One path, from first question to final papers
              </h2>
              <p className="max-w-[44ch] text-[17px] text-[var(--color-muted)] lg:col-span-5 lg:col-start-8 lg:pt-3">
                Every page answers the same three questions: what applies to my stage, what my next step is, and where to find what I need.
              </p>
            </div>
            <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
              <span aria-hidden className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-[var(--color-hairline-strong)] md:left-0 md:top-[7px] md:h-px md:w-full" />
              {STAGES.map((s, i) => (
                <li key={s.name} className="relative pl-10 md:pl-0 md:pt-12">
                  <span aria-hidden className={`absolute left-0 top-1 size-[15px] rounded-full border-[1.5px] md:top-0 ${i === 0 ? "border-[var(--color-ink)] bg-[var(--color-ink)]" : "border-[var(--color-ink)]/40 bg-[var(--color-canvas)]"}`} />
                  <h3 className="text-[24px] font-semibold tracking-[-0.02em]">{s.name}</h3>
                  <p className="mt-3 max-w-[36ch] text-[16px] text-[var(--color-muted)]">{s.body}</p>
                  <Link href={s.link.href} className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline">
                    {s.link.label}
                    <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* What an answer looks like: a real entry from the library */}
        {example && (
          <section aria-labelledby="answers" className="border-t border-[var(--color-hairline)] bg-[var(--color-raised)]">
            <div data-reveal className="container-b grid gap-14 py-24 sm:py-32 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 id="answers" className="display text-[36px] sm:text-[46px]">Answers you can check</h2>
                <p className="mt-5 max-w-[36ch] text-[17px] text-[var(--color-muted)]">
                  The Navigator never improvises. Every answer is written ahead of time, shows its source and its legal-review status, and ends with a next step.
                </p>
                <ul className="mt-8 space-y-3 text-[15px]">
                  <li className="flex gap-3"><CircleCheck size={18} strokeWidth={1.5} className="mt-0.5 flex-none text-[var(--color-accent)]" aria-hidden />Questions about your rights go to independent legal help.</li>
                  <li className="flex gap-3"><CircleCheck size={18} strokeWidth={1.5} className="mt-0.5 flex-none text-[var(--color-accent)]" aria-hidden />Questions about a specific case go to a person.</li>
                  <li className="flex gap-3"><CircleCheck size={18} strokeWidth={1.5} className="mt-0.5 flex-none text-[var(--color-accent)]" aria-hidden />No account, and nothing about your case is collected.</li>
                </ul>
              </div>
              <figure className="lg:col-span-7 lg:col-start-6">
                <div className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-6 sm:p-9">
                  <AnswerBody entry={example} />
                  <div className="mt-8 flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-white p-5">
                    <p className="text-[17px]"><span className="text-[var(--color-muted)]">Next step:</span> <span className="font-medium">{example.nextLabel}</span></p>
                    <Link href={example.nextHref} className="btn btn-primary">Go</Link>
                  </div>
                </div>
                <figcaption className="mt-3 text-[13px] text-[var(--color-muted)]">A Navigator answer, exactly as a visitor sees it. Draft, pending legal review.</figcaption>
              </figure>
            </div>
          </section>
        )}

        {/* The workspace, shown with fictional data */}
        <section aria-labelledby="workspace" className="border-t border-[var(--color-hairline)] bg-[var(--color-canvas)]">
          <div data-reveal className="container-b grid gap-14 py-24 sm:py-32 lg:grid-cols-12">
            <div className="lg:col-span-4 lg:order-2 lg:col-start-9">
              <h2 id="workspace" className="display text-[36px] sm:text-[46px]">For Beacon clients, the case at a glance</h2>
              <p className="mt-5 max-w-[36ch] text-[17px] text-[var(--color-muted)]">
                Each person has their own sign-in. You see what the case team has released to you, and nothing is shared without the team deciding it should be.
              </p>
              <a href="/app" className="btn btn-outline mt-8">Sign in to your workspace</a>
            </div>
            <figure className="lg:order-1 lg:col-span-7">
              <WorkspaceGlimpse />
              <figcaption className="mt-3 text-[13px] text-[var(--color-muted)]">Example workspace with a fictional case.</figcaption>
            </figure>
          </div>
        </section>

        {/* Interlude: the water shows through */}
        <section aria-label="How Beacon works" className="relative grid min-h-[70svh] place-items-center">
          <div data-reveal className="container-b text-center">
            <p className="display mx-auto max-w-[17ch] text-[40px] sm:text-[64px] lg:text-[80px]">The mediator guides. You make the decisions.</p>
            <p className="mx-auto mt-7 max-w-[48ch] text-[17px] text-[var(--color-ink)]/80">
              Beacon handles preparation and coordination so your time with the mediator goes to the conversations that matter.
            </p>
          </div>
        </section>

        {/* Resource Center */}
        <section aria-labelledby="resources" className="border-t border-[var(--color-hairline)] bg-[var(--color-raised)]">
          <div data-reveal className="container-b grid gap-12 py-24 sm:py-32 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 id="resources" className="display text-[36px] sm:text-[46px]">Resource Center</h2>
              <p className="mt-5 max-w-[34ch] text-[17px] text-[var(--color-muted)]">Short articles on the questions people ask most, each with links to official California resources.</p>
              <Link href="/resources" className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline">
                All articles <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
            <ul className="border-t border-[var(--color-hairline)] lg:col-span-8">
              {articles.map((a) => (
                <li key={a.slug} className="border-b border-[var(--color-hairline)]">
                  <Link href={`/resources/${a.slug}`} className="group grid gap-2 py-7 sm:grid-cols-[1fr_auto] sm:gap-10">
                    <span>
                      <span className="block text-[22px] font-semibold tracking-[-0.02em] group-hover:text-[var(--color-accent)]">{a.title}</span>
                      <span className="mt-2 block max-w-[60ch] text-[16px] text-[var(--color-muted)]">{a.summary}</span>
                    </span>
                    <span className="text-[14px] text-[var(--color-muted)] sm:pt-1.5">{a.readMinutes} min read</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Close */}
        <section aria-labelledby="talk" className="border-t border-[var(--color-hairline)] bg-[var(--color-canvas)]">
          <div data-reveal className="container-b grid gap-10 py-24 sm:py-32 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 id="talk" className="display text-[38px] sm:text-[56px]">Talk with Beacon privately</h2>
              <p className="mt-5 max-w-[48ch] text-[17px] text-[var(--color-muted)]">
                A consultation is a conversation with Beacon only. The other person isn&rsquo;t contacted or invited until you&rsquo;ve talked with the team and decided how to proceed.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 lg:col-span-4 lg:col-start-9">
              <Link href="/consultation" className="btn btn-primary btn-lg">Request a consultation</Link>
              <SafetyLink />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function WorkspaceGlimpse() {
  const docs = [
    { title: "Parenting schedule worksheet", status: "Available", icon: CircleCheck, owner: "Shared", date: "Nov 18" },
    { title: "Income and Expense Declaration", status: "Under review", icon: Clock3, owner: "You", date: "Nov 18" },
    { title: "2024 and 2025 tax returns", status: "Requested", icon: CircleDashed, owner: "You", date: "Due Nov 29" },
  ];
  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-hairline-strong)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--color-hairline)] px-6 py-4 text-[13px] text-[var(--color-muted)]">
        <span className="whitespace-nowrap font-medium text-[var(--color-ink)]">Case BMS-2026-014</span>
        <span>Updated yesterday by Dana Whitfield</span>
      </div>
      <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <p className="text-[22px] font-semibold tracking-[-0.02em]">Exchange financial information</p>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">Current milestone, step 3 of 6</p>
          <ol className="mt-5 flex items-center gap-1.5" aria-label="Milestones">
            {[2, 1, 0, 0, 0].map((s, i) => (
              <li key={i} className={`h-1.5 flex-1 rounded-full ${s === 2 ? "bg-[var(--color-ink)]/70" : s === 1 ? "bg-[var(--color-accent)]" : "bg-[var(--color-ink)]/12"}`} />
            ))}
          </ol>
        </div>
        <div className="rounded-[var(--radius-card)] bg-[var(--color-raised-2)] p-5">
          <p className="text-[17px] font-medium">Upload your 2024 and 2025 tax returns</p>
          <p className="mt-2 text-[13px] text-[var(--color-muted)]">Your next action · seen by you and the case team</p>
        </div>
      </div>
      <ul className="border-t border-[var(--color-hairline)]">
        {docs.map((d) => (
          <li key={d.title} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-[var(--color-hairline)] px-6 py-3.5 last:border-0 sm:grid-cols-[minmax(0,1fr)_120px_64px_88px] sm:px-8">
            <span className="flex min-w-0 items-center gap-3 text-[15px]">
              <FileText size={17} strokeWidth={1.5} className="flex-none text-[var(--color-muted)]" aria-hidden />
              <span>{d.title}</span>
            </span>
            <span className="status" data-s={d.status === "Available" ? "AVAILABLE" : ""}>
              <d.icon size={15} strokeWidth={1.75} aria-hidden />
              {d.status}
            </span>
            <span className="hidden text-[14px] text-[var(--color-muted)] sm:block">{d.owner}</span>
            <span className="hidden items-center justify-between text-[14px] text-[var(--color-muted)] sm:flex">
              {d.date}
              {d.status === "Available" && <Download size={15} strokeWidth={1.75} aria-hidden />}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
