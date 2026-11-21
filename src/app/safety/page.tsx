import { PageShell } from "@/components/public/PageShell";
import { SafetyForm } from "@/components/public/Forms";
import { QuickExit } from "@/components/navigator/Navigator";

export const metadata = { title: "Private safety options" };

export default function Safety() {
  return (
    <PageShell
      title="Private safety options"
      intro="If you feel afraid, pressured, or unsafe, you can talk with Beacon privately. Beacon will not contact, invite, or notify the other person."
      aside={<div className="flex lg:justify-end"><QuickExit /></div>}
    >
      <div className="container-b grid gap-16 py-16 sm:py-20 lg:grid-cols-12">
        <section className="lg:col-span-5" aria-labelledby="now">
          <h2 id="now" className="text-[24px] font-semibold tracking-[-0.02em]">If you need help now</h2>
          <ul className="mt-5 border-t border-[var(--color-hairline)] text-[16px]">
            <li className="border-b border-[var(--color-hairline)] py-5">
              <p className="font-semibold">In an emergency, call 911</p>
            </li>
            <li className="border-b border-[var(--color-hairline)] py-5">
              <p className="font-semibold">National Domestic Violence Hotline</p>
              <p className="mt-1 text-[var(--color-muted)]">Free, confidential, 24 hours a day.</p>
              <p className="mt-2">
                Call <a href="tel:18007997233" className="font-medium underline">1-800-799-7233</a> or text START to 88788.{" "}
                <a href="https://www.thehotline.org/" target="_blank" rel="noreferrer" className="underline">thehotline.org</a>
              </p>
            </li>
            <li className="border-b border-[var(--color-hairline)] py-5">
              <p className="font-semibold">Protective orders and legal help</p>
              <p className="mt-1 text-[var(--color-muted)]">
                California Courts Self-Help explains domestic violence restraining orders.{" "}
                <a href="https://selfhelp.courts.ca.gov/" target="_blank" rel="noreferrer" className="underline">selfhelp.courts.ca.gov</a>
              </p>
            </li>
          </ul>
          <p className="mt-6 text-[14px] text-[var(--color-muted)]">
            To cover your visit, use a private browsing window and clear your history. The &ldquo;Leave this site quickly&rdquo; button opens a weather site.
          </p>
        </section>
        <section className="lg:col-span-6 lg:col-start-7" aria-labelledby="private">
          <h2 id="private" className="text-[24px] font-semibold tracking-[-0.02em]">Ask a mediator to contact you privately</h2>
          <p className="mt-3 max-w-[52ch] text-[16px] text-[var(--color-muted)]">
            Only a Beacon mediator sees this request. The mediator will talk with you about whether and how mediation can work safely, including separate sessions, and you can stop at any time.
          </p>
          <div className="mt-8"><SafetyForm /></div>
        </section>
      </div>
    </PageShell>
  );
}
