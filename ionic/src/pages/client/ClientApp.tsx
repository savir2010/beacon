import { createContext, useContext, useEffect, useState, type ComponentType } from "react";
import { Redirect, Route, useHistory } from "react-router-dom";
import { IonButton, IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from "@ionic/react";
import { chatbubblesOutline, checkmarkCircleOutline, chevronForwardOutline, documentsOutline, homeOutline, libraryOutline, openOutline, personCircleOutline, shieldCheckmarkOutline } from "ionicons/icons";
import { api, openExternal } from "../../api";
import { SiteLink } from "../../components/SiteLink";
import { AnswerPage, ArticlePage, ResourcesPage } from "./Resources";
import { useResource } from "../../hooks";
import { useSession } from "../../session";
import { fmtDate, TOPIC_LABEL } from "../../format";
import { Loading, Note, Screen, Section } from "../../components/ui";
import { ClosedBanner, DocumentsView, HomeView, MessagesView } from "./views";
import type { ClientHome, Workspace } from "./types";

const CaseCtx = createContext<{ caseId: string; home: ClientHome; choose: (id: string) => void }>(null!);
const useCase = () => useContext(CaseCtx);
const PICK = "beacon.case";

/** The client interface: a waiting room before a case opens, then the case workspace in four tabs. */
export default function ClientApp() {
  const [home, setHome] = useState<ClientHome | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(() => { try { return localStorage.getItem(PICK); } catch { return null; } });
  useEffect(() => { api.get<ClientHome>("client/home").then(setHome).catch((e) => setErr(e.message)); }, []);
  if (!home) return <IonPage><Loading error={err} /></IonPage>;
  const hasCase = home.cases.length > 0;
  const id = hasCase ? (home.cases.some((c) => c.id === caseId) ? caseId! : home.cases[0].id) : "";
  const choose = (x: string) => { try { localStorage.setItem(PICK, x); } catch { /* ignore */ } setCaseId(x); };
  // Before a case opens: Home (where the request stands), Resources and Account.
  const routes: [string, ComponentType][] = [
    ["home", hasCase ? HomeTab : () => <Waiting home={home} />],
    ...(hasCase ? ([["documents", DocumentsTab], ["messages", MessagesTab]] as [string, ComponentType][]) : []),
    ["resources", ResourcesPage], ["resources/:slug", ArticlePage], ["answers/:id", AnswerPage], ["account", AccountTab],
  ];
  const tabs: [string, string, string][] = [
    ["home", "Home", homeOutline],
    ...(hasCase ? ([["documents", "Documents", documentsOutline], ["messages", "Messages", chatbubblesOutline]] as [string, string, string][]) : []),
    ["resources", "Resources", libraryOutline], ["account", "Account", personCircleOutline],
  ];
  return (
    <CaseCtx.Provider value={{ caseId: id, home, choose }}>
      <IonTabs>
        <IonRouterOutlet>
          {routes.map(([path, C]) => <Route key={path} exact path={`/client/${path}`} component={C} />)}
          <Route exact path="/client"><Redirect to="/client/home" /></Route>
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
          {tabs.map(([k, label, icon]) => (
            <IonTabButton key={k} tab={k} href={`/client/${k}`}><IonIcon icon={icon} /><IonLabel>{label}</IonLabel></IonTabButton>
          ))}
        </IonTabBar>
      </IonTabs>
    </CaseCtx.Provider>
  );
}

function useWorkspace() {
  const { caseId } = useCase();
  return useResource<Workspace>(`cases/${caseId}/workspace`);
}

function HomeTab() {
  const { data, error, reload } = useWorkspace();
  return (
    <Screen title="Your case" onRefresh={reload} banner={data && <ClosedBanner w={data} />}>
      {data ? <HomeView w={data} /> : <Loading error={error} />}
    </Screen>
  );
}

function DocumentsTab() {
  const { data, error, reload } = useWorkspace();
  return (
    <Screen title="Documents" onRefresh={reload} banner={data && <ClosedBanner w={data} />}>
      {data ? <DocumentsView w={data} reload={reload} /> : <Loading error={error} />}
    </Screen>
  );
}

function MessagesTab() {
  const { data, error, reload } = useWorkspace();
  return (
    <Screen title="Messages" onRefresh={reload}>
      {data ? <MessagesView w={data} reload={reload} /> : <Loading error={error} />}
    </Screen>
  );
}

function AccountTab() {
  const { home, caseId, choose } = useCase();
  return (
    <Screen title="Account">
      <AccountBlock />
      {home.cases.length > 1 && (
        <Section title="Your cases">
          <div className="rows">
            {home.cases.map((c) => (
              <div key={c.id} className="r">
                <div><p className="r-title num">{c.reference}</p><p className="r-meta">{c.closed ? "Closed" : "Open"}</p></div>
                {c.id === caseId ? <span className="status on">Showing</span> : <IonButton size="small" fill="outline" onClick={() => choose(c.id)}>Show</IonButton>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}

function AccountBlock() {
  const { me, signOut } = useSession();
  return (
    <>
      <Section title={me?.name ?? ""} note={me?.email}>
        <p className="body muted">You sign in with this email address and a one-time code. Beacon emails never include case details; they only ask you to sign in.</p>
        <div><IonButton fill="outline" onClick={signOut}>Sign out</IonButton></div>
      </Section>
      <Note icon={shieldCheckmarkOutline}>
        <strong>Need help now?</strong> <SiteLink path="/safety">Private safety options</SiteLink>. A mediator contacts you only the way you choose, and no one else is told.
      </Note>
    </>
  );
}

const STEPS = [
  ["NEW", "Request received", "Beacon has your request and contact preferences."],
  ["SCREENING", "Private conversation with a mediator", "A mediator contacts you the way you asked and talks with you on your own."],
  ["CASE_OPENED", "Your case workspace opens", "If mediation is a good fit, your workspace appears here. No one else is contacted before then."],
] as const;

/** Before a case exists: where the consultation request stands and what happens next. */
function Waiting({ home }: { home: ClientHome }) {
  const history = useHistory();
  const c = home.consultation;
  const at = c ? STEPS.findIndex(([k]) => k === c.status) : -1;
  return (
    <Screen title="Beacon">
      <section className="stack">
        <h1 className="display">{c ? "We have your request" : "No case yet"}</h1>
        <p className="lead">
          {c
            ? `You asked for a consultation on ${fmtDate(c.createdAt)}. ${c.mediator ? `${c.mediator} is your mediator and will` : "A mediator will"} contact you by ${c.preferredContact === "EMAIL" ? "email" : c.preferredContact === "TEXT" ? "text message" : "phone"}${c.bestTime ? ` (${c.bestTime.toLowerCase()})` : ""}, usually within two business days.`
            : "When Beacon opens a case for you, it appears here. If you're expecting one, contact your mediator."}
        </p>
      </section>
      {c && (
        <Section title="What happens next">
          <ol className="path">
            {STEPS.map(([k, title, text], i) => (
              <li key={k} aria-current={i === at ? "step" : undefined}>
                <span className={`dot${i < at ? " done" : ""}${i === at ? " current" : ""}`}>{i < at && <IonIcon icon={checkmarkCircleOutline} aria-hidden />}</span>
                <div><p className="r-title" style={{ fontWeight: i === at ? 600 : 500 }}>{title}</p><p className="r-meta">{text}</p></div>
                <span />
              </li>
            ))}
          </ol>
          {c.topics.length > 0 && <p className="small muted" style={{ margin: 0 }}>Topics you chose: {c.topics.map((t) => TOPIC_LABEL[t] ?? t).join(", ")}.</p>}
        </Section>
      )}
      <Section title="Prepare while you wait">
        <div className="rows">
          {([
            ["Build a preparation checklist", "Four questions, then a checklist and questions for your mediator. Opens the Beacon website.", () => openExternal("/navigator/guided"), openOutline],
            ["What happens in the first session", "Read it in about four minutes.", () => history.push("/client/resources/what-happens-in-the-first-session"), chevronForwardOutline],
            ["Ask a question", "Plain answers from Beacon's written library, in Resources.", () => history.push("/client/resources"), chevronForwardOutline],
          ] as const).map(([t, d, go, icon]) => (
            <button key={t} type="button" className="r tap btnrow" onClick={go}>
              <span><span className="r-title">{t}</span><span className="r-meta">{d}</span></span>
              <IonIcon icon={icon} aria-hidden style={{ color: "var(--b-muted)" }} />
            </button>
          ))}
        </div>
      </Section>
    </Screen>
  );
}
