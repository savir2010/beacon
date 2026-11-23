import { useState, type FormEvent } from "react";
import { useHistory, useParams } from "react-router-dom";
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonSpinner, IonTitle, IonToolbar } from "@ionic/react";
import { arrowForwardOutline, calculatorOutline, chevronForwardOutline, openOutline, searchOutline, shieldCheckmarkOutline } from "ionicons/icons";
import { api, openExternal } from "../../api";
import { useResource } from "../../hooks";
import { fmtDate } from "../../format";
import { Loading, Screen, Section } from "../../components/ui";

// The Resource Center and Navigator inside the client app. Answers come only from Beacon's
// written library, shown exactly as written with their source. Nothing is generated.

type Card = { slug: string; title: string; summary: string; stage: string; readMinutes: number; review: { by: string; on: string } | null };
type Entry = { id: string; question: string; answer: string; source: { label: string; url: string }; next: { label: string; href: string }; articleSlug: string | null; draft: boolean };
type Result = { kind: "answer" | "none" | "legal" | "case" | "safety"; answer: Entry | null; related: Entry[]; articles: Card[] };

const STAGES = [["BEFORE", "Before mediation"], ["DURING", "During mediation"], ["AFTER", "After an agreement"]] as const;
const SUGGESTIONS = ["What should I bring to the first meeting?", "Do I still need a lawyer?", "What happens after we agree?"];
// Interactive tools: self-contained pages in the website's public/tools. The web app is served from the
// same server, and the iPhone build bundles a copy (see vite.config.ts), so "/tools/..." works in both.
const TOOLS = [
  { slug: "cost-of-conflict", title: "Cost of Conflict Worksheet", src: "/tools/cost-of-conflict.html",
    summary: "Compare what agreeing now and going to court are each likely to cost, side by side. Nothing is saved." },
];

const Draft = () => <p className="small muted" style={{ margin: 0 }}>Draft content, pending legal review. General information only, not legal advice.</p>;

export function ResourcesPage() {
  const history = useHistory();
  const { data, error } = useResource<{ articles: Card[] }>("resources");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<Result | null>(null);

  async function ask(e?: FormEvent, text = q) {
    e?.preventDefault();
    if (text.trim().length < 2) return setErr("Type a question or a few words.");
    setErr(""); setBusy(true); setQ(text);
    try { setRes(await api.post<Result>("resources/search", { q: text })); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Screen title="Resources">
      <section className="stack">
        <h1 className="display">Resource Center</h1>
        <p className="lead">Plain answers about family mediation in California, from Beacon&rsquo;s written library. For anything about your own case, ask your case team in Messages.</p>
      </section>

      <form className="stack" onSubmit={ask} role="search">
        <label className="field-label" htmlFor="ask">Ask a question or search</label>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input id="ask" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Do I need a lawyer?" enterKeyHint="search" aria-describedby="ask-hint" />
          <IonButton type="submit" disabled={busy} aria-label="Search">{busy ? <IonSpinner name="crescent" /> : <IonIcon icon={searchOutline} />}</IonButton>
        </div>
        <p id="ask-hint" className="field-hint" style={{ margin: 0 }}>Please don&rsquo;t include names or case details.</p>
        {err && <p className="error" role="alert">{err}</p>}
        {!res && (
          <div className="row">
            {SUGGESTIONS.map((s) => <IonButton key={s} size="small" fill="outline" onClick={() => ask(undefined, s)}>{s}</IonButton>)}
          </div>
        )}
      </form>

      {res && <ResultView r={res} onArticle={(slug) => history.push(`/client/resources/${slug}`)} onEntry={(id) => history.push(`/client/answers/${id}`)} clear={() => { setRes(null); setQ(""); }} />}

      <Section title="Tools" note="Work through your own numbers. Nothing you enter is saved or sent.">
        <div className="rows">
          {TOOLS.map((tool) => (
            <button key={tool.slug} type="button" className="r tap btnrow" style={{ gridTemplateColumns: "auto minmax(0, 1fr) auto" }} onClick={() => history.push(`/client/tools/${tool.slug}`)}>
              <IonIcon icon={calculatorOutline} aria-hidden style={{ color: "var(--b-accent)", fontSize: 22 }} />
              <span><span className="r-title">{tool.title}</span><span className="r-meta">{tool.summary}</span></span>
              <IonIcon icon={chevronForwardOutline} aria-hidden style={{ color: "var(--b-muted)" }} />
            </button>
          ))}
        </div>
      </Section>

      <Section title="Articles" note="Short guides tied to questions people actually ask.">
        {!data ? <Loading error={error} /> : (
          <div className="stack-lg">
            {STAGES.map(([k, label]) => {
              const list = data.articles.filter((a) => a.stage === k);
              if (!list.length) return null;
              return (
                <div key={k} className="stack" style={{ gap: 6 }}>
                  <h3 className="h3 muted">{label}</h3>
                  <div className="rows">{list.map((a) => <ArticleRow key={a.slug} a={a} onOpen={() => history.push(`/client/resources/${a.slug}`)} />)}</div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </Screen>
  );
}

function ArticleRow({ a, onOpen }: { a: Card; onOpen: () => void }) {
  return (
    <button type="button" className="r tap btnrow" onClick={onOpen}>
      <span><span className="r-title">{a.title}</span><span className="r-meta">{a.summary} · {a.readMinutes} min read</span></span>
      <IonIcon icon={chevronForwardOutline} aria-hidden style={{ color: "var(--b-muted)" }} />
    </button>
  );
}

function ResultView({ r, onArticle, onEntry, clear }: { r: Result; onArticle: (s: string) => void; onEntry: (id: string) => void; clear: () => void }) {
  if (r.kind === "safety") {
    return (
      <section className="danger-panel stack" aria-live="polite">
        <div className="row"><IonIcon icon={shieldCheckmarkOutline} aria-hidden style={{ color: "var(--b-accent)", fontSize: 22 }} /><h2 className="h2">Your safety comes first</h2></div>
        <p className="body">It sounds like something may be making you feel unsafe or pressured. You can talk with a Beacon mediator privately, and Beacon will not contact or notify the other person. Your question was not saved.</p>
        <ul className="body" style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong>In an emergency, call 911.</strong></li>
          <li>National Domestic Violence Hotline: <a href="tel:18007997233">1-800-799-7233</a>, or text START to 88788. Free, confidential, 24 hours.</li>
        </ul>
        <div className="row"><IonButton onClick={() => openExternal("/safety")}>See private options</IonButton><IonButton fill="clear" onClick={clear}>Clear</IonButton></div>
      </section>
    );
  }
  const heading: Record<string, [string, string]> = {
    legal: ["That question needs your own lawyer", "Beacon's mediators are neutral and can't advise either person on what to accept, your rights, or how a court might rule. An independent family law attorney can. The California Courts Self-Help Guide also lists free and low-cost legal help."],
    case: ["Your case team can answer that", "Questions about your own case go to the people working on it. Send them a message from the Messages tab; only the case team reads it."],
    none: ["We don't have a written answer for that yet", "Beacon's team sees which questions the library couldn't answer and writes new ones. Your case team can help in Messages."],
  };
  return (
    <section className="stack-lg" aria-live="polite">
      {r.answer ? (
        <article className="panel stack">
          <h2 className="h2">{r.answer.question}</h2>
          <p className="body" style={{ fontSize: 16 }}>{r.answer.answer}</p>
          <p className="small" style={{ margin: 0 }}>Source: <button type="button" className="linkish" onClick={() => openExternal(r.answer!.source.url)}>{r.answer.source.label} <IonIcon icon={openOutline} aria-hidden /></button></p>
          {r.answer.articleSlug && <div><IonButton size="small" fill="outline" onClick={() => onArticle(r.answer!.articleSlug!)}>Read the full article<IonIcon slot="end" icon={arrowForwardOutline} /></IonButton></div>}
          {r.answer.draft && <Draft />}
        </article>
      ) : (
        <article className="pool stack">
          <h2 className="h2">{heading[r.kind][0]}</h2>
          <p className="body">{heading[r.kind][1]}</p>
          {r.kind === "legal" && <div><IonButton size="small" fill="outline" onClick={() => openExternal("/legal-help")}>Find independent legal help</IonButton></div>}
        </article>
      )}
      {(r.related.length > 0 || r.articles.length > 0) && (
        <Section title="Related">
          <div className="rows">
            {r.articles.map((a) => <ArticleRow key={a.slug} a={a} onOpen={() => onArticle(a.slug)} />)}
            {r.related.map((e) => (
              <button key={e.id} type="button" className="r tap btnrow" onClick={() => onEntry(e.id)}>
                <span><span className="r-title">{e.question}</span><span className="r-meta">Navigator answer</span></span>
                <IonIcon icon={chevronForwardOutline} aria-hidden style={{ color: "var(--b-muted)" }} />
              </button>
            ))}
          </div>
        </Section>
      )}
      <div><IonButton fill="clear" size="small" onClick={clear}>Clear search</IonButton></div>
    </section>
  );
}

/** The library's light markdown: paragraphs, "## " headings and "- " lists. Text only. */
function Prose({ body }: { body: string }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      {body.trim().split(/\n\s*\n/).map((b, i) => {
        const lines = b.split("\n");
        const head = lines[0].startsWith("## ") ? lines.shift()!.slice(3) : null;
        return (
          <div key={i} className="stack" style={{ gap: 8 }}>
            {head && <h2 className="h2" style={{ marginTop: 10 }}>{head}</h2>}
            {lines.length > 0 && (lines.every((l) => l.startsWith("- "))
              ? <ul className="body" style={{ margin: 0, paddingLeft: 20, fontSize: 17, lineHeight: 1.65 }}>{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>
              : <p className="body" style={{ fontSize: 17, lineHeight: 1.7, maxWidth: "66ch" }}>{lines.join(" ")}</p>)}
          </div>
        );
      })}
    </div>
  );
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const history = useHistory();
  const { data, error } = useResource<Card & { body: string; officialLinks: { label: string; url: string }[]; related: { id: string; question: string }[] }>(`resources/${slug}`);
  return (
    <Screen title="Article" back="/client/resources">
      {!data ? <Loading error={error} /> : (
        <>
          <header className="stack">
            <h1 className="display">{data.title}</h1>
            <p className="lead">{data.summary}</p>
            <p className="small muted" style={{ margin: 0 }}>{data.readMinutes} min read · {data.review ? `Reviewed by ${data.review.by} on ${fmtDate(data.review.on)}` : "Draft, pending legal review"}</p>
          </header>
          <Prose body={data.body} />
          {data.officialLinks.length > 0 && (
            <Section title="Official resources">
              <div className="rows">
                {data.officialLinks.map((l) => (
                  <button key={l.url} type="button" className="r tap btnrow" onClick={() => openExternal(l.url)}>
                    <span><span className="r-title">{l.label}</span><span className="r-meta">{l.url.replace(/^https?:\/\//, "").split("/")[0]}</span></span>
                    <IonIcon icon={openOutline} aria-hidden style={{ color: "var(--b-muted)" }} />
                  </button>
                ))}
              </div>
            </Section>
          )}
          {data.related.length > 0 && (
            <Section title="Questions this answers">
              <div className="rows">
                {data.related.map((q) => (
                  <button key={q.id} type="button" className="r tap btnrow" onClick={() => history.push(`/client/answers/${q.id}`)}>
                    <span><span className="r-title">{q.question}</span></span>
                    <IonIcon icon={chevronForwardOutline} aria-hidden style={{ color: "var(--b-muted)" }} />
                  </button>
                ))}
              </div>
            </Section>
          )}
          {!data.review && <Draft />}
        </>
      )}
    </Screen>
  );
}

export function AnswerPage() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { data, error } = useResource<Entry>(`answers/${id}`);
  return (
    <Screen title="Answer" back="/client/resources">
      {!data ? <Loading error={error} /> : (
        <article className="stack-lg">
          <h1 className="display" style={{ fontSize: "clamp(26px, 5vw, 34px)" }}>{data.question}</h1>
          <p className="body" style={{ fontSize: 17, lineHeight: 1.7 }}>{data.answer}</p>
          <p className="small" style={{ margin: 0 }}>Source: <button type="button" className="linkish" onClick={() => openExternal(data.source.url)}>{data.source.label}</button></p>
          {data.articleSlug && <div><IonButton fill="outline" onClick={() => history.push(`/client/resources/${data.articleSlug}`)}>Read the full article</IonButton></div>}
          {data.draft && <Draft />}
        </article>
      )}
    </Screen>
  );
}


/** One Resource Center tool, full screen. It scrolls inside its own frame and keeps nothing. */
export function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const tool = TOOLS.find((x) => x.slug === slug);
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/client/resources" text="Back" /></IonButtons>
          <IonTitle>{tool?.title ?? "Tool"}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={!tool}>
        {tool ? (
          <iframe src={tool.src} title={tool.title} allow="clipboard-write" style={{ display: "block", width: "100%", height: "100%", border: 0, background: "var(--b-canvas)" }} />
        ) : (
          <div className="page"><p className="error" role="alert">That tool isn&rsquo;t available.</p></div>
        )}
      </IonContent>
    </IonPage>
  );
}
