import { headers } from "next/headers";

/**
 * Public origin for invite links and QR codes.
 * Prefers the current request host so a local session does not share a
 * stale production URL (and the reverse).
 */
export async function appBaseUrl(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  const forwardedProto = h.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto =
    forwardedProto ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  const fallback =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    "http://localhost:3000";
  return fallback.replace(/\/$/, "");
}
