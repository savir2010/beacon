import { createContext, useContext, useEffect, useState } from "react";
import { Redirect, Route, useHistory, useLocation } from "react-router-dom";
import { IonButton, IonIcon, IonLabel, IonRouterOutlet, IonSearchbar, IonSegment, IonSegmentButton, IonTabBar, IonTabButton, IonTabs } from "@ionic/react";
import {
  addOutline, alertCircleOutline, chatbubbleEllipsesOutline, chevronForwardOutline, documentAttachOutline, ellipsisHorizontalCircleOutline,
  fileTrayFullOutline, folderOpenOutline, mailUnreadOutline, peopleOutline, personAddOutline, personCircleOutline, shieldOutline, sunnyOutline, timeOutline,
} from "ionicons/icons";
import { useResource } from "../../hooks";
import { useSession } from "../../session";
import { fmtDate, fmtDay, fmtRelative, fmtTime } from "../../format";
import { Loading, Screen, Section } from "../../components/ui";
import CaseDetail from "./CaseDetail";
import NewCase from "./NewCase";
import Requests from "./Requests";
import Preview from "./Preview";
import { Activity, LibraryArticle, Library, LibraryQA, More, Measures, Outbox, Team } from "../admin/AdminPages";
import type { Attention, CaseRow } from "./types";

const ADMIN_ROUTES = [
  ["team", Team], ["more", More], ["library", Library], ["library/articles/:id", LibraryArticle], ["library/qa/:id", LibraryQA],
  ["activity", Activity], ["outbox", Outbox], ["measures", Measures],
] as const;

const StaffCtx = createContext<{ base: string; isAdmin: boolean }>({ base: "/mediator", isAdmin: false });
export const useStaff = () => useContext(StaffCtx);

function useWide() {
  const q = "(min-width: 992px)";
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

/** The team interface. Mediators see their own cases; administrators see every case plus team and content tools. */
export default function StaffApp({ base, isAdmin }: { base: string; isAdmin: boolean }) {
  const wide = useWide();
  const tabs = isAdmin
    ? [["today", "Today", sunnyOutline], ["cases", "Cases", folderOpenOutline], ["requests", "Intake", fileTrayFullOutline], ["team", "Team", peopleOutline], ["more", "More", ellipsisHorizontalCircleOutline]]
    : [["today", "Today", sunnyOutline], ["cases", "Cases", folderOpenOutline], ["requests", "Requests", fileTrayFullOutline], ["account", "Account", personCircleOutline]];
  return (
    <StaffCtx.Provider value={{ base, isAdmin }}>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path={`${base}/today`} component={Today} />
          <Route exact path={`${base}/cases`} component={Cases} />
          <Route exact path={`${base}/new-case`} component={NewCase} />
          <Route exact path={`${base}/cases/:id`} component={CaseDetail} />
          <Route exact path={`${base}/cases/:id/preview/:userId`} component={Preview} />
          <Route exact path={`${base}/requests`} component={Requests} />
          <Route exact path={`${base}/account`} component={Account} />
          {/* Ionic's outlet needs real Route children, so admin routes are filtered rather than conditionally rendered. */}
          {(isAdmin ? ADMIN_ROUTES : []).map(([path, C]) => <Route key={path} exact path={`${base}/${path}`} component={C} />)}
          <Route exact path={base}><Redirect to={`${base}/today`} /></Route>
        </IonRouterOutlet>
        <IonTabBar slot={wide ? "top" : "bottom"}>
          {tabs.map(([k, label, icon]) => (
            <IonTabButton key={k} tab={k} href={`${base}/${k}`} layout={wide ? "icon-start" : "icon-top"}>
              <IonIcon icon={icon} /><IonLabel>{label}</IonLabel>
            </IonTabButton>
          ))}
        </IonTabBar>
      </IonTabs>
    </StaffCtx.Provider>
  );
}

const KIND: Record<string, { icon: string; alert?: boolean }> = {
  safety: { icon: shieldOutline, alert: true },
  message: { icon: chatbubbleEllipsesOutline },
  review: { icon: documentAttachOutline },
  overdue: { icon: timeOutline },
  consultation: { icon: mailUnreadOutline },
  invite: { icon: personAddOutline },
};

/** Everything that needs a person today, across the cases this person can open. */
function Today() {
  const { base, isAdmin } = useStaff();
  const { me } = useSession();
  const history = useHistory();
  const { data, error, reload } = useResource<{ items: Attention[]; cases: CaseRow[] }>("staff/today");
  const open = (a: Attention) => history.push(a.caseId ? `${base}/cases/${a.caseId}${a.tab ? `?tab=${a.tab}` : ""}` : `${base}/requests`);
  return (
    <Screen title="Today" onRefresh={reload} wide actions={<IonButton routerLink={`${base}/new-case`}><IonIcon slot="start" icon={addOutline} />New case</IonButton>}>
      <section className="stack">
        <h1 className="display">Good to see you, {me?.name.split(" ")[0]}.</h1>
        <p className="lead">{data ? (data.items.length ? `${data.items.length} thing${data.items.length > 1 ? "s" : ""} need${data.items.length > 1 ? "" : "s"} you${isAdmin ? " across the practice" : " on your cases"}.` : "Nothing needs you right now.") : " "}</p>
      </section>
      {!data ? <Loading error={error} /> : (
        <div className="split">
          <Section title="Needs attention" note="Most urgent first: safety, then families waiting on you.">
            {data.items.length === 0 ? <p className="empty">You&rsquo;re all caught up.</p> : (
              <div style={{ borderTop: "1px solid var(--b-hair-strong)" }}>
                {data.items.map((a, i) => {
                  const k = KIND[a.kind] ?? KIND.message;
                  return (
                    <button key={i} type="button" className="attn tap btnrow" onClick={() => open(a)}>
                      <span className={`icon-badge${k.alert ? " alert" : ""}`}><IonIcon icon={k.icon} aria-hidden /></span>
                      <span>
                        <span className="r-title">{a.title}</span>
                        <span className="r-meta">{a.reference ? <span className="num">{a.reference} · </span> : null}{a.detail}</span>
                      </span>
                      <span className="small muted num">{a.kind === "safety" ? "" : fmtRelative(a.at)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Section>
          <Section title={isAdmin ? "Open cases" : "Your cases"}>
            {data.cases.length === 0 ? <p className="empty">No open cases.</p> : (
              <div className="rows">
                {data.cases.map((c) => (
                  <button key={c.id} type="button" className="r tap btnrow" onClick={() => history.push(`${base}/cases/${c.id}`)}>
                    <span>
                      <span className="r-title num">{c.reference} · {c.title}</span>
                      <span className="r-meta">{c.milestone ?? "No milestone"}{c.nextSession ? ` · Next session ${fmtDay(c.nextSession)}, ${fmtTime(c.nextSession)}` : ""}</span>
                    </span>
                    {c.safetyFlag ? <span className="tag safety"><IonIcon icon={alertCircleOutline} aria-hidden />Safety</span> : <IonIcon icon={chevronForwardOutline} aria-hidden style={{ color: "var(--b-muted)" }} />}
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}
    </Screen>
  );
}

function Cases() {
  const { base, isAdmin } = useStaff();
  const history = useHistory();
  const [status, setStatus] = useState<"OPEN" | "CLOSED">("OPEN");
  const [q, setQ] = useState("");
  const { data, error, reload } = useResource<{ cases: CaseRow[] }>(`staff/cases?status=${status}`);
  const rows = (data?.cases ?? []).filter((c) => !q || `${c.reference} ${c.title} ${c.participants.join(" ")} ${c.mediators.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen title="Cases" onRefresh={reload} wide actions={<IonButton routerLink={`${base}/new-case`}><IonIcon slot="start" icon={addOutline} />New case</IonButton>}>
      <div className="stack">
        <IonSegment value={status} onIonChange={(e) => setStatus(e.detail.value as "OPEN" | "CLOSED")}>
          <IonSegmentButton value="OPEN"><IonLabel>Open</IonLabel></IonSegmentButton>
          <IonSegmentButton value="CLOSED"><IonLabel>Closed</IonLabel></IonSegmentButton>
        </IonSegment>
        <IonSearchbar value={q} onIonInput={(e) => setQ(e.detail.value ?? "")} placeholder="Search cases" />
      </div>
      {!data ? <Loading error={error} /> : rows.length === 0 ? <p className="empty">{q ? "No cases match that search." : status === "OPEN" ? "No open cases." : "No closed cases."}</p> : (
        <div className="rows">
          {rows.map((c) => (
            <button key={c.id} type="button" className="r tap btnrow" onClick={() => history.push(`${base}/cases/${c.id}`)}>
              <span>
                <span className="r-title num">{c.reference} · {c.title}</span>
                <span className="r-meta">
                  {c.participants.join(", ") || "No participants"}{isAdmin ? ` · Mediator: ${c.mediators.join(", ") || "none"}` : ""} · {c.milestone ?? "No milestone"} · Updated {fmtDate(c.updatedAt)}
                </span>
              </span>
              <span className="row">{c.safetyFlag && <span className="tag safety">Safety</span>}<IonIcon icon={chevronForwardOutline} aria-hidden style={{ color: "var(--b-muted)" }} /></span>
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}

export function Account() {
  const { me, signOut } = useSession();
  const { isAdmin } = useStaff();
  const location = useLocation();
  return (
    <Screen title="Account" back={location.pathname.endsWith("/account") && isAdmin ? "/admin/more" : undefined}>
      <Section title={me?.name ?? ""} note={`${me?.email} · ${isAdmin ? "Administrator" : "Mediator"}`}>
        <p className="body muted">You sign in with your email address and a one-time code. Team sessions last 12 hours.</p>
        <div><IonButton fill="outline" onClick={signOut}>Sign out</IonButton></div>
      </Section>
    </Screen>
  );
}
