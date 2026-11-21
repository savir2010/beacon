import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/public/PageShell";
import { NavigatorPanel } from "@/components/navigator/Navigator";
import { SafetyLink } from "@/components/SiteChrome";

export const metadata = { title: "Mediation Navigator" };

export default function NavigatorPage() {
  return (
    <PageShell
      title="Mediation Navigator"
      intro="Ask in your own words. Answers come only from Beacon's written answer library, with the source and a next step. Nothing is made up on the spot."
      aside={<SafetyLink />}
    >
      <div className="container-b grid gap-16 py-16 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <NavigatorPanel />
        </div>
        <aside className="lg:col-span-3 lg:col-start-10">
          <div className="border-t border-[var(--color-hairline-strong)] pt-5">
            <h2 className="text-[17px] font-semibold">Prefer a guided path?</h2>
            <p className="mt-2 text-[15px] text-[var(--color-muted)]">Four quick questions about your stage and topics. You get a checklist and questions to bring to a mediator. Nothing is saved.</p>
            <Link href="/navigator/guided" className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline">
              Start the guided path <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
          <div className="mt-10 border-t border-[var(--color-hairline-strong)] pt-5">
            <h2 className="text-[17px] font-semibold">Talk to a person</h2>
            <p className="mt-2 text-[15px] text-[var(--color-muted)]">A private consultation is with Beacon only. The other person isn&rsquo;t contacted.</p>
            <Link href="/consultation" className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline">
              Request a consultation <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
