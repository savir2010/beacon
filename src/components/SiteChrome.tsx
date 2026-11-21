import Link from "next/link";
import { Menu, ShieldCheck } from "lucide-react";
import { Wordmark } from "./brand";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={`${overlay ? "absolute inset-x-0 top-0 z-20" : "border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]"}`}>
      <div className="container-b flex h-[76px] items-center justify-between gap-4">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link href="/resources" className="btn btn-quiet btn-sm hidden sm:inline-flex">
            Resource Center
          </Link>
          <a href="/app" className="btn btn-quiet btn-sm">
            Sign in
          </a>
          <Link href="/consultation" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Request a consultation
          </Link>
          <details className="relative sm:hidden">
            <summary className="btn btn-outline btn-sm list-none [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <Menu size={17} strokeWidth={1.75} aria-hidden /> Menu
            </summary>
            <div className="absolute right-0 top-12 z-30 w-[240px] rounded-[var(--radius-card)] border border-[var(--color-hairline-strong)] bg-white p-2">
              {[["/navigator", "Mediation Navigator"], ["/resources", "Resource Center"], ["/navigator/guided", "Preparation checklist"], ["/safety", "Private safety options"]].map(([h, l]) => (
                <Link key={h} href={h} className="block rounded-lg px-3 py-2.5 text-[15px] hover:bg-[var(--color-raised-2)]">{l}</Link>
              ))}
              <Link href="/consultation" className="btn btn-primary mt-2 w-full">Request a consultation</Link>
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-hairline)] bg-[var(--color-raised)]">
      <div className="container-b grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Wordmark />
          <p className="mt-4 max-w-[40ch] text-[15px] text-[var(--color-muted)]">
            Beacon Mediation Services helps California families prepare for mediation and follow their case to resolution.
            The mediator guides; you make the decisions.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-[15px] md:col-span-4">
          <Link href="/navigator" className="hover:underline">Mediation Navigator</Link>
          <Link href="/resources" className="hover:underline">Resource Center</Link>
          <Link href="/navigator/guided" className="hover:underline">Preparation checklist</Link>
          <Link href="/legal-help" className="hover:underline">Independent legal help</Link>
          <Link href="/consultation" className="hover:underline">Request a consultation</Link>
          <a href="/app" className="hover:underline">Sign in</a>
        </nav>
        <div className="md:col-span-3">
          <Link href="/safety" className="inline-flex items-center gap-2 text-[15px] font-medium hover:underline">
            <ShieldCheck size={18} strokeWidth={1.5} aria-hidden />
            Private safety options
          </Link>
          <p className="mt-2 text-[13px] text-[var(--color-muted)]">In an emergency, call 911.</p>
        </div>
      </div>
      <div className="border-t border-[var(--color-hairline)]">
        <div className="container-b flex flex-col gap-2 py-6 text-[13px] text-[var(--color-muted)] sm:flex-row sm:justify-between">
          <p>Information on this site is general and is not legal advice. All content is draft, pending legal review.</p>
          <p>© 2026 Beacon Mediation Services</p>
        </div>
      </div>
    </footer>
  );
}

/** A quiet, always-available route to the private safety page. */
export function SafetyLink({ className = "" }: { className?: string }) {
  return (
    <Link href="/safety" className={`inline-flex items-center gap-2 text-[14px] font-medium text-[var(--color-ink)] underline-offset-4 hover:underline ${className}`}>
      <ShieldCheck size={16} strokeWidth={1.5} aria-hidden />
      Need help now? Private safety options
    </Link>
  );
}
