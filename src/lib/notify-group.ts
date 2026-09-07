import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  if (!error) return;

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
  await admin.from("notifications").insert(rows);
}
