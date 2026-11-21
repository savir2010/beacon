import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { StillWater } from "@/components/StillWater";

/** Public page frame: a band of still water light behind the page title, then open sections. */
export function PageShell({ title, intro, children, aside }: { title: React.ReactNode; intro?: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="relative isolate">
      <div className="relative">
        <StillWater className="absolute inset-0 -z-10" />
        <SiteHeader />
        <div className="container-b pb-14 pt-16 sm:pb-20 sm:pt-24">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h1 className="display text-[42px] tracking-[-0.035em] sm:text-[60px]">{title}</h1>
              {intro && <div className="mt-5 max-w-[52ch] text-[18px] leading-relaxed text-[var(--color-ink)]/85">{intro}</div>}
            </div>
            {aside && <div className="lg:col-span-4">{aside}</div>}
          </div>
        </div>
      </div>
      <main id="main" className="border-t border-[var(--color-hairline)] bg-[var(--color-canvas)]">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
