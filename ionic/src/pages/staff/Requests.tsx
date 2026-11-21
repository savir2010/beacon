import { useHistory } from "react-router-dom";
import { IonButton, IonIcon } from "@ionic/react";
import { shieldOutline } from "ionicons/icons";
import { api } from "../../api";
import { useAction, useResource } from "../../hooks";
import { useSession } from "../../session";
import { fmtDateTime, TOPIC_LABEL } from "../../format";
import { Loading, Screen, Section } from "../../components/ui";
import { useStaff } from "./StaffApp";
import type { Consultation, SafetyReq } from "./types";

const HOW: Record<string, string> = { EMAIL: "email", PHONE: "phone call", TEXT: "text message" };

/** Consultation requests become cases here. Mediators also see private safety requests. */
export default function Requests() {
  const { base, isAdmin } = useStaff();
  const { me } = useSession();
  const history = useHistory();
  const { run, busy } = useAction();
  const { data, error, reload } = useResource<{ consultations: Consultation[]; safety: SafetyReq[]; canSeeSafety: boolean; mediators: { id: string; name: string }[] }>("staff/requests");
  const update = async (kind: string, id: string, b: unknown) => { if (await run(() => api.post(`staff/requests/${kind}/${id}`, b))) await reload(); };
  return (
    <Screen title={isAdmin ? "Intake" : "Requests"} onRefresh={reload} wide>
      {!data ? <Loading error={error} /> : (
        <>
          {data.canSeeSafety && (
            <section className="danger-panel stack" aria-label="Private safety requests">
              <div className="row"><IonIcon icon={shieldOutline} aria-hidden style={{ color: "var(--b-danger)", fontSize: 20 }} /><h2 className="h2">Private safety requests</h2></div>
              <p className="small muted" style={{ margin: 0 }}>Visible to mediators only. Contact only by the method and times given. Never contact or notify anyone else.</p>
              {data.safety.length === 0 ? <p className="empty">None right now.</p> : (
                <div className="rows">
                  {data.safety.map((r) => (
                    <div key={r.id} className="r">
                      <div>
                        <p className="r-title">{HOW[r.contactMethod]}: {r.contactValue}</p>
                        <p className="r-meta">{r.safeTimes ? `Safe times: ${r.safeTimes} · ` : ""}{r.safeToLeaveMessage ? "OK to leave a message" : "No messages"} · {fmtDateTime(r.createdAt)}{r.status === "CONTACTED" ? " · contacted" : ""}</p>
                      </div>
                      <div className="r-actions">
                        {r.status === "NEW" && <IonButton size="small" fill="outline" disabled={busy} onClick={() => update("safety", r.id, { status: "CONTACTED" })}>Mark contacted</IonButton>}
                        <IonButton size="small" fill="clear" disabled={busy} onClick={() => update("safety", r.id, { status: "CLOSED" })}>Close</IonButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          <Section title="Consultation requests" note="Each person already has an account and can follow their request in the app. Screen privately, then open a case if mediation fits.">
            {data.consultations.length === 0 ? <p className="empty">No open requests.</p> : (
              <div className="rows">
                {data.consultations.map((r) => (
                  <div key={r.id} className="r">
                    <div>
                      <p className="r-title">{r.name} · <span className="muted" style={{ fontWeight: 400 }}>{r.email}</span></p>
                      <p className="r-meta">
                        Prefers {HOW[r.preferredContact]}{r.phone ? ` (${r.phone})` : ""}{r.bestTime ? `, ${r.bestTime.toLowerCase()}` : ""} · {r.safeToLeaveMessage ? "OK to leave a message" : "Don't leave a message"}
                        {r.topics.length ? ` · Topics: ${r.topics.map((t) => TOPIC_LABEL[t] ?? t).join(", ")}` : ""} · {fmtDateTime(r.createdAt)}
                      </p>
                      <p className="r-meta">{r.status === "SCREENING" ? `Screening with ${r.assignee?.name ?? "a mediator"}` : "New, not yet assigned"}</p>
                    </div>
                    <div className="r-actions">
                      {isAdmin ? (
                        <>
                          <label className="sr-only" htmlFor={`as-${r.id}`}>Assign {r.name} to a mediator</label>
                          <select id={`as-${r.id}`} className="input" style={{ minHeight: 36, width: "auto", fontSize: 14 }} value={r.assignee?.id ?? ""} disabled={busy}
                            onChange={(e) => update("consultation", r.id, { assigneeId: e.target.value })}>
                            <option value="">Assign a mediator</option>
                            {data.mediators.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </>
                      ) : r.assignee?.id !== me?.id && (
                        <IonButton size="small" fill="outline" disabled={busy} onClick={() => update("consultation", r.id, { assigneeId: me?.id })}>Take it</IonButton>
                      )}
                      <IonButton size="small" disabled={busy} onClick={() => history.push(`${base}/new-case?from=${r.id}`)}>Open a case</IonButton>
                      <IonButton size="small" fill="clear" disabled={busy} onClick={() => update("consultation", r.id, { status: "CLOSED" })}>Close</IonButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}
