import { emailNotice } from "@/lib/email/deliver";
import { isResendConfigured } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function notifyGroupMembers(options: {
  groupId: string;
  type: "forum_question" | "forum_reply";
  referenceId: string;
  actorId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("notify_group_members", {
    p_group_id: options.groupId,
    p_type: options.type,
    p_reference_id: options.referenceId,
  });

  let recipientIds: string[] = [];
  if (error) {
    const admin = createAdminClient();
    if (!admin) return;

    const { data: members } = await admin
      .from("group_members")
      .select("user_id")
      .eq("group_id", options.groupId);

    const rows = (members ?? [])
      .filter((row) => row.user_id !== options.actorId)
      .map((row) => ({
        user_id: row.user_id,
        group_id: options.groupId,
        type: options.type,
        reference_id: options.referenceId,
      }));

    if (rows.length === 0) return;
    const { error: insertError } = await admin.from("notifications").insert(rows);
    if (insertError) return;
    recipientIds = rows.map((row) => row.user_id);
  }

  if (!isResendConfigured()) return;
  if (recipientIds.length === 0) {
    const admin = createAdminClient();
    if (!admin) return;
    const { data: members } = await admin
      .from("group_members")
      .select("user_id")
      .eq("group_id", options.groupId);
    recipientIds = (members ?? []).map((row) => row.user_id);
  }

  await emailNotice({
    userIds: recipientIds,
    actorId: options.actorId,
    type: options.type,
    groupId: options.groupId,
    referenceId: options.referenceId,
  });
}
