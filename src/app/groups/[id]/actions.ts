"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncDailyAssignments } from "@/lib/assignments";
import { canPerformMemberAction } from "@/lib/member-actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type UpdateStartDateState = {
  error?: string;
  success?: boolean;
};

function revalidateGroup(groupId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/read`);
  revalidatePath(`/groups/${groupId}/members`);
  revalidatePath(`/groups/${groupId}/forum`);
}

export async function updateGroupStartDate(
  _prev: UpdateStartDateState,
  formData: FormData
): Promise<UpdateStartDateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupId = formData.get("groupId") as string;
  const startDate = formData.get("startDate") as string;

  if (!groupId || !startDate) {
    return { error: "Start date is required." };
  }

  const { error } = await supabase
    .from("groups")
    .update({ start_date: startDate })
    .eq("id", groupId);

  if (error) return { error: error.message };

  const { data: group } = await supabase
    .from("groups")
    .select("id, reading_scope, plan_type, start_date")
    .eq("id", groupId)
    .single();

  if (group?.start_date) {
    const syncError = await syncDailyAssignments(supabase, {
      id: group.id,
      reading_scope: group.reading_scope,
      plan_type: group.plan_type,
      start_date: group.start_date,
    });
    if (syncError) return { error: syncError };
  }

  revalidateGroup(groupId);
  return { success: true };
}

export type ReadingProgressState = {
  error?: string;
};

export async function toggleReadingComplete(
  _prev: ReadingProgressState,
  formData: FormData
): Promise<ReadingProgressState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupId = formData.get("groupId") as string;
  const progressDate = formData.get("progressDate") as string;
  const completed = formData.get("completed") === "true";

  if (!groupId || !progressDate) {
    return { error: "Missing reading date." };
  }

  if (completed) {
    const { error } = await supabase
      .from("reading_progress")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("progress_date", progressDate);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("reading_progress").insert({
      user_id: user.id,
      group_id: groupId,
      progress_date: progressDate,
    });
    if (error && error.code !== "23505") return { error: error.message };
  }

  revalidateGroup(groupId);
  return {};
}

export type GroupManageState = {
  error?: string;
  success?: string;
};

async function requireGroupAdmin(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, created_by")
    .eq("id", groupId)
    .maybeSingle();

  if (!group) return { supabase, user, group: null as null, error: "Group not found." };

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin =
    group.created_by === user.id ||
    membership?.role === "owner" ||
    membership?.role === "admin";

  if (!isAdmin) {
    return { supabase, user, group: null, error: "Only a group admin can do that." };
  }

  return { supabase, user, group, error: null as string | null };
}

export async function renameGroup(
  _prev: GroupManageState,
  formData: FormData
): Promise<GroupManageState> {
  const groupId = formData.get("groupId") as string;
  const name = (formData.get("name") as string | null)?.trim();
  if (!groupId) return { error: "Group is missing." };
  if (!name) return { error: "Group name is required." };

  const { supabase, group, error } = await requireGroupAdmin(groupId);
  if (error || !group) return { error: error ?? "Group not found." };

  const { error: updateError } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId);

  if (updateError) {
    if (updateError.code === "23505") {
      return { error: "That group name is already taken." };
    }
    return { error: updateError.message };
  }

  revalidateGroup(groupId);
  return { success: "Group name updated." };
}

export async function deleteGroup(
  _prev: GroupManageState,
  formData: FormData
): Promise<GroupManageState> {
  const groupId = formData.get("groupId") as string;
  if (!groupId) return { error: "Group is missing." };

  const { supabase, group, error } = await requireGroupAdmin(groupId);
  if (error || !group) return { error: error ?? "Group not found." };

  const { data: removed, error: deleteError } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .select("id");

  if (!deleteError && removed && removed.length > 0) {
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc("delete_owned_group", {
    gid: groupId,
  });
  if (!rpcError && rpcResult === true) {
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  if (admin) {
    const { data: adminRemoved, error: adminError } = await admin
      .from("groups")
      .delete()
      .eq("id", groupId)
      .select("id");
    if (!adminError && adminRemoved && adminRemoved.length > 0) {
      revalidatePath("/dashboard");
      redirect("/dashboard");
    }
    if (adminError) return { error: adminError.message };
  }

  return {
    error:
      deleteError?.message ||
      rpcError?.message ||
      "Could not delete this group. Run the latest delete SQL in Supabase if this keeps happening.",
  };
}

export type MemberManageState = {
  error?: string;
  success?: string;
};

export async function updateGroupMember(
  _prev: MemberManageState,
  formData: FormData
): Promise<MemberManageState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupId = formData.get("groupId") as string;
  const targetUserId = formData.get("targetUserId") as string;
  const action = formData.get("action") as string;

  if (!groupId || !targetUserId) return { error: "Member is missing." };
  if (
    action !== "leave" &&
    action !== "kick" &&
    action !== "promote" &&
    action !== "demote"
  ) {
    return { error: "Unknown action." };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("id, created_by")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Group not found." };

  const { data: actorMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!actorMembership) return { error: "You are not in this group." };

  const { data: targetMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (!targetMembership) return { error: "That person is not in this group." };

  const actorIsAdmin =
    group.created_by === user.id ||
    actorMembership.role === "owner" ||
    actorMembership.role === "admin";

  const allowed = canPerformMemberAction({
    action,
    actorUserId: user.id,
    actorIsAdmin,
    groupCreatorId: group.created_by,
    targetUserId,
    targetRole: targetMembership.role,
  });
  if (!allowed.ok) return { error: allowed.error };

  if (action === "leave" || action === "kick") {
    const { error, data } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .select("user_id");
    if (error || !data?.length) {
      const admin = createAdminClient();
      if (!admin) {
        return { error: error?.message || "Could not update membership." };
      }
      const { error: adminError } = await admin
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", targetUserId);
      if (adminError) return { error: adminError.message };
    }
    revalidateGroup(groupId);
    if (action === "leave") redirect("/dashboard");
    return { success: action === "kick" ? "Member removed." : undefined };
  }

  const nextRole = action === "promote" ? "admin" : "member";
  const { error, data } = await supabase
    .from("group_members")
    .update({ role: nextRole })
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .select("user_id");
  if (error || !data?.length) {
    const admin = createAdminClient();
    if (!admin) {
      return { error: error?.message || "Could not update that role." };
    }
    const { error: adminError } = await admin
      .from("group_members")
      .update({ role: nextRole })
      .eq("group_id", groupId)
      .eq("user_id", targetUserId);
    if (adminError) return { error: adminError.message };
  }

  revalidateGroup(groupId);
  return {
    success: action === "promote" ? "Member is now an admin." : "Admin rights removed.",
  };
}
