import type { ReactNode } from "react";
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonRefresher, IonRefresherContent, IonSpinner, IonTitle, IonToolbar,
} from "@ionic/react";
import { checkmark, checkmarkCircleOutline, ellipseOutline, mailOpenOutline, timeOutline } from "ionicons/icons";
import { fmtDateTime } from "../format";

const brand = (f: string) => `${import.meta.env.BASE_URL}brand/${f}`;

/** Beacon Mediation's emblem (lighthouse, compass and handshake) for small spots like the top bar. */
export function Mark({ size = 28 }: { size?: number }) {
  return <img src={brand("beacon-mark.png")} alt="" width={Math.round(size * 0.974)} height={size} style={{ display: "block", height: size, width: "auto" }} />;
}

/** The full Beacon Mediation logo, exactly as designed. */
export function Logo({ height = 120 }: { height?: number }) {
  return <img src={brand("beacon-logo.png")} alt="Beacon Mediation" width={Math.round(height * 0.793)} height={height} style={{ display: "block", height, width: "auto" }} />;
}

/** One screen: a header, pull to refresh, and a readable column. */
export function Screen({
  title, back, actions, onRefresh, children, wide, banner,
}: { title: ReactNode; back?: string; actions?: ReactNode; onRefresh?: () => Promise<void>; children: ReactNode; wide?: boolean; banner?: ReactNode }) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {back ? (
            <IonButtons slot="start"><IonBackButton defaultHref={back} text="Back" /></IonButtons>
          ) : (
            <div slot="start" style={{ paddingInlineStart: 14, display: "flex" }}><Mark size={30} /></div>
          )}
          <IonTitle>{title}</IonTitle>
          {actions && <IonButtons slot="end">{actions}</IonButtons>}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {onRefresh && (
          <IonRefresher slot="fixed" onIonRefresh={async (e) => { await onRefresh(); e.detail.complete(); }}>
            <IonRefresherContent />
          </IonRefresher>
        )}
        {banner}
        <div className={`page${wide ? " wide" : ""}`}>{children}</div>
      </IonContent>
    </IonPage>
  );
}

export function Loading({ error }: { error?: string | null }) {
  if (error) return <p className="error" role="alert">{error}</p>;
  return <div style={{ display: "grid", placeItems: "center", padding: 48 }}><IonSpinner name="crescent" aria-label="Loading" /></div>;
}

export function Section({ title, note, action, children, id }: { title: string; note?: ReactNode; action?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="stack" id={id} aria-label={title}>
      <div className="spread">
        <div><h2 className="h2">{title}</h2>{note && <p className="small muted" style={{ margin: "4px 0 0" }}>{note}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

const STATUS: Record<string, { icon: string; label: string }> = {
  REQUESTED: { icon: ellipseOutline, label: "Requested" },
  RECEIVED: { icon: mailOpenOutline, label: "Received" },
  UNDER_REVIEW: { icon: timeOutline, label: "Under review" },
  AVAILABLE: { icon: checkmarkCircleOutline, label: "Available" },
};
/** Status is always an icon plus a word. */
export function Status({ s }: { s: string }) {
  const x = STATUS[s] ?? STATUS.REQUESTED;
  return <span className={`status${s === "AVAILABLE" ? " on" : ""}`}><IonIcon icon={x.icon} aria-hidden />{x.label}</span>;
}
export const STATUS_OPTIONS = Object.entries(STATUS).map(([v, x]) => ({ value: v, label: x.label }));

export type Milestone = { id: string; title: string; description: string | null; kind: string; verified: boolean; status: string };

/** Circles are Beacon steps; diamonds are court events, labeled with whether the court record confirms them. */
export function Path({ items, actions }: { items: Milestone[]; actions?: (m: Milestone) => ReactNode }) {
  return (
    <ol className="path">
      {items.map((m) => {
        const court = m.kind === "COURT";
        const done = m.status === "DONE";
        return (
          <li key={m.id} aria-current={m.status === "CURRENT" ? "step" : undefined}>
            <span className={`dot${court ? " court" : ""}${done ? " done" : ""}${m.status === "CURRENT" ? " current" : ""}`}>
              {done && <IonIcon icon={checkmark} aria-hidden />}
            </span>
            <div>
              <p className="r-title" style={{ fontWeight: m.status === "CURRENT" ? 600 : 500, color: done ? "var(--b-muted)" : undefined }}>{m.title}</p>
              <p className="r-meta">
                {court ? `Court event · ${m.verified ? "verified against the court record" : "not verified; only the court can confirm this"}` : m.description}
              </p>
            </div>
            <div>{actions?.(m)}</div>
          </li>
        );
      })}
    </ol>
  );
}

export type Msg = { id: string; mine: boolean; author: string; body: string; at: string };
export function Thread({ messages, empty }: { messages: Msg[]; empty?: string }) {
  if (!messages.length) return <p className="empty">{empty ?? "No messages yet."}</p>;
  return (
    <div className="thread">
      {messages.map((m) => (
        <div key={m.id} className={`bubble ${m.mine ? "me" : "them"}`}>
          <p>{m.body}</p>
          <p className="meta">{m.mine ? "You" : m.author} · {fmtDateTime(m.at)}</p>
        </div>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor, optional }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor: string; optional?: boolean }) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>{label}{optional && <span className="muted" style={{ fontWeight: 400 }}> (optional)</span>}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

export function Note({ icon, children }: { icon: string; children: ReactNode }) {
  return <div className="note"><IonIcon icon={icon} aria-hidden /><div>{children}</div></div>;
}
