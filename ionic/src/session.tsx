import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, session, setUnauthorizedHandler, type Me } from "./api";

type Ctx = { me: Me | null; ready: boolean; signedIn: (token: string, me: Me) => void; signOut: () => Promise<void> };
const SessionCtx = createContext<Ctx>({ me: null, ready: false, signedIn: () => {}, signOut: async () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUnauthorizedHandler(() => setMe(null));
    if (!session.token) { setReady(true); return; }
    api.get<{ user: Me }>("me").then((r) => setMe(r.user)).catch(() => session.set(null)).finally(() => setReady(true));
  }, []);
  const signedIn = useCallback((token: string, u: Me) => { session.set(token); setMe(u); }, []);
  const signOut = useCallback(async () => {
    try { await api.post("auth/signout"); } catch { /* already signed out */ }
    session.set(null);
    setMe(null);
  }, []);
  return <SessionCtx.Provider value={{ me, ready, signedIn, signOut }}>{children}</SessionCtx.Provider>;
}
export const useSession = () => useContext(SessionCtx);

/** The home path for each role's interface. */
export const homeFor = (role?: string) => (role === "ADMIN" ? "/admin" : role === "MEDIATOR" ? "/mediator" : "/client");
