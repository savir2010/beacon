import { useState } from "react";
import { useParams } from "react-router-dom";
import { IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import { useResource } from "../../hooks";
import { Loading, Screen } from "../../components/ui";
import { DocumentsView, HomeView, MessagesView, ClosedBanner } from "../client/views";
import type { Workspace } from "../client/types";
import { useStaff } from "./StaffApp";

/** Exactly what one participant sees, built with that participant's own permissions. Read-only. */
export default function Preview() {
  const { id, userId } = useParams<{ id: string; userId: string }>();
  const { base } = useStaff();
  const [tab, setTab] = useState("home");
  const { data, error, reload } = useResource<Workspace>(`cases/${id}/workspace?as=${userId}`);
  const who = data?.viewerName;
  return (
    <Screen title="Participant view" back={`${base}/cases/${id}?tab=people`} onRefresh={reload}
      banner={<div className="banner" role="status"><strong>Preview.</strong> This is exactly what {who ?? "this participant"} sees, using their own permissions. Nothing here can be changed. Opening it is recorded in the audit log.</div>}>
      {!data ? <Loading error={error} /> : (
        <>
          <ClosedBanner w={data} />
          <IonSegment value={tab} onIonChange={(e) => setTab(String(e.detail.value))}>
            <IonSegmentButton value="home"><IonLabel>Home</IonLabel></IonSegmentButton>
            <IonSegmentButton value="documents"><IonLabel>Documents</IonLabel></IonSegmentButton>
            <IonSegmentButton value="messages"><IonLabel>Messages</IonLabel></IonSegmentButton>
          </IonSegment>
          {tab === "home" && <HomeView w={data} readOnly />}
          {tab === "documents" && <DocumentsView w={data} readOnly />}
          {tab === "messages" && <MessagesView w={data} readOnly />}
        </>
      )}
    </Screen>
  );
}
