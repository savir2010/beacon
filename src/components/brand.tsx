import Link from "next/link";

/* eslint-disable @next/next/no-img-element */
/** Beacon Mediation's emblem: the lighthouse, compass rose and waves from the official logo. */
export function Mark({ size = 30 }: { size?: number }) {
  return <img src="/brand/beacon-mark.png" alt="" width={Math.round(size * 0.961)} height={size} style={{ height: size, width: "auto" }} />;
}

/** The logo laid out for a header row: the emblem with the logo's own "BEACON Mediation Services" lettering beside it. */
export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-md" aria-label="Beacon Mediation home">
      <Mark size={48} />
      <img src="/brand/beacon-wordmark.png" alt="" width={177} height={46} style={{ height: 46, width: "auto" }} />
    </Link>
  );
}

export function DraftNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[13px] text-[var(--color-muted)] ${className}`}>
      Draft content, pending legal review. General information only, not legal advice.
    </p>
  );
}
