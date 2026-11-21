import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { SafetyLink, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { StillWater } from "@/components/StillWater";
import { Prose } from "@/components/public/Prose";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await db.article.findUnique({ where: { slug: (await params).slug } });
  return { title: a?.title ?? "Article" };
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await db.article.findUnique({ where: { slug } });
  if (!a) notFound();
  const links: { label: string; url: string }[] = JSON.parse(a.officialLinks);
  const [related, others] = await Promise.all([
    db.qAEntry.findMany({ where: { articleSlug: slug }, take: 4 }),
    db.article.findMany({ where: { slug: { not: slug } }, take: 3 }),
  ]);
  const reviewed = a.reviewStatus === "REVIEWED" && a.reviewerName;

  return (
    <div className="relative isolate">
      <div className="relative">
        <StillWater className="absolute inset-0 -z-10" />
        <SiteHeader />
        <div className="container-b pb-14 pt-12 sm:pb-20 sm:pt-16">
          <Link href="/resources" className="inline-flex items-center gap-1.5 text-[14px] font-medium underline-offset-4 hover:underline">
            <ArrowLeft size={15} aria-hidden /> Resource Center
          </Link>
          <h1 className="display mt-8 max-w-[20ch] text-[40px] tracking-[-0.035em] sm:text-[60px]">{a.title}</h1>
          <p className="mt-6 max-w-[56ch] text-[19px] leading-relaxed text-[var(--color-ink)]/85">{a.summary}</p>
        </div>
      </div>
      <main id="main" className="border-t border-[var(--color-hairline)] bg-[var(--color-raised)]">
        <div className="container-b grid gap-16 py-16 sm:py-20 lg:grid-cols-12">
          <article className="measure lg:col-span-7">
            <Prose body={a.body} />
          </article>
          <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
            <dl className="border-t border-[var(--color-hairline-strong)] pt-5 text-[15px]">
              <dt className="text-[13px] text-[var(--color-muted)]">Review</dt>
              <dd className="mt-1">
                {reviewed ? (
                  <>Reviewed by {a.reviewerName} on {fmtDate(a.reviewedAt)}</>
                ) : (
                  <>Draft, pending legal review</>
                )}
              </dd>
              <dt className="mt-4 text-[13px] text-[var(--color-muted)]">Last updated</dt>
              <dd className="mt-1">{fmtDate(a.updatedAt)}</dd>
            </dl>
            <div className="border-t border-[var(--color-hairline-strong)] pt-5">
              <h2 className="text-[13px] text-[var(--color-muted)]">Official resources</h2>
              <ul className="mt-2 space-y-2">
                {links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[15px] font-medium underline">
                      {l.label} <ArrowUpRight size={14} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {related.length > 0 && (
              <div className="border-t border-[var(--color-hairline-strong)] pt-5">
                <h2 className="text-[13px] text-[var(--color-muted)]">Quick answers on this topic</h2>
                <ul className="mt-2 space-y-3">
                  {related.map((q) => (
                    <li key={q.id} className="text-[15px]">
                      <p className="font-medium">{q.question}</p>
                      <p className="mt-1 text-[var(--color-muted)]">{q.answer}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-[var(--radius-panel)] bg-[var(--color-raised-2)] p-6">
              <p className="text-[17px] font-semibold">Have a question this doesn&rsquo;t answer?</p>
              <p className="mt-2 text-[15px] text-[var(--color-muted)]">Ask the Navigator, or talk with a person at Beacon.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/navigator" className="btn btn-primary btn-sm">Ask the Navigator</Link>
                <Link href="/consultation" className="btn btn-outline btn-sm">Request a consultation</Link>
              </div>
            </div>
            <SafetyLink />
          </aside>
        </div>
        <div className="border-t border-[var(--color-hairline)]">
          <div className="container-b py-14">
            <h2 className="text-[15px] font-semibold">More from the Resource Center</h2>
            <ul className="mt-4 grid gap-x-10 sm:grid-cols-3">
              {others.map((o) => (
                <li key={o.slug} className="border-t border-[var(--color-hairline)]">
                  <Link href={`/resources/${o.slug}`} className="flex items-start justify-between gap-4 py-5 text-[17px] font-medium hover:text-[var(--color-accent)]">
                    {o.title} <ArrowRight size={16} className="mt-1 flex-none" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
