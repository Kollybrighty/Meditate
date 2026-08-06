"use server";

import { createClient } from "@/lib/supabase/server";
import { generateInviteCode, slugify } from "@/lib/utils";
import { redirect } from "next/navigation";

const NT_ONLY_PLANS = ["3m", "6m"];

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const readingScope = formData.get("readingScope") as string;
  const planType = formData.get("planType") as string;

  if (readingScope === "new_testament" && !NT_ONLY_PLANS.includes(planType)) {
    throw new Error("New Testament only allows 3 or 6 month plans.");
  }

  const slug = `${slugify(name)}-${generateInviteCode().slice(0, 6)}`;
  const inviteCode = generateInviteCode();

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name,
      slug,
      reading_scope: readingScope,
      plan_type: planType,
      created_by: user.id,
      invite_code: inviteCode,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "owner",
  });

  redirect(`/groups/${group.id}`);
}
