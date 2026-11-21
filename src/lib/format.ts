const TZ = "America/Los_Angeles";

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" }).format(new Date(d)) : "";

export const fmtDay = (d: Date | string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(new Date(d));

export const fmtTime = (d: Date | string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(d));

export const fmtDateTime = (d: Date | string) => `${fmtDate(d)}, ${fmtTime(d)}`;

export function fmtRelative(d: Date | string, now = new Date()) {
  const diff = (now.getTime() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 86400 * 2) return "yesterday";
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} days ago`;
  return fmtDate(d);
}

export const fmtSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  RECEIVED: "Received",
  UNDER_REVIEW: "Under review",
  AVAILABLE: "Available",
};
