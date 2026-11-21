import { useState } from "react";
import { IonButton, IonIcon, IonPopover, IonContent, IonList, IonItem, IonLabel } from "@ionic/react";
import { calendarOutline, logoApple, logoGoogle, mailOutline } from "ionicons/icons";
import { absolute, openExternal } from "../api";

export type CalEvent = { title: string; start: string; end?: string; allDay?: boolean; location?: string; ics: string | null };

const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(d).replace(/-/g, "");
const DETAILS = "Details are in the Beacon app.";

function google(e: CalEvent) {
  const s = new Date(e.start);
  const dates = e.allDay ? `${ymd(s)}/${ymd(new Date(s.getTime() + 86400_000))}` : `${utc(s)}/${utc(new Date(e.end ?? e.start))}`;
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates, details: DETAILS, ...(e.location ? { location: e.location } : {}), ctz: "America/Los_Angeles" });
  return `https://calendar.google.com/calendar/render?${q}`;
}
function outlook(e: CalEvent) {
  const s = new Date(e.start);
  const q = new URLSearchParams({
    path: "/calendar/action/compose", rru: "addevent", subject: e.title, body: DETAILS,
    startdt: e.allDay ? s.toISOString().slice(0, 10) : s.toISOString(),
    enddt: e.allDay ? new Date(s.getTime() + 86400_000).toISOString().slice(0, 10) : new Date(e.end ?? e.start).toISOString(),
    ...(e.allDay ? { allday: "true" } : {}), ...(e.location ? { location: e.location } : {}),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${q}`;
}

/** Apple Calendar (.ics), Google Calendar and Outlook. Titles stay neutral for participants. */
export function AddToCalendar({ event, id, size = "small" }: { event: CalEvent; id: string; size?: "small" | "default" }) {
  const [anchor, setAnchor] = useState<Event | undefined>();
  const open = !!anchor;
  const setOpen = (v: boolean) => { if (!v) setAnchor(undefined); };
  const pick = (url: string) => { setOpen(false); openExternal(url); };
  return (
    <>
      <IonButton id={`cal-${id}`} size={size} fill="outline" onClick={(e) => setAnchor(e.nativeEvent)}>
        <IonIcon slot="start" icon={calendarOutline} />Add to calendar
      </IonButton>
      <IonPopover isOpen={open} event={anchor} onDidDismiss={() => setOpen(false)} side="bottom" alignment="start">
        <IonContent>
          <IonList lines="full" aria-label="Choose a calendar">
            {event.ics && (
              <IonItem button detail={false} onClick={() => pick(absolute(event.ics!))}>
                <IonIcon slot="start" icon={logoApple} aria-hidden /><IonLabel>Apple Calendar<p>iPhone, iPad, Mac (.ics)</p></IonLabel>
              </IonItem>
            )}
            <IonItem button detail={false} onClick={() => pick(google(event))}>
              <IonIcon slot="start" icon={logoGoogle} aria-hidden /><IonLabel>Google Calendar</IonLabel>
            </IonItem>
            <IonItem button detail={false} onClick={() => pick(outlook(event))}>
              <IonIcon slot="start" icon={mailOutline} aria-hidden /><IonLabel>Outlook</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonPopover>
    </>
  );
}
