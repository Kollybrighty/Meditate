import { appBaseUrl } from "@/lib/app-url";
import {
  isResendConfigured,
  notificationEmailContent,
  sendEmail,
} from "@/lib/email/resend";
import { logAppError } from "@/lib/errors/report";
import { notificationCopy, notificationHref } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_RECIPIENTS = 20;

export async function emailNotice(options: {
  userIds: string[];
  actorId: string;
  type: string;
  groupId?: string | null;
  classroomId?: string | null;
  referenceId?: string | null;
}): Promise<void> {
  try {
    if (!isResendConfigured()) return;
    const admin = createAdminClient();
    if (!admin) return;

    const ids = [...new Set(options.userIds)]
      .filter((id) => id && id !== options.actorId)
      .slice(0, MAX_RECIPIENTS);
    if (ids.length === 0) return;

    const { data: profiles } = await admin
      .from("profiles")
      .select("email")
      .in("id", ids);
    const emails = (profiles ?? [])
      .map((row) => (typeof row.email === "string" ? row.email.trim() : ""))
      .filter((email) => email.includes("@"));
    if (emails.length === 0) return;

    const copy = notificationCopy(options.type);
    const path = notificationHref({
      type: options.type,
      groupId: options.groupId ?? null,
      classroomId: options.classroomId,
      referenceId: options.referenceId ?? null,
    });
    const base = await resolveBaseUrl();
    const url = base ? `${base}${path}` : path;
    const content = notificationEmailContent({
      title: copy.title,
      preview: copy.preview,
      url,
    });

    await Promise.all(
      emails.map(async (to) => {
        const sent = await sendEmail({ to, ...content });
        if (!sent) {
          logAppError({
            source: "email",
            message: "Notification email was not accepted",
            path,
          });
        }
      })
    );
  } catch (error) {
    logAppError({
      source: "email",
      message: error instanceof Error ? error.message : "Notification email failed",
    });
  }
}

async function resolveBaseUrl(): Promise<string> {
  try {
    return await appBaseUrl();
  } catch {
    return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  }
}
