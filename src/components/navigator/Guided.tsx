"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AWARE, STAGES, TOPICS, type AwareKey, type StageKey, type TopicKey } from "@/content/guided";
import { SafetyAnswer } from "./Navigator";

const STEPS = ["Your stage", "The other person", "Topics", "Safety"];

export function GuidedPath({ initialTopics = [] }: { initialTopics?: TopicKey[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<StageKey | null>(null);
  const [aware, setAware] = useState<AwareKey | null>(null);
  const [topics, setTopics] = useState<TopicKey[]>(initialTopics);
  const [unsafe, setUnsafe] = useState<null | boolean>(null);
  const [showSafety, setShowSafety] = useState(false);

  const canNext = [stage !== null, aware !== null, topics.length > 0, unsafe !== null][step];
  const finish = () => {
    const p = new URLSearchParams({ stage: stage!, aware: aware!, topics: topics.join(",") });
    router.push(`/navigator/guided/result?${p}`);
  };
  const next = () => {
    if (step < 3) return setStep(step + 1);
    if (unsafe) return setShowSafety(true);
    finish();
  };

  if (showSafety) {
    return (
      <div>
        <SafetyAnswer />
        <button type="button" className="btn btn-quiet mt-6" onClick={finish}>
          Continue to my checklist <ArrowRight size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canNext) next();
      }}
    >
      <ol className="flex gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <span className={`block h-1 rounded-full ${i < step ? "bg-[var(--color-ink)]/60" : i === step ? "bg-[var(--color-accent)]" : "bg-[var(--color-ink)]/12"}`} />
            <span className={`mt-2 hidden text-[13px] sm:block ${i === step ? "font-medium text-[var(--color-ink)]" : "text-[var(--color-muted)]"}`}>{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[13px] text-[var(--color-muted)] sm:hidden">Step {step + 1} of 4</p>

      <fieldset className="mt-10" key={step}>
        {step === 0 && (
          <>
            <legend className="display text-[28px] sm:text-[34px]">Where are you right now?</legend>
            <div className="mt-6 grid gap-3">
              {STAGES.map((s) => (
                <label key={s.key} className="choice">
                  <input type="radio" name="stage" checked={stage === s.key} onChange={() => setStage(s.key)} />
                  <span className="tick"><Check size={12} strokeWidth={3} /></span>
                  <span>
                    <span className="block text-[17px] font-medium">{s.label}</span>
                    <span className="block text-[14px] text-[var(--color-muted)]">{s.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <legend className="display text-[28px] sm:text-[34px]">Does the other person know you&rsquo;re exploring mediation?</legend>
            <p className="mt-3 text-[16px] text-[var(--color-muted)]">Either answer is fine. Beacon never contacts anyone without talking with you first.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {AWARE.map((a) => (
                <label key={a.key} className="choice">
                  <input type="radio" name="aware" checked={aware === a.key} onChange={() => setAware(a.key)} />
                  <span className="tick"><Check size={12} strokeWidth={3} /></span>
                  <span className="text-[17px] font-medium">{a.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <legend className="display text-[28px] sm:text-[34px]">What do you want to prepare for?</legend>
            <p className="mt-3 text-[16px] text-[var(--color-muted)]">Choose any that apply.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {TOPICS.map((t) => (
                <label key={t.key} className="choice">
                  <input
                    type="checkbox"
                    checked={topics.includes(t.key)}
                    onChange={(e) => setTopics(e.target.checked ? [...topics, t.key] : topics.filter((x) => x !== t.key))}
                  />
                  <span className="tick sq"><Check size={12} strokeWidth={3} /></span>
                  <span className="text-[17px] font-medium">{t.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <legend className="display text-[28px] sm:text-[34px]">Is anything making you feel unsafe, afraid, or pressured?</legend>
            <p className="mt-3 text-[16px] text-[var(--color-muted)]">This answer isn&rsquo;t saved or shared. If yes, we&rsquo;ll show private options first.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { v: false, label: "No" },
                { v: true, label: "Yes, or I'm not sure" },
              ].map((o) => (
                <label key={o.label} className="choice">
                  <input type="radio" name="unsafe" checked={unsafe === o.v} onChange={() => setUnsafe(o.v)} />
                  <span className="tick"><Check size={12} strokeWidth={3} /></span>
                  <span className="text-[17px] font-medium">{o.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </fieldset>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--color-hairline)] pt-6">
        <button type="button" className="btn btn-quiet" onClick={() => setStep(step - 1)} disabled={step === 0}>
          <ArrowLeft size={16} aria-hidden /> Back
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canNext}>
          {step === 3 ? "See my checklist" : "Continue"} <ArrowRight size={16} aria-hidden />
        </button>
      </div>
      <p className="mt-6 text-[13px] text-[var(--color-muted)]">Your answers stay on this device. Beacon doesn&rsquo;t save them.</p>
    </form>
  );
}
