import { useEffect, useRef, useState, type FormEvent } from "react";
import { IonButton, IonContent, IonPage, IonSpinner } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { api, isNative, type Me } from "../api";
import { homeFor, useSession } from "../session";
import { Logo } from "../components/ui";
import { SiteLink } from "../components/SiteLink";

/** Passwordless sign-in: enter your email, then the 6-digit code Beacon emails you. */
export default function Login() {
  const { signedIn } = useSession();
  const history = useHistory();
  const params = new URLSearchParams(useLocation().search);
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (step === "code") setTimeout(() => codeRef.current?.focus(), 50); }, [step]);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter the email address Beacon has for you, like name@example.com.");
    setBusy(true);
    try {
      const r = await api.post<{ message: string }>("auth/code", { email: email.trim() });
      setInfo(r.message);
      setCode("");
      setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (code.replace(/\D/g, "").length !== 6) return setError("Enter all 6 digits from the email.");
    setBusy(true);
    try {
      const r = await api.post<{ token: string; user: Me }>("auth/verify", { email: email.trim(), code });
      signedIn(r.token, r.user);
      history.replace(homeFor(r.user.role));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <IonPage>
      <IonContent>
        <main className="signin">
          <div className="signin-card">
            <div style={{ display: "flex", justifyContent: "center", paddingBottom: 4 }}><Logo height={156} /></div>
            {step === "email" ? (
              <form onSubmit={sendCode} className="stack-lg" noValidate>
                <div className="stack" style={{ gap: 8 }}>
                  <h1 className="display" style={{ fontSize: 32 }}>Sign in</h1>
                  <p className="lead" style={{ fontSize: 16 }}>Use the email address Beacon has for you. We&rsquo;ll email you a 6-digit code. There&rsquo;s no password to remember.</p>
                </div>
                <div>
                  <label className="field-label" htmlFor="email">Email</label>
                  <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "err" : undefined} autoFocus={!isNative} />
                  {error && <p id="err" className="error" role="alert">{error}</p>}
                </div>
                <IonButton type="submit" expand="block" disabled={busy}>{busy ? <IonSpinner name="crescent" /> : "Email me a code"}</IonButton>
              </form>
            ) : (
              <form onSubmit={verify} className="stack-lg" noValidate>
                <div className="stack" style={{ gap: 8 }}>
                  <h1 className="display" style={{ fontSize: 32 }}>Check your email</h1>
                  <p className="lead" style={{ fontSize: 16 }}>{info}</p>
                </div>
                <div>
                  <label className="field-label" htmlFor="code">6-digit code</label>
                  <input id="code" ref={codeRef} className="input otp" inputMode="numeric" autoComplete="one-time-code" maxLength={7}
                    value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                    aria-invalid={!!error} aria-describedby={error ? "err" : undefined} />
                  {error && <p id="err" className="error" role="alert">{error}</p>}
                </div>
                <IonButton type="submit" expand="block" disabled={busy}>{busy ? <IonSpinner name="crescent" /> : "Sign in"}</IonButton>
                <div className="spread small">
                  <button type="button" className="linkish" onClick={() => { setStep("email"); setError(""); }}>Use a different email</button>
                  <button type="button" className="linkish" onClick={() => sendCode()} disabled={busy}>Send a new code</button>
                </div>
              </form>
            )}
            <p className="small muted" style={{ margin: 0, borderTop: "1px solid var(--b-hair)", paddingTop: 16 }}>
              New to Beacon? <SiteLink path="/consultation">Request a consultation</SiteLink> and we&rsquo;ll set up your account. <SiteLink path="/safety">Private safety options</SiteLink>
            </p>
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
}
