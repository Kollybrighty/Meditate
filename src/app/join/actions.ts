"use server";

import { addMemberByInvite } from "@/lib/group-invite";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type JoinGroupState = {
  error?: string;
};

export async function joinGroupByInvite(
  _prev: JoinGroupState,
  formData: FormData
): Promise<JoinGroupState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const invite = (formData.get("invite") as string | null)?.trim();
  if (!invite) return { error: "Invite is missing." };
  if (!user) redirect(`/login?next=/join/${encodeURIComponent(invite)}`);

  const { group, error } = await addMemberByInvite(invite, user.id);
  if (error) return { error };
  if (!group) return { error: "Group not found." };

  revalidatePath("/dashboard");
  revalidatePath(`/groups/${group.id}`);
  redirect(`/groups/${group.id}`);
}

export async function switchAccountForInvite(formData: FormData) {
  const invite = (formData.get("invite") as string | null)?.trim();
  const supabase = await createClient();
  await supabase.auth.signOut();
  if (!invite) redirect("/login");
  redirect(`/join/${encodeURIComponent(invite)}`);
}
