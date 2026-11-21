"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CircleCheck, Loader2 } from "lucide-react";
import { requestConsultation, requestSafetyContact, type FormState } from "@/app/consultation/actions";

function Err({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} className="mt-1.5 text-[14px] text-[var(--color-danger)]">{msg}</p> : null;
}

function Done({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-white p-8">
      <CircleCheck size={28} strokeWidth={1.5} className="text-[var(--color-accent)]" aria-hidden />
      <h2 className="display mt-4 text-[30px]">{title}</h2>
      <p className="mt-3 max-w-[52ch] text-[17px] text-[var(--color-ink)]/85">{body}</p>
      <Link href="/resources" className="btn btn-outline mt-6">Browse the Resource Center</Link>
    </div>
  );
}

export function ConsultationForm({ topics }: { topics?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestConsultation, {});
  const [method, setMethod] = useState("EMAIL");
  if (state.ok)
    return (
      <div className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-white p-6 sm:p-8">
        <h2 className="text-[24px] font-semibold tracking-[-0.02em]">Request received. Check your email.</h2>
        <p className="mt-3 max-w-[52ch] text-[16px] text-[var(--color-muted)]">
          We sent a 6-digit sign-in code to <strong className="font-semibold text-[var(--color-ink)]">{state.email}</strong>. Use it to open the Beacon app and follow your request. A mediator will contact you the way you asked, usually within two business days. No one else is contacted.
        </p>
        <a href={`/app/login?email=${encodeURIComponent(state.email ?? "")}`} className="btn btn-primary mt-6">Open the Beacon app</a>
      </div>
    );
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      {topics && <input type="hidden" name="topics" value={topics} />}
      <div>
        <label htmlFor="name" className="label">Name to use</label>
        <input id="name" name="name" className="field" autoComplete="given-name" aria-invalid={!!e.name} aria-describedby="name-hint name-err" />
        <p id="name-hint" className="hint">A first name is fine.</p>
        <Err id="name-err" msg={e.name} />
      </div>
      <fieldset>
        <legend className="label">How should we contact you?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {[["EMAIL", "Email"], ["PHONE", "Phone call"], ["TEXT", "Text message"]].map(([v, l]) => (
            <label key={v} className="choice py-3">
              <input type="radio" name="preferredContact" value={v} checked={method === v} onChange={() => setMethod(v)} />
              <span className="tick" />
              <span className="text-[16px] font-medium">{l}</span>
            </label>
          ))}
        </div>
        <Err id="pc-err" msg={e.preferredContact} />
      </fieldset>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" aria-invalid={!!e.email} aria-describedby="email-hint email-err" />
        <p id="email-hint" className="hint">We&rsquo;ll email you a sign-in code so you can follow your request in the Beacon app.</p>
        <Err id="email-err" msg={e.email} />
      </div>
      {method !== "EMAIL" && (
        <div>
          <label htmlFor="phone" className="label">Phone number</label>
          <input id="phone" name="phone" type="tel" className="field" autoComplete="tel" aria-invalid={!!e.phone} aria-describedby="phone-err" />
          <Err id="phone-err" msg={e.phone} />
        </div>
      )}
      <div>
        <label htmlFor="bestTime" className="label">Best time to reach you <span className="font-normal text-[var(--color-muted)]">(optional)</span></label>
        <input id="bestTime" name="bestTime" className="field" placeholder="For example, weekday mornings" />
      </div>
      <label className="flex items-start gap-3 text-[15px]">
        <input type="checkbox" name="safeToLeaveMessage" className="mt-1 size-4 accent-[var(--color-accent)]" />
        It&rsquo;s OK to leave a message that mentions Beacon.
      </label>
      <p className="rounded-[var(--radius-card)] bg-[var(--color-raised-2)] p-4 text-[14px]">
        Please don&rsquo;t include details about your situation, children&rsquo;s names, or financial information here. You can share what you choose during the consultation.
      </p>
      {state.message && <p className="text-[14px] text-[var(--color-danger)]">{state.message}</p>}
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending && <Loader2 size={17} className="animate-spin" aria-hidden />}
        Send request
      </button>
    </form>
  );
}

export function SafetyForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestSafetyContact, {});
  const [method, setMethod] = useState("PHONE");
  if (state.ok)
    return <Done title="We'll reach out privately" body="A Beacon mediator will contact you using only the method and times you gave. Beacon will not contact or notify anyone else." />;
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      <fieldset>
        <legend className="label">What is a safe way to reach you?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {[["PHONE", "Phone call"], ["TEXT", "Text message"], ["EMAIL", "Email"]].map(([v, l]) => (
            <label key={v} className="choice py-3">
              <input type="radio" name="contactMethod" value={v} checked={method === v} onChange={() => setMethod(v)} />
              <span className="tick" />
              <span className="text-[16px] font-medium">{l}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="contactValue" className="label">{method === "EMAIL" ? "Safe email address" : "Safe phone number"}</label>
        <input id="contactValue" name="contactValue" className="field" type={method === "EMAIL" ? "email" : "tel"} aria-invalid={!!e.contactValue} aria-describedby="cv-err" />
        <Err id="cv-err" msg={e.contactValue} />
      </div>
      <div>
        <label htmlFor="safeTimes" className="label">Safe times to contact you <span className="font-normal text-[var(--color-muted)]">(optional)</span></label>
        <input id="safeTimes" name="safeTimes" className="field" placeholder="For example, weekdays 9 to 11 a.m." />
      </div>
      <label className="flex items-start gap-3 text-[15px]">
        <input type="checkbox" name="safeToLeaveMessage" className="mt-1 size-4 accent-[var(--color-accent)]" />
        It&rsquo;s safe to leave a message.
      </label>
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending && <Loader2 size={17} className="animate-spin" aria-hidden />}
        Ask a mediator to contact me privately
      </button>
    </form>
  );
}
