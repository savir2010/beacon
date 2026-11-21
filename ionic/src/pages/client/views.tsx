import { useRef, useState } from "react";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { calendarOutline, cloudUploadOutline, documentTextOutline, downloadOutline, eyeOutline, locationOutline, megaphoneOutline } from "ionicons/icons";
import { api } from "../../api";
import { useAction } from "../../hooks";
import { fmtDate, fmtDateTime, fmtDay, fmtRelative, fmtSize, fmtTime } from "../../format";
import { Note, Path, Section, Status, Thread } from "../../components/ui";
import { AddToCalendar } from "../../components/Calendar";
import type { Workspace } from "./types";

// The participant's workspace, split into three views. Staff previews render the same views read-only.

export function ClosedBanner({ w }: { w: Workspace }) {
  if (!w.case.closed) return null;
  return (
    <div className="banner" role="status">
      <strong>This case is closed.</strong> Download your final documents; they stay available here until {fmtDate(w.case.accessUntil)}.
    </div>
  );
}

export function HomeView({ w, readOnly }: { w: Workspace; readOnly?: boolean }) {
  const next = w.sessions[0];
  const update = w.updates[0];
  return (
    <>
      <section className="stack" aria-label="Where your case is">
        <p className="small muted num" style={{ margin: 0 }}>Case {w.case.reference}</p>
        <h1 className="display">{w.current?.title ?? (w.case.closed ? "Case closed" : "Getting started")}</h1>
        <p className="lead">
          {w.current ? `Current milestone, step ${w.current.step} of ${w.current.of}.` : ""} {w.current?.description}
        </p>
        <p className="small muted" style={{ margin: 0 }}>
          Updated {fmtRelative(w.case.updatedAt)}{w.case.updatedBy ? ` by ${w.case.updatedBy}` : ""} · {fmtDateTime(w.case.updatedAt)}
        </p>
      </section>

      <section className="pool stack" aria-label="Next action">
        <h2 className="h2">{w.case.nextAction ?? "Nothing needed from you right now"}</h2>
        <p className="small muted" style={{ margin: 0 }}>Next action{w.case.nextActionOwner ? ` · Owner: ${w.case.nextActionOwner}` : ""}</p>
        {next && (
          <p className="row body" style={{ borderTop: "1px solid var(--b-hair)", paddingTop: 12, margin: 0, flexWrap: "nowrap", alignItems: "flex-start" }}>
            <IonIcon icon={calendarOutline} aria-hidden /> Next session {fmtDay(next.startsAt)}, {fmtTime(next.startsAt)}
          </p>
        )}
      </section>

      {update && (
        <div className="row body" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
          <IonIcon icon={megaphoneOutline} aria-hidden style={{ color: "var(--b-accent)", flex: "none", marginTop: 3, fontSize: 18 }} />
          <p style={{ margin: 0 }}><span className="muted">Update for everyone, {fmtDate(update.releasedAt)}:</span> {update.body}</p>
        </div>
      )}

      <div className="split">
        <Section title="Upcoming sessions" note={readOnly ? undefined : "Calendar entries just say \u201cBeacon appointment\u201d, in case others can see your calendar."}>
          {w.sessions.length === 0 ? <p className="empty">No sessions scheduled yet.</p> : (
            <div className="rows">
              {w.sessions.map((s) => (
                <div key={s.id} className="r" style={{ gridTemplateColumns: "1fr" }}>
                  <div>
                    <p className="r-title">{s.title}</p>
                    <p className="r-meta">{fmtDay(s.startsAt)}, {fmtTime(s.startsAt)} · {s.durationMin} minutes</p>
                    <p className="r-meta row" style={{ gap: 6 }}><IonIcon icon={locationOutline} aria-hidden />{s.location}</p>
                    {s.prep && <p className="r-meta">To prepare: {s.prep}</p>}
                    {!readOnly && !w.case.closed && (
                      <div style={{ marginTop: 10 }}>
                        <AddToCalendar id={s.id} event={{ title: "Beacon appointment", start: s.startsAt, end: new Date(new Date(s.startsAt).getTime() + s.durationMin * 60_000).toISOString(), location: s.location, ics: s.ics }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
        <Section title="Your path" note="Circles are Beacon steps. Diamonds are court events.">
          <Path items={w.milestones} />
        </Section>
      </div>

      <section className="stack small muted" aria-label="Your case team" style={{ borderTop: "1px solid var(--b-hair)", paddingTop: 16 }}>
        <p style={{ margin: 0 }}>Your case team: {w.team.map((t) => `${t.name} (${t.role})`).join(", ")}.</p>
        <p style={{ margin: 0 }}>The mediator is neutral and can&rsquo;t give legal advice. You can consult your own lawyer at any time.</p>
      </section>
    </>
  );
}

export function DocumentsView({ w, readOnly, reload }: { w: Workspace; readOnly?: boolean; reload?: () => Promise<void> }) {
  const { run } = useAction();
  const [uploading, setUploading] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const target = useRef<string | null>(null);

  async function onFile(f: File | undefined) {
    const itemId = target.current;
    if (!f || !itemId) return;
    setUploading(itemId);
    const fd = new FormData();
    fd.append("itemId", itemId);
    fd.append("file", f);
    const ok = await run(() => api.post(`cases/${w.case.id}/submissions`, fd));
    setUploading(null);
    if (file.current) file.current.value = "";
    if (ok) await reload?.();
  }

  return (
    <>
      <Section title="Checklist" note="What the case team has asked for, and where each item stands.">
        {w.checklist.length === 0 ? <p className="empty">Nothing requested yet. When the case team asks for something, it appears here with a due date.</p> : (
          <div className="rows">
            {w.checklist.map((it) => (
              <div key={it.id} className="r">
                <div>
                  <p className="r-title">{it.title}</p>
                  <p className="r-meta">{it.owner === "You" ? "Yours" : "Shared"}{it.dueDate ? ` · ${it.status === "REQUESTED" ? "Due" : "Dated"} ${fmtDate(it.dueDate)}` : ""}{it.description ? ` · ${it.description}` : ""}</p>
                </div>
                <div className="r-actions">
                  <Status s={it.status} />
                  {!readOnly && it.dueDate && it.status === "REQUESTED" && it.owner === "You" && (
                    <AddToCalendar id={it.id} event={{ title: "Beacon: something is due", start: it.dueDate, allDay: true, ics: it.ics }} />
                  )}
                  {it.canUpload && !readOnly && (
                    <IonButton size="small" disabled={uploading === it.id} onClick={() => { target.current = it.id; file.current?.click(); }}>
                      {uploading === it.id ? <IonSpinner name="crescent" /> : <><IonIcon slot="start" icon={cloudUploadOutline} />{it.status === "RECEIVED" ? "Upload again" : "Upload"}</>}
                    </IonButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!readOnly && w.checklist.some((c) => c.canUpload) && (
          <Note icon={eyeOutline}>Anything you upload is seen only by you and the case team. It isn&rsquo;t shared with anyone else unless the team tells you first.</Note>
        )}
        <input ref={file} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.heic,.docx,.xlsx" onChange={(e) => onFile(e.target.files?.[0])} />
      </Section>

      <Section title="Documents" note="Released to you by the case team, and what you've sent.">
        {w.documents.length === 0 ? <p className="empty">No documents yet. When the case team releases one to you, it appears here.</p> : (
          <div className="rows">
            {w.documents.map((d) => (
              <div key={d.id} className="r">
                <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <IonIcon icon={documentTextOutline} aria-hidden style={{ color: "var(--b-muted)", flex: "none", marginTop: 2, fontSize: 18 }} />
                  <div>
                    <p className="r-title">{d.title}</p>
                    <p className="r-meta">Seen by: {d.seenBy} · {fmtDate(d.date)} · {fmtSize(d.size)}</p>
                  </div>
                </div>
                <div className="r-actions">
                  <Status s={d.status} />
                  {!readOnly && (
                    <IonButton size="small" fill="outline" disabled={downloading === d.id} aria-label={`Download ${d.title}`}
                      onClick={async () => { setDownloading(d.id); await run(() => api.download(d.id, d.title), "Downloaded."); setDownloading(null); }}>
                      <IonIcon slot="start" icon={downloadOutline} />Download
                    </IonButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

export function MessagesView({ w, readOnly, reload }: { w: Workspace; readOnly?: boolean; reload?: () => Promise<void> }) {
  const { run, busy } = useAction();
  const [text, setText] = useState("");
  return (
    <Section title="Messages with your case team" note={`For logistics like scheduling and documents. ${w.privacyNote}`}>
      <Thread messages={w.messages} empty="No messages yet. Ask the team about scheduling or documents here." />
      {w.case.closed ? (
        <p className="empty">Messages closed with the case. Earlier messages stay here to read. To reach Beacon, call the office.</p>
      ) : !readOnly && (
        <form className="stack" onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => api.post(`cases/${w.case.id}/messages`, { body: text }), "Sent.")) { setText(""); await reload?.(); }
        }}>
          <Note icon={eyeOutline}><strong>Who can read this:</strong> {w.readers}</Note>
          <label className="field-label" htmlFor="msg" style={{ position: "absolute", left: -9999 }}>Message</label>
          <textarea id="msg" className="input" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="A logistics question, like scheduling or a document request" />
          <div className="spread">
            <p className="small muted" style={{ margin: 0 }}>For questions about your agreement, ask during a session or talk with your own lawyer.</p>
            <IonButton type="submit" disabled={busy || !text.trim()}>Send</IonButton>
          </div>
        </form>
      )}
    </Section>
  );
}
