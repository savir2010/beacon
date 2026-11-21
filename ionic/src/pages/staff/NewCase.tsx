import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonButton, IonSpinner } from "@ionic/react";
import { api } from "../../api";
import { useAction } from "../../hooks";
import { useSession } from "../../session";
import { Field, Screen, Section } from "../../components/ui";
import { useStaff } from "./StaffApp";
import type { Consultation } from "./types";

type P = { name: string; email: string; invite: boolean };

/** Opens a case, optionally from a consultation request (the requester is invited automatically). */
export default function NewCase() {
  const { base, isAdmin } = useStaff();
  const { me } = useSession();
  const history = useHistory();
  const consultationId = new URLSearchParams(useLocation().search).get("from") ?? "";
  const { run, busy } = useAction();
  const [title, setTitle] = useState("");
  const [people, setPeople] = useState<P[]>([{ name: "", email: "", invite: true }, { name: "", email: "", invite: false }]);
  const [safety, setSafety] = useState(false);
  const [mediatorId, setMediatorId] = useState("");
  const [mediators, setMediators] = useState<{ id: string; name: string }[]>([]);
  const [from, setFrom] = useState<Consultation | null>(null);

  useEffect(() => {
    api.get<{ consultations: Consultation[]; mediators: { id: string; name: string }[] }>("staff/requests").then((r) => {
      setMediators(r.mediators);
      const c = r.consultations.find((x) => x.id === consultationId);
      if (c) {
        setFrom(c);
        setPeople([{ name: c.name, email: c.email, invite: true }, { name: "", email: "", invite: false }]);
        setTitle(`${c.name.split(" ").pop()} / (pending)`);
        if (c.assignee) setMediatorId(c.assignee.id);
      }
    }).catch(() => {});
  }, [consultationId]);

  const set = (i: number, k: keyof P, v: string | boolean) => setPeople(people.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let id = "";
    const ok = await run(async () => {
      const r = await api.post<{ id: string; reference: string }>("staff/cases", { title, participants: people, safety, mediatorId, consultationId: from?.id });
      id = r.id;
      return { message: `Case ${r.reference} opened.` };
    });
    if (ok) history.replace(`${base}/cases/${id}`);
  }

  return (
    <Screen title="New case" back={`${base}/cases`}>
      <form onSubmit={submit} className="stack-lg" style={{ gap: 32 }} noValidate>
        <section className="stack">
          <h1 className="display">Open a case</h1>
          <p className="lead">{from ? `From ${from.name}'s consultation request. ${from.name} already has an account and is invited when the case opens.` : "Add the people in mediation. Invite each one only when screening allows it."}</p>
        </section>
        <Field label="Internal label" htmlFor="title" hint="Only the team sees this. Participants see the case reference.">
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example, Alvarez / Brooks" />
        </Field>
        {people.map((p, i) => (
          <Section key={i} title={`Participant ${i + 1}`} note={i === 1 ? "Optional now. You can add them later from the People tab." : undefined}>
            <div className="split" style={{ gap: 16 }}>
              <Field label="Full name" htmlFor={`p${i}n`}><input id={`p${i}n`} className="input" value={p.name} onChange={(e) => set(i, "name", e.target.value)} readOnly={i === 0 && !!from} /></Field>
              <Field label="Email" htmlFor={`p${i}e`}><input id={`p${i}e`} type="email" className="input" value={p.email} onChange={(e) => set(i, "email", e.target.value)} readOnly={i === 0 && !!from} /></Field>
            </div>
            {!(i === 0 && from) && (
              <>
                <label className="check"><input type="checkbox" checked={p.invite} onChange={(e) => set(i, "invite", e.target.checked)} />Invite now</label>
                <p className="field-hint" style={{ marginTop: -4 }}>Leave this off until screening is complete. Uninvited people can&rsquo;t see the case, and nobody is told it exists.</p>
              </>
            )}
          </Section>
        ))}
        {isAdmin ? (
          <Field label="Mediator" htmlFor="mediator" hint="Only the assigned mediator and administrators can open the case.">
            <select id="mediator" className="input" value={mediatorId} onChange={(e) => setMediatorId(e.target.value)}>
              <option value="">Choose a mediator</option>
              {mediators.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
        ) : <p className="body muted">You ({me?.name}) will be the mediator on this case.</p>}
        <label className="check danger-panel" style={{ display: "flex" }}>
          <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} />
          <span><strong>Safety concern on this case</strong><span className="r-meta" style={{ display: "block" }}>Turns off every email notice to participants. Contact them only by the method agreed.</span></span>
        </label>
        <div><IonButton type="submit" size="large" disabled={busy}>{busy ? <IonSpinner name="crescent" /> : "Open case"}</IonButton></div>
      </form>
    </Screen>
  );
}
