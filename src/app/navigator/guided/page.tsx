import { PageShell } from "@/components/public/PageShell";
import { GuidedPath } from "@/components/navigator/Guided";
import { TOPICS, type TopicKey } from "@/content/guided";

export const metadata = { title: "Preparation checklist" };

export default async function GuidedPage({ searchParams }: { searchParams: Promise<{ topics?: string }> }) {
  const sp = await searchParams;
  const initial = (sp.topics ?? "").split(",").filter((t): t is TopicKey => TOPICS.some((x) => x.key === t));
  return (
    <PageShell title="Build your preparation checklist" intro="Four quick questions. You'll get a checklist and a list of questions to discuss with a mediator, ready to download.">
      <div className="container-b py-16 sm:py-20">
        <div className="max-w-[760px]">
          <GuidedPath initialTopics={initial} />
        </div>
      </div>
    </PageShell>
  );
}
