import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteChrome";
import { COST_OF_CONFLICT } from "@/content/tools";

export const metadata = { title: COST_OF_CONFLICT.title, description: COST_OF_CONFLICT.summary };

/**
 * The Cost of Conflict Worksheet, open to everyone (no sign-in). The worksheet is a self-contained
 * page in public/tools, framed here so its own styles stay separate from the site's. It fills the
 * window below the header and scrolls on its own, which keeps its summary panel pinned on desktop.
 */
export default function CostOfConflict() {
  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader />
      <div className="border-b border-[var(--color-hairline)] bg-[var(--color-raised)]">
        <div className="container-b flex h-11 items-center justify-between gap-4 text-[14px]">
          <Link href="/resources" className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
            <ArrowLeft size={15} aria-hidden /> Resource Center
          </Link>
          <span className="hidden text-[var(--color-muted)] sm:inline">Nothing you enter is saved or sent anywhere.</span>
        </div>
      </div>
      <main id="main" className="min-h-0 flex-1">
        <iframe src={COST_OF_CONFLICT.src} title={COST_OF_CONFLICT.title} allow="clipboard-write" className="block h-full w-full border-0" />
      </main>
    </div>
  );
}
