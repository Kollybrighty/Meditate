import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-path";

export type GroupRecord = {
  id: string;
  name: string;
  slug: string;
  reading_scope: string;
  plan_type: string;
  start_date: string | null;
  created_by: string;
  invite_code: string;
  timezone: string | null;
};

export type GroupContext = {
  userId: string;
  group: GroupRecord;
  role: string;
  isAdmin: boolean;
};

export const getGroupContext = cache(async (groupId: string): Promise<GroupContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const pathname = (await headers()).get("x-pathname");
    const next = safeNextPath(pathname) ?? `/groups/${groupId}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const { data: group } = await supabase
    .from("groups")
    .select(
      "id, name, slug, reading_scope, plan_type, start_date, created_by, invite_code, timezone"
    )
    .eq("id", groupId)
    .maybeSingle();

  if (!group) notFound();

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  const isAdmin =
    group.created_by === user.id ||
    membership.role === "owner" ||
    membership.role === "admin";

  return {
    userId: user.id,
    group: group as GroupRecord,
    role: membership.role,
    isAdmin,
  };
});
