import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-b py-28">
        <h1 className="display text-[44px]">We couldn&rsquo;t find that page</h1>
        <p className="mt-4 max-w-[52ch] text-[17px] text-[var(--color-muted)]">It may have moved, or you may not have access to it. If you&rsquo;re a Beacon client, sign in to see your case.</p>
        <div className="mt-8 flex gap-3"><Link href="/" className="btn btn-primary">Beacon home</Link><a href="/app" className="btn btn-outline">Sign in</a></div>
      </main>
      <SiteFooter />
    </>
  );
}
