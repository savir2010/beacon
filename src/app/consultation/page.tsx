import { PageShell } from "@/components/public/PageShell";
import { ConsultationForm } from "@/components/public/Forms";
import { SafetyLink } from "@/components/SiteChrome";

export const metadata = { title: "Request a consultation" };

export default async function Consultation({ searchParams }: { searchParams: Promise<{ topics?: string }> }) {
  const { topics } = await searchParams;
  return (
    <PageShell title="Request a private consultation" intro="Share only how to reach you. A consultation is with Beacon only: the other person isn't contacted or invited.">
      <div className="container-b grid gap-16 py-16 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ConsultationForm topics={topics?.replace(/[^A-Z,]/g, "")} />
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <h2 className="text-[17px] font-semibold">What happens next</h2>
          <ol className="mt-4 space-y-5 border-l border-[var(--color-hairline-strong)] pl-5 text-[15px]">
            <li><p className="font-medium">Beacon contacts you</p><p className="mt-1 text-[var(--color-muted)]">Using the method and time you chose.</p></li>
            <li><p className="font-medium">A private conversation</p><p className="mt-1 text-[var(--color-muted)]">The mediator explains the process and fees, and asks whether mediation is a good fit.</p></li>
            <li><p className="font-medium">You decide how to proceed</p><p className="mt-1 text-[var(--color-muted)]">No one receives a case invitation until you&rsquo;ve talked it through.</p></li>
          </ol>
          <SafetyLink className="mt-10" />
        </aside>
      </div>
    </PageShell>
  );
}
