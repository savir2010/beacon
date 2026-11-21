import { useRef, useState, type ReactNode } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { IonButton, IonIcon, IonLabel, IonSegment, IonSegmentButton, useIonAlert } from "@ionic/react";
import {
  addOutline, alertCircleOutline, checkmarkCircle, checkmarkOutline, closeOutline, documentTextOutline, downloadOutline, ellipseOutline,
  eyeOutline, sendOutline, trashOutline,
} from "ionicons/icons";
import { api } from "../../api";
import { useAction, useResource } from "../../hooks";
import { fmtDate, fmtDateTime, fmtDay, fmtRelative, fmtSize, fmtTime, firstName } from "../../format";
import { Field, Loading, Note, Path, Screen, Section, Status, STATUS_OPTIONS } from "../../components/ui";
import { useStaff } from "./StaffApp";
import { AddToCalendar } from "../../components/Calendar";
import type { StaffCase } from "./types";

const TABS = [["overview", "Overview"], ["documents", "Documents"], ["checklist", "Checklist"], ["sessions", "Sessions"], ["messages", "Messages"], ["people", "People"], ["settings", "Settings"]] as const;
type Tab = (typeof TABS)[number][0];
type Ctx = { c: StaffCase; act: (action: string, b: unknown) => Promise<boolean>; busy: boolean; reload: () => Promise<void> };

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { base } = useStaff();
  const location = useLocation();
  const history = useHistory();
  const initial = (new URLSearchParams(location.search).get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(TABS.some(([k]) => k === initial) ? initial : "overview");
  const { data: c, error, reload } = useResource<StaffCase>(`staff/cases/${id}`);
  const { run, busy } = useAction();
  const act = async (action: string, b: unknown) => {
    const ok = await run(() => api.post(`staff/cases/${id}/${action}`, b));
    if (ok) await reload();
    return ok;
  };
  const pick = (t: Tab) => { setTab(t); history.replace({ search: `?tab=${t}` }); };
  const waiting = c?.threads.filter((t) => t.awaitingReply).length ?? 0;

  return (
    <Screen title={c ? c.case.reference : "Case"} back={`${base}/cases`} onRefresh={reload} wide>
      {!c ? <Loading error={error} /> : (
        <>
          <header className="stack" style={{ gap: 8 }}>
            <div className="row">
              <span className="tag">{c.case.status === "OPEN" ? "Open" : "Closed"}</span>
              {c.case.safetyFlag && <span className="tag safety"><IonIcon icon={alertCircleOutline} aria-hidden />Safety flag</span>}
              <span className="small muted">Updated {fmtRelative(c.case.updatedAt)}</span>
            </div>
            <h1 className="display">{c.case.title}</h1>
            <p className="lead">{c.participants.filter((p) => p.active).map((p) => p.name).join(" and ") || "No participants yet"} · Mediator: {c.team.filter((t) => t.active && t.role === "MEDIATOR").map((t) => t.name).join(", ") || "none"}</p>
          </header>
          <div style={{ overflowX: "auto", marginInline: -4, paddingInline: 4 }}>
            <IonSegment value={tab} scrollable onIonChange={(e) => pick(e.detail.value as Tab)}>
              {TABS.map(([k, l]) => (
                <IonSegmentButton key={k} value={k}><IonLabel>{l}{k === "messages" && waiting ? ` (${waiting})` : ""}</IonLabel></IonSegmentButton>
              ))}
            </IonSegment>
          </div>
          {tab === "overview" && <Overview c={c} act={act} busy={busy} reload={reload} />}
          {tab === "documents" && <Documents c={c} act={act} busy={busy} reload={reload} />}
          {tab === "checklist" && <Checklist c={c} act={act} busy={busy} reload={reload} />}
          {tab === "sessions" && <Sessions c={c} act={act} busy={busy} reload={reload} />}
          {tab === "messages" && <Messages c={c} act={act} busy={busy} reload={reload} />}
          {tab === "people" && <People c={c} act={act} busy={busy} reload={reload} />}
          {tab === "settings" && <Settings c={c} act={act} busy={busy} reload={reload} />}
        </>
      )}
    </Screen>
  );
}

function Toggle({ label, children, open, setOpen }: { label: string; children: ReactNode; open: boolean; setOpen: (v: boolean) => void }) {
  return open ? (
    <div className="panel stack-lg">
      <div className="spread"><h3 className="h3">{label}</h3><IonButton fill="clear" size="small" onClick={() => setOpen(false)} aria-label="Close"><IonIcon icon={closeOutline} /></IonButton></div>
      {children}
    </div>
  ) : (
    <div><IonButton fill="outline" onClick={() => setOpen(true)}><IonIcon slot="start" icon={addOutline} />{label}</IonButton></div>
  );
}

const activeParticipants = (c: StaffCase) => c.participants.filter((p) => p.active);

// Overview ------------------------------------------------------------------------------------

function Overview({ c, act, busy }: Ctx) {
  const [na, setNa] = useState(c.case.nextAction ?? "");
  const [owner, setOwner] = useState(c.case.nextActionOwner ?? "");
  const [update, setUpdate] = useState("");
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [msOpen, setMsOpen] = useState(false);
  const [ms, setMs] = useState({ title: "", description: "", kind: "BEACON" });
  const done = c.setup.filter((s) => s.done).length;
  const names = activeParticipants(c).map((p) => p.name).join(" and ");
  return (
    <div className="split">
      <div className="stack-lg" style={{ gap: 36 }}>
        <Section title="Setup" note={`${done} of ${c.setup.length} done. Each step is something participants will notice.`}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="rows">
            {c.setup.map((s) => (
              <li key={s.key} className="r" style={{ gridTemplateColumns: "22px 1fr" }}>
                <IonIcon icon={s.done ? checkmarkCircle : ellipseOutline} aria-hidden style={{ color: s.done ? "var(--b-ink)" : "var(--b-hair-strong)", fontSize: 20 }} />
                <span className="body" style={{ color: s.done ? "var(--b-muted)" : undefined }}>{s.label}<span className="sr-only">{s.done ? " (done)" : " (to do)"}</span></span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Next action" note="Every participant sees this at the top of their workspace.">
          <form className="stack" onSubmit={(e) => { e.preventDefault(); act("nextAction", { nextAction: na, nextActionOwner: owner }); }}>
            <Field label="Next action" htmlFor="na"><input id="na" className="input" value={na} onChange={(e) => setNa(e.target.value)} maxLength={200} /></Field>
            <Field label="Owner" htmlFor="owner" hint="For example: Each parent, Jordan, or Beacon case team"><input id="owner" className="input" value={owner} onChange={(e) => setOwner(e.target.value)} maxLength={80} /></Field>
            <div><IonButton type="submit" fill="outline" disabled={busy}>Save next action</IonButton></div>
          </form>
        </Section>

        <Section title="Joint update" note="A short note shown to every participant. Everyone is notified together with a neutral sign-in email.">
          <textarea id="ju" aria-label="Joint update" className="input" maxLength={600} value={update} onChange={(e) => { setUpdate(e.target.value); setConfirmUpdate(false); }}
            placeholder="For example: Session 3 is scheduled. Your joint checklist has been updated." />
          {!confirmUpdate ? (
            <div><IonButton fill="outline" disabled={!update.trim()} onClick={() => setConfirmUpdate(true)}>Release update…</IonButton></div>
          ) : (
            <div className="confirm">
              <p style={{ margin: 0 }}><IonIcon icon={eyeOutline} aria-hidden /> <strong>Visible to:</strong> {names || "no participants yet"}. Each gets a neutral sign-in notice at the same time{c.case.safetyFlag ? " (none while the safety flag is on)" : ""}.</p>
              <div className="row">
                <IonButton size="small" disabled={busy} onClick={async () => { if (await act("jointUpdate", { body: update })) { setUpdate(""); setConfirmUpdate(false); } }}>Confirm release</IonButton>
                <IonButton size="small" fill="clear" onClick={() => setConfirmUpdate(false)}>Back</IonButton>
              </div>
            </div>
          )}
          {c.updates.length > 0 && (
            <div className="rows">
              {c.updates.slice(0, 3).map((u) => <div key={u.id} className="r" style={{ gridTemplateColumns: "1fr" }}><p className="body" style={{ margin: 0 }}><span className="muted num">{fmtDate(u.releasedAt)}:</span> {u.body}</p></div>)}
            </div>
          )}
        </Section>
      </div>

      <div className="stack-lg" style={{ gap: 36 }}>
        <Section title="Milestones" note="Participants see Beacon steps and court events labeled separately.">
          <Path items={c.milestones} actions={(m) => m.kind === "COURT" ? (
            <IonButton size="small" fill="outline" disabled={busy} onClick={() => act("milestoneVerify", { milestoneId: m.id, verified: !m.verified })}>{m.verified ? "Unverify" : "Mark verified"}</IonButton>
          ) : m.status !== "CURRENT" ? (
            <IonButton size="small" fill="clear" disabled={busy} onClick={() => act("milestoneCurrent", { milestoneId: m.id })}>Make current</IonButton>
          ) : <span className="status on">Current</span>} />
          <Toggle label="Add a milestone" open={msOpen} setOpen={setMsOpen}>
            <form className="stack" onSubmit={async (e) => { e.preventDefault(); if (await act("milestoneAdd", ms)) { setMs({ title: "", description: "", kind: "BEACON" }); setMsOpen(false); } }}>
              <Field label="Title" htmlFor="ms-t"><input id="ms-t" className="input" value={ms.title} onChange={(e) => setMs({ ...ms, title: e.target.value })} /></Field>
              <Field label="One line participants will read" htmlFor="ms-d" optional><input id="ms-d" className="input" value={ms.description} onChange={(e) => setMs({ ...ms, description: e.target.value })} /></Field>
              <Field label="Kind" htmlFor="ms-k"><select id="ms-k" className="input" value={ms.kind} onChange={(e) => setMs({ ...ms, kind: e.target.value })}><option value="BEACON">Beacon step</option><option value="COURT">Court event (needs verification)</option></select></Field>
              <div><IonButton type="submit" disabled={busy}>Add</IonButton></div>
            </form>
          </Toggle>
        </Section>
        <Section title="Activity" note="Releases, access changes and updates on this case.">
          <div className="rows">
            {c.activity.slice(0, 10).map((a) => (
              <div key={a.id} className="r" style={{ gridTemplateColumns: "1fr" }}>
                <div><p className="body" style={{ margin: 0 }}>{a.detail}</p><p className="r-meta num">{a.actor} · {fmtDateTime(a.at)}</p></div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// Documents -----------------------------------------------------------------------------------

function Audience({ c, visibility, setVisibility, recipients, setRecipients, allowStaff }: {
  c: StaffCase; visibility: string; setVisibility: (v: string) => void; recipients: string[]; setRecipients: (r: string[]) => void; allowStaff: boolean;
}) {
  const ps = activeParticipants(c);
  const opts = [["JOINT", "All participants", ps.map((p) => p.name).join(" and ")], ["RESTRICTED", "Specific participants", "Choose who receives it"], ...(allowStaff ? [["STAFF_ONLY", "Case team only", "Working material; never released"]] : [])];
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
      <legend className="field-label">Who can see it</legend>
      <div className={`choices ${allowStaff ? "three" : "two"}`}>
        {opts.map(([v, l, h]) => (
          <label key={v} className="choice">
            <input type="radio" name="aud" value={v} checked={visibility === v} onChange={() => setVisibility(v)} />
            <span><span className="r-title" style={{ display: "block" }}>{l}</span><span className="r-meta" style={{ display: "block" }}>{h}</span></span>
          </label>
        ))}
      </div>
      {visibility === "RESTRICTED" && (
        <div className="row" style={{ gap: 18 }}>
          {ps.map((p) => (
            <label key={p.userId} className="check">
              <input type="checkbox" checked={recipients.includes(p.userId)} onChange={(e) => setRecipients(e.target.checked ? [...recipients, p.userId] : recipients.filter((x) => x !== p.userId))} />{p.name}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

const audienceText = (c: StaffCase, visibility: string, recipients: string[]) => {
  if (visibility === "STAFF_ONLY") return "The case team only. Participants will not see it.";
  const ps = activeParticipants(c).filter((p) => visibility === "JOINT" || recipients.includes(p.userId));
  return ps.length ? `${ps.map((p) => p.name).join(" and ")}, and the case team.` : "No one selected yet.";
};

function Documents({ c, act, busy, reload }: Ctx) {
  const { run } = useAction();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState("JOINT");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [item, setItem] = useState("");
  const [confirm, setConfirm] = useState<null | "release" | "draft">(null);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [rVis, setRVis] = useState("JOINT");
  const [rRec, setRRec] = useState<string[]>([]);
  const [rConfirm, setRConfirm] = useState(false);
  const [grid, setGrid] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const valid = !!file && (visibility !== "RESTRICTED" || recipients.length > 0);
  const ps = activeParticipants(c);

  async function upload(mode: "release" | "draft") {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("file", file!);
    fd.append("visibility", visibility);
    recipients.forEach((r) => fd.append("recipients", r));
    fd.append("mode", mode);
    if (item) fd.append("checklistItemId", item);
    if (await run(() => api.post(`staff/cases/${c.case.id}/documents`, fd))) {
      setTitle(""); setFile(null); setVisibility("JOINT"); setRecipients([]); setItem(""); setConfirm(null); setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
      await reload();
    }
  }

  return (
    <div className="stack-lg" style={{ gap: 32 }}>
      <Section title="Documents" note="Shared, restricted and team-only material stay separate. Nothing reaches a participant until you release it."
        action={<IonButton fill="clear" size="small" onClick={() => setGrid(!grid)}><IonIcon slot="start" icon={eyeOutline} />{grid ? "List view" : "Who can see what"}</IonButton>}>
        {grid ? (
          <div className="matrix" role="region" aria-label="Who can see each document" tabIndex={0}>
            <table>
              <thead><tr><th>Document</th>{ps.map((p) => <th key={p.userId} className="c">{firstName(p.name)}</th>)}<th className="c">Team</th></tr></thead>
              <tbody>
                {c.documents.map((d) => (
                  <tr key={d.id}>
                    <td>{d.title}{d.state === "DRAFT" && <span className="muted"> (draft)</span>}</td>
                    {ps.map((p) => <td key={p.userId} className="c">{d.visibleTo.includes(p.userId) ? <IonIcon icon={checkmarkOutline} aria-label="Can see" /> : <span className="muted" aria-label="Can't see">·</span>}</td>)}
                    <td className="c"><IonIcon icon={checkmarkOutline} aria-label="Can see" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : c.documents.length === 0 ? <p className="empty">No documents yet.</p> : (
          <div className="rows">
            {c.documents.map((d) => (
              <div key={d.id} className="r">
                <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <IonIcon icon={documentTextOutline} aria-hidden style={{ color: "var(--b-muted)", flex: "none", marginTop: 2, fontSize: 18 }} />
                  <div>
                    <p className="r-title">{d.title}</p>
                    <p className="r-meta">
                      {d.state === "RELEASED" ? `Released · ${d.audience}` : d.state === "SUBMITTED" ? `Submitted by ${d.uploadedBy} · ${d.audience}` : d.visibility === "STAFF_ONLY" ? "Case team only" : "Draft · not released"}
                      {" · "}{fmtDate(d.date)} · {fmtSize(d.size)}
                    </p>
                    {releasing === d.id && (
                      <div className="stack" style={{ marginTop: 12 }}>
                        <Audience c={c} visibility={rVis} setVisibility={(v) => { setRVis(v); setRConfirm(false); }} recipients={rRec} setRecipients={(r) => { setRRec(r); setRConfirm(false); }} allowStaff={false} />
                        {!rConfirm ? (
                          <div className="row"><IonButton size="small" disabled={rVis === "RESTRICTED" && !rRec.length} onClick={() => setRConfirm(true)}>Release…</IonButton><IonButton size="small" fill="clear" onClick={() => setReleasing(null)}>Cancel</IonButton></div>
                        ) : (
                          <div className="confirm">
                            <p style={{ margin: 0 }}><strong>Release now. Visible to:</strong> {audienceText(c, rVis, rRec)} Each recipient gets a neutral sign-in notice at the same time.</p>
                            <div className="row">
                              <IonButton size="small" disabled={busy} onClick={async () => { if (await act("release", { documentId: d.id, visibility: rVis, recipients: rRec })) setReleasing(null); }}>Confirm release</IonButton>
                              <IonButton size="small" fill="clear" onClick={() => setRConfirm(false)}>Back</IonButton>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="r-actions">
                  {d.state === "DRAFT" && d.visibility !== "STAFF_ONLY" && releasing !== d.id && (
                    <IonButton size="small" fill="outline" onClick={() => { setReleasing(d.id); setRVis(d.visibility === "RESTRICTED" ? "RESTRICTED" : "JOINT"); setRRec(d.recipients); setRConfirm(false); }}>Release…</IonButton>
                  )}
                  {d.state === "RELEASED" && <IonButton size="small" fill="clear" disabled={busy} onClick={() => act("withdraw", { documentId: d.id })}>Withdraw</IonButton>}
                  <IonButton size="small" fill="clear" aria-label={`Download ${d.title}`} onClick={() => run(() => api.download(d.id, d.title), "Downloaded.")}><IonIcon icon={downloadOutline} /></IonButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Toggle label="Upload a document" open={open} setOpen={setOpen}>
        <div className="stack-lg">
          <div className="split" style={{ gap: 16 }}>
            <Field label="Title" htmlFor="doc-title" hint="Shown to recipients"><input id="doc-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="File" htmlFor="doc-file" hint="PDF, image, Word or Excel, up to 12 MB">
              <input id="doc-file" ref={fileRef} type="file" className="input" style={{ paddingTop: 11 }} accept=".pdf,.jpg,.jpeg,.png,.heic,.docx,.xlsx" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setConfirm(null); }} />
            </Field>
          </div>
          <Audience c={c} visibility={visibility} setVisibility={(v) => { setVisibility(v); setConfirm(null); }} recipients={recipients} setRecipients={(r) => { setRecipients(r); setConfirm(null); }} allowStaff />
          <Field label="Fulfils a checklist item" htmlFor="doc-item" optional>
            <select id="doc-item" className="input" value={item} onChange={(e) => setItem(e.target.value)}>
              <option value="">None</option>
              {c.checklist.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          </Field>
          {!confirm ? (
            <div className="row">
              {visibility !== "STAFF_ONLY" && <IonButton disabled={!valid} onClick={() => setConfirm("release")}>Release to recipients</IonButton>}
              <IonButton fill="outline" disabled={!valid} onClick={() => setConfirm("draft")}>{visibility === "STAFF_ONLY" ? "Save for the team" : "Save as draft"}</IonButton>
            </div>
          ) : (
            <div className="confirm">
              <p style={{ margin: 0 }}>
                <strong>{confirm === "release" ? "Release now. Visible to:" : "Save without releasing. Later visible to:"}</strong> {audienceText(c, visibility, recipients)}
                {confirm === "release" ? " Each recipient gets a neutral sign-in notice at the same time." : " Nobody is notified."}
              </p>
              <div className="row"><IonButton size="small" disabled={busy} onClick={() => upload(confirm)}>Confirm</IonButton><IonButton size="small" fill="clear" onClick={() => setConfirm(null)}>Back</IonButton></div>
            </div>
          )}
        </div>
      </Toggle>
    </div>
  );
}

// Checklist -----------------------------------------------------------------------------------

function Checklist({ c, act, busy }: Ctx) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", description: "", assigneeId: "", dueDate: "" });
  return (
    <div className="stack-lg" style={{ gap: 32 }}>
      <Section title="Checklist" note="Joint items show to every participant. Assigned items show only to that person.">
        {c.checklist.length === 0 ? <p className="empty">Nothing requested yet.</p> : (
          <div className="rows">
            {c.checklist.map((it) => (
              <div key={it.id} className="r">
                <div>
                  <p className="r-title">{it.title}</p>
                  <p className="r-meta">{it.assignee ? it.assignee.name : "Joint"}{it.dueDate ? ` · Due ${fmtDate(it.dueDate)}` : ""}{it.overdue ? " · overdue" : ""}{it.description ? ` · ${it.description}` : ""}</p>
                </div>
                <div className="r-actions">
                  <Status s={it.status} />
                  <label className="sr-only" htmlFor={`st-${it.id}`}>Change status of {it.title}</label>
                  <select id={`st-${it.id}`} className="input" style={{ minHeight: 36, width: "auto", fontSize: 14 }} value={it.status} disabled={busy}
                    onChange={(e) => act("checklistStatus", { itemId: it.id, status: e.target.value })}>
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Toggle label="Request something" open={open} setOpen={setOpen}>
        <form className="stack" onSubmit={async (e) => { e.preventDefault(); if (await act("checklistAdd", f)) { setF({ title: "", description: "", assigneeId: "", dueDate: "" }); setOpen(false); } }}>
          <Field label="Request" htmlFor="ci-t"><input id="ci-t" className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="For example, Recent pay stubs (3 months)" /></Field>
          <Field label="Note" htmlFor="ci-d" optional><input id="ci-d" className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <div className="split" style={{ gap: 16 }}>
            <Field label="Assigned to" htmlFor="ci-a">
              <select id="ci-a" className="input" value={f.assigneeId} onChange={(e) => setF({ ...f, assigneeId: e.target.value })}>
                <option value="">Joint (all participants)</option>
                {activeParticipants(c).map((p) => <option key={p.userId} value={p.userId}>{p.name} only</option>)}
              </select>
            </Field>
            <Field label="Due" htmlFor="ci-due" optional><input id="ci-due" type="date" className="input" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
          </div>
          <div><IonButton type="submit" disabled={busy}>Add to checklist</IonButton></div>
        </form>
      </Toggle>
    </div>
  );
}

// Sessions ------------------------------------------------------------------------------------

function Sessions({ c, act, busy }: Ctx) {
  const [open, setOpen] = useState(false);
  const blank = { title: "", date: "", time: "", duration: "90", location: "", prep: "" };
  const [f, setF] = useState(blank);
  const upcoming = c.sessions.filter((s) => !s.past);
  const past = c.sessions.filter((s) => s.past);
  const list = (xs: StaffCase["sessions"]) => (
    <div className="rows">
      {xs.map((s) => (
        <div key={s.id} className="r">
          <div>
            <p className="r-title">{s.title}</p>
            <p className="r-meta">{fmtDay(s.startsAt)}, {fmtTime(s.startsAt)} · {s.durationMin} min · {s.location}</p>
            {s.prep && <p className="r-meta">To prepare: {s.prep}</p>}
          </div>
          <div className="r-actions">
          {!s.past && <AddToCalendar id={s.id} event={{ title: `${c.case.reference}: ${s.title}`, start: s.startsAt, end: new Date(new Date(s.startsAt).getTime() + s.durationMin * 60_000).toISOString(), location: s.location, ics: s.ics }} />}
          <IonButton size="small" fill="clear" color="medium" aria-label={`Remove ${s.title}`} disabled={busy} onClick={() => act("sessionDelete", { sessionId: s.id })}><IonIcon icon={trashOutline} /></IonButton>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="stack-lg" style={{ gap: 32 }}>
      <Section title="Upcoming sessions" note="All times are California time.">{upcoming.length ? list(upcoming) : <p className="empty">No sessions scheduled.</p>}</Section>
      <Toggle label="Schedule a session" open={open} setOpen={setOpen}>
        <form className="stack" onSubmit={async (e) => { e.preventDefault(); if (await act("sessionAdd", f)) { setF(blank); setOpen(false); } }}>
          <Field label="Title" htmlFor="s-t"><input id="s-t" className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Session 3: finances" /></Field>
          <div className="split" style={{ gap: 16 }}>
            <Field label="Date" htmlFor="s-d"><input id="s-d" type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="Time (Pacific)" htmlFor="s-tm"><input id="s-tm" type="time" className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
          </div>
          <div className="split" style={{ gap: 16 }}>
            <Field label="Location" htmlFor="s-l"><input id="s-l" className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Video, or the office address" /></Field>
            <Field label="Minutes" htmlFor="s-m"><input id="s-m" type="number" min={15} step={15} className="input" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></Field>
          </div>
          <Field label="To prepare" htmlFor="s-p" optional><input id="s-p" className="input" value={f.prep} onChange={(e) => setF({ ...f, prep: e.target.value })} /></Field>
          <div><IonButton type="submit" disabled={busy}>Add session</IonButton></div>
        </form>
      </Toggle>
      {past.length > 0 && <Section title="Past sessions">{list(past)}</Section>}
    </div>
  );
}

// Messages ------------------------------------------------------------------------------------

function Messages({ c, act, busy }: Ctx) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  return (
    <Section title="Messages" note="Each participant has a private thread with the case team. Participants never see each other's threads.">
      {c.threads.length === 0 ? <p className="empty">No participants yet.</p> : (
        <div className="split" style={{ alignItems: "start" }}>
          {c.threads.map((t) => (
            <div key={t.userId} className="panel stack">
              <div className="spread"><h3 className="h3">Thread with {t.name}</h3>{t.awaitingReply && <span className="tag">Waiting for reply</span>}</div>
              {t.messages.length === 0 ? <p className="small muted" style={{ margin: 0 }}>No messages yet.</p> : (
                <div className="thread">
                  {t.messages.map((m) => (
                    <div key={m.id} className={`bubble ${m.fromParticipant ? "them" : "me"}`}><p>{m.body}</p><p className="meta">{m.author} · {fmtDateTime(m.at)}</p></div>
                  ))}
                </div>
              )}
              <form className="row" style={{ flexWrap: "nowrap" }} onSubmit={async (e) => { e.preventDefault(); if (await act("reply", { threadUserId: t.userId, body: drafts[t.userId] ?? "" })) setDrafts({ ...drafts, [t.userId]: "" }); }}>
                <label className="sr-only" htmlFor={`r-${t.userId}`}>Reply to {t.name}</label>
                <input id={`r-${t.userId}`} className="input" value={drafts[t.userId] ?? ""} onChange={(e) => setDrafts({ ...drafts, [t.userId]: e.target.value })} placeholder={`Reply to ${firstName(t.name)} (only ${firstName(t.name)} and the team see it)`} />
                <IonButton type="submit" disabled={busy || !(drafts[t.userId] ?? "").trim()} aria-label={`Send reply to ${t.name}`}><IonIcon icon={sendOutline} /></IonButton>
              </form>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// People --------------------------------------------------------------------------------------

function People({ c, act, busy }: Ctx) {
  const { base, isAdmin } = useStaff();
  const history = useHistory();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", invite: false });
  const [mediator, setMediator] = useState("");
  return (
    <div className="stack-lg" style={{ gap: 32 }}>
      <Section title="Participants" note="A participant can't see the case until you invite them. Removing access takes effect immediately and deletes nothing.">
        <div className="rows">
          {c.participants.map((p) => (
            <div key={p.memberId} className="r">
              <div>
                <p className="r-title">{p.name}{!p.active && <span className="muted"> (access removed)</span>}</p>
                <p className="r-meta">{p.email} · {p.invitedAt ? `Invited ${fmtDate(p.invitedAt)}` : "Not invited yet"} · {p.lastSignInAt ? `Last signed in ${fmtRelative(p.lastSignInAt)}` : "Hasn't signed in"} · Email notices {p.notificationsEnabled ? "on" : "off"}</p>
              </div>
              <div className="r-actions">
                {p.active && <IonButton size="small" fill="clear" onClick={() => history.push(`${base}/cases/${c.case.id}/preview/${p.userId}`)}><IonIcon slot="start" icon={eyeOutline} />View as {firstName(p.name)}</IonButton>}
                {p.active && <IonButton size="small" fill="outline" disabled={busy} onClick={() => act("invite", { memberId: p.memberId })}>{p.invitedAt ? "Resend invite" : "Invite"}</IonButton>}
                <IonButton size="small" fill="clear" disabled={busy} onClick={() => act("notifications", { memberId: p.memberId, on: !p.notificationsEnabled })}>{p.notificationsEnabled ? "Turn off emails" : "Turn on emails"}</IonButton>
                <IonButton size="small" fill="outline" color={p.active ? "danger" : "primary"} disabled={busy} onClick={() => act("access", { memberId: p.memberId, active: !p.active })}>{p.active ? "Remove access" : "Restore access"}</IonButton>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Toggle label="Add a participant" open={open} setOpen={setOpen}>
        <form className="stack" onSubmit={async (e) => { e.preventDefault(); if (await act("participantAdd", f)) { setF({ name: "", email: "", invite: false }); setOpen(false); } }}>
          <div className="split" style={{ gap: 16 }}>
            <Field label="Name" htmlFor="ap-n"><input id="ap-n" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Email" htmlFor="ap-e"><input id="ap-e" type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          </div>
          <label className="check"><input type="checkbox" checked={f.invite} onChange={(e) => setF({ ...f, invite: e.target.checked })} />Invite them now</label>
          <p className="field-hint" style={{ marginTop: -4 }}>Leave this off until screening is complete. You can invite them from this tab later.</p>
          <div><IonButton type="submit" disabled={busy}>Add participant</IonButton></div>
        </form>
      </Toggle>
      <Section title="Case team">
        <div className="rows">
          {c.team.map((t) => (
            <div key={t.memberId} className="r">
              <div><p className="r-title">{t.name}</p><p className="r-meta">{t.role === "MEDIATOR" ? "Mediator" : t.role}{!t.active ? " · access removed" : ""}</p></div>
              {isAdmin && <IonButton size="small" fill="outline" color={t.active ? "danger" : "primary"} disabled={busy} onClick={() => act("access", { memberId: t.memberId, active: !t.active })}>{t.active ? "Remove" : "Restore"}</IonButton>}
            </div>
          ))}
        </div>
        {isAdmin && (
          <form className="row" style={{ flexWrap: "nowrap", alignItems: "flex-end" }} onSubmit={(e) => { e.preventDefault(); act("assignMediator", { userId: mediator }); }}>
            <div style={{ flex: 1 }}>
              <Field label="Give a mediator access" htmlFor="med">
                <select id="med" className="input" value={mediator} onChange={(e) => setMediator(e.target.value)}>
                  <option value="">Choose a mediator</option>
                  {c.mediators.filter((m) => !c.team.some((t) => t.userId === m.id && t.active)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
            </div>
            <IonButton type="submit" fill="outline" disabled={busy || !mediator}>Assign</IonButton>
          </form>
        )}
      </Section>
    </div>
  );
}

// Settings ------------------------------------------------------------------------------------

function Settings({ c, act, busy }: Ctx) {
  const [alert] = useIonAlert();
  const closed = c.case.status === "CLOSED";
  return (
    <div className="split" style={{ alignItems: "start" }}>
      <section className="danger-panel stack" aria-label="Safety flag">
        <h2 className="h2">Safety flag</h2>
        <p className="body muted">Turning it on switches off email notices for every participant. Contact participants only by the method agreed with them.</p>
        <div><IonButton fill="outline" color={c.case.safetyFlag ? "primary" : "danger"} disabled={busy} onClick={() => act("safety", { on: !c.case.safetyFlag })}>{c.case.safetyFlag ? "Turn off safety flag" : "Turn on safety flag"}</IonButton></div>
      </section>
      <section className="panel stack" aria-label="Close the case">
        <h2 className="h2">{closed ? "Reopen the case" : "Close the case"}</h2>
        <p className="body muted">{closed ? `Closed ${fmtDate(c.case.closedAt)}. Reopening restores messages and uploads.` : "Participants keep read-only access to released documents for 90 days. Messages and uploads stop."}</p>
        <div>
          <IonButton fill="outline" disabled={busy} onClick={() => closed ? act("status", { status: "OPEN" }) : alert({
            header: "Close this case?",
            message: "Participants are notified with a neutral sign-in email and can download their documents for 90 days.",
            buttons: [{ text: "Cancel", role: "cancel" }, { text: "Close case", role: "destructive", handler: () => { act("status", { status: "CLOSED" }); } }],
          })}>{closed ? "Reopen case" : "Close case"}</IonButton>
        </div>
      </section>
    </div>
  );
}

