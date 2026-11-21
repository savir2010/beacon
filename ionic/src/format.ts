// Beacon works in California time.
const TZ = "America/Los_Angeles";
const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o });
type D = string | Date | null | undefined;

export const fmtDate = (d: D) => (d ? f({ month: "short", day: "numeric", year: "numeric" }).format(new Date(d)) : "");
export const fmtDay = (d: D) => (d ? f({ weekday: "long", month: "long", day: "numeric" }).format(new Date(d)) : "");
export const fmtTime = (d: D) => (d ? f({ hour: "numeric", minute: "2-digit" }).format(new Date(d)) : "");
export const fmtDateTime = (d: D) => (d ? `${fmtDate(d)}, ${fmtTime(d)}` : "");
export function fmtRelative(d: D) {
  if (!d) return "";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 172800) return "yesterday";
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return fmtDate(d);
}
export const fmtSize = (n: number) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`);
export const isoDay = (d: D) => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const firstName = (n: string) => n.split(" ")[0];
export const TOPIC_LABEL: Record<string, string> = { PARENTING: "Parenting", SUPPORT: "Support", PROPERTY: "Property", DOCUMENTS: "Documents", PROCESS: "Process", FINANCES: "Finances", HOME: "Home" };
