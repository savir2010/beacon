// Public base URL for links in emails and calendar files.
// BEACON_APP_URL wins; on Vercel it falls back to the production domain, then the deployment's own URL.
export function baseUrl() {
  if (process.env.BEACON_APP_URL) return process.env.BEACON_APP_URL.replace(/\/$/, "");
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}
