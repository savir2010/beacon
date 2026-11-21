import { Redirect, Route } from "react-router-dom";
import { IonApp, IonPage, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { homeFor, SessionProvider, useSession } from "./session";
import { Loading } from "./components/ui";
import Login from "./pages/Login";
import ClientApp from "./pages/client/ClientApp";
import StaffApp from "./pages/staff/StaffApp";

// One look on every device: Beacon's calm iOS-style controls.
setupIonicReact({ mode: "ios" });

/** Each person lands in their own interface; the server enforces the same rule on every request. */
function Gate({ role, children }: { role: "PARTICIPANT" | "MEDIATOR" | "ADMIN"; children: React.ReactNode }) {
  const { me, ready } = useSession();
  if (!ready) return <IonPage><Loading /></IonPage>;
  if (!me) return <Redirect to="/login" />;
  if (me.role !== role) return <Redirect to={homeFor(me.role)} />;
  return <>{children}</>;
}

function Routes() {
  const { me, ready } = useSession();
  return (
    <IonRouterOutlet>
      <Route exact path="/login" render={() => (ready && me ? <Redirect to={homeFor(me.role)} /> : <Login />)} />
      <Route path="/client" render={() => <Gate role="PARTICIPANT"><ClientApp /></Gate>} />
      <Route path="/mediator" render={() => <Gate role="MEDIATOR"><StaffApp base="/mediator" isAdmin={false} /></Gate>} />
      <Route path="/admin" render={() => <Gate role="ADMIN"><StaffApp base="/admin" isAdmin /></Gate>} />
      <Route exact path="/" render={() => (!ready ? <IonPage><Loading /></IonPage> : <Redirect to={me ? homeFor(me.role) : "/login"} />)} />
    </IonRouterOutlet>
  );
}

export default function App() {
  return (
    <IonApp>
      <SessionProvider>
        <IonReactRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Routes />
        </IonReactRouter>
      </SessionProvider>
    </IonApp>
  );
}
