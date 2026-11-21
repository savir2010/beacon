import { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { IonButton, IonIcon, IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import { barChartOutline, chevronForwardOutline, libraryOutline, listOutline, mailOutline, personCircleOutline } from "ionicons/icons";
import { api } from "../../api";
import { useAction, useResource } from "../../hooks";
import { fmtDate, fmtDateTime, fmtRelative, isoDay } from "../../format";
import { Field, Loading, Screen, Section } from "../../components/ui";

const B = "/admin";

// Team ----------------------------------------------------------------------------------------

type Member = { id: string; name: string; email: string; role: string; active: boolean; lastSignInAt: string | null; openCases: number };

export function Team() {
  const { data, error, reload } = useResource<{ team: Member[] }>("admin/team");
  const { run, busy } = useAction();
  const [f, setF] = useState({ name: "", email: "", role: "MEDIATOR" });
  const change = async (id: string, b: unknown) => { if (await run(() => api.post(`admin/team/${id}`, b))) await reload(); };
  return (
    <Screen title="Team" onRefresh={reload} wide>
      <section className="stack">
        <h1 className="display">Team</h1>
        <p className="lead">Mediators open their own cases. Administrators see every case, intake, the content library and the audit log.</p>
      </section>
      {!data ? <Loading error={error} /> : (
        <div className="split">
          <Section title="People">
            <div className="rows">
              {data.team.map((m) => (
                <div key={m.id} className="r">
                  <div>
                    <p className="r-title">{m.name}{!m.active && <span className="muted"> (turned off)</span>}</p>
                    <p className="r-meta">{m.email} · {m.role === "ADMIN" ? "Administrator" : "Mediator"} · {m.openCases} open case{m.openCases === 1 ? "" : "s"} · {m.lastSignInAt ? `Signed in ${fmtRelative(m.lastSignInAt)}` : "Hasn't signed in"}</p>
                  </div>
                  <div className="r-actions">
                    <label className="sr-only" htmlFor={`role-${m.id}`}>Role for {m.name}</label>
                    <select id={`role-${m.id}`} className="input" style={{ minHeight: 36, width: "auto", fontSize: 14 }} value={m.role} disabled={busy} onChange={(e) => change(m.id, { role: e.target.value })}>
                      <option value="MEDIATOR">Mediator</option><option value="ADMIN">Administrator</option>
                    </select>
                    <IonButton size="small" fill="outline" color={m.active ? "danger" : "primary"} disabled={busy} onClick={() => change(m.id, { active: !m.active })}>{m.active ? "Turn off" : "Turn on"}</IonButton>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Add someone" note="They sign in with their email and a one-time code. No password to set up.">
            <form className="panel stack" onSubmit={async (e) => { e.preventDefault(); if (await run(() => api.post("admin/team", f))) { setF({ name: "", email: "", role: "MEDIATOR" }); await reload(); } }}>
              <Field label="Name" htmlFor="t-n"><input id="t-n" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="Work email" htmlFor="t-e"><input id="t-e" type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
              <Field label="Role" htmlFor="t-r"><select id="t-r" className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="MEDIATOR">Mediator</option><option value="ADMIN">Administrator</option></select></Field>
              <div><IonButton type="submit" disabled={busy}>Add to team</IonButton></div>
            </form>
          </Section>
        </div>
      )}
    </Screen>
  );
}

// More ----------------------------------------------------------------------------------------

export function More() {
  const history = useHistory();
  const items = [
    [libraryOutline, "Content library", "Articles and Navigator answers, with legal-review status", "library"],
    [barChartOutline, "Measures", "The last 30 days, and questions the library couldn't answer", "measures"],
    [listOutline, "Audit log", "Sign-ins, downloads, releases and permission changes", "activity"],
    [mailOutline, "Email outbox", "Every notice the app sent. Sign-in codes are never shown.", "outbox"],
    [personCircleOutline, "Account", "Sign out", "account"],
  ] as const;
  return (
    <Screen title="More">
      <div className="rows">
        {items.map(([icon, t, d, path]) => (
          <button key={path} type="button" className="r tap btnrow" style={{ gridTemplateColumns: "34px 1fr auto" }} onClick={() => history.push(`${B}/${path}`)}>
            <span className="icon-badge"><IonIcon icon={icon} aria-hidden /></span>
            <span><span className="r-title">{t}</span><span className="r-meta">{d}</span></span>
            <IonIcon icon={chevronForwardOutline} aria-hidden style={{ color: "var(--b-muted)" }} />
          </button>
        ))}
      </div>
    </Screen>
  );
}

// Library -------------------------------------------------------------------------------------

type Article = { id: string; slug: string; title: string; summary: string; body: string; stage: string; reviewStatus: string; reviewerName: string | null; reviewedAt: string | null; updatedAt: string };
type QA = { id: string; question: string; phrasings: string; answer: string; topic: string; sourceLabel: string; sourceUrl: string; nextLabel: string; nextHref: string; reviewStatus: string; reviewerName: string | null; reviewedAt: string | null; updatedAt: string };
const review = (x: { reviewStatus: string; reviewerName: string | null; reviewedAt: string | null }) =>
  x.reviewStatus === "REVIEWED" ? `Reviewed by ${x.reviewerName} on ${fmtDate(x.reviewedAt)}` : "Draft, pending legal review";

export function Library() {
  const history = useHistory();
  const [tab, setTab] = useState("articles");
  const { data, error, reload } = useResource<{ articles: Article[]; qa: QA[] }>("admin/library");
  const pending = data ? [...data.articles, ...data.qa].filter((x) => x.reviewStatus !== "REVIEWED").length : 0;
  return (
    <Screen title="Content library" back={`${B}/more`} onRefresh={reload} wide>
      <section className="stack">
        <h1 className="display">Content library</h1>
        <p className="lead">The Resource Center and the Navigator answer from this library only. {data ? `${pending} item${pending === 1 ? "" : "s"} still need legal review.` : ""}</p>
      </section>
      <IonSegment value={tab} onIonChange={(e) => setTab(String(e.detail.value))}>
        <IonSegmentButton value="articles"><IonLabel>Articles</IonLabel></IonSegmentButton>
        <IonSegmentButton value="qa"><IonLabel>Navigator answers</IonLabel></IonSegmentButton>
      </IonSegment>
      {!data ? <Loading error={error} /> : (
        <div className="rows">
          {(tab === "articles" ? data.articles : data.qa).map((x) => (
            <button key={x.id} type="button" className="r tap btnrow" onClick={() => history.push(`${B}/library/${tab === "articles" ? "articles" : "qa"}/${x.id}`)}>
              <span><span className="r-title">{"title" in x ? x.title : x.question}</span><span className="r-meta">{review(x)} · Edited {fmtDate(x.updatedAt)}</span></span>
              <IonIcon icon={chevronForwardOutline} aria-hidden style={{ color: "var(--b-muted)" }} />
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}

function ReviewFields({ v, set }: { v: { reviewStatus: string; reviewerName: string; reviewedAt: string }; set: (k: string, val: string) => void }) {
  return (
    <fieldset className="panel stack" style={{ margin: 0 }}>
      <legend className="field-label" style={{ padding: "0 6px" }}>Legal review</legend>
      <Field label="Status" htmlFor="rs"><select id="rs" className="input" value={v.reviewStatus} onChange={(e) => set("reviewStatus", e.target.value)}><option value="DRAFT">Draft, pending legal review</option><option value="REVIEWED">Reviewed</option></select></Field>
      <div className="split" style={{ gap: 16 }}>
        <Field label="Reviewer's name" htmlFor="rn" hint="Required once reviewed. Never invent one."><input id="rn" className="input" value={v.reviewerName} onChange={(e) => set("reviewerName", e.target.value)} /></Field>
        <Field label="Review date" htmlFor="rd"><input id="rd" type="date" className="input" value={v.reviewedAt} onChange={(e) => set("reviewedAt", e.target.value)} /></Field>
      </div>
    </fieldset>
  );
}

function useLibraryItem<T>(kind: "articles" | "qa") {
  const { id } = useParams<{ id: string }>();
  const { data } = useResource<{ articles: Article[]; qa: QA[] }>("admin/library");
  const item = data ? ((kind === "articles" ? data.articles : data.qa) as unknown as (T & { id: string })[]).find((x) => x.id === id) : undefined;
  return { id, item, loaded: !!data };
}

export function LibraryArticle() {
  const { id, item, loaded } = useLibraryItem<Article>("articles");
  const { run, busy } = useAction();
  const [f, setF] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (item && !f) setF({ title: item.title, summary: item.summary, body: item.body, reviewStatus: item.reviewStatus, reviewerName: item.reviewerName ?? "", reviewedAt: isoDay(item.reviewedAt) });
  }, [item, f]);
  const set = (k: string, v: string) => setF((x) => ({ ...x!, [k]: v }));
  return (
    <Screen title="Edit article" back={`${B}/library`}>
      {!f ? <Loading error={loaded && !item ? "Not found" : null} /> : (
        <form className="stack-lg" onSubmit={(e) => { e.preventDefault(); run(() => api.post(`admin/library/articles/${id}`, f)); }}>
          <Field label="Title" htmlFor="a-t"><input id="a-t" className="input" value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Summary" htmlFor="a-s"><textarea id="a-s" className="input" value={f.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
          <Field label="Body" htmlFor="a-b" hint='Paragraphs separated by a blank line. "## " starts a heading and "- " a list item.'>
            <textarea id="a-b" className="input" style={{ minHeight: 360, fontFamily: "monospace", fontSize: 14 }} value={f.body} onChange={(e) => set("body", e.target.value)} />
          </Field>
          <ReviewFields v={f as never} set={set} />
          <div className="row"><IonButton type="submit" disabled={busy}>Save</IonButton>{item && <a className="small" href={`/resources/${item.slug}`} target="_blank" rel="noreferrer">View on the website</a>}</div>
        </form>
      )}
    </Screen>
  );
}

export function LibraryQA() {
  const { id, item, loaded } = useLibraryItem<QA>("qa");
  const { run, busy } = useAction();
  const [f, setF] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (item && !f) setF({ question: item.question, answer: item.answer, phrasings: item.phrasings, sourceLabel: item.sourceLabel, sourceUrl: item.sourceUrl, nextLabel: item.nextLabel, nextHref: item.nextHref, reviewStatus: item.reviewStatus, reviewerName: item.reviewerName ?? "", reviewedAt: isoDay(item.reviewedAt) });
  }, [item, f]);
  const set = (k: string, v: string) => setF((x) => ({ ...x!, [k]: v }));
  return (
    <Screen title="Edit answer" back={`${B}/library`}>
      {!f ? <Loading error={loaded && !item ? "Not found" : null} /> : (
        <form className="stack-lg" onSubmit={(e) => { e.preventDefault(); run(() => api.post(`admin/library/qa/${id}`, f)); }}>
          <Field label="Question" htmlFor="q-q"><input id="q-q" className="input" value={f.question} onChange={(e) => set("question", e.target.value)} /></Field>
          <Field label="Answer" htmlFor="q-a" hint="Shown exactly as written. Keep it short and general; no legal advice."><textarea id="q-a" className="input" value={f.answer} onChange={(e) => set("answer", e.target.value)} /></Field>
          <Field label="Other ways people ask this" htmlFor="q-p" hint="One per line. The Navigator matches against these."><textarea id="q-p" className="input" value={f.phrasings} onChange={(e) => set("phrasings", e.target.value)} /></Field>
          <div className="split" style={{ gap: 16 }}>
            <Field label="Source label" htmlFor="q-sl"><input id="q-sl" className="input" value={f.sourceLabel} onChange={(e) => set("sourceLabel", e.target.value)} /></Field>
            <Field label="Source link" htmlFor="q-su"><input id="q-su" className="input" value={f.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} /></Field>
            <Field label="Next step label" htmlFor="q-nl"><input id="q-nl" className="input" value={f.nextLabel} onChange={(e) => set("nextLabel", e.target.value)} /></Field>
            <Field label="Next step link" htmlFor="q-nh"><input id="q-nh" className="input" value={f.nextHref} onChange={(e) => set("nextHref", e.target.value)} /></Field>
          </div>
          <ReviewFields v={f as never} set={set} />
          <div><IonButton type="submit" disabled={busy}>Save</IonButton></div>
        </form>
      )}
    </Screen>
  );
}

// Audit log -----------------------------------------------------------------------------------

const FILTERS = [["", "All"], ["access", "Access"], ["documents", "Documents"], ["cases", "Case updates"], ["signin", "Sign-ins"], ["content", "Content"]] as const;

export function Activity() {
  const [kind, setKind] = useState("");
  const { data, error, reload } = useResource<{ events: { id: string; at: string; actor: string; action: string; detail: string | null; reference: string | null }[] }>(`admin/activity?kind=${kind}`);
  return (
    <Screen title="Audit log" back={`${B}/more`} onRefresh={reload} wide>
      <section className="stack">
        <h1 className="display">Audit log</h1>
        <p className="lead">Every sign-in, download, release and permission change. Entries can&rsquo;t be edited or deleted.</p>
      </section>
      <div className="row">
        {FILTERS.map(([k, l]) => <IonButton key={k} size="small" fill={kind === k ? "solid" : "outline"} onClick={() => setKind(k)}>{l}</IonButton>)}
      </div>
      {!data ? <Loading error={error} /> : data.events.length === 0 ? <p className="empty">Nothing here yet.</p> : (
        <div className="rows">
          {data.events.map((e) => (
            <div key={e.id} className="r" style={{ gridTemplateColumns: "1fr" }}>
              <div><p className="body" style={{ margin: 0 }}>{e.detail}</p><p className="r-meta num">{e.actor}{e.reference ? ` · ${e.reference}` : ""} · {fmtDateTime(e.at)}</p></div>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}

// Outbox --------------------------------------------------------------------------------------

export function Outbox() {
  const { data, error, reload } = useResource<{ emails: { id: string; to: string; subject: string; body: string; batchId: string | null; at: string }[] }>("admin/outbox");
  return (
    <Screen title="Email outbox" back={`${B}/more`} onRefresh={reload} wide>
      <section className="stack">
        <h1 className="display">Email outbox</h1>
        <p className="lead">Stands in for an email provider in this version. Notices never include case details. Sign-in codes are never listed here.</p>
      </section>
      {!data ? <Loading error={error} /> : data.emails.length === 0 ? <p className="empty">No emails yet.</p> : (
        <div className="rows">
          {data.emails.map((m) => (
            <details key={m.id} className="r" style={{ display: "block" }}>
              <summary style={{ cursor: "pointer", listStyle: "none" }}>
                <p className="r-title">{m.subject}</p>
                <p className="r-meta num">To {m.to} · {fmtDateTime(m.at)}{m.batchId ? ` · sent together (batch ${m.batchId.slice(0, 6)})` : ""}</p>
              </summary>
              <pre className="body muted" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "10px 0 0" }}>{m.body}</pre>
            </details>
          ))}
        </div>
      )}
    </Screen>
  );
}

// Measures ------------------------------------------------------------------------------------

const REASON: Record<string, string> = { NO_MATCH: "No match", CASE_SPECIFIC: "Sent to case team", LEGAL_ADVICE: "Sent to legal help" };

export function Measures() {
  const { data, error, reload } = useResource<{ measures: { label: string; value: string }[]; unanswered: { id: string; text: string; reason: string; at: string }[] }>("admin/measures");
  return (
    <Screen title="Measures" back={`${B}/more`} onRefresh={reload} wide>
      <section className="stack">
        <h1 className="display">Last 30 days</h1>
        <p className="lead">Anonymous counts from the public site. No question text is kept with a person or a case.</p>
      </section>
      {!data ? <Loading error={error} /> : (
        <>
          <div className="stats">{data.measures.map((m) => <div key={m.label} className="stat"><b>{m.value}</b><span>{m.label}</span></div>)}</div>
          <Section title="Questions without an answer" note="What the content team could write next. Safety questions are never stored.">
            {data.unanswered.length === 0 ? <p className="empty">None yet.</p> : (
              <div className="rows">
                {data.unanswered.map((u) => <div key={u.id} className="r"><p className="body" style={{ margin: 0 }}>&ldquo;{u.text}&rdquo;</p><span className="small muted">{REASON[u.reason] ?? u.reason} · {fmtRelative(u.at)}</span></div>)}
              </div>
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}
