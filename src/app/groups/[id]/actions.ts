"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type UpdateStartDateState = {
  error?: string;
  success?: boolean;
};

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

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
