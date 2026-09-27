import { configuredSecret } from "@/lib/secrets";

export function isResendConfigured(): boolean {
  return configuredSecret(process.env.RESEND_API_KEY) !== null;
}

export function resendFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "Meditate <onboarding@resend.dev>";
}

export function passwordResetContent(link: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = "Reset your Meditate password";
  const text = [
    "Choose a new password for your Meditate account:",
    link,
    "",
    "If you did not ask for this, you can ignore this email. The link stops working after a short time.",
  ].join("\n");
  const safeLink = escapeHtml(link);
  const html = `<p>Choose a new password for your Meditate account.</p><p><a href="${safeLink}">Reset password</a></p><p>If you did not ask for this, you can ignore this email. The link stops working after a short time.</p>`;
  return { subject, text, html };
}

export function notificationEmailContent(options: {
  title: string;
  preview: string;
  url: string;
}): { subject: string; text: string; html: string } {
  const text = `${options.preview}\n\nOpen it in Meditate: ${options.url}`;
  const html = `<p>${escapeHtml(options.preview)}</p><p><a href="${escapeHtml(options.url)}">Open Meditate</a></p>`;
  return { subject: options.title, text, html };
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const key = configuredSecret(process.env.RESEND_API_KEY);
  if (!key) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromAddress(),
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });
  return response.ok;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
