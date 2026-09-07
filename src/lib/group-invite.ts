import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteGroup = {
  id: string;
  name: string;
  slug: string;
  reading_scope: string;
  plan_type: string;
  start_date: string | null;
};

const GROUP_FIELDS = "id, name, slug, reading_scope, plan_type, start_date";

function firstRow<T>(data: T | T[] | null): T | null {
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

async function findGroupWithAdmin(invite: string): Promise<InviteGroup | null | undefined> {
  const admin = createAdminClient();
  if (!admin) return undefined;

  const { data: bySlug, error: slugError } = await admin
    .from("groups")
    .select(GROUP_FIELDS)
    .eq("slug", invite)
    .maybeSingle();
  if (bySlug) return bySlug as InviteGroup;

  const { data: byCode, error: codeError } = await admin
    .from("groups")
    .select(GROUP_FIELDS)
    .eq("invite_code", invite)
    .maybeSingle();
  if (byCode) return byCode as InviteGroup;

  if (!slugError && !codeError) return null;
  return undefined;
}

async function findGroupWithRpc(invite: string): Promise<InviteGroup | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_group_by_invite", { invite });
  if (error) return null;
  const row = firstRow(data as InviteGroup | InviteGroup[] | null);
  return row?.id ? row : null;
}

export async function findGroupByInvite(invite: string): Promise<InviteGroup | null> {
  const fromAdmin = await findGroupWithAdmin(invite);
  if (fromAdmin !== undefined) return fromAdmin;
  return findGroupWithRpc(invite);
}

export async function addMemberByInvite(
  invite: string,
  userId: string
): Promise<{ group: { id: string; name: string; slug: string } | null; error: string | null }> {
  const found = await findGroupByInvite(invite);
  if (!found) return { group: null, error: "Group not found." };

  const admin = createAdminClient();
  if (admin) {
    const { error: insertError } = await admin.from("group_members").insert({
      group_id: found.id,
      user_id: userId,
      role: "member",
    });
    if (insertError && insertError.code !== "23505") {
      return { group: null, error: insertError.message };
    }
    return { group: { id: found.id, name: found.name, slug: found.slug }, error: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_group_by_invite", { invite });
  if (error) return { group: null, error: error.message };

  const group = firstRow(data as { id: string; name: string; slug: string }[] | null);
  if (!group?.id) return { group: null, error: "Could not join this group." };
  return { group, error: null };
}
