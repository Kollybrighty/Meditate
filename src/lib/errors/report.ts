import { notificationEmailContent, sendEmail, isResendConfigured } from "@/lib/email/resend";
import { sanitizeErrorMessage } from "@/lib/errors/sanitize";

type AppErrorReport = {
  source: string;
  message: string;
  path?: string;
  digest?: string;
};

const recent = new Map<string, number>();
const DEDUPE_MS = 10 * 60 * 1000;

export function logAppError(report: AppErrorReport): void {
  const message = sanitizeErrorMessage(report.message);
  if (!message) return;
  const entry = {
    level: "error",
    app: "meditate",
    source: report.source.slice(0, 80),
    message,
    path: report.path?.slice(0, 200),
    digest: report.digest?.slice(0, 80),
    at: new Date().toISOString(),
  };
  console.error(JSON.stringify(entry));

  if (report.source === "email" || report.source === "error-alert") return;
  const key = `${entry.source}:${message}`;
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < DEDUPE_MS) return;
  recent.set(key, now);
  void alertOperator(entry).catch(() => {
    console.error(
      JSON.stringify({
        level: "error",
        app: "meditate",
        source: "error-alert",
        message: "Error alert email could not be sent",
        at: new Date().toISOString(),
      })
    );
  });
}

async function alertOperator(entry: {
  source: string;
  message: string;
  path?: string;
  digest?: string;
}): Promise<void> {
  if (!isResendConfigured()) return;
  const to =
    process.env.ERROR_ALERT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  if (!to) return;
  const preview = `${entry.source}: ${entry.message}${entry.path ? ` (${entry.path})` : ""}`;
  const content = notificationEmailContent({
    title: "Meditate error",
    preview,
    url: entry.path && entry.path.startsWith("http") ? entry.path : "https://vercel.com/dashboard",
  });
  const sent = await sendEmail({ to, ...content, subject: content.subject });
  if (!sent) {
    logAppError({ source: "error-alert", message: "Resend rejected an error alert" });
  }
}
