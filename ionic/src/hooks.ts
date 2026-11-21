import { useCallback, useEffect, useRef, useState } from "react";
import { useIonToast, useIonViewWillEnter } from "@ionic/react";
import { api, ApiError } from "./api";

/** Loads a resource, reloads it whenever the page comes back into view, and exposes reload(). */
export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const live = useRef(path);
  live.current = path;
  const reload = useCallback(async () => {
    if (!path) return;
    try {
      const d = await api.get<T>(path);
      if (live.current === path) { setData(d); setError(null); }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load this. Pull down to try again.");
    }
  }, [path]);
  useEffect(() => { setData(null); reload(); }, [reload]);
  useIonViewWillEnter(() => { reload(); }, [reload]);
  return { data, error, reload };
}

/** Runs an action, shows its message or error as a toast, and reports whether it worked. */
export function useAction() {
  const [toast] = useIonToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn: () => Promise<{ message?: string } | unknown>, fallback = "Saved.") => {
    setBusy(true);
    try {
      const r = (await fn()) as { message?: string } | undefined;
      toast({ message: r?.message ?? fallback, duration: 3200, position: "top" });
      return true;
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "That didn't work. Try again.", duration: 4500, position: "top", color: "danger" });
      return false;
    } finally {
      setBusy(false);
    }
  }, [toast]);
  return { run, busy };
}
