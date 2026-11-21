"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Loader2, Scale, ShieldCheck, UserRound } from "lucide-react";
import { ask, rateNextStep, type AskResult } from "@/app/navigator/actions";

export const SUGGESTED = [
  "Can I explore mediation if my spouse hasn't agreed?",
  "What should I bring to the first meeting?",
  "Do I still need a lawyer if we use a mediator?",
];

const HANDOFF_KEY = "beacon:ask";

/**
 * The question box. On the home page it hands the question to /navigator through session
 * storage, so the question never appears in the address bar or browser history.
 */
export function AskBox({ onAsk, autoFocus = false, size = "lg", initial = "" }: { onAsk?: (q: string) => void; autoFocus?: boolean; size?: "lg" | "md"; initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (onAsk) return onAsk(t);
    try {
      sessionStorage.setItem(HANDOFF_KEY, t);
    } catch {}
    router.push("/navigator");
  };
  const big = size === "lg";
  return (
    <div className="w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className={`flex w-full items-center gap-2 rounded-full border border-[var(--color-hairline-strong)] bg-white p-1.5 transition-colors focus-within:border-[var(--color-accent)] ${big ? "pl-6" : "pl-5"}`}
      >
        <label htmlFor="ask" className="sr-only">
          Ask a question about mediation
        </label>
        <input
          id="ask"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={autoFocus}
          autoComplete="off"
          maxLength={400}
          placeholder="Ask in your own words"
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#6b8094] ${big ? "h-12 text-[17px]" : "h-11 text-[16px]"}`}
        />
        <button type="submit" className={`btn btn-primary rounded-full ${big ? "h-12 px-6" : "h-11 px-5"}`}>
          Ask
          <ArrowRight size={17} strokeWidth={1.75} aria-hidden />
        </button>
      </form>
      <p className="mt-3 text-[13px] text-[var(--color-muted)]">
        Please don&rsquo;t include names or case details. Answers come from Beacon&rsquo;s written library.
      </p>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Common questions">
        {SUGGESTED.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => submit(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The full Navigator: ask, read the sourced answer, take the next step or reach a person. */
export function NavigatorPanel() {
  const [question, setQuestion] = useState<string | null>(null);
  const [result, setResult] = useState<AskResult | null>(null);
  const [pending, start] = useTransition();
  const [boxKey, setBoxKey] = useState(0);
  const out = useRef<HTMLDivElement>(null);

  const run = (q: string) => {
    setQuestion(q);
    start(async () => {
      const r = await ask(q);
      setResult(r);
      requestAnimationFrame(() => out.current?.focus());
    });
  };

  useEffect(() => {
    try {
      const q = sessionStorage.getItem(HANDOFF_KEY);
      if (q) {
        sessionStorage.removeItem(HANDOFF_KEY);
        run(q);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <AskBox key={boxKey} onAsk={run} size="md" autoFocus={!question} />
      <div ref={out} tabIndex={-1} aria-live="polite" className="mt-12 outline-none">
        {pending && (
          <p className="flex items-center gap-2 text-[15px] text-[var(--color-muted)]">
            <Loader2 size={16} className="animate-spin" aria-hidden /> Looking in Beacon&rsquo;s answer library
          </p>
        )}
        {!pending && result && question && (
          <Result
            question={question}
            result={result}
            onAsk={(q) => {
              setBoxKey((k) => k + 1);
              run(q);
            }}
          />
        )}
      </div>
    </div>
  );
}

function Result({ question, result, onAsk }: { question: string; result: AskResult; onAsk: (q: string) => void }) {
  if (result.kind === "safety") return <SafetyAnswer />;
  return (
    <div className="animate-[ripple-in_600ms_var(--ease-out)_both]">
      <p className="text-[17px]"><span className="text-[var(--color-muted)]">You asked:</span> <span className="font-medium">&ldquo;{question}&rdquo;</span></p>

      {result.kind === "answer" && <Answer entry={result.best} />}
      {result.kind === "legal" && (
        <Handoff
          icon={<Scale size={20} strokeWidth={1.5} aria-hidden />}
          title="This question needs your own lawyer"
          body="Questions about what you should accept, your rights in your situation, or what a court is likely to do need advice from an independent lawyer. Beacon's mediators are neutral and can't advise either person."
          primary={{ href: "/legal-help", label: "Find independent legal help" }}
          secondary={{ href: "/consultation", label: "Talk with Beacon about the process" }}
        />
      )}
      {result.kind === "case" && (
        <Handoff
          icon={<UserRound size={20} strokeWidth={1.5} aria-hidden />}
          title="Your case team can answer this"
          body="Questions about a specific case go to a person, not the Navigator. If you're a Beacon client, sign in and send your case team a message. Otherwise, request a private consultation."
          primary={{ href: "/app", label: "Sign in to your workspace" }}
          secondary={{ href: "/consultation", label: "Request a consultation" }}
        />
      )}
      {result.kind === "none" && (
        <Handoff
          icon={<UserRound size={20} strokeWidth={1.5} aria-hidden />}
          title="We don't have a written answer for that yet"
          body="Rather than guess, the Navigator only answers from Beacon's written library. A person on the Beacon team can help, and the closest topics are below."
          primary={{ href: "/consultation", label: "Ask a person at Beacon" }}
          secondary={{ href: "/resources", label: "Browse the Resource Center" }}
        />
      )}

      {result.related.length > 0 && (
        <div className="mt-14">
          <h3 className="text-[15px] font-semibold">{result.kind === "answer" ? "Related questions" : "Closest topics in the library"}</h3>
          <ul className="mt-3 border-t border-[var(--color-hairline)]">
            {result.related.map((r) => (
              <li key={r.id} className="border-b border-[var(--color-hairline)]">
                <button type="button" onClick={() => onAsk(r.question)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-[16px] hover:text-[var(--color-accent)]">
                  {r.question}
                  <ArrowRight size={16} strokeWidth={1.5} aria-hidden className="flex-none" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type Entry = Extract<AskResult, { kind: "answer" }>["best"];

export function AnswerBody({ entry }: { entry: Entry }) {
  const external = entry.sourceUrl.startsWith("http");
  return (
    <>
      <h2 className="display text-[30px] sm:text-[36px]">{entry.question}</h2>
      <p className="mt-5 max-w-[60ch] text-[18px] leading-[1.6]">{entry.answer}</p>
      <dl className="mt-8 grid gap-x-10 gap-y-4 border-t border-[var(--color-hairline)] pt-6 text-[15px] sm:grid-cols-2">
        <div>
          <dt className="text-[13px] text-[var(--color-muted)]">Source</dt>
          <dd className="mt-1">
            <a href={entry.sourceUrl} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className="font-medium underline">
              {(() => {
                const words = entry.sourceLabel.split(" ");
                const last = words.pop();
                return (
                  <>
                    {words.join(" ")}{words.length ? " " : ""}
                    <span className="whitespace-nowrap">
                      {last}
                      {external && <ArrowUpRight size={14} aria-hidden className="ml-0.5 inline align-[-2px]" />}
                    </span>
                  </>
                );
              })()}
            </a>
          </dd>
        </div>
        {entry.articleSlug && (
          <div>
            <dt className="text-[13px] text-[var(--color-muted)]">Read more</dt>
            <dd className="mt-1">
              <Link href={`/resources/${entry.articleSlug}`} className="inline-flex items-center gap-1.5 font-medium underline">
                <BookOpen size={15} strokeWidth={1.5} aria-hidden />
                Resource Center article
              </Link>
            </dd>
          </div>
        )}
      </dl>
    </>
  );
}

function Answer({ entry }: { entry: Entry }) {
  const [rated, setRated] = useState<null | boolean>(null);
  return (
    <article className="mt-8 rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-white p-6 sm:p-9">
      <AnswerBody entry={entry} />
      <div className="mt-8 flex flex-col gap-5 rounded-[var(--radius-card)] bg-[var(--color-raised-2)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[17px]"><span className="text-[var(--color-muted)]">Next step:</span> <span className="font-medium">{entry.nextLabel}</span></p>
        <Link href={entry.nextHref} className="btn btn-primary">
          Go
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-[14px]" aria-live="polite">
          {rated === null ? (
            <>
              <span className="text-[var(--color-muted)]">Was your next step clear?</span>
              {[true, false].map((v) => (
                <button key={String(v)} type="button" className="btn btn-outline btn-sm" onClick={() => { setRated(v); void rateNextStep(v); }}>
                  {v ? "Yes" : "Not really"}
                </button>
              ))}
            </>
          ) : (
            <span className="text-[var(--color-muted)]">{rated ? "Thank you." : "Thank you. A person at Beacon can help: request a consultation below."}</span>
          )}
        </div>
        <Link href="/consultation" className="text-[14px] font-medium underline">
          Prefer to talk it through? Request a private consultation
        </Link>
      </div>
      <p className="mt-6 text-[13px] text-[var(--color-muted)]">Draft answer, pending legal review. General information, not legal advice.</p>
    </article>
  );
}

function Handoff({ icon, title, body, primary, secondary }: { icon: React.ReactNode; title: string; body: string; primary: { href: string; label: string }; secondary: { href: string; label: string } }) {
  return (
    <section className="mt-8 rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-white p-6 sm:p-9">
      <span className="grid size-11 place-items-center rounded-full border border-[var(--color-accent)]/40 text-[var(--color-accent)]">{icon}</span>
      <h2 className="display mt-5 text-[28px] sm:text-[34px]">{title}</h2>
      <p className="mt-4 max-w-[60ch] text-[17px] leading-[1.6] text-[var(--color-ink)]/90">{body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={primary.href} className="btn btn-primary">{primary.label}</Link>
        <Link href={secondary.href} className="btn btn-outline">{secondary.label}</Link>
      </div>
    </section>
  );
}

export function SafetyAnswer() {
  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-white p-6 sm:p-9">
      <span className="grid size-11 place-items-center rounded-full border border-[var(--color-accent)]/40 text-[var(--color-accent)]">
        <ShieldCheck size={20} strokeWidth={1.5} aria-hidden />
      </span>
      <h2 className="display mt-5 text-[28px] sm:text-[34px]">Your safety comes first</h2>
      <p className="mt-4 max-w-[60ch] text-[17px] leading-[1.6]">
        It sounds like something may be making you feel unsafe or pressured. You can talk with Beacon privately. Beacon will not contact or notify the other person.
        Your question was not saved.
      </p>
      <ul className="mt-6 space-y-2 text-[16px]">
        <li><strong className="font-semibold">In an emergency, call 911.</strong></li>
        <li>
          National Domestic Violence Hotline: <a className="font-medium underline" href="tel:18007997233">1-800-799-7233</a>, or text START to 88788. Free, confidential, 24 hours.
        </li>
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/safety" className="btn btn-primary">See private options</Link>
        <QuickExit />
      </div>
    </section>
  );
}

/** Leaves the site immediately and replaces this page in history. */
export function QuickExit({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={`btn btn-outline ${className}`}
      onClick={() => {
        try {
          sessionStorage.clear();
        } catch {}
        window.location.replace("https://weather.com");
      }}
    >
      Leave this site quickly
    </button>
  );
}
